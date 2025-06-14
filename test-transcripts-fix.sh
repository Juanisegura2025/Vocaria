#!/bin/bash
# Test script para verificar el fix del error 401 en TranscriptsPage

echo "🧪 Testing Transcripts Fix..."
echo "=============================="

# 1. Test backend health
echo ""
echo "1️⃣ Testing Backend Health..."
curl -s http://127.0.0.1:8001/health | jq '.' || echo "❌ Backend not responding"

# 2. Test auth endpoint
echo ""
echo "2️⃣ Testing Auth Login..."
TOKEN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan2@vocaria.com","password":"test123"}')

echo "$TOKEN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ No token received"
  exit 1
else
  echo "✅ Token received: ${TOKEN:0:20}..."
fi

# 3. Test transcripts endpoint with token
echo ""
echo "3️⃣ Testing Transcripts Endpoint..."
curl -s -X GET http://127.0.0.1:8001/api/transcripts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

# 4. Test transcripts with filters
echo ""
echo "4️⃣ Testing Transcripts with Filters..."
curl -s -X GET "http://127.0.0.1:8001/api/transcripts?tour_id=1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.total_count'

echo ""
echo "🎉 Test completed! Check the responses above."
echo ""
echo "✅ If you see JSON responses without errors, the fix is working!"
echo "❌ If you see error messages, there are still issues to resolve."