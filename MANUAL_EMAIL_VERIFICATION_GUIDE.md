# 🔧 Guía de Verificación Manual de Email - MediQueue

## 📋 Información de la Base de Datos

### Tabla: `Administrador`

La verificación de email se controla a través de los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `b_email_verified` | BOOLEAN | **CAMPO PRINCIPAL** - Indica si el email fue verificado (0 = No, 1 = Sí) |
| `s_verification_token` | VARCHAR(255) | Token único enviado por email para verificar |
| `d_verification_token_expires` | DATETIME | Fecha/hora de expiración del token |

---

## 🚨 Problema Actual

El correo de verificación llega correctamente y abre la pantalla de verificación, pero el proceso automático no actualiza la base de datos en producción.

---

## ✅ Solución: Verificación Manual

### Opción 1: Por Email del Administrador

```sql
UPDATE Administrador 
SET 
    b_email_verified = TRUE,
    s_verification_token = NULL,
    d_verification_token_expires = NULL,
    d_fecha_modificacion = NOW()
WHERE s_email = 'correo@del-admin.com';
```

### Opción 2: Por UUID del Administrador

```sql
UPDATE Administrador 
SET 
    b_email_verified = TRUE,
    s_verification_token = NULL,
    d_verification_token_expires = NULL,
    d_fecha_modificacion = NOW()
WHERE uk_administrador = 'uuid-del-administrador';
```

---

## 🔍 Consultas Útiles

### Ver administradores no verificados

```sql
SELECT 
    uk_administrador,
    s_nombre,
    s_apellido,
    s_email,
    b_email_verified,
    d_fecha_creacion
FROM Administrador
WHERE b_email_verified = FALSE
ORDER BY d_fecha_creacion DESC;
```

### Verificar el estado de un admin específico

```sql
SELECT 
    s_nombre,
    s_apellido,
    s_email,
    b_email_verified AS 'Verificado',
    d_fecha_modificacion AS 'Última Modificación'
FROM Administrador
WHERE s_email = 'correo@del-admin.com';
```

### Ver estadísticas de verificación

```sql
SELECT 
    CASE 
        WHEN b_email_verified = TRUE THEN 'Verificados'
        ELSE 'No Verificados'
    END AS 'Estado',
    COUNT(*) AS 'Cantidad'
FROM Administrador
GROUP BY b_email_verified;
```

---

## 🔧 Verificación Masiva

Si necesitas verificar a **TODOS** los administradores activos:

```sql
UPDATE Administrador 
SET 
    b_email_verified = TRUE,
    s_verification_token = NULL,
    d_verification_token_expires = NULL,
    d_fecha_modificacion = NOW()
WHERE b_email_verified = FALSE 
  AND ck_estado = 'ACTIVO';
```

---

## 📊 Acceso a la Base de Datos

### Railway (Producción)

1. Ve a tu proyecto en Railway
2. Selecciona el servicio de MySQL
3. Ve a la pestaña "Data" o "Connect"
4. Puedes usar:
   - **MySQL Workbench** con las credenciales de Railway
   - **TablePlus** 
   - **phpMyAdmin** (si está instalado)
   - **CLI de Railway**: `railway connect mysql`

### Credenciales

Busca en las variables de entorno de Railway:
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

---

## 🎯 Pasos Rápidos para Verificar un Admin

1. **Identificar el email del admin**
   ```sql
   SELECT s_email, s_nombre, s_apellido, b_email_verified 
   FROM Administrador 
   WHERE b_email_verified = FALSE;
   ```

2. **Verificar manualmente**
   ```sql
   UPDATE Administrador 
   SET b_email_verified = TRUE,
       s_verification_token = NULL,
       d_verification_token_expires = NULL
   WHERE s_email = 'email-del-admin@hospital.com';
   ```

3. **Confirmar la verificación**
   ```sql
   SELECT s_email, b_email_verified, d_fecha_modificacion 
   FROM Administrador 
   WHERE s_email = 'email-del-admin@hospital.com';
   ```

---

## 🐛 Investigar el Problema en Producción

### Revisar logs del backend

Si tienes acceso a los logs de Railway, busca:
- `[VERIFY EMAIL]` - Logs de verificación
- `[MODEL VERIFY]` - Logs del modelo
- Errores de base de datos

### Posibles causas del problema

1. **Timeout de conexión a la base de datos**
2. **Permisos insuficientes en la base de datos**
3. **Token no encontrado o expirado**
4. **Error de red entre el servicio y la base de datos**

### Verificar en código

Archivo principal: `MediQueue-Backend/src/models/Administrador.js`
- Línea 263: Método `verifyEmail(token)`
- Línea 317: Query UPDATE que actualiza `b_email_verified`

---

## 📝 Notas Importantes

- ✅ El campo `b_email_verified` debe ser `TRUE` (o `1`) para que el admin esté verificado
- ✅ Es seguro establecer `s_verification_token` a `NULL` después de verificar
- ✅ Siempre actualiza `d_fecha_modificacion` con `NOW()`
- ⚠️ No elimines el registro del administrador, solo actualiza el campo de verificación

---

## 🆘 Script Completo

Encontrarás todos los scripts SQL en:
```
MediQueue-Backend/manual-email-verification.sql
```

Este archivo contiene todas las consultas necesarias con ejemplos detallados.
