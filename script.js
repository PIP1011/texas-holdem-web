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

// --- Player Actions ---
function playerBet() {
    const amount = parseInt(document.getElementById('betAmount').value);
    let p = players[currentPlayer];
    if (!p.folded && amount > 0 && amount <= p.total) {
        p.total -= amount;
        p.currentBet += amount;
        pot += amount;
        if(p.currentBet > highestBet) highestBet = p.currentBet;
        document.getElementById('betAmount').value = '';
        nextTurnOrRound();
    } else {
        alert("Invalid bet amount");
    }
}

function playerCall() {
    let p = players[currentPlayer];
    const callAmount = highestBet - p.currentBet;
    if (!p.folded && callAmount <= p.total) {
        p.total -= callAmount;
        p.currentBet += callAmount;
        pot += callAmount;
        nextTurnOrRound();
    } else if(callAmount > p.total){
        alert("Not enough money to call!");
    }
}

function playerCheck() {
    let p = players[currentPlayer];
    if(p.currentBet === highestBet){
        nextTurnOrRound();
    } else {
        alert("Cannot check, must call or raise");
    }
}

function playerFold() {
    players[currentPlayer].folded = true;
    checkWinner();
    nextTurnOrRound();
}

function nextTurnOrRound() {
    updateDisplay();
    
    let activePlayers = players.filter(p => !p.folded);
    
    if(activePlayers.length === 1){
        endHand();
        return;
    }

    let allMatched = activePlayers.every(p => p.currentBet === highestBet);
    if(allMatched){
        currentRoundIndex++;
        if(currentRoundIndex >= rounds.length){
            endHand();
            return;
        } else {
            players.forEach(p => p.currentBet = 0);
            highestBet = 0;
        }
    }

    do {
        currentPlayer = (currentPlayer + 1) % players.length;
    } while(players[currentPlayer].folded);
    updateDisplay();
}

// --- End Hand with automatic card comparison ---
function endHand() {
    let remainingPlayers = players.filter(p => !p.folded);

    if (remainingPlayers.length === 1) {
        remainingPlayers[0].total += pot;
        alert(`${remainingPlayers[0].name} wins the pot of $${pot.toFixed(2)}!`);
    } else {
        let community = prompt("Enter the 5 community cards separated by spaces (e.g., Ah Ks 10d 2c Jc):").split(" ");

        let playerHands = [];
        remainingPlayers.forEach(p => {
            let cards = prompt(`${p.name}, enter your 2 hole cards separated by a space (e.g., Ah Ks):`).split(" ");
            playerHands.push({name: p.name, cards: cards});
        });

        let results = playerHands.map(ph => {
            let allCards = ph.cards.concat(community);
            return {name: ph.name, handRank: evaluateHand(allCards), cards: allCards};
        });

        results.sort((a,b) => b.handRank.score - a.handRank.score);
        let winner = results[0];

        alert(`Winner: ${winner.name}\nHand: ${winner.handRank.name}\nCards: ${winner.cards.join(" ")}`);
        let winnerPlayer = players.find(p => p.name === winner.name);
        winnerPlayer.total += pot;
    }

    pot = 0;
    dealerIndex = (dealerIndex + 1) % players.length;
    startHand();
}

// --- Hand Evaluation ---
function evaluateHand(cards) {
    let values = cards.map(c => cardValue(c));
    values.sort((a,b)=>b-a);
    
    let counts = {};
    values.forEach(v => counts[v] = (counts[v]||0)+1);

    let score = 0;
    let name = "High Card";

    if(Object.values(counts).includes(4)){score=7000; name="Four of a Kind";}
    else if(Object.values(counts).includes(3) && Object.values(counts).includes(2)){score=6000; name="Full House";}
    else if(Object.values(counts).includes(3)){score=3000; name="Three of a Kind";}
    else if(Object.values(counts).filter(v=>v===2).length===2){score=2000; name="Two Pair";}
    else if(Object.values(counts).includes(2)){score=1000; name="One Pair";}
    else{score=values[0]; name="High Card";}

    return {score: score, name: name};
}

function cardValue(card) {
    let v = card.slice(0,-1);
    if(v==="A") return 14;
    if(v==="K") return 13;
    if(v==="Q") return 12;
    if(v==="J") return 11;
    return parseInt(v);
}
