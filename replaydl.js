const shortMonthIndex = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'};
// const shortMonths = Object.keys(shortMonthIndex).join('|');
// console.log(shortMonths);
const replayRegExp = /href=\"(.*?([0-9]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[0-9]+_[0-9]+).*?(?:([0-9]+)markers).*?\.(?:rep|zip))\"/g;
const defaultReplayURLs = [
    'https://east.kishflex.top',
    'https://west.kishflex.top',
    'https://eu.kishflex.top',
    'http://45.77.65.202/replays_de',
    'http://45.77.65.202/replays_uk',
    'http://bobr.furioness.net',
    ''
];

const url = new URL(window.location.href);
function updateURLParam(param, value)
{
    if(param == 'player' && value == '')
        url.searchParams.delete(param);
    else if(param == 'markers' && value == '0')
        url.searchParams.delete(param);
    else
        url.searchParams.set(htmlencode(param), htmlencode(value));
    window.history.pushState(null, '', url);
}

const replayTable = document.getElementById('replaysTable');
const replaysButton = document.getElementById('replaysButton');
const playerName = document.getElementById('playerName');
const minMarkers = document.getElementById('minMarkers');
minMarkers.placeholder = 0;
const dateFormat = document.getElementById('dateFormat')
dateFormat.value = 'YYYY-MM-DD HH:mm:ss';
const replayURLs = document.getElementById('replayURLs');
replayURLs.rows = defaultReplayURLs.length;
replayURLs.value = defaultReplayURLs.join('\n');
replayURLs.addEventListener('keyup', (event) =>
{
    // event.currentTarget.rows = event.currentTarget.value.split('\n').length + 1;
    replaysButton.disabled = false;
});

function htmlencode(str)
{
    return document.createTextNode(str).textContent;
}

function htmldecode(str)
{
    const entDiv = document.createElement('div');
    entDiv.innerHTML = str;
    return entDiv.innerHTML;
}

// TODO: This sucks make it better:
//       Consider that the date format may not be consistent or there at all.
function formatDate(date)
{
    // console.log(date);
    const year = date.slice(5, 9);
    const month = shortMonthIndex[date.slice(2, 5)];
    const day = date.slice(0, 2);
    const hour = date.slice(10, 12);
    const minute = date.slice(12, 14);
    const second = date.slice(14, 16);
    date = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    return date;
}

function applyFilters(playerName, minMarkers)
{
    let displayedRows = 0;
    for(const row of replayTable.getElementsByTagName('tbody')[0].childNodes)
    {
        const filenameCell = row.getElementsByClassName('filename')[0];
        const markersCell = row.getElementsByClassName('markers')[0];

        row.style.display = 'none';
        if(filenameCell.innerText.toLowerCase().includes(playerName.value.toLowerCase()) && Number(markersCell.innerText) >= Number(minMarkers.value))
        {
            row.style.display = 'table-row';
            displayedRows++;
        }
    }
    console.log(playerName.value, Number(minMarkers.value), displayedRows);
}
playerName.addEventListener('keyup', (event) => applyFilters(event.currentTarget, minMarkers));
minMarkers.addEventListener('change', (event) => applyFilters(playerName, event.currentTarget));
minMarkers.addEventListener('keydown', (event) => event.preventDefault());

function appendRow(tbody, url, replay)
{
    // const filename = replay[1].split('/').slice(-1)[0];
    const filename = replay[1];
    const date = formatDate(replay[2]);
    const markers = replay[3];
    const server = url.split('//').slice(1).join();

    const row = document.createElement('tr');
    row.style.display = 'none';

    const filenameCell = document.createElement('td');
    const dateCell = document.createElement('td');
    const markersCell = document.createElement('td');
    const serverCell = document.createElement('td');

    filenameCell.classList.add('filename');
    dateCell.classList.add('date');
    markersCell.classList.add('markers', 'centered');
    serverCell.classList.add('server');

    filenameCell.innerHTML = `<a href="${url}/${filename}">${filename}</a>`;
    dateCell.innerText = date;
    markersCell.innerText = markers;
    serverCell.innerText = server;

    row.appendChild(filenameCell);
    row.appendChild(dateCell);
    row.appendChild(markersCell);
    row.appendChild(serverCell);

    tbody.appendChild(row);
}

async function fetchHTML(url)
{
    try
    {
        const response = await fetch(`fetch.php?url=${encodeURIComponent(url)}`);
        if(response.ok)
            return await response.text();
        else
            console.error(`Failed to fetch ${url}. Status: ${response.status}`);
    }
    catch(error)
    {
        console.error(`Error fetching ${url}: ${error.message}`);
    }
    return '';
}

let replayTableSorted = false;
async function getReplays(urls)
{
    replaysButton.disabled = true;
    const tbody = replayTable.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    for(const url of urls)
    {
        if(url == '')
            continue;

        const replays = new Set();
        const html = htmldecode(await fetchHTML(url));
        let replayCount = 0;
        for(const replay of html.matchAll(replayRegExp))
        {
            // console.log(replay);

            // TODO: Having the set here is kind of useless maybe?
            // avoid duplicates
            if(!replays.has(replay[1]))
            {
                appendRow(tbody, url, replay);
                replayCount++;
            }

            replays.add(replay[1]);
        }
        console.log(url, replayCount);
        // console.log(replays);
    }
    if(!replayTableSorted)
    {
        sorttable.makeSortable(replayTable);
        sorttable.innerSortFunction.apply(document.querySelector('th.date'), []);
        sorttable.innerSortFunction.apply(document.querySelector('th.date'), []);
        replayTableSorted = true;
    }
    console.log('Total', replayTable.rows.length - 1);
    applyFilters(playerName, minMarkers);
}
replaysButton.addEventListener('click', () => getReplays(replayURLs.value.split('\n')));
replaysButton.click();