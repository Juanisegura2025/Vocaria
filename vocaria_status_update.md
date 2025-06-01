# Vocaria - Estado Actual y Metodología de Trabajo v2.0

**GitHub Repository:** https://github.com/Juanisegura2025/Vocaria

## 🎯 **Resumen del Proyecto**

**Vocaria** es un SaaS voice-first virtual showing assistant que se embebe en tours Matterport 3D. Los agentes inmobiliarios configuran agentes conversacionales con IA para capturar leads automáticamente.

### **Arquitectura del Sistema (4 Componentes):**
1. **Cliente Admin Panel** (`app.vocaria.app`) - Para agentes inmobiliarios
2. **Super Admin Panel** (`admin.vocaria.app`) - Para el dueño del negocio  
3. **Widget Embebible** (`widget.vocaria.app`) - Para visitantes de tours
4. **Backend API** (`api.vocaria.app`) - Sirve a todos los anteriores

---

## 🎉 **ESTADO ACTUAL: MVP FUNCIONAL COMPLETO**

### ✅ **SESIÓN 2 COMPLETADA EXITOSAMENTE (JWT Authentication)**

**🏆 LOGROS PRINCIPALES:**
- **✅ JWT Authentication Real** - Login/logout funcionando con tokens reales
- **✅ Backend + Frontend Integrado** - Comunicación completa entre React y FastAPI
- **✅ Dashboard Profesional** - UI completa con 7 páginas funcionales
- **✅ Security Implementada** - bcrypt + JWT + rutas protegidas
- **✅ Testing Workflow** - Script automatizado para validar API

**🔧 STACK TECNOLÓGICO FUNCIONANDO:**
- **Backend:** FastAPI + PostgreSQL + SQLAlchemy async + JWT + bcrypt
- **Frontend:** React + TypeScript + Antd + React Router + Axios
- **Database:** PostgreSQL con pgvector extension
- **Auth:** JWT tokens + bcrypt password hashing
- **Testing:** Script automatizado + health checks

---

## 📁 **ESTRUCTURA DE ARCHIVOS DETALLADA**

```
/Users/juan/Vocaria/                    ← DIRECTORIO PRINCIPAL
├── venv/                               ← Virtual environment Python
├── .env                               ← Variables de entorno principales
├── test-api.sh                        ← Script de testing automatizado
├── 
├── vocaria/backend/                    ← BACKEND FASTAPI
│   ├── main.py                        ← API principal (puerto 8001)
│   ├── .env                           ← DATABASE_URL backend
│   ├── src/
│   │   ├── models.py                  ← User/Conversation/Message SQLAlchemy
│   │   ├── database.py                ← get_db function
│   │   └── vocaria/
│   │       └── auth.py                ← JWT + bcrypt functions
│   └── requirements.txt               ← Dependencias Python
│
├── frontend/                          ← FRONTEND REACT
│   ├── .env                          ← VITE_API_URL=http://127.0.0.1:8001
│   ├── package.json                  ← Dependencias Node + scripts
│   ├── src/
│   │   ├── main.tsx                  ← Entry point
│   │   ├── App.tsx                   ← Router + AuthProvider
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       ← Context real con authService
│   │   ├── services/
│   │   │   └── authService.ts        ← API calls con axios
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx         ← Login funcional
│   │   │   └── RegisterPage.tsx      ← Registro funcional
│   │   ├── features/                 ← 7 páginas dashboard
│   │   │   ├── dashboard/
│   │   │   ├── tours/
│   │   │   ├── leads/
│   │   │   ├── transcripts/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   └── layouts/
│   │       └── MainLayout.tsx        ← Layout con sidebar
│   └── dist/                         ← Build production
│
└── docs/                             ← Documentación PRD
```

---

## 🔄 **COMANDOS DE SESIÓN ACTUALIZADOS**

### **🟢 INICIAR SESIÓN DE TRABAJO:**

```bash
# 1. Ir al directorio principal
cd /Users/juan/Vocaria

# 2. Activar virtual environment
source venv/bin/activate

# 3. Iniciar PostgreSQL (si no está corriendo)
brew services start postgresql@14

# 4. BACKEND: Iniciar servidor FastAPI
cd vocaria/backend
export DATABASE_URL="postgresql+asyncpg://vocaria_user:Ciri13to@localhost:5432/vocaria_dev"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# 5. FRONTEND: En nueva terminal
cd /Users/juan/Vocaria/frontend
npm run dev

# 6. TESTING: Verificar que todo funciona
cd /Users/juan/Vocaria
./test-api.sh
```

### **🧪 TESTING COMMANDS:**

```bash
# Health check backend
curl http://127.0.0.1:8001/health

# Test completo automatizado
./test-api.sh

# Login con usuario existente
curl -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan2@vocaria.com","password":"test123"}'

# Abrir frontend
open http://localhost:3000

# Backend docs
open http://127.0.0.1:8001/docs
```

### **🔴 FINALIZAR SESIÓN:**

