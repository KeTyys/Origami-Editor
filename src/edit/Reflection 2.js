import * as backend from "../backend/backend.js"

function reflectPoint(x, y, sourceQuadrant, targetQuadrant) {
    if (sourceQuadrant === targetQuadrant) {
        return { x: x * 600, y: y * 600 }
    }

    let scaledX = x * 600
    let scaledY = y * 600
    let reflectedX = scaledX
    let reflectedY = scaledY

    switch (`${sourceQuadrant}->${targetQuadrant}`) {
        case "1->2":
            reflectedX = 600 - scaledX
            break
        case "1->3":
            reflectedX = 600 - scaledX
            reflectedY = 600 - scaledY
            break
        case "1->4":
            reflectedY = 600 - scaledY
            break
        case "2->1":
            reflectedX = 600 - scaledX
            break
        case "2->3":
            reflectedY = 600 - scaledY
            break
        case "2->4":
            reflectedX = 600 - scaledX
            reflectedY = 600 - scaledY
            break
        case "3->1":
            reflectedX = 600 - scaledX
            reflectedY = 600 - scaledY
            break
        case "3->2":
            reflectedY = 600 - scaledY
            break
        case "3->4":
            reflectedX = 600 - scaledX
            break
        case "4->1":
            reflectedY = 600 - scaledY
            break
        case "4->2":
            reflectedX = 600 - scaledX
            reflectedY = 600 - scaledY
            break
        case "4->3":
            reflectedX = 600 - scaledX
            break
    }

    return { x: reflectedX, y: reflectedY }
}

function isInQuadrant(x, y, quadrant) {
    const centerX = 0.5;  // Center point is at 0.5, 0.5 in normalized coordinates
    const centerY = 0.5;
    
    switch(quadrant) {
        case 1: return x >= centerX && y >= centerY;
        case 2: return x <= centerX && y >= centerY;
        case 3: return x <= centerX && y <= centerY;
        case 4: return x >= centerX && y <= centerY;
        default: return false;
    }
}

export function reflectAndDrawElements(sourceQuadrant, targetQuadrant) {
    if (![1, 2, 3, 4].includes(sourceQuadrant) || 
        ![1, 2, 3, 4].includes(targetQuadrant) || 
        sourceQuadrant === targetQuadrant) {
        return;
    }

    const newVertices = {};
    const newEdges = {};
    const newAssignments = {};

    for (let lineId of Object.keys(backend.data.edgeObj)) {
        const lineCoords = backend.data.edgeObj[lineId];
        const startVertex = backend.data.vertexObj[lineCoords[0]];
        const endVertex = backend.data.vertexObj[lineCoords[1]];

        // Only reflect if at least one vertex is in the source quadrant
        if (!isInQuadrant(startVertex[0], startVertex[1], sourceQuadrant) && 
            !isInQuadrant(endVertex[0], endVertex[1], sourceQuadrant)) {
            continue;
        }

        const start = reflectPoint(startVertex[0], startVertex[1], sourceQuadrant, targetQuadrant);
        const end = reflectPoint(endVertex[0], endVertex[1], sourceQuadrant, targetQuadrant);

        const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newStartVertexId = `${lineId}_start_reflected_${uniqueSuffix}`;
        const newEndVertexId = `${lineId}_end_reflected_${uniqueSuffix}`;
        const newLineId = `${lineId}_reflected_${uniqueSuffix}`;

        newVertices[newStartVertexId] = [start.x / 600, start.y / 600];
        newVertices[newEndVertexId] = [end.x / 600, end.y / 600];
        newEdges[newLineId] = [newStartVertexId, newEndVertexId];
        newAssignments[newLineId] = backend.data.assignObj[lineId];
    }

    // Update data objects
    Object.assign(backend.data.vertexObj, newVertices);
    Object.assign(backend.data.edgeObj, newEdges);
    Object.assign(backend.data.assignObj, newAssignments);

    // Redraw pattern
    backend.draw.drawPattern();
    backend.history.overwriteHistory();
} 