console.log('X-Scraper content script injected');

let i = 1;
let tweetCount = 0;
let file;
let abort = false;
let tweetSet;
let csvData;

const modal = document.createElement('div');
modal.setAttribute('id', 'modal');
document.body.before(modal);

const scrapeFrame = document.createElement('div');
scrapeFrame.setAttribute('id', 'scrape-frame');
modal.appendChild(scrapeFrame);

const closeButton = document.createElement('span');
closeButton.setAttribute('id', 'close-button');
closeButton.textContent = '×';
scrapeFrame.appendChild(closeButton);

const titleDiv = document.createElement('div');
titleDiv.setAttribute('id', 'title-div');
titleDiv.textContent = '𝕏-Scraper';
scrapeFrame.appendChild(titleDiv);

const scrapeUIContainer = document.createElement('div');
scrapeUIContainer.setAttribute('id', 'scrape-ui-container');
scrapeFrame.appendChild(scrapeUIContainer);

const maxTweetsInput = document.createElement('input');
maxTweetsInput.setAttribute('id', 'max-tweets-input');
maxTweetsInput.setAttribute('type', 'number');
maxTweetsInput.setAttribute('name', 'max-tweets-input');
const maxTweetsInputLabel = document.createElement('label');
maxTweetsInputLabel.setAttribute('for', 'max-tweets-input');
maxTweetsInputLabel.textContent = 'Max tweets: ';
scrapeUIContainer.appendChild(maxTweetsInputLabel);
scrapeUIContainer.appendChild(maxTweetsInput);

let maxTweets;
maxTweetsInput.addEventListener('change', () => {
    maxTweets = maxTweetsInput.value;
});

const formatDiv = document.createElement('div');
formatDiv.setAttribute('id', 'format-div');
scrapeUIContainer.appendChild(formatDiv);

const formatSelect = document.createElement('select');
formatSelect.setAttribute('id', 'format-select');
formatSelect.setAttribute('name', 'format-select');
formatSelect.classList.add('x-scraper');
const xml = new Option('XML/XTZ', 'xml');
const txt = new Option('TXT', 'txt');
const csv = new Option('CSV', 'csv');
const xlsx = new Option('XLSX', 'xlsx');
const json = new Option('JSON', 'json');
formatSelect.appendChild(xml);
formatSelect.appendChild(txt);
formatSelect.appendChild(csv);
formatSelect.appendChild(xlsx);
formatSelect.appendChild(json);
const formatSelectLabel = document.createElement('label');
formatSelectLabel.setAttribute('for', 'format-select');
formatSelectLabel.textContent = 'Select output file format: ';
formatDiv.appendChild(formatSelectLabel);
formatDiv.appendChild(formatSelect);

const buttonDiv = document.createElement('div');
buttonDiv.setAttribute('id', 'button-div');
scrapeUIContainer.appendChild(buttonDiv);
const scrapeButton = document.createElement('button');
scrapeButton.setAttribute('id', 'scrape-button');
scrapeButton.classList.add('x-scraper');
scrapeButton.textContent = 'Start scraping';
const stopButton = document.createElement('button');
stopButton.setAttribute('id', 'stop-button');
stopButton.classList.add('x-scraper');
stopButton.textContent = 'Stop scraping';
buttonDiv.appendChild(scrapeButton);
buttonDiv.appendChild(stopButton);

const processContainer = document.createElement('div');
processContainer.setAttribute('id', 'process-container');
scrapeUIContainer.appendChild(processContainer);

let fileFormat = 'xml';

const resetDiv = document.createElement('div');
resetDiv.setAttribute('id', 'reset-div');
const resetMsg = document.createElement('div');
resetMsg.textContent =
    'You can also resume scraping or click "Reset" to start afresh';
const resumeButton = document.createElement('button');
resumeButton.setAttribute('id', 'resume-button');
resumeButton.classList.add('x-scraper');
resumeButton.textContent = 'Resume';
const resetButton = document.createElement('button');
resetButton.setAttribute('id', 'reset-button');
resetButton.classList.add('x-scraper');
resetButton.textContent = 'Reset';
resetDiv.appendChild(resetMsg);
resetDiv.appendChild(resumeButton);
resetDiv.appendChild(resetButton);

