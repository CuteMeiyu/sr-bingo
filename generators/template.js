(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD环境
        define([], factory);
    } else if (typeof module === 'object' && typeof exports !== 'undefined') {
        // CommonJS环境
        module.exports = factory();
    } else {
        // 浏览器全局环境
        root.RankedGenerator = factory();
    }
}(this, function () {
    var Generator = {};
    Generator.generate = generate;
    
    function generate(goalPool, settings) {
        return [
            0, 1, 2, 3, 4,
            5, 6, 7, 8, 9,
            10, 11, 12, 13, 14,
            15, 16, 17, 18, 19,
            20, 21, 22, 23, 24
        ];
    }
    return Generator;
}));