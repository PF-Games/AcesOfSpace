class UIManager {
  constructor(juego) {
    this.juego = juego;
    this.buttons = {};
    this.textElements = {};
  }

  createAllUI() {
    this.createTextIndicators();
    this.createEndTurnButton();
    this.createPlayHandButton();
    this.createSortButtons();
  }

  createTextIndicators() {
    // FPS Text
    this.textElements.fps = new PIXI.Text({
      text: "FPS: 60",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      }
    });
    this.textElements.fps.x = this.juego.width - 120;
    this.textElements.fps.y = 20;
    this.juego.interface.addChild(this.textElements.fps);

    // Turn indicator
    this.textElements.turn = new PIXI.Text({
      text: "PLAYER TURN",
      style: {
        fontFamily: "Arial",
        fontSize: 32,
        fill: "#0d34e0ff",
        stroke: "#000000",
        strokeThickness: 5
      }
    });
    this.textElements.turn.anchor.set(0.5, 0);
    this.textElements.turn.x = this.juego.width / 2;
    this.textElements.turn.y = 20;
    this.juego.interface.addChild(this.textElements.turn);

    // Hand value indicator
    this.textElements.handValue = new PIXI.Text({
      text: "",
      style: {
        fontFamily: "Arial",
        fontSize: 28,
        fill: "#FFD700",
        stroke: "#000000",
        strokeThickness: 4
      }
    });
    this.textElements.handValue.anchor.set(0.5, 0);
    this.textElements.handValue.x = this.juego.width / 2;
    this.textElements.handValue.y = 870;
    this.juego.interface.addChild(this.textElements.handValue);
  }

  updateFPS(fps) {
    if (this.textElements.fps) {
      this.textElements.fps.text = `FPS: ${fps.toFixed(0)}`;
    }
  }

  updateTurnIndicator(turnState) {
    if (!this.textElements.turn) return;

    switch(turnState) {
      case 'player':
        this.textElements.turn.text = "YOUR TURN";
        this.textElements.turn.style.fill = "#00FF00";
        break;
      case 'ai':
        this.textElements.turn.text = "AI TURN";
        this.textElements.turn.style.fill = "#FF0000";
        break;
      case 'ai-progress':
        const progress = Math.floor((this.juego.aiTurnTimer / this.juego.aiTurnDuration) * 100);
        this.textElements.turn.text = `AI TURN (${progress}%)`;
        break;
    }
  }

  updateHandValueDisplay() {
    if (!this.textElements.handValue) return;

    if (this.juego.playerHand.hasSelectedCards) {
      const handInfo = this.juego.playerHand.validateHand(this.juego.playerHand.selectedCards);
      this.textElements.handValue.text = handInfo.handName.toUpperCase();
    } else {
      this.textElements.handValue.text = "";
    }
  }

  createEndTurnButton() {
    const button = new PIXI.Container();
    button.x = this.juego.width / 7;
    button.y = this.juego.height - 70;
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.zIndex = 2000;

    this.juego.interface.addChild(button);

    const bg = new PIXI.Graphics();
    bg.rect(-100, -25, 200, 50);
    bg.fill(0x00AA00);
    bg.stroke({ width: 3, color: 0xFFFFFF });
    button.addChild(bg);

    const text = new PIXI.Text({
      text: "END TURN",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#ffffff",
        fontWeight: "bold"
      }
    });
    text.anchor.set(0.5);
    button.addChild(text);

    button.on('pointerdown', () => {
      if (this.juego.currentTurn === 'player') {
        this.juego.endPlayerTurn();
      }
    });

    button.on('pointerover', () => {
      if (this.juego.currentTurn === 'player') {
        button.scale.set(1.08);
        bg.clear();
        bg.rect(-100, -25, 200, 50);
        bg.fill(0x00CC00);
        bg.stroke({ width: 3, color: 0xFFFFFF });
      }
    });

    button.on('pointerout', () => {
      button.scale.set(1);
      if (this.juego.currentTurn === 'player') {
        bg.clear();
        bg.rect(-100, -25, 200, 50);
        bg.fill(0x00AA00);
        bg.stroke({ width: 3, color: 0xFFFFFF });
      }
    });

    this.buttons.endTurn = { container: button, bg, text };
  }

  createPlayHandButton() {
    const button = new PIXI.Container();
    button.x = this.juego.width / 7;
    button.y = this.juego.height - 130;
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.zIndex = 2000;

    this.juego.interface.addChild(button);

    const bg = new PIXI.Graphics();
    bg.rect(-100, -25, 200, 50);
    bg.fill(0x0066CC);
    bg.stroke({ width: 3, color: 0xFFFFFF });
    button.addChild(bg);

    const text = new PIXI.Text({
      text: "PLAY HAND",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#ffffff",
        fontWeight: "bold"
      }
    });
    text.anchor.set(0.5);
    button.addChild(text);

    button.on('pointerdown', () => {
      if (this.juego.currentTurn === 'player' && this.juego.playerHand.hasSelectedCards) {
        this.juego.playSelectedCards();
      }
    });

    button.on('pointerover', () => {
      if (this.juego.currentTurn === 'player' && this.juego.playerHand.hasSelectedCards) {
        button.scale.set(1.08);
        bg.clear();
        bg.rect(-100, -25, 200, 50);
        bg.fill(0x0088FF);
        bg.stroke({ width: 3, color: 0xFFFFFF });
      }
    });

    button.on('pointerout', () => {
      button.scale.set(1);
      this.updatePlayHandButton();
    });

    this.buttons.playHand = { container: button, bg, text };
  }

  createSortButtons() {
    // DESELECT ALL BUTTON
    const deselectBtn = this.createButton({
      x: this.juego.width - 220,
      y: this.juego.height - 150,
      width: 120,
      height: 40,
      text: "DESELECT",
      color: 0x3498DB,
      hoverColor: 0x5DADE2,
      onClick: () => this.juego.deselectAllCards()
    });
    this.buttons.deselectAll = deselectBtn;

    // SORT BY RANK BUTTON
    const rankBtn = this.createButton({
      x: this.juego.width - 220,
      y: this.juego.height - 100,
      width: 120,
      height: 40,
      text: "BY RANK",
      color: 0x9B59B6,
      hoverColor: 0xAA6FC9,
      onClick: () => this.juego.sortHandByRank()
    });
    this.buttons.sortRank = rankBtn;

    // SORT BY SUIT BUTTON
    const suitBtn = this.createButton({
      x: this.juego.width - 220,
      y: this.juego.height - 50,
      width: 120,
      height: 40,
      text: "BY SUIT",
      color: 0xE67E22,
      hoverColor: 0xF39C12,
      onClick: () => this.juego.sortHandBySuit()
    });
    this.buttons.sortSuit = suitBtn;
  }

  createButton({ x, y, width, height, text, color, hoverColor, onClick }) {
    const button = new PIXI.Container();
    button.x = x;
    button.y = y;
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.zIndex = 2000;

    this.juego.interface.addChild(button);

    const bg = new PIXI.Graphics();
    bg.rect(-width / 2, -height / 2, width, height);
    bg.fill(color);
    bg.stroke({ width: 2, color: 0xFFFFFF });
    button.addChild(bg);

    const textObj = new PIXI.Text({
      text: text,
      style: {
        fontFamily: "Arial",
        fontSize: 16,
        fill: "#ffffff",
        fontWeight: "bold"
      }
    });
    textObj.anchor.set(0.5);
    button.addChild(textObj);

    button.on('pointerdown', () => {
      if (this.juego.currentTurn === 'player') {
        onClick();
      }
    });

    button.on('pointerover', () => {
      button.scale.set(1.05);
      bg.clear();
      bg.rect(-width / 2, -height / 2, width, height);
      bg.fill(hoverColor);
      bg.stroke({ width: 2, color: 0xFFFFFF });
    });

    button.on('pointerout', () => {
      button.scale.set(1);
      bg.clear();
      bg.rect(-width / 2, -height / 2, width, height);
      bg.fill(color);
      bg.stroke({ width: 2, color: 0xFFFFFF });
    });

    return { container: button, bg, text: textObj, color, hoverColor, width, height };
  }

  updateEndTurnButton() {
    const btn = this.buttons.endTurn;
    if (!btn) return;

    if (this.juego.currentTurn === 'ai') {
      btn.container.eventMode = 'none';
      btn.container.alpha = 0.5;
      btn.bg.clear();
      btn.bg.rect(-100, -25, 200, 50);
      btn.bg.fill(0x666666);
      btn.bg.stroke({ width: 3, color: 0x999999 });
    } else {
      btn.container.eventMode = 'static';
      btn.container.alpha = 1;
      btn.bg.clear();
      btn.bg.rect(-100, -25, 200, 50);
      btn.bg.fill(0x00AA00);
      btn.bg.stroke({ width: 3, color: 0xFFFFFF });
    }
  }

  updatePlayHandButton() {
    const btn = this.buttons.playHand;
    if (!btn) return;

    const disabled = this.juego.currentTurn === 'ai' || !this.juego.playerHand.hasSelectedCards;

    if (disabled) {
      btn.container.eventMode = 'none';
      btn.container.alpha = 0.5;
      btn.bg.clear();
      btn.bg.rect(-100, -25, 200, 50);
      btn.bg.fill(0x666666);
      btn.bg.stroke({ width: 3, color: 0x999999 });
    } else {
      btn.container.eventMode = 'static';
      btn.container.alpha = 1;
      btn.bg.clear();
      btn.bg.rect(-100, -25, 200, 50);
      btn.bg.fill(0x0066CC);
      btn.bg.stroke({ width: 3, color: 0xFFFFFF });
    }
  }

  updatePositions() {
    const w = this.juego.width;
    const h = this.juego.height;

    // Update text positions
    if (this.textElements.fps) {
      this.textElements.fps.x = w - 120;
      this.textElements.fps.y = 20;
    }

    if (this.textElements.turn) {
      this.textElements.turn.x = w / 2;
      this.textElements.turn.y = 20;
    }

    if (this.textElements.handValue) {
      this.textElements.handValue.x = w / 2;
      this.textElements.handValue.y = 70;
    }

    // Update button positions
    if (this.buttons.endTurn) {
      this.buttons.endTurn.container.x = w / 7;
      this.buttons.endTurn.container.y = h - 70;
    }

    if (this.buttons.playHand) {
      this.buttons.playHand.container.x = w / 7;
      this.buttons.playHand.container.y = h - 130;
    }

    if (this.buttons.deselectAll) {
      this.buttons.deselectAll.container.x = w - 220;
      this.buttons.deselectAll.container.y = h - 150;
    }

    if (this.buttons.sortRank) {
      this.buttons.sortRank.container.x = w - 220;
      this.buttons.sortRank.container.y = h - 100;
    }

    if (this.buttons.sortSuit) {
      this.buttons.sortSuit.container.x = w - 220;
      this.buttons.sortSuit.container.y = h - 50;
    }
  }
}