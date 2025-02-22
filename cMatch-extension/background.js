chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'captureTab') {
        chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 95 }, (dataUrl) => {
            console.log('Screenshot captured successfully');
            sendResponse({ imageData: dataUrl });
        });
        return true; // Keep the message channel open for async response
    }
}); 