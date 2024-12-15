function onTimeInput(element) {
    element.value = element.value.replace(/[^0-9]/g, '').substr(0, 2)
}

function onSetTimeButtonClick() {
    function parseTimeInput(stageType) {
        let h = parseInt(document.getElementById(`${stageType}-time-input-h`).value);
        let m = parseInt(document.getElementById(`${stageType}-time-input-m`).value);
        let s = parseInt(document.getElementById(`${stageType}-time-input-s`).value);
        h = isNaN(h) ? 0 : h;
        m = isNaN(m) ? 0 : m;
        s = isNaN(s) ? 0 : s;
        return ((h * 3600) + (m * 60) + s) * 1000;
    }
    let gameTime = parseTimeInput('game');
    let readyTime = parseTimeInput('ready');
    sync.sendTimeout(gameTime, readyTime);
    hideScoreboardDialog();
    hideClickOverlay();
}

function showScoreboardDialog() {
    document.getElementById('scoreboard-dialog').classList.add("visible");
}

function hideScoreboardDialog() {
    document.getElementById('scoreboard-dialog').classList.remove('visible');
}

document.addEventListener("DOMContentLoaded", () => {
    const scoreboard = document.getElementById("scoreboard");
    const dialog = document.getElementById("scoreboard-dialog");

    scoreboard.addEventListener("contextmenu", e => {
        e.preventDefault();
        showClickOverlay();
        dialog.style.bottom = "33px";
        dialog.style.left = Math.max(Math.min(e.clientX, window.innerWidth - dialog.offsetWidth / 2), dialog.offsetWidth / 2) + "px";
        showScoreboardDialog();
    });

    document.addEventListener("click", e => {
        if (!e.target.closest('#scoreboard-dialog')) {
            hideScoreboardDialog();
        }
    });
})
