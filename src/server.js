const { app, initializeApp } = require('./app');
const config = require('./config/config');

// Puerto del servidor
const PORT = config.port;

// Función principal para iniciar el servidor
const startServer = async () => {
    try {
        // Inicializar aplicación (conexión a BD, etc.)
        const initialized = await initializeApp();

        if (!initialized) {
            console.error('❌ No se pudo inicializar la aplicación. Deteniendo servidor...');
            process.exit(1);
        }

        // Iniciar servidor
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log('\n' + '='.repeat(60));
            console.log('🏥  MEDIQUEUE BACKEND SERVER');
            console.log('='.repeat(60));
            console.log(`🚀 Servidor ejecutándose en puerto: ${PORT}`);
            console.log(`🌐 URL local: http://localhost:${PORT}`);
            console.log(`📋 API Documentation: http://localhost:${PORT}/api`);
            console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🔒 Environment: ${process.env.VITE_NODE_ENV || 'production'}`);
            console.log('='.repeat(60));
            console.log(`📅 Fecha de inicio: ${new Date().toLocaleString()}`);
            console.log('='.repeat(60) + '\n');
        });

        // Configurar timeout del servidor
        server.timeout = 30000; // 30 segundos

        // Manejo de cierre graceful
        const gracefulShutdown = (signal) => {
            console.log(`\n🔄 Recibida señal ${signal}. Iniciando cierre graceful...`);

            server.close((err) => {
                if (err) {
                    console.error('❌ Error durante el cierre del servidor:', err);
                    process.exit(1);
                }

                console.log('✅ Servidor cerrado correctamente');
                console.log('👋 MediQueue Backend desconectado');
                process.exit(0);
            });

            // Force close después de 10 segundos
            setTimeout(() => {
                console.error('⚠️  Timeout de cierre alcanzado. Forzando cierre...');
                process.exit(1);
            }, 10000);
        };

        // Escuchar señales de terminación
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Manejo de errores no capturados
        process.on('uncaughtException', (error) => {
            console.error('❌ Excepción no capturada:', error);
            console.error('📍 Stack:', error.stack);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Promise rechazada no manejada en:', promise);
            console.error('📍 Razón:', reason);
            process.exit(1);
        });

        return server;

    } catch (error) {
        console.error('❌ Error crítico iniciando el servidor:', error);
        process.exit(1);
    }
};

// Verificar si este archivo se está ejecutando directamente
if (require.main === module) {
    startServer();
}

module.exports = { startServer };
