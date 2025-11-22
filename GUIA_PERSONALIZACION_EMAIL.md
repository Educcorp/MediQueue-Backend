# 📧 Guía para Personalizar el Email de Recuperación de Contraseña

## 📍 Ubicación del Template

**Archivo:** `MediQueue-Backend/src/services/emailService.js`
**Método:** `sendPasswordResetEmail()`
**Líneas:** 286-372

---

## 🎨 Elementos Personalizables

### 1. **Asunto del Email** (Línea 285)
```javascript
subject: 'Recuperación de Contraseña - MediQueue',
```

**Puedes cambiar a:**
- `'Restablece tu Contraseña - MediQueue'`
- `'Solicitud de Cambio de Contraseña'`
- `'Recupera el Acceso a tu Cuenta'`

---

### 2. **Título Principal** (Línea 305)
```html
<h1 style="...">Recuperación de Contraseña</h1>
```

**Personaliza el texto y estilo:**
```html
<h1 style="font-size:28px;color:#4a90a4;">¡Recupera tu Acceso!</h1>
```

---

### 3. **Mensaje de Saludo** (Líneas 307-309)
```html
<p>Hola <strong>${nombre}</strong>,</p>
```

**Cambia a un tono más formal o casual:**
```html
<p>Estimado/a <strong>${nombre} ${apellido}</strong>,</p>
```

O más casual:
```html
<p>¡Hola ${nombre}! 👋</p>
```

---

### 4. **Texto del Cuerpo** (Líneas 311-316)
```html
<p>Hemos recibido una solicitud para restablecer la contraseña...</p>
<p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
```

**Personaliza el mensaje:**
```html
<p>Has solicitado restablecer tu contraseña de administrador en MediQueue.</p>
<p>Para continuar con el proceso, haz clic aquí:</p>
```

---

### 5. **Texto del Botón** (Línea 323)
```html
Restablecer Contraseña
```

**Opciones alternativas:**
- `Crear Nueva Contraseña`
- `Cambiar Contraseña`
- `Actualizar Contraseña`
- `Continuar`

---

### 6. **Colores del Botón** (Línea 321)
```html
<td style="background-color:#4a90a4;...">
```

**Cambia el color del botón:**
- `#4a90a4` - Azul turquesa (actual)
- `#1a73e8` - Azul Google
- `#34a853` - Verde
- `#ea4335` - Rojo
- `#0066cc` - Azul oscuro

---

### 7. **Tiempo de Expiración** (Línea 341)
```html
Este enlace expirará en <strong>1 hora</strong> por seguridad.
```

**Si cambias el tiempo en el código, actualízalo aquí también.**

---

### 8. **Mensaje de Seguridad** (Líneas 353-356)
```html
<p>Si no solicitaste el restablecimiento de tu contraseña...</p>
```

**Personaliza según tu política de seguridad.**

---

## 🎨 Ejemplo de Personalización Completa