```bash
# 1. Parar servidores (Ctrl+C en ambas terminales)

# 2. Commit y push
cd /Users/juan/Vocaria
git add .
git commit -m "feat: [descripción específica]"
git push

# 3. Actualizar status file
# (Editar sección "Última Sesión" abajo)

# 4. Commit status update
git add vocaria_status_update.md
git commit -m "docs: update status after session [date]"
git push

# 5. Desactivar venv
deactivate
```

---

## 🎓 **LECCIONES APRENDIDAS - MEJORES PRÁCTICAS**

### **✅ LO QUE FUNCIONÓ MUY BIEN:**

1. **Workflow Anti-Errores:**
   - ✅ **Prompts específicos:** Incluir ubicaciones exactas de archivos
   - ✅ **Testing incremental:** Probar cada paso antes de continuar
   - ✅ **Script automatizado:** `test-api.sh` para validar API rápidamente
   - ✅ **Variables de entorno consistentes:** `.env` en cada directorio
   - ✅ **Commits frecuentes:** Un commit por funcionalidad completada

2. **Comunicación con Windsurf:**
   - ✅ **Contexto completo:** Incluir estructura de archivos en prompts
   - ✅ **Objetivos claros:** Un objetivo específico por prompt
   - ✅ **Validación inmediata:** Verificar resultado antes de siguiente paso
   - ✅ **Error handling:** Copiar errores completos para diagnóstico

3. **Flujo de Desarrollo:**
   - ✅ **Backend primero:** Establecer API sólida antes de frontend
   - ✅ **Pasos pequeños:** Crear, probar, commit, siguiente paso
   - ✅ **Documentación:** Mantener este status file actualizado

### **❌ ERRORES A EVITAR:**

1. **Errores de Importación:**
   - ❌ No especificar paths relativos correctos en prompts
   - ❌ Crear archivos en ubicaciones incorrectas
   - ✅ **Solución:** Siempre incluir estructura de directorios en prompts

2. **Errores de Environment:**
   - ❌ Variables de entorno no cargadas correctamente
   - ❌ Ejecutar desde directorio incorrecto
   - ✅ **Solución:** Script de inicio con export explícito

3. **Errores de Testing:**
   - ❌ No probar cada paso antes de continuar
   - ❌ Asumir que funciona sin verificar
   - ✅ **Solución:** Test automatizado después de cada cambio

### **🎯 TEMPLATE MEJORADO PARA PROMPTS:**

```
CONTEXTO COMPLETO:
- Proyecto: Vocaria SaaS inmobiliario
- Backend: FastAPI en /Users/juan/Vocaria/vocaria/backend/main.py (puerto 8001)
- Frontend: React en /Users/juan/Vocaria/frontend/src/
- Database: PostgreSQL vocaria_dev con User/Conversation/Message
- Auth: JWT tokens funcionando con juan2@vocaria.com/test123

OBJETIVO: [Específico]

ARCHIVOS A MODIFICAR:
- [Ubicación exacta del archivo]

VALIDACIÓN:
- [Cómo probar que funciona]
```

---

## 🚀 **PRÓXIMOS PASOS PRIORIZADOS**

### **🎯 FASE 3: Datos Reales Inmobiliarios (Próxima Sesión)**

**Objetivo:** Reemplazar datos mock con datos reales inmobiliarios

**Sesión 3A: Evolución de Modelos (45-60 min)**
- **Task:** Crear modelos Tour/Lead/Property en lugar de Conversation/Message
- **Ubicación:** `vocaria/backend/src/models.py`
- **Testing:** Verificar nuevas tablas en PostgreSQL
- **Entregable:** DB schema inmobiliario funcionando

**Sesión 3B: API Endpoints Inmobiliarios (30-45 min)**
- **Task:** Crear endpoints /api/tours, /api/leads, /api/properties
- **Ubicación:** `vocaria/backend/main.py`
- **Testing:** CRUD completo con curl commands
- **Entregable:** API inmobiliaria funcionando

**Sesión 3C: Frontend con Datos Reales (45-60 min)**
- **Task:** Conectar dashboard con APIs inmobiliarias
- **Ubicación:** `frontend/src/features/`
- **Testing:** Dashboard mostrando tours y leads reales
- **Entregable:** SaaS inmobiliario end-to-end

### **🎯 FASE 4: Widget Embebible (Futuro)**
- Crear widget React embebible
- Integración con Matterport SDK
- ElevenLabs Conversational AI

### **🎯 FASE 5: Deploy Producción (Futuro)**
- Fly.io deployment
- DNS configuration
- SSL certificates

---

## 🗃️ **INFORMACIÓN TÉCNICA CLAVE**

### **Backend Configuration:**
- **Puerto:** 8001 (cambiado de 8000 para evitar conflictos)
- **Database:** PostgreSQL async vocaria_dev
- **Auth:** JWT tokens con bcrypt password hashing
- **CORS:** Configurado para localhost:3000
- **Docs:** Auto-generadas en /docs

### **Frontend Configuration:**
- **Puerto:** 3000 (npm run dev)
- **API URL:** http://127.0.0.1:8001 (en .env)
- **Auth:** Context + authService + localStorage tokens
- **UI:** Antd + Tailwind + TypeScript + React Router

