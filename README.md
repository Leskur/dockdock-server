# DockDock Server

DockDock Agent 的默认镜像下载服务。

## 环境要求

- Node.js 18+
- 已安装 Docker，且 `docker` 命令在 PATH 中可用

## 安装

```bash
npm install
cp .env.example .env
```

按需编辑 `.env`，调整监听端口和地址。

## 运行

```bash
npm run dev
```

Server 默认监听 `http://0.0.0.0:3456`。

## API

### 请求下载镜像

```bash
POST /api/v1/images/download
{
  "image": "nginx",
  "tag": "1.25"
}
```

响应：

```json
{
  "id": "uuid",
  "status": "pending"
}
```

### 查看下载状态

```bash
GET /api/v1/images/download/:id/status
```

### 下载文件

```bash
GET /api/v1/images/download/:id/file
```

### 搜索 Docker Hub 镜像

```bash
GET /api/v1/images/search?q=nginx
```

### 列出 Docker Hub 镜像标签

```bash
GET /api/v1/images/tags/library/nginx
```