function resetInterface() {
    window.scrollTo(0, 0);
    tweetSet = new Set();
    i = 1;
    tweetCount = 0;
    scrapeButton.removeAttribute('style');
    stopButton.removeAttribute('style');
    downloadButton.removeAttribute('style');
    maxTweetsInput.value = '';
    maxTweets = '';
    maxTweetsInput.removeAttribute('style');
    maxTweetsInputLabel.removeAttribute('style');
    formatDiv.removeAttribute('style');
    formatSelect.value = 'xml';
    fileFormat = 'xml';
    downloadButton.textContent = 'Download ' + fileFormat.toUpperCase();
    processContainer.textContent = '';
    downloadResult.textContent = '';
    resetDiv.removeAttribute('style');
    resetMsg.textContent =
        'You can also resume or click "Reset" to start afresh';
    resumeButton.style.display = 'inline-block';
}

window.onclick = function (event) {
    if (event.target == modal) {
        abort = true;
        modal.style.display = 'none';
    }
};
closeButton.addEventListener('click', () => {
    abort = true;
    modal.style.display = 'none';
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        abort = true;
        modal.style.display = 'none';
    }
});

formatSelect.addEventListener('change', () => {
    fileFormat = formatSelect.value;
    downloadButton.textContent = `Download ${fileFormat.toUpperCase()}`;
});

const downloadDiv = document.createElement('div');
downloadDiv.setAttribute('id', 'download-div');
const downloadButton = document.createElement('button');
downloadButton.setAttribute('id', 'download-button');
downloadButton.classList.add('x-scraper');
downloadButton.textContent = `Download ${fileFormat.toUpperCase()}`;
downloadDiv.appendChild(downloadButton);
scrapeUIContainer.appendChild(downloadDiv);

const downloadResult = document.createElement('div');
downloadResult.setAttribute('id', 'dl-result');
downloadDiv.appendChild(downloadResult);

scrapeUIContainer.appendChild(resetDiv);

downloadButton.addEventListener('click', () => {
    download();
    resumeButton.style.display = 'none';
    resetMsg.textContent = 'Click "Reset" to start afresh';
    resetDiv.style.display = 'block';
    downloadResult.textContent = fileFormat.toUpperCase() + ' file downloaded';
});

stopButton.addEventListener('click', () => {
    stopButton.style.display = 'none';
    abort = true;
});

resetButton.addEventListener('click', () => {
    resetInterface();
});

scrapeButton.addEventListener('click', triggerScrape);

resumeButton.addEventListener('click', async () => {
    stopButton.style.display = 'inline-block';
    scrapeButton.style.display = 'none';
    downloadButton.style.display = 'none';
    try {
        if (!maxTweets) {
            maxTweets = Infinity;
        }
        await scrape();
        stopButton.style.display = 'none';
        formatDiv.style.display = 'none';
        maxTweetsInputLabel.style.display = 'none';
        maxTweetsInput.style.display = 'none';
        resetDiv.style.display = 'inline-block';
        downloadButton.style.display = 'inline-block';
    } catch (error) {
        console.error('Error: ', error);
    }
});

async function triggerScrape() {
    tweetSet = new Set();
    if (fileFormat === 'xml') {
        file = `<Text>`;
    } else if (fileFormat === 'json') {
        file = {};
    } else if (fileFormat === 'txt') {
        file = '';
    } else if (fileFormat === 'csv') {
        csvData = [];
    } else if (fileFormat === 'xlsx') {
        file = XLSX.utils.book_new();
        sheet = XLSX.utils.aoa_to_sheet([
            ['Username', 'Date', 'Time', 'URL', 'Text'],
        ]);
    }

    stopButton.style.display = 'inline-block';
    scrapeButton.style.display = 'none';
    downloadButton.style.display = 'none';
    try {
        if (!maxTweets) {
            maxTweets = Infinity;
        }
        await scrape();
        stopButton.style.display = 'none';
        formatDiv.style.display = 'none';
        maxTweetsInputLabel.style.display = 'none';
        maxTweetsInput.style.display = 'none';
        resetDiv.style.display = 'inline-block';
        downloadButton.style.display = 'inline-block';
    } catch (error) {
        console.error('Error: ', error);
    }
}

