class Juego {
  pixiApp;
  personas = [];
  amigos = [];
  enemigos = [];
  arboles = [];
  autos = [];
  objetosInanimados = [];
  protagonista;
  width;
  height;




  constructor() {
    this.updateDimensions();
    this.anchoDelMapa = 1000;
    this.altoDelMapa = 3000;
    this.mouse = { posicion: { x: 0, y: 0 } };
    this.initPIXI();
    this.setupResizeHandler();
    this.tamanoCelda = 100; //14-10
    this.contadorDeFrame = 0; //14-10
    this.cohetes = [];
  }

  updateDimensions() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.ancho = this.anchoDelMapa || 1000;  // para que Grid funcione 10-4
    this.alto = this.altoDelMapa || 3000;     // para que Grid funcione 10-4
  }


  setupResizeHandler() {
    window.addEventListener("resize", () => {
      this.updateDimensions();
      if (this.pixiApp) {
        this.pixiApp.renderer.resize(this.width, this.height);
      }
    });
  }


  crearUI() {
    this.ui = new PIXI.Container();
    this.ui.name = "UI";
    this.pixiApp.stage.addChild(this.ui);

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
    this.ui.addChild(this.fpsText);
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
    this.crearUI();
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
    this.pixiApp.stage.addChild(this.containerPrincipal);
    await this.cargarTexturas();
    this.crearFondo();
    this.agregarControlDeCohetes();
    this.crearProtagonista();
    this.crearEnemigos(5, 2);
    this.crearEnemigos(5, 3);
    this.crearEnemigos(5, 4);
    this.crearEnemigos(5, 5);
    this.crearEnemigos(5, 6);
    //this.crearAmigos(); ESTO NO LO USO PERO LO NECESITO PARA LOS COHETES
    this.crearArboles();
    this.crearAutos();
    //estas 5 14-10
    this.asignarProtagonistaComoTargetATodosLospersonas()
    this.dibujador = new PIXI.Graphics();
    this.containerPrincipal.addChild(this.dibujador);
    this.ancho = this.anchoDelMapa;
    this.alto = this.altoDelMapa;
    this.grid = new Grid(this, this.tamanoCelda);
    this.iniciarControles();


        // --- Contenedor de la UI ---
    this.uiContainer = new PIXI.Container();
    this.pixiApp.stage.addChild(this.uiContainer);

    // Dibujamos un fondo para la UI (solo para visualizar)
    const uiFondo = new PIXI.Graphics();
    uiFondo.beginFill(0x222222);
    uiFondo.drawRect(
      0,
      this.pixiApp.renderer.height * 0.8,  // empieza al 80% de la pantalla
      this.pixiApp.renderer.width,
      this.pixiApp.renderer.height * 0.2   // ocupa el 20% inferior
    );
    uiFondo.endFill();
    this.uiContainer.addChild(uiFondo);

  }

  
  async cargarTexturas() {
    await PIXI.Assets.load(["assets/bg.jpg"]);
  }
  crearEnemigos(cant, bando) {
    for (let i = 0; i < cant; i++) {
      const x = Math.random() * this.anchoDelMapa;
      const y = 2050; //Math.random() * this.altoDelMapa + 2500;
      const persona = new Enemigo(x, y, this, bando);
      this.personas.push(persona);
      this.enemigos.push(persona);
      this.target = juego.protagonista; // hice esto pero no funciono
    }
  }

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

  agregarControlDeCohetes() {
    this.pixiApp.canvas.onclick = (event) => {
      const x = event.x - this.containerPrincipal.x;
      const y = event.y - this.containerPrincipal.y;

      // Buscar enemigo más cercano al click
      let enemigoMasCercano = null;
      let distMenor = Infinity;
      // IMPORTANTE: CREAR UNA FUNCION BUSCAR NAVE MAS CERCANA QUE MANEJE ESTO
      for (let enemigo of this.enemigos) {
        if (enemigo.isTargeted) continue;
        const dist = calcularDistancia({ x, y }, enemigo.posicion);
        if (dist < distMenor) {
          distMenor = dist;
          enemigoMasCercano = enemigo;
        }
      }

      if (enemigoMasCercano) {
        enemigoMasCercano.isTargeted = true
        const cohete = new Cohete(
          this.protagonista.posicion.x,
          this.protagonista.posicion.y,
          this,
          enemigoMasCercano
        );
        this.cohetes.push(cohete);
      }
    };
  }

  /* ESTO POR AHORA NO LO USO PERO ME VA A VENIR BIEN PARA CREAR LOS COHETES
  crearAmigos() {
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * this.anchoDelMapa;
      const y = Math.random() * this.altoDelMapa;
      const persona = new Amigo(x, y, this);
      this.personas.push(persona);
      this.amigos.push(persona);
    }
  }

  */


  crearProtagonista() {
    const x = 479;
    const y = 3000;
    const protagonista = new Protagonista(x, y, this);
    this.personas.push(protagonista);
    this.protagonista = protagonista;
  }

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
  }



  gameLoop(time) {
    //iteramos por todos los personas
    //this.dibujador.clear();//14-10
    this.contadorDeFrame++;//14-10

    for (let unpersona of this.personas) {
      //ejecutamos el metodo tick de cada persona
      unpersona.tick();
      unpersona.render();
    }
    // this.grid.update();
   // this.hacerQLaCamaraSigaAlProtagonista();
    this.actualizarUI();

    for (let cohete of this.cohetes) {
      cohete.tick();
      cohete.render();
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
 


  actualizarUI() {
    this.fpsText.text = this.pixiApp.ticker.FPS.toFixed(2); //tiempoRestante.toString();
  }




  finDelJuego() {
    alert("Te moriste! fin del juego");
  }

  /*
    shootProjectile(ship, target){
      const projectile = new PIXI.Graphics();
      projectile.beginFill(0xffff00);
      projectile.drawCircle(0, 0, 5);
      projectile.endFill()
  
      projectile.x = this.protagonista.x;
      projectile.y = this.protagonista.y;
  
      projectile.target = 
    }
  
    */

  /*
  getPersonaRandom() {
    return this.personas[Math.floor(this.personas.length * Math.random())];
  }
*/

  // asignarTargets() {
  //   for (let cone of this.personas) {
  //     cone.asignarTarget(this.getpersonaRandom());
  //   }
  // }

  asignarProtagonistaComoTargetATodosLospersonas() {
    for (let cone of this.enemigos) {
      cone.asignarTarget(this.protagonista);
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
