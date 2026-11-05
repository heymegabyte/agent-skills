#!/usr/bin/env bash
# YubiKey Universal Cross-Platform Setup Script
# Configures FIDO2 resident SSH keys, Git commit signing, Linux udev rules, and SSH agent forwarding.

set -euo pipefail

echo "========================================================"
echo "  YubiKey Universal Setup (macOS / Linux / WSL)"
echo "========================================================"

OS_TYPE="$(uname -s)"
SSH_DIR="$HOME/.ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# 1. Linux udev rules setup
if [ "$OS_TYPE" = "Linux" ]; then
  echo "[1/4] Checking Linux udev rules for YubiKey..."
  if [ -d "/etc/udev/rules.d" ]; then
    if [ ! -f "/etc/udev/rules.d/70-u2f.rules" ]; then
      echo "  -> Downloading Yubico 70-u2f.rules (requires sudo)..."
      sudo curl -sSL https://raw.githubusercontent.com/Yubico/libfido2/main/udev/70-u2f.rules -o /etc/udev/rules.d/70-u2f.rules
      sudo udevadm control --reload-rules || true
      sudo udevadm trigger || true
      echo "  ✓ udev rules installed and reloaded."
    else
      echo "  ✓ udev rules already present in /etc/udev/rules.d/70-u2f.rules."
    fi
  fi
else
  echo "[1/4] macOS / BSD detected (no udev rules required)."
fi

# 2. Extract Resident / Discoverable SSH Keys from YubiKey
echo "[2/4] Extracting FIDO2 resident keys from plugged-in YubiKey..."
echo "  -> Please touch your YubiKey if it begins flashing..."

cd "$SSH_DIR"
if ssh-keygen -K 2>/dev/null; then
  echo "  ✓ Successfully extracted resident SSH key(s) into $SSH_DIR."
else
  echo "  ℹ No resident keys found, or device not yet provisioned as resident."
  echo "    To create a resident key on this YubiKey, run:"
  echo "    ssh-keygen -t ed25519-sk -O resident -O verify-required -C \"$(whoami)@$(hostname)\""
fi

# 3. Configure Git to use SSH Signing (Replaces brittle GPG)
echo "[3/4] Configuring Git for SSH-based commit signing..."
PUB_KEY="$(find "$SSH_DIR" -name "*sk*.pub" | head -n 1 || true)"

if [ -n "$PUB_KEY" ] && [ -f "$PUB_KEY" ]; then
  git config --global gpg.format ssh
  git config --global user.signingkey "$PUB_KEY"
  git config --global commit.gpgsign true

  # Set up allowed signers file for local verification
  ALLOWED_SIGNERS="$SSH_DIR/allowed_signers"
  touch "$ALLOWED_SIGNERS"
  USER_EMAIL="$(git config --get user.email || echo "user@example.com")"
  if ! grep -q "$PUB_KEY" "$ALLOWED_SIGNERS" 2>/dev/null; then
    echo "$USER_EMAIL $(cat "$PUB_KEY")" >> "$ALLOWED_SIGNERS"
  fi
  git config --global gpg.ssh.allowedSignersFile "$ALLOWED_SIGNERS"

  echo "  ✓ Git configured to sign commits using $PUB_KEY"
  echo "  ✓ Allowed signers mapped in $ALLOWED_SIGNERS"
else
  echo "  ℹ No .pub security key found yet. Complete step 2 to enable auto-signing."
fi

# 4. Configure SSH Agent Forwarding
echo "[4/4] Configuring SSH client configuration for seamless agent forwarding..."
CONFIG_FILE="$SSH_DIR/config"
touch "$CONFIG_FILE"
chmod 600 "$CONFIG_FILE"

if ! grep -q "AddKeysToAgent" "$CONFIG_FILE"; then
  cat << 'EOF' >> "$CONFIG_FILE"

# YubiKey Universal SSH & Agent Forwarding Configuration
Host *
  AddKeysToAgent yes
  IdentitiesOnly yes
  ForwardAgent yes
EOF
  echo "  ✓ Added AddKeysToAgent and ForwardAgent to $CONFIG_FILE."
else
  echo "  ✓ SSH config already configured."
fi

echo ""
echo "========================================================"
echo "  YubiKey Universal Setup Complete!"
echo "========================================================"
echo "Next Steps:"
echo "1. Add your public key to GitHub/GitLab: cat ~/.ssh/id_ed25519_sk.pub"
echo "2. Add your public key to remote servers: ssh-copy-id -i ~/.ssh/id_ed25519_sk.pub user@server"
echo "3. Run 'ssh -A user@server' to use your local YubiKey on remote hosts!"
echo "========================================================"
