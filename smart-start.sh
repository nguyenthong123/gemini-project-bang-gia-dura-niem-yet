#!/bin/bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
pgrep ollama || (ollama serve > /sdcard/AI-Developer/ollama.log 2>&1 &)

echo '🚀 Dang khoi dong He thong AI (Che do tu dong)...'
echo 'Uu tien: DeepSeek (Cloud)'

# Use GUI without forced port to avoid version errors
aider --model deepseek/deepseek-chat --gui
