// ===== CONFIGURACIÓN DE COORDENADAS BASE (WILSON) =====
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23];

const baseCoords = {
    1: {x: 0, y: 0}, 2: {x: 0, y: 0}, 3: {x: 40, y: 0},
    5: {x: 0, y: -40}, 7: {x: 13, y: -11}, 11: {x: -14, y: -18},
    13: {x: -8, y: -4}, 17: {x: -5, y: -32}, 19: {x: 7, y: -25},
    23: {x: 20, y: -6}
};

// ===== PRESETS MICROTONALES =====
const presets = {
    just: "1/1\n9/8\n5/4\n4/3\n3/2\n5/3\n15/8\n2/1",
    ptolemy: "1/1\n16/15\n9/8\n6/5\n5/4\n4/3\n3/2\n8/5\n5/3\n9/5\n15/8\n2/1",
    custom: "45/44\n35/33\n12/11\n9/8\n7/6\n105/88\n5/4\n14/11\n4/3\n15/11\n140/99\n35/24\n3/2\n14/9\n35/22\n5/3\n56/33\n7/4\n20/11\n15/8\n21/11\n2/1",
    harmonic: "8/8\n9/8\n10/8\n11/8\n12/8\n13/8\n14/8\n15/8\n16/8",
    hexany: "1/1\n5/4\n3/2\n7/4\n15/8\n35/16\n2/1",
    eikosany: "1/1\n7/6\n5/4\n4/3\n7/5\n3/2\n14/9\n5/3\n7/4\n15/8\n2/1"
};

// ===== ESTADO DE LA APLICACIÓN =====
let state = {
    textType: 'ratio',
    projectionType: 'base',
    scaleString: presets.custom,
    latticeData: null,
    zoom: 0.8,
    pointSize: 4,
    lineWidth: 0.8,
    textSize: 11,
    showGrid: true,
    showLabels: true,
    showConnections: true,
    strictConnections: true,
    panX: 0,
    panY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    colorScheme: 'white',
    theme: 'dark'
};

// ===== FUNCIONES MATEMÁTICAS CORE =====

function primeFactorize(n) {
    const factors = [];
    let d = 2;
    while (n > 1) {
        while (n % d === 0) {
            factors.push(d);
            n /= d;
        }
        d++;
        if (d * d > n && n > 1) {
            factors.push(n);
            break;
        }
    }
    return factors;
}

function parseRatio(ratioStr) {
    const parts = ratioStr.trim().split('/');
    if (parts.length === 1) {
        const num = parseInt(parts[0]);
        if (isNaN(num) || num <= 0) throw new Error('Ratio inválido: ' + ratioStr);
        return {num, den: 1};
    }
    const num = parseInt(parts[0]);
    const den = parseInt(parts[1]);
    if (isNaN(num) || isNaN(den) || num <= 0 || den <= 0) {
        throw new Error('Ratio inválido: ' + ratioStr);
    }
    return {num, den};
}

function ratioToCents(num, den) {
    return 1200 * Math.log2(num / den);
}

function getPrimeVector(numerFactors, denomFactors) {
    const vector = {};
    PRIMES.forEach(p => vector[p] = 0);
    
    numerFactors.forEach(factor => {
        if (vector[factor] !== undefined) vector[factor]++;
    });
    
    denomFactors.forEach(factor => {
        if (vector[factor] !== undefined) vector[factor]--;
    });
    
    return vector;
}

function formatPrimeVector(vector) {
    const parts = [];
    PRIMES.slice(1).forEach(p => {
        if (vector[p] !== 0) {
            parts.push(`${p}^${vector[p]}`);
        }
    });
    return parts.length > 0 ? parts.join('·') : '1';
}

function vectorDifference(vec1, vec2) {
    const diff = {};
    PRIMES.forEach(p => {
        diff[p] = vec1[p] - vec2[p];
    });
    return diff;
}

function isSinglePrimeStep(diffVector) {
    const nonZero = Object.entries(diffVector)
        .filter(([p, val]) => p !== '2' && val !== 0);
    if (nonZero.length !== 1) return false;
    return Math.abs(nonZero[0][1]) === 1;
}

function orthogonalProjection(primeVector) {
    let x = 0, y = 0;
    const primes = PRIMES.slice(1);
    const angleStep = (2 * Math.PI) / primes.length;
    
    primes.forEach((prime, index) => {
        const exp = primeVector[prime];
        const angle = index * angleStep;
        const radius = 35;
        x += exp * Math.cos(angle) * radius;
        y += exp * Math.sin(angle) * radius;
    });
    
    return {x, y};
}

