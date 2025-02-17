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
    const promptBase = `... (Tu prompt para contestar cartas documento) ...`;
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