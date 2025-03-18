import * as backend from "../../backend/backend.js"
import { events } from "../../backend/pubsub.js"
import { resetInterface } from "../Plane.js"

const interf = document.querySelector('#interface')
const screen = document.querySelector('#screen')
const pointer = document.querySelector('#pointer')
const plane = document.querySelector('#plane')

let selectedPointer = []
let tempLine = null // Track the temp line
let angleSnapEnabled = false
let snapAngle = 15 // default value in degrees
let vertexOnlyDraw = false // Add this line at the top with other variables
let isDrawingEnabled = true;
let touchOffset = -30 // Default touch offset

// Add touch offset slider functionality
const touchOffsetSlider = document.getElementById('touchOffset')
const touchOffsetValue = document.getElementById('touchOffsetValue')

if (touchOffsetSlider && touchOffsetValue) {
    // Initialize the value display
    touchOffsetValue.textContent = `${touchOffsetSlider.value}px`
    
    // Update the value when slider changes
    touchOffsetSlider.addEventListener('input', (e) => {
        touchOffset = parseInt(e.target.value)
        touchOffsetValue.textContent = `${touchOffset}px`
    })
}

function snapToAngle(start, end) {
    if (!angleSnapEnabled || selectedPointer.length === 0) return end

    const dx = end[0] - start[0]
    const dy = end[1] - start[1]
    const angle = Math.atan2(dy, dx)
    
    // Convert snap angle to radians
    const snapAngleRad = (snapAngle * Math.PI) / 180
    
    // Snap to nearest angle
    const snappedAngle = Math.round(angle / snapAngleRad) * snapAngleRad
    
    // Calculate new point at same distance but snapped angle
    const distance = Math.sqrt(dx * dx + dy * dy)
    const newX = start[0] + distance * Math.cos(snappedAngle)
    const newY = start[1] + distance * Math.sin(snappedAngle)
    
    return [newX, newY]
}

export default function setDrawTool() {
    pointer.style.display = 'none'
    
    // Set vertex-only draw to true by default
    backend.data.envVar.vertexOnlyDraw = true
    
    // Add event listener for pointer events state
    events.on('pointerEvents', (enabled) => {
        isDrawingEnabled = enabled
        if (!enabled) {
            if (tempLine) {
                tempLine.remove()
                tempLine = null
            }
            selectedPointer = []
            pointer.style.display = 'none'
        }
    })

    // Update the handlers to check isDrawingEnabled
    function handlePointerClickWithCheck(e) {
        if (!isDrawingEnabled) return
        handlePointerClick(e)
    }

    function snapPointerWithCheck(e) {
        if (!isDrawingEnabled) return
        snapPointer(e)
    }

    function handleTouchMoveWithCheck(e) {
        if (!isDrawingEnabled) return
        handleTouchMove(e)
    }

    interf.addEventListener('mousemove', snapPointerWithCheck)
    interf.addEventListener('touchmove', handleTouchMoveWithCheck)
    interf.addEventListener('mouseleave', removePointer)
    interf.addEventListener('touchend', removePointer)
    screen.addEventListener('click', handlePointerClickWithCheck)
    screen.addEventListener('touchend', handleTouchEnd)
    screen.addEventListener('contextmenu', backend.draw.toggleAssign)

    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            selectedPointer.length = 0
            if (tempLine) {
                tempLine.remove()
                tempLine = null
            }
            resetInterface()
        }
    }
    document.addEventListener('keydown', handleEsc)

    return () => {
        pointer.style.display = 'none'
        if (tempLine) {
            tempLine.remove()
        }
        interf.removeEventListener('mousemove', snapPointerWithCheck)
        interf.removeEventListener('touchmove', handleTouchMoveWithCheck)
        interf.removeEventListener('mouseleave', removePointer)
        interf.removeEventListener('touchend', removePointer)
        screen.removeEventListener('click', handlePointerClickWithCheck)
        screen.removeEventListener('touchend', handleTouchEnd)
        screen.removeEventListener('contextmenu', backend.draw.toggleAssign)
        document.removeEventListener('keydown', handleEsc)
        events.off('pointerEvents')
    }
}

