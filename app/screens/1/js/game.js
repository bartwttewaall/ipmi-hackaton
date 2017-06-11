(function(ns) {
	
	var Game = function(physics, target) {
		
		this.started = new signals.Signal();
		this.edging = new signals.Signal();
		this.recovered = new signals.Signal();
		this.falling = new signals.Signal();
		this.ended = new signals.Signal();
		
		this.physics = physics; // should check if not null
		
		this.wind = {
			amp: Math.PI/4,
			freq: 1/60,
			frame: 0,
			phase: 0,
			value: 0,
		};
		
		this.parentElement = target;
		
		this.loading = false;
		this.isRendering = false;
		this.requestID = null;
		this.endDelay = 5000;
		
		this.distance = 0;
		this.score = 0;
		
		this.scoreTable = document.querySelector('table');
		
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
		
		this.loadSounds();
		
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
	};
	
	var p = Game.prototype;
	
	p.setupEventHandlers = function() {
		window.addEventListener('resize', this.resizeToContainer.bind(this), false);
	};
	
	p.setupScene = function() {
		this.scene = new THREE.Scene();
		this.scene.fog = new THREE.FogExp2(0x00AACC, 0.0025);
		
		this.canvas = document.createElement('canvas');
		this.canvas.id = "gameCanvas";
		
		if (!!this.parentElement.firstChild) {
			this.parentElement.insertBefore(this.canvas, this.parentElement.firstChild);
		} else {
			this.parentElement.appendChild(this.canvas);
		}
		
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

		var key = new THREE.DirectionalLight("white", 3);
		key.position.set(-2, -1, 0);
		key.name = "Key light";
		lighting.add(key);

		var fill = new THREE.DirectionalLight("white", 1.20);
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
		
		/*//
		var dudeLoader = new THREE.ObjectLoader();
		dudeLoader.load(
			'assets/model2.json',
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
		
		//*//
		var dudeLoader = new THREE.FBXLoader();
		dudeLoader.load(
			'assets/testpoppen101.FBX',
			//'assets/model5.FBX',
			function( model ) {
				this.mixer = new THREE.AnimationMixer(model);
                this.mixer.clipAction(model.animations[0]).play();
                this.mixer.timeScale = 0.001;
                
                model.scale.set(3,3,3);
                
                model.children.forEach(function(mesh) {
                	if (typeof mesh.material !== 'undefined' && mesh.material.name === 'printplaat') {
                		var loader = new THREE.TextureLoader().load('assets/printplaat.png', function(texture) {
							mesh.material.color.set('#FFFFFF');
							mesh.material.map = texture;
							mesh.material.needsUpdate = true;
						}.bind(this));
                	}
                });
                
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
		this.camera.position.set(0, 1, 15);
	};
	
	p.setupControls = function() {
		this.controls = new THREE.OrbitControls(this.camera, this.canvas);
		this.controls.target = new THREE.Vector3(0, 4, 0);
	};
	
	p.loadSounds = function() {
		this.sounds = [];
		
		this.startSound = new Audio('assets/intro/door lock.wav');
		this.sounds.push(this.startSound);
		
		this.growSound = new Audio('assets/intro/counter up.wav');
		this.sounds.push(this.growSound);
		
		this.shrinkSound = new Audio('assets/intro/counter down.wav');
		this.sounds.push(this.shrinkSound);
		
		this.windSound = new Audio('assets/game/07 Blustery wind through fence.mp3');
		this.sounds.push(this.windSound);
		
		this.dudeSound = new Audio('assets/intro/de man.wav');
		this.sounds.push(this.dudeSound);
		
		this.fallSound = new Audio('assets/239900__thesubber13__scream-1.ogg');
		this.sounds.push(this.fallSound);
		
		this.endSound = new Audio('assets/game/11 Light Entertainment Audience, Lau.wav');
		this.sounds.push(this.endSound);
		
		this.started.add(function() {
			this.startSound.play();
			this.playAndLoopAudio(this.windSound);
        	this.playAndLoopAudio(this.dudeSound);
		}.bind(this));
		
		this.edging.add(function() {
			//this.crowdOohSound.play();
		}.bind(this));
		
		this.recovered.add(function() {
			//this.crowdYaySound.play();
		}.bind(this));
		
		this.falling.add(function() {
			this.dudeSound.pause();
			this.fallSound.play();
		}.bind(this));
		
		this.ended.add(function() {
			this.stopAllSounds();
			this.endSound.play();
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
        this.isRendering = true;
        this.render();
        
        this.started.dispatch();
    };
    
    p.stopLoop = function () {
        // this will stop the render loop on the next frame
        this.isRendering = false;
        if (this.requestID !== null) cancelAnimationFrame(this.requestID);
        this.requestID = null;
    };

    p.renderOnce = function () {
        this.stopLoop();
        this.render();
    };
    
    p.time = Date.now();
    
    p.render = function () {
        if (!this.loading) {
        	
        	var dt = 0;
        	
            // keep rendering frames while this.isRendering is true
            if (this.isRendering) {
                if (this.requestID !== null) cancelAnimationFrame(this.requestID);
                this.requestID = requestAnimationFrame(this.render.bind(this));
                
                var current = Date.now();
                dt = current - p.time;
                p.time = current;
            }
            
            if (!!this.mixer) this.mixer.update(dt);
            this.calculatePhysics();
            this.calculateScore();
            
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        }
    };
	
	p.calculatePhysics = function() {
		
		this.distance += this.forwardVelocity * 10;
		
		var difficulty = (400 + this.distance * 10) / 1000;
		this.wind.value = this.wind.amp * 2 * difficulty * Math.sin(this.wind.freq * difficulty * ++this.wind.frame + this.wind.phase);
		
		if (!!this.ropeMaterial.map) {
			this.ropeMaterial.map.offset.y = (this.ropeMaterial.map.offset.y + this.forwardVelocity) % 1;
		}
		
		if (!this.isFalling) {
			// TODO: add brownian noise?
			this.physics.velocity *= 0.98;
			this.physics.angle += this.wind.value;
			this.physics.angle -= this.physics.velocity;
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
					this.ended.dispatch();
				}.bind(this), this.endDelay);
			}
		}
	};
	
	p.calculateScore = function() {
		var scoreElement = document.querySelector('#game #score');
		
		if (!this.isFalling) {
			this.score = Math.max(0, Math.min(Math.round(this.distance), 999));
		} else {
			scoreElement.classList.add('final');
		}
		
		var pad = "000";
		var str = this.score.toString();
		str = pad.substring(0, pad.length - str.length) + str;
		
		var cells = document.querySelectorAll('#game #score td');
		cells[0].innerText = str.charAt(0);
		cells[1].innerText = str.charAt(1);
		cells[2].innerText = str.charAt(2);
		cells[3].innerText = 'm';
	};
	
	p.resetGame = function() {
		this.isFalling = false;
		this.fallingVelocity = 0;
		
		this.physics.velocity = 0;
		this.physics.angle = 0;
		
		this.distance = 0;
		
		this.dude.position.set(0, 0, 0);
		this.dude.rotation.set(0, 0, 0);
		
		var scoreElement = document.querySelector('#game #score');
		if (!!scoreElement.classList) scoreElement.classList.remove('final');
	};
	
	ns.Game = Game;
	
}(window));