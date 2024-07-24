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

// Initialize the grid
let grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(EMPTY));

// Initialize with some spores
const initialSpores = [
    [Math.floor(gridSize / 2), Math.floor(gridSize / 2)],
];

initialSpores.forEach(([x, y]) => {
    grid[x][y] = SPORE;
});

// Function to update the grid based on fungal growth rules
function updateGrid(grid) {
    let newGrid = grid.map(arr => arr.slice());

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            if (grid[x][y] === SPORE) {
                if (Math.random() < 0.1) {
                    newGrid[x][y] = TIP;
                }
            } else if (grid[x][y] === TIP) {
                newGrid[x][y] = HYPHAE;
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
                }
            } else if (grid[x][y] === HYPHAE) {
                if (Math.random() < 0.01) {
                    newGrid[x][y] = SPORE;
                }
            }
        }
    }

    return newGrid;
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
encoder.createReadStream().pipe(fs.createWriteStream('fungal-life.gif'));
encoder.start();
encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
encoder.setDelay(100); // frame delay in ms
encoder.setQuality(10); // image quality. 10 is default

// Main simulation loop
function simulate(iterations) {
    for (let i = 0; i < iterations; i++) {
        console.log('Current Cycle, ', i);
        grid = updateGrid(grid);
        drawGrid(grid, ctx);
        encoder.addFrame(ctx);
    }
    encoder.finish();
    console.log('The GIF file was created.');
}

// Run the simulation
simulate(4000);