function snapPointer(e) {
    e.preventDefault()
    let pointerPosition = backend.draw.getPointFromEvent(e)
    let x = pointerPosition.x
    let y = backend.data.envVar.height - pointerPosition.y
    let cursorCoord = [x, y]
    let snapToVert = false;

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

    // If vertex-only drawing is enabled, always snap to closest vertex
    if (backend.data.envVar.vertexOnlyDraw) {
        let minDist = Math.min(...Object.keys(distPtMap))
        cursorCoord = distPtMap[minDist]
        snapToVert = true
    } else {
        // ... existing snapping logic ...
        let minDist = Math.min(...Object.keys(distPtMap))
        if (minDist < 12) {
            cursorCoord = distPtMap[minDist]
            snapToVert = true
        }
    }

    // check for edge snapping
    let distEdgeMap = {}
    let coordEdgeMap = {}
    for (let lineElem of Array.from(plane.children)) {
        let x1 = lineElem.x1.baseVal.value
        let x2 = lineElem.x2.baseVal.value
        let y1 = backend.data.envVar.height - lineElem.y1.baseVal.value
        let y2 = backend.data.envVar.height - lineElem.y2.baseVal.value
        let closestCoord = backend.geom.closest(x1, y1, x2, y2, cursorCoord)
        distEdgeMap[backend.geom.distTo(closestCoord, cursorCoord)] = closestCoord
        coordEdgeMap[closestCoord] = [[x1, y1], [x2, y2]]
    }

    let minDistToLine = Math.min.apply(null, Object.keys(distEdgeMap))
    if (minDistToLine < 10 && !snapToVert) {
        cursorCoord = distEdgeMap[minDistToLine]
        snapToVert = true
    }

    
    if (selectedPointer.length === 1 && angleSnapEnabled) {
        cursorCoord = snapToAngle(selectedPointer[0], cursorCoord)
    }

    let newX = cursorCoord[0]
    let newY = backend.data.envVar.height - cursorCoord[1]

    // Update temporary line if first point is selected
    if (selectedPointer.length === 1) {
        const strokeColor = backend.data.envVar.assignmentColor[backend.data.envVar.edgeType]
        if (tempLine) {
            tempLine.setAttribute('x2', newX)
            tempLine.setAttribute('y2', newY)
        } else {
            tempLine = backend.elements.line(
                selectedPointer[0][0],
                backend.data.envVar.height - selectedPointer[0][1],
                newX, newY,
                `stroke:${strokeColor};stroke-width:${backend.data.envVar.strokeWidth};stroke-dasharray:5,5`
            )
            tempLine.classList.add('temp-line')
            plane.appendChild(tempLine)
        }
    }

    // update pointer position and styling
    pointer.style.display = 'block'
    pointer.style.transform = `translate(${newX}px, ${newY}px)`
    if (snapToVert) {
        pointer.classList.add('with-border')
    } else {
        pointer.classList.remove('with-border')
    }
}

function removePointer(e) {
    e.preventDefault();
    pointer.style.display = 'none'
}

function handlePointerClick(e) {
    e.preventDefault()
    let pointerCoord = backend.draw.getElemCoord(pointer)
    if (backend.geom.ontop(pointerCoord[0], 0, backend.data.envVar.width) && 
        backend.geom.ontop(pointerCoord[1], 0, backend.data.envVar.height)) {
        selectedPointer.push(pointerCoord)
        if (selectedPointer.length >= 2) {
            if (tempLine) {
                tempLine.remove()
                tempLine = null
            }
            backend.draw.addLine(selectedPointer[0], selectedPointer[1])
            selectedPointer = []
        } else {
            let withBorder = pointer.classList.contains('with-border')
            backend.draw.addVertSelector(pointerCoord, resetInterface, withBorder)
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault()
    // Only handle single-touch events for drawing
    if (e.touches.length === 1 && isDrawingEnabled) {
        const touch = e.touches[0]
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX + touchOffset,
            clientY: touch.clientY + touchOffset,
            bubbles: true
        })
        snapPointer(mouseEvent)
    }
}

function handleTouchEnd(e) {
    e.preventDefault()
    // Only handle single-touch events for drawing
    if (e.changedTouches.length === 1 && isDrawingEnabled && e.touches.length === 0) {
        const touch = e.changedTouches[0]
        const mouseEvent = new MouseEvent('click', {
            clientX: touch.clientX + touchOffset,
            clientY: touch.clientY + touchOffset,
            bubbles: true
        })
        handlePointerClick(mouseEvent)
    }
}

document.getElementById('angleSnapCheckbox').addEventListener('change', (e) => {
    angleSnapEnabled = e.target.checked
})

document.getElementById('angleInput').addEventListener('change', (e) => {
    snapAngle = parseFloat(e.target.value)
})

// Add event listener for the vertex-only drawing toggle
document.getElementById('vertexOnlyDraw').addEventListener('change', (e) => {
    backend.data.envVar.vertexOnlyDraw = e.target.checked
})