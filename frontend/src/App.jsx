import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

function App() {
  const [data, setData] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Iniciando fetch de datos...')
        const response = await fetch('http://localhost:5001/resultados_validacion.csv', {
          method: 'GET',
          headers: {
            'Accept': 'text/csv',
          },
          mode: 'cors'
        })
        
        console.log('Respuesta recibida:', response.status, response.statusText)
        console.log('Headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const csv = await response.text()
        console.log('CSV recibido (primeros 200 caracteres):', csv.substring(0, 200))
        
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('Datos parseados:', results.data.length, 'registros')
            console.log('Primer registro:', results.data[0])
            setData(results.data)
            setLoading(false)
          },
          error: (error) => {
            console.error('Error al parsear CSV:', error)
            setError('Error al procesar el archivo CSV: ' + error.message)
            setLoading(false)
          }
        })
      } catch (error) {
        console.error('Error completo:', error)
        setError('Error al cargar los datos: ' + error.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCheckboxChange = (field) => {
    const newData = [...data]
    newData[currentIndex][field] = newData[currentIndex][field] === 1 ? 0 : 1
    setData(newData)
  }

  // Función para construir la URL de la imagen
  const getImageUrl = (ruta) => {
    if (!ruta) return 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
    const filename = ruta.split('/').pop();
    return `http://localhost:5001/evidencias/${encodeURIComponent(filename)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary text-dark-text flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-dark-accent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-primary text-dark-text flex items-center justify-center">
        <div className="bg-dark-secondary p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-dark-accent rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="min-h-screen bg-dark-primary text-dark-text flex items-center justify-center">
        <div className="bg-dark-secondary p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">No hay datos</h2>
          <p className="text-lg">No se encontraron registros para mostrar.</p>
        </div>
      </div>
    )
  }

  const currentItem = data[currentIndex]

  return (
    <div className="min-h-screen bg-dark-primary text-dark-text">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Validador de Evidencias</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Panel izquierdo - Datos y checkboxes */}
          <div className="bg-dark-secondary p-6 rounded-lg shadow-lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Datos de Validación</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre a validar:</label>
                    <p className="bg-dark-primary p-2 rounded">{currentItem.Nombre_a_validar}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre encontrado:</label>
                    <p className="bg-dark-primary p-2 rounded">{currentItem.Nombre_encontrado}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Periodo:</label>
                    <p className="bg-dark-primary p-2 rounded">{currentItem.Periodo_a_validar}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha encontrada:</label>
                    <p className="bg-dark-primary p-2 rounded">{currentItem.Fecha_encontrada}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tarea:</label>
                    <p className="bg-dark-primary p-2 rounded">{currentItem.Tarea_a_validar}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Validación</h2>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={currentItem.Nombre_ok === 1}
                      onChange={() => handleCheckboxChange('Nombre_ok')}
                      className="form-checkbox h-5 w-5 text-dark-accent rounded"
                    />
                    <span>Nombre correcto</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={currentItem.Periodo_ok === 1}
                      onChange={() => handleCheckboxChange('Periodo_ok')}
                      className="form-checkbox h-5 w-5 text-dark-accent rounded"
                    />
                    <span>Periodo correcto</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={currentItem.Tarea_ok === 1}
                      onChange={() => handleCheckboxChange('Tarea_ok')}
                      className="form-checkbox h-5 w-5 text-dark-accent rounded"
                    />
                    <span>Tarea correcta</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 bg-dark-accent rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm">
                  {currentIndex + 1} de {data.length}
                </span>
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(data.length - 1, prev + 1))}
                  disabled={currentIndex === data.length - 1}
                  className="px-4 py-2 bg-dark-accent rounded disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          {/* Panel derecho - Imagen */}
          <div className="bg-dark-secondary p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Evidencia</h2>
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={getImageUrl(currentItem.Link_imagen)}
                alt="Evidencia"
                className="object-contain w-full h-full rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
                }}
              />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Justificación:</h3>
              <p className="bg-dark-primary p-4 rounded">{currentItem.Justificacion}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App 