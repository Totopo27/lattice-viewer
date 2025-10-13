# Visualizador de Retículas Microtonales / Lattice Viewer

Herramienta para visualizar y analizar escalas microtonales usando retículas (lattices) en el espacio de ratios.

## Características

### Visualización
- **Proyecciones múltiples**: Sistema Wilson (tradicional) y proyección ortogonal
- **Etiquetas configurables**: Muestra ratios, factores primos o cents
- **Esquemas de color**: Blanco, arcoíris, cálido y frío
- **Controles interactivos**: Zoom, paneo y ajuste de parámetros visuales

### Escalas Predefinidas (trabajo en proceso)
- Just Intonation 7-limit
- Ptolemy's Intense Diatonic
- Harmonic Series (8-16)
- Hexany 1:3:5:7
- Eikosany
- Escala personalizada editable

### Análisis Teórico
- **Límite primo**: Identifica el primo más alto usado
- **Dimensionalidad**: Calcula dimensiones del espacio tonal
- **Conexiones inteligentes**: Opcional por paso primo único
- **Comparación ET**: Mapea a temperamentos iguales comunes (12, 19, 22, 24, 31, 41, 53-ET)
- **Tabla de intervalos**: Todos los intervalos entre notas
- **Detección de estructuras**: Encuentra tríadas y tetradas armónicas

### Exportación
- **Formato Scala (.scl)**: Compatible con software de afinación
- **Formato texto (.txt)**: Análisis completo legible
- **Imagen PNG** (trabajo en proceso): Captura del lattice visual

## Inicio Rápido

### Uso Online
Simplemente abre `index.html` en tu navegador.

## Guía de Uso

### Crear una Escala Personalizada

1. Haz clic en **"Editar Escala"**
2. Ingresa ratios, uno por línea (ej: `3/2`, `5/4`, `9/8`)
3. Haz clic en **"Aplicar Cambios"**

### Explorar el Lattice

- **Arrastrar**: Click y arrastra para mover la vista
- **Zoom**: Rueda del mouse o deslizador de zoom
- **Etiquetas**: Cambia entre ratios, factores y cents

### Análisis Avanzado

1. Expande la sección **"Avanzado"**
2. Opciones disponibles:
   - **Comparar con ET**: Ver aproximaciones a temperamentos iguales
   - **Tabla de Intervalos**: Analizar todos los intervalos
   - **Detectar Estructuras**: Encontrar acordes y tetradas

### Proyecciones

- **Wilson**: Proyección tradicional basada en Erv Wilson
- **Ortogonal**: Distribución radial equidistante

### Conexiones

- **Paso primo único**: Solo conecta notas que difieren en un factor primo
- **Flexible**: Conecta notas con complejidad factorial similar

### Temas

- **Oscuro**: Fondo degradado azul-púrpura
- **Claro**: Fondo suave y limpio

## Conceptos Teóricos

### Retículas (Lattices)
Un lattice representa ratios de frecuencia como puntos en un espacio multidimensional, donde cada dimensión corresponde a un número primo.

### Ratios y Factorización Prima
- `3/2` = quinta justa (Sol sobre Do)
- `5/4` = tercera mayor justa (Mi sobre Do)
- Factorización: `45/32` = `3² × 5 / 2⁵`

### Límite Primo
El número primo más grande usado en la factorización de todos los ratios de la escala.

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## Créditos

Inspirado por el trabajo de:
- **Erv Wilson**: Teoría de lattices y combinatorial product sets
- **Harry Partch**: Pionero de la microtonalidad

## Atribución

Basado en el trabajo original de [erv-web](https://github.com/diegovdc/erv-web).

## Contacto

- Reportar bugs: [GitHub Issues](https://github.com/tu-usuario/lattice-viewer/issues)
- Discusión: [GitHub Discussions](https://github.com/tu-usuario/lattice-viewer/discussions)

---
