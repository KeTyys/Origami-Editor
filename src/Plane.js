import { vertexObj, edgeObj, assignObj, envVar} from "./index.js"
import { line } from "./Line.js"
import { generateId, exists, inArray, getCoordId, getKey, parseLength, exact, clearChildren, removeListeners,  dot, minus, clamp, times, plus, grad, grad2, midPoint, within, ontop, closest, distTo, onLine, intersect, equalVal, equalCoords, equalLine, lineGrad, acrossPts, bisectPts, bisectAngle, cutLine, bisectLines, cutPoint } from "./helper.js"
import { circle } from "./Circle.js"
import { backHistory, forwardHistory, initialiseHistory, overwriteHistory, retrieveHistory } from "./History.js"

let toolCleanupFunc

function generatePlane() {
    if (!retrieveHistory()) {
        setBorder()
        initialiseHistory()
    }
    drawPattern()

}

function setBorder() {
    const width = envVar.width
    const height = envVar.height
    let borderLines = [
        [[0, 0], [width, 0]],
        [[0, 0], [0, height]],
        [[width, 0], [width, height]],
        [[0,height],[width,height]]
    ]
    for (let line of borderLines) {
        addLine(line[0],line[1], 'B')
    }
}

function trackCoords() {
    const screen = document.querySelector('#screen')
    const pointerDisplay = document.querySelector('#pointerDisplay')
    const pointerX = pointerDisplay.querySelector('#pointerX')
    const pointerY = pointerDisplay.querySelector('#pointerY')
    const pointer = document.querySelector('#pointer')

    if (envVar.activeTool == 'draw') {
        screen.addEventListener('mousemove', e=>trackPointer(e))
    } else {
        screen.addEventListener('mousemove', e=>trackMouse(e))
    }
    screen.addEventListener('mouseenter',e=>showDisplay(e))
    screen.addEventListener('mouseout', e=>hideDisplay(e))

    function trackMouse(e) {
        e.preventDefault()
        let pointerPosition = getPointFromEvent(e)
        let x = Math.round(pointerPosition.x * 100)/100
        let y = Math.round((envVar.height - pointerPosition.y) * 100)/100
        pointerX.innerHTML = `x: ${x}`
        pointerY.innerHTML = `y: ${y}`
    }

    function trackPointer(e) {
        e.preventDefault()
        let pointerCoord = getElemCoord(pointer)
        let x = Math.round(pointerCoord[0] * 100)/100
        let y = Math.round(pointerCoord[1] * 100)/100
        pointerX.innerHTML = `x: ${x}`
        pointerY.innerHTML = `y: ${y}`
    }

    function showDisplay(e) {
        e.preventDefault()
        pointerDisplay.style.display = 'flex'
    }

    function hideDisplay(e) {
        e.preventDefault()
        pointerDisplay.style.display = 'none'
    }
 }

 // get pointer coordinates from mouse event
 function getPointFromEvent(event) {
    const svg = document.querySelector('svg')
    let point = new DOMPoint()
    point.x = event.clientX
    point.y = event.clientY
    var invertedSVGMatrix = svg.getScreenCTM().inverse()
    return point.matrixTransform(invertedSVGMatrix)
}

function enableShortcuts() {
    const svg = document.querySelector('svg')
    let spaceDown = false
    let ctrlDown = false
    let cursorCoord
    

    window.addEventListener('keydown', function(e) {
        if (e.repeat) {
            return
        }
        switch(e.code) {
            case 'Space':
                spaceDown = true
                svg.style.cursor = 'move'
                disableActiveTool()
                break
            case 'ControlLeft' || 'ControlRight':
                ctrlDown = true
                break
            case 'KeyY':
                if (ctrlDown) {
                    handleRedo(e)
                }
                break
            case 'KeyZ':
                if (ctrlDown) {
                    handleUndo(e)
                }
            case 'Escape':
                resetScreen()
        }  
    })
    window.addEventListener('keyup', function(e) {
        switch(e.code) {
            case 'Space':
                spaceDown = false
                svg.style.cursor = 'default'
                svg.dispatchEvent(new Event('spaceclickup'))
                resetActiveTool()
                trackCoords()
                break
            case 'ControlLeft' || 'ControlRight':
                ctrlDown = false
                break
        }
    })
    svg.addEventListener('mousedown', function (e1) {
        let e2 = new Event('spaceclickdown')
        e2.clientX = e1.clientX
        e2.clientY = e1.clientY
        if (e1.button === 0 && spaceDown) {
            svg.dispatchEvent(e2)
        } else if (e1.button === 1) {
            svg.dispatchEvent(e2)
            svg.style.cursor = 'move'
        }
    })
    svg.addEventListener('mouseup', function (e1) {
        let e2 = new Event('spaceclickup')
        e2.clientX = e1.clientX
        e2.clientY = e1.clientY
        if (e1.button === 0 && spaceDown) {
            svg.dispatchEvent(e2)
        } else if (e1.button === 1) {
            svg.dispatchEvent(e2)
            svg.style.cursor = 'default'
        }
    })
    
    svg.addEventListener('spaceclickdown', onPointerDown) // Pressing the mouse
    svg.addEventListener('spaceclickup', onPointerUp) // Releasing the mouse
    svg.addEventListener('mouseleave', onPointerUp) // Mouse gets out of the SVG area
    svg.addEventListener('mousemove', onPointerMove) // Mouse is moving
    svg.addEventListener('wheel', onScroll)

    svg.addEventListener('pointerdown', onTouchDown)
    svg.addEventListener('pointermove', onTouchMove)
    svg.addEventListener('pointerup', onTouchUp)
    svg.addEventListener('pointercancel', onTouchUp)
    svg.addEventListener('pointerout', onTouchUp)
    svg.addEventListener('pointerleave', onTouchUp)

    
    let isPointerDown = false
    let pointerOrigin
    let defaultViewBox = envVar.defaultViewBox
    let viewBox = svg.viewBox.baseVal
    let scale = 0

    function onPointerDown(e) {
        isPointerDown = true
        pointerOrigin = getPointFromEvent(e)
    }
    function onPointerUp() {
        isPointerDown = false
      }

    function onPointerMove (e) {
        e.preventDefault();

        cursorCoord = getPointFromEvent(e)
        if (isPointerDown) {
            viewBox.x -= (cursorCoord.x - pointerOrigin.x)
            viewBox.y -= (cursorCoord.y - pointerOrigin.y)
        }
      }

    function onScroll(e) {
        e.preventDefault()

        // restrict scale
        scale += e.deltaY * -0.001
        scale = Math.min(Math.max(-2, scale), 1)

        // scale width and height
        let newWidth = defaultViewBox.width - envVar.width * scale
        let newHeight = defaultViewBox.height - envVar.height * scale

        // adjust viewbox
        viewBox.width = newWidth
        viewBox.height = newHeight
        viewBox.x = cursorCoord.x - e.offsetX * envVar.width / svg.children[0].getBoundingClientRect().width
        viewBox.y = cursorCoord.y - e.offsetY * envVar.height / svg.children[0].getBoundingClientRect().height
    }
    
    function handleUndo(e) {
        e.preventDefault()
        backHistory()
        drawPattern()
        resetScreen()
    }

    function handleRedo(e) {
        e.preventDefault()
        forwardHistory()
        drawPattern()
        resetScreen()
    }

    let touchEventCache = []
    let prevDiff = -1

    function onTouchDown(e) {
        touchEventCache.push(e)
    }

    function onTouchMove(e) {
        // update pointer event
        let index = touchEventCache.findIndex(
            (cachedEvent) => cachedEvent.pointerId === e.pointerId
        )
        touchEventCache[index] = e

        // if two pointers are down, check for pinch gestures
        if (touchEventCache.length == 2) {
            // calculate the distance between the two pointers
            let currDiff = Math.abs(touchEventCache[0].clientX - evCache[1].clientX)
            if (prevDiff > 0) {
                if (currDiff > prevDiff) {
                    console.log('zooming in')
                } else if (currDiff > prevDiff) {
                    console.log('zooming out')
                }
            }
            // cache the distance for the next move event
            prevDiff = currDiff
        }
    }

    function onTouchUp(e) {
        // remove touch event
        let index = touchEventCache.findIndex(
            (cachedEvent) => cachedEvent.pointerId === e.pointerId
        )
        touchEventCache.splice(index, 1)
    }
}

