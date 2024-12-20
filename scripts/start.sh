#!/bin/bash

echo "Starting the NestJS application with PM2..."
pm2 start ../ecosystem.config.js
echo "Application started successfully!"
