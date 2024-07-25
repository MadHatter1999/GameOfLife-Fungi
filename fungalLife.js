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
                if (Math.random() < 0.1) {
                    this.state = TIP;
                    this.age = 0;
                }
                break;
            case TIP:
                this.state = HYPHAE;
                this.age++;
                this.spread(grid, x, y);
                break;
            case HYPHAE:
                this.age++;
                if (Math.random() < 0.005 || this.age > 120 || this.countNeighbors(grid, x, y) > 4) {
                    this.state = DECAYING;
                    this.decayTime = DECAY_TIME;
                } else if (Math.random() < 0.005) {
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

    spread(grid, x, y) {
        let directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],
            [-1, -1], [-1, 1], [1, -1], [1, 1],
        ];
        let direction = directions[Math.floor(Math.random() * directions.length)];
        let [dx, dy] = direction;
        let nx = (x + dx + gridSize) % gridSize;
        let ny = (y + dy + gridSize) % gridSize;
        if (grid[nx][ny].state === EMPTY) {
            grid[nx][ny] = new FungusCell(TIP, 0, 0, this.strain);
        }
    }

    countNeighbors(grid, x, y) {
        let directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],
            [-1, -1], [-1, 1], [1, -1], [1, 1],
        ];
        return directions.reduce((count, [dx, dy]) => {
            let nx = (x + dx + gridSize) % gridSize;
            let ny = (y + dy + gridSize) % gridSize;
            return count + (grid[nx][ny].state === HYPHAE ? 1 : 0);
        }, 0);
    }
}

// Initialize the grid with FungusCell objects
let grid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => new FungusCell()));

// Initialize with some spores for two strains
const initialSpores = [
    { x: Math.floor(gridSize / 4), y: Math.floor(gridSize / 4), strain: 'Penicillium' },
    { x: Math.floor(3 * gridSize / 4), y: Math.floor(3 * gridSize / 4), strain: 'Aspergillus' },
];

initialSpores.forEach(({ x, y, strain }) => {
    grid[x][y] = new FungusCell(SPORE, 0, 0, strain);
});

// Function to update the grid based on fungal growth and decay rules
function updateGrid(grid) {
    let newGrid = grid.map(row => row.map(cell => new FungusCell(cell.state, cell.age, cell.decayTime, cell.strain)));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            newGrid[x][y].update(newGrid, x, y);
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
}

// Create a canvas and context
const canvas = createCanvas(gridSize * cellSize, gridSize * cellSize);
const ctx = canvas.getContext('2d');

// Create a GIF encoder
const encoder = new GIFEncoder(gridSize * cellSize, gridSize * cellSize);
encoder.createReadStream().pipe(fs.createWriteStream('fungal-life-competing-strains.gif'));
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
