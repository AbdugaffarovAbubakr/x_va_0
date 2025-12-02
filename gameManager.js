import { randomUUID } from "crypto";

export default class GameManager {
    constructor() {
        this.games = {};
        this.players = new Map();
    }

    createGame(password) {
        const id = randomUUID();
        this.games[id] = {
            id,
            password,
            players: {
                X: null,
                O: null
            },
            board: Array(9).fill(null),
            turn: "X"
        };
        return id;
    }

    handleMessage(ws, data) {
        if (data.type === "join") {
            this.joinGame(ws, data);
        }

        if (data.type === "move") {
            this.makeMove(ws, data);
        }
    }

    joinGame(ws, data) {
        console.log("[joinGame] so'rov:", { gameId: data.gameId, password: data.password });
        const game = this.games[data.gameId];
        if (!game) {
            console.log("[joinGame] o'yin topilmadi:", data.gameId);
            return ws.send(JSON.stringify({ error: "Game not found" }));
        }

        if (game.password !== data.password) {
            console.log("[joinGame] noto'g'ri parol:", { expected: game.password, got: data.password });
            return ws.send(JSON.stringify({ error: "Wrong password" }));
        }

        let mark = null;
        console.log("[joinGame] mavjud o'yinchilar:", { X: !!game.players.X, O: !!game.players.O });
        if (!game.players.X) mark = "X";
        else if (!game.players.O) mark = "O";
        else {
            console.log("[joinGame] o'yin to'liq:", data.gameId);
            return ws.send(JSON.stringify({ error: "Game is full" }));
        }

        game.players[mark] = ws;
        this.players.set(ws, { gameId: game.id, mark });

        console.log(`[joinGame] ${mark} belgilandi ->`, data.gameId);

        ws.send(JSON.stringify({ type: "joined", mark }));

        if (game.players.X && game.players.O) {
            console.log("[joinGame] ikkala o'yinchi ulandi, start yuborilmoqda:", data.gameId);
            this.broadcast(game.id, { type: "start", turn: game.turn });
        }
    }

    makeMove(ws, data) {
        const { gameId, index } = data;
        const game = this.games[gameId];
        const player = this.players.get(ws);

        if (!game || !player) return;

        if (game.turn !== player.mark) return;

        if (game.board[index] !== null) return;

        game.board[index] = player.mark;
        game.turn = game.turn === "X" ? "O" : "X";

        this.broadcast(gameId, {
            type: "update",
            board: game.board,
            turn: game.turn
        });
    }

    disconnect(ws) {
        const player = this.players.get(ws);
        if (!player) return;

        const { gameId, mark } = player;
        const game = this.games[gameId];
        if (!game) return;

        game.players[mark] = null;
        this.players.delete(ws);

        this.broadcast(gameId, {
            type: "left",
            message: "Raqib o‘yindan chiqib ketdi!"
        });
    }

    broadcast(gameId, msg) {
        const game = this.games[gameId];
        if (!game) return;

        const message = JSON.stringify(msg);

        ["X", "O"].forEach(mark => {
            const ws = game.players[mark];
            if (ws) ws.send(message);
        });
    }
}
