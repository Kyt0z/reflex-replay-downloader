const shortMonthIndex = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'};
const defaultReplayURLs = [
    'https://east.kishflex.top',
    'https://west.kishflex.top',
    'https://eu.kishflex.top',
    'http://45.77.65.202/replays_de',
    'http://45.77.65.202/replays_uk',
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

function parseDate(filename)
{
    let date = filename.split('_').slice(-3, -1);
    if(date.length < 2)
        return null;

    date[0] = `${date[0].slice(5, 9)}-${shortMonthIndex[date[0].slice(2, 5)]}-${date[0].slice(0, 2)}`;
    date[1] = `${date[1].slice(0, 2)}:${date[1].slice(2, 4)}:${date[1].slice(4, 6)}`;

    // date = new Date(`${date[0]}T${date[1]}`);
    date = `${date[0]} ${date[1]}`; // todo: better formatting
    return date;
}

function parseMarkers(filename)
{
    let markers = filename.split('_').slice(-1)[0];
    if(markers.slice(-11) != 'markers.rep')
        return '';
    return markers.slice(0, -11);
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
    const filename = replay.split('/').slice(-1)[0];
    const date = parseDate(filename);
    const dateKey = date.replace(/\D/g, '');
    const markers = parseMarkers(filename)
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

    filenameCell.innerHTML = `<a href="${url}/${replay}">${filename}</a>`;
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
        for(const replay of html.matchAll(/href=\"(.*?)\"/g))
        {
            if(replay[1].slice(-4) == '.rep' && !replays.has(replay[1]))
            {
                replays.add(replay[1]);
                appendRow(tbody, url, replay[1]);
                replayCount++;
            }
        }
        console.log(url, replayCount);
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