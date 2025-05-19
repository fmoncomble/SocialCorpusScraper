console.log('X-Scraper content script injected');

let i = 1;
let tweetCount = 0;
let file;
let abort = false;
let cursor;
let results = [];
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

const rateLimitNotice = document.createElement('div');
rateLimitNotice.setAttribute('id', 'rate-limit-notice');
scrapeUIContainer.appendChild(rateLimitNotice);

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

const anonDiv = document.createElement('div');
anonDiv.setAttribute('id', 'anon-div');
scrapeUIContainer.appendChild(anonDiv);
const anonCheckbox = document.createElement('input');
anonCheckbox.setAttribute('type', 'checkbox');
anonCheckbox.setAttribute('id', 'anon-checkbox');
anonCheckbox.setAttribute('name', 'anon-checkbox');
anonCheckbox.classList.add('x-scraper');
const anonCheckboxLabel = document.createElement('label');
anonCheckboxLabel.setAttribute('for', 'anon-checkbox');
anonCheckboxLabel.textContent = 'Anonymize tweets';
anonCheckboxLabel.classList.add('x-scraper');
anonDiv.appendChild(anonCheckbox);
anonDiv.appendChild(anonCheckboxLabel);

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

let requestUrl;
let requestHeaders;
let rateLimitRemaining;
let rateReset;
let mode = 'default';

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.message === 'request_headers') {
        requestUrl = message.url;
        requestHeaders = message.headers;
    }
    if (message.message === 'response_headers') {
        let rateLimitRemainingObj = message.headers.find((h) => {
            return h.name === 'x-rate-limit-remaining';
        });
        rateLimitRemaining = rateLimitRemainingObj.value;
        let rateResetObj = message.headers.find((h) => {
            return h.name === 'x-rate-limit-reset';
        });
        rateReset = rateResetObj.value;
        if (rateLimitNotice.textContent === '') {
            if (rateLimitRemaining > 0) {
                rateLimitNotice.innerHTML = `You have ${rateLimitRemaining} requests left:\nto avoid exceeding your rate limit, scraping more than ${
                    rateLimitRemaining * 20
                } tweets will proceed at a rate of 20 tweets every 18 seconds`;
            } else {
                let resetTime = new Date(rateReset * 1000);
                let now = new Date();
                let timeToReset = resetTime - now;
                let minutes = Math.floor((timeToReset % 3600000) / 60000);
                let seconds = Math.floor((timeToReset % 60000) / 1000);
                rateLimitNotice.innerHTML = `You have exhausted your rate limit:\ntry again in ${minutes} minutes and ${seconds} seconds`;
                for (
                    let seconds = Math.floor(timeToReset / 1000);
                    seconds >= 0;
                    seconds--
                ) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    if (seconds === 0) {
                        window.location.reload();
                    } else {
                        let minutes = Math.floor((seconds % 3600) / 60);
                        let secs = Math.floor(seconds % 60);
                        rateLimitNotice.innerHTML = `You have exhausted your rate limit:\ntry again in ${minutes} minutes and ${secs} seconds`;
                    }
                }
            }
        }
    }
});

async function resetInterface() {
    abort = false;
    results = [];
    cursor = null;
    i = 1;
    tweetCount = 0;
    mode = 'default';
    scrapeButton.removeAttribute('style');
    stopButton.removeAttribute('style');
    downloadButton.removeAttribute('style');
    anonDiv.removeAttribute('style');
    maxTweetsInput.value = '';
    maxTweets = null;
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
    rateLimitNotice.style.display = 'block';
    if (rateLimitRemaining > 0) {
        rateLimitNotice.innerHTML = `You have ${rateLimitRemaining} requests left:\nto avoid exceeding your rate limit, scraping more than ${
            rateLimitRemaining * 20
        } tweets will proceed at a rate of 20 tweets every 18 seconds`;
    } else {
        let resetTime = new Date(rateReset * 1000);
        let now = new Date();
        let timeToReset = resetTime - now;
        let minutes = Math.floor((timeToReset % 3600000) / 60000);
        let seconds = Math.floor((timeToReset % 60000) / 1000);
        rateLimitNotice.innerHTML = `You have exhausted your rate limit:\ntry again in ${minutes} minutes and ${seconds} seconds`;
        for (
            let seconds = Math.floor(timeToReset / 1000);
            seconds >= 0;
            seconds--
        ) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            if (seconds === 0) {
                window.location.reload();
            } else {
                let minutes = Math.floor((seconds % 3600) / 60);
                let secs = Math.floor(seconds % 60);
                rateLimitNotice.innerHTML = `You have exhausted your rate limit:\ntry again in ${minutes} minutes and ${secs} seconds`;
            }
        }
    }
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
    processResults(results);
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

let anon = false;
anonCheckbox.addEventListener('change', () => {
    anon = anonCheckbox.checked;
});

