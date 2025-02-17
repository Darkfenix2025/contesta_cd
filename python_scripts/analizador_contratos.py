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
        Actúa como un abogado profesional altamente experimentado de Argentina... (El resto de tu prompt) ...
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