function wilsonCoords(numerFactors, denomFactors) {
    let x = 0, y = 0;
    numerFactors.forEach(factor => {
        if (baseCoords[factor]) {
            x += baseCoords[factor].x;
            y += baseCoords[factor].y;
        }
    });
    denomFactors.forEach(factor => {
        if (baseCoords[factor]) {
            x -= baseCoords[factor].x;
            y -= baseCoords[factor].y;
        }
    });
    return {x, y};
}

function analyzeRatio(ratioStr) {
    const {num, den} = parseRatio(ratioStr);
    const cents = ratioToCents(num, den);
    const numerFactors = primeFactorize(num);
    const denomFactors = primeFactorize(den);
    const primeVector = getPrimeVector(numerFactors, denomFactors);
    
    return {
        ratio: ratioStr,
        numerator: num,
        denominator: den,
        numerFactors,
        denomFactors,
        cents,
        primeVector
    };
}

function ratioToLatticePoint(ratioStr) {
    const analyzed = analyzeRatio(ratioStr);
    
    let coords;
    if (state.projectionType === 'orthogonal') {
        coords = orthogonalProjection(analyzed.primeVector);
    } else {
        coords = wilsonCoords(analyzed.numerFactors, analyzed.denomFactors);
    }
    
    return {
        ...analyzed,
        coords
    };
}

function connectNodes(points) {
    const edges = [];
    
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const p1 = points[i];
            const p2 = points[j];
            
            if (state.strictConnections) {
                const diff = vectorDifference(p1.primeVector, p2.primeVector);
                if (isSinglePrimeStep(diff)) {
                    edges.push([p1.coords, p2.coords]);
                }
            } else {
                const allFactors1 = [...p1.numerFactors, ...p1.denomFactors].filter(f => f !== 2);
                const allFactors2 = [...p2.numerFactors, ...p2.denomFactors].filter(f => f !== 2);
                
                const diff = Math.abs(allFactors1.length - allFactors2.length);
                if (diff <= 1) {
                    edges.push([p1.coords, p2.coords]);
                }
            }
        }
    }
    
    return edges;
}

function getPrimeLimit(points) {
    let maxPrime = 2;
    points.forEach(point => {
        const allFactors = [...point.numerFactors, ...point.denomFactors];
        allFactors.forEach(f => {
            if (f > maxPrime) maxPrime = f;
        });
    });
    return maxPrime;
}

function calculateDimensionality(points) {
    const usedPrimes = new Set();
    points.forEach(point => {
        Object.entries(point.primeVector).forEach(([prime, exp]) => {
            if (prime !== '2' && exp !== 0) {
                usedPrimes.add(parseInt(prime));
            }
        });
    });
    return usedPrimes.size;
}

function mapToET(ratio, nET) {
    const {num, den} = parseRatio(ratio);
    const cents = ratioToCents(num, den);
    const degree = nET * Math.log2(num / den);
    const rounded = Math.round(degree);
    const error = Math.abs(degree - rounded) * (1200 / nET);
    
    return {
        degree: rounded,
        error: error,
        etCents: rounded * (1200 / nET)
    };
}

function ratiosToLatticeData(ratioStrings) {
    const points = ratioStrings
        .map(r => r.trim())
        .filter(r => r.length > 0)
        .map(r => ratioToLatticePoint(r));
    
    if (points.length === 0) return null;
    
    const coords = points.map(p => p.coords);
    const minX = Math.min(...coords.map(c => c.x));
    const maxX = Math.max(...coords.map(c => c.x));
    const minY = Math.min(...coords.map(c => c.y));
    const maxY = Math.max(...coords.map(c => c.y));
    const edges = connectNodes(points);
    
    return {
        minX, maxX, minY, maxY,
        data: points,
        edges,
        primeLimit: getPrimeLimit(points),
        dimensionality: calculateDimensionality(points)
    };
}

// ===== FUNCIONES DE ANÁLISIS =====

function calculateIntervals() {
    if (!state.latticeData) return [];
    
    const intervals = [];
    const points = state.latticeData.data;
    
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const p1 = points[i];
            const p2 = points[j];
            
            const intervalCents = Math.abs(p2.cents - p1.cents);
            const intervalRatio = `${p2.numerator * p1.denominator}/${p2.denominator * p1.numerator}`;
            
            intervals.push({
                from: p1.ratio,
                to: p2.ratio,
                cents: intervalCents,
                ratio: intervalRatio
            });
        }
    }
    
    return intervals.sort((a, b) => a.cents - b.cents);
}

