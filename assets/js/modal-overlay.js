function showSpinner(text) {
    let modalOverlay = document.getElementById('modal-overlay');
    let spinnerText = document.getElementById('spinner-text');
    spinnerText.innerHTML = text;
    modalOverlay.style.display = 'flex';
}

function hideSpinner() {
    let modalOverlay = document.getElementById('modal-overlay');
    let spinnerText = document.getElementById('spinner-text');
    spinnerText.innerHTML = "";
    modalOverlay.style.display = 'none';
}

function showClickOverlay() {
    document.getElementById("click-overlay").style.display = "flex";
}

function hideClickOverlay() {
    document.getElementById("click-overlay").style.display = "none";
}
