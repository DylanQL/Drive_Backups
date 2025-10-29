const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Sube un archivo a Google Drive
 * @param {OAuth2Client} auth - Cliente OAuth2 autenticado
 * @param {string} filePath - Ruta completa del archivo a subir
 * @returns {Promise<string>} ID del archivo subido en Drive
 */
async function uploadToDrive(auth, filePath) {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const fileName = path.basename(filePath);
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe: ${filePath}`);
    }

    console.log(`   Archivo: ${fileName}`);
    console.log(`   Carpeta destino: ${folderId}`);

    // Metadata del archivo
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    // Media del archivo
    const media = {
      mimeType: 'application/sql',
      body: fs.createReadStream(filePath)
    };

    // Subir el archivo
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, size, createdTime, webViewLink'
    });

    // Calcular tamaño
    const fileSizeMB = (response.data.size / (1024 * 1024)).toFixed(2);
    const fileSizeKB = (response.data.size / 1024).toFixed(2);
    const sizeDisplay = response.data.size > 1024 * 1024
      ? `${fileSizeMB} MB`
      : `${fileSizeKB} KB`;

    console.log(`   Nombre: ${response.data.name}`);
    console.log(`   Tamaño: ${sizeDisplay}`);
    console.log(`   Fecha creación: ${new Date(response.data.createdTime).toLocaleString('es-ES')}`);

    return response.data.id;

  } catch (error) {
    if (error.message.includes('File not found')) {
      throw new Error(`La carpeta de Google Drive no existe o no tienes acceso: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
    }

    if (error.message.includes('invalid_grant')) {
      throw new Error('El token de autenticación ha expirado. Elimina el archivo token.json y vuelve a ejecutar el programa para reautorizar.');
    }

    throw new Error(`Error al subir archivo a Drive: ${error.message}`);
  }
}

/**
 * Lista los archivos en una carpeta de Google Drive
 * @param {OAuth2Client} auth - Cliente OAuth2 autenticado
 * @param {string} folderId - ID de la carpeta
 * @returns {Promise<Array>} Lista de archivos
 */
async function listFilesInFolder(auth, folderId) {
  try {
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, size, createdTime, modifiedTime)',
      orderBy: 'createdTime desc'
    });

    return response.data.files || [];

  } catch (error) {
    console.error('Error al listar archivos en Drive:', error.message);
    throw error;
  }
}

/**
 * Elimina archivos antiguos de Google Drive (opcional)
 * @param {OAuth2Client} auth - Cliente OAuth2 autenticado
 * @param {string} fileId - ID del archivo a eliminar
 */
async function deleteFileFromDrive(auth, fileId) {
  try {
    const drive = google.drive({ version: 'v3', auth });

    await drive.files.delete({
      fileId: fileId
    });

    console.log(`   ✓ Archivo eliminado de Drive: ${fileId}`);

  } catch (error) {
    console.error('Error al eliminar archivo de Drive:', error.message);
    throw error;
  }
}

module.exports = {
  uploadToDrive,
  listFilesInFolder,
  deleteFileFromDrive
};
