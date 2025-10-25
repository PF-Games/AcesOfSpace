  const pairs = given.array(playedCards)
    .groupBy('name')
    .values()
    .filter(pair => pair.length > 1)
    .valueOf()

     for (const handRanking of Object.keys(handRankingOptions)) {
    const option = handRankingOptions[handRanking]
    if (playingCardsSorted.length < round.handRankings[handRanking].minCards) continue
    // if hand ranking matches, return the scoring cards and hand ranking
    const result = option.matches.call(handRankingOptions, playedCardsSorted, pairs)
    if (result) {
      // skip if not enough cards -> prevents flush with less than 5 cards
      if (result.scoringCards.length < round.handRankings[handRanking].minCards) continue
      return { scoringCards: result.scoringCards, handRanking }
    }
  }



const handRankingOptions = {
  'straightFlush': {
    // ...
    matches(playedCards, pairs) {
      const straightResult = this.straight.matches.call(this, playedCards)
      if (!straightResult) return
      return this.flush.matches.call(this, given.array(straightResult.scoringCards))
    }
  },
  'fourOfAKind': {
    // ...
    matches(playedCards, pairs) {
      const fourOfAKind = pairs.find(pair => pair.length === 4)
      if (fourOfAKind) {
        return { scoringCards: fourOfAKind }
      }
    }
  },
  'fullHouse': {
    // ...
    matches(playedCards, pairs) {
      const threeOfAKind = pairs.find(pair => pair.length === 3)
      if (threeOfAKind && pairs.length === 2) {
        return { scoringCards: playedCards }
      }
    }
  },
  'flush': {
    // ...
    matches(playedCards) {
      if (given.array(playedCards).unique('suit').length === 1) {
        return { scoringCards: playedCards }
      }
    }
  },
  'straight': {
    // ...
    matches(playedCards) {
      if (given.array(playedCards).map((c, idx) => c.getRank() - idx).unique().length === 1) {
        return { scoringCards: playedCards }
      }
    }
  },
  'threeOfAKind': {
    // ...
    matches(playedCards, pairs) {
      const threeOfAKind = pairs.find(pair => pair.length === 3)
      if (threeOfAKind) {
        return { scoringCards: threeOfAKind }
      }
    }
  },
  'twoPair': {
    // ...
    matches(playedCards, pairs) {
      if (pairs.length === 2) {
        return { scoringCards: pairs.flat() }
      }
    }
  },
  

}



class Round {
  handRankingOptions = deepcopy(handRankingOptions) // copy to allow mutations by jokers
  handRanking = ''
  scoringCards = []

  determineHandRanking() {
    const { scoringCards, handRanking } = determineHandRanking(this) // "determineHandRanking" was changed to take an instance of Round as its argument
    this.handRanking = handRanking
    this.scoringCards = scoringCards
  }
}


//test 

it('hand', () => {
 
const cardsPlayed = [
    new PlayCard('7', 'spade'),
    new PlayCard('9', 'spade'),
    new PlayCard('9', 'club'),
    new PlayCard('9', 'heart'),
  ]
  const {round} = calculateScore(cardsPlayed)
  expect(round.handRanking).toBe('threeOfAKind')
})