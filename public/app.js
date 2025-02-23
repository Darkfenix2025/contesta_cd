document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos Generales (simplificado) ---
    const btnCartasDocumento = document.getElementById('btnCartasDocumento');
    const btnContratos = document.getElementById('btnContratos');
    const seccionCartasDocumento = document.getElementById('seccionCartasDocumento');
    const seccionContratos = document.getElementById('seccionContratos');

    // --- Función para mostrar/ocultar secciones (REFACTORIZADA) ---
    function mostrarSeccion(seccionId) {
        // Oculta todas las secciones
        document.querySelectorAll('.seccion-principal').forEach(seccion => {
            seccion.style.display = 'none';
        });
        // Muestra la sección seleccionada
        document.getElementById(seccionId).style.display = 'block';
    }

    // --- Event Listeners para los Botones Principales (REFACTORIZADO) ---
    btnCartasDocumento.addEventListener('click', () => mostrarSeccion('seccionCartasDocumento'));
    btnContratos.addEventListener('click', () => mostrarSeccion('seccionContratos'));


    // --- Función para configurar una sección (REFACTORIZADA) ---
    function configurarSeccion(modoEntradaSelectId, entradaManualDivId, entradaArchivoDivId, textoInputId, archivoInputId, previsualizacionArchivoId, indicadorCargaId) {
        const modoEntradaSelect = document.getElementById(modoEntradaSelectId);
        const entradaManualDiv = document.getElementById(entradaManualDivId);
        const entradaArchivoDiv = document.getElementById(entradaArchivoDivId);
        const textoInput = document.getElementById(textoInputId);
        const archivoInput = document.getElementById(archivoInputId);
        const previsualizacionArchivo = document.getElementById(previsualizacionArchivoId);
        const indicadorCarga = document.getElementById(indicadorCargaId)

        // --- Cambio de Modo de Entrada ---
        modoEntradaSelect.addEventListener('change', () => {
            if (modoEntradaSelect.value === 'manual') {
                entradaManualDiv.style.display = 'block';
                entradaArchivoDiv.style.display = 'none';
            } else {
                entradaManualDiv.style.display = 'none';
                entradaArchivoDiv.style.display = 'block';
            }
            previsualizacionArchivo.innerHTML = '';
        });

        // --- Previsualización de Archivos ---
        archivoInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    let content = '';
                    if (file.type === 'application/pdf') {
                        content = `<iframe src="${e.target.result}" width="100%" height="500px"></iframe>`;
                    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'text/plain') {
                        content = `<pre>${e.target.result}</pre>`;
                    }
                    previsualizacionArchivo.innerHTML = content;
                };

                if (file.type === 'application/pdf') {
                    reader.readAsDataURL(file);
                } else {
                    reader.readAsText(file);
                }
            } else {
                previsualizacionArchivo.innerHTML = '';
            }
        });
    }

    // --- Configurar las secciones ---
    configurarSeccion('modoEntradaCD', 'entradaManualCD', 'entradaArchivoCD', 'textoCD', 'archivoCD', 'previsualizacionArchivoCD', 'indicadorCargaCD');
    configurarSeccion('modoEntradaContrato', 'entradaManualContrato', 'entradaArchivoContrato', 'textoContrato', 'archivoContrato', 'previsualizacionArchivoContrato', 'indicadorCargaContrato');

    // --- Función para enviar solicitudes al servidor (REFACTORIZADA) ---
    async function enviarSolicitud(ruta, texto, archivo) {
        const formData = new FormData();
        const data = {};

        if (texto) {
            formData.append('texto', texto);
            data.texto = texto;
        } else if (archivo) {
            formData.append('archivo', archivo);
        } else {
            throw new Error('Se debe proporcionar texto o archivo.'); // Mejor manejo de errores
        }

        const response = await fetch(ruta, {
            method: 'POST',
            body: texto ? JSON.stringify(data) : formData,
            headers: texto ? { 'Content-Type': 'application/json' } : {},
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar la solicitud');
        }

        return await response.json();
    }

    // --- Event Listeners para los Botones de Procesamiento (REFACTORIZADO) ---
    document.getElementById('procesarCarta').addEventListener('click', async () => {
      const seccion = "CD";
      mostrarIndicadorCarga(seccion);
        try {
            const texto = document.getElementById('textoCD').value;
            const archivo = document.getElementById('archivoCD').files[0];
            const dataRespuesta = await enviarSolicitud('/procesar', texto, archivo);
            document.getElementById('respuestaCarta').value = dataRespuesta.respuesta;
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        }finally{
          ocultarIndicadorCarga(seccion);
        }
    });

    document.getElementById('analizarContrato').addEventListener('click', async () => {
      const seccion = "Contrato";
      mostrarIndicadorCarga(seccion);
        try {
            const texto = document.getElementById('textoContrato').value;
            const archivo = document.getElementById('archivoContrato').files[0];
            const dataRespuesta = await enviarSolicitud('/analizar', texto, archivo);
            document.getElementById('analisisContrato').value = dataRespuesta.respuesta;
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        }finally{
          ocultarIndicadorCarga(seccion);
        }
    });

    // --- Funciones de descarga (REFACTORIZADA) ---
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
    function descargarComoTXT(texto, nombreArchivo) {
        descargarArchivo(texto, nombreArchivo, 'text/plain;charset=utf-8');
    }

    function descargarComoPDF(texto, nombreArchivo) {
        if (!texto) {
            alert('No hay contenido para guardar.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const lineas = doc.splitTextToSize(texto, 180);
        doc.text(lineas, 10, 10);
        doc.save(nombreArchivo);
    }

    function descargarComoDOCX(texto, nombreArchivo) {
      if (!texto) {
        alert('No hay contenido para guardar.');
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
        descargarArchivo(blob, nombreArchivo, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
    }

    // --- Event Listeners para los Botones de Descarga (REFACTORIZADO) ---
    document.getElementById('guardar-docx').addEventListener('click', () => descargarComoDOCX(document.getElementById('respuestaCarta').value, 'respuesta.docx'));
    document.getElementById('guardar-txt').addEventListener('click', () => descargarComoTXT(document.getElementById('respuestaCarta').value, 'respuesta.txt'));
    document.getElementById('guardar-pdf').addEventListener('click', () => descargarComoPDF(document.getElementById('respuestaCarta').value, 'respuesta.pdf'));

    document.getElementById('guardar-analisis-docx').addEventListener('click', () => descargarComoDOCX(document.getElementById('analisisContrato').value, 'analisis_contrato.docx'));
    document.getElementById('guardar-analisis-txt').addEventListener('click', () => descargarComoTXT(document.getElementById('analisisContrato').value, 'analisis_contrato.txt'));
    document.getElementById('guardar-analisis-pdf').addEventListener('click', () => descargarComoPDF(document.getElementById('analisisContrato').value, 'analisis_contrato.pdf'));
    // --- Funciones de mostrar y ocultar carga ---
    function mostrarIndicadorCarga(seccion) {
      if (seccion === "CD") {
        indicadorCargaCD.style.display = 'block'; // Muestra el indicador
        // Deshabilita los botones
        procesarCartaBtn.disabled = true;
        analizarContratoBtn.disabled = true;
      }else{
        indicadorCargaContrato.style.display = 'block';
        // Deshabilita los botones
        procesarCartaBtn.disabled = true;
        analizarContratoBtn.disabled = true;
      }

    }

    function ocultarIndicadorCarga(seccion) {
      if(seccion === "CD"){
        indicadorCargaCD.style.display = 'none'; // Oculta el indicador
        // Habilita los botones
        procesarCartaBtn.disabled = false;
        analizarContratoBtn.disabled = false;
      }else{
        indicadorCargaContrato.style.display = 'none';
        //Habilita los botones
        procesarCartaBtn.disabled = false;
        analizarContratoBtn.disabled = false;
      }
    }
});