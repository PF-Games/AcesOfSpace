class playerHand {
  constructor(deck, discardPile, config = {}) {
    this.deck = deck;
    this.discardPile = discardPile;
    this.maxCards = config.maxCards || 12;
    this.cardsToDraw = config.cardsToDraw || 5;
    this.initialCards = config.initialCards || 7;
    this.cards = [];
    this.selectedCards = [];
  }

  get numberOfCards() {
    return this.cards.length;
  }

  get numberOfSelectedCards() {
    return this.selectedCards.length;
  }

  get canDrawCards() {
    return this.numberOfCards < this.maxCards && !this.deck.isEmpty();
  }

  get hasSelectedCards() {
    return this.selectedCards.length > 0;
  }

  drawInitialHand() {
    const cardsToDraw = Math.min(this.initialCards, this.deck.numberOfCards);
    for (let i = 0; i < cardsToDraw; i++) {
      const card = this.deck.pop();
      if (card) {
        this.cards.push(card);
      }
    }
    console.log(`Drew initial hand: ${cardsToDraw} cards`);
    return this.cards;
  }

  drawCards() {
    const spacesAvailable = this.maxCards - this.numberOfCards;
    const cardsToDraw = Math.min(this.cardsToDraw, spacesAvailable);
    
    let drawnCount = 0;
    for (let i = 0; i < cardsToDraw; i++) {
      if (this.deck.isEmpty()) {
        this.reshuffle();
      }
      
      const card = this.deck.pop();
      if (card) {
        this.cards.push(card);
        drawnCount++;
      }
    }
    
    console.log(`Drew ${drawnCount} cards. Hand size: ${this.numberOfCards}/${this.maxCards}`);
    return drawnCount;
  }

  reshuffle() {
    if (this.discardPile.isEmpty()) {
      console.warn('Cannot reshuffle: discard pile is empty');
      return false;
    }
    
    const discardedCards = this.discardPile.clear();
    discardedCards.forEach(card => this.deck.push(card));
    this.deck.shuffle();
    console.log(`Reshuffled ${discardedCards.length} cards from discard pile`);
    return true;
  }

  selectCard(card) {
    const cardIndex = this.cards.indexOf(card);
    if (cardIndex === -1) {
      console.warn('Card not in hand');
      return false;
    }

    if (this.selectedCards.includes(card)) {
      console.warn('Card already selected');
      return false;
    }

    card.select();
    this.selectedCards.push(card);
    return true;
  }

  deselectCard(card) {
    const selectedIndex = this.selectedCards.indexOf(card);
    if (selectedIndex === -1) {
      console.warn('Card not selected');
      return false;
    }

    card.deselect();
    this.selectedCards.splice(selectedIndex, 1);
    return true;
  }

  deselectAll() {
    [...this.selectedCards].forEach(card => this.deselectCard(card));
  }

  playSelectedCards() {
    if (!this.hasSelectedCards) {
      console.warn('No cards selected to play');
      return null;
    }

    const cardsToPlay = [...this.selectedCards];
    
    // Validate hand (optional - returns hand info)
    const handInfo = this.validateHand(cardsToPlay);
    
    // Move cards to discard pile
    cardsToPlay.forEach(card => {
      const cardIndex = this.cards.indexOf(card);
      if (cardIndex !== -1) {
        this.cards.splice(cardIndex, 1);
        if (card.fsm) {
          card.fsm.setState('played');
        }
        this.discardPile.push(card);
      }
    });


     this.selectedCards = [];
    
    console.log(`Played ${cardsToPlay.length} cards. Hand: ${handInfo.handName}`);
    return {
      cards: cardsToPlay,
      handInfo: handInfo
    };
  }

  // Validate poker hand
  validateHand(cards) {
    if (!cards || cards.length === 0) {
      return { handName: 'No Hand', rank: 0, scoringCards: [] };
    }

    const sortedCards = [...cards].sort((a, b) => b.rankValue - a.rankValue);
    
    // Check for pairs
    const rankGroups = {};
    sortedCards.forEach(card => {
      rankGroups[card.rank] = rankGroups[card.rank] || [];
      rankGroups[card.rank].push(card);
    });
    
    const pairs = Object.values(rankGroups).filter(group => group.length >= 2);
    
    // Check hands in order of rank
    if (sortedCards.length >= 5) {
      // Royal Flush
      const royalFlush = this.checkRoyalFlush(sortedCards);
      if (royalFlush) return royalFlush;
      
      // Straight Flush
      const straightFlush = this.checkStraightFlush(sortedCards);
      if (straightFlush) return straightFlush;
    }
    
    // Four of a Kind
    const fourOfAKind = pairs.find(p => p.length === 4);
    if (fourOfAKind) {
      return { handName: 'Four of a Kind', rank: 7, scoringCards: fourOfAKind };
    }
    
    // Full House
    const threeOfAKind = pairs.find(p => p.length === 3);
    if (threeOfAKind && pairs.length >= 2) {
      return { handName: 'Full House', rank: 6, scoringCards: sortedCards };
    }
    
    if (sortedCards.length >= 5) {
      // Flush
      const flush = this.checkFlush(sortedCards);
      if (flush) return flush;
      
      // Straight
      const straight = this.checkStraight(sortedCards);
      if (straight) return straight;
    }
    
    // Three of a Kind
    if (threeOfAKind) {
      return { handName: 'Three of a Kind', rank: 3, scoringCards: threeOfAKind };
    }
    
    // Two Pair
    if (pairs.length >= 2) {
      const twoPairCards = pairs.slice(0, 2).flat();
      return { handName: 'Two Pair', rank: 2, scoringCards: twoPairCards };
    }
    
    // One Pair
    if (pairs.length === 1) {
      return { handName: 'Pair', rank: 1, scoringCards: pairs[0] };
    }
    
    // High Card
    return { handName: 'High Card', rank: 0, scoringCards: [sortedCards[0]] };
  }

  checkFlush(cards) {
    const suitCounts = {};
    cards.forEach(card => {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });
    
    const flushSuit = Object.keys(suitCounts).find(suit => suitCounts[suit] >= 5);
    if (flushSuit) {
      const flushCards = cards.filter(c => c.suit === flushSuit).slice(0, 5);
      return { handName: 'Flush', rank: 5, scoringCards: flushCards };
    }
    return null;
  }

  checkStraight(cards) {
    const uniqueRanks = [...new Set(cards.map(c => c.rankValue))].sort((a, b) => b - a);
    
    // Check for regular straight
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
        const straightCards = cards.filter(c => 
          c.rankValue >= uniqueRanks[i + 4] && c.rankValue <= uniqueRanks[i]
        ).slice(0, 5);
        return { handName: 'Straight', rank: 4, scoringCards: straightCards };
      }
    }
    
    // Check for A-2-3-4-5 straight (wheel)
    if (uniqueRanks.includes(14) && uniqueRanks.includes(5) && 
        uniqueRanks.includes(4) && uniqueRanks.includes(3) && 
        uniqueRanks.includes(2)) {
      const wheelCards = cards.filter(c => 
        [14, 5, 4, 3, 2].includes(c.rankValue)
      ).slice(0, 5);
      return { handName: 'Straight', rank: 4, scoringCards: wheelCards };
    }
    
    return null;
  }

  checkStraightFlush(cards) {
    const straight = this.checkStraight(cards);
    if (!straight) return null;
    
    const flush = this.checkFlush(straight.scoringCards);
    if (flush) {
      return { handName: 'Straight Flush', rank: 8, scoringCards: flush.scoringCards };
    }
    return null;
  }

  checkRoyalFlush(cards) {
    const straightFlush = this.checkStraightFlush(cards);
    if (!straightFlush) return null;
    
    const hasAce = straightFlush.scoringCards.some(c => c.rank === 'A');
    const hasKing = straightFlush.scoringCards.some(c => c.rank === 'K');
    
    if (hasAce && hasKing) {
      return { handName: 'Royal Flush', rank: 9, scoringCards: straightFlush.scoringCards };
    }
    return null;
  }
}

