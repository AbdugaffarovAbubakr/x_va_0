const gameId = (() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (!id || id === "game.html") {
        alert("Game ID topilmadi. Iltimos, o'yin havolasiga to'g'ri kiring.");
        console.error("Game ID topilmadi. pathname=", window.location.pathname);
    }
    return id;
})();

const password = prompt("Parolni kiriting:");

const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);

let myMark = null;

ws.onopen = () => {
    console.log("WebSocket ochildi, join so'rovi yuborilmoqda:", { gameId, password });
    if (!gameId) return;
    ws.send(JSON.stringify({
        type: "join",
        gameId,
        password
    }));
};

ws.onerror = (err) => {
    console.error("WebSocket xatosi:", err);
    document.getElementById("status").innerText = "WebSocket xatosi. Konsolni tekshiring.";
};

ws.onclose = () => {
    console.warn("WebSocket yopiildi");
    document.getElementById("status").innerText = "Ulanish uzildi.";
};

ws.onmessage = (e) => {
    console.log("Serverdan kelgan:", e.data);
    const data = JSON.parse(e.data);

    if (data.error) {
        alert(data.error);
        document.getElementById("status").innerText = "Xato: " + data.error;
        return;
    }

    if (data.type === "joined") {
        myMark = data.mark;
        document.getElementById("status").innerText =
            `Siz: ${myMark}. Ikkinchi o‘yinchi kutilyapti...`;
    }

    if (data.type === "start") {
        createBoard();
        document.getElementById("status").innerText =
            `${data.turn} navbat`;
    }

    if (data.type === "update") {
        renderBoard(data.board);
        document.getElementById("status").innerText =
            `${data.turn} navbat`;
    }

    if (data.type === "left") {
        alert(data.message);
        document.getElementById("status").innerText = "Raqib chiqib ketdi.";
    }
};

function createBoard() {
    const boardEl = document.getElementById("board");
    boardEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.onclick = () => {
            ws.send(JSON.stringify({
                type: "move",
                gameId,
                index: i
            }));
        };
        boardEl.appendChild(cell);
    }
}

function renderBoard(board) {
    const cells = document.querySelectorAll(".cell");
    board.forEach((v, i) => {
        cells[i].textContent = v ?? "";
    });
}
