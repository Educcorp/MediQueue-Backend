const axios = require('axios');

// Test turn creation with different areas
const testTurnCreation = async () => {
  try {
    console.log('🧪 Probando creación de turnos con numeración por área...');

    // Test 1: Crear turno para Ginecólogo (area existente)
    console.log('\n📋 Test 1: Crear turno para Ginecólogo...');
    try {
      const response1 = await axios.post('http://localhost:3000/api/turnos/publico/auto', {
        uk_area: '44b455aa-9d05-11f0-9aa4-a2aa5f0e9486'
      });
      console.log('✅ Turno creado exitosamente:', {
        numero: response1.data.data.i_numero_turno,
        area: response1.data.data.s_nombre_area
      });
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 2: Crear otro turno para Ginecólogo (debería ser número 2)
    console.log('\n📋 Test 2: Crear segundo turno para Ginecólogo...');
    try {
      const response2 = await axios.post('http://localhost:3000/api/turnos/publico/auto', {
        uk_area: '44b455aa-9d05-11f0-9aa4-a2aa5f0e9486'
      });
      console.log('✅ Turno creado exitosamente:', {
        numero: response2.data.data.i_numero_turno,
        area: response2.data.data.s_nombre_area
      });
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 3: Crear turno para otra área (debería empezar en 1)
    console.log('\n📋 Test 3: Crear turno para Dentista...');
    try {
      const response3 = await axios.post('http://localhost:3000/api/turnos/publico/auto', {
        uk_area: '09abf20c-9cfe-11f0-9aa4-a2aa5f0e9486'
      });
      console.log('✅ Turno creado exitosamente:', {
        numero: response3.data.data.i_numero_turno,
        area: response3.data.data.s_nombre_area
      });
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Tests completados');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
};

// Ejecutar tests
testTurnCreation();