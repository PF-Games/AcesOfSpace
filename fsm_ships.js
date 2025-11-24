class ShipState {
  constructor(owner, fsm) {
    this.owner = owner;
    this.fsm = fsm;
  }

  onEnter(previousState) { }
  onUpdate(frameNumber) { }
  onExit(nextState) { }
}


class PursuingState extends ShipState {
  onEnter() {
    // Set speed based on shield status (for ShieldShip only)
    if (this.owner instanceof ShieldShip && this.owner.escudo === 0) {
      this.owner.velocidadMaxima = 0.5; // Slow down when damaged
    } else {
      this.owner.velocidadMaxima = this.owner.defaultSpeed;
    }
  }

  onUpdate() {
    // Update speed if shield status changed
    if (this.owner instanceof ShieldShip) {
      if (this.owner.escudo === 0) {
        this.owner.velocidadMaxima = 0.5; // Keep slow
      } else {
        this.owner.velocidadMaxima = this.owner.defaultSpeed; // Normal speed
      }
    }
    // Check if reached player attack range
    if (this.owner.checkPlayerAttackRange()) {
      this.fsm.setState('attacking');
      return;
    }

    // Normal movement behaviors
    this.owner.cohesion();
    this.owner.alineacion();
    this.owner.separacion();
    this.owner.perseguir();
  }
}

class AttackingState extends ShipState {
  onEnter() {
    // Deal damage to player
    this.owner.juego.protagonista.recibirDanio(this.owner.playerDamage);
    console.log(`${this.owner.debugId} atacó! Daño: ${this.owner.playerDamage}`);

    // Immediately transition to flying away
    this.fsm.setState('flyingAway');
  }

  onUpdate() {
    // This state transitions immediately, no update needed
  }
}

class FlyingAwayState extends ShipState {
  onEnter() {
    const centroX = this.owner.juego.gameArea.x + this.owner.juego.gameArea.width / 2;
    this.owner.direccionFlyAway = this.owner.posicion.x < centroX ? 'izquierda' : 'derecha';
    this.owner.velocidadMaxima = 4;
  }

  onUpdate() {
    const fuerzaLateral = this.owner.direccionFlyAway === 'izquierda' ? -0.3 : 0.3;
    this.owner.aceleracion.x += fuerzaLateral;
    this.owner.aceleracion.y += 0.1;

    // Check if out of bounds
    if (this.owner.isOutOfBounds()) {
      console.log(`${this.owner.debugId} salió del área`);
      this.owner.morir();
    }
  }
}


class SpeedingToProtectState extends ShipState {
  onUpdate() {
    if (!this.owner.allyToProtect || this.owner.allyToProtect.muerto) {
      this.owner.allyToProtect = null;
      this.fsm.setState('pursuing');
      return;
    }

    const dist = calcularDistancia(this.owner.posicion, this.owner.allyToProtect.posicion);
    if (dist < this.owner.protectionRange) {
      this.fsm.setState('protecting');
    } else {
      this.owner.target = this.owner.allyToProtect;
      this.owner.perseguir();
    }
  }
}

class ProtectingState extends ShipState {
  onUpdate() {
    if (!this.owner.allyToProtect || this.owner.allyToProtect.muerto) {
      this.owner.allyToProtect = null;
      this.fsm.setState('pursuing');
      return;
    }

    // TODO: Stay ahead of a near ally
    this.owner.target = this.owner.allyToProtect;
    this.owner.perseguir();

    // TODO: protecting ship should only be ahead of another ship to protect it since rockets target nearest ships, no method to intercept is required
  }
}

class SpeedingToRepairState extends ShipState {
  onEnter() {
    console.log(`${this.owner.debugId} speeding to repair ${this.owner.allyToRepair.debugId}`);
    console.log(`   ${this.owner.allyToRepair.debugId}.escudo: ${this.owner.allyToRepair.escudo}`);
    this.owner.velocidadMaxima = this.owner.boostSpeed || 6;
  }

  onUpdate() {
    if (!this.owner.allyToRepair || this.owner.allyToRepair.muerto) {
      console.log(`${this.owner.debugId} ally died, returning to pursuing`);
      this.owner.allyToRepair = null;
      this.fsm.setState('pursuing');
      return;
    }

    // Check if shield already repaired
    if (this.owner.allyToRepair.escudo > 0) {
      console.log(`${this.owner.debugId} ally already repaired, returning to pursuing`);
      this.owner.allyToRepair = null;
      this.fsm.setState('pursuing');
      return;
    }

    // Move towards ally
    this.owner.target = this.owner.allyToRepair;
    this.owner.perseguir();

    // Log when close enough (but don't transition yet - wait for endAITurn)
    const dist = calcularDistancia(this.owner.posicion, this.owner.allyToRepair.posicion);
    if (dist < this.owner.repairRange && !this.loggedRange) {
      console.log(`${this.owner.debugId} reached repair range of ${this.owner.allyToRepair.debugId}`);
      this.loggedRange = true;
    }
  }

  onExit() {
    this.owner.velocidadMaxima = this.owner.defaultSpeed;
  }
}

class RepairingState extends ShipState {
  onEnter() {
    console.log(`🔧 ${this.owner.debugId} now repairing ${this.owner.allyToRepair.debugId}`);
    console.log(`   ${this.owner.allyToRepair.debugId}.escudo: ${this.owner.allyToRepair.escudo}`);
  }

  onUpdate() {
    if (!this.owner.allyToRepair || this.owner.allyToRepair.muerto) {
      console.log(`${this.owner.debugId} ally died during repair, returning to pursuing`);
      this.owner.allyToRepair = null;
      this.fsm.setState('pursuing');
      return;
    }

    // Check if already repaired
    if (this.owner.allyToRepair.escudo > 0) {
      console.log(`${this.owner.debugId} repair complete, returning to pursuing`);
      this.owner.allyToRepair = null;
      this.fsm.setState('pursuing');
      return;
    }

    // Check if too far away
    const dist = calcularDistancia(this.owner.posicion, this.owner.allyToRepair.posicion);
    if (dist > this.owner.repairRange * 1.5) {
      console.log(`${this.owner.debugId} lost repair range, returning to speeding`);
      this.fsm.setState('speedingToRepair');
      return;
    }

    // Stay near ally during repair (gentle movement)
    if (dist > this.owner.repairRange * 0.5) {
      const direction = {
        x: this.owner.allyToRepair.posicion.x - this.owner.posicion.x,
        y: this.owner.allyToRepair.posicion.y - this.owner.posicion.y
      };
      const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      if (magnitude > 0) {
        this.owner.aceleracion.x += (direction.x / magnitude) * this.owner.aceleracionMaxima * 15;
        this.owner.aceleracion.y += (direction.y / magnitude) * this.owner.aceleracionMaxima * 15;
      }
    }
  }

  onExit() {
    console.log(`${this.owner.debugId} exiting Repairing state`);
  }
}
