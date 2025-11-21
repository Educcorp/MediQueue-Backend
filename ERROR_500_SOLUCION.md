# 🔧 Solución al Error 500 - Recuperación de Contraseña

## ❌ Problema Reportado

```
Error al solicitar recuperación: AxiosError
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Endpoint: POST /api/auth/request-password-reset
```

---

## 🔍 Causa del Error

El error 500 fue causado por **DOS problemas**:

### 1. ✅ Columnas Faltantes en la Base de Datos (RESUELTO)

**Problema:**
Las columnas necesarias para el sistema de recuperación de contraseña no existían:
- `s_reset_password_token` 
- `d_reset_password_expires`

**Solución Aplicada:**
✅ Se ejecutó el script de migración: `node add-reset-password-columns.js`
✅ Las columnas fueron agregadas exitosamente
✅ Este problema está RESUELTO

---

### 2. ⚠️ API Key de Resend No Configurada (REQUIERE ACCIÓN)

**Problema:**
El servidor intenta enviar un email de recuperación pero no tiene configurada la API key de Resend.

**Estado Actual:**
```
RESEND_API_KEY: ❌ No configurada
EMAIL_FROM: ⚠️  Usando default (onboarding@resend.dev)
FRONTEND_URL: ⚠️  Usando default
```

**Este problema requiere tu acción.**

---

## ✅ Soluciones Aplicadas

### 1. Base de Datos
```bash
✅ Migración ejecutada exitosamente
✅ Columnas agregadas:
   - s_reset_password_token (VARCHAR 255)
   - d_reset_password_expires (DATETIME)
```

### 2. Validación Mejorada
```javascript
✅ Se mejoró el manejo de errores en el controlador
✅ Ahora detecta si RESEND_API_KEY falta
✅ Responde con error 503 en lugar de 500
✅ Mensaje más claro para el usuario
```

### 3. Scripts de Diagnóstico
```bash
✅ check-reset-columns.js - Verifica columnas
✅ test-password-reset-system.js - Prueba sistema completo
✅ add-reset-password-columns.js - Migración automática
```

---

## 🎯 Siguiente Paso: Configurar Resend API

### Opción 1: Para DESARROLLO / PRUEBAS (Rápido)

Si solo quieres probar el sistema localmente:

1. **Obtén API Key de Resend (Gratuito):**
   - Ve a: https://resend.com
   - Crea cuenta gratuita
   - Genera API Key en Settings → API Keys
   - Copia la key (formato: `re_xxxxxxxxxxxx`)

2. **Configura en `.env`:**
   ```env
   RESEND_API_KEY=re_TU_API_KEY_AQUI
   EMAIL_FROM=onboarding@resend.dev
   EMAIL_FROM_NAME=MediQueue
   FRONTEND_URL=http://localhost:5173
   ```

3. **Reinicia el servidor:**
   ```bash
   # Detener servidor (Ctrl+C)
   npm run dev
   ```

4. **Prueba:**
   - Ve a: http://localhost:5173/admin/forgot-password
   - Ingresa: epalacios6@ucol.mx
   - Revisa tu bandeja de entrada

**⏱️ Tiempo estimado:** 5-10 minutos

---

### Opción 2: Para PRODUCCIÓN (Completo)

Si vas a desplegar en producción:

1. **Sigue los pasos de la Opción 1**
2. **Verifica tu dominio en Resend:**
   - Dashboard → Domains → Add Domain
   - Agrega registros DNS según instrucciones
   - Espera verificación (~5 minutos)
3. **Actualiza `.env` con tu dominio:**
   ```env
   EMAIL_FROM=noreply@mediqueue.app
   FRONTEND_URL=https://www.mediqueue.app
   ```

**📚 Guía completa:** Ver archivo `RESEND_API_SETUP.md`

---

### Opción 3: SALTARSE Email (Solo para Testing)

Si no quieres configurar email ahora, puedes:

1. **Modificar temporalmente para generar tokens sin enviar email**
2. **Copiar el token directamente de la base de datos**
3. **Construir la URL manualmente**

