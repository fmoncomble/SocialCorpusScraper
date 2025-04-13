console.log('BlueskyScraper script loaded');

document.addEventListener('DOMContentLoaded', async function () {
    // Set version number
    // const versionDiv = document.getElementById('version-div');
    // const version = chrome.runtime.getManifest().version;
    // versionDiv.textContent = 'v' + version;

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
    const keywordRadio = document.getElementById('keyword-search');
    const authorRadio = document.getElementById('author-dump');
    const keywordSearchContainer = document.getElementById(
        'keyword-search-container'
    );
    const keywordsInput = document.getElementById('keywords');
    const thisPhraseInput = document.getElementById('this-phrase');
    const sinceInput = document.getElementById('since');
    const untilInput = document.getElementById('until');
    const authorInput = document.getElementById('author');
    const includeRepliesDiv = document.getElementById('include-replies-div');
    const includeRepliesCheckbox = document.getElementById('include-replies');
    const includeRepostsCheckbox = document.getElementById('include-reposts');
    const langInput = document.getElementById('lang');
    const tagInput = document.getElementById('tag');
    const sortBySelect = document.querySelector('select#sort-by');
    const searchBtn = document.getElementById('search-btn');
    const searchMsg = document.getElementById('search-msg');
    const noResult = document.getElementById('no-result');
    const extractContainer = document.getElementById('extract-container');
    const formatSelect = document.getElementById('format-select');
    const dlConfirmBtn = document.getElementById('dl-confirm-btn');
    const maxResultsInput = document.getElementById('max-results');
    const extractBtn = document.getElementById('extract-btn');
    const extractSpinner = document.getElementById('extract-spinner');
    const abortBtn = document.getElementById('abort-btn');
    const resultsContainer = document.getElementById('results-container');
    const resultsMsg = document.getElementById('results-msg');
    const dlContainer = document.getElementById('dl-container');
    const resetBtn = document.getElementById('reset-btn');
    const dlDialog = document.getElementById('dl-dialog');

    let clientID;
    let clientSecret;
    let userToken;
    let refreshToken;
    userToken = await retrieveCredential('blueskyusertoken');
    refreshToken = await retrieveCredential('blueskyrefreshtoken');

    if (userToken) {
        checkSession();
    }

    // Check session status
    async function checkSession() {
        if (!userToken) {
            return;
        }
        const res = await fetch(
            'https://bsky.social/xrpc/com.atproto.server.getSession',
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
            }
        );
        if (res.status !== 200) {
            await renewToken();
        }
    }

    // Listen to Authentication header
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

    // Listen to 'Build search query' header
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

    // Handle user token
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

    // Handle refresh token
    async function saveRefreshToken() {
        chrome.storage.local.set({ blueskyrefreshtoken: refreshToken });
    }

    // Revoke user token
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

    // Obtain user token
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

    // Renew token
    async function renewToken() {
        const url =
            'https://bsky.social/xrpc/com.atproto.server.refreshSession';
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: new Headers({
                    'content-type': 'application/json',
                    Authorization: `Bearer ${refreshToken}`,
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
                window.alert('Could not renew access token');
                throw new Error('Could not renew access token');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Retrieve credential from storage
    function retrieveCredential(credType) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([credType], function (result) {
                const credential = result[credType] || '';
                resolve(credential);
            });
        });
    }

    // Manage mode
    let mode = 'keyword-search';
    keywordRadio.checked = true;
    keywordRadio.addEventListener('change', () => {
        if (keywordRadio.checked) {
            mode = 'keyword-search';
            keywordSearchContainer.style.display = 'block';
            includeRepliesDiv.style.display = 'none';
            sortBySelect.disabled = false;
        }
    });
    authorRadio.addEventListener('change', () => {
        if (authorRadio.checked) {
            mode = 'author-dump';
            keywordSearchContainer.style.display = 'none';
            includeRepliesDiv.style.display = 'block';
            sortBySelect.disabled = true;
        }
    });

    // Build query URL from inputs
    let queryUrl;
    let sortBy = 'latest';
    sortBySelect.addEventListener('change', () => {
        sortBy = sortBySelect.value;
    });

    async function buildQueryUrl() {
        queryUrl = 'https://bsky.social/xrpc/app.bsky.feed.searchPosts?';

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

        try {
            if (!keywords && !thisPhrase) {
                window.alert('Please provide keywords');
                searchMsg.style.display = 'none';
                return;
            }
            userToken = await retrieveCredential('blueskyusertoken');
            if (!userToken) {
                window.alert('Please authenticate with Bluesky');
                searchMsg.style.display = 'none';
                authContainer.style.display = 'block';
                authFold.style.display = 'block';
                authUnfold.style.display = 'none';
                return;
            }
            await checkSession();
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
                const errorData = await response.json();
                window.alert(`Error fetching results: "${errorData.message}"`);
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

    // Check author handle
    let did = null;
    async function resolveHandle() {
        let authorHandle = authorInput.value.trim();
        if (!authorHandle) {
            window.alert('Please provide an author handle');
            searchMsg.style.display = 'none';
            return;
        }
        let url = `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${authorHandle.trim()}`;
        try {
            const res = await fetch(url);
            if (!res.ok) {
                searchMsg.style.display = 'none';
                noResult.style.display = 'block';
                window.alert(
                    `Handle ${authorHandle} is invalid. Please try again.`
                );
                return;
            } else {
                const data = await res.json();
                if (data.error) {
                    searchMsg.style.display = 'none';
                    noResult.style.display = 'block';
                    window.alert(
                        `Handle ${authorHandle} is invalid. Please try again.`
                    );
                    return;
                } else {
                    searchMsg.style.display = 'none';
                    searchContainer.style.display = 'none';
                    searchFold.style.display = 'none';
                    searchUnfold.style.display = 'block';
                    extractContainer.style.display = 'block';
                    extractBtn.style.display = 'block';
                    return data.did;
                }
            }
        } catch (error) {
            window.alert('There was an error retrieving author handle.');
            console.error(error);
        }
    }

    // Listen to search button
    searchBtn.addEventListener('click', async () => {
        extractContainer.style.display = 'none';
        searchMsg.style.display = 'block';
        noResult.style.display = 'none';
        if (mode === 'keyword-search') {
            buildQueryUrl();
        } else if (mode === 'author-dump') {
            did = await resolveHandle();
        }
    });

    // Declare extraction variables
    let maxResults;
    maxResultsInput.addEventListener('change', () => {
        maxResults = maxResultsInput.value;
        if (!maxResults) {
            maxResults = Infinity;
        }
    });

    let results;
    let cursor;
    let records = [];
    let posts = [];
    let resultCount = 1;
    let nextQueryUrl;

    // Listen to extract button
    extractBtn.addEventListener('click', () => {
        if (records.length === 0) {
            triggerScrape();
        } else {
            showOptions(records);
        }
    });

    // Launch scrape
    async function triggerScrape() {
        maxResultsInput.disabled = true;
        abortBtn.style.display = 'block';
        extractBtn.style.display = 'none';
        resultsContainer.style.display = 'block';
        dlContainer.style.display = 'none';
        try {
            records = await scrape();
            if (records && records.length > 0) {
                dlContainer.style.display = 'block';
                resetBtn.style.display = 'inline-block';
                abortBtn.style.display = 'none';
                extractBtn.style.display = 'block';
                extractSpinner.style.display = 'none';
                resultCount = resultCount - 1;
                resultsMsg.textContent = resultCount + ' result(s) extracted';
                showOptions(records);
            } else {
                throw new Error('No records to extract');
            }
        } catch (error) {
            console.error('Error: ', error);
        }
    }

    // Listen to abort button
    abortBtn.addEventListener('click', () => {
        abortBtn.textContent = 'Aborting...';
        abort = true;
    });

    // Scrape results
    async function scrape() {
        await checkSession();
        records = [];
        let since = sinceInput.value;
        let until = untilInput.value;
        if (mode === 'author-dump') {
            queryUrl = `https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed?`;
            queryUrl += `actor=${did}&`;
            if (includeRepliesCheckbox.checked) {
                queryUrl += `filter=posts_with_replies`;
            } else {
                queryUrl += `filter=posts_no_replies`;
            }
            if (until) {
                until = until + 'T23:59:59.999Z';
                cursor = until.toString();
            }
        }
        queryUrl = queryUrl + '&limit=100';
        abort = false;
        extractBtn.style.display = 'none';
        abortBtn.style.display = 'block';
        if (!maxResults) {
            maxResults = Infinity;
        }

        let p = 1;
        while (resultCount <= maxResults) {
            await processPage();

            if (resultCount > maxResults || abort) {
                abortBtn.textContent = 'Abort';
                abortBtn.style.display = 'none';
                extractBtn.style.display = 'block';
                dlContainer.style.display = 'block';
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
                    if (mode === 'author-dump' && cursor) {
                        nextQueryUrl =
                            queryUrl + '&cursor=' + cursor.toString();
                    } else {
                        nextQueryUrl = queryUrl;
                    }
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
                    const errorData = await response.json();
                    window.alert(
                        `Error fetching results: "${errorData.message}"`
                    );
                    throw new Error(
                        'HTTP error, could not fetch search results'
                    );
                }
                const data = await response.json();
                cursor = data.cursor;
                if (mode === 'author-dump') {
                    results = data.feed;
                } else {
                    results = data.posts;
                }
                if (
                    results.length == 0 ||
                    (resultCount > 1 && results.length <= 1)
                ) {
                    abort = true;
                }
                for (r of results) {
                    if (mode === 'author-dump') {
                        if (!includeRepostsCheckbox.checked && r.reason) {
                            continue;
                        }
                        r = r.post;
                        if (since && r.record.createdAt < since) {
                            abort = true;
                            break;
                        }
                    }
                    records.push(r);
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
        if (records && records.length > 0) {
            return records;
        } else {
            window.alert('No posts could be scraped.');
            return false;
        }
    }

    // Show data options dialog
    function showOptions(records) {
        const commonKeys = getCommonKeys(records);
        const keyTree = buildKeyTree(records[0], commonKeys);
        const container = dlDialog.querySelector('#keys-container');
        container.textContent = '';
        generateListTree(keyTree, container);
        const checkboxes = dlDialog.querySelectorAll(
            'input[type="checkbox"].data-item'
        );
        checkboxes.forEach((checkbox) => {
            updateParentCheckboxes(checkbox);
        });
        const postCountSpan = dlDialog.querySelector('#post-count');
        postCountSpan.textContent = `${records.length} post(s) extracted — `;
        const closeBtn = dlDialog.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            dlDialog.close();
        });
        dlDialog.showModal();

        function getCommonKeys(records) {
            if (records.length === 0) return [];

            const commonKeys = new Set(Object.keys(records[0]));

            for (let record of records) {
                if (!record) {
                    continue;
                }
                for (let key of commonKeys) {
                    if (!(key in record)) {
                        commonKeys.delete(key);
                    }
                }
            }

            return Array.from(commonKeys);
        }

        function buildKeyTree(obj, commonKeys, prefix = '') {
            let tree = {};
            for (let key of commonKeys) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    tree[fullKey] = buildKeyTree(
                        obj[key],
                        Object.keys(obj[key]),
                        fullKey
                    );
                } else {
                    tree[fullKey] = null;
                }
            }
            return tree;
        }

        function generateListTree(tree, container) {
            const ul = document.createElement('ul');
            ul.style.listStyleType = 'none';

            for (let key in tree) {
                if (tree.hasOwnProperty(key)) {
                    const li = document.createElement('li');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.classList.add('data-item');
                    checkbox.id = key;
                    checkbox.name = key;

                    if (
                        key === 'record.text' ||
                        key === 'author.handle' ||
                        key === 'record.createdAt'
                    ) {
                        checkbox.checked = true;
                    }

                    const label = document.createElement('label');
                    label.htmlFor = key;
                    label.appendChild(
                        document.createTextNode(
                            key.split('.')[key.split('.').length - 1]
                        )
                    );

                    li.appendChild(checkbox);
                    li.appendChild(label);
                    ul.appendChild(li);

                    if (tree[key] !== null) {
                        const nestedContainer = document.createElement('div');
                        nestedContainer.style.marginLeft = '20px';
                        generateListTree(tree[key], nestedContainer);
                        li.appendChild(nestedContainer);

                        checkbox.addEventListener('change', function () {
                            const childCheckboxes =
                                nestedContainer.querySelectorAll(
                                    'input[type="checkbox"]'
                                );
                            childCheckboxes.forEach((childCheckbox) => {
                                childCheckbox.checked = checkbox.checked;
                                childCheckbox.indeterminate = false;
                            });
                        });
                    }

                    checkbox.addEventListener('change', function () {
                        updateParentCheckboxes(checkbox);
                    });
                }
            }
            container.appendChild(ul);
        }

        function updateParentCheckboxes(checkbox) {
            const parentLi = checkbox.closest('li').parentElement.closest('li');
            if (parentLi) {
                const parentCheckbox = parentLi.querySelector(
                    'input[type="checkbox"]'
                );
                const childCheckboxes = parentLi.querySelectorAll(
                    'div > ul > li > input[type="checkbox"]'
                );
                const allChecked = Array.from(childCheckboxes).every(
                    (child) => child.checked
                );
                const someChecked = Array.from(childCheckboxes).some(
                    (child) => child.checked
                );

                parentCheckbox.checked = allChecked;
                parentCheckbox.indeterminate = !allChecked && someChecked;

                updateParentCheckboxes(parentCheckbox);
            }
        }
    }

    let fileFormat = 'xml';
    formatSelect.addEventListener('change', () => {
        fileFormat = formatSelect.value;
        if (fileFormat === 'xlsx') {
            const tableFormat = document.createElement('label');
            tableFormat.htmlFor = 'table-checkbox';
            tableFormat.textContent = 'Format as table';
            tableFormat.style.display = 'block';
            const tableCheckbox = document.createElement('input');
            tableCheckbox.type = 'checkbox';
            tableCheckbox.id = 'table-checkbox';
            tableCheckbox.style.verticalAlign = 'middle';
            tableCheckbox.checked = true;
            tableFormat.appendChild(tableCheckbox);
            dlConfirmBtn.after(tableFormat);
        } else {
            const tableFormat = document.querySelector(
                'label[for="table-checkbox"]'
            );
            if (tableFormat) {
                tableFormat.remove();
            }
        }
    });

    // Listen to download button
    dlConfirmBtn.addEventListener('click', () => {
        buildData();
        if (fileFormat === 'json') {
            downloadJson();
        } else if (fileFormat === 'csv') {
            downloadCsv();
        } else if (fileFormat === 'xml') {
            downloadXml();
        } else if (fileFormat === 'txt') {
            downloadTxt();
        } else if (fileFormat === 'xlsx') {
            downloadXlsx();
        }
    });

    function getNestedValue(obj, keyPath) {
        return keyPath.split('.').reduce((acc, key) => acc && acc[key], obj);
    }

    function buildData() {
        posts = [];
        const checkboxes = dlDialog.querySelectorAll(
            'input[type="checkbox"].data-item'
        );
        for (let r of records) {
            let post = {};
            for (let checkbox of checkboxes) {
                if (checkbox.checked) {
                    const key = checkbox.id;
                    const value = getNestedValue(r, key);
                    post[key.replaceAll('.', '-')] = value;
                }
            }
            post.url = `https://bsky.app/profile/${r.author.did}/post/${
                r.uri.split('post/')[1]
            }`;
            posts.push(post);
        }
    }

    // Download functions
    function downloadCsv() {
        const spinner = document.createElement('span');
        spinner.classList.add('spinner');
        dlConfirmBtn.textContent = '';
        dlConfirmBtn.appendChild(spinner);
        spinner.style.display = 'inline-block';
        const header = Object.keys(posts[0]).join('\t');
        const rows = posts.map((post) => Object.values(post).join('\t'));
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'bsky_scrape.csv';
        spinner.remove();
        dlConfirmBtn.textContent = 'Download';
        anchor.click();
    }

    function downloadJson() {
        const spinner = document.createElement('span');
        spinner.classList.add('spinner');
        dlConfirmBtn.textContent = '';
        dlConfirmBtn.appendChild(spinner);
        spinner.style.display = 'inline-block';
        const json = JSON.stringify(posts, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'bsky_scrape.json';
        spinner.remove();
        dlConfirmBtn.textContent = 'Download';
        anchor.click();
    }

    function downloadXml() {
        const spinner = document.createElement('span');
        spinner.classList.add('spinner');
        dlConfirmBtn.textContent = '';
        dlConfirmBtn.appendChild(spinner);
        spinner.style.display = 'inline-block';
        let xml = '<Text>';
        for (let p of posts) {
            let postData = '<lb/>\n<skeet';
            for (let [key, value] of Object.entries(p)) {
                if (typeof value === 'string') {
                    p[key] = value
                        .replaceAll(/&/g, '&amp;')
                        .replaceAll(/</g, '&lt;')
                        .replaceAll(/>/g, '&gt;')
                        .replaceAll(/"/g, '&quot;')
                        .replaceAll(/'/g, '&apos;')
                        .replaceAll(/\u00A0/g, ' ');
                }
                if (key !== 'record-text' && key !== 'url') {
                    postData += ` ${key}="${p[key]}"`;
                }
            }
            postData += '>';
            postData += `<lb/><ref target="${p.url}">Link to post</ref><lb/>`;
            let text = p['record-text'];
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
            postData += `<lb/>${text.replaceAll(/\n/g, '<lb/>')}`;
            postData += '</skeet><lb/><lb/>\n';
            xml += postData;
        }
        xml += `</Text>`;
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'bsky_scrape.xml';
        spinner.remove();
        dlConfirmBtn.textContent = 'Download';
        anchor.click();
    }

    function downloadTxt() {
        const spinner = document.createElement('span');
        spinner.classList.add('spinner');
        dlConfirmBtn.textContent = '';
        dlConfirmBtn.appendChild(spinner);
        spinner.style.display = 'inline-block';
        let txt = '';
        for (let p of posts) {
            let postData = p['record-text'];
            postData += '\n\n';
            txt += postData;
        }
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'bsky_scrape.txt';
        spinner.remove();
        dlConfirmBtn.textContent = 'Download';
        anchor.click();
    }

    async function downloadXlsx() {
        let widths = [];
        Object.keys(posts[0]).forEach((key) => {
            widths.push({ key: key, widths: [] });
        });
        for (let p of posts) {
            for (let [key, value] of Object.entries(p)) {
                if (value) {
                    let vString = value.toString();
                    widths
                        .find((w) => w.key === key)
                        .widths.push(key.length, vString.length);
                }
            }
        }
        widths = widths.map((w) => {
            w.widths.sort((a, b) => b - a);
            return w.widths[0];
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('bsky_scrape');
        worksheet.columns = Object.keys(posts[0]).map((key) => {
            return { header: key, key: key, width: widths.shift() };
        });

        const rows = [];
        function isDate(value) {
            const regexp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3}Z)?/;
            return regexp.test(value);
        }
        for (let p of posts) {
            let row = [];
            for (let [key, value] of Object.entries(p)) {
                if (isDate(value)) {
                    value = new Date(value);
                } else if (key === 'url') {
                    value = {
                        text: value,
                        hyperlink: value,
                        tooltip: 'Link to post',
                    };
                }
                row.push(value);
            }
            rows.push(row);
        }

        const tableCheckbox = document.getElementById('table-checkbox');
        if (tableCheckbox.checked) {
            worksheet.addTable({
                name: 'bsky_scrape',
                ref: 'A1',
                headerRow: true,
                totalsRow: false,
                style: {
                    theme: 'TableStyleMedium9',
                    showRowStripes: true,
                },
                columns: worksheet.columns.map((col) => ({
                    name: col.header,
                    filterButton: true,
                })),
                rows: rows,
            });
        } else {
            worksheet.addRows(rows);
        }
        const urlCol = worksheet.getColumn('url');
        if (urlCol) {
            urlCol.eachCell(function (cell) {
                if (cell.value && cell.value.hyperlink) {
                    cell.style = {
                        font: { color: { argb: 'ff0000ff' }, underline: true },
                    };
                }
            });
        }
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'bsky_scrape.xlsx';
        anchor.click();
    }

    // Listen to reset button
    resetBtn.addEventListener('click', () => {
        const inputs = searchContainer.querySelectorAll('input');
        for (let input of inputs) {
            input.value = '';
        }
        location.reload();
    });
});
