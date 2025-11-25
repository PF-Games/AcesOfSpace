class Particle {
  constructor(x, y, color = 0xFFFFFF) {
    this.posicion = { x, y };
    this.velocidad = {
      x: (Math.random() - 0.5) * 0.5,
      y: (Math.random() - 0.5) * 0.5
    };
    this.lifetime = 1; // 1 = fully visible, 0 = dead
    this.maxLifetime = 30; // frames
    this.age = 0;
    this.color = color;
    this.initialSize = 3;
  }

  tick() {
    this.posicion.x += this.velocidad.x;
    this.posicion.y += this.velocidad.y;
    this.age++;
    this.lifetime = 1 - (this.age / this.maxLifetime);
  }

  isFinished() {
    return this.age >= this.maxLifetime;
  }

  getSize() {
    return this.initialSize * this.lifetime;
  }

  getAlpha() {
    return this.lifetime * 0.9; // Max 90% opacity
  }
}

