var game;
var floors = 3;
var floorHeight = 250;
var spaceWidth = 80;
var spaces = 10;
var gameHeight = floors * floorHeight;
var gameWidth = spaceWidth * spaces;
var hallwayHeight = 20;
var personHeight = 151;
var personScaledHeight = (personHeight * 0.75);
var personWidth = 104;
var personScaledWidth = (personWidth * 0.75);
var headHeight = 60;
var headScaledHeight = (headHeight * 0.5);
var people = {};

var FACING = { 'LEFT' : 1, 'RIGHT' : 2 } 

var walkHeadAdjustments = [[43,31],[42,31],[40,33],[46,31],[39,31],[39,34],[39,31],[33,31],[40,33],[41,31],[36,31],[43,34],[45,33],[46,33]]; 

window.onload = function() {
	game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, "main-canvas");
	game.state.add("PlayGame", playGame);
	game.state.start("PlayGame");
}

var personFactory;

var playGame = function(game) {}
playGame.prototype = {
	preload: function() {
			game.load.spritesheet('person', '/sprites/body_no_head.png', personWidth, personHeight, 14);
			game.load.spritesheet('head_danny', '/sprites/head_danny3.png', 50, headHeight, 4);
			game.load.image('carpet', '/sprites/carpet.png');
			game.load.image('concrete', '/sprites/concrete.png');
		},
	create: function() {
		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.stage.backgroundColor = 0xD3D3D3;
		personFactory = new PersonFactory();

		
		for (var floor = 1; floor <= floors; floor++) {
			var hallway = game.add.tileSprite(0, getFloorY(floor) - hallwayHeight, gameWidth, hallwayHeight, 'carpet');
			var concrete = game.add.tileSprite(0, getFloorY(floor), gameWidth, 10, 'concrete');
			hallway.tileScale.y = hallwayHeight / 180;
		}
				
		for (var i = 0; i < 9; i++) {
			people[i] = personFactory.getPerson({ space: 5, floor: i % 3 + 1, pace: 7 });
		}

		timer = game.time.create(false);
		
		//  Set a TimerEvent to occur after 2 seconds
		timer.loop(3000, function() {
			for (var i = 0; i < 9; i++) {
				var location = game.rnd.integerInRange(1, 10);
				people[i].walkTo(location);
				console.log('Person: ' + i + ' Location: ' + location);
			}
		}, this);
		timer.start();
	},
	update: function() {
	
	},
	render: function() {
	}
}

function PersonFactory() {
	this.loaded = 0;
}

PersonFactory.prototype.getPerson = function(init) {
	this.loaded++;
	var newPerson = new Person(init);
	people[this.loaded] = newPerson;
	return newPerson;
}

function Person(init) {
	this.floor = init.floor != null ? init.floor : 1;
	this.pace = init.pace != null ? init.pace : 1;
	this.space = init.space != null ? init.space : 1;
	this.facingDirection = init.facingDirection != null ? init.facingDirection : FACING.RIGHT;
	this.pace = init.pace != null ? init.pace : 7;
	
	this.personSprites = game.add.group();	
	this.personSprites.x = this.getXCoordFromSpace(this.space);
	this.personSprites.y = this.getYCoordFromFloor(this.floor);
		
	this.body = game.add.sprite(0, 0, 'person');
	this.head = game.add.sprite(45, headScaledHeight, 'head_danny');
	this.personSprites.add(this.body);
	this.personSprites.add(this.head);
	this.body.scale.setTo(0.75, 0.75);
	this.head.scale.setTo(0.6, 0.6);
	this.walkRight = this.body.animations.add('walk_right', [0,1,2,3,4,5]);
	this.walkLeft = this.body.animations.add('walk_left', [6,7,8,9,10,11]);
	this.lookLeft = this.body.animations.add('look_left', [13]);
	this.lookRight = this.body.animations.add('look_right', [12]);
	this.headRight = this.head.animations.add('look_right', [0]);
	this.headLeft = this.head.animations.add('look_left', [1]);	
	
	this.head.anchor.x = 0.5;
	this.head.anchor.y = 1;	
	
	this.stopAndStand();
}

Person.prototype.walkTo = function(space) {
	var that = this;

	var destinationX = that.getXCoordFromSpace(space);
	var directionFromX = this.compareWithCurrentX(destinationX);

	if (directionFromX === -1) { //we are left of the destinationX
		this.facingDirection = FACING.RIGHT;
	}
	else  if (directionFromX === 1) {
		this.facingDirection = FACING.LEFT;
	}
	else {
		return;
	}

	this.cancelAnimations();
	walkAndStop(destinationX);
	
	function walkAndStop(destinationX) {

		var facingDirectionText = that.getFacingDirectionText();
		that.head.animations.play('look_' + facingDirectionText, 60, false);
		that.bodyAnimation = that.body.animations.play("walk_" + facingDirectionText, that.pace, true);
		that.bodyAnimation.enableUpdate = true;
		that.bodyAnimation.onUpdate.add(function() {
			that.updateHeadPosition();
		});

		var distance = Math.abs(destinationX - that.currentX());
		that.walkTween = game.add.tween(that.personSprites).to( { x: destinationX }, that.travelTimeMilliseconds(distance), Phaser.Easing.Linear.In, true);	
		that.walkTween.onComplete.add(function() {
			that.stopAndStand();
		});
		
		that.updateHeadPosition();
	}
}

Person.prototype.stopAndStand = function() {
	this.cancelAnimations();

	var currentFacingText = this.getFacingDirectionText();	
	this.bodyAnimation = this.body.animations.play('look_' + currentFacingText, 1, false);
	this.head.animations.play('look_' + currentFacingText, 1, false);
	this.updateHeadPosition();
}

Person.prototype.cancelAnimations = function() {
	if (this.bodyAnimation) {
		this.bodyAnimation.stop();
	}	

	if (this.walkTween) {
		this.walkTween.stop();
	}
}

Person.prototype.getFacingDirection = function() {
	return this.facingDirection;
}

//distance is in game pixels
Person.prototype.travelTimeMilliseconds = function(distance) {
	return (distance / (this.pace * 25)) * 1000; 
}

Person.prototype.getFacingDirectionText = function() {
	switch (this.facingDirection) {
		case FACING.LEFT:
			return 'left';
			break;
		case FACING.RIGHT:
			return 'right';
			break;
		defaut:
			throw "We didn't recognize that direction!"
	}
}

Person.prototype.currentX = function() {
	return this.personSprites.position.x;
}

Person.prototype.getYCoordFromFloor = function(floor) {
	return (getFloorY(floor) - personScaledHeight) - (hallwayHeight / 2);
}

Person.prototype.getXCoordFromSpace = function(space) {
	return ((space - 1) * spaceWidth) + ((spaceWidth - personScaledWidth) / 2);
}

Person.prototype.updateHeadPosition = function() {
	var frameNumber = this.bodyAnimation.frame
	var adjust = walkHeadAdjustments[frameNumber];
	this.head.x = adjust[0];
	this.head.y = adjust[1];
}


Person.prototype.compareWithCurrentX = function(otherX) {
	var bodyX = this.currentX();
	if (bodyX < otherX) {
		return -1;
	}
	else if (bodyX === otherX) {
		return 0;
	}
	else {
		return 1;
	}
}

function getFloorY(floor) {
	return (gameHeight - ((floor - 1) * floorHeight));
}
