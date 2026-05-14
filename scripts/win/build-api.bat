@echo off
setlocal

if "%IMAGE_NAME%"=="" set IMAGE_NAME=my-nest-api
if "%TAG%"=="" set TAG=latest

docker build -t "%IMAGE_NAME%:%TAG%" -f docker/api/Dockerfile .

echo Built %IMAGE_NAME%:%TAG%
