#!/bin/bash
set -e

SERVICE_NAME="dockdock-server"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
INSTALL_PATH="/usr/local/bin/dockdock-server"
DATA_DIR="/var/lib/dockdock-server"

# Stop and disable service
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  echo "Stopping service..."
  systemctl stop "$SERVICE_NAME"
fi

if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
  echo "Disabling service..."
  systemctl disable "$SERVICE_NAME"
fi

# Remove service file
if [ -f "$SERVICE_FILE" ]; then
  echo "Removing service file..."
  rm -f "$SERVICE_FILE"
  systemctl daemon-reload
fi

# Remove binary
if [ -f "$INSTALL_PATH" ]; then
  echo "Removing binary..."
  rm -f "$INSTALL_PATH"
fi

# Remove data directory
if [ -d "$DATA_DIR" ]; then
  echo "Removing data directory..."
  rm -rf "$DATA_DIR"
fi

echo ""
echo "Uninstallation complete!"
