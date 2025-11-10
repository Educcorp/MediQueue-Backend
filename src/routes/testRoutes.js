const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

/**
 * @route   POST /api/test/email
 * @desc    Probar configuración de email con Resend
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

        // Verificar configuración de Resend
        console.log('🔍 Verificando configuración de Resend...');
        console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? `***${process.env.RESEND_API_KEY.slice(-4)}` : 'NO CONFIGURADO');
        console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
        console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME);
        console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

        // Verificar que la API key esté configurada
        if (!process.env.RESEND_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'RESEND_API_KEY no está configurada',
                config: {
                    from: process.env.EMAIL_FROM,
                    fromName: process.env.EMAIL_FROM_NAME
                }
            });
        }

        // Intentar verificar conexión
        const isConnected = await emailService.verifyConnection();
        
        if (!isConnected) {
            return res.status(500).json({
                success: false,
                message: 'No se pudo verificar la configuración de Resend',
                config: {
                    from: process.env.EMAIL_FROM,
                    fromName: process.env.EMAIL_FROM_NAME
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
            message: 'Email de prueba enviado exitosamente con Resend',
            config: {
                from: process.env.EMAIL_FROM,
                fromName: process.env.EMAIL_FROM_NAME,
                frontendUrl: process.env.FRONTEND_URL,
                service: 'Resend'
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
                from: process.env.EMAIL_FROM,
                fromName: process.env.EMAIL_FROM_NAME
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
        email: {
            service: 'Resend',
            from: process.env.EMAIL_FROM,
            fromName: process.env.EMAIL_FROM_NAME,
            hasApiKey: !!process.env.RESEND_API_KEY,
            apiKeyLastChars: process.env.RESEND_API_KEY ? `***${process.env.RESEND_API_KEY.slice(-4)}` : 'NO SET'
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
