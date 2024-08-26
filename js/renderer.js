import app from "./app.js";
var renderer;
(function (renderer_1) {
    // set up three.js here
    renderer_1.dt = 0;
    renderer_1.sunOffset = [0, 10, -0]; // [1.0, 10, -1.0]
    // reduce
    renderer_1.lets_pulse = false;
    renderer_1.animate_bounce_hdr = false;
    renderer_1.ren_stats = false;
    function boot() {
        window['renderer'] = this;
        console.log('renderer boot');
        THREE.ColorManagement.enabled = true;
        renderer_1.clock = new THREE.Clock();
        renderer_1.propsGroup = new THREE.Group();
        renderer_1.propsGroup.updateMatrix();
        renderer_1.propsGroup.updateMatrixWorld();
        renderer_1.scene = new THREE.Scene();
        renderer_1.scene.add(renderer_1.propsGroup);
        renderer_1.scene.background = new THREE.Color('green');
        renderer_1.scene.fog = new THREE.Fog(0x131c1d, 7, 20);
        renderer_1.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer_1.camera.rotation.y = -Math.PI / 2;
        renderer_1.camera.position.y = 1.5;
        renderer_1.camera.position.z = 5;
        renderer_1.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        //renderer.autoClear = false;
        renderer_1.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer_1.renderer.toneMappingExposure = 4.5;
        renderer_1.renderer.setPixelRatio(window.devicePixelRatio);
        renderer_1.renderer.setSize(window.innerWidth, window.innerHeight);
        renderer_1.renderer.setAnimationLoop(app.base_loop);
        renderer_1.renderer.xr.setFramebufferScaleFactor(1); // :x
        renderer_1.renderer.shadowMap.enabled = true;
        renderer_1.renderer.xr.enabled = true;
        //renderer.xr.cameraAutoUpdate = false;
        renderer_1.renderer.shadowMap.type = THREE.BasicShadowMap; //PCFShadowMap;
        //renderer.setClearColor(0xffffff, 0.0);
        const percent = 2 / 100;
        renderer_1.ambiance = new THREE.AmbientLight(0xffffff, percent);
        renderer_1.scene.add(renderer_1.ambiance);
        renderer_1.sun = new THREE.DirectionalLight(0xd0d69b, 0.7);
        //sun.castShadow = true;
        renderer_1.sun.shadow.mapSize.width = 2048;
        renderer_1.sun.shadow.mapSize.height = 2048;
        renderer_1.sun.shadow.radius = 2;
        renderer_1.sun.shadow.bias = 0.0005;
        renderer_1.sun.shadow.camera.near = 0.5;
        renderer_1.sun.shadow.camera.far = 500;
        renderer_1.sun.shadow.camera.left = renderer_1.sun.shadow.camera.bottom = -15;
        renderer_1.sun.shadow.camera.right = renderer_1.sun.shadow.camera.top = 15;
        renderer_1.sun.position.fromArray(renderer_1.sunOffset);
        //scene.add(sun);
        //scene.add(sun.target);
        // scene.add(new THREE.CameraHelper(sun.shadow.camera));
        document.querySelector('salvage-body').appendChild(renderer_1.renderer.domElement);
        window.addEventListener('resize', onWindowResize);
    }
    renderer_1.boot = boot;
    function onWindowResize() {
        renderer_1.camera.aspect = window.innerWidth / window.innerHeight;
        renderer_1.camera.updateProjectionMatrix();
        renderer_1.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    renderer_1.onWindowResize = onWindowResize;
    var prevTime = 0, time = 0, frames = 0;
    renderer_1.fps = 0;
    function loop_and_render() {
        /*
        const jump_sun_every = 1;
        let xz = [camera.position.x, camera.position.z] as vec2;
        let div = pts.divide(xz, jump_sun_every);
        xz = pts.mult(pts.floor(div), jump_sun_every);
        //xz = pts.mult(xz, hunt.inchMeter);

        //console.log('zx', xz);

        sun.position.fromArray([xz[0] + sunOffset[0], sunOffset[1], xz[1] + sunOffset[2]]);
        sun.target.position.fromArray([xz[0], 0, xz[1]]);
        */
        renderer_1.dt = renderer_1.clock.getDelta();
        // if we run sub 10 fps, pretend it's 10
        // this prevents huge dt of seconds, minutes, hours
        // if your fps is very low, the game will appear to be in slow motion
        const min_dt = 1.0 / 10.0;
        renderer_1.dt = renderer_1.dt > min_dt ? min_dt : renderer_1.dt;
        frames++;
        time = (performance || Date).now();
        if (time >= prevTime + 1000) {
            renderer_1.fps = (frames * 1000) / (time - prevTime);
            prevTime = time;
            frames = 0;
            if (renderer_1.ren_stats) {
                app.fluke_set_innerhtml('salvage-stats', `
					fps: ${renderer_1.fps.toFixed(1)}<br />
					bounce hdr: ${(renderer_1.animate_bounce_hdr)}<br />
			`);
            }
        }
        /*
        if (lets_pulse) {
            const pulse_cycle = 4;
            glitch += dt / (pulse_cycle / 2);
            if (glitch >= 2)
                glitch -= 2;
            let itch = easings.easeOutBounce(glitch <= 1 ? glitch : 2 - glitch);
            renderer.toneMappingExposure = 5.5 + itch;
        }
        */
        //renderer.xr.updateCamera( camera );
        renderer_1.renderer.render(renderer_1.scene, renderer_1.camera);
    }
    renderer_1.loop_and_render = loop_and_render;
})(renderer || (renderer = {}));
export default renderer;
