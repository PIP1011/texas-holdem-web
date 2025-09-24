let players = [];
let pot = 0;
let currentPlayer = 0;
let rounds = ["Pre-Flop", "Flop", "Turn", "River"];
let currentRoundIndex = 0;
let dealerIndex = 0;
let highestBet = 0;

function setupPlayers() {
    const numPlayers = parseInt(document.getElementById('numPlayers').value);
    const container = document.getElementById('playerInputs');
    container.innerHTML = '';

    for (let i = 0; i < numPlayers; i++) {
        container.innerHTML += `
            <div>
                <label>Player ${i+1} Name: </label>
                <input type="text" id="name${i}" value="Player${i+1}">
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
        players.push({name: name, total: 10000, folded: false, currentBet: 0});
    }
    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    startHand();
}

function startHand() {
    resetHandState();
    setupBlinds();
    updateDisplay();
    promptNextActivePlayer();
}

function resetHandState() {
    players.forEach(p => { p.folded = false; p.currentBet = 0; });
    pot = 0;
    currentRoundIndex = 0;
    highestBet = 0;
}

function setupBlinds() {
    const numPlayers = players.length;
    const sbIndex = (dealerIndex + 1) % numPlayers;
    const bbIndex = (dealerIndex + 2) % numPlayers;
    const sbAmount = 50;
    const bbAmount = 100;

    players[sbIndex].total -= sbAmount;
    players[sbIndex].currentBet = sbAmount;

    players[bbIndex].total -= bbAmount;
    players[bbIndex].currentBet = bbAmount;

    pot += sbAmount + bbAmount;
    highestBet = bbAmount;

    currentPlayer = (bbIndex + 1) % numPlayers;
    alert(`${players[sbIndex].name} posts Small Blind $${sbAmount}\n${players[bbIndex].name} posts Big Blind $${bbAmount}`);
}

function updateDisplay() {
    let status = '';
    players.forEach((p, i) => {
        let dealer = i === dealerIndex ? ' (Dealer)' : '';
        status += `<p>${p.name}: $${p.total.toFixed(2)} ${p.folded ? '(Folded)' : ''}${dealer} | Current Bet: $${p.currentBet}</p>`;
    });
    document.getElementById('playerStatus').innerHTML = status;
    document.getElementById('pot').textContent = pot.toFixed(2);
    document.getElementById('currentPlayer').textContent = players[currentPlayer].name;
    document.getElementById('roundName').textContent = rounds[currentRoundIndex];
}

function playerBet() {
    const amount = parseInt(document.getElementById('betAmount').value);
    let p = players[currentPlayer];
    if (!p.folded && amount > 0 && amount <= p.total) {
        p.total -= amount;
        p.currentBet += amount;
        pot += amount;
        if(p.currentBet > highestBet) highestBet = p.currentBet;
        nextActivePlayer();
    } else {
        alert("Invalid bet amount");
    }
    document.getElementById('betAmount').value = '';
}

function playerCall() {
    let p = players[currentPlayer];
    const callAmount = highestBet - p.currentBet;
    if (!p.folded && callAmount <= p.total) {
        p.total -= callAmount;
        p.currentBet += callAmount;
        pot += callAmount;
        nextActivePlayer();
    } else if(callAmount > p.total){
        alert("Not enough money to call!");
    }
}

function playerCheck() {
    let p = players[currentPlayer];
    if(p.currentBet === highestBet){
        nextActivePlayer();
    } else {
        alert("Cannot check, must call or raise");
    }
}

function playerFold() {
    players[currentPlayer].folded = true;
    checkWinner();
    nextActivePlayer();
}

function nextActivePlayer() {
    let activePlayers = players.filter(p => !p.folded);
    if(activePlayers.length === 1){
        endHand(activePlayers[0].name);
        return;
    }
    do {
        currentPlayer = (currentPlayer + 1) % players.length;
    } while(players[currentPlayer].folded);
    updateDisplay();
}

function promptNextActivePlayer() {
    if(players[currentPlayer].folded) nextActivePlayer();
    else updateDisplay();
}

function nextRound() {
    currentRoundIndex++;
    if(currentRoundIndex >= rounds.length){
        let remainingPlayers = players.filter(p => !p.folded).map(p => p.name);
        if(remainingPlayers.length === 1){
            endHand(remainingPlayers[0]);
        } else {
            let winner = prompt("Round finished! Who won the pot? Choose from: " + remainingPlayers.join(", "));
            endHand(winner);
        }
    } else {
        players.forEach(p => p.currentBet = 0);
        highestBet = 0;
        currentPlayer = (dealerIndex + 1) % players.length; // first to act after dealer
        promptNextActivePlayer();
    }
}

function endHand(winnerName){
    let winner = players.find(p => p.name === winnerName);
    if(winner){
        winner.total += pot;
        alert(`${winner.name} wins the pot of $${pot.toFixed(2)}!`);
    }
    pot = 0;
    dealerIndex = (dealerIndex + 1) % players.length;
    startHand();
}

function checkWinner(){
    let active = players.filter(p => !p.folded);
    if(active.length === 1){
        endHand(active[0].name);
    }
}
