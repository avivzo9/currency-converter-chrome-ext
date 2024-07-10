console.log('Listening to text...');

const excludedChars = ['.', ',', ':', ' '];
const apikey = 'fca_live_rWnxw7LNz0YXmt9uosZm46V8K0gSFv3Hpuc61din';
const apiUrl = `https://api.freecurrencyapi.com/v1`;

let lastText = '';

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
    const txt = request.text?.trim();

    if (!txt || txt === lastText) return;

    lastText = txt;

    const ccObj = getCurrencyObj(txt);

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
        console.log('result:', result)

        return true;
    } catch (err) {
        console.log('listener:', err);
    }
});