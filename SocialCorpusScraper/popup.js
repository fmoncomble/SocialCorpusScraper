document.addEventListener('DOMContentLoaded', function () {
    const versionDiv = document.getElementById('version-div');
    const manifest = chrome.runtime.getManifest();
    versionDiv.textContent = `${manifest.version_name}`;

    const moduleSelect = document.getElementById('module-select');
    const errorMsg = document.getElementById('error-msg');

    const blueskyscraperUrl = 'blueskyscraper/blueskyscraper.html';
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
                url = blueskyscraperUrl;
            } else if (module === 'masto') {
                url = mastoscraperUrl;
            } else if (module === 'reddit') {
                url = redditscraperUrl;
            }
            chrome.tabs.create({ url: url });
            window.close();
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
