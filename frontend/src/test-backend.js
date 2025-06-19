// 用于测试后端连接的简单脚本
// 提供函数在组件中使用，或在浏览器控制台中运行

// 测试健康检查
export async function testHealthCheck() {
  try {
    console.log('测试后端健康检查接口...');
    const response = await fetch('http://localhost:8000/health');
    const data = await response.json();
    console.log('健康检查结果:', data);
    return data;
  } catch (error) {
    console.error('健康检查失败:', error);
    throw error;
  }
}

// 测试CORS
export async function testCORS() {
  try {
    console.log('测试CORS配置...');
    const response = await fetch('http://localhost:8000/test-cors', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    const data = await response.json();
    console.log('CORS测试结果:', data);
    return data;
  } catch (error) {
    console.error('CORS测试失败:', error);
    throw error;
  }
}

// 在浏览器中运行测试
export async function runTests() {
  const health = await testHealthCheck();
  const cors = await testCORS();
  
  console.log('----------------------------------------');
  console.log('测试结果摘要:');
  console.log('后端服务:', health ? '在线' : '离线或出错');
  console.log('模型加载:', health?.model_loaded ? '已加载' : '未加载');
  console.log('CORS配置:', cors ? '正常' : '存在问题');
  console.log('----------------------------------------');
  
  return { health, cors };
}

// 如果在浏览器控制台中运行这个文件
if (typeof window !== 'undefined' && window.runBackendTests) {
  console.log('开始测试后端连接...');
  runTests();
} 