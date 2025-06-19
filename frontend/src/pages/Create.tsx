import React, { useState } from 'react';
import {
  Typography,
  Card,
  Upload,
  Button,
  Input,
  Space,
  Row,
  Col,
  Image,
  Divider,
  InputNumber,
  message,
  Spin
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  RocketOutlined
} from '@ant-design/icons';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { fileToBase64 } from '../utils/imageUtils';
import { generateImage, GenerateImageRequest } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Create: React.FC = () => {
  // 状态管理
  const [prevFrameFile, setPrevFrameFile] = useState<UploadFile | null>(null);
  const [characterFiles, setCharacterFiles] = useState<UploadFile[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [seed, setSeed] = useState<number | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // 用于预览上传的图片
  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = URL.createObjectURL(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  // 上一帧图片上传
  const prevFrameProps: UploadProps = {
    onRemove: () => {
      setPrevFrameFile(null);
    },
    beforeUpload: (file) => {
      setPrevFrameFile({
        ...file,
        originFileObj: file
      } as UploadFile);
      return false;
    },
    maxCount: 1,
    fileList: prevFrameFile ? [prevFrameFile] : [],
    listType: 'picture-card',
    onPreview: handlePreview,
  };

  // 角色图片上传
  const characterProps: UploadProps = {
    onRemove: (file) => {
      const index = characterFiles.indexOf(file);
      const newFileList = characterFiles.slice();
      newFileList.splice(index, 1);
      setCharacterFiles(newFileList);
    },
    beforeUpload: (file) => {
      setCharacterFiles([...characterFiles, {
        ...file,
        originFileObj: file
      } as UploadFile]);
      return false;
    },
    fileList: characterFiles,
    listType: 'picture-card',
    multiple: true,
    onPreview: handlePreview,
  };

  // 生成图像
  const handleGenerate = async () => {
    // 验证输入
    if (!prevFrameFile) {
      message.error('请上传前一场景图片');
      return;
    }

    if (characterFiles.length === 0) {
      message.error('请至少上传一个角色图片');
      return;
    }

    if (!prompt || prompt.trim() === '') {
      message.error('请输入场景描述');
      return;
    }

    try {
      setGenerating(true);
      setResultImage(null);

      // 将文件转换为base64
      const prevFrameBlob = prevFrameFile.originFileObj;
      if (!prevFrameBlob) {
        throw new Error('前一场景图片文件无效');
      }

      const prevFrameBase64 = await fileToBase64(prevFrameBlob);
      
      // 检查每个角色文件并转换
      const characterBase64List = await Promise.all(
        characterFiles.map(async (file, index) => {
          const blob = file.originFileObj;
          if (!blob) {
            throw new Error(`角色图片 ${index+1} 文件无效`);
          }
          return fileToBase64(blob);
        })
      );

      // 准备请求数据
      const requestData: GenerateImageRequest = {
        prev_frame: prevFrameBase64,
        characters: characterBase64List,
        prompt: prompt,
      };

      // 如果有种子值，添加到请求中
      if (seed !== null) {
        requestData.seed = seed;
      }

      // 调用API
      const response = await generateImage(requestData);
      
      // 显示结果
      if (response && response.img) {
        setResultImage(response.img);
        message.success('场景生成成功');
      } else {
        message.error('生成失败，请重试');
      }
    } catch (error) {
      console.error('生成图像时出错:', error);
      message.error('生成失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setGenerating(false);
    }
  };

  // 清除结果
  const handleClear = () => {
    setPrevFrameFile(null);
    setCharacterFiles([]);
    setPrompt('');
    setSeed(null);
    setResultImage(null);
  };

  // 随机种子
  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    setSeed(randomSeed);
  };

  return (
    <div className="create-container">
      <Typography>
        <Title level={2}>创建新绘本场景</Title>
        <Text>上传角色图片、前一场景，描述新场景并生成连续故事画面</Text>
      </Typography>

      <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="输入" bordered={false}>
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>1. 上传前一场景图片</Title>
              <Upload {...prevFrameProps}>
                {!prevFrameFile && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>上传图片</div>
                  </div>
                )}
              </Upload>
              <Text type="secondary">这是连续故事的前一个场景</Text>
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Title level={5}>2. 上传角色图片 (可多张)</Title>
              <Upload {...characterProps}>
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传角色</div>
                </div>
              </Upload>
              <Text type="secondary">这些角色将出现在新场景中</Text>
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Title level={5}>3. 描述新场景</Title>
              <TextArea
                rows={4}
                placeholder="描述角色位置、动作和场景，例如：小明站在左侧的树下，小红在右侧的长椅上坐着，两人正在交谈。"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <Text type="secondary">详细的描述有助于生成更准确的场景</Text>
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Title level={5}>4. 随机种子 (可选)</Title>
              <Space>
                <InputNumber
                  value={seed}
                  onChange={(value) => setSeed(value)}
                  placeholder="输入数字"
                  style={{ width: 150 }}
                />
                <Button onClick={generateRandomSeed}>随机种子</Button>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">相同的种子可以生成相似的结果</Text>
              </div>
            </div>

            <Divider />

            <Space>
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleGenerate}
                loading={generating}
                disabled={!prevFrameFile || characterFiles.length === 0 || !prompt}
              >
                生成场景
              </Button>
              <Button icon={<DeleteOutlined />} onClick={handleClear}>
                清除
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="生成结果" bordered={false}>
            <div
              style={{
                height: 400,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: 4,
              }}
            >
              {generating ? (
                <Spin tip="正在生成场景..." size="large" />
              ) : resultImage ? (
                <Image
                  src={`data:image/png;base64,${resultImage}`}
                  alt="生成的场景"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              ) : (
                <Text type="secondary">生成的场景将显示在这里</Text>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图片预览模态框 */}
      <Image
        width={200}
        style={{ display: 'none' }}
        preview={{
          visible: previewOpen,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewOpen(visible),
          title: previewTitle,
        }}
      />
    </div>
  );
};

export default Create; 