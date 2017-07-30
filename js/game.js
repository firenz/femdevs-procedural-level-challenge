'use_strict';

window.onload = function() {

  var proceduralMap;
  var tileSize = 16;
  var mapHeight = 25;
  var mapWidth = 25;
  var startPosition;
  var treasurePosition;
  var minPathTilesCount = 5;
  var maxPathTilesCount = mapWidth * mapHeight;

  var showDebug = false;

  //input handler for player
  var cursors;

  //Enum with the different directions the player can face
  var direction = {
    up: 0,
    down: 1,
    left: 2,
    right: 3
  };

  // other game related vars
  var player;
  var floorGroup;
  var wallsGroup;
  var treasure;

  function Point(x, y) {
    var tmp = {};

    tmp.x = x || 0;
    tmp.y = y || 0;

    return tmp;
  }

  var tileTypes = {
      invalid: -1,
      none: 0,
      floor: 1,
      wall: 2
  };

  var game = new Phaser.Game(160, 144, Phaser.AUTO, 'game-area', {
      preload: preload,
      create: create,
      update: update,
      render: render
  });

  //*****************************************
  // *** PROCEDURAL GENERATION FUNCTIONS ***
  //*****************************************

  function GenerateTileGrid(width, height){
    proceduralMap = new Array(width + 1);

    for(var i = 0; i < width + 1; i++){
      proceduralMap[i] = new Array(height + 1);

      for(var j = 0; j < height + 1; j++){
          proceduralMap[i][j] = new Tile(tileTypes.none, i, j);
      }
    }

    startPosition = new Point(0, 0);
    startPosition.x = game.rnd.integerInRange(1, width - 1);
    startPosition.y = game.rnd.integerInRange(1, height - 1);
    // startPosition.x = Math.floor(width * 0.5);
    // startPosition.y = Math.floor(height * 0.5);

    console.log("start x: " + startPosition.x + " start y: " + startPosition.y);

    proceduralMap[startPosition.x][startPosition.y] = new Tile(tileTypes.floor, startPosition.x, startPosition.y);
    proceduralMap[startPosition.x][startPosition.y].tile.tint = Math.random() * 0xffffff;
  }

  function GeneratePath(width, height){
    var currentPathTilesCount = game.rnd.integerInRange(minPathTilesCount, maxPathTilesCount);

    var i = currentPathTilesCount;
    var currentPosition = new Point(startPosition.x, startPosition.y);

    while(i > 0){
      var rndDirection = game.rnd.integerInRange(0, 3);
      // console.log("current x: " + currentPosition.x + " y: " + currentPosition.y);
      var newPosX  = currentPosition.x;
      var newPosY = currentPosition.y;

      switch(rndDirection){
        case direction.up:
        newPosX  = currentPosition.x - 1;
        newPosY = currentPosition.y;
        break;
        case direction.down:
        newPosX  = currentPosition.x + 1;
        newPosY = currentPosition.y;
        break;
        case direction.left:
        newPosX  = currentPosition.x;
        newPosY = currentPosition.y - 1;
        break;
        case direction.right:
        newPosX  = currentPosition.x;
        newPosY = currentPosition.y + 1;
        break;
      }

      if(newPosX < 1) newPosX = 1;
      if(newPosX > (width - 1)) newPosX = (width - 1);

      if(newPosY < 1) newPosY = 1;
      if(newPosY > (height - 1)) newPosY = (height - 1);

      currentPosition.x = newPosX;
      currentPosition.y = newPosY;
      currentPosition = new Point(newPosX, newPosY);

      proceduralMap[currentPosition.x][currentPosition.y] = new Tile(tileTypes.floor, currentPosition.x, currentPosition.y);

      i--;
    }

    treasurePosition = new Point(currentPosition.x, currentPosition.y);
  }

  function GenerateWalls(width, height){

    for(var i = 0; i < width + 1; i++){
      for(var j = 0; j < height + 1; j++){
        var tilePosition = new Point(i, j);

        if(proceduralMap[i][j].currentType === tileTypes.floor){

          for(var neighbourX = -1; neighbourX < 2; neighbourX++){
            for(var neighbourY = -1; neighbourY < 2; neighbourY++){
                var neighbourPosition = new Point(tilePosition.x + neighbourX, tilePosition.y + neighbourY);

                if(neighbourPosition.x > -1 && neighbourPosition.x < width + 1 && neighbourPosition.y > -1 && neighbourPosition.y < height + 1){
                    if(proceduralMap[neighbourPosition.x][neighbourPosition.y].currentType == tileTypes.none){

                        proceduralMap[neighbourPosition.x][neighbourPosition.y] = new Tile(tileTypes.wall, neighbourPosition.x, neighbourPosition.y);
                    }
                }
            }
          }
        }
      }
    }
  }

  //*****************************
  // *** GAME BASIC FUNCTIONS ***
  //*****************************

  function preload(){

    // enable crisp rendering for pixel art
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(game.canvas);

    // scale the game 5x always
    //game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    //game.scale.setUserScale(5, 5);

    //scaling options
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

    game.scale.minWidth = 160;
    game.scale.minHeight = 144;
    //scaled up to 5x
    game.scale.maxWidth = 800;
    game.scale.maxHeight = 720;

    //game centered horizontally
    game.scale.pageAlignHorizontally = true;
    //game centered vertically
    // game.scale.pageAlignVertically = true;

    //screen size will be set automatically
    //NOTE: change every setScreenSize (deprecated) that appears in a tutorial with updateLayout
    game.scale.updateLayout(true);

    //physics system for movement
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //controls
    cursors = game.input.keyboard.addKeys({
        'up': Phaser.Keyboard.UP,
        'down': Phaser.Keyboard.DOWN,
        'left': Phaser.Keyboard.LEFT,
        'right': Phaser.Keyboard.RIGHT,
        'accept': Phaser.Keyboard.Z,
        'cancel': Phaser.Keyboard.X
    });

    // load assets
    game.load.spritesheet('player', 'assets/jrpg-witch.png', 16, 16);
    game.load.spritesheet('testTiles', 'assets/color_tileset_16x16_Eiyeron_CC-BY-SA-3.0_8.png', 16, 16);
  }

  function create(){
    game.physics.startSystem(Phaser.Physics.ARCADE);

    floorGroup = game.add.group();
    wallsGroup = game.add.group();
    wallsGroup.enableBody = true;
    wallsGroup.physicsBodyType = Phaser.Physics.ARCADE;

    // ** generate procedural path **
    GenerateTileGrid(mapWidth, mapHeight);
    GeneratePath(mapWidth, mapHeight);
    GenerateWalls(mapWidth, mapHeight);

    game.world.setBounds(0, 0, mapWidth * tileSize * 5, mapHeight * tileSize * 5);

    player = new Player(startPosition.x, startPosition.y);
    treasure = new Treasure(treasurePosition.x, treasurePosition.y);

    console.log("Hello!\nArrow keys moves the PJ.");
  }

  function update(){
    this.game.physics.arcade.collide(player, wallsGroup);
    this.game.physics.arcade.collide(player, treasure, foundedTreasure);

  }

  function render(){
    if(showDebug){
      game.debug.body(player);
      game.debug.body(treasure);
      game.debug.body(wallsGroup);
      wallsGroup.forEachAlive(renderGroup, this);
    }
  }

  function renderGroup(member) {
    game.debug.body(member);
  }

  function foundedTreasure() {
    console.log("Founded treasure!!\nPress F5 to regenerate dungeon.");

    treasure.kill();

    player.hasFoundedTreasure = true;
    player.animations.play('founded-treasure');
  }

  //************************
  // *** OTHER FUNCTIONS ***
  //************************

  Tile = function(type, x , y) {
    Phaser.Graphics.call(this, game, 0, 0);

    this.currentType = type || tileTypes.none;

    switch(type){
      case tileTypes.floor:
      this.tile = floorGroup.create(x * tileSize, y * tileSize, 'testTiles', 25);
      break;
      case tileTypes.wall:
      this.tile = wallsGroup.create(x * tileSize, y * tileSize, 'testTiles', 12);
      this.tile.body.immovable = true;
      break;
      default:
      break;
    }

    //IMPORTANT
    game.add.existing(this);
  };

  Tile.prototype = Object.create(Phaser.Graphics.prototype);
  Tile.prototype.constructor = Tile;

  Wall = function(x, y){
    Phaser.Sprite.call(this, game, x * tileSize, y * tileSize, 'testTiles', 12);

    game.physics.arcade.enable(this);
    this.body.setSize(tileSize, tileSize);
    this.body.immovable = true;

    //IMPORTANT
    wallsGroup.add(this);
    game.add.existing(this);
  };

  Wall.prototype = Object.create(Phaser.Sprite.prototype);
  Wall.prototype.constructor = Wall;

  Player = function(x, y){
    Phaser.Sprite.call(this, game, x * tileSize, y * tileSize, 'player');
    console.log("player x: " + this.x + " y: " + this.y);

    //another vars
    this.hasFoundedTreasure = false;

    //sprite depth
    this.z = 0;

    //change anchor to bottom left
    this.anchor.x = 0;
    this.anchor.y = 0;

    //player speed
    this.speed = 50;

    //player physics
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.setSize(tileSize - (tileSize / 2), tileSize / 2 - 2, tileSize / 4, tileSize / 2 + 1);
    this.body.collideWorldBounds = true;

    //player animations
    this.animations.add('idle-up', [39], 5, true);
    this.animations.add('idle-down', [3], 5, true);
    this.animations.add('idle-left', [15], 5, true);
    this.animations.add('idle-right', [27], 5, true);
    this.animations.add('up', [37, 38, 39, 40], 5, true);
    this.animations.add('down', [1, 2, 3, 4], 5, true);
    this.animations.add('right', [25, 26, 27, 28], 5, true);
    this.animations.add('left', [13, 14, 15, 16], 5, true);
    this.animations.add('founded-treasure', [62, 63, 64], 5, true);

    this.animations.play('idle-down');

    game.add.existing(this);

    // make camera follow player
    game.camera.follow(this);
  };

  Player.prototype = Object.create(Phaser.Sprite.prototype);
  Player.prototype.constructor = Player;

  Player.prototype.update = function(){

    //If player has founded the treeasure it can't be moved anymore
    //if (this.hasFoundedTreasure === false) return;

    //Reset velocity in each update
    this.body.velocity.y = 0;
    this.body.velocity.x = 0;

    //this movement
    var velocity = new Point();

    switch (this.animations.currentAnim.name) {
      case 'up':
        if (cursors.up.isDown) {
          velocity.y = -1 * this.speed;
          if (cursors.right.isDown) {
            velocity.x = this.speed;
          } else if (cursors.left.isDown) {
            velocity.x = -1 * this.speed;
          }
        } else if (cursors.down.isDown) {
          velocity.y = this.speed;
          this.animations.play('down');
        } else {
          if (cursors.right.isDown) {
            velocity.x = this.speed;
            this.animations.play('right');
          } else if (cursors.left.isDown) {
            velocity.x = -1 * this.speed;
            this.animations.play('left');
          }
        }
        break;
      case 'down':
        if (cursors.down.isDown) {
          velocity.y = this.speed;
          if (cursors.right.isDown) {
            velocity.x = this.speed;
          } else if (cursors.left.isDown) {
            velocity.x = -1 * this.speed;
          }
        } else if (cursors.up.isDown) {
          velocity.y = -1 * this.speed;
          this.animations.play('up');
        } else {
          if (cursors.right.isDown) {
            velocity.x = this.speed;
            this.animations.play('right');
          } else if (cursors.left.isDown) {
            velocity.x = -1 * this.speed;
            this.animations.play('left');
          }
        }
        break;
      case 'right':
        if (cursors.right.isDown) {
          velocity.x = this.speed;
          if (cursors.up.isDown) {
            velocity.y = -1 * this.speed;
          } else if (cursors.down.isDown) {
            velocity.y = this.speed;
          }
        } else if (cursors.left.isDown) {
          velocity.x = -1 * this.speed;
          this.animations.play('left');
        } else {
          if (cursors.up.isDown) {
            velocity.y = -1 * this.speed;
            this.animations.play('up');
          } else if (cursors.down.isDown) {
            velocity.y = this.speed;
            this.animations.play('down');
          }
        }
        break;
      case 'left':
        if (cursors.left.isDown) {
          velocity.x = -1 * this.speed;
          if (cursors.up.isDown) {
            velocity.y = -1 * this.speed;
          } else if (cursors.down.isDown) {
            velocity.y = this.speed;
          }
        } else if (cursors.right.isDown) {
          velocity.x = this.speed;
          this.animations.play('right');
        } else {
          if (cursors.up.isDown) {
            velocity.y = -1 * this.speed;
            this.animations.play('up');
          } else if (cursors.down.isDown) {
            velocity.y = this.speed;
            this.animations.play('down');
          }
        }
        break;
      case 'idle-up':
      case 'idle-down':
      case 'idle-right':
      case 'idle-left':
        if (cursors.up.isDown) {
          velocity.y = -1 * this.speed;
          this.animations.play('up');
        }

        if (cursors.down.isDown) {
          velocity.y = this.speed;
          this.animations.play('down');
        }

        if (cursors.right.isDown) {
          velocity.x = this.speed;
          this.animations.play('right');
        }

        if (cursors.left.isDown) {
          velocity.x = -1 * this.speed;
          this.animations.play('left');
        }
        break;
      default:

    }

    if (velocity.x === 0 && velocity.y === 0) {
      switch (this.animations.currentAnim.name) {
        case 'up':
          this.animations.play('idle-up');
          break;
        case 'down':
          this.animations.play('idle-down');
          break;
        case 'right':
          this.animations.play('idle-right');
          break;
        case 'left':
          this.animations.play('idle-left');
          break;
        default:
      }
    }

    this.body.velocity.x = velocity.x;
    this.body.velocity.y = velocity.y;
  };

  Treasure = function(x, y){
    Phaser.Sprite.call(this, game, x * tileSize, y * tileSize, 'testTiles', 84);
    console.log("treasure x: " + this.x + " y: " + this.y);

    //change anchor to bottom left
    this.anchor.x = 0;
    this.anchor.y = 0;

    game.physics.arcade.enable(this);
    this.body.setSize(tileSize, tileSize);
    this.body.immovable = true;

    game.add.existing(this);
  };
  Treasure.prototype = Object.create(Phaser.Sprite.prototype);
  Treasure.prototype.constructor = Treasure;
  Treasure.prototype.kill = function(){
    this.alive = false;
    this.exists = false;
    this.visible = false;

    if (this.events){
        this.events.onKilled$dispatch(this);
    }

    return this;
  };

};
