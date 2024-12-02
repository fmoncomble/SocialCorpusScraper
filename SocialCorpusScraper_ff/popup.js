document.addEventListener('DOMContentLoaded', function () {
    const versionDiv = document.getElementById('version-div');
    const manifest = chrome.runtime.getManifest();
    versionDiv.textContent = `${manifest.version}`;

    const moduleSelect = document.getElementById('module-select');
    const errorMsg = document.getElementById('error-msg');

    const blueskyscraperUrl = 'blueskyscraper/blueskyscraper.html';
    const blueskystreamerUrl = 'blueskyscraper/blueskystreamer.html';
    const mastoscraperUrl = 'mastoscraper/mastoscraper.html';
    const redditscraperUrl = 'redditscraper/redditscraper.html';

    moduleSelect.addEventListener('change', () => {
        const module = moduleSelect.value;
        let url;
        if (module === 'twitter') {
            chrome.tabs.query(
                { active: true, currentWindow: true },
                function (tabs) {
                    const tab = tabs[0];
                    const url = tab ? tab.url : '';
                    if (!url.includes('x.com/search?')) {
                        console.log('Not an X search page');
                        errorMsg.style.display = 'inline-block';
                    } else {
                        console.log('X search page detected');
                        errorMsg.style.display = 'none';
                        injectXModal();
                        window.close();
                    }
                }
            );
        } else if (!module) {
            errorMsg.style.display = 'none';
        } else {
            if (module === 'bsky') {
                const bskyModulesDiv = document.getElementById('bsky-modules');
                bskyModulesDiv.style.display = 'block';
                const searchBtn = document.getElementById('search-btn');
                const streamBtn = document.getElementById('stream-btn');
                searchBtn.onclick = () => {
                    chrome.tabs.create({ url: blueskyscraperUrl });
                    window.close();
                };
                streamBtn.onclick = () => {
                    chrome.tabs.create({ url: blueskystreamerUrl });
                    window.close();
                };
            } else if (module === 'masto') {
                chrome.tabs.create({ url: mastoscraperUrl });
                window.close();
            } else if (module === 'reddit') {
                chrome.tabs.create({ url: redditscraperUrl });
                window.close();
            }
        }
    });

    function injectXModal() {
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
    }
});
