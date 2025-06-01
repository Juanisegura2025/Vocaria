#!/bin/bash
echo "🧪 Testing Vocaria API..."

# Health check
echo "1. Health check:"
curl -s http://127.0.0.1:8001/health | python3 -m json.tool

# Login test with existing user
echo -e "\n2. Login test:"
curl -s -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan2@vocaria.com","password":"test123"}' | python3 -m json.tool

echo -e "\n✅ API tests completed"
