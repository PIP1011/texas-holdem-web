let players = [];
let pot = 0;
let currentPlayer = 0;

function setupPlayers() {
    const numPlayers = parseInt(document.getElementById('numPlayers').value);
    const container = document.getElementById('playerInputs');
    container.innerHTML = '';

    for (let i = 0; i < numPlayers; i++) {
        container.innerHTML += `
            <div>
                <label>Player ${i+1} Name: </label>
                <input type="text" id="name${i}" value="Player${i+1}">
                <label>Starting Money: </label>
                <input type="number" id="money${i}" value="100">
            </div>
        `;
    }
    container.innerHTML += `<button onclick="startGame()">Start Game</button>`;
}

function startGame() {
    const numPlayers = parseInt(document.getElementById('numPlayers').value);
    players = [];
    for (let i = 0; i < numPlayers; i++) {
        const name = document.getElementById(`name${i}`).value;
        const money = parseFloat(document.getElementById(`money${i}`).value);
        players.push({name: name, total: money, folded: false});
    }
    document.getElementById('players-setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    updateDisplay();
}

function updateDisplay() {
    let status = '';
    players.forEach(p => {
        status += `<p>${p.name}: $${p.total.toFixed(2)} ${p.folded ? '(Folded)' : ''}</p>`;
    });
    document.getElementById('playerStatus').innerHTML = status;
    document.getElementById('pot').textContent = pot.toFixed(2);
    document.getElementById('currentPlayer').textContent = players[currentPlayer].name;
}

function bet() {
    let p = players[currentPlayer];
    if (!p.folded && p.total >= 10) {
        p.total -= 10;
        pot += 10;
        updateDisplay();
    }
}

function fold() {
    players[currentPlayer].folded = true;
    updateDisplay();
}

function nextPlayer() {
    do {
        currentPlayer = (currentPlayer + 1) % players.length;
    } while(players[currentPlayer].folded);
    updateDisplay();
}
