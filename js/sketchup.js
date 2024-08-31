import app from "./app.js";
import glob from "./lib/glob.js";
import props from "./props.js";
import renderer from "./renderer.js";
var sketchup;
(function (sketchup) {
    // don't convert this to object literals
    const paths = {
        'ebony': ['./assets/textures/black', 0.5, 0, 0, false, false],
        'crete1': ['./assets/textures/crete1', 0.5, 0, 0, false, false],
        'crete2': ['./assets/textures/crete2', 0.5, 0, 0, false, false],
        'brick1': ['./assets/textures/brick1', 0.5, 0, 0, false, true],
        'bulkhead1': ['./assets/textures/bulkhead1', 0.5, 0.3, 0.1, true, true, true],
        'floor1': ['./assets/textures/floor1', 0.5, 0, 0, true],
        'floor2': ['./assets/textures/floor2', 0.5, 0.8, 0, false],
        'metrofloor1': ['./assets/textures/metrofloor1', 0.5, 2, 0, false],
        'metal2': ['./assets/textures/metal2', 0.5, 0, 0, true, false, false],
        'metal2b': ['./assets/textures/metal2b', 0.5, 0, 0, true, false, false],
        'metal3': ['./assets/textures/metal3', 0.5, 0, 0, false, false, true],
        'rust1': ['./assets/textures/rust1', 0.5, 0, 0, false, false, false],
        'singletonewall': ['./assets/textures/singletonewall', 0.5, 5, 0, false, false],
        'twotonewall': ['./assets/textures/twotonewall', 1.0, 0.6, 0, true, true],
        'twotonewall_var': ['./assets/textures/twotonewall_var', 1.0, 0.6, 0, true, false],
        'bunkerwall': ['./assets/textures/bunkerwall', 0.5, 0, 0.0, true, false],
        'bunkerwall_var': ['./assets/textures/bunkerwall_var', 0.5, 0, 0.0, true, false],
        'scrappyfloor': ['./assets/textures/scrappyfloor', 0.1, 0.1, 0.1, true, false],
        'rustydoorframe': ['./assets/textures/rustydoorframe', 0.5, 0, 0, false, false],
        'barrel1': ['./assets/textures/barrel1', 0.5, 0, 0, true, false],
        'locker1': ['./assets/textures/locker1', 0.5, 0, 0, false, false],
        'lockerssplat': ['./assets/textures/lockerssplat', 0.5, 0, 0, false, false],
        'door1': ['./assets/textures/door1', 0.5, 0, 0, false, false],
        'grate1': ['./assets/textures/grate1', 0.5, 0, 0, false, false, true],
        'grate2': ['./assets/textures/grate2', 0.5, 0, 0, false, false, true],
        'fakesun': ['./assets/textures/fakesun', 0.5, 0, 0, false, false, false, 'white'],
    };
    const stickers = ['lockerssplat'];
    const library = {};
    var scaleToggle = true;
    async function loop() {
        if (glob.developer) {
            if (app.proompt('r') == 1) {
                await reload_textures();
                steal_from_library(levelGroup);
            }
            if (app.proompt('t') == 1) {
                props.clear();
                renderer.scene.remove(levelGroup);
                await props.boot();
                await load_room();
            }
            if (app.proompt('f3') == 1) {
                scaleToggle = !scaleToggle;
                await reload_textures();
                steal_from_library(levelGroup);
            }
            if (app.proompt('m') == 1) {
            }
        }
    }
    sketchup.loop = loop;
    async function reload_textures() {
        for (let name in paths) {
            const existing = library[name];
            const tuple = paths[name];
            let randy = `?x=${Math.random()}`;
            const texture = await createTextureFromImage(`${tuple[0]}.png`, 8);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.minFilter = texture.magFilter = THREE.LinearFilter;
            const material = new THREE.MeshPhysicalMaterial({
                name: name,
                map: texture
            });
            material.roughness = tuple[2];
            material.metalness = tuple[3];
            material.clearCoat = 0.5;
            material.iridescence = 0.2;
            if (tuple[7]) {
                material.emissive = new THREE.Color('white');
                console.log(' emissive ');
            }
            if (tuple[4]) {
                const texture = await createTextureFromImage(`${tuple[0]}_normal.png`, 2);
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                material.normalScale.set(tuple[1], -tuple[1]);
                material.normalMap = texture;
            }
            if (tuple[5]) {
                const texture = await createTextureFromImage(`${tuple[0]}_specular.png`, 4);
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                //material.specularMap = texture;
            }
            material.onBeforeCompile = (shader) => {
                console.warn('onbeforecompile');
                shader.defines = { SAT: '', xREDUCE: '', xRESAT: '', REREDUCE: '' };
                shader.fragmentShader = shader.fragmentShader.replace(`#include <tonemapping_fragment>`, `#include <tonemapping_fragment>

					vec3 lumaWeights = vec3(.25,.50,.25);

					vec3 grey;
					float sat = 3.0;
					float reduce = 100.0;
					float resat = 2.0;
					float rereduce = 100.0;

					//vec3 diffuse = material.diffuseColor.rgb;
					vec3 diffuse = gl_FragColor.rgb;

					#ifdef SAT
					grey = vec3(dot(lumaWeights, diffuse.rgb));
					diffuse = vec3(grey + sat * (diffuse.rgb - grey));
					#endif

					#ifdef REDUCE
					diffuse *= reduce;
					diffuse = vec3( ceil(diffuse.r), ceil(diffuse.g), ceil(diffuse.b) );
					diffuse /= reduce;
					#endif

					#ifdef RESAT
					grey = vec3(dot(lumaWeights, diffuse.rgb));
					diffuse = vec3(grey + resat * (diffuse.rgb - grey));
					#endif

					#ifdef REREDUCE
					diffuse *= rereduce;
					diffuse = vec3( ceil(diffuse.r), ceil(diffuse.g), ceil(diffuse.b) );
					diffuse /= rereduce;
					#endif

					// when at before lighting pass
					//material.diffuseColor.rgb = diffuse.rgb;

					// when at tone mapping pass
					gl_FragColor.rgb = diffuse.rgb;
					`);
            };
            material.customProgramCacheKey = function () {
                return 'clucked';
            };
            //material.specular?.set(0.1, 0.1, 0.1);
            //material.shininess = tuple[1] || 30;
            library[name] = material;
        }
    }
    const downscale = true;
    const createTextureFromImage = async (imageUrl, scale) => {
        return new Promise(async (resolve) => {
            if (!scaleToggle)
                scale = 1;
            if (!downscale)
                return new THREE.TextureLoader().load(imageUrl);
            else {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const texture = new THREE.CanvasTexture(canvas);
                await new THREE.ImageLoader().load(imageUrl, image => {
                    console.log('from', image.width, image.height, 'to', image.width / scale, image.height / scale);
                    canvas.width = image.width / scale;
                    canvas.height = image.height / scale;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    resolve(texture);
                });
            }
        });
    };
    async function boot() {
        const maxAnisotropy = renderer.renderer.capabilities.getMaxAnisotropy();
        await reload_textures();
        await load_room();
    }
    sketchup.boot = boot;
    function fix_sticker(material) {
        console.warn(' fix sticker ', material);
        material.transparent = true;
        material.polygonOffset = true;
        material.polygonOffsetFactor = -1;
        material.polygonOffsetUnits = 1;
        material.needsUpdate = true;
    }
    function adapt_from_materials_library(object, index) {
        const current = index == -1 ? object.material : object.material[index];
        const material = library[current.name];
        if (!material)
            return;
        if (index == -1)
            object.material = material;
        else
            object.material[index] = material;
        if (stickers.includes(current.name))
            fix_sticker(material);
    }
    let levelGroup;
    function steal_from_library(scene) {
        function traversal(object) {
            if (object.material) {
                if (!object.material.length) {
                    adapt_from_materials_library(object, -1);
                }
                else {
                    for (let index in object.material) {
                        adapt_from_materials_library(object, index);
                    }
                }
            }
        }
        scene.traverse(traversal);
    }
    sketchup.steal_from_library = steal_from_library;
    async function load_room() {
        return new Promise(async (resolve, reject) => {
            await new Promise(resolve => setTimeout(resolve, 200));
            const loadingManager = new THREE.LoadingManager(function () {
            });
            const colladaLoader = new ColladaLoader(loadingManager);
            colladaLoader.load('./assets/gen.dae', function (collada) {
                const scene = collada.scene;
                scene.updateMatrix();
                scene.updateMatrixWorld(); // without this everything explodes
                console.log(' collada scene ', scene);
                //scene.scale.set(1, 1, 1);
                //scene.position.set(-garbage.inch, 0, 0);
                const queue = [];
                function find_make_props(object) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    const prop = props.factory(object);
                    if (prop)
                        queue.push(prop);
                }
                scene.traverse(find_make_props);
                steal_from_library(scene);
                for (let prop of queue)
                    prop.complete();
                const group = new THREE.Group();
                group.add(scene);
                renderer.scene.add(group);
                levelGroup = group;
                resolve(1);
            });
        });
    }
    sketchup.load_room = load_room;
})(sketchup || (sketchup = {}));
export default sketchup;
