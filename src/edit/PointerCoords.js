import * as backend from "../backend/backend.js"

const interf = document.querySelector('#interface')
const pointerDisplay = document.querySelector('#pointerDisplay')
const pointerX = pointerDisplay.querySelector('#pointerX')
const pointerY = pointerDisplay.querySelector('#pointerY')
const pointer = document.querySelector('#pointer')

// undo/redo container and buttons
const undoRedoContainer = document.createElement('div')
undoRedoContainer.classList.add('hidden', 'md:flex', 'self-center', 'gap-2', 'px-8', 'py-2')
undoRedoContainer.style.display = 'none'

// undo button
const undoButton = document.createElement('button')
undoButton.classList.add('w-[50px]', 'h-[50px]', 'rounded-lg')
undoButton.style.backgroundColor = '#6750A4'
undoButton.style.border = 'none'
undoButton.style.cursor = 'pointer'
const undoImg = document.createElement('img')
undoImg.src = './public/undo.svg'
undoImg.alt = 'Undo'
undoImg.style.filter = 'brightness(0) invert(1)'
undoImg.style.width = '100%'
undoImg.style.height = '100%'
undoButton.appendChild(undoImg)
undoButton.addEventListener('click', backend.shortcuts.handleUndo)

// redo button
const redoButton = document.createElement('button')
redoButton.classList.add('w-[50px]', 'h-[50px]', 'rounded-lg')
redoButton.style.backgroundColor = '#6750A4'
redoButton.style.border = 'none'
redoButton.style.cursor = 'pointer'
const redoImg = document.createElement('img')
redoImg.src = './public/redo.svg'
redoImg.alt = 'Redo'
redoImg.style.filter = 'brightness(0) invert(1)'
redoImg.style.width = '100%'
redoImg.style.height = '100%'
redoButton.appendChild(redoImg)
redoButton.addEventListener('click', backend.shortcuts.handleRedo)

undoRedoContainer.appendChild(undoButton)
undoRedoContainer.appendChild(redoButton)

// Insert the undo/redo container right after pointerDisplay
pointerDisplay.parentNode.insertBefore(undoRedoContainer, pointerDisplay.nextSibling)

export default function trackCoords() {
    // Hide coordinates initially if screen is too narrow
    if (window.innerWidth < 2000) {
        pointerDisplay.style.display = 'none'
        undoRedoContainer.style.display = 'flex'
    }

    interf.addEventListener('mousemove', updateDisplay)
    interf.addEventListener('mouseleave', hideDisplay)
    interf.addEventListener('touchstart', showDisplay)
    interf.addEventListener('touchend', hideDisplay)

    // Update visibility on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth < 2000) {
            pointerDisplay.style.display = 'none'
            undoRedoContainer.style.display = 'flex'
        } else {
            undoRedoContainer.style.display = 'none'
            // Only show coordinates if mouse is over interface
            if (interf.matches(':hover')) {
                pointerDisplay.style.display = 'flex'
            }
        }
    })
}

function updateDisplay(e) {
    e.preventDefault()
    // Only show coordinates if screen is wide enough
    if (window.innerWidth >= 2000) {
        pointerDisplay.style.display = 'flex'
        undoRedoContainer.style.display = 'none'
    }

    let pointerPosition = backend.draw.getPointFromEvent(e)
    let x = Math.round(pointerPosition.x * 100)/100
    let y = Math.round((backend.data.envVar.height - pointerPosition.y) * 100)/100
    pointerX.innerHTML = `x: ${x}`
    pointerY.innerHTML = `y: ${y}`
}

function showDisplay(e) {
    e.preventDefault()
    // Only show coordinates if screen is wide enough
    if (window.innerWidth >= 2000) {
        pointerDisplay.style.display = 'flex'
        undoRedoContainer.style.display = 'none'
    }
}

function hideDisplay(e) {
    e.preventDefault()
    pointerDisplay.style.display = 'none'
    if (window.innerWidth < 2000) {
        undoRedoContainer.style.display = 'flex'
    }
}

export { trackCoords }