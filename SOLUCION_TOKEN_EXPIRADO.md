# ⏰ Solución: Token Expirado

## 🔍 Problema Identificado

```
Estado: ❌ Token Expirado
Generado: 11:12 AM
Expiró: 12:12 PM (1 hora después)
Intentado usar: 4:16 PM (más de 5 horas después)
Resultado: 304 minutos de retraso
```

---

## ✅ Solución Rápida (Recomendada)

### 1. **Limpiar Token Expirado**

```bash
cd MediQueue-Backend
node clean-expired-tokens.js
```

### 2. **Solicitar Nuevo Enlace**

1. Ve a: `http://localhost:3001/admin/forgot-password`
2. Ingresa: `epalacios6@ucol.mx`
3. Click: "Enviar Enlace de Recuperación"
4. **Revisa tu email INMEDIATAMENTE**
5. **Haz click en el enlace DENTRO DE 1 HORA**
6. Cambia tu contraseña
7. ✅ Listo

---

## ⏰ Configuración Actual

**Tiempo de expiración:** 1 hora

**Ubicación del código:**
```javascript
// MediQueue-Backend/src/models/Administrador.js (línea 455)
const tokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora
```

**Por qué 1 hora:**
- ✅ Estándar de seguridad en la industria
- ✅ Usado por Google, Microsoft, Facebook
- ✅ Balance entre seguridad y usabilidad

---

## 🔧 Cambiar Tiempo de Expiración (Para Desarrollo)

Si necesitas más tiempo durante el desarrollo/testing, puedes modificar:

### **Opción 1: 2 horas**
```javascript
const tokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas
```

### **Opción 2: 24 horas (solo para testing)**
```javascript
const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
```

### **Opción 3: Variable de entorno (Recomendado)**

1. **Agregar a `.env`:**
```env
# Tiempo de expiración de tokens de reset (en minutos)
RESET_TOKEN_EXPIRY_MINUTES=60
```

2. **Modificar el código:**
```javascript
// En MediQueue-Backend/src/models/Administrador.js
const expiryMinutes = process.env.RESET_TOKEN_EXPIRY_MINUTES || 60;
const tokenExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);
```

3. **Para desarrollo, cambia en `.env`:**
```env
RESET_TOKEN_EXPIRY_MINUTES=120  # 2 horas
```

4. **Para producción:**
```env
RESET_TOKEN_EXPIRY_MINUTES=60   # 1 hora
```

**⚠️ Importante:** No uses más de 24 horas en producción por seguridad.

---

## 📊 Comparación de Tiempos

| Servicio | Tiempo de Expiración |
|----------|---------------------|
| Gmail/Google | 60 minutos |
| Microsoft | 60 minutos |
| Facebook | 15 minutos |
| Amazon | 60 minutos |
| GitHub | 60 minutos |
| **MediQueue** | **60 minutos** ✅ |

---

## 🧪 Probar con Token Fresco

### **Prueba Completa:**

```bash
# 1. Limpiar tokens viejos
node clean-expired-tokens.js

# 2. Terminal 1 - Ver logs del backend en tiempo real
npm run dev

# 3. Terminal 2 - En otra ventana, verifica el estado
watch -n 5 "mysql -u root -p mediqueue -e 'SELECT s_email, d_reset_password_expires, TIMESTAMPDIFF(MINUTE, NOW(), d_reset_password_expires) as minutes_left FROM Administrador WHERE s_reset_password_token IS NOT NULL;'"
```

### **Flujo Rápido:**

1. **Solicita recuperación** (Frontend)
2. **Abre el email** (< 30 segundos)
3. **Click en el enlace** (< 1 minuto)
4. **Cambia contraseña** (< 2 minutos)
5. ✅ **Total: < 3 minutos**

---

## ⚠️ Errores Comunes

### **Error 1: "Token expirado"**
**Causa:** Pasó más de 1 hora
**Solución:** Solicitar nuevo enlace

### **Error 2: "Token inválido"**
**Causa:** Token ya fue usado o no existe
**Solución:** Solicitar nuevo enlace

### **Error 3: "Email no enviado"**
**Causa:** Problema con Resend
**Solución:** Verificar RESEND_API_KEY

---

## 📋 Checklist de Verificación

- [ ] Token expirado limpiado
- [ ] Servidor backend corriendo
- [ ] Frontend corriendo
- [ ] Email verificado en Resend
- [ ] Nuevo enlace solicitado
- [ ] Email recibido inmediatamente
- [ ] Click en enlace dentro de 1 hora
- [ ] Contraseña cambiada exitosamente

---

## 🎯 Recomendación Final

**Para Desarrollo:**
- Mantén 1 hora (o aumenta a 2 horas si trabajas lento)
- No olvides solicitar nuevo enlace si tardas mucho

**Para Producción:**
- **Mantén 1 hora** (seguridad estándar)
- Agrega mensaje claro al usuario sobre la expiración
- El email ya incluye la advertencia: "Este enlace expirará en 1 hora"

---

## ✅ El Sistema Funciona Correctamente

No hay ningún bug. El sistema está funcionando exactamente como debe:
- ✅ Genera tokens correctos (64 caracteres)
- ✅ Los guarda en la BD correctamente
- ✅ Los envía por email correctamente
- ✅ Los valida correctamente
- ✅ Expiran en 1 hora (seguridad estándar)

**El único "problema" es usar un token después de 1 hora, que es el comportamiento correcto por seguridad.**

---

**Última actualización:** Noviembre 22, 2024

