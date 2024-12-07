class Sync {
    constructor(roomName = "", lockout = true) {
        this.lockout = lockout;
        this.connected = false;
        this.sync = false;

        this.onlineMemberIds = [];
        this.players = [];
        this.history = [];
        this.board = [];
        this.resetBoard();

        this.syncTimer = null;
        this.syncTimeout = 10000;

        this.onConnectListeners = [];
        this.onDisconnectListeners = [];
        this.onReconnectListeners = [];
        this.onActionListeners = [];

        this.askResolve = null;

        if (roomName == "" || roomName == null) {
            this.online = false;
            this.messageNumber = 1;
            return;
        }

        this.online = true;
        this.roomName = `observable-${roomName}`;
        this.drone = new Scaledrone('DO4LDJ74Bp80Kcso');
        this.room = this.drone.subscribe(this.roomName);

        this.drone.on('open', error => {
            if (error) {
                return console.error(error);
            } else {
                console.log('Connected to server');
            }
        });

        this.drone.on('error', error => {
            console.error(error);
        });

        this.drone.on('disconnect', () => {
            this.connected = false;
            this.sync = false;
            console.log('Disconnected from server');
            this.onDisconnectListeners.forEach((callback) => { callback(); });
        });

        this.drone.on('reconnect', () => {
            this.connected = true;
            console.log('Reconnected to server');
            this.onReconnectListeners.forEach((callback) => { callback(); });
            this.ask();
        });

        this.room.on('open', error => {
            if (error) {
                return console.error(error);
            } else {
                this.connected = true;
                console.log('Subscribed to room:', roomName);
            }
        });

        this.room.on('members', members => {
            for (let member of members) {
                this.onlineMemberIds.push(member.id);
            }
            this.onConnectListeners.forEach((callback) => { callback(); });
            this.ask();
        });

        this.room.on('member_join', member => {
            this.onlineMemberIds.push(member.id)
        });

        this.room.on('member_leave', member => {
            const index = this.onlineMemberIds.findIndex(memberId => memberId === member.id);
            if (index >= 0) {
                this.onlineMemberIds.splice(index, 1);
            }
        });

        this.room.on('message', message => {
            this.onMessage(message);
        });
    }

    connect() {

    }

    sendFlag(cellId, playerName, flag) {
        let data = {
            time: Date.now(),
            player: playerName,
            cid: cellId,
            flag: flag,
            history: this.history,
            sync: this.sync,
        };
        if (this.online) {
            this.drone.publish({ room: this.roomName, message: data });
        } else {
            data.history = JSON.parse(JSON.stringify(data.history));
            this.onMessage({ id: `#${this.messageNumber}`, data: data });
        }
    }

    sendColor(playerName, color) {
        let data = {
            time: Date.now(),
            player: playerName,
            color: color,
            history: this.history,
            sync: this.sync,
        }
        if (this.online) {
            this.drone.publish({ room: this.roomName, message: data });
        } else {
            data.history = JSON.parse(JSON.stringify(data.history));
            this.onMessage({ id: `#${this.messageNumber}`, data: data });
        }
    }

    getPlayerColor(playerName) {
        const index = this.players.findIndex(player => player.name == playerName);
        if (index < 0) {
            return null;
        }
        return this.players[index].color;
    }

    getPlayerColors() {
        return this.players
    }

    getCellColors(cellId) {
        return this.board[cellId].map(playerName => this.getPlayerColor(playerName)).filter(color => color != null);
    }

    getBoardColors() {
        return this.board.map((_, cellId) => this.getCellColors(cellId));
    }

    addActionListener(callback) { this.onActionListeners.push(callback); }
    addConnectListener(callback) {
        if (this.online) {
            this.onConnectListeners.push(callback);
        } else {
            callback();
        }
    }
    addReconnectListener(callback) { this.onReconnectListeners.push(callback); }
    addDisconnectListener(callback) { this.onDisconnectListeners.push(callback); }

    onMessage(message) {
        console.log('Received message:', message.data);
        if (message.data.askFor != undefined) {
            if (message.data.askFor == this.drone.clientId) {
                this.answer();
            }
            return;
        }
        if (message.data.sync) {
            this.sync = true;
            if (!this.onlineMemberIds.includes(message.member.id)) {
                this.onlineMemberIds.push(message.member.id);
            }
        }
        let operation = {
            id: message.id,
            time: message.data.time,
        }
        if (message.data.cid != undefined) {
            operation.player = message.data.player;
            operation.cid = message.data.cid;
            operation.flag = message.data.flag;
            this.history.push(operation);
        } else if (message.data.color != undefined) {
            operation.player = message.data.player;
            operation.color = message.data.color;
            this.history.push(operation);
        }
        this.history = [...this.history, ...message.data.history];
        this.updateHistory();
        if (this.askResolve != null) {
            this.askResolve(message.member.id);
        }
        this.onActionListeners.forEach(callback => { callback(); });
    }

    resetBoard() {
        this.board = [];
        for (let i = 0; i < 25; ++i) {
            this.board.push([])
        }
    }

    resetPlayers() {
        this.players = [];
    }

    updateHistory() {
        this.history.sort((a, b) => {
            if (a.time > b.time) {
                return 1;
            } else if (a.time < b.time) {
                return -1;
            } else if (a.id > b.id) {
                return 1;
            } else if (a.id < b.id) {
                return -1
            } else {
                b.drop = true;
                return 0;
            }
        });
        this.resetBoard();
        this.resetPlayers();
        for (let i = 0; i < this.history.length; ++i) {
            let operation = this.history[i];
            if (operation.drop) {
                this.history.splice(i, 1);
                --i;
                continue;
            }
            if (operation.cid != undefined) {
                if (operation.flag) {
                    if (!this.board[operation.cid].includes(operation.player) && (!this.lockout || this.board[operation.cid].length == 0)) {
                        this.board[operation.cid].push(operation.player);
                        const index = this.players.findIndex(player => player.name == operation.player);
                        if (index < 0) {
                            this.players.push({ name: operation.player, color: null, count: 1 });
                        } else {
                            this.players[index].count++;
                        }
                    }
                } else {
                    const cid = this.board[operation.cid].findIndex(playerName => playerName == operation.player);
                    if (cid >= 0) {
                        this.board[operation.cid].splice(cid, 1);
                        const pid = this.players.findIndex(player => player.name == operation.player);
                        if (pid >= 0) {
                            this.players[pid].count--;
                        }
                    }
                }
            } else { // color
                const index = this.players.findIndex(player => player.name == operation.player);
                if (index < 0) {
                    this.players.push({ name: operation.player, color: operation.color, count: 0 });
                } else {
                    this.players[index].color = operation.color;
                }
            }
        }
    }

    async ask() {
        if (this.sync) {
            return;
        }
        while (this.onlineMemberIds.length > 0) {
            let memberId = this.onlineMemberIds.pop()
            if (memberId == this.drone.clientId) {
                continue;
            }

            this.drone.publish({
                room: this.roomName,
                message: { askFor: memberId },
            });

            while (true) {
                let syncMemberId = new Promise(resolve => {
                    this.askResolve = resolve;
                });

                if (this.syncTimer != null) {
                    clearTimeout(this.syncTimer);
                }
                this.syncTimer = setTimeout(() => {
                    console.log("Sync timeout from", memberId);
                    if (this.askResolve != null) {
                        this.askResolve(null);
                    }
                    this.syncTimer = null;
                }, this.syncTimeout);

                syncMemberId = await syncMemberId;

                if (this.sync || syncMemberId == null || syncMemberId == memberId) {
                    break;
                }
            }
            if (this.sync) {
                if (this.syncTimer != null) {
                    clearTimeout(this.syncTimer);
                    this.syncTimer = null;
                }
                console.log("Sync complete");
                return;
            }
        }
        console.log("No online members");
        this.sync = true;
    }

    answer() {
        this.drone.publish({
            room: this.roomName,
            message: {
                time: Date.now(),
                history: this.history,
                sync: this.sync,
            },
        });
    }
}
