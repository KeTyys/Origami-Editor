import { forwardHistory, backHistory } from './history.js'
import { envVar } from './data.js'
import { drawPattern, getPointFromEvent } from './draw.js'
import { events } from './pubsub.js'
import { resetInterface } from '../edit/Plane.js'
import { toggleElemDisplay, toggleElemVisibility } from './dom.js'

const svg = document.querySelector('#interface')

let spaceDown = false
let ctrlDown = false
let altDown = false

let cursorCoord
let isPointerDown = false
let pointerOrigin

let defaultViewBox = envVar.defaultViewBox
let viewBox = svg.viewBox.baseVal
let scale = 0

let touchEventCache = []
let prevDiff = -1
let initialScale = 1

function enableShortcuts() {
    window.addEventListener('resize', setSvgPadding)
    window.addEventListener('keydown', function(e) {
        if (e.repeat) {
            return
        }
        switch(e.code) {
            case 'Space':
                spaceDown = true
                svg.style.cursor = 'move'
                disablePointerEvents()
                break
            case 'ControlLeft' || 'ControlRight':
                e.preventDefault()
                ctrlDown = true
                break
            case 'AltLeft' || 'AltRight':
                e.preventDefault()
                altDown = true
                break
            case 'KeyN':
                if (ctrlDown) handleNewFileClick()
                break
            case 'KeyO':
                if (ctrlDown) handleOpenFilePicker()
                break
            case 'KeyS':
                if (ctrlDown && altDown) {
                    openExportForm()
                } else if (ctrlDown) {
                    handleSaveClick()
                }
                break
            case 'KeyY':
                if (ctrlDown) handleRedo(e)
                break
            case 'KeyZ':
                if (ctrlDown) handleUndo(e)
                break
            case 'Equal':
                if (ctrlDown) e.preventDefault(); handleZoom(true)
                break
            case 'Minus':
                if (ctrlDown) e.preventDefault(); handleZoom(false)
                break
            case 'Escape':
                const prefWindow = document.querySelector('#preferences')
                const overlay = document.querySelector('#overlay')
                if (prefWindow && prefWindow.style.display !== 'none') {
                    toggleElemVisibility(prefWindow, false)
                    toggleElemVisibility(overlay, false)
                }
                resetInterface()
                break
            case 'KeyR':
                if (ctrlDown) {
                    e.preventDefault()
                    handleResetView()
                }
                break
        }  
    })
    window.addEventListener('keyup', function(e) {
        switch(e.code) {
            case 'Space':
                spaceDown = false
                svg.style.cursor = 'default'
                svg.dispatchEvent(new Event('spaceclickup'))
                enablePointerEvents()
                break
            case 'ControlLeft' || 'ControlRight':
                ctrlDown = false
                break
            case 'AltLeft' || 'AltRight':
                altDown = false
                break
        }
    })
    svg.addEventListener('mousedown', function (e1) {
        let e2 = new Event('spaceclickdown')
        e2.clientX = e1.clientX
        e2.clientY = e1.clientY
        if (e1.button === 0 && spaceDown) {
            svg.dispatchEvent(e2)
        } else if (e1.button === 1) {
            svg.dispatchEvent(e2)
            svg.style.cursor = 'move'
        }
    })
    svg.addEventListener('mouseup', function (e1) {
        let e2 = new Event('spaceclickup')
        e2.clientX = e1.clientX
        e2.clientY = e1.clientY
        if (e1.button === 0 && spaceDown) {
            svg.dispatchEvent(e2)
        } else if (e1.button === 1) {
            svg.dispatchEvent(e2)
            svg.style.cursor = 'default'
        }
    })
    svg.addEventListener('spaceclickdown', onPointerDown) // Pressing the mouse
    svg.addEventListener('spaceclickup', onPointerUp) // Releasing the mouse
    svg.addEventListener('mouseleave', onPointerUp) // Mouse gets out of the SVG area
    svg.addEventListener('mousemove', onPointerMove) // Mouse is moving
    svg.addEventListener('wheel', onScroll)
    svg.addEventListener('pointerdown', onTouchDown)
    svg.addEventListener('pointermove', onTouchMove)
    svg.addEventListener('pointerup', onTouchUp)
    svg.addEventListener('pointercancel', onTouchUp)
    svg.addEventListener('pointerout', onTouchUp)
    svg.addEventListener('pointerleave', onTouchUp)

    // Add touch event listeners for pinch zoom
    svg.addEventListener('touchstart', onTouchStart)
    svg.addEventListener('touchmove', onTouchMove)
    svg.addEventListener('touchend', onTouchEnd)
    svg.addEventListener('touchcancel', onTouchEnd)

    return () => {
        // ... existing cleanup ...
        svg.removeEventListener('touchstart', onTouchStart)
        svg.removeEventListener('touchmove', onTouchMove)
        svg.removeEventListener('touchend', onTouchEnd)
        svg.removeEventListener('touchcancel', onTouchEnd)
    }
}

