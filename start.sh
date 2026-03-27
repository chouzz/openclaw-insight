#!/bin/bash

echo "启动 OpenClaw 日志分析器..."
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    pnpm install
fi

echo "启动开发服务器..."
echo "访问地址: http://localhost:3000"
echo ""

pnpm dev
