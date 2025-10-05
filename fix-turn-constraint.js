const { executeQuery } = require('./src/config/database');

// Script para arreglar la constraint de numeración de turnos
const fixTurnNumberingConstraint = async () => {
  try {
    console.log('🔧 Arreglando constraint de numeración de turnos...');

    // Eliminar la constraint única actual que previene numeración por área
    console.log('📋 Eliminando constraint uk_turno_dia_numero...');
    try {
      await executeQuery('ALTER TABLE Turno DROP INDEX uk_turno_dia_numero');
      console.log('✅ Constraint eliminada exitosamente');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️  Constraint ya fue eliminada previamente');
      } else {
        console.log('❌ Error eliminando constraint:', error.message);
        throw error;
      }
    }

    console.log('✅ Base de datos configurada para numeración por área');
    console.log('🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Ejecutar migración
fixTurnNumberingConstraint();