**⚠️ NO recomendado:** Esto es solo para debugging, no para producción.

---

## 🧪 Verificar que Todo Funcione

Una vez configurada la API key:

```bash
# 1. Verificar sistema completo
node test-password-reset-system.js

# Deberías ver:
# ✅ Columnas de BD correctas
# ✅ Servicio de email configurado
# ✅ Sistema LISTO para usar
```

```bash
# 2. Probar desde terminal
curl -X POST http://localhost:3000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"s_email": "epalacios6@ucol.mx"}'

# Respuesta esperada:
# {
#   "success": true,
#   "message": "Se ha enviado un enlace de recuperación..."
# }
```

---

## 📊 Estado Actual del Sistema

| Componente | Estado | Acción Requerida |
|------------|--------|------------------|
| Columnas BD | ✅ Resuelto | Ninguna |
| Modelo Administrador | ✅ Implementado | Ninguna |
| Controladores | ✅ Implementados | Ninguna |
| Rutas API | ✅ Configuradas | Ninguna |
| Frontend | ✅ Actualizado | Ninguna |
| **Resend API** | ⚠️ **Pendiente** | **Configurar API Key** |

---

## 🎬 Flujo Completo (Una Vez Configurado)

1. **Usuario** va a `/admin/forgot-password`
2. Ingresa su email: `epalacios6@ucol.mx`
3. Click en "Enviar Enlace de Recuperación"
4. **Backend** valida:
   - ✅ Email existe
   - ✅ Email verificado
   - ✅ Cuenta activa
5. **Backend** genera token (1 hora de validez)
6. **Resend** envía email con enlace
7. **Usuario** recibe email y click en enlace
8. Va a `/admin/reset-password?token=xxx`
9. Ingresa nueva contraseña
10. ✅ Contraseña actualizada
11. Redirección al login

---

## 🔒 Seguridad Implementada

- ✅ Tokens criptográficos (64 caracteres)
- ✅ Expiración en 1 hora
- ✅ Uso único por token
- ✅ Solo emails verificados
- ✅ No enumeración de usuarios
- ✅ Logging completo de eventos

---

## 📝 Resumen de Archivos Creados/Modificados

### Backend
- ✅ `src/models/Administrador.js` - Métodos de reset
- ✅ `src/services/emailService.js` - Email de recuperación
- ✅ `src/controllers/authController.js` - Controladores
- ✅ `src/routes/authRoutes.js` - 3 nuevas rutas

### Frontend
- ✅ `pages/ForgotPassword.jsx` - UI actualizada

### Scripts
- ✅ `add-reset-password-columns.js` - Migración
- ✅ `check-reset-columns.js` - Verificación
- ✅ `test-password-reset-system.js` - Testing

### Documentación
- ✅ `PASSWORD_RESET_IMPLEMENTATION.md`
- ✅ `RESEND_API_SETUP.md`
- ✅ `CHANGELOG_PASSWORD_RESET.md`
- ✅ `ERROR_500_SOLUCION.md` (este archivo)

---

## 🚀 Próximo Paso Inmediato

**Para que el sistema funcione completamente:**

```bash
1. Obtén API Key de Resend (5 minutos)
   → https://resend.com/signup

2. Agrega a .env:
   RESEND_API_KEY=re_tu_key_aqui

3. Reinicia servidor:
   npm run dev

4. Prueba desde frontend:
   http://localhost:5173/admin/forgot-password
```

---

## 📞 ¿Necesitas Ayuda?

- **Configuración de Resend:** Ver `RESEND_API_SETUP.md`
- **Documentación completa:** Ver `PASSWORD_RESET_IMPLEMENTATION.md`
- **Testing:** Ejecuta `node test-password-reset-system.js`

---

**Estado:** ⚠️ Sistema 95% completo - Solo falta configurar API Key  
**Tiempo para completar:** 5-10 minutos  
**Documentación:** Completa y lista ✅

