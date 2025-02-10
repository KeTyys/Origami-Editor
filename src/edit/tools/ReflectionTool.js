import * as backend from "../../backend/backend.js"
import { reflectAndDrawElements } from "../Reflection.js"

window.handleReflect = function() {
    const sourceQuadrant = parseInt(document.getElementById('source-quadrant').value)
    const targetQuadrant = parseInt(document.getElementById('target-quadrant').value)
    
    reflectAndDrawElements(sourceQuadrant, targetQuadrant)
    
    // Hide dialog after reflection
    document.getElementById('reflection-dialog').style.display = 'none'
}