class Spawner {
  constructor(x, y, juego, texturePath) {
    this.posicion = { x, y };
    this.juego = juego;
    this.vida = 100;
    this.muerto = false;
    this.texturePath = texturePath;
    this.radio = 40; //Este radio me sirve para poder calcular la colision de los ataques

    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.juego.containerPrincipal.addChild(this.container);

    this.crearSprite();
  }

  async crearSprite() {
    this.sprite = new PIXI.Sprite(await PIXI.Assets.load(this.texturePath));
    this.sprite.anchor.set(0.5, 1);
    this.container.addChild(this.sprite);
  }

  recibirDanio(danio) {
    this.vida -= danio;
    console.log(`Spawner recibió ${danio} daño. Vida: ${this.vida}`);
    if (this.vida <= 0) this.morir();
  }

  morir() {
    if (this.muerto) return;
    this.muerto = true;
    if (this.sprite) this.sprite.destroy();
    if (this.container) this.container.destroy();
  }

  tick() {
    // Nada, no se mueve
  }

  render() {
    // Solo sincroniza posición si fuera necesario
  }
}

class Protagonista extends Spawner {
  constructor(x, y, juego) {
    super(x, y, juego, "Assets2/Ships/Unity/Cruiser 3.png");
    this.vida = 1000;
    this.rocketCooldown = 0;
  }

  tick() {
    //Spawn logic for rockets
  }

  shootRocket(target) {
    const rocket = new Rocket(this.posicion.x, this.posicion.y, this.juego, target);
    this.juego.rockets.push(rocket);
  }


  recibirDanio(danio) {
    this.vida -= danio;
    console.log(`Protagonista recibió ${danio} daño. Vida restante: ${this.vida}`);
    if (this.vida <= 0) {
      this.morir();
      this.juego.finDelJuego();
    }
  }
}

class Antagonista extends Spawner {
  constructor(x, y, juego) {
    super(x, y, juego, "assets/ships/mothership.png");
    this.vida = 100;
    this.turnos = 0;
    this.turnosParaSpawn = 5;
  }

  tick() {
    this.turnos++;
    if (this.turnos >= this.turnosParaSpawn) {
      //  this.spawnearNave();
      this.turnos = 0;
    }
  }


  recibirDanio(danio) {
    this.vida -= danio;
    console.log(`Mothership recibió ${danio} daño. Vida: ${this.vida}`);
    if (this.vida <= 0) {
      this.morir();
      this.juego.victoria(); // Opcional: método para ganar
    }
  }

  spawnearNave() {
    const ClaseAleatoria = [BlackShip, RedShip, ShieldShip, SupportShip][Math.floor(Math.random() * 4)];
    const nave = new ClaseAleatoria(this.posicion.x, this.posicion.y, this.juego);
    this.juego.ships.push(nave);
    // this.juego.enemigos.push(nave);
    this.target = Protagonista;
  }
}
