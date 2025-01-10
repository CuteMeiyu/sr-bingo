function updateCounter(cellCounter) {
    if (cellCounter.counters.length == 0) {
        cellCounter.innerHTML = "";
        return;
    }
    text = ""
    for (let i = 0; i < cellCounter.counters.length; i++) {
        text += `${cellCounter.counters[i][0]}/${cellCounter.counters[i][1]} | `;
    }
    text = text.substring(0, text.length - 3);
    cellCounter.innerHTML = text;
}

function addCounter(cellCounter, max) {
    cellCounter.counters.push([0, max]);
    updateCounter(cellCounter);
}

function createCell(row, col) {
    let cell = document.createElement("div");
    cell.id = `cell_${row}_${col}`;
    cell.classList.add("cell");
    cell.addEventListener("click", onCellClick);
    cell.addEventListener('contextmenu', onContextMenu);

    let cellText = document.createElement("span");
    cellText.classList.add("cell-text");
    cell.appendChild(cellText);

    let cellGame = document.createElement("span");
    cellGame.classList.add("cell-game");
    cell.appendChild(cellGame);

    let cellInfo = document.createElement("span");
    cellInfo.classList.add("cell-info");
    cellInfo.addEventListener('mousemove', onMouseIn);
    cellInfo.addEventListener('mouseout', onMouseOut);
    cell.appendChild(cellInfo);

    let cellPassword = document.createElement("span");
    cellPassword.classList.add("cell-password");
    cellPassword.addEventListener('mousemove', onMouseIn);
    cellPassword.addEventListener('mouseout', onMouseOut);
    cell.appendChild(cellPassword);

    let cellStar = document.createElement("span");
    cellStar.classList.add("cell-star");
    cellStar.innerHTML = "⭐️";
    cell.appendChild(cellStar);

    let cellDiff = document.createElement("span");
    cellDiff.classList.add("cell-diff");
    cell.appendChild(cellDiff);

    let cellCounter = document.createElement("span");
    cellCounter.classList.add("cell-counter");
    cellCounter.counters = [];

    function getClickIndex(event) {
        let index = Math.floor(event.offsetX / cellCounter.offsetWidth * cellCounter.counters.length)
        if (index >= cellCounter.counters.length) {
            index = cellCounter.counters.length - 1;
        }
        return index;
    }

    cellCounter.addEventListener("click", function (event) {
        event.preventDefault();
        if (cellCounter.counters.length == 0) {
            return;
        }
        let i = getClickIndex(event);
        cellCounter.counters[i][0]++;
        updateCounter(cellCounter);
    });

    cellCounter.addEventListener("wheel", function (event) {
        event.preventDefault();
        if (cellCounter.counters.length == 0) {
            return;
        }
        let i = getClickIndex(event);
        let delta = -Math.sign(event.deltaY);
        cellCounter.counters[i][0] += delta;
        if (cellCounter.counters[i][0] < 0) {
            cellCounter.counters[i][0] = 0;
        }
        updateCounter(cellCounter);
    });

    cellCounter.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        if (cellCounter.counters.length == 0) {
            return;
        }
        let i = getClickIndex(event);
        cellCounter.counters[i][0] = 0;
        updateCounter(cellCounter);
    });
    cell.appendChild(cellCounter);
    return cell;
}

var cells = [];
function initBoardCells() {
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            let cell = createCell(row, col);
            document.getElementById("board").appendChild(cell);
            cells.push(cell);
        }
    }
}

function setStatusBarText(text) {
    let scoreboard = document.getElementById("scoreboard");
    scoreboard.innerHTML = "";
    let item = document.createElement("div");
    item.classList.add("scoreboard-item");
    item.classList.add("flashing-font");
    item.innerText = text;
    scoreboard.appendChild(item);
}

function onCellClick(event) {
    if (event.target.closest(".cell-info,.cell-password,.cell-counter") !== null) {
        return;
    }
    let cell = event.target.closest(".cell");
    if (playerName == undefined) {
        playerName = "Player";
    }
    let cellId = cells.findIndex(c => c === cell);
    let flag = sync.board[cellId].includes(playerName);
    sync.sendFlag(cellId, playerName, !flag);
}

function onColorChange() {
    if (playerName == undefined) {
        playerName = "Player";
    }
    sync.sendColor(playerName, currentColorPickerValue);
}

function onScoreboardClick() {
    showClickOverlay();
    pickr.show();
}

function onColorPicked() {
    if (currentColorPickerValue != previousColorPickerValue) {
        previousColorPickerValue = currentColorPickerValue;
        onColorChange();
    }
    hideClickOverlay();
}