function resetScreen() {
    const screen = document.querySelector('#screen')
    const markers = document.querySelector('#markers')
    const selectors = document.querySelector('#selectors')

    removeListeners(screen)
    clearChildren(screen)
    clearChildren(markers)
    clearChildren(selectors)
    resetActiveTool()
    trackCoords()
}

function resetViewbox(e) {
    e.preventDefault()
    const svg = document.querySelector('svg');
    let viewBox = svg.viewBox.baseVal
    let width = viewBox.width
    let height = viewBox.height
    let x = (envVar.width - width) / 2
    let y = (envVar.height - height) / 2
    viewBox.x = x
    viewBox.y = y
}

function drawPattern() {
    clearChildren(plane)
    for (let lineId of Object.keys(edgeObj)) {
        let lineCoord = edgeObj[lineId]
        let assignment = assignObj[lineId]
        let strokeColor = envVar.assignmentColor[assignment]
        let start = scaleUpCoords(vertexObj[lineCoord[0]])
        let end = scaleUpCoords(vertexObj[lineCoord[1]])
        drawLine(lineId, start, end, strokeColor)
    }

    function drawLine(lineId, start, end, 
    strokeColor = envVar.assignmentColor[envVar.edgeType]) {
        const plane = document.querySelector("#plane")
        const newLine = line(start[0], envVar.height - start[1], end[0], envVar.height - end[1], `stroke:${strokeColor};stroke-width:${envVar.strokeWidth}`, lineId)
        newLine.addEventListener('click', e => handleDeleteLine(e))
        plane.append(newLine)
    
        function handleDeleteLine(e) {
            e.preventDefault()
            if (e.target) {
                let lineElem = e.target
                let lineId = lineElem.id
                deleteLineSeg(lineId)
                lineElem.remove()
                overwriteHistory()
                resetActiveTool()
            }
        }
    }
}

// right click to toggle edge assignment
function toggleAssign(e) {
    e.preventDefault()
    let pointerPosition = getPointFromEvent(e)
    let x = Math.round(pointerPosition.x * 100)/100
    let y = Math.round((envVar.height - pointerPosition.y) * 100)/100
    let cursorCoord = scaleDownCoords([x,y])
    for (let [lineId, lineVal] of Object.entries(edgeObj)) {
        let startId = lineVal[0]
        let endId = lineVal[1]
        let start = vertexObj[startId]
        let end = vertexObj[endId]
        if (onLine([start, end], cursorCoord)) {
            let lineAssign = assignObj[lineId]
            switch(lineAssign) {
                case 'U':
                    assignObj[lineId] = 'M'
                    break
                case 'M':
                    assignObj[lineId] = 'V'
                    break
                case 'V':
                    assignObj[lineId] = 'M'
                    break
                default:
                    assignObj[lineId] = 'M'
            }
            drawPattern()
            overwriteHistory()
        }
    }
}

function disableActiveTool() {
    const screen = document.querySelector('#screen')
    const markers = document.querySelector('#markers')
    const selectors = document.querySelector('#selectors')
    const pointer = document.querySelector('#pointer')

    pointer.style.display = 'none'
    removeListeners(screen)
    clearChildren(screen)
    clearChildren(markers)
    clearChildren(selectors)
}