function onPointerDown(e) {
    isPointerDown = true
    pointerOrigin = getPointFromEvent(e)
}
function onPointerUp() {
    isPointerDown = false
  }

function onPointerMove (e) {
    e.preventDefault();

    cursorCoord = getPointFromEvent(e)
    if (isPointerDown) {
        viewBox.x -= (cursorCoord.x - pointerOrigin.x)
        viewBox.y -= (cursorCoord.y - pointerOrigin.y)
    }
  }

function onScroll(e) {
    e.preventDefault()

    // restrict scale
    scale += e.deltaY * -0.001
    scale = Math.min(Math.max(-2, scale), 1)

    // scale width and height
    let newWidth = defaultViewBox.width - envVar.width * scale
    let newHeight = defaultViewBox.height - envVar.height * scale

    // adjust viewbox
    viewBox.width = newWidth
    viewBox.height = newHeight
    
    viewBox.x = cursorCoord.x - e.offsetX * envVar.width / svg.children[0].getBoundingClientRect().width + envVar.svgPadding.x * envVar.width / svg.children[0].getBoundingClientRect().width
    viewBox.y = cursorCoord.y - e.offsetY * envVar.height / svg.children[0].getBoundingClientRect().height + envVar.svgPadding.y * envVar.height / svg.children[0].getBoundingClientRect().height

}

function onTouchDown(e) {
    // Cache the touch points
    touchEventCache.push(e)

    if (touchEventCache.length === 2) {
        // Prevent default zooming
        e.preventDefault()
    }
}

function onTouchMove(e) {
    e.preventDefault()

    if (touchEventCache.length === 2 && e.touches.length === 2) {
        // Calculate current distance between touch points
        const diffX = e.touches[0].clientX - e.touches[1].clientX
        const diffY = e.touches[0].clientY - e.touches[1].clientY
        const currentDiff = Math.sqrt(diffX * diffX + diffY * diffY)

        // If the distance changed significantly enough (to avoid jitter)
        if (Math.abs(currentDiff - prevDiff) > 10) {
            // Determine zoom direction
            const zoomIn = currentDiff > prevDiff

            // Calculate zoom factor based on the difference
            const zoomFactor = Math.abs(currentDiff - prevDiff) / 200
            
            // Apply zoom
            handleZoom(zoomIn, zoomFactor)

            // Cache the new difference
            prevDiff = currentDiff
        }
    }
}

function onTouchUp(e) {
    // Remove this touch point from the cache
    for (let i = 0; i < touchEventCache.length; i++) {
        if (touchEventCache[i].pointerId === e.pointerId) {
            touchEventCache.splice(i, 1)
            break
        }
    }

    // If the number of pointers is less than two, reset diff tracker
    if (touchEventCache.length < 2) {
        prevDiff = -1
    }
}

function disablePointerEvents() {
    const screen = document.querySelector('#screen')
    screen.style.pointerEvents = 'none'
}

