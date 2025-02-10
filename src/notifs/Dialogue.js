import * as backend from "../backend/backend.js"

const overlay = document.querySelector('#overlay')
let dialogue = document.querySelector('#dialogue')

export default function setDialogue(title, text, leftBtn, rightBtn, leftHandler, rightHandler) {
    backend.dom.removeListeners(dialogue)
    dialogue = document.querySelector('#dialogue')
    const dialogueTitle = document.querySelector('#dialogue-title')
    const dialogueClose = document.querySelector('#dialogue-close')
    const dialogueText = document.querySelector('#dialogue-text')
    const dialogueLeft = document.querySelector('#dialogue-btn-left')
    const dialogueRight = document.querySelector('#dialogue-btn-right')
    
    dialogueTitle.innerHTML = title
    dialogueClose.addEventListener('click', closeDialogue)
    dialogueText.innerHTML = text
    dialogueLeft.innerHTML = leftBtn
    dialogueLeft.addEventListener('click', handleLeftDialogueClick)
    dialogueRight.innerHTML = rightBtn
    dialogueRight.addEventListener('click', handleRightDialogueClick)
    backend.dom.toggleElemVisibility(overlay, true)
    backend.dom.toggleElemVisibility(dialogue, true)
    
    function closeDialogue() {
        backend.dom.toggleElemVisibility(overlay, false)
        backend.dom.toggleElemVisibility(dialogue, false)
    }

    function handleLeftDialogueClick(e) {
        e.preventDefault()
        closeDialogue()
        leftHandler(e)
    }

    function handleRightDialogueClick(e) {
        e.preventDefault()
        closeDialogue()
        rightHandler(e)
    }
}