import React, { useState } from 'react';
import { Typography, Card, Button, Alert, Space, Divider, Input, Collapse } from 'antd';
import { testHealthCheck, testCORS } from '../test-backend';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

const BackendTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [corsStatus, setCorsStatus] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sampleRequest, setSampleRequest] = useState<string>(JSON.stringify({
    prev_frame: "base64_encoded_image_data_here",
    characters: ["base64_encoded_image_data_here"],
    prompt: "Sample prompt text",
    seed: 42
  }, null, 2));
  const [requestResult, setRequestResult] = useState<any>(null);
  
  // 测试健康检查接口
  const handleTestHealth = async () => {
    setLoading(true);
    setTestError(null);
    try {
      const result = await testHealthCheck();
      setHealthStatus(result);
    } catch (error: any) {
      setTestError(`健康检查错误: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试CORS配置
  const handleTestCORS = async () => {
    setLoading(true);
    setTestError(null);
    try {
      const result = await testCORS();
      setCorsStatus(result);
    } catch (error: any) {
      setTestError(`CORS测试错误: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 发送测试请求
  const handleSendRequest = async () => {
    setLoading(true);
    setRequestResult(null);
    setTestError(null);
    
    try {
      let requestData;
      try {
        requestData = JSON.parse(sampleRequest);
      } catch (e) {
        setTestError('JSON解析错误，请检查请求格式');
        setLoading(false);
        return;
      }
      
      const response = await axios.post('http://localhost:8000/generate', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setRequestResult({
        status: response.status,
        statusText: response.statusText,
        data: '响应数据包含图像，不在此显示'
      });
    } catch (error: any) {
      console.error('请求错误:', error);
      setTestError(`API请求错误: ${error.response?.data?.detail || error.message || '未知错误'}`);
      
      if (error.response) {
        setRequestResult({
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backend-test-container">
      <Typography>
        <Title level={2}>后端服务测试</Title>
        <Paragraph>
          使用此页面测试后端服务是否正常运行，并诊断可能的连接问题
        </Paragraph>
      </Typography>
      
      {testError && (
        <Alert
          message="测试错误"
          description={testError}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Card title="基础连接测试" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Button 
              type="primary" 
              onClick={handleTestHealth} 
              loading={loading}
              style={{ marginRight: 16 }}
            >
              测试健康检查接口
            </Button>
            
            {healthStatus && (
              <Alert
                message="健康检查结果"
                description={
                  <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
                }
                type="success"
                showIcon
              />
            )}
          </div>
          
          <Divider />
          
          <div>
            <Button
              type="primary"
              onClick={handleTestCORS}
              loading={loading}
              style={{ marginRight: 16 }}
            >
              测试CORS配置
            </Button>
            
            {corsStatus && (
              <Alert
                message="CORS测试结果"
                description={
                  <pre>{JSON.stringify(corsStatus, null, 2)}</pre>
                }
                type="success"
                showIcon
              />
            )}
          </div>
        </Space>
      </Card>
      
      <Card title="API请求测试">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            这里仅用于高级测试。注意：如果请求包含真实的图像数据，可能会造成浏览器卡顿，建议使用短的示例数据。
          </Paragraph>
          
          <TextArea
            rows={10}
            value={sampleRequest}
            onChange={(e) => setSampleRequest(e.target.value)}
            placeholder="输入JSON请求体"
          />
          
          <Button
            type="primary"
            onClick={handleSendRequest}
            loading={loading}
          >
            发送测试请求
          </Button>
          
          {requestResult && (
            <Collapse defaultActiveKey={['1']}>
              <Panel header="请求结果" key="1">
                <pre>{JSON.stringify(requestResult, null, 2)}</pre>
              </Panel>
            </Collapse>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default BackendTest; 