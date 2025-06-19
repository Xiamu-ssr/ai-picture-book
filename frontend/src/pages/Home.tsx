import React from 'react';
import { Typography, Card, Row, Col } from 'antd';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <Typography>
        <Title level={1}>AI绘本生成</Title>
        <Paragraph>
          欢迎使用AI绘本生成工具，这里可以根据角色形象和场景描述生成连续故事场景。
        </Paragraph>
      </Typography>
      
      <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
        <Col xs={24} sm={12}>
          <Card title="如何使用" bordered={false}>
            <p>1. 上传角色形象图片</p>
            <p>2. 上传前一场景图片</p>
            <p>3. 输入场景描述文本</p>
            <p>4. 点击生成按钮</p>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title="功能特点" bordered={false}>
            <p>✓ 角色形象一致性</p>
            <p>✓ 场景空间连贯性</p>
            <p>✓ 自然过渡的故事场景</p>
            <p>✓ 高质量图像生成</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home; 