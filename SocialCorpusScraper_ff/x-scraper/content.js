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

async function resetInterface() {
    abort = false;
    results = [];
    cursor = null;
    i = 1;
    tweetCount = 0;
    scrapeButton.removeAttribute('style');
    stopButton.removeAttribute('style');
    downloadButton.removeAttribute('style');
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

scrapeButton.addEventListener('click', () => {
    let message = '';
    if (!maxTweets) {
        maxTweets = Infinity;
    }
    if (maxTweets === Infinity || maxTweets > rateLimitRemaining * 20) {
        if (maxTweets === Infinity) {
            message = `Given X's rate limit, scraping will proceed at a rate of 20 tweets every 18 seconds. Do you want to proceed?`;
        } else if (maxTweets > rateLimitRemaining * 20) {
            let timeInSeconds = (maxTweets / 20) * 18;
            if (timeInSeconds > 60) {
                let minutes = Math.floor(timeInSeconds / 60);
                let seconds = timeInSeconds % 60;
                if (minutes > 60) {
                    let hours = Math.floor(minutes / 60);
                    minutes = minutes % 60;
                    message = `Given X's rate limit, scraping ${maxTweets} tweets will take ${hours} hour(s), ${minutes} minute(s) and ${seconds} second(s). Do you want to proceed?`;
                } else {
                    message = `Given X's rate limit, scraping ${maxTweets} tweets will take ${minutes} minute(s) and ${seconds} second(s). Do you want to proceed?`;
                }
            } else {
                message = `Given X's rate limit, scraping ${maxTweets} tweets will take ${
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
    scrape();
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
        await scrape(cursor);
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

let requestUrl;
let requestHeaders;
let rateLimitRemaining;
let rateReset;
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

async function scrape(cursor) {
    if (abort) {
        return;
    }
    let url = new URL(requestUrl.split('?')[0]);
    let requestSearchParams = new URLSearchParams(requestUrl.split('?')[1]);
    let variables = JSON.parse(requestSearchParams.get('variables'));
    variables.count = 40;
    if (cursor) {
        variables.cursor = cursor;
    }
    requestSearchParams.set('variables', JSON.stringify(variables));
    url = url + '?' + requestSearchParams.toString();
    let headers = new Headers();
    requestHeaders.forEach((h) => headers.append(h.name, h.value));
    let res = await fetch(url, { headers: headers });
    let data = await res.json();
    let instructions =
        data.data.search_by_raw_query.search_timeline.timeline.instructions;
    let entries = instructions[0].entries;
    let tweets = entries.filter((e) => e.entryId.includes('tweet'));
    results.push(...tweets);
    if (maxTweets !== Infinity) {
        processContainer.textContent = `Scraped ${results.length} / ${maxTweets} tweet(s)`;
    } else if (maxTweets === Infinity) {
        processContainer.textContent = `Scraped ${results.length} tweet(s)`;
    }
    processContainer.textContent = `Scraped ${results.length} tweet(s)`;
    cursor =
        entries[entries.length - 1].content.value ||
        instructions[instructions.length - 1].entry.content.value;
    let tweetsLeft = maxTweets - results.length;
    if (
        !abort &&
        cursor &&
        (results.length < maxTweets || maxTweets === Infinity)
    ) {
        let rateLimit = res.headers.get('x-rate-limit-remaining');
        if (tweetsLeft > rateLimit * 20 || maxTweets === Infinity) {
            for (let i = 18; i > 0; i--) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                processContainer.textContent = `Scraped ${results.length} tweet(s), now waiting ${i}...`;
                if (abort) {
                    break;
                }
            }
        }
        if (!abort) {
            await scrape(cursor);
        } else {
            endScrape();
        }
    } else {
        endScrape();
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
}

function processResults(results) {
    let tweets = results.map((r) => {
        try {
            let tweet = r.content.itemContent.tweet_results.result;
            if (!tweet.legacy) {
                tweet = tweet.tweet;
            }
            let tweetData = {
                id: tweet.legacy.id_str,
                user_id: tweet.legacy.user_id_str,
                user_handle: tweet.core.user_results.result.legacy.screen_name,
                user_name: tweet.core.user_results.result.legacy.name,
                timestamp: new Date(tweet.legacy.created_at).toISOString(),
                text: tweet.legacy.full_text,
                like_count: tweet.legacy.favorite_count,
                retweet_count: tweet.legacy.retweet_count,
                quote_count: tweet.legacy.quote_count,
                reply_count: tweet.legacy.reply_count,
                url: `https://x.com/${tweet.legacy.user_id_str}/status/${tweet.legacy.id_str}`,
            };
            return tweetData;
        } catch (error) {
            console.error(
                `Error with tweet ${results.indexOf(r) + 1}: `,
                r,
                error
            );
        }
    });
    if (fileFormat === 'xml') {
        makeXml(tweets);
    } else if (fileFormat === 'json') {
        makeJson(tweets);
    } else if (fileFormat === 'txt') {
        makeTxt(tweets);
    } else if (fileFormat === 'csv') {
        makeCsv(tweets);
    } else if (fileFormat === 'xlsx') {
        makeXlsx(tweets);
    }
}

function makeXml(tweets) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<text>\n`;
    tweets.forEach((t) => {
        xml += `<lb></lb><tweet`;
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
        xml += `><lb></lb><ref target="${t.url}">Link to tweet</ref><lb></lb>`;
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
        xml += `${text.replaceAll(/\n/g, '<lb></lb>')}</tweet><lb></lb>\n`;
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
