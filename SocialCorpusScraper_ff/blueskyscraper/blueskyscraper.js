console.log('BlueskyScraper script loaded');

document.addEventListener('DOMContentLoaded', async function () {
    // Declare page elements
    const authContainer = document.getElementById('auth-container');
    const authFold = document.getElementById('auth-fold');
    const authUnfold = document.getElementById('auth-unfold');
    const idContainer = document.getElementById('id-container');
    const idInput = document.getElementById('id-input');
    const passwordContainer = document.getElementById('password-container');
    const passwordInput = document.getElementById('password-input');
    const allDone = document.getElementById('all-done');
    const authBtnContainer = document.getElementById('auth-btn-container');
    const authBtn = document.getElementById('auth-btn');
    const resetAuthBtn = document.getElementById('reset-auth');
    const searchFold = document.getElementById('search-fold');
    const searchUnfold = document.getElementById('search-unfold');
    const searchContainer = document.getElementById('search-container');
    const keywordsInput = document.getElementById('keywords');
    const thisPhraseInput = document.getElementById('this-phrase');
    const sinceInput = document.getElementById('since');
    const untilInput = document.getElementById('until');
    const authorInput = document.getElementById('author');
    const langInput = document.getElementById('lang');
    const tagInput = document.getElementById('tag');
    const sortBySelect = document.querySelector('select#sort-by');
    const searchBtn = document.getElementById('search-btn');
    const searchMsg = document.getElementById('search-msg');
    const noResult = document.getElementById('no-result');
    const extractContainer = document.getElementById('extract-container');
    const formatSelect = document.getElementById('output-format');
    const maxResultsInput = document.getElementById('max-results');
    const extractBtn = document.getElementById('extract-btn');
    const extractSpinner = document.getElementById('extract-spinner');
    const abortBtn = document.getElementById('abort-btn');
    const resultsContainer = document.getElementById('results-container');
    const resultsMsg = document.getElementById('results-msg');
    const dlContainer = document.getElementById('dl-container');
    const dlBtn = document.getElementById('dl-btn');
    const resetBtn = document.getElementById('reset-btn');

    let clientID;
    let clientSecret;
    let userToken;
    let refreshToken;
    userToken = await retrieveCredential('blueskyusertoken');
    refreshToken = await retrieveCredential('blueskyrefreshtoken');

    // Assign role to Authentication header
    authFold.addEventListener('click', () => {
        if (authContainer.style.display === 'block') {
            authContainer.style.display = 'none';
            authFold.style.display = 'none';
            authUnfold.style.display = 'block';
        }
    });

    authUnfold.addEventListener('click', () => {
        if (authContainer.style.display === 'none') {
            authContainer.style.display = 'block';
            authFold.style.display = 'block';
            authUnfold.style.display = 'none';
        }
    });

    // Assign role to 'Build search query' header
    searchFold.addEventListener('click', () => {
        searchContainer.style.display = 'none';
        searchFold.style.display = 'none';
        searchUnfold.style.display = 'block';
    });

    searchUnfold.addEventListener('click', () => {
        searchContainer.style.display = 'block';
        searchFold.style.display = 'block';
        searchUnfold.style.display = 'none';
    });

    // Get ID and password
    idInput.addEventListener('change', () => {
        clientID = idInput.value;
        passwordInput.focus();
    });

    passwordInput.addEventListener('change', () => {
        clientSecret = passwordInput.value;
        authBtn.focus();
    });

    // Reset authentication button
    resetAuthBtn.addEventListener('click', async () => {
        await removeUserToken();
        idInput.value = '';
        passwordInput.value = '';
        idContainer.style.display = 'block';
        passwordContainer.style.display = 'block';
        authBtnContainer.style.display = 'block';
        allDone.style.display = 'none';
        searchFold.style.display = 'none';
        searchUnfold.style.display = 'block';
        searchContainer.style.display = 'none';
        idInput.focus();
    });

    //Functions to handle user token
    getUserToken(function (userTokenResult) {
        userToken = userTokenResult;

        if (userToken) {
            idContainer.style.display = 'none';
            passwordContainer.style.display = 'none';
            authBtnContainer.style.display = 'none';
            allDone.style.display = 'block';
            searchContainer.style.display = 'block';
            searchFold.style.display = 'block';
            searchUnfold.style.display = 'none';
        } else {
            authContainer.style.display = 'block';
            authFold.style.display = 'block';
            authUnfold.style.display = 'none';
            authBtnContainer.style.display = 'block';
            searchContainer.style.display = 'none';
            searchFold.style.display = 'none';
            searchUnfold.style.display = 'block';
            idInput.focus();
        }
    });

    function getUserToken(callback) {
        chrome.storage.local.get(['blueskyusertoken'], function (result) {
            const blueskyusertoken = result.blueskyusertoken || '';
            callback(blueskyusertoken);
        });
    }

    async function saveUserToken() {
        chrome.storage.local.set({ blueskyusertoken: userToken }, function () {
            allDone.style.display = 'block';
            setTimeout(() => {
                authContainer.style.display = 'none';
                authFold.style.display = 'none';
                authUnfold.style.display = 'block';
                searchContainer.style.display = 'block';
                searchFold.style.display = 'block';
                searchUnfold.style.display = 'none';
            }, 1000);
        });
    }

    // Function to handle refresh token
    async function saveRefreshToken() {
        chrome.storage.local.set({ blueskyrefreshtoken: refreshToken });
    }

    // Function to revoke user token
    async function removeUserToken() {
        chrome.storage.local.remove('blueskyusertoken', function () {
            userToken = '';
        });
        chrome.storage.local.remove('blueskyrefreshtoken', function () {
            refreshToken = '';
        });
    }

    authBtn.addEventListener('click', async () => {
        await authorize();
    });

    // Function to obtain user token
    async function authorize() {
        const url = 'https://bsky.social/xrpc/com.atproto.server.createSession';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: new Headers({
                    'content-type': 'application/json',
                }),
                body: JSON.stringify({
                    identifier: clientID,
                    password: clientSecret,
                }),
            });

            if (response.status === 401) {
                window.alert(
                    'Authorization failed: check your ID and password and try again'
                );
                throw new Error('Authorization failed');
            }
            if (!response.ok) {
                window.alert('There was an error during authorization');
                throw new Error('Network response was not ok');
            }

            const jsonData = await response.json();
            accessToken = jsonData.accessJwt;
            if (accessToken) {
                userToken = accessToken;
                refreshToken = jsonData.refreshJwt;
                await saveUserToken();
                await saveRefreshToken();
                idContainer.style.display = 'none';
                passwordContainer.style.display = 'none';
                authBtnContainer.style.display = 'none';
            } else {
                window.alert('Could not retrieve access token');
                throw new Error('Could not retrieve access token');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Function to retrieve credential from storage
    function retrieveCredential(credType) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([credType], function (result) {
                const credential = result[credType] || '';
                resolve(credential);
            });
        });
    }

    // Logic to build query URL from inputs
    let queryUrl;
    let sortBy = 'latest';
    sortBySelect.addEventListener('change', () => {
        sortBy = sortBySelect.value;
    });

    async function buildQueryUrl() {
        queryUrl =
            'https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?';

        // Concatenate query URL from search elements
        let keywords = keywordsInput.value;
        let thisPhrase = thisPhraseInput.value;
        let since = sinceInput.value;
        let until = untilInput.value;
        let author = authorInput.value;
        let lang = langInput.value;
        let tag = tagInput.value;
        if (keywords || thisPhrase) {
            queryUrl = queryUrl + 'q=';
        }
        if (keywords) {
            queryUrl = queryUrl + keywords;
        }
        if (thisPhrase) {
            queryUrl = queryUrl + '"' + thisPhrase + '"';
        }
        if (since) {
            since = since + 'T00:00:00Z';
            queryUrl = queryUrl + '&since=' + since;
        }
        if (until) {
            until = until + 'T23:59:59.999Z';
            queryUrl = queryUrl + '&until=' + until;
        }
        if (author) {
            queryUrl = queryUrl + '&author=' + author;
        }
        if (lang) {
            queryUrl = queryUrl + '&lang=' + lang;
        }
        if (tag) {
            tag = tag
                .replaceAll('#', '')
                .replaceAll(' ', '')
                .replaceAll(',', ' AND ');
            queryUrl = queryUrl + '&tag=' + tag;
        }
        if (sortBy) {
            queryUrl = queryUrl + '&sort=' + sortBy;
        }
        queryUrl = encodeURI(queryUrl);

        // Fetch query response from server
        try {
            if (!keywords && !thisPhrase) {
                window.alert('Please provide keywords');
                searchMsg.style.display = 'none';
                return;
            }
            userToken = await retrieveCredential('blueskyusertoken');
            const response = await fetch(queryUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
            });
            if (response.status === 401) {
                searchMsg.style.display = 'none';
                window.alert(
                    'Application not authorized: please authenticate with Bluesky'
                );
                authContainer.style.display = 'block';
                authFold.style.display = 'block';
                authUnfold.style.display = 'none';
                throw new Error('User needs to authorize app');
            } else if (!response || !response.ok) {
                window.alert(
                    `Error fetching results: status ${response.status}`
                );
                searchMsg.style.display = 'none';
                throw new Error('Could not fetch search results.');
            }
            const searchData = await response.json();
            const searchResults = searchData.posts;
            if (searchResults.length == 0) {
                searchMsg.style.display = 'none';
                noResult.style.display = 'block';
            } else {
                searchMsg.style.display = 'none';
                searchContainer.style.display = 'none';
                searchFold.style.display = 'none';
                searchUnfold.style.display = 'block';
                extractContainer.style.display = 'block';
                extractBtn.style.display = 'block';
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Assign role to search button
    searchBtn.addEventListener('click', () => {
        extractContainer.style.display = 'none';
        searchMsg.style.display = 'block';
        noResult.style.display = 'none';
        buildQueryUrl();
    });

    // Declare extraction variables
    let maxResults;
    maxResultsInput.addEventListener('change', () => {
        maxResults = maxResultsInput.value;
        if (!maxResults) {
            maxResults = Infinity;
        }
    });

    let fileFormat = 'xml';
    formatSelect.addEventListener('change', () => {
        fileFormat = formatSelect.value;
        dlBtn.textContent = 'Download ' + fileFormat.toUpperCase();
    });

    let file;
    let results;
    let cursor;
    let csvData = [];
    let resultCount = 1;
    let nextQueryUrl;

    // Assign function to extract button
    extractBtn.addEventListener('click', () => {
        triggerScrape();
    });

    async function triggerScrape() {
        formatSelect.disabled = true;
        maxResultsInput.disabled = true;
        abortBtn.style.display = 'block';
        extractBtn.style.display = 'none';
        resultsContainer.style.display = 'block';
        dlContainer.style.display = 'none';
        dlBtn.style.display = 'none';
        try {
            await scrape();
            abortBtn.style.display = 'none';
            extractBtn.style.display = 'block';
            extractBtn.disabled = true;
            extractSpinner.style.display = 'none';
            resultCount = resultCount - 1;
            resultsMsg.textContent = resultCount + ' result(s) extracted';
            dlContainer.style.display = 'block';
            dlBtn.style.display = 'inline-block';
            resetBtn.style.display = 'inline-block';
        } catch (error) {
            console.error('Error: ', error);
        }
    }

    // Assign function to abort button
    abortBtn.addEventListener('click', () => {
        abortBtn.textContent = 'Aborting...';
        abort = true;
    });
    // Function to scrape results
    async function scrape() {
        abort = false;
        extractBtn.style.display = 'none';
        abortBtn.style.display = 'block';
        if (!maxResults) {
            maxResults = Infinity;
        }
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

        let p = 1;
        while (resultCount <= maxResults) {
            await processPage();

            if (resultCount > maxResults || abort) {
                if (fileFormat === 'xml') {
                    file =
                        file +
                        `

</Text>`;
                }
                abortBtn.textContent = 'Abort';
                abortBtn.style.display = 'none';
                extractBtn.style.display = 'block';
                extractBtn.disabled = true;
                dlContainer.style.display = 'block';
                dlBtn.style.display = 'block';
                abort = false;
                break;
            }
        }

        async function processPage() {
            try {
                if (maxResults) {
                    maxResults = Number(maxResults);
                }
                if (p === 1) {
                    nextQueryUrl = queryUrl;
                } else if (p > 1 && cursor) {
                    nextQueryUrl = queryUrl + '&cursor=' + cursor.toString();
                } else if (!cursor) {
                    abort = true;
                    return;
                }
                const response = await fetch(nextQueryUrl, {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        Accept: 'application/json',
                    },
                });
                if (response.status === 401) {
                    window.alert(
                        'Application not authorized: please authenticate with Bluesky'
                    );
                    throw new Error('Could not fetch: not authenticated');
                } else if (!response.ok) {
                    window.alert(
                        `Error fetching results: HTTP error ${response.status}`
                    );
                    throw new Error(
                        'HTTP error, could not fetch search results'
                    );
                }
                const data = await response.json();
                cursor = data.cursor;
                results = data.posts;
                if (
                    results.length == 0 ||
                    (resultCount > 1 && results.length <= 1)
                ) {
                    abort = true;
                }
                for (r of results) {
                    username = r.author.handle;

                    date = r.record.createdAt;
                    dateElements = date.split('T');
                    date = dateElements[0];
                    time = dateElements[1].split('.')[0];
                    text = r.record.text;
                    if (!text) {
                        continue;
                    }
                    let postID = r.uri.split('post/')[1];
                    url = `https://bsky.app/profile/${username}/post/${postID}`;

                    if (fileFormat === 'xml') {
                        username = username
                            .replaceAll('&', '&amp;')
                            .replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;')
                            .replaceAll('"', '&quot;')
                            .replaceAll("'", '&apos;');
                        text = text
                            .replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;')
                            .replaceAll('"', '&quot;')
                            .replaceAll("'", '&apos;')
                            .replaceAll('&nbsp;', ' ')
                            .replaceAll('\n', '<lb></lb>');
                        const urlRegex =
                            /(?:https?|ftp):\/\/[-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[-A-Za-z0-9+&@#\/%=~_|]/;
                        const links = text.match(urlRegex);
                        if (links) {
                            for (l of links) {
                                const newLink = l.replace(
                                    /(.+)/,
                                    `<ref target="$1">$1</ref>`
                                );
                                text = text.replace(l, newLink);
                            }
                        }
                        text = text.replaceAll('\n', '<lb></lb>');
                        file =
                            file +
                            `<lb></lb><lb></lb>
<username="${username}" date="${date}" time="${time}"><lb></lb>
<ref target="${url}">${url}</ref><lb></lb><lb></lb>
${text}
</result>
<lb></lb><lb></lb>`;
                    } else if (fileFormat === 'txt') {
                        file = file + `\n\n${text}\n\n————`;
                    } else if (fileFormat === 'json') {
                        text = text.replaceAll('\n', ' ');
                        file[id] = {
                            username: `${username}`,
                            date: `${date}`,
                            time: `${time}`,
                            url: `${url}`,
                            text: `${text}`,
                        };
                    } else if (fileFormat === 'csv') {
                        text = text.replaceAll('\n', ' ');
                        csvData.push({ username, date, time, url, text });
                    } else if (fileFormat === 'xlsx') {
                        text = text.replaceAll('\n', ' ');
                        let row = [username, date, time, url, text];
                        XLSX.utils.sheet_add_aoa(sheet, [row], { origin: -1 });
                    }
                    if (maxResults !== Infinity) {
                        let resultPercent = Math.round(
                            (resultCount / maxResults) * 100
                        );
                        resultsMsg.textContent = `${resultPercent}% extracted...`;
                    } else {
                        resultsMsg.textContent = `${resultCount} result(s) extracted...`;
                    }
                    resultCount++;
                    if (resultCount > maxResults) {
                        return;
                    }
                }
                p++;
            } catch (error) {
                console.error(error);
            }
        }
    }

    // Assign role to download button
    dlBtn.addEventListener('click', () => {
        download();
        const dlResult = document.getElementById('dl-result');
        dlResult.style.display = 'block';
        dlResult.textContent = fileFormat.toUpperCase() + ' file downloaded';
    });

    // Function to download output file
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
            XLSX.utils.book_append_sheet(file, sheet, 'Results');
            XLSX.writeFile(file, 'bluesky_results.xlsx');
        }
        if (fileFormat !== 'xlsx') {
            var url = window.URL.createObjectURL(myBlob);
            var anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `bluesky_results.${fileFormat}`;
            anchor.click();
            window.URL.revokeObjectURL(url);
        }
    }

    // Assign role to reset button
    resetBtn.addEventListener('click', () => {
        const inputs = searchContainer.querySelectorAll('input');
        for (let input of inputs) {
            input.value = '';
        }
        location.reload();
    });
});
