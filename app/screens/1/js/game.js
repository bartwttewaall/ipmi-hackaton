(function(ns) {
	
	var Game = function(physics) {
		
		this.physics = physics; // should check if not null
		
		this.activeIndex = 0;
		this.screens = [
			{name: 'idle'},
			{name: 'start'},
			{name: 'countdown'},
			{name: 'game'},
			{name: 'gameover'},
			{name: 'restart'},
		];
		
		this.loading = false;
		this.isRunning = false;
		this.requestID = null;
		
		this.perlin = 0;
	};
	
	var p = Game.prototype;
	
	p.startLoop = function () {
		console.log('start loop');
        this.isRunning = true;
        this.render();
    };

    p.stopLoop = function () {
    	console.log('stop loop');
    	
        // this will stop the render loop on the next frame
        this.isRunning = false;
        if (this.requestID !== null) cancelAnimationFrame(this.requestID);
        this.requestID = null;
    };

    p.renderOnce = function () {
        this.stopLoop();
        this.render();
    };

    p.render = function () {
        if (!this.loading) {
        	
            // keep rendering frames while this.isRunning is true
            if (this.isRunning) {
                if (this.requestID !== null) cancelAnimationFrame(this.requestID);
                this.requestID = requestAnimationFrame(this.render.bind(this));
            }
            
            this.calculatePhysics();
            
            // if (!!this.stats) this.stats.update();
			// this.renderer.render(this.scene, this.camera);
        }
    };
	
	p.gotoScreen = function(name) {
		this.activeIndex = this.screens.findIndex(function(screen) {
			return (screen.name === name);
		});
		console.log('goto screen', name, 'at index:', this.activeIndex);
	};
	
	p.calculatePhysics = function() {
		this.perlin += this.physics.velocity * 0.001;
		console.log('perlin:', this.perlin);
	};
	
	ns.Game = Game;
	
}(window));