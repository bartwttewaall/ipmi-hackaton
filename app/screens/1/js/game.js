(function(ns) {
	
	var Game = function(physics, target) {
		
		this.physics = physics; // should check if not null
		
		this.parentElement = target;
		
		this.dude = null;
		this.falling = false;
		this.dudeAcceleration = 0;
		
		this.ropeSettings = {
			length    : 100,
			thickness : 0.25,
			segments  : 12
		};
		
		this.setupScene();
		this.setupLighting();
		this.setupMaterials();
		this.setupModels();
		this.setupCamera();
		this.setupControls();
		this.setupTools();
		
		this.setupEventHandlers();
		this.resizeToContainer();
		this.loadTextures();
		
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
		this.isRendering = false;
		this.requestID = null;
		
		this.perlin = 0;
	};
	
	var p = Game.prototype;
	
	p.setupEventHandlers = function() {
		window.addEventListener('resize', windowResizeHandler, false);
		
		function windowResizeHandler() {
			resizeToContainer();
		}
	};
	
	p.setupScene = function() {
		this.scene = new THREE.Scene();
		this.scene.fog = new THREE.FogExp2(0x00AACC, 0.0025);
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
		this.renderer.setClearColor(0x000000, 0.5);
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
	
	p.setupMaterials = function() {
		this.dudeBodyMaterial = new THREE.MeshBasicMaterial({color: 0x72BFCC});
		this.ropeMaterial = new THREE.MeshLambertMaterial();
	};
	
	p.setupModels = function() {
		this.dude = new THREE.Object3D();
		this.scene.add(this.dude);
		
		var body = new THREE.Mesh(
			new THREE.BoxGeometry(3, 10, 1),
			this.dudeBodyMaterial
		);
		body.position.set(0, 10/2, 0);
		this.dude.add(body);
		
		var rope = new THREE.Mesh(
			new THREE.CylinderGeometry(this.ropeSettings.thickness, this.ropeSettings.thickness, this.ropeSettings.length, this.ropeSettings.segments),
			this.ropeMaterial
		);
		
		rope.rotation.x = THREE.Math.degToRad(90);
		rope.position.y = 0;
		this.scene.add(rope);
	};
	
	p.loadTextures = function() {
		var ropeTexture = new THREE.TextureLoader().load('/assets/rope.jpg', function(texture) {
			this.ropeMaterial.map = texture;
			this.ropeMaterial.needsUpdate = true;
		}.bind(this));
		
		ropeTexture.wrapS = THREE.RepeatWrapping;
		ropeTexture.wrapT = THREE.RepeatWrapping;
		ropeTexture.repeat.set( 1/8, this.ropeSettings.length/8 );
	};
	
	p.setupCamera = function() {
		var fov = 75;
		var aspect = 1;
		var near = 0.1;
		var far = 200;

		this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this.camera.position.z = 20;
		this.camera.position.y = 10;
	};
	
	p.setupControls = function() {
		this.controls = new THREE.OrbitControls(this.camera, this.canvas);
		this.controls.target = new THREE.Vector3(0, 4, 0);
	};
	
	p.setupTools = function() {
		var stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.zIndex = 100;
		this.parentElement.appendChild(stats.domElement);
		
		var size = 100;
		var divisions = 10;
		var gridHelper = new THREE.GridHelper(size, divisions);
		this.scene.add(gridHelper);
	};
	
	p.resizeToContainer = function() {
		var bounds = this.parentElement.getBoundingClientRect();
		this.camera.aspect = bounds.width / bounds.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(bounds.width, bounds.height);
	};
	
	p.startLoop = function () {
		console.log('start loop');
        this.isRendering = true;
        this.render();
    };

    p.stopLoop = function () {
    	console.log('stop loop');
    	
        // this will stop the render loop on the next frame
        this.isRendering = false;
        if (this.requestID !== null) cancelAnimationFrame(this.requestID);
        this.requestID = null;
    };

    p.renderOnce = function () {
        this.stopLoop();
        this.render();
    };

    p.render = function () {
        if (!this.loading) {
        	
            // keep rendering frames while this.isRendering is true
            if (this.isRendering) {
                if (this.requestID !== null) cancelAnimationFrame(this.requestID);
                this.requestID = requestAnimationFrame(this.render.bind(this));
            }
            
            this.calculatePhysics();
            
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        }
    };
	
	p.gotoScreen = function(name) {
		this.activeIndex = this.screens.findIndex(function(screen) {
			return (screen.name === name);
		});
		console.log('goto screen', name, 'at index:', this.activeIndex);
	};
	
	p.calculatePhysics = function() {
		if (!this.falling) {
			// TODO: add brownian noise?
			this.physics.angle += this.physics.velocity * this.physics.dampening * Math.random();
			this.physics.angle = Math.round(this.physics.angle * 1000) / 1000;
			
			this.dude.rotation.z = THREE.Math.degToRad(this.physics.angle);
		}
		
		this.falling = (this.physics.angle > 45 || this.physics.angle < -45);
		
		if (this.falling) {
			this.dudeAcceleration += -9.81 / 60 / 2;
			this.dude.position.y += this.dudeAcceleration;
		}
	};
	
	ns.Game = Game;
	
}(window));