// Delay helper for the service‑worker context
const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Script injected into each Steam “Register a Product Key” page.
 * Runs in the page’s main world, so we re‑declare any helpers it needs.
 */
async function redeemOnPage() {
    // Local delay (the one above isn’t available inside page context)
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // 1. Tick the SSA checkbox
    const checkbox = document.getElementById('accept_ssa');
    if (checkbox && !checkbox.checked) {
        checkbox.click();
    }

    // 2. Wait 100‑500 ms
    await delay(Math.random() * (500 - 100) + 100);

    // 3. Click the “Continue” button (or call the function directly)
    const btn = document.getElementById('register_btn');
    if (btn) {
        ['mousedown', 'mouseup', 'click'].forEach(type => {
            btn.dispatchEvent(
                new MouseEvent(type, {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    button: 0,
                    buttons: 1
                })
            );
        });
    } else if (typeof RegisterProductKey === 'function') {
        RegisterProductKey();
    }
}

// When the extension icon is clicked
chrome.action.onClicked.addListener(async () => {
    // Find all matching tabs in the current window
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        url: 'https://store.steampowered.com/account/registerkey*'
    });

    for (const tab of tabs) {
        // Switch to the tab
        await chrome.tabs.update(tab.id, { active: true });

        // Wait 100‑2000 ms as specified
        await delay(Math.random() * (2000 - 100) + 100);

        // Inject and run the redeem script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: 'MAIN',
            func: redeemOnPage
        });

        // Give Steam a moment to respond before moving on
        await delay(1000);
    }
});
