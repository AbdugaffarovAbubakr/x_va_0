const gameId = window.location.pathname.split("/").pop();
const password = prompt("Parolni kiriting:");

const ws = new WebSocket(`ws://${window.location.host}`);

let myMark = null;

ws.onopen = () => {
    ws.send(JSON.stringify({
        type: "join",
        gameId,
        password
    }));
};

ws.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if (data.error) {
        alert(data.error);
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
