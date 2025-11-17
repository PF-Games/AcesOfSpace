class Juego {
  teclado = {};
  pixiApp;
  ships = [];
  asteroids = [];
  protagonista;
  width;
  height;
  deck;
  discardPile;
  playerHand;
  cardsHeight = 100;

  constructor() {
    this.updateDimensions();
    this.mapWidth = 1920;
    this.mapHeight = 1080;
    this.mouse = { posicion: { x: 0, y: 0 } };

    this.zoom = 0.9;
    this.minZoom = 0.7;
    this.maxZoom = 2;
    this.zoomStep = 0.1;

    this.initMatterJS();
    this.initPIXI();
    this.setupResizeHandler();
    this.cellSize = 100;
    this.frameCounter = 0;
    this.rockets = [];

    this.initCardSystem();

    this.turnoDeljugador = true;

    this.currentTurn = 'ai';
    this.aiTurnDuration = 180;
    this.aiTurnTimer = 0;
    this.turnsPassed = 0;
  }

  initMatterJS() {
    const Engine = Matter.Engine;
    const Runner = Matter.Runner;

    this.engine = Engine.create();
    this.engine.gravity.y = 0; // Sin gravedad para las cartas

    // Crear runner
    this.matterRunner = Runner.create();
    Runner.run(this.matterRunner, this.engine);
    console.log('✅ Matter.js inicializado');
  }

  async initCardVisuals() {
    console.log('=== INICIALIZANDO VISUALES DE CARTAS ===');

    // Container para las cartas en la mano (con física)
    this.cardsContainer = new PIXI.Container();
    this.cardsContainer.sortableChildren = true;
    this.pixiApp.stage.addChild(this.cardsContainer);

    // Renderer de la mano
    this.handRenderer = new HandRenderer(this);

    // Mazos principales (sin física, solo visuales)
    this.discardRenderer = new DeckRenderer(
      this,
      100,
      this.height - this.cardsHeight,
      "DISCARD"
    );

    this.deckRenderer = new DeckRenderer(
      this,
      this.width - 100,
      this.height - this.cardsHeight,
      "DECK"
    );

    await this.deckRenderer.createVisuals();
    await this.discardRenderer.createVisuals();

    console.log('Creating hand visuals for cards:', this.playerHand.cards);
    this.syncHandVisuals();

    // Debug
    if (this.handRenderer.cardVisuals[0]) {
      console.log('First card visual:', this.handRenderer.cardVisuals[0]);
      await this.handRenderer.cardVisuals[0].debugTextureLoading();
    }

    this.updateDeckCounters();
    console.log('✅ Visuales de cartas listas');
    console.log('Cards container children:', this.cardsContainer.children.length);
    console.log('First card container:', this.handRenderer.cardVisuals[0]?.container);
    console.log('First card position:', {
      x: this.handRenderer.cardVisuals[0]?.container.x,
      y: this.handRenderer.cardVisuals[0]?.container.y
    });
  }

  syncHandVisuals() {
    this.handRenderer.clear();
    this.playerHand.cards.forEach((card, index) => {
      this.handRenderer.createCardVisual(card, index);
    });

    this.handRenderer.updatePositions();
  }

  updateDeckCounters() {
    if (this.deckRenderer) {
      this.deckRenderer.updateCounter(this.deck.numberOfCards);
    }
    if (this.discardRenderer) {
      this.discardRenderer.updateCounter(this.discardPile.numberOfCards);
    }
  }

  initCardSystem() {
    this.deck = new Deck();
    this.deck.shuffle();
    this.discardPile = new DiscardPile();
    this.playerHand = new PlayerHand(this.deck, this.discardPile, {
      maxCards: 12,
      cardsToDraw: 5,
      initialCards: 7
    });

    this.playerHand.drawInitialHand();
    console.log(`Deck inicializado: ${this.deck.numberOfCards} cartas`);
    console.log(`Mano inicial: ${this.playerHand.numberOfCards} cartas`);

    // Hacer accesible desde la consola para debugging
    window.deck = this.deck;
    window.discardPile = this.discardPile;
    window.playerHand = this.playerHand;
    window.juego = this;

    console.log('✅ Sistema de cartas listo');
  }

  async endTurn() {
    console.log('\n=== FIN DE TURNO ===');

    // Jugar cartas seleccionadas
    if (this.playerHand.hasSelectedCards) {
      const cardsToRemove = [...this.playerHand.selectedCards];
      const result = this.playerHand.playSelectedCards();
      console.log(`Jugaste: ${result.handInfo.handName}`);

      // Remover visuales de cartas jugadas
      cardsToRemove.forEach(card => {
        this.handRenderer.removeCardVisual(card);
      });
    }

    // Tomar nuevas cartas
    const previousCount = this.playerHand.numberOfCards;
    this.playerHand.drawCards();
    const newCards = this.playerHand.numberOfCards - previousCount;

    // Crear visuales para nuevas cartas
    for (let i = 0; i < newCards; i++) {
      const cardIndex = previousCount + i;
      const card = this.playerHand.cards[cardIndex];
      this.handRenderer.createCardVisual(card, cardIndex);
    }

    this.handRenderer.updatePositions();
    this.updateDeckCounters();

    console.log(`Cartas en mano: ${this.playerHand.numberOfCards}/${this.playerHand.maxCards}`);
    console.log(`Cartas en deck: ${this.deck.numberOfCards}`);
    console.log(`Cartas descartadas: ${this.discardPile.numberOfCards}`);
  }

  updateHandValueDisplay() {
    if (!this.handValueText) return;

    if (this.playerHand.hasSelectedCards) {
      // Lllama a la función que YA EXISTE en playerHand
      const handInfo = this.playerHand.validateHand(this.playerHand.selectedCards);
      this.handValueText.text = handInfo.handName.toUpperCase();
    } else {
      this.handValueText.text = "";
    }
  }

  // Método helper para seleccionar una carta por índice
  selectCardByIndex(index) {
    if (index < 0 || index >= this.playerHand.cards.length) {
      console.warn(`Índice ${index} fuera de rango`);
      return false;
    }
    const card = this.playerHand.cards[index];
    const success = this.playerHand.selectCard(card);
    if (success) {
      this.handRenderer.selectCard(card);
      this.updateHandValueDisplay();
      this.updatePlayHandButton();
    }
    return success;
  }

  deselectCardByIndex(index) {
    if (index < 0 || index >= this.playerHand.cards.length) {
      console.warn(`Índice ${index} fuera de rango`);
      return false;
    }
    const card = this.playerHand.cards[index];
    const success = this.playerHand.deselectCard(card);
    if (success && this.handRenderer) {
      this.handRenderer.deselectCard(card);
    }
    this.updateHandValueDisplay();
    this.updatePlayHandButton();

    return success;
  }

  deselectAllCards() {
    console.log('\n=== DESELECTING ALL CARDS ===');
    this.playerHand.deselectAll();

    // Update all visuals to show deselected state
    this.handRenderer.cardVisuals.forEach(cardVisual => {
      cardVisual.setSelected(false);
      cardVisual.targetY = this.handRenderer.handY;
    });

    this.updateHandValueDisplay();
    this.updatePlayHandButton();

    console.log('All cards deselected');
  }

  findClosestUntargetedShip() {
    // Find closest untargeted enemy ship
    let closestShip = null;
    let distMenor = Infinity;

    for (let ship of this.ships) {
      if (ship.isTargeted) continue;
      const dist = calcularDistancia(this.protagonista.posicion, ship.posicion);
      if (dist < distMenor) {
        distMenor = dist;
        closestShip = ship;
      }
    }

    // If all ships are targeted, target the Boss/Antagonista
    if (!closestShip && this.antagonista && !this.antagonista.muerto) {
      closestShip = this.antagonista;
    }

    return closestShip;
  }

  // 2. NEW method to fire a single rocket at closest target
  fireRocket() {
    const target = this.findClosestUntargetedShip();

    if (!target) {
      console.log('No targets available');
      return false;
    }

    if (target !== this.antagonista) {
      target.isTargeted = true;
    }

    const rocket = new Rocket(
      "assets/rockets/rocket1.png",
      this.protagonista.posicion.x,
      this.protagonista.posicion.y,
      this,
      target
    );
    rocket.crearSprite();
    this.rockets.push(rocket);

    return true;
  }

  // 3. NEW method to fire multiple rockets based on hand
  fireRocketsForHand(handInfo) {
    const rocketsToFire = this.getRocketsForHand(handInfo);
    console.log(`Firing ${rocketsToFire} rockets for ${handInfo.handName}`);

    for (let i = 0; i < rocketsToFire; i++) {
      setTimeout(() => {
        if (this.protagonista && !this.protagonista.muerto) {
          this.fireRocket();
        }
      }, i * 100); // 100ms delay between rockets
    }
  }

  // 4. NEW method to determine rockets per hand (configurable)
  getRocketsForHand(handInfo) {
    // For now, return 5 for any hand
    // Later you can use handInfo.rank or handInfo.handName
    return 5;

    // FUTURE: Use this mapping
    /*
    const rocketsPerHand = {
      'Royal Flush': 10,
      'Straight Flush': 9,
      'Four of a Kind': 8,
      'Full House': 7,
      'Flush': 6,
      'Straight': 5,
      'Three of a Kind': 4,
      'Two Pair': 3,
      'Pair': 2,
      'High Card': 1
    };
    return rocketsPerHand[handInfo.handName] || 1;
    */
  }

  sortHandByRank() {
    console.log('\n=== SORTING BY RANK ===');

    this.playerHand.deselectAll();
    this.updateHandValueDisplay();
    this.updatePlayHandButton();

    // Sort the cards array by rank value (high to low)
    this.playerHand.cards.sort((a, b) => b.rankValue - a.rankValue);

    // Recreate visuals in new order
    this.syncHandVisuals();

    console.log('Hand sorted by rank');
  }

  sortHandBySuit() {
    console.log('\n=== SORTING BY SUIT ===');

    this.playerHand.deselectAll();
    this.updateHandValueDisplay();
    this.updatePlayHandButton();

    // Define suit order: Spades, Clubs, Diamonds, Hearts
    const suitOrder = { 'S': 0, 'C': 1, 'D': 2, 'H': 3 };

    // Sort by suit first, then by rank within each suit
    this.playerHand.cards.sort((a, b) => {
      const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
      if (suitDiff !== 0) return suitDiff;
      return b.rankValue - a.rankValue; // Within same suit, sort by rank
    });

    // Recreate visuals in new order
    this.syncHandVisuals();

    console.log('Hand sorted by suit');
  }

  updateDimensions() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.width = this.mapWidth || 1920;
    this.height = this.mapHeight || 1080;
  }

  setupResizeHandler() {
    window.addEventListener("resize", () => {
      this.updateDimensions();
      if (this.pixiApp) {
        this.pixiApp.renderer.resize(this.width, this.height);
        this.updateInterface();
      }
    });
  }

  createInterface() {
    this.interface = new PIXI.Container();
    this.interface.name = "INTERFACE";
    this.interface.zIndex = 1000;
    this.pixiApp.stage.addChild(this.interface);

    this.fpsText = new PIXI.Text({
      text: "FPS: 60",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      }
    });

    this.fpsText.x = this.width - 120;
    this.fpsText.y = 20;
    this.interface.addChild(this.fpsText);
    this.turnText = new PIXI.Text({
      text: "PLAYER TURN",
      style: {
        fontFamily: "Arial",
        fontSize: 32,
        fill: "#0d34e0ff",
        stroke: "#000000",
        strokeThickness: 5
      }
    });

    this.turnText.anchor.set(0.5, 0);
    this.turnText.x = this.width / 2;
    this.turnText.y = 20;
    this.interface.addChild(this.turnText);

    // Hand value indicator
    this.handValueText = new PIXI.Text({
      text: "",
      style: {
        fontFamily: "Arial",
        fontSize: 28,
        fill: "#FFD700",
        stroke: "#000000",
        strokeThickness: 4
      }
    });

    this.handValueText.anchor.set(0.5, 0);
    this.handValueText.x = this.width / 2;
    this.handValueText.y = 800
    this.interface.addChild(this.handValueText);
  }

  createEndTurnButton() {
    // Container del botón
    this.endTurnButton = new PIXI.Container();
    this.endTurnButton.x = this.width / 7;
    this.endTurnButton.y = this.height - 70;
    this.endTurnButton.eventMode = 'static';
    this.endTurnButton.cursor = 'pointer';
    this.endTurnButton.zIndex = 2000;

    this.interface.addChild(this.endTurnButton);
    this.endTurnButtonBg = new PIXI.Graphics();
    this.endTurnButtonBg.rect(-100, -25, 200, 50);
    this.endTurnButtonBg.fill(0x00AA00);
    this.endTurnButtonBg.stroke({ width: 3, color: 0xFFFFFF });

    this.endTurnButton.addChild(this.endTurnButtonBg);

    this.endTurnButtonText = new PIXI.Text({
      text: "END TURN",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#ffffff",
        fontWeight: "bold"
      }
    });
    this.endTurnButtonText.anchor.set(0.5);
    this.endTurnButton.addChild(this.endTurnButtonText);

    this.endTurnButton.on('pointerdown', () => {
      if (this.currentTurn === 'player') {
        this.endPlayerTurn();
      }
    });

    // HOVER EFFECT: SCALE + TINT COMBINED
    this.endTurnButton.on('pointerover', () => {
      if (this.currentTurn === 'player') {

        this.endTurnButton.scale.set(1.08);

        this.endTurnButtonBg.clear();
        this.endTurnButtonBg.rect(-100, -25, 200, 50);
        this.endTurnButtonBg.fill(0x00CC00);
        this.endTurnButtonBg.stroke({ width: 3, color: 0xFFFFFF });
      }
    });

    this.endTurnButton.on('pointerout', () => {
      this.endTurnButton.scale.set(1);

      if (this.currentTurn === 'player') {
        this.endTurnButtonBg.clear();
        this.endTurnButtonBg.rect(-100, -25, 200, 50);
        this.endTurnButtonBg.fill(0x00AA00);
        this.endTurnButtonBg.stroke({ width: 3, color: 0xFFFFFF });
      }
    });
    this.updateEndTurnButton();
    console.log("Botón END TURN creado correctamente");
  }

  updateEndTurnButton() {
    if (!this.endTurnButton) return;
    // Deshabilitar durante turno de IA
    if (this.currentTurn === 'ai') {
      this.endTurnButton.eventMode = 'none';
      this.endTurnButton.alpha = 0.5;
      this.endTurnButtonBg.clear();
      this.endTurnButtonBg.rect(-100, -25, 200, 50);
      this.endTurnButtonBg.fill(0x666666);
      this.endTurnButtonBg.stroke({ width: 3, color: 0x999999 });
    } else {
      this.endTurnButton.eventMode = 'static';
      this.endTurnButton.alpha = 1;
      this.endTurnButtonBg.clear();
      this.endTurnButtonBg.rect(-100, -25, 200, 50);
      this.endTurnButtonBg.fill(0x00AA00);
      this.endTurnButtonBg.stroke({ width: 3, color: 0xFFFFFF });
    }
  }

  createPlayButton() {
    // Container del botón
    this.playHandButton = new PIXI.Container();
    this.playHandButton.x = this.width / 7;
    this.playHandButton.y = this.height - 140;
    this.playHandButton.eventMode = 'static';
    this.playHandButton.cursor = 'pointer';
    this.playHandButton.zIndex = 2000;

    this.interface.addChild(this.playHandButton);

    this.playHandButtonBg = new PIXI.Graphics();
    this.playHandButtonBg.rect(-100, -25, 200, 50);
    this.playHandButtonBg.fill(0x00AA00);
    this.playHandButtonBg.stroke({ width: 3, color: 0xFFFFFF });

    this.playHandButton.addChild(this.playHandButtonBg);

    this.playHandButtonText = new PIXI.Text({
      text: "FIRE",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#ffffff",
        fontWeight: "bold"
      }
    });
    this.playHandButtonText.anchor.set(0.5);
    this.playHandButton.addChild(this.playHandButtonText);

    /*
    this.playHandButton.on('pointerdown', () => {
      if (this.currentTurn === 'player') {
        this.playSelectedCards();
      }
    });
    */

    this.playHandButton.on('pointerdown', () => {
      if (this.currentTurn === 'player' && this.playerHand.hasSelectedCards) {
        // Get hand info from PlayerHand
        const handInfo = this.playerHand.validateHand(this.playerHand.selectedCards);

        // Play cards (uses existing PlayerHand method)
        const cardsToRemove = [...this.playerHand.selectedCards];
        const result = this.playerHand.playSelectedCards();

        // Remove card visuals
        cardsToRemove.forEach(card => {
          this.handRenderer.removeCardVisual(card);
        });

        // Fire rockets
        this.fireRocketsForHand(handInfo);

        // Update UI
        this.handRenderer.updatePositions();
        this.updateDeckCounters();
        this.updateHandValueDisplay();
        this.updatePlayHandButton();

        console.log(`Played ${handInfo.handName}, fired rockets`);
      }
    });

    // HOVER EFFECT: SCALE + TINT COMBINED
    this.playHandButton.on('pointerover', () => {
      if (this.currentTurn === 'player') {

        this.playHandButton.scale.set(1.08);

        this.playHandButtonBg.clear();
        this.playHandButtonBg.rect(-100, -25, 200, 50);
        this.playHandButtonBg.fill(0x00CC00);
        this.playHandButtonBg.stroke({ width: 3, color: 0xFFFFFF });
      }
    });

    this.playHandButton.on('pointerout', () => {
      this.playHandButton.scale.set(1);

      if (this.currentTurn === 'player') {
        this.playHandButtonBg.clear();
        this.playHandButtonBg.rect(-100, -25, 200, 50);
        this.playHandButtonBg.fill(0x00AA00);
        this.playHandButtonBg.stroke({ width: 3, color: 0xFFFFFF });
      }
    });

    this.updatePlayHandButton();

    console.log("Botón PLAY HAND creado correctamente");
  }

  updatePlayHandButton() {
    if (!this.playHandButton) return;

    // Deshabilitar durante turno de IA
    if (this.currentTurn === 'ai') {
      this.playHandButton.eventMode = 'none';
      this.playHandButton.alpha = 0.5;
      this.playHandButtonBg.clear();
      this.playHandButtonBg.rect(-100, -25, 200, 50);
      this.playHandButtonBg.fill(0x666666);
      this.playHandButtonBg.stroke({ width: 3, color: 0x999999 });
    } else {
      this.playHandButton.eventMode = 'static';
      this.playHandButton.alpha = 1;
      this.playHandButtonBg.clear();
      this.playHandButtonBg.rect(-100, -25, 200, 50);
      this.playHandButtonBg.fill(0x00AA00);
      this.playHandButtonBg.stroke({ width: 3, color: 0xFFFFFF });
    }
  }

  createSortButtons() {
    // --- DESELECT ALL BUTTON ---
    this.deselectAllButton = new PIXI.Container();
    this.deselectAllButton.x = this.width - 220;
    this.deselectAllButton.y = this.height - 150;
    this.deselectAllButton.eventMode = 'static';
    this.deselectAllButton.cursor = 'pointer';
    this.deselectAllButton.zIndex = 2000;

    this.interface.addChild(this.deselectAllButton);

    this.deselectAllBg = new PIXI.Graphics();
    this.deselectAllBg.rect(-60, -20, 120, 40);
    this.deselectAllBg.fill(0x3498DB);
    this.deselectAllBg.stroke({ width: 2, color: 0xFFFFFF });

    this.deselectAllButton.addChild(this.deselectAllBg);

    this.deselectAllText = new PIXI.Text({
      text: "DESELECT",
      style: {
        fontFamily: "Arial",
        fontSize: 16,
        fill: "#ffffff",
        fontWeight: "bold"
      }
    });
    this.deselectAllText.anchor.set(0.5);
    this.deselectAllButton.addChild(this.deselectAllText);

    this.deselectAllButton.on('pointerdown', () => {
      if (this.currentTurn === 'player') {
        this.deselectAllCards();
      }
    });

    this.deselectAllButton.on('pointerover', () => {
      this.deselectAllButton.scale.set(1.05);
      this.deselectAllBg.clear();
      this.deselectAllBg.rect(-60, -20, 120, 40);
      this.deselectAllBg.fill(0x5DADE2);
      this.deselectAllBg.stroke({ width: 2, color: 0xFFFFFF });
    });

    this.deselectAllButton.on('pointerout', () => {
      this.deselectAllButton.scale.set(1);
      this.deselectAllBg.clear();
      this.deselectAllBg.rect(-60, -20, 120, 40);
      this.deselectAllBg.fill(0x3498DB);
      this.deselectAllBg.stroke({ width: 2, color: 0xFFFFFF });
    });

    // --- SORT BY RANK BUTTON ---
    this.sortByRankButton = new PIXI.Container();
    this.sortByRankButton.x = this.width - 220;
    this.sortByRankButton.y = this.height - 100;
    this.sortByRankButton.eventMode = 'static';
    this.sortByRankButton.cursor = 'pointer';
    this.sortByRankButton.zIndex = 2000;

    this.interface.addChild(this.sortByRankButton);

    this.sortByRankBg = new PIXI.Graphics();
    this.sortByRankBg.rect(-60, -20, 120, 40);
    this.sortByRankBg.fill(0x9B59B6);
    this.sortByRankBg.stroke({ width: 2, color: 0xFFFFFF });

    this.sortByRankButton.addChild(this.sortByRankBg);

    this.sortByRankText = new PIXI.Text({
      text: "BY RANK",
      style: {
        fontFamily: "Arial",
        fontSize: 16,
        fill: "#ffffff",
        fontWeight: "bold"
      }
    });
    this.sortByRankText.anchor.set(0.5);
    this.sortByRankButton.addChild(this.sortByRankText);

    this.sortByRankButton.on('pointerdown', () => {
      if (this.currentTurn === 'player') {
        this.sortHandByRank();
      }
    });

    this.sortByRankButton.on('pointerover', () => {
      this.sortByRankButton.scale.set(1.05);
      this.sortByRankBg.clear();
      this.sortByRankBg.rect(-60, -20, 120, 40);
      this.sortByRankBg.fill(0xAA6FC9);
      this.sortByRankBg.stroke({ width: 2, color: 0xFFFFFF });
    });

    this.sortByRankButton.on('pointerout', () => {
      this.sortByRankButton.scale.set(1);
      this.sortByRankBg.clear();
      this.sortByRankBg.rect(-60, -20, 120, 40);
      this.sortByRankBg.fill(0x9B59B6);
      this.sortByRankBg.stroke({ width: 2, color: 0xFFFFFF });
    });

    // --- SORT BY SUIT BUTTON ---
    this.sortBySuitButton = new PIXI.Container();
    this.sortBySuitButton.x = this.width - 220;
    this.sortBySuitButton.y = this.height - 50;
    this.sortBySuitButton.eventMode = 'static';
    this.sortBySuitButton.cursor = 'pointer';
    this.sortBySuitButton.zIndex = 2000;

    this.interface.addChild(this.sortBySuitButton);

    this.sortBySuitBg = new PIXI.Graphics();
    this.sortBySuitBg.rect(-60, -20, 120, 40);
    this.sortBySuitBg.fill(0xE67E22);
    this.sortBySuitBg.stroke({ width: 2, color: 0xFFFFFF });

    this.sortBySuitButton.addChild(this.sortBySuitBg);

    this.sortBySuitText = new PIXI.Text({
      text: "BY SUIT",
      style: {
        fontFamily: "Arial",
        fontSize: 16,
        fill: "#ffffff",
        fontWeight: "bold"
      }
    });
    this.sortBySuitText.anchor.set(0.5);
    this.sortBySuitButton.addChild(this.sortBySuitText);

    this.sortBySuitButton.on('pointerdown', () => {
      if (this.currentTurn === 'player') {
        this.sortHandBySuit();
      }
    });

    this.sortBySuitButton.on('pointerover', () => {
      this.sortBySuitButton.scale.set(1.05);
      this.sortBySuitBg.clear();
      this.sortBySuitBg.rect(-60, -20, 120, 40);
      this.sortBySuitBg.fill(0xF39C12);
      this.sortBySuitBg.stroke({ width: 2, color: 0xFFFFFF });
    });

    this.sortBySuitButton.on('pointerout', () => {
      this.sortBySuitButton.scale.set(1);
      this.sortBySuitBg.clear();
      this.sortBySuitBg.rect(-60, -20, 120, 40);
      this.sortBySuitBg.fill(0xE67E22);
      this.sortBySuitBg.stroke({ width: 2, color: 0xFFFFFF });
    });

    console.log("Botones de ordenamiento creados");
  }

  async endPlayerTurn() {
    console.log('\n=== FIN DE TURNO DEL JUGADOR ===');

    // Tomar nuevas cartas
    const previousCount = this.playerHand.numberOfCards;
    this.playerHand.drawCards();
    const newCards = this.playerHand.numberOfCards - previousCount;

    // Crear visuales para nuevas cartas
    for (let i = 0; i < newCards; i++) {
      const cardIndex = previousCount + i;
      const card = this.playerHand.cards[cardIndex];
      await this.handRenderer.createCardVisual(card, cardIndex);
    }

    //this.handRenderer.updatePositions();
    this.updateDeckCounters();

    console.log(`Cartas en mano: ${this.playerHand.numberOfCards}/${this.playerHand.maxCards}`);

    // Cambiar a turno de IA
    this.startAITurn();
  }

  startAITurn() {
    console.log('\n=== TURNO DE LA IA ===');
    this.currentTurn = 'ai';
    this.aiTurnTimer = 0;
    this.turnsPassed++;

    // Actualizar UI
    this.updateEndTurnButton();
    if (this.turnText) {
      this.turnText.text = "AI TURN";
      this.turnText.style.fill = "#FF0000";
    }

    // Spawn de naves si corresponde
    if (this.antagonista && this.turnsPassed % this.antagonista.turnosParaSpawn === 0) {
      this.antagonista.spawnearNave();
    }
  }

  updateAITurn() {
    this.aiTurnTimer++;

    // Actualizar progreso en UI (opcional)
    if (this.turnText) {
      const progress = Math.floor((this.aiTurnTimer / this.aiTurnDuration) * 100);
      this.turnText.text = `AI TURN (${progress}%)`;
    }

    // Fin del turno de IA
    if (this.aiTurnTimer >= this.aiTurnDuration) {
      this.endAITurn();
    }
  }

  endAITurn() {
    console.log('\n=== FIN DE TURNO DE LA IA ===');
    this.currentTurn = 'player';
    this.aiTurnTimer = 0;

    // Actualizar UI
    this.updateEndTurnButton();
    if (this.turnText) {
      this.turnText.text = "YOUR TURN";
      this.turnText.style.fill = "#00FF00";
    }
  }

  async initPIXI() {
    //creamos la aplicacion de pixi y la guardamos en la propiedad pixiApp
    this.pixiApp = new PIXI.Application();
    globalThis.__PIXI_APP__ = this.pixiApp;
    const opcionesDePixi = {
      background: "#1099bb",
      width: this.width,
      height: this.height,
      resizeTo: window,
    };


    await this.pixiApp.init(opcionesDePixi);
    document.body.appendChild(this.pixiApp.canvas);
    this.pixiApp.ticker.add(this.gameLoop.bind(this));
    this.agregarInteractividadDelMouse();
    this.pixiApp.stage.sortableChildren = true;
    this.createInterface();
    this.createLevel();
  }

  async createBackground() {
    this.fondo = new PIXI.TilingSprite(await PIXI.Assets.load("assets/bg.jpg"));
    this.fondo.zIndex = -2;
    this.fondo.tileScale.set(0.5);
    this.fondo.width = this.mapWidth;
    this.fondo.height = this.mapHeight;
    this.containerPrincipal.addChild(this.fondo);
  }

  async createLevel() {
    this.containerPrincipal = new PIXI.Container();
    this.containerPrincipal.scale.set(this.zoom);
    this.pixiApp.stage.addChild(this.containerPrincipal);
    await this.loadTextures();
    this.createBackground();

    this.gameArea = {
      x: 200,
      y: 0,
      width: 1500,
      height: 1500
    };

    // Dibujar rectángulo amarillo de debug
    this.rectanguloDebug = new PIXI.Graphics();
    this.rectanguloDebug.rect(
      this.gameArea.x,
      this.gameArea.y,
      this.gameArea.width,
      this.gameArea.height
    );
    this.rectanguloDebug.stroke({ width: 4, color: 0xffff00, alpha: 1 });
    this.containerPrincipal.addChild(this.rectanguloDebug);


    this.addRocketControls();
    this.crearAntagonista();
    await this.crearProtagonista();
    this.crearEnemigos(5, BlackShip);
    this.crearEnemigos(5, RedShip);
    this.crearEnemigos(3, ShieldShip);
    this.crearEnemigos(2, SupportShip);
    this.createAsteroids();
    this.asignarProtagonistaComoTargetATodosLospersonas()
    this.dibujador = new PIXI.Graphics();
    this.containerPrincipal.addChild(this.dibujador);
    this.width = this.mapWidth;
    this.height = this.mapHeight;
    this.grid = new Grid(this, this.cellSize);
    this.iniciarControles();

    this.interfaceContainer = new PIXI.Container();
    this.interfaceContainer.sortableChildren = true;
    this.pixiApp.stage.addChild(this.interfaceContainer);

    // Crear el background una sola vez
    this.interfaceBackground = new PIXI.Graphics();
    this.interfaceBackground.zIndex = -1;
    this.interfaceBackground.beginFill(0x222222);
    this.interfaceBackground.drawRect(
      0,
      this.pixiApp.renderer.height * 0.8,
      this.pixiApp.renderer.width,
      this.pixiApp.renderer.height * 0.2
    );
    this.interfaceBackground.endFill();
    this.interfaceBackground.zIndex = -2;
    this.interfaceContainer.addChild(this.interfaceBackground);

    await this.initCardVisuals();
    this.createEndTurnButton();
    this.createPlayButton();
    this.createSortButtons();
  }

  async loadTextures() {
    try {
      // Cargar el spritesheet
      const spritesheet = await PIXI.Assets.load('assets/cards/cards.json');

      // Guardar en cache para acceso fácil
      PIXI.Assets.cache.set("deckAtlas", spritesheet);

      console.log("✅ Card atlas loaded");
      console.log("Available frames:", Object.keys(spritesheet.textures));

      return true;
    } catch (error) {
      console.error("❌ Error loading textures:", error);
      return false;
    }
  }


  crearEnemigos(cant, ClaseNave) {
    for (let i = 0; i < cant; i++) {
      const x = Math.random() * this.mapWidth;
      const y = this.gameArea.y - 100;
      const ship = new ClaseNave(x, y, this);
      this.ships.push(ship);
    }
  }

  createAsteroids() {
    for (let i = 0; i < 2; i++) {
      const x = Math.random() * this.mapWidth;
      const y = Math.random() * this.mapHeight;
      const asteroid = new Asteroid(x, y, this);
      this.asteroids.push(asteroid);
    }
  }


  addRocketControls() {
    this.pixiApp.canvas.onclick = (event) => {
      const x = event.x - this.containerPrincipal.x;
      const y = event.y - this.containerPrincipal.y;

      // Buscar enemigo más cercano al click
      let closestShip = null;
      let distMenor = Infinity;
      // IMPORTANTE: CREAR UNA FUNCION BUSCAR NAVE MAS CERCANA QUE MANEJE ESTO
      for (let ship of this.ships) {
        if (ship.isTargeted) continue;
        const dist = calcularDistancia({ x, y }, ship.posicion);
        if (dist < distMenor) {
          distMenor = dist;
          closestShip = ship;
        }
      }

      if (this.ships.length === 0 && this.antagonista) {
        closestShip = this.antagonista;
      }

      if (closestShip) {
        closestShip.isTargeted = true
        const rocket = new Rocket(
          "assets/rockets/rocket1.png",
          this.protagonista.posicion.x,
          this.protagonista.posicion.y,
          this,
          closestShip
        );
        rocket.crearSprite();
        //  this.rockets.push(rocket); DISABLED 17/11
      }
    };
  }

  handlePlayHand() {
    if (!this.playerHand.hasSelectedCards) {
      console.warn('No cards selected to play');
      return;
    }

    if (this.currentTurn !== 'player') {
      console.warn('Cannot play cards during AI turn');
      return;
    }

    // Get hand info BEFORE playing cards
    const handInfo = this.playerHand.validateHand(this.playerHand.selectedCards);
    console.log(`Playing hand: ${handInfo.handName}`);

    // Determine number of rockets based on hand rank
    const rocketsToFire = this.getRocketsForHand(handInfo);

    // Play the cards using the EXISTING playerHand method
    const cardsToRemove = [...this.playerHand.selectedCards];
    const result = this.playerHand.playSelectedCards();

    // Remove card visuals
    cardsToRemove.forEach(card => {
      this.handRenderer.removeCardVisual(card);
    });

    this.fireRockets(rocketsToFire);

    // Update UI
    this.handRenderer.updatePositions();
    this.updateDeckCounters();
    this.updateHandValueDisplay();
    this.updatePlayHandButton();

    console.log(`Fired ${rocketsToFire} rockets for ${handInfo.handName}`);
  }





  async crearProtagonista() {
    const x = this.mapWidth / 2
    const y = this.gameArea.y + this.gameArea.height - 100;
    const protagonista = new Protagonista(x, y, this);
    this.protagonista = protagonista;
  };

  crearAntagonista() {
    const x = this.mapWidth / 2
    const y = this.gameArea.y + 50;
    const antagonista = new Antagonista(x, y, this);
    this.antagonista = antagonista;
  };


  agregarInteractividadDelMouse() {
    this.pixiApp.canvas.onmousemove = (event) => {
      this.mouse.posicion = {
        x: event.x - this.containerPrincipal.x,
        y: event.y - this.containerPrincipal.y,
      };
    };

    this.pixiApp.canvas.onmousedown = (event) => {
      this.mouse.down = {
        x: event.x - this.containerPrincipal.x,
        y: event.y - this.containerPrincipal.y,
      };
      this.mouse.apretado = true;
    };
    this.pixiApp.canvas.onmouseup = (event) => {
      this.mouse.up = {
        x: event.x - this.containerPrincipal.x,
        y: event.y - this.containerPrincipal.y,
      };
      this.mouse.apretado = false;
    };


    this.pixiApp.canvas.addEventListener("wheel", (event) => {
      event.preventDefault(); // Prevenir el scroll de la página

      const zoomDelta = event.deltaY > 0 ? -this.zoomStep : this.zoomStep;
      const nuevoZoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.zoom + zoomDelta)
      );

      if (nuevoZoom !== this.zoom) {
        const mouseX = event.x;
        const mouseY = event.y;

        const worldPosX = (mouseX - this.containerPrincipal.x) / this.zoom;
        const worldPosY = (mouseY - this.containerPrincipal.y) / this.zoom;

        this.zoom = nuevoZoom;
        this.containerPrincipal.scale.set(this.zoom);

        this.containerPrincipal.x = mouseX - worldPosX * this.zoom;
        this.containerPrincipal.y = mouseY - worldPosY * this.zoom;
      }
    });

    this.pixiApp.canvas.addEventListener('click', (event) => {
      if (this.currentTurn === 'ai') {
        return; // No permitir clicks en cartas durante turno de IA
      }
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      // Verificar si clickeó una carta
      this.handRenderer.cardVisuals.forEach((cardVisual, index) => {
        const dx = mouseX - cardVisual.body.position.x;
        const dy = mouseY - cardVisual.body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Si está dentro del radio de la carta
        if (dist < cardVisual.width / 2) {
          if (cardVisual.selected) {
            this.deselectCardByIndex(index);
          } else {
            this.selectCardByIndex(index);
          }
        }
      });
    });
  }


  gameLoop(time) {
    if (this.teclado["w"]) {
      this.containerPrincipal.y += 10;
    }
    if (this.teclado["s"]) {
      this.containerPrincipal.y -= 10;
    }
    if (this.teclado["a"]) {
      this.containerPrincipal.x += 10;
    }
    if (this.teclado["d"]) {
      this.containerPrincipal.x -= 10;
    }

    this.frameCounter++;

    if (this.antagonista) {
      // SOLO tick durante turno de IA
      if (this.currentTurn === 'ai') {
        this.antagonista.tick();
      }
      this.antagonista.render();
    }

    // Actualizar turno de IA si corresponde
    if (this.currentTurn === 'ai') {
      this.updateAITurn();

      // Durante turno de IA, las naves se mueven
      for (let aShip of this.ships) {
        aShip.tick();  // Llamar tick() solo en turno IA
        aShip.render();
      }
    } else {
      // Durante turno del jugador, solo renderizar sin mover
      for (let aShip of this.ships) {
        aShip.render(); // Solo render, sin tick()
      }
    }

    // Actualizar renderizador de cartas
    if (this.handRenderer) {
      this.handRenderer.tick();
      this.handRenderer.render();
    }

    this.updateInterface();

    for (let rocket of this.rockets) {
      rocket.tick();
      rocket.render();
    }
  }

  iniciarControles() {
    window.addEventListener("keydown", (event) => {
      this.teclado[event.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (event) => {
      this.teclado[event.key.toLowerCase()] = false;
    });
  }

  updateInterface() {
    if (!this.interfaceContainer) return;

    // Limpiar y redibujar el background existente
    if (this.interfaceBackground) {
      this.interfaceBackground.clear();
      this.interfaceBackground.beginFill(0x222222);
      this.interfaceBackground.drawRect(
        0,
        this.pixiApp.renderer.height * 0.8,
        this.pixiApp.renderer.width,
        this.pixiApp.renderer.height * 0.2
      );
      this.interfaceBackground.endFill();
    }

    // Actualizar posiciones de los mazos según nuevo tamaño de ventana
    if (this.discardRenderer) {
      this.discardRenderer.updatePosition(100, this.height - this.cardsHeight);
    }
    if (this.deckRenderer) {
      this.deckRenderer.updatePosition(
        this.width - 100,
        this.height - this.cardsHeight
      );
    }

    // Actualizar posición Y de la mano
    if (this.handRenderer) {
      this.handRenderer.handY = this.height - this.cardsHeight;
      this.handRenderer.updatePositions();
    }

    if (this.fpsText) {
      this.fpsText.x = this.width - 120;
      this.fpsText.y = 20;
      this.fpsText.text = this.pixiApp.ticker.FPS.toFixed(2);
    }

    if (this.endTurnButton) {
      this.endTurnButton.x = this.width / 7;
      this.endTurnButton.y = this.height - 70;
    }

    if (this.turnText) {
      this.turnText.x = this.width / 2;
    }

    if (this.sortByRankButton) {
      this.sortByRankButton.x = this.width - 220;
      this.sortByRankButton.y = this.height - 100;
    }

    if (this.sortBySuitButton) {
      this.sortBySuitButton.x = this.width - 220;
      this.sortBySuitButton.y = this.height - 50;
    }

    if (this.deselectAllButton) {
      this.deselectAllButton.x = this.width - 220;
      this.deselectAllButton.y = this.height - 150;
    }
  }

  finDelJuego() {
    alert("Te moriste! fin del juego");
  }

  asignarProtagonistaComoTargetATodosLospersonas() {
    for (let ship of this.ships) {
      ship.asignarTarget(this.protagonista);
    }
  }
}
