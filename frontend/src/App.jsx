import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import './index.css'
import { HiPlus, HiMinus, HiCheck, HiX, HiUser, HiCalendar, HiClipboardList, HiArrowLeft, HiArrowRight, HiSave } from 'react-icons/hi'

function App() {
  const [data, setData] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  
  // Estados para zoom y arrastre de imagen
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5001/resultados_validacion.csv', {
          method: 'GET',
          headers: {
            'Accept': 'text/csv',
          },
          mode: 'cors'
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const csv = await response.text()
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data)
            setLoading(false)
          },
          error: (error) => {
            setError('Error al procesar el archivo CSV: ' + error.message)
            setLoading(false)
          }
        })
      } catch (error) {
        setError('Error al cargar los datos: ' + error.message)
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCheckboxChange = (field) => {
    const newData = [...data]
    newData[currentIndex][field] = newData[currentIndex][field] === '1' || newData[currentIndex][field] === 1 ? 0 : 1
    setData(newData)
  }

  const getImageUrl = (ruta) => {
    if (!ruta) return 'https://via.placeholder.com/600x800?text=Imagen+no+disponible';
    const filename = ruta.split('/').pop();
    return `http://localhost:5001/evidencias/${encodeURIComponent(filename)}`;
  };

  // Funciones para zoom
  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  const resetZoom = () => {
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
  }

  // Funciones para arrastre
  const handleMouseDown = (e) => {
    if (imageZoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && imageZoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Resetear zoom y posición cuando cambia la imagen
  useEffect(() => {
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
  }, [currentIndex])

  // Función para guardar los datos en CSV
  const saveDataToCSV = async () => {
    setSaving(true)
    try {
      // Generar CSV con Papa Parse
      const csv = Papa.unparse(data, {
        header: true,
        skipEmptyLines: true
      })
      
      // Enviar al backend
      const response = await fetch('http://localhost:5001/save-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ csvData: csv })
      })
      
      if (!response.ok) {
        throw new Error(`Error al guardar: ${response.status}`)
      }
      
      setLastSaved(new Date())
      console.log('Datos guardados correctamente')
      
    } catch (error) {
      console.error('Error al guardar:', error)
      // Mostrar notificación de error pero no bloquear la navegación
    } finally {
      setSaving(false)
    }
  }

  // Función para navegar y guardar automáticamente
  const navigateAndSave = (direction) => {
    // Primero guardamos los datos actuales
    saveDataToCSV()
    
    // Luego navegamos
    if (direction === 'prev') {
      setCurrentIndex(prev => Math.max(0, prev - 1))
    } else if (direction === 'next') {
      setCurrentIndex(prev => Math.min(data.length - 1, prev + 1))
    }
  }

  // Guardar automáticamente cuando cambian los datos
  useEffect(() => {
    if (data.length > 0 && lastSaved) {
      const timer = setTimeout(() => {
        saveDataToCSV()
      }, 2000) // Guardar 2 segundos después del último cambio
      
      return () => clearTimeout(timer)
    }
  }, [data])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-violet-600 font-semibold">Cargando evidencias...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiX className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiClipboardList className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sin datos</h2>
            <p className="text-gray-600">No se encontraron registros para mostrar.</p>
          </div>
        </div>
      </div>
    )
  }

  const currentItem = data[currentIndex]

  // Badge moderno para valores
  const Badge = ({ value, color = 'gray', icon }) => (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${
      color === 'blue' ? 'from-blue-500 to-blue-600 text-white' :
      color === 'green' ? 'from-emerald-500 to-emerald-600 text-white' :
      color === 'red' ? 'from-red-500 to-red-600 text-white' :
      'from-gray-100 to-gray-200 text-gray-800'
    } shadow-lg`}>
      {icon}
      <span>{value}</span>
    </div>
  )

  // Campo moderno con animaciones
  const Field = ({ label, original, detected, ok, icon }) => (
    <div className="mb-6 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{label}</h4>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium w-20">Original:</span>
          <Badge value={original} color="blue" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium w-20">Detectado:</span>
          <Badge value={detected} color={ok ? 'green' : 'red'} />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${ok ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {ok ? <HiCheck className="w-4 h-4 text-emerald-600" /> : <HiX className="w-4 h-4 text-red-600" />}
          </div>
        </div>
      </div>
    </div>
  )

  // Checkbox moderno
  const CheckVisual = ({ checked, label, onChange, icon }) => (
    <div 
      onClick={onChange}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
        checked 
          ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
          checked ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gray-100'
        }`}>
          {checked ? <HiCheck className="w-6 h-6 text-white" /> : icon}
        </div>
        <span className={`font-semibold ${checked ? 'text-emerald-700' : 'text-gray-700'}`}>
          {label}
        </span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-100">
      {/* Main content */}
      <main style={{ display: 'flex', flexDirection: 'row', width: '100%', padding: '32px', gap: '32px', minHeight: '100vh' }}>
        {/* Columna izquierda: Datos y controles - 25% */}
        <div style={{ width: '25%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header moderno con indicador de guardado */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">Validador de Evidencias</h1>
                <p className="text-violet-100 text-sm">Sistema de validación automatizada</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {saving && (
                  <div className="flex items-center gap-1 text-xs text-violet-100">
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                    <span>Guardando...</span>
                  </div>
                )}
                {lastSaved && !saving && (
                  <div className="flex items-center gap-1 text-xs text-emerald-200">
                    <HiCheck className="w-3 h-3" />
                    <span>Guardado</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campos de validación */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <Field
              label="Nombre"
              original={currentItem.Nombre_a_validar}
              detected={currentItem.Nombre_encontrado}
              ok={currentItem.Nombre_ok === '1' || currentItem.Nombre_ok === 1}
              icon={<HiUser className="w-4 h-4 text-white" />}
            />
            <Field
              label="Periodo"
              original={currentItem.Periodo_a_validar}
              detected={currentItem.Fecha_encontrada}
              ok={currentItem.Periodo_ok === '1' || currentItem.Periodo_ok === 1}
              icon={<HiCalendar className="w-4 h-4 text-white" />}
            />
            <Field
              label="Tarea"
              original={currentItem.Tarea_a_validar}
              detected={currentItem.Tareas_encontradas}
              ok={currentItem.Tarea_ok === '1' || currentItem.Tarea_ok === 1}
              icon={<HiClipboardList className="w-4 h-4 text-white" />}
            />
          </div>

          {/* Checkboxes modernos */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Validación Manual</h3>
            <div className="space-y-3">
              <CheckVisual
                checked={currentItem.Nombre_ok === '1' || currentItem.Nombre_ok === 1}
                label="Nombre correcto"
                onChange={() => handleCheckboxChange('Nombre_ok')}
                icon={<HiUser className="w-5 h-5 text-gray-400" />}
              />
              <CheckVisual
                checked={currentItem.Periodo_ok === '1' || currentItem.Periodo_ok === 1}
                label="Periodo correcto"
                onChange={() => handleCheckboxChange('Periodo_ok')}
                icon={<HiCalendar className="w-5 h-5 text-gray-400" />}
              />
              <CheckVisual
                checked={currentItem.Tarea_ok === '1' || currentItem.Tarea_ok === 1}
                label="Tarea correcta"
                onChange={() => handleCheckboxChange('Tarea_ok')}
                icon={<HiClipboardList className="w-5 h-5 text-gray-400" />}
              />
            </div>
          </div>

          {/* Justificación moderna */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Justificación</h3>
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-100">
              <p className="text-gray-700 leading-relaxed text-sm">
                {currentItem.Justificacion}
              </p>
            </div>
          </div>

          {/* Navegación moderna con auto-guardado */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateAndSave('prev')}
                disabled={currentIndex === 0 || saving}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                <HiArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <div className="text-center">
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-xl mb-1">
                  <span className="text-sm font-bold text-gray-700">
                    {currentIndex + 1} de {data.length}
                  </span>
                </div>
                <button
                  onClick={saveDataToCSV}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-all duration-200 disabled:opacity-50"
                  title="Guardar manualmente"
                >
                  <HiSave className="w-3 h-3" />
                  <span>Guardar</span>
                </button>
              </div>
              <button
                onClick={() => navigateAndSave('next')}
                disabled={currentIndex === data.length - 1 || saving}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                <span>Siguiente</span>
                <HiArrowRight className="w-4 h-4" />
              </button>
            </div>
            {lastSaved && (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  Último guardado: {lastSaved.toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: Imagen - 75% */}
        <div style={{ width: '75%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="bg-white rounded-2xl card-shadow p-8 border border-gray-100 w-full h-full flex flex-col shadow-2xl">
            {/* Controles de zoom modernos */}
            <div className="flex justify-center gap-3 mb-6">
              <button
                onClick={handleZoomOut}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:scale-105"
                title="Alejar"
              >
                <HiMinus size={24} />
              </button>
              <button
                onClick={resetZoom}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full hover:from-gray-200 hover:to-gray-300 transition-all duration-200 text-sm font-bold shadow-lg"
                title="Restablecer"
              >
                {Math.round(imageZoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:scale-105"
                title="Acercar"
              >
                <HiPlus size={24} />
              </button>
            </div>
            {/* Contenedor de imagen con overflow y scroll */}
            <div 
              className="flex-1 overflow-auto border-2 border-violet-200 rounded-2xl bg-gradient-to-br from-gray-50 to-slate-100 relative shadow-inner"
              style={{ cursor: imageZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={getImageUrl(currentItem.Link_imagen)}
                alt="Evidencia"
                style={{ 
                  transform: `scale(${imageZoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto'
                }}
                className="shadow-2xl rounded-lg"
                onMouseDown={handleMouseDown}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/600x800?text=Imagen+no+disponible';
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 