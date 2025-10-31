const suits = ["S", "C", "H", "D"]
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

class Deck {
  constructor(cards = freshDeck()) {
    this.cards = cards
    // Initialize FSM for each card
    this.cards.forEach(card => card.initializeFSM(this));
  }

  get numberOfCards() {
    return this.cards.length
  }

  pop() {
    const card = this.cards.shift();
    if (card && card.fsm) {
      card.fsm.setState('inHand');
    }
    return card;
  }//sirve para manejar stacks, toma la carta de encima de la pila

  push(card) {
    this.cards.push(card);
    if (card.fsm) {
      card.fsm.setState('inDeck');
    }
  }//sirve para manejar stacks, mete la carta debajo de la pila

  shuffle() {
    for (let i = this.numberOfCards - 1; i > 0; i--) {
      const newIndex = Math.floor(Math.random() * (i + 1))
      const oldRank = this.cards[newIndex]
      this.cards[newIndex] = this.cards[i]
      this.cards[i] = oldRank
    }
    console.log('Deck shuffled');
  }

  isEmpty() {
    return this.numberOfCards === 0;
  }
}


class Card {
  constructor(suit, rank) {
    this.suit = suit
    this.rank = rank
    this.fsm = null; // Will be initialized when needed
  }

  get color() {
    return this.suit === "C" || this.suit === "S" ? "black" : "red"
  }

  /*  
    getHTML() {
      const cardDiv = document.createElement("div")
      cardDiv.innerText = this.suit
      cardDiv.classList.add("card", this.color)
      cardDiv.dataset.rank = `${this.rank} ${this.suit}`
      return cardDiv
    }
  */



  get rankValue() {
    const rankValues = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11,
      '10': 10, '9': 9, '8': 8, '7': 7,
      '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    return rankValues[this.rank];
  }

  initializeFSM(owner) {
    this.fsm = new FSM(this, {
      initialState: 'inDeck',
      states: {
        inDeck: InDeckState,
        inHand: InHandState,
        selected: SelectedState,
        played: PlayedState,
        discarded: DiscardedState
      }
    });
    this.owner = owner; // Reference to CardsHeld or game manager
  }

  select() {
    if (this.fsm && this.fsm.currentStateName === 'inHand') {
      this.fsm.setState('selected');
    }
  }

  deselect() {
    if (this.fsm && this.fsm.currentStateName === 'selected') {
      this.fsm.setState('inHand');
    }
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }
}

function freshDeck() {
  return suits.flatMap(suit => {
    return ranks.map(rank => {
      return new Card(suit, rank)
    })
  })
}

/*
 
async createAnimatedSpritesheet(card) {
  this.sprite = (
    await AnimatedCard.CreateCardFromMegaSpritesheet(
      `/assets/pixelart/cards/${card}.png`,
      64,
      64
    )
  ).card;

  */


class DiscardPile {
  constructor() {
    this.cards = []; // Exposed for queries
  }

  get numberOfCards() {
    return this.cards.length;
  }

  // Stack interface
  push(card) {
    this.cards.push(card);
    if (card.fsm) {
      card.fsm.setState('discarded');
    }
  }

  pop() {
    return this.cards.pop();
  }

  // Query methods
  contains(card) {
    return this.cards.some(c => c.suit === card.suit && c.rank === card.rank);
  }

  getPlayedCards() {
    return [...this.cards]; // Return copy
  }

  hasPlayedRank(rank) {
    return this.cards.some(c => c.rank === rank);
  }

  hasPlayedSuit(suit) {
    return this.cards.some(c => c.suit === suit);
  }

  clear() {
    const allCards = [...this.cards];
    this.cards = [];
    return allCards;
  }

  isEmpty() {
    return this.numberOfCards === 0;
  }
}


