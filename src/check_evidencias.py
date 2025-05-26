import os
import pandas as pd
from typing import Dict
import google.generativeai as genai
from PIL import Image
import logging
from dotenv import load_dotenv
import argparse
import json

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('validacion_evidencias.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EvidenciaValidator:
    def __init__(self):
        """Inicializa el validador de evidencias con la API key de Gemini."""
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("No se encontró la API key de Google en el archivo .env")
            
        genai.configure(api_key=api_key)
        # Usamos gemini-pro-vision que es el modelo más avanzado para análisis de imágenes
        self.model = genai.GenerativeModel('gemini-pro-vision')
        logger.info("Validador de evidencias inicializado correctamente")
        
    def validar_evidencia(self, ruta_imagen: str, datos_empleado: Dict) -> Dict:
        """
        Valida una evidencia contra los datos del empleado.
        
        Args:
            ruta_imagen: Ruta a la imagen de la evidencia
            datos_empleado: Diccionario con los datos del empleado del CSV
            
        Returns:
            Dict con los resultados de la validación
        """
        try:
            logger.info(f"Procesando evidencia para {datos_empleado['Nombre_Empleado']} - {datos_empleado['Nombre_Subproyecto']}")
            logger.debug(f"Ruta de imagen: {ruta_imagen}")
            
            # Cargar y procesar la imagen
            imagen = Image.open(ruta_imagen)
            logger.debug(f"Imagen cargada: {imagen.size} - {imagen.mode}")
            
            # Preparar el prompt para Gemini
            prompt = self._generar_prompt(datos_empleado)
            logger.debug(f"Prompt generado: {prompt}")
            
            # Obtener respuesta de Gemini
            respuesta = self._analizar_imagen(imagen, prompt)
            logger.debug(f"Respuesta de Gemini: {respuesta}")
            
            # Procesar la respuesta
            resultado = self._procesar_respuesta(respuesta, datos_empleado)
            logger.info(f"Resultado validación - Nombre: {resultado['Nombre_ok']}, Periodo: {resultado['Periodo_ok']}, Tarea: {resultado['Tarea_ok']}")
            
            return resultado
            
        except Exception as e:
            logger.error(f"Error al validar evidencia: {str(e)}", exc_info=True)
            return {
                "Nombre_ok": 0,
                "Periodo_ok": 0,
                "Tarea_ok": 0,
                "Descripcion_tarea": f"Error al procesar: {str(e)}"
            }
    
    def _generar_prompt(self, datos_empleado: Dict) -> str:
        """Genera el prompt para Gemini basado en los datos del empleado."""
        return f"""
        Analiza esta imagen y proporciona una respuesta estructurada en formato JSON con los siguientes campos:

        1. nombre_encontrado: Verifica si aparece el nombre "{datos_empleado['Nombre_Empleado']}" en la imagen
        2. fecha_encontrada: Extrae cualquier fecha visible en la imagen
        3. contenido_relevante: Describe el contenido de la imagen y su relación con el proyecto "{datos_empleado['Nombre_Subproyecto']}"
        4. tareas_identificadas: Lista las tareas o actividades que se pueden identificar en la imagen
        5. justificacion: Explica cómo el contenido justifica la participación en el proyecto

        Responde SOLO con el JSON, sin texto adicional.
        """
    
    def _analizar_imagen(self, imagen: Image.Image, prompt: str) -> str:
        """Analiza la imagen usando Gemini."""
        try:
            logger.debug("Enviando imagen a Gemini para análisis")
            response = self.model.generate_content([prompt, imagen])
            logger.debug("Respuesta recibida de Gemini")
            return response.text
        except Exception as e:
            logger.error(f"Error al analizar imagen con Gemini: {str(e)}", exc_info=True)
            return "{}"
    
    def _procesar_respuesta(self, respuesta: str, datos_empleado: Dict) -> Dict:
        """Procesa la respuesta de Gemini y genera el resultado de validación."""
        try:
            # Intentar parsear la respuesta como JSON
            datos = json.loads(respuesta)
            logger.debug(f"Datos parseados: {json.dumps(datos, indent=2)}")
            
            # Validar nombre
            nombre_ok = 1 if datos.get('nombre_encontrado', False) else 0
            logger.debug(f"Validación nombre: {nombre_ok}")
            
            # Validar periodo (asumimos que cualquier fecha en 2024 es válida)
            fecha = datos.get('fecha_encontrada', '')
            periodo_ok = 1 if '2024' in fecha else 0
            logger.debug(f"Validación periodo: {periodo_ok} (fecha encontrada: {fecha})")
            
            # Validar tareas
            tareas = datos.get('tareas_identificadas', [])
            tarea_ok = 1 if tareas else 0
            logger.debug(f"Validación tareas: {tarea_ok} (tareas: {tareas})")
            
            # Generar descripción
            descripcion = f"""
            Contenido: {datos.get('contenido_relevante', 'No se pudo analizar')}
            Tareas identificadas: {', '.join(tareas) if isinstance(tareas, list) else tareas}
            Justificación: {datos.get('justificacion', 'No se pudo justificar')}
            """
            
            return {
                "Nombre_ok": nombre_ok,
                "Periodo_ok": periodo_ok,
                "Tarea_ok": tarea_ok,
                "Descripcion_tarea": descripcion.strip()
            }
            
        except Exception as e:
            logger.error(f"Error al procesar respuesta: {str(e)}", exc_info=True)
            return {
                "Nombre_ok": 0,
                "Periodo_ok": 0,
                "Tarea_ok": 0,
                "Descripcion_tarea": f"Error al procesar respuesta: {str(e)}"
            }

class ProcesadorEvidencias:
    def __init__(self, validator: EvidenciaValidator):
        """Inicializa el procesador de evidencias."""
        self.validator = validator
        logger.info("Procesador de evidencias inicializado")
        
    def procesar_csv(self, ruta_csv: str, ruta_salida: str, limite_lineas: int = None):
        """
        Procesa el CSV de evidencias y genera un nuevo CSV con los resultados.
        
        Args:
            ruta_csv: Ruta al CSV de entrada
            ruta_salida: Ruta donde guardar el CSV de resultados
            limite_lineas: Número máximo de líneas a procesar (None para procesar todas)
        """
        try:
            logger.info(f"Iniciando procesamiento de CSV: {ruta_csv}")
            logger.info(f"Límite de líneas: {limite_lineas if limite_lineas else 'Sin límite'}")
            
            # Leer CSV
            df = pd.read_csv(ruta_csv)
            total_original = len(df)
            
            # Aplicar límite si se especifica
            if limite_lineas:
                df = df.head(limite_lineas)
                logger.info(f"Se procesarán {limite_lineas} líneas de {total_original}")
            
            # Procesar cada fila
            resultados = []
            total = len(df)
            for idx, row in df.iterrows():
                logger.info(f"Procesando evidencia {idx + 1} de {total}")
                resultado = self.validator.validar_evidencia(
                    row['Ruta_Evidencia'],
                    row.to_dict()
                )
                resultados.append(resultado)
            
            # Crear DataFrame con resultados
            df_resultados = pd.DataFrame(resultados)
            
            # Guardar resultados
            df_resultados.to_csv(ruta_salida, index=False)
            logger.info(f"Resultados guardados en {ruta_salida}")
            
            # Generar resumen
            self._generar_resumen(df_resultados)
            
        except Exception as e:
            logger.error(f"Error al procesar CSV: {str(e)}", exc_info=True)
            raise
            
    def _generar_resumen(self, df_resultados: pd.DataFrame):
        """Genera un resumen de los resultados."""
        total = len(df_resultados)
        nombre_ok = df_resultados['Nombre_ok'].sum()
        periodo_ok = df_resultados['Periodo_ok'].sum()
        tarea_ok = df_resultados['Tarea_ok'].sum()
        
        resumen = f"""
        Resumen de validación:
        - Total de evidencias procesadas: {total}
        - Nombres validados correctamente: {nombre_ok} ({nombre_ok/total*100:.1f}%)
        - Periodos validados correctamente: {periodo_ok} ({periodo_ok/total*100:.1f}%)
        - Tareas validadas correctamente: {tarea_ok} ({tarea_ok/total*100:.1f}%)
        """
        logger.info(resumen)

def main():
    """Función principal del programa."""
    try:
        # Configurar argumentos de línea de comandos
        parser = argparse.ArgumentParser(description='Validador de evidencias I+D')
        parser.add_argument('--limite', type=int, help='Número máximo de líneas a procesar')
        parser.add_argument('--debug', action='store_true', help='Activar modo debug')
        args = parser.parse_args()
        
        # Configurar nivel de logging
        if args.debug:
            logger.setLevel(logging.DEBUG)
            logger.debug("Modo debug activado")
        
        # Inicializar componentes
        validator = EvidenciaValidator()
        procesador = ProcesadorEvidencias(validator)
        
        # Procesar evidencias
        procesador.procesar_csv(
            "evidencias_2024.csv",
            "resultados_validacion.csv",
            args.limite
        )
        
    except Exception as e:
        logger.error(f"Error en la ejecución principal: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    main()
