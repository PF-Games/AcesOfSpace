class Enemigo extends Ship {
  constructor(texturePath, x, y, juego) {
    super(texturePath, x, y, juego);
  //  this.bando = bando || Math.floor(Math.random() * 3) + 2;
    this.crearSprite();
  }

  tick() {
    if (this.muerto) return;
    // this.seguirAlLider();

    this.cohesion();

    this.alineacion();
    this.separacion();

    // this.escapar();
    this.perseguir();

    this.aplicarFisica();

    this.verificarSiEstoyMuerto();

   // this.enemigos = this.protagonista(); //this.buscarPersonasQueNoSonDeMiBando();
   // this.amigos = this.buscarPersonasDeMiBando();
   // this.enemigoMasCerca = this.buscarEnemigoMasCerca();

    // this.pegarSiEstaEnMiRango();

    this.calcularAnguloYVelocidadLineal();
/*
    if (this.enemigoMasCerca) {
      // this.asignarTarget(this.enemigoMasCerca);
    }*/
  }
}
