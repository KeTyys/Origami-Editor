import * as backend from "../backend/backend.js"

const grid = document.querySelector('#grid')

function generateGrid() {
    backend.dom.clearChildren(grid)
    const gridType = backend.data.envVar.gridType

    grid.removeAttribute("clip-path")

    if (gridType === 'isometric') {
        generateIsometricGridlines()
    } else {
        generateSquareGridlines()
        if (backend.data.envVar.diagonalLines) {
            generateDiagonalGridlines()
        }
    }
    generateGridVertices(gridType)
}

function generateSquareGridlines() {
    let segment = backend.data.envVar.segment
    let height = backend.data.envVar.height
    let width = backend.data.envVar.width
    let interval = backend.helper.exact(height/segment)

    for (let i = interval; i < width; i += interval) {
        const lineElemY = backend.elements.line(i, 0, i, height, 'stroke:white;stroke-width:2')
        grid.append(lineElemY)
    }
    for (let i = interval; i < height; i += interval) {
        const lineElemX = backend.elements.line(0, i, width, i, 'stroke:white;stroke-width:2')
        grid.append(lineElemX)
    }
}

function generateDiagonalGridlines() {
    let interval = backend.helper.exact(backend.data.envVar.height / backend.data.envVar.segment);
    const width = backend.data.envVar.width;
    const height = backend.data.envVar.height;

    // Diagonal lines from top left to bottom right
    for (let i = -width; i <= width; i += interval) {
        const startX = Math.max(i, 0);               // Clamp the start X to be within grid
        const startY = Math.max(0, -i);              // Clamp the start Y to be within grid
        const endX = Math.min(width, i + height);    // Clamp the end X to be within grid
        const endY = Math.min(height, height - i);   // Clamp the end Y to be within grid

        // Draw line
        const lineElem = backend.elements.line(startX, startY, endX, endY, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElem);
    }
}

function generateIsometricGridlines() {
    const intervalType = backend.data.envVar.gridIntervalType || 'base';
    let interval = backend.helper.exact(backend.data.envVar.height / backend.data.envVar.segment);
    
    if (intervalType === 'height') {
        interval = interval * 2 / Math.sqrt(3);
    }

    const width = backend.data.envVar.width;
    const height = backend.data.envVar.height;
    const lineHeight = interval * Math.sqrt(3) / 2;
    const alignment = backend.data.envVar.gridAlignment;

    // Adjust starting position to center the grid and extend coverage
    // Scale the extension based on the segment size to handle larger intervals
    const extensionFactor = Math.max(6, Math.ceil(height / interval));
    const startX = -interval * extensionFactor;
    const endX = width + interval * extensionFactor;
    
    backend.dom.clearChildren(grid);

    // Set up transformation based on alignment
    let transform = '';
    switch(alignment) {
        case 'right':
            transform = `rotate(90) translate(0,-${width})`;
            break;
        case 'top':
            transform = `rotate(180) translate(-${width},-${height})`;
            break;
        case 'left':
            transform = `rotate(270) translate(-${height},0)`;
            break;
        case'bottom':
        default:
            transform = '';
            break;
    }

    // Apply transformation to grid
    if (transform) {
        grid.setAttribute('transform', transform);
    } else {
        grid.removeAttribute('transform');
    }

    // Generate down-right diagonal lines (/ direction)
    for (let x = startX; x <= endX; x += interval) {
        const startY = 0;
        const endX = x - height / Math.sqrt(3);
        const endY = height;
        const lineElem = backend.elements.line(x, startY, endX, endY, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElem);
    }

    // Generate up-right diagonal lines (\ direction)
    for (let x = startX; x <= endX; x += interval) {
        const startY = 0;
        const endX = x + height / Math.sqrt(3);
        const endY = height;
        const lineElem = backend.elements.line(x, startY, endX, endY, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElem);
    }

    for (let y = 0; y < height; y += lineHeight) {
        const lineElem = backend.elements.line(0, y, width, y, 'stroke:white;stroke-width:2');
        grid.appendChild(lineElem);
    }
}

