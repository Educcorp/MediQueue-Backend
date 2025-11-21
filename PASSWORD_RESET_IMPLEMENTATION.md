# 🔐 Implementación de Recuperación de Contraseña

## 📋 Descripción General

Sistema completo de recuperación de contraseña para administradores de MediQueue mediante envío de correo electrónico con enlace temporal.

---

## 🏗️ Arquitectura del Sistema

### 1. **Base de Datos**

Se agregaron dos columnas a la tabla `Administrador`:

```sql
s_reset_password_token VARCHAR(255) NULL
d_reset_password_expires DATETIME NULL
```

**Migración:**
```bash
# Opción 1: Script Node.js (recomendado)
node add-reset-password-columns.js

# Opción 2: Script SQL manual
mysql -u usuario -p mediqueue < add-password-reset-columns.sql
```

### 2. **Modelo (Administrador.js)**

**Métodos Agregados:**

- `generatePasswordResetToken(s_email)` - Genera token de recuperación
- `getByPasswordResetToken(token)` - Busca admin por token válido
- `resetPasswordWithToken(token, newPassword)` - Resetea la contraseña

**Flujo de Tokens:**
- Token: 64 caracteres hexadecimales (crypto.randomBytes)
- Expiración: 1 hora desde la generación
- Se limpia automáticamente al resetear la contraseña

### 3. **Servicio de Email (emailService.js)**

**Método Agregado:**

```javascript
sendPasswordResetEmail(email, nombre, resetToken)
```

**Características del Email:**
- Diseño responsive con branding de MediQueue
- Botón principal con enlace de reseteo
- URL alternativa para copiar/pegar
- Advertencia de expiración (1 hora)
- Aviso de seguridad si no fue solicitado

### 4. **Controlador (authController.js)**

**Endpoints Implementados:**

#### `POST /api/auth/request-password-reset`
Solicita recuperación de contraseña

**Request:**
```json
{
  "s_email": "admin@ejemplo.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Se ha enviado un enlace de recuperación a tu correo electrónico"
}
```

**Validaciones:**
- ✓ Email existe en la base de datos
- ✓ Email está verificado (`b_email_verified = true`)
- ✓ Cuenta está activa

**Seguridad:**
- Siempre responde con éxito (incluso si el email no existe)
- Previene enumeración de usuarios

---

#### `GET /api/auth/verify-reset-token?token=xxx`
Verifica validez del token de reseteo

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "email": "admin@ejemplo.com",
    "valid": true
  }
}
```

---

#### `POST /api/auth/reset-password`
Resetea la contraseña con el token

**Request:**
```json
{
  "token": "abc123...",
  "s_password_nuevo": "nuevaPassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Validaciones:**
- ✓ Token válido y no expirado
- ✓ Contraseña mínimo 6 caracteres
- ✓ Se limpia el token después del uso

---

## 🎨 Frontend

### Página: `/admin/forgot-password` (ForgotPassword.jsx)

**Flujo de Usuario:**

1. **Paso 1: Ingreso de Email**
   - Usuario ingresa su correo electrónico
   - Validación de formato de email
   - Click en "Enviar Enlace de Recuperación"

2. **Paso 2: Confirmación de Envío**
   - Mensaje de éxito con icono
   - Instrucciones para revisar bandeja de entrada
   - Advertencia de expiración (1 hora)
   - Opciones: Volver al login o Reenviar correo

### Página: `/admin/reset-password` (ResetPassword.jsx)

**Flujo de Usuario:**

1. **Validación del Token**
   - Verificación automática al cargar la página
   - Muestra spinner mientras valida
   - Mensaje de error si el token es inválido/expirado

2. **Formulario de Nueva Contraseña**
   - Campo: Nueva contraseña (con toggle de visibilidad)
   - Campo: Confirmar contraseña (con toggle de visibilidad)
   - Validaciones en tiempo real
   - Botón: "Restablecer Contraseña"

3. **Confirmación Exitosa**
   - Mensaje de éxito
   - Redirección automática al login (3 segundos)

---

## 🔒 Seguridad Implementada

### Prevención de Ataques

1. **Rate Limiting:** 
   - Implementar límite de solicitudes por IP (pendiente)
   - Cooldown entre solicitudes del mismo email

2. **Tokens Seguros:**
   - Generación criptográfica (crypto.randomBytes)
   - 64 caracteres hexadecimales
   - Almacenados con hash en producción (recomendado)

3. **Expiración Temporal:**
   - Token válido solo 1 hora
   - Se elimina automáticamente al usar

4. **Validación de Email Verificado:**
   - Solo usuarios con email verificado pueden recuperar contraseña
   - Previene uso en cuentas no confirmadas

5. **No Enumeración de Usuarios:**
   - Misma respuesta si el email existe o no
   - Previene descubrimiento de usuarios registrados

---

## 📧 Configuración de Email

### Variables de Entorno Requeridas

```env
# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Remitente
EMAIL_FROM=noreply@mediqueue.app
EMAIL_FROM_NAME=MediQueue

# Frontend URL (para enlaces)
FRONTEND_URL=https://www.mediqueue.app
```

### Verificar Configuración

```javascript
const emailService = require('./src/services/emailService');
await emailService.verifyConnection();
```

---

## 🧪 Testing

### Test Manual - Backend

```bash
# 1. Solicitar recuperación
curl -X POST http://localhost:3000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"s_email": "admin@ejemplo.com"}'

# 2. Verificar token (copiar del email)
curl "http://localhost:3000/api/auth/verify-reset-token?token=TOKEN_AQUI"

# 3. Resetear contraseña
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "TOKEN_AQUI", "s_password_nuevo": "nuevaPassword123"}'
```

### Test Manual - Frontend

1. Ir a: `http://localhost:5173/admin/forgot-password`
2. Ingresar email registrado
3. Revisar bandeja de entrada
4. Click en enlace del email
5. Ingresar nueva contraseña
6. Confirmar y login

---

## 📝 Logs y Debugging

### Logs del Sistema

El sistema registra eventos importantes:

```
📧 [REQUEST PASSWORD RESET] Solicitud para: admin@ejemplo.com
✅ [GENERATE RESET TOKEN] Token generado exitosamente
📤 [EMAIL SERVICE - RESEND] Enviando email de recuperación...
✅ [EMAIL SERVICE - RESEND] Email de recuperación enviado exitosamente
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Email not verified | Email no verificado | Verificar email primero |
| Token expired | Pasó más de 1 hora | Solicitar nuevo token |
| RESEND_API_KEY missing | Variable no configurada | Configurar API key |
| Token invalid | Token ya usado o inválido | Solicitar nuevo token |

---

## 🚀 Mejoras Futuras

- [ ] Rate limiting por IP
- [ ] Cooldown entre solicitudes (10 minutos)
- [ ] Notificación por email cuando se cambia la contraseña
- [ ] Logs de auditoría de cambios de contraseña
- [ ] Historial de tokens usados
- [ ] Verificación de contraseña comprometida (HaveIBeenPwned)
- [ ] Autenticación de dos factores (2FA)

---

## 📚 Referencias

- **Modelo:** `src/models/Administrador.js`
- **Controlador:** `src/controllers/authController.js`
- **Servicio:** `src/services/emailService.js`
- **Rutas:** `src/routes/authRoutes.js`
- **Frontend (Solicitud):** `MediQueue/src/pages/ForgotPassword.jsx`
- **Frontend (Reset):** `MediQueue/src/pages/ResetPassword.jsx`

---

**Última actualización:** Noviembre 2024  
**Versión:** 1.0.0  
**Estado:** ✅ Implementación Completa

