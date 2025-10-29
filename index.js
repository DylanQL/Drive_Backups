require('dotenv').config();
const cron = require('node-cron');
const { backupDatabase } = require('./src/backup');
const { uploadToDrive } = require('./src/drive');
const { authenticateGoogle } = require('./src/auth');

// Validar variables de entorno
function validateEnv() {
  const required = [
    'MYSQL_HOST',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DATABASE',
    'BACKUP_DIR',
    'GOOGLE_DRIVE_FOLDER_ID',
    'GOOGLE_CREDENTIALS_PATH'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Error: Faltan las siguientes variables de entorno:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
}

// Función principal para ejecutar el backup y subida
async function runBackupProcess() {
  console.log('\n===========================================');
  console.log('🚀 Iniciando proceso de backup...');
  console.log('===========================================');
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Lima' })}`);

  try {
    // Paso 1: Crear backup de la base de datos
    console.log('\n📦 Paso 1: Creando backup de MySQL...');
    const backupFilePath = await backupDatabase();
    console.log(`✅ Backup creado exitosamente: ${backupFilePath}`);

    // Paso 2: Autenticar con Google Drive
    console.log('\n🔐 Paso 2: Autenticando con Google Drive...');
    const auth = await authenticateGoogle();
    console.log('✅ Autenticación exitosa');

    // Paso 3: Subir el backup a Google Drive
    console.log('\n☁️  Paso 3: Subiendo backup a Google Drive...');
    const fileId = await uploadToDrive(auth, backupFilePath);
    console.log(`✅ Archivo subido exitosamente a Google Drive`);
    console.log(`   ID del archivo: ${fileId}`);

    console.log('\n===========================================');
    console.log('✨ Proceso completado con éxito!');
    console.log('===========================================\n');

  } catch (error) {
    console.error('\n❌ Error en el proceso de backup:', error.message);
    console.error('Detalles:', error);
  }
}

// Iniciar la aplicación
async function init() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Sistema de Backup Automático MySQL  ║');
  console.log('║        con Google Drive Sync          ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Validar variables de entorno
  validateEnv();
  console.log('✅ Variables de entorno validadas correctamente\n');

  // Mostrar configuración
  console.log('📋 Configuración actual:');
  console.log(`   Base de datos: ${process.env.MYSQL_DATABASE}`);
  console.log(`   Host: ${process.env.MYSQL_HOST}`);
  console.log(`   Usuario: ${process.env.MYSQL_USER}`);
  console.log(`   Directorio de backups: ${process.env.BACKUP_DIR}`);
  console.log(`   Carpeta de Drive: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
  console.log(`   Hora programada: ${process.env.BACKUP_TIME || '00:00'}\n`);

  // Ejecutar backup inmediatamente al iniciar (opcional, comentar si no se desea)
  console.log('🔄 Ejecutando backup inicial...');
  await runBackupProcess();

  // Programar backups diarios a las 00:00
  console.log('⏰ Programando backups automáticos diarios a las 00:00 horas...');
  cron.schedule('0 0 * * *', async () => {
    await runBackupProcess();
  }, {
    timezone: "America/Lima" // Ajusta según tu zona horaria
  });

  console.log('✅ Scheduler activado. El sistema está corriendo...');
  console.log('💡 Presiona Ctrl+C para detener el programa\n');
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Error no manejado:', error);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Deteniendo el sistema de backup...');
  console.log('✅ Sistema detenido correctamente');
  process.exit(0);
});

// Iniciar la aplicación
init().catch(error => {
  console.error('❌ Error fatal al iniciar la aplicación:', error);
  process.exit(1);
});
