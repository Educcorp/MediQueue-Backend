require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyLastUser() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('🔍 Verificando el último usuario creado...\n');
    
    // Obtener el último usuario creado
    const [rows] = await conn.query(`
      SELECT 
        uk_administrador,
        s_nombre,
        s_apellido,
        s_email,
        s_usuario,
        d_fecha_creacion,
        s_verification_token,
        d_verification_token_expires,
        b_email_verified
      FROM Administrador 
      ORDER BY d_fecha_creacion DESC 
      LIMIT 1
    `);
    
    if (rows.length === 0) {
      console.log('❌ No se encontraron usuarios en la base de datos');
      await conn.end();
      return;
    }
    
    const user = rows[0];
    
    console.log('📊 Usuario más reciente:');
    console.log('━'.repeat(80));
    console.log(`👤 Nombre:          ${user.s_nombre} ${user.s_apellido}`);
    console.log(`📧 Email:           ${user.s_email}`);
    console.log(`🆔 Usuario:         ${user.s_usuario}`);
    console.log(`🔑 UUID:            ${user.uk_administrador}`);
    console.log(`📅 Fecha creación:  ${user.d_fecha_creacion}`);
    console.log('━'.repeat(80));
    
    if (user.s_verification_token) {
      console.log(`✅ Token guardado:  ${user.s_verification_token}`);
      console.log(`⏰ Token expira:    ${user.d_verification_token_expires}`);
      console.log(`📬 Email verificado: ${user.b_email_verified ? 'SÍ ✓' : 'NO (pendiente de verificación)'}`);
      console.log('\n🔗 Link de verificación:');
      console.log(`   http://localhost:3001/verify-email/${user.s_verification_token}`);
      
      // Calcular si el token ya expiró
      const now = new Date();
      const expires = new Date(user.d_verification_token_expires);
      const timeLeft = expires - now;
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      if (timeLeft > 0) {
        console.log(`\n⏳ Tiempo restante: ${hoursLeft}h ${minutesLeft}m`);
      } else {
        console.log('\n⚠️  El token ya expiró');
      }
    } else {
      console.log('❌ ERROR: No se guardó el token de verificación');
      console.log('   Esto significa que hay un problema con el INSERT en Administrador.create()');
    }
    
    console.log('\n' + '━'.repeat(80));
    
    await conn.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyLastUser();