function resetActiveTool() {
    if (toolCleanupFunc) {
        toolCleanupFunc()
    }
    switch(envVar.activeTool) {
        case 'draw':
            toolCleanupFunc = setDrawTool()
            break
        case 'bisector':
            toolCleanupFunc = setBisectorTool()
            break
        case 'cut':
            toolCleanupFunc = setCutTool()
            break
        case 'delete':
            toolCleanupFunc = setDeleteTool()
            break
        case 'suggest':
            toolCleanupFunc = setSuggestTool()
    }
}

function addVertMarker(coord, withBorder=false, assign=undefined) {
    const markers = document.querySelector('#markers')
    const vertMarker = new circle(6, 0, 0, 
        `transform: translate(${coord[0]}px, ${envVar.height - (coord[1])}px); 
        fill: ${envVar.assignmentColor[assign ? assign : envVar.edgeType]}`
    )
    vertMarker.classList.add('marker')
    if (withBorder) {
        vertMarker.classList.add('with-border')
    }
    markers.append(vertMarker)
}

function addLineMarker(start, end, withDash=false) {
    const markers = document.querySelector('#markers')
    const lineMarker = line(start[0], envVar.height - start[1], end[0], envVar.height - end[1], `stroke:${envVar.assignmentColor[envVar.edgeType]};stroke-width:${envVar.strokeWidth * 2}; ${withDash ? 'stroke-dasharray: 8 2' : ''}`)
    lineMarker.classList.add('marker')
    markers.append(lineMarker)
}

function addVertSelector(coord, clickHandler, withBorder=false) {
    const vertex = new circle(6, 0, 0,
        `transform:translate(${coord[0]}px,${envVar.height - coord[1]}px);
        fill:green;`
    )
    vertex.addEventListener('click', clickHandler)
    vertex.classList.add('selector')
    if (withBorder) {
        vertex.classList.add('with-border')
    }
    selectors.append(vertex)
}

function addLineSelector(start, end, clickHandler, definedVertices=[]) {
    const newLine = line(start[0], envVar.height - start[1], end[0], envVar.height - end[1], `stroke:green; stroke-width:${envVar.strokeWidth * 2}; stroke-dasharray: 8 2`)

    newLine.classList.add('selector')
    if (definedVertices != undefined) {
        newLine.addEventListener('click', e => clickHandler(e, definedVertices))
    } else {
        newLine.addEventListener('click', e => clickHandler(e))
    }
    selectors.append(newLine);
}


function getElemCoord(elem) {
    let matrix = new WebKitCSSMatrix(window.getComputedStyle(elem).transform);
    return [matrix.m41, envVar.height - matrix.m42]
}

function addLine(start, end, assign = envVar.edgeType) {
    
    // scale down line to be added to compare with existing lines
    let sStart = scaleDownCoords(start)
    let sEnd = scaleDownCoords(end)

    let linesToBreak = {}
    let ptsOnAddedLine = []
    let pointIdsToMerge = []
    
    // if added edge cuts through existing edge, split edges up and add vertices
    for (let [lineId, lineVal] of Object.entries(edgeObj)) {
        let startId = lineVal[0]
        let endId = lineVal[1]
        let lineStart = vertexObj[startId]
        let lineEnd = vertexObj[endId]
        let line = [lineStart, lineEnd]
        // handle overwriting when added line overlap with existing line
        if (equalVal(grad(...lineStart, ...lineEnd), grad(...sStart, ...sEnd)) && (onLine(line, sStart) || onLine(line, sEnd) || onLine([sStart, sEnd], lineStart) || onLine([sStart, sEnd], lineEnd))) {
            // handle new edge's vertices being within existing edge
            if (within(sStart[0], lineStart[0], lineEnd[0]) || within(sStart[1], lineStart[1], lineEnd[1])) {
                linesToBreak[lineId] = [sStart]
            }
            if (within(sEnd[0], lineStart[0], lineEnd[0]) || within(sEnd[1], lineStart[1], lineEnd[1])) {
                if (Object.keys(linesToBreak).includes(lineId)) {
                    linesToBreak[lineId].push(sEnd)
                } else {
                    linesToBreak[lineId] = [sEnd]
                }
            }
            // handle existing edge's vertices being within new edge
            if (within(lineStart[0], sStart[0], sEnd[0]) || within(lineStart[1], sStart[1], sEnd[1])) {
                ptsOnAddedLine.push(lineStart)
                pointIdsToMerge.push(startId)
            }
            if (within(lineEnd[0], sStart[0], sEnd[0]) || within(lineEnd[1], sStart[1], sEnd[1])) {
                ptsOnAddedLine.push(lineEnd)
                pointIdsToMerge.push(endId)
            }
        } else {
            let intersectPt = intersect([sStart, sEnd], line)
            // intersection point is defined and on top of both existing edge and edge to be drawn
            if (intersectPt) {
                // cuts an existing edge
                if (within(intersectPt[0], lineStart[0], lineEnd[0]) || within(intersectPt[1], lineStart[1], lineEnd[1])) {
                    linesToBreak[lineId] = [intersectPt]
                }
                // cuts the new edge
                if (within(intersectPt[0], sStart[0], sEnd[0]) || within(intersectPt[1], sStart[1], sEnd[1])) {
                    ptsOnAddedLine.push(intersectPt)
                }
            }
        }
        
    }

    for (let [lineId, points] of Object.entries(linesToBreak)) {
        breakLine(lineId, points)
    }
    let addedLineId = addLineSeg(start, end, assign)
    let addedStartId = edgeObj[addedLineId][0]
    let addedEndId = edgeObj[addedLineId][1]
    if (ptsOnAddedLine.length > 0) {
        breakLine(addedLineId, ptsOnAddedLine)
    }
    pointIdsToMerge.push(addedStartId, addedEndId)
    for (let pointId of pointIdsToMerge) {
        joinLineSeg(pointId)
    }

}

