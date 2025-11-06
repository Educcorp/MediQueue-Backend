const nodemailer = require('nodemailer');

/**
 * Servicio para envío de emails
 */
class EmailService {
  constructor() {
    // Configuración del transporter de nodemailer
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER, // Tu email
        pass: process.env.SMTP_PASS, // Tu contraseña o app password
      },
    });

    this.fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    this.fromName = process.env.SMTP_FROM_NAME || 'MediQueue';
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

    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: email,
      subject: 'Verifica tu correo electrónico - MediQueue',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verificación de Email</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 10px 10px 0 0;
              text-align: center;
              margin: -30px -30px 20px -30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              margin: 20px 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              text-align: center;
            }
            .button:hover {
              opacity: 0.9;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 5px;
              padding: 10px;
              margin-top: 20px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 MediQueue</h1>
            </div>
            <div class="content">
              <h2>¡Hola ${nombre}!</h2>
              <p>Gracias por registrarte en MediQueue. Para completar tu registro como administrador, necesitamos verificar tu correo electrónico.</p>
              
              <p>Por favor, haz clic en el siguiente botón para verificar tu cuenta:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verificar mi correo electrónico</a>
              </div>
              
              <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
              <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;">
                ${verificationUrl}
              </p>
              
              <div class="warning">
                ⚠️ <strong>Importante:</strong> Este enlace expirará en 24 horas por seguridad.
              </div>
              
              <p style="margin-top: 20px;">Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.</p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              <p>&copy; ${new Date().getFullYear()} MediQueue - Sistema de Gestión de Turnos Médicos</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hola ${nombre},
        
        Gracias por registrarte en MediQueue. Para completar tu registro como administrador, necesitamos verificar tu correo electrónico.
        
        Por favor, visita el siguiente enlace para verificar tu cuenta:
        ${verificationUrl}
        
        Este enlace expirará en 24 horas por seguridad.
        
        Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.
        
        Saludos,
        Equipo MediQueue
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email de verificación enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error al enviar email de verificación:', error);
      throw new Error('Error al enviar el email de verificación');
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

    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: email,
      subject: '¡Bienvenido a MediQueue! - Cuenta verificada',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cuenta Verificada</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
              color: white;
              padding: 20px;
              border-radius: 10px 10px 0 0;
              text-align: center;
              margin: -30px -30px 20px -30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
            }
            .success-icon {
              text-align: center;
              font-size: 60px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              margin: 20px 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 MediQueue</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <h2 style="text-align: center; color: #11998e;">¡Cuenta Verificada Exitosamente!</h2>
              
              <p>¡Hola ${nombre}!</p>
              
              <p>Tu correo electrónico ha sido verificado correctamente. Tu cuenta de administrador en MediQueue está ahora activa y lista para usar.</p>
              
              <p>Ya puedes iniciar sesión en el panel de administración:</p>
              
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Ir al Panel de Administración</a>
              </div>
              
              <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con el equipo de soporte.</p>
              
              <p>¡Bienvenido al equipo de MediQueue! 🎉</p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              <p>&copy; ${new Date().getFullYear()} MediQueue - Sistema de Gestión de Turnos Médicos</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email de bienvenida enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error al enviar email de bienvenida:', error);
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
      await this.transporter.verify();
      console.log('Servidor de email listo para enviar mensajes');
      return true;
    } catch (error) {
      console.error('Error al verificar conexión con servidor de email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
