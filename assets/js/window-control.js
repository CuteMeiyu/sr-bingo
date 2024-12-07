function resizeBoard() {
    let board = document.getElementById("board");
    let w = window.innerWidth;
    let h = window.innerHeight;
    let scoreboard = document.getElementById("scoreboard");
    let scoreboardHeight = scoreboard.offsetHeight;
    h = Math.min(h, h - scoreboardHeight);
    if (w / h > 1.2) {
        w = h * 1.2;
    } else if (h / w > 1.2) {
        h = w * 1.2;
    }
    board.style.width = w + "px";
    board.style.height = h + "px";
}

function resizeText() {
    let cellTexts = document.querySelectorAll('.cell-text');
    cellTexts.forEach(function (cellText) {
        let cell = cellText.closest('.cell');
        let cellGame = cell.querySelector('.cell-game');
        // let cellStar = cell.querySelector('.cell-star');
        let cellDiff = cell.querySelector('.cell-diff');
        let cellCounter = cell.querySelector('.cell-counter');
        let cellWidth = cell.offsetWidth;
        let cellHeight = cell.offsetHeight;
        let fontSize = 100;
        let textWidth, textHeight;
        do {
            cellText.style.fontSize = fontSize + '%';
            cellGame.style.fontSize = Math.max(Math.floor(fontSize * 0.5), 1) + '%';
            cellDiff.style.fontSize = Math.max(Math.floor(fontSize * 0.5), 1) + '%';
            cellCounter.style.fontSize = Math.max(Math.floor(fontSize * 0.75), 1) + '%';
            textWidth = cellText.offsetWidth;
            textHeight = cellText.offsetHeight;
            fontSize -= 1;
        } while ((textWidth > cellWidth || textHeight > cellHeight * 0.8) && fontSize > 0);
    });
}

function onResize() {
    resizeBoard();
    resizeText();
}

window.addEventListener('resize', function () {
    onResize();
});
