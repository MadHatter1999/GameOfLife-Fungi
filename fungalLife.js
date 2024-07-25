const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');
const fs = require('fs');

// Define the grid size and cell size for visualization
const gridSize = 200;
const cellSize = 4;

// Define cell states
const EMPTY = 0;
const HYPHAE = 1;
const TIP = 2;
const SPORE = 3;
const DEAD = 4;
const DECAYING = 5;

// Define decay time for dead cells
const DECAY_TIME = 50;

// Initialize the grid, age tracker, and decay tracker
let grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(EMPTY));
let age = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
let decayTime = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

// Initialize with some spores
const initialSpores = [
    [Math.floor(gridSize / 2), Math.floor(gridSize / 2)],
];

initialSpores.forEach(([x, y]) => {
    grid[x][y] = SPORE;
});

// Function to count neighboring hyphae
function countNeighbors(grid, x, y) {
    let directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0],
        [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];
    return directions.reduce((count, [dx, dy]) => {
        let nx = (x + dx + gridSize) % gridSize;
        let ny = (y + dy + gridSize) % gridSize;
        return count + (grid[nx][ny] === HYPHAE ? 1 : 0);
    }, 0);
}

// Function to update the grid based on fungal growth and decay rules
function updateGrid(grid, age, decayTime) {
    let newGrid = grid.map(arr => arr.slice());
    let newAge = age.map(arr => arr.slice());
    let newDecayTime = decayTime.map(arr => arr.slice());

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            if (grid[x][y] === SPORE) {
                if (Math.random() < 0.1) {
                    newGrid[x][y] = TIP;
                    newAge[x][y] = 0;
                }
            } else if (grid[x][y] === TIP) {
                newGrid[x][y] = HYPHAE;
                newAge[x][y]++;
                let directions = [
                    [0, 1], [1, 0], [0, -1], [-1, 0],
                    [-1, -1], [-1, 1], [1, -1], [1, 1],
                ];
                let direction = directions[Math.floor(Math.random() * directions.length)];
                let [dx, dy] = direction;
                let nx = (x + dx + gridSize) % gridSize;
                let ny = (y + dy + gridSize) % gridSize;
                if (newGrid[nx][ny] === EMPTY) {
                    newGrid[nx][ny] = TIP;
                    newAge[nx][ny] = 0;
                }
            } else if (grid[x][y] === HYPHAE) {
                newAge[x][y]++;
                if (Math.random() < 0.01 || newAge[x][y] > 100 || countNeighbors(grid, x, y) > 4) {
                    newGrid[x][y] = DECAYING;
                    newDecayTime[x][y] = DECAY_TIME;
                } else if (Math.random() < 0.01) {
                    newGrid[x][y] = SPORE;
                    newAge[x][y] = 0;
                }
            } else if (grid[x][y] === DECAYING) {
                newDecayTime[x][y]--;
                if (newDecayTime[x][y] <= 0) {
                    newGrid[x][y] = EMPTY;
                    newAge[x][y] = 0;
                    newDecayTime[x][y] = 0;
                }
            }
        }
    }

    return [newGrid, newAge, newDecayTime];
}

// Function to draw the grid on a canvas
function drawGrid(grid, ctx) {
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            if (grid[x][y] === EMPTY) {
                ctx.fillStyle = 'white';
            } else if (grid[x][y] === HYPHAE) {
                ctx.fillStyle = 'green';
            } else if (grid[x][y] === TIP) {
                ctx.fillStyle = 'darkgreen';
            } else if (grid[x][y] === SPORE) {
                ctx.fillStyle = 'brown';
            } else if (grid[x][y] === DEAD) {
                ctx.fillStyle = 'black';
            } else if (grid[x][y] === DECAYING) {
                ctx.fillStyle = 'grey';
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
encoder.createReadStream().pipe(fs.createWriteStream('fungal-life-with-decay-time.gif'));
encoder.start();
encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
encoder.setDelay(100); // frame delay in ms
encoder.setQuality(10); // image quality. 10 is default

// Main simulation loop
function simulate(iterations) {
    for (let i = 0; i < iterations; i++) {
        console.log('Current Cycle, ', i);
        [grid, age, decayTime] = updateGrid(grid, age, decayTime);
        drawGrid(grid, ctx);
        encoder.addFrame(ctx);
    }
    encoder.finish();
    console.log('The GIF file was created.');
}

// Run the simulation
simulate(500);
