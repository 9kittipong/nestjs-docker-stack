@echo off
setlocal

if "%IMAGE_NAME%"=="" set IMAGE_NAME=my-nest-api-db
if "%TAG%"=="" set TAG=latest

docker build -t "%IMAGE_NAME%:%TAG%" -f docker/db/Dockerfile docker/db

echo Built %IMAGE_NAME%:%TAG%
