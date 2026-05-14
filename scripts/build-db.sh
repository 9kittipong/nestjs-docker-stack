#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-my-nest-api-db}"
TAG="${TAG:-latest}"

docker build \
  -t "${IMAGE_NAME}:${TAG}" \
  -f docker/db/Dockerfile \
  docker/db

echo "Built ${IMAGE_NAME}:${TAG}"
