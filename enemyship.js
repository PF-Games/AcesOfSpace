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

        if (this.emitParticles && this.juego.particleEmitter) {
      this.frameCounter++;
      if (this.frameCounter >= this.particleEmitRate) {
        this.frameCounter = 0;

        console.log(`${this.debugId || 'Ship'} emitting particle at`, this.posicion);
        console.log(`🔵 ${this.debugId || 'Ship'} emitting particle at (${Math.round(this.posicion.x)}, ${Math.round(this.posicion.y)})`);
        // Emit from behind the ship
        this.juego.particleEmitter.emit(
          this.posicion.x,
          this.posicion.y,
          1,
          this.particleColor
        );
        console.log('   Total particles:', this.juego.particleEmitter.particles.length);

      }
    }
  }


  checkPlayerAttackRange() {
    if (!this.juego.protagonista) return false;
    const filaProtagonista = Math.floor(this.juego.protagonista.posicion.y / this.juego.cellSize);
    const miFila = Math.floor(this.posicion.y / this.juego.cellSize);
    return miFila === filaProtagonista;
  }


  isOutOfBounds() {
    const margen = 200;
    return this.posicion.x < this.juego.gameArea.x - margen ||
      this.posicion.x > this.juego.gameArea.x + this.juego.gameArea.width + margen ||
      this.posicion.y > this.juego.gameArea.y + this.juego.gameArea.height + margen;
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
    const filaProtagonista = Math.floor(this.juego.protagonista.posicion.y / this.juego.cellSize);
    const miFila = Math.floor(this.posicion.y / this.juego.cellSize);

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
    const centroX = this.juego.gameArea.x + this.juego.gameArea.width / 2;
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
      this.posicion.x < this.juego.gameArea.x - margen ||
      this.posicion.x > this.juego.gameArea.x + this.juego.gameArea.width + margen ||
      this.posicion.y > this.juego.gameArea.y + this.juego.gameArea.height + margen;

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

    this.particleColor = 0x333333; // Dark gray
    this.particleEmitRate = 4;
  }
}

class RedShip extends enemyShip {
  constructor(x, y, juego, debugPrefix) {
    super("assets/naves/Klaed Bomber_Idle.png", x, y, juego, "R");
    this.defaultSpeed = 2.5;
    this.velocidadMaxima = 2.5;
    this.playerDamage = 1;
    this.colorType = 'red';
    this.weight = 5; //this will be used to create levels and allocate difficulty

    this.particleColor = 0xFF3333; // Red
    this.particleEmitRate = 3;
  }
}

class ShieldShip extends enemyShip {
  constructor(x, y, juego, debugPrefix) {
    super("assets/naves/Nairan Scout_Idle.png", x, y, juego, "S");
    this.defaultSpeed = 3;
    this.velocidadMaxima = 3;
    this.playerDamage = 1;
    this.escudo = 1;
    this.protectionRange = 150;
    this.weight = 5; //this will be used to create levels and allocate difficulty

    this.particleColor = 0x00FF00; // Green
    this.particleEmitRate = 3;
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
      this.escudo--;
      console.log('Escudo impactado, escudo restante:', this.escudo);
      // Opcional: efecto visual de escudo
    } else {
      this.morir();
    }
  }


  render() {
    super.render();

    if (!this.shieldGraphics) {
      this.shieldGraphics = new PIXI.Graphics();
      this.container.addChild(this.shieldGraphics);
      // Ensure shield renders above the sprite
      this.shieldGraphics.zIndex = 10;
    }

    this.shieldGraphics.clear();

    if (this.escudo > 0) {

      this.shieldGraphics.circle(0, 0, this.radio);
      this.shieldGraphics.stroke({ width: 2, color: 0x0892D0, alpha: 0.8 });
      this.shieldGraphics.fill({ color: 0x0892D0, alpha: 0.2 }); // Optional: semi-transparent fill
      this.shieldGraphics.alpha = 1;
    } else {
      this.shieldGraphics.alpha = 0;
    }
  }
}

class SupportShip extends enemyShip {
  constructor(x, y, juego, debugPrefix) {
    super("assets/naves/Klaed Support_Idle.png", x, y, juego, "H");
    this.defaultSpeed = 0.75;
    this.velocidadMaxima = 0.75;
    this.boostSpeed = 6;
    this.playerDamage = 1;
    this.repairRange = 200;
    this.weight = 5; //this will be used to create levels and allocate difficulty

    this.particleColor = 0xFFFF00; // Yellow
    this.particleEmitRate = 2; // More frequent for faster ship
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
  const ally = this.findClosestDamagedAlly();
  
  if (ally) {
    this.allyToRepair = ally;
    console.log(`${this.debugId} found damaged ally: ${ally.debugId} (escudo: ${ally.escudo})`);
    this.fsm.setState('speedingToRepair');
    return true;
  }
  
  return false;
}

  findClosestDamagedAlly() {
  let closestAlly = null;
  let closestDist = Infinity;
  
  for (let ally of this.juego.ships) {
    if (ally === this || ally.muerto) continue;
    if (!(ally instanceof ShieldShip) || ally.escudo > 0) continue;
    
    // Check if someone is already repairing this ally
    let someoneIsRepairing = false;
    for (let otherShip of this.juego.ships) {
      if (otherShip instanceof SupportShip && 
          otherShip !== this && 
          otherShip.allyToRepair === ally &&
          (otherShip.fsm.currentStateName === 'repairing' || 
           otherShip.fsm.currentStateName === 'speedingToRepair')) {
        someoneIsRepairing = true;
        break;
      }
    }
    
    if (!someoneIsRepairing) {
      const dist = calcularDistancia(this.posicion, ally.posicion);
      if (dist < closestDist && dist < this.repairRange * 3) {
        closestDist = dist;
        closestAlly = ally;
      }
    }
  }
  
  return closestAlly;
}


  // NEW: Check if ready to transition to repairing (called at end of AI turn)
  checkIfReadyToRepair() {
    if (this.fsm.currentStateName !== 'speedingToRepair') return false;
    if (!this.allyToRepair || this.allyToRepair.muerto) return false;
    if (this.allyToRepair.escudo > 0) return false;

    const dist = calcularDistancia(this.posicion, this.allyToRepair.posicion);
    if (dist < this.repairRange) {
      this.fsm.setState('repairing');
      return true;
    }
    return false;
  }
}

