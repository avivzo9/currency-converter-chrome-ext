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

const excludedChars = ['.', ',', ':', ' '];
const popupElId = 'currency-popup';
const popupValueElId = 'currency-converted-amount';
const loaderElId = 'currency-popup-loader';
let lastTextSelected;

function debounce(func, timeout = 1000) {
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
    const rect = range.getBoundingClientRect();

    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom}px`;

    updateUserMessage(amount || '');

    toggleElement(popupElId, 'flex');
}

function toggleElement(elId, displayType) {
    const element = document.getElementById(elId);
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

        const currencySymbol = txt.match(/\D/g);
        const filtterdSymbol = currencySymbol.filter(char => !excludedChars.includes(char.trim()));

        if (filtterdSymbol?.length !== 1) return null;

        return {
            numeric,
            symbol: filtterdSymbol[0]
        };
    } else {
        console.log("Invalid currency format");
        return null;
    }
}

const debouncedSendMessage = debounce(sendMessage);
const debouncedCloseMessage = debounce(toggleElement, 7000);
const debouncedResetLastTextSelected = debounce(() => lastTextSelected = '', 6000);

document.addEventListener('mouseup', () => {
    const selectedText = window.getSelection()?.toString().trim();
    const ccObj = getCurrencyObj(selectedText);

    if (!selectedText || !ccObj) return;

    if (lastTextSelected === selectedText) return;

    lastTextSelected = selectedText;
    debouncedResetLastTextSelected();

    toggleElement(loaderElId, 'block');
    showPopup();
    debouncedSendMessage('ccObj', ccObj);
});

chrome.runtime.onMessage.addListener(async (res) => {
    toggleElement(loaderElId, 'none');
    showPopup('₪' + res);
    debouncedCloseMessage(popupElId, 'none');
})