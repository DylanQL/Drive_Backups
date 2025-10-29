# 🚀 Sistema de Backup Automático MySQL con Google Drive

Sistema automatizado para realizar backups diarios de bases de datos MySQL y subirlos automáticamente a Google Drive.

## 📋 Características

- ✅ Backups automáticos diarios a las 00:00 horas
- ✅ Subida automática a Google Drive
- ✅ Autenticación OAuth2 con Google
- ✅ Configuración mediante variables de entorno
- ✅ Nombres de archivo con timestamp
- ✅ Logs detallados de cada operación
- ✅ Manejo robusto de errores

## 🛠️ Requisitos Previos

- Node.js (v14 o superior)
- MySQL Server instalado
- `mysqldump` disponible en el PATH del sistema
- Cuenta de Google con acceso a Google Drive
- Credenciales OAuth2 de Google Cloud Platform

## 📦 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd /path/to/Drive_Backups
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=123456
MYSQL_DATABASE=NexoSQL_DataBase

# Backup Configuration
BACKUP_DIR=/root/Backups_DB/NexoSQL_DB
BACKUP_TIME=00:00

# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID=181YL6VAnKGXge__0Khy71j9NJ9vehE-u
GOOGLE_CREDENTIALS_PATH=./client_secret_798840406022-nmdsf4pl9pu4flibq9rjq814gh8fb28v.apps.googleusercontent.com.json
GOOGLE_TOKEN_PATH=./token.json
```

### 4. Obtener credenciales de Google Drive API

Las credenciales OAuth2 ya están incluidas en el proyecto en el archivo:
```
client_secret_798840406022-nmdsf4pl9pu4flibq9rjq814gh8fb28v.apps.googleusercontent.com.json
```

## 🚀 Uso

### Ejecutar el programa

```bash
npm start
```

### Primera ejecución

La primera vez que ejecutes el programa, se te pedirá que autorices el acceso a Google Drive:

1. Se abrirá una URL en la consola
2. Copia y pega la URL en tu navegador
3. Inicia sesión con tu cuenta de Google
4. Autoriza la aplicación
5. Copia el código de autorización que aparece
6. Pégalo en la consola del programa

El token de autenticación se guardará en `token.json` para futuros usos.

### Ejecución en segundo plano

Para ejecutar el programa como servicio en segundo plano, puedes usar varias opciones:

#### Opción 1: PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar el servicio
pm2 start index.js --name "mysql-backup"

# Ver logs
pm2 logs mysql-backup

# Reiniciar
pm2 restart mysql-backup

# Detener
pm2 stop mysql-backup

# Configurar PM2 para iniciar al arranque del sistema
pm2 startup
pm2 save
```

#### Opción 2: nohup

```bash
nohup node index.js > backup.log 2>&1 &
```

#### Opción 3: screen

```bash
screen -S mysql-backup
node index.js
# Presiona Ctrl+A, luego D para desconectar
```

## 📁 Estructura del Proyecto

```
Drive_Backups/
├── src/
│   ├── auth.js          # Autenticación con Google OAuth2
│   ├── backup.js        # Lógica de backup de MySQL
│   └── drive.js         # Subida de archivos a Google Drive
├── index.js             # Archivo principal
├── package.json         # Dependencias del proyecto
├── .env                 # Variables de entorno (no incluir en git)
├── .gitignore          # Archivos a ignorar en git
├── client_secret_*.json # Credenciales de Google (sensible)
└── README.md           # Este archivo
```

## 🔧 Configuración Avanzada

### Cambiar el horario de backup

Edita el archivo `index.js` y modifica la expresión cron:

```javascript
// Backup diario a las 00:00
cron.schedule('0 0 * * *', async () => {
  await runBackupProcess();
});

// Otros ejemplos:
// '0 */6 * * *'   -> Cada 6 horas
// '0 2 * * *'     -> Todos los días a las 2:00 AM
// '0 12 * * 0'    -> Todos los domingos a las 12:00 PM
```

### Cambiar zona horaria

Modifica el parámetro `timezone` en el cron scheduler:

```javascript
cron.schedule('0 0 * * *', async () => {
  await runBackupProcess();
}, {
  timezone: "America/Mexico_City" // o tu zona horaria
});
```

### Limpiar backups antiguos

Puedes agregar lógica para eliminar backups antiguos del servidor local:

```javascript
// Agregar esta función en src/backup.js
function cleanOldBackups(daysToKeep = 7) {
  const backupDir = process.env.BACKUP_DIR;
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const fileAge = now - stats.mtime.getTime();

    if (fileAge > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`Backup antiguo eliminado: ${file}`);
    }
  });
}
```

## 🐛 Solución de Problemas

### Error: "mysqldump: command not found"

Asegúrate de que MySQL está instalado y `mysqldump` está en el PATH:

```bash
which mysqldump
# Si no está instalado:
sudo apt-get install mysql-client  # Ubuntu/Debian
sudo yum install mysql             # CentOS/RHEL
```

### Error: "Access denied for user"

Verifica las credenciales de MySQL en el archivo `.env`:

```bash
# Probar conexión manualmente
mysql -h localhost -u root -p123456 NexoSQL_DataBase
```

### Error: "File not found" en Google Drive

Verifica que el ID de la carpeta de Drive sea correcto y que tengas permisos de escritura.

### Token expirado

Si el token de Google expira, simplemente elimina el archivo `token.json` y ejecuta el programa nuevamente para reautorizar:

```bash
rm token.json
npm start
```

## 📊 Logs y Monitoreo

El programa genera logs detallados en la consola. Si usas PM2, puedes ver los logs con:

```bash
pm2 logs mysql-backup
```

Para redirigir logs a un archivo:

```bash
node index.js >> backup.log 2>&1
```

## 🔒 Seguridad

- ⚠️ **NUNCA** subas el archivo `.env` o `token.json` a un repositorio público
- ⚠️ **NUNCA** compartas tus credenciales de Google
- ✅ Mantén actualizadas las dependencias con `npm update`
- ✅ Usa contraseñas seguras para MySQL
- ✅ Limita los permisos del usuario de MySQL solo a lo necesario

## 📝 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `MYSQL_HOST` | Host del servidor MySQL | `localhost` |
| `MYSQL_USER` | Usuario de MySQL | `root` |
| `MYSQL_PASSWORD` | Contraseña de MySQL | `123456` |
| `MYSQL_DATABASE` | Nombre de la base de datos | `NexoSQL_DataBase` |
| `BACKUP_DIR` | Directorio para guardar backups | `/root/Backups_DB/NexoSQL_DB` |
| `GOOGLE_DRIVE_FOLDER_ID` | ID de la carpeta en Drive | `181YL6VAnKGXge__0Khy71j9NJ9vehE-u` |
| `GOOGLE_CREDENTIALS_PATH` | Ruta al archivo de credenciales | `./client_secret_*.json` |
| `GOOGLE_TOKEN_PATH` | Ruta donde guardar el token | `./token.json` |

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

ISC License

## 👤 Autor

**Angelo Dylan**

## 📞 Soporte

Si tienes problemas o preguntas, por favor:

1. Revisa la sección de "Solución de Problemas"
2. Verifica que todas las variables de entorno estén correctamente configuradas
3. Revisa los logs del programa para identificar errores específicos

---

**¡Hecho con ❤️ para automatizar tus backups!**