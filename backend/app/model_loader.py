import torch, logging
from diffusers import StableDiffusionXLControlNetPipeline, ControlNetModel
from transformers import CLIPVisionModelWithProjection

logger = logging.getLogger(__name__)


class GlobalModels:
    """单例缓存，FastAPI 启动时加载一次"""
    pipe: StableDiffusionXLControlNetPipeline | None = None


def load_models(dtype=torch.float16):
    """
    1. SDXL base (vit-L)
    2. ControlNet Depth (可 later 替换为 pose/lineart)
    3. IP-Adapter Style  (vit-L)
    4. IP-Adapter FaceID (vit-L)
    """
    logger.info("🪄 载入 SDXL-base")
    pipe = StableDiffusionXLControlNetPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        controlnet=ControlNetModel.from_pretrained(
            "diffusers/controlnet-depth-sdxl-1.0", torch_dtype=dtype),
        torch_dtype=dtype,
    )

    logger.info("🎭 载入 Style & FaceID 两个 IP-Adapter")
    pipe.load_ip_adapter(
        # ① 每个 adapter 的仓库 / 本地路径
        pretrained_model_name_or_path_or_dict=[
            "h94/IP-Adapter",          # style
            "h94/IP-Adapter-FaceID",   # faceid
        ],
        # ② 各自子文件夹（与上面一一对应）
        subfolder=["sdxl_models", ""],
        # ③ 各自的权重文件
        weight_name=[
            "ip-adapter_sdxl.bin",
            "ip-adapter-faceid_sdxl.bin",  # ViT-L
        ],
        # 如果显存紧张可加：low_cpu_mem_usage=True
    )

    # pipe.enable_attention_slicing()
    pipe.to("cuda" if torch.cuda.is_available() else "cpu")

    GlobalModels.pipe = pipe
