/*
- manages history (an array of 3 objects (vertex, edge, assign) and the current index to point to)
Circle, Line, SVG, Vertex.js
- constructor methods for creating various svg elements (will prolly consolidate into one file)
*/
import { vertexObj, edgeObj, assignObj, editObjs } from "./index.js";

let history

function initialiseHistory() {
    history = {
        index: 0,
        objs: [{vertexObj: structuredClone(vertexObj), edgeObj: structuredClone(edgeObj), assignObj: structuredClone(assignObj)}]
    }
}

function saveHistory() {
    localStorage.setItem('origami-editor', JSON.stringify(history))
}

function retrieveHistory() {
    history = JSON.parse(localStorage.getItem('origami-editor'))
    if (history) {
        getHistory()
        return true
    }
}

function deleteHistory() {
    localStorage.removeItem('origami-editor')
}

function overwriteHistory() {
    console.log('overwriteHistory')
    if (history.objs.length > history.index + 1) {
        while (history.objs.length > history.index + 1) {
            history.objs.pop()
        }
    }
    history.objs.push({vertexObj: structuredClone(vertexObj), edgeObj: structuredClone(edgeObj), assignObj: structuredClone(assignObj)})
    history.index += 1
}

function getHistory() {
    let currHistory = history.objs[history.index]
    editObjs(currHistory.vertexObj, currHistory.edgeObj, currHistory.assignObj)
}

function forwardHistory() {
    console.log('forwardHistory')
    if (history.objs[history.index + 1]) {
        history.index += 1
        getHistory()
    }
}

function backHistory() {
    console.log('backHistory')
    if (history.index != 0) {
        history.index -= 1;
        getHistory()
    }
}

export {initialiseHistory, saveHistory, retrieveHistory, deleteHistory, overwriteHistory, getHistory, forwardHistory, backHistory}