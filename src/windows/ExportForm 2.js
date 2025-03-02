import { FOLD } from "../index.js"
import * as backend from "../backend/backend.js"

const exportForm = document.querySelector('#exportForm')
const confirmExport = document.querySelector('#exportBtn')
const closeBtn = document.querySelector('#export-close')
const overlay = document.querySelector('#overlay')

const fileTitleInput = document.querySelector('#fileTitle')
const fileAuthorInput = document.querySelector('#fileAuthor')
const fileCreatorInput = document.querySelector('#fileCreator')
const fileSpecInput = document.querySelector('#fileSpec')
const fileClasses = document.querySelector('#fileClasses')
let previewElem = document.querySelector('#preview')

function initialiseExportForm() {
    closeBtn.addEventListener('click', (e) => closeExportForm(e))
    confirmExport.addEventListener('click', (e) => handleExportClick(e))
}

function openExportForm() {
    fileTitleInput.value = backend.data.envVar.fileDetails.fileTitle
    fileAuthorInput.value = backend.data.envVar.fileDetails.fileAuthor
    fileCreatorInput.value = backend.data.envVar.fileDetails.fileCreator
    fileSpecInput.value = backend.data.envVar.fileDetails.fileSpec
    for (let cls of backend.data.envVar.fileDetails.fileClasses) {
        const clsInput = fileClasses.querySelector(`#${cls}`)
        clsInput.checked = true
    }

    loadPreview()
    backend.dom.toggleElemVisibility(overlay, true)
    backend.dom.toggleElemVisibility(exportForm, true)
}

function closeExportForm(e) {
    e.preventDefault()
    backend.dom.toggleElemVisibility(overlay, false)
    backend.dom.toggleElemVisibility(exportForm, false)
}

function loadPreview() {
    let plane = document.querySelector('#plane')
    let previewGroup = plane.cloneNode(true)
    let previewSvg = backend.elements.svg(300, 300)
    previewSvg.setAttribute('viewBox', '-5 -5 610 610')
    previewSvg.appendChild(previewGroup)
    previewElem.innerHTML = ''
    previewElem.append(previewSvg)
}

function handleExportClick(e) {
    const titleInput = document.querySelector('#fileTitle')
    if (titleInput.checkValidity()) {
        handleExport(e)
    }
}

function handleExport(e) {
    e.preventDefault()
    let verticesCoords = []
    let edgesVertices = []
    let edgesAssignment = []
    let JSONObj = {}

    let fileTitle = document.querySelector('#fileTitle').value
    let fileAuthor = document.querySelector('#fileAuthor').value
    let fileCreator = document.querySelector('#fileCreator').value
    let fileSpec = document.querySelector('#fileSpec').value
    let fileClassesGrp = document.querySelector('#fileClasses')
    let fileClasses = []
    for (let radioBtn of fileClassesGrp.querySelectorAll('input')) {
        if (radioBtn.checked) {
            fileClasses.push(radioBtn.value)
        }
    }
    generateMaps()

    JSONObj['file_spec'] = fileSpec 
    JSONObj['file_creator'] = fileCreator 
    JSONObj['file_author'] = fileAuthor 
    JSONObj['file_title'] = fileTitle 
    JSONObj['file_classes'] = fileClasses 
    JSONObj['vertices_coords'] = verticesCoords
    JSONObj['edges_vertices'] = edgesVertices
    JSONObj['edges_assignment'] = edgesAssignment
    JSONObj = FOLD.convert.edges_vertices_to_faces_vertices(JSONObj)
    
    let data = JSON.stringify(JSONObj)
    download(data, `${fileTitle}.fold`, 'application/json');

    function generateMaps() {
        //maps vertexId to index in verticesCoords
        let vIdMap = {} 
        for (let [id, vertex] of Object.entries(backend.data.vertexObj)) {
            vIdMap[id]= verticesCoords.push(vertex) - 1
        }
    
        for (let [id, pair] of Object.entries(backend.data.edgeObj)) {
            edgesVertices.push([vIdMap[pair[0]], vIdMap[pair[1]]])
            edgesAssignment.push(backend.data.assignObj[id])
        }
    }
    
    function download(content, fileName, contentType) {
        var a = document.createElement("a");
        var file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }
}



export { initialiseExportForm, openExportForm, closeExportForm }