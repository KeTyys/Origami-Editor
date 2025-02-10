import * as backend from "../backend/backend.js"

const overlay = document.querySelector('#overlay')

export default function initialiseOverlay() {
    overlay.addEventListener('click', closeOverlay)

    function closeOverlay(e) {
        if (e.target.id == 'overlayBg') {
            for (let childElem of Array.from(overlay.children)) {
                if (childElem.id !== 'overlayBg') {
                    backend.dom.toggleElemVisibility(childElem, false)
                    if (childElem.id == 'tutorial') {
                        childElem.pause();
                        childElem.currentTime = 0
                    }
                }
            }
            backend.dom.toggleElemVisibility(overlay, false)
        }
    }
}