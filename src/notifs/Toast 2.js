import * as backend from "../backend/backend.js"

const toast = document.querySelector('#toast')
const toastIcon = document.querySelector('#toastIcon')
const toastText = document.querySelector('#toastText')
const toastClose = document.querySelector('#toastClose')

export default function setToast(type, message) {

    backend.dom.toggleElemDisplay(toast, true, 'flex')
    switch(type) {
        case 'success':
            toastIcon.setAttribute('src','./public/success.svg')
            toastIcon.setAttribute('alt','success icon')
            toast.classList.remove('error')
            toast.classList.add('success')
            break
        case 'error':
            toastIcon.setAttribute('src','./public/error.svg')
            toastIcon.setAttribute('alt','error icon')
            toast.classList.remove('success')
            toast.classList.add('error')
            break
    }
    toastText.innerHTML = message

    toast.classList.add('appear')
    const timeoutId = setTimeout(handleCloseToast, 5000);
    toastClose.addEventListener('click', () => {
        clearTimeout(timeoutId)
        handleCloseToast()
    })
}

function handleCloseToast() {
    toast.classList.remove('appear')
    backend.dom.toggleElemDisplay(toast, false, 'flex')
}