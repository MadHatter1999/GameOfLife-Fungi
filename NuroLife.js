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
const DEMENTIA_START = 4;
const DEMENTIA_AFFECTED = 5;

// Define refractory period for active cells
const REFRACTORY_PERIOD = 50;

// Activation settings
const ACTIVATION_PROBABILITY = 0.2;
const DEACTIVATION_PROBABILITY = 0.01;
const REFRACTORY_THRESHOLD = 100;
const CONNECTION_FACTOR = 2;

// Dementia settings
const DEMENTIA_PROBABILITY = 0.001;
const DEMENTIA_SPREAD_PROBABILITY = 0.1;
const DEMENTIA_DECAY_PROBABILITY = 0.05;
const DEMENTIA_DECAY_TIME = 50;

// NeuronCell class to encapsulate the properties and behaviors of each cell
class NeuronCell {
    constructor(state = INACTIVE, activityLevel = 0, refractoryTime = 0, neuronType = 'excitatory', synapticStrength = 1, dementiaDecayTime = 0) {
        this.state = state;
        this.activityLevel = activityLevel;
        this.refractoryTime = refractoryTime;
        this.neuronType = neuronType; // 'excitatory' or 'inhibitory'
        this.synapticStrength = synapticStrength;
        this.dementiaDecayTime = dementiaDecayTime;
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
                this.connect(grid, x, y, CONNECTION_FACTOR);
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
            case DEMENTIA_START:
                this.spreadDementia(grid, x, y);
                if (Math.random() < DEMENTIA_DECAY_PROBABILITY) {
                    this.state = DEMENTIA_AFFECTED;
                    this.dementiaDecayTime = DEMENTIA_DECAY_TIME;
                }
                break;
            case DEMENTIA_AFFECTED:
                this.dementiaDecayTime--;
                if (this.dementiaDecayTime <= 0) {
                    this.state = INACTIVE;
                }
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
            if (grid[nx][ny].state !== DEMENTIA_START && grid[nx][ny].state !== DEMENTIA_AFFECTED && Math.random() < DEMENTIA_SPREAD_PROBABILITY) {
                grid[nx][ny] = new NeuronCell(DEMENTIA_START, 0, 0, this.neuronType, this.synapticStrength);
            }
        });
    }

    connect(grid, x, y, connectionFactor) {
        let directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],
            [-1, -1], [-1, 1], [1, -1], [1, 1],
        ];
        for (let i = 0; i < connectionFactor; i++) {
            let direction = directions[Math.floor(Math.random() * directions.length)];
            let [dx, dy] = direction;
            let nx = (x + dx + gridSize) % gridSize;
            let ny = (y + dy + gridSize) % gridSize;
            if (grid[nx][ny].state === INACTIVE) {
                grid[nx][ny] = new NeuronCell(ACTIVE, 0, 0, this.neuronType, this.synapticStrength);
            }
        }
    }
}

// Initialize the grid with NeuronCell objects
let grid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => new NeuronCell()));

// Initialize with some active neurons of different types
const initialNeurons = [
    { x: Math.floor(gridSize / 4), y: Math.floor(gridSize / 4), type: 'excitatory' },
    { x: Math.floor(3 * gridSize / 4), y: Math.floor(3 * gridSize / 4), type: 'inhibitory' },
];

initialNeurons.forEach(({ x, y, type }) => {
    grid[x][y] = new NeuronCell(ACTIVE, 0, 0, type, Math.random());
});

// Function to update the grid based on neuronal activity rules
function updateGrid(grid) {
    let newGrid = grid.map(row => row.map(cell => new NeuronCell(cell.state, cell.activityLevel, cell.refractoryTime, cell.neuronType, cell.synapticStrength, cell.dementiaDecayTime)));

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
                    ctx.fillStyle = 'yellow';
                    break;
                case DEMENTIA_AFFECTED:
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
simulate(500);
