#!/bin/bash
export DATABASE_URL="postgresql://leadtracker_user:WGlTvA3dzKvGqTH9cn4adkWS3CqruQhi@dpg-d5v26fili9vc739v0fa0-a.oregon-postgres.render.com:5432/leadtracker"
export NODE_ENV="production"
export DASHBOARD_PASSWORD="demo123"
export DATA_RETENTION_DAYS="30"

echo "DATABASE_URL=$DATABASE_URL" | vercel env add DATABASE_URL production --token ghcwkaUzl2eDUQdK3tqANN8p
echo "DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD" | vercel env add DASHBOARD_PASSWORD production --token ghcwkaUzl2eDUQdK3tqANN8p
echo "DATA_RETENTION_DAYS=$DATA_RETENTION_DAYS" | vercel env add DATA_RETENTION_DAYS production --token ghcwkaUzl2eDUQdK3tqANN8p