function scrape() {
    abort = false;
    return new Promise((resolve, reject) => {
        if (abort) return;
        let scrollPosition = 0;
        const scrollStep = 1000;
        const scrollDelay = 1000;
        function scrollToNext() {
            try {
                if (
                    abort ||
                    scrollPosition >= document.body.scrollHeight ||
                    tweetCount >= maxTweets
                ) {
                    if (fileFormat === 'xml') {
                        file =
                            file +
                            `
</Text>`;
                    }
                    processContainer.textContent =
                        tweetCount + ' tweet(s) scraped';
                    resolve(tweetCount);
                    return;
                }
                scrollPosition += scrollStep;
                window.scrollTo(0, scrollPosition);
                let element = document.querySelectorAll('article');

                for (
                    let index = 0;
                    index < element.length && tweetCount < maxTweets;
                    index++
                ) {
                    try {
                        let userNameContainers = Array.from(
                            element[index].querySelectorAll('a[role="link"]')
                        );
                        let userNameContainer = userNameContainers.find((e) =>
                            e.textContent.startsWith('@')
                        );
                        let userName =
                            userNameContainer.textContent.normalize('NFC');
                        let date = element[index]
                            .querySelector('time')
                            .getAttribute('datetime');

                        let tweetId = `${userName}-${date}`;

                        let dateElements = date.split('T');
                        date = dateElements[0];
                        time = dateElements[1].split('.')[0];

                        let rawUserName = userName.split('@')[1];
                        let tweetUrlContainer = userNameContainers.find((e) =>
                            e
                                .getAttribute('href')
                                .startsWith(`/${rawUserName}/status/`)
                        );
                        let tweetRelUrl =
                            tweetUrlContainer.getAttribute('href');
                        let tweetUrl = `https://twitter.com${tweetRelUrl}`;

                        let status = element[index]
                            .querySelector('div[data-testid="tweetText"]')
                            .textContent.replaceAll(/[\u201C\u201D]/g, '"')
                            .replaceAll(/[\u2018\u2019]/g, "'")
                            .normalize('NFC');

                        if (!tweetSet.has(tweetId)) {
                            if (fileFormat === 'xml') {
                                status = status
                                    .replaceAll('&', '&amp;')
                                    .replaceAll('<', '&lt;')
                                    .replaceAll('>', '&gt;')
                                    .replaceAll('"', '&quot;')
                                    .replaceAll("'", '&apos;');
                                file =
                                    file +
                                    `
<tweet username="${userName}" date="${date}" time="${time}">
<ref target="${tweetUrl}">${tweetUrl}</ref><lb></lb>
${status}
</tweet>
<lb></lb>
<lb></lb>`;
                            } else if (fileFormat === 'json') {
                                status = status.replaceAll('\n', ' ');
                                file[tweetId] = {
                                    username: `${userName}`,
                                    date: `${date}`,
                                    time: `${time}`,
                                    url: `${tweetUrl}`,
                                    status: `${status}`,
                                };
                            } else if (fileFormat === 'txt') {
                                file =
                                    file +
                                    `
${status}

——————
`;
                            } else if (fileFormat === 'csv') {
                                status = status.replaceAll('\n', ' ');
                                csvData.push({
                                    userName,
                                    date,
                                    time,
                                    tweetUrl,
                                    status,
                                });
                            } else if (fileFormat === 'xlsx') {
                                status = status.replaceAll('\n', ' ');
                                let row = [
                                    userName,
                                    date,
                                    time,
                                    tweetUrl,
                                    status,
                                ];
                                XLSX.utils.sheet_add_aoa(sheet, [row], {
                                    origin: -1,
                                });
                            }
                            tweetCount++;
                            tweetSet.add(tweetId);
                            processContainer.textContent = `Scraping ${tweetCount} tweet(s)...`;
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
                if (tweetCount === maxTweets) {
                    resolve(tweetCount);
                    return;
                }
                setTimeout(scrollToNext, scrollDelay);
                i++;
            } catch (error) {
                console.error(error);
            }
        }
        scrollToNext();

        const interval = setInterval(() => {
            if (abort) {
                clearInterval(interval); // Stop the interval if abort is true
            }
        }, 100);
    });
}

function download() {
    if (fileFormat === 'xml') {
        var myBlob = new Blob([file], { type: 'application/xml' });
    } else if (fileFormat === 'json') {
        var fileString = JSON.stringify(file);
        var myBlob = new Blob([fileString], { type: 'text/plain' });
    } else if (fileFormat === 'txt') {
        var myBlob = new Blob([file], { type: 'text/plain' });
    } else if (fileFormat === 'csv') {
        function convertToCsv(data) {
            const header = Object.keys(data[0]).join('\t');
            const rows = data.map((obj) => Object.values(obj).join('\t'));
            return [header, ...rows].join('\n');
        }
        const csvString = convertToCsv(csvData);
        var myBlob = new Blob([csvString], { type: 'text/csv' });
    } else if (fileFormat === 'xlsx') {
        XLSX.utils.book_append_sheet(file, sheet, 'Tweets');
        XLSX.writeFile(file, 'tweets.xlsx');
    }
    if (fileFormat !== 'xlsx') {
        var url = window.URL.createObjectURL(myBlob);
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `tweets.${fileFormat}`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scrape') {
        modal.style.display = 'block';
        sendResponse({ success: true });
    }
});