```javascript
async sendPasswordResetEmail(email, nombre, resetToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://www.mediqueue.app';
  const resetUrl = `${frontendUrl}/admin/reset-password?token=${resetToken}`;

  const { data, error } = await this.resend.emails.send({
    from: `${this.fromName} <${this.fromEmail}>`,
    to: email,
    subject: '🔐 Restablece tu Contraseña - MediQueue', // ← PERSONALIZADO
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:20px;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;">
  
  <!-- Logo -->
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
    <tr>
      <td style="vertical-align:middle;padding-right:12px;">
        <img src="https://www.mediqueue.app/images/mediqueue_logo.png" alt="MediQueue" width="150" />
      </td>
      <td style="vertical-align:middle;">
        <span style="font-size:24px;color:#4a90a4;font-weight:bold;">MediQueue®</span>
      </td>
    </tr>
  </table>
  
  <!-- Título Principal - PERSONALIZADO -->
  <h1 style="font-size:32px;color:#4a90a4;font-weight:bold;margin:0 0 30px 0;text-align:center;">
    ¡Recupera tu Acceso! 🔓
  </h1>
  
  <!-- Saludo - PERSONALIZADO -->
  <p style="font-size:16px;color:#202124;line-height:1.6;margin:0 0 15px 0;">
    <strong>Hola ${nombre},</strong> 👋
  </p>
  
  <!-- Cuerpo del Mensaje - PERSONALIZADO -->
  <p style="font-size:14px;color:#202124;line-height:1.6;margin:0 0 15px 0;">
    Has solicitado restablecer tu contraseña de administrador. No te preocupes, ¡pasa todo el tiempo!
  </p>
  
  <p style="font-size:14px;color:#202124;line-height:1.6;margin:0 0 25px 0;">
    Para crear una nueva contraseña segura, solo haz clic en el botón de abajo:
  </p>
  
  <!-- Botón - PERSONALIZADO (color verde) -->
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 25px auto;">
    <tr>
      <td style="background-color:#34a853;border-radius:8px;padding:14px 32px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
        <a href="${resetUrl}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;display:block;">
          🔐 Crear Nueva Contraseña
        </a>
      </td>
    </tr>
  </table>
  
  <!-- Enlace alternativo -->
  <p style="font-size:13px;color:#5f6368;margin:0 0 10px 0;text-align:center;">
    ¿El botón no funciona? Copia y pega este enlace:
  </p>
  
  <p style="margin:0 0 25px 0;text-align:center;">
    <a href="${resetUrl}" style="color:#1a73e8;font-size:12px;word-break:break-all;">${resetUrl}</a>
  </p>
  
  <!-- Advertencia de tiempo - PERSONALIZADO -->
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#fff3cd;border-radius:8px;margin:0 0 20px 0;border-left:4px solid:#ffc107;">
    <tr>
      <td style="padding:16px;">
        <p style="margin:0;font-size:14px;color:#856404;">
          ⏰ <strong>Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por tu seguridad.
        </p>
      </td>
    </tr>
  </table>
  
  <!-- Mensaje de seguridad - PERSONALIZADO -->
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f8d7da;border-radius:8px;margin:0 0 20px 0;border-left:4px solid #dc3545;">
    <tr>
      <td style="padding:16px;">
        <p style="margin:0 0 8px 0;font-size:14px;color:#721c24;font-weight:600;">
          🔒 Nota de Seguridad
        </p>
        <p style="margin:0;font-size:13px;color:#721c24;line-height:1.5;">
          Si NO solicitaste este cambio, ignora este correo. Tu contraseña actual permanecerá segura.
        </p>
      </td>
    </tr>
  </table>
  
  <!-- Pie de página - PERSONALIZADO -->
  <p style="font-size:13px;color:#5f6368;margin:20px 0 0 0;text-align:center;">
    Atentamente,<br>
    <strong>El Equipo de MediQueue</strong> 💙
  </p>
  
</body>
</html>`
  });
  
  // ... resto del código
}
```

---

## 🔧 Cómo Aplicar los Cambios

1. **Abre el archivo:**
   ```
   MediQueue-Backend/src/services/emailService.js
   ```

2. **Busca el método `sendPasswordResetEmail`** (línea 266)

3. **Modifica el HTML dentro de la propiedad `html`**

4. **Guarda el archivo**

5. **Reinicia el servidor backend:**
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

6. **Prueba enviando un email de recuperación**

---

## 📝 Consejos de Diseño

### ✅ Buenas Prácticas:
- Usa colores consistentes con tu marca
- Mantén el mensaje claro y conciso
- Incluye siempre el enlace alternativo (por si el botón no funciona)
- Usa un tono apropiado para tu audiencia
- Incluye advertencias de seguridad

### ❌ Evita:
- Demasiado texto (la gente no lee emails largos)
- Colores muy brillantes o difíciles de leer
- Múltiples botones (confunde al usuario)
- Jerga técnica innecesaria

---

## 🎨 Variables Disponibles

Dentro del template HTML puedes usar estas variables:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `${nombre}` | Nombre del admin | Emmanuel |
| `${resetUrl}` | URL completa con token | http://...?token=xxx |
| `${frontendUrl}` | URL del frontend | http://localhost:3001 |

**Nota:** Si necesitas más variables (como apellido), debes:
1. Agregarlas como parámetros al método
2. Pasarlas desde el controlador
3. Usarlas en el template

---

## 🧪 Probar los Cambios

Después de personalizar, prueba con:

```bash
# Ejecuta este script para enviar un email de prueba
node quick-test-with-owner-email.js
```

O desde el frontend:
```
http://localhost:3001/admin/forgot-password
```

---

**Última actualización:** Noviembre 2024

