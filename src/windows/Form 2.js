import { vertexObj, edgeObj, assignObj, envVar, deleteHistory, overwriteHistory, saveHistory } from "../data.js"
import { generateId } from "../helper.js"
import { generateGrid, toggleGrid } from "../edit/Grid.js"
import { resetInterface, resetViewbox, setBorder } from "../edit/Plane.js"
import { initialiseExportForm } from "../windows/ExportForm.js"
import * as backend from "../backend/backend.js"

const segInput = document.querySelector('#segment')
const strInput = document.querySelector('#stroke')
const gridInput = document.querySelector('#gridline')
const fileInput = document.querySelector('#file')
const clearFileBtn = document.querySelector('#clearfile')
const drawToolBtn = document.querySelector('#draw')
const bisectorToolBtn = document.querySelector('#bisector')
const cutToolBtn = document.querySelector('#cut')
const deleteToolBtn = document.querySelector('#delete')
const suggestToolBtn = document.querySelector('#suggest')
const edgeTypeInput = document.querySelector('#edgeType')
const printBtn = document.querySelector('#print')
const viewboxBtn = document.querySelector('#viewbox')
const saveBtn = document.querySelector('#save')
const clearSaveBtn = document.querySelector('#clearsave')

function initialiseForm() {
    
    segInput.value = envVar.segment
    strInput.value = envVar.strokeWidth
    fileInput.value = envVar.activeFile
    edgeTypeInput.value = envVar.edgeType
    
    segInput.addEventListener('change', render)
    strInput.addEventListener('change', render)
    gridInput.addEventListener('change', render)
    fileInput.addEventListener('change', e=>handleSubmit(e))
    clearFileBtn.addEventListener('click', e=>clearFile(e))
    segInput.addEventListener('invalid',e=>invalidSegment(e))
    strInput.addEventListener('invalid', e=>invalidStroke(e))
    drawToolBtn.addEventListener('click', e => handleToolSelect(e))
    bisectorToolBtn.addEventListener('click', e=>handleToolSelect(e))
    cutToolBtn.addEventListener('click', e=> handleToolSelect(e))
    deleteToolBtn.addEventListener('click', e=>handleToolSelect(e))
    suggestToolBtn.addEventListener('click', e=>handleToolSelect(e))
    edgeTypeInput.addEventListener('change', e=>handleEdgeTypeChange(e))
    printBtn.addEventListener('click', e =>printObjects(e))
    viewboxBtn.addEventListener('click', resetViewbox)
    saveBtn.addEventListener('click', saveHistory)
    clearSaveBtn.addEventListener('click', deleteHistory)
    initialiseExportForm()

    function clearFile(e) {
        e.preventDefault()
        const fileInput = document.querySelector('#file')
        fileInput.value = null
        envVar.activeFile = ''
        handleSubmit(e)
    }

    async function render() {
        const segInput = document.querySelector('#segment');
        const strInput = document.querySelector('#stroke');
        const toggleGridInput = document.querySelector('#gridline');
        const gridTypeInput = document.querySelector('#gridType'); // Get the grid type input
        
        if (segInput.checkValidity()) {
            envVar.segment = segInput.value;
        }
        if (strInput.checkValidity()) {
            envVar.strokeWidth = strInput.value;
        }
        envVar.gridlines = toggleGridInput.checked;
        envVar.gridType = gridTypeInput.value; // Set selected grid type
    
        generateGrid();
        toggleGrid();
        resetScreen();
        drawPattern();
    }
    
    const diagonalLinesInput = document.querySelector('#diagonalLines');
    diagonalLinesInput.addEventListener('change', () => {
        backend.envVar.diagonalLines = diagonalLinesInput.checked;
        render(); // Re-render grid to apply the changes
    });
    

    // Adding event listener for grid type changes
    document.addEventListener('DOMContentLoaded', () => {
        const gridTypeInput = document.querySelector('#gridType');
        gridTypeInput.addEventListener('change', render); // Re-render grid on type change
    });

    async function handleSubmit(e) {
        e.preventDefault()
        const fileInput = document.querySelector('#file')
        clearObj()
        const file = fileInput.files[0]
        envVar.activeFile = file
        if (file) {
            await loadFile(file)
        } else {
            setBorder()
        }
        render()
        overwriteHistory()
        
        
        function clearObj() {
            for (let obj of [vertexObj, edgeObj, assignObj]) {
                for (let id in obj) delete obj[id];
            }
        }

        async function loadFile(file) {
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onload = (e) => onReaderLoad(e, resolve);
                reader.readAsText(file);
            })

            function onReaderLoad(event, resolve){
                let obj = JSON.parse(event.target.result);
                processData(obj)
                resolve()
            }
        }

        function processData(data) {
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
    }

    function invalidSegment(e) {
        e.target.value = envVar.segment
        window.alert('Invalid input: must be a number')
    }

    function invalidStroke(e) {
        e.target.value = envVar.strokeWidth
        window.alert('Invalid input: must be a number')
    }

    function disableToolBtn(toolElem) {
        drawToolBtn.disabled = false
        bisectorToolBtn.disabled = false
        cutToolBtn.disabled = false
        deleteToolBtn.disabled = false
        suggestToolBtn.disabled = false
        toolElem.disabled = true
    }

    function handleToolSelect(e) {
        disableToolBtn(e.target)
        switch(e.target) {
            case drawToolBtn: 
                envVar.activeTool = 'draw'
                break
            case bisectorToolBtn:
                envVar.activeTool = 'bisector'
                break
            case cutToolBtn:
                envVar.activeTool = 'cut'
                break
            case deleteToolBtn:
                envVar.activeTool = 'delete'
                break
            case suggestToolBtn:
                envVar.activeTool = 'suggest'
                break
        }
        resetInterface()
    }

    function handleEdgeTypeChange(e) {
        e.preventDefault()
        envVar.edgeType = e.target.value
        let edgeColour = envVar.assignmentColor[envVar.edgeType]
        const pointer = document.querySelector('#pointer')
        pointer.style.fill = edgeColour
        let markers = document.querySelector('#markers')
        for (let marker of markers.children) {
            if (marker.tagName == 'circle') {
                marker.style.fill = edgeColour
            } else if (marker.tagName == 'line') {
                marker.style.stroke = edgeColour
            }
        }
    }

    function printObjects(e) {
        e.preventDefault()
        console.log(vertexObj, edgeObj, assignObj)
        console.log(Object.keys(vertexObj).length, Object.keys(edgeObj).length, Object.keys(assignObj).length)
    }
    document.addEventListener('keydown', handleHotkey);

    const hotkeys = {
        '1': 'M',  // Mountain fold
        '2': 'V',  // Valley fold
        '3': 'U',  // Unassigned fold
        '4': 'F',  // Flat fold
    };
    
    function handleHotkey(e) {
        if (hotkeys.hasOwnProperty(e.key)) {
            const edgeType = hotkeys[e.key];
            document.getElementById('edgeType').value = edgeType;
            envVar.edgeType = edgeType;
            render();
        }
    }
    
    // allows users to customize the hotkeys (needs fixing)
    function initialiseHotkeySettings() {
        const hotkeyForm = document.querySelector('#hotkeySettings');
        if (hotkeyForm) {
            hotkeyForm.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                const value = e.target.value;
                if (key && value) {
                    hotkeys[key] = value;
                }
            });
        }
    }
    initialiseHotkeySettings()
}


export { initialiseForm }