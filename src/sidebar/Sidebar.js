import * as backend from "../backend/backend.js"

const sidebarToggle = document.querySelector('#sidebarToggle')
const sidebarBtns = document.querySelector('#sidebarBtns')
// const githubBtn = document.querySelector('#githubBtn')
const tutorialBtn = document.querySelector('#tutorialBtn')
// const surveyBtn = document.querySelector('#surveyBtn')

export default function initialiseSidebar() {

    sidebarToggle.addEventListener('click', toggleSidebar)
    for (let btn of [...Array.from(sidebarBtns.children)]) {
        btn.addEventListener('mouseover', (e) => handleSidebarBtnHover(e, true))
        btn.addEventListener('mouseout', (e) => handleSidebarBtnHover(e, false))
    }

    tutorialBtn.addEventListener('click', handleOpenTutorial)

    function toggleSidebar() {
        if (sidebarBtns.style.visibility == 'visible') {
            sidebarToggle.setAttribute('src', './public/chevron-down.svg')
            sidebarBtns.style.visibility = 'hidden'
        } else {
            sidebarToggle.setAttribute('src', './public/chevron-up.svg')
            sidebarBtns.style.visibility = 'visible'
        }
    }

    function handleSidebarBtnHover(e, showLabel) {
        if (e.target) {
            const btnGrp = e.target.closest('.sidebar-btn-grp')
            const btnLabel = btnGrp.querySelector('.sidebar-btn-label')
            if (showLabel) {
                btnLabel.style.visibility = 'visible'
            } else {
                btnLabel.style.visibility = 'hidden'
            }
        }
    }

    function handleOpenTutorial() {
        const overlay = document.querySelector('#overlay')
        const tutorial = document.querySelector('#tutorial')
        backend.dom.toggleElemVisibility(overlay, true)
        backend.dom.toggleElemVisibility(tutorial, true)
        tutorial.play()
    }
}