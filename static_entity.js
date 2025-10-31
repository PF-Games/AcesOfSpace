class staticEntity extends GameObject {
  constructor(x, y, juego) {
    super(x, y, juego);
    this.vida = 1;
    this.radio = 20;
    this.sprite = null;

    this.render();
  }

  tick() { }

  render() {
    if (!this.container)
      return console.warn("staticEntity no tiene container");

    this.container.x = this.posicion.x;
    this.container.y = this.posicion.y;
    this.container.zIndex = this.posicion.y;
  }
}

class Asteroid extends staticEntity {
  constructor(x, y, juego) {
    super(x, y, juego);
    this.vida = 1;
    this.radio = 10;
    this.tipo = Math.floor(Math.random() * 4) + 1;
    this.container.label = "asteroid" + this.id;
    this.crearSprite();
  }

  async crearSprite() {
    const texture = await PIXI.Assets.load(
      "/assets/pixelart/auto" + this.tipo + ".png"
    );
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.72);

    this.container.addChild(this.sprite);
    this.sprite.scale.x = Math.random() > 0.5 ? 1 : -1;
    this.render();
  }

  tick() { }
}
