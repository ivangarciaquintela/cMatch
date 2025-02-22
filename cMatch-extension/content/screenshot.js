let isSelecting = false;
let selectionBox = null;
let startX, startY;

function createSelectionBox() {
    selectionBox = document.createElement('div');
    selectionBox.id = 'cmatch-selection-box';
    document.body.appendChild(selectionBox);
}

function updateSelectionBox(e) {
    if (!isSelecting) return;

    const currentX = e.pageX;
    const currentY = e.pageY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
}

function captureSelection() {
    const canvas = document.createElement('canvas');
    const rect = selectionBox.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(window, rect.left, rect.top, rect.width, rect.height, 0, 0, rect.width, rect.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startSelection') {
        isSelecting = true;
        createSelectionBox();
        
        document.addEventListener('mousedown', (e) => {
            startX = e.pageX;
            startY = e.pageY;
            selectionBox.style.display = 'block';
        });

        document.addEventListener('mousemove', updateSelectionBox);

        document.addEventListener('mouseup', (e) => {
            isSelecting = false;
            const imageData = captureSelection();
            sendResponse({ imageData });
            selectionBox.remove();
        });

        return true; // Keep the message channel open for async response
    }
}); 