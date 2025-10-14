class Cohete extends GameObject {
  constructor(x, y, juego, target) {
    super(x, y, juego);
    
    this.target = target;
    this.velocidadMaxima = 5;
    this.aceleracionMaxima = 0.3;
    this.factorPerseguir = 0.2;
    this.radio = 5;
    this.danio = 0.3;
    
    this.crearSprite();
  }

  async crearSprite() {
    this.sprite = new PIXI.Graphics();
    this.sprite.circle(0, 0, 5);
    this.sprite.fill(0xffff00);
    this.container.addChild(this.sprite);
  }

  tick() {
    if (this.destruido) return; // Agregar esta línea
    if (!this.target || this.target.muerto) {
      this.destruir();
      return;
    }

    this.perseguir();
    this.aplicarFisica();
    
    // Verificar colisión con target
    const dist = calcularDistancia(this.posicion, this.target.posicion);
    if (dist < this.target.radio) {
      this.target.recibirDanio(this.danio);
      this.destruir();
    }
  }

 destruir() {
  this.destruido = true; // Marcar como destruido
  if (this.sprite) this.sprite.destroy();
  if (this.container) this.container.destroy();
  this.container = null; // Importante: setear a null
  this.juego.cohetes = this.juego.cohetes.filter(c => c !== this);
}
  render() {
  if (!this.container || this.destruido) return; // Agregar verificación de destruido
  super.render();
  this.container.zIndex = this.posicion.y;
}
}