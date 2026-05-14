#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-my-nest-api}"
TAG="${TAG:-latest}"

docker build \
  -t "${IMAGE_NAME}:${TAG}" \
  -f docker/api/Dockerfile \
  .

echo "Built ${IMAGE_NAME}:${TAG}"
