# Fungal Life Simulation

This project simulates fungal growth using a grid-based visualization and generates an animated GIF of the simulation.

## Project Files

- `fungalLife.js`: The main JavaScript file that contains the code for the fungal growth simulation.

## Setup Instructions

1. **Install Dependencies**: Ensure you have Node.js installed. Then, install the required npm packages:
    ```sh
    npm install canvas gifencoder
    ```

2. **Run the Simulation**: Execute the following command to run the simulation and generate the GIF:
    ```sh
    node fungalLife.js
    ```

## Code Overview

### Grid and Cell States

- The simulation uses a 200x200 grid.
- Each cell can be in one of the following states:
  - `EMPTY`: Represented by 0.
  - `HYPHAE`: Represented by 1.
  - `TIP`: Represented by 2.
  - `SPORE`: Represented by 3.

### Initial State

- The grid is initialized with one spore placed at the center of the grid.

### Update Rules

- Spores can turn into tips with a probability of 0.1.
- Tips grow into hyphae and can create new tips in one of the eight possible directions (including diagonals).
- Hyphae can randomly turn into spores with a probability of 0.01.

### Visualization

- The grid is visualized using the `canvas` library.
- Different cell states are represented by different colors:
  - `EMPTY`: White
  - `HYPHAE`: Green
  - `TIP`: Dark Green
  - `SPORE`: Brown

### GIF Creation

- The simulation is captured and saved as an animated GIF using the `gifencoder` library.
- The GIF is created with a delay of 100 ms between frames and a quality setting of 10.

### Main Simulation Loop

- The `simulate` function runs the simulation for 1000 iterations and generates the GIF.

## Output

- The output GIF file will be saved as `fungal-life.gif` in the project directory.

## Example Command

To run the simulation, use:
```sh
node fungalLife.js.js
```

## Notes

- Modify the grid size, cell size, and probabilities in the code as needed for different simulation behaviors.
- Ensure the required libraries are installed before running the script.
