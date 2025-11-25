class ParticleEmitter {
  constructor(juego) {
    this.juego = juego;
    this.particles = [];
    this.graphics = new PIXI.Graphics();
    this.graphics.zIndex = -1; // Behind ships
    this.juego.containerPrincipal.addChild(this.graphics);
  }

  emit(x, y, count = 1, color = 0xFFFFFF) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  tick() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].tick();

      if (this.particles[i].isFinished()) {
        this.particles.splice(i, 1); //As used in coding train tutorials
      }
    }
  }

  render() {
    this.graphics.clear();

    for (let particle of this.particles) {
      const size = particle.getSize();
      const alpha = particle.getAlpha()
      this.graphics.circle(
        particle.posicion.x,
        particle.posicion.y,
        size
      );
      this.graphics.fill({ color: particle.color, alpha: alpha });
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}

