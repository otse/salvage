import app from "./app.js";
import garbage from "./garbage.js";
import glob from "./lib/glob.js";
import props from "./props.js";
import renderer from "./renderer.js";

namespace sketchup {

	type tuple = [
		path: string,
		normalScale?: number,
		roughness?: number,
		metalness?: number,
		normal?: boolean,
		specular?: boolean,
		transparent?: boolean,
		emissive?: string
	]

	const stickers = ['lockerssplat']

	var matsfig = {}
	var mats = {}

	var scaleToggle = true;

	export async function get_matsfig() {
		let url = 'figs/mats.json';
		let response = await fetch(url);
		const arrSales = await response.json();
		matsfig = arrSales;
	}

	export async function loop() {
		if (glob.developer) {
			if (app.proompt('r') == 1) {
				await get_matsfig();
				await make_materials();
				level_takes_new_mats(levelGroup);
			}
			if (app.proompt('t') == 1) {
				console.log('[t]');
				props.clear();
				renderer.scene.remove(levelGroup);
				await props.boot();
				//await get_matsfig();
				//await make_materials();
				await load_level();
			}
			if (app.proompt('f3') == 1) {
				scaleToggle = !scaleToggle;
				props.clear();
				renderer.scene.remove(levelGroup);
				await props.boot();
				await get_matsfig();
				await make_materials();
				await load_level();
			}
			if (app.proompt('n') == 1) {
				await toggle_normalmap();

			}
		}
	}

	var normalToggle = true;
	async function toggle_normalmap() {
		normalToggle = !normalToggle;
		const funcs: any[] = [];
		for (let name in matsfig) {
			const func = async (name) => {
				const tuple = matsfig[name];
				const mat = mats[name];
				if (!normalToggle)
					mat.normalScale.set(0, 0);
				else
					mat.normalScale.set(tuple[1], -tuple[1]);
			}
			const promise = /*await*/ func(name)
			funcs.push(promise);
		}
		return Promise.all(funcs);
	}

	async function make_materials() {

		/* promises - nero
		*/
		const funcs: any[] = [];

		for (let name in matsfig) {
			const func = async (name) => {
				//console.log('func', name);

				const tuple = matsfig[name];
				const salt = `?x=same`;
				const texture = await <any>createTextureFromImage(`${tuple[0]}.png${salt}`, 8);

				//console.log('name mats', name);

				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
				texture.minFilter = texture.magFilter = THREE.LinearFilter;

				const mat = new THREE.MeshPhysicalMaterial({
					name: name,
					map: texture
				});
				// material.clearcoat = 1.0;
				mat.roughness = tuple[2];
				mat.metalness = tuple[3];
				mat.clearCoat = 0.5;
				mat.iridescence = 0.15;

				if (tuple[7]) {
					mat.emissive = new THREE.Color('white');
					console.log(' emissive ');
				}
				if (tuple[4] && true) {
					const texture = await <any>createTextureFromImage(`${tuple[0]}_normal.png${salt}`, 2);
					texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
					if (!normalToggle)
						mat.normalScale.set(0, 0);
					else
						mat.normalScale.set(tuple[1], -tuple[1]);
					mat.normalMap = texture;
				}
				if (tuple[5] && false) {
					const texture = await <any>createTextureFromImage(`${tuple[0]}_specular.png${salt}`, 4);
					texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
					//material.specularMap = texture;
				}
				mat.onBeforeCompile = (shader) => {
					console.warn('onbeforecompile');
					shader.defines = { SAT: '', xREDUCE: '', xRESAT: '', REREDUCE: '' };
					shader.fragmentShader = shader.fragmentShader.replace(
						`#include <tonemapping_fragment>`,
						`#include <tonemapping_fragment>

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
					`
					);
				}
				mat.customProgramCacheKey = function () {
					return 'clucked';
				}
				//material.specular?.set(0.1, 0.1, 0.1);
				//material.shininess = tuple[1] || 30;
				mats[name] = mat;
			};
			const promise = /*await*/ func(name)
			funcs.push(promise);
		}
		return Promise.all(funcs);
	}

	const downscale = true;

	const createTextureFromImage = async (imageUrl, scale) => {
		return new Promise(async resolve => {
			if (!scaleToggle)
				scale = 1;
			if (!downscale)
				resolve(await new THREE.TextureLoader().loadAsync(imageUrl));
			else {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d')!;
				const texture = new THREE.CanvasTexture(canvas);

				new THREE.ImageLoader().loadAsync(imageUrl).then((image) => {
					console.log('from', image.width, image.height, 'to', image.width / scale, image.height / scale);

					canvas.width = image.width / scale;
					canvas.height = image.height / scale;

					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

					resolve(texture);
				});
			}
		});
	}

	export async function boot() {
		const maxAnisotropy = renderer.renderer.capabilities.getMaxAnisotropy();
		await get_matsfig();
		await make_materials();
		await load_level();
	}

	function fix_sticker(material) {
		console.warn(' fix sticker ', material);

		material.transparent = true;
		material.polygonOffset = true;
		material.polygonOffsetFactor = -1;
		material.polygonOffsetUnits = 1;
		material.needsUpdate = true;
	}

	export function adapt_color(color) {
		for (const i in mats) {
			const mat = mats[i];
			mat.color = new THREE.Color(color);
		}
	}

	function object_takes_mat(object, index) {
		const current = index == -1 ? object.material : object.material[index];
		const mat = mats[current.name];
		if (!mat)
			return;
		if (index == -1)
			object.material = mat;
		else
			object.material[index] = mat;
		if (stickers.includes(current.name))
			fix_sticker(mat);
	}

	let levelGroup;

	export function level_takes_new_mats(scene) {
		function traversal(object) {
			if (object.material) {
				if (!object.material.length) {
					object_takes_mat(object, -1);
				}
				else {
					for (let index in object.material) {
						object_takes_mat(object, index);
					}
				}
			}
		}
		scene.traverse(traversal);
	}

	export async function load_level_config(name) {
		let url = `./assets/${name}.json`;
		let response = await fetch(url);
		const arrSales = await response.json();
		return arrSales;
	}

	export async function load_level() {

		const name = glob.level;

		//await new Promise(resolve => setTimeout(resolve, 200));

		const loadingManager = new THREE.LoadingManager(function () {
		});

		const colladaLoader = new ColladaLoader(loadingManager);
		const levelConfig = await load_level_config(name);

		props.presets = Object.assign(props.presets, levelConfig);

		await colladaLoader.loadAsync(`./assets/${name}.dae`).then((collada) => {

			const scene = collada.scene;

			scene.updateMatrix();
			scene.updateMatrixWorld(); // without this everything explodes

			console.log(' collada scene ', scene);

			const queue: props.prop[] = [];

			function find_make_props(object) {
				object.castShadow = true;
				object.receiveShadow = true;
				const prop = props.factory(object);
				if (prop)
					queue.push(prop);
			}

			scene.traverse(find_make_props);

			level_takes_new_mats(scene);

			for (let prop of queue)
				prop.complete();

			const group = new THREE.Group();
			group.add(scene);

			renderer.scene.add(group);

			levelGroup = group;
		});

	}
}

export default sketchup;