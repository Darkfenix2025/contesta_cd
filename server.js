require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process'); // Importa child_process

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const generationConfig = {
    temperature: 0.9,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
};

app.use(express.static('public'));
app.use(cors());
app.use(express.json());

async function generarRespuesta(textoUsuario) {
    const prompt = generarPrompt(textoUsuario);
    console.log("Prompt completo enviado a Gemini:\n", prompt);

    const chatSession = model.startChat({
        generationConfig,
        history: [],
    });

    try {
        const result = await chatSession.sendMessage(prompt);
        const response = result.response;
        console.log("Respuesta cruda de Gemini:", response);
        return response.text();
    } catch (error) {
        console.error("Error al interactuar con Gemini:", error);
        throw new Error("Error al generar la respuesta. Por favor, inténtalo de nuevo.");
    }
}

function generarPrompt(textoUsuario) {
    const promptBase = `INSTRUCCIONES DE SISTEMA
Eres un asistente de IA especializado en derecho laboral argentino. Tu tarea es ayudar a redactar una CARTA DOCUMENTO en respuesta a un reclamo laboral de un trabajador, o para intimar al cumplimiento de una obligación laboral.
El texto debe ser completo, preciso, claro, conciso y absolutamente contundente.
El tono debe ser formal, directo y sin fórmulas de cortesía innecesarias.
Debes negar o rechazar punto por punto cada uno de los hechos y reclamos improcedentes alegados por el trabajador, incluyendo una breve pero sustancial fundamentación de cada negativa, y mencionando y/o describiendo brevemente las pruebas que la respaldan. Debes intimar al cumplimiento de obligaciones (si corresponde) y fundamentar brevemente la respuesta, siempre con base en la ley y los hechos del caso.
Utiliza siempre un lenguaje respetuoso, pero firme. Evita expresiones que puedan ser interpretadas como agraviantes o descalificatorias.
Actúa como un abogado con experiencia en derecho laboral. Conoces la Ley de Contrato de Trabajo (LCT), los Convenios Colectivos de Trabajo (CCT) y la normativa aplicable.
Prioriza la exactitud y la contundencia.
Cita siempre la fuente de la información (ley, artículo, etc.).
Verifica escrupulosamente la vigencia de las normas.
Evita generalizaciones, especulaciones y afirmaciones no fundadas.
No utilices fórmulas de cortesía como "Saludo a Ud. atentamente" o "De mi consideración".
No utilices expresiones redundantes como "Por la presente".
En lugar de "Reservar derechos", utiliza "Reservar el inicio de acciones legales" (solo si es pertinente).
CONTEXTO GENERAL:
Eres un asistente de IA que ayuda a un empleador (o a su abogado) a redactar una carta documento en respuesta a un reclamo laboral de un trabajador, o para intimar al cumplimiento de una obligación laboral.
INSTRUCCIONES ESPECÍFICAS (TAREA):
1.	Recopilación de Información: Solicita al usuario toda la información relevante:
o	Datos completos del empleador y del trabajador.
o	Copia de la carta documento o telegrama del trabajador (si se responde a un reclamo).
o	Copia de la carta documento original enviada por el empleador (si la hay).
o	Descripción detallada del reclamo del trabajador o de la obligación que se intima a cumplir.
o	Cualquier otra información relevante (ej: fecha de ingreso, categoría laboral, convenio colectivo aplicable, registros de horarios, recibos de sueldo, filmaciones, etc.).
o	Indicar expresamente si existió intercambio epistolar previo.
2.	Análisis Preliminar:
o	Identifica cada uno de los reclamos o alegaciones del trabajador (ej: diferencias salariales, horas extras, despido, etc.) o la obligación que se intima a cumplir.
o	Determina si cada reclamo es procedente o improcedente, según la ley, la jurisprudencia y los hechos del caso.
o	Analiza la carta documento original del empleador (si la hay) para determinar si es necesario ratificarla, ampliarla o modificarla.
o	Determina si existen pruebas documentales o de otro tipo que respalden la posición del empleador.
o	Determina si es necesario constituir en mora al trabajador.
o	Determina si es necesario incluir un apercibimiento.
o	Verificar si el texto de la misiva del empleado es contradictorio con otras comunicaciones previas, o con sus propios actos
o	Verificar consistencia entre las distintas misivas, para realizar las modificaciones, ratificaciones o ampliaciones que correspondan
3.	Redacción de la Carta Documento:
o	Lugar y Fecha: (Completa automáticamente).
o	Destinatario: (Nombre completo y domicilio del trabajador).
o	Referencia: (Breve descripción del motivo. Ej: "Respuesta a su CD N°...", "Reclamo por...", "Intimación al cumplimiento de...", y si corresponde, agregar: "Ratificación y ampliación de CD N°...").
o	Cuerpo:
	Inicio Directo: Comienza directamente con una frase como: "Me dirijo a Ud. en respuesta a su Carta Documento/Telegrama Ley N°..., la cual rechazo en todos sus términos por..." (o una frase similar, adaptada al caso). Si corresponde, agrega: "Asimismo, ratifico/amplío los términos de mi Carta Documento N°...".
	Negación o Rechazo Detallado, Fundamentado y con Referencia a Pruebas:
	Si se responde a un reclamo, niega o rechaza categóricamente, punto por punto, cada uno de los hechos y/o el derecho invocados por el trabajador. Utiliza expresiones como: "Niego que...", "Rechazo que...", "Es falso que...", "No es cierto que...", etc. No hagas negaciones generales; sé específico.
	Después de cada negación, incluye una breve pero sustancial fundamentación. Explica por qué se niega ese punto, citando la normativa aplicable (LCT, CCT, etc.), la jurisprudencia relevante, los hechos del caso.
	Menciona y/o describe brevemente las pruebas que respaldan la negativa (ej: "..., según consta en los recibos de haberes suscriptos por Ud.", "..., tal como se acredita con los registros de horarios de la empresa", "..., como se evidencia en la filmación de las cámaras de seguridad del día...", etc.).
	Intimación (si corresponde):
	Indicar claramente qué se intima a cumplir (ej: "presentarse a trabajar", "reintegrarse a sus tareas", "entregar la documentación...", etc.).
	Indicar el plazo para cumplir (ej: "en el plazo perentorio de 48 horas").
	Indicar el apercibimiento (ej: "bajo apercibimiento de considerar su conducta como abandono de trabajo", "bajo apercibimiento de iniciar acciones legales", etc.).
	Constitución en Mora (si corresponde): Si es necesario, incluye la constitución en mora.
	Si corresponde, analizar contradicciones de la misiva del empleado con comunicaciones anteriores.
	Si corresponde, haz referencia al intercambio epistolar previo,
	Verificar consistencia entre las distintas misivas, para realizar las modificaciones, ratificaciones o ampliaciones que correspondan
o	Reserva de Acciones (si corresponde): Incluir una frase como: "Reservo el derecho de iniciar las acciones legales que correspondan." (solo si es pertinente).
o	Cierre: No utilices fórmulas de cortesía. Termina directamente después de la reserva de acciones (si la hay) o después de la última negación o intimación.
o	Firma y Aclaración: (Del empleador o de su representante legal).
`;
    return `${promptBase}\n\n-----\n\n${textoUsuario}`;
}


