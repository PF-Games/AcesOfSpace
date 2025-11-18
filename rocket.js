class Rocket extends GameObject {
  constructor(texturePath, x, y, juego, target) {
    super(x, y, juego);

    this.target = target;
    this.velocidadMaxima = 8; 
    this.aceleracionMaxima = 0.25;
    this.factorPerseguir = 1;
    this.radio = 5;
    this.danio = 1;
    this.texturePath = texturePath;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.juego.containerPrincipal.addChild(this.container);
  }

  async crearSprite() {
    this.sprite = new PIXI.Sprite(await PIXI.Assets.load(this.texturePath));
    this.sprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.sprite);
  }

  tick() {
    if (this.destruido) return;
    if (!this.target || this.target.muerto) {
      this.destruir();
      return;
    }

    this.perseguir();
    this.aplicarFisica();

    const dist = calcularDistancia(this.posicion, this.target.posicion);
    if (dist < this.target.radio) {
      this.target.recibirDanio(this.danio);
      this.destruir();
    }
  }

  destruir() {
    this.destruido = true;

    // Limpiar el flag del target para que pueda ser targetado de nuevo
    if (this.target && !this.target.muerto) {
      this.target.isTargeted = false;
    }

    if (this.sprite) this.sprite.destroy();
    if (this.container) this.container.destroy();
    this.container = null; // Importante: setear a null
    this.juego.rockets = this.juego.rockets.filter(c => c !== this);
  }
  
  render() {
    if (!this.container || this.destruido) return; // Agregar verificación de destruido
    super.render();
    if (this.sprite) {
      this.sprite.rotation = Math.atan2(this.velocidad.y, this.velocidad.x) + Math.PI / 2;
    }
    this.container.zIndex = this.posicion.y;
  }
}

