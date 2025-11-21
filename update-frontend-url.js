const fs = require('fs');
const path = require('path');

/**
 * Script para actualizar el puerto del frontend en .env
 */
function updateFrontendUrl() {
  try {
    console.log('🔧 Actualizando FRONTEND_URL en archivo .env...\n');

    const envPath = path.join(__dirname, '.env');
    
    // Verificar que el archivo .env existe
    if (!fs.existsSync(envPath)) {
      console.error('❌ Archivo .env no encontrado');
      process.exit(1);
    }

    // Leer el contenido actual
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Actualizar FRONTEND_URL de 5173 a 3001
    envContent = envContent.replace(
      /FRONTEND_URL=http:\/\/localhost:5173/g,
      'FRONTEND_URL=http://localhost:3001'
    );

    // También buscar variaciones
    envContent = envContent.replace(
      /FRONTEND_URL=https?:\/\/localhost:5173/g,
      'FRONTEND_URL=http://localhost:3001'
    );

    // Escribir el archivo actualizado
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ FRONTEND_URL actualizada correctamente\n');
    console.log('   Valor anterior: http://localhost:5173');
    console.log('   Valor nuevo:    http://localhost:3001\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('📋 Esto afecta a:');
    console.log('   • Enlaces en emails de verificación');
    console.log('   • Enlaces en emails de recuperación de contraseña');
    console.log('   • Enlaces en emails de bienvenida\n');
    
    console.log('⚠️  IMPORTANTE:');
    console.log('   Reinicia el servidor backend para aplicar los cambios\n');

  } catch (error) {
    console.error('❌ Error al actualizar FRONTEND_URL:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
updateFrontendUrl();