function onMouseIn(event) {
    let tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = event.currentTarget.dataset.tooltip.replace(/\n/g, '<br />');
    tooltip.style.left = "0px";
    tooltip.style.top = "0px";

    let newX = event.clientX + 15;
    let newY = event.clientY + 30;
    let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    if (newX + tooltip.offsetWidth > vw) {
        newX = Math.max(0, vw - tooltip.offsetWidth);
    }
    tooltip.style.left = newX + "px";

    if (newY + tooltip.offsetHeight > vh) {
        newY = event.clientY - tooltip.offsetHeight - 15;
    }
    tooltip.style.top = newY + "px";

    tooltip.classList.add('show');
}

function onMouseOut(event) {
    let tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('show');
    tooltip.innerHTML = "";
}

function onContextMenu(event) {
    event.preventDefault();
    if (event.target.closest(".cell-info,.cell-password,.cell-counter") !== null) {
        return;
    }
    let cell = event.target.closest(".cell");
    let star = cell.querySelector(".cell-star");
    star.classList.toggle("show");
}

function getDiffColor(diff, minDiff, maxDiff) {
    diff = Math.max(diff, minDiff);
    diff = Math.min(diff, maxDiff);
    let normalDiff = 1.0 - (diff - minDiff) / (maxDiff - minDiff);
    return `hsl(${parseInt((((normalDiff * 180) + 300) % 360))}, 100%, 50%)`;
}

function updateCellColors(cellId) {
    let cell = cells[cellId];
    let colors = sync.getCellColors(cellId);
    if (colors.length == 0) {
        cell.style.background = null;
        return;
    }
    let width = cell.offsetWidth;
    let height = cell.offsetHeight;
    let degree = (Math.atan(height / width) * 180.0 / Math.PI + 90.0) * 0.5;
    let gradient = `linear-gradient(${Math.floor(degree)}deg`;
    colors.forEach(function (color, index) {
        let start = (100 / colors.length) * index;
        let end = (100 / colors.length) * (index + 1);
        gradient += `, ${color} ${start}%, ${color} ${end}%`;
    });
    gradient += "), linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.2) 100%)";
    cell.style.background = gradient;
    cell.style.backgroundBlendMode = "multiply";
}

function updateBoardColors() {
    for (let i = 0; i < cells.length; i++) {
        updateCellColors(i);
    }
}

function getTimeDelta(currentTime) {
    currentTime = currentTime || Date.now();
    let readyTimeDelta = sync.startTime - currentTime;
    let gameTimeDelta = sync.endTime - currentTime;
    return [gameTimeDelta, readyTimeDelta];
}

function formatTimeDelta(timeDelta) {
    if (timeDelta <= 0) {
        return "00:00";
    }
    timeDelta += 500;
    let seconds = Math.floor((timeDelta / 1000) % 60);
    let minutes = Math.floor((timeDelta / (1000 * 60)) % 60);
    let hours = Math.floor((timeDelta / (1000 * 60 * 60)) % 24);
    let result = "";
    if (hours > 0) {
        result += hours.toString().padStart(2, '0') + ":"
    }
    result += minutes.toString().padStart(2, '0') + ":" + seconds.toString().padStart(2, '0');
    return result;
}

var bingoIndexes = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
]
function calculateScore(cids) {
    let score = 0;
    for (let cid of cids) {
        score += scores[cells[cid].goal.rank];
    }
    for (let bingoIndex of bingoIndexes) {
        let bingo = true;
        for (let cid of bingoIndex) {
            if (!cids.includes(cid)) {
                bingo = false;
                break;
            }
        }
        if (bingo) {
            score += scores[0];
        }
    }
    return score;
}

function updateScoreboard() {
    let scoreboard = document.getElementById("scoreboard");
    scoreboard.innerHTML = "";
    for (let player of sync.players) {
        let item = document.createElement("div");
        item.classList.add("scoreboard-item");
        item.style.color = player.color ? player.color : "#000000";
        item.innerHTML = `${player.name}: ${calculateScore(player.cids)}`;
        scoreboard.appendChild(item);
    }
    if (scoreboard.childNodes.length == 0) {
        let item = document.createElement("div");
        item.classList.add("scoreboard-item");
        item.innerText = "记分板"
        scoreboard.appendChild(item);
    }
    if (sync.startTime != null) {
        let item = document.createElement("div");
        let [gameTimeDelta, readyTimeDelta] = getTimeDelta();
        item.classList.add("scoreboard-item-timeout");
        if (readyTimeDelta > 0) {
            item.style.color = "#4CAF50";
            item.innerText = `⏰ ${formatTimeDelta(readyTimeDelta)}`;
        } else if (gameTimeDelta > 0) {
            item.style.color = "#E53935";
            item.innerText = `⏰ ${formatTimeDelta(gameTimeDelta)}`;
        } else {
            item.style.color = "#2196F3";
            item.innerText = "⏰ 00:00";
        }
        if (sync.pauseTime != null) {
            item.style.color = "#2196F3";
        }
        if (scoreboardInterval == null && sync.pauseTime == null) {
            scoreboardInterval = setInterval(() => {
                updateScoreboard();
            }, 1000);
        }
        item.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (sync.pauseTime == null) {
                sync.sendPause(Date.now());
                clearInterval(scoreboardInterval);
                scoreboardInterval = null;
            } else {
                let [gameTimeDelta, readyTimeDelta] = getTimeDelta(sync.pauseTime);
                sync.sendTimeout(gameTimeDelta, readyTimeDelta);
                clearInterval(scoreboardInterval);
                scoreboardInterval = setInterval(() => {
                    updateScoreboard();
                }, 1000);
            }
        });
        scoreboard.appendChild(item);
    }
    onResize();
}

