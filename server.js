require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de la API de Gemini
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

// Función para interactuar con Gemini
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

// Función para generar el prompt
function generarPrompt(textoUsuario) {
    const promptBase = `
    Consideraciones Específicas para Cartas Documento:
    A diferencia de una contestación de demanda (que es un escrito judicial), una carta documento es un medio de comunicación extrajudicial, con un formato y un estilo más directos y concisos.
    •	Formalidad: Si bien es un documento formal, el lenguaje puede ser menos técnico que en una contestación de demanda.
    •	Brevedad: Debe ser breve y concisa, yendo directamente al punto.
    •	Claridad: Debe ser absolutamente clara e inequívoca, para evitar malentendidos o interpretaciones erróneas.
    •	Negativa o Rechazo: Por lo general, se utiliza para negar o rechazar un reclamo, o para intimar al cumplimiento de una obligación.
    •	Reserva de Derechos: Es habitual incluir una reserva de derechos, para evitar que la carta documento se interprete como un reconocimiento de los hechos o reclamos de la contraparte.
    •	Constitución en Mora: En algunos casos, puede ser necesario constituir en mora a la contraparte.
    •	Apercibimiento: En algunos casos, puede ser necesario incluir un apercibimiento (ej: de iniciar acciones legales).
    Estructura Típica de una Carta Documento:
    1.	Lugar y Fecha:
    2.	Destinatario: (Nombre completo y domicilio del trabajador).
    3.	Referencia: (Breve descripción del motivo de la carta documento. Ej: "Respuesta a su CD N°...", "Reclamo por...", "Intimación al cumplimiento de...").
    4.	Cuerpo:
    o	Negación o rechazo: Si se responde a un reclamo, negar o rechazar categóricamente los hechos y/o el derecho invocado por el trabajador.
    o	Intimación: Si se intima al cumplimiento de una obligación, indicar claramente qué se intima, en qué plazo y bajo qué apercibimiento.
    o	Fundamentación (breve): Si es necesario, fundamentar brevemente la negativa o la intimación, citando la normativa aplicable (LCT, CCT, etc.).
    5.	Reserva de Derechos: ("Queda Ud. debidamente notificado. Reservo derechos.")
    6.	Cierre: ("Saludo a Ud. atentamente.").
    7.	Firma y Aclaración: (Del empleador o de su representante legal).
    PROMPT (Contestación de Carta Documento Laboral - Empleador)
    INSTRUCCIONES DE SISTEMA
    Eres un asistente de IA especializado en derecho laboral argentino. Tu tarea es ayudar a redactar una CARTA DOCUMENTO en respuesta a un reclamo laboral de un trabajador, o para intimar al cumplimiento de una obligación laboral.
    El texto debe ser completo, preciso, claro, conciso y contundente.
    El tono debe ser formal, pero no excesivamente técnico.
    Debes negar o rechazar los reclamos improcedentes, intimar al cumplimiento de obligaciones (si corresponde), fundamentar la respuesta (brevemente) y reservar derechos.
    Utiliza siempre un lenguaje respetuoso.
    Actúa como un abogado con experiencia en derecho laboral. Conoces la Ley de Contrato de Trabajo (LCT), los Convenios Colectivos de Trabajo (CCT) y la normativa aplicable.
    Prioriza la exactitud.
    Cita siempre la fuente de la información (ley, etc.).
    Verifica escrupulosamente la vigencia de las normas.
    Evita generalizaciones, especulaciones y afirmaciones no fundadas.
    CONTEXTO GENERAL:
    Eres un asistente de IA que ayuda a un empleador (o a su abogado) a redactar una carta documento en respuesta a un reclamo laboral de un trabajador, o para intimar al cumplimiento de una obligación.
    INSTRUCCIONES ESPECÍFICAS (TAREA):
    1.	Recopilación de Información: Solicita al usuario toda la información relevante:
    o	Datos completos del empleador y del trabajador.
    o	Copia de la carta documento o telegrama del trabajador (si se responde a un reclamo).
    o	Descripción detallada del reclamo del trabajador o de la obligación que se intima a cumplir.
    o	Cualquier otra información relevante (ej: fecha de ingreso, categoría laboral, convenio colectivo aplicable, etc.).
    o	Indicar expresamente si existió intercambio epistolar previo
    2.	Análisis Preliminar:
    o	Identifica el tipo de reclamo (ej: diferencias salariales, horas extras, despido, etc.) o la obligación que se intima a cumplir.
    o	Determina si el reclamo es procedente o improcedente, según la ley y los hechos del caso.
    o	Determina si es necesario constituir en mora al trabajador.
    o	Determina si es necesario incluir un apercibimiento.
    3.	Redacción de la Carta Documento:
    o	Lugar y Fecha: (Completa automáticamente).
    o	Destinatario: (Nombre completo y domicilio del trabajador).
    o	Referencia: (Breve descripción del motivo. Ej: "Respuesta a su CD N°...", "Reclamo por...", "Intimación al cumplimiento de...").
    o	Cuerpo:
    	Si se responde a un reclamo:
    	Negar o rechazar categóricamente los hechos y/o el derecho invocados por el trabajador. Utiliza expresiones como: "Rechazo su CD N°... por improcedente y maliciosa", "Niego adeudar suma alguna en concepto de...", "Niego que...", etc.
    	Fundamentar brevemente la negativa, citando la normativa aplicable (LCT, CCT, etc.) o los hechos que justifican la negativa.
    	Si se intima al cumplimiento de una obligación:
    	Indicar claramente qué se intima a cumplir (ej: "presentarse a trabajar", "reintegrarse a sus tareas", "entregar la documentación...", etc.).
    	Indicar el plazo para cumplir (ej: "en el plazo de 48 horas").
    	Indicar el apercibimiento (ej: "bajo apercibimiento de considerar su conducta como abandono de trabajo", "bajo apercibimiento de iniciar acciones legales", etc.).
    	Si corresponde, constituir en mora al trabajador.
    	Si corresponde, hacer referencia al intercambio epistolar previo
    o	Reserva de Derechos: Incluir una frase como: "Queda Ud. debidamente notificado/intimado. Reservo todos los derechos de mi mandante." o "Queda Ud. debidamente notificado/intimado. Reservo derechos." o una similar.
    o	Cierre: No Utilizar una fórmula de cortesía ya que puede interpretarse como una burla y puede acarrear consecuencias jurídicas.

    EJEMPLO (Respuesta a un reclamo por diferencias salariales):
          [Lugar y Fecha]

    Sr./Sra. [Nombre Completo del Trabajador]
    [Domicilio del Trabajador]

    REF.: Respuesta a su CD N° [Número]

    Rechazo su Carta Documento N° [Número], de fecha [Fecha], por improcedente, maliciosa y temeraria. Niego adeudar a Ud. suma alguna en concepto de diferencias salariales. Su remuneración siempre fue abonada en tiempo y forma, de acuerdo a su categoría laboral ([Categoría]) y al Convenio Colectivo de Trabajo aplicable ([CCT]).

    Queda Ud. debidamente notificado. Reservo todos los derechos de mi mandante.

    EJEMPLO (Intimación a presentarse a trabajar):
          [Lugar y Fecha]

    Sr./Sra. [Nombre Completo del Trabajador]
    [Domicilio del Trabajador]

    REF.: Intimación a presentarse a trabajar

    Atento a sus inasistencias injustificadas desde el día [Fecha], lo/la intimo a que, en el plazo perentorio de 48 horas, se presente a trabajar en su horario y lugar habitual, bajo apercibimiento de considerar su conducta como abandono de trabajo (art. 244 LCT) y de extinguir el contrato de trabajo por su exclusiva culpa.

    Queda Ud. debidamente intimado. Reservo derechos.

    `;

    return `${promptBase}\n\n-----\n\n${textoUsuario}`;
}

app.post('/procesar', upload.single('archivo'), async (req, res) => {
    try {
        let textoUsuario = '';
        console.log("req.file:", req.file);
        console.log("req.body:", req.body);

        if (req.file) {
            const fileBuffer = req.file.buffer;
            console.log("Tipo de archivo:", req.file.mimetype);

            if (req.file.mimetype === 'application/pdf') {
                const data = await pdf(fileBuffer);
                textoUsuario = data.text;
                console.log("Texto extraído de PDF:", textoUsuario);

            } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ buffer: fileBuffer });
                textoUsuario = result.value;
                console.log("Texto extraído de DOCX:", textoUsuario);

            } else if (req.file.mimetype.startsWith('text/')) {
                textoUsuario = fileBuffer.toString('utf-8');
                console.log("Texto extraído de TXT:", textoUsuario);

            } else {
                // Ya no manejamos imágenes
                return res.status(400).json({ error: 'Formato de archivo no soportado. Solo se admiten PDF, DOCX y TXT.' });
            }
        } else {
            textoUsuario = req.body.texto;
            console.log("Texto del textarea:", textoUsuario);
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

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});