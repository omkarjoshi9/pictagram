#!/bin/bash

# This script is used to build the application for Vercel deployment

echo "Starting build process for Vercel deployment..."

# Build the client
echo "Building client..."
npm run build

# Copy Vercel package.json to server directory for dependencies
echo "Setting up server for Vercel..."
cp server/vercel.package.json server/package.json

echo "Build completed successfully!"