### **Database Schema Actual:**
```sql
-- Tablas principales
users: id, username, email, hashed_password, is_active, created_at
conversations: id, user_id, title, created_at, updated_at
messages: id, conversation_id, content, is_user, created_at

-- Usuario test funcionando
juan2@vocaria.com / test123 (ID: 4)
```

### **Environment Variables:**
```bash
# Backend
DATABASE_URL=postgresql+asyncpg://vocaria_user:Ciri13to@localhost:5432/vocaria_dev

# Frontend  
VITE_API_URL=http://127.0.0.1:8001
```

---

## 📊 **Success Metrics Completados**

- [x] ✅ PostgreSQL configurado y conectado
- [x] ✅ API endpoints funcionando perfectamente
- [x] ✅ JWT authentication real implementada
- [x] ✅ Frontend-backend integración completa
- [x] ✅ Dashboard profesional funcionando
- [x] ✅ Login/logout end-to-end
- [x] ✅ Password hashing con bcrypt
- [x] ✅ Protected routes funcionando
- [x] ✅ Error handling robusto
- [x] ✅ Testing workflow automatizado
- [x] ✅ GitHub repository sincronizado
- [x] ✅ Documentation completa
- [ ] 🎯 Modelos inmobiliarios (próximo)
- [ ] 🎯 CRUD tours/leads real (próximo)
- [ ] 🎯 Widget embebible (futuro)

---

## 📅 **Última Sesión de Trabajo**

**Fecha:** 31 Mayo 2025  
**Duración:** ~90 minutos  
**Objetivo:** Implementar JWT Authentication real

**✅ COMPLETADO:**
- [x] Crear `src/vocaria/auth.py` con JWT + bcrypt
- [x] Actualizar `main.py` con endpoints `/api/auth/login` y `/api/auth/register`
- [x] Resolver importaciones circulares creando `database.py`
- [x] Crear `frontend/src/services/authService.ts` con axios
- [x] Actualizar `AuthContext.tsx` para usar API real
- [x] Testing completo end-to-end funcionando
- [x] Script `test-api.sh` para validación automatizada

**🔧 ISSUES RESUELTOS:**
- ImportError de modelos → paths relativos correctos
- DATABASE_URL not defined → load_dotenv() + export manual
- Hash incompatibility → usuario nuevo con bcrypt
- Puerto 8000 ocupado → cambio a puerto 8001
- CORS errors → configuración correcta
- Circular imports → database.py separado

**🎯 PRÓXIMA SESIÓN:**
- **Objetivo principal:** Evolucionar modelos hacia inmobiliario (User/Tour/Lead)
- **Tiempo estimado:** 60-90 min
- **Preparación necesaria:** Backend + frontend corriendo

**💡 INSIGHTS/APRENDIZAJES:**
- Workflow anti-errores funciona excelentemente
- Prompts específicos con contexto completo evitan 90% de errores
- Testing incremental es clave para debugging rápido
- Scripts automatizados ahorran tiempo significativo
- Commits frecuentes permiten rollback rápido si algo falla

---

## 📝 **Template para Nueva Conversación con Claude**

```
Hola! Continuando desarrollo de Vocaria SaaS inmobiliario.

ESTADO ACTUAL:
✅ JWT Authentication funcionando end-to-end
✅ Backend FastAPI (puerto 8001) + Frontend React (puerto 3000) 
✅ PostgreSQL con User/Conversation/Message
✅ Login real: juan2@vocaria.com / test123

ESTRUCTURA:
- Backend: /Users/juan/Vocaria/vocaria/backend/main.py
- Frontend: /Users/juan/Vocaria/frontend/src/
- Repo: https://github.com/Juanisegura2025/Vocaria

OBJETIVO HOY:
🎯 [Tu objetivo específico para esta sesión]

TIEMPO DISPONIBLE: [X minutos]

ARCHIVOS DE CONTEXTO:
- Por favor revisa mi vocaria_status_update.md para contexto completo
- También revisa los PRDs en docs/ si necesitas detalles del producto

¿Continuamos con [siguiente paso específico]?
```

---

## 🛡️ **Backup Commands (Por Si Acaso)**

```bash
# Si algo falla, comandos de emergencia:

# 1. Reset backend
cd /Users/juan/Vocaria/vocaria/backend
git checkout HEAD -- main.py
export DATABASE_URL="postgresql+asyncpg://vocaria_user:Ciri13to@localhost:5432/vocaria_dev"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# 2. Reset frontend
cd /Users/juan/Vocaria/frontend
git checkout HEAD -- src/contexts/AuthContext.tsx
npm run dev

# 3. Test de emergencia
cd /Users/juan/Vocaria
./test-api.sh

# 4. Login de emergencia
curl -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan2@vocaria.com","password":"test123"}'
```

---

**🎯 Última actualización**: 31 Mayo 2025 - MVP Authentication Completado
**✅ Estado:** FUNCIONAL END-TO-END - Listo para Fase 3 (Datos Inmobiliarios)
**🚀 Próximo hito:** Modelos Tour/Lead/Property + API inmobiliaria