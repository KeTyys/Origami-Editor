import { equalCoords, equalVal, grad, intersect, onLine, within } from "./geom.js"
import { getKey, exists } from "./helper.js"
import { history, setHistory, getHistory, initialiseHistory } from "./history.js"

let defaultFileDetails = {
    'fileTitle': 'Crease Pattern 1',
    'fileAuthor': '',
    'fileCreator': '',
    'fileSpec': '',
    'fileClasses': []
}

let envVar = {
    'fileDetails': {
        'fileTitle': 'Crease Pattern 1',
        'fileAuthor': '',
        'fileCreator': '',
        'fileSpec': '',
        'fileClasses': []
    },
    'strokeWidth' : 2,
    'segment' : 8,
    'gridlines' : true,
    'edgeType': 'M',
    'width': 600,
    'height': 600,
    'gridVertices': [],
    'assignmentColor': {
        'U' : 'yellow',
        'M' : 'red',
        'V' : 'blue',
        'B' : 'black',
        'F' : 'lightgrey'
    },
    'defaultViewBox': {x: -50, y: -10, width: 700, height: 700},
    'svgPadding': {x: 0, y: 0},
    'activeTool': 'draw',
    'gridAlignment': 'bottom',
    'vertexOnlyDraw': false,
    'gridType': 'square',
    'gridIntervalType': 'base'
}

export let vertexObj = {}
export let edgeObj = {}
export let assignObj = {}

// generate an id key that is not found in an obj
function generateId(obj) {
    let id = crypto.randomUUID();
    while (Object.keys(obj).includes(id)) {
        id = crypto.randomUUID();
    }
    return id;
}

// find id of coord in vertexObj. 
// If doesn't exist, insert coord into vertexObj and generate an id
function getCoordId(coord) {
    for (let [id, val] of Object.entries(vertexObj)) {
        if (equalCoords(val, coord)) {
            return id
        }
    }
    let newId = generateId(vertexObj)
    addVertex(newId, coord)
    return newId
}

async function loadFile(file) {
        
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        const fileName = `${file.name}`
        const fileExt = fileName.substring(fileName.indexOf('.'))
        
        reader.onload = (e) => onReaderLoad(e, resolve, fileExt);
        reader.readAsText(file);
    })

    function onReaderLoad(event, resolve, fileExt){
        let obj = JSON.parse(event.target.result);
        processData(obj)
        resolve()
    }
}

function processData(data) {
    console.log(data)
    envVar.fileDetails.fileTitle = data.file_title
    envVar.fileDetails.fileAuthor = data.file_author
    envVar.fileDetails.fileCreator = data.file_creator
    envVar.fileDetails.fileSpec = data.file_spec
    envVar.fileDetails.fileClasses = data.file_classes

    let vList = data.vertices_coords
    let eList = data.edges_vertices
    let aList = data.edges_assignment

    const vIdMap = {}
    const eIdMap = {}

    for (let [idx, v] of vList.entries()) {
        let vId = generateId(vertexObj);        
        vIdMap[idx] = vId
        vertexObj[vId] = v
    }

    for (let [idx, e] of eList.entries()) {
        let eId = generateId(edgeObj)
        let e1 = vIdMap[e[0]]
        let e2 = vIdMap[e[1]]
        eIdMap[idx] = eId
        edgeObj[eId] = [e1, e2]
    }

    for (let [idx, a] of aList.entries()) {
        let eId = eIdMap[idx]
        assignObj[eId] = a
    }
}

function resetFileDetails() {
    envVar.fileDetails = defaultFileDetails
}

function editObjs(newVertexObj, newEdgeObj, newAssignObj) {
    vertexObj = structuredClone(newVertexObj)
    edgeObj = structuredClone(newEdgeObj)
    assignObj = structuredClone(newAssignObj)
}


function saveData() {
    console.log('data saved')
    let data = {
        'envVar': envVar,
        'history': history
    }
    localStorage.setItem('origami-editor', JSON.stringify(data))
}

function retrieveData() {
    let savedData = JSON.parse(localStorage.getItem('origami-editor'))
    if (savedData) {
        console.log(savedData)
        envVar = savedData.envVar
        setHistory(savedData.history)
    } else {
        initialiseHistory()
    }
    getHistory()
    saveData()
}

function deleteData() {
    localStorage.removeItem('origami-editor')
}

