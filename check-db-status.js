const { executeQuery } = require('./src/config/database');

// Script para verificar si la constraint fue eliminada
const testTurnCreation = async () => {
  try {
    console.log('🧪 Verificando estado de la base de datos...');

    // Verificar constraints actuales de la tabla Turno
    console.log('📋 Consultando constraints actuales...');
    const constraints = await executeQuery(`
      SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_NAME = 'Turno' AND TABLE_SCHEMA = 'mediqueue'
    `);
    
    console.log('✅ Constraints actuales:', constraints);

    // Verificar indices actuales
    console.log('📋 Consultando índices actuales...');
    const indexes = await executeQuery(`
      SHOW INDEX FROM Turno
    `);
    
    console.log('✅ Índices actuales:');
    indexes.forEach(index => {
      console.log(`  - ${index.Key_name}: ${index.Column_name} (${index.Non_unique ? 'NON-UNIQUE' : 'UNIQUE'})`);
    });

    // Verificar turnos existentes para entender el problema
    console.log('📋 Consultando turnos del día actual...');
    const turnos = await executeQuery(`
      SELECT t.i_numero_turno, t.d_fecha, c.uk_area, a.s_nombre_area
      FROM Turno t
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio  
      JOIN Area a ON c.uk_area = a.uk_area
      WHERE t.d_fecha = CURDATE()
      ORDER BY t.i_numero_turno
    `);
    
    console.log('✅ Turnos del día:', turnos);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
};

// Ejecutar verificación
testTurnCreation();