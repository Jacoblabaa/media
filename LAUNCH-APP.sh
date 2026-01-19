#!/bin/bash
# Artist's 3D Toolkit - Simple Launcher
# Opens the app in your default browser with a local server

PORT=3000

echo "=========================================="
echo "  ARTIST'S 3D TOOLKIT"
echo "=========================================="
echo ""
echo "Starting local server on port $PORT..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    cd dist
    echo "Server running at: http://localhost:$PORT"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "=========================================="
    echo ""
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    cd dist
    echo "Server running at: http://localhost:$PORT"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "=========================================="
    echo ""
    python -m SimpleHTTPServer $PORT
else
    echo "ERROR: Python not found!"
    echo "Please install Python or open dist/index.html in a browser"
    exit 1
fi
