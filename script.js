let players = [];
let pot = 0;
let currentRoundIndex = 0;
let dealerIndex = 0;
let highestBet = 0;

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
    startHand();
}

// --- Start a Hand ---
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

    alert(`${players[sbIndex].name} posts Small Blind $${sbAmount}\n${players[bbIndex].name} posts Big Blind $${bbAmount}`);
}

// --- Automatic Betting Round ---
function startRound() {
    if (currentRoundIndex >= 4) { endHand(); return; }

    players.forEach(p => p.currentBet = 0);
    highestBet = 0;

    alert(`Starting ${["Pre-Flop", "Flop", "Turn", "River"][currentRoundIndex]} Round`);
    processPlayerTurn(getNextActivePlayer(dealerIndex));
}

function processPlayerTurn(playerIndex) {
    let p = players[playerIndex];
    if (p.folded) { nextPlayer(playerIndex); return; }

    let input = prompt(`Player ${p.name}, your turn. Choose:\n- check (c)\n- call (call)\n- raise amount (number)\n- fold (f)`);

    if (input.toLowerCase() === 'f') { p.folded = true; }
    else if (input.toLowerCase() === 'c' || input.toLowerCase() === 'call') {
        let callAmount = highestBet - p.currentBet;
        p.total -= callAmount;
        p.currentBet += callAmount;
        pot += callAmount;
    }
    else if (!isNaN(parseInt(input))) {
        let raiseAmount = parseInt(input);
        p.total -= raiseAmount;
        p.currentBet += raiseAmount;
        if (p.currentBet > highestBet) highestBet = p.currentBet;
        pot += raiseAmount;
    }
    else if (input.toLowerCase() === 'check') {
        if (p.currentBet < highestBet) { alert("Cannot check, must call or raise."); processPlayerTurn(playerIndex); return; }
    } else { alert("Invalid input. Try again."); processPlayerTurn(playerIndex); return; }

    if (isRoundComplete()) { currentRoundIndex++; startRound(); }
    else { nextPlayer(playerIndex); }
}

function nextPlayer(currentIndex) {
    let nextIndex = getNextActivePlayer(currentIndex);
    processPlayerTurn(nextIndex);
}

function getNextActivePlayer(startIndex) {
    let index = (startIndex + 1) % players.length;
    while (players[index].folded) { index = (index + 1) % players.length; }
    return index;
}

function isRoundComplete() {
    let activePlayers = players.filter(p => !p.folded);
    return activePlayers.every(p => p.currentBet === highestBet);
}

// --- End Hand & Evaluate Winner ---
function endHand() {
    let remainingPlayers = players.filter(p => !p.folded);

    if (remainingPlayers.length === 1) {
        remainingPlayers[0].total += pot;
        alert(`${remainingPlayers[0].name} wins the pot of $${pot.toFixed(2)}!`);
    } else {
        let community = prompt("Enter the 5 community cards (e.g., Ah Ks 10d 2c Jc):").split(" ");
        let playerHands = [];
        remainingPlayers.forEach(p => {
            let cards = prompt(`${p.name}, enter your 2 hole cards (e.g., Ah Ks):`).split(" ");
            playerHands.push({name: p.name, cards});
        });

        let results = playerHands.map(ph => {
            let allCards = ph.cards.concat(community);
            return {name: ph.name, handRank: evaluateBestHand(allCards), cards: allCards};
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

// --- Full Hand Evaluator ---
function evaluateBestHand(cards) {
    const suits = cards.map(c => c.slice(-1));
    const values = cards.map(c => cardValue(c)).sort((a,b)=>b-a);
    const counts = {};
    values.forEach(v => counts[v] = (counts[v]||0)+1);

    const suitCounts = {};
    suits.forEach(s => suitCounts[s] = (suitCounts[s]||0)+1);
    const flushSuit = Object.keys(suitCounts).find(s => suitCounts[s]>=5);

    const uniqueValues = [...new Set(values)];
    let straightHigh = null;
    for(let i=0;i<=uniqueValues.length-5;i++){
        if(uniqueValues[i]-uniqueValues[i+4]===4){ straightHigh = uniqueValues[i]; break; }
    }
    if(!straightHigh && uniqueValues.includes(14) && uniqueValues.includes(2) &&
       uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) straightHigh = 5;

    let straightFlushHigh = null;
    if(flushSuit){
        const flushValues = cards.filter(c=>c.slice(-1)===flushSuit).map(c=>cardValue(c)).sort((a,b)=>b-a);
        const uniqueFlushValues = [...new Set(flushValues)];
        for(let i=0;i<=uniqueFlushValues.length-5;i++){
            if(uniqueFlushValues[i]-uniqueFlushValues[i+4]===4){ straightFlushHigh = uniqueFlushValues[i]; break; }
        }
        if(!straightFlushHigh && uniqueFlushValues.includes(14) && uniqueFlushValues.includes(2) &&
           uniqueFlushValues.includes(3) && uniqueFlushValues.includes(4) && uniqueFlushValues.includes(5)) straightFlushHigh = 5;
    }

    const countValues = Object.values(counts).sort((a,b)=>b-a);
    const countKeys = Object.keys(counts).map(Number);
    let score = 0;
    let name = "High Card";

    if(straightFlushHigh){ score = straightFlushHigh===14?100000:90000+straightFlushHigh; name = straightFlushHigh===14?"Royal Flush":"Straight Flush"; }
    else if(countValues[0]===4){ score = 80000+countKeys.find(k=>counts[k]===4); name="Four of a Kind"; }
    else if(countValues[0]===3 && countValues[1]>=2){ score=70000+countKeys.find(k=>counts[k]===3); name="Full House"; }
    else if(flushSuit){ score=60000+Math.max(...cards.filter(c=>c.slice(-1)===flushSuit).map(c=>cardValue(c))); name="Flush"; }
    else if(straightHigh){ score=50000+straightHigh; name="Straight"; }
    else if(countValues[0]===3){ score=40000+countKeys.find(k=>counts[k]===3); name="Three of a Kind"; }
    else if(countValues[0]===2 && countValues[1]===2){ let pairs = countKeys.filter(k=>counts[k]===2).sort((a,b)=>b-a); score=30000+pairs[0]*14+pairs[1]; name="Two Pair"; }
    else if(countValues[0]===2){ score=20000+countKeys.find(k=>counts[k]===2); name="One Pair"; }
    else{ score=10000+Math.max(...values); name="High Card"; }

    return {score,name};
}

function cardValue(card){
    let v = card.slice(0,-1);
    if(v==="A") return 14;
    if(v==="K") return 13;
    if(v==="Q") return 12;
    if(v==="J") return 11;
    return parseInt(v);
}
