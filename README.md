# DockDock Server

Default image download service for DockDock Agent.

## Requirements

- Node.js 18+
- Docker installed and available in PATH

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Server listens on `http://0.0.0.0:3000` by default.

## API

### Request image download

```bash
POST /api/v1/images/download
{
  "image": "nginx",
  "tag": "1.25"
}
```

Response:

```json
{
  "id": "uuid",
  "status": "pending"
}
```

### Check status

```bash
GET /api/v1/images/download/:id/status
```

### Download file

```bash
GET /api/v1/images/download/:id/file
```
