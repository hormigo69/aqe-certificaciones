'''
Este script lee la pestaña 'Proyectossubproyectos evidencia' del excel Control de evidencias 2024.xlsx

- genera un dataframe con los datos de la pestaña 'Proyectossubproyectos evidencia'
- repite el nombre de la columna 'Empleado' hasta que se encuentra otro nombre diferente, porque aparece sólo el primero del grupo de filas
- extrae los IDs de empleado y subproyecto en columnas separadas
- busca y asigna las evidencias correspondientes basándose en el nombre del empleado y subproyecto
- crea una columna 'Evidencia' que rellena con el nombre del archivo correspondiente de la carpeta 'Evidencias 2024'
'''

#importamos las librerías
import pandas as pd
import os
from difflib import SequenceMatcher

def similar(a, b):
    """Función para calcular la similitud entre dos strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def buscar_evidencia(nombre_empleado, nombre_subproyecto, archivos_evidencias):
    """
    Busca la evidencia que mejor coincida con el empleado y subproyecto
    """
    mejor_coincidencia = ""
    mejor_score = 0
    
    # Limpiamos el nombre del empleado (quitamos el ID)
    empleado_limpio = nombre_empleado.strip() if pd.notna(nombre_empleado) else ""
    subproyecto_limpio = nombre_subproyecto.strip() if pd.notna(nombre_subproyecto) else ""
    
    for archivo in archivos_evidencias:
        # Dividimos el nombre del archivo en partes
        if '_' in archivo:
            nombre_archivo_empleado = archivo.split('_')[0].strip()
            resto_archivo = '_'.join(archivo.split('_')[1:])
            
            # Calculamos similitud con el empleado
            similitud_empleado = similar(empleado_limpio, nombre_archivo_empleado)
            
            # Calculamos similitud con el subproyecto
            similitud_subproyecto = similar(subproyecto_limpio, resto_archivo)
            
            # Score combinado (damos más peso al empleado)
            score_total = (similitud_empleado * 0.6) + (similitud_subproyecto * 0.4)
            
            # Si encontramos una mejor coincidencia
            if score_total > mejor_score and similitud_empleado > 0.7:  # Mínimo 70% similitud en empleado
                mejor_score = score_total
                mejor_coincidencia = archivo
    
    return mejor_coincidencia if mejor_score > 0.5 else ""

#definimos la ruta de la carpeta de evidencias
ruta_evidencias = 'data/Evidencias 2024'

# Obtenemos la lista de archivos de evidencias
archivos_evidencias = []
if os.path.exists(ruta_evidencias):
    archivos_evidencias = [f for f in os.listdir(ruta_evidencias) 
                          if f.lower().endswith(('.png', '.pdf', '.jpg', '.jpeg')) 
                          and not f.startswith('.')]

#leemos el excel
df = pd.read_excel('data/Control de evidencias 2024.xlsx', sheet_name='Proyectossubproyectos evidencia')

#Rellenamos el nombre del empleado hasta que se encuentra otro nombre diferente, porque aparece sólo el primero del grupo de filas
df['Empleado'] = df['Empleado'].fillna(method='ffill')

# Extraemos el ID del empleado y el nombre del empleado
df['ID_Empleado'] = df['Empleado'].str.extract(r'\[(\d+)\]')
df['Nombre_Empleado'] = df['Empleado'].str.extract(r'\]\s*(.+)')

# Extraemos el ID del subproyecto y el nombre del subproyecto
df['ID_Subproyecto'] = df['Subproyecto'].str.extract(r'\[([^]]+)\]')
df['Nombre_Subproyecto'] = df['Subproyecto'].str.extract(r'\]\s*(.+)')

# Si existe la columna Proyecto, extraemos su ID y nombre (formato diferente sin corchetes)
if 'Proyecto' in df.columns:
    # Rellenamos también la columna Proyecto como hicimos con Empleado
    df['Proyecto'] = df['Proyecto'].fillna(method='ffill')
    # Extraemos el número del proyecto (ej: "1" de "1.- Plataforma...")
    df['ID_Proyecto'] = df['Proyecto'].str.extract(r'^(\d+)\.-')
    # Extraemos el nombre del proyecto (todo después de "número.- ")
    df['Nombre_Proyecto'] = df['Proyecto'].str.extract(r'^\d+\.-\s*(.+)')

# Eliminamos las columnas originales que ya no necesitamos
columnas_a_eliminar = ['Empleado', 'Subproyecto']
if 'Proyecto' in df.columns:
    columnas_a_eliminar.append('Proyecto')
df = df.drop(columns=columnas_a_eliminar)

# Buscamos las evidencias correspondientes
print(f"Encontrados {len(archivos_evidencias)} archivos de evidencia")
print("Buscando coincidencias...")

df['Evidencia'] = df.apply(
    lambda row: buscar_evidencia(
        row['Nombre_Empleado'], 
        row['Nombre_Subproyecto'], 
        archivos_evidencias
    ), 
    axis=1
)

# Añadimos la ruta completa de la evidencia
df['Ruta_Evidencia'] = df['Evidencia'].apply(
    lambda x: os.path.join(ruta_evidencias, x) if x else ""
)

print("Columnas disponibles:", df.columns.tolist())
print("\nPrimeras 5 filas:")
print(df.head())

print("\nEjemplo de extracción de IDs:")
print("ID_Empleado:", df['ID_Empleado'].head().tolist())
print("Nombre_Empleado:", df['Nombre_Empleado'].head().tolist())
print("ID_Subproyecto:", df['ID_Subproyecto'].head().tolist())
print("Nombre_Subproyecto:", df['Nombre_Subproyecto'].head().tolist())
if 'Proyecto' in df.columns:
    print("ID_Proyecto:", df['ID_Proyecto'].head().tolist())
    print("Nombre_Proyecto:", df['Nombre_Proyecto'].head().tolist())

print("\nEvidencias encontradas:")
evidencias_encontradas = df[df['Evidencia'] != '']
print(f"Total de evidencias asignadas: {len(evidencias_encontradas)} de {len(df)}")
if len(evidencias_encontradas) > 0:
    print(evidencias_encontradas[['Nombre_Empleado', 'Nombre_Subproyecto', 'Evidencia']].head(10))

# Guardamos el dataframe en un archivo CSV
output_file = 'evidencias_2024.csv'
df.to_csv(output_file, index=False, encoding='utf-8')
print(f"\n✅ Archivo guardado exitosamente como: {output_file}")
print(f"Total de filas: {len(df)}")
print(f"Total de columnas: {len(df.columns)}")
print("Columnas incluidas:", list(df.columns))