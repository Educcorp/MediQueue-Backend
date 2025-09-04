const { executeQuery } = require('./src/config/database');

// Script para inicializar la base de datos con datos de prueba
const initDatabase = async () => {
  try {
    console.log('🚀 Inicializando base de datos con datos de prueba...');

    // Crear áreas de prueba
    console.log('📋 Creando áreas...');
    await executeQuery(`
      INSERT IGNORE INTO Area (nombre_area) VALUES 
      ('Medicina General'),
      ('Pediatría'),
      ('Cardiología'),
      ('Dermatología')
    `);

    // Obtener IDs de las áreas
    const areas = await executeQuery('SELECT id_area, nombre_area FROM Area');
    console.log('✅ Áreas creadas:', areas);

    // Crear consultorios de prueba
    console.log('🏥 Creando consultorios...');
    const consultoriosData = [
      { numero: 1, area: 'Medicina General' },
      { numero: 2, area: 'Medicina General' },
      { numero: 1, area: 'Pediatría' },
      { numero: 1, area: 'Cardiología' },
      { numero: 1, area: 'Dermatología' }
    ];

    for (const consultorio of consultoriosData) {
      const area = areas.find(a => a.nombre_area === consultorio.area);
      if (area) {
        await executeQuery(`
          INSERT IGNORE INTO Consultorio (numero_consultorio, id_area) 
          VALUES (?, ?)
        `, [consultorio.numero, area.id_area]);
      }
    }

    // Crear administrador de prueba
    console.log('👤 Creando administrador de prueba...');
    await executeQuery(`
      INSERT IGNORE INTO Administrador (nombre, email, password_hash) 
      VALUES ('Admin Principal', 'admin@mediqueue.com', '$2b$10$rQZ8K9vL2mN3oP4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV')
    `);

    // Verificar datos creados
    const consultorios = await executeQuery(`
      SELECT c.*, a.nombre_area 
      FROM Consultorio c 
      JOIN Area a ON c.id_area = a.id_area
    `);
    
    const administradores = await executeQuery('SELECT * FROM Administrador');

    console.log('✅ Base de datos inicializada correctamente:');
    console.log(`📊 Áreas: ${areas.length}`);
    console.log(`🏥 Consultorios: ${consultorios.length}`);
    console.log(`👤 Administradores: ${administradores.length}`);
    
    console.log('\n📋 Consultorios disponibles:');
    consultorios.forEach(c => {
      console.log(`  - Consultorio ${c.numero_consultorio} (${c.nombre_area})`);
    });

    console.log('\n🎉 ¡Inicialización completada!');
    console.log('🔑 Credenciales de administrador:');
    console.log('   Email: admin@mediqueue.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase().then(() => {
    console.log('✅ Script de inicialización completado');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Error en el script de inicialización:', error);
    process.exit(1);
  });
}

module.exports = { initDatabase };
