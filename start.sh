#!/bin/bash
# SNKRS CART — Start both servers

echo "🔧 Installing backend dependencies..."
cd backend && npm install --silent

echo "🚀 Starting backend API on http://localhost:4000..."
npm run dev &
BACKEND_PID=$!

echo "🔧 Installing frontend dependencies..."
cd ../frontend && npm install --silent

echo "🚀 Starting frontend on http://localhost:3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ SNKRS CART is running!"
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
