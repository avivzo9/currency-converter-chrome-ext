console.log('Listening to text...');

const apikey = 'fca_live_rWnxw7LNz0YXmt9uosZm46V8K0gSFv3Hpuc61din';
const apiUrl = `https://api.freecurrencyapi.com/v1`;

let lastText = '';

async function sendMessageToContentScript(message) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, message, (response) => resolve(response));
            } else {
                reject("No active tab found.");
            }
        });
    })
}

async function getCurrencyLatest(currencyCode) {
    try {
        const response = await fetch(apiUrl + `/latest?apikey=${apikey}&currencies=ILS&base_currency=${currencyCode}`)

        if (!response.ok) throw new Error(`Response status: ${response.status}`);

        const json = await response.json();

        return new Map(Object.entries(json.data));
    } catch (err) {
        console.log('getCurrencyLatest:', err);
    }
}

async function getCurrencies() {
    try {
        const response = await fetch(apiUrl + `/currencies?apikey=${apikey}&currencies=`);

        if (!response.ok) throw new Error(`Response status: ${response.status}`);

        const json = await response.json();

        return new Map(Object.entries(json.data));
    } catch (err) {
        console.log('getCurrencies:', err);
    }
}

chrome.runtime.onMessage.addListener(async (request) => {
    // Debug:
    // await sendMessageToContentScript(65);
    // return

    const ccObj = request.ccObj;

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