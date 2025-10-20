class typeofship extends Ship {
  tipoNave;
  vida;
  valor; //un valor para poder generar niveles con un valor determinado
  
  
  constructor(texture, x, y, game) {
    super(texture, x, y, game);
 }

/* Este metodo hace que la nave salga de la pantalla cuando ya pasó por debajo. Debe esquivar nuestra nave
y abandonar la pantalla y luego destruir el objeto para que no quede referencia en memoria 
flyAway() {
    this.aceleracion = limitarVector(this.aceleracion, this.aceleracionMaxima);
  }
*/

}



class BlackShip extends Ship{
  constructor(texture, x, y, game) {
    super(texture, x, y, game);
 }
}

class RedShip extends Ship{
  constructor(texture, x, y, game) {
    super(texture, x, y, game);
 }
}

class shieldShip extends Ship{
  constructor(texture, x, y, game) {
    super(texture, x, y, game);
 }
}

class supportShip extends Ship{
  constructor(texture, x, y, game) {
    super(texture, x, y, game);
 }
}



