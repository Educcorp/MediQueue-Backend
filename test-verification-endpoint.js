require('dotenv').config();
const axios = require('axios');

async function testEndpoint() {
  try {
    // Crear un usuario de prueba
    console.log('📝 Creando usuario de prueba...');
    const Administrador = require('./src/models/Administrador');
    
    const testEmail = `test${Date.now()}@ejemplo.com`;
    const result = await Administrador.create({
      s_nombre: 'Test',
      s_apellido: 'Endpoint',
      s_email: testEmail,
      s_usuario: `testuser${Date.now()}`,
      s_password: 'Test123!',
      c_telefono: '1234567890',
      tipo_usuario: 1,
      uk_usuario_creacion: null
    });

    const token = result.verificationToken;
    console.log(`✅ Usuario creado con token: ${token}\n`);

    // Probar el endpoint de verificación
    console.log('🔄 Probando endpoint de verificación...');
    const API_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';
    console.log(`URL: ${API_URL}/administradores/verify-email/${token}\n`);

    const response = await axios.get(`${API_URL}/administradores/verify-email/${token}`, {
      timeout: 10000 // 10 segundos de timeout
    });

    console.log('✅ Respuesta exitosa del endpoint:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Error en la prueba:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

testEndpoint();
