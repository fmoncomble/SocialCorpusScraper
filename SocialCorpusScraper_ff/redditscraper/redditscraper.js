console.log('Redditscraper script loaded');

document.addEventListener('DOMContentLoaded', async function () {
    // Declare page elements
    const authContainer = document.getElementById('auth-container');
    const authFold = document.getElementById('auth-fold');
    const authUnfold = document.getElementById('auth-unfold');
    const instSpan = document.getElementById('instructions');
    const instDiv = document.getElementById('instructions-container');
    const openRedditP = document.getElementById('open-reddit-app');
    const idContainer = document.getElementById('id-container');
    const idInput = document.getElementById('id-input');
    const idSaveBtn = document.getElementById('id-save');
    const secretContainer = document.getElementById('secret-container');
    const secretInput = document.getElementById('secret-input');
    const secretSaveBtn = document.getElementById('secret-save');
    const allDone = document.getElementById('all-done');
    const authBtnContainer = document.getElementById('auth-btn-container');
    const authBtn = document.getElementById('auth-btn');
    const resetAuthBtn = document.getElementById('reset-auth');
    const searchFold = document.getElementById('search-fold');
    const searchUnfold = document.getElementById('search-unfold');
    const searchContainer = document.getElementById('search-container');
    const searchModeSelect = document.getElementById('search-mode');
    const checkbox = document.getElementById('checkbox');
    const titleSearchDiv = document.getElementById('title-search');
    const titleWordsInput = document.getElementById('title-words');
    const guidedSearchDiv = document.getElementById('guided-search');
    const expertSearchDiv = document.getElementById('expert-search');
    const keywordsInput = document.getElementById('keywords');
    const allWordsInput = document.getElementById('all-words');
    const anyWordsInput = document.getElementById('any-words');
    const noWordsInput = document.getElementById('no-words');
    const subredditInput = document.getElementById('subreddit');
    const thisPhraseInput = document.getElementById('this-phrase');
    const timeRangeSelect = document.querySelector('select#time-range');
    const sortBySelect = document.querySelector('select#sort-by');
    const typeSelect = document.querySelector('select#type');
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
    const dlBtn = document.getElementById('dl-btn');
    const dlResult = document.getElementById('dl-result');
    const resetBtn = document.getElementById('reset-btn');
    const notice = document.getElementById('notice');
    const dismissBtn = document.getElementById('dismiss');

    let codeInput = document.createElement('input');
    let codeSaveBtn = document.createElement('button');

    instSpan.addEventListener('click', () => {
        if (instDiv.style.display === 'none') {
            instDiv.style.display = 'block';
            instSpan.textContent = 'Hide instructions';
        } else if (instDiv.style.display === 'block') {
            instDiv.style.display = 'none';
            instSpan.textContent = 'Show instructions';
        }
    });

    openRedditP.addEventListener('click', () => {
        idInput.focus();
    });

    // Manage notice
    let understand;
    let userToken;
    let refreshToken;
    userToken = await retrieveCredential('redditusertoken');
    refreshToken = await retrieveCredential('redditrefreshtoken');

    getUnderstand(function (understandResult) {
        understand = understandResult;
        if (userToken && understand) {
            notice.style.display = 'none';
        } else {
            notice.style.display = 'block';
        }
    });

    function getUnderstand(callback) {
        chrome.storage.local.get(['understand'], function (result) {
            const understand = result.understand || '';
            callback(understand);
        });
    }

    async function saveUnderstand() {
        chrome.storage.local.set({ understand: 'understand' }, function () {
            notice.style.display = 'none';
        });
    }

    async function removeUnderstand() {
        chrome.storage.local.remove('understand', function () {
            notice.style.display = 'block';
        });
    }

    dismissBtn.addEventListener('click', () => {
        saveUnderstand();
    });

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

    // Store credentials
    let idCred = 'reddit_client_id';
    let secretCred = 'reddit_client_secret';
    let codeCred = 'reddit_client_code';

    let idPlaceholder = 'Enter your app client ID';
    let secretPlaceholder = 'Enter your app client secret';
    let codePlaceholder = 'Enter your code';

    // Store app ID
    idInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            saveCredential(idInput, idCred, idSaveBtn, idPlaceholder);
            secretInput.focus();
        }
    });
    idSaveBtn.addEventListener('click', async () => {
        saveCredential(idInput, idCred, idSaveBtn, idPlaceholder);
        secretInput.focus();
    });

    // Store app secret
    secretInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveCredential(
                secretInput,
                secretCred,
                secretSaveBtn,
                secretPlaceholder
            );
        }
    });
    secretSaveBtn.addEventListener('click', () => {
        saveCredential(
            secretInput,
            secretCred,
            secretSaveBtn,
            secretPlaceholder
        );
    });

    let clientID = await retrieveCredential('reddit_client_id');
    let clientSecret = await retrieveCredential('reddit_client_secret');
    let clientCode = await retrieveCredential('reddit_client_code');
    if (clientID && clientSecret) {
        authBtnContainer.style.display = 'block';
    }

    // Reset authentication button
    resetAuthBtn.addEventListener('click', async () => {
        await removeUserToken();
        saveCredential(idInput, idCred, idSaveBtn, idPlaceholder);
        saveCredential(
            secretInput,
            secretCred,
            secretSaveBtn,
            secretPlaceholder
        );
        saveCredential(codeInput, codeCred, codeSaveBtn, codePlaceholder);
        removeUnderstand();
        instSpan.style.display = 'block';
        idContainer.style.display = 'block';
        secretContainer.style.display = 'block';
        openRedditP.style.display = 'block';
        authBtnContainer.style.display = 'block';
        searchFold.style.display = 'none';
        searchUnfold.style.display = 'block';
        allDone.style.display = 'none';
        searchContainer.style.display = 'none';
        // location.reload();
    });

    // Functions to check for credentials
    function getCredential(credType, callback) {
        chrome.storage.local.get([credType], function (result) {
            const credential = result[credType] || '';
            callback(credential);
        });
    }

    function handleCredential(credType, inputElement, buttonElement) {
        getCredential(credType, function (credentialResult) {
            let credential = credentialResult;
            if (credential) {
                inputElement.placeholder =
                    'Value stored: enter new value to reset';
                buttonElement.textContent = 'Reset';
            } else {
            }
        });
    }

    handleCredential('reddit_client_id', idInput, idSaveBtn, idPlaceholder);
    handleCredential(
        'reddit_client_secret',
        secretInput,
        secretSaveBtn,
        secretPlaceholder
    );
    handleCredential(
        'reddit_client_code',
        codeInput,
        codeSaveBtn,
        codePlaceholder
    );

    //Functions to handle user token
    getUserToken(function (userTokenResult) {
        userToken = userTokenResult;

        if (userToken) {
            instSpan.style.display = 'none';
            idContainer.style.display = 'none';
            secretContainer.style.display = 'none';
            openRedditP.style.display = 'none';
            authBtnContainer.style.display = 'none';
            allDone.style.display = 'block';
            searchContainer.style.display = 'block';
            searchFold.style.display = 'block';
            searchUnfold.style.display = 'none';
        } else {
            authContainer.style.display = 'block';
            authFold.style.display = 'block';
            authUnfold.style.display = 'none';
            instSpan.style.display = 'block';
            openRedditP.style.display = 'block';
            authBtnContainer.style.display = 'block';
            searchContainer.style.display = 'none';
            searchFold.style.display = 'none';
            searchUnfold.style.display = 'block';
        }
    });

    function getUserToken(callback) {
        chrome.storage.local.get(['redditusertoken'], function (result) {
            const redditusertoken = result.redditusertoken || '';
            callback(redditusertoken);
        });
    }

    async function saveUserToken() {
        chrome.storage.local.set({ redditusertoken: userToken }, function () {
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
        chrome.storage.local.set({ redditrefreshtoken: refreshToken });
    }

    // Function to revoke user token
    async function removeUserToken() {
        const params = `token=${refreshToken}`;

        const url = 'https://www.reddit.com/api/v1/revoke_token';
        const encodedCreds =
            'Basic ' + window.btoa(clientID + ':' + clientSecret);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: new Headers({
                    Authorization: encodedCreds,
                    'user-agent': 'RedditScraper v0.1',
                    'content-type': 'application/x-www-form-urlencoded',
                    'content-length': params.length,
                }),
                body: params,
            });

            if (!response.ok) {
                window.alert('There was an error during revocation');
                throw new Error('Network response was not ok');
            } else {
                window.alert('Authorization successfully revoked');
            }
        } catch (error) {
            console.error('Error:', error);
        }
        chrome.storage.local.remove('redditusertoken', function () {
            userToken = '';
        });
        chrome.storage.local.remove('redditrefreshtoken', function () {
            refreshToken = '';
        });
    }

    // Function to store credentials
    async function saveCredential(input, credType, button, placeholder) {
        let credential = input.value;
        if (credential) {
            chrome.storage.local.set({ [credType]: credential }, function () {
                button.style.backgroundColor = '#4a905f';
                button.style.color = 'white';
                button.style.borderColor = '#4a905f';
                button.textContent = 'Saved';
                input.placeholder = 'Value stored: enter new value to reset';
                input.value = '';
                setTimeout(() => {
                    button.removeAttribute('style');
                    button.textContent = 'Reset';
                }, 2000);
            });
        } else {
            chrome.storage.local.remove([credType], function () {
                button.style.backgroundColor = '#4a905f';
                button.style.color = 'white';
                button.style.borderColor = '#4a905f';
                button.textContent = 'Value reset';
                input.value = '';
                input.placeholder = placeholder;
                setTimeout(() => {
                    button.removeAttribute('style');
                    button.textContent = 'Save';
                }, 2000);
            });
        }
    }

    // Function to obtain authentication code
    async function getCode() {
        clientID = await retrieveCredential('reddit_client_id');
        clientSecret = await retrieveCredential('reddit_client_secret');

        return new Promise((resolve) => {
            if (!clientID || !clientSecret) {
                window.alert('Please provide authentication details');
                return;
            }

            function generateRandomString(length) {
                const charset =
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let result = '';
                for (let i = 0; i < length; i++) {
                    const randomIndex = Math.floor(
                        Math.random() * charset.length
                    );
                    result += charset[randomIndex];
                }
                return result;
            }

            const randomString = generateRandomString(12);

            const codeUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientID}&response_type=code&state=${randomString}&redirect_uri=https://localhost:8080&duration=permanent&scope=read`;

            chrome.tabs.create({ url: codeUrl });
            const tabUrl = 'https://localhost:8080';

            chrome.tabs.onUpdated.addListener(function (
                tabId,
                changeInfo,
                tab
            ) {
                // Check if the tab has completed loading and the URL matches the target URL
                if (
                    changeInfo.status === 'complete' &&
                    tab.url.startsWith(tabUrl)
                ) {
                    const url = tab.url;
                    const clientCode = url.split('code=')[1].split('#_')[0];
                    codeInput.value = clientCode;
                    saveCredential(
                        codeInput,
                        codeCred,
                        codeSaveBtn,
                        codePlaceholder
                    );
                    chrome.tabs.remove(tabId);
                    authorize();
                }
            });
            resolve();
        });
    }

    authBtn.addEventListener('click', async () => {
        await getCode();
    });

    // Function to obtain user token
    async function authorize() {
        clientID = await retrieveCredential('reddit_client_id');
        clientSecret = await retrieveCredential('reddit_client_secret');
        let clientCode = await retrieveCredential('reddit_client_code');

        // Build query
        const params = `grant_type=authorization_code&code=${clientCode}&redirect_uri=https://localhost:8080`;

        const url = 'https://www.reddit.com/api/v1/access_token';
        const encodedCreds =
            'Basic ' + window.btoa(clientID + ':' + clientSecret);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: new Headers({
                    Authorization: encodedCreds,
                    'user-agent': 'RedditScraper v0.1',
                    'content-type': 'application/x-www-form-urlencoded',
                    'content-length': params.length,
                }),
                body: params,
            });

            if (!response.ok) {
                window.alert('There was an error during authorization');
                throw new Error('Network response was not ok');
            }

            const jsonData = await response.json();
            accessToken = jsonData.access_token;
            if (accessToken) {
                userToken = accessToken;
                refreshToken = jsonData.refresh_token;
                await saveUserToken();
                await saveRefreshToken();
                instSpan.style.display = 'none';
                instDiv.style.display = 'none';
                openRedditP.style.display = 'none';
                idContainer.style.display = 'none';
                secretContainer.style.display = 'none';
                authBtnContainer.style.display = 'none';
            } else {
                window.alert('Could not retrieve access token');
                throw new Error('Could not retrieve access token');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Function to refresh user token
    async function renewToken() {
        searchMsg.style.display = 'none';
        const refreshMsg = document.getElementById('refresh-msg');
        refreshMsg.style.display = 'block';
        refreshToken = await retrieveCredential('redditrefreshtoken');

        // Build query
        const params = `grant_type=refresh_token&refresh_token=${refreshToken}`;

        const url = 'https://www.reddit.com/api/v1/access_token';
        const encodedCreds =
            'Basic ' + window.btoa(clientID + ':' + clientSecret);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: new Headers({
                    Authorization: encodedCreds,
                    'user-agent': 'RedditScraper v0.1',
                    'content-type': 'application/x-www-form-urlencoded',
                    'content-length': params.length,
                }),
                body: params,
            });

            if (!response.ok) {
                window.alert('There was an error during authorization');
                throw new Error('Network response was not ok');
            }

            const jsonData = await response.json();
            accessToken = jsonData.access_token;
            if (accessToken) {
                userToken = accessToken;
                await saveUserToken();
                openRedditP.style.display = 'none';
                idContainer.style.display = 'none';
                secretContainer.style.display = 'none';
                authBtnContainer.style.display = 'none';
                refreshMsg.style.display = 'none';
            } else {
                window.alert('Could not renew access token');
                throw new Error('Could not renew access token');
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
    let type = 'link';
    typeSelect.addEventListener('change', () => {
        type = typeSelect.value;
    });
    let sortBy = 'new';
    timeRangeSelect.disabled = true;
    sortBySelect.addEventListener('change', () => {
        sortBy = sortBySelect.value;
        if (sortBy === 'new' || sortBy === 'hot') {
            timeRangeSelect.disabled = true;
        } else {
            timeRangeSelect.disabled = false;
        }
    });
    let timeRange = 'all';
    timeRangeSelect.addEventListener('change', () => {
        timeRange = timeRangeSelect.value;
    });

    async function checkSubreddit(sub) {
        const url =
            'https://oauth.reddit.com/api/search_reddit_names?exact=true&query=' +
            sub;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `bearer ${userToken}`,
                scope: 'read',
            },
        });
        let exist;
        if (response.ok) {
            const data = await response.json();
            const names = data.names;
            if (names.length > 0) {
                exist = true;
            }
        } else if (!response.ok) {
            exist = false;
        }
        return exist;
    }

    let searchMode = 'guided';

    searchModeSelect.addEventListener('change', () => {
        searchMode = searchModeSelect.value;
        if (searchMode === 'guided') {
            guidedSearchDiv.style.display = 'block';
            expertSearchDiv.style.display = 'none';
        } else if (searchMode === 'expert') {
            guidedSearchDiv.style.display = 'none';
            expertSearchDiv.style.display = 'block';
        }
    });

    checkbox.addEventListener('change', () => {
        if (checkbox.checked === true) {
            titleSearchDiv.style.display = 'inline-block';
        } else if (checkbox.checked === false) {
            titleWordsInput.value = '';
            titleSearchDiv.style.display = 'none';
        }
    });

    let queryUrl;

    async function buildQueryUrl() {
        searchMsg.style.display = 'block';
        queryUrl = 'https://oauth.reddit.com/';

        // Concatenate query URL from search elements
        let titleWords = titleWordsInput.value;
        let keywords = keywordsInput.value;
        let allWords = allWordsInput.value;
        let anyWords = anyWordsInput.value.replaceAll(' ', ' OR ');
        let noWords = noWordsInput.value.replaceAll(' ', ' OR ');
        let thisPhrase = thisPhraseInput.value;
        let subreddit = subredditInput.value;
        if (subreddit) {
            const exist = await checkSubreddit(subreddit);
            if (exist) {
                queryUrl = queryUrl + `r/${subreddit}/`;
            } else if (!exist) {
                window.alert('Subreddit does not exist, try again');
                subredditInput.value = '';
                subredditInput.focus();
                searchMsg.style.display = 'none';
                return;
            }
        }
        queryUrl = queryUrl + 'search.json?q=';
        if (titleWords) {
            titleWords = `(${titleWords})`;
            queryUrl = queryUrl + 'title:' + titleWords;
        }
        if (
            titleWords &&
            (keywords || allWords || anyWords || noWords || thisPhrase)
        ) {
            queryUrl = queryUrl + ' AND ';
        }
        if (
            checkbox.checked &&
            (keywords || allWords || anyWords || noWords || thisPhrase)
        ) {
            queryUrl = queryUrl + 'selftext:';
        }
        if (searchMode === 'expert' && keywords) {
            keywords = `(${keywords})`;
            queryUrl = queryUrl + keywords;
        } else if (searchMode === 'guided') {
            if (allWords) {
                allWords = `(${allWords})`;
                queryUrl = queryUrl + allWords;
            }
            if (anyWords) {
                anyWords = `(${anyWords})`;
                if (allWords) {
                    queryUrl = queryUrl + ' AND ';
                }
                queryUrl = queryUrl + anyWords;
            }
            if (thisPhrase) {
                if (allWords || anyWords) {
                    queryUrl = queryUrl + ' AND ';
                }
                queryUrl = queryUrl + '("' + thisPhrase + '")';
            }
            if (noWords) {
                noWords = `(${noWords})`;
                if (allWords || anyWords || thisPhrase) {
                    queryUrl = queryUrl + ' NOT ';
                }
                queryUrl = queryUrl + noWords;
            }
        }
        queryUrl =
            queryUrl + `&t=${timeRange}&sort=${sortBy}&type=${type}&limit=100`;
        queryUrl = encodeURI(queryUrl);
        const queryurlDiv = document.getElementById('queryurl');
        const queryLink = document.createElement('a');
        queryLink.setAttribute('href', queryUrl);
        queryLink.setAttribute('target', '_blank');
        queryLink.textContent = queryUrl;
        queryLink.style.fontWeight = 'normal';
        queryurlDiv.textContent = 'Query URL: ';
        queryurlDiv.appendChild(queryLink);
        console.log('Query URL = ', queryUrl);

        // Fetch query response from server
        try {
            if (
                !titleWords &&
                !keywords &&
                !allWords &&
                !anyWords &&
                !thisPhrase
            ) {
                window.alert('Please provide keywords');
                searchMsg.style.display = 'none';
                return;
            }
            userToken = await retrieveCredential('redditusertoken');
            const response = await fetch(queryUrl, {
                method: 'GET',
                headers: {
                    Authorization: `bearer ${userToken}`,
                    scope: 'read',
                },
            });
            if (userToken && response.status === 401) {
                await renewToken();
                buildQueryUrl();
            } else if (response.status === 401) {
                searchMsg.style.display = 'none';
                window.alert(
                    'Application not authorized: please authenticate with Reddit'
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
            } else {
                const searchData = await response.json();
                const searchResults = searchData.data.children;
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
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Assign role to search button
    searchBtn.addEventListener('click', () => {
        extractContainer.style.display = 'none';
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
    });

    let file;
    let results;
    let after;
    let id;
    let csvData = [];
    let skippedItems = 0;
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
        resultsMsg.textContent = '';
        dlBtn.style.display = 'none';
        dlResult.textContent = '';
        resetBtn.style.display = 'none';
        try {
            await scrape();
            abortBtn.style.display = 'none';
            extractBtn.style.display = 'block';
            formatSelect.disabled = false;
            maxResultsInput.disabled = false;
            extractBtn.disabled = false;
            extractSpinner.style.display = 'none';
            resultCount = resultCount - 1;
            resultsMsg.textContent = resultCount + ' result(s) extracted';
            if (skippedItems > 0) {
                const skippedItemsText = document.createTextNode(
                    ` — ${skippedItems} post(s) ignored: too long for XLSX`
                );
                resultsMsg.appendChild(skippedItemsText);
            }
            dlBtn.textContent = 'Download ' + fileFormat.toUpperCase();
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
        let resultSet = new Set();
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
                ['Username', 'Date', 'Time', 'URL', 'Title', 'Text'],
            ]);
        }

        resultCount = 1;
        skippedItems = 0;

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
                } else if (p > 1 && after) {
                    nextQueryUrl = queryUrl + '&after=' + after.toString();
                } else if (!after) {
                    let kind;
                    if (type === 'link') {
                        kind = 't3_';
                    } else if (type === 'sr') {
                        kind = 't5_';
                    } else if (type === 'user') {
                        kind = 't2_';
                    }
                    nextQueryUrl = queryUrl + '&after=' + kind + id.toString();
                }
                const response = await fetch(nextQueryUrl, {
                    headers: {
                        Authorization: `bearer ${userToken}`,
                        scope: 'read',
                    },
                });
                if (userToken && response.status === 401) {
                    await renewToken();
                    processPage();
                } else if (response.status === 401) {
                    window.alert(
                        'Application not authorized: please authenticate with Reddit'
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
                after = data.data.after;
                results = data.data.children;
                if (
                    results.length == 0 ||
                    (resultCount > 1 && results.length <= 1)
                ) {
                    abort = true;
                }
                for (r of results) {
                    id = r.data.id;
                    if (resultSet.has(id)) {
                        abort = true;
                        return;
                    }
                    resultSet.add(id);

                    title = r.data.title;

                    username = r.data.author;

                    date = r.data.created;
                    date = new Date(date * 1000);
                    date = date.toISOString();
                    dateElements = date.split('T');
                    date = dateElements[0];
                    time = dateElements[1].split('.')[0];

                    text = r.data.selftext;
                    if (!text) {
                        continue;
                    } else if (fileFormat === 'xlsx' && text.length > 32767) {
                        console.log('Text too long for XLSX, skipping');
                        skippedItems++;
                        continue;
                    }

                    url = 'https://www.reddit.com' + r.data.permalink;

                    if (fileFormat === 'xml') {
                        username = username
                            .replaceAll('&', '&amp;')
                            .replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;')
                            .replaceAll('"', '&quot;')
                            .replaceAll("'", '&apos;');
                        text = text
                            .replaceAll('&', '&amp;')
                            .replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;')
                            .replaceAll('"', '&quot;')
                            .replaceAll("'", '&apos;')
                            .replaceAll('&nbsp;', ' ');
                        title = title
                            .replaceAll('&', '&amp;')
                            .replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;')
                            .replaceAll('"', '&quot;')
                            .replaceAll("'", '&apos;')
                            .replaceAll('&nbsp;', ' ');
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
<result id="${id}" username="${username}" date="${date}" time="${time}" title="${title}"><lb></lb>
<ref target="${url}">${url}</ref><lb></lb><lb></lb>
${text}
</result>
<lb></lb><lb></lb>`;
                    } else if (fileFormat === 'txt') {
                        file = file + `\n\n${title}\n\n${text}\n\n——————`;
                    } else if (fileFormat === 'json') {
                        text = text.replaceAll('\n', ' ');
                        file[id] = {
                            username: `${username}`,
                            date: `${date}`,
                            time: `${time}`,
                            url: `${url}`,
                            title: `${title}`,
                            text: `${text}`,
                        };
                    } else if (fileFormat === 'csv') {
                        text = text.replaceAll('\n', ' ');
                        csvData.push({
                            username,
                            date,
                            time,
                            url,
                            title,
                            text,
                        });
                    } else if (fileFormat === 'xlsx') {
                        text = text.replaceAll('\n', ' ');
                        let row = [username, date, time, url, title, text];
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
    });

    // Function to download output file
    function download() {
        try {
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
                    const rows = data.map((obj) =>
                        Object.values(obj).join('\t')
                    );
                    return [header, ...rows].join('\n');
                }
                const csvString = convertToCsv(csvData);
                var myBlob = new Blob([csvString], { type: 'text/csv' });
            } else if (fileFormat === 'xlsx') {
                XLSX.utils.book_append_sheet(file, sheet, 'Results');
                XLSX.writeFile(file, 'reddit_results.xlsx');
            }
            if (fileFormat !== 'xlsx') {
                var url = window.URL.createObjectURL(myBlob);
                var anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `reddit_results.${fileFormat}`;
                anchor.click();
                window.URL.revokeObjectURL(url);
            }
            dlResult.style.display = 'block';
            dlResult.textContent =
                fileFormat.toUpperCase() + ' file downloaded';
        } catch (error) {
            console.error(error);
            window.alert(
                `${fileFormat.toUpperCase()} file creation failed. Try another output format.`
            );
            formatSelect.disabled = false;
            maxResultsInput.disabled = false;
            extractBtn.disabled = false;
            dlBtn.style.display = 'none';
            resetBtn.style.display = 'none';
            dlResult.textContent = '';
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
