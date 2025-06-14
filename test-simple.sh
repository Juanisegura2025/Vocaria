#!/bin/bash
echo "🧪 Testing Transcripts Fix (Simple Version)..."
echo "============================================"

# 1. Test backend health
echo ""
echo "1️⃣ Testing Backend Health..."
curl -s http://127.0.0.1:8001/health
echo ""

# 2. Test auth and get token
echo ""
echo "2️⃣ Testing Auth Login..."
TOKEN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan2@vocaria.com","password":"test123"}')

echo "$TOKEN_RESPONSE"

# Extract token using python
TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('access_token', ''))
except:
    print('')
" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ No token received"
  exit 1
else
  echo "✅ Token received: ${TOKEN:0:20}..."
fi

# 3. Test transcripts endpoint
echo ""
echo "3️⃣ Testing Transcripts Endpoint..."
TRANSCRIPTS_RESPONSE=$(curl -s -X GET http://127.0.0.1:8001/api/transcripts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$TRANSCRIPTS_RESPONSE"

# Check if response contains transcripts
if echo "$TRANSCRIPTS_RESPONSE" | grep -q '"transcripts"'; then
  echo ""
  echo "✅ SUCCESS: TranscriptsPage fix is WORKING!"
else
  echo ""
  echo "❌ ISSUE: Still not working"
fi
