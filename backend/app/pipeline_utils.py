import torch, logging
from PIL import Image
from diffusers import ControlNetModel
from transformers import DPTForDepthEstimation, DPTImageProcessor
from insightface.app import FaceAnalysis
import cv2, torch, numpy as np
from .model_loader import GlobalModels

logger = logging.getLogger(__name__)

# ---- depth model（CPU 也能跑）
_depth_est = DPTForDepthEstimation.from_pretrained("Intel/dpt-large")
_depth_proc = DPTImageProcessor.from_pretrained("Intel/dpt-large")


def make_depth(img: Image.Image, device="cpu") -> Image.Image:
    inputs = _depth_proc(images=img, return_tensors="pt").to(device)
    with torch.no_grad():
        pred = _depth_est(**inputs).predicted_depth
    pred = torch.nn.functional.interpolate(
        pred.unsqueeze(1), size=img.size[::-1], mode="bicubic", align_corners=False)
    arr = pred.squeeze().cpu().numpy()
    arr = (arr - arr.min()) / (arr.max() - arr.min())
    return Image.fromarray((arr * 255).astype("uint8"))

_face_app = None
def _extract_id_embeds(face_pils, device):
    global _face_app
    if _face_app is None:
        _face_app = FaceAnalysis(name="buffalo_l",
                                 providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
        _face_app.prepare(ctx_id=0 if torch.cuda.is_available() else -1)

    embeds = []
    for pil in face_pils:
        img_bgr = cv2.cvtColor(np.asarray(pil), cv2.COLOR_RGB2BGR)
        face = _face_app.get(img_bgr)[0]          # 简单处理：默认取第一张脸
        embeds.append(torch.tensor(face.normed_embedding, dtype=torch.float32))
    embeds = torch.stack(embeds)                 # [N,512]
    neg     = torch.zeros_like(embeds)           # 空向量作 negative
    id_embs = torch.stack([neg, embeds])         # [2,N,512]   (CFG 两份)
    return id_embs.to(device)

def _encode_style_embed(img: Image.Image, device):
    fe = GlobalModels.pipe.feature_extractor            # CLIPImageProcessor
    ie = GlobalModels.pipe.image_encoder                # ViT-L/14
    with torch.no_grad():
        pixel = fe(images=img, return_tensors="pt").pixel_values.to(device)
        emb   = ie(pixel).image_embeds                  # [1,768]
    neg = torch.zeros_like(emb)                         # [1,768]
    return torch.stack([neg, emb])                      # [2,1,768]


def build_inputs(prev_img, char_imgs, prompt, sketch=None):
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # 1) 仅需 512-d id embeds
    style_embeds = _encode_style_embed(prev_img, device)           # [2,1,768]
    id_embeds    = _extract_id_embeds(char_imgs, device)           # [2,N,512]

    # 2) Style / FaceID 对齐
    ip_images  = [ [prev_img], char_imgs ]
    ip_scales  = [ [0.4]    , [0.5] * len(char_imgs) ]
    ip_embeds  = [ None     , id_embeds ]

    # 3) ControlNet
    ctrl_img = make_depth(prev_img, device)

    return dict(
        prompt                  = prompt,
        ip_adapter_image        = None,            # ❌  不再传图片
        ip_adapter_scale        = [1.0, 1.0],            #   scale 用 embeds 时自动失效
        ip_adapter_image_embeds = [style_embeds, id_embeds],
        control_image           = make_depth(prev_img, device),
    )
