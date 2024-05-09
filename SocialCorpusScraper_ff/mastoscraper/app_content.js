console.log('Masto application content script loaded');

function isAppUrl(url) {
    return url.includes('applications/');
}

if (isAppUrl(window.location.href)) {
    console.log('Copy buttons injected');
    const credTable = document.querySelector('.table');
    const tBody = credTable.querySelector('tbody');
    const keyContainer = tBody.firstElementChild;
    const clientKeyRow = keyContainer.querySelector('td');
    const clientKey = clientKeyRow.textContent;
    console.log('Client key = ', clientKey);
    const secretContainer = keyContainer.nextElementSibling;
    const clientSecretRow = secretContainer.querySelector('td');
    const clientSecret = clientSecretRow.textContent;
    console.log('Client secret = ', clientSecret);

    const copyKeyBtn = document.createElement('button');
    copyKeyBtn.classList.add('masto-scraper');
    copyKeyBtn.textContent = 'Copy';
    clientKeyRow.appendChild(copyKeyBtn);

    const copySecretBtn = document.createElement('button');
    copySecretBtn.classList.add('masto-scraper');
    copySecretBtn.textContent = 'Copy';
    clientSecretRow.appendChild(copySecretBtn);

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

    copyKeyBtn.addEventListener('click', () => {
        writeToClipboard(clientKey);
        clientKeyRow.style.color = '#4a905f';
        copyKeyBtn.style.backgroundColor = '#4a905f';
        setTimeout(() => {
            clientKeyRow.removeAttribute('style');
            copyKeyBtn.removeAttribute('style');
        }, 1000);
    });

    copySecretBtn.addEventListener('click', () => {
        writeToClipboard(clientSecret);
        clientSecretRow.style.color = '#4a905f';
        copySecretBtn.style.backgroundColor = '#4a905f';
        setTimeout(() => {
            clientSecretRow.removeAttribute('style');
            copySecretBtn.removeAttribute('style');
        }, 1000);
    });
}
