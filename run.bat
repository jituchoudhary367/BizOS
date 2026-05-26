@echo off
title BizOS Launcher
echo ========================================================
echo                 Starting BizOS System
echo ========================================================
echo.
echo 1. Start with Docker Compose (Recommended for full backend support)
echo 2. Start Locally (Node.js/Python without Docker)
echo.
choice /c 12 /n /m "Select an option (1 or 2): "

if errorlevel 2 goto local
if errorlevel 1 goto docker

:docker
echo Starting Docker containers...
docker compose up -d --build
echo Waiting for services to initialize...
timeout /t 5 /nobreak
echo Opening frontend in browser...
start http://localhost:5173
goto end

:local
echo ========================================================
echo Starting all microservices in separate windows...
echo Please ensure Redis and PostgreSQL are running locally!
echo ========================================================

echo Starting AI Service...
start "AI Service" cmd /k "cd apps\ai-service && pip install -r requirements.txt && python -m uvicorn src.main:app --reload --port 8000"

echo Starting Order Service...
start "Order Service" cmd /k "cd apps\order-service && npm install && npm run dev"

echo Starting Inventory Service...
start "Inventory Service" cmd /k "cd apps\inventory-service && npm install && npm run dev"

echo Starting Finance Service...
start "Finance Service" cmd /k "cd apps\finance-service && npm install && npm run dev"

echo Starting Staff Service...
start "Staff Service" cmd /k "cd apps\staff-service && npm install && npm run dev"

echo Starting Notification Service...
start "Notification Service" cmd /k "cd apps\notification-service && npm install && npm run dev"

echo Starting WhatsApp Service...
start "WhatsApp Service" cmd /k "cd apps\whatsapp-service && npm install && npm run dev"

echo Starting API Gateway...
start "API Gateway" cmd /k "cd apps\api-gateway && npm install && npm run dev"

echo Starting Web Frontend...
start "Web Frontend" cmd /k "cd apps\web && npm install && npm run dev"

echo Waiting for frontend to start on port 5173...
timeout /t 10 /nobreak
echo Opening frontend in browser...
start http://localhost:5173
goto end

:end
echo ========================================================
echo BizOS is running!
echo ========================================================
pause
