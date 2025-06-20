from pydantic import BaseModel
from typing import List, Optional


class GenerateRequest(BaseModel):
    prev_frame: str                 # base64 PNG/JPEG
    characters: List[str]           # 多张角色图 base64
    prompt: str                     # 文本提示
    sketch: Optional[str] = None    # 可选草稿 base64
    seed: Optional[int] = None      # 随机种子


class GenerateResponse(BaseModel):
    img: str                        # 输出图 base64
