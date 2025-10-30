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
    this.owner.velocidadMaxima = this.owner.defaultSpeed;
  }

  onUpdate() {
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
  onUpdate() {
    if (!this.owner.allyToRepair || this.owner.allyToRepair.muerto) {
      this.owner.allyToRepair = null;
      this.fsm.setState('pursuing');
      return;
    }

    const dist = calcularDistancia(this.owner.posicion, this.owner.allyToRepair.posicion);
    if (dist < this.owner.repairRange) {
      this.fsm.setState('repairing');
    } else {
      this.owner.target = this.owner.allyToRepair;
      this.owner.perseguir();
    }
  }
}

class RepairingState extends ShipState {
  onEnter() {
    this.repairTimer = 0;
    this.repairDuration = 120; // 2 seconds at 60fps
  }

  onUpdate() {
    if (!this.owner.allyToRepair || this.owner.allyToRepair.muerto) {
      this.owner.allyToRepair = null;
      this.fsm.setState('pursuing');
      return;
    }

    this.repairTimer++;
    if (this.repairTimer >= this.repairDuration) {
      // Repair complete
      if (this.owner.allyToRepair.escudo !== undefined) {
        this.owner.allyToRepair.escudo = 1;
        console.log(`${this.owner.debugId} reparó el escudo de ${this.owner.allyToRepair.debugId}`);
      }
      this.owner.allyToRepair = null;
      this.fsm.setState('pursuing');
    }

    // Stay near ally during repair
    this.owner.target = this.owner.allyToRepair;
    this.owner.perseguir();
  }
}