function addLineSeg(start, end, assign = envVar.edgeType) {
    
    let sStart = scaleDownCoords(start)
    let sEnd = scaleDownCoords(end)
    let lineId
    let startId = getCoordId(sStart)
    let endId = getCoordId(sEnd)

    if (exists(edgeObj, [startId, endId])) {
        lineId = getKey(edgeObj, [startId, endId])
    } else if (exists(edgeObj, [endId, startId])) {
        lineId = getKey(edgeObj, [endId, startId])
    } else {
        lineId = generateId(edgeObj)
    }

    vertexObj[startId] = sStart
    vertexObj[endId] = sEnd
    edgeObj[lineId] = [startId, endId]
    assignObj[lineId] = assign
    console.log("add line " + sStart + " " + sEnd)

    return lineId
}

function deleteLineSeg(lineId) {
    let startId = edgeObj[lineId][0]
    let endId = edgeObj[lineId][1]
    delete edgeObj[lineId]
    delete assignObj[lineId]

    joinLineSeg(startId)
    joinLineSeg(endId)
}

// merge existing edges that contain a given vertex if they have the same gradient and have the same assignment
function joinLineSeg(vertId) {
    let linesWithPt = Object.keys(edgeObj).filter(lineId => edgeObj[lineId].includes(vertId))
    if (linesWithPt.length == 0) {
        delete vertexObj[vertId]
        return
    }
    if (linesWithPt.length == 2) {
        let line1Id = linesWithPt[0]
        let start1Id = edgeObj[line1Id][0]
        let end1Id = edgeObj[line1Id][1]
        let line1Grad = grad(vertexObj[start1Id][0], vertexObj[start1Id][1], vertexObj[end1Id][0], vertexObj[end1Id][1])
        let line2Id = linesWithPt[1]
        let start2Id = edgeObj[line2Id][0]
        let end2Id = edgeObj[line2Id][1]
        let line2Grad = grad(vertexObj[start2Id][0], vertexObj[start2Id][1], vertexObj[end2Id][0], vertexObj[end2Id][1])

        if (equalVal(line1Grad, line2Grad) && 
            assignObj[line1Id] == assignObj[line2Id]) {
            let edgeAssign = assignObj[line1Id]
            let newStart = start1Id != vertId ? start1Id : end1Id
            let newEnd = start2Id != vertId ? start2Id : end2Id
            delete edgeObj[line1Id]
            delete assignObj[line1Id]
            delete edgeObj[line2Id]
            delete assignObj[line2Id]
            delete vertexObj[vertId]
            let newLineId = generateId(edgeObj)
            edgeObj[newLineId] = [newStart, newEnd]
            assignObj[newLineId] = edgeAssign
        }
    }
}

function breakLine(lineId, points) {
    let startId = edgeObj[lineId][0]
    let endId = edgeObj[lineId][1]
    let start = vertexObj[startId]
    let end = vertexObj[endId]
    let assign = assignObj[lineId]

    let segObj = {"0" : start, "1" : end}

    for (let point of points) {
        let segSize = (start[0] - end[0]) != 0 ? 
            (point[0] - start[0]) / (end[0] - start[0]) : 
            (point[1] - start[1]) / (end[1] - start[1])
        segObj[segSize] = point
    }
    let linePtArr = []
    for (let seg of Object.keys(segObj).sort()) {
        linePtArr.push(segObj[seg])
    }
    let lineSegArr = []
    for (let i = 0; i < linePtArr.length - 1; i++) {
        lineSegArr.push([linePtArr[i], linePtArr[i + 1]])
    }
    console.log('break line ' + [start, end] + ' with ' + lineSegArr)
    delete edgeObj[lineId]
    delete assignObj[lineId]
    for (let lineSeg of lineSegArr) {
        let segStart = scaleUpCoords(lineSeg[0])
        let segEnd = scaleUpCoords(lineSeg[1])
        addLineSeg(segStart, segEnd, assign)
    }
}

function scaleDownCoords(coords) {
    let height = envVar.height
    let width = envVar.width
    let x = coords[0] / width
    let y = coords[1] / height
    return [exact(x), exact(y)]
}

function scaleUpCoords(coords) {
    let height = envVar.height
    let width = envVar.width
    let x = coords[0] * width
    let y = coords[1] * height
    return [exact(x), exact(y)]
}

