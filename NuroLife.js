const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');
const fs = require('fs');

// Define the grid size and cell size for visualization
const gridSize = 200;
const cellSize = 4;

// Define cell states
const INACTIVE = 0;
const ACTIVE = 1;
const REFRACTORY = 2;
const INHIBITORY = 3;
const TUMOR_INITIATION = 4;
const TUMOR_GROWTH = 5;
const TUMOR_DECAY = 6;

// Define refractory period for active cells
const REFRACTORY_PERIOD = 50;

// Activation settings
const ACTIVATION_PROBABILITY = 0.2;
const DEACTIVATION_PROBABILITY = 0.01;
const REFRACTORY_THRESHOLD = 100;
const CONNECTION_FACTOR = 2;

// Tumor settings
const TUMOR_INITIATION_PROBABILITY = 0.0001; // Less frequent tumor initiation
const TUMOR_GROWTH_PROBABILITY = 0.1;
const TUMOR_DECAY_PROBABILITY = 0.05;
const TUMOR_SPREAD_PROBABILITY = 0.05;
const TUMOR_DECAY_TIME = 50; // Duration of tumor decay

// Synaptic Plasticity settings
const LEARNING_RATE = 0.01;
const DECAY_RATE = 0.001;

// NeuronCell class to encapsulate the properties and behaviors of each cell
class NeuronCell {
    constructor(state = INACTIVE, activityLevel = 0, refractoryTime = 0, neuronType = 'excitatory', synapticStrength = 1, tumorDecayTime = 0, connections = []) {
        this.state = state;
        this.activityLevel = activityLevel;
        this.refractoryTime = refractoryTime;
        this.neuronType = neuronType; // 'excitatory' or 'inhibitory'
        this.synapticStrength = synapticStrength;
        this.tumorDecayTime = tumorDecayTime;
        this.connections = connections; // Array of connected neuron positions
    }

    update(grid, x, y) {
        switch (this.state) {
            case INACTIVE:
                if (Math.random() < ACTIVATION_PROBABILITY) {
                    this.state = ACTIVE;
                    this.activityLevel = 0;
                } else if (Math.random() < TUMOR_INITIATION_PROBABILITY) {
                    this.state = TUMOR_INITIATION;
                }
                break;
            case ACTIVE:
                this.activityLevel++;
                this.propagateSignal(grid, x, y);
                if (Math.random() < DEACTIVATION_PROBABILITY || this.activityLevel > REFRACTORY_THRESHOLD) {
                    this.state = REFRACTORY;
                    this.refractoryTime = REFRACTORY_PERIOD;
                }
                break;
            case REFRACTORY:
                this.refractoryTime--;
                if (this.refractoryTime <= 0) {
                    this.state = INACTIVE;
                    this.activityLevel = 0;
                }
                break;
            case TUMOR_INITIATION:
                if (Math.random() < TUMOR_GROWTH_PROBABILITY) {
                    this.state = TUMOR_GROWTH;
                }
                break;
            case TUMOR_GROWTH:
                this.spreadTumor(grid, x, y);
                if (Math.random() < TUMOR_DECAY_PROBABILITY) {
                    this.state = TUMOR_DECAY;
                    this.tumorDecayTime = TUMOR_DECAY_TIME;
                }
                break;
            case TUMOR_DECAY:
                this.tumorDecayTime--;
                if (this.tumorDecayTime <= 0) {
                    this.state = INACTIVE;
                }
                break;
        }
    }

