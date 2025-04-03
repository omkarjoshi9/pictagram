#!/bin/bash

# Script to verify deployment prerequisites for PICTagram
echo "⚙️ PICTagram Deployment Verification Tool ⚙️"
echo "==================================================="
echo "This script will check your system for deployment prerequisites."
echo

# Check if database is accessible
echo "🔍 Checking database connection..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is not set"
  DB_OK=false
else
  # Try to connect to database
  echo "  Attempting to connect to database..."
  
  # Extract database details from URL
  if [[ $DATABASE_URL == postgres://* ]]; then
    echo "  ✅ Valid PostgreSQL connection string format"
    
    # Check database tables
    # This uses a simple psql query to check if users table exists
    TABLE_CHECK=$(PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');" 2>/dev/null)
    
    if [[ $TABLE_CHECK == *"t"* ]]; then
      echo "  ✅ Database tables exist"
      DB_OK=true
    else
      echo "  ❌ Database tables not found. Run 'npm run db:push' to create schema"
      DB_OK=false
    fi
  else
    echo "  ❌ Invalid PostgreSQL connection string format"
    DB_OK=false
  fi
fi

echo

# Check required files for Vercel deployment
echo "🔍 Checking required Vercel deployment files..."
VERCEL_FILES=("vercel.json" "vercel-build.sh" "server/vercel.ts" "tsconfig.vercel.json")
MISSING_FILES=()

for file in "${VERCEL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file exists"
  else
    echo "  ❌ $file is missing"
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  VERCEL_FILES_OK=true
else
  VERCEL_FILES_OK=false
fi

echo

# Check package.json for required scripts
echo "🔍 Checking package.json scripts..."
if [ -f "package.json" ]; then
  BUILD_SCRIPT=$(grep -o '"build":[^,]*' package.json)
  DEV_SCRIPT=$(grep -o '"dev":[^,]*' package.json)
  DB_PUSH_SCRIPT=$(grep -o '"db:push":[^,]*' package.json)
  
  if [[ -n "$BUILD_SCRIPT" ]]; then
    echo "  ✅ build script found"
  else
    echo "  ❌ build script missing"
  fi
  
  if [[ -n "$DEV_SCRIPT" ]]; then
    echo "  ✅ dev script found"
  else
    echo "  ❌ dev script missing"
  fi
  
  if [[ -n "$DB_PUSH_SCRIPT" ]]; then
    echo "  ✅ db:push script found"
  else
    echo "  ❌ db:push script missing - required for database migration"
  fi
  
  if [[ -n "$BUILD_SCRIPT" && -n "$DEV_SCRIPT" && -n "$DB_PUSH_SCRIPT" ]]; then
    SCRIPTS_OK=true
  else
    SCRIPTS_OK=false
  fi
else
  echo "  ❌ package.json not found"
  SCRIPTS_OK=false
fi

echo

# Check environment variables
echo "🔍 Checking essential environment variables..."
ENV_VARS=("DATABASE_URL" "PGHOST" "PGPORT" "PGUSER" "PGPASSWORD" "PGDATABASE" "NODE_ENV")
MISSING_ENV=()

for var in "${ENV_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "  ❌ $var is not set"
    MISSING_ENV+=("$var")
  else
    echo "  ✅ $var is set"
  fi
done

if [ ${#MISSING_ENV[@]} -eq 0 ]; then
  ENV_OK=true
else
  ENV_OK=false
fi

echo
echo "==================================================="
echo "📊 Deployment Readiness Summary"
echo "==================================================="

if $DB_OK && $VERCEL_FILES_OK && $SCRIPTS_OK && $ENV_OK; then
  echo "✅ All checks passed! Your system is ready for deployment."
  echo "   Run './prepare-vercel-deploy.sh' to prepare your project for Vercel deployment."
  echo "   Then follow the deployment steps in DEPLOYMENT.md"
  exit 0
else
  echo "❌ Some checks failed. Please fix the issues before deploying:"
  
  if ! $DB_OK; then
    echo "  - Database issues: Ensure PostgreSQL is accessible and tables are created"
    echo "    Run 'npm run db:push' to create the database schema"
  fi
  
  if ! $VERCEL_FILES_OK; then
    echo "  - Missing Vercel files: ${MISSING_FILES[@]}"
  fi
  
  if ! $SCRIPTS_OK; then
    echo "  - Package.json script issues: Check that build, dev, and db:push scripts exist"
  fi
  
  if ! $ENV_OK; then
    echo "  - Missing environment variables: ${MISSING_ENV[@]}"
    echo "    Copy .env.example to .env and fill in the required values"
  fi
  
  exit 1
fi