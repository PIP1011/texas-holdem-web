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
    renderPlayerTotals();
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
    renderPlayerTotals();
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
    if(index >= players.length) { endHandEvaluation(); return; }
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

// --- Hand Rankings Examples ---
const exampleHands = [
    {name:"Royal Flush", cards:["Ah","Kh","Qh","Jh","10h"]},
    {name:"Straight Flush", cards:["9c","8c","7c","6c","5c"]},
    {name:"Four of a Kind", cards:["Qs","Qh","Qc","Qd","2h"]},
    {name:"Full House", cards:["Kh","Ks","Kd","2c","2d"]},
    {name:"Flush", cards:["2h","6h","9h","Jh","Kh"]},
    {name:"Straight", cards:["10s","9h","8d","7c","6h"]},
    {name:"Three of a Kind", cards:["7s","7h","7d","Qc","2h"]},
    {name:"Two Pair", cards:["Js","Jd","3h","3c","8s"]},
    {name:"One Pair", cards:["Ah","Ad","9c","7s","4h"]},
    {name:"High Card", cards:["As","Kd","10c","7h","4s"]}
];

function renderExampleHands() {
    const container = document.getElementById("handRankings");
    container.innerHTML = '';
    exampleHands.forEach(h=>{
        const div = document.createElement("div");
        div.classList.add("exampleHand");
        div.innerHTML = `<strong>${h.name}</strong>`;
        const cardsDiv = document.createElement("div");
        cardsDiv.style.display = "flex";
        cardsDiv.style.justifyContent = "center";
        cardsDiv.style.marginTop = "5px";
        h.cards.forEach(c=>{
            const cd = document.createElement("div");
            cd.classList.add("card");
            cd.textContent = c;
            if(c.slice(-1)==='h'||c.slice(-1)==='d') cd.classList.add("red");
            else cd.classList.add("black");
            cardsDiv.appendChild(cd);
        });
        div.appendChild(cardsDiv);
        container.appendChild(div);
    });
}
renderExampleHands();

// --- Evaluate Best Hand ---
const HAND_RANKS = [
    "High Card","One Pair","Two Pair","Three of a Kind","Straight",
    "Flush","Full House","Four of a Kind","Straight Flush","Royal Flush"
];

function evaluateBestHand(cards) {
    const ranksMap = {"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14};
    const hand = cards.map(c => ({rank:ranksMap[c.slice(0,-1)], suit:c.slice(-1)}));
    const combos = getCombinations(hand,5);
    let best = {score:0, name:"High Card"};
    combos.forEach(c=>{
        let score = rankHand(c);
        if(score.score > best.score) best = score;
    });
    return best;
}

function rankHand(hand){
    const counts={}, suits={};
    const ranks = hand.map(c=>c.rank).sort((a,b)=>b-a);
    hand.forEach(c=>{ counts[c.rank]=(counts[c.rank]||0)+1; suits[c.suit]=(suits[c.suit]||0)+1; });
    const flush = Object.values(suits).some(v=>v===5);
    const straight = isStraight(ranks);

    if(straight && flush && ranks[0]===14) return {score:10,name:"Royal Flush"};
    if(straight && flush) return {score:9,name:"Straight Flush"};
    if(Object.values(counts).includes(4)) return {score:8,name:"Four of a Kind"};
    if(Object.values(counts).includes(3) && Object.values(counts).includes(2)) return {score:7,name:"Full House"};
    if(flush) return {score:6,name:"Flush"};
    if(straight) return {score:5,name:"Straight"};
    if(Object.values(counts).includes(3)) return {score:4,name:"Three of a Kind"};
    if(Object.values(counts).filter(v=>v===2).length===2) return {score:3,name:"Two Pair"};
    if(Object.values(counts).includes(2)) return {score:2,name:"One Pair"};
    return {score:1,name:"High Card"};
}

function isStraight(ranks){
    const uniq = [...new Set(ranks)];
    if(uniq.length<5) return false;
    for(let i=0;i<=uniq.length-5;i++){ if(uniq[i]-uniq[i+4]===4) return true; }
    if(uniq.includes(14)&&uniq.includes(2)&&uniq.includes(3)&&uniq.includes(4)&&uniq.includes(5)) return true;
    return false;
}

function getCombinations(arr,k){
    const result=[];
    function comb(start,path){
        if(path.length===k){ result.push([...path]); return; }
        for(let i=start;i<arr.length;i++){
            path.push(arr[i]); comb(i+1,path); path.pop();
        }
    }
    comb(0,[]);
    return result;
}