    spreadTumor(grid, x, y) {
        let directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],
            [-1, -1], [-1, 1], [1, -1], [1, 1],
        ];
        directions.forEach(([dx, dy]) => {
            let nx = (x + dx + gridSize) % gridSize;
            let ny = (y + dy + gridSize) % gridSize;
            if (grid[nx][ny].state !== TUMOR_GROWTH && Math.random() < TUMOR_SPREAD_PROBABILITY) {
                grid[nx][ny] = new NeuronCell(TUMOR_INITIATION, 0, 0, this.neuronType, this.synapticStrength);
            }
        });
    }

    propagateSignal(grid, x, y) {
        if (this.state === TUMOR_INITIATION || this.state === TUMOR_GROWTH || this.state === TUMOR_DECAY) {
            return; // Do not propagate signals from tumor-affected neurons
        }

        // Strengthen connections (Hebbian learning)
        this.connections.forEach(([dx, dy]) => {
            let nx = (x + dx + gridSize) % gridSize;
            let ny = (y + dy + gridSize) % gridSize;
            grid[nx][ny].synapticStrength += LEARNING_RATE;
        });

        // Propagate signals to connected neurons
        this.connections.forEach(([dx, dy]) => {
            let nx = (x + dx + gridSize) % gridSize;
            let ny = (y + dy + gridSize) % gridSize;
            if (grid[nx][ny].state === INACTIVE && Math.random() < this.synapticStrength) {
                grid[nx][ny] = new NeuronCell(ACTIVE, 0, 0, grid[nx][ny].neuronType, grid[nx][ny].synapticStrength);
            }
        });

        // Decay synaptic strengths (synaptic plasticity)
        this.synapticStrength = Math.max(0, this.synapticStrength - DECAY_RATE);
    }
}

// Initialize the grid with NeuronCell objects
let grid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => new NeuronCell()));

// Initialize with some active neurons of different types
const initialNeurons = [
    { x: Math.floor(gridSize / 4), y: Math.floor(gridSize / 4), type: 'excitatory' },
    { x: Math.floor(3 * gridSize / 4), y: Math.floor(3 * gridSize / 4), type: 'inhibitory' },
    // Add more initial neurons to create a balanced and distributed setup
    ...Array.from({ length: 20 }, () => ({
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
        type: Math.random() < 0.5 ? 'excitatory' : 'inhibitory',
        connections: Array.from({ length: 4 }, () => [Math.floor(Math.random() * 3) - 1, Math.floor(Math.random() * 3) - 1]) // Random initial connections
    }))
];

initialNeurons.forEach(({ x, y, type, connections }) => {
    grid[x][y] = new NeuronCell(ACTIVE, 0, 0, type, Math.random(), 0, connections);
});

// Function to update the grid based on neuronal activity rules
function updateGrid(grid) {
    let newGrid = grid.map(row => row.map(cell => new NeuronCell(cell.state, cell.activityLevel, cell.refractoryTime, cell.neuronType, cell.synapticStrength, cell.tumorDecayTime, cell.connections)));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            newGrid[x][y].update(newGrid, x, y);
        }
    }

    return newGrid;
}

// Function to draw the grid on a canvas with synaptic connections and gradient colors
function drawGrid(grid, ctx) {
    // Clear canvas
    ctx.clearRect(0, 0, gridSize * cellSize, gridSize * cellSize);

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            switch (grid[x][y].state) {
                case INACTIVE:
                    ctx.fillStyle = 'white';
                    break;
                case ACTIVE:
                    ctx.fillStyle = grid[x][y].neuronType === 'excitatory' ? `rgba(0, 0, 255, ${grid[x][y].synapticStrength})` : `rgba(255, 0, 0, ${grid[x][y].synapticStrength})`;
                    break;
                case REFRACTORY:
                    ctx.fillStyle = 'grey';
                    break;
                case TUMOR_INITIATION:
                    ctx.fillStyle = 'yellow';
                    break;
                case TUMOR_GROWTH:
                    ctx.fillStyle = 'orange';
                    break;
                case TUMOR_DECAY:
                    ctx.fillStyle = 'brown';
                    break;
            }
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
}

// Create a canvas and context
const canvas = createCanvas(gridSize * cellSize, gridSize * cellSize);
const ctx = canvas.getContext('2d');

// Create a GIF encoder
const encoder = new GIFEncoder(gridSize * cellSize, gridSize * cellSize);
encoder.createReadStream().pipe(fs.createWriteStream('neuronal-activity-with-tumor-lifecycle.gif'));
encoder.start();
encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
encoder.setDelay(100); // frame delay in ms
encoder.setQuality(10); // image quality. 10 is default

// Main simulation loop
function simulate(iterations) {
    for (let i = 0; i < iterations; i++) {
        console.log('Current Cycle:', i);
        grid = updateGrid(grid);
        drawGrid(grid, ctx);
        encoder.addFrame(ctx);
    }
    encoder.finish();
    console.log('The GIF file was created.');
}

// Run the simulation
simulate(500);
