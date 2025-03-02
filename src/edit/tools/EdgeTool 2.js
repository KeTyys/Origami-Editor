import * as backend from "../../backend/backend.js"

const edgeTypeMenu = document.querySelector('#edgeTypeMenu')
const currTypeBtn = document.querySelector('#currEdgeType')

function toggleTypesMenu() {
    backend.dom.toggleElemDisplay(edgeTypeMenu)
}

function typeToClass(type) {
    switch(type) {
        case 'M':
            return 'mountain'
        case 'V':
            return 'valley'
        case 'U':
            return 'unassigned'
        case 'F':
            return 'flat'
        case 'B':
            return 'border'
    }
}

function typeToColor(type) {
    switch(type) {
        case 'M':
            return 'red'
        case 'V':
            return 'blue'
        case 'U':
            return 'yellow'
        case 'F':
            return 'grey'
        case 'B':
            return 'black'
    }
}

function handleTypeSelect(e) {
    if (e.target || e.touches) {
        const selectedTypeBtn = (e.target || e.touches[0].target).closest('g')
        
        // change style of current type button
        let selectedType = selectedTypeBtn.children[1].innerHTML
        let selectedTypeClass = typeToClass(selectedType)
        let currTypeClass = typeToClass(currTypeBtn.children[1].innerHTML)
        currTypeBtn.children[1].innerHTML = selectedType
        currTypeBtn.children[0].classList.remove(currTypeClass)
        currTypeBtn.children[0].classList.add(selectedTypeClass)

        // reference new type when drawing lines
        backend.data.envVar.edgeType = selectedType

        // reassign styles to buttons in edge types menu
        let edgeTypes = ['M', 'V', 'U', 'F', 'B'] 
        let idx = 0
        edgeTypes.filter(edgeType => edgeType !== selectedType).forEach(edgeType => {
            const edgeTypeOption = edgeTypeMenu.children[idx]
            const currFillClass = edgeTypeOption.children[0].classList[0]
            edgeTypeOption.children[0].classList.remove(currFillClass)
            edgeTypeOption.children[0].classList.add(typeToClass(edgeType))
            edgeTypeOption.children[1].innerHTML = edgeType
            // console.log(idx, edgeType, typeToColor(edgeType))
            idx += 1
        })

        // change appearance in backend
        selectEdge(selectedType)

        backend.dom.toggleElemDisplay(edgeTypeMenu, false)
    }
}

function selectEdge(edgeType) {
    
    let edgeColor = backend.data.envVar.assignmentColor[edgeType]
    const pointer = document.querySelector('#pointer')
    pointer.style.fill = edgeColor
    let markers = document.querySelector('#markers')
    for (let marker of markers.children) {
        if (marker.tagName == 'circle') {
            marker.style.fill = edgeColor
        } else if (marker.tagName == 'line') {
            marker.style.stroke = edgeColor
        }
    }
}

export { toggleTypesMenu, handleTypeSelect }