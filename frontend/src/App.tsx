import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import './App.css';

// 页面组件
import Home from './pages/Home';
import Create from './pages/Create';
import BackendTest from './pages/BackendTest';
import NotFound from './pages/NotFound';

// 布局组件
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';

const { Content } = Layout;

function App() {
  return (
    <ConfigProvider>
      <Router>
        <Layout className="app-container">
          <AppHeader />
          <Content className="app-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<Create />} />
              <Route path="/test" element={<BackendTest />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Content>
          <AppFooter />
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
