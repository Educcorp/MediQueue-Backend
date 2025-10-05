const { executeQuery } = require('./src/config/database');

// Test the updated Turno.create method directly
const testTurnoCreate = async () => {
  try {
    console.log('🧪 Testing updated Turno.create method...');

    // Test creating a turno with the new method
    const Turno = require('./src/models/Turno');

    const testData = {
      uk_consultorio: '4bcb0459-9d05-11f0-9aa4-a2aa5f0e9486',
      uk_administrador: '001bbbc3-974a-11f0-9ab7-a2aa5f0e9486',
      uk_paciente: null,
      uk_usuario_creacion: null
    };

    console.log('📋 Creating turno with data:', testData);
    
    const result = await Turno.create(testData);
    
    console.log('✅ Turno created successfully:', result);

    // Test getting the created turno by ID
    if (result.uk_turno) {
      console.log('📋 Getting turno by ID:', result.uk_turno);
      const turnoCompleto = await Turno.getById(result.uk_turno);
      console.log('✅ Turno retrieved successfully:', {
        uk_turno: turnoCompleto.uk_turno,
        i_numero_turno: turnoCompleto.i_numero_turno,
        s_estado: turnoCompleto.s_estado,
        s_nombre_area: turnoCompleto.s_nombre_area
      });
    }

    console.log('🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
};

// Run the test
testTurnoCreate();