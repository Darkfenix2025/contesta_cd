import sys
import os
import google.generativeai as genai
from dotenv import load_dotenv
from docx import Document
from PyPDF2 import PdfReader

# Cargar variables de entorno
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

def analizar_contrato(contrato_texto):
    """Analiza el contrato usando Gemini API y devuelve el resultado como texto."""

    if not API_KEY:
        print("Error: API Key de Gemini no configurada.", file=sys.stderr)  # Error a stderr
        return "Error: API Key no configurada."

    if not contrato_texto.strip():
        print("Error: No se proporcionó texto de contrato.", file=sys.stderr)
        return "Error: No se proporcionó texto de contrato."

    try:
        genai.configure(api_key=API_KEY)

        generation_config = {
          "temperature": 0.4,
          "top_p": 0.95,
          "top_k": 32,
          "max_output_tokens": 8192,
          "response_mime_type": "text/plain",
        }

        model = genai.GenerativeModel(
          model_name="gemini-2.0-pro-exp-02-05",
          generation_config=generation_config
        )

        prompt_analisis = f"""
        Actúa como un abogado profesional altamente experimentado de Argentina, con especialización en derecho contractual argentino. Tu tarea es analizar el siguiente contrato desde una perspectiva legal argentina.

        Por favor, realiza las siguientes acciones en tu análisis:

        1. **Resumen Ejecutivo:** Proporciona un resumen conciso del contrato, identificando las partes involucradas, el objeto del contrato y la finalidad principal del mismo.

        2. **Identificación de Cláusulas Clave:** Señala y explica las cláusulas más importantes y relevantes del contrato bajo la ley argentina.  Presta especial atención a cláusulas relacionadas con:
            * Objeto y alcance del contrato.
            * Precio, forma de pago y condiciones financieras.
            * Plazos y condiciones de cumplimiento.
            * Garantías y responsabilidades.
            * Confidencialidad.
            * Propiedad intelectual (si aplica).
            * Causales de rescisión y resolución del contrato.
            * Ley aplicable y jurisdicción competente (especificando si es ley argentina y tribunales argentinos, si corresponde).
            * Cláusulas penales o indemnizaciones.

        3. **Análisis de Riesgos y Puntos de Atención (Perspectiva Legal Argentina):**  Desde la perspectiva de un abogado argentino, identifica y explica cualquier posible riesgo legal, ambigüedad, o punto de atención que las partes deberían considerar cuidadosamente bajo la legislación argentina.  Señala cláusulas que podrían ser:
            * Desfavorables para alguna de las partes.
            * Poco claras o ambiguas según la interpretación de la ley argentina.
            * Potencialmente nulas o cuestionables bajo el Código Civil y Comercial de la Nación Argentina u otras leyes aplicables.
            * Que requieran mayor claridad o especificidad para evitar disputas futuras en Argentina.

        4. **Recomendaciones (Opcional, si es posible para el modelo):** Si es posible y pertinente, ofrece recomendaciones generales y concisas sobre cómo se podría mejorar el contrato desde un punto de vista legal argentino para proteger mejor los intereses de las partes o aclarar puntos ambiguos.

        **Formato de Salida:**  Presenta el análisis de forma clara y organizada, utilizando títulos y viñetas para facilitar la lectura.  Utiliza terminología legal precisa y apropiada para el derecho contractual argentino.

        **Contrato a analizar:**
        {contrato_texto}
        """

        response = model.generate_content(prompt_analisis)
        return response.text

    except Exception as e:
        print(f"Error al analizar el contrato: {e}", file=sys.stderr)  # Error a stderr
        return f"Error al analizar el contrato: {e}"


if __name__ == "__main__":
    if len(sys.argv) > 1:
        contrato_texto = " ".join(sys.argv[1:]) # Une todos los argumentos
        resultado = analizar_contrato(contrato_texto)
        print(resultado)  # Imprime el resultado en stdout
    else:
        print("Error: No se proporcionó texto de contrato.", file=sys.stderr)
        print("Error: No se proporcionó texto de contrato.")
