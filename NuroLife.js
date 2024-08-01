const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');
const fs = require('fs');

// Define the grid size and cell size for visualization
const gridSize = 200;
const cellSize = 1;

// Define cell states
const INACTIVE = 0;
const ACTIVE = 1;
const REFRACTORY = 2;
const INHIBITORY = 3;
const DEMENTIA_START = 4;
const DEMENTIA_AFFECTED = 5;
const PERMANENT_DAMAGE = 3; // New state for permanent damage

// Define refractory period for active cells
const REFRACTORY_PERIOD = 50;

// Activation settings
const ACTIVATION_PROBABILITY = 0.2;
const DEACTIVATION_PROBABILITY = 0.01;
const REFRACTORY_THRESHOLD = 100;
const CONNECTION_FACTOR = 2;

// Dementia settings
const DEMENTIA_PROBABILITY = 0.007; // Increased initiation probability
const DEMENTIA_SPREAD_PROBABILITY = 0.02; // Decreased spread probability
const DEMENTIA_DECAY_PROBABILITY = 0.1; // Maintain decay probability
const DEMENTIA_RECOVERY_PROBABILITY = 0.002; // Increased recovery probability
const DEMENTIA_DECAY_TIME = 50;

// Synaptic Plasticity settings
const LEARNING_RATE = 0.01;
const DECAY_RATE = 0.001;

// Brain region layout
const brainRegions = {
    'frontalLobe': { xRange: [0, 50], yRange: [0, 100], density: 1.0 },
    'temporalLobe': { xRange: [50, 100], yRange: [0, 100], density: 0.8 },
    'parietalLobe': { xRange: [100, 150], yRange: [0, 100], density: 0.9 },
    'occipitalLobe': { xRange: [150, 200], yRange: [0, 100], density: 0.7 },
    'hippocampus': { xRange: [75, 125], yRange: [100, 150], density: 0.5 },
    'cerebellum': { xRange: [0, 200], yRange: [150, 200], density: 0.6 },
};

// NeuronCell class to encapsulate the properties and behaviors of each cell
class NeuronCell {
    constructor(state = INACTIVE, activityLevel = 0, refractoryTime = 0, neuronType = 'excitatory', synapticStrength = 1, dementiaDecayTime = 0, region = 'frontalLobe', connections = []) {
        this.state = state;
        this.activityLevel = activityLevel;
        this.refractoryTime = refractoryTime;
        this.neuronType = neuronType; // 'excitatory' or 'inhibitory'
        this.synapticStrength = synapticStrength;
        this.dementiaDecayTime = dementiaDecayTime;
        this.region = region; // Brain region the neuron belongs to
        this.connections = connections; // Array of connected neuron positions
    }

    update(grid, x, y) {
        switch (this.state) {
            case INACTIVE:
                if (Math.random() < ACTIVATION_PROBABILITY) {
                    this.state = ACTIVE;
                    this.activityLevel = 0;
                } else if (Math.random() < DEMENTIA_PROBABILITY) {
                    this.state = DEMENTIA_START;
                }
                break;
            case ACTIVE:
                this.activityLevel++;
                if (Math.random() < DEACTIVATION_PROBABILITY || this.activityLevel > REFRACTORY_THRESHOLD) {
                    this.state = REFRACTORY;
                    this.refractoryTime = REFRACTORY_PERIOD;
                }
                this.propagateSignal(grid, x, y);
                break;
            case REFRACTORY:
                this.refractoryTime--;
                if (this.refractoryTime <= 0) {
                    this.state = INACTIVE;
                    this.activityLevel = 0;
                }
                break;
            case DEMENTIA_START:
                this.spreadDementia(grid, x, y);
                if (Math.random() < DEMENTIA_DECAY_PROBABILITY) {
                    this.state = DEMENTIA_AFFECTED;
                    this.dementiaDecayTime = DEMENTIA_DECAY_TIME;
                } else if (Math.random() < DEMENTIA_RECOVERY_PROBABILITY) {
                    this.state = INACTIVE;
                }
                break;
            case DEMENTIA_AFFECTED:
                this.dementiaDecayTime--;
                if (this.dementiaDecayTime <= 0) {
                    this.state = PERMANENT_DAMAGE;
                }
                break;
            case PERMANENT_DAMAGE:
                // No update needed, neuron is permanently damaged
                break;
        }
    }

    spreadDementia(grid, x, y) {
        let directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],
            [-1, -1], [-1, 1], [1, -1], [1, 1],
        ];
        directions.forEach(([dx, dy]) => {
            let nx = (x + dx + gridSize) % gridSize;
            let ny = (y + dy + gridSize) % gridSize;
            if (grid[nx][ny].state !== DEMENTIA_START && grid[nx][ny].state !== DEMENTIA_AFFECTED && grid[nx][ny].state !== ACTIVE && Math.random() < DEMENTIA_SPREAD_PROBABILITY) {
                grid[nx][ny] = new NeuronCell(DEMENTIA_START, 0, 0, this.neuronType, this.synapticStrength, 0, this.region);
            }
        });
    }

    propagateSignal(grid, x, y) {
        if (this.state === DEMENTIA_START || this.state === DEMENTIA_AFFECTED || this.state === PERMANENT_DAMAGE) {
            return; // Do not propagate signals from dementia-affected or permanently damaged neurons
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
                grid[nx][ny] = new NeuronCell(ACTIVE, 0, 0, grid[nx][ny].neuronType, grid[nx][ny].synapticStrength, 0, grid[nx][ny].region);
            }
        });

        // Decay synaptic strengths (synaptic plasticity)
        this.synapticStrength = Math.max(0, this.synapticStrength - DECAY_RATE);
    }
}

// Initialize the grid with NeuronCell objects
let grid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => new NeuronCell()));

// Initialize with neurons distributed across regions
const initialNeurons = [];
for (const region in brainRegions) {
    const { xRange, yRange, density } = brainRegions[region];
    const numNeurons = Math.floor(density * (xRange[1] - xRange[0]) * (yRange[1] - yRange[0]) / 10);
    for (let i = 0; i < numNeurons; i++) {
        initialNeurons.push({
            x: Math.floor(Math.random() * (xRange[1] - xRange[0]) + xRange[0]),
            y: Math.floor(Math.random() * (yRange[1] - yRange[0]) + yRange[0]),
            type: Math.random() < 0.8 ? 'excitatory' : 'inhibitory',
            region,
            connections: Array.from({ length: 4 }, () => [Math.floor(Math.random() * 3) - 1, Math.floor(Math.random() * 3) - 1]) // Random initial connections
        });
    }
}

initialNeurons.forEach(({ x, y, type, region, connections }) => {
    grid[x][y] = new NeuronCell(ACTIVE, 0, 0, type, Math.random(), 0, region, connections);
});

// Function to update the grid based on neuronal activity rules
function updateGrid(grid) {
    let newGrid = grid.map(row => row.map(cell => new NeuronCell(cell.state, cell.activityLevel, cell.refractoryTime, cell.neuronType, cell.synapticStrength, cell.dementiaDecayTime, cell.region, cell.connections)));

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
                case DEMENTIA_START:
                    ctx.fillStyle = 'purple';
                    break;
                case DEMENTIA_AFFECTED:
                    ctx.fillStyle = 'darkblue';
                    break;
                case PERMANENT_DAMAGE:
                    ctx.fillStyle = 'black';
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
encoder.createReadStream().pipe(fs.createWriteStream('neuronal-activity-with-dementia.gif'));
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
simulate(1000);
