#!/bin/bash

echo "🚀 Testing Vocaria API..."
echo "========================="

# Test 1: Health Check
echo "1. Health Check:"
curl -s http://localhost:8000/health | python3 -m json.tool
echo -e "\n"

# Test 2: Create User
echo "2. Creating User:"
USER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@vocaria.com","password":"test123"}')
echo $USER_RESPONSE | python3 -m json.tool
echo -e "\n"

# Test 3: Get Users
echo "3. Getting Users:"
curl -s http://localhost:8000/api/users | python3 -m json.tool
echo -e "\n"

# Test 4: Create Conversation
echo "4. Creating Conversation:"
CONV_RESPONSE=$(curl -s -X POST http://localhost:8000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"title":"Test Conversation"}')
echo $CONV_RESPONSE | python3 -m json.tool
echo -e "\n"

# Test 5: Create Message
echo "5. Creating Message:"
MSG_RESPONSE=$(curl -s -X POST http://localhost:8000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":1,"content":"Hello Vocaria!","is_user":true}')
echo $MSG_RESPONSE | python3 -m json.tool
echo -e "\n"

# Test 6: Get Conversation Messages
echo "6. Getting Conversation Messages:"
curl -s http://localhost:8000/api/conversations/1/messages | python3 -m json.tool
echo -e "\n"

echo "✅ All tests completed!"
