import torch
import base64
import io
import logging
from diffusers import StableDiffusionXLControlNetPipeline, ControlNetModel
from transformers import DPTForDepthEstimation, DPTImageProcessor
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from PIL import Image

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- 1. Model Loading ----------
def load_model():
    try:
        logger.info("开始加载模型...")
        
        # 加载深度估计模型
        logger.info("加载深度估计模型...")
        depth_estimator = DPTForDepthEstimation.from_pretrained("Intel/dpt-large")
        feature_extractor = DPTImageProcessor.from_pretrained("Intel/dpt-large")

        # 确定是否有CUDA可用
        use_cuda = torch.cuda.is_available()
        # 根据是否有CUDA决定精度类型
        torch_dtype = torch.float16 if use_cuda else torch.float32
        
        # 加载ControlNet和SD模型
        logger.info(f"加载ControlNet和基础扩散模型，使用{'CUDA' if use_cuda else 'CPU'}，精度类型: {torch_dtype}...")
        controlnet_id = "diffusers/controlnet-depth-sdxl-1.0"
        # 也可用社区模型： "thibaud/controlnet_depth-sdxl-1.0"

        pipe = StableDiffusionXLControlNetPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            controlnet=ControlNetModel.from_pretrained(controlnet_id, torch_dtype=torch_dtype),
            torch_dtype=torch_dtype,
        )

        if use_cuda:
            logger.info("检测到CUDA，正在将模型加载到GPU...")
            pipe = pipe.to("cuda")
            depth_estimator = depth_estimator.to("cuda")
        else:
            # Fall back to CPU if GPU is not available
            logger.warning("未检测到CUDA，将模型加载到CPU（会很慢）...")
            pipe = pipe.to("cpu")
            depth_estimator = depth_estimator.to("cpu")
            print("WARNING: Running on CPU, which will be slow. GPU is recommended.")

        logger.info("加载IP-Adapter...")
        pipe.load_ip_adapter(
            "h94/IP-Adapter", subfolder="sdxl_models",
            weight_name=[
                "ip-adapter-plus-face_sdxl_vit-l.safetensors",
                "ip-adapter-plus_sdxl_vit-l.safetensors"
            ]
        )
        logger.info("模型加载完成!")
        
        return {
            "pipe": pipe,
            "depth_estimator": depth_estimator,
            "feature_extractor": feature_extractor,
            "use_cuda": use_cuda
        }
    except Exception as e:
        logger.error(f"模型加载失败: {str(e)}")
        raise e

# 生成深度图
def generate_depth_map(image, depth_estimator, feature_extractor, use_cuda=False):
    try:
        # 准备输入
        inputs = feature_extractor(images=image, return_tensors="pt")
        
        # 移动到GPU（如果可用）
        if use_cuda:
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
            
        # 进行推理
        with torch.no_grad():
            outputs = depth_estimator(**inputs)
            predicted_depth = outputs.predicted_depth
            
        # 后处理深度图
        prediction = torch.nn.functional.interpolate(
            predicted_depth.unsqueeze(1),
            size=(384, 384),
            mode="bicubic",
            align_corners=False,
        )
        
        # 标准化深度图并转换为PIL图像
        depth_map = prediction.squeeze().cpu().numpy()
        depth_min = depth_map.min()
        depth_max = depth_map.max()
        normalized_depth = (depth_map - depth_min) / (depth_max - depth_min)
        depth_image = Image.fromarray((normalized_depth * 255).astype(np.uint8))
        
        return depth_image
    except Exception as e:
        logger.exception(f"生成深度图失败: {str(e)}")
        raise e

