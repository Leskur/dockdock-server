# DockDock Server

DockDock Server 是 DockDock Agent 的镜像下载服务，部署在能正常访问 Docker Hub 的服务器上。

接收 Agent 的下载请求后，自动拉取镜像并打包成 tar.gz 供 Agent 下载，内置缓存机制避免重复拉取。

## 特性

- 自动拉取 Docker Hub 镜像并打包导出
- 缓存已下载镜像，减少重复请求
- 代理 Docker Hub 搜索和标签查询
- 一键安装，自动注册为系统服务

## 环境要求

- Linux x64 / arm64
- 已安装 Docker，且 `docker` 命令在 PATH 中可用
- 能正常访问 Docker Hub

## 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/Leskur/dockdock-server/main/install.sh | bash
```

安装完成后自动注册为 systemd 服务并启动。

> 如果无法直接访问 GitHub，可通过代理安装：`curl -fsSL https://raw.githubusercontent.com/Leskur/dockdock-server/main/install.sh | https_proxy=http://127.0.0.1:7890 bash`

## 离线安装

如果服务器无法下载 GitHub Release 资源，可通过其他设备下载压缩包上传到服务器，再用脚本安装：

```bash
# 上传压缩包后，远程拉取脚本并传入本地压缩包路径
curl -fsSL https://raw.githubusercontent.com/Leskur/dockdock-server/main/install.sh | bash -s -- dockdock-server-linux-x64.tar.gz
```

## 卸载

```bash
curl -fsSL https://raw.githubusercontent.com/Leskur/dockdock-server/main/uninstall.sh | bash
```

## 服务管理

```bash
systemctl status dockdock-server    # 查看状态
systemctl restart dockdock-server   # 重启
systemctl stop dockdock-server      # 停止
journalctl -u dockdock-server -f    # 查看日志
```

镜像缓存存储在 `/var/lib/dockdock-server/storage/`。
