const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');
const fs = require('fs');

// Define the grid size and cell size for visualization
const gridSize = 200;
const cellSize = 4;

// Define cell states and their subcategories
const EMPTY = 0;
const CONSCIOUS_AWARE = 1;
const CONSCIOUS_RATIONALIZED = 2;
const SHADOW_REPRESSED = 3;
const SHADOW_LATENT = 4;
const POTENTIAL_CONFLICT = 5;
const CONFLICT = 6;
const INTEGRATED = 7;
const SUBDUED = 8;

// Define colors for visualization
const colors = {
  [EMPTY]: 'white',
  [CONSCIOUS_AWARE]: 'blue',
  [CONSCIOUS_RATIONALIZED]: 'lightblue',
  [SHADOW_REPRESSED]: 'darkpurple',
  [SHADOW_LATENT]: 'purple',
  [POTENTIAL_CONFLICT]: 'orange',
  [CONFLICT]: 'red',
  [INTEGRATED]: 'green',
  [SUBDUED]: 'grey'
};

// Define state transition probabilities and dynamics
const SHADOW_TO_POTENTIAL_CONFLICT_PROBABILITY = 0.1;
const POTENTIAL_CONFLICT_TO_CONFLICT_PROBABILITY = 0.2;
const CONFLICT_TO_INTEGRATED_PROBABILITY = 0.15;
const CONFLICT_TO_SUBDUED_PROBABILITY = 0.05;
const CONSCIOUS_INTROSPECTION_PROBABILITY = 0.05; // Chance for introspection
const INFLUENCE_SPREAD_PROBABILITY = 0.3; // Chance of influencing neighboring cells

// Emotional intensity levels affecting transitions
let emotionalIntensity = 50; // Starts at a neutral level
const MAX_EMOTIONAL_INTENSITY = 100;

// Archetypes influencing cells
const ARCHETYPE_ANIMUS = 1;
const ARCHETYPE_ANIMA = 2;
const ARCHETYPE_PERSONA = 3;

// Archetype effects mapping
const archetypeEffects = {
  [ARCHETYPE_ANIMUS]: { affectConscious: 0.1, affectShadow: 0.2 },
  [ARCHETYPE_ANIMA]: { affectConscious: 0.2, affectShadow: 0.1 },
  [ARCHETYPE_PERSONA]: { affectConscious: 0.3, affectShadow: 0.1 }
};

// Cell class representing the psychological states
class PsycheCell {
  constructor(state = EMPTY, archetype = null) {
    this.state = state;
    this.archetype = archetype; // Representing influence by a specific archetype
    this.emotionalState = Math.random() * MAX_EMOTIONAL_INTENSITY; // Initialize with random emotional intensity
    this.history = []; // Stores previous states for historical context
  }

  update(grid, x, y) {
    let neighbors = this.countNeighbors(grid, x, y);
    let archetypeEffect = this.archetype ? archetypeEffects[this.archetype] : { affectConscious: 0, affectShadow: 0 };
    
    // Record the current state in history
    this.history.push(this.state);

    // Influence neighboring cells based on state
    if (Math.random() < INFLUENCE_SPREAD_PROBABILITY) {
      this.spreadInfluence(grid, x, y);
    }

    // Adjust emotional state based on local context
    this.adjustEmotionalState(neighbors);

    // State transitions based on internal and external factors
    switch (this.state) {
      case SHADOW_REPRESSED:
        if (Math.random() < SHADOW_TO_POTENTIAL_CONFLICT_PROBABILITY + emotionalIntensity / MAX_EMOTIONAL_INTENSITY * 0.05 + archetypeEffect.affectShadow) {
          this.state = POTENTIAL_CONFLICT;
        }
        break;
      case SHADOW_LATENT:
        if (Math.random() < SHADOW_TO_POTENTIAL_CONFLICT_PROBABILITY + emotionalIntensity / MAX_EMOTIONAL_INTENSITY * 0.1 + archetypeEffect.affectShadow) {
          this.state = POTENTIAL_CONFLICT;
        }
        break;
      case POTENTIAL_CONFLICT:
        if (Math.random() < POTENTIAL_CONFLICT_TO_CONFLICT_PROBABILITY + neighbors[CONFLICT] * 0.05) {
          this.state = CONFLICT;
        }
        break;
      case CONFLICT:
        if (Math.random() < CONFLICT_TO_INTEGRATED_PROBABILITY + neighbors[INTEGRATED] * 0.1 + archetypeEffect.affectConscious) {
          this.state = INTEGRATED;
        } else if (Math.random() < CONFLICT_TO_SUBDUED_PROBABILITY + neighbors[SUBDUED] * 0.1) {
          this.state = SUBDUED;
        }
        break;
      case INTEGRATED:
        // Cells remain integrated once this state is achieved
        break;
      case SUBDUED:
        // Subdued state represents temporary suppression
        break;
      case CONSCIOUS_AWARE:
      case CONSCIOUS_RATIONALIZED:
        if (Math.random() < CONSCIOUS_INTROSPECTION_PROBABILITY) {
          this.introspection(grid, x, y);
        }
        break;
    }
  }

