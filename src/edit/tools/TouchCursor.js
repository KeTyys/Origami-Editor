export class TouchCursor {
    constructor(editor) {
        this.editor = editor;
        this.cursorPoint = null;
        this.touchActive = false;
        this.offset = -30; // Default offset, can be adjusted in preferences
    }

    // Update cursor position based on touch/mouse event
    updateCursor(event) {
        if (!this.touchActive || !this.editor) return;
        
        const touch = event.touches[0];
        const rect = event.target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.cursorPoint = {
            x: x,
            y: y + this.offset
        };
        
        if (this.editor.requestRender) {
            this.editor.requestRender();
        }
    }

    // Start tracking touch
    startTouch(event) {
        this.touchActive = true;
        this.updateCursor(event);
    }

    // End tracking touch
    endTouch() {
        this.touchActive = false;
        this.cursorPoint = null;
        if (this.editor && this.editor.requestRender) {
            this.editor.requestRender();
        }
    }

    // Draw the cursor
    renderCursor(ctx) {
        if (!this.cursorPoint || !this.touchActive) return;
        
        ctx.beginPath();
        ctx.arc(this.cursorPoint.x, this.cursorPoint.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.stroke();

        // Draw a line from touch point to cursor
        ctx.beginPath();
        ctx.moveTo(this.cursorPoint.x, this.cursorPoint.y - this.offset);
        ctx.lineTo(this.cursorPoint.x, this.cursorPoint.y);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.stroke();
    }

    // Get the current cursor position
    getCursorPoint() {
        return this.cursorPoint;
    }

    // Update the offset (can be called when preferences change)
    setOffset(offset) {
        this.offset = offset;
    }
}