scrapeButton.addEventListener('click', async () => {
    mode = 'default';
    let message = '';
    if (!maxTweets) {
        maxTweets = Infinity;
    }
    if (maxTweets === Infinity || maxTweets > rateLimitRemaining * 20) {
        mode = 'rateLimit';
        if (maxTweets === Infinity) {
            message = `Given X's rate limit, scrolling will proceed at a rate of 20 tweets every 18 seconds. Do you want to proceed?`;
        } else if (maxTweets > rateLimitRemaining * 20) {
            let timeInSeconds = (maxTweets / 20) * 18;
            if (timeInSeconds > 60) {
                let minutes = Math.floor(timeInSeconds / 60);
                let seconds = timeInSeconds % 60;
                if (minutes > 60) {
                    let hours = Math.floor(minutes / 60);
                    minutes = minutes % 60;
                    message = `Given X's rate limit, scraping ${maxTweets} tweets will take a minimum of ${hours} hour(s), ${minutes} minute(s) and ${seconds} second(s). Do you want to proceed?`;
                } else {
                    message = `Given X's rate limit, scraping ${maxTweets} tweets will take a minimum of ${minutes} minute(s) and ${seconds} second(s). Do you want to proceed?`;
                }
            } else {
                message = `Given X's rate limit, scraping ${maxTweets} tweets will take a minimum of ${
                    (maxTweets / 20) * 18
                } seconds. Do you want to proceed?`;
            }
        }
        let proceed = window.confirm(message);
        if (!proceed) {
            resetInterface();
            return;
        }
    }

    stopButton.style.display = 'inline-block';
    scrapeButton.style.display = 'none';
    downloadButton.style.display = 'none';
    await scrape();
    endScrape();
});

resumeButton.addEventListener('click', async () => {
    abort = false;
    stopButton.style.display = 'inline-block';
    scrapeButton.style.display = 'none';
    downloadButton.style.display = 'none';
    try {
        if (!maxTweets) {
            maxTweets = Infinity;
        }
        await scrape();
        endScrape();
    } catch (error) {
        console.error('Error: ', error);
    }
});

let element = [];
let totalArticles = 0;

let iteration = 1;
function observeMutations(iteration) {
    element = [];
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutations) => {
            let mutationDetected = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const addedNodes = mutation.addedNodes;
                    if (addedNodes.length) {
                        mutationDetected = true;
                        for (let node of addedNodes) {
                            if (node.querySelector('article')) {
                                totalArticles++;
                                element.push(node.querySelector('article'));
                            }
                        }
                    }
                }
            }

            if (mutationDetected) {
                clearTimeout(inactivityTimeout);
                inactivityTimeout = setTimeout(() => {
                    observer.disconnect();
                    resolve(element);
                }, 1000);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        let inactivityTimeout = setTimeout(() => {
            observer.disconnect();
            resolve(element);
        }, 1000);
    });
}
observeMutations(iteration);

