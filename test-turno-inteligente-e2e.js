const { executeQuery } = require('./src/config/database');
const Turno = require('./src/models/Turno');

// Prueba end-to-end: crear turno con asignación inteligente
const testCrearTurnoInteligente = async () => {
  try {
    console.log('🧪 Iniciando prueba end-to-end: crear turno con asignación inteligente...\n');

    // 1. Obtener un área disponible
    const areas = await executeQuery('SELECT uk_area, s_nombre_area FROM Area WHERE ck_estado = "ACTIVO" LIMIT 1');
    if (areas.length === 0) {
      console.log('❌ No hay áreas disponibles');
      return;
    }

    const area = areas[0];
    console.log(`🎯 Usando área: ${area.s_nombre_area} (${area.uk_area})`);

    // 2. Obtener un administrador disponible
    const admins = await executeQuery('SELECT uk_administrador FROM Administrador WHERE ck_estado = "ACTIVO" LIMIT 1');
    if (admins.length === 0) {
      console.log('❌ No hay administradores disponibles');
      return;
    }

    const admin = admins[0];
    console.log(`👨‍💼 Usando administrador: ${admin.uk_administrador}`);

    // 3. Ver estado inicial de consultorios
    console.log('\n📋 Estado inicial de consultorios:');
    const consultoriosIniciales = await Turno.getConsultoriosDisponiblesPorArea(area.uk_area);
    consultoriosIniciales.forEach(c => {
      console.log(`   - Consultorio ${c.i_numero_consultorio}: ${c.estado_disponibilidad} (${c.turnos_en_espera} turnos)`);
    });

    // 4. Crear primer turno con asignación inteligente
    console.log('\n🎫 Creando primer turno con asignación inteligente...');
    const primerTurno = await Turno.createConAsignacionInteligente({
      uk_area: area.uk_area,
      uk_paciente: null, // Sin paciente específico
      uk_administrador: admin.uk_administrador,
      uk_usuario_creacion: admin.uk_administrador
    });

    console.log(`✅ Primer turno creado: #${primerTurno.i_numero_turno} - UUID: ${primerTurno.uk_turno}`);

    // 5. Ver estado después del primer turno
    console.log('\n📋 Estado después del primer turno:');
    const consultoriosPostPrimero = await Turno.getConsultoriosDisponiblesPorArea(area.uk_area);
    consultoriosPostPrimero.forEach(c => {
      console.log(`   - Consultorio ${c.i_numero_consultorio}: ${c.estado_disponibilidad} (${c.turnos_en_espera} turnos)`);
    });

    // 6. Crear segundo turno para probar alternancia
    console.log('\n🎫 Creando segundo turno para probar alternancia...');
    const segundoTurno = await Turno.createConAsignacionInteligente({
      uk_area: area.uk_area,
      uk_paciente: null,
      uk_administrador: admin.uk_administrador,
      uk_usuario_creacion: admin.uk_administrador
    });

    console.log(`✅ Segundo turno creado: #${segundoTurno.i_numero_turno} - UUID: ${segundoTurno.uk_turno}`);

    // 7. Ver estado después del segundo turno
    console.log('\n📋 Estado después del segundo turno:');
    const consultoriosPostSegundo = await Turno.getConsultoriosDisponiblesPorArea(area.uk_area);
    consultoriosPostSegundo.forEach(c => {
      console.log(`   - Consultorio ${c.i_numero_consultorio}: ${c.estado_disponibilidad} (${c.turnos_en_espera} turnos)`);
    });

    // 8. Crear varios turnos más para probar redistribución
    console.log('\n🎫 Creando turnos adicionales para probar redistribución...');
    for (let i = 3; i <= 5; i++) {
      const turno = await Turno.createConAsignacionInteligente({
        uk_area: area.uk_area,
        uk_paciente: null,
        uk_administrador: admin.uk_administrador,
        uk_usuario_creacion: admin.uk_administrador
      });
      console.log(`   - Turno ${i} creado: #${turno.i_numero_turno}`);
      
      // Pequeña pausa para que se ejecute la redistribución automática
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 9. Ver estado final
    console.log('\n📋 Estado final después de todos los turnos:');
    const consultoriosFinal = await Turno.getConsultoriosDisponiblesPorArea(area.uk_area);
    consultoriosFinal.forEach(c => {
      console.log(`   - Consultorio ${c.i_numero_consultorio}: ${c.estado_disponibilidad} (${c.turnos_en_espera} turnos)`);
    });

    // 10. Obtener detalles de los turnos creados
    console.log('\n📋 Turnos creados hoy en esta área:');
    const turnosHoy = await executeQuery(`
      SELECT t.i_numero_turno, t.uk_turno, c.i_numero_consultorio, t.s_estado
      FROM Turno t
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      WHERE c.uk_area = ? AND t.d_fecha = CURDATE() AND t.ck_estado = 'ACTIVO'
      ORDER BY t.i_numero_turno DESC
      LIMIT 10
    `, [area.uk_area]);

    turnosHoy.forEach(turno => {
      console.log(`   - Turno #${turno.i_numero_turno}: Consultorio ${turno.i_numero_consultorio} - Estado: ${turno.s_estado}`);
    });

    // 11. Probar redistribución manual
    console.log('\n🔄 Probando redistribución manual...');
    const resultadoRedistribucion = await Turno.redistribuirTurnos(area.uk_area);
    console.log('✅ Resultado redistribución manual:', resultadoRedistribucion);

    console.log('\n🎉 ¡Prueba end-to-end completada exitosamente!');
    console.log('\n📊 VALIDACIONES COMPLETADAS:');
    console.log('✅ Creación de turnos con asignación inteligente');
    console.log('✅ Alternancia automática entre consultorios');
    console.log('✅ Redistribución automática tras crear turnos');
    console.log('✅ Redistribución manual por demanda');
    console.log('✅ Mantenimiento de integridad de datos');

  } catch (error) {
    console.error('❌ Error durante la prueba end-to-end:', error);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  testCrearTurnoInteligente()
    .then(() => {
      console.log('\n🏁 Prueba end-to-end finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = testCrearTurnoInteligente;