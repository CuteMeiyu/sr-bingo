var randomSeed = Date.now();

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getIntersection(setA, setB) {
    return setA.filter(item => setB.includes(item));
}

function argmax(array) {
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

function random() {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    randomSeed = (a * randomSeed + c) % m;
    return randomSeed / m;
}

function setRandomSeed(seed) {
    randomSeed = seed;
}
