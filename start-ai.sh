#!/bin/bash

# Fix Network for Clasp
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

# Start Ollama server if not running
pgrep ollama || (ollama serve > ollama.log 2>&1 &)

# Warm up Llama
ollama run llama3.2 "Hi" > /dev/null 2>&1

# Start Aider GUI
aider --model deepseek/deepseek-chat --gui --port 8502 --browser
