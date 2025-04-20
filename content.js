const popupStylesLink = document.createElement("link");
popupStylesLink.href = chrome.runtime.getURL("popup.css");
popupStylesLink.type = "text/css";
popupStylesLink.rel = "stylesheet";
document.head.appendChild(popupStylesLink);

const loaderStylesLink = document.createElement("link");
loaderStylesLink.href = chrome.runtime.getURL("loader.css");
loaderStylesLink.type = "text/css";
loaderStylesLink.rel = "stylesheet";
document.head.appendChild(loaderStylesLink);

fetch(chrome.runtime.getURL("popup.html"))
    .then(response => response.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));

const excludedChars = ['.', ',', ':', ''];
const popupElId = 'currency-popup';
const popupValueElId = 'currency-converted-amount';
const loaderElId = 'currency-popup-loader';
const GGTranslatorElId = 'gtx-trans';

const debounceValue = 5000;

let lastTextSelected;
let GGTranslatorEl;
let isShowGGTranslator = true;

function debounce(func, timeout = debounceValue) {
    let timer;

    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function updateUserMessage(msg) {
    document.getElementById(popupValueElId).innerText = msg;
}

function showPopup(amount) {
    // get popup container element
    const popup = document.getElementById(popupElId);

    if (!popup) {
        console.error(`Element ${popupElId} not found`);
        return;
    }

    const selection = window?.getSelection();

    if (!selection || !selection?.rangeCount) return;

    // get the range of the selected text
    const range = selection?.getRangeAt(0);

    if (!range) return;

    // get the rect of the range
    const rect = range?.getBoundingClientRect();

    if (!rect) return;

    // Calculate position accounting for scroll
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    popup.style.left = `${rect.left + scrollX}px`;
    popup.style.top = `${rect.bottom + scrollY}px`;

    // update the popup with the amount
    updateUserMessage(amount || '');
    // change the display of the popup to flex
    toggleElement(popupElId, 'flex');
}

function toggleElement(elId, displayType) {
    // get the element by id
    const element = document.getElementById(elId);

    if (!element) {
        console.error(`Element ${elId} not found`);
        return;
    }

    // set the display of the element
    element.style.display = displayType;
}

function sendMessage(key, message) {
    // send message to background.js
    chrome.runtime.sendMessage({ [key]: message });
}

function getCurrencyObj(txt) {
    const regExp = /^\s*[\(\[]?\s*(?:[$€£¥₹])?\s*(\d+(?:\.\d{1,2})?)\s*(?:[$€£¥₹])?\s*[\)\]]?\s*$/;
    const match = txt.match(regExp);

    if (!match) {
        console.error("Invalid currency format");
        return null;
    }

    const numeric = match[1];

    const dirtySymbol = txt.match(/\D/g);
    const currencySymbol = dirtySymbol.filter(char => !excludedChars.includes(char.trim()));

    if (currencySymbol?.length !== 1) return null;

    return { numeric, symbol: currencySymbol[0] };
}

(function findGGTranslator() {
    // Create a new observer instance
    const observer = new MutationObserver((mutationsList) => {

        if (!mutationsList?.length) return;

        mutationsList.forEach(m => {
            if (m.type === 'childList' && m.addedNodes?.length) {
                for (let i = 0; i < m.addedNodes.length; i++) {
                    const currNode = m.addedNodes[i];

                    if (currNode?.id === GGTranslatorElId) {
                        GGTranslatorEl = currNode;
                        toggleElement(GGTranslatorElId, isShowGGTranslator ? 'block' : 'none')
                    };
                }
            };
        });
    });

    // Start observing the document for changes
    observer.observe(document.body, { childList: true, subtree: true });
})();

const debouncedInit = debounce(init, 500);
const debouncedClosePopup = debounce(closePopup);
const debouncedResetLastTextSelected = debounce(() => lastTextSelected = '');

function init(selectedText, ccObj) {
    console.log('Currency Converter started, I\'m here to help!');
    // hide GGTranslator
    isShowGGTranslator = false;
    // set the last selected text
    lastTextSelected = selectedText;
    // reset the last selected text after 5 seconds
    debouncedResetLastTextSelected();
    // toggle popup
    showPopup();
    // toggle loader
    toggleElement(loaderElId, 'block');
    sendMessage('ccObj', ccObj);
}

function closePopup() {
    toggleElement(popupElId, 'none');
    isShowGGTranslator = false;
}

document.addEventListener('mouseup', () => {
    const selectedText = window?.getSelection()?.toString()?.trim();

    if (!selectedText) return;

    const ccObj = getCurrencyObj(selectedText);

    if (!ccObj || lastTextSelected === selectedText) return;

    debouncedInit(selectedText, ccObj);
})

chrome.runtime.onMessage.addListener(async (request, _, sendResponse) => {
    toggleElement(loaderElId, 'none');
    updateUserMessage('₪' + request);
    debouncedClosePopup();

    sendResponse({ status: 'ok' });
    return true;
});