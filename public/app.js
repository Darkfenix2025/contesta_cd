document.addEventListener('DOMContentLoaded', () => {
    const modoEntradaSelect = document.getElementById('modoEntrada');
    const entradaManualDiv = document.getElementById('entradaManual');
    const entradaArchivoDiv = document.getElementById('entradaArchivo');
    const textoInput = document.getElementById('texto');
    const archivoInput = document.getElementById('archivo');
    const procesarCartaBtn = document.getElementById('procesarCarta');
    const analizarContratoBtn = document.getElementById('analizarContrato');
    const respuestaCartaTextarea = document.getElementById('respuestaCarta');
    const analisisContratoTextarea = document.getElementById('analisisContrato');
    const guardarDocxBtn = document.getElementById('guardar-docx');
    const guardarTxtBtn = document.getElementById('guardar-txt');
    const guardarPdfBtn = document.getElementById('guardar-pdf');
    const guardarAnalisisDocxBtn = document.getElementById('guardar-analisis-docx');
    const guardarAnalisisTxtBtn = document.getElementById('guardar-analisis-txt');
    const guardarAnalisisPdfBtn = document.getElementById('guardar-analisis-pdf');
    const indicadorCarga = document.getElementById('indicadorCarga'); // Obtiene el indicador
    const previsualizacionArchivo = document.getElementById('previsualizacionArchivo');


    // --- Funciones de utilidad ---
    function descargarArchivo(contenido, nombreArchivo, tipoMime) {
        const blob = new Blob([contenido], { type: tipoMime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function mostrarIndicadorCarga() {
        indicadorCarga.style.display = 'block'; // Muestra el indicador
        // Deshabilita los botones
        procesarCartaBtn.disabled = true;
        analizarContratoBtn.disabled = true;
    }

    function ocultarIndicadorCarga() {
        indicadorCarga.style.display = 'none'; // Oculta el indicador
        // Habilita los botones
        procesarCartaBtn.disabled = false;
        analizarContratoBtn.disabled = false;
    }

    // --- Cambio de entrada ---
    modoEntradaSelect.addEventListener('change', () => {
        if (modoEntradaSelect.value === 'manual') {
            entradaManualDiv.style.display = 'block';
            entradaArchivoDiv.style.display = 'none';
        } else {
            entradaManualDiv.style.display = 'none';
            entradaArchivoDiv.style.display = 'block';
        }
         // Limpia la previsualización al cambiar el modo de entrada
        previsualizacionArchivo.innerHTML = '';
    });

    // --- Previsualización de archivos ---
    archivoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                let content = '';
                if (file.type === 'application/pdf') {
                    // Previsualización de PDF (usando un iframe)
                    content = `<iframe src="${e.target.result}" width="100%" height="500px"></iframe>`;
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'text/plain') {
                    // Previsualización de texto (TXT y DOCX)
                    content = `<pre>${e.target.result}</pre>`; // <pre> para mantener el formato
                }
                previsualizacionArchivo.innerHTML = content;
            };

            if (file.type === 'application/pdf') {
                reader.readAsDataURL(file); // Lee como Data URL para el iframe
            } else {
                reader.readAsText(file);  // Lee como texto para TXT y DOCX
            }
        } else {
            previsualizacionArchivo.innerHTML = ''; // Limpia si no hay archivo
        }
    });



    // --- Procesar Carta Documento ---
    procesarCartaBtn.addEventListener('click', async () => {
        mostrarIndicadorCarga(); // Muestra el indicador antes de la solicitud
        const formData = new FormData();
        const data = {};

        if (modoEntradaSelect.value === 'manual') {
            formData.append('texto', textoInput.value);
            data.texto = textoInput.value;
        } else {
            if (!archivoInput.files[0]) {
                alert('Por favor, selecciona un archivo.');
                ocultarIndicadorCarga(); // Oculta el indicador si hay un error
                return;
            }
            formData.append('archivo', archivoInput.files[0]);
        }

        try {
            const response = await fetch('/procesar', {
                method: 'POST',
                body: modoEntradaSelect.value === 'manual' ? JSON.stringify(data) : formData,
                headers: modoEntradaSelect.value === 'manual' ? { 'Content-Type': 'application/json' } : {},
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al procesar la solicitud');
            }

            const dataRespuesta = await response.json();
            respuestaCartaTextarea.value = dataRespuesta.respuesta;

        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        } finally {
            ocultarIndicadorCarga(); // Oculta el indicador después de la respuesta (éxito o error)
        }
    });

    // --- Analizar Contrato ---
    analizarContratoBtn.addEventListener('click', async () => {
        mostrarIndicadorCarga(); // Muestra el indicador
        const formData = new FormData();
        const data = {};

        if (modoEntradaSelect.value === 'manual') {
            formData.append('texto', textoInput.value);
            data.texto = textoInput.value;
        } else {
            if (!archivoInput.files[0]) {
                alert('Por favor, selecciona un archivo.');
                ocultarIndicadorCarga(); // Oculta si hay error
                return;
            }
            formData.append('archivo', archivoInput.files[0]);
        }

        try {
            const response = await fetch('/analizar', {
                method: 'POST',
                body: modoEntradaSelect.value === 'manual' ? JSON.stringify(data) : formData,
                headers: modoEntradaSelect.value === 'manual' ? { 'Content-Type': 'application/json' } : {},
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al analizar el contrato');
            }

            const dataRespuesta = await response.json();
            analisisContratoTextarea.value = dataRespuesta.respuesta;

        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        } finally {
            ocultarIndicadorCarga(); // Oculta después de la respuesta
        }
    });

    // --- Botones de Guardar (Cartas Documento) ---

    guardarTxtBtn.addEventListener('click', () => {
        descargarArchivo(respuestaCartaTextarea.value, 'respuesta.txt', 'text/plain;charset=utf-8');
    });

    guardarPdfBtn.addEventListener('click', () => {
        const texto = respuestaCartaTextarea.value;
        if (!texto) {
            alert('No hay respuesta para guardar.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const lineas = doc.splitTextToSize(texto, 180);
        doc.text(lineas, 10, 10);
        doc.save('respuesta.pdf');
    });

    guardarDocxBtn.addEventListener('click', () => {
        const texto = respuestaCartaTextarea.value;
          if (!texto) {
              alert('No hay respuesta para guardar.');
              return;
          }
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
          window.docx.Packer.toBlob(doc).then(blob => {
              descargarArchivo(blob, 'respuesta.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          });
      });

    // --- Botones de Guardar (Análisis de Contratos) ---

    guardarAnalisisTxtBtn.addEventListener('click', () => {
        descargarArchivo(analisisContratoTextarea.value, 'analisis_contrato.txt', 'text/plain;charset=utf-8');
    });

    guardarAnalisisPdfBtn.addEventListener('click', () => {
        const texto = analisisContratoTextarea.value;
        if (!texto) {
            alert('No hay análisis para guardar.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const lineas = doc.splitTextToSize(texto, 180);
        doc.text(lineas, 10, 10);
        doc.save('analisis_contrato.pdf');
    });

    guardarAnalisisDocxBtn.addEventListener('click', () => {
        const texto = analisisContratoTextarea.value;
        if (!texto) {
            alert('No hay análisis para guardar.');
            return;
        }
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
        window.docx.Packer.toBlob(doc).then(blob => {
            descargarArchivo(blob, 'analisis_contrato.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        });
    });
});