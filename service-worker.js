// import { setupListeners } from './handlers/listeners';

function start() {
    console.log('XP Helper service worker loaded...');

    chrome.runtime.onMessage.addListener(onMessage);
    chrome.tabs.onUpdated.addListener(onTabUpdated);
}

const onMessage = async (message, sender, sendResponse) => {

    if ( message.action === 'getUrlPath' ) {
        const url = new URL(sender.tab.url);
        sendResponse( url.pathname + url.hash);
    }

    if ( message.action === 'storeData' ) {
        const preparedData = {};
        preparedData[message.key] = message.data;

        await chrome.storage.session.set(preparedData)
    }

    if ( message.action === 'retrieveData' ) {
        sendResponse(await chrome.storage.session.get([message.key]))
    }

}

const onTabUpdated = async (tabId, changeInfo, tab) => {

    if (changeInfo.status === 'complete') {

        // Get the URL path
        const url = new URL(tab.url);
        const urlPath = url.pathname + url.hash;

        // Send data to the tab
        await chrome.tabs.sendMessage(tabId, {
            urlPath
        });

    }

}

start();
