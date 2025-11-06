// Test simple para verificar la creación de administrador
require('dotenv').config();
const Administrador = require('./src/models/Administrador');

async function testCreateAdmin() {
  console.log('🧪 Iniciando test de creación de administrador...\n');
  
  try {
    const testData = {
      s_nombre: 'Test',
      s_apellido: 'Usuario',
      s_email: 'test' + Date.now() + '@ejemplo.com',
      s_usuario: 'testuser' + Date.now(),
      s_password: 'Test123!',
      c_telefono: '1234567890',
      tipo_usuario: 1,
      uk_usuario_creacion: null
    };

    console.log('📝 Datos de prueba:', testData);
    console.log('\n🔄 Llamando a Administrador.create()...\n');
    
    const result = await Administrador.create(testData);
    
    console.log('✅ Administrador creado exitosamente!');
    console.log('📊 Resultado:', result);
    console.log('\n🔑 UUID generado:', result.insertId);
    console.log('🎫 Token de verificación:', result.verificationToken.substring(0, 20) + '...');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR al crear administrador:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('\nError completo:', error);
    process.exit(1);
  }
}

testCreateAdmin();
