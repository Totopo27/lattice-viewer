// ===== CONFIGURACIÓN DE COORDENADAS BASE (WILSON) =====
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23];

const baseCoords = {
    1: { x: 0, y: 0 }, 2: { x: 0, y: 0 }, 3: { x: 40, y: 0 },
    5: { x: 0, y: -40 }, 7: { x: 13, y: -11 }, 11: { x: -14, y: -18 },
    13: { x: -8, y: -4 }, 17: { x: -5, y: -32 }, 19: { x: 7, y: -25 },
    23: { x: 20, y: -6 }
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
        return { num, den: 1 };
    }
    const num = parseInt(parts[0]);
    const den = parseInt(parts[1]);
    if (isNaN(num) || isNaN(den) || num <= 0 || den <= 0) {
        throw new Error('Ratio inválido: ' + ratioStr);
    }
    return { num, den };
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

    return { x, y };
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
    return { x, y };
}

function analyzeRatio(ratioStr) {
    const { num, den } = parseRatio(ratioStr);
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
    const { num, den } = parseRatio(ratio);
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
    const styles = getComputedStyle(document.body);
    switch (scheme) {
        case 'rainbow': return ['#667eea', '#764ba2', '#f093fb', '#4facfe'];
        case 'warm': return ['#f093fb', '#f5576c', '#ff9a56'];
        case 'cool': return ['#4facfe', '#00f2fe', '#43e97b'];
        default: return [styles.getPropertyValue('--text-main').trim()];
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
    const styles = getComputedStyle(document.body);
    ctx.fillStyle = styles.getPropertyValue('--bg-main').trim();
    ctx.fillRect(0, 0, width, height);

    const { data, edges, minX, maxX, minY, maxY } = state.latticeData;
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
        ctx.strokeStyle = styles.getPropertyValue('--grid-color').trim();
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
    // Removed manual override for white scheme in light mode as it is now handled by CSS variable in getColorForScheme

    data.forEach((point, i) => {
        const colorIndex = i % pointColors.length;
        ctx.fillStyle = pointColors[colorIndex];
        ctx.beginPath();
        ctx.arc(point.coords.x, point.coords.y, state.pointSize / zoom, 0, Math.PI * 2);
        ctx.fill();

        ctx.fill();

        ctx.strokeStyle = styles.getPropertyValue('--bg-main').trim();
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

            ctx.fillStyle = styles.getPropertyValue('--panel-bg').trim();
            const metrics = ctx.measureText(label);
            const padding = 1 / zoom;
            ctx.fillRect(
                point.coords.x + 3 / zoom - padding,
                point.coords.y - state.textSize / (2 * zoom) - padding,
                metrics.width + padding * 2,
                state.textSize / zoom + padding * 2
            );

            ctx.fillStyle = styles.getPropertyValue('--text-main').trim();
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
        drawLattice();
        updateStats();
    } catch (e) {
        console.error('Error al inicializar:', e);
        alert('Error al cargar la escala: ' + e.message);
    }
}

// ===== FUNCIONES DE MODALES =====

function analyzeET() {
    if (!state.latticeData) return;

    const etSystems = [12, 19, 22, 24, 31, 41, 53];
    let html = '<div style="color: #333;">';

    state.latticeData.data.forEach(point => {
        html += `<div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">`;
        html += `<strong style="color: #7e22ce; font-size: 16px;">${point.ratio}</strong> (${Math.round(point.cents)}¢)<br>`;
        html += `<div style="margin-top: 10px; font-size: 13px;">`;

        etSystems.forEach(et => {
            const mapping = mapToET(point.ratio, et);
            const errorStr = mapping.error < 5 ?
                `<span style="color: #059669;">±${mapping.error.toFixed(2)}¢</span>` :
                `<span style="color: #dc2626;">±${mapping.error.toFixed(2)}¢</span>`;
            html += `${et}-ET: grado ${mapping.degree} ${errorStr}<br>`;
        });

        html += `</div></div>`;
    });

    html += '</div>';
    document.getElementById('etResults').innerHTML = html;
    document.getElementById('etModal').classList.add('active');
}

function showIntervalTable() {
    const intervals = calculateIntervals();

    let html = '<div style="color: #333; max-height: 500px; overflow-y: auto;">';
    html += '<table class="interval-table">';
    html += '<thead><tr><th>Desde</th><th>Hasta</th><th>Cents</th><th>Ratio</th></tr></thead>';
    html += '<tbody>';

    intervals.forEach(interval => {
        html += `<tr>
            <td>${interval.from}</td>
            <td>${interval.to}</td>
            <td>${Math.round(interval.cents)}¢</td>
            <td>${interval.ratio}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    document.getElementById('intervalResults').innerHTML = html;
    document.getElementById('intervalModal').classList.add('active');
}

function showStructures() {
    const { triads, tetrads } = detectStructures();

    let html = '<div style="color: #333;">';

    if (triads.length > 0) {
        html += '<div class="analysis-section">';
        html += '<h3>Tríadas Detectadas</h3>';
        html += '<ul class="structure-list">';
        triads.forEach(triad => {
            html += `<li class="structure-item">
                <strong>${triad.type}</strong>
                ${triad.notes.join(' - ')}
            </li>`;
        });
        html += '</ul></div>';
    }

    if (tetrads.length > 0) {
        html += '<div class="analysis-section">';
        html += '<h3>Tetradas Detectadas</h3>';
        html += '<ul class="structure-list">';
        tetrads.forEach(tetrad => {
            html += `<li class="structure-item">
                <strong>${tetrad.type}</strong>
                ${tetrad.notes.join(' - ')}
            </li>`;
        });
        html += '</ul></div>';
    }

    if (triads.length === 0 && tetrads.length === 0) {
        html += '<p style="padding: 20px; text-align: center; color: #666;">No se detectaron estructuras armónicas comunes en esta escala.</p>';
    }

    html += '</div>';
    document.getElementById('structureResults').innerHTML = html;
    document.getElementById('structureModal').classList.add('active');
}

// ===== TOGGLE TEMA =====
// ===== TOGGLE TEMA =====
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('light')) {
        body.classList.remove('light');
        body.classList.add('dark');
        state.theme = 'dark';
    } else {
        body.classList.remove('dark');
        body.classList.add('light');
        state.theme = 'light';
    }
    document.getElementById('themeToggle').textContent = state.theme === 'dark' ? 'OSCURO' : 'CLARO';
    drawLattice();
}

// ===== EVENT LISTENERS =====

document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Toggle sección Avanzado
document.getElementById('advancedHeader').addEventListener('click', () => {
    const content = document.getElementById('advancedContent');
    const icon = document.querySelector('#advancedHeader .expand-icon');

    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        icon.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        icon.classList.add('expanded');
    }
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.scaleString = presets[btn.dataset.preset];
        state.panX = 0;
        state.panY = 0;
        state.zoom = 0.8;
        document.getElementById('zoomSlider').value = 80;
        document.getElementById('zoomValue').textContent = '80%';
        init();
    });
});

document.getElementById('editScaleBtn').addEventListener('click', () => {
    document.getElementById('scaleInput').value = state.scaleString;
    document.getElementById('modal').classList.add('active');
});

document.getElementById('analyzeETBtn').addEventListener('click', analyzeET);
document.getElementById('intervalTableBtn').addEventListener('click', showIntervalTable);
document.getElementById('detectStructuresBtn').addEventListener('click', showStructures);

// Abrir modal de exportación
document.getElementById('exportBtn').addEventListener('click', () => {
    document.getElementById('exportModal').classList.add('active');
});

// Botones de exportación
document.getElementById('exportScalaBtn').addEventListener('click', exportToScala);
document.getElementById('exportTxtBtn').addEventListener('click', exportToTxt);
document.getElementById('cancelExportBtn').addEventListener('click', () => {
    document.getElementById('exportModal').classList.remove('active');
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('active');
});

document.getElementById('closeETBtn').addEventListener('click', () => {
    document.getElementById('etModal').classList.remove('active');
});

document.getElementById('closeIntervalBtn').addEventListener('click', () => {
    document.getElementById('intervalModal').classList.remove('active');
});

document.getElementById('closeStructureBtn').addEventListener('click', () => {
    document.getElementById('structureModal').classList.remove('active');
});

document.getElementById('createLatticeBtn').addEventListener('click', () => {
    try {
        state.scaleString = document.getElementById('scaleInput').value;
        init();
        document.getElementById('modal').classList.remove('active');
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    } catch (e) {
        alert('Error: ' + e.message);
    }
});

document.querySelectorAll('input[name="textType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        state.textType = e.target.value;
        drawLattice();
    });
});

document.querySelectorAll('input[name="projectionType"]').forEach(radio => {
    radio.addEventListener('change', () => {
        state.projectionType = document.querySelector('input[name="projectionType"]:checked').value;
        init();
    });
});

document.getElementById('zoomSlider').addEventListener('input', (e) => {
    state.zoom = e.target.value / 100;
    document.getElementById('zoomValue').textContent = e.target.value + '%';
    drawLattice();
});

document.getElementById('pointSizeSlider').addEventListener('input', (e) => {
    state.pointSize = parseFloat(e.target.value);
    document.getElementById('pointSizeValue').textContent = e.target.value;
    drawLattice();
});

document.getElementById('lineWidthSlider').addEventListener('input', (e) => {
    state.lineWidth = parseFloat(e.target.value);
    document.getElementById('lineWidthValue').textContent = e.target.value;
    drawLattice();
});

document.getElementById('textSizeSlider').addEventListener('input', (e) => {
    state.textSize = parseFloat(e.target.value);
    document.getElementById('textSizeValue').textContent = e.target.value;
    drawLattice();
});

document.getElementById('showGrid').addEventListener('change', (e) => {
    state.showGrid = e.target.checked;
    drawLattice();
});

document.getElementById('showLabels').addEventListener('change', (e) => {
    state.showLabels = e.target.checked;
    drawLattice();
});

document.getElementById('showConnections').addEventListener('change', (e) => {
    state.showConnections = e.target.checked;
    drawLattice();
});

document.getElementById('strictConnections').addEventListener('change', (e) => {
    state.strictConnections = e.target.checked;
    init();
});

document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        state.colorScheme = option.dataset.color;
        drawLattice();
    });
});

document.getElementById('resetViewBtn').addEventListener('click', () => {
    state.panX = 0;
    state.panY = 0;
    state.zoom = 0.8;
    document.getElementById('zoomSlider').value = 80;
    document.getElementById('zoomValue').textContent = '80%';
    drawLattice();
});

document.getElementById('exportImageBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `lattice_${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

canvas.addEventListener('pointerdown', (e) => {
    state.isDragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
});

canvas.addEventListener('pointermove', (e) => {
    if (state.isDragging) {
        state.panX += e.clientX - state.lastX;
        state.panY += e.clientY - state.lastY;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        drawLattice();
    }
});

canvas.addEventListener('pointerup', () => {
    state.isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const oldZoom = state.zoom;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    state.zoom = Math.max(0.2, Math.min(2, state.zoom * delta));

    const zoomRatio = state.zoom / oldZoom;
    state.panX = mouseX - (mouseX - state.panX) * zoomRatio;
    state.panY = mouseY - (mouseY - state.panY) * zoomRatio;

    document.getElementById('zoomSlider').value = Math.round(state.zoom * 100);
    document.getElementById('zoomValue').textContent = Math.round(state.zoom * 100) + '%';
    drawLattice();
}, { passive: false });

window.addEventListener('resize', drawLattice);

document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        document.getElementById('modal').classList.remove('active');
    }
});

document.getElementById('etModal').addEventListener('click', (e) => {
    if (e.target.id === 'etModal') {
        document.getElementById('etModal').classList.remove('active');
    }
});

document.getElementById('intervalModal').addEventListener('click', (e) => {
    if (e.target.id === 'intervalModal') {
        document.getElementById('intervalModal').classList.remove('active');
    }
});

document.getElementById('structureModal').addEventListener('click', (e) => {
    if (e.target.id === 'structureModal') {
        document.getElementById('structureModal').classList.remove('active');
    }
});

document.getElementById('exportModal').addEventListener('click', (e) => {
    if (e.target.id === 'exportModal') {
        document.getElementById('exportModal').classList.remove('active');
    }
});

init();
