var goalPool;
const queryParams = new URLSearchParams(window.location.search);

document.addEventListener('DOMContentLoaded', function () {
    loadGoalPool().then(d => {
        goalPool = d;

        if (queryParams.size > 0) {
            lockOptional();
        }

        for (let [key, value] of queryParams) {
            key = key.toLowerCase();
            let element = document.getElementById(key);
            if (!element) {
                continue;
            }
            if (element.type == "checkbox") {
                element.checked = true;
                continue;
            }
            if (element.id != "room") {
                value = value.toUpperCase();
            }
            element.value = value;
        }

        let seed = document.getElementById("seed");
        if (seed.value.length == 0) {
            rollSeed();
        }

        onInput(seed);
    });
});

for (let input of document.getElementsByTagName("input")) {
    input.addEventListener("input", (event) => { onInput(event.target); });
}

pickr.on('change', (color) => {
    let colorInput = document.getElementById("color");
    colorInput.style.backgroundColor = color.toHEXA().toString();
    onInput(colorInput);
});

function lockOptional() {
    for (let e of document.querySelectorAll(".optional")) {
        e.disabled = true;
    }
}

function unlockOptional() {
    for (let e of document.querySelectorAll(".optional")) {
        e.disabled = false;
    }
}

function onInput(target) {
    target.classList.remove("missing");
    document.getElementById("error").innerHTML = "";

    let shareLink = document.getElementById("share-link");
    let query = "?";
    for (let input of document.getElementsByTagName("input")) {
        if (input.id === "player" || input.id == "") {
            continue;
        }
        if (input.type == "checkbox") {
            if (input.checked) {
                query += input.id + "&";
            }
            continue;
        }
        if (input.value.length > 0) {
            query += input.id + "=" + input.value + "&";
        }
    }
    query = query.substring(0, query.length - 1).replace(/，/g, ",");
    shareLink.href = window.location.origin + window.location.pathname + query;
    shareLink.innerHTML = shareLink.href.replace(/&/g, "&amp;");
}

function rollSeed() {
    let seed = document.getElementById("seed");
    seed.value = Math.floor(Math.random() * 1000000).toString();
    setRandomSeed(parseInt(seed.value));
    onInput(seed);
}

function rgbToHex(rgb) {
    const rgbArray = rgb.match(/\d+/g);
    const hex = rgbArray
        .map(val => {
            const hexVal = parseInt(val).toString(16);
            return hexVal.padStart(2, '0');
        })
        .join('');
    return hex.toUpperCase();
}

const regularFuncs = {
    "games": function (x) { return x.value.split(/[,，]\s*/); },
    "ranks": function (x) { return x.value.split(/[,，]\s*/).map(function (item) { return parseInt(item); }); },
    "seed": function (x) { return parseInt(x.value); },
    // "balance": function (x) { return x.checked; },
    "lockout": function (x) { return x.checked; },
    "center": function (x) { return x.checked; },
    "room": function (x) { return x.value; },
    "player": function (x) { return x.value; },
    "color": function (x) { return rgbToHex(x.style.backgroundColor); },
};

function parseSettings() {
    let settings = {};
    for (let setting in regularFuncs) {
        let regularFunc = regularFuncs[setting];
        let element = document.getElementById(setting);
        settings[setting] = regularFunc(element);
        if (settings[setting].length == 0 || settings[setting] == "BFBFBF") {
            if (setting === "player") {
                let roomInput = document.getElementById("room");
                if (roomInput.value.length == 0) {
                    continue;
                }
            }
            if (!element.required || element.classList.contains("hidden")) {
                continue;
            }
            let associatedLabel = document.querySelector(`label[for="${setting}"]`);
            let error = document.getElementById("error");
            error.innerHTML = "*" + associatedLabel.innerText + "必填";
            element.classList.add("missing");
            return;
        }
    }
    return settings
}

function createOrJoinRoom() {
    let settings = parseSettings();
    if (settings === undefined) {
        return;
    }

    setRandomSeed(settings.seed);
    try {
        let card = RankedGenerator.generate(goalPool, settings);
        let params = "id=" + card.map(id => id).join(",");
        if (settings.player.length > 0) {
            params += "&" + new URLSearchParams({ "player": settings.player }).toString();
        }
        if (settings.color.length > 0) {
            params += "&" + new URLSearchParams({ "color": settings.color }).toString();
        }
        if (settings.room.length > 0) {
            params += "&" + new URLSearchParams({ "room": settings.room }).toString();
        }
        if (settings.games.length > 1) {
            params += "&multi";
        }
        if (settings.lockout) {
            params += "&lockout";
        }
        window.open('popup.html?' + params, 'Bingo', 'width=800,height=800');
        unlockOptional();
    } catch (error) {
        document.getElementById("error").innerHTML = "*" + error.message;
        return;
    }
}

document.getElementById("createJoinButton").addEventListener("click", createOrJoinRoom);
document.getElementById("rollButton").addEventListener("click", rollSeed);
