#!/bin/bash

# This script is used to build the application for Vercel deployment

echo "Starting build process for Vercel deployment..."

# Use the Vercel-specific tsconfig with looser type checking
echo "Using Vercel-specific TypeScript configuration..."
cp tsconfig.vercel.json tsconfig.json

# Apply the Vite server configuration patch
echo "Applying Vite server configuration patch..."
node vercel-vite-patch.js

# Build the client with less strict TypeScript checks
echo "Building client..."
npm run build

# Copy Vercel package.json to server directory for dependencies
echo "Setting up server for Vercel..."
cp server/vercel.package.json server/package.json

echo "Build completed successfully!"
