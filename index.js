'use strict'
const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

functions.http('testStorageApi', async (req, res) => {

  const storage = new Storage({
    keyFilename: path.join(__dirname, 'test-funcition-411616-b897fdbfcc05.json') // Archivo de clave de cuenta de servicio
  });

  const bucketName = 'ftb-test-bucket'; // Nombre del bucket
  const bucket = storage.bucket(bucketName);

  switch (req.method) {
    case 'GET':
      // Descargar archivo
      const filenameGet = req.query.filename;
      if (filenameGet) {
        let file = await bucket.file(filenameGet);
        const [contents] = await file.download();
        const [metadata] = await file.getMetadata();

        const base64stringGet = Buffer.from(contents).toString('base64');
        const response = {
          filenameGet: metadata.name,
          size: metadata.size,
          contentType: metadata.contentType,
          url_bucket: `https://storage.cloud.google.com/${bucketName}/${filenameGet}`,
          file: base64stringGet
        };

        res.send({ success: true, data: response });
      } else {
        res.send({ success: false, message: 'No se ingreso nombre del archivo' });
      }
      break;
    
    case 'POST':
      // Subir archivo
      const base64stringPost = req.body.file;
      const buffer = Buffer.from(base64stringPost, 'base64');
      const filenamePost = req.body.filename;
      const file = bucket.file(filenamePost);

      if (base64stringPost && filenamePost) {
        const blobStream = file.createWriteStream({
          resumable: false,
          metadata: {
            contentType: 'auto' //req.body.extension
          }
        });
  
        blobStream.on('error', err => {
          res.send({ success: false, message: err.message });
        });
  
        blobStream.on('finish', () => {
          const publicUrl = `https://storage.cloud.google.com/${bucketName}/${filenamePost}`;
          res.send({ success: true, data: { filename: filenamePost, url_bucket: publicUrl } });
          // `File uploaded to ${publicUrl}`
        });
  
        blobStream.end(buffer);
      } else {
        res.send({ success: false, message: 'No se ingreso archivo' });
      }
      break;

      case 'PUT':
        // Actualizar archivo existente
        const base64stringPut = req.body.file;
        const bufferPut = Buffer.from(base64stringPut, 'base64');
        const filenamePut = req.body.filename;
        const filePut = bucket.file(filenamePut);

        if (base64stringPut && filenamePut) {
          const blobStreamPut = filePut.createWriteStream({
            resumable: false,
            metadata: {
              contentType: 'auto' //req.body.extension
            }
          });

          blobStreamPut.on('error', err => {
            res.send({ success: false, message: err.message });
          });

          blobStreamPut.on('finish', () => {
            const publicUrlPut = `http://storage.cloud.google.com/${bucketName}/${filenamePut}`;
            res.send({ success: true, data: { filename: filenamePut, url_bucket: publicUrlPut } });
          });

          blobStreamPut.end(bufferPut);
        } else {
          res.send({ success: false, message: 'No se ingreso archivo' });
        }
        break;

    default:
      res.send({ success: false, data: 'Accion no valida' });
      break;
  }
});