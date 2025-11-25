class Explosion {
  constructor(x, y, juego) {
    this.posicion = { x, y };
    this.juego = juego;
    this.currentFrame = 0;
    this.totalFrames = 29;
    this.frameRate = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
    this.frameCounter = 0;
    this.finished = false;
    
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.juego.containerPrincipal.addChild(this.container);
    
    this.createSprite();
  }

  async createSprite() {
    // Load first frame
    const texturePath = `assets/explosion/Fire Burst_${this.currentFrame + 1}.png`;
    this.sprite = new PIXI.Sprite(await PIXI.Assets.load(texturePath));
    this.sprite.anchor.set(0.5, 0.5);
    const randomScale = Math.random() * 1.5 + 1.5; // 1.5 to 3.0
    this.sprite.scale.set(randomScale);
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
      const texturePath = `assets/explosion/Fire Burst_${this.currentFrame + 1}.png`;
      try {
        const texture = await PIXI.Assets.load(texturePath);
        this.sprite.texture = texture;
      } catch (error) {
        console.error('Failed to load explosion frame:', texturePath);
        this.destroy();
      }
    }
  }

  render() {
    if (!this.container || this.finished) return;
    // Sync container position (in case needed)
    this.container.x = this.posicion.x;
    this.container.y = this.posicion.y;
    this.container.zIndex = this.posicion.y + 100; // Above ships
  }

  destroy() {
    this.finished = true;
    if (this.sprite) this.sprite.destroy();
    if (this.container) this.container.destroy();
    this.container = null;
    
    // Remove from game's explosion list
    if (this.juego.explosions) {
      this.juego.explosions = this.juego.explosions.filter(e => e !== this);
    }
  }
}