function detectStructures() {
    if (!state.latticeData) return { triads: [], tetrads: [] };
    
    const points = state.latticeData.data;
    const triads = [];
    const tetrads = [];
    
    // Detectar tríadas (3 notas)
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            for (let k = j + 1; k < points.length; k++) {
                const p1 = points[i], p2 = points[j], p3 = points[k];
                const interval1 = Math.abs(p2.cents - p1.cents);
                const interval2 = Math.abs(p3.cents - p2.cents);
                
                // Tríada mayor justa (5/4 + 6/5)
                if (Math.abs(interval1 - 386) < 10 && Math.abs(interval2 - 316) < 10) {
                    triads.push({
                        type: 'Mayor Justa',
                        notes: [p1.ratio, p2.ratio, p3.ratio]
                    });
                }
                
                // Tríada menor justa (6/5 + 5/4)
                if (Math.abs(interval1 - 316) < 10 && Math.abs(interval2 - 386) < 10) {
                    triads.push({
                        type: 'Menor Justa',
                        notes: [p1.ratio, p2.ratio, p3.ratio]
                    });
                }
            }
        }
    }
    
    // Detectar tetradas (4 notas)
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            for (let k = j + 1; k < points.length; k++) {
                for (let l = k + 1; l < points.length; l++) {
                    const p1 = points[i], p2 = points[j], p3 = points[k], p4 = points[l];
                    
                    // Tetrada dominante 7 septimal (4:5:6:7)
                    const int1 = Math.abs(p2.cents - p1.cents);
                    const int2 = Math.abs(p3.cents - p2.cents);
                    const int3 = Math.abs(p4.cents - p3.cents);
                    
                    if (Math.abs(int1 - 386) < 10 && 
                        Math.abs(int2 - 316) < 10 && 
                        Math.abs(int3 - 267) < 10) {
                        tetrads.push({
                            type: 'Dominante Septimal (4:5:6:7)',
                            notes: [p1.ratio, p2.ratio, p3.ratio, p4.ratio]
                        });
                    }
                }
            }
        }
    }
    
    return { triads, tetrads };
}

