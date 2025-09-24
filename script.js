let players = [];
let pot = 0;
let currentRoundIndex = 0;
let dealerIndex = 0;
let highestBet = 0;
let currentPlayerIndex = 0;
let community = [];
let playerHands = [];

// --- Setup Players ---
function setupPlayers() {
    const numPlayers = parseInt(document.getElementById('numPlayers').value);
    const container = document.getElementById('playerInputs');
    container.innerHTML = '';
    for (let i = 0; i < numPlayers; i++) {
        container.innerHTML += `<div>
            <label>Player ${i+1} Name: </label>
            <input type="text" id="name${i}" value="Player${i+1}">
        </div>`;
    }
    container.innerHTML += `<button onclick="startGame()">Start Game</button>`;
}

function startGame() {
    const numPlayers = parseInt(document.getElementById('numPlayers').value);
    players = [];
    for (let i = 0; i < numPlayers; i++) {
        const name = document.getElementById(`name${i}`).value;
        players.push({name, total: 10000, folded: false, currentBet: 0});
    }
    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    renderPlayerTotals(); // show totals immediately
    startHand();
}

// --- Start Hand ---
function startHand() {
    resetHandState();
    setupBlinds();
    currentRoundIndex = 0;
    startRound();
}

function resetHandState() {
    players.forEach(p => { p.folded = false; p.currentBet = 0; });
    pot = 0;
    highestBet = 0;
    community = [];
    playerHands = [];
    renderCards([], []);
    updatePotDisplay();
    renderPlayerTotals();
}

// --- Blinds ---
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

    updatePotDisplay();
    renderPlayerTotals();
}

// --- Betting Round ---
function startRound() {
    if (currentRoundIndex >= 4) { showCommunityInput(); return; }
    players.forEach(p => p.currentBet = 0);
    highestBet = 0;
    document.getElementById('roundName').textContent = ["Pre-Flop","Flop","Turn","River"][currentRoundIndex];
    currentPlayerIndex = getNextActivePlayer(dealerIndex);
    showBettingForm(currentPlayerIndex);
}

function showBettingForm(playerIndex) {
    let player = players[playerIndex];
    if(player.folded) { nextPlayer(); return; }

    document.getElementById('bettingArea').style.display = 'block';
    document.getElementById('bettingPlayer').textContent = `${player.name}'s Turn`;
}

document.getElementById('actionSelect').addEventListener('change', function() {
    document.getElementById('raiseAmount').style.display = this.value === 'raise' ? 'inline' : 'none';
});

function submitAction() {
    let action = document.getElementById('actionSelect').value;
    let raiseAmount = parseInt(document.getElementById('raiseAmount').value) || 0;
    let player = players[currentPlayerIndex];

    if(action === 'fold') player.folded = true;
    else if(action === 'call') {
        let callAmount = highestBet - player.currentBet;
        player.total -= callAmount;
        player.currentBet += callAmount;
        pot += callAmount;
    }
    else if(action === 'raise') {
        player.total -= raiseAmount;
        player.currentBet += raiseAmount;
        if(player.currentBet > highestBet) highestBet = player.currentBet;
        pot += raiseAmount;
    }
    else if(action === 'check') {
        if(player.currentBet < highestBet) { alert("Cannot check, must call or raise."); return; }
    }

    updatePotDisplay();
    renderPlayerTotals(); // always show updated totals
    nextPlayer();
}

function nextPlayer() {
    currentPlayerIndex = getNextActivePlayer(currentPlayerIndex);
    if(isRoundComplete()) { currentRoundIndex++; startRound(); }
    else { showBettingForm(currentPlayerIndex); }
}

function getNextActivePlayer(startIndex) {
    let index = (startIndex + 1) % players.length;
    while(players[index].folded) { index = (index + 1) % players.length; }
    return index;
}

function isRoundComplete() {
    let active = players.filter(p => !p.folded);
    return active.every(p => p.currentBet === highestBet);
}

function updatePotDisplay() { document.getElementById('pot').textContent = pot; }

