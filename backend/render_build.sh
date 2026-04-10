#!/usr/bin/env bash
set -o errexit

echo "Installing Python dependencies..."
pip install -U pip setuptools wheel
pip install -r requirements.txt

echo "Checking for ffmpeg..."
if [ ! -f "ffmpeg_bin/ffmpeg" ]; then
  echo "Downloading ffmpeg static binary..."
  mkdir -p ffmpeg_bin
  curl -sSL https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar -xJ -C ffmpeg_bin --strip-components=1
  echo "ffmpeg installed successfully."
else
  echo "ffmpeg already installed."
fi
