import { openPrefWindow } from "../windows/Preferences.js"
import generateFileDropdown from "./FileDropdown.js"
import generateEditDropdown from "./EditDropdown.js"
import * as backend from "../backend/backend.js"

const menuContainer = document.querySelector('#menu-container') 

export default function generateMenuDropdown() {
    const fileElem = backend.elements.dropdownItem('File', 'file', undefined, true)
    const editElem = backend.elements.dropdownItem('Edit', 'edit', undefined, true)
    const prefElem = backend.elements.dropdownItem('Preferences', 'preferences')
    const fileDropdown = generateFileDropdown()
    const editDropdown = generateEditDropdown()

    fileElem.appendChild(fileDropdown)
    editElem.appendChild(editDropdown)

    fileElem.addEventListener('mouseover', ()=>backend.dom.toggleElemVisibility(fileDropdown, true))
    fileElem.addEventListener('mouseleave',()=>backend.dom.toggleElemVisibility(fileDropdown, false))
    editElem.addEventListener('mouseover', ()=>backend.dom.toggleElemVisibility(editDropdown, true))
    editElem.addEventListener('mouseleave',()=>backend.dom.toggleElemVisibility(editDropdown, false))
    prefElem.addEventListener('click', openPrefWindow)

    let menuDropdown = backend.elements.dropdownList([fileElem, editElem, prefElem])
    menuDropdown.id = 'menu-dropdown'
    menuContainer.appendChild(menuDropdown)

    return menuDropdown
}