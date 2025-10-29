const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Asegura que el directorio de backups exista
 */
function ensureBackupDirectory() {
  const backupDir = process.env.BACKUP_DIR;

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`   ✓ Directorio de backups creado: ${backupDir}`);
  }
}

/**
 * Genera el nombre del archivo de backup con timestamp
 */
function generateBackupFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const dbName = process.env.MYSQL_DATABASE;
  return `${dbName}_${year}${month}${day}_${hours}${minutes}${seconds}.sql`;
}

/**
 * Crea un backup de la base de datos MySQL usando mysqldump
 * @returns {Promise<string>} Ruta completa del archivo de backup creado
 */
function backupDatabase() {
  return new Promise((resolve, reject) => {
    ensureBackupDirectory();

    const fileName = generateBackupFileName();
    const filePath = path.join(process.env.BACKUP_DIR, fileName);

    const host = process.env.MYSQL_HOST;
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;
    const database = process.env.MYSQL_DATABASE;

    // Comando mysqldump
    const command = `mysqldump -h ${host} -u ${user} -p${password} ${database} > ${filePath}`;

    console.log(`   Base de datos: ${database}`);
    console.log(`   Archivo: ${fileName}`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`   ❌ Error al ejecutar mysqldump: ${error.message}`);
        reject(error);
        return;
      }

      // mysqldump puede generar warnings en stderr, pero no son errores críticos
      if (stderr && !stderr.includes('Warning') && !stderr.includes('Using a password')) {
        console.error(`   ⚠️  Advertencia: ${stderr}`);
      }

      // Verificar que el archivo fue creado y tiene contenido
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);

        if (stats.size === 0) {
          reject(new Error('El archivo de backup está vacío'));
          return;
        }

        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        const fileSizeKB = (stats.size / 1024).toFixed(2);
        const sizeDisplay = stats.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

        console.log(`   Tamaño: ${sizeDisplay}`);
        console.log(`   Ubicación: ${filePath}`);

        resolve(filePath);
      } else {
        reject(new Error('El archivo de backup no fue creado'));
      }
    });
  });
}

module.exports = {
  backupDatabase,
  generateBackupFileName,
  ensureBackupDirectory
};