function renderPlayerTotals() {
    const totalsDiv = document.getElementById('totalsList');
    if(!totalsDiv) return;
    totalsDiv.innerHTML = '';
    players.forEach(p => {
        const pDiv = document.createElement('div');
        pDiv.textContent = `${p.name}: $${p.total}` + (p.folded ? " (Folded)" : "");
        totalsDiv.appendChild(pDiv);
    });
}

// --- Community & Hole Cards Input ---
function showCommunityInput() {
    document.getElementById('bettingArea').style.display = 'none';
    document.getElementById('communityInput').style.display = 'block';
}

function submitCommunity() {
    community = document.getElementById('communityCardsInput').value.split(" ");
    document.getElementById('communityInput').style.display = 'none';
    showPlayerCardsInput(0);
}

let playerCardIndex = 0;
function showPlayerCardsInput(index) {
    if(index >= players.length) { renderCards(community, playerHands); endHandEvaluation(); return; }
    let p = players[index];
    if(p.folded) { showPlayerCardsInput(index+1); return; }

    playerCardIndex = index;
    document.getElementById('playerCardsInput').style.display = 'block';
    document.getElementById('holePlayerName').textContent = `${p.name}'s Hole Cards`;
}

function submitHoleCards() {
    let cards = document.getElementById('holeCards').value.split(" ");
    playerHands[playerCardIndex] = {name: players[playerCardIndex].name, cards};
    document.getElementById('holeCards').value = '';
    document.getElementById('playerCardsInput').style.display = 'none';
    showPlayerCardsInput(playerCardIndex+1);
}

// --- Render Cards ---
function renderCards(community=[], playerHands=[]) {
    const communityDiv = document.getElementById('communityCards');
    communityDiv.innerHTML = '';
    community.forEach(c => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        if(c.slice(-1)==='h'||c.slice(-1)==='d') cardDiv.classList.add('red');
        cardDiv.textContent=c.slice(0,-1)+suitSymbol(c.slice(-1));
        communityDiv.appendChild(cardDiv);
    });

    const playersDiv = document.getElementById('playersHands');
    playersDiv.innerHTML = '';
    playerHands.forEach(ph => {
        const playerDiv = document.createElement('div');
        playerDiv.innerHTML = `<strong>${ph.name}</strong>`;
        const handDiv = document.createElement('div');
        handDiv.classList.add('cards');
        ph.cards.forEach(c => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            if(c.slice(-1)==='h'||c.slice(-1)==='d') cardDiv.classList.add('red');
            cardDiv.textContent = c.slice(0,-1)+suitSymbol(c.slice(-1));
            handDiv.appendChild(cardDiv);
        });
        playerDiv.appendChild(handDiv);
        playersDiv.appendChild(playerDiv);
    });
}

function suitSymbol(s){ switch(s){ case 'h': return '♥'; case 'd': return '♦'; case 'c': return '♣'; case 's': return '♠'; } }

// --- End Hand & Evaluate ---
function endHandEvaluation() {
    let remaining = playerHands.filter(p => players.find(pl=>pl.name===p.name).folded===false);
    if(remaining.length===1){
        let winner = remaining[0];
        let winPlayer = players.find(p=>p.name===winner.name);
        winPlayer.total += pot;
        alert(`${winner.name} wins the pot $${pot}!`);
        dealerIndex = (dealerIndex+1)%players.length;
        startHand();
    } else {
        let results = remaining.map(ph=>{
            let allCards = ph.cards.concat(community);
            return {name:ph.name, handRank:evaluateBestHand(allCards), cards:allCards};
        });
        results.sort((a,b)=>b.handRank.score - a.handRank.score);
        let winner = results[0];
        let winnerPlayer = players.find(p=>p.name===winner.name);
        winnerPlayer.total += pot;
        alert(`Winner: ${winner.name}\nHand: ${winner.handRank.name}\nCards: ${winner.cards.join(" ")}`);
        dealerIndex = (dealerIndex+1)%players.length;
        startHand();
    }
    renderPlayerTotals();
}

// --- Hand evaluation and examples ---
// Placeholder: implement evaluateBestHand() and renderExampleHands() as in previous code
