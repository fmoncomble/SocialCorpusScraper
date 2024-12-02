document.addEventListener('DOMContentLoaded', function () {
    // Set version
    const versionDiv = document.getElementById('version-div');
    const version = chrome.runtime.getManifest().version;
    versionDiv.textContent = `v${version}`;

    // Declare page elements
    const maxPostsInput = document.getElementById('max-posts');
    const filtersHeader = document.getElementById('filters-header');
    const filterSpan = document.getElementById('filters-span');
    const filterContainer = document.getElementById('filter-container');
    const langInput = document.getElementById('lang-filter');
    const handleInput = document.getElementById('handle-filter');
    const regexpCheckbox = document.getElementById('regexp-checkbox');
    const regexpDiv = document.getElementById('regexp-div');
    const regexpInput = document.getElementById('regexp-filter');
    const keywordDiv = document.getElementById('keyword-div');
    const wholewordsCheckbox = document.getElementById('wholewords-checkbox');
    const caseCheckbox = document.getElementById('case-checkbox');
    const anyKWInput = document.getElementById('any-keyword-filter');
    const allKWInput = document.getElementById('all-keywords-filter');
    const exactPhraseInput = document.getElementById('exact-phrase-filter');
    const excludeKWInput = document.getElementById('exclude-keyword-filter');
    const streamBtn = document.getElementById('stream-btn');
    const postCounterSpan = document.getElementById('post-counter');
    const dlContainer = document.getElementById('dl-container');
    const dlBtn = document.getElementById('dl-btn');
    const resetBtn = document.getElementById('reset-btn');
    const wrapper = document.getElementById('wrapper');
    const previewContainer = document.getElementById('preview-container');
    const postContainer = document.querySelector('.post-container');
    const dlDialog = document.getElementById('dl-dialog');
    const dlSelect = dlDialog.querySelector('select');
    const dlConfirmBtn = dlDialog.querySelector('button');

    // Set event listeners for UI elements
    filterSpan.addEventListener('click', function () {
        if (filterContainer.style.display === 'none') {
            filterContainer.style.display = 'flex';
            filterSpan.textContent = 'Close filters';
        } else {
            filterContainer.style.display = 'none';
            filterSpan.textContent = 'Open filters';
        }
    });

    regexpCheckbox.addEventListener('change', () => {
        if (regexpCheckbox.checked) {
            regexpDiv.style.display = 'flex';
            keywordDiv.style.display = 'none';
        } else {
            regexpDiv.style.display = 'none';
            keywordDiv.style.display = 'flex';
        }
    });

    resetBtn.onclick = function () {
        location.reload();
    };

    dlBtn.onclick = showOptions;

    // Reset all inputs and checkboxes
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input) => {
        input.value = null;
    });
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
    });

    // Initialize variables
    dlSelect.value = 'xml';
    let posts = [];
    let rawPosts = [];
    let socket = null;
    let maxPosts = 0;
    let matchCounter = 0;
    let startTime = null;
    const jetStreams = [
        'jetstream1.us-east.bsky.network',
        'jetstream2.us-east.bsky.network',
        'jetstream1.us-west.bsky.network',
        'jetstream1.us-west.bsky.network',
    ];

    // Function to update the post counter
    function updateMatchCounter() {
        postCounterSpan.textContent = `Total posts: ${matchCounter}`;
    }

    // Event listener for the stream button
    streamBtn.addEventListener('click', async function () {
        const subheader = document.querySelector('div.subheader');
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
            streamBtn.textContent = 'Resume streaming';
            streamBtn.classList.remove('stop-btn');
            dlContainer.style.display = 'block';
            if (rawPosts.length === 0) {
                dlBtn.style.display = 'none';
            } else {
                dlBtn.style.display = 'inline-block';
            }
        } else {
            dlContainer.style.display = 'none';
            try {
                const randomJetStream =
                    jetStreams[Math.floor(Math.random() * jetStreams.length)];
                let wsUrl = `wss://${randomJetStream}/subscribe?wantedCollections=app.bsky.feed.post`;
                const userHandles = handleInput.value.split(',');
                let dids;
                if (handleInput.value && userHandles.length > 0) {
                    dids = await getDids(userHandles);
                    if (dids.length > 0) {
                        dids.forEach((did) => {
                            if (did) {
                                wsUrl += `&wantedDids=${did}`;
                            }
                        });
                    } else {
                        return;
                    }
                }

                async function getDids(userHandles) {
                    const promises = userHandles.map(async (handle) => {
                        handle = handle.trim();
                        const url = `https://bsky.social/xrpc/com.atproto.repo.describeRepo?repo=${handle}`;
                        try {
                            const res = await fetch(url);
                            if (!res.ok) {
                                const errData = await res.json();
                                window.alert(
                                    `Could not find user ${handle}: ${errData.message}`
                                );
                                console.error(errData.message);
                                return null;
                            }
                            const data = await res.json();
                            return data.did;
                        } catch (error) {
                            window.alert(
                                `Could not find user ${handle}: ${error.message}`
                            );
                            console.error(error);
                            return null;
                        }
                    });
                    const dids = await Promise.all(promises);
                    return dids;
                }

                if (
                    (handleInput.value && dids.length > 0 && !dids.includes(null)) ||
                    !handleInput.value
                ) {
                    socket = new WebSocket(wsUrl);
                    console.log(
                        `Connecting to WebSocket server ${randomJetStream}...`
                    );
                } else {
                    return;
                }

                socket.addEventListener('open', function (event) {
                    console.log(
                        'Connected to WebSocket server ' + randomJetStream
                    );
                    streamBtn.classList.add('stop-btn');
                    streamBtn.textContent = 'Stop streaming';
                    subheader.style.display = 'none';
                    filtersHeader.style.display = 'none';
                    filterContainer.style.display = 'none';
                    wrapper.style.display = 'flex';
                    postCounterSpan.style.display = 'block';
                    if (!startTime) {
                        startTime = Date.now();
                    }
                    maxPosts = maxPostsInput.value;
                    updateMatchCounter();
                });

                socket.addEventListener('message', function (event) {
                    const post = JSON.parse(event.data);
                    if (post.kind === 'commit' && post.commit.record) {
                        processPost(post);
                    }
                });

                socket.addEventListener('close', function (event) {
                    console.log('Disconnected from the WebSocket server');
                    streamBtn.textContent = 'Resume streaming';
                    streamBtn.classList.remove('stop-btn');
                });

                socket.addEventListener('error', function (error) {
                    window.alert(
                        'The server encountered an error. Please try again later.'
                    );
                    console.error('WebSocket error:', error);
                });
            } catch (error) {
                console.error('WebSocket error:', error);
            }
        }
    });

    // Function to process and display streamed posts
    async function processPost(post) {
        if (maxPosts && matchCounter >= maxPosts) {
            socket.close();
            dlContainer.style.display = 'block';
            return;
        }
        const lang = langInput.value;
        let postLang;
        if (post.commit.record.langs && post.commit.record.langs.length > 0) {
            postLang = post.commit.record.langs[0];
        }
        if (lang && (postLang !== lang || !postLang)) {
            return;
        }
        let text = post.commit.record.text;
        if (!text) {
            return;
        }
        let filters = false;
        let found = [];
        let foundExc = false;
        let caseSensitive = caseCheckbox.checked;
        let wholeWords = wholewordsCheckbox.checked;
        let criteria = 0;
        let matchedCriteria = 0;
        if (
            regexpInput.value ||
            anyKWInput.value ||
            allKWInput.value ||
            exactPhraseInput.value ||
            excludeKWInput.value
        ) {
            if (regexpCheckbox.checked && regexpInput.value) {
                filters = true;
                let regexp;
                if (caseSensitive) {
                    regexp = new RegExp(regexpInput.value, 'gu');
                } else {
                    regexp = new RegExp(regexpInput.value, 'gui');
                }
                found = text.match(regexp);
            } else {
                let anyKW = null;
                let allKW = null;
                let exactPhrase = null;
                let excludeKW = null;
                if (anyKWInput.value) {
                    anyKW = anyKWInput.value.split(',');
                    anyKW = anyKW.map((kw) => kw.trim());
                    if (wholeWords) {
                        anyKW = anyKW.map((kw) => `\\b${kw}\\b`);
                    }
                    if (caseSensitive) {
                        anyKW = anyKW.map((kw) => new RegExp(kw, 'gu'));
                    } else {
                        anyKW = anyKW.map((kw) => new RegExp(kw, 'gui'));
                    }
                    filters = true;
                    criteria++;
                }
                if (allKWInput.value) {
                    allKW = allKWInput.value.split(',');
                    allKW = allKW.map((kw) => kw.trim());
                    if (wholeWords) {
                        allKW = allKW.map((kw) => `\\b${kw}\\b`);
                    }
                    if (caseSensitive) {
                        allKW = allKW.map((kw) => new RegExp(kw, 'gu'));
                    } else {
                        allKW = allKW.map((kw) => new RegExp(kw, 'gui'));
                    }
                    filters = true;
                    criteria++;
                }
                if (exactPhraseInput.value) {
                    if (caseSensitive) {
                        exactPhrase = new RegExp(
                            `\\b${exactPhraseInput.value.trim()}\\b`,
                            'gu'
                        );
                    } else {
                        exactPhrase = new RegExp(
                            `\\b${exactPhraseInput.value.trim()}\\b`,
                            'gui'
                        );
                    }
                    filters = true;
                    criteria++;
                }
                if (excludeKWInput.value) {
                    excludeKW = excludeKWInput.value.split(',');
                    excludeKW = excludeKW.map((kw) => kw.trim());
                    if (wholeWords) {
                        excludeKW = excludeKW.map((kw) => `\\b${kw}\\b`);
                    }
                    if (caseSensitive) {
                        excludeKW = excludeKW.map((kw) => new RegExp(kw, 'gu'));
                    } else {
                        excludeKW = excludeKW.map(
                            (kw) => new RegExp(kw, 'gui')
                        );
                    }
                }
                if (anyKW && anyKW.length > 0) {
                    let result = anyKW.some((kw) => text.match(kw));
                    if (result) {
                        const hits = anyKW.filter((kw) => text.match(kw));
                        for (let h of hits) {
                            const match = text.match(h);
                            found.push(match[0]);
                        }
                        matchedCriteria++;
                    }
                }
                if (allKW && allKW.length > 0) {
                    let result = allKW.every((kw) => text.match(kw));
                    if (result) {
                        const hits = allKW.filter((kw) => text.match(kw));
                        for (let h of hits) {
                            const match = text.match(h);
                            found.push(match[0]);
                        }
                        matchedCriteria++;
                    }
                }
                if (exactPhrase) {
                    const match = text.match(exactPhrase);
                    if (match && match.length > 0) {
                        found.push(text.match(exactPhrase)[0]);
                        matchedCriteria++;
                    }
                }
                if (excludeKW && excludeKW.length > 0) {
                    foundExc = excludeKW.some((kw) => text.match(kw));
                }
            }
        } else {
            filters = false;
        }

        if (foundExc) {
            return;
        }

        if (
            !filters ||
            (found && found.length > 0 && matchedCriteria === criteria)
        ) {
            rawPosts.push(post);
            const postContainers = Array.from(
                wrapper.querySelectorAll('.post-container')
            );
            if (postContainers.length <= 20) {
                const did = post.did;
                const rkey = post.commit.rkey;
                const createdAt = post.commit.record.createdAt;
                let postDate = new Date(createdAt);
                const postUrl = `https://bsky.app/profile/${did}/post/${rkey}`;
                const postElement = postContainer.cloneNode(true);
                postElement.addEventListener('click', function () {
                    window.open(postUrl, '_blank');
                });
                postElement.style.display = 'block';
                if (Array.isArray(found)) {
                    const words = text.split(/([\s\.?!"'“”‘’:;,\/\\]+)/gu);
                    if (wholeWords) {
                        text = words
                            .map((word) => {
                                if (found.some((found) => word === found)) {
                                    return `<span style="color: red; font-weight: bold;">${word}</span>`;
                                }
                                return word;
                            })
                            .join('');
                    } else {
                        text = words
                            .map((word) => {
                                if (
                                    found.some((found) => word.includes(found))
                                ) {
                                    return `<span style="color: red; font-weight: bold;">${word}</span>`;
                                }
                                return word;
                            })
                            .join('');
                    }
                }
                const postDateDiv = postElement.querySelector('.post-date');
                const locale = navigator.language;
                const options = {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                };
                postDate = postDate.toLocaleString(locale, options);
                postDateDiv.textContent = postDate;
                const postUser = postElement.querySelector('.post-user');
                const postUserImg = postElement.querySelector('img.post-user-img');
                const postUserName = postUser.querySelector('span');
                try {
                    const url = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`;
                    const res = await fetch(url);
                    if (!res.ok) {
                        const errData = await res.json();
                        console.error(errData.message);
                        return;
                    }
                    const data = await res.json();
                    postUserImg.src = data.avatar;
                    if (data.displayName) {
                        postUserName.textContent = data.displayName;
                    } else {
                        postUserName.textContent = data.handle;
                    }
                } catch (error) {
                    console.error(error);
                }
                const postText = postElement.querySelector('.post-text');
                postText.textContent = text;
                previewContainer.appendChild(postElement);
                previewContainer.scrollTop = previewContainer.scrollHeight;
            }
            matchCounter++;
            updateMatchCounter();
        } else {
            return;
        }
    }

    // Function to collect posts from streamed data
    let records = [];
    async function showOptions() {
        if (records.length === 0) {
            dlBtn.disabled = true;
            dlBtn.style.cursor = 'wait';
            const spinner = document.createElement('span');
            spinner.classList.add('spinner');
            dlBtn.textContent = '';
            dlBtn.appendChild(spinner);
            spinner.style.display = 'inline-block';
            const counterSpan = document.createElement('span');
            counterSpan.classList.add('counter');
            counterSpan.textContent = 'Downloading...';
            dlBtn.appendChild(counterSpan);
            counterSpan.style.display = 'inline-block';
            let uris = [];
            let index = 0;
            let total = rawPosts.length;
            while (rawPosts.length > 0) {
                uris[index] = rawPosts.splice(0, 25).map((post) => {
                    const repo = post.did;
                    const collection = post.commit.collection;
                    const rkey = post.commit.rkey;
                    return `at://${repo}/${collection}/${rkey}`;
                });
                index++;
            }
            for (let uriArray of uris) {
                let url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?`;
                uriArray.forEach((uri) => {
                    url += `uris=${uri}&`;
                });
                try {
                    const res = await fetch(url);
                    if (!res.ok) {
                        const errData = await res.json();
                        console.error(errData.message);
                        continue;
                    }
                    const data = await res.json();
                    records.push(...data.posts);
                    counterSpan.textContent = `Downloaded ${records.length} of ${total}`;
                } catch (error) {
                    console.error(error);
                }
            }
        }

        // Function to filter data items to suggest
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

        // Function to build an object of available keys
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

        if (records.length > 0) {
            const commonKeys = getCommonKeys(records);
            const keyTree = buildKeyTree(records[0], commonKeys);
            const container = dlDialog.querySelector('#keys-container');
            container.textContent = '';
            generateListTree(keyTree, container);
            const checkboxes = dlDialog.querySelectorAll(
                'input[type="checkbox"]'
            );
            checkboxes.forEach((checkbox) => {
                updateParentCheckboxes(checkbox);
            });
            dlBtn.textContent = 'Download data';
            dlBtn.disabled = false;
            dlBtn.style.cursor = 'pointer';
            const closeBtn = dlDialog.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => {
                dlDialog.close();
            });
            dlDialog.showModal();
        }
    }

    // Function to generate a tree of available keys
    function generateListTree(tree, container) {
        const ul = document.createElement('ul');
        ul.style.listStyleType = 'none'; // Remove default bullets

        for (let key in tree) {
            if (tree.hasOwnProperty(key)) {
                const li = document.createElement('li');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
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

    // Function to monitor checkboxes
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

    let dlFormat = 'xml';
    dlSelect.addEventListener('change', () => {
        dlFormat = dlSelect.value;
    });

    dlConfirmBtn.addEventListener('click', () => {
        buildData();
        if (dlFormat === 'json') {
            downloadJson();
        } else if (dlFormat === 'csv') {
            downloadCsv();
        } else if (dlFormat === 'xml') {
            downloadXml();
        } else if (dlFormat === 'txt') {
            downloadTxt();
        } else if (dlFormat === 'xlsx') {
            downloadXlsx();
        }
    });

    // Function to get nested values from an object
    function getNestedValue(obj, keyPath) {
        return keyPath.split('.').reduce((acc, key) => acc && acc[key], obj);
    }

    // Function to build the array of posts
    function buildData() {
        posts = [];
        const checkboxes = dlDialog.querySelectorAll('input[type="checkbox"]');
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
        anchor.download = 'bsky_stream.csv';
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
        anchor.download = 'bsky_stream.json';
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
            let postData = '<lb></lb>\n<skeet';
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
            postData += `<lb></lb><ref target="${p.url}">Link to post</ref><lb></lb>`;
            let text = p['record-text'];
            postData += `<lb></lb>${text.replaceAll(/\n/g, '<lb></lb>')}`;
            postData += '</skeet><lb></lb><lb></lb>\n';
            xml += postData;
        }
        xml += `</Text>`;
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'bsky_stream.xml';
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
        anchor.download = 'bsky_stream.txt';
        spinner.remove();
        dlConfirmBtn.textContent = 'Download';
        anchor.click();
    }

    function downloadXlsx() {
        let file = XLSX.utils.book_new();
        let sheet = XLSX.utils.json_to_sheet(posts);
        XLSX.utils.book_append_sheet(file, sheet, 'bsky_stream');
        XLSX.writeFile(file, 'bsky_stream.xlsx');
    }
});
