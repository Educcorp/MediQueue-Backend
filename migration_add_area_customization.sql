-- =============================================
-- MIGRACIÓN: AÑADIR PERSONALIZACIÓN DE ÁREAS
-- =============================================
-- Este script agrega las columnas s_letra, s_color, s_icono a la tabla Area

-- Agregar nuevas columnas a la tabla Area
ALTER TABLE Area 
ADD COLUMN s_letra VARCHAR(2) NULL COMMENT 'Identificador de letras para el área (máximo 2 letras)',
ADD COLUMN s_color VARCHAR(7) NULL COMMENT 'Color hexadecimal asignado al área',
ADD COLUMN s_icono VARCHAR(50) NULL COMMENT 'Nombre del icono FontAwesome asignado al área';

-- Agregar índices para optimizar consultas
ALTER TABLE Area 
ADD INDEX idx_area_letra (s_letra),
ADD INDEX idx_area_color (s_color);

-- Validar que s_letra tenga máximo 2 caracteres y solo letras
ALTER TABLE Area 
ADD CONSTRAINT chk_area_letra_length 
CHECK (s_letra IS NULL OR (LENGTH(s_letra) <= 2 AND s_letra REGEXP '^[A-Za-z]+$'));

-- Validar que s_color sea un formato hexadecimal válido
ALTER TABLE Area 
ADD CONSTRAINT chk_area_color_format 
CHECK (s_color IS NULL OR s_color REGEXP '^#[0-9A-Fa-f]{6}$');

-- Agregar constraint de unicidad para s_letra (no puede repetirse)
ALTER TABLE Area 
ADD CONSTRAINT uk_area_letra UNIQUE (s_letra);

-- Comentarios para documentación
ALTER TABLE Area 
COMMENT = 'Tabla de áreas médicas con personalización visual';