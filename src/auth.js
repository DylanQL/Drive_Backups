const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Scopes de Google Drive necesarios para subir archivos
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/**
 * Lee las credenciales desde el archivo JSON
 */
function loadCredentials() {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Archivo de credenciales no encontrado: ${credentialsPath}`);
  }

  const content = fs.readFileSync(credentialsPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Carga el token guardado si existe
 */
function loadToken() {
  const tokenPath = process.env.GOOGLE_TOKEN_PATH || './token.json';

  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, 'utf8');
    return JSON.parse(token);
  }

  return null;
}

/**
 * Guarda el token para futuros usos
 */
function saveToken(token) {
  const tokenPath = process.env.GOOGLE_TOKEN_PATH || './token.json';
  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
  console.log(`   ✓ Token guardado en: ${tokenPath}`);
}

/**
 * Obtiene un nuevo token mediante OAuth2
 */
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          AUTORIZACIÓN DE GOOGLE DRIVE REQUERIDA           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('Esta es la primera vez que ejecutas este programa.');
  console.log('Necesitas autorizar el acceso a Google Drive.\n');
  console.log('📋 PASOS A SEGUIR:\n');
  console.log('1️⃣  Abre la siguiente URL en tu navegador:\n');
  console.log(authUrl);
  console.log('\n2️⃣  Inicia sesión con tu cuenta de Google');
  console.log('3️⃣  Autoriza la aplicación');
  console.log('4️⃣  Copia el código que aparece en la página');
  console.log('5️⃣  Pégalo a continuación\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('🔑 Ingresa el código de autorización: ', (code) => {
      rl.close();

      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('\n❌ Error al obtener el token de acceso:', err.message);
          reject(err);
          return;
        }

        oAuth2Client.setCredentials(token);
        saveToken(token);

        console.log('\n✅ Autorización completada exitosamente!\n');
        resolve(oAuth2Client);
      });
    });
  });
}

/**
 * Crea y autentica un cliente OAuth2
 * @returns {Promise<OAuth2Client>} Cliente OAuth2 autenticado
 */
async function authenticateGoogle() {
  try {
    const credentials = loadCredentials();
    const { client_secret, client_id, redirect_uris } = credentials.installed;

    // Crear cliente OAuth2
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Intentar cargar token existente
    const token = loadToken();

    if (token) {
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    }

    // Si no hay token, obtener uno nuevo
    return await getNewToken(oAuth2Client);

  } catch (error) {
    console.error('❌ Error en la autenticación:', error.message);
    throw error;
  }
}

module.exports = {
  authenticateGoogle,
  loadCredentials,
  loadToken,
  saveToken
};
