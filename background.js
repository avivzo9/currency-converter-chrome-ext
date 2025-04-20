let apiKey = '';

fetch(chrome.runtime.getURL("secrets.json"))
    .then(response => response.json())
    .then(json => apiKey = json.API_KEY);

console.log('Listening to text...');

const apiUrl = `https://api.freecurrencyapi.com/v1`;

async function sendMessageToContentScript(message) {
    return new Promise((resolve, reject) => {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length) {
                    chrome.tabs.sendMessage(tabs[0].id, message, (response) => resolve(response));
                } else {
                    reject("No active tab found.");
                }
            });
        } catch (err) {
            console.error('sendMessageToContentScript:', err);
            reject(err);
        }
    })
}

async function getCurrencyLatest(currencyCode) {
    try {
        const response = await fetch(apiUrl + `/latest?apikey=${apiKey}&currencies=ILS&base_currency=${currencyCode}`)

        if (!response.ok) throw new Error(`Response status: ${response.status}`);

        const json = await response.json();

        return new Map(Object.entries(json.data));
    } catch (err) {
        console.error('getCurrencyLatest:', err);
    }
}

async function getCurrencies() {
    try {
        const response = await fetch(apiUrl + `/currencies?apikey=${apiKey}&currencies=`);

        if (!response.ok) throw new Error(`Response status: ${response.status}`);

        const json = await response.json();

        return new Map(Object.entries(json.data));
    } catch (err) {
        console.error('getCurrencies:', err);
    }
}

chrome.runtime.onMessage.addListener(async (request) => {
    // Debug:
    // await sendMessageToContentScript(65);
    // return

    const ccObj = request.ccObj;

    console.log('ccObj:', ccObj)
    if (!ccObj) {
        console.log("Invalid currency format");
        return null;
    }

    try {
        const currencies = await getCurrencies();

        let currency = null;

        currencies.forEach((value) => {
            if (value.symbol === ccObj.symbol) currency = value;
        })

        const currencyVals = await getCurrencyLatest(currency.code);

        const result = ccObj.numeric * currencyVals.get('ILS');

        await sendMessageToContentScript(result.toFixed(2));

        return true;
    } catch (err) {
        console.log('listener:', err);
    }
});