function setBorder() {
    let borderLines = [
        [[0, 0], [1, 0]],
        [[0, 0], [0, 1]],
        [[1, 0], [1, 1]],
        [[0,1],[1,1]]
    ]
    for (let line of borderLines) {
        addEdge(line[0],line[1], 'B')
    }
}

function addVertex(vertexId, coord) {
    vertexObj[vertexId] = coord
}

function addEdge(start, end, assign) {
    if (equalCoords(start, end)) {
        return
    }

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
        if (equalVal(grad(...lineStart, ...lineEnd), grad(...start, ...end)) && (onLine(line, start) || onLine(line, end) || onLine([start, end], lineStart) || onLine([start, end], lineEnd))) {
            // handle new edge's vertices being within existing edge
            if (within(start[0], lineStart[0], lineEnd[0]) || within(start[1], lineStart[1], lineEnd[1])) {
                linesToBreak[lineId] = [start]
            }
            if (within(end[0], lineStart[0], lineEnd[0]) || within(end[1], lineStart[1], lineEnd[1])) {
                if (Object.keys(linesToBreak).includes(lineId)) {
                    linesToBreak[lineId].push(end)
                } else {
                    linesToBreak[lineId] = [end]
                }
            }
            // handle existing edge's vertices being within new edge
            if (within(lineStart[0], start[0], end[0]) || within(lineStart[1], start[1], end[1])) {
                ptsOnAddedLine.push(lineStart)
                pointIdsToMerge.push(startId)
            }
            if (within(lineEnd[0], start[0], end[0]) || within(lineEnd[1], start[1], end[1])) {
                ptsOnAddedLine.push(lineEnd)
                pointIdsToMerge.push(endId)
            }
        } else {
            let intersectPt = intersect([start, end], line)
            // intersection point is defined and on top of both existing edge and edge to be drawn
            if (intersectPt) {
                // cuts an existing edge
                if (within(intersectPt[0], lineStart[0], lineEnd[0]) || within(intersectPt[1], lineStart[1], lineEnd[1])) {
                    linesToBreak[lineId] = [intersectPt]
                }
                // cuts the new edge
                if (within(intersectPt[0], start[0], end[0]) || within(intersectPt[1], start[1], end[1])) {
                    ptsOnAddedLine.push(intersectPt)
                }
            }
        }
        
    }

    for (let [lineId, points] of Object.entries(linesToBreak)) {
        breakEdge(lineId, points)
    }
    let addedLineId = addEdgeSeg(start, end, assign)
    let addedStartId = edgeObj[addedLineId][0]
    let addedEndId = edgeObj[addedLineId][1]
    if (ptsOnAddedLine.length > 0) {
        breakEdge(addedLineId, ptsOnAddedLine)
    }
    pointIdsToMerge.push(addedStartId, addedEndId)
    for (let pointId of pointIdsToMerge) {
        joinEdgeSeg(pointId)
    }
}

function addEdgeSeg(start, end, assign = envVar.edgeType) {
    if (equalCoords(start, end)) {
        return
    }
    let lineId
    let startId = getCoordId(start)
    let endId = getCoordId(end)

    if (exists(edgeObj, [startId, endId])) {
        lineId = getKey(edgeObj, [startId, endId])
    } else if (exists(edgeObj, [endId, startId])) {
        lineId = getKey(edgeObj, [endId, startId])
    } else {
        lineId = generateId(edgeObj)
    }
    vertexObj[startId] = start
    vertexObj[endId] = end
    edgeObj[lineId] = [startId, endId]
    assignObj[lineId] = assign
    console.log("add line " + start + " " + end)

    return lineId
}

function deleteEdgeSeg(lineId) {
    let startId = edgeObj[lineId][0]
    let endId = edgeObj[lineId][1]
    delete edgeObj[lineId]
    delete assignObj[lineId]

    joinEdgeSeg(startId)
    joinEdgeSeg(endId)
}

// merge existing edges that contain a given vertex if they have the same gradient and have the same assignment
function joinEdgeSeg(vertId) {
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

function breakEdge(lineId, points) {
    console.log('break edge')
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
        let segStart = lineSeg[0]
        let segEnd = lineSeg[1]
        if (!equalCoords(segStart, segEnd)) {
            addEdgeSeg(segStart, segEnd, assign)
        }
    }
}

export { envVar, generateId, getCoordId, loadFile, resetFileDetails, editObjs, setBorder, addEdge, retrieveData, saveData, deleteEdgeSeg }