function setDrawTool() {
    const screen = document.querySelector('#screen')
    const pointer = document.querySelector('#pointer')
    const selectors = document.querySelector('#selectors')
    
    let selectedPointer = []

    screen.addEventListener('mousemove', e=>snapPointer(e))
    screen.addEventListener('mouseleave', e=>removePointer(e))
    screen.addEventListener('click', e=>handlePointerClick(e))
    screen.addEventListener('contextmenu', e=>toggleAssign(e))

    // cleanup code on unmount
    return () => {
        const pointer = document.querySelector('#pointer')
        pointer.style.display = 'none'
    }

    function snapPointer(e) { 
        e.preventDefault();
        const pointer = document.querySelector('#pointer');
        let pointerPosition = getPointFromEvent(e);
        let x = pointerPosition.x;
        let y = envVar.height - pointerPosition.y;
        let cursorCoord = [x, y];
        let snapToVert = false;
    
        // Create array to store distances to all potential snap points
        let distPtMap = {};
        if (envVar.gridlines) {
            // Consider all vertices for snapping
            for (let gridVertex of envVar.gridVertices) {
                let distance = distTo(cursorCoord, gridVertex);
                distPtMap[distance] = gridVertex;
            }
        }
    
        // Find the closest snap point, adjusting the threshold as needed
        let minDistToVert = Math.min(...Object.keys(distPtMap).map(Number));
        let closestCoord = distPtMap[minDistToVert];
    
        if (minDistToVert < 6) {  
            cursorCoord = closestCoord;
            snapToVert = true;
        }
    
        // Update pointer position and styling
        let newX = cursorCoord[0];
        let newY = envVar.height - cursorCoord[1];
        pointer.style.display = 'block';
        pointer.style.transform = `translate(${newX}px, ${newY}px)`;
        pointer.classList.toggle('with-border', snapToVert);
    }
    
    
    
    
/*
function addLineIntersectionsToSnapCoords(distPtMap, cursorCoord) {
    // Collect all lines on the plane
    const lines = Array.from(document.querySelector("#plane").children);
    
    // Iterate over pairs of lines to find intersections
    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            let line1 = lines[i];
            let line2 = lines[j];

            // Calculate intersection point between two lines
            let intersection = intersect(
                [[line1.x1.baseVal.value, envVar.height - line1.y1.baseVal.value],
                [line1.x2.baseVal.value, envVar.height - line1.y2.baseVal.value]],
                [[line2.x1.baseVal.value, envVar.height - line2.y1.baseVal.value],
                [line2.x2.baseVal.value, envVar.height - line2.y2.baseVal.value]]
            );

            // If there is a valid intersection, add it to the snapping points
            if (intersection) {
                distPtMap[distTo(intersection, cursorCoord)] = intersection;
            }
        }
    }
}
*/
    

    function removePointer(e) {
        e.preventDefault();
        pointer.style.display = 'none'
    }

    function handlePointerClick(e) {
        e.preventDefault()
        let pointerCoord = getElemCoord(pointer)
        if (ontop(pointerCoord[0], 0, envVar.width) && ontop(pointerCoord[1], 0, envVar.height)) {
            selectedPointer.push(pointerCoord)
            if (selectedPointer.length >= 2) {
                addLine(selectedPointer[0], selectedPointer[1])
                clearChildren(selectors)
                drawPattern()
                overwriteHistory()
                selectedPointer = []
            } else {
                let withBorder = pointer.classList.contains('with-border')
                addVertSelector(pointerCoord, resetScreen, withBorder)
            }
        }
    }
}

function setBisectorTool() {
    const vertexList = []
    const screen = document.querySelector('#screen')
    const markers = document.querySelector('#markers')
    const selectors = document.querySelector('#selectors')

    screen.addEventListener('contextmenu', e => toggleAssign(e))
    generateVertSelectors()

    function generateVertSelectors() {
        for (let vertex of Object.values(vertexObj)) {
            addVertSelector(scaleUpCoords(vertex), handleVertSelectorClick)
        }
    }
    
    function handleVertSelectorClick(e) {
        e.preventDefault();
        if (e.target) {
            let selector = e.target.closest('.selector')
            let selectorCoord = getElemCoord(selector)
            
            vertexList.push(selectorCoord)
            addVertMarker(selectorCoord)
            selector.remove()
            generateLineSelectors(vertexList)

            if (vertexList.length == 4) {
                for (let vertSelector of document.querySelectorAll('circle.selector')) {
                    vertSelector.remove()
                }
            }
        }
    }

    function generateLineSelectors(vertexList) {
        for (let lineSelector of document.querySelectorAll('line.selector')) {
            lineSelector.remove()
        }
        switch (vertexList.length) {
            case 2:
                // axiom 1
                // let lineAcross1 = acrossPts(vertexList[0], vertexList[1])
                let lineBisect = bisectPts(vertexList[0], vertexList[1])
                addLineSelector(vertexList[0], vertexList[1], handleLineSelectorClick, [vertexList[0], vertexList[1]])
                // axiom 2
                // addLineSelector(lineAcross1[0], lineAcross1[1])
                addLineSelector(lineBisect[0], lineBisect[1], handleLineSelectorClick, [])
                break
            case 3:
                // axiom 3
                let angleBisect = bisectAngle(vertexList[0], vertexList[1], vertexList[2])
                addLineSelector(angleBisect[0], angleBisect[1], handleLineSelectorClick, [vertexList[1]])
                break
            case 4:
                // axiom 3
                
                let linesBisect1 = bisectLines(vertexList[0], vertexList[1], vertexList[2], vertexList[3])[0]
                let linesBisect2 = bisectLines(vertexList[0], vertexList[1], vertexList[2], vertexList[3])[1]
                if (linesBisect1) {
                    addLineSelector(linesBisect1[0], linesBisect1[1], handleLineSelectorClick, [])
                }
                if (linesBisect2) {
                    addLineSelector(linesBisect2[0], linesBisect2[1], handleLineSelectorClick, [])
                }
                break
        }
    }

    function handleLineSelectorClick(e, definedVertices) {
        e.preventDefault()
        if (e.target) {
            const lineElem = e.target
            let x1, x2, y1, y2
            let intersectPts = []

            switch(definedVertices.length) {
                case 0:
                    clearChildren(markers)
                    clearChildren(selectors)
                    x1 = lineElem.x1.baseVal.value
                    x2 = lineElem.x2.baseVal.value
                    y1 = envVar.height - lineElem.y1.baseVal.value
                    y2 = envVar.height - lineElem.y2.baseVal.value
                    addLineMarker([x1,y1],[x2,y2], true)

                    for (let edgeVal of Object.values(edgeObj)) {
                        let lineStart = vertexObj[edgeVal[0]]
                        let lineEnd = vertexObj[edgeVal[1]]
                        let line = [scaleUpCoords(lineStart), scaleUpCoords(lineEnd)]
                        let intersectPt = intersect([[x1,y1],[x2,y2]], line)
                        if (intersectPt && ontop(intersectPt[0],0,envVar.width) && ontop(intersectPt[1],0,envVar.height) && !inArray(intersectPts, intersectPt)) {
                            intersectPts.push(intersectPt)
                        }
                    }
                    if (intersectPts.length == 2) {
                        confirmLine(intersectPts[0], intersectPts[1])
                    } else {
                        intersectPts.forEach(intersectPt => {
                            addVertSelector(intersectPt, (e) => handleAddDefinedVertices(e, definedVertices))
                        })
                    }
                    break
                case 1:
                    clearChildren(markers)
                    clearChildren(selectors)
                    x1 = lineElem.x1.baseVal.value
                    x2 = lineElem.x2.baseVal.value
                    y1 = envVar.height - lineElem.y1.baseVal.value
                    y2 = envVar.height - lineElem.y2.baseVal.value
                    addLineMarker([x1,y1],[x2,y2], true)

                    for (let edgeVal of Object.values(edgeObj)) {
                        let lineStart = vertexObj[edgeVal[0]]
                        let lineEnd = vertexObj[edgeVal[1]]
                        let line = [scaleUpCoords(lineStart), scaleUpCoords(lineEnd)]
                        let intersectPt = intersect([[x1,y1],[x2,y2]], line)
                        if (intersectPt && !equalCoords(intersectPt, definedVertices[0]) && ontop(intersectPt[0],0,envVar.width) && ontop(intersectPt[1],0,envVar.height)  && !inArray(intersectPts, intersectPt)) {
                            intersectPts.push(intersectPt)
                        }
                    }
                    if (intersectPts.length == 1) {
                        confirmLine(intersectPts[0], definedVertices[0])
                    } else {
                        intersectPts.forEach(intersectPt => {
                            addVertSelector(intersectPt, (e) => handleAddDefinedVertices(e, definedVertices))
                        })
                        addVertMarker(definedVertices[0])
                    }
                    break
                case 2:
                    confirmLine(definedVertices[0], definedVertices[1])
                    break
            }
        }
    }
    
    function handleAddDefinedVertices(e, definedVertices) {
        if (e.target) {
            let selectedElem = e.target
            let selectedCoord = getElemCoord(selectedElem)
            selectedElem.remove()
            addVertMarker(selectedCoord)
            definedVertices.push(selectedCoord)
            if (definedVertices.length >= 2) {
                confirmLine(definedVertices[0], definedVertices[1])
            }
        }
    }

    function confirmLine(start, end) {
        addLine(start, end)
        drawPattern()
        overwriteHistory()
        clearChildren(markers)
        clearChildren(selectors)
        vertexList.length = 0
        generateVertSelectors()
    }
}

