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

    // Variables para el zoom
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

    this.currentTurn = 'player';
    this.aiTurnDuration = 180;
    this.aiTurnTimer = 0;
    this.turnsPassed = 0;
  }

  initMatterJS() {
    const Engine = Matter.Engine;
    const Runner = Matter.Runner;

    // Crear motor de física
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

    // Esperar a que se creen los visuales
    await this.deckRenderer.createVisuals();
    await this.discardRenderer.createVisuals();

    // Crear visuales para cartas iniciales
    console.log('Creating hand visuals for cards:', this.playerHand.cards);
    this.syncHandVisuals();

    // Debug first card
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
    // Limpiar visuales existentes
    this.handRenderer.clear();

    // Crear visual para cada carta en la mano
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
    console.log('=== INICIALIZANDO SISTEMA DE CARTAS ===');

    // Crear y barajar el mazo
    this.deck = new Deck();
    this.deck.shuffle();

    // Crear pila de descarte
    this.discardPile = new DiscardPile();

    // Crear mano del jugador con configuración personalizable
    this.playerHand = new playerHand(this.deck, this.discardPile, {
      maxCards: 12,        // Máximo de cartas acumulables
      cardsToDraw: 5,      // Cartas a reponer por turno
      initialCards: 7      // Cartas iniciales
    });

    // Robar mano inicial
    this.playerHand.drawInitialHand();

    console.log(`Deck inicializado: ${this.deck.numberOfCards} cartas`);
    console.log(`Mano inicial: ${this.playerHand.numberOfCards} cartas`);

    // Hacer accesible desde la consola para debugging
    window.deck = this.deck;
    window.discardPile = this.discardPile;
    window.playerHand = this.playerHand;
    window.juego = this;

    console.log('✅ Sistema de cartas listo');
    console.log('💡 Usa la consola para probar: playerHand, deck, discardPile');
  }

  // Método para terminar turno y tomar cartas
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
    // Aquí llama a la función que YA EXISTE en playerHand
    const handInfo = this.playerHand.validateHand(this.playerHand.selectedCards);
    this.handValueText.text = handInfo.handName.toUpperCase();
  } else {
    this.handValueText.text = "";
  }
}

  // Método helper para ver las cartas en la mano
  showHand() {
    console.log('\n=== CARTAS EN LA MANO ===');
    this.playerHand.cards.forEach((card, index) => {
      const estado = card.fsm ? card.fsm.currentStateName : 'sin FSM';
      console.log(`${index}: ${card.toString()} [${estado}]`);
    });
    console.log(`Total: ${this.playerHand.numberOfCards} cartas`);
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
      this.updateHandValueDisplay(); // ← AGREGADO
      this.updatePlayHandButton();   // ← AGREGADO
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
    return success;
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
    // Turn indicator
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
    this.handValueText.y = 70;
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

    // --- Background del botón ---
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

    // --- CLICK EVENT ---
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
      // Reset scale
      this.endTurnButton.scale.set(1);

      if (this.currentTurn === 'player') {
        // Reset tint
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

  async endPlayerTurn() {
    console.log('\n=== FIN DE TURNO DEL JUGADOR ===');

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
      await this.handRenderer.createCardVisual(card, cardIndex);
    }

    this.handRenderer.updatePositions();
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

  //async indica q este metodo es asyncronico, es decir q puede usar "await"
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
        this.rockets.push(rocket);
      }
    };
  }



  async crearProtagonista() {
    const x = this.mapWidth / 2
    const y = this.gameArea.y + this.gameArea.height - 100;
    const protagonista = new Protagonista(x, y, this);
    // this.ships.push(protagonista);
    this.protagonista = protagonista;
  };

  crearAntagonista() {
    const x = this.mapWidth / 2
    const y = this.gameArea.y + 50;
    const antagonista = new Antagonista(x, y, this);
    //this.ships.push(antagonista);
    this.antagonista = antagonista;
  };


  agregarInteractividadDelMouse() {
    // Escuchar el evento mousemove
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


    // Event listener para la rueda del mouse (zoom)
    this.pixiApp.canvas.addEventListener("wheel", (event) => {
      event.preventDefault(); // Prevenir el scroll de la página

      const zoomDelta = event.deltaY > 0 ? -this.zoomStep : this.zoomStep;
      const nuevoZoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.zoom + zoomDelta)
      );

      if (nuevoZoom !== this.zoom) {
        // Obtener la posición del mouse antes del zoom
        const mouseX = event.x;
        const mouseY = event.y;

        // Calcular el punto en coordenadas del mundo antes del zoom
        const worldPosX = (mouseX - this.containerPrincipal.x) / this.zoom;
        const worldPosY = (mouseY - this.containerPrincipal.y) / this.zoom;

        // Aplicar el nuevo zoom
        this.zoom = nuevoZoom;
        this.containerPrincipal.scale.set(this.zoom);

        // Ajustar la posición del contenedor para mantener el mouse en el mismo punto del mundo
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

  convertirCoordenadaDelMouse(mouseX, mouseY) {
    // Convertir coordenadas del mouse del viewport a coordenadas del mundo
    // teniendo en cuenta la posición y escala del containerPrincipal
    return {
      x: (mouseX - this.containerPrincipal.x) / this.zoom,
      y: (mouseY - this.containerPrincipal.y) / this.zoom,
    };
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

  // Procesar antagonista
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

