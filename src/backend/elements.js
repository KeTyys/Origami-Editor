function svg(width, height) {
    const NS = 'http://www.w3.org/2000/svg'
        
    const svgElem = document.createElementNS(NS,'svg')
    svgElem.setAttribute('width',width)
    svgElem.setAttribute('height',height)

    return svgElem
}

function circle(r, cx, cy, style) {
    const NS = 'http://www.w3.org/2000/svg'

    const circleElem = document.createElementNS(NS,'circle')
    circleElem.setAttribute('r',r)
    circleElem.setAttribute('cx',cx)
    circleElem.setAttribute('cy',cy)
    circleElem.setAttribute('style',style)
        
    return circleElem
}

function line(x1, y1, x2, y2, style, id='') {

    const NS = 'http://www.w3.org/2000/svg'

    const lineElem = document.createElementNS(NS,'line')
    lineElem.setAttribute('x1',x1)
    lineElem.setAttribute('y1',y1)
    lineElem.setAttribute('x2',x2)
    lineElem.setAttribute('y2',y2)
    lineElem.setAttribute('style',style)
    if (id) {
        lineElem.id = id
    }
    return lineElem
}

function dropdownItem(text, icon=undefined, shortcut=undefined, dropdown=false) {
    const textElem = document.createElement('div')
    textElem.innerHTML = text
    const containerElem = document.createElement('div')
    
    if (icon) {
        const iconContainer = document.createElement('div')
        iconContainer.classList.add('dropdown-item-container')
        const iconElem = document.createElement('img')
        iconElem.src = `./public/${icon}.svg`
        iconContainer.append(iconElem, textElem)
        containerElem.appendChild(iconContainer)
    } else {
        containerElem.appendChild(textElem)
    }
    if (shortcut) {
        const shortcutElem = document.createElement('div')
        shortcutElem.innerHTML = shortcut
        containerElem.appendChild(shortcutElem)
    }
    if (dropdown) {
        const chevronElem = document.createElement('img')
        chevronElem.src = './public/chevron-right.svg'
        containerElem.appendChild(chevronElem)
    }
    
    containerElem.classList.add('dropdown-item')
    return containerElem
}

function dropdownList(items) {
    const dropdownElem = document.createElement('div')
    dropdownElem.append(...items)
    dropdownElem.classList.add('dropdown')
    return dropdownElem
}



export {svg, circle, line, dropdownList, dropdownItem}