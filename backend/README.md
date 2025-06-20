# README.md

> **AI Picture Book Backend**
> 基于 FastAPI + Diffusers 的多条件绘本生成服务
> 支持 **原始场景图 + 多角色形象图 + 可选草稿线稿 + 文本提示** ➜ 生成下一幕连贯插画

---

## 目录

1. [功能简介](#功能简介)
2. [项目结构](#项目结构)
3. [快速开始（Conda 环境）](#快速开始conda-环境)
4. [接口文档](#接口文档)
5. [常见问题](#常见问题)

---

## 功能简介

| 模块                      | 作用                                     |
| ----------------------- | -------------------------------------- |
| **Stable Diffusion XL** | 文本→图像基座，生成高分辨率画面                       |
| **IP-Adapter-FaceID**   | 保证角色面部&服饰一致                            |
| **IP-Adapter (Style)**  | 继承上一幕的整体风格 / 光影                        |
| **ControlNet (Depth)**  | 让镜头透视、布局与上一幕保持连贯；后续可替换为 Pose / Lineart |

> 一次推理即可满足 “风格不跳、人物不变、姿势可控”。

---

## 项目结构

```
backend/
├─ app/
│  ├─ main.py            # FastAPI 入口
│  ├─ schemas.py         # Pydantic 请求 / 响应
│  ├─ model_loader.py    # SDXL + Adapter + ControlNet
│  ├─ pipeline_utils.py  # 前处理 / 深度图 / 输入组装
│  └─ image_utils.py     # base64 ↔ PIL
├─ requirements.txt
└─ README.md             # 当前文件
```

---

## 快速开始（Conda 环境）

### 1. 准备 Conda

```bash
conda create -n aipb python=3.11
conda activate aipb
```

> * 若使用 **CUDA**：请提前安装匹配版本的 `pytorch` 与 `cudnn`
> * Apple Silicon 可直接走 `torch==2.x` + `mps`，不需要 CUDA

### 2. 安装依赖

```bash
# 后端目录
cd backend
pip install -r requirements.txt
```

> 首次运行会自动从 Hugging Face 拉取 SDXL / ControlNet / IP-Adapter 权重
> 全量下载 ≈ 7 GB，请确保磁盘与网络可用。

### 3. 启动服务

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

* 成功日志示例

  ```
  🪄 载入 SDXL-base
  🎨 载入 Style Adapter
  😀 载入 FaceID Adapter
  ✅ 模型加载完毕
  Application startup complete.
  ```

---

## 接口文档

### POST `/generate`

| 字段           | 类型         | 必填 | 说明               |
| ------------ | ---------- | -- | ---------------- |
| `prev_frame` | base64 字符串 | ✔  | 上一幕完整场景 PNG/JPEG |
| `characters` | base64 数组  | ✔  | N 张角色头像或半身像      |
| `prompt`     | 字符串        | ✔  | 场景描述、动作、镜头语言     |
| `sketch`     | base64 字符串 | ✖  | 线稿 / 姿势草图（可选）    |
| `seed`       | 整数         | ✖  | 随机种子（复现用）        |

#### 示例 (cURL)

```bash
curl -X POST http://localhost:8000/generate \
     -H "Content-Type: application/json" \
     -d '{
           "prev_frame":    "<base64-1>",
           "characters":    ["<face-1>", "<face-2>"],
           "prompt":        "黄昏的天桥，城市拖影，两位主角迎着逆光牵手",
           "sketch":        null,
           "seed":          12345
         }'
```

成功响应（示例）

```json5
{
  "img": "<base64-output>"
}
```

> **输出**为 PNG 格式的 base64，可直接前端 `<img src="data:image/png;base64, ...">` 渲染。

---

## 常见问题

| 问题                | 解决方案                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **显存不足 / CPU 很慢** | 先将 `requirements.txt` 中 `torch` 替换为 CPU 版，或在代码中启用 `pipe.enable_model_cpu_offload()`；Mac M1/2 建议加 `pipe.enable_attention_slicing()` |
| **下载速度慢**         | `huggingface-cli login` → 设置镜像源（如清华镜像），或提前手动下载模型放入 `~/.cache/huggingface`                                                          |
| **角色融合 / 脸型漂移**   | 传入更干净的 224×224 头像；必要时配合 `ip_adapter_masks` 仅作用于面部区域                                                                                |
| **想换姿势控制**        | 将 `pipeline_utils.make_depth()` 替换为 OpenPose / Lineart 处理；ControlNet 权重需对应更换                                                       |

---

> 欢迎 Issue & PR 改进，祝创作愉快！
