import generateMenuDropdown from "./Menu.js"
import * as backend from "../backend/backend.js"

export default function initialiseHeader() {
    const logoElem = document.querySelector('#logo')
    const filenameElem = document.querySelector('#filename')
    filenameElem.innerHTML = backend.data.envVar.fileDetails.fileTitle
    filenameElem.addEventListener('click', handleFilenameClick)
    logoElem.addEventListener('click', handleLogoClick)
    generateMenuDropdown()
    assignTitle()
}

function handleFilenameClick() {
    const filenameElem = document.querySelector('#filename')
    const filenameInput = document.createElement('input')
    filenameInput.type = 'text'
    filenameInput.id = 'filename'
    filenameInput.value = filenameElem.innerHTML
    filenameInput.addEventListener('blur', handleFilenameDeselect)
    filenameInput.addEventListener('change', handleFilenameDeselect)

    filenameElem.replaceWith(filenameInput)
    filenameInput.select()

    function handleFilenameDeselect() {
        const filenameInput = document.querySelector('#filename')
        const filenameElem = document.createElement('div')
        if (filenameInput.value) {
            backend.data.envVar.fileDetails.fileTitle = filenameInput.value
        }
        filenameElem.innerHTML = backend.data.envVar.fileDetails.fileTitle
        filenameElem.id = 'filename'
        filenameElem.addEventListener('click', handleFilenameClick)

        filenameInput.replaceWith(filenameElem)
        backend.history.overwriteFilename()
    }
}

function handleLogoClick() {
    let menuContainer = document.querySelector('#menu-container')
    backend.dom.toggleElemVisibility(menuContainer)
}

function assignTitle() {
    const filenameElem = document.querySelector('#filename')
    filenameElem.innerHTML = backend.data.envVar.fileDetails.fileTitle
}

export { assignTitle }