# ---------- 2. API ----------
app = FastAPI(title="AI Picture Book Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class GenerateRequest(BaseModel):
    prev_frame: str          # base64 encoded image
    characters: List[str]    # list of base64 encoded character images
    prompt: str              # text prompt describing the scene
    seed: Optional[int] = None

class GenerateResponse(BaseModel):
    img: str                 # base64 encoded output image

def b64_to_img(b64_string):
    """Convert base64 string to PIL Image"""
    try:
        # 直接使用PIL解码base64数据
        img_bytes = base64.b64decode(b64_string)
        img = Image.open(io.BytesIO(img_bytes))
        
        # 确保图像是RGB模式，如果是RGBA则转换
        if img.mode == 'RGBA':
            img = img.convert('RGB')
            
        return img
    except Exception as e:
        logger.error(f"解码base64图像失败: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

# 截断提示词到合理长度
def truncate_prompt(prompt, max_length=75):  # 缩短最大长度以避免CLIP截断警告
    if len(prompt) > max_length:
        logger.warning(f"提示词过长({len(prompt)}字符)，截断到{max_length}字符")
        return prompt[:max_length]
    return prompt

# Global variable to store the models
models = None

@app.on_event("startup")
async def startup_event():
    global models
    logger.info("启动服务，加载模型...")
    models = load_model()
    logger.info("服务准备就绪!")

@app.get("/health")
async def health_check():
    """简单的健康检查接口，验证服务是否运行"""
    return {"status": "ok", "model_loaded": models is not None}

@app.get("/test-cors")
async def test_cors():
    """测试CORS配置是否正确"""
    return {"cors": "ok"}

@app.post("/generate", response_model=GenerateResponse)
async def generate_image(req: GenerateRequest):
    """Generate a new frame based on previous frame, character images and text prompt"""
    global models
    if models is None:
        logger.error("模型未加载")
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        # 截断提示词
        prompt = truncate_prompt(req.prompt)
        logger.info(f"收到生成请求: prompt='{prompt[:30]}...'")
        logger.info(f"前一帧base64长度: {len(req.prev_frame)}")
        logger.info(f"角色数量: {len(req.characters)}")
        
        # 获取模型
        pipe = models["pipe"]
        depth_estimator = models["depth_estimator"]
        feature_extractor = models["feature_extractor"]
        use_cuda = models["use_cuda"]
        
        # 加载前一帧图像
        prev_frame_img = b64_to_img(req.prev_frame)
        
        # 生成深度图
        logger.info("生成深度图...")
        depth = generate_depth_map(prev_frame_img, depth_estimator, feature_extractor, use_cuda)
        
        # 准备角色图像和风格图像（前一帧）
        logger.info("准备角色图像和风格图像...")
        character_imgs = [b64_to_img(c) for c in req.characters]
        style_img = [prev_frame_img]  # 注意：作为列表传递
        
        # 使用正确的嵌套列表结构，对应两个IP-Adapters
        # 第一个IP-Adapter (face) 接收所有角色图片
        # 第二个IP-Adapter (style) 接收前一帧图片
        ip_adapter_images = [character_imgs, style_img]
        
        # 设置权重：为每个IP-Adapter设置对应权重
        num_chars = len(character_imgs)
        
        # 根据角色数量动态调整权重
        # 如果只有一个角色，使用0.7权重
        # 如果有多个角色，每个角色具有相同权重，但总权重保持为0.7
        if num_chars == 1:
            face_weights = [0.7]
        else:
            face_weights = [0.7/num_chars] * num_chars
            
        # 设置权重结构与图像结构对应
        ip_adapter_weights = [face_weights, 0.4]
        
        logger.info(f"IP-Adapter结构: 角色={len(character_imgs)}张, 风格=1张")
        logger.info(f"IP-Adapter权重: 角色={face_weights}, 风格=0.4")
        
        # 生成新图像
        seed_value = req.seed if req.seed is not None else torch.randint(0, 2147483647, (1,)).item()
        logger.info(f"使用种子: {seed_value}，开始生成...")
        
        output = pipe(
            prompt=prompt,
            ip_adapter_image=ip_adapter_images,  # 嵌套列表: [[角色图片...], [风格图片...]]
            ip_adapter_scale=ip_adapter_weights,  # 嵌套结构权重: [[角色权重...], 风格权重]
            image=depth,                          # ControlNet深度图
            generator=torch.Generator().manual_seed(int(seed_value)),
            num_inference_steps=25
        ).images[0]
        
        # 转换为base64
        logger.info("转换结果为base64...")
        buffer = io.BytesIO()
        output.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        logger.info(f"生成成功，base64长度: {len(img_str)}")
        return {"img": img_str}
    
    except Exception as e:
        logger.exception(f"生成过程中出错: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error generating image: {str(e)}"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 