function updateBoard() {
    updateBoardColors();
    updateScoreboard();
}

pickr.on('change', (color) => {
    currentColorPickerValue = color.toHEXA().toString();
    onColorPicked();
});

const queryParams = new URLSearchParams(window.location.search);

var playerName = queryParams.get('player');
playerName = playerName != null ? playerName : "Player";

var roomName = queryParams.get('room');
var lockout = queryParams.get('lockout') != null ? true : false;
var scores = queryParams.get('scores').split(',').map(item => parseInt(item));
var looped = queryParams.get('loop') != null ? true : false;
if (looped) {
    bingoIndexes = bingoIndexes.concat([
        [0, 9, 13, 17, 21],
        [1, 5, 14, 18, 22],
        [2, 6, 10, 19, 23],
        [3, 7, 11, 15, 24],
        [4, 5, 11, 17, 23],
        [3, 9, 10, 16, 22],
        [2, 8, 14, 15, 21],
        [1, 7, 13, 19, 20],
    ])
}

var scoreboardInterval = null;

var previousColorPickerValue = `#${queryParams.get('color')}`;
var currentColorPickerValue = previousColorPickerValue;

var sync = new Sync(roomName, lockout);

sync.addConnectListener(() => {
    hideSpinner();
    sync.sendColor(playerName, currentColorPickerValue);
});
sync.addReconnectListener(() => {
    hideSpinner();
});
sync.addDisconnectListener(() => {
    showSpinner("正在重连...");
});
sync.addActionListener(() => {
    updateBoard();
});

window.addEventListener('DOMContentLoaded', async function () {
    initBoardCells();
    let goalPool = await loadGoalPool();
    let indexes = queryParams.get('id').split(',').map(item => parseInt(item));
    for (let i = 0; i < indexes.length; i++) {
        let goal = goalPool[indexes[i]];
        let cell = cells[i];
        cell.goal = goal;
        if (goal.rank > 1) {
            cell.classList.add('rank' + goal.rank);
        }

        if (goal.diff == undefined) {
            goal.diff = goal.rank == undefined ? 1.0 : parseFloat(goal.rank);
        } else {
            goal.diff = parseFloat(goal.diff);
        }


        let cellText = cell.querySelector(".cell-text");
        cellText.innerHTML = goal.goal;

        let cellGame = cell.querySelector(".cell-game");
        if (goal.games !== undefined && goal.games.length > 0) {
            cellGame.innerHTML = goal.games.join(',');
        } else {
            cellGame.innerHTML = "";
        }

        let cellInfo = cell.querySelector(".cell-info");
        if (goal.notes != "") {
            cellInfo.innerHTML = "<img src='assets/images/info.png'>";
            cellInfo.dataset.tooltip = goal.notes.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        }

        if (goal.counter.length > 0) {
            let cellCounter = cell.querySelector(".cell-counter");
            for (let i = 0; i < goal.counter.length; i++) {
                addCounter(cellCounter, goal.counter[i]);
            }
            cellCounter.classList.add('show');
        }
    }
    for (let img of document.querySelectorAll("img")) {
        img.alt = "[!]";
    }
    if (queryParams.get("multi") == null) {
        for (let cellGame of document.querySelectorAll('.cell-game')) {
            cellGame.style.display = 'none';
        }
    }
    if (queryParams.get("diff") != null) {
        for (let cell of document.querySelectorAll('.cell')) {
            let cellDiff = cell.querySelector('.cell-diff');
            cellDiff.style.color = getDiffColor(cell.goal.diff, 0.0, 5.0);
            cellDiff.innerHTML = cell.goal.diff;
            cellDiff.classList.add('show');
        }
    }
    updateBoard();
    // onResize();
});
