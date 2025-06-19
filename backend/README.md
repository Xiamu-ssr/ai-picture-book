# AI Picture Book - Backend

This is the backend service for AI Picture Book, leveraging Stable Diffusion XL with Multi IP-Adapter to generate continuous story frames based on previous frames and character images.

## 技术架构

本项目基于以下技术栈构建：

- **Stable Diffusion XL**: 基础大型图像生成模型
- **ControlNet**: 使用深度图控制生成的图像结构，保证场景空间连贯性
- **IP-Adapter**: 多IP-Adapter技术，确保人物形象一致性
  - 人脸适配器 (权重 0.7): 确保角色面部特征一致
  - 风格适配器 (权重 0.4): 保持整体绘画风格一致
- **FastAPI**: 提供高性能RESTful API接口

生成流程：
1. 从上一帧获取深度信息
2. 结合人物形象图片、文本描述和深度图
3. 生成新的连续场景帧

## 目录结构

```
backend/
├── app/
│   ├── __init__.py         # Python包标识文件
│   └── main.py             # 主应用逻辑，包含模型加载和API定义
├── requirements.txt        # Python依赖包列表
├── run.py                  # 启动服务器的入口脚本
├── setup.sh                # 环境创建与设置脚本
├── install_dependencies.sh # 依赖安装脚本
├── test_model_loading.py   # 模型加载测试脚本
└── README.md               # 使用说明文档
```

## 环境配置

1. **创建并激活conda环境：**

```bash
# 创建环境
conda create -n aipb-py311 python=3.11 -y
# 激活环境
conda activate aipb-py311
```

2. **安装依赖：**

```bash
pip install -r requirements.txt
```

3. **运行API服务器：**

```bash
python run.py
```

服务启动后将可通过 `http://localhost:8000` 访问。

## API使用说明

### 生成图像

**接口：** `POST /generate`

**请求体：**
```json
{
  "prev_frame": "base64编码的前一帧图像",
  "characters": ["base64编码的角色图像1", "base64编码的角色图像2"],
  "prompt": "描述场景、角色位置和动作的文本",
  "seed": 42  // 可选，用于结果复现
}
```

**响应：**
```json
{
  "img": "base64编码的输出图像"
}
```

### 使用示例

#### Python客户端

```python
import requests
import base64

# 加载图像文件并转换为base64
def image_to_base64(image_path):
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

# 准备请求数据
payload = {
    "prev_frame": image_to_base64("previous_scene.png"),
    "characters": [
        image_to_base64("character1.png"),
        image_to_base64("character2.png")
    ],
    "prompt": "两个角色在花园中交谈，左边是角色1，右边是角色2",
    "seed": 42
}

# 发送请求
response = requests.post("http://localhost:8000/generate", json=payload)
result = response.json()

# 保存生成的图像
if "img" in result:
    img_data = base64.b64decode(result["img"])
    with open("generated_scene.png", "wb") as f:
        f.write(img_data)
```

## 性能考量

- **GPU需求**：该模型需要至少8GB GPU内存，推荐使用16GB或以上
- **首次加载时间**：模型首次加载需要约30-60秒
- **生成时间**：每张图像生成需要约5-10秒（取决于GPU性能）
- **内存占用**：大约需要10-12GB系统内存

## 故障排除

常见问题：

1. **CUDA错误**：
   - 检查GPU驱动是否正确安装
   - 确保系统有足够的GPU内存

2. **模型下载失败**：
   - 检查网络连接
   - 可以预先下载模型到`~/.cache/huggingface/`目录

3. **生成图像质量问题**：
   - 尝试调整提示词的详细度
   - 确保输入的参考图像质量足够高

## 系统要求

- CUDA兼容GPU（强烈推荐）
- Python 3.11
- 至少16GB系统内存
- requirements.txt中列出的依赖包 