  introspection(grid, x, y) {
    // Introspection can lead to discovering shadow aspects or re-evaluating states
    let neighbors = this.countNeighbors(grid, x, y);
    if (neighbors[SHADOW_REPRESSED] > 0 || neighbors[SHADOW_LATENT] > 0) {
      // Increase probability of conflict or integration
      if (Math.random() < 0.3) {
        this.state = POTENTIAL_CONFLICT; // Discovering repressed content
      } else if (Math.random() < 0.2) {
        this.state = INTEGRATED; // Successful integration of shadow content
      }
    } else {
      // Re-evaluate conscious state
      if (this.state === CONSCIOUS_RATIONALIZED && Math.random() < 0.3) {
        this.state = CONSCIOUS_AWARE; // Becoming more self-aware
      } else if (this.state === CONSCIOUS_AWARE && Math.random() < 0.2) {
        this.state = CONSCIOUS_RATIONALIZED; // Rationalizing or suppressing emotions
      }
    }
  }

  spreadInfluence(grid, x, y) {
    // Spread influence to neighboring cells based on current state and emotional intensity
    let directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    directions.forEach(([dx, dy]) => {
      let nx = (x + dx + gridSize) % gridSize;
      let ny = (y + dy + gridSize) % gridSize;
      let neighborCell = grid[nx][ny];

      if (this.state === CONSCIOUS_AWARE || this.state === CONSCIOUS_RATIONALIZED) {
        // Conscious cells can influence shadow cells to become aware or rationalized
        if (neighborCell.state === SHADOW_REPRESSED || neighborCell.state === SHADOW_LATENT) {
          if (Math.random() < this.emotionalState / MAX_EMOTIONAL_INTENSITY) {
            neighborCell.state = POTENTIAL_CONFLICT; // Expose hidden conflicts
          }
        }
      } else if (this.state === CONFLICT) {
        // Conflict cells can spread conflict to nearby latent or repressed shadow cells
        if (neighborCell.state === SHADOW_REPRESSED || neighborCell.state === SHADOW_LATENT) {
          if (Math.random() < 0.1) {
            neighborCell.state = POTENTIAL_CONFLICT;
          }
        }
      }
    });
  }

  adjustEmotionalState(neighbors) {
    // Increase emotional intensity if surrounded by conflicting states
    if (neighbors[CONFLICT] > 0 || neighbors[POTENTIAL_CONFLICT] > 0) {
      this.emotionalState = Math.min(MAX_EMOTIONAL_INTENSITY, this.emotionalState + 5);
    } else {
      this.emotionalState = Math.max(0, this.emotionalState - 1);
    }
  }

  countNeighbors(grid, x, y) {
    let counts = Array(9).fill(0); // One count for each state
    let directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    directions.forEach(([dx, dy]) => {
      let nx = (x + dx + gridSize) % gridSize;
      let ny = (y + dy + gridSize) % gridSize;
      counts[grid[nx][ny].state]++;
    });

    return counts;
  }
}

// Initialize the grid with PsycheCell objects
let grid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => new PsycheCell()));

// Initial seeding with conscious and shadow regions, with archetypal influence
for (let x = 0; x < gridSize; x++) {
  for (let y = 0; y < gridSize; y++) {
    if (x < gridSize / 2) {
      let archetype = Math.random() < 0.1 ? ARCHETYPE_PERSONA : null;
      grid[x][y] = new PsycheCell(Math.random() < 0.5 ? CONSCIOUS_AWARE : CONSCIOUS_RATIONALIZED, archetype);
    } else {
      let archetype = Math.random() < 0.1 ? (Math.random() < 0.5 ? ARCHETYPE_ANIMUS : ARCHETYPE_ANIMA) : null;
      grid[x][y] = new PsycheCell(Math.random() < 0.5 ? SHADOW_REPRESSED : SHADOW_LATENT, archetype);
    }
  }
}

// Function to update the grid based on state transitions
function updateGrid(grid) {
  let newGrid = grid.map(row => row.map(cell => new PsycheCell(cell.state, cell.archetype)));

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      newGrid[x][y].update(grid, x, y);
    }
  }

  return newGrid;
}

// Function to draw the grid on a canvas
function drawGrid(grid, ctx) {
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      ctx.fillStyle = colors[grid[x][y].state];
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

// Create a canvas and context
const canvas = createCanvas(gridSize * cellSize, gridSize * cellSize);
const ctx = canvas.getContext('2d');

// Create a GIF encoder
const encoder = new GIFEncoder(gridSize * cellSize, gridSize * cellSize);
encoder.createReadStream().pipe(fs.createWriteStream('mind-shadow-conflict-enhanced.gif'));
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

    // Adjust emotional intensity dynamically (example: events increasing tension)
    emotionalIntensity = Math.max(0, Math.min(MAX_EMOTIONAL_INTENSITY, emotionalIntensity + (Math.random() - 0.5) * 5));
  }
  encoder.finish();
  console.log('The GIF file was created.');
}

// Run the simulation
simulate(500);