function exportToScala() {
    if (!state.latticeData) return;
    
    const points = state.latticeData.data.sort((a, b) => a.cents - b.cents);
    let scalaContent = '! Scala file exported from Visualizador de Retículas\n';
    scalaContent += '! Generated: ' + new Date().toISOString() + '\n';
    scalaContent += '!\n';
    scalaContent += 'Exported scale\n';
    scalaContent += ` ${points.length}\n`;
    scalaContent += '!\n';
    
    points.forEach(point => {
        scalaContent += ` ${point.ratio}\n`;
    });
    
    const blob = new Blob([scalaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scale_' + new Date().toISOString().slice(0, 10) + '.scl';
    link.click();
    URL.revokeObjectURL(url);
    
    // Cerrar modal de exportación
    document.getElementById('exportModal').classList.remove('active');
}

function exportToTxt() {
    if (!state.latticeData) return;
    
    const points = state.latticeData.data.sort((a, b) => a.cents - b.cents);
    let txtContent = 'Visualizador de Retículas - Exportación de Escala\n';
    txtContent += 'Generado: ' + new Date().toLocaleString('es-ES') + '\n';
    txtContent += '='.repeat(60) + '\n\n';
    txtContent += `Total de notas: ${points.length}\n`;
    txtContent += `Límite primo: ${state.latticeData.primeLimit}\n`;
    txtContent += `Dimensionalidad: ${state.latticeData.dimensionality}\n\n`;
    txtContent += 'RATIO\t\tCENTS\t\tFACTORES\n';
    txtContent += '-'.repeat(60) + '\n';
    
    points.forEach(point => {
        const numStr = point.numerFactors.filter(f => f !== 2).join('×') || '1';
        const denStr = point.denomFactors.filter(f => f !== 2).join('×');
        const factors = denStr ? `${numStr}/${denStr}` : numStr;
        txtContent += `${point.ratio}\t\t${Math.round(point.cents)}¢\t\t${factors}\n`;
    });
    
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'escala_' + new Date().toISOString().slice(0, 10) + '.txt';
    link.click();
    URL.revokeObjectURL(url);
    
    // Cerrar modal de exportación
    document.getElementById('exportModal').classList.remove('active');
}

// ===== RENDERIZADO DEL CANVAS =====

const canvas = document.getElementById('latticeCanvas');
const ctx = canvas.getContext('2d');

function getColorForScheme(scheme) {
    switch(scheme) {
        case 'rainbow': return ['#667eea', '#764ba2', '#f093fb', '#4facfe'];
        case 'warm': return ['#f093fb', '#f5576c', '#ff9a56'];
        case 'cool': return ['#4facfe', '#00f2fe', '#43e97b'];
        default: return ['#ffffff'];
    }
}

function drawLattice() {
    if (!state.latticeData) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    // Fondo según tema
    ctx.fillStyle = state.theme === 'dark' ? '#0a0a0a' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const {data, edges, minX, maxX, minY, maxY} = state.latticeData;
    const xLength = Math.abs(minX - maxX) || 1;
    const yLength = Math.abs(minY - maxY) || 1;
    const cx = width / 2;
    const cy = height / 2;
    const baseZoom = Math.min(width / xLength, height / yLength) * 0.8;
    const zoom = baseZoom * state.zoom;

    ctx.save();
    ctx.translate(cx + state.panX, cy + state.panY);
    ctx.scale(zoom, zoom);
    ctx.translate(-((maxX + minX) / 2), -((maxY + minY) / 2));

    // Cuadrícula
    if (state.showGrid) {
        ctx.strokeStyle = state.theme === 'dark' ? 
            'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 0.15 / zoom;
        const gridSize = 10;
        for (let x = Math.floor(minX / gridSize) * gridSize; x <= maxX + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, minY - gridSize);
            ctx.lineTo(x, maxY + gridSize);
            ctx.stroke();
        }
        for (let y = Math.floor(minY / gridSize) * gridSize; y <= maxY + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(minX - gridSize, y);
            ctx.lineTo(maxX + gridSize, y);
            ctx.stroke();
        }
    }

    // Conexiones
    if (state.showConnections) {
        const colors = getColorForScheme(state.colorScheme);
        
        // Ajustar colores según tema si es esquema blanco
        let lineColors = colors;
        if (state.colorScheme === 'white' && state.theme === 'light') {
            lineColors = ['#666666']; // Gris oscuro en tema claro
        }
        
        ctx.lineWidth = state.lineWidth / zoom;
        edges.forEach((edge, i) => {
            const [c1, c2] = edge;
            const colorIndex = i % lineColors.length;
            ctx.strokeStyle = lineColors[colorIndex];
            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.stroke();
        });
    }

    // Puntos
    const colors = getColorForScheme(state.colorScheme);
    let pointColors = colors;
    if (state.colorScheme === 'white' && state.theme === 'light') {
        pointColors = ['#333333']; // Puntos oscuros en tema claro
    }
    
    data.forEach((point, i) => {
        const colorIndex = i % pointColors.length;
        ctx.fillStyle = pointColors[colorIndex];
        ctx.beginPath();
        ctx.arc(point.coords.x, point.coords.y, state.pointSize / zoom, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = state.theme === 'dark' ? '#000' : '#fff';
        ctx.lineWidth = 0.5 / zoom;
        ctx.stroke();
    });

    // Etiquetas
    if (state.showLabels) {
        ctx.font = `${state.textSize / zoom}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        data.forEach(point => {
            let label;
            if (state.textType === 'factors') {
                const numStr = point.numerFactors.filter(f => f !== 2).join('×') || '1';
                const denStr = point.denomFactors.filter(f => f !== 2).join('×');
                label = denStr ? `${numStr}/${denStr}` : numStr;
            } else if (state.textType === 'cents') {
                label = Math.round(point.cents) + '¢';
            } else {
                label = point.ratio;
            }
            
            ctx.fillStyle = state.theme === 'dark' ? 
                'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)';
            const metrics = ctx.measureText(label);
            const padding = 1 / zoom;
            ctx.fillRect(
                point.coords.x + 3 / zoom - padding,
                point.coords.y - state.textSize / (2 * zoom) - padding,
                metrics.width + padding * 2,
                state.textSize / zoom + padding * 2
            );
            
            ctx.fillStyle = state.theme === 'dark' ? '#fff' : '#000';
            ctx.fillText(label, point.coords.x + 3 / zoom, point.coords.y);
        });
    }

    ctx.restore();
}

function updateStats() {
    if (state.latticeData) {
        document.getElementById('noteCount').textContent = state.latticeData.data.length;
        document.getElementById('edgeCount').textContent = state.latticeData.edges.length;
        document.getElementById('primeLimit').textContent = state.latticeData.primeLimit;
        document.getElementById('dimensionality').textContent = state.latticeData.dimensionality;
    }
}

function init() {
    try {
        const ratios = state.scaleString.split(/\s+/).filter(r => r.trim());
        state.latticeData = ratiosToLatticeData(ratios);
        drawLattice