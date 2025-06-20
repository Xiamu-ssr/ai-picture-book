import base64, io
from PIL import Image


def b64_to_pil(data: str) -> Image.Image:
    img = Image.open(io.BytesIO(base64.b64decode(data)))
    return img.convert("RGB") if img.mode != "RGB" else img


def pil_to_b64(img: Image.Image, fmt="PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode()
