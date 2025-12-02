import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import GameManager from "./gameManager.js";

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

app.use(express.static("public"));

const gameManager = new GameManager();

// --- O‘yinga link yaratish ---
app.get("/create", (req, res) => {
    const { password } = req.query;
    const gameId = gameManager.createGame(password);
    res.send({ link: `/game/${gameId}`, gameId });
});

// --- O‘yin sahifasi ---
app.get("/game/:id", (req, res) => {
    res.sendFile(process.cwd() + "/public/game.html");
});

// --- WebSocket ulanish ---
wss.on("connection", (ws) => {
    ws.on("message", (msg) => {
        const data = JSON.parse(msg);
        gameManager.handleMessage(ws, data);
    });

    ws.on("close", () => {
        gameManager.disconnect(ws);
    });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log("Server ishlayapti:", PORT);
});

