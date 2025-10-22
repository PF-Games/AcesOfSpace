class enemyShip extends Ship {
  tipoNave;
  vida;
  //valor; //un valor para poder generar niveles con un valor determinado

  constructor(texturePath, x, y, juego) {
    super(texturePath, x, y, juego);
    this.crearSprite()
    this.crearTextoDebug(); // ← Agregar
  }

  crearTextoDebug() {
    this.textoDebug = new PIXI.Text(this.debugId, {
      fontSize: 16,
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.textoDebug.anchor.set(0.5, 0.5);
    this.textoDebug.y = -40; // Arriba de la nave
    this.container.addChild(this.textoDebug);
  }

  tick() {
    if (this.muerto) return;

    this.cohesion();
    this.alineacion();
    this.separacion();
    this.perseguir();
    this.aplicarFisica();
    this.verificarSiEstoyMuerto();
    this.calcularAnguloYVelocidadLineal();
  }
}



class BlackShip extends enemyShip {
  constructor(x, y, juego) {
    super("assets/naves/Nautolan Ship Fighter_Idle.png", x, y, juego);
    this.velocidadMaxima = 1;
    this.debugId = `B${this.id}`;
  }
}

class RedShip extends enemyShip {
  constructor(x, y, juego) {
    super("assets/naves/Klaed Bomber_Idle.png", x, y, juego);
    this.velocidadMaxima = 1.5;
    this.debugId = `R${this.id}`;
  }
}

class ShieldShip extends enemyShip {
  constructor(x, y, juego) {
    super("assets/naves/Nairan Scout_Idle.png", x, y, juego);
    this.velocidadMaxima = 1;
    this.escudo = 1;
    this.debugId = `S${this.id}`;
  }

  recibirDanio(danio) {
    if (this.escudo > 0) {
      this.escudo --;
      console.log('Escudo impactado, escudo restante:', this.escudo);
      // Opcional: efecto visual de escudo
    } else {
      this.morir();
    }
  }
}

class SupportShip extends enemyShip {
  constructor(x, y, juego) {
    super("assets/naves/Klaed Support_Idle.png", x, y, juego);
    this.velocidadMaxima = 2;
    this.cooldownRegeneracion = 0;
    this.tiempoEntreRegeneraciones = 180; // 3 segundos a 60fps
    this.debugId = `S${this.id}`;
  }

  /*

  tick() {
    super.tick();
    
    // Regenerar escudos cercanos
    this.cooldownRegeneracion++;
    if (this.cooldownRegeneracion >= this.tiempoEntreRegeneraciones) {
      this.regenerarEscudosCercanos();
      this.cooldownRegeneracion = 0;
    }
  }

  regenerarEscudosCercanos() {
    for (let nave of this.juego.ships) {
      if (nave instanceof ShieldShip && nave !== this) {
        const dist = calcularDistancia(this.posicion, nave.posicion);
        if (dist < 200) { // Rango de regeneración
          nave.regenerarEscudo();
        }
      }
    }
  }*/
}


//flyAway()

