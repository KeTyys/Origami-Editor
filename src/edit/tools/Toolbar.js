import setBisectorTool from "./BisectTool.js"
import setCutTool from "./CutTool.js"
import setDeleteTool from "./DeleteTool.js"
import setDrawTool from "./DrawTool.js"
import { toggleTypesMenu, handleTypeSelect } from "./EdgeTool.js"
import setSuggestTool from "./SuggestTool.js"
import { resetInterface } from "../Plane.js"
import * as backend from "../../backend/backend.js"

const tools = document.querySelector('#tools')
const drawToolBtn = document.querySelector('#draw')
const bisectorToolBtn = document.querySelector('#bisect')
const cutToolBtn = document.querySelector('#cut')
const deleteToolBtn = document.querySelector('#delete')
const suggestToolBtn = document.querySelector('#suggest')
const edgeTypeBtn = document.querySelector('#currEdgeType')
const edgeTypeMenu = document.querySelector('#edgeTypeMenu')

let toolCleanupFunc

export default function initialiseTools() {
    let selectedTool = backend.data.envVar.activeTool
    const selectedToolElem = tools.querySelector(`#${selectedTool}`)
    selectedToolElem.classList.add('selected')
    drawToolBtn.addEventListener('click', e => handleToolSelect(e))
    bisectorToolBtn.addEventListener('click', e=>handleToolSelect(e))
    cutToolBtn.addEventListener('click', e=> handleToolSelect(e))
    deleteToolBtn.addEventListener('click', e=>handleToolSelect(e))
    suggestToolBtn.addEventListener('click', e=>handleToolSelect(e))
    edgeTypeBtn.addEventListener('click', toggleTypesMenu)
    for (let typeOption of Array.from(edgeTypeMenu.children)) {
        typeOption.addEventListener('click', handleTypeSelect)
    }
}

function handleToolSelect(e) {
    const selectedTool = e.target.closest('.tool-button')
    const tools = Array.from(document.querySelector('#tools').children)

    tools.forEach((tool) => {
        // console.log(tool.id, selectedTool.id)
        if (tool.id == selectedTool.id) {
            tool.classList.add('selected')
        } else {
            tool.classList.remove('selected')

        }
    })

    switch(selectedTool) {
        case drawToolBtn: 
            backend.data.envVar.activeTool = 'draw'
            break
        case bisectorToolBtn:
            backend.data.envVar.activeTool = 'bisector'
            break
        case cutToolBtn:
            backend.data.envVar.activeTool = 'cut'
            break
        case deleteToolBtn:
            backend.data.envVar.activeTool = 'delete'
            break
        case suggestToolBtn:
            backend.data.envVar.activeTool = 'suggest'
            break
    }
    resetInterface()
}

function resetActiveTool() {
    if (toolCleanupFunc) {
        toolCleanupFunc()
    }
    switch(backend.data.envVar.activeTool) {
        case 'draw':
            toolCleanupFunc = setDrawTool()
            break
        case 'bisector':
            toolCleanupFunc = setBisectorTool()
            break
        case 'cut':
            toolCleanupFunc = setCutTool()
            break
        case 'delete':
            toolCleanupFunc = setDeleteTool()
            break
        case 'suggest':
            toolCleanupFunc = setSuggestTool()
    }
}

export { resetActiveTool }