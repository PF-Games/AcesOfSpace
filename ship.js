class Ship extends GameObject {
  constructor(texturePath, x, y, juego) {
    super(x, y, juego);
    this.texturePath = texturePath;
    // this.vida = 1;
    this.vision = 8000
    this.radio = 24
    this.rangoDeAtaque = this.radio * 3;
    this.factorPerseguir = 0.15;
    this.factorSeparacion = 20;
    this.factorCohesion = 0.3;
    this.factorAlineacion = 0.4;
    this.aceleracionMaxima = 5;
    this.velocidadMaxima = 5;
    this.amigos = [];

    this.emitParticles = true; // Set to false to disable trails
    this.particleColor = 0x00AAFF; // Default blue
    this.particleEmitRate = 3; // Emit every N frames
    this.frameCounter = 0;
  }


  tick() {
    /**
     * CICLO PRINCIPAL DE ACTUALIZACIÓN DE LA NAVE
     *
     * Orden de ejecución optimizado para estabilidad:
     * 1. Verificar estado de vida
     * 2. Aplicar comportamientos de IA (separación)
     * 3. Procesar física del movimiento
     * 4. Actualizar listas de aliados/enemigos
     * 5. Ejecutar acciones de combate
     * 6. Calcular datos para animación
     */
    if (this.muerto) return;

    // Comportamientos de IA
    this.separacion(); // Evitar aglomeraciones
    this.aplicarFisica(); // Procesar movimiento
    this.verificarSiEstoyMuerto();
    // Actualizar contexto social y de combate
    this.enemigos = this.buscarPersonasQueNoSonDeMiBando();
    this.amigos = this.buscarPersonasDeMiBando();
    this.enemigoMasCerca = this.buscarEnemigoMasCerca();
    this.pegarSiEstaEnMiRango();
    // Datos para el sistema de animación
    this.calcularAnguloYVelocidadLineal();

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


  calcularAnguloYVelocidadLineal() {
    /**
     * CÁLCULO DE PARÁMETROS DE ANIMACIÓN
     *
     * Ángulo de movimiento:
     * - atan2(y,x) devuelve el ángulo en radianes del vector velocidad
     * - Se suma 180° para ajustar la orientación del sprite
     * - Conversión a grados para facilitar el trabajo con animaciones
     *
     * Velocidad lineal (magnitud del vector):
     * - |v| = √(vx² + vy²)
     * - Se calcula como distancia desde el origen (0,0)
     * - Usado para determinar qué animación reproducir (idle/walk/run)
     */
    this.angulo =
      radianesAGrados(Math.atan2(this.velocidad.y, this.velocidad.x)) + 180;
    this.velocidadLineal = calcularDistancia(this.velocidad, { x: 0, y: 0 });
  }

  async crearSprite() {
    this.sprite = new PIXI.Sprite(
      await PIXI.Assets.load(this.texturePath)
    );
    this.sprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.sprite);
    this.render();
  }

  alineacion() {
    let cont = 0;
    let vectorPromedioDeVelocidades = { x: 0, y: 0 };
    for (const ship of this.amigos) {
      if (ship !== this) {
        const distancia = calcularDistancia(this.posicion, ship.posicion);
        if (distancia < this.vision) {
          cont++;
          vectorPromedioDeVelocidades.x += ship.velocidad.x;
          vectorPromedioDeVelocidades.y += ship.velocidad.y;
        }
      }
    }
    if (cont == 0) return;

    vectorPromedioDeVelocidades.x /= cont;
    vectorPromedioDeVelocidades.y /= cont;

    let vectorNuevo = {
      x: vectorPromedioDeVelocidades.x - this.velocidad.x,
      y: vectorPromedioDeVelocidades.y - this.velocidad.y,
    };
    vectorNuevo = limitarVector(vectorNuevo, 1);
    this.aceleracion.x += this.factorAlineacion * vectorNuevo.x;
    this.aceleracion.y += this.factorAlineacion * vectorNuevo.y;
  }

  cohesion() {
    let cont = 0;
    //verctor vacio donde vamos a ir sumando posiciones
    let vectorPromedioDePosiciones = { x: 0, y: 0 };
    //iteramos por todos los amigos
    const amigosSinElLider = this.amigos.filter(
      (ship) => ship !== this.juego.protagonista
    );
    for (const ship of amigosSinElLider) {
      if (ship !== this) {
        //si la nave ota no soy yo
        const distancia = calcularDistancia(this.posicion, ship.posicion);
        if (distancia < this.vision && distancia > this.radio * 2) {
          cont++;
          vectorPromedioDePosiciones.x += ship.posicion.x;
          vectorPromedioDePosiciones.y += ship.posicion.y;
        }
      }
    }
    if (cont == 0) return;

    vectorPromedioDePosiciones.x /= cont;
    vectorPromedioDePosiciones.y /= cont;

    let vectorNuevo = {
      x: vectorPromedioDePosiciones.x - this.posicion.x,
      y: vectorPromedioDePosiciones.y - this.posicion.y,
    };
    vectorNuevo = limitarVector(vectorNuevo, 1);
    this.aceleracion.x += this.factorCohesion * vectorNuevo.x;
    this.aceleracion.y += this.factorCohesion * vectorNuevo.y;
  }

  separacion() {
    /**
     * ALGORITMO DE SEPARACIÓN (BOIDS - Craig Reynolds)
     *
     * Objetivo: Evitar colisiones manteniendo distancia mínima entre agentes
     *
     * Proceso:
     * 1. Detectar TODAS las naves (amigos y enemigos) muy cercanas
     * 2. Zona crítica: radio * 1.5 (zona de colisión inminente)
     * 3. Calcular centro de masa de los agentes cercanos
     * 4. Generar fuerza de repulsión: fuerza = posición_actual - CM_cercanos
     *
     * Características:
     * - Prioridad máxima (se ejecuta primero en tick())
     * - Afecta a todos los agentes sin distinción de bando
     * - Previene superposición y aglomeración excesiva
     *
     * Resultado: Espaciado natural y realista entre NAVES
     */
    let cont = 0;
    let vectorPromedioDePosiciones = { x: 0, y: 0 };

    // Detectar TODOS los agentes cercanos (sin distinción de bando)
    for (const ship of this.juego.ships) {
      if (ship !== this) {
        const distancia = calcularDistancia(this.posicion, ship.posicion);
        // Zona crítica de separación
        if (distancia < this.radio * 1.5) {
          cont++;
          vectorPromedioDePosiciones.x += ship.posicion.x;
          vectorPromedioDePosiciones.y += ship.posicion.y;
        }
      }
    }
    if (cont == 0) return; // No hay agentes demasiado cerca

    // Centro de masa de los agentes cercanos
    vectorPromedioDePosiciones.x /= cont;
    vectorPromedioDePosiciones.y /= cont;

    // Vector de repulsión (alejarse del centro de masa)
    let vectorNuevo = {
      x: this.posicion.x - vectorPromedioDePosiciones.x,
      y: this.posicion.y - vectorPromedioDePosiciones.y,
    };

    // Normalizar y aplicar factor de separación
    vectorNuevo = limitarVector(vectorNuevo, 1);
    this.aceleracion.x += this.factorSeparacion * vectorNuevo.x;
    this.aceleracion.y += this.factorSeparacion * vectorNuevo.y;
  }
  verificarSiEstoyMuerto() {
    if (this.vida <= 0) {
      this.morir();
    }
  }

  morir() {
    if (this.muerto) return;

    this.muerto = true;
    this.juego.ships = this.juego.ships.filter((ship) => ship !== this);
    //this.juego.enemigos = this.juego.enemigos.filter((ship) => ship !== this);
    //this.juego.amigos = this.juego.amigos.filter((ship) => ship !== this);

    // Agregar estas líneas para destruir visualmente
    if (this.sprite) this.sprite.destroy();
    if (this.container) this.container.destroy();
    this.container = null;


    //this.borrarmeComoTargetDeTodos();
  }

  pegarSiEstaEnMiRango() {
    if (
      this.enemigoMasCerca &&
      calcularDistancia(this.posicion, this.enemigoMasCerca.posicion) <
      this.rangoDeAtaque
    ) {
      this.pegar(this.enemigoMasCerca);
    }
  }

  pegar(enemigo) {
    enemigo.recibirDanio(this.fuerzaDeAtaque);
  }

  recibirDanio(danio) {
    this.morir();
  }

  buscarEnemigoMasCerca() {
    /**
     * ALGORITMO DE BÚSQUEDA DEL ENEMIGO MÁS CERCANO
     *
     * Implementa búsqueda lineal optimizada:
     * 1. Inicializar con distancia infinita
     * 2. Iterar por todos los enemigos
     * 3. Calcular distancia euclidiana: d = √((x₂-x₁)² + (y₂-y₁)²)
     * 4. Filtrar por rango de visión
     * 5. Mantener el mínimo encontrado
     *
     * Complejidad: O(n) donde n = número de enemigos
     *
     * Optimización futura posible: Spatial hashing o Quadtree
     * para reducir a O(log n) en escenarios con muchos agentes
     */
    let enemigoMasCerca = null;
    let distanciaMasCerca = Infinity;

    for (let i = 0; i < this.enemigos.length; i++) {
      const enemigo = this.enemigos[i];
      const distancia = calcularDistancia(this.posicion, enemigo.posicion);

      // Actualizar si es más cercano Y está dentro del rango de visión
      if (distancia < distanciaMasCerca && distancia < this.vision) {
        distanciaMasCerca = distancia;
        enemigoMasCerca = enemigo;
      }
    }
    return enemigoMasCerca;
  }

  render() {
    /**
     * RENDERIZADO CON ORDENAMIENTO EN PROFUNDIDAD
     *
     * 1. Verificaciones de seguridad
     * 2. Sincronización física-visual (super.render())
     * 3. Actualización del sistema de animación
     * 4. Z-Index dinámico para perspectiva isométrica:
     *    - zIndex = posición.y
     *    - Objetos con Y mayor aparecen "más cerca" (delante)
     *    - Esto simula profundidad en la vista isométrica
     */
    if (!this.container || !this.sprite) return;
    super.render();
    if (this.sprite) {
      this.sprite.rotation = Math.atan2(this.velocidad.y, this.velocidad.x) + Math.PI / 2;
    }


    // Ordenamiento en profundidad para perspectiva isométrica
    this.container.zIndex = this.posicion.y;
  }
}

