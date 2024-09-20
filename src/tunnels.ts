// this is the lod
// every other tunnel is culled
// works intensively with the props system to group props and handle visibility

import common from "./common.js";
import garbage from "./garbage.js";
import renderer from "./renderer.js";

namespace tunnels {
	export var currentTunnel;

	export function clear() {
		for (const tunnel of tunnels)
			tunnel.cleanup();
		tunnels = [];
	}

	export function find_make_tunnels(scene) {
		function finder(object) {
			// ugly guard clause
			if (!object.name)
				return;
			const [kind, name, hint] = object.name?.split('_');
			if (kind === 'tunnel')
				new tunnel(object, name);
		}
		scene.traverse(finder);

		neighbors();
	}

	function neighbors() {
		for (const tunnel of tunnels)
			tunnel.boring();
	}

	var tunnels: tunnel[] = []

	export class tunnel {
		aabb
		aabb2
		neighbors: tunnel[] = []
		debugBox
		constructor(public readonly object, public readonly name) {
			tunnels.push(this);
			this.measure();
			this.debugBox = new common.debug_box(this, 'green', true);
			renderer.scene.add(this.debugBox.mesh);
		}
		protected measure() {
			this.object.updateMatrix();
			this.object.updateMatrixWorld();
			this.aabb = new THREE.Box3();
			this.aabb.setFromObject(this.object, true);
			this.aabb2 = new THREE.Box3().copy(this.aabb);
			this.aabb2.expandByScalar(0.1);
		}
		boring() {
			for (const tunnel of tunnels) {
				if (this === tunnel)
					continue;
				if (this.aabb2.intersectsBox(tunnel.aabb2))
					this.neighbors.push(tunnel);
			}
		}
		cleanup() {
			// tunnels.splice(tunnels.indexOf(this), 1);
		}
	}

	export function loop() {
		const aabb = garbage.gplayer.aabb;

		for (const tunnel of tunnels) {
			if (tunnel.aabb.intersectsBox(aabb)) {
				console.log('we are in tunnel', tunnel.name);
				break;
			}
		}
	}
}

export default tunnels;