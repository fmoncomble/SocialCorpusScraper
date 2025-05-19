document.addEventListener('DOMContentLoaded', async function () {
    // Declare page elements
    const authContainer = document.getElementById('auth-container');
    const authFold = document.getElementById('auth-fold');
    const authUnfold = document.getElementById('auth-unfold');
    const instSpan = document.getElementById('instructions');
    const instDiv = document.getElementById('instructions-container');
    const instanceContainer = document.getElementById('instance-container');
    const instanceInput = document.getElementById('instance-input');
    const instanceSaveBtn = document.getElementById('instance-save');
    const allDone = document.getElementById('all-done');
    const resetAuthBtn = document.getElementById('reset-auth');
    const searchFold = document.getElementById('search-fold');
    const searchUnfold = document.getElementById('search-unfold');
    const searchContainer = document.getElementById('search-container');
    const searchModeSelect = document.getElementById('search-mode');
    const guidedSearchDiv = document.getElementById('guided-search');
    const expertSearchDiv = document.getElementById('expert-search');
    const keywordsInput = document.getElementById('keywords');
    const allWordsInput = document.getElementById('all-words');
    const anyWordsInput = document.getElementById('any-words');
    const thisPhraseInput = document.getElementById('this-phrase');
    const noWordsInput = document.getElementById('no-words');
    const langInput = document.getElementById('lang');
    const accountInput = document.getElementById('account');
    const searchInstanceInput = document.getElementById('search-instance');
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');
    const searchBtn = document.getElementById('search-btn');
    const searchMsg = document.getElementById('search-msg');
    const noResult = document.getElementById('no-result');
    const extractContainer = document.getElementById('extract-container');
    const maxTootsInput = document.getElementById('max-toots');
    const extractBtn = document.getElementById('extract-btn');
    const extractSpinner = document.getElementById('extract-spinner');
    const abortBtn = document.getElementById('abort-btn');
    const resultsContainer = document.getElementById('results-container');
    const resultsMsg = document.getElementById('results-msg');
    const resetBtn = document.getElementById('reset-btn');
    const dlResult = document.getElementById('dl-result');
    const notice = document.getElementById('notice');
    const dismissBtn = document.getElementById('dismiss');
    const dlDialog = document.getElementById('dl-dialog');
    const formatSelect = document.getElementById('format-select');
    const dlConfirmBtn = document.getElementById('dl-confirm-btn');

    // Declare credentials
    let mastoInstance;
    let clientId;
    let clientSecret;
    chrome.storage.local.get(['mastoinstance'], (result) => {
        mastoInstance = result.mastoinstance;
    });
    chrome.storage.local.get(['mastoclientid'], (result) => {
        clientId = result.mastoclientid;
    });
    chrome.storage.local.get(['mastoclientsecret'], (result) => {
        clientSecret = result.mastoclientsecret;
    });

    // Manage notice
    let understand;
    let userToken;

    //Functions to handle user token
    getUserToken(function (userTokenResult) {
        userToken = userTokenResult;

        if (userToken) {
            instSpan.style.display = 'none';
            instDiv.style.display = 'none';
            instanceContainer.style.display = 'none';
            allDone.style.display = 'block';
            searchContainer.style.display = 'block';
            searchFold.style.display = 'block';
            searchUnfold.style.display = 'none';
        } else {
            authContainer.style.display = 'block';
            authFold.style.display = 'block';
            authUnfold.style.display = 'none';
            searchContainer.style.display = 'none';
            searchFold.style.display = 'none';
            searchUnfold.style.display = 'block';
        }
    });

    function getUserToken(callback) {
        chrome.storage.local.get(['mastousertoken'], function (result) {
            const mastousertoken = result.mastousertoken || '';
            callback(mastousertoken);
        });
    }

    async function saveUserToken() {
        chrome.storage.local.set({ mastousertoken: userToken }, function () {
            allDone.style.display = 'block';
            instSpan.style.display = 'none';
            instDiv.style.display = 'none';
            instanceContainer.style.display = 'none';
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

    async function removeUserToken() {
        const formData = new FormData();
        formData.append('client_id', clientId);
        formData.append('client_secret', clientSecret);
        formData.append('token', userToken);

        const url = 'https://' + mastoInstance + '/oauth/revoke';

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                window.alert(
                    'Could not revoke authorization: server responded with error ' +
                        response.status
                );
                throw new Error('Could not revoke token: ', response.status);
            } else {
                window.alert('Authorization successfully revoked');
            }
        } catch (error) {
            console.error('Error: ', error);
        }
        chrome.storage.local.remove('mastousertoken', function () {
            userToken = null;
        });
    }

    // Functions to handle notice
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

    // Assign role to Instructions header
    instSpan.addEventListener('click', () => {
        if (instDiv.style.display === 'none') {
            instDiv.style.display = 'block';
            instSpan.textContent = 'Hide instructions';
        } else if (instDiv.style.display === 'block') {
            instDiv.style.display = 'none';
            instSpan.textContent = 'Show instructions';
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

    // Assign function to Mastodon instance input & button
    instanceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (instanceInput.value) {
                mastoInstance = instanceInput.value.trim();
                if (mastoInstance.startsWith('http')) {
                    mastoInstance = mastoInstance.split('/')[2];
                }
                chrome.storage.local.set({
                    mastoinstance: mastoInstance,
                });
                authenticate();
            } else {
                window.alert('Entrez votre instance Mastodon');
                instanceInput.focus();
            }
        }
    });
    instanceSaveBtn.addEventListener('click', () => {
        if (instanceInput.value) {
            mastoInstance = instanceInput.value.trim();
            if (mastoInstance.startsWith('http')) {
                mastoInstance = mastoInstance.split('/')[2];
            }
            chrome.storage.local.set({
                mastoinstance: mastoInstance,
            });
            authenticate();
        } else {
            window.alert('Entrez votre instance Mastodon');
            instanceInput.focus();
        }
    });

    // Oauth flow function
    async function authenticate() {
        let instance = instanceInput.value.trim();
        let redirectUri;
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Chrome') > -1) {
            redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
        } else if (userAgent.indexOf('Firefox') > -1) {
            redirectUri = browser.identity.getRedirectURL();
        }
        let createAppUrl = `https://${instance}/api/v1/apps`;
        let response = await fetch(createAppUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_name: 'MastoScraper',
                redirect_uris: redirectUri,
                scopes: 'read',
                website: redirectUri,
            }),
        });
        if (!response.ok) {
            let errorData = await response.json();
            console.error('Error creating app: ', response.status, errorData);
            return;
        } else if (response && response.ok) {
            let data = await response.json();
            clientId = data.client_id;
            chrome.storage.local.set({ mastoclientid: clientId });
            clientSecret = data.client_secret;
            chrome.storage.local.set({ mastoclientsecret: clientSecret });
        }
        chrome.identity.launchWebAuthFlow(
            {
                url: `https://${instanceInput.value}/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=read`,
                interactive: true,
            },
            (redirectUrl) => {
                if (chrome.runtime.lastError || !redirectUrl) {
                    console.error(chrome.runtime.lastError);
                    return;
                }
                const urlParams = new URLSearchParams(
                    new URL(redirectUrl).search
                );
                const code = urlParams.get('code');
                fetch(`https://${instance}/oauth/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: clientId,
                        client_secret: clientSecret,
                        grant_type: 'authorization_code',
                        code: code,
                        redirect_uri: redirectUri,
                    }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        userToken = data.access_token;
                        saveUserToken();
                    })
                    .catch((error) => console.error('Error: ', error));
            }
        );
    }

    // Reset authentication button
    resetAuthBtn.addEventListener('click', async () => {
        await removeUserToken();
        removeUnderstand();
        instanceContainer.style.display = 'block';
        allDone.style.display = 'none';
        searchContainer.style.display = 'none';
        location.reload();
    });

    // Logic to build query URL from inputs
    let queryUrl;
    let lang;
    accountInput.addEventListener('change', () => {
        accountInput.removeAttribute('style');
    });

    let fromDate;
    let min_id;
    fromDateInput.addEventListener('change', () => {
        fromDate = new Date(fromDateInput.value);
        const fromDateStamp = BigInt(fromDate.getTime() / 1000);
        min_id = (fromDateStamp << 16n) * 1000n;
    });

    let toDate;
    let max_id;
    toDateInput.addEventListener('change', () => {
        toDate = new Date(toDateInput.value);
        const toDateStamp = BigInt(toDate.getTime() / 1000);
        max_id = (toDateStamp << 16n) * 1000n;
    });

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

    async function buildQueryUrl() {
        if (!mastoInstance) {
            window.alert('Please enter your Mastodon instance');
            searchMsg.style.display = 'none';
            return;
        }
        queryUrl = 'https://' + mastoInstance + '/api/v2/search?';

        // Concatenate query URL from search elements
        let keywords = keywordsInput.value;
        let allWords = allWordsInput.value.replaceAll(' ', ' AND ');
        let anyWords = anyWordsInput.value.replaceAll(' ', ' OR ');
        let thisPhrase = thisPhraseInput.value;
        let noWords = noWordsInput.value.replaceAll(' ', ' OR ');
        lang = langInput.value;
        let account = accountInput.value.replaceAll(' ', ' AND ');
        if (fromDate) {
        }
        if (searchMode === 'expert') {
            keywords = `(${keywords})`;
            queryUrl = queryUrl + 'q=' + keywords;
        } else if (searchMode === 'guided') {
            if (allWords || anyWords || thisPhrase) {
                queryUrl = queryUrl + 'q=';
            }
            if (allWords) {
                queryUrl = queryUrl + `(${allWords})`;
            }
            if (anyWords) {
                if (allWords) {
                    queryUrl = queryUrl + ' AND ';
                }
                queryUrl = queryUrl + `(${anyWords})`;
            }
            if (thisPhrase) {
                if (allWords || anyWords) {
                    queryUrl = queryUrl + ' AND ';
                }
                queryUrl = queryUrl + '("' + thisPhrase + '")';
            }
            if (noWords) {
                if (allWords || anyWords || thisPhrase) {
                    queryUrl = queryUrl + ' NOT ';
                }
                queryUrl = queryUrl + `(${noWords})`;
            }
        }
        if (account) {
            try {
                getIdUrl =
                    'https://' +
                    mastoInstance +
                    '/api/v1/accounts/lookup?acct=' +
                    account;
                const idResponse = await fetch(getIdUrl);
                if (idResponse.ok) {
                    const idData = await idResponse.json();
                    account = idData.id;
                } else {
                    window.alert('Account not found');
                    searchMsg.style.display = 'none';
                    accountInput.style.outline = 'solid 2px #e60000';
                    accountInput.style.border = 'solid 1px #e60000';
                    accountInput.focus();
                    return;
                }
                if (allWords || anyWords || thisPhrase) {
                    queryUrl = queryUrl + '&';
                }
                queryUrl = queryUrl + 'account_id=' + account;
            } catch (error) {
                console.error(error);
            }
        }
        if (fromDate) {
            if (allWords || anyWords || thisPhrase) {
                queryUrl = queryUrl + '&';
            }
            queryUrl = queryUrl + 'min_id=' + min_id;
        }
        if (toDate) {
            if (allWords || anyWords || thisPhrase) {
                queryUrl = queryUrl + '&';
            }
            queryUrl = queryUrl + 'max_id=' + max_id;
        }
        queryUrl = queryUrl + '&type=statuses&resolve=true';
        queryUrl = encodeURI(queryUrl);
        const queryurlDiv = document.getElementById('queryurl');
        const queryLink = document.createElement('a');
        queryLink.setAttribute('href', queryUrl);
        queryLink.setAttribute('target', '_blank');
        queryLink.textContent = queryUrl;
        queryLink.style.fontWeight = 'normal';
        queryurlDiv.textContent = 'Query URL: ';
        queryurlDiv.appendChild(queryLink);

        // Fetch query response from server
        try {
            if (!keywords && !allWords && !anyWords && !thisPhrase) {
                window.alert('Please provide keywords');
                searchMsg.style.display = 'none';
                return;
            }
            const response = await fetch(queryUrl, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                    scope: 'read',
                },
            });
            if (response.status === 401) {
                searchMsg.style.display = 'none';
                window.alert(
                    'Application not authorized: please authenticate with Mastodon'
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
            const searchResults = searchData.statuses;
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
    let maxToots;
    maxTootsInput.addEventListener('change', () => {
        maxToots = maxTootsInput.value;
        if (!maxToots) {
            maxToots = Infinity;
        }
    });

    let searchInstances;
    searchInstanceInput.addEventListener('change', () => {
        searchInstanceInput.value = searchInstanceInput.value.replaceAll(
            ' ',
            ''
        );
        searchInstances = searchInstanceInput.value.split(',');
    });

    let statuses = [];
    let posts = [];
    let id;
    let skippedItems = 0;
    let nextQueryUrl;

    // Assign function to extract button
    extractBtn.addEventListener('click', () => {
        triggerScrape();
    });

    async function triggerScrape() {
        formatSelect.disabled = true;
        maxTootsInput.disabled = true;
        abortBtn.style.display = 'block';
        extractBtn.style.display = 'none';
        resultsContainer.style.display = 'block';
        resultsMsg.textContent = '';
        dlResult.textContent = '';
        resetBtn.style.display = 'none';
        try {
            await scrape();
            abortBtn.style.display = 'none';
            extractBtn.style.display = 'block';
            formatSelect.disabled = false;
            maxTootsInput.disabled = false;
            extractBtn.disabled = false;
            extractSpinner.style.display = 'none';
            resultsMsg.textContent = statuses.length + ' toot(s) extracted';
            showOptions(statuses);
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
    // Function to scrape toots
    async function scrape() {
        let tootSet = new Set();
        abort = false;
        extractBtn.style.display = 'none';
        abortBtn.style.display = 'block';
        if (!maxToots) {
            maxToots = Infinity;
        }

        let p = 1;

        tootCount = 1;
        skippedItems = 0;

        while (statuses.length < maxToots) {
            await processPage();

            if (statuses.length >= maxToots || abort) {
                abortBtn.textContent = 'Abort';
                abortBtn.style.display = 'none';
                extractBtn.style.display = 'block';
                extractBtn.disabled = true;
                abort = false;
                break;
            }
        }

        async function processPage() {
            try {
                if (maxToots) {
                    maxToots = Number(maxToots);
                }
                if (p === 1) {
                    nextQueryUrl = queryUrl;
                } else if (p > 1) {
                    nextQueryUrl = new URL(queryUrl);
                    nextQueryUrl.searchParams.set('max_id', id.toString());
                    nextQueryUrl = nextQueryUrl.toString();
                }
                nextQueryUrl = nextQueryUrl + '&limit=40';
                const response = await fetch(nextQueryUrl, {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        scope: 'read',
                    },
                });
                if (response.status === 401) {
                    window.alert(
                        'Application not authorized: please authenticate with Mastodon'
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
                if (
                    !data.statuses.length ||
                    (tootCount > 1 && data.statuses.length <= 1)
                ) {
                    abort = true;
                }
                for (let s of data.statuses) {
                    if (statuses.length >= maxToots) {
                        abort = true;
                        break;
                    }
                    const parser = new DOMParser();
                    if (tootSet.has(s.id)) {
                        continue;
                    }
                    if (lang && s.language !== lang) {
                        continue;
                    }
                    if (fromDate && s.created_at < fromDate) {
                        abort = true;
                        break;
                    }
                    if (toDate && s.created_at > toDate) {
                        continue;
                    }

                    let sInstance = s.account.acct.split('@')[1];
                    if (searchInstances && searchInstances.length > 0) {
                        if (!searchInstances.includes(sInstance)) {
                            continue;
                        }
                    }
                    tootSet.add(s.id);
                    let rawText = s.content;
                    let rawTextHtml = parser.parseFromString(
                        rawText,
                        'text/html'
                    );
                    let rawTextString = rawTextHtml.documentElement.innerHTML;
                    rawTextString = rawTextString
                        .replaceAll('<br>', '\n')
                        .replaceAll('<p>', '\n')
                        .replaceAll(/<.+?>/gu, '');
                    s.content = rawTextString.normalize('NFC');
                    statuses.push(s);
                    id = s.id;
                    if (maxToots !== Infinity) {
                        resultsMsg.textContent = `${statuses.length} out of ${maxToots} extracted...`;
                    } else {
                        resultsMsg.textContent = `${statuses.length} toot(s) extracted...`;
                    }
                    if (statuses.length > maxToots) {
                        return;
                    }
                }
                p++;
            } catch (error) {
                console.error(error);
            }
        }
    }

    // Show data options dialog
    function showOptions(statuses) {
        const commonKeys = getCommonKeys(statuses);
        const keyTree = buildKeyTree(statuses[0], commonKeys);
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
        postCountSpan.textContent = `${statuses.length} post(s) extracted — `;
        const closeBtn = dlDialog.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            dlDialog.close();
        });
        dlDialog.showModal();

        function getCommonKeys(statuses) {
            if (statuses.length === 0) return [];

            const commonKeys = new Set(Object.keys(statuses[0]));

            for (let status of statuses) {
                if (!status) {
                    continue;
                }
                for (let key of commonKeys) {
                    if (!(key in status)) {
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
                        key === 'content' ||
                        key === 'account.acct' ||
                        key === 'created_at' ||
                        key === 'url'
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
        for (let s of statuses) {
            let post = {};
            for (let checkbox of checkboxes) {
                if (checkbox.checked) {
                    const key = checkbox.id;
                    const value = getNestedValue(s, key);
                    post[key.replaceAll('.', '-')] = value;
                }
            }
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
        anchor.download = 'mastodon_scrape.csv';
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
        anchor.download = 'mastodon_scrape.json';
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
            let postData = '<lb/>\n<toot';
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
                if (key !== 'content' && key !== 'url') {
                    postData += ` ${key}="${p[key]}"`;
                }
            }
            postData += '>';
            postData += `<lb/><ref target="${p.url}">Link to post</ref><lb/>`;
            let text = p['content'];
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
            postData += '</toot><lb/><lb/>\n';
            xml += postData;
        }
        xml += `</Text>`;
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'mastodon_scrape.xml';
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
            let postData = p['content'];
            postData += '\n\n';
            txt += postData;
        }
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'mastodon_scrape.txt';
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
        const worksheet = workbook.addWorksheet('mastodon_scrape');
        worksheet.columns = Object.keys(posts[0]).map((key) => {
            return { header: key, key: key, width: widths.shift() };
        });

        const rows = [];
        function isDate(value) {
            const regexp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3}Z)?/;
            return regexp.test(value);
        }
        for (let p of posts) {
            if (p.content.length > 32767) {
                continue;
            }
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
                name: 'mastodon_scrape',
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
        anchor.download = 'mastodon_scrape.xlsx';
        anchor.click();
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
