import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { BookOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const location = useLocation();
  
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/create',
      icon: <BookOutlined />,
      label: <Link to="/create">创建绘本</Link>,
    },
    {
      key: '/test',
      icon: <BugOutlined />,
      label: <Link to="/test">测试后端</Link>,
    },
  ];
  
  return (
    <Header className="app-header">
      <div className="logo" style={{ float: 'left', marginRight: '20px' }}>
        <h2 style={{ margin: 0, color: '#1890ff' }}>AI绘本</h2>
      </div>
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{ lineHeight: '64px' }}
      />
    </Header>
  );
};

export default AppHeader; 