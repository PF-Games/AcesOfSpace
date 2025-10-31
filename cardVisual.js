class CardVisual {
  constructor(card, x, y, juego, texturePath = "assets/cards/backd.png") {
    this.card = card;
    this.juego = juego;
    this.texturePath = texturePath;

    this.width = 80;
    this.height = 120;

    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    this.juego.cardsContainer.addChild(this.container);

    this.border = new PIXI.Graphics();
    this.container.addChild(this.border);

    this.body = Matter.Bodies.rectangle(x, y, this.width, this.height, {
      friction: 0.3,
      restitution: 0.2,
      density: 0.001
    });

    this.body.cardVisual = this;
    Matter.Composite.add(this.juego.engine.world, this.body);

    this.crearSprite();

    this.targetX = x;
    this.targetY = y;
    this.selected = false;
  }

  async crearSprite() {
    console.log('Creating sprite for:', this.card.toString());

    const texture = this.getCardTexture(this.card.rank, this.card.suit);
    // Fallback si no se encuentra
    const finalTexture = texture || await PIXI.Assets.load(this.texturePath);

    const sprite = new PIXI.Sprite(finalTexture);
    sprite.anchor.set(0.5);
    sprite.width = this.width;
    sprite.height = this.height;

    this.sprite = sprite;
    this.container.addChild(sprite);

    console.log(`✅ Sprite created for ${this.card.toString()}`);
    return sprite;
  }


updateBorder() {
    if (!this.border) return; // Safety check
    
    this.border.clear();
    if (this.selected) {
      this.border.rect(-this.width/2, -this.height/2, this.width, this.height);
      this.border.stroke({ width: 3, color: 0xFFFF00 });
    }
}

setSelected(selected) {
    this.selected = selected;
    console.log(`Card ${this.card.toString()} selected: ${selected}`); // ← Debug
    this.updateBorder();
}

  // Aplicar fuerza magnética hacia posición objetivo
  applySpringForce() {
    const dx = this.targetX - this.body.position.x;
    const dy = this.targetY - this.body.position.y;

    const forceMagnitude = 0.0005;
    Matter.Body.applyForce(this.body, this.body.position, {
      x: dx * forceMagnitude,
      y: dy * forceMagnitude
    });
  }

  getCardTexture(rank, suit) {
    const atlas = PIXI.Assets.cache.get("deckAtlas");
    if (!atlas) {
      console.error("Card atlas not loaded!");
      return null;
    }

    const frameKey = `${rank}${suit}`;
    const texture = atlas.textures[frameKey];

    if (!texture) {
      console.warn(`Texture not found: ${frameKey}`);
      console.log("Available:", Object.keys(atlas.textures).slice(0, 5));
      return null;
    }

    return texture;
  }
  async debugTextureLoading() {
    console.log('=== CARD TEXTURE DEBUG ===');
    console.log('Atlas loaded:', PIXI.Assets.get("deckAtlas"));
    console.log('Card:', this.card);
    console.log('Texture path:', this.texturePath);
    const sprite = this.container.children[0];
    console.log('Sprite:', sprite);
    console.log('Sprite texture:', sprite?.texture);
  }


  tick() {
    // Aplicar fuerzas de resorte hacia posición objetivo
    this.applySpringForce();

    // Limitar velocidad
    const maxSpeed = 10;
    const speed = Math.sqrt(
      this.body.velocity.x ** 2 + this.body.velocity.y ** 2
    );
    if (speed > maxSpeed) {
      Matter.Body.setVelocity(this.body, {
        x: (this.body.velocity.x / speed) * maxSpeed,
        y: (this.body.velocity.y / speed) * maxSpeed
      });
    }
  }

  render() {
    if (!this.container || !this.sprite) return;

    // Sincronizar PIXI con Matter.js
    this.container.x = this.body.position.x;
    this.container.y = this.body.position.y;
    this.container.rotation = this.body.angle;

    // Z-index para que cartas seleccionadas aparezcan encima
    this.container.zIndex = this.selected ? 1000 : this.body.position.y;
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.container) this.container.destroy();
    if (this.body) {
      Matter.Composite.remove(this.juego.engine.world, this.body);
    }
  }
}

