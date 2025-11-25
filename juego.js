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
    this.playerHand.cards.sort((a, b) => b.rankValue - a.rankValue);

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
      this.uiManager.updateHandValueDisplay();
      this.uiManager.updatePlayHandButton();
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
    this.uiManager.updateHandValueDisplay();
    this.uiManager.updatePlayHandButton();

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

    this.uiManager.updateHandValueDisplay();
    this.uiManager.updatePlayHandButton();

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

  fireRocketsForHand(handInfo) {
    const rocketsToFire = this.getRocketsForHand(handInfo);
    console.log(`Firing ${rocketsToFire} rockets for ${handInfo.handName}`);

    for (let i = 0; i < rocketsToFire; i++) {
      setTimeout(() => {
        if (this.protagonista && !this.protagonista.muerto) {
          // Find target NOW (not before)
          const target = this.findClosestUntargetedShip();

          if (!target) {
            console.log('No targets available');
            return;
          }

          // Mark as targeted NOW
          if (target !== this.antagonista) {
            target.isTargeted = true;
          }

          // Create rocket
          const rocket = new Rocket(
            "assets/rockets/rocket1.png",
            this.protagonista.posicion.x,
            this.protagonista.posicion.y,
            this,
            target
          );
          rocket.crearSprite();
          this.rockets.push(rocket);
        }
      }, i * 100);
    }
  }

  getRocketsForHand(handInfo) {
    const rocketsPerHand = {
      'Royal Flush': 100,
      'Straight Flush': 60,
      'Four of a Kind': 30,
      'Full House': 25,
      'Flush': 20,
      'Straight': 16,
      'Three of a Kind': 12,
      'Two Pair': 8,
      'Pair': 3,
      'High Card': 1
    };
    return rocketsPerHand[handInfo.handName] || 1;
  }

  sortHandByRank() {
    console.log('\n=== SORTING BY RANK ===');

    this.playerHand.deselectAll();
    this.uiManager.updateHandValueDisplay();
    this.uiManager.updatePlayHandButton();

    // Sort the cards array by rank value (high to low)
    this.playerHand.cards.sort((a, b) => b.rankValue - a.rankValue);

    // Recreate visuals in new order
    this.syncHandVisuals();

    console.log('Hand sorted by rank');
  }

  sortHandBySuit() {
    console.log('\n=== SORTING BY SUIT ===');

    this.playerHand.deselectAll();
    this.uiManager.updateHandValueDisplay();
    this.uiManager.updatePlayHandButton();

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
    this.uiManager = new UIManager(this);
    this.uiManager.createAllUI();
  }

  sortHandByRank() {
    console.log('\n=== SORTING BY RANK ===');
    this.playerHand.deselectAll();
    this.uiManager.updateHandValueDisplay();
    this.uiManager.updatePlayHandButton();

    this.playerHand.cards.sort((a, b) => b.rankValue - a.rankValue);
    this.syncHandVisuals();
    console.log('Hand sorted by rank');
  }

  sortHandBySuit() {
    console.log('\n=== SORTING BY SUIT ===');
    this.playerHand.deselectAll();
    this.uiManager.updateHandValueDisplay();
    this.uiManager.updatePlayHandButton();

    const suitOrder = { 'S': 0, 'H': 1, 'D': 2, 'C': 3 };
    this.playerHand.cards.sort((a, b) => {
      const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
      if (suitDiff !== 0) return suitDiff;
      return b.rankValue - a.rankValue;
    });

    this.syncHandVisuals();
    console.log('Hand sorted by suit');
  }

  deselectAllCards() {
    console.log('\n=== DESELECTING ALL CARDS ===');
    this.playerHand.deselectAll();

    this.handRenderer.cardVisuals.forEach(cardVisual => {
      cardVisual.setSelected(false);
      cardVisual.targetY = this.handRenderer.handY;
    });

    this.uiManager.updateHandValueDisplay();
    this.uiManager.updatePlayHandButton();
    console.log('All cards deselected');
  }

  async playSelectedCards() {
    if (!this.playerHand.hasSelectedCards) return;

    console.log('\n=== PLAYING SELECTED CARDS ===');

    const handInfo = this.playerHand.validateHand(this.playerHand.selectedCards);
    console.log(`Played: ${handInfo.handName}`);


    const rocketsToFire = this.getRocketsForHand(handInfo);

    const cardsToRemove = [...this.playerHand.selectedCards];
    const result = this.playerHand.playSelectedCards();

    cardsToRemove.forEach(card => {
      this.handRenderer.removeCardVisual(card);
    });

    // Fire the rockets
    this.fireRocketsForHand(handInfo);

    this.handRenderer.updatePositions();
    this.updateDeckCounters();
    this.uiManager.updateHandValueDisplay();
    this.uiManager.updatePlayHandButton();

    console.log(`Fired ${rocketsToFire} rockets for ${handInfo.handName}`);
  }

  async endPlayerTurn() {
    console.log('\n=== FIN DE TURNO DEL JUGADOR ===');

    // Complete repairs for support ships in repairing state
    for (let ship of this.ships) {
      if (ship instanceof SupportShip &&
        ship.fsm.currentStateName === 'repairing' &&
        ship.allyToRepair && !ship.allyToRepair.muerto) {

        console.log(`✅ ${ship.debugId} completed repair of ${ship.allyToRepair.debugId}`);
        console.log(`   ${ship.allyToRepair.debugId}.escudo before: ${ship.allyToRepair.escudo}`);
        ship.allyToRepair.escudo = 1;
        console.log(`   ${ship.allyToRepair.debugId}.escudo after: ${ship.allyToRepair.escudo}`);

        ship.allyToRepair = null;
        ship.fsm.setState('pursuing');
      }
    }

    // Draw new cards
    const previousCount = this.playerHand.numberOfCards;
    this.playerHand.drawCards();
    const newCards = this.playerHand.numberOfCards - previousCount;

    // Crear visuales para nuevas cartas
    for (let i = 0; i < newCards; i++) {
      const cardIndex = previousCount + i;
      const card = this.playerHand.cards[cardIndex];
      await this.handRenderer.createCardVisual(card, cardIndex);
    }
    //Clear ALL targeting flags at turn end (safety net)
    for (let aShip of this.ships) {
      aShip.isTargeted = false;
    }

    this.sortHandByRank();
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

    // Check for support ships to respond to damaged shields
    for (let ship of this.ships) {
      if (ship instanceof SupportShip && ship.fsm.currentStateName === 'pursuing') {
        ship.checkForAlliesNeedingRepair();
      }
    }

    // Actualizar UI
    this.uiManager.updateEndTurnButton();
    this.uiManager.updateTurnIndicator('ai');
    // Spawn de naves si corresponde
    if (this.antagonista && this.turnsPassed % this.antagonista.turnosParaSpawn === 0) {
      this.antagonista.spawnearNave();
    }
  }

  updateAITurn() {
    this.aiTurnTimer++;
    this.uiManager.updateTurnIndicator('ai-progress');
    // Fin del turno de IA
    if (this.aiTurnTimer >= this.aiTurnDuration) {
      this.endAITurn();
    }
  }

  endAITurn() {
    console.log('\n=== FIN DE TURNO DE LA IA ===');

    // Check if support ships can transition to repairing
    for (let ship of this.ships) {
      if (ship instanceof SupportShip) {
        ship.checkIfReadyToRepair();
      }
    }

    this.currentTurn = 'player';
    this.aiTurnTimer = 0;

    // Actualizar UI
    this.uiManager.updateEndTurnButton();
    this.uiManager.updateTurnIndicator('player');
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

    this.particleEmitter = new ParticleEmitter(this);
    
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


    this.crearAntagonista();
    await this.crearProtagonista();
    this.crearEnemigos(5, BlackShip);
    this.crearEnemigos(2, RedShip);
    this.crearEnemigos(3, ShieldShip);
    this.crearEnemigos(8, SupportShip);
    this.createAsteroids();
    this.makePlayerAsGlobalTarget();
    this.dibujador = new PIXI.Graphics();
    this.containerPrincipal.addChild(this.dibujador);
    this.width = this.mapWidth;
    this.height = this.mapHeight;
    //this.grid = new Grid(this, this.cellSize);
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

    this.fireRocketsForHand(handInfo);

    // Update UI
    this.handRenderer.updatePositions();
    this.updateDeckCounters();
    this.uiManager.updateHandValueDisplay();
    this.uiManager.updatePlayHandButton();

    console.log(`Fired ${rocketsToFire} rockets for ${handInfo.handName}`);
    /* Trying to reset the targeted state here or in EndTurn. Not working so far.
         for (let aShip of this.ships) {
            aShip.isTargeted = false;
          }*/
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

    if (this.particleEmitter) {
      this.particleEmitter.tick();
      this.particleEmitter.render();
    }

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

    if (this.uiManager) {
      this.uiManager.updateFPS(this.pixiApp.ticker.FPS);
      this.uiManager.updatePositions();
    }

    if (this.uiManager) {
      this.uiManager.updatePositions();
    }
  }

  finDelJuego() {
    alert("Te moriste! fin del juego");
  }

  makePlayerAsGlobalTarget() {
    for (let ship of this.ships) {
      ship.asignarTarget(this.protagonista);
    }
  }
}
