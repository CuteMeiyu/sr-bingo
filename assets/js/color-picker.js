const pickr = Pickr.create({
    el: '.color-picker',
    theme: 'nano',
    swatches: [
        "#E53935",
        '#2196F3',
        "#4CAF50",
        "#F9A825",
        "#9C27B0",
        "#009688",
        "#E91E63",
    ],
});

pickr.on('change', (color) => {
    pickr.hide();
});
