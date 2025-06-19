/**
 * 将File对象转换为base64字符串
 */
export const fileToBase64 = (file: File | Blob | undefined): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('文件为空'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // 移除data URL前缀，只保留base64部分
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('转换结果不是字符串'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * 将base64字符串转换为Blob对象
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * 将base64字符串转换为对象URL，用于显示图片
 */
export const base64ToObjectURL = (base64: string, mimeType: string = 'image/png'): string => {
  const blob = base64ToBlob(base64, mimeType);
  return URL.createObjectURL(blob);
};

/**
 * 检查图片文件大小和类型
 */
export const validateImageFile = (file: File, maxSizeMB: number = 5): boolean => {
  const isImage = file.type.startsWith('image/');
  const isValidSize = file.size / 1024 / 1024 < maxSizeMB;
  
  if (!isImage) {
    console.error('文件不是图片类型');
    return false;
  }
  
  if (!isValidSize) {
    console.error(`图片大小超过${maxSizeMB}MB限制`);
    return false;
  }
  
  return true;
}; 