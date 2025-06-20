import axios, { AxiosResponse } from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8000',  // 后端API地址
  timeout: 60 * 60 * 1000, // 3600000 ms
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API请求:', {
      url: config.url,
      method: config.method,
      // 不打印图像数据以避免控制台溢出
      data: config.data ? '请求数据（图像数据已省略）' : null
    });
    return config;
  },
  (error) => {
    console.error('API请求配置错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API响应成功:', {
      status: response.status,
      // 不打印图像数据以避免控制台溢出
      data: response.data ? '响应数据（图像数据已省略）' : null
    });
    return response.data;
  },
  (error) => {
    console.error('API请求错误:', error);
    
    // 提取详细错误信息
    if (error.response) {
      // 服务器返回了错误状态码
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('未收到响应，请求信息:', error.request);
    }
    
    return Promise.reject(error);
  }
);

// 图像生成API
export interface GenerateImageRequest {
  prev_frame: string;  // base64编码的前一帧图像
  characters: string[];  // base64编码的角色图像数组
  prompt: string;  // 描述场景的文本
  seed?: number;  // 随机种子（可选）
}

export interface GenerateImageResponse {
  img: string;  // base64编码的生成图像
}

export const generateImage = async (data: GenerateImageRequest) => {
  try {
    const response = await api.post<any, GenerateImageResponse>('/generate', data);
    return response;
  } catch (error) {
    console.error('生成图像请求失败:', error);
    throw error;
  }
};

export default api; 