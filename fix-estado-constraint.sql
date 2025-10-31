-- Script para ampliar el campo ck_estado y actualizar constraints
-- El campo actual es muy pequeño (6 caracteres), necesitamos al menos 8 para 'INACTIVO'

USE MediQueue;

-- PASO 1: Eliminar todos los CHECK CONSTRAINTS existentes

-- Area
ALTER TABLE Area DROP CHECK Area_chk_1;

-- Consultorio  
ALTER TABLE Consultorio DROP CHECK Consultorio_chk_1;

-- Administrador (si existe)
-- Si da error, ignóralo y continúa
ALTER TABLE Administrador DROP CHECK Administrador_chk_1;

-- Paciente (si existe)
ALTER TABLE Paciente DROP CHECK Paciente_chk_1;

-- Turno (si existe)
ALTER TABLE Turno DROP CHECK Turno_chk_estado;


-- PASO 2: Modificar el tamaño del campo ck_estado en todas las tablas

ALTER TABLE Area MODIFY COLUMN ck_estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO';

ALTER TABLE Consultorio MODIFY COLUMN ck_estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO';

ALTER TABLE Administrador MODIFY COLUMN ck_estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO';

ALTER TABLE Paciente MODIFY COLUMN ck_estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO';

ALTER TABLE Turno MODIFY COLUMN ck_estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO';


-- PASO 3: Agregar nuevos CHECK CONSTRAINTS con 'INACTIVO' (8 caracteres)

ALTER TABLE Area ADD CONSTRAINT Area_chk_1 CHECK (ck_estado IN ('ACTIVO', 'INACTIVO'));

ALTER TABLE Consultorio ADD CONSTRAINT Consultorio_chk_1 CHECK (ck_estado IN ('ACTIVO', 'INACTIVO'));

ALTER TABLE Administrador ADD CONSTRAINT Administrador_chk_1 CHECK (ck_estado IN ('ACTIVO', 'INACTIVO'));

ALTER TABLE Paciente ADD CONSTRAINT Paciente_chk_1 CHECK (ck_estado IN ('ACTIVO', 'INACTIVO'));

ALTER TABLE Turno ADD CONSTRAINT Turno_chk_estado CHECK (ck_estado IN ('ACTIVO', 'INACTIVO'));


-- PASO 4: Actualizar registros que puedan tener 'INACTI' truncado
UPDATE Area SET ck_estado = 'INACTIVO' WHERE ck_estado LIKE 'INACT%' AND ck_estado != 'INACTIVO';
UPDATE Consultorio SET ck_estado = 'INACTIVO' WHERE ck_estado LIKE 'INACT%' AND ck_estado != 'INACTIVO';
UPDATE Administrador SET ck_estado = 'INACTIVO' WHERE ck_estado LIKE 'INACT%' AND ck_estado != 'INACTIVO';
UPDATE Paciente SET ck_estado = 'INACTIVO' WHERE ck_estado LIKE 'INACT%' AND ck_estado != 'INACTIVO';
UPDATE Turno SET ck_estado = 'INACTIVO' WHERE ck_estado LIKE 'INACT%' AND ck_estado != 'INACTIVO';

SELECT 'Campo ck_estado ampliado y constraints actualizados correctamente!' AS mensaje;
SELECT 'Ahora el campo acepta hasta 10 caracteres y usa INACTIVO (8 caracteres)' AS nota;
