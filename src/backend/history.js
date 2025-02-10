import { vertexObj, edgeObj, assignObj, editObjs, setBorder, envVar } from "./data.js"

let history


function setHistory(historyObj) {
    history = historyObj
}

function initialiseHistory() {
    setBorder()
    setHistory({
        index: 0,
        objs: [{vertexObj: structuredClone(vertexObj), edgeObj: structuredClone(edgeObj), assignObj: structuredClone(assignObj)}]
    })
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

function overwriteFilename() {
    history.filename = envVar.fileDetails.fileTitle
}

function getHistory() {
    if (!history || !history.objs || history.index === undefined) {
        console.error("History is not initialized properly");
        return;
    }
    let currHistory = history.objs[history.index];
    editObjs(currHistory.vertexObj, currHistory.edgeObj, currHistory.assignObj);
}


function forwardHistory() {
    if (history.objs[history.index + 1]) {
        history.index += 1
        getHistory()
        console.log('forwardHistory')
    }
}

function backHistory() {
    if (history.index != 0) {
        history.index -= 1;
        getHistory()
        console.log('backHistory')
    }
}

export { history, setBorder, setHistory, initialiseHistory, getHistory,  overwriteHistory, overwriteFilename, forwardHistory, backHistory }