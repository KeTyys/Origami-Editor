import * as backend from "../../backend/backend.js"

const screen = document.querySelector('#screen')
const plane = document.querySelector('#plane')
const pointer = document.querySelector('#pointer')
const interf = document.querySelector('#interface')

let touchOffset = -30 // Default touch offset
let lastHoveredElement = null

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

export default function setDeleteTool() {
    pointer.style.display = 'none'
    screen.style.display = 'none'
    interf.addEventListener('touchmove', handleTouchMove)
    interf.addEventListener('touchend', handleTouchEnd)
    
    Array.from(plane.children).forEach(line => {
        line.classList.add('selector')
        line.style.strokeWidth = backend.data.envVar.strokeWidth * 1.5
        line.addEventListener('touchend', handleLineDelete)
    })

    return () => {
        pointer.style.display = 'none'
        Array.from(plane.children).forEach(line => {
            line.classList.remove('selector')
            line.style.strokeWidth = backend.data.envVar.strokeWidth
            line.removeEventListener('touchend', handleLineDelete)
        })
        interf.removeEventListener('touchmove', handleTouchMove)
        interf.removeEventListener('touchend', handleTouchEnd)
        screen.style.display = 'block'
        backend.draw.drawPattern()
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

function handleLineDelete(e) {
    e.preventDefault()
    let lineElem

    if (e.type === 'touchend') {
        if (e.changedTouches && e.changedTouches[0]) {
            const touch = e.changedTouches[0]
            lineElem = document.elementFromPoint(touch.clientX + touchOffset, touch.clientY + touchOffset)
        }
    } else {
        lineElem = e.target
    }

    if (lineElem && lineElem.tagName.toLowerCase() === 'line') {
        let lineId = lineElem.id
        if (lineId && backend.data.edgeObj[lineId]) {
            backend.data.deleteEdgeSeg(lineId)
            lineElem.remove()
            backend.history.overwriteHistory()
        }
    }
}