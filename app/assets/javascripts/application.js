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
	self.players = [];
	self.keyTable = {
		38: "up",
		40: "down",
		37: "left",
		39: "right",
		32: "space"
	}
	self.keyTracker = {}
	self.init = function(){

		self.socket = io.connect("http://localhost", {port: 8000, transports: ["websocket"]});
		self.socket.on("connect", self.socketConnected);
		self.socket.on("hello", self.helloWorld);
		self.socket.on("tick", self.helloWorld);
		self.socket.on("welcome", self.configurePlayer);
		//self.socket.on("chat down", onMovePlayer);
		self.draw();

	}
	self.socketConnected = function(){
		console.log("Connected to socket server");
		self.localPlayer = new player();
		//Now that the player is setup we can attach keyboard events to events inside the player:
		self.setupEvents();
	}
	self.helloWorld = function(data){
		console.log(data);
	}
	self.configurePlayer = function(data){
		console.log("configure")
		console.log(data);
	}
	self.setupEvents = function(){

		$(document).keydown(function(e) {
			self.keyTracker[e.keyCode] = true;
		}).keyup(function(e) {
			self.keyTracker[e.keyCode] = false;
		});

	}

	self.calculate = function(){

		var iNumberOfPlayers = self.players.length;
		var oCurrentPlayer = null;
		for (var i = 0; i < iNumberOfPlayers; i++) {
			self.players[i].tick();
		}

	}
	self.addPlayer = function(oPlayer){

	}
	self.removePlayer = function(oPlayer){

	}
	self.draw = function(){

		self.calculate();



		window.requestAnimationFrame(self.draw);

	}

	self.init();

}
function player(){

	var self = this;
	self.id = "";
	self.position = {
		x: 0,
		y: 0
	}
	self.speed = {
		x: 0,
		y: 0
	}
	self.configuration = {
		head: 0,
		body: 0,
		feet: 0
	}
	self.animation = {
		animations: {
			"walk-left": [{"x": 0, "y": 0}, {"x": 0, "y": 0}]
		},
		current: "walk-left",
		step: 0
	}
	self.init = function(){
		console.log("Hello!");
	}
	self.tick = function(){
		
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



	}
	self.chat = function(message){

	}
	self.init();

}

$(document).ready(function(){

	window.samuelgil = new samuelgil_client();

});