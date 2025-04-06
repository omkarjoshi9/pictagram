#!/bin/bash

# Script to verify deployment status
# Usage: ./verify-deployment.sh <deployment-url>

if [ -z "$1" ]; then
  echo "❌ Error: Please provide the deployment URL"
  echo "Usage: ./verify-deployment.sh <deployment-url>"
  exit 1
fi

DEPLOYMENT_URL=$1
HTTP_URL=$(echo $DEPLOYMENT_URL | sed 's/^wss\?:/https:/')
WS_URL=$(echo $DEPLOYMENT_URL | sed 's/^https\?:/wss:/')

echo "🔍 Verifying deployment at: $HTTP_URL"

# Check if the main URL responds
echo "📡 Checking main URL..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HTTP_URL)

if [ $HTTP_STATUS -eq 200 ]; then
  echo "✅ Main URL is accessible (HTTP 200)"
else
  echo "❌ Main URL returned HTTP $HTTP_STATUS"
fi

# Check API health endpoint
echo "📡 Checking API health endpoint..."
HEALTH_RESPONSE=$(curl -s $HTTP_URL/api/health)

if [ -n "$HEALTH_RESPONSE" ]; then
  echo "✅ Health endpoint responded"
  
  # Extract database connection status
  if echo $HEALTH_RESPONSE | grep -q '"connected":true'; then
    echo "✅ Database connection successful"
  else
    echo "❌ Database connection failed"
    echo "🔍 Health response: $HEALTH_RESPONSE"
  fi
else
  echo "❌ Health endpoint did not respond"
fi

# Try to verify WebSocket
echo "📡 Checking WebSocket endpoint (without actual connection)..."
WS_STATUS=$(curl -s -I -o /dev/null -w "%{http_code}" $HTTP_URL/ws)

if [ $WS_STATUS -ne 404 ]; then
  echo "✅ WebSocket endpoint exists"
else
  echo "❌ WebSocket endpoint returned HTTP 404"
fi

# Check for key frontend resources
echo "📡 Checking for frontend resources..."
MAIN_JS=$(curl -s $HTTP_URL | grep -o "src=\"[^\"]*main[^\"]*\"|src=[^\"]*main[^\"]*" | wc -l)

if [ $MAIN_JS -gt 0 ]; then
  echo "✅ Frontend main script detected"
else
  echo "❌ Frontend main script not found"
fi

echo ""
echo "🔍 Deployment verification complete!"
echo "------------------------------------"
echo "If all checks passed, your deployment is ready!"
echo "If some checks failed, review the deployment logs in Vercel dashboard."
echo ""
echo "Next steps for manual verification:"
echo "1. Visit $HTTP_URL in your browser"
echo "2. Test login with MetaMask"
echo "3. Try uploading an image and creating a post"
echo "4. Test messaging functionality"
echo ""
echo "Remember to configure all environment variables in Vercel!"