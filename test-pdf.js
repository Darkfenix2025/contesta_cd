const pdf = require('pdf-parse');
const fs = require('node:fs/promises');

async function leerPDF(rutaArchivo) {
    try {
        const dataBuffer = await fs.readFile(rutaArchivo);
        const data = await pdf(dataBuffer);
        console.log('Texto extraído:', data.text);
        console.log('Número de páginas:', data.numpages);
        console.log('Metadatos:', data.metadata);
        console.log('Información:', data.info);
        console.log('Versión PDF:', data.version);

    } catch (error) {
        console.error('Error al leer el PDF:', error);
    }
}

// Reemplaza 'ruta/a/tu/archivo.pdf' con la ruta *real* a tu archivo PDF.
//  - Puedes usar una ruta *absoluta* (ej: 'C:/Users/TuUsuario/Documentos/archivo.pdf').
//  - O una ruta *relativa* al archivo test-pdf.js (ej: 'archivo.pdf' si está en la misma carpeta).

leerPDF('CD LEMA CARLOS 13-2-25.pdf'); //Si el archivo esta en la misma carpeta
//leerPDF('ruta/a/tu/archivo.pdf'); //Si no esta en la misma carpeta.
