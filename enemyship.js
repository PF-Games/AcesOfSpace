class enemyShip extends Ship {
  tipoNave;
  vida;
  //valor; //un valor para poder generar niveles con un valor determinado

  constructor(texturePath, x, y, juego, debugPrefix) {
    super(texturePath, x, y, juego);
    this.debugId = `${debugPrefix}${this.id}`;
    this.playerDamage = 1; 
    //this.estadoFlyAway = false; COMMENTED ON 24/10
    this.defaultSpeed = 1;
    this.allyToProtect = null;
    this.allyToRepair = null;
    this.direccionFlyAway = null; // 'izquierda' o 'derecha'
    
    
    this.crearSprite();
    this.crearTextoDebug();
    this.initFSM();
  }

  initFSM() {
    this.fsm = new FSM(this, {
      initialState: 'pursuing',
      states: {
        pursuing: PursuingState,
        attacking: AttackingState,
        flyingAway: FlyingAwayState
      }
    });
  }

  crearTextoDebug() {
    this.textoDebug = new PIXI.Text(this.debugId, {
      fontSize: 16,
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.textoDebug.anchor.set(0.5, 0.5);
    this.textoDebug.y = -60; 
    this.container.addChild(this.textoDebug);
  }

  tick() {
    if (this.muerto) return;

     this.fsm.update(this.juego.contadorDeFrame);

   // if (this.estadoFlyAway) {
   //   this.flyAway(); COMMENTED ON 24/10
      this.aplicarFisica();
   //   this.verificarSiSalioDePantalla();
   //   return; COMMENTED ON 24/10
      this.calcularAnguloYVelocidadLineal();
      this.verificarSiEstoyMuerto();
  }

  
  checkPlayerAttackRange() {
    if (!this.juego.protagonista) return false;
    const filaProtagonista = Math.floor(this.juego.protagonista.posicion.y / this.juego.tamanoCelda);
    const miFila = Math.floor(this.posicion.y / this.juego.tamanoCelda);
    return miFila === filaProtagonista;
  }
  

  isOutOfBounds() {
    const margen = 200;
    return this.posicion.x < this.juego.areaDeJuego.x - margen ||
           this.posicion.x > this.juego.areaDeJuego.x + this.juego.areaDeJuego.ancho + margen ||
           this.posicion.y > this.juego.areaDeJuego.y + this.juego.areaDeJuego.alto + margen;
  }
  
  morir() {
    if (this.fsm) this.fsm.destroy();
    super.morir();
  }
}


  //  this.checkPlayerAttackRange(); ALL COMMENTED ON 24/10

  //  this.cohesion();
  //  this.alineacion();
  //  this.separacion();
  //  this.perseguir();
  //  this.aplicarFisica();
 
  //  this.calcularAnguloYVelocidadLineal();
  //}


/* COMENTADA PORQUE ARRIBA SE IMPLEMENTA SIN EL FLYAWAY LA GUARDO DE REFERENCIA POR AHORA
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

*/


/* TODO ESTO COMENTADO EL 24/10
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

*/


class BlackShip extends enemyShip {
  constructor(x, y, juego, debugPrefix) {
    super("assets/naves/Nautolan Ship Fighter_Idle.png", x, y, juego, "B");
    this.defaultSpeed = 1;
    this.velocidadMaxima = 1;
    this.playerDamage = 2;
    this.colorType = 'black';
    this.weight = 5; //this will be used to create levels and allocate difficulty
   // this.debugId = `B${this.id}`; COMENTADA 24/10
  }
}

class RedShip extends enemyShip {
  constructor(x, y, juego, debugPrefix) {
    super("assets/naves/Klaed Bomber_Idle.png", x, y, juego, "R");
    this.defaultSpeed = 1.5;
    this.velocidadMaxima = 1.5;
    this.playerDamage = 1;
    this.colorType = 'red';
    this.weight = 5; //this will be used to create levels and allocate difficulty
  //  this.debugId = `R${this.id}`; // this.debugId = `B${this.id}`; COMENTADA 24/10
  }
}

class ShieldShip extends enemyShip {
  constructor(x, y, juego, debugPrefix) {
    super("assets/naves/Nairan Scout_Idle.png", x, y, juego, "S");
    this.defaultSpeed = 1.5;
    this.velocidadMaxima = 1;
    this.playerDamage = 1;
    this.escudo = 1;
    this.protectionRange = 150;
    this.weight = 5; //this will be used to create levels and allocate difficulty
  //  this.debugId = `S${this.id}`; // this.debugId = `B${this.id}`; COMENTADA 24/10
  }


   initFSM() {
    this.fsm = new FSM(this, {
      initialState: 'pursuing',
      states: {
        pursuing: PursuingState,
        attacking: AttackingState,
        flyingAway: FlyingAwayState,
        speedingToProtect: SpeedingToProtectState,
        protecting: ProtectingState
      }
    });
  }

  // Override pursuing to check for allies needing protection
  checkForAlliesNeedingProtection() {
    for (let ally of this.juego.ships) {
      if (ally === this || ally.muerto) continue;
      if (ally.isTargeted) {
        const dist = calcularDistancia(this.posicion, ally.posicion);
        if (dist < this.protectionRange * 3) {
          this.allyToProtect = ally;
          this.fsm.setState('speedingToProtect');
          return true;
        }
      }
    }
    return false;
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
    this.defaultSpeed = 2;
    this.velocidadMaxima = 2;
    this.playerDamage = 1;
    this.repairRange = 200;
    this.weight = 5; //this will be used to create levels and allocate difficulty
  }

  initFSM() {
    this.fsm = new FSM(this, {
      initialState: 'pursuing',
      states: {
        pursuing: PursuingState,
        attacking: AttackingState,
        flyingAway: FlyingAwayState,
        speedingToRepair: SpeedingToRepairState,
        repairing: RepairingState
      }
    });
  }

  checkForAlliesNeedingRepair() {
    for (let ally of this.juego.ships) {
      if (ally === this || ally.muerto) continue;
      if (ally instanceof ShieldShip && ally.escudo === 0) {
        const dist = calcularDistancia(this.posicion, ally.posicion);
        if (dist < this.repairRange * 3) {
          this.allyToRepair = ally;
          this.fsm.setState('speedingToRepair');
          return true;
        }
      }
    }
    return false;
  }
}

