const canvas = document.getElementById('ecosystem');
const ctx = canvas.getContext('2d');

// Parámetros
const INITIAL_PREY = 50;
const INITIAL_PREDATORS = 5;
const MAX_ENERGY = 150;
const ENERGY_LOSS = 0.1; // Pérdida de energía por movimiento
const REPRODUCTION_ENERGY = 100; // Energía necesaria para reproducirse

let preys = [];
let predators = [];
let simulationRunning = false;
let dayTime = true; // Controla el ciclo día/noche
let ageCounter = 0; // Contador para el ciclo

// Inicializa la gráfica de aprendizaje
const ctxChart = document.getElementById('learningChart').getContext('2d');
let learningData = { labels: [], data: [] };
let learningChart = new Chart(ctxChart, {
    type: 'line',
    data: {
        labels: learningData.labels,
        datasets: [{
            label: 'Energía Acumulada del Depredador',
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            data: learningData.data,
            fill: true,
        }],
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Energía Acumulada',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Ciclos',
                },
            },
        },
        responsive: true,
        plugins: {
            legend: {
                display: true,
            },
        },
    },
});

let cycleCount = 0; // Contador de ciclos

// Clase para representar a la presa
class Prey {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 5;
        this.energy = MAX_ENERGY;
        this.color = 'green'; // Color de las presas
    }

    move(predators) {
        // Lógica de evasión
        let evasionVector = { x: 0, y: 0 };
        predators.forEach(predator => {
            const distance = Math.hypot(predator.x - this.x, predator.y - this.y);
            if (distance < 50) { // Si el depredador está a menos de 50 píxeles
                evasionVector.x += (this.x - predator.x);
                evasionVector.y += (this.y - predator.y);
            }
        });

        // Normaliza el vector de evasión
        const magnitude = Math.hypot(evasionVector.x, evasionVector.y);
        if (magnitude > 0) {
            evasionVector.x /= magnitude;
            evasionVector.y /= magnitude;
        }

        // Movimiento aleatorio, pero se incorpora el vector de evasión
        this.x += (Math.random() - 0.5) * 4 + evasionVector.x * 2; // Aumentar el efecto del vector de evasión
        this.y += (Math.random() - 0.5) * 4 + evasionVector.y * 2;
        this.x = Math.max(0, Math.min(this.x, canvas.width));
        this.y = Math.max(0, Math.min(this.y, canvas.height));
        this.energy -= ENERGY_LOSS; // Pérdida de energía por movimiento

        // Reproducción
        if (this.energy >= REPRODUCTION_ENERGY) {
            const newPreyCount = Math.floor(this.energy / REPRODUCTION_ENERGY); // Número de nuevas presas
            for (let i = 0; i < newPreyCount; i++) {
                preys.push(new Prey());
            }
            this.energy -= newPreyCount * (REPRODUCTION_ENERGY / 4); // Energía consumida por la reproducción
        }

        // Muerte
        if (this.energy <= 0) {
            return false; // Marca para eliminar
        }
        return true; // Sigue vivo
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Clase para representar al depredador
class Predator {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 10;
        this.energy = MAX_ENERGY;
        this.color = 'red'; // Color de los depredadores
    }

    move(preyList) {
        // Movimiento hacia la presa más cercana
        if (preyList.length > 0) {
            const closestPrey = preyList.reduce((closest, prey) => {
                const distance = Math.hypot(prey.x - this.x, prey.y - this.y);
                return distance < closest.distance ? { distance, prey } : closest;
            }, { distance: Infinity, prey: null }).prey;

            if (closestPrey) {
                if (this.x < closestPrey.x) this.x += 1;
                else if (this.x > closestPrey.x) this.x -= 1;
                if (this.y < closestPrey.y) this.y += 1;
                else if (this.y > closestPrey.y) this.y -= 1;

                // Colisión: Captura de la presa
                const distance = Math.hypot(closestPrey.x - this.x, closestPrey.y - this.y);
                if (distance < this.size + closestPrey.size) {
                    this.energy += closestPrey.energy; // Energía del depredador aumenta al capturar a la presa
                    preyList.splice(preyList.indexOf(closestPrey), 1); // Elimina la presa
                }
            }
        }

        this.energy -= ENERGY_LOSS; // Pérdida de energía por movimiento

        // Muerte
        if (this.energy <= 0) {
            return false; // Marca para eliminar
        }
        return true; // Sigue vivo
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Inicializa los agentes
function initializeAgents() {
    preys = Array.from({ length: INITIAL_PREY }, () => new Prey());
    predators = Array.from({ length: INITIAL_PREDATORS }, () => new Predator());
    updateCounters(); // Actualiza los contadores al inicio
}

// Actualiza los contadores de población
function updateCounters() {
    document.getElementById('preyCount').innerText = preys.length;
    document.getElementById('predatorCount').innerText = predators.length;
}

// Bucle principal de la simulación
function simulate() {
    if (!simulationRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Lógica para cambiar entre día y noche
    if (ageCounter % 300 === 0) { // Cambiar cada 300 frames
        dayTime = !dayTime; // Alternar entre día y noche
    }
    ageCounter++;

    // Cambiar el fondo según el ciclo
    ctx.fillStyle = dayTime ? 'lightblue' : 'darkblue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mover y dibujar presas
    preys = preys.filter(prey => {
        prey.move(predators); // Pasar depredadores para la lógica de evasión
        prey.draw();
        return prey.energy > 0; // Filtra las presas que mueren
    });

    // Mover y dibujar depredadores
    predators = predators.filter(predator => {
        predator.move(preys);
        predator.draw();
        return predator.energy > 0; // Filtra los depredadores que mueren
    });

    updateCounters();

    // Actualiza la gráfica de aprendizaje
    learningData.labels.push(cycleCount);
    learningData.data.push(predators.reduce((acc, predator) => acc + predator.energy, 0)); // Sumar la energía total
    learningChart.update(); // Actualiza la gráfica
    cycleCount++;

    requestAnimationFrame(simulate);
}

// Inicia la simulación
document.getElementById('start').addEventListener('click', () => {
    if (!simulationRunning) {
        simulationRunning = true;
        simulate();
    }
});

// Pausa la simulación
document.getElementById('pause').addEventListener('click', () => {
    simulationRunning = false;
});

// Agregar presas
document.getElementById('add-prey').addEventListener('click', () => {
    preys.push(new Prey());
    updateCounters();
});

// Agregar depredadores
document.getElementById('add-predator').addEventListener('click', () => {
    predators.push(new Predator());
    updateCounters();
});

// Inicializar la simulación
initializeAgents();
