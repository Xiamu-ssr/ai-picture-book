# AI绘本 - 前端

这是AI绘本生成系统的前端项目，使用React和Ant Design构建。

## 技术栈

- React 18
- TypeScript
- Ant Design
- React Router
- Axios

## 目录结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── assets/             # 图片等资源
│   ├── components/         # 共用组件
│   │   └── layout/         # 布局组件
│   ├── pages/              # 页面组件
│   ├── services/           # API服务
│   ├── utils/              # 工具函数
│   ├── App.tsx             # 应用入口
│   ├── App.css             # 应用样式
│   └── index.tsx           # React入口
└── package.json            # 依赖配置
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

应用将在 [http://localhost:3000](http://localhost:3000) 运行。

### 构建生产版本

```bash
npm run build
```

## 使用说明

1. 首页提供基本介绍和引导
2. 点击"创建绘本"进入核心功能页面
3. 上传角色形象图片和前一场景图片
4. 输入场景描述文本
5. 点击生成按钮，获取AI生成的新场景

## API集成

前端通过`services/api.ts`中定义的函数与后端API通信：

- `generateImage`: 发送角色图片、前一帧和文字描述，获取生成的新场景

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
