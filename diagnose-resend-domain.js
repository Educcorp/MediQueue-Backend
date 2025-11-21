require('dotenv').config();
const { Resend } = require('resend');

/**
 * Script para diagnosticar el problema con el dominio verificado
 */
async function diagnoseResendDomain() {
  try {
    console.log('🔍 Diagnosticando configuración de Resend...\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Verificar variables de entorno
    console.log('1️⃣ Variables de Entorno Actuales:\n');
    
    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;
    const emailFromName = process.env.EMAIL_FROM_NAME;
    const frontendUrl = process.env.FRONTEND_URL;

    console.log(`   RESEND_API_KEY: ${apiKey ? apiKey.substring(0, 10) + '...' : '❌ NO CONFIGURADA'}`);
    console.log(`   EMAIL_FROM: ${emailFrom || '❌ NO CONFIGURADA'}`);
    console.log(`   EMAIL_FROM_NAME: ${emailFromName || '❌ NO CONFIGURADA'}`);
    console.log(`   FRONTEND_URL: ${frontendUrl || '❌ NO CONFIGURADA'}\n`);

    // 2. Verificar si se está usando el dominio verificado
    console.log('2️⃣ Análisis de EMAIL_FROM:\n');
    
    if (emailFrom === 'onboarding@resend.dev') {
      console.log('   ⚠️  PROBLEMA ENCONTRADO!');
      console.log('   Estás usando: onboarding@resend.dev (modo testing)');
      console.log('   Debes cambiar a: noreply@mediqueue.app (tu dominio)\n');
      console.log('   📝 SOLUCIÓN:');
      console.log('   1. Abre el archivo .env');
      console.log('   2. Cambia: EMAIL_FROM=onboarding@resend.dev');
      console.log('   3. Por: EMAIL_FROM=noreply@mediqueue.app');
      console.log('   4. Guarda el archivo');
      console.log('   5. Reinicia el servidor backend\n');
    } else if (emailFrom && emailFrom.includes('mediqueue.app')) {
      console.log(`   ✅ Correcto: Usando dominio verificado (${emailFrom})\n`);
    } else {
      console.log(`   ⚠️  Usando: ${emailFrom}`);
      console.log('   Verifica que este sea tu dominio verificado\n');
    }

    // 3. Probar envío con el dominio actual
    console.log('3️⃣ Probando envío de email con configuración actual...\n');

    const resend = new Resend(apiKey);
    const testEmail = 'epalacios6@ucol.mx'; // Email que está fallando

    console.log(`   Intentando enviar a: ${testEmail}`);
    console.log(`   Desde: ${emailFrom}\n`);

    const { data, error } = await resend.emails.send({
      from: `${emailFromName} <${emailFrom}>`,
      to: testEmail,
      subject: 'Test - Verificación de Dominio - MediQueue',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test de Dominio Verificado</h2>
          <p>Si recibes este email, significa que:</p>
          <ul>
            <li>✅ El dominio está verificado correctamente</li>
            <li>✅ La configuración es correcta</li>
            <li>✅ El sistema puede enviar emails a cualquier dirección</li>
          </ul>
          <p><strong>El sistema de recuperación de contraseña debería funcionar ahora.</strong></p>
        </body>
        </html>
      `
    });

    if (error) {
      console.log('   ❌ ERROR AL ENVIAR:\n');
      console.log(`   Tipo: ${error.name}`);
      console.log(`   Código: ${error.statusCode}`);
      console.log(`   Mensaje: ${error.message}\n`);

      // Diagnosticar el error específico
      if (error.message.includes('testing email')) {
        console.log('   🔍 DIAGNÓSTICO:');
        console.log('   El dominio NO está siendo usado correctamente.');
        console.log('   Resend aún te ve en modo testing.\n');
        console.log('   ✅ SOLUCIONES:');
        console.log('   A. Verifica que el dominio esté VERIFICADO (no solo agregado)');
        console.log('      → Ve a https://resend.com/domains');
        console.log('      → El dominio debe tener un ✅ verde');
        console.log('   B. Cambia EMAIL_FROM a tu dominio verificado');
        console.log('      → EMAIL_FROM=noreply@mediqueue.app');
        console.log('   C. Reinicia el servidor backend\n');
      } else if (error.message.includes('Domain not verified')) {
        console.log('   🔍 DIAGNÓSTICO:');
        console.log('   El dominio NO está verificado en Resend.\n');
        console.log('   ✅ SOLUCIÓN:');
        console.log('   1. Ve a https://resend.com/domains');
        console.log('   2. Verifica el estado del dominio mediqueue.app');
        console.log('   3. Si no tiene ✅ verde, completa la verificación DNS');
        console.log('   4. Espera 5-30 minutos para que se verifique\n');
      }

      process.exit(1);
    }

    console.log('   ✅ EMAIL ENVIADO EXITOSAMENTE!\n');
    console.log(`   Email ID: ${data.id}`);
    console.log(`   Destinatario: ${testEmail}\n`);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SISTEMA FUNCIONANDO CORRECTAMENTE\n');
    console.log('   El dominio está verificado y configurado.');
    console.log('   Puedes usar el sistema de recuperación de contraseña');
    console.log('   con cualquier email registrado en tu sistema.\n');
    console.log('   Revisa la bandeja de entrada de epalacios6@ucol.mx');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
diagnoseResendDomain();

