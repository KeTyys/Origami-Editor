import { addEdge, deleteEdgeSeg, vertexObj, edgeObj, assignObj, envVar } from "./data.js"
import { circle, line } from "./elements.js"
import { exact } from "./helper.js"
import { overwriteHistory } from "./history.js"
import { clearChildren } from "./dom.js"
import { resetActiveTool } from "../edit/tools/Toolbar.js"
import { onLine, ontop } from "./geom.js"

const plane = document.querySelector('#plane')
const markers = document.querySelector('#markers')
const selectors = document.querySelector('#selectors')

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

function addVertMarker(coord, withBorder=false, assign=undefined) {
    const vertMarker = circle(6, 0, 0, 
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
    const lineMarker = line(start[0], envVar.height - start[1], end[0], envVar.height - end[1], `stroke:${envVar.assignmentColor[envVar.edgeType]};stroke-width:${envVar.strokeWidth * 2}; ${withDash ? 'stroke-dasharray: 8 2' : ''}`)
    lineMarker.classList.add('marker')
    markers.append(lineMarker)
}

function addVertSelector(coord, handler, withBorder=false) {
    const vertex = circle(6, 0, 0,
        `transform:translate(${coord[0]}px,${envVar.height - coord[1]}px);
        fill:green;`
    )
    vertex.addEventListener('click', handler)
    vertex.addEventListener('touchend', handler)
    vertex.classList.add('selector')
    if (withBorder) {
        vertex.classList.add('with-border')
    }
    selectors.append(vertex)
}

function addLineSelector(start, end, callback, definedVertices=[], lineId='') {
    const lineSelector = line(start[0], envVar.height - start[1], end[0], envVar.height - end[1], 
        'stroke:green;stroke-width:2;cursor:pointer')
    lineSelector.classList.add('selector')
    if (lineId) {
        lineSelector.setAttribute('data-line-id', lineId)
    }
    lineSelector.addEventListener('click', (e) => callback(e, definedVertices))
    lineSelector.addEventListener('touchend', (e) => callback(e, definedVertices))
    selectors.appendChild(lineSelector)
}

function getElemCoord(elem) {
    let matrix = new WebKitCSSMatrix(window.getComputedStyle(elem).transform);
    return [matrix.m41, envVar.height - matrix.m42]
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

function addLine(start, end, assign = envVar.edgeType) {
    let sStart = scaleDownCoords(start)
    let sEnd = scaleDownCoords(end)
    addEdge(sStart, sEnd, assign)
    drawPattern()
    clearChildren(markers)
    clearChildren(selectors)
    overwriteHistory()
}

// right click to toggle edge assignment
function toggleAssign(e) {
    e.preventDefault()
    let pointerPosition = getPointFromEvent(e)
    let x = Math.round(pointerPosition.x * 100)/100
    let y = Math.round((envVar.height - pointerPosition.y) * 100)/100
    if (ontop(x, 0, envVar.width) && ontop(y, 0, envVar.height)) {
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
}

function drawLine(lineId, start, end, strokeColor = envVar.assignmentColor[envVar.edgeType]) {
    const newLine = line(start[0], envVar.height - start[1], end[0], envVar.height - end[1], `stroke:${strokeColor};stroke-width:${envVar.strokeWidth}`, lineId)
    newLine.addEventListener('click', e => handleDeleteLine(e))
    plane.append(newLine)

    function handleDeleteLine(e) {
        e.preventDefault()
        if (e.target) {
            let lineElem = e.target
            let lineId = lineElem.id
            deleteEdgeSeg(lineId)
            lineElem.remove()
            overwriteHistory()
            resetActiveTool()
        }
    }
}

export { scaleUpCoords, scaleDownCoords, addVertMarker, addLineMarker, addVertSelector, addLineSelector, getPointFromEvent, toggleAssign, getElemCoord, addLine, drawPattern }