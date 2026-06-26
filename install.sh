#!/bin/bash
set -e

REPO="Leskur/dockdock-server"
INSTALL_DIR="/usr/local/bin"
SERVICE_NAME="dockdock-server"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
DATA_DIR="/var/lib/dockdock-server"

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)  ASSET_ARCH="x64" ;;
  aarch64) ASSET_ARCH="arm64" ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

# Get latest release tag
echo "Fetching latest release..."
LATEST_TAG=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep -o '"tag_name": *"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$LATEST_TAG" ]; then
  echo "Failed to fetch latest release tag"
  exit 1
fi

echo "Latest version: ${LATEST_TAG}"

ASSET_NAME="dockdock-server-linux-${ASSET_ARCH}.tar.gz"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/${ASSET_NAME}"

# Download
TMP_DIR=$(mktemp -d)
echo "Downloading from: ${DOWNLOAD_URL}"
curl -fSL "$DOWNLOAD_URL" -o "${TMP_DIR}/${ASSET_NAME}"

# Extract
echo "Extracting..."
tar -xzf "${TMP_DIR}/${ASSET_NAME}" -C "$TMP_DIR"

# Install binary
echo "Installing to ${INSTALL_DIR}/"
install -m 755 "${TMP_DIR}/dockdock-server" "${INSTALL_DIR}/dockdock-server"

# Clean up
rm -rf "$TMP_DIR"

# Create data directory
mkdir -p "$DATA_DIR"

# Create systemd service
echo "Creating systemd service..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=DockDock Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=${DATA_DIR}
ExecStart=${INSTALL_DIR}/dockdock-server
Restart=on-failure
RestartSec=5
Environment=PORT=3456
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo ""
echo "Installation complete!"
echo "  Service:  systemctl status ${SERVICE_NAME}"
echo "  Logs:     journalctl -u ${SERVICE_NAME} -f"
echo "  API:      http://localhost:3456"
