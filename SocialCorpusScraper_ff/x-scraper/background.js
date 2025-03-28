chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    message: 'request_headers',
                    url: details.url,
                    headers: details.requestHeaders,
                });
            }
        );
    },
    { urls: ['*://x.com/i/api/graphql/*/SearchTimeline?*'] },
    ['requestHeaders']
);

chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    message: 'response_headers',
                    headers: details.responseHeaders,
                });
            }
        );
    },
    { urls: ['*://x.com/i/api/graphql/*/SearchTimeline?*'] },
    ['responseHeaders']
);