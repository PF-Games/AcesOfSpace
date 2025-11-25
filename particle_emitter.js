class ParticleEmitter {
  constructor(juego) {
    this.juego = juego;
    this.particles = [];
    this.graphics = new PIXI.Graphics();
    this.graphics.zIndex = 500; // Behind ships
    this.juego.containerPrincipal.addChild(this.graphics);
  }

  emit(x, y, count = 1, color = 0xFFFFFF) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  tick() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].tick();

      if (this.particles[i].isFinished()) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    this.graphics.clear();

    if (this.particles.length > 0) {
      console.log('Rendering', this.particles.length, 'particles');
    }

    for (let particle of this.particles) {
      const size = particle.getSize();
      const alpha = 1;

      console.log('  Particle:', {
      pos: particle.posicion,
      size: size,
      alpha: alpha,
      color: particle.color.toString(16)
    });

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

