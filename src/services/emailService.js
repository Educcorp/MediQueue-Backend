const { Resend } = require('resend');

/**
 * Servicio para envío de emails usando Resend
 */
class EmailService {
  constructor() {
    // Configuración de Resend
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    this.fromName = process.env.EMAIL_FROM_NAME || 'MediQueue';
  }

  /**
   * Enviar email de verificación
   * @param {string} email - Email del destinatario
   * @param {string} nombre - Nombre del destinatario
   * @param {string} verificationToken - Token de verificación
   * @returns {Promise}
   */
  async sendVerificationEmail(email, nombre, verificationToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    console.log('📧 [EMAIL SERVICE - RESEND] Preparando email de verificación...');
    console.log('   → Destinatario:', email);
    console.log('   → Nombre:', nombre);
    console.log('   → From:', `${this.fromName} <${this.fromEmail}>`);

    try {
      console.log('📤 [EMAIL SERVICE - RESEND] Enviando email...');
      
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Verifica tu correo electrónico - MediQueue',
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
  
  <h1 style="font-size:28px;color:#202124;font-weight:bold;margin:0 0 30px 0;text-align:center;">¡Hola ${nombre}!</h1>
  
  <p style="font-size:14px;color:#202124;line-height:1.5;margin:0 0 10px 0;">
    Gracias por registrarte en MediQueue. Para completar tu registro como administrador, necesitamos verificar tu correo electrónico.
  </p>
  
  <p style="font-size:14px;color:#202124;line-height:1.5;margin:0 0 20px 0;">
    Por favor, haz clic en el siguiente botón para verificar tu cuenta:
  </p>
  
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px auto;">
    <tr>
      <td style="background-color:#4a90a4;border-radius:4px;padding:12px 24px;">
        <a href="${verificationUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;display:block;">
          Verificar Correo Electrónico
        </a>
      </td>
    </tr>
  </table>
  
  <p style="font-size:13px;color:#202124;margin:0 0 5px 0;">
    Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
  </p>
  
  <p style="margin:0 0 20px 0;">
    <a href="${verificationUrl}" style="color:#1a73e8;font-size:12px;word-break:break-all;">${verificationUrl}</a>
  </p>
  
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#fef7e0;border-radius:4px;margin:0 0 20px 0;">
    <tr>
      <td style="padding:12px 16px;">
        <p style="margin:0;font-size:13px;color:#202124;">
          <strong>⚠️ Importante:</strong> Este enlace expirará en 24 horas por seguridad.
        </p>
      </td>
    </tr>
  </table>
  
  <p style="font-size:13px;color:#5f6368;margin:0;">
    Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.
  </p>
  
</body>
</html>`,
      });

      if (error) {
        console.error('❌ [EMAIL SERVICE - RESEND] Error al enviar email');
        console.error('   → Error:', error);
        throw new Error(`Error al enviar el email de verificación: ${error.message}`);
      }

      console.log('✅ [EMAIL SERVICE - RESEND] Email de verificación enviado exitosamente');
      console.log('   → Email ID:', data.id);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('❌ [EMAIL SERVICE - RESEND] Error al enviar email de verificación');
      console.error('   → Error completo:', error);
      console.error('   → Error message:', error.message);
      throw new Error(`Error al enviar el email de verificación: ${error.message}`);
    }
  }

  /**
   * Enviar email de confirmación de verificación exitosa
   * @param {string} email - Email del destinatario
   * @param {string} nombre - Nombre del destinatario
   * @returns {Promise}
   */
  async sendWelcomeEmail(email, nombre) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const loginUrl = `${frontendUrl}/admin/login`;

    try {
      console.log('📤 [EMAIL SERVICE - RESEND] Enviando email de bienvenida...');
      
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: '¡Bienvenido a MediQueue! - Cuenta verificada',
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
  
  <h1 style="font-size:28px;color:#202124;font-weight:bold;margin:0 0 30px 0;text-align:center;">¡Hola ${nombre}!</h1>
  
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#e6f4ea;border-radius:4px;margin:0 0 20px 0;">
    <tr>
      <td style="padding:16px;">
        <p style="margin:0;font-size:16px;color:#137333;font-weight:500;">
          ✓ ¡Cuenta Verificada Exitosamente!
        </p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#137333;">
          Bienvenido al equipo de MediQueue 🎉
        </p>
      </td>
    </tr>
  </table>
  
  <p style="font-size:14px;color:#202124;line-height:1.5;margin:0 0 10px 0;">
    Tu correo electrónico ha sido verificado correctamente. Tu cuenta de administrador en MediQueue está ahora <strong>activa y lista para usar</strong>.
  </p>
  
  <p style="font-size:14px;color:#202124;line-height:1.5;margin:0 0 20px 0;">
    Ya puedes acceder al panel de administración y comenzar a gestionar el sistema de turnos médicos.
  </p>
  
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 25px auto;">
    <tr>
      <td style="background-color:#4a90a4;border-radius:4px;padding:12px 24px;">
        <a href="${loginUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;display:block;">
          Ir al Panel de Administración
        </a>
      </td>
    </tr>
  </table>
  
  <p style="font-size:14px;color:#202124;font-weight:500;margin:0 0 10px 0;">
    💡 Próximos pasos:
  </p>
  
  <ul style="font-size:14px;color:#202124;line-height:1.8;margin:0 0 20px 0;padding-left:20px;">
    <li>Configura tu perfil de administrador</li>
    <li>Revisa las áreas y consultorios disponibles</li>
    <li>Familiarízate con el panel de control</li>
    <li>Comienza a gestionar turnos médicos</li>
  </ul>
  
  <p style="font-size:13px;color:#5f6368;margin:0;">
    Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con el equipo de soporte.
  </p>
  
</body>
</html>`,
      });

      if (error) {
        console.error('❌ [EMAIL SERVICE - RESEND] Error al enviar email de bienvenida:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [EMAIL SERVICE - RESEND] Email de bienvenida enviado:', data.id);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('❌ [EMAIL SERVICE - RESEND] Error al enviar email de bienvenida:', error);
      // No lanzamos error aquí porque la verificación ya se completó
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar la configuración del servicio de email
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    try {
      // Resend no requiere verificación de conexión previa
      // La API valida automáticamente en cada request
      console.log('✅ [EMAIL SERVICE - RESEND] Servicio de email configurado correctamente');
      console.log('   → API Key configurada:', process.env.RESEND_API_KEY ? 'Sí' : 'No');
      return true;
    } catch (error) {
      console.error('❌ [EMAIL SERVICE - RESEND] Error al verificar configuración:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
