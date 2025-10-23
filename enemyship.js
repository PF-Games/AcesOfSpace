class enemyShip extends Ship {
  tipoNave;
  vida;
  //valor; //un valor para poder generar niveles con un valor determinado

  constructor(texturePath, x, y, juego, debugPrefix) {
    super(texturePath, x, y, juego);
    this.debugId = `${debugPrefix}${this.id}`;
    this.playerDamage = 1; // Daño que hace al protagonista
    this.estadoFlyAway = false; // Controla si está escapando
    this.direccionFlyAway = null; // 'izquierda' o 'derecha'
    this.crearSprite();
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
    this.textoDebug.y = -60; // Arriba de la nave
    this.container.addChild(this.textoDebug);
  }

  tick() {
    if (this.muerto) return;

    if (this.estadoFlyAway) {
      this.flyAway();
      this.aplicarFisica();
      this.verificarSiSalioDePantalla();
      return;
    }

    this.checkPlayerAttackRange();

    this.cohesion();
    this.alineacion();
    this.separacion();
    this.perseguir();
    this.aplicarFisica();
    this.verificarSiEstoyMuerto();
    this.calcularAnguloYVelocidadLineal();
  }


  checkPlayerAttackRange() {
  if (!this.juego.protagonista) return;

    const filaProtagonista = Math.floor(this.juego.protagonista.posicion.y / this.juego.tamanoCelda);
    const miFila = Math.floor(this.posicion.y / this.juego.tamanoCelda);

    // Si llegó a la misma fila del protagonista
    if (miFila === filaProtagonista) {
      console.log(`${this.debugId} llegó a la fila del protagonista! Haciendo ${this.danioAlJugador} de daño`);
      
      // Hacer daño al protagonista
      this.juego.protagonista.recibirDanio(this.danioAlJugador);
      
      // Activar flyaway
      this.iniciarFlyAway();
    }
  }

   iniciarFlyAway() {
    this.estadoFlyAway = true;
    
    // Decidir si escapa por izquierda o derecha (hacia el lado más cercano)
    const centroX = this.juego.areaDeJuego.x + this.juego.areaDeJuego.ancho / 2;
    this.direccionFlyAway = this.posicion.x < centroX ? 'izquierda' : 'derecha';
    
    // Aumentar velocidad para el escape
    this.velocidadMaxima = 4;
    
    console.log(`${this.debugId} escapando hacia ${this.direccionFlyAway}`);
  }


  flyAway() {
    // Volar hacia el costado elegido
    const fuerzaLateral = this.direccionFlyAway === 'izquierda' ? -0.3 : 0.3;
    
    this.aceleracion.x += fuerzaLateral;
    this.aceleracion.y += 0.1; // Continuar bajando un poco
  }

  verificarSiSalioDePantalla() {
    const margen = 200;
    const fueraDeLimites = 
      this.posicion.x < this.juego.areaDeJuego.x - margen ||
      this.posicion.x > this.juego.areaDeJuego.x + this.juego.areaDeJuego.ancho + margen ||
      this.posicion.y > this.juego.areaDeJuego.y + this.juego.areaDeJuego.alto + margen;

    if (fueraDeLimites) {
      console.log(`${this.debugId} salió del área, autodestruyéndose`);
      this.morir();
    }
  }
}



class BlackShip extends enemyShip {
  constructor(x, y, juego, debugPrefix) {
    super("assets/naves/Nautolan Ship Fighter_Idle.png", x, y, juego, "B");
    this.velocidadMaxima = 1;
    this.playerDamage = 2;
    this.debugId = `B${this.id}`;
  }
}

class RedShip extends enemyShip {
  constructor(x, y, juego, debugPrefix) {
    super("assets/naves/Klaed Bomber_Idle.png", x, y, juego, "R");
    this.velocidadMaxima = 1.5;
    this.playerDamage = 1;
    this.debugId = `R${this.id}`;
  }
}

class ShieldShip extends enemyShip {
  constructor(x, y, juego, debugPrefix) {
    super("assets/naves/Nairan Scout_Idle.png", x, y, juego, "S");
    this.velocidadMaxima = 1;
    this.playerDamage = 1;
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
  constructor(x, y, juego, debugPrefix) {
    super("assets/naves/Klaed Support_Idle.png", x, y, juego, "H");
    this.velocidadMaxima = 2;
    this.playerDamage = 1;
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


