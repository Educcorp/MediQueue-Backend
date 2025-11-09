const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

/**
 * @route   POST /api/test/email
 * @desc    Probar configuración de email
 * @access  Public (temporal - quitar en producción)
 */
router.post('/email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        // Verificar configuración SMTP
        console.log('🔍 Verificando configuración SMTP...');
        console.log('SMTP_HOST:', process.env.SMTP_HOST);
        console.log('SMTP_PORT:', process.env.SMTP_PORT);
        console.log('SMTP_USER:', process.env.SMTP_USER);
        console.log('SMTP_FROM:', process.env.SMTP_FROM);
        console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
        console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
        console.log('SMTP_PASS:', process.env.SMTP_PASS ? `***${process.env.SMTP_PASS.slice(-4)}` : 'NO CONFIGURADO');

        // Intentar verificar conexión
        const isConnected = await emailService.verifyConnection();
        
        if (!isConnected) {
            return res.status(500).json({
                success: false,
                message: 'No se pudo conectar al servidor SMTP',
                config: {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    user: process.env.SMTP_USER,
                    from: process.env.SMTP_FROM,
                    secure: process.env.SMTP_SECURE
                }
            });
        }

        // Intentar enviar email de prueba
        console.log('📧 Intentando enviar email de prueba a:', email);
        
        await emailService.sendVerificationEmail(
            email,
            'Usuario de Prueba',
            'test-token-12345'
        );

        res.json({
            success: true,
            message: 'Email de prueba enviado exitosamente',
            config: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER,
                from: process.env.SMTP_FROM,
                secure: process.env.SMTP_SECURE,
                frontendUrl: process.env.FRONTEND_URL
            }
        });

    } catch (error) {
        console.error('❌ Error en test de email:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar email de prueba',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            config: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER,
                from: process.env.SMTP_FROM
            }
        });
    }
});

/**
 * @route   GET /api/test/config
 * @desc    Ver configuración actual (sin datos sensibles)
 * @access  Public (temporal)
 */
router.get('/config', (req, res) => {
    res.json({
        database: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            name: process.env.DB_NAME,
            user: process.env.DB_USER,
            hasPassword: !!process.env.DB_PASSWORD
        },
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.SMTP_USER,
            from: process.env.SMTP_FROM,
            fromName: process.env.SMTP_FROM_NAME,
            hasPassword: !!process.env.SMTP_PASS,
            passwordLastChars: process.env.SMTP_PASS ? `***${process.env.SMTP_PASS.slice(-4)}` : 'NO SET'
        },
        frontend: {
            url: process.env.FRONTEND_URL
        },
        jwt: {
            hasSecret: !!process.env.JWT_SECRET
        }
    });
});

module.exports = router;
