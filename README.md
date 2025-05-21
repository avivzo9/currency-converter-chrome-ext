# Currency Converter Chrome Extension

A simple and intuitive Chrome extension that allows you to instantly convert currency values on any webpage to Israeli Shekel (₪, ILS) by selecting the amount. The extension fetches real-time exchange rates and displays the converted value in a popup near your selection.

## Features
- Instantly convert selected currency values to ILS (₪) on any website
- Supports common currency symbols ($, €, £, ¥, ₹)
- Real-time exchange rates via [FreeCurrencyAPI](https://freecurrencyapi.com/)
- Clean, modern popup UI with loading indicator
- No intrusive UI—only appears when you select a currency value

## How It Works
1. Select a currency value (e.g., "$100" or "€50") on any webpage.
2. A popup appears near your selection, showing the converted amount in ILS.
3. The popup automatically disappears after a few seconds.

## Installation
1. Clone or download this repository.
2. Obtain a free API key from [FreeCurrencyAPI](https://freecurrencyapi.com/).
3. Create a `secrets.json` file in the root directory with the following content:
   ```json
   {
     "API_KEY": "YOUR_API_KEY_HERE"
   }
   ```
4. Open Chrome and go to `chrome://extensions/`.
5. Enable "Developer mode" (top right).
6. Click "Load unpacked" and select the project directory.

## File Structure
- `manifest.json` – Chrome extension manifest
- `background.js` – Handles API requests and currency conversion logic
- `content.js` – Injects popup UI and handles user selection
- `popup.html` – Popup markup
- `popup.css` – Popup styling
- `loader.css` – Loader animation styling
- `.gitignore` – Excludes `secrets.json` from version control

## Notes
- Your API key is stored locally in `secrets.json` and is never exposed publicly.
- The extension only runs on pages you visit and does not collect or transmit any personal data.

## License
MIT
