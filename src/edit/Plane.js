import * as backend from "../backend/backend.js"
import { resetActiveTool } from "./tools/Toolbar.js";

function resetInterface() {
    const markers = document.querySelector('#markers')
    const selectors = document.querySelector('#selectors')

    backend.dom.clearChildren(markers)
    backend.dom.clearChildren(selectors)
    resetActiveTool()
}

function resetViewbox() {
    const svg = document.querySelector('svg');
    let viewBox = svg.viewBox.baseVal
    let width = viewBox.width
    let height = viewBox.height
    let x = (backend.data.envVar.width - width) / 2
    let y = (backend.data.envVar.height - height) / 2
    viewBox.x = x
    viewBox.y = y
}

export { resetInterface, resetViewbox }