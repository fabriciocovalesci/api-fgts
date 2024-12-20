#!/bin/bash


echo "Restarting the NestJS application..."
pm2 restart nestjs-app
echo "Application restarted successfully!"
