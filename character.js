class Character extends Entity {
    sprite;
    id;
    x = 0;
    y = 0;
    health;

  constructor(texture, x, y, game) {
    super(texture, x, y, game);
 }
}



class Enemy extends Character{
  constructor(texture, x, y, game) {
    super(texture, x, y, game);
 }

/* 
 spawnShips() {
    this.velocidad.x *= 0.95;
    this.velocidad.y *= 0.95;
  }
*/


 
}


class MainChar extends Character{
  constructor(texture, x, y, game) {
    super(texture, x, y, game);
 }
}