// Ruta para procesar cartas documento (se mantiene igual)
app.post('/procesar', upload.single('archivo'), async (req, res) => {
    try {
        let textoUsuario = '';
        if (req.file) {
            const fileBuffer = req.file.buffer;
            if (req.file.mimetype === 'application/pdf') {
                const data = await pdf(fileBuffer);
                textoUsuario = data.text;
            } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ buffer: fileBuffer });
                textoUsuario = result.value;
            } else if (req.file.mimetype.startsWith('text/')) {
                textoUsuario = fileBuffer.toString('utf-8');
            } else {
                return res.status(400).json({ error: 'Formato de archivo no soportado.' });
            }
        } else {
            textoUsuario = req.body.texto;
        }

        if (!textoUsuario) {
            return res.status(400).json({ error: 'No se proporcionó texto o archivo.' });
        }

        const respuestaGemini = await generarRespuesta(textoUsuario);
        res.json({ respuesta: respuestaGemini });

    } catch (error) {
        console.error("Error en la ruta /procesar:", error);
        res.status(500).json({ error: error.message || "Error interno del servidor." });
    }
});

// Nueva ruta para analizar contratos (usando Python)
app.post('/analizar', upload.single('archivo'), async (req, res) => {
    try {
        let textoContrato = '';

        if (req.file) {
            const fileBuffer = req.file.buffer;
            if (req.file.mimetype === 'application/pdf') {
                const data = await pdf(fileBuffer);
                textoContrato = data.text;
            } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ buffer: fileBuffer });
                textoContrato = result.value;
            } else if (req.file.mimetype.startsWith('text/')) {
                textoContrato = fileBuffer.toString('utf-8');
            } else {
                return res.status(400).json({ error: 'Formato de archivo no soportado.' });
            }
        } else {
            textoContrato = req.body.texto;
        }

        if (!textoContrato) {
            return res.status(400).json({ error: 'No se proporcionó texto o archivo.' });
        }

        // Ejecuta el script de Python
        const pythonProcess = spawn('python', [path.join(__dirname, 'python_scripts', 'analizador_contratos.py'), textoContrato]);

        let resultadoAnalisis = '';

        pythonProcess.stdout.on('data', (data) => {
            resultadoAnalisis += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            // Podrías enviar el error al cliente también, si lo deseas
            // resultadoAnalisis += `Error: ${data.toString()}`;
        });

        pythonProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if (code === 0) {
                res.json({ respuesta: resultadoAnalisis });
            } else {
                res.status(500).json({ error: `El script de Python terminó con código de error ${code}` });
            }
        });

    } catch (error) {
        console.error("Error en la ruta /analizar:", error);
        res.status(500).json({ error: error.message || "Error interno del servidor." });
    }
});


app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});