function generateGridVertices(gridType) {
    let newGridVertices = [];
    let interval = backend.helper.exact(backend.data.envVar.height / backend.data.envVar.segment);
    const width = backend.data.envVar.width;
    const height = backend.data.envVar.height;
    
    if (gridType === 'isometric') {
        const alignment = backend.data.envVar.gridAlignment;
        const intervalType = backend.data.envVar.gridIntervalType || 'base';
        
        if (intervalType === 'height') {
            interval = interval * 2 / Math.sqrt(3);
        }
        
        const triangleHeight = interval * Math.sqrt(3) / 2;
        const extensionFactor = Math.ceil(width / interval) + 2;
        const extendedWidth = width + interval * extensionFactor;
        
        if (intervalType === 'height') {
            // Height-aligned vertices
            for (let y = height; y >= 0; y -= triangleHeight*2) {
                for (let x = 0; x <= width; x += interval) {
                    newGridVertices.push([x, y]);
                }
            }
            for (let y = height-triangleHeight; y >= 0; y -= triangleHeight*2) {
                for (let x = interval/2; x <= width; x += interval) {
                    if (x <= width) {
                        newGridVertices.push([x, y]);
                    }
                }
            }

            // Add boundary intersection vertices
            // Left boundary (x = 0)
            for (let x = -interval * extensionFactor; x <= extendedWidth; x += interval) {
                const intersectY = height - (x * Math.sqrt(3));  // Down-right line intersection
                if (intersectY >= 0 && intersectY <= height) {
                    newGridVertices.push([0, intersectY]);
                }
                const intersectY2 = x * Math.sqrt(3);  // Up-right line intersection
                if (intersectY2 >= 0 && intersectY2 <= height) {
                    newGridVertices.push([0, intersectY2]);
                }
            }

            // Right boundary (x = width)
            for (let x = -interval * extensionFactor; x <= extendedWidth; x += interval) {
                const intersectY = height - ((x - width) * Math.sqrt(3));  // Down-right line intersection
                if (intersectY >= 0 && intersectY <= height) {
                    newGridVertices.push([width, intersectY]);
                }
                const intersectY2 = (x - width) * Math.sqrt(3);  // Up-right line intersection
                if (intersectY2 >= 0 && intersectY2 <= height) {
                    newGridVertices.push([width, intersectY2]);
                }
            }

            // Add horizontal line boundary vertices
            for (let y = 0; y <= height; y += triangleHeight) {
                newGridVertices.push([0, y]);
                newGridVertices.push([width, y]);
            }
        } else {
            // Base-aligned vertices 
            for (let y = height; y >= 0; y -= triangleHeight*2) {
                for (let x = 0; x <= width; x += interval) {
                    newGridVertices.push([x, y]);
                }
            }
            for (let y = height-triangleHeight; y >= 0; y -= triangleHeight*2) {
                for (let x = interval/2; x <= width; x += interval) {
                    newGridVertices.push([x, y]);
                }
            }
            for (let y = height-triangleHeight; y >= 0; y -= triangleHeight*2) {
                newGridVertices.push([0, y]);
                newGridVertices.push([width, y]);
            }
        }

        // Transform vertices based on alignment
        switch(alignment) {
            case 'left':
                newGridVertices = newGridVertices.map(([x, y]) => [y, width - x]);
                break;
            case 'top':
                newGridVertices = newGridVertices.map(([x, y]) => [width - x, height - y]);
                break;
            case 'right':
                newGridVertices = newGridVertices.map(([x, y]) => [height - y, x]);
                break;
            case 'bottom':
            default:
                // No transformation needed
                break;
        }
    } else {
        // Square grid vertices
        for (let i = 0; i <= width; i += interval) {
            for (let j = 0; j <= height; j += interval) {
                newGridVertices.push([i, j]);
            }
        }
    }
    
    backend.data.envVar.gridVertices = newGridVertices;
}

function toggleGrid() {
    let gridOn = backend.data.envVar.gridlines
    backend.dom.toggleElemDisplay(grid, gridOn, 'block')
}

document.getElementById('gridAlignment').addEventListener('change', (e) => {
    backend.data.envVar.gridAlignment = e.target.value;
    generateGrid();
});

document.getElementById('gridIntervalType').addEventListener('change', (e) => {
    backend.data.envVar.gridIntervalType = e.target.value;
    generateGrid();
});

export { generateGrid, toggleGrid}