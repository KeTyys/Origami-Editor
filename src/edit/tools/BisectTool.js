import setToast from "../../notifs/Toast.js"
import * as backend from "../../backend/backend.js"
import { resetInterface } from "../Plane.js"

const vertexList = []
const screen = document.querySelector('#screen')
const markers = document.querySelector('#markers')
const selectors = document.querySelector('#selectors')
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

export default function setBisectorTool() {
    pointer.style.display = 'none'
    screen.addEventListener('contextmenu', backend.draw.toggleAssign)
    interf.addEventListener('touchmove', handleTouchMove)
    interf.addEventListener('touchend', handleTouchEnd)
    generateVertSelectors()

    return () => {
        pointer.style.display = 'none'
        screen.removeEventListener('contextmenu', backend.draw.toggleAssign)
        interf.removeEventListener('touchmove', handleTouchMove)
        interf.removeEventListener('touchend', handleTouchEnd)
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
        
        // Check what element is under the pointer with offset
        const element = document.elementFromPoint(
            touch.clientX + touchOffset, 
            touch.clientY + touchOffset
        )
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

function generateVertSelectors() {
    for (let vertex of Object.values(backend.data.vertexObj)) {
        let vertexCoords = backend.draw.scaleUpCoords(vertex)
        backend.draw.addVertSelector(vertexCoords, handleVertexSelection)
    }
}

function handleVertexSelection(e) {
    e.preventDefault()
    let selector
    
    if (e.type === 'touchend') {
        if (e.changedTouches && e.changedTouches[0]) {
            const touch = e.changedTouches[0]
            selector = document.elementFromPoint(
                touch.clientX + touchOffset, 
                touch.clientY + touchOffset
            )
        }
    } else if (e.type === 'click') {
        selector = e.target
    }

    if (!selector || !selector.classList.contains('selector')) return
    
    let selectorCoord = backend.draw.getElemCoord(selector)
    vertexList.push(selectorCoord)
    backend.draw.addVertMarker(selectorCoord)
    selector.remove()
    generateLineSelectors(vertexList)

    if (vertexList.length == 4) {
        for (let vertSelector of document.querySelectorAll('circle.selector')) {
            vertSelector.remove()
        }
    }
}

function generateLineSelectors(vertexList) {
    for (let lineSelector of document.querySelectorAll('line.selector')) {
        lineSelector.remove()
    }
    switch (vertexList.length) {
        case 2:
            let lineBisect = backend.geom.bisectPts(vertexList[0], vertexList[1])
            backend.draw.addLineSelector(vertexList[0], vertexList[1], handleLineSelection, [vertexList[0], vertexList[1]])
            if (lineBisect) {
                backend.draw.addLineSelector(lineBisect[0], lineBisect[1], handleLineSelection, [])
            }
            break
        case 3:
            let angleBisect = backend.geom.bisectAngle(vertexList[0], vertexList[1], vertexList[2])
            if (angleBisect) {
                backend.draw.addLineSelector(angleBisect[0], angleBisect[1], handleLineSelection, [vertexList[1]])
            }
            break
        case 4:
            let bisectLinesRes = backend.geom.bisectLines(vertexList[0], vertexList[1], vertexList[2], vertexList[3])
            if (bisectLinesRes) {
                let linesBisect1 = bisectLinesRes[0]
                let linesBisect2 = bisectLinesRes[1]
                if (linesBisect1) {
                    backend.draw.addLineSelector(linesBisect1[0], linesBisect1[1], handleLineSelection, [])
                }
                if (linesBisect2) {
                    backend.draw.addLineSelector(linesBisect2[0], linesBisect2[1], handleLineSelection, [])
                }
            } else {
                setToast('error', 'No line bisectors found!')
                resetInterface()
            }
            break
    }
}

function handleLineSelection(e, definedVertices) {
    e.preventDefault()
    let lineElem

    if (e.type === 'touchend') {
        if (e.changedTouches && e.changedTouches[0]) {
            const touch = e.changedTouches[0]
            lineElem = document.elementFromPoint(
                touch.clientX + touchOffset, 
                touch.clientY + touchOffset
            )
        }
    } else if (e.type === 'click') {
        lineElem = e.target
    }

    if (!lineElem || !lineElem.classList.contains('selector')) return
    
    let x1, x2, y1, y2
    let intersectPts = []

    switch(definedVertices.length) {
        case 0:
            backend.dom.clearChildren(markers)
            backend.dom.clearChildren(selectors)
            x1 = lineElem.x1.baseVal.value
            x2 = lineElem.x2.baseVal.value
            y1 = backend.data.envVar.height - lineElem.y1.baseVal.value
            y2 = backend.data.envVar.height - lineElem.y2.baseVal.value
            backend.draw.addLineMarker([x1,y1],[x2,y2], true)

            for (let edgeVal of Object.values(backend.data.edgeObj)) {
                let lineStart = backend.data.vertexObj[edgeVal[0]]
                let lineEnd = backend.data.vertexObj[edgeVal[1]]
                let line = [backend.draw.scaleUpCoords(lineStart), backend.draw.scaleUpCoords(lineEnd)]
                let intersectPt = backend.geom.intersect([[x1,y1],[x2,y2]], line)
                if (intersectPt && backend.geom.ontop(intersectPt[0],0,backend.data.envVar.width) && backend.geom.ontop(intersectPt[1],0,backend.data.envVar.height) && !backend.helper.inArray(intersectPts, intersectPt)) {
                    intersectPts.push(intersectPt)
                }
            }
            if (intersectPts.length == 2) {
                confirmLine(intersectPts[0], intersectPts[1])
            } else {
                intersectPts.forEach(intersectPt => {
                    backend.draw.addVertSelector(intersectPt, (e) => handleAddDefinedVertices(e, definedVertices))
                })
            }
            break
        case 1:
            backend.dom.clearChildren(markers)
            backend.dom.clearChildren(selectors)
            x1 = lineElem.x1.baseVal.value
            x2 = lineElem.x2.baseVal.value
            y1 = backend.data.envVar.height - lineElem.y1.baseVal.value
            y2 = backend.data.envVar.height - lineElem.y2.baseVal.value
            backend.draw.addLineMarker([x1,y1],[x2,y2], true)

            for (let edgeVal of Object.values(backend.data.edgeObj)) {
                let lineStart = backend.data.vertexObj[edgeVal[0]]
                let lineEnd = backend.data.vertexObj[edgeVal[1]]
                let line = [backend.draw.scaleUpCoords(lineStart), backend.draw.scaleUpCoords(lineEnd)]
                let intersectPt = backend.geom.intersect([[x1,y1],[x2,y2]], line)
                if (intersectPt && !backend.geom.equalCoords(intersectPt, definedVertices[0]) && backend.geom.ontop(intersectPt[0],0,backend.data.envVar.width) && backend.geom.ontop(intersectPt[1],0,backend.data.envVar.height)  && !backend.helper.inArray(intersectPts, intersectPt)) {
                    intersectPts.push(intersectPt)
                }
            }
            if (intersectPts.length == 1) {
                confirmLine(intersectPts[0], definedVertices[0])
            } else {
                intersectPts.forEach(intersectPt => {
                    backend.draw.addVertSelector(intersectPt, (e) => handleAddDefinedVertices(e, definedVertices))
                })
                backend.draw.addVertMarker(definedVertices[0])
            }
            break
        case 2:
            confirmLine(definedVertices[0], definedVertices[1])
            break
    }
}

function handleAddDefinedVertices(e, definedVertices) {
    if (e.target) {
        let selectedElem = e.target
        let selectedCoord = backend.draw.getElemCoord(selectedElem)
        selectedElem.remove()
        backend.draw.addVertMarker(selectedCoord)
        definedVertices.push(selectedCoord)
        if (definedVertices.length >= 2) {
            confirmLine(definedVertices[0], definedVertices[1])
        }
    }
}

function confirmLine(start, end) {
    backend.draw.addLine(start, end)
    vertexList.length = 0
    generateVertSelectors()
}