class enemyShip extends Enemigo {
  tipoNave;
  vida;
  //valor; //un valor para poder generar niveles con un valor determinado
  
  
  constructor(texturePath, x, y, juego) {
    super(texturePath, x, y, juego);
    
  }
}



class BlackShip extends enemyShip {
  constructor(x, y, juego) {
    super("assets/naves/Nautolan Ship Fighter_Idle.png", x, y, juego);
    this.velocidadMaxima = 1;
  }
}

class RedShip extends enemyShip {
  constructor(x, y, juego) {
    super("assets/naves/Klaed Bomber_Idle.png", x, y, juego);
    this.velocidadMaxima = 1.5;
  }
}

class ShieldShip extends enemyShip {
  constructor(x, y, juego) {
    super("assets/naves/Nairan Scout_Idle.png", x, y, juego);
    this.velocidadMaxima = 0.8;
    this.vida = 2;
  }
}

class SupportShip extends enemyShip {
  constructor(x, y, juego) {
    super("assets/naves/Klaed Support_Idle.png", x, y, juego);
    this.velocidadMaxima = 2;
    this.vida = 0.5;
  }
}

//flyAway()

