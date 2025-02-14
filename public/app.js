document.addEventListener('DOMContentLoaded', () => {
    const modoEntradaSelect = document.getElementById('modoEntrada');
    const entradaManualDiv = document.getElementById('entradaManual');
    const entradaArchivoDiv = document.getElementById('entradaArchivo');
    const textoInput = document.getElementById('texto');
    const archivoInput = document.getElementById('archivo');
    const procesarBtn = document.getElementById('procesar');
    const respuestaTextarea = document.getElementById('respuesta');
    const guardarDocxBtn = document.getElementById('guardar-docx');
    const guardarTxtBtn = document.getElementById('guardar-txt');
    const guardarPdfBtn = document.getElementById('guardar-pdf');

    //Cambio de entrada
    modoEntradaSelect.addEventListener('change', () => {
        if (modoEntradaSelect.value === 'manual') {
            entradaManualDiv.style.display = 'block';
            entradaArchivoDiv.style.display = 'none';
        } else {
            entradaManualDiv.style.display = 'none';
            entradaArchivoDiv.style.display = 'block';
        }
    });

    //Procesar
    procesarBtn.addEventListener('click', async () => {
        let formData = new FormData();
        let data = {};

        if (modoEntradaSelect.value === 'manual') {
            formData.append('texto', textoInput.value);
            data = { texto: textoInput.value };
        } else {
            if (!archivoInput.files[0]) {
                alert('Por favor, selecciona un archivo.');
                return;
            }
            formData.append('archivo', archivoInput.files[0]);
            data = formData;
        }

        try {
            let contentType = (modoEntradaSelect.value === 'manual') ? 'application/json' : undefined;
            let headers = contentType ? { 'Content-Type': contentType } : {};

            const response = await fetch('/procesar', {
                method: 'POST',
                body: (modoEntradaSelect.value === 'manual') ? JSON.stringify(data) : data,
                headers: headers,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al procesar la solicitud');
            }

            const dataRespuesta = await response.json();
            respuestaTextarea.value = dataRespuesta.respuesta; // Muestra el texto extraído

        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        }
    });

  //Boton guardar TXT
    guardarTxtBtn.addEventListener('click', () => {
        const texto = respuestaTextarea.value;
        if (!texto) {
            alert('No hay respuesta para guardar.');
            return;
        }
        // Crea un objeto Blob con el texto
        const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
        // Crea un enlace para descargar el Blob
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'respuesta.txt';  // Nombre del archivo
        document.body.appendChild(a); // Necesario para Firefox
        a.click();
        document.body.removeChild(a); // Limpieza
        URL.revokeObjectURL(url); // Libera recursos

    });

    //Boton guardar PDF
    guardarPdfBtn.addEventListener('click', () => {
        const texto = respuestaTextarea.value;
        if (!texto) {
            alert('No hay respuesta para guardar.');
            return;
        }
         // Importa la clase jsPDF desde el objeto global
        const { jsPDF } = window.jspdf;

        // Crea una instancia de jsPDF
        const doc = new jsPDF();

        // Divide el texto en líneas que quepan en la página
        const lineas = doc.splitTextToSize(texto, 180); // 180 es el ancho aproximado en mm

        // Agrega las líneas al documento PDF
        doc.text(lineas, 10, 10);

        // Guarda el documento PDF
        doc.save('respuesta.pdf');
    });

    // Botón Guardar como .docx (Usando docx.js)
    guardarDocxBtn.addEventListener('click', () => {
      const texto = respuestaTextarea.value;
        if (!texto) {
            alert('No hay respuesta para guardar.');
            return;
        }
        // Crear un nuevo documento
        const doc = new window.docx.Document({
            sections: [{
                properties: {},
                children: [
                    new window.docx.Paragraph({
                        children: [
                            new window.docx.TextRun(texto),
                        ],
                    }),
                ],
            }],
        });


        // Generar el blob del documento
        window.docx.Packer.toBlob(doc).then(blob => {
            // Crear un enlace para descargar el blob
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'respuesta.docx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    });
});