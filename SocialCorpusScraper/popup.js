document.addEventListener('DOMContentLoaded', function () {
    const bskyStart = document.getElementById('bluesky-logo');
    const mastoStart = document.getElementById('masto-logo');
    const redditStart = document.getElementById('reddit-logo');
    const xStart = document.getElementById('x-logo');
    const errorMsg = document.getElementById('error-msg');

    bskyStart.addEventListener('click', function () {
        const blueskyscraperUrl = 'blueskyscraper/blueskyscraper.html';
        const url = chrome.runtime.getURL(blueskyscraperUrl);
        chrome.tabs.create({ url: url });
        window.close();
    });

    mastoStart.addEventListener('click', function () {
        const mastoscraperUrl = 'mastoscraper/mastoscraper.html';
        const url = chrome.runtime.getURL(mastoscraperUrl);
        chrome.tabs.create({ url: url });
        window.close();
    });

    redditStart.addEventListener('click', function () {
        const redditscraperUrl = 'redditscraper/redditscraper.html';
        const url = chrome.runtime.getURL(redditscraperUrl);
        chrome.tabs.create({ url: url });
        window.close();
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const tab = tabs[0];
        const url = tab ? tab.url : '';
        if (!url.includes('twitter.com/search?')) {
            console.log('Not an X search page');
            errorMsg.style.display = 'inline-block';
            xStart.style.display = 'none';
        } else {
            console.log('X search page detected');
            errorMsg.style.display = 'none';
        }
    });

    xStart.addEventListener('click', function () {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        action: 'scrape',
                    },
                    (response) => {
                        console.log('Response = ', response);
                    }
                );
            }
        );
        window.close();
    });
});
