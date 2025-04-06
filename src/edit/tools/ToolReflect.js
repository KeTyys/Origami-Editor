import * as backend from "../../backend/backend.js"
import { resetInterface } from "../Plane.js"
import setToast from "../../notifs/Toast.js"

const screen = document.querySelector('#screen')
const plane = document.querySelector('#plane')
const markers = document.querySelector('#selectors')
const selectors = document.querySelector('#selectors')
const pointer = document.querySelector('#pointer')
const interf = document.querySelector('#interface')

let selectedLines = new Set()
let selectedPoints = []
let isSelectingPoints = false
let touchOffset = -30 // Default touch offset
let lastHoveredElement = null

export default function setReflectTool() {
    pointer.style.display = 'none'
    // Start in line selection mode
    screen.style.display = 'none'
    interf.addEventListener('touchmove', handleTouchMove)
    interf.addEventListener('touchend', handleTouchEnd)
    
    Array.from(plane.children).forEach(line => {
        if (line.tagName.toLowerCase() === 'line') {
            // Remove existing click handlers first
            const newLine = line.cloneNode(true)
            line.parentNode.replaceChild(newLine, line)
            
            // Add our selection handlers
            newLine.classList.add('selector')
            newLine.style.strokeWidth = backend.data.envVar.strokeWidth * 1.5
            newLine.addEventListener('click', handleLineSelect)
            newLine.addEventListener('touchend', handleLineSelect)
        }
    })

    showAllSelectablePoints()

    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            cleanupTool()
            resetInterface()
        }
    }
    document.addEventListener('keydown', handleEsc)

    return () => {
        pointer.style.display = 'none'
        interf.removeEventListener('touchmove', handleTouchMove)
        interf.removeEventListener('touchend', handleTouchEnd)
        cleanupTool()
    }
}

function handleTouchMove(e) {
    e.preventDefault()
    if (e.touches.length === 1) {
        const touch = e.touches[0]
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX + touchOffset,
            clientY: touch.clientY + touchOffset,
            bubbles: true
        })
        snapPointer(mouseEvent)
        
        // Check what element is under the pointer
        const element = document.elementFromPoint(touch.clientX + touchOffset, touch.clientY + touchOffset)
        if (element && (element.classList.contains('selector') || element.closest('.selector'))) {
            lastHoveredElement = element.classList.contains('selector') ? element : element.closest('.selector')
        } else {
            lastHoveredElement = null
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault()
    pointer.style.display = 'none'
    
    if (lastHoveredElement) {
        // Create and dispatch a click event on the hovered element
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        })
        lastHoveredElement.dispatchEvent(clickEvent)
        lastHoveredElement = null
    }
}

function snapPointer(e) {
    e.preventDefault()
    let pointerPosition = backend.draw.getPointFromEvent(e)
    let x = pointerPosition.x
    let y = backend.data.envVar.height - pointerPosition.y
    let cursorCoord = [x, y]
    let snapToVert = false

    // find min distance to any grid vertex or edge vertex
    let distPtMap = {}
    if (backend.data.envVar.gridlines) {
        for (let gridVertex of backend.data.envVar.gridVertices) {
            distPtMap[backend.geom.distTo([x, y], gridVertex)] = gridVertex
        }
    }
    for (let vertexCoord of Object.values(backend.data.vertexObj)) {
        let scaledCoord = backend.draw.scaleUpCoords(vertexCoord)
        distPtMap[backend.geom.distTo([x, y], scaledCoord)] = scaledCoord
    }

    let minDist = Math.min(...Object.keys(distPtMap))
    if (minDist < 12) {
        cursorCoord = distPtMap[minDist]
        snapToVert = true
    }

    let newX = cursorCoord[0]
    let newY = backend.data.envVar.height - cursorCoord[1]

    pointer.style.display = 'block'
    pointer.style.transform = `translate(${newX}px, ${newY}px)`
    if (snapToVert) {
        pointer.classList.add('with-border')
    } else {
        pointer.classList.remove('with-border')
    }
}

function cleanupTool() {
    Array.from(plane.children).forEach(line => {
        if (line.tagName.toLowerCase() === 'line') {
            line.classList.remove('selector')
            line.classList.remove('selected')
            line.style.strokeWidth = backend.data.envVar.strokeWidth
            line.removeEventListener('click', handleLineSelect)
            line.removeEventListener('touchend', handleLineSelect)
        }
    })
    screen.style.display = 'block'
    selectedLines.clear()
    selectedPoints = []
    isSelectingPoints = false
    backend.dom.clearChildren(markers)
    backend.dom.clearChildren(selectors)
    backend.draw.drawPattern() // Redraw to restore original handlers
}

