let players = [];
let pot = 0;
let currentPlayer = 0;
let rounds = ["Pre-Flop", "Flop", "Turn", "River"];
let currentRoundIndex = 0;

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
        players.push({name: name, total: money, folded: false, currentBet: 0});
    }
    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    setupBlinds();
    updateDisplay();
}

function setupBlinds() {
    // Small and Big blinds
    if(players.length >= 2){
        let sb = 0; // small blind index
        let bb = 1; // big blind index
        let sbAmount = 5;
        let bbAmount = 10;

        players[sb].total -= sbAmount;
        players[sb].currentBet = sbAmount;
        pot += sbAmount;

        players[bb].total -= bbAmount;
        players[bb].currentBet = bbAmount;
        pot += bbAmount;

        currentPlayer = 2 % players.length; // next player after blinds
    }
}

function updateDisplay() {
    let status = '';
    players.forEach(p => {
        status += `<p>${p.name}: $${p.total.toFixed(2)} ${p.folded ? '(Folded)' : ''}</p>`;
    });
    document.getElementById('playerStatus').innerHTML = status;
    document.getElementById('pot').textContent = pot.toFixed(2);
    document.getElementById('currentPlayer').textContent = players[currentPlayer].name;
    document.getElementById('roundName').textContent = rounds[currentRoundIndex];
}

function bet() {
    let p = players[currentPlayer];
    if(!p.folded && p.total >= 10){
        p.total -= 10;
        p.currentBet += 10;
        pot += 10;
        updateDisplay();
    }
}

function fold() {
    players[currentPlayer].folded = true;
    updateDisplay();
    checkWinner();
}

function nextPlayer() {
    do {
        currentPlayer = (currentPlayer + 1) % players.length;
    } while(players[currentPlayer].folded);
    updateDisplay();
}

function nextRound() {
    currentRoundIndex++;
    if(currentRoundIndex >= rounds.length){
        alert("Hand finished! Enter winner manually.");
        let remainingPlayers = players.filter(p => !p.folded).map(p => p.name);
        let winner = prompt("Who won the pot? Choose from: " + remainingPlayers.join(", "));
        awardPot(winner);
        resetHand();
    } else {
        // reset bets for next round
        players.forEach(p => p.currentBet = 0);
        currentPlayer = 0;
    }
    updateDisplay();
}

function awardPot(winnerName){
    let winner = players.find(p => p.name === winnerName);
    if(winner){
        winner.total += pot;
        pot = 0;
        alert(`${winner.name} wins the pot!`);
    }
}

function resetHand(){
    players.forEach(p => { p.folded = false; p.currentBet = 0; });
    currentRoundIndex = 0;
    setupBlinds();
    updateDisplay();
}

function checkWinner(){
    let active = players.filter(p => !p.folded);
    if(active.length === 1){
        alert(`${active[0].name} wins the pot!`);
        active[0].total += pot;
        pot = 0;
        resetHand();
    }
}
