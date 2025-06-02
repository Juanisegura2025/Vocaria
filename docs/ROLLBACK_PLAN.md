# ROLLBACK PLAN - Fase 3 Safety

## If Fase 3 Database Migration Breaks Something:

### Quick Rollback:
```bash
# 1. Rollback to stable tag
git checkout v2.5-auth-complete

# 2. Restore database
psql vocaria_dev < backup_before_fase3_20250601_2330.sql

# 3. Restart servers
cd vocaria/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

cd /Users/juan/Vocaria/frontend  
npm run dev
### Partial Rollback (if only models break):
```bash
# Rollback only database files
git checkout v2.5-auth-complete -- vocaria/backend/src/models.py

# Keep frontend changes if working
### Validation Commands:
```bash
# Test auth still works
curl -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan2@vocaria.com","password":"test123"}'

# Test frontend loads
open http://localhost:3000/login
Last Known Good State: v2.5-auth-complete
Database Backup: backup_before_fase3_20250601_2330.sql
