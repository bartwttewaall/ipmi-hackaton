(function(ns) {
	
	var Game = function(physics, target) {
		
		this.edging = new signals.Signal();
		this.recovered = new signals.Signal();
		this.falling = new signals.Signal();
		
		this.physics = physics; // should check if not null
		
		this.parentElement = target;
		
		this.loading = false;
		this.isRendering = false;
		this.requestID = null;
		
		this.distance = 0;
		this.score = 0;
		this.scoreLabel = document.querySelector('#gameScore');
		this.scoreLabel.innerText = this.score + ' m';
		
		this.resetTimeoutId = -1;
		this.dude = null;
		
		this.isFalling = false;
		this.fallingAcceleration = -9.81 / 60 / 4;
		this.fallingVelocity = 0;
		
		this.forwardVelocity = 0.002;
		
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
		// this.setupTools();
		
		this.setupEventHandlers();
		this.resizeToContainer();
		this.loadTextures();
		this.loadSounds();
		
		this.activeIndex = 0;
		this.screens = [
			{name: 'idle'},
			{name: 'start'},
			{name: 'countdown'},
			{name: 'game'},
			{name: 'gameover'},
			{name: 'restart'},
		];
	};
	
	var p = Game.prototype;
	
	p.setupEventHandlers = function() {
		window.addEventListener('resize', this.resizeToContainer.bind(this), false);
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
		
		//*//
		var dudeLoader = new THREE.ObjectLoader();
		dudeLoader.load('assets/model2.json',
			function ( model ) {
				console.log(model);
				this.dude.add(model);
				
			}.bind(this),

			function ( xhr ) {
				console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
			}.bind(this),

			// Function called when download errors
			function ( xhr ) {
				console.error( 'An error happened', xhr );
			}.bind(this)
		);
		//*/
		
		/*//
		var dudeLoader = new THREE.OBJLoader2();
		dudeLoader.load('assets/testpop1.obj',
			function ( model ) {
				this.dude.add(model);
			}.bind(this),

			function ( xhr ) {
				console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
			}.bind(this),

			// Function called when download errors
			function ( xhr ) {
				console.error( 'An error happened', xhr );
			}.bind(this)
		);
		//*/
		
		/*//
		var dudeLoader = new THREE.FBXLoader();
		dudeLoader.load('assets/testpop2.FBX',
			function(result) {
				console.log('loaded model:', result);
			}.bind(this),

			function ( xhr ) {
				console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
			}.bind(this),

			// Function called when download errors
			function ( xhr ) {
				console.error( 'An error happened', xhr );
			}.bind(this)
		);
		//*/
		
		var rope = new THREE.Mesh(
			new THREE.CylinderGeometry(this.ropeSettings.thickness, this.ropeSettings.thickness, this.ropeSettings.length, this.ropeSettings.segments),
			this.ropeMaterial
		);
		
		rope.rotation.x = THREE.Math.degToRad(90);
		rope.position.y = 0;
		this.scene.add(rope);
	};
	
	p.loadTextures = function() {
		var ropeTexture = new THREE.TextureLoader().load('assets/rope.jpg', function(texture) {
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
		this.camera.position.set(1, 5, 15);
	};
	
	p.setupControls = function() {
		this.controls = new THREE.OrbitControls(this.camera, this.canvas);
		this.controls.target = new THREE.Vector3(0, 4, 0);
	};
	
	p.loadSounds = function() {
		// loadAudio('assets/169233__mlteenie__crowd-yay.wav').then(function (buffer) {
		// 	console.log(buffer) // => <AudioBuffer>
		// });
		
		this.sounds = [];
		
		this.wind = new Audio('assets/game/07 Blustery wind through fence.mp3');
		this.sounds.push(this.wind);
		this.playAndLoopAudio(this.wind);

		this.crowdSound = new Audio('assets/169233__mlteenie__crowd-yay.wav');
		this.sounds.push(this.crowdSound);
		
		this.fallSound = new Audio('assets/239900__thesubber13__scream-1.ogg');
		this.sounds.push(this.fallSound);
		
		console.log(this.wind);
		
		this.edging.add(function() {
			//this.crowdSound.play();
		}.bind(this));
		
		this.recovered.add(function() {
			this.crowdSound.play();
		}.bind(this));
		
		this.falling.add(function() {
			this.fallSound.play();
		}.bind(this));
	};
	
	p.playAndLoopAudio = function(audio) {
		audio.addEventListener('ended', function() {
			this.currentTime = 0;
			this.play();
		}, false);
		audio.play();
	};
	
	p.stopAllSounds = function() {
		this.sounds.forEach(function(sound) {
			sound.pause();
			sound.currentTime = 0;
		});
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
            this.calculateScore();
            
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
		
		this.distance += this.forwardVelocity * 10;
		
		if (!!this.ropeMaterial.map) {
			this.ropeMaterial.map.offset.y = (this.ropeMaterial.map.offset.y + this.forwardVelocity) % 1;
		}
		
		if (!this.isFalling) {
			// TODO: add brownian noise?
			this.physics.velocity = this.physics.velocity * 0.98;
			this.physics.angle += this.physics.velocity;
			
			this.physics.angle *=  0.98; // recover the angle
			
			this.dude.rotation.z = THREE.Math.degToRad(this.physics.angle);
		}
		
		if (!this.isFalling && (this.physics.angle > 45 || this.physics.angle < -45)) {
			this.isFalling = true;
			this.falling.dispatch();
		}
		
		if (this.isFalling) {
			this.fallingVelocity += this.fallingAcceleration;
			this.dude.position.y += this.fallingVelocity;
			
			if (this.resetTimeoutId < 0) {
				// restart the game after a delay
				this.resetTimeoutId = setTimeout(function() {
					this.resetGame();
					this.resetTimeoutId = -1;
				}.bind(this), 2000);
			}
		}
	};
	
	p.calculateScore = function() {
		if (!this.isFalling) {
			this.score = Math.round(this.distance);
		}
		
		this.scoreLabel.innerText = this.score + ' m';
	};
	
	p.resetGame = function() {
		console.log('resetGame');
		
		this.isFalling = false;
		this.fallingVelocity = 0;
		
		this.physics.velocity = 0;
		this.physics.angle = 0;
		
		this.distance = 0;
		
		this.dude.position.set(0, 0, 0);
		this.dude.rotation.set(0, 0, 0);
		
	};
	
	ns.Game = Game;
	
}(window));