function setCutTool() {
    const vertexList = []
    const screen = document.querySelector('#screen')
    const markers = document.querySelector('#markers')
    const selectors = document.querySelector('#selectors')

    screen.addEventListener('contextmenu', e => toggleAssign(e))
    generateVertSelectors()

    function generateVertSelectors() {
        for (let vertex of Object.values(vertexObj)) {
            addVertSelector(scaleUpCoords(vertex), handleVertSelectorClick)
        }
    }
    
    function handleVertSelectorClick(e) {
        e.preventDefault();
        if (e.target) {
            let selector = e.target.closest('.selector')
            let selectorCoord = getElemCoord(selector)
            if (!vertexList.includes(selectorCoord)) {
                vertexList.push(selectorCoord)
                addVertMarker(selectorCoord)
                selector.remove()
                if (vertexList.length == 2) {
                    addLineMarker(vertexList[0], vertexList[1])
                } else if (vertexList.length == 4) {
                    for (let vertSelector of document.querySelectorAll('circle.selector')) {
                        vertSelector.remove()
                    }
                }
                if (vertexList.length > 2) {
                    generateLineSelectors(vertexList)
                }
            }
        }
    }

    function generateLineSelectors(vertexList) {
        for (let lineSelector of document.querySelectorAll('line.selector')) {
            lineSelector.remove()
        }
        let size = vertexList.length
        switch (size) {
            case 3:
                // axiom 4
                let lineCut = cutLine(vertexList[0], vertexList[1], vertexList[2])
                if (lineCut) {
                    addLineSelector(lineCut[0], lineCut[1], handleLineSelectorClick, [])
                }
                break
            case 4:
                // axiom 5
                let pointCut = cutPoint(vertexList[0], vertexList[1], vertexList[2], vertexList[3])
                for (let line of pointCut) {
                    addLineSelector(line[0], line[1], handleLineSelectorClick, [])
                }
                break
        }
    }

    function handleLineSelectorClick(e, definedVertices) {
        e.preventDefault()
        if (e.target) {
            const lineElem = e.target
            let x1, x2, y1, y2
            let intersectPts = []
            switch(definedVertices.length) {
                case 0:
                    clearChildren(markers)
                    clearChildren(selectors)
                    x1 = lineElem.x1.baseVal.value
                    x2 = lineElem.x2.baseVal.value
                    y1 = envVar.height - lineElem.y1.baseVal.value
                    y2 = envVar.height - lineElem.y2.baseVal.value
                    addLineMarker([x1,y1],[x2,y2], true)

                    for (let edgeVal of Object.values(edgeObj)) {
                        let lineStart = vertexObj[edgeVal[0]]
                        let lineEnd = vertexObj[edgeVal[1]]
                        let line = [scaleUpCoords(lineStart), scaleUpCoords(lineEnd)]
                        let intersectPt = intersect([[x1,y1],[x2,y2]], line)
                        if (intersectPt && ontop(intersectPt[0],0,envVar.width) && ontop(intersectPt[1],0,envVar.height) && !inArray(intersectPts, intersectPt)) {
                            intersectPts.push(intersectPt)
                        }
                    }
                    if (intersectPts.length == 2) {
                        confirmLine(intersectPts[0], intersectPts[1])
                    } else {
                        intersectPts.forEach(intersectPt => {
                            addVertSelector(intersectPt, (e) => handleAddDefinedVertices(e, definedVertices))
                        })
                    }
                    break
                case 1:
                    clearChildren(markers)
                    clearChildren(selectors)
                    x1 = lineElem.x1.baseVal.value
                    x2 = lineElem.x2.baseVal.value
                    y1 = envVar.height - lineElem.y1.baseVal.value
                    y2 = envVar.height - lineElem.y2.baseVal.value
                    addLineMarker([x1,y1],[x2,y2], true)

                    for (let edgeVal of Object.values(edgeObj)) {
                        let lineStart = vertexObj[edgeVal[0]]
                        let lineEnd = vertexObj[edgeVal[1]]
                        let line = [scaleUpCoords(lineStart), scaleUpCoords(lineEnd)]
                        let intersectPt = intersect([[x1,y1],[x2,y2]], line)
                        if (intersectPt && !equalCoords(intersectPt, definedVertices[0]) && ontop(intersectPt[0],0,envVar.width) && ontop(intersectPt[1],0,envVar.height)  && !inArray(intersectPts, intersectPt)) {
                            intersectPts.push(intersectPt)
                        }
                    }
                    if (intersectPts.length == 1) {
                        confirmLine(intersectPts[0], definedVertices[0])
                    } else {
                        intersectPts.forEach(intersectPt => {
                            addVertSelector(intersectPt, (e) => handleAddDefinedVertices(e, definedVertices))
                        })
                        addVertMarker(definedVertices[0])
                    }
                    break
                case 2:
                    confirmLine(definedVertices[0], definedVertices[1])
                    break
            }
        }
    }
    
    function handleAddDefinedVertices(e, definedVertices) {
        if (e.target) {
            let selectedElem = e.target
            let selectedCoord = getElemCoord(selectedElem)
            selectedElem.remove()
            addVertMarker(selectedCoord)
            definedVertices.push(selectedCoord)
            if (definedVertices.length >= 2) {
                confirmLine(definedVertices[0], definedVertices[1])
            }
        }
    }

    function confirmLine(start, end) {
        addLine(start, end)
        drawPattern()
        overwriteHistory()
        clearChildren(markers)
        clearChildren(selectors)
        vertexList.length = 0
        generateVertSelectors()
    }
}

