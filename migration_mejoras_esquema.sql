-- =============================================
-- MIGRACIÓN: MEJORAS DE ESQUEMA MEDIQUEUE
-- =============================================
-- Este script migra la base de datos actual a la estructura mejorada
-- Basado en las mejores prácticas de GESPO

-- =============================================
-- PASO 1: CREAR NUEVAS TABLAS CON ESTRUCTURA MEJORADA
-- =============================================

-- Tabla: Area (Mejorada)
CREATE TABLE Area_Nueva (
    uk_area CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    s_nombre_area VARCHAR(100) NOT NULL UNIQUE,
    ck_estado CHAR(6) NOT NULL DEFAULT 'ACTIVO' CHECK (ck_estado IN ('ACTIVO', 'INACTIVO')),
    d_fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    d_fecha_modificacion DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    uk_usuario_creacion CHAR(36) NULL,
    uk_usuario_modificacion CHAR(36) NULL,
    INDEX idx_area_estado (ck_estado),
    INDEX idx_area_nombre (s_nombre_area)
);

-- Tabla: Consultorio (Mejorada)
CREATE TABLE Consultorio_Nuevo (
    uk_consultorio CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    i_numero_consultorio INT NOT NULL,
    uk_area CHAR(36) NOT NULL,
    ck_estado CHAR(6) NOT NULL DEFAULT 'ACTIVO' CHECK (ck_estado IN ('ACTIVO', 'INACTIVO')),
    d_fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    d_fecha_modificacion DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    uk_usuario_creacion CHAR(36) NULL,
    uk_usuario_modificacion CHAR(36) NULL,
    FOREIGN KEY (uk_area) REFERENCES Area_Nueva(uk_area) ON DELETE RESTRICT,
    UNIQUE KEY uk_consultorio_area (i_numero_consultorio, uk_area),
    INDEX idx_consultorio_estado (ck_estado),
    INDEX idx_consultorio_area (uk_area)
);

-- Tabla: Administrador (Mejorada)
CREATE TABLE Administrador_Nuevo (
    uk_administrador CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    s_nombre VARCHAR(100) NOT NULL,
    s_apellido VARCHAR(100) NOT NULL,
    s_email VARCHAR(255) NOT NULL UNIQUE,
    s_usuario VARCHAR(50) NOT NULL UNIQUE,
    s_password_hash VARCHAR(255) NOT NULL,
    c_telefono CHAR(15) NULL,
    tipo_usuario INT NOT NULL DEFAULT 1 CHECK (tipo_usuario IN (1, 2)), -- 1=Admin, 2=Supervisor
    ck_estado CHAR(6) NOT NULL DEFAULT 'ACTIVO' CHECK (ck_estado IN ('ACTIVO', 'INACTIVO')),
    d_fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    d_fecha_modificacion DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    uk_usuario_creacion CHAR(36) NULL,
    uk_usuario_modificacion CHAR(36) NULL,
    INDEX idx_admin_estado (ck_estado),
    INDEX idx_admin_email (s_email),
    INDEX idx_admin_usuario (s_usuario)
);

-- Tabla: Paciente (Mejorada)
CREATE TABLE Paciente_Nuevo (
    uk_paciente CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    s_nombre VARCHAR(100) NOT NULL,
    s_apellido VARCHAR(100) NOT NULL,
    c_telefono CHAR(15) NOT NULL UNIQUE,
    d_fecha_nacimiento DATE NOT NULL,
    s_password_hash VARCHAR(255) NULL, -- NULL para pacientes públicos
    s_email VARCHAR(255) NULL UNIQUE,
    ck_estado CHAR(6) NOT NULL DEFAULT 'ACTIVO' CHECK (ck_estado IN ('ACTIVO', 'INACTIVO')),
    d_fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    d_fecha_modificacion DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    uk_usuario_creacion CHAR(36) NULL,
    uk_usuario_modificacion CHAR(36) NULL,
    INDEX idx_paciente_estado (ck_estado),
    INDEX idx_paciente_telefono (c_telefono),
    INDEX idx_paciente_email (s_email),
    INDEX idx_paciente_nombre (s_nombre, s_apellido)
);

