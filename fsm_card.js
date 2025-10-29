class CardState {
  constructor(owner, fsm) {
    this.owner = owner; // The Card instance
    this.fsm = fsm;
  }

  onEnter(previousState) {}
  onUpdate(frameNumber) {}
  onExit(nextState) {}
}

class InDeckState extends CardState {
  onEnter() {
    // Card is in the main deck
  }
}

class InHandState extends CardState {
  onEnter() {
    // Card has been drawn to player's hand
  }
}

class SelectedState extends CardState {
  onEnter() {
    // Card has been selected by player
    console.log(`Card ${this.owner.toString()} selected`);
  }
}

class PlayedState extends CardState {
  onEnter() {
    // Card has been played in a poker hand
    console.log(`Card ${this.owner.toString()} played`);
  }
}

class DiscardedState extends CardState {
  onEnter() {
    // Card is in the discard pile
  }
}

