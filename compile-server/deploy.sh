#!/bin/bash

set -e

CONTAINER_NAME="compiler-fastapi"
IMAGE_NAME="emscripten-fastapi"
PORT="8080"

echo "==> Checking for running container '${CONTAINER_NAME}'..."
sudo docker ps -a

if [ "$(sudo docker ps -aq -f name=^/${CONTAINER_NAME}$)" ]; then
	echo "==> Stopping container '${CONTAINER_NAME}'..."
	sudo docker stop "${CONTAINER_NAME}" || true

	echo "==> Removing container '${CONTAINER_NAME}'..."
	sudo docker rm "${CONTAINER_NAME}" || true
fi

echo "==> Building Docker image '${IMAGE_NAME}'..."
sudo docker build -t "${IMAGE_NAME}" .

echo "==> Starting new container '${CONTAINER_NAME}'..."
sudo docker run -d \
	-p "${PORT}:${PORT}" \
	--name "${CONTAINER_NAME}" \
	--restart unless-stopped \
	"${IMAGE_NAME}"

echo "==> Deployment complete! Current running containers:"
sudo docker ps