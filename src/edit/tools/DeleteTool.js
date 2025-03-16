import * as backend from "../../backend/backend.js"


const screen = document.querySelector('#screen')
const plane = document.querySelector('#plane')

export default function setDeleteTool() {
    screen.style.display = 'none'
    Array.from(plane.children).forEach(line => {
        line.classList.add('selector')
        line.style.strokeWidth = backend.data.envVar.strokeWidth * 1.5
        line.addEventListener('touchend', handleLineDelete)
    })

    return () => {
        Array.from(plane.children).forEach(line => {
            line.classList.remove('selector')
            line.style.strokeWidth = backend.data.envVar.strokeWidth
            line.removeEventListener('touchend', handleLineDelete)
        })
        screen.style.display = 'block'
        backend.draw.drawPattern()
    }
}

function handleLineDelete(e) {
    e.preventDefault()
    let lineElem

    if (e.type === 'touchend') {
        if (e.changedTouches && e.changedTouches[0]) {
            const touch = e.changedTouches[0]
            lineElem = document.elementFromPoint(touch.clientX, touch.clientY)
        }
    } else {
        lineElem = e.target
    }

    if (lineElem && lineElem.tagName.toLowerCase() === 'line') {
        let lineId = lineElem.id
        if (lineId && backend.data.edgeObj[lineId]) {
            backend.data.deleteEdgeSeg(lineId)
            lineElem.remove()
            backend.history.overwriteHistory()
        }
    }
}