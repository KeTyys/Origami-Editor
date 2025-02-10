import * as backend from "../../backend/backend.js"


const screen = document.querySelector('#screen')
const plane = document.querySelector('#plane')

export default function setDeleteTool() {
    screen.style.display = 'none'
    Array.from(plane.children).forEach(line => {
        line.classList.add('selector')
        line.style.strokeWidth = backend.data.envVar.strokeWidth * 1.5
    })

    return () => {
        Array.from(plane.children).forEach(line => {
            line.classList.remove('selector')
            line.style.strokeWidth = backend.data.envVar.strokeWidth
        })
        screen.style.display = 'block'
        backend.draw.drawPattern()
    }
}