console.log('Reddit application content script loaded');

function isAppUrl(url) {
    return url.includes('prefs/apps');
}

if (isAppUrl(window.location.href)) {
    const devApps = document.querySelectorAll('li.developed-app');
    console.log('Developed apps = ', devApps);

    for (let da of devApps) {
        const appDetailContainer = da.querySelector('div.app-details');
        console.log('App detail container = ', appDetailContainer);

        const editAppContainer = da.querySelector('div.edit-app');
        editAppContainer.style.display = 'block';

        const copyKeyBtn = document.createElement('button');
        copyKeyBtn.classList.add('reddit-scraper');
        copyKeyBtn.textContent = 'Copy ID';
        appDetailContainer.appendChild(copyKeyBtn);

        const appID =
            appDetailContainer.lastElementChild.previousElementSibling
                .textContent;

        copyKeyBtn.addEventListener('click', () => {
            writeToClipboard(appID);
            appDetailContainer.style.color = '#4a905f';
            copyKeyBtn.style.backgroundColor = '#4a905f';
            setTimeout(() => {
                appDetailContainer.removeAttribute('style');
                copyKeyBtn.removeAttribute('style');
            }, 1000);
        });

        const editAppForm = da.querySelector('div.edit-app-form');
        const prefTable = editAppForm.querySelector('table.preftable');
        const appSecretContainer = prefTable.querySelector('.prefright');
        const appSecret = appSecretContainer.textContent;

        const copySecretBtn = document.createElement('button');
        copySecretBtn.classList.add('reddit-scraper');
        copySecretBtn.textContent = 'Copy secret';
        appSecretContainer.appendChild(copySecretBtn);

        copySecretBtn.addEventListener('click', () => {
            writeToClipboard(appSecret);
            appSecretContainer.style.color = '#4a905f';
            copySecretBtn.style.backgroundColor = '#4a905f';
            setTimeout(() => {
                appSecretContainer.removeAttribute('style');
                copySecretBtn.removeAttribute('style');
            }, 1000);
            window.close();
        });
    }

    function writeToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;

        textarea.select();

        try {
            navigator.clipboard
                .writeText(textarea.value)
                .then(() => {
                    console.log('Text copied to clipboard:', text);
                })
                .catch((err) => {
                    console.error('Failed to copy text to clipboard:', err);
                });
        } catch (err) {
            console.error('Clipboard write operation not supported:', err);
        }
    }
}
