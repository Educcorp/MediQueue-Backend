# 🧪 Instrucciones para Prueba Completa del Sistema

## 📋 Problema Detectado

El token de recuperación se está truncando a solo 17 caracteres cuando debería tener 64.

**Diagnóstico:**
- ✅ Tokens se generan correctamente (64 caracteres)
- ✅ Tokens se guardan correctamente en BD (64 caracteres)
- ❌ Token en el frontend solo tiene 17 caracteres
- ❌ Tokens anteriores ya expiraron (> 1 hora)

---

## ✅ Preparación

### 1. Limpiar Tokens Expirados (Ya hecho)
```bash
node clean-expired-tokens.js
```
✅ Completado - 2 tokens limpiados

### 2. Verificar Servidor Backend
Asegurate de que el servidor backend esté corriendo:
```bash
npm run dev
```

### 3. Verificar Frontend
Asegurate de que el frontend esté corriendo en puerto 3001.

---

## 🧪 Prueba Paso a Paso

### **Paso 1: Solicitar Recuperación**

1. Abre el navegador en:
   ```
   http://localhost:3001/admin/forgot-password
   ```

2. Ingresa un email registrado (ejemplo):
   ```
   epalacios6@ucol.mx
   ```

3. Click en "Enviar Enlace de Recuperación"

4. Deberías ver mensaje de éxito

---

### **Paso 2: Verificar el Email**

1. **Abre tu bandeja de entrada** (epalacios6@ucol.mx)

2. **Busca el email** de "MediQueue"
   - Asunto: "Recuperación de Contraseña - MediQueue"

3. **ANTES de hacer click**, haz lo siguiente:
   
   a. **Pasa el mouse sobre el botón** "Restablecer Contraseña"
   
   b. **En la esquina inferior del navegador verás la URL**
   
   c. **Copia esa URL completa** (botón derecho → Copiar dirección del enlace)
   
   d. **Pégala en un editor de texto** (Notepad, VSCode, etc.)
   
   e. **Verifica la URL:**
      ```
      http://localhost:3001/admin/reset-password?token=XXXXXXXXX...
      ```
   
   f. **Cuenta los caracteres del token:**
      - Copia solo lo que viene después de `token=`
      - Pégalo en un contador de caracteres online o usa `console.log(token.length)`
      - **Debe tener 64 caracteres**

---

### **Paso 3: Prueba con Debugging**

1. **Abre las DevTools** del navegador (F12)

2. **Ve a la pestaña Console**

3. **Limpia la consola** (icono 🚫 o Ctrl+L)

4. **Ahora SÍ, haz click en el enlace** del email

5. **En la consola verás:**
   ```
   ═══════════════════════════════════════════════════════════════
   🔍 DEBUG - Token Capturado:
      Token completo: XXXXXXXXX...
      Longitud del token: XX
      Primeros 20 caracteres: XXXXXXXXXXXXXXXXXXXX
      URL completa: http://localhost:3001/admin/reset-password?token=...
   ═══════════════════════════════════════════════════════════════
   ```

6. **Copia toda esta información** y guárdala

---

### **Paso 4: Análisis de Resultados**

#### **✅ Caso A: Token tiene 64 caracteres**

Si el log muestra "Longitud del token: 64", entonces:
- ✅ El problema NO es el token
- ⚠️ El problema puede ser que el token YA EXPIRÓ
- **Solución:** Solicita un nuevo enlace (vuelve al Paso 1)

#### **❌ Caso B: Token tiene menos de 64 caracteres**

Si el log muestra "Longitud del token: 17" (o cualquier número < 64):

**Problema identificado:** El token está siendo truncado

**Posibles causas:**

1. **El email tiene la URL incompleta**
   - Verifica la URL del Paso 2f
   - Si la URL del email tiene el token completo, el problema es del frontend
   - Si la URL del email tiene el token incompleto, el problema es del backend

2. **React Router está cortando la URL**
   - Problema con useSearchParams()
   - Necesitamos usar una alternativa

3. **El servidor web está cortando la URL**
   - Configuración de límite de URL

---

## 🔧 Soluciones según el Caso

### **Si la URL del email está incompleta:**

Verificar el código que genera el email:
```javascript
// En emailService.js
const resetUrl = `${frontendUrl}/admin/reset-password?token=${resetToken}`;
```

Agregar log para verificar:
```javascript
console.log('🔗 URL generada:', resetUrl);
console.log('🔗 Longitud del token:', resetToken.length);
```

---

### **Si la URL del email está completa pero el frontend la corta:**

Opción 1: Usar window.location directamente
```javascript
// En ResetPassword.jsx
const token = new URLSearchParams(window.location.search).get('token');
```

Opción 2: Verificar que no haya procesamiento intermedio
```javascript
useEffect(() => {
  const fullUrl = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  console.log('Full URL:', fullUrl);
  console.log('Token length:', tokenFromUrl?.length);
  console.log('Token:', tokenFromUrl);
}, []);
```

---

## 📊 Información que Necesitamos

Por favor proporciona:

1. **Logs de la consola del navegador** (todo el bloque de DEBUG)

2. **URL completa del email** (del Paso 2f)

3. **Longitud del token en el email**

4. **Screenshot de la consola** (opcional pero útil)

Con esta información podremos identificar exactamente dónde se está cortando el token.

---

## 🎯 Prueba Rápida Alternativa

Si no quieres esperar el email, puedes probar directamente:

1. **Genera un token de prueba:**
   ```bash
   node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('hex'));"
   ```

2. **Copia el token** (64 caracteres)

3. **Insértalo manualmente en la BD:**
   ```sql
   UPDATE Administrador 
   SET s_reset_password_token = 'TU_TOKEN_AQUI',
       d_reset_password_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR)
   WHERE s_email = 'epalacios6@ucol.mx';
   ```

4. **Construye la URL manualmente:**
   ```
   http://localhost:3001/admin/reset-password?token=TU_TOKEN_AQUI
   ```

5. **Pégala en el navegador** y prueba

---

## ✅ Checklist de Verificación

- [ ] Tokens expirados limpiados
- [ ] Servidor backend corriendo
- [ ] Frontend corriendo en puerto 3001
- [ ] Nuevo enlace de recuperación solicitado
- [ ] Email recibido
- [ ] URL del email copiada y verificada
- [ ] DevTools abierta en Console
- [ ] Logs de DEBUG capturados
- [ ] Información compartida para análisis

---

**Última actualización:** Noviembre 22, 2024

