# 📧 Configuración de Resend API para Envío de Emails

## 🎯 ¿Qué es Resend?

Resend es un servicio moderno de envío de emails transaccionales que se utiliza en MediQueue para:
- Enviar emails de verificación de cuenta
- Enviar enlaces de recuperación de contraseña
- Enviar notificaciones a administradores

---

## 🔑 Obtener API Key de Resend

### Paso 1: Crear Cuenta en Resend

1. Visita: [https://resend.com](https://resend.com)
2. Click en "Sign Up" (Registrarse)
3. Completa el registro con tu email
4. Verifica tu correo electrónico

### Paso 2: Crear API Key

1. Una vez dentro, ve a **Settings** → **API Keys**
2. Click en **"Create API Key"**
3. Dale un nombre descriptivo (ej: "MediQueue Production")
4. Selecciona los permisos: **"Sending access"**
5. Click en **"Create"**
6. **⚠️ IMPORTANTE:** Copia la API key inmediatamente (solo se muestra una vez)

La API key tendrá este formato:
```
re_123456789abcdefghijklmnopqrstuvwxyz
```

### Paso 3: Verificar Dominio (Opcional pero Recomendado)

Para producción, es recomendable verificar tu dominio:

1. Ve a **Domains** en el panel de Resend
2. Click en **"Add Domain"**
3. Ingresa tu dominio (ej: `mediqueue.app`)
4. Sigue las instrucciones para agregar registros DNS
5. Espera verificación (puede tomar unos minutos)

**Dominio de Desarrollo:**
- Si no tienes dominio verificado, Resend te permite usar `onboarding@resend.dev`
- Solo podrás enviar emails a direcciones que agregues como "Audience"
- Límite: 100 emails/día en plan gratuito

---

## ⚙️ Configurar en MediQueue

### 1. Editar archivo `.env`

Abre el archivo `.env` en la raíz del proyecto backend y agrega/modifica:

```env
# ============================================
# RESEND API CONFIGURATION
# ============================================

# Tu API Key de Resend (REQUERIDO)
RESEND_API_KEY=re_TU_API_KEY_AQUI

# Dirección de remitente (debe ser del dominio verificado)
# En desarrollo puedes usar: onboarding@resend.dev
EMAIL_FROM=noreply@mediqueue.app

# Nombre del remitente
EMAIL_FROM_NAME=MediQueue

# URL del frontend (para enlaces en emails)
FRONTEND_URL=https://www.mediqueue.app
```

### 2. Ejemplo de Configuración

**Para Desarrollo Local:**
```env
RESEND_API_KEY=re_abc123xyz789
EMAIL_FROM=onboarding@resend.dev
EMAIL_FROM_NAME=MediQueue Dev
FRONTEND_URL=http://localhost:5173
```

**Para Producción:**
```env
RESEND_API_KEY=re_prod_key_123456
EMAIL_FROM=noreply@mediqueue.app
EMAIL_FROM_NAME=MediQueue
FRONTEND_URL=https://www.mediqueue.app
```

### 3. Reiniciar Servidor

Después de configurar, reinicia el servidor backend:

```bash
# Detener servidor actual (Ctrl+C)

# Reiniciar
npm run dev
```

---

## ✅ Verificar Configuración

Ejecuta el script de verificación:

```bash
node test-password-reset-system.js
```

Deberías ver:
```
✅ Servicio de email configurado
```

---

## 🧪 Probar Envío de Email

### Opción 1: Desde el Frontend

1. Ve a: `http://localhost:5173/admin/forgot-password`
2. Ingresa un email de administrador registrado
3. Click en "Enviar Enlace de Recuperación"
4. Revisa tu bandeja de entrada

### Opción 2: Desde la API (cURL)

```bash
curl -X POST http://localhost:3000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"s_email": "tu_email@ejemplo.com"}'
```

---

## 🐛 Solución de Problemas

### Error: "RESEND_API_KEY no configurada"

**Causa:** La variable de entorno no está en el archivo `.env`

**Solución:**
1. Verifica que `.env` existe en `MediQueue-Backend/`
2. Verifica que contiene `RESEND_API_KEY=...`
3. Reinicia el servidor

### Error: "API key is invalid"

**Causa:** La API key es incorrecta o expiró

**Solución:**
1. Ve a Resend dashboard
2. Verifica que la API key está activa
3. Si no funciona, genera una nueva
4. Actualiza `.env` con la nueva key

### Error: "Email not delivered"

**Causa:** Dominio no verificado o email en lista de spam

**Solución:**
1. Verifica tu dominio en Resend
2. Revisa carpeta de spam
3. En desarrollo, agrega el email destino a "Audience" en Resend

### Emails solo funcionan en desarrollo

**Causa:** Usando `onboarding@resend.dev` en producción

**Solución:**
1. Verifica tu dominio propio
2. Actualiza `EMAIL_FROM` en `.env`
3. Reinicia servidor

---

## 📊 Límites del Plan Gratuito

| Característica | Plan Gratuito | Plan Pro |
|----------------|---------------|----------|
| Emails/mes | 3,000 | 50,000+ |
| Emails/día | 100 | Ilimitado |
| Dominios | 1 | Ilimitados |
| API Keys | 5 | Ilimitadas |
| Webhooks | ✅ | ✅ |
| Soporte | Email | Email + Chat |

**Recomendación:** El plan gratuito es suficiente para desarrollo y proyectos pequeños.

---

## 📧 Tipos de Emails en MediQueue

1. **Verificación de Email** (`sendVerificationEmail`)
   - Enviado al crear cuenta de administrador
   - Enlace válido 24 horas
   - Template: Verificación de cuenta

2. **Recuperación de Contraseña** (`sendPasswordResetEmail`)
   - Enviado al solicitar reset de contraseña
   - Enlace válido 1 hora
   - Template: Recuperación de contraseña

3. **Bienvenida** (`sendWelcomeEmail`)
   - Enviado al verificar email exitosamente
   - Template: Bienvenida al sistema

---

## 🔒 Mejores Prácticas de Seguridad

1. **API Key:**
   - ❌ NO la subas a Git
   - ❌ NO la compartas públicamente
   - ✅ Usa variables de entorno
   - ✅ Usa diferentes keys para dev/prod

2. **Dominio:**
   - ✅ Verifica tu dominio propio
   - ✅ Configura SPF/DKIM/DMARC
   - ✅ Usa subdominios (ej: `noreply@mediqueue.app`)

3. **Emails:**
   - ✅ Incluye opción de "unsubscribe"
   - ✅ Usa templates profesionales
   - ✅ Incluye logo y branding

---

## 📚 Recursos Adicionales

- **Documentación Resend:** [https://resend.com/docs](https://resend.com/docs)
- **Dashboard Resend:** [https://resend.com/dashboard](https://resend.com/dashboard)
- **Status Page:** [https://status.resend.com](https://status.resend.com)
- **Soporte:** [https://resend.com/support](https://resend.com/support)

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Resend creada
- [ ] API Key generada
- [ ] API Key agregada a `.env`
- [ ] Variables `EMAIL_FROM` y `EMAIL_FROM_NAME` configuradas
- [ ] `FRONTEND_URL` configurada
- [ ] Servidor reiniciado
- [ ] Script de verificación ejecutado
- [ ] Email de prueba enviado exitosamente
- [ ] Dominio verificado (producción)

---

**Última actualización:** Noviembre 2024  
**Para soporte:** Contacta al equipo de desarrollo de MediQueue

