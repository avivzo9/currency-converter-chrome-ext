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

let hasSelection = false;
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
    const popup = document.getElementById(popupElId);
    const range = window.getSelection().getRangeAt(0);
    const rect = range?.getBoundingClientRect();

    if (!rect) return;

    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom}px`;

    updateUserMessage(amount || '');
    toggleElement(popupElId, 'flex');
}

function toggleElement(elId, displayType) {
    const element = document.getElementById(elId);

    if (!element) {
        console.error(`Element ${elId} not found`);
        return;
    }

    element.style.display = displayType;
}

function sendMessage(key, message) {
    chrome.runtime.sendMessage({ [key]: message });
}

function getCurrencyObj(txt) {
    console.log("Selected text:", txt);
    const regExp = /^\s*(?:[$€£¥₹])\s*(\d+(?:\.\d{1,2})?)\s*(?:[$€£¥₹]?)\s*$/;
    const match = txt.match(regExp);

    if (match) {
        const numeric = match[1];

        const dirtySymbol = txt.match(/\D/g);
        console.log('dirtySymbol:', dirtySymbol)
        const currencySymbol = dirtySymbol.filter(char => !excludedChars.includes(char.trim()));
        console.log('currencySymbol:', currencySymbol)

        if (currencySymbol?.length !== 1) return null;

        return {
            numeric,
            symbol: currencySymbol[0]
        };
    } else {
        console.log("Invalid currency format");
        return null;
    }
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

const debouncedSendMessage = debounce(sendMessage);
const debouncedCloseMessage = debounce(toggleElement);
const debouncedResetLastTextSelected = debounce(() => lastTextSelected = '');
const debouncedHideGGTranslator = debounce(() => isShowGGTranslator = true);

function init(selectedText, ccObj) {
    isShowGGTranslator = false;
    lastTextSelected = selectedText;
    debouncedResetLastTextSelected();
    toggleElement(loaderElId, 'block');
    showPopup();
    debouncedSendMessage('ccObj', ccObj);
}

document.addEventListener('mouseup', () => {
    const selectedText = window.getSelection()?.toString().trim();
    const ccObj = getCurrencyObj(selectedText);

    if (!selectedText || !ccObj || lastTextSelected === selectedText) return;

    init(selectedText, ccObj);
});

chrome.runtime.onMessage.addListener(async (res) => {
    toggleElement(loaderElId, 'none');
    showPopup('₪' + res);
    debouncedCloseMessage(popupElId, 'none');
    debouncedHideGGTranslator();
})