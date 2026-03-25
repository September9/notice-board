# 通知公告展示系统

基于 GitHub Pages + 腾讯文档的通知展示系统，航班/登机牌风格。

## 📁 文件说明

```
notice-board/
├── index.html        # 主页面
├── style.css         # 样式（航班风格）
├── app.js           # 逻辑（轮播/刷新）
├── notices.json     # 通知数据（同步自腾讯文档）
├── sync_tdoc.ps1   # 腾讯文档同步脚本
├── github_sync.js   # GitHub 自动更新脚本
└── README.md        # 说明文档
```

## 🔄 工作流程

```
老师们 → 腾讯文档表格填通知
              ↓
        同步脚本获取数据
              ↓
        更新 notices.json
              ↓
        GitHub Pages 自动部署
              ↓
        展示屏浏览器刷新显示
```

## 🚀 部署步骤

### 1. GitHub 仓库设置

1. 登录 GitHub：https://github.com
2. 创建新仓库：`notice-board`
3. 上传所有文件到仓库
4. Settings → Pages → Source: main 分支

### 2. 安装 mcporter（用于同步腾讯文档）

```bash
npm install -g mcporter
```

### 3. 配置腾讯文档 Token

```bash
mcporter config add tencent-docs 'https://docs.qq.com/openapi/mcp' \
  --header 'Authorization=Bearer YOUR_TOKEN' \
  --transport http
```

Token 获取：https://docs.qq.com/scenario/open-claw.html

### 4. 同步腾讯文档数据

```bash
# 方法1：手动同步
powershell -File sync_tdoc.ps1

# 方法2：自动定时同步（Windows 任务计划程序）
# 设置每天早上8点自动运行 sync_tdoc.ps1
```

## 📱 华为 Pad 测试

1. 浏览器打开：https://September9.github.io/notice-board/
2. 添加到主屏幕（全屏显示）
3. 自动刷新，每30秒获取最新数据

## 🔧 数据格式

腾讯文档表格格式：

| 发布时间 | 标题 | 内容 | 渠道 | 截止时间 |
|----------|------|------|------|----------|
| 2026/3/23 | 网络安全培训 | 请各部门于4月15日前完成培训 | oa群 | 2026/4/15 |

支持的渠道标识：
- 🔔 oa群
- 💬 微信群
- 📧 邮件
- 📨 点对点
- 📱 短信

## ⚙️ 配置说明

### 刷新频率（app.js）

```javascript
const CONFIG = {
    refreshInterval: 30000,  // 30秒刷新一次
    pageSize: 5,            // 默认每页显示条数
    slideInterval: 10000     // 10秒自动翻页
};
```

## 🎨 功能特点

- ✈️ 航班/登机牌风格界面
- 🌈 每条通知不同颜色
- ⏰ 临近截止日期提醒（脉冲动画）
- 📱 竖屏自适应
- 🔄 自动翻页轮播
