require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testDomainEmail() {
  console.log('🧪 Probando envío con dominio personalizado...');
  console.log('📧 Configuración actual:');
  console.log('   → From:', process.env.EMAIL_FROM);
  console.log('   → API Key:', process.env.RESEND_API_KEY ? 'Configurada ✓' : 'NO configurada ✗');
  console.log('');
  
  const testEmail = 'yosnrs@gmail.com'; // Cambia esto al email que quieras probar
  
  try {
    console.log(`📤 Enviando email de prueba a ${testEmail}...`);
    const result = await emailService.sendVerificationEmail(
      testEmail,
      'Usuario Prueba',
      'token-test-123456'
    );
    
    console.log('');
    console.log('✅ ¡ÉXITO! Email enviado correctamente');
    console.log('📬 ID del mensaje:', result.messageId);
    console.log('');
    console.log('👀 Revisa la bandeja de entrada (y SPAM) de:', testEmail);
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR al enviar email:');
    console.error('   →', error.message);
    console.error('');
    
    if (error.message.includes('not verified')) {
      console.log('💡 SOLUCIÓN:');
      console.log('   1. Asegúrate de haber agregado TODOS los registros DNS');
      console.log('   2. Espera 5-30 minutos para que se propaguen');
      console.log('   3. Verifica en https://resend.com/domains que el dominio tenga ✓ verde');
    }
  }
}

testDomainEmail();
