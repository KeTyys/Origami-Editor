import { line } from "./Line.js";
import { envVar } from "./index.js";
import { clearChildren } from "./helper.js";

function generateGrid() {
    const grid = document.querySelector('#grid');
    grid.setAttribute('clip-path', 'url(#gridClip)');
    let segment = envVar.segment;
    let height = envVar.height;
    let width = envVar.width;
    let interval = Math.ceil(height / segment);
    clearChildren(grid);

    const gridType = envVar.gridType; // Get selected grid type

    if (gridType === 'triangular') {
        generateTriangularGridlines();
    } else if (gridType === 'isometric') {
        generateIsometricGridlines();
    } else {
        generateSquareGridlines();
        if (envVar.diagonalLines) { // Checks if diagonal lines should be added
            generateDiagonalGridlines();
        }
    }
    generateGridVertices(gridType);
}





function generateSquareGridlines() {
    const grid = document.querySelector('#grid');
    let interval = Math.ceil(envVar.height / envVar.segment);

    // Vertical lines
    for (let i = interval; i < envVar.width; i += interval) {
        const lineElemY = line(i, 0, i, envVar.height, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElemY);
    }

    // Horizontal lines
    for (let i = interval; i < envVar.height; i += interval) {
        const lineElemX = line(0, i, envVar.width, i, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElemX);
    }
}

function generateTriangularGridlines() {
    const grid = document.querySelector('#grid');
    let interval = Math.ceil(envVar.height / envVar.segment);
    const width = envVar.width;
    const height = envVar.height;

    clearChildren(grid); // Clear any existing grid lines

    // Diagonal lines from top-left to bottom-right (\)
    for (let i = -width; i <= width; i += interval) {
        const startX = Math.max(i, 0);
        const startY = Math.max(-i, 0);
        const endX = Math.min(width, i + height);
        const endY = Math.min(height, height - i);
        const lineElem = line(startX, startY, endX, endY, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElem);
    }

    // Diagonal lines from top-right to bottom-left(/)
    for (let i = 0; i <= width + height; i += interval) {
        const startX = Math.min(i, width);
        const startY = Math.max(0, i - width);
        const endX = Math.max(0, i - height);
        const endY = Math.min(height, i);
        const lineElem = line(startX, startY, endX, endY, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElem);
    }
    /*
    // Vertical lines at every half interval
    for (let i = 0; i <= width; i += interval / 2) {
        const lineElemY = line(i, 0, i, height, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElemY);
    }
        */
}



function generateDiagonalGridlines() {
    const grid = document.querySelector('#grid');
    let interval = Math.ceil(envVar.height / envVar.segment);
    const width = envVar.width;
    const height = envVar.height;

    // Diagonal lines from top left to bottom right
    for (let i = -width; i <= width; i += interval) {
        const startX = Math.max(i, 0);               // Clamp the start X to be within grid
        const startY = Math.max(0, -i);              // Clamp the start Y to be within grid
        const endX = Math.min(width, i + height);    // Clamp the end X to be within grid
        const endY = Math.min(height, height - i);   // Clamp the end Y to be within grid

        // Draw line
        const lineElem = line(startX, startY, endX, endY, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElem);
    }
}



function generateGridVertices(gridType) {
    let newGridVertices = [];
    let interval = Math.ceil(envVar.height / envVar.segment);
    const width = envVar.width;
    const height = envVar.height;
    const triangleHeight = interval * Math.sqrt(3) / 2; // Height of the equilateral triangle

    if (gridType === 'triangular') {
        // Generate vertices for a full triangular grid
        for (let y = 0; y <= envVar.height; y += interval) {
            for (let x = 0; x <= envVar.width; x += interval) {
                // Add the main grid point
                newGridVertices.push([x, y]);

                // Add the offset grid point to form the triangle
                if ((y / interval) % 2 === 0) {
                    newGridVertices.push([x + interval / 2, y + interval / 2]);
                }
            }
        }

        // Handle the edge case for the rightmost points to cover the grid fully
        for (let y = interval / 2; y <= envVar.height; y += interval) {
            for (let x = interval / 2; x <= envVar.width; x += interval) {
                if ((y / interval) % 2 !== 0) {
                    newGridVertices.push([x, y]);
                }
            }
        }
    } 
    else if (gridType === 'isometric') {
        // Iterate through rows
        for (let y = height; y >=0; y -= triangleHeight*2) {
            for (let x = 0; x <= width; x += interval) {
                newGridVertices.push([x, y]);
            }
        }
        for (let y = height-triangleHeight; y >=0; y -= triangleHeight*2) {
            for (let x = interval/2; x <= width; x += interval) {
                newGridVertices.push([x, y]);
            }
        }
    }
    else {
        // Vertices for square grid
        for (let i = 0; i <= envVar.width; i += interval) {
            for (let j = 0; j <= envVar.height; j += interval) {
                newGridVertices.push([i, j]);
            }
        }
    }

    envVar.gridVertices = newGridVertices;
}

function generateIsometricGridlines() {
    const grid = document.querySelector('#grid');
    const interval = Math.ceil(envVar.height / envVar.segment);
    const width = envVar.width;
    const height = envVar.height;
    const lineHeight = interval * Math.sqrt(3) / 2; // Equilateral triangle height

    clearChildren(grid);

    // Diagonal lines slanting down-right (/ direction)
    for (let i =-width; i <= width + height; i += interval) {
        const startX = i;
        const startY = 0;
        const endX = i - height / Math.sqrt(3);
        const endY = height;
        const lineElem = line(startX, startY, endX, endY, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElem);
    }

    // Diagonal lines slanting up-right (\ direction)
    for (let i = -width; i <= width + height; i += interval) {
        const startX = i;
        const startY = 0;
        const endX = i + height / Math.sqrt(3);
        const endY = height;
        const lineElem = line(startX, startY, endX, endY, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElem);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += lineHeight) {
        const lineElem = line(0, y, width, y, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElem);
    }
}


function toggleGrid() {
    let gridOn = envVar.gridlines;
    const grid = document.querySelector("#grid");
    if (gridOn) {
        grid.style.display = "block";
    } else {
        grid.style.display = "none";
    }
}

export { generateGrid, toggleGrid };