(function(root, factory) {
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
}(this, function() {
    var Generator = {};
    Generator.generate = generate;

    function isValid(matrix, row, col, num) {
        if (matrix[row].includes(num)) return false;
        for (let i = 0; i < matrix.length; i++) {
            if (matrix[i][col] === num) return false;
        }
        if (row === col) {
            for (let i = 0; i < matrix.length; i++) {
                if (matrix[i][i] === num) return false;
            }
        }
        if (row + col === matrix.length - 1) {
            for (let i = 0; i < matrix.length; i++) {
                if (matrix[i][matrix.length - 1 - i] === num) return false;
            }
        }
        return true;
    }

    function solve(matrix, row, col) {
        const n = matrix.length;
        if (row === n) return true;
        if (col === n) return solve(matrix, row + 1, 0);
        if (matrix[row][col] != -1) return solve(matrix, row, col + 1);
        let nums = Array.from({ length: n }, (_, i) => i);
        shuffleArray(nums);
        for (let num of nums) {
            if (isValid(matrix, row, col, num)) {
                matrix[row][col] = num;
                if (solve(matrix, row, col + 1)) return true;
                matrix[row][col] = -1;
            }
        }
        return false;
    }

    function generateMatrix(ranks, centerHardest) {
        for (let i = ranks.length; i < 5; i++) {
            ranks.push(0);
        }
        let rankMatrix = Array.from({ length: 5 }, () => Array(5).fill(-1));
        if (centerHardest) {
            rankMatrix[2][2] = argmax(ranks);
        }
    
        if (!solve(rankMatrix, 0, 0)) {
            throw new Error("生成难度卡片时找不到满足条件的解");
        }
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                rankMatrix[row][col] = ranks[rankMatrix[row][col]];
            }
        }
        return rankMatrix
    }

    function getIndexes(matrix) {
        let indexes = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                let rank = matrix[row][col];
                if (indexes[rank] === undefined) {
                    indexes[rank] = [];
                }
                indexes[rank].push(row * 5 + col);
            }
        }
        return indexes;
    };

    function generate(goalPool, settings) {
        let games = settings.games;
        let ranks = settings.ranks;
        let centerHardest = settings.center;
    
        let rankMatrix = generateMatrix(ranks, centerHardest);
        let rankIndexes = getIndexes(rankMatrix);
        for (let indexes of rankIndexes) {
            if (indexes !== undefined) shuffleArray(indexes);
        }
        
        let groupUsed = [];
        let gamesCount = {};
        for (let game of games) {
            gamesCount[game] = 0;
        }
        let leniencyConditions = ["无", "允许同组任务同时出现"];
    
        let chooseCount = 0;
        let boardIds = [];
        for (let leniency = 0; leniency < leniencyConditions.length; leniency++) {
            if (leniency > 0) {
                console.log(`任务数量不足，尝试放宽条件：${leniencyConditions[leniency]}`);
            }
            let filterGoalPool = goalPool.filter(games);
            while (filterGoalPool.length > 0) {
                let goal = filterGoalPool.draw();
                if (goal === null) {
                    break;
                }
                if (rankIndexes[goal.rank] === undefined || rankIndexes[goal.rank].length === 0) {
                    continue;
                }
                if (leniency < 1 && !goal.checkGroups(groupUsed)) {
                    continue;
                }
                groupUsed = groupUsed.concat(goal.groups);
                let index = rankIndexes[goal.rank].pop();
                boardIds[index] = goal.index;
                chooseCount += 1;
                if (chooseCount >= 25) {
                    return boardIds;
                }
            }
        }
        throw new Error("没有足够数量的符合条件的任务");
    }

    return Generator;
}));