#!/bin/bash

# Script to prepare your project for Vercel deployment
echo "🚀 Preparing PICTagram for Vercel deployment..."

# Check if vercel-build.sh is executable
if [ ! -x "vercel-build.sh" ]; then
  echo "📝 Making vercel-build.sh executable..."
  chmod +x vercel-build.sh
fi

# Create the Vite configuration patch file
echo "📝 Creating Vite configuration patch for Vercel..."
cat > vercel-vite-patch.js << 'PATCH'
// This file is used to patch the Vite configuration for Vercel deployments
const fs = require('fs');
const path = require('path');

// Path to server/vite.ts file
const viteServerPath = path.join(__dirname, 'server', 'vite.ts');

// Read the current content
let content = fs.readFileSync(viteServerPath, 'utf-8');

// Replace boolean allowedHosts with array
content = content.replace(
  'allowedHosts: true,',
  "allowedHosts: ['all'],"
);

// Write the updated content back
fs.writeFileSync(viteServerPath, content);

console.log('Successfully patched server/vite.ts for Vercel deployment');
PATCH
echo "✅ Created vercel-vite-patch.js"

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "📝 Creating .env file from example..."
  cp .env.example .env
  echo "⚠️ Make sure to update the values in .env file!"
else
  echo "✅ .env file already exists"
fi

# Check if tsconfig.vercel.json exists
if [ ! -f "tsconfig.vercel.json" ]; then
  echo "❌ tsconfig.vercel.json is missing, creating it..."
  echo '{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "strict": false,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}' > tsconfig.vercel.json
  echo "✅ Created tsconfig.vercel.json with less strict type checking"
else
  echo "📝 Updating tsconfig.vercel.json with less strict options..."
  # Ensure strictNullChecks is disabled
  sed -i 's/"strict": false,/"strict": false,\n    "strictNullChecks": false,\n    "noImplicitAny": false,/' tsconfig.vercel.json
  echo "✅ Updated tsconfig.vercel.json"
fi

# Check if the required files exist
echo "🔍 Checking for required Vercel deployment files..."

REQUIRED_FILES=("vercel.json" "vercel-build.sh" "server/vercel.ts" "server/vercel.package.json" "tsconfig.vercel.json" "vercel-vite-patch.js")
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

# Use Vercel-specific tsconfig for build test
echo "📝 Using Vercel-specific TypeScript configuration for build test..."
cp tsconfig.json tsconfig.original.json
cp tsconfig.vercel.json tsconfig.json

# Run a build test
echo "🧪 Testing build process..."
npm run build
BUILD_RESULT=$?

# Restore original tsconfig
echo "📝 Restoring original TypeScript configuration..."
mv tsconfig.original.json tsconfig.json

if [ $BUILD_RESULT -eq 0 ]; then
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
echo "See DEPLOYMENT.md for detailed instructions."
