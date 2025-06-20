import logging, torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import GenerateRequest, GenerateResponse
from .image_utils import b64_to_pil, pil_to_b64
from .model_loader import GlobalModels, load_models
from .pipeline_utils import build_inputs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aipb")

app = FastAPI(title="AI Picture Book Backend")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

@app.on_event("startup")
async def _load():
    load_models(dtype=torch.float16 if torch.cuda.is_available() else torch.float32)
    logger.info("✅ 模型加载完毕")


@app.post("/generate", response_model=GenerateResponse)
async def generate_image(req: GenerateRequest):
    if GlobalModels.pipe is None:
        raise HTTPException(500, "model not loaded")

    # --- decode inputs ---
    prev_img  = b64_to_pil(req.prev_frame)
    char_imgs = [b64_to_pil(b) for b in req.characters]
    sketch    = b64_to_pil(req.sketch) if req.sketch else None

    inputs = build_inputs(prev_img, char_imgs, req.prompt, sketch)

    # --- 调试信息 ---
    try:
        logger.info(
            "Prompt: %s", inputs["prompt"])
        scene_size = getattr(prev_img, "size", None)
        logger.info(
            "Scene image count: %d, size: %s", 1, scene_size)
        char_sizes = [getattr(img, "size", None) for img in char_imgs]
        logger.info(
            "Character image count: %d, sizes: %s", len(char_imgs), char_sizes)
        logger.info(
            "IP-Adapter scale: %s", inputs.get("ip_adapter_scale"))
        ctrl_img = inputs.get("control_image")
        if ctrl_img is not None:
            logger.info("Control image size: %s", getattr(ctrl_img, "size", None))
    except Exception as e:
        logger.warning("Failed to log debug info: %s", e)

    seed = req.seed if req.seed is not None else torch.randint(0, 2**31-1, ()).item()
    gen  = torch.Generator().manual_seed(seed)

    result = GlobalModels.pipe(
        prompt=inputs["prompt"],
        # ip_adapter_image=inputs["ip_adapter_image"],
        # ip_adapter_scale=inputs["ip_adapter_scale"],
        ip_adapter_image_embeds=inputs["ip_adapter_image_embeds"],
        image=inputs["control_image"],
        num_inference_steps=25,
        generator=gen,
        use_different_ip_adapter_for_each_image=True,
    ).images[0]

    # --- 保存到本地 result 目录 ---
    try:
        from pathlib import Path
        from datetime import datetime

        # backend/app/main.py -> backend/result
        base_dir = Path(__file__).resolve().parent.parent / "result"
        base_dir.mkdir(parents=True, exist_ok=True)

        ts_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_path = base_dir / f"{ts_str}.png"
        result.save(save_path)
        logger.info("🖼 生成图片已保存到 %s", save_path)
    except Exception as e:
        logger.warning("无法保存生成图片: %s", e)

    return GenerateResponse(img=pil_to_b64(result))
