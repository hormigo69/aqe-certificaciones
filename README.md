# 🎓 AQE Certificaciones - Validador de Evidencias

## 📝 Descripción
Sistema para validar y gestionar evidencias de certificaciones AQE. Permite visualizar, validar y gestionar evidencias de certificaciones de manera eficiente.

## 🏗️ Estructura del Proyecto
```
.
├── frontend/           # Aplicación React/Vite
│   ├── src/           # Código fuente del frontend
│   └── dist/          # Archivos compilados
├── data/              # Datos y evidencias
│   └── Evidencias 2024/  # Archivos de evidencias
├── server.py          # Servidor Flask
├── resultados_validacion.csv      # Resultados de validación
└── resultados_finales_validados.csv  # Resultados finales
```

## 🚀 Cómo Iniciar el Proyecto

### 1. Backend (Flask)
```bash
# Instalar dependencias (si no lo has hecho)
pip install -r requirements.txt

# Iniciar el servidor
python3 server.py
```
El servidor se iniciará en `http://localhost:5001`

### 2. Frontend (React/Vite)
```bash
# Entrar al directorio frontend
cd frontend

# Instalar dependencias (si no lo has hecho)
npm install

# Iniciar el servidor de desarrollo
npm run dev
```
La aplicación se iniciará en `http://localhost:5173`

## 🔧 Endpoints Disponibles

### Backend (http://localhost:5001)
- `GET /resultados_validacion.csv` - Obtener CSV de resultados
- `POST /save-results` - Guardar cambios en resultados
- `GET /evidencias/<filename>` - Acceder a archivos de evidencias

## 🛠️ Tecnologías Utilizadas

### Backend
- Python 3.13
- Flask
- Flask-CORS

### Frontend
- React
- Vite
- TailwindCSS
- HeadlessUI
- React Icons
- PapaParse (para CSV)

## 📋 Funcionalidades Principales
1. Visualización de evidencias
2. Validación de certificaciones
3. Gestión de resultados
4. Exportación de datos en CSV

## 🔍 Cómo Usar

1. **Acceder a la aplicación**:
   - Abre `http://localhost:5173` en tu navegador

2. **Validar Evidencias**:
   - Navega por la lista de certificaciones
   - Revisa las evidencias asociadas
   - Marca como válidas/inválidas según corresponda

3. **Guardar Cambios**:
   - Los cambios se guardan automáticamente
   - También puedes exportar los resultados

## 🛑 Detener los Servidores

### Backend
```bash
# En la terminal donde corre server.py
Ctrl + C
```

### Frontend
```bash
# En la terminal donde corre npm run dev
Ctrl + C
```

## 🔄 Reiniciar Todo

Si necesitas reiniciar todo el sistema:

1. **Detener procesos existentes**:
```bash
# Matar procesos en puerto 5001
lsof -ti:5001 | xargs kill -9

# Matar procesos de server.py
pkill -f "python.*server.py"
```

2. **Reiniciar servidores**:
```bash
# Terminal 1 - Backend
python3 server.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📝 Notas
- El servidor backend debe estar corriendo para que el frontend funcione correctamente
- Los cambios se guardan automáticamente en el backend
- Las evidencias se sirven desde la carpeta `data/Evidencias 2024`
