// this is the lod
// every other tunnel is culled
// works intensively with the props system to group props and handle visibility
import common from "./common.js";
import garbage from "./garbage.js";
import toggle from "./lib/toggle.js";
import props from "./props.js";
var tunnels;
(function (tunnels_1) {
    const arbitrary_expand = 0.1;
    function clear() {
        for (const tunnel of tunnels_1.tunnels)
            tunnel.cleanup();
        tunnels_1.tunnels = [];
        tunnels_1.currentTunnel = undefined;
    }
    tunnels_1.clear = clear;
    function loop() {
        for (const tunnel of tunnels_1.tunnels) {
            if (tunnel.check())
                break;
        }
    }
    tunnels_1.loop = loop;
    function findMakeTunnels(scene) {
        function finder(object) {
            if (!object.name)
                return;
            const [kind, name, hint] = object.name?.split('_');
            if (kind === 'tunnel')
                new tunnel(object, name);
        }
        scene.traverse(finder);
        for (const tunnel of tunnels_1.tunnels) {
            tunnel.findAdjacentTunnels();
        }
    }
    tunnels_1.findMakeTunnels = findMakeTunnels;
    tunnels_1.tunnels = [];
    class tunnel extends toggle {
        object;
        name;
        static visibleTunnels = new Set();
        aabb;
        expandedAabb;
        // Single array for all props that intersect with this tunnel
        props = [];
        adjacentTunnels = [];
        debugBox;
        constructor(object, name) {
            super();
            this.object = object;
            this.name = name;
            this.object.visible = false;
            this.object.frustumCulled = true;
            tunnels_1.tunnels.push(this);
            this.measure();
            this.debugBox = new common.debug_box(this, 'green', true);
            this.gatherProps();
        }
        gatherProps() {
            for (const prop of props.props) {
                if (prop.aabb && this.aabb.intersectsBox(prop.aabb)) {
                    this.props.push(prop);
                }
            }
            console.log(this.name, 'collected', this.props.length, 'props');
        }
        show() {
            if (this.on()) {
                console.warn(`Oops: Tunnel ${this.name} is already showing.`);
                return;
            }
            tunnel.visibleTunnels.add(this);
            this.object.visible = true;
            for (const prop of this.props) {
                prop.show();
            }
        }
        hide(newTunnels) {
            if (this.off()) {
                console.warn(`Oops: Tunnel ${this.name} is already hidden.`);
                return;
            }
            this.object.visible = false;
            tunnel.visibleTunnels.delete(this);
            for (const prop of this.props) {
                // Only hide if no new tunnel has this prop
                if (!Array.from(newTunnels).some(t => t.props.includes(prop))) {
                    prop.hide();
                }
            }
        }
        measure() {
            this.aabb = new THREE.Box3().setFromObject(this.object, true);
            this.expandedAabb = this.aabb.clone().expandByScalar(arbitrary_expand);
        }
        findAdjacentTunnels() {
            for (const tunnel of tunnels_1.tunnels) {
                if (this === tunnel)
                    continue;
                if (this.expandedAabb.intersectsBox(tunnel.expandedAabb))
                    this.adjacentTunnels.push(tunnel);
            }
        }
        cleanup() {
        }
        check() {
            if (!this.expandedAabb.intersectsBox(garbage.gplayer.aabb))
                return false;
            // Get all tunnels we're currently inside
            const activeTunnels = tunnels_1.tunnels.filter(t => t.expandedAabb.intersectsBox(garbage.gplayer.aabb));
            // Get all adjacent tunnels to our active set
            const newTunnels = [...new Set([
                    ...activeTunnels,
                    ...activeTunnels.flatMap(t => t.adjacentTunnels)
                ])];
            // Compare against currently visible tunnels
            for (const t of tunnel.visibleTunnels) {
                if (!newTunnels.includes(t)) {
                    t.hide(newTunnels);
                }
            }
            for (const t of newTunnels) {
                if (!tunnel.visibleTunnels.has(t)) {
                    t.show();
                }
            }
            tunnels_1.currentTunnel = this;
            return true;
        }
    }
    tunnels_1.tunnel = tunnel;
})(tunnels || (tunnels = {}));
export default tunnels;
