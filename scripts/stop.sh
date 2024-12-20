#!/bin/bash

echo "Stopping the NestJS application..."
pm2 stop nestjs-app
echo "Application stopped successfully!"
