require('dotenv').config();
const { Resend } = require('resend');

/**
 * Script para enviar un email de prueba al email del dueño de la cuenta
 * para verificar que todo funciona correctamente
 */
async function testWithOwnerEmail() {
  try {
    console.log('🧪 Probando envío de email al dueño de la cuenta de Resend...\n');

    const apiKey = process.env.RESEND_API_KEY;
    const resend = new Resend(apiKey);

    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const toEmail = 'emmanuelpa2004@gmail.com'; // Email del dueño de la cuenta

    console.log('📧 Configuración:');
    console.log('   From:', fromEmail);
    console.log('   To:', toEmail);
    console.log('   Subject: Test - Recuperación de Contraseña\n');

    const resetUrl = 'http://localhost:3001/admin/reset-password?token=TEST_TOKEN_12345';

    const { data, error } = await resend.emails.send({
      from: `MediQueue <${fromEmail}>`,
      to: toEmail,
      subject: 'Recuperación de Contraseña - MediQueue (TEST)',
      html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:20px;font-family:Arial,Helvetica,sans-serif;background-color:#ffffff;">
  
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
    <tr>
      <td style="vertical-align:middle;padding-right:12px;">
        <img src="https://www.mediqueue.app/images/mediqueue_logo.png" alt="MediQueue" width="150" style="display:block;" />
      </td>
      <td style="vertical-align:middle;">
        <span style="font-size:24px;color:#5f6368;font-weight:normal;">MediQueue®</span>
      </td>
    </tr>
  </table>
  
  <h1 style="font-size:28px;color:#202124;font-weight:bold;margin:0 0 30px 0;text-align:center;">Recuperación de Contraseña (TEST)</h1>
  
  <p style="font-size:14px;color:#202124;line-height:1.5;margin:0 0 10px 0;">
    Hola <strong>Administrador</strong>,
  </p>
  
  <p style="font-size:14px;color:#202124;line-height:1.5;margin:0 0 10px 0;">
    Este es un <strong>email de prueba</strong> para verificar que el sistema de recuperación de contraseña funciona correctamente.
  </p>
  
  <p style="font-size:14px;color:#202124;line-height:1.5;margin:0 0 20px 0;">
    Para crear una nueva contraseña, haz clic en el siguiente botón:
  </p>
  
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px auto;">
    <tr>
      <td style="background-color:#4a90a4;border-radius:4px;padding:12px 24px;">
        <a href="${resetUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;display:block;">
          Restablecer Contraseña (TEST)
        </a>
      </td>
    </tr>
  </table>
  
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#e8f0fe;border-radius:4px;margin:0 0 20px 0;border-left:3px solid #4a90a4;">
    <tr>
      <td style="padding:12px 16px;">
        <p style="margin:0;font-size:13px;color:#202124;">
          <strong>📋 Esto es una prueba:</strong> Si recibiste este correo, significa que el sistema de emails está funcionando correctamente.
        </p>
      </td>
    </tr>
  </table>
  
  <p style="font-size:13px;color:#5f6368;margin:0;">
    Atentamente,<br>
    El equipo de MediQueue
  </p>
  
</body>
</html>`,
    });

    if (error) {
      console.error('❌ Error al enviar email:');
      console.error(JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ EMAIL DE PRUEBA ENVIADO EXITOSAMENTE!\n');
    console.log('   Email ID:', data.id);
    console.log('   Destinatario:', toEmail);
    console.log('\n📧 REVISA TU BANDEJA DE ENTRADA:');
    console.log('   1. Abre Gmail: https://gmail.com');
    console.log('   2. Busca email de MediQueue');
    console.log('   3. Si no está, revisa SPAM\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('⚠️  IMPORTANTE:');
    console.log('   Para que el sistema funcione con otros emails (epalacios6@ucol.mx, etc.),');
    console.log('   debes configurar Resend según las instrucciones en:');
    console.log('   → SOLUCION_RESEND_TESTING.md\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testWithOwnerEmail();

