import * as backend from "../../backend/backend.js"
import { resetInterface } from "../Plane.js"

const screen = document.querySelector('#screen')
const markers = document.querySelector('#markers')
const selectors = document.querySelector('#selectors')

export default function setSuggestTool() {

    screen.addEventListener('contextmenu', backend.draw.toggleAssign)
    generateVertSelectors()

    return () => {
        screen.removeEventListener('contextmenu', backend.draw.toggleAssign)
    }
}

// find vertices that are not on the boundary edge and
// have odd number of surrounding edges
function generateVertSelectors() {
    for (let [vertexId, vertexCoords] of Object.entries(backend.data.vertexObj)) {
        if (vertexCoords[0] != 0 && vertexCoords[0] != 1 && vertexCoords[1] != 0 && vertexCoords[1] != 1) {
            let linesWithVert = Object.values(backend.data.edgeObj).filter((idPair) => {
                return idPair[0] == vertexId || idPair[1] == vertexId
            })
            if (linesWithVert.length % 2 == 1) {
                let suggestorCoord = backend.draw.scaleUpCoords(vertexCoords)
                backend.draw.addVertSelector(suggestorCoord, suggestVertex)
            }
        }
    }
}

function suggestVertex(e) {
    e.preventDefault();
    if (e.target) {
        let lineAngles = [], lineAssigns = [], lineArr = []
        let vertexElem = e.target
        let vertexCoord = backend.draw.getElemCoord(vertexElem)
        let sVertexCoord = backend.draw.scaleDownCoords(vertexCoord)
        let vertexId = backend.data.getCoordId(sVertexCoord)

        for (let [lineId, lineVal] of Object.entries(backend.data.edgeObj)) {
            // find edges around selected vertex and compute their angles wrt vertex and assignments
            if (lineVal[0] == vertexId || lineVal[1] == vertexId) {
                let otherVertexId = lineVal[0] == vertexId ? lineVal[1] : lineVal[0]
                let otherVertexCoord = backend.data.vertexObj[otherVertexId]
                let lineAngle = backend.geom.grad2(sVertexCoord, otherVertexCoord)
                if (lineAngle < 0) {
                    lineAngle += Math.PI * 2
                }
                let lineAssign = backend.data.assignObj[lineId]
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
        backend.dom.clearChildren(selectors)
        backend.draw.addVertMarker(vertexCoord, false, suggestedAssign)

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
                let newLine = backend.geom.lineGrad(vertexCoord, backend.helper.exact(Math.tan(newLineAngle)), newLineAngle)
                
                // find all intersections of full line and restrict new line to closest intersection
                let intersectionArr = Object.values(backend.data.edgeObj).map((idPair) => {
                    let start = backend.draw.scaleUpCoords(backend.data.vertexObj[idPair[0]])
                    let end = backend.draw.scaleUpCoords(backend.data.vertexObj[idPair[1]])
                    return backend.geom.intersect([start, end], newLine)
                }).filter(intersection => {
                    if (intersection == undefined || backend.geom.equalCoords(intersection, vertexCoord)) {
                        return false
                    }
                    return true
                }).map((intersection) => {
                    return [Math.pow(intersection[0] - vertexCoord[0], 2) + Math.pow(intersection[1] - vertexCoord[1], 2), intersection]
                }).sort((a,b) => a[0] - b[0])
                if (intersectionArr.length > 0) {
                    backend.draw.addLineSelector(vertexCoord, intersectionArr[0][1], (e) => handleLineSelectorClick(e, suggestedAssign))
                } else {
                    setToast('error', 'No flat foldable edges found')
                    resetInterface()
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
                if (backend.geom.equalVal(angleArr[i][0], minAngle)) {
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
        let y1 = backend.data.envVar.height - lineElem.y1.baseVal.value
        let y2 = backend.data.envVar.height - lineElem.y2.baseVal.value
        backend.draw.addLine([x1, y1], [x2, y2], suggestedAssign)
        generateVertSelectors()
    }
}