from flask import Flask, Response, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configurar CORS para permitir todas las solicitudes
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"],
        "expose_headers": ["Content-Type", "Content-Length"]
    }
})

@app.route('/resultados_validacion.csv')
def serve_csv():
    try:
        # Listar archivos en el directorio actual
        current_dir = os.getcwd()
        logger.info(f"Directorio actual: {current_dir}")
        logger.info("Archivos en el directorio:")
        for file in os.listdir(current_dir):
            logger.info(f"- {file}")
        
        # Primero intentamos leer el archivo de resultados finales
        csv_path = 'resultados_finales_validados.csv'
        
        # Si no existe, intentamos copiar desde el archivo original
        if not os.path.exists(csv_path):
            original_path = 'resultados_validacion.csv'
            if os.path.exists(original_path):
                logger.info(f"Copiando datos desde {original_path} a {csv_path}")
                with open(original_path, 'r', encoding='utf-8') as f_orig:
                    content = f_orig.read()
                with open(csv_path, 'w', encoding='utf-8') as f_new:
                    f_new.write(content)
            else:
                logger.error("No se encontró ningún archivo de resultados")
                return "No se encontró ningún archivo de resultados. Por favor, ejecute primero el validador de evidencias.", 404
        
        logger.info(f"Intentando servir el archivo: {csv_path}")
        
        # Leer el contenido del archivo
        with open(csv_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        logger.info("Archivo leído correctamente")
        
        # Crear respuesta con headers CORS
        response = Response(
            content,
            mimetype='text/csv',
            headers={
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept',
                'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
                'Content-Type': 'text/csv; charset=utf-8'
            }
        )
        return response
        
    except Exception as e:
        logger.error(f"Error al servir el archivo: {str(e)}")
        return str(e), 500

@app.route('/save-results', methods=['POST', 'OPTIONS'])
def save_results():
    if request.method == 'OPTIONS':
        # Respuesta preflight para CORS
        response = jsonify({'message': 'OK'})
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
        return response
    
    try:
        # Obtener los datos del CSV del frontend
        data = request.get_json()
        csv_data = data.get('csvData')
        
        if not csv_data:
            return jsonify({'error': 'No se recibieron datos CSV'}), 400
        
        # Guardar en el archivo de resultados finales
        with open('resultados_finales_validados.csv', 'w', encoding='utf-8') as f:
            f.write(csv_data)
        
        logger.info("Resultados finales guardados correctamente")
        
        response = jsonify({
            'message': 'Datos guardados correctamente'
        })
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        return response
        
    except Exception as e:
        logger.error(f"Error al guardar los datos: {str(e)}")
        response = jsonify({'error': f'Error interno del servidor: {str(e)}'})
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        return response, 500

@app.route('/evidencias/<path:filename>')
def evidencias(filename):
    return send_from_directory('data/Evidencias 2024', filename)

@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Content-Length'
    return response

if __name__ == '__main__':
    logger.info("Iniciando servidor Flask en puerto 5001...")
    app.run(port=5001, debug=True, host='0.0.0.0') 