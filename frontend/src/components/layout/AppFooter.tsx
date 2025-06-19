import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const AppFooter: React.FC = () => {
  return (
    <Footer className="app-footer">
      AI绘本生成系统 ©{new Date().getFullYear()} Created with React, Ant Design and AI
    </Footer>
  );
};

export default AppFooter; 