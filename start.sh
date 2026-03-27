#!/bin/bash

echo "Starting OpenClaw Insight..."
echo ""

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

echo "Starting development server..."
echo "Access URL: http://localhost:3000"
echo ""

pnpm dev
