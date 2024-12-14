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

function getTimeleft() {
    let delta = sync.startTime - Date.now();
    if (delta < 0) {
        delta = sync.endTime - Date.now();
    }
    if (delta < 0) {
        return 0;
    }
    return delta;
}

function formatTimeDelta(timeleft) {
    if (timeleft <= 0) {
        return "00:00";
    }
    let seconds = Math.floor((timeleft / 1000) % 60);
    let minutes = Math.floor((timeleft / (1000 * 60)) % 60);
    let hours = Math.floor((timeleft / (1000 * 60 * 60)) % 24);
    let result = "";
    if (hours > 0) {
        result += hours.toString().padStart(2, '0') + ":"
    }
    result += minutes.toString().padStart(2, '0') + ":" + seconds.toString().padStart(2, '0');
    return result;
}

function updateScoreboard() {
    let scoreboard = document.getElementById("scoreboard");
    scoreboard.innerHTML = "";
    for (let player of sync.players) {
        let item = document.createElement("div");
        item.classList.add("scoreboard-item");
        item.style.color = player.color ? player.color : "#000000";
        item.innerHTML = `${player.name}: ${player.count}`;
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
        let timeleft = getTimeleft();
        item.classList.add("scoreboard-item-timeout");
        item.innerText = `⏰ ${formatTimeDelta(timeleft)}`;
        if (timeleft <= 60000) {
            item.style.color = "red";
        }
        scoreboard.appendChild(item);
        if (scoreboardInterval == null) {
            scoreboardInterval = setInterval(() => {
                updateScoreboard();
            }, 1000);
        }
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

var scoreboardInterval = null;

var previousColorPickerValue = `#${queryParams.get('color')}`;
var currentColorPickerValue = previousColorPickerValue;

var sync = new Sync(roomName, queryParams.get('lockout') != null ? true : false);

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
        if (goal.rank > 1) {
            cell.classList.add('rank' + goal.rank);
        }

        if (goal.diff == undefined) {
            goal.diff = goal.rank == undefined ? 1.0 : parseFloat(goal.rank);
        } else {
            goal.diff = parseFloat(goal.diff);
        }
        cell.dataset.diff = goal.diff;

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
            cellDiff.style.color = getDiffColor(cell.dataset.diff, 0.0, 5.0);
            cellDiff.innerHTML = cell.dataset.diff;
            cellDiff.classList.add('show');
        }
    }
    updateBoard();
    // onResize();
});
