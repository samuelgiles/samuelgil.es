// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//
//= require jquery
//= require jquery_ujs
//= require_tree .

(function() {
    var vendors = ["webkit", "moz", "ms", "o"];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
        var vp = vendors[i];
        window.requestAnimationFrame = window[vp+'RequestAnimationFrame'];
        window.cancelAnimationFrame = (window[vp+'CancelAnimationFrame']
                                   || window[vp+'CancelRequestAnimationFrame']);
    }
    if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
        var lastTime = 0;
        window.requestAnimationFrame = function(callback) {
            var now = new Date().getTime();
            var nextTime = Math.max(lastTime + 16, now);
            return setTimeout(function() { callback(lastTime = nextTime); },
                              nextTime - now);
        };
        window.cancelAnimationFrame = clearTimeout;
    }
}());

function samuelgil_client(){

	var self = this;
	self.socket = null;
	self.localPlayer = null;
	self.connected = false;
	self.container = $("#live-container");
	self.players = [];
	self.floor = 0;
	self.keyTable = {
		38: "up",
		40: "down",
		37: "left",
		39: "right",
		32: "space"
	}
	self.keyTracker = {}
	self.init = function(){

		$(window).resize(function(){
			self.resize();
		});
		self.resize();

		self.socket = io.connect("http://192.168.1.2", {port: 8000, transports: ["websocket"]});
		self.socket.on("connect", self.socketConnected);
		self.socket.on("hello", self.helloWorld);
		self.socket.on("tick", self.gatherData);
		self.socket.on("welcome", self.configurePlayer);
		self.socket.on("setup", self.setupPlayers);
		self.socket.on("newplayer", self.addPlayer);
		self.socket.on("remove", self.removePlayer);
		//self.socket.on("chat down", onMovePlayer);
		self.draw();

	}
	self.socketConnected = function(){
		console.log("Connected to socket server");
		self.localPlayer = new player();
		self.localPlayer.local = true;
		//Now that the player is setup we can attach keyboard events to events inside the player:
		self.setupEvents();
	}
	self.helloWorld = function(data){
		console.log(data);
	}
	self.setupPlayers = function(data){

		var iNumberOfPlayers = data.length;
		for (var i = 0; i < iNumberOfPlayers; i++) {

			var oCurrentPlayerData = data[i];
			var oCurrentPlayer = new player();
			oCurrentPlayer.id = oCurrentPlayerData.id;
			oCurrentPlayer.position = oCurrentPlayerData.position;
			oCurrentPlayer.speed = oCurrentPlayerData.speed;

			oCurrentPlayer.addToDOM();
			self.players.push(oCurrentPlayer);

		}

	}
	self.gatherData = function(data){

		//Loop through this data and make changes to local data:
		var iNumberOfPlayers = data.length;
		for (var i = 0; i < iNumberOfPlayers; i++) {

			var iPosInIndex = self.getPlayer(data[i].id);

			if(iPosInIndex != false){
				
				self.players[self.getPlayer(data[i].id)].position = data[i].position;
				self.players[self.getPlayer(data[i].id)].speed = data[i].speed;
			}

		}

		//After receiving the gather data, the client sends its data back to the server:
		self.socket.emit("sync", {"id": self.localPlayer.id, "position": self.localPlayer.position, "speed": self.localPlayer.speed});

	}
	self.configurePlayer = function(data){
		self.localPlayer.id = data.id;
		self.localPlayer.position = data.position;
		self.localPlayer.speed = data.speed;
		self.localPlayer.configuration = data.configuration;
		self.localPlayer.addToDOM();
		self.connected = true;
	}
	self.setupEvents = function(){

		$(document).keydown(function(e) {
			self.keyTracker[e.keyCode] = true;
		}).keyup(function(e) {
			self.keyTracker[e.keyCode] = false;
		});

	}
	self.resize = function(){
		$(self.container).css({"height": $(window).height() + "px", "width": $(window).width() + "px"});
		self.floor = $(self.container).height();
	}
	self.calculate = function(){

		var iNumberOfPlayers = self.players.length;
		var oCurrentPlayer = null;
		for (var i = 0; i < iNumberOfPlayers; i++) {
			self.players[i].tick();
		}

		if(self.connected){

			self.localPlayer.tick();
			$(self.localPlayer.element).css({"left": self.localPlayer.position.x, "bottom": self.localPlayer.position.y});

		}
		//Loop through players array, find matching DOM elements, first get a cached version of the players onscreen:
		for (var i = 0; i < iNumberOfPlayers; i++) {

			var oCurrentPlayerData = self.players[i];

			$(self.players[i].element).css({"left": oCurrentPlayerData.position.x, "bottom": oCurrentPlayerData.position.y});

		}

	}
	self.addPlayer = function(oPlayer){

		var newPlayer = new player();
		newPlayer.id = oPlayer.id;
		newPlayer.position = oPlayer.position;
		newPlayer.speed = oPlayer.speed;
		newPlayer.configuration = oPlayer.configuration;

		newPlayer.addToDOM();
		self.players.push(newPlayer);

	}
	self.removePlayer = function(sPlayerID){

		var iPosInIndex = self.getPlayer(sPlayerID.id);
		self.players[iPosInIndex].removeFromDOM();
		self.players.splice(iPosInIndex, 1);

	}
	self.draw = function(){

		self.calculate();

		window.requestAnimationFrame(self.draw);

	}
	self.getPlayer = function(clientID){
		
		var i;
		for (i = 0; i < self.players.length; i++) {
		if (self.players[i].id == clientID)
			return i;
		};

		return false;

	}

	self.init();

}
function player(){

	var self = this;
	self.id = "";
	self.local = false;
	self.position = {
		x: 0,
		y: 0
	}
	self.speed = {
		x: 0,
		y: 0
	}
	self.element = null;
	self.animationSpeed = 0.2;
	self.jumping = false;
	self.configuration = {
		head: 0,
		body: 0,
		feet: 0
	}
	self.animation = {
		animations: {
			"walk-left": [{"x": 5, "y": 456}, {"x": 80, "y": 456}, {"x": 155, "y": 456}, {"x": 230, "y": 456}, {"x": 305, "y": 456}, {"x": 380, "y": 456}, {"x": 455, "y": 456}],
			"walk-right": [{"x": 5, "y": 156}, {"x": 80, "y": 156}, {"x": 155, "y": 156}, {"x": 230, "y": 156}, {"x": 305, "y": 156}, {"x": 380, "y": 156}, {"x": 455, "y": 156}],
			"static": [{"x": 5, "y": 6}],
			"jump-right": [{"x": 5, "y": 307}],
			"jump-left": [{"x": 5, "y": 606}],
			"jump-static": [{"x": 5, "y": 751}]
		},
		current: "static",
		step: 0
	}
	self.init = function(){
		console.log("Hello!");
	}
	self.tick = function(){
		
		if(self.local){

			self.speed.x = 0;

			if(samuelgil.keyTracker[37]){
				self.speed.x = -5;
			}
			else if(samuelgil.keyTracker[39]){
				self.speed.x = 5;
			}

			if(samuelgil.keyTracker[38]){
				self.jumping = true;
				self.speed.y = 10;
			}

			self.position.x = self.position.x + self.speed.x;
			self.position.y = self.position.y + self.speed.y;

			if(self.position.y > 0){
				self.speed.y--;
			}
			else{
				self.speed.y = 0;
			}
			if(self.position.y < 0){
				self.position.y = 0;
			}
		}
		else{
			self.position.x = self.position.x + (self.speed.x/1.5);
			self.position.y = self.position.y + (self.speed.y/1.5);
		}

		
		self.animate();

	}
	self.removeFromDOM = function(){
		$(self.element).remove();
		self.element = null;
	}
	self.addToDOM = function(){

		self.element = $("<div class=\"player\" id=\"" + self.id + "\"></div>");
		$(samuelgil.container).append(self.element);

	}
	self.animate = function(){

		var targetAnimation = "static";

		if(self.speed.y > 0){
			targetAnimation = "jump-static";
		}

		//Work out the animation the player should be on:
		if(self.speed.x > 0){
			
			targetAnimation = "walk-right";

			if(self.speed.y > 0){
				targetAnimation = "jump-right";
			}

		}
		else if(self.speed.x < 0){
			
			targetAnimation = "walk-left";

			if(self.speed.y > 0){
				targetAnimation = "jump-left";
			}

		}

		if(self.animation.current == targetAnimation){
			if(self.animation.step+self.animationSpeed > self.animation.animations[targetAnimation].length){
				self.animation.step = 0;
			}
			else{
				self.animation.step = self.animation.step+self.animationSpeed;
			}
		}
		else{
			self.animation.current = targetAnimation;
			self.animation.step = 0;
		}

		if(self.animation.animations[self.animation.current].length == 1){
			self.animation.step = 0;
		}

		$(self.element).css("background-position", "-" + self.animation.animations[self.animation.current][Math.floor(self.animation.step)].x + "px -" + self.animation.animations[self.animation.current][Math.floor(self.animation.step)].y + "px");

		//console.log([self.animation.step])

		//

	}
	self.chat = function(message){

	}
	self.init();

}

$(document).ready(function(){

	window.samuelgil = new samuelgil_client();

});