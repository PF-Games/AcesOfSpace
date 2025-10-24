class Juego {
  pixiApp;
  ships = [];
  //amigos = [];
  //enemigos = [];
  arboles = [];
  autos = [];
  objetosInanimados = [];
  protagonista;
  width;
  height;




  constructor() {
    this.updateDimensions();
    this.anchoDelMapa = 1920;
    this.altoDelMapa = 1080;
    this.mouse = { posicion: { x: 0, y: 0 } };

    // Variables para el zoom
    this.zoom = 0.9;
    this.minZoom = 0.7;
    this.maxZoom = 2;
    this.zoomStep = 0.1;

    this.initPIXI();
    this.setupResizeHandler();
    this.tamanoCelda = 100; //14-10
    this.contadorDeFrame = 0; //14-10
    this.rockets = [];
  }

  updateDimensions() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.ancho = this.anchoDelMapa || 1920;  // para que Grid funcione 10-4
    this.alto = this.altoDelMapa || 1080;     // para que Grid funcione 10-4
  }


  setupResizeHandler() {
    window.addEventListener("resize", () => {
      this.updateDimensions();
      if (this.pixiApp) {
        this.pixiApp.renderer.resize(this.width, this.height);
      }
    });
  }


  createInterface() {
    this.interface = new PIXI.Container();
    this.interface.name = "INTERFACE";
    this.pixiApp.stage.addChild(this.interface);

    this.fpsText = new PIXI.Text({
      text: "FPS: 60",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      }
    });

    this.fpsText.x = this.width - 120;
    this.fpsText.y = 20;
    this.interface.addChild(this.fpsText);
    // this.fpsText.text = `FPS: ${this.pixiApp.ticker.FPS.toFixed(2)}`;
  }

  //async indica q este metodo es asyncronico, es decir q puede usar "await"
  async initPIXI() {
    //creamos la aplicacion de pixi y la guardamos en la propiedad pixiApp
    this.pixiApp = new PIXI.Application();
    globalThis.__PIXI_APP__ = this.pixiApp;
    const opcionesDePixi = {
      background: "#1099bb",
      width: this.width,
      height: this.height,
      resizeTo: window,
    };

    //inicializamos pixi con las opciones definidas anteriormente
    //await indica q el codigo se frena hasta que el metodo init de la app de pixi haya terminado
    //puede tardar 2ms, 400ms.. no lo sabemos :O
    await this.pixiApp.init(opcionesDePixi);

    // //agregamos el elementos canvas creado por pixi en el documento html
    document.body.appendChild(this.pixiApp.canvas);

    //agregamos el metodo this.gameLoop al ticker.
    //es decir: en cada frame vamos a ejecutar el metodo this.gameLoop
    this.pixiApp.ticker.add(this.gameLoop.bind(this));

    this.agregarInteractividadDelMouse();
    this.pixiApp.stage.sortableChildren = true;
    this.createInterface();
    this.crearNivel();

  }

  async crearFondo() {
    this.fondo = new PIXI.TilingSprite(await PIXI.Assets.load("assets/bg.jpg"));
    this.fondo.zIndex = -1;
    this.fondo.tileScale.set(0.5);
    this.fondo.width = this.anchoDelMapa;
    this.fondo.height = this.altoDelMapa;
    this.containerPrincipal.addChild(this.fondo);
  }

  async crearNivel() {
    this.containerPrincipal = new PIXI.Container();
    this.containerPrincipal.scale.set(this.zoom);
    this.pixiApp.stage.addChild(this.containerPrincipal);
    await this.cargarTexturas();
    this.crearFondo();

    this.areaDeJuego = {
      x: 200,
      y: 0,
      ancho: 1500,
      alto: 1500
    };

    // Dibujar rectángulo amarillo de debug
    this.rectanguloDebug = new PIXI.Graphics();
    this.rectanguloDebug.rect(
      this.areaDeJuego.x,
      this.areaDeJuego.y,
      this.areaDeJuego.ancho,
      this.areaDeJuego.alto
    );
    this.rectanguloDebug.stroke({ width: 4, color: 0xffff00, alpha: 1 });
    this.containerPrincipal.addChild(this.rectanguloDebug);


    this.addRocketControls();
    this.crearAntagonista();
    await this.crearProtagonista();
    this.crearEnemigos(5, BlackShip);
    this.crearEnemigos(5, RedShip);
    this.crearEnemigos(3, ShieldShip);
    this.crearEnemigos(2, SupportShip);
    this.crearArboles();
    this.crearAutos();
    this.asignarProtagonistaComoTargetATodosLospersonas()
    this.dibujador = new PIXI.Graphics();
    this.containerPrincipal.addChild(this.dibujador);
    this.ancho = this.anchoDelMapa;
    this.alto = this.altoDelMapa;
    this.grid = new Grid(this, this.tamanoCelda);
    this.iniciarControles();


    
    this.interfaceContainer = new PIXI.Container();
    this.pixiApp.stage.addChild(this.interfaceContainer);

    
    const interfaceBackground = new PIXI.Graphics();
    interfaceBackground.beginFill(0x222222);
    interfaceBackground.drawRect(
      0,
      this.pixiApp.renderer.height * 0.8,  
      this.pixiApp.renderer.width,
      this.pixiApp.renderer.height * 0.2   
    );
    interfaceBackground.endFill();
    this.interfaceContainer.addChild(interfaceBackground);

  }


  async cargarTexturas() {
    await PIXI.Assets.load(["assets/bg.jpg"]);
  }

  crearEnemigos(cant, ClaseNave) {
    for (let i = 0; i < cant; i++) {
      const x = Math.random() * this.anchoDelMapa;
      const y = this.areaDeJuego.y - 100; 
      const ship = new ClaseNave(x, y, this);
      this.ships.push(ship);
      //this.enemigos.push(ship);
    }
  }
  /*
  for (let i = 0; i < cant; i++) {
    const x = Math.random() * this.anchoDelMapa;
    const y = -100; //Math.random() * this.altoDelMapa + 2500;
    const ship = new Enemigo(x, y, this, bando);
    this.ships.push(ship);
    this.enemigos.push(ship);
    this.target = juego.protagonista; // hice esto pero no funciono
  }
}
*/

  crearAutos() {
    for (let i = 0; i < 2; i++) {
      const x = Math.random() * this.anchoDelMapa;
      const y = Math.random() * this.altoDelMapa;
      const auto = new Auto(x, y, this);
      this.autos.push(auto);
      this.objetosInanimados.push(auto);
    }
  }

  crearArboles() {
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * this.anchoDelMapa;
      const y = Math.random() * this.altoDelMapa;
      const arbol = new Arbol(x, y, this);
      this.arboles.push(arbol);
      this.objetosInanimados.push(arbol);
    }
  }


  //14-10

  addRocketControls() {
    this.pixiApp.canvas.onclick = (event) => {
      const x = event.x - this.containerPrincipal.x;
      const y = event.y - this.containerPrincipal.y;

      // Buscar enemigo más cercano al click
      let closestShip = null;
      let distMenor = Infinity;
      // IMPORTANTE: CREAR UNA FUNCION BUSCAR NAVE MAS CERCANA QUE MANEJE ESTO
      for (let ship of this.ships) {
        if (ship.isTargeted) continue;
        const dist = calcularDistancia({ x, y }, ship.posicion);
        if (dist < distMenor) {
          distMenor = dist;
          closestShip = ship;
        }
      }

      if (this.ships.length === 0 && this.antagonista) {
        closestShip = this.antagonista;
      }

      if (closestShip) {
        closestShip.isTargeted = true
        const rocket = new Rocket(
          "assets/rockets/rocket1.png",
          this.protagonista.posicion.x,
          this.protagonista.posicion.y,
          this,
          closestShip
        );
        rocket.crearSprite();
        this.rockets.push(rocket);
      }
    };
  }



  async crearProtagonista() {
    const x = this.anchoDelMapa / 2
    const y = this.areaDeJuego.y + this.areaDeJuego.alto - 100;
    const protagonista = new Protagonista(x, y, this);
    // this.ships.push(protagonista);
    this.protagonista = protagonista;
  };


  crearAntagonista() {
    const x = this.anchoDelMapa / 2
    const y = this.areaDeJuego.y + 50;
    const antagonista = new Antagonista(x, y, this);
    //this.ships.push(antagonista);
    this.antagonista = antagonista;
  };


  agregarInteractividadDelMouse() {
    // Escuchar el evento mousemove
    this.pixiApp.canvas.onmousemove = (event) => {
      this.mouse.posicion = {
        x: event.x - this.containerPrincipal.x,
        y: event.y - this.containerPrincipal.y,
      };
    };

    this.pixiApp.canvas.onmousedown = (event) => {
      this.mouse.down = {
        x: event.x - this.containerPrincipal.x,
        y: event.y - this.containerPrincipal.y,
      };
      this.mouse.apretado = true;
    };
    this.pixiApp.canvas.onmouseup = (event) => {
      this.mouse.up = {
        x: event.x - this.containerPrincipal.x,
        y: event.y - this.containerPrincipal.y,
      };
      this.mouse.apretado = false;
    };


    // Event listener para la rueda del mouse (zoom)
    this.pixiApp.canvas.addEventListener("wheel", (event) => {
      event.preventDefault(); // Prevenir el scroll de la página

      const zoomDelta = event.deltaY > 0 ? -this.zoomStep : this.zoomStep;
      const nuevoZoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.zoom + zoomDelta)
      );

      if (nuevoZoom !== this.zoom) {
        // Obtener la posición del mouse antes del zoom
        const mouseX = event.x;
        const mouseY = event.y;

        // Calcular el punto en coordenadas del mundo antes del zoom
        const worldPosX = (mouseX - this.containerPrincipal.x) / this.zoom;
        const worldPosY = (mouseY - this.containerPrincipal.y) / this.zoom;

        // Aplicar el nuevo zoom
        this.zoom = nuevoZoom;
        this.containerPrincipal.scale.set(this.zoom);

        // Ajustar la posición del contenedor para mantener el mouse en el mismo punto del mundo
        this.containerPrincipal.x = mouseX - worldPosX * this.zoom;
        this.containerPrincipal.y = mouseY - worldPosY * this.zoom;
      }
    });
  }

  convertirCoordenadaDelMouse(mouseX, mouseY) {
    // Convertir coordenadas del mouse del viewport a coordenadas del mundo
    // teniendo en cuenta la posición y escala del containerPrincipal
    return {
      x: (mouseX - this.containerPrincipal.x) / this.zoom,
      y: (mouseY - this.containerPrincipal.y) / this.zoom,
    };
  }



  gameLoop(time) {
    //iteramos por todos los personas
    //this.dibujador.clear();//14-10
    this.contadorDeFrame++;//14-10

    // Procesar antagonista
    if (this.antagonista) {
      this.antagonista.tick();
      this.antagonista.render();
    }

    // Procesar naves
    for (let aShip of this.ships) {
      //ejecutamos el metodo tick de cada persona
      aShip.tick();
      aShip.render();
    }

    // this.grid.update();
    // this.hacerQLaCamaraSigaAlProtagonista();
    this.updateInterface();

    for (let rocket of this.rockets) {
      rocket.tick();
      rocket.render();
    }
  }


  iniciarControles() {
    window.addEventListener('keyup', (event) => {
      if (event.key === "ArrowDown") this.containerPrincipal.y -= 100;
      if (event.key === "ArrowUp") this.containerPrincipal.y += 100;
      if (event.key === "ArrowLeft") this.containerPrincipal.x += 100;
      if (event.key === "ArrowRight") this.containerPrincipal.x -= 100;
    });
  }

  //hacerQLaCamaraSigaAlProtagonista() {
  /*if (!this.protagonista) return;
  this.containerPrincipal.x = -this.protagonista.posicion.x + this.width / 2;
  this.containerPrincipal.y = -this.protagonista.posicion.y + 1000;
  */

  /*if (this.mouse.apretado){
       this.containerPrincipal.x = this.mouse.posicion.x;
       this.containerPrincipal.y = this.mouse.posicion.y;
       }
       */



  updateInterface() {
    this.fpsText.text = this.pixiApp.ticker.FPS.toFixed(2); //tiempoRestante.toString();
  }




  finDelJuego() {
    alert("Te moriste! fin del juego");
  }

  // asignarTargets() {
  //   for (let cone of this.personas) {
  //     cone.asignarTarget(this.getpersonaRandom());
  //   }
  // }

  asignarProtagonistaComoTargetATodosLospersonas() {
    for (let ship of this.ships) {
      ship.asignarTarget(this.protagonista);
    }
  }

  // asignarPerseguidorRandomATodos() {
  //   for (let cone of this.personas) {
  //     cone.perseguidor = this.getpersonaRandom();
  //   }
  // }
  // asignarElMouseComoPerseguidorATodosLospersonas() {
  //   for (let cone of this.personas) {
  //     cone.perseguidor = this.mouse;
  //   }
  // }
}
