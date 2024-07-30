const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');
const fs = require('fs');

// Define the grid size and cell size for visualization
const gridSize = 200;
const cellSize = 4;

// Define cell states
const EMPTY = 0;
const CONSCIOUS = 1;
const INTEGRATION = 2;
const UNCONSCIOUS = 3;
const CONFLICT = 4;
const RESOLUTION = 5;

// Define decay time for resolution state
const RESOLUTION_TIME = 50;

// Mental energy level affecting transitions
const MAX_MENTAL_ENERGY = 100;
let mentalEnergy = 50; // Starts at a neutral level

// Base spread factor for influence
const INFLUENCE_SPREAD_BASE = 2;

// Probability functions for state transitions based on mental energy and neighbor influence
function getTransitionProbability(cell, grid, x, y) {
    let baseProb = Math.random();
    let neighborInfluence = countInfluentialNeighbors(grid, x, y);
    let energyFactor = mentalEnergy / MAX_MENTAL_ENERGY;

    switch (cell.state) {
        case UNCONSCIOUS:
            return baseProb < energyFactor * 0.2 + neighborInfluence * 0.1;
        case INTEGRATION:
            return baseProb < 0.15 + neighborInfluence * 0.05;
        case CONSCIOUS:
            return baseProb < 0.05; // Stable state with low decay probability
        case CONFLICT:
            return baseProb < 0.3 + energyFactor * 0.1;
        default:
            return false;
    }
}

// Count neighboring cells with significant psychological influence
function countInfluentialNeighbors(grid, x, y) {
    let directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0],
        [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];
    return directions.reduce((count, [dx, dy]) => {
        let nx = (x + dx + gridSize) % gridSize;
        let ny = (y + dy + gridSize) % gridSize;
        return count + (grid[nx][ny].state !== EMPTY ? 1 : 0);
    }, 0);
}

// PsycheCell class representing different states of the psyche
class PsycheCell {
    constructor(state = EMPTY, age = 0, resolutionTime = 0, archetype = '') {
        this.state = state;
        this.age = age;
        this.resolutionTime = resolutionTime;
        this.archetype = archetype; // Represents psychological aspects like archetypes
    }

    update(grid, x, y) {
        if (getTransitionProbability(this, grid, x, y)) {
            switch (this.state) {
                case UNCONSCIOUS:
                    this.state = INTEGRATION;
                    this.age = 0;
                    break;
                case INTEGRATION:
                    this.state = CONSCIOUS;
                    this.age = 0;
                    break;
                case CONSCIOUS:
                    if (Math.random() < 0.01) { // Random decay due to internal conflict
                        this.state = CONFLICT;
                        this.resolutionTime = RESOLUTION_TIME;
                    }
                    break;
                case CONFLICT:
                    this.resolutionTime--;
                    if (this.resolutionTime <= 0) {
                        this.state = RESOLUTION;
                    }
                    break;
                case RESOLUTION:
                    this.state = EMPTY;
                    break;
            }
        }
        this.age++;
    }

    spread(grid, x, y) {
        let spreadFactor = INFLUENCE_SPREAD_BASE + Math.floor(mentalEnergy / 20);
        let directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],
            [-1, -1], [-1, 1], [1, -1], [1, 1],
        ];
        for (let i = 0; i < spreadFactor; i++) {
            let direction = directions[Math.floor(Math.random() * directions.length)];
            let [dx, dy] = direction;
            let nx = (x + dx + gridSize) % gridSize;
            let ny = (y + dy + gridSize) % gridSize;
            if (grid[nx][ny].state === EMPTY) {
                grid[nx][ny] = new PsycheCell(UNCONSCIOUS, 0, 0, this.archetype);
            }
        }
    }
}

// Initialize the grid with PsycheCell objects
let grid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => new PsycheCell()));

// Initialize with some unconscious content representing different archetypes
const initialArchetypes = [
    { x: Math.floor(gridSize / 4), y: Math.floor(gridSize / 4), archetype: 'Animus' },
    { x: Math.floor(3 * gridSize / 4), y: Math.floor(3 * gridSize / 4), archetype: 'Anima' },
];

initialArchetypes.forEach(({ x, y, archetype }) => {
    grid[x][y] = new PsycheCell(UNCONSCIOUS, 0, 0, archetype);
});

// Function to update the grid based on psychological dynamics
function updateGrid(grid) {
    let newGrid = grid.map(row => row.map(cell => new PsycheCell(cell.state, cell.age, cell.resolutionTime, cell.archetype)));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            newGrid[x][y].update(newGrid, x, y);
            if (newGrid[x][y].state === CONSCIOUS) {
                newGrid[x][y].spread(newGrid, x, y);
            }
        }
    }

    return newGrid;
}

// Function to draw the grid on a canvas
function drawGrid(grid, ctx) {
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            switch (grid[x][y].state) {
                case EMPTY:
                    ctx.fillStyle = 'white';
                    break;
                case CONSCIOUS:
                    ctx.fillStyle = 'green';
                    break;
                case INTEGRATION:
                    ctx.fillStyle = 'blue';
                    break;
                case UNCONSCIOUS:
                    ctx.fillStyle = 'purple';
                    break;
                case CONFLICT:
                    ctx.fillStyle = 'red';
                    break;
                case RESOLUTION:
                    ctx.fillStyle = 'grey';
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
encoder.createReadStream().pipe(fs.createWriteStream('jungian-psyche-simulation.gif'));
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

        // Adjust mental energy dynamically (example: stress events)
        mentalEnergy = Math.max(0, Math.min(MAX_MENTAL_ENERGY, mentalEnergy + (Math.random() - 0.5) * 5));
    }
    encoder.finish();
    console.log('The GIF file was created.');
}

// Run the simulation
simulate(500);