function scrape() {
    rateLimitNotice.style.display = 'none';
    abort = false;
    anon = anonCheckbox.checked;
    let usernames = new Set();
    let userDict = [];
    let u = 1;
    return new Promise(async (resolve) => {
        if (abort) return;
        let scrollDelay = 1000;
        if (mode === 'rateLimit') {
            scrollDelay = 18000;
        }
        async function scrollToNext() {
            try {
                if (
                    abort ||
                    results.length >= maxTweets
                ) {
                    processContainer.textContent =
                        results.length + ' tweet(s) scraped';
                    resolve(results);
                    return;
                }
                for (
                    let index = 0;
                    index < element.length && results.length < maxTweets;
                    index++
                ) {
                    try {
                        if (results.length === maxTweets) {
                            break;
                        }
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
                        let rawUserName = userName.split('@')[1];
                        let tweetUrlContainer = userNameContainers.find((e) =>
                            e
                                .getAttribute('href')
                                .startsWith(`/${rawUserName}/status/`)
                        );
                        if (!tweetUrlContainer) {
                            continue;
                        }
                        let tweetRelUrl =
                            tweetUrlContainer.getAttribute('href');
                        let tweetUrl = `https://x.com${tweetRelUrl}`;

                        let statusElement = element[index].querySelector(
                            'div[data-testid="tweetText"]'
                        );

                        if (!statusElement) {
                            continue;
                        }
                        let status = statusElement.textContent
                            .replaceAll(/[\u201C\u201D]/g, '"')
                            .replaceAll(/[\u2018\u2019]/g, "'")
                            .normalize('NFC');
                        if (anon) {
                            if (!usernames.has(rawUserName)) {
                                usernames.add(rawUserName);
                                userDict.push({
                                    username: rawUserName,
                                    id: `x_user_${u}`,
                                });
                                u++;
                            }
                            userName = userDict.find(
                                (user) => user.username === rawUserName
                            ).id;
                        } else {
                            userName = rawUserName;
                        }
                        let tweetId = `${userName}-${date}`;
                        let dateElements = date.split('T');
                        date = dateElements[0];
                        time = dateElements[1].split('.')[0];
                        let tweet = {
                            id: tweetId,
                            username: userName,
                            date: date,
                            time: time,
                            text: status,
                        };
                        if (!anon) {
                            tweet.url = tweetUrl;
                        }

                        if (!results.find((r) => r.id === tweetId)) {
                            results.push(tweet);
                        }
                        if (maxTweets !== Infinity) {
                            processContainer.textContent = `Scraped ${results.length} tweet(s) of ${maxTweets}`;
                        } else {
                            processContainer.textContent = `Scraped ${results.length} tweet(s)`;
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
                if (results.length === maxTweets) {
                    processContainer.textContent =
                        results.length + ' tweet(s) scraped';
                    resolve(results);
                    return;
                }
                iteration++;
                if (!abort && results.length < maxTweets) {
                    if (mode === 'rateLimit') {
                        for (let i = 18; i > 0; i--) {
                            await new Promise((resolve) =>
                                setTimeout(resolve, 1000)
                            );
                            processContainer.textContent = `Scraped ${results.length} tweet(s), now waiting ${i}...`;
                            if (abort) {
                                resolve(results);
                                return;
                            }
                        }
                    }
                    window.scrollTo(0, document.body.scrollHeight);
                    await observeMutations(iteration);
                    scrollToNext();
                    i++;
                } else {
                    processContainer.textContent = results.length + ' tweet(s) scraped';
                    resolve(results);
                    return;
                }
            } catch (error) {
                console.error(error);
            }
        }
            scrollToNext();

        const interval = setInterval(() => {
            if (abort) {
                clearInterval(interval);
            }
        }, 100);
    });
}

function endScrape() {
    results.splice(maxTweets);
    rateLimitNotice.innerHTML = null;
    processContainer.textContent = `Scraped ${results.length} tweet(s)`;
    stopButton.style.display = 'none';
    formatDiv.style.display = 'none';
    maxTweetsInputLabel.style.display = 'none';
    maxTweetsInput.style.display = 'none';
    resetDiv.style.display = 'inline-block';
    downloadButton.style.display = 'inline-block';
    return;
}


function processResults(results) {
    if (fileFormat === 'xml') {
        makeXml(results);
    } else if (fileFormat === 'json') {
        makeJson(results);
    } else if (fileFormat === 'txt') {
        makeTxt(results);
    } else if (fileFormat === 'csv') {
        makeCsv(results);
    } else if (fileFormat === 'xlsx') {
        makeXlsx(results);
    }
}

function makeXml(tweets) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<text>\n`;
    tweets.forEach((t) => {
        xml += `<lb/><tweet`;
        for (const [key, value] of Object.entries(t)) {
            if (typeof value === 'string') {
                t[key] = value
                    .replaceAll('&', '&amp;')
                    .replaceAll('<', '&lt;')
                    .replaceAll('>', '&gt;')
                    .replaceAll('"', '&quot;')
                    .replaceAll("'", '&apos;');
            }
            if (key !== 'text' && key !== 'url') {
                xml += ` ${key}="${value}"`;
            }
        }
        if (t.url) {
            xml += `><lb/><ref target="${t.url}">Link to tweet</ref><lb/>`;
        } else {
            xml += '>';
        }
        const urlRegex =
            /(?:https?|ftp):\/\/[-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[-A-Za-z0-9+&@#\/%=~_|]/;
        let text = t.text;
        const links = text.match(urlRegex);
        if (links) {
            for (l of links) {
                const newLink = l.replace(/(.+)/, `<ref target="$1">$1</ref>`);
                text = text.replace(l, newLink);
            }
        }
        xml += `${text.replaceAll(/\n/g, '<lb/>')}</tweet><lb/>\n`;
    });
    xml += `</text>`;
    const xmlBlob = new Blob([xml], { type: 'application/xml' });
    download(xmlBlob, 'tweets.xml');
}

function makeJson(tweets) {
    const jsonBlob = new Blob([JSON.stringify(tweets)], { type: 'text/plain' });
    download(jsonBlob, 'tweets.json');
}

function makeTxt(tweets) {
    let txt = '';
    tweets.forEach((t) => {
        txt += `${t.text}\n\n`;
    });
    const txtBlob = new Blob([txt], { type: 'text/plain' });
    download(txtBlob, 'tweets.txt');
}

function makeCsv(tweets) {
    let csv =
        'id\tuser_id\tuser_handle\tuser_name\ttimestamp\ttext\tlike_count\tretweet_count\tquote_count\treply_count\turl\n';
    tweets.forEach((t) => {
        csv += `${t.id}\t${t.user_id}\t${t.user_handle}\t${t.user_name}\t${t.timestamp}\t${t.text}\t${t.like_count}\t${t.retweet_count}\t${t.quote_count}\t${t.reply_count}\t${t.url}\n`;
    });
    csvData = tweets;
    const csvBlob = new Blob([csv], { type: 'text/csv' });
    download(csvBlob, 'tweets.csv');
}

function makeXlsx(tweets) {
    let xlsx = XLSX.utils.book_new();
    let sheet = XLSX.utils.json_to_sheet(tweets);
    XLSX.utils.book_append_sheet(xlsx, sheet, 'Tweets');
    XLSX.writeFile(xlsx, 'tweets.xlsx');
}

function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scrape') {
        modal.style.display = 'block';
        sendResponse({ success: true });
    }
});
