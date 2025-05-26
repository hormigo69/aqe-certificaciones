# Validador de Evidencias I+D

Este programa valida las evidencias de bonificaciones I+D utilizando la API de Gemini para analizar imágenes y verificar su contenido.

## Requisitos

- Python 3.8 o superior
- API key de Google Gemini

## Instalación

1. Clonar el repositorio
2. Instalar las dependencias:
```bash
pip install -r requirements.txt
```

3. Crear un archivo `.env` en la raíz del proyecto con tu API key:
```
GEMINI_API_KEY=tu_api_key_aqui
```

## Uso

1. Asegúrate de que el archivo CSV de evidencias (`evidencias_2024.csv`) esté en la raíz del proyecto
2. Ejecuta el programa:
```bash
python src/check_evidencias.py
```

3. El programa generará un archivo `resultados_validacion.csv` con los resultados de la validación

## Estructura del CSV de entrada

El CSV de entrada debe contener las siguientes columnas:
- Empleado
- Proyecto
- Subproyecto
- ID_Empleado
- Nombre_Empleado
- ID_Subproyecto
- Nombre_Subproyecto
- ID_Proyecto
- Nombre_Proyecto
- Evidencia
- Ruta_Evidencia

## Estructura del CSV de salida

El CSV de salida contendrá las siguientes columnas:
- Nombre_ok: 1 si el nombre del empleado está en la evidencia, 0 si no
- Periodo_ok: 1 si la fecha está dentro del periodo de bonificación, 0 si no
- Tarea_ok: 1 si el contenido justifica las tareas realizadas, 0 si no
- Descripcion_tarea: Descripción detallada del contenido de la evidencia
