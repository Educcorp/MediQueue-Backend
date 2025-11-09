-- Script completo para crear las tablas de MediQueue con verificación de email
-- Base de datos: mediqueue

USE mediqueue;

-- Tabla de Áreas
CREATE TABLE IF NOT EXISTS Area (
  id_area INT AUTO_INCREMENT PRIMARY KEY,
  nombre_area VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Consultorios
CREATE TABLE IF NOT EXISTS Consultorio (
  id_consultorio INT AUTO_INCREMENT PRIMARY KEY,
  numero_consultorio INT NOT NULL,
  id_area INT NOT NULL,
  estado ENUM('ACTIVO', 'INACTIVO', 'MANTENIMIENTO') DEFAULT 'ACTIVO',
  descripcion TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_area) REFERENCES Area(id_area) ON DELETE RESTRICT,
  UNIQUE KEY unique_consultorio_area (numero_consultorio, id_area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Administradores CON CAMPOS DE VERIFICACIÓN DE EMAIL
CREATE TABLE IF NOT EXISTS Administrador (
  uk_administrador CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  s_nombre VARCHAR(100) NOT NULL,
  s_apellido VARCHAR(100) NOT NULL,
  s_email VARCHAR(255) NOT NULL UNIQUE,
  s_usuario VARCHAR(50) NOT NULL UNIQUE,
  s_password_hash VARCHAR(255) NOT NULL,
  c_telefono VARCHAR(20),
  tipo_usuario TINYINT DEFAULT 1 COMMENT '1=Admin, 2=Supervisor',
  ck_estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
  
  -- CAMPOS DE VERIFICACIÓN DE EMAIL
  b_email_verified BOOLEAN DEFAULT FALSE COMMENT 'Indica si el email ha sido verificado',
  s_verification_token VARCHAR(255) DEFAULT NULL COMMENT 'Token para verificar email',
  d_verification_token_expires DATETIME DEFAULT NULL COMMENT 'Fecha de expiración del token',
  
  d_fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  d_fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  uk_usuario_creacion CHAR(36) DEFAULT NULL,
  uk_usuario_modificacion CHAR(36) DEFAULT NULL,
  
  INDEX idx_email (s_email),
  INDEX idx_usuario (s_usuario),
  INDEX idx_verification_token (s_verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Pacientes
CREATE TABLE IF NOT EXISTS Paciente (
  uk_paciente CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  s_tipo_documento ENUM('CC', 'TI', 'CE', 'PA') DEFAULT 'CC',
  s_numero_documento VARCHAR(20) NOT NULL UNIQUE,
  s_nombre VARCHAR(100) NOT NULL,
  s_apellido VARCHAR(100) NOT NULL,
  c_telefono VARCHAR(20),
  s_email VARCHAR(255),
  s_direccion TEXT,
  d_fecha_nacimiento DATE,
  s_genero ENUM('M', 'F', 'OTRO'),
  s_tipo_sangre VARCHAR(5),
  s_alergias TEXT,
  s_notas_medicas TEXT,
  ck_estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
  d_fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  d_fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  uk_usuario_creacion CHAR(36) DEFAULT NULL,
  uk_usuario_modificacion CHAR(36) DEFAULT NULL,
  
  INDEX idx_documento (s_numero_documento),
  INDEX idx_nombre (s_nombre, s_apellido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Turnos
CREATE TABLE IF NOT EXISTS Turno (
  uk_turno CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  i_numero_turno INT NOT NULL,
  uk_paciente CHAR(36) DEFAULT NULL,
  id_consultorio INT NOT NULL,
  s_estado ENUM('EN_ESPERA', 'LLAMANDO', 'ATENDIENDO', 'ATENDIDO', 'CANCELADO', 'NO_PRESENTE') DEFAULT 'EN_ESPERA',
  d_fecha DATE NOT NULL,
  t_hora_creacion TIME NOT NULL,
  t_hora_llamado TIME,
  t_hora_atencion TIME,
  t_hora_fin TIME,
  s_observaciones TEXT,
  ck_estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
  d_fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  d_fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  uk_administrador CHAR(36) DEFAULT NULL,
  uk_usuario_modificacion CHAR(36) DEFAULT NULL,
  
  FOREIGN KEY (uk_paciente) REFERENCES Paciente(uk_paciente) ON DELETE SET NULL,
  FOREIGN KEY (id_consultorio) REFERENCES Consultorio(id_consultorio) ON DELETE RESTRICT,
  FOREIGN KEY (uk_administrador) REFERENCES Administrador(uk_administrador) ON DELETE SET NULL,
  
  INDEX idx_fecha (d_fecha),
  INDEX idx_estado (s_estado),
  INDEX idx_consultorio (id_consultorio),
  INDEX idx_numero_turno_fecha (i_numero_turno, d_fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos iniciales de prueba
INSERT IGNORE INTO Area (nombre_area, descripcion) VALUES 
  ('Medicina General', 'Consultas médicas generales'),
  ('Pediatría', 'Atención médica para niños'),
  ('Cardiología', 'Especialidad del corazón'),
  ('Dermatología', 'Cuidado de la piel');

-- Insertar consultorios de prueba
INSERT IGNORE INTO Consultorio (numero_consultorio, id_area) 
SELECT 1, id_area FROM Area WHERE nombre_area = 'Medicina General' LIMIT 1;

INSERT IGNORE INTO Consultorio (numero_consultorio, id_area) 
SELECT 2, id_area FROM Area WHERE nombre_area = 'Medicina General' LIMIT 1;

INSERT IGNORE INTO Consultorio (numero_consultorio, id_area) 
SELECT 1, id_area FROM Area WHERE nombre_area = 'Pediatría' LIMIT 1;

INSERT IGNORE INTO Consultorio (numero_consultorio, id_area) 
SELECT 2, id_area FROM Area WHERE nombre_area = 'Pediatría' LIMIT 1;

-- Mostrar las tablas creadas
SHOW TABLES;

-- Verificar estructura de la tabla Administrador
DESCRIBE Administrador;

SELECT '✅ Base de datos creada exitosamente con soporte de verificación de email' AS Status;
