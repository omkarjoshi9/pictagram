#!/bin/bash

# Script to prepare your project for Vercel deployment
echo "🚀 Preparing PICTagram for Vercel deployment..."

# Check if vercel-build.sh is executable
if [ ! -x "vercel-build.sh" ]; then
  echo "📝 Making vercel-build.sh executable..."
  chmod +x vercel-build.sh
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "📝 Creating .env file from example..."
  cp .env.example .env
  echo "⚠️ Make sure to update the values in .env file!"
else
  echo "✅ .env file already exists"
fi

# Check if the required files exist
echo "🔍 Checking for required Vercel deployment files..."

REQUIRED_FILES=("vercel.json" "vercel-build.sh" "server/vercel.ts" "server/vercel.package.json")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  echo "✅ All required Vercel deployment files exist"
else
  echo "❌ The following required files are missing:"
  for file in "${MISSING_FILES[@]}"; do
    echo "   - $file"
  done
  echo "⚠️ Please ensure all required files are present before deploying"
  exit 1
fi

# Run a build test
echo "🧪 Testing build process..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed. Please fix build errors before deploying"
  exit 1
fi

# Final message
echo ""
echo "🎉 Your project is ready for Vercel deployment!"
echo "Next steps:"
echo "1. Push your code to your GitHub repository"
echo "2. Connect your repository to Vercel"
echo "3. Configure environment variables in Vercel"
echo "4. Deploy your application"
echo ""
echo "See DEPLOYMENT_GUIDE.md or README.md for detailed instructions."
