async function loadGoalPool() {
    let data = await new Promise((resolve) => {
        Papa.parse("assets/data/data.csv", {
            header: true,
            download: true,
            skipEmptyLines: true,
            complete: function (results) {
                resolve(results.data);
            },
        });
    });

    for (let i = 0; i < data.length; i++) {
        let goal = data[i];
        goal.index = i;
        goal.games = goal.games == "" ? [] : goal.games.split(",").map((game) => game.trim());
        goal.groups = goal.groups == "" ? [] : goal.groups.split(",").map((group) => group.trim());
        goal.rank = parseInt(goal.rank);
        if (goal.type.startsWith("any")) {
            goal.minGameIntersection = parseInt(goal.type.substring(3));
            goal.minGameIntersection = isNaN(goal.minGameIntersection) ? 1 : goal.minGameIntersection;
        } else {
            goal.minGameIntersection = goal.games.length;
        }
        goal.weight = goal.weight == "" ? 1.0 : parseFloat(goal.weight);
        goal.counter = goal.counter == "" ? [] : goal.counter.split(",").map((counter) => parseInt(counter));
        goal.checkGames = (games) => {
            let intersectionCount;
            if (goal.games.length == 0) {
                intersectionCount = games.length;
            } else {
                intersectionCount = getIntersection(goal.games, games).length;
            }
            return intersectionCount >= goal.minGameIntersection;
        }
        goal.checkGroups = (groups) => getIntersection(goal.groups, groups).length == 0;
    }

    function setupMethods(goalPool) {
        goalPool.draw = () => {
            let totalWeight = 0;
            for (let i = 0; i < goalPool.length; i++) {
                let goal = goalPool[i];
                totalWeight += goal.weight;
            }
            if (totalWeight == 0) {
                return null;
            }
            let weight = random() * totalWeight;
            for (let i = 0; i < goalPool.length; i++) {
                weight -= goalPool[i].weight;
                if (weight < 0) {
                    return goalPool.splice(i, 1)[0];
                }
            }
            return null;
        };
        goalPool.copy = () => {
            let newGoalPool = [...goalPool];
            setupMethods(newGoalPool);
            return newGoalPool;
        }

        goalPool.filter = (games, groups) => {
            let newGoalPool = [];
            for (let goal of goalPool) {
                if (games != undefined && !goal.checkGames(games)) continue;
                if (groups != undefined && !goal.checkGroups(groups)) continue;
                newGoalPool.push(goal);
            }
            setupMethods(newGoalPool);
            return newGoalPool;
        }
    }

    setupMethods(data);
    return data;
}
