// Empty out the children of an element
export function clearChildren(elem) {
    elem.innerHTML = ''
}

// Removes all event listeners from element
export function removeListeners(elem) {
    let newElem = elem.cloneNode(true)
    elem.parentNode.replaceChild(newElem, elem)
}

export function toggleElemVisibility(elem, visible=null) {
    if (visible == null) {
        if (elem.style.visibility == 'visible') {
            elem.style.visibility = 'hidden'
        } else {
            elem.style.visibility = 'visible'
        }
    } else if (visible) {
        elem.style.visibility = 'visible'
    } else {
        elem.style.visibility = 'hidden'
    }
}

export function toggleElemDisplay(elem, display=null, normal='block') {
    if (display == null) {
        if (elem.style.display == normal) {
            elem.style.display = 'none'
        } else {
            elem.style.display = normal
        }
    } else if (display) {
        elem.style.display = normal
    } else {
        elem.style.display = 'none'
    }
}