-- Tabla: Turno (Mejorada)
CREATE TABLE Turno_Nuevo (
    uk_turno CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    i_numero_turno INT NOT NULL,
    s_estado VARCHAR(20) NOT NULL DEFAULT 'EN_ESPERA' 
        CHECK (s_estado IN ('EN_ESPERA', 'LLAMANDO', 'ATENDIDO', 'CANCELADO', 'NO_PRESENTE')),
    d_fecha DATE NOT NULL DEFAULT (CURDATE()),
    t_hora TIME NOT NULL DEFAULT (CURTIME()),
    uk_paciente CHAR(36) NULL, -- NULL para turnos sin paciente registrado
    uk_consultorio CHAR(36) NOT NULL,
    uk_administrador CHAR(36) NOT NULL,
    s_observaciones TEXT NULL,
    d_fecha_atencion DATETIME NULL,
    d_fecha_cancelacion DATETIME NULL,
    ck_estado CHAR(6) NOT NULL DEFAULT 'ACTIVO' CHECK (ck_estado IN ('ACTIVO', 'INACTIVO')),
    d_fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    d_fecha_modificacion DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    uk_usuario_creacion CHAR(36) NULL,
    uk_usuario_modificacion CHAR(36) NULL,
    FOREIGN KEY (uk_paciente) REFERENCES Paciente_Nuevo(uk_paciente) ON DELETE SET NULL,
    FOREIGN KEY (uk_consultorio) REFERENCES Consultorio_Nuevo(uk_consultorio) ON DELETE RESTRICT,
    FOREIGN KEY (uk_administrador) REFERENCES Administrador_Nuevo(uk_administrador) ON DELETE RESTRICT,
    UNIQUE KEY uk_turno_dia_numero (i_numero_turno, d_fecha),
    INDEX idx_turno_estado (s_estado),
    INDEX idx_turno_fecha (d_fecha),
    INDEX idx_turno_consultorio (uk_consultorio),
    INDEX idx_turno_paciente (uk_paciente)
);

-- Tabla: Historial_Turnos (Nueva)
CREATE TABLE Historial_Turnos (
    uk_historial CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    uk_turno CHAR(36) NOT NULL,
    s_accion VARCHAR(50) NOT NULL, -- CREAR, ACTUALIZAR, CANCELAR, ATENDER, etc.
    s_estado_anterior VARCHAR(20) NULL,
    s_estado_nuevo VARCHAR(20) NULL,
    s_observaciones TEXT NULL,
    uk_usuario_accion CHAR(36) NOT NULL, -- Quien realizó la acción
    d_fecha_accion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uk_turno) REFERENCES Turno_Nuevo(uk_turno) ON DELETE CASCADE,
    INDEX idx_historial_turno (uk_turno),
    INDEX idx_historial_fecha (d_fecha_accion)
);

-- Tabla: Configuracion_Sistema (Nueva)
CREATE TABLE Configuracion_Sistema (
    uk_configuracion CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    s_clave VARCHAR(100) NOT NULL UNIQUE,
    s_valor TEXT NOT NULL,
    s_descripcion VARCHAR(255) NULL,
    ck_estado CHAR(6) NOT NULL DEFAULT 'ACTIVO' CHECK (ck_estado IN ('ACTIVO', 'INACTIVO')),
    d_fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    d_fecha_modificacion DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    uk_usuario_creacion CHAR(36) NULL,
    uk_usuario_modificacion CHAR(36) NULL,
    INDEX idx_config_clave (s_clave)
);

-- =============================================
-- PASO 2: MIGRAR DATOS EXISTENTES
-- =============================================

-- Migrar Areas
INSERT INTO Area_Nueva (s_nombre_area, d_fecha_creacion, uk_usuario_creacion)
SELECT 
    nombre_area,
    NOW(),
    (SELECT uk_administrador FROM Administrador_Nuevo LIMIT 1)
FROM Area;

-- Migrar Administradores
INSERT INTO Administrador_Nuevo (s_nombre, s_apellido, s_email, s_usuario, s_password_hash, d_fecha_creacion, uk_usuario_creacion)
SELECT 
    nombre,
    'Administrador', -- Apellido por defecto
    email,
    SUBSTRING_INDEX(email, '@', 1), -- Usuario basado en email
    password,
    NOW(),
    (SELECT uk_administrador FROM Administrador_Nuevo LIMIT 1)
FROM Administrador;

-- Migrar Pacientes
INSERT INTO Paciente_Nuevo (s_nombre, s_apellido, c_telefono, d_fecha_nacimiento, s_password_hash, d_fecha_creacion, uk_usuario_creacion)
SELECT 
    nombre,
    apellido,
    telefono,
    fecha_nacimiento,
    password,
    NOW(),
    (SELECT uk_administrador FROM Administrador_Nuevo LIMIT 1)
FROM Paciente;

