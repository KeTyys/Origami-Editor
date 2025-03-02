import { initialiseHistory } from "./backend/history.js";
import { generateGrid, toggleGrid } from "./edit/Grid.js"
import trackCoords from "./edit/PointerCoords.js"
import initialiseTools from "./edit/tools/Toolbar.js"
import initialiseHeader, { assignTitle } from "./header/Header.js"
import initialiseHelp from "./notifs/Help.js"
import initialiseOverlay from "./notifs/Overlay.js"
import initialiseSidebar from "./sidebar/Sidebar.js"
import initialisePref from "./windows/Preferences.js"
import * as backend from "./backend/backend.js"
import { resetInterface } from "./edit/Plane.js"

export const FOLD = require('fold')

startup()

function startup() {
    initialiseHistory();
    backend.data.retrieveData()
    initialisePref()
    initialiseTools()
    initialiseHeader()
    initialiseSidebar()
    initialiseHelp()
    initialiseOverlay()
    generateGrid()
    backend.draw.drawPattern()
    backend.shortcuts.enableShortcuts()
    trackCoords()
    backend.shortcuts.setSvgPadding()
    resetInterface()
}

function render() {
    generateGrid()
    toggleGrid()
    assignTitle()
    resetInterface()
    backend.draw.drawPattern()
}

export { render }


