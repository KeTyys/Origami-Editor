import setToast from "../notifs/Toast.js"
import { openExportForm } from "../windows/ExportForm.js"
import { render } from "../index.js"
import * as backend from "../backend/backend.js"
import setDialogue from "../notifs/Dialogue.js"

const newfileElem = backend.elements.dropdownItem('New File')
const openfileElem = backend.elements.dropdownItem('Open File')
const saveElem = backend.elements.dropdownItem('Save')
const exportElem = backend.elements.dropdownItem('Export')

export default function generateFileDropdown() {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.id = 'file'
    fileInput.accept = '.fold'
    fileInput.style.display = 'none'
    fileInput.addEventListener('change', handleImportFile)
    openfileElem.appendChild(fileInput)

    newfileElem.addEventListener('click', handleNewFileClick)
    openfileElem.addEventListener('click', handleOpenFilePicker)
    saveElem.addEventListener('click', handleSaveClick)
    exportElem.addEventListener('click', openExportForm)

    const fileDropdown = backend.elements.dropdownList([newfileElem, openfileElem, saveElem, exportElem])
    fileDropdown.id = 'file-dropdown'
    fileDropdown.style.visibility = 'hidden'

    return fileDropdown
}

function handleNewFileClick() {
    setDialogue('Clear current project?', 'Creating a new project will clear current progress. Do you wish to export the current project?', 'Export', 'Proceed', openExportForm, createNewFile)
}

function createNewFile() {
    const fileInput = document.querySelector('#file')
    fileInput.value = null
    handleImportFile()
}

function handleOpenFilePicker() {
    const fileInput = document.querySelector('#file')
    fileInput.click()
}

async function handleImportFile() {
    // const pickerOpts = {
    //     types: [
    //       {
    //         description: "JSON",
    //         accept: {
    //           "application/json": [".fold", ".json", ".cp"],
    //         },
    //       },
    //     ],
    //     excludeAcceptAllOption: true,
    //     multiple: false,
    // };

    // backend.data.editObjs({},{},{})
    // const [fileHandle] = await window.showOpenFilePicker(pickerOpts)
    // const file = await fileHandle.getFile()
    // console.log(fileHandle, file)
    // envVar.activeFile = file

    const fileInput = document.querySelector('#file')

    backend.data.editObjs({},{},{})
    const file = fileInput.files[0]
    if (file) {
        await backend.data.loadFile(file)
        backend.history.setHistory({
            index: 0,
            objs: [{vertexObj: structuredClone(backend.data.vertexObj), edgeObj: structuredClone(backend.data.edgeObj), assignObj: structuredClone(backend.data.assignObj)}]
        })
    } else {
        backend.history.initialiseHistory()
        backend.data.resetFileDetails()
    }
    backend.data.saveData()
    render()
      
}

function handleSaveClick() {
    backend.data.saveData()
    setToast('success', 'File saved')
}