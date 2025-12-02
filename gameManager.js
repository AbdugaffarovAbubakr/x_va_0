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
        const game = this.games[data.gameId];
        if (!game) return ws.send(JSON.stringify({ error: "Game not found" }));

        if (game.password !== data.password)
            return ws.send(JSON.stringify({ error: "Wrong password" }));

        // X bo‘sh bo‘lsa X beramiz, bo‘lmasa O
        let mark = null;
        if (!game.players.X) mark = "X";
        else if (!game.players.O) mark = "O";
        else return ws.send(JSON.stringify({ error: "Game is full" }));

        game.players[mark] = ws;
        this.players.set(ws, { gameId: game.id, mark });

        ws.send(JSON.stringify({ type: "joined", mark }));

        // Agar ikkalasi tayyor bo‘lsa boshlash
        if (game.players.X && game.players.O) {
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