class HandRenderer {
  constructor(juego) {
    this.juego = juego;
    this.cardVisuals = []; // Array de CardVisual
    this.handY = juego.height - 150; // Posición Y de la mano
    this.spacing = 100; // Espaciado entre cartas cuando hay pocas
    this.minSpacing = 40; // Espaciado mínimo cuando hay muchas
  }

  async createCardVisual(card, index) {
    const x = this.calculateCardX(index);
    const cardVisual = new CardVisual(card, x, this.handY, this.juego);
    await cardVisual.crearSprite();
    this.cardVisuals.push(cardVisual);
    return cardVisual;
  }

  calculateCardX(index) {
    const totalCards = this.juego.playerHand.numberOfCards;
    const availableWidth = this.juego.width - 200; // Margen de 100px a cada lado

    // Calcular espaciado dinámico
    const idealSpacing = Math.min(
      this.spacing,
      Math.max(this.minSpacing, availableWidth / totalCards)
    );

    // Centrar las cartas
    const totalWidth = (totalCards - 1) * idealSpacing;
    const startX = (this.juego.width - totalWidth) / 2;

    return startX + (index * idealSpacing);
  }

  updatePositions() {
    // Actualizar posiciones objetivo de todas las cartas
    this.cardVisuals.forEach((cardVisual, index) => {
      cardVisual.targetX = this.calculateCardX(index);
      cardVisual.targetY = this.handY;
    });
  }

  removeCardVisual(card) {
    const index = this.cardVisuals.findIndex(cv => cv.card === card);
    if (index !== -1) {
      this.cardVisuals[index].destroy();
      this.cardVisuals.splice(index, 1);
      this.updatePositions();
    }
  }

  selectCard(card) {
    const cardVisual = this.cardVisuals.find(cv => cv.card === card);
    if (cardVisual) {
      cardVisual.setSelected(true);
      // Elevar carta seleccionada
      cardVisual.targetY = this.handY - 30;
    }
  }

  deselectCard(card) {
    const cardVisual = this.cardVisuals.find(cv => cv.card === card);
    if (cardVisual) {
      cardVisual.setSelected(false);
      // Bajar carta
      cardVisual.targetY = this.handY;
    }
  }

  tick() {
    this.cardVisuals.forEach(cv => cv.tick());
  }

  render() {
    this.cardVisuals.forEach(cv => cv.render());
  }

  clear() {
    this.cardVisuals.forEach(cv => cv.destroy());
    this.cardVisuals = [];
  }
}


class DeckRenderer {
  constructor(juego, x, y, label) {
    this.juego = juego;
    this.x = x;
    this.y = y;
    this.label = label;

    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.container.zIndex = 1000;
    this.juego.interfaceContainer.addChild(this.container);

    this.createVisuals();
  }

  async createVisuals() {
    this.base = new PIXI.Graphics();
    this.base.rect(-40, -60, 80, 120);
    this.base.fill(0x333333);
    this.base.stroke({ width: 2, color: 0xFFFFFF });
    this.container.addChild(this.base);

    this.cardSprite = new PIXI.Sprite(
      await PIXI.Assets.load("assets/cards/backd.png")
    );
    this.cardSprite.anchor.set(0.5, 0.5);
    this.cardSprite.width = 80;
    this.cardSprite.height = 120;
    this.container.addChild(this.cardSprite);

    this.counterText = new PIXI.Text({
      text: "0",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      }
    });
    this.counterText.anchor.set(0.5, 0.5);
    this.counterText.y = 80;
    this.container.addChild(this.counterText);

    this.labelText = new PIXI.Text({
      text: this.label,
      style: {
        fontFamily: "Arial",
        fontSize: 16,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3
      }
    });
    this.labelText.anchor.set(0.5, 0.5);
    this.labelText.y = -80;
    this.container.addChild(this.labelText);
  }

  updateCounter(count) {
    if (this.counterText) {
      this.counterText.text = count.toString();
    }
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    if (this.container) {
      this.container.x = x;
      this.container.y = y;
    }
  }
}


