const { createCanvas } = require('canvas');
const express = require('express');
const path = require('path');

// Define the grid size and cell size for visualization
const gridSize = 400;
const cellSize = 1;

// Define cell states
const EMPTY = 0;
const HYPHAE = 1;
const TIP = 2;
const SPORE = 3;
const DEAD = 4;
const DECAYING = 5;

// Define decay time for dead cells
const DECAY_TIME = 50;

// Growth settings
const SPORE_TO_TIP_PROBABILITY = 0.18;
const RANDOM_DEATH_PROBABILITY = 0.005;
const AGE_THRESHOLD = 120;
const SPREAD_FACTOR = 2;

// FungusCell class to encapsulate the properties and behaviors of each cell
class FungusCell {
    constructor(state = EMPTY, age = 0, decayTime = 0, strain = '') {
        this.state = state;
        this.age = age;
        this.decayTime = decayTime;
        this.strain = strain; // Add strain to differentiate between competing fungi
    }

    update(grid, x, y) {
        switch (this.state) {
            case SPORE:
                if (Math.random() < SPORE_TO_TIP_PROBABILITY) {
                    this.state = TIP;
                    this.age = 0;
                }
                break;
            case TIP:
                this.state = HYPHAE;
                this.age++;
                this.spread(grid, x, y, SPREAD_FACTOR);
                break;
            case HYPHAE:
                this.age++;
                if (Math.random() < RANDOM_DEATH_PROBABILITY || this.age > AGE_THRESHOLD || this.countNeighbors(grid, x, y) > 4) {
                    this.state = DECAYING;
                    this.decayTime = DECAY_TIME;
                } else if (Math.random() < RANDOM_DEATH_PROBABILITY) {
                    this.state = SPORE;
                    this.age = 0;
                }
                break;
            case DECAYING:
                this.decayTime--;
                if (this.decayTime <= 0) {
                    this.state = EMPTY;
                    this.age = 0;
                    this.decayTime = 0;
                }
                break;
        }
    }

    spread(grid, x, y, spreadFactor) {
        const directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],
            [-1, -1], [-1, 1], [1, -1], [1, 1],
        ];
        for (let i = 0; i < spreadFactor; i++) {
            const [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
            const nx = (x + dx + gridSize) % gridSize;
            const ny = (y + dy + gridSize) % gridSize;
            if (grid[nx][ny].state === EMPTY) {
                grid[nx][ny] = new FungusCell(TIP, 0, 0, this.strain);
            }
        }
    }

    countNeighbors(grid, x, y) {
        const directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],
            [-1, -1], [-1, 1], [1, -1], [1, 1],
        ];
        let count = 0;
        for (const [dx, dy] of directions) {
            const nx = (x + dx + gridSize) % gridSize;
            const ny = (y + dy + gridSize) % gridSize;
            if (grid[nx][ny].state === HYPHAE) {
                count++;
            }
        }
        return count;
    }
}

// Function to initialize the grid with FungusCell objects
function initializeGrid() {
    const newGrid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => new FungusCell()));
    
    // Initialize with some spores for two strains
    const initialSpores = [
        { x: Math.floor(gridSize / 4), y: Math.floor(gridSize / 4), strain: 'Penicillium' },
        { x: Math.floor(3 * gridSize / 4), y: Math.floor(3 * gridSize / 4), strain: 'Aspergillus' },
    ];

    initialSpores.forEach(({ x, y, strain }) => {
        newGrid[x][y] = new FungusCell(SPORE, 0, 0, strain);
    });

    return newGrid;
}

// Initialize the grid
let grid = initializeGrid();

// Function to update the grid based on fungal growth and decay rules
function updateGrid(grid) {
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            grid[x][y].update(grid, x, y);
        }
    }
}

// Function to draw the grid on a canvas
function drawGrid(grid, ctx, offsetX, offsetY, scale) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            switch (grid[x][y].state) {
                case EMPTY:
                    ctx.fillStyle = 'white';
                    break;
                case HYPHAE:
                    ctx.fillStyle = grid[x][y].strain === 'Penicillium' ? 'green' : 'brown';
                    break;
                case TIP:
                    ctx.fillStyle = grid[x][y].strain === 'Penicillium' ? 'darkgreen' : 'darkbrown';
                    break;
                case SPORE:
                    ctx.fillStyle = grid[x][y].strain === 'Penicillium' ? 'blue' : 'yellow';
                    break;
                case DECAYING:
                    ctx.fillStyle = 'grey';
                    break;
            }
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
    ctx.restore();
}

// Create a canvas and context
const canvas = createCanvas(gridSize * cellSize, gridSize * cellSize);
const ctx = canvas.getContext('2d');

// Setup Express server
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/current-frame', (req, res) => {
    const { offsetX = 0, offsetY = 0, scale = 1 } = req.query;
    drawGrid(grid, ctx, parseFloat(offsetX), parseFloat(offsetY), parseFloat(scale));
    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer());
});

app.get('/start-simulation', (req, res) => {
    running = true;
    currentIteration = 0; // Reset iteration counter
    preloadFrames(50).then(() => {
        simulate();
        res.sendStatus(200);
    });
});

app.get('/pause-simulation', (req, res) => {
    running = false;
    res.sendStatus(200);
});

app.get('/reset-simulation', (req, res) => {
    running = false;
    grid = initializeGrid(); // Reset grid
    currentIteration = 0; // Reset iteration counter
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Main simulation loop
let currentIteration = 0;
let running = false;

function preloadFrames(count) {
    return new Promise((resolve) => {
        const preloadLoop = () => {
            if (count > 0) {
                updateGrid(grid);
                currentIteration++;
                count--;
                setTimeout(preloadLoop, 0); // Use a timeout to avoid blocking the event loop
            } else {
                resolve();
            }
        };
        preloadLoop();
    });
}

function simulate() {
    if (running) {
        updateGrid(grid);
        currentIteration++;
        setTimeout(simulate, 16); // Approximate 60 FPS
    }
}

function startSimulation() {
    running = true;
    simulate();
}

function pauseSimulation() {
    running = false;
}
