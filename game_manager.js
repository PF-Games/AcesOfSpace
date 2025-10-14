//NO ESTA CARGADO EN HTML


class Game {
  pixiApp;
  ships = [];
  width;
  height;


  constructor() {
    this.width = 1920;
    this.height = 1080;
    this.mouse = { posicion: { x: 0, y: 0 } };
    this.initPIXI();
  }

  //async indica q este metodo es asyncronico, es decir q puede usar "await"
  async initPIXI() {
    //creamos la aplicacion de pixi y la guardamos en la propiedad pixiApp
    this.pixiApp = new PIXI.Application();

    const pixiOptions = {
      background: "#1099bb",
      width: this.width,
      height: this.height,
    };

    //inicializamos pixi con las opciones definidas anteriormente
    //await indica q el codigo se frena hasta que el metodo init de la app de pixi haya terminado
    //puede tardar 2ms, 400ms.. no lo sabemos :O
    await this.pixiApp.init(pixiOptions);

    // //agregamos el elementos canvas creado por pixi en el documento html
    document.body.appendChild(this.pixiApp.canvas);

    //cargamos la imagen bunny.png y la guardamos en la variable texture
    const texture = await PIXI.Assets.load("Assets/Ships/Unity/Alien1.png");

    //creamos 10 instancias de la clase ship
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * 3 //spawninicial;
      //crea una instancia de clase Conejito, el constructor de dicha clase toma como parametros la textura
      // q queremos usar,X,Y y una referencia a la instancia del juego (this)
      const ship = new BlackShip(texture, x, y, this);
      this.ships.push(ship);
    }

    //agregamos el metodo this.gameLoop al ticker.
    //es decir: en cada frame vamos a ejecutar el metodo this.gameLoop
    this.pixiApp.ticker.add(this.gameLoop.bind(this));

    this.addMouseInteraction();
  }

  addMouseInteraction() {
    // Escuchar el evento mousemove
    this.pixiApp.canvas.onmousemove = (event) => {
      this.mouse.posicion = { x: event.x, y: event.y };
    };
  }

  gameLoop(time) {
    //iteramos por todos los ships
    for (let aShip of this.ships) {
      //ejecutamos el metodo tick de cada ship
      aShip.tick();
      aShip.render();
    }
  }

  getRandomShip() {
    return this.ships[Math.floor(this.ships.length * Math.random())];
  }

  asignarTargets() {
    for (let ship of this.ships) {
      ship.asignarTarget(this.getRandomShip());
    }
  }

  asignarElMouseComoTargetATodosLosConejitos() {
    for (let ship of this.ships) {
      ship.asignarTarget(this.mouse);
    }
  }

  asignarPerseguidorRandomATodos() {
    for (let ship of this.ships) {
      ship.perseguidor = this.getRandomShip();
    }
  }
  asignarElMouseComoPerseguidorATodosLosConejitos() {
    for (let ship of this.ships) {
      ship.perseguidor = this.mouse;
    }
  }
}