import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import './index.css'
import { HiPlus, HiMinus, HiCheck, HiX, HiUser, HiCalendar, HiClipboardList, HiArrowLeft, HiArrowRight, HiSave } from 'react-icons/hi'
import SidebarList from './components/SidebarList'
import EvidenceViewer from './components/EvidenceViewer'
import FieldCard from './components/FieldCard'
import ToggleCheck from './components/ToggleCheck'
import Navbar from './components/Navbar'
import useGlobalHotkeys from './hooks/useGlobalHotkeys'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Hook para alto de ventana menos la barra
function useWindowHeight(offset = 64) {
  const [height, setHeight] = useState(window.innerHeight - offset);
  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight - offset);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [offset]);
  return height;
}

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

  const sidebarHeight = useWindowHeight(64);

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
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ csvData: csv })
      })
      
      if (!response.ok) throw new Error(`Error al guardar: ${response.status}`)
      setLastSaved(new Date())
      toast.success('Guardado', { autoClose: 1500 })
      
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al guardar')
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

  // Atajos de teclado globales
  useGlobalHotkeys({
    prev: () => navigateAndSave('prev'),
    next: () => navigateAndSave('next'),
    toggle: handleCheckboxChange,
    save: saveDataToCSV
  })

  // Función para descarga rápida del CSV desde la barra
  const handleDownload = () => {
    saveDataToCSV().then(() => {
      const link = document.createElement('a')
      link.href = 'http://localhost:5001/resultados_validacion.csv'
      link.download = 'resultados_validacion.csv'
      link.click()
    })
  }

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

  return (
    <div className="h-screen flex flex-col">
      <Navbar
        total={data.length}
        current={currentIndex + 1}
        saving={saving}
        lastSaved={lastSaved}
        onDownload={handleDownload}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar lista */}
        <aside className="w-64 border-r bg-gradient-to-b from-violet-50 to-white flex-shrink-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SidebarList rows={data} current={currentIndex} onSelect={setCurrentIndex} height={sidebarHeight} />
          </div>
        </aside>

        {/* Visor de imagen */}
        <main className="flex-1 bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-100 p-4 overflow-hidden flex items-center justify-center">
          <EvidenceViewer imageUrl={getImageUrl(currentItem.Link_imagen)} />
        </main>

        {/* Panel de validación */}
        <section className="w-96 bg-white border-l overflow-y-auto p-6 flex flex-col gap-6">
          {/* Campos */}
          <div className="rounded-xl border border-gray-100 divide-y">
            <FieldCard
              label="Nombre"
              original={currentItem.Nombre_a_validar}
              detected={currentItem.Nombre_encontrado}
              ok={currentItem.Nombre_ok === '1' || currentItem.Nombre_ok === 1}
              icon={<HiUser className="w-3 h-3" />}
            />
            <FieldCard
              label="Periodo"
              original={currentItem.Periodo_a_validar}
              detected={currentItem.Fecha_encontrada}
              ok={currentItem.Periodo_ok === '1' || currentItem.Periodo_ok === 1}
              icon={<HiCalendar className="w-3 h-3" />}
            />
            <FieldCard
              label="Tarea"
              original={currentItem.Tarea_a_validar}
              detected={currentItem.Tareas_encontradas}
              ok={currentItem.Tarea_ok === '1' || currentItem.Tarea_ok === 1}
              icon={<HiClipboardList className="w-3 h-3" />}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <ToggleCheck
              checked={currentItem.Nombre_ok === '1' || currentItem.Nombre_ok === 1}
              label="Nombre correcto (1)"
              onChange={() => handleCheckboxChange('Nombre_ok')}
              icon={<HiUser className="w-4 h-4" />}
            />
            <ToggleCheck
              checked={currentItem.Periodo_ok === '1' || currentItem.Periodo_ok === 1}
              label="Periodo correcto (2)"
              onChange={() => handleCheckboxChange('Periodo_ok')}
              icon={<HiCalendar className="w-4 h-4" />}
            />
            <ToggleCheck
              checked={currentItem.Tarea_ok === '1' || currentItem.Tarea_ok === 1}
              label="Tarea correcta (3)"
              onChange={() => handleCheckboxChange('Tarea_ok')}
              icon={<HiClipboardList className="w-4 h-4" />}
            />
          </div>

          {/* Justificación */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-700">Justificación</h4>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700">
              {currentItem.Justificacion || 'Sin justificación'}
            </div>
          </div>

          {/* Navegación */}
          <div className="mt-auto flex justify-between pt-4">
            <button
              onClick={() => navigateAndSave('prev')}
              disabled={currentIndex === 0 || saving}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg disabled:opacity-40"
            >
              <HiArrowLeft /> Anterior (A)
            </button>
            <button
              onClick={() => navigateAndSave('next')}
              disabled={currentIndex === data.length - 1 || saving}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg disabled:opacity-40"
            >
              Siguiente (D) <HiArrowRight />
            </button>
          </div>
        </section>
      </div>
      {/* Toasts */}
      <ToastContainer position="bottom-right" />
    </div>
  )
}

export default App 