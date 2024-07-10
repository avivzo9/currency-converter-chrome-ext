console.log('content.js');

document.addEventListener('mouseup', () => {
    const selectedText = window.getSelection()?.toString().trim();
    console.log('selectedText:', selectedText)
    if (selectedText) {
        chrome.runtime.sendMessage({ text: selectedText });
    }
});