function enablePointerEvents() {
    const screen = document.querySelector('#screen')
    screen.style.pointerEvents = ''
}

function handleUndo(e) {
    e.preventDefault()
    backHistory()
    drawPattern()
    resetInterface()
}

function handleRedo(e) {
    e.preventDefault()
    forwardHistory()
    drawPattern()
    resetInterface()
}

function handleZoom(zoomIn = true, factor = 0.1) {
    const svg = document.querySelector('#interface')
    let viewBox = svg.viewBox.baseVal
    let svgRect = svg.getBoundingClientRect()

    // Calculate new dimensions based on zoom factor
    let newWidth = zoomIn ? 
        viewBox.width - envVar.width * factor : 
        viewBox.width + envVar.width * factor
    let newHeight = zoomIn ? 
        viewBox.height - envVar.height * factor : 
        viewBox.height + envVar.height * factor

    // Clamp viewbox width and height
    newWidth = Math.min(Math.max(envVar.defaultViewBox.width - envVar.width, newWidth), 
        envVar.defaultViewBox.width + 2 * envVar.width)
    newHeight = Math.min(Math.max(envVar.defaultViewBox.height - envVar.height, newHeight), 
        envVar.defaultViewBox.height + 2 * envVar.height)

    viewBox.width = newWidth
    viewBox.height = newHeight

    // Center the viewbox
    viewBox.x = envVar.width / 2 - svgRect.width / 2 * envVar.width / svg.children[0].getBoundingClientRect().width + 
        envVar.svgPadding.x * envVar.width / svg.children[0].getBoundingClientRect().width
    viewBox.y = envVar.height / 2 - svgRect.height / 2 * envVar.height / svg.children[0].getBoundingClientRect().height + 
        envVar.svgPadding.y * envVar.height / svg.children[0].getBoundingClientRect().height
}

function setSvgPadding() {
    const svg = document.querySelector('#interface')
    let svgDim = svg.getBoundingClientRect()

    if (svgDim.height > svgDim.width) {
        envVar.svgPadding.x = 0    
        envVar.svgPadding.x = (svgDim.height - svgDim.width) / 2

    } else {
        envVar.svgPadding.x = (svgDim.width - svgDim.height) / 2
        envVar.svgPadding.y = 0
    }
}

function handleResetView(e) {
    if (e) {
        e.preventDefault()
    }
    const svg = document.querySelector('#interface')
    let viewBox = svg.viewBox.baseVal
    
    // Reset scale
    scale = 0
    
    // Reset position to center
    viewBox.x = (envVar.width - viewBox.width) / 2
    viewBox.y = (envVar.height - viewBox.height) / 2
}

function onTouchStart(e) {
    // Cache the touch points
    for (let i = 0; i < e.touches.length; i++) {
        touchEventCache.push(e.touches[i])
    }

    // If two fingers touched, prevent default to enable pinch
    if (touchEventCache.length === 2) {
        e.preventDefault()
        
        // Calculate initial distance between touch points
        const diffX = touchEventCache[0].clientX - touchEventCache[1].clientX
        const diffY = touchEventCache[0].clientY - touchEventCache[1].clientY
        prevDiff = Math.sqrt(diffX * diffX + diffY * diffY)
    }
}

function onTouchEnd(e) {
    // Remove changed touches from the cache
    for (let i = 0; i < touchEventCache.length; i++) {
        if (e.touches.length === 0 || 
            (touchEventCache[i].identifier !== e.touches[0]?.identifier && 
             touchEventCache[i].identifier !== e.touches[1]?.identifier)) {
            touchEventCache.splice(i, 1)
            i--
        }
    }

    // Reset difference tracker if less than 2 touches
    if (touchEventCache.length < 2) {
        prevDiff = -1
    }
}

export { enableShortcuts, handleUndo, handleRedo, handleZoom, handleResetView, setSvgPadding }