function setDeleteTool() {
    const screen = document.querySelector('#screen')
    const plane = document.querySelector('#plane')
    screen.style.display = 'none'
    Array.from(plane.children).forEach(line => {
        line.classList.add('selector')
        line.style.strokeWidth = envVar.strokeWidth * 1.5
    })

    return () => {
        Array.from(plane.children).forEach(line => {
            line.classList.remove('selector')
            line.style.strokeWidth = envVar.strokeWidth
        })
        const screen = document.querySelector('#screen')
        screen.style.display = 'block'
        drawPattern()
    }
}

function setSuggestTool() {
    const screen = document.querySelector('#screen')
    const markers = document.querySelector('#markers')
    const selectors = document.querySelector('#selectors')

    screen.addEventListener('contextmenu', e => toggleAssign(e))
    generateVertSelectors()

    // find vertices that are not on the boundary edge and
    // have odd number of surrounding edges
    function generateVertSelectors() {
        for (let [vertexId, vertexCoords] of Object.entries(vertexObj)) {
            if (vertexCoords[0] != 0 && vertexCoords[0] != 1 && vertexCoords[1] != 0 && vertexCoords[1] != 1) {
                let linesWithVert = Object.values(edgeObj).filter((idPair) => {
                    return idPair[0] == vertexId || idPair[1] == vertexId
                })
                if (linesWithVert.length % 2 == 1) {
                    addVertSuggestor(scaleUpCoords(vertexCoords))
                }
            }
        }
    }

    function addVertSuggestor(coord) {
        const vertex = new circle(6, 0, 0, 
            `transform:translate(${coord[0]}px,${envVar.height - coord[1]}px);
            fill:green;`
        )
        vertex.addEventListener('click', (e) => suggestVertex(e))
        vertex.classList.add('selector')
        selectors.append(vertex)
    }
    
    function suggestVertex(e) {
        e.preventDefault();
        if (e.target) {
            let lineAngles = [], lineAssigns = [], lineArr = []
            let vertexElem = e.target
            let vertexCoord = getElemCoord(vertexElem)
            let sVertexCoord = scaleDownCoords(vertexCoord)
            let vertexId = getCoordId(sVertexCoord)

            for (let [lineId, lineVal] of Object.entries(edgeObj)) {
                // find edges around selected vertex and compute their angles wrt vertex and assignments
                if (lineVal[0] == vertexId || lineVal[1] == vertexId) {
                    let otherVertexId = lineVal[0] == vertexId ? lineVal[1] : lineVal[0]
                    let otherVertexCoord = vertexObj[otherVertexId]
                    let lineAngle = grad2(sVertexCoord, otherVertexCoord)
                    if (lineAngle < 0) {
                        lineAngle += Math.PI * 2
                    }
                    let lineAssign = assignObj[lineId]
                    lineAngles.push(lineAngle)
                    lineAssigns.push(lineAssign)
                    lineArr.push([lineAngle, lineAssign])
                }
            }

            // compute edge assignment of suggested line
            let mFolds = 0, vFolds = 0, suggestedAssign
            for (let i = 0; i < lineAssigns.length; i++) {
                if (lineAssigns[i] == 'M') {
                    mFolds += 1
                } else if (lineAssigns[i] == 'V') {
                    vFolds += 1
                }
            }
            let absDiff = Math.abs(mFolds - vFolds)
            let moreMEdges = (mFolds - vFolds) > 0;
            if (absDiff == 1) {
                suggestedAssign = moreMEdges ? 'M' : 'V'
            } else {
                suggestedAssign = moreMEdges ? 'V' : 'M'
            }

            // replace selector with marker
            clearChildren(selectors)
            addVertMarker(vertexCoord, false, suggestedAssign)

            // sort edges according to line angle wrt selected vertex
            lineAngles.sort((a, b) => a - b)
            lineArr.sort((a, b) => a[0] - b[0])

            let prevAngle = lineAngles[lineAngles.length - 1]
            let angleArr = []

            // calculate angle between surrounding edges
            for (let i = 0; i < lineAngles.length; i++) {
                let currAngle = lineAngles[i]
                let angleBetween = currAngle - prevAngle
                if (angleBetween < 0) {
                    angleBetween += Math.PI * 2
                }
                angleArr.push(angleBetween)
                prevAngle = currAngle
            }

            for (let i = 0; i < angleArr.length; i++) {
                let angle = angleArr[i]
                let currIdx = (i+1)%angleArr.length
                let oddAngle = 0, evenAngle = 0, isOdd = true
                // starting from index i+1, iterate through every other angle except index i to find newLineAngle
                while (currIdx != i) {
                    isOdd ? oddAngle += angleArr[currIdx] :
                        evenAngle += angleArr[currIdx]
                    currIdx = (currIdx + 1) % angleArr.length 
                    isOdd = !isOdd
                }
                let angleDiff = oddAngle - evenAngle
                if (angle > Math.abs(angleDiff)) {
                    let angleSplit
                    let angleRemaining = (angle - Math.abs(angleDiff)) / 2
                    if (angleDiff > 0) {
                        angleSplit = angleRemaining
                    } else {
                        angleSplit = angleRemaining + Math.abs(angleDiff)   
                    }
                    let angleIdx = i - 1
                    if (angleIdx < 0) {
                        angleIdx += lineAngles.length
                    }
                    let newLineAngle = lineAngles[angleIdx] + angleSplit
                    let newLineArr = lineArr.toSpliced(angleIdx + 1, 0, [newLineAngle, suggestedAssign])
                    if (!bigLittleBig(newLineArr)) {
                        continue;
                    }
                    
                    // calculate coordinates of new line with newLineAngle
                    let newLine = lineGrad(vertexCoord, exact(Math.tan(newLineAngle)), newLineAngle)
                    

                    
                    // find all intersections of full line and restrict new line to closest intersection
                    let intersectionArr = Object.values(edgeObj).map((idPair) => {
                        let start = scaleUpCoords(vertexObj[idPair[0]])
                        let end = scaleUpCoords(vertexObj[idPair[1]])
                        return intersect([start, end], newLine)
                    }).filter(intersection => {
                        if (intersection == undefined || equalCoords(intersection, vertexCoord)) {
                            return false
                        }
                        return true
                    }).map((intersection) => {
                        return [Math.pow(intersection[0] - vertexCoord[0], 2) + Math.pow(intersection[1] - vertexCoord[1], 2), intersection]
                    }).sort((a,b) => a[0] - b[0])
                    if (intersectionArr.length > 0) {
                        addLineSelector(vertexCoord, intersectionArr[0][1], (e) => handleLineSelectorClick(e, suggestedAssign))
                    }
                }
            }
        }

        function bigLittleBig(lineArr) {
            let angleArr = []
            let prevIdx = lineArr.length - 1
            for (let i = 0; i < lineArr.length; i++) {
                let currAngle = lineArr[i][0]
                let prevAngle = lineArr[prevIdx][0]
                let angleBetween = currAngle - prevAngle
                if (angleBetween < 0) {
                    angleBetween += Math.PI * 2
                }
                angleArr.push([angleBetween, lineArr[prevIdx][1], lineArr[i][1]])
                // console.log(JSON.stringify(angleArr))
                prevIdx = (prevIdx + 1) % lineArr.length
                prevAngle = currAngle
            }

            // console.log(JSON.stringify(angleArr))
            while (angleArr.length > 2) {
                // console.log(angleArr.length, JSON.stringify(angleArr))
                let minAngleIdx = -1, minAngle = Math.PI * 2
                for (let i = 0; i < angleArr.length; i++) {
                    if (equalVal(angleArr[i][0], minAngle)) {
                        if ((angleArr[i][1] == 'M' && angleArr[i][2] == 'V') || (angleArr[i][1] == 'V' && angleArr[i][2] == 'M')) {
                            minAngleIdx = i
                            minAngle = angleArr[i][0]
                        }
                    } else if (angleArr[i][0] < minAngle) {
                        minAngleIdx = i
                        minAngle = angleArr[i][0]
                    }
                }
                if (!((angleArr[minAngleIdx][1] == 'M' && angleArr[minAngleIdx][2] == 'V') || (angleArr[minAngleIdx][1] == 'V' && angleArr[minAngleIdx][2] == 'M'))) {
                    return false
                }
                if (minAngleIdx >= 0) {
                    let prevIdx = minAngleIdx - 1
                    if (prevIdx < 0) {
                        prevIdx += angleArr.length
                    }
                    let nextIdx = (minAngleIdx + 1) % angleArr.length
                    let newItem = []
                    newItem.push(angleArr[prevIdx][0] - angleArr[minAngleIdx][0] + angleArr[nextIdx][0])
                    newItem.push(angleArr[prevIdx][1])
                    newItem.push(angleArr[nextIdx][2])
                    angleArr[minAngleIdx] = newItem
                    angleArr = angleArr.filter((value, index) => {
                        if (index !== prevIdx && index !== nextIdx) {
                            return value
                        }
                    })
                } else {
                    return false
                }
            }
            return true
        }
    }

    function handleLineSelectorClick(e, suggestedAssign) {
        e.preventDefault()
        if (e.target) {
            const lineElem = e.target
            let x1 = lineElem.x1.baseVal.value
            let x2 = lineElem.x2.baseVal.value
            let y1 = envVar.height - lineElem.y1.baseVal.value
            let y2 = envVar.height - lineElem.y2.baseVal.value
            addLine([x1, y1], [x2, y2], suggestedAssign)
            drawPattern()
            overwriteHistory()
            clearChildren(markers)
            clearChildren(selectors)
            generateVertSelectors()
        }
    }
}



export { setBorder, generatePlane, resetScreen, setDrawTool, enableShortcuts, resetViewbox, drawPattern }