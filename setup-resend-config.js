const fs = require('fs');
const path = require('path');

/**
 * Script para agregar la configuración de Resend al archivo .env
 */
function setupResendConfig() {
  try {
    console.log('🔧 Configurando Resend API en archivo .env...\n');

    const envPath = path.join(__dirname, '.env');
    
    // Verificar que el archivo .env existe
    if (!fs.existsSync(envPath)) {
      console.error('❌ Archivo .env no encontrado');
      console.log('   Crea un archivo .env en la raíz del proyecto backend');
      process.exit(1);
    }

    // Leer el contenido actual
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Configuración de Resend a agregar
    const resendConfig = `

# ============================================
# RESEND API CONFIGURATION (Email Service)
# ============================================

# API Key de Resend para envío de emails
RESEND_API_KEY=re_Gpvq2W8w_4jW8t5dy9Lu8iCDxmUPYLDzZ

# Dirección de remitente (en desarrollo usa onboarding@resend.dev)
EMAIL_FROM=onboarding@resend.dev

# Nombre del remitente
EMAIL_FROM_NAME=MediQueue

# URL del frontend (para enlaces en emails)
FRONTEND_URL=http://localhost:5173
`;

    // Verificar si ya existe configuración de Resend
    if (envContent.includes('RESEND_API_KEY')) {
      console.log('⚠️  RESEND_API_KEY ya existe en .env');
      console.log('   Actualizando valor...\n');
      
      // Actualizar la key existente
      envContent = envContent.replace(
        /RESEND_API_KEY=.*/g,
        'RESEND_API_KEY=re_Gpvq2W8w_4jW8t5dy9Lu8iCDxmUPYLDzZ'
      );
      
      // Asegurar que las demás variables existan
      if (!envContent.includes('EMAIL_FROM=')) {
        envContent += '\nEMAIL_FROM=onboarding@resend.dev';
      }
      if (!envContent.includes('EMAIL_FROM_NAME=')) {
        envContent += '\nEMAIL_FROM_NAME=MediQueue';
      }
      if (!envContent.includes('FRONTEND_URL=')) {
        envContent += '\nFRONTEND_URL=http://localhost:5173';
      }
    } else {
      console.log('➕ Agregando configuración de Resend...\n');
      // Agregar toda la configuración al final
      envContent += resendConfig;
    }

    // Escribir el archivo actualizado
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Configuración de Resend agregada exitosamente\n');
    console.log('📋 Variables configuradas:');
    console.log('   RESEND_API_KEY: re_Gpvq2W8w_4jW8t5dy9Lu8i... (oculta por seguridad)');
    console.log('   EMAIL_FROM: onboarding@resend.dev');
    console.log('   EMAIL_FROM_NAME: MediQueue');
    console.log('   FRONTEND_URL: http://localhost:5173\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('🚀 PRÓXIMO PASO:');
    console.log('   1. Reinicia el servidor backend (Ctrl+C y luego npm run dev)');
    console.log('   2. Verifica la configuración: node test-password-reset-system.js');
    console.log('   3. Prueba el sistema: http://localhost:5173/admin/forgot-password\n');

  } catch (error) {
    console.error('❌ Error al configurar Resend:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
setupResendConfig();

