class ShipDeathAnimation {
  constructor(x, y, rotation, juego, shipType) {
    this.posicion = { x, y };
    this.rotation = rotation; // Ship's rotation when it died
    this.juego = juego;
    this.shipType = shipType; // 'red', 'black', 'shield', 'support'
    this.currentFrame = 0;
    this.totalFrames = 8;
    this.frameRate = 5; // Change frame every 3 game ticks
    this.frameCounter = 0;
    this.finished = false;
    
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.container.rotation = rotation; // Match ship's rotation
    this.juego.containerPrincipal.addChild(this.container);
    
    this.createSprite();
  }

  async createSprite() {
    // Load first frame based on ship type
    const texturePath = `assets/ships/${this.shipType}/destruction/Destruction${this.currentFrame + 1}.png`;
    this.sprite = new PIXI.Sprite(await PIXI.Assets.load(texturePath));
    this.sprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.sprite);
  }

  async tick() {
    if (this.finished) return;

    this.frameCounter++;
    
    if (this.frameCounter >= this.frameRate) {
      this.frameCounter = 0;
      this.currentFrame++;
      
      if (this.currentFrame >= this.totalFrames) {
        this.destroy();
        return;
      }
      
      // Update texture to next frame
      const texturePath = `assets/ships/${this.shipType}/destruction/Destruction${this.currentFrame + 1}.png`;
      try {
        const texture = await PIXI.Assets.load(texturePath);
        this.sprite.texture = texture;
      } catch (error) {
        console.error('Failed to load ship death frame:', texturePath);
        this.destroy();
      }
    }
  }

  render() {
    if (!this.container || this.finished) return;
    // Keep position and rotation synced
    this.container.x = this.posicion.x;
    this.container.y = this.posicion.y;
    this.container.zIndex = this.posicion.y + 50; // Above ships but below explosions
  }

  destroy() {
    this.finished = true;
    if (this.sprite) this.sprite.destroy();
    if (this.container) this.container.destroy();
    this.container = null;
    
    // Remove from game's death animations list
    if (this.juego.shipDeathAnimations) {
      this.juego.shipDeathAnimations = this.juego.shipDeathAnimations.filter(a => a !== this);
    }
  }
}