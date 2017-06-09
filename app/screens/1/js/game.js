(function(ns) {
	
	var Game = function(physics, target) {
		
		this.physics = physics; // should check if not null
		
		this.parentElement = target;
		
		this.setupScene();
		this.setupLighting();
		this.setupModels();
		this.setupCamera();
		this.setupControls();
		
		this.resizeToContainer();
		
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
	
	p.setupScene = function() {
		this.scene = new THREE.Scene();
		this.scene.fog = new THREE.FogExp2(0x000000, 0.0025);
		this.canvas = this.parentElement.appendChild(document.createElement('canvas'));
		
		this.rendererAttributes = {
			canvas                : this.canvas,
			precision             : 'lowp',	// Shader precision: can be 'highp', 'mediump' or 'lowp'
			antialias             : true,   // Antialiasing (2x)
			alpha                 : true,   // For blending functionality and canvas transparency
			preserveDrawingBuffer : false,  // Set to true for taking a canvas snapshot: you'll need to call renderer.clear() before each frame render
		};
		
		this.renderer = new THREE.WebGLRenderer(this.rendererAttributes);
		this.renderer.autoClear = false;
		this.renderer.setClearColor(0x000000, 0);
		this.renderer.setPixelRatio(window.devicePixelRatio);
	};
	
	p.setupLighting = function() {
		var lighting = new THREE.Object3D();

		var ambient = new THREE.AmbientLight(0x101010);
		ambient.name = "Ambient light";
		lighting.add(ambient);

		var back = new THREE.DirectionalLight("white", 0.225);
		back.position.set(2.6, 1, 3);
		back.name = "Back light";
		lighting.add(back);

		var key = new THREE.DirectionalLight("white", 0.375);
		key.position.set(-2, -1, 0);
		key.name = "Key light";
		lighting.add(key);

		var fill = new THREE.DirectionalLight("white", 0.75);
		fill.position.set(3, 3, 2);
		fill.name = "Fill light";
		lighting.add(fill);

		this.scene.add(lighting);
	};
	
	p.setupModels = function() {
		var geometry = new THREE.BoxGeometry(3, 10, 1);
		var material = new THREE.MeshBasicMaterial({color: 0x72BFCC});
		var dude = new THREE.Mesh(geometry, material);
		this.scene.add(dude);
		
		// plane to fake mirror effect
		var geometry = new THREE.PlaneGeometry(50, 50);
		var material = new THREE.MeshBasicMaterial({color: 0x72BFCC, transparent: true, opacity: 0.8, side: THREE.DoubleSide});
		var plane = new THREE.Mesh(geometry, material);
		plane.rotation.x = THREE.Math.degToRad(-90);
		this.scene.add(plane);
	};
	
	p.setupCamera = function() {
		var fov = 75;
		var aspect = 1;
		var near = 0.1;
		var far = 100;

		this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this.camera.position.z = 20;
		this.camera.position.y = 10;
	};
	
	p.setupControls = function() {
		// this.controls = new THREE.OrbitControls(this.camera, this.canvas);
		// this.controls.target = new THREE.Vector3(0, 4, 0);
	};
	
	p.resizeToContainer = function() {
		var bounds = this.parentElement.getBoundingClientRect();
		this.camera.aspect = bounds.width / bounds.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(bounds.width, bounds.height);
	};
	
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
            // this.controls.update();
            this.renderer.render(this.scene, this.camera);
            
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
		// TODO: add brownian noise?
		this.physics.angle += this.physics.velocity * this.physics.dampening * Math.random();
		this.physics.angle = Math.round(this.physics.angle * 1000) / 1000;
	};
	
	ns.Game = Game;
	
}(window));