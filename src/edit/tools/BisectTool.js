import setToast from "../../notifs/Toast.js"
import * as backend from "../../backend/backend.js"
import { resetInterface } from "../Plane.js"
import { TouchCursor } from './TouchCursor.js'

const vertexList = []
const screen = document.querySelector('#screen')
const markers = document.querySelector('#markers')
const selectors = document.querySelector('#selectors')

export default function setBisectorTool(editor) {
    const touchCursor = new TouchCursor(editor)
    screen.addEventListener('contextmenu', backend.draw.toggleAssign)
    
    const touchStartHandler = (e) => onTouchStart(e, touchCursor)
    screen.addEventListener('touchstart', touchStartHandler)

    generateVertSelectors()

    return () => {
        screen.removeEventListener('contextmenu', backend.draw.toggleAssign)
        screen.removeEventListener('touchstart', touchStartHandler)
    }
}

function onTouchStart(e, touchCursor) {
    e.preventDefault()
    touchCursor.startTouch(e)
    const touch = e.touches[0]
    const longPressTimer = setTimeout(() => {
        backend.draw.toggleAssign(e)
    }, 500)
    
    const touchEndHandler = () => {
        touchCursor.endTouch()
        clearTimeout(longPressTimer)
    }
    
    screen.addEventListener('touchend', touchEndHandler, { once: true })
    screen.addEventListener('touchmove', (e) => onTouchMove(e, touchCursor))
}

function onTouchMove(e, touchCursor) {
    touchCursor.updateCursor(e)
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
            selector = document.elementFromPoint(touch.clientX, touch.clientY)
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
            lineElem = document.elementFromPoint(touch.clientX, touch.clientY)
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

function render(ctx) {
    // ... existing render code ...
    touchCursor.renderCursor(ctx)
}