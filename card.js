const suits = ["♠", "♣", "♥", "♦"]
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K"
]

class Deck {
  constructor(cards = freshDeck()) {
    this.cards = cards
  }

  get numberOfCards() {
    return this.cards.length
  }

  pop() {
    return this.cards.shift()
  }//sirve para manejar stacks, toma la carta de encima de la pila

  push(card) {
    this.cards.push(card)
  }//sirve para manejar stacks, mete la carta debajo de la pila

  shuffle() {
    for (let i = this.numberOfCards - 1; i > 0; i--) {
      const newIndex = Math.floor(Math.random() * (i + 1))
      const oldRank = this.cards[newIndex]
      this.cards[newIndex] = this.cards[i]
      this.cards[i] = oldRank
    }
  }
}

class Card {
  constructor(suit, rank) {
    this.suit = suit
    this.rank = rank
  }

  get color() {
    return this.suit === "♣" || this.suit === "♠" ? "black" : "red"
  }

  getHTML() {
    const cardDiv = document.createElement("div")
    cardDiv.innerText = this.suit
    cardDiv.classList.add("card", this.color)
    cardDiv.dataset.rank = `${this.rank} ${this.suit}`
    return cardDiv
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
   