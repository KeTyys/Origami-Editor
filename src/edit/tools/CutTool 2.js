import setToast from "../../notifs/Toast.js"
import * as backend from "../../backend/backend.js"
import { resetInterface } from "../Plane.js"

const vertexList = []
const screen = document.querySelector('#screen')
const markers = document.querySelector('#markers')
const selectors = document.querySelector('#selectors')

export default function setCutTool() {
    screen.addEventListener('contextmenu', backend.draw.toggleAssign)
    generateVertSelectors()

    return () => {
        screen.removeEventListener('contextmenu', backend.draw.toggleAssign)
    }
}

function generateVertSelectors() {
    for (let vertex of Object.values(backend.data.vertexObj)) {
        backend.draw.addVertSelector(backend.draw.scaleUpCoords(vertex), handleVertSelectorClick)
    }
}

function handleVertSelectorClick(e) {
    e.preventDefault();
    if (e.target) {
        let selector = e.target.closest('.selector')
        let selectorCoord = backend.draw.getElemCoord(selector)
        if (!vertexList.includes(selectorCoord)) {
            vertexList.push(selectorCoord)

            switch(vertexList.length) {
                case 1: 
                    backend.draw.addVertMarker(selectorCoord)
                    selector.remove()
                    break
                case 2:
                    backend.dom.clearChildren(markers)
                    backend.draw.addLineMarker(vertexList[0], vertexList[1])
                    backend.dom.clearChildren(selectors)
                    generateVertSelectors()
                    break
                case 3:
                    backend.draw.addVertMarker(selectorCoord)
                    backend.dom.clearChildren(selectors)
                    generateLineSelectors(vertexList)
                    generateVertSelectors()
                    break
                case 4:
                    backend.draw.addVertMarker(selectorCoord)
                    backend.dom.clearChildren(selectors)
                    generateLineSelectors(vertexList)
                    break
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
            let lineCut = backend.geom.cutLine(vertexList[0], vertexList[1], vertexList[2])
            if (lineCut) {
                backend.draw.addLineSelector(lineCut[0], lineCut[1], handleLineSelectorClick, [])
            } else {
                setToast('error', 'No perpendicular bisectors found')
            }
            break
        case 4:
            // axiom 5
            let pointCut = backend.geom.cutPoint(vertexList[0], vertexList[1], vertexList[2], vertexList[3])
            console.log(pointCut)
            if (pointCut) {
                for (let line of pointCut) {
                    backend.draw.addLineSelector(line[0], line[1], handleLineSelectorClick, [])
                }
            } else {
                setToast('error', 'No bisectors found')
                resetInterface()
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
                backend.dom.clearChildren(markers)
                backend.dom.clearChildren(selectors)
                x1 = lineElem.x1.baseVal.value
                x2 = lineElem.x2.baseVal.value
                y1 = backend.data.envVar.height - lineElem.y1.baseVal.value
                y2 = backend.data.envVar.height - lineElem.y2.baseVal.value

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
                    backend.draw.addLineMarker([x1,y1],[x2,y2], true)
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