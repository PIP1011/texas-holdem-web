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

// New function to handle automatic turn progression
function nextTurnOrRound() {
    updateDisplay();
    
    let activePlayers = players.filter(p => !p.folded);
    
    // Only one player left → end hand
    if(activePlayers.length === 1){
        endHand(activePlayers[0].name);
        return;
    }

    // Check if all active players have matched the highest bet
    let allMatched = activePlayers.every(p => p.currentBet === highestBet);
    if(allMatched){
        nextRound();
        return;
    }

    // Move to next active player
    do {
        currentPlayer = (currentPlayer + 1) % players.length;
    } while(players[currentPlayer].folded);
    updateDisplay();
}