-- Migrar Consultorios
INSERT INTO Consultorio_Nuevo (i_numero_consultorio, uk_area, d_fecha_creacion, uk_usuario_creacion)
SELECT 
    c.numero_consultorio,
    an.uk_area,
    NOW(),
    (SELECT uk_administrador FROM Administrador_Nuevo LIMIT 1)
FROM Consultorio c
JOIN Area a ON c.id_area = a.id_area
JOIN Area_Nueva an ON a.nombre_area = an.s_nombre_area;

-- Migrar Turnos
INSERT INTO Turno_Nuevo (
    i_numero_turno, 
    s_estado, 
    d_fecha, 
    t_hora, 
    uk_paciente, 
    uk_consultorio, 
    uk_administrador,
    d_fecha_creacion,
    uk_usuario_creacion
)
SELECT 
    t.numero_turno,
    CASE 
        WHEN t.estado = 'En espera' THEN 'EN_ESPERA'
        WHEN t.estado = 'Llamando' THEN 'LLAMANDO'
        WHEN t.estado = 'Atendido' THEN 'ATENDIDO'
        WHEN t.estado = 'Cancelado' THEN 'CANCELADO'
        ELSE 'EN_ESPERA'
    END,
    t.fecha,
    t.hora,
    pn.uk_paciente,
    cn.uk_consultorio,
    an.uk_administrador,
    NOW(),
    an.uk_administrador
FROM Turno t
LEFT JOIN Paciente p ON t.id_paciente = p.id_paciente
LEFT JOIN Paciente_Nuevo pn ON p.telefono = pn.c_telefono
JOIN Consultorio c ON t.id_consultorio = c.id_consultorio
JOIN Consultorio_Nuevo cn ON c.numero_consultorio = cn.i_numero_consultorio
JOIN Administrador a ON t.id_administrador = a.id_administrador
JOIN Administrador_Nuevo an ON a.email = an.s_email;

-- =============================================
-- PASO 3: CREAR TRIGGERS PARA AUDITORÍA
-- =============================================

DELIMITER $$

-- Trigger para Historial_Turnos
CREATE TRIGGER tr_turno_historial_insert
AFTER INSERT ON Turno_Nuevo
FOR EACH ROW
BEGIN
    INSERT INTO Historial_Turnos (uk_turno, s_accion, s_estado_nuevo, uk_usuario_accion)
    VALUES (NEW.uk_turno, 'CREAR', NEW.s_estado, NEW.uk_usuario_creacion);
END$$

CREATE TRIGGER tr_turno_historial_update
AFTER UPDATE ON Turno_Nuevo
FOR EACH ROW
BEGIN
    IF OLD.s_estado != NEW.s_estado THEN
        INSERT INTO Historial_Turnos (uk_turno, s_accion, s_estado_anterior, s_estado_nuevo, uk_usuario_accion)
        VALUES (NEW.uk_turno, 'ACTUALIZAR_ESTADO', OLD.s_estado, NEW.s_estado, NEW.uk_usuario_modificacion);
    END IF;
    
    IF OLD.s_observaciones != NEW.s_observaciones THEN
        INSERT INTO Historial_Turnos (uk_turno, s_accion, s_observaciones, uk_usuario_accion)
        VALUES (NEW.uk_turno, 'ACTUALIZAR_OBSERVACIONES', NEW.s_observaciones, NEW.uk_usuario_modificacion);
    END IF;
END$$

DELIMITER ;

-- =============================================
-- PASO 4: CREAR VISTAS ÚTILES
-- =============================================

-- Vista: Turnos con información completa
CREATE VIEW vw_turnos_completos AS
SELECT 
    t.uk_turno,
    t.i_numero_turno,
    t.s_estado,
    t.d_fecha,
    t.t_hora,
    CONCAT(COALESCE(p.s_nombre, 'Paciente'), ' ', COALESCE(p.s_apellido, 'Invitado')) as s_paciente_completo,
    p.c_telefono,
    c.i_numero_consultorio,
    a.s_nombre_area,
    CONCAT(ad.s_nombre, ' ', ad.s_apellido) as s_administrador_completo,
    t.s_observaciones,
    t.d_fecha_atencion,
    t.d_fecha_cancelacion
FROM Turno_Nuevo t
LEFT JOIN Paciente_Nuevo p ON t.uk_paciente = p.uk_paciente
JOIN Consultorio_Nuevo c ON t.uk_consultorio = c.uk_consultorio
JOIN Area_Nueva a ON c.uk_area = a.uk_area
JOIN Administrador_Nuevo ad ON t.uk_administrador = ad.uk_administrador
WHERE t.ck_estado = 'ACTIVO';

-- Vista: Estadísticas diarias
CREATE VIEW vw_estadisticas_diarias AS
SELECT 
    d_fecha,
    COUNT(*) as total_turnos,
    COUNT(CASE WHEN s_estado = 'EN_ESPERA' THEN 1 END) as en_espera,
    COUNT(CASE WHEN s_estado = 'LLAMANDO' THEN 1 END) as llamando,
    COUNT(CASE WHEN s_estado = 'ATENDIDO' THEN 1 END) as atendidos,
    COUNT(CASE WHEN s_estado = 'CANCELADO' THEN 1 END) as cancelados,
    COUNT(CASE WHEN s_estado = 'NO_PRESENTE' THEN 1 END) as no_presente
FROM Turno_Nuevo
WHERE ck_estado = 'ACTIVO'
GROUP BY d_fecha;

-- =============================================
-- PASO 5: INSERTAR CONFIGURACIONES INICIALES
-- =============================================

INSERT INTO Configuracion_Sistema (s_clave, s_valor, s_descripcion, uk_usuario_creacion) VALUES
('HORARIO_INICIO', '08:00', 'Hora de inicio de atención', (SELECT uk_administrador FROM Administrador_Nuevo LIMIT 1)),
('HORARIO_FIN', '17:00', 'Hora de fin de atención', (SELECT uk_administrador FROM Administrador_Nuevo LIMIT 1)),
('TIEMPO_LLAMADA', '300', 'Tiempo en segundos para llamar turno', (SELECT uk_administrador FROM Administrador_Nuevo LIMIT 1)),
('MOSTRAR_ULTIMOS_TURNOS', '6', 'Número de últimos turnos a mostrar en pantalla pública', (SELECT uk_administrador FROM Administrador_Nuevo LIMIT 1));

-- =============================================
-- PASO 6: RENOMBRAR TABLAS (OPCIONAL - SOLO SI TODO ESTÁ CORRECTO)
-- =============================================

-- IMPORTANTE: Solo ejecutar estos comandos después de verificar que todo funciona correctamente
-- y hacer un respaldo completo de la base de datos

/*
-- Renombrar tablas antiguas
RENAME TABLE Area TO Area_Backup;
RENAME TABLE Consultorio TO Consultorio_Backup;
RENAME TABLE Administrador TO Administrador_Backup;
RENAME TABLE Paciente TO Paciente_Backup;
RENAME TABLE Turno TO Turno_Backup;

-- Renombrar tablas nuevas
RENAME TABLE Area_Nueva TO Area;
RENAME TABLE Consultorio_Nuevo TO Consultorio;
RENAME TABLE Administrador_Nuevo TO Administrador;
RENAME TABLE Paciente_Nuevo TO Paciente;
RENAME TABLE Turno_Nuevo TO Turno;
*/

-- =============================================
-- VERIFICACIONES POST-MIGRACIÓN
-- =============================================

-- Verificar conteo de registros
SELECT 'Areas' as tabla, COUNT(*) as registros FROM Area_Nueva
UNION ALL
SELECT 'Consultorios', COUNT(*) FROM Consultorio_Nuevo
UNION ALL
SELECT 'Administradores', COUNT(*) FROM Administrador_Nuevo
UNION ALL
SELECT 'Pacientes', COUNT(*) FROM Paciente_Nuevo
UNION ALL
SELECT 'Turnos', COUNT(*) FROM Turno_Nuevo;

-- Verificar integridad referencial
SELECT 'Turnos sin consultorio válido' as verificacion, COUNT(*) as cantidad
FROM Turno_Nuevo t
LEFT JOIN Consultorio_Nuevo c ON t.uk_consultorio = c.uk_consultorio
WHERE c.uk_consultorio IS NULL;

SELECT 'Turnos sin administrador válido' as verificacion, COUNT(*) as cantidad
FROM Turno_Nuevo t
LEFT JOIN Administrador_Nuevo a ON t.uk_administrador = a.uk_administrador
WHERE a.uk_administrador IS NULL;

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================

/*
1. Este script debe ejecutarse en un entorno de pruebas primero
2. Hacer respaldo completo de la base de datos antes de ejecutar
3. Verificar que todos los datos se migraron correctamente
4. Actualizar el código de la aplicación para usar los nuevos nombres de campos
5. Los triggers de auditoría se activarán automáticamente
6. Las vistas proporcionan compatibilidad con consultas existentes
7. Los UUIDs proporcionan mejor escalabilidad y seguridad
8. Los campos de auditoría permiten trazabilidad completa
9. Los estados permiten soft delete y mejor control
10. Las validaciones a nivel de base de datos mejoran la integridad
*/