function handleLineSelect(e) {
    e.preventDefault()
    e.stopPropagation() // Stop event from bubbling up
    
    let lineElem = e.type === 'touchend' ? 
        document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY) :
        e.target

    if (lineElem && lineElem.tagName.toLowerCase() === 'line') {
        if (selectedLines.has(lineElem.id)) {
            selectedLines.delete(lineElem.id)
            lineElem.classList.remove('selected')
        } else {
            selectedLines.add(lineElem.id)
            lineElem.classList.add('selected')
        }

        // Show point selectors after at least one line is selected
        if (selectedLines.size > 0 && !isSelectingPoints) {
            isSelectingPoints = true
            showAllSelectablePoints()
        } else if (selectedLines.size === 0) {
            isSelectingPoints = false
            backend.dom.clearChildren(selectors)
        }
    }
}

function showAllSelectablePoints() {
    backend.dom.clearChildren(selectors)
    
    // Set to keep track of points we've already added (using string coordinates for comparison)
    const addedPoints = new Set()
    
    // Add intersection points between lines
    const edges = Object.values(backend.data.edgeObj)
    for (let i = 0; i < edges.length; i++) {
        const edge1 = edges[i]
        const start1 = backend.draw.scaleUpCoords(backend.data.vertexObj[edge1[0]])
        const end1 = backend.draw.scaleUpCoords(backend.data.vertexObj[edge1[1]])

        for (let j = i + 1; j < edges.length; j++) {
            const edge2 = edges[j]
            const start2 = backend.draw.scaleUpCoords(backend.data.vertexObj[edge2[0]])
            const end2 = backend.draw.scaleUpCoords(backend.data.vertexObj[edge2[1]])

            const intersectPt = backend.geom.intersect([start1, end1], [start2, end2])
            if (intersectPt) {
                // Round coordinates to prevent floating-point comparison issues
                const pointKey = `${Math.round(intersectPt[0] * 1000) / 1000},${Math.round(intersectPt[1] * 1000) / 1000}`
                if (!addedPoints.has(pointKey)) {
                    backend.draw.addVertSelector(intersectPt, handlePointSelect, true)
                    addedPoints.add(pointKey)
                }
            }
        }
    }

    // Add existing vertices as selectable points
    Object.values(backend.data.vertexObj).forEach(vertex => {
        const scaledVertex = backend.draw.scaleUpCoords(vertex)
        const pointKey = `${Math.round(scaledVertex[0] * 1000) / 1000},${Math.round(scaledVertex[1] * 1000) / 1000}`
        if (!addedPoints.has(pointKey)) {
            backend.draw.addVertSelector(scaledVertex, handlePointSelect, true)
            addedPoints.add(pointKey)
        }
    })
}

function handlePointSelect(e) {
    e.preventDefault()
    let selector = e.type === 'touchend' ? 
        document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY) :
        e.target

    if (selector && selector.classList.contains('selector')) {
        let coord = backend.draw.getElemCoord(selector)
        selectedPoints.push(coord)
        backend.draw.addVertMarker(coord, true)

        if (selectedPoints.length === 2) {
            if (selectedLines.size === 0) {
                setToast('error', 'Please select at least one line to reflect')
                cleanupTool()
                resetInterface()
                return
            }
            performReflection()
        }
    }
}

function performReflection() {
    const [p1, p2] = selectedPoints
    
    // Calculate reflection axis vector and midpoint
    const dx = p2[0] - p1[0]
    const dy = p2[1] - p1[1]
    const midpoint = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
    
    // Reflect each selected line
    selectedLines.forEach(lineId => {
        if (!backend.data.edgeObj[lineId]) return;

        const edge = backend.data.edgeObj[lineId]
        const startVertex = backend.draw.scaleUpCoords(backend.data.vertexObj[edge[0]])
        const endVertex = backend.draw.scaleUpCoords(backend.data.vertexObj[edge[1]])
        
        // Reflect both points of the line
        const reflectedStart = reflectPoint(startVertex, midpoint, dx, dy)
        const reflectedEnd = reflectPoint(endVertex, midpoint, dx, dy)
        
        // Only add the reflected line if both points are within the grid bounds
        if (isWithinGrid(reflectedStart) && isWithinGrid(reflectedEnd)) {
            backend.draw.addLine(reflectedStart, reflectedEnd, backend.data.assignObj[lineId])
        }
    })

    backend.history.overwriteHistory()
    cleanupTool()
    resetInterface()
}

function isWithinGrid(point) {
    return point[0] >= 0 && point[0] <= backend.data.envVar.width &&
           point[1] >= 0 && point[1] <= backend.data.envVar.height
}

function reflectPoint(point, midpoint, dx, dy) {
    // Normalize the axis vector
    const length = Math.sqrt(dx * dx + dy * dy)
    const nx = dx / length
    const ny = dy / length
    
    // Vector from midpoint to point
    const vx = point[0] - midpoint[0]
    const vy = point[1] - midpoint[1]
    
    // Project vector onto axis
    const dot = vx * nx + vy * ny
    const projx = dot * nx
    const projy = dot * ny
    
    // Reflect point
    const rx = midpoint[0] + 2 * projx - vx
    const ry = midpoint[1] + 2 * projy - vy
    
    return [rx, ry]
}

// Add CSS for selected lines
const style = document.createElement('style')
style.textContent = `
.selected {
    stroke: #4CAF50 !important;
    stroke-width: 3px;
}
`
document.head.appendChild(style)
