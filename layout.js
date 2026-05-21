'use strict';

/**
 * Enhanced Force-Directed Layout for Dungeons, Dice & Danger.
 * 
 * Major Improvements:
 * 1. Simulated Annealing: Start with high energy and cool down for global stability.
 * 2. Strict Collision: Final passes with hard radius separation.
 * 3. Edge Repulsion: Non-adjacent nodes are pushed away from path segments.
 * 4. Boundary Walls: Nodes are pushed away from edges of the map.
 */
class DungeonLayout {
  constructor(options = {}) {
    this.W = options.W || 1000;
    this.H = options.H || 620;
    this.PAD = options.PAD || 50;
    this.idealEdgeLength = options.idealEdgeLength || 75;
    this.iterations = options.iterations || 1000;
  }

  calculate(spaces, fixedNodes = {}) {
    const nodes = {};
    const ids = Object.keys(spaces);

    // Initialize positions
    ids.forEach(id => {
      if (fixedNodes[id]) {
        nodes[id] = { x: fixedNodes[id].x, y: fixedNodes[id].y, fixed: true };
      } else {
        // Jittered central start to prevent perfect overlaps
        nodes[id] = { 
          x: this.W / 2 + (Math.random() - 0.5) * 200, 
          y: this.H / 2 + (Math.random() - 0.5) * 200, 
          fixed: false 
        };
      }
    });

    const adjOf = {};
    const edgeList = [];
    const edgeSeen = new Set();

    ids.forEach(id => {
      adjOf[id] = new Set(spaces[id].adj);
      spaces[id].adj.forEach(nbr => {
        const key = [id, nbr].sort().join('|');
        if (!edgeSeen.has(key)) {
          edgeSeen.add(key);
          edgeList.push([id, nbr]);
        }
      });
    });

    const getRadius = (id) => {
      const sp = spaces[id];
      if (sp.type === 'start') return 20;
      if (sp.type === 'monster') return 45; 
      return 18;
    };

    const clamp = (id) => {
      const node = nodes[id];
      if (node.fixed) return;
      const r = getRadius(id);
      node.x = Math.max(this.PAD, Math.min(this.W - this.PAD, node.x));
      node.y = Math.max(this.PAD, Math.min(this.H - this.PAD, node.y));
    };

    // Main Simulation Loop
    for (let t = 0; t < this.iterations; t++) {
      const fx = {}, fy = {};
      ids.forEach(id => { fx[id] = 0; fy[id] = 0; });

      // Cooling factor
      const cool = Math.max(0.01, 1 - (t / this.iterations));

      // 1. Node-Node Repulsion (Stronger and longer range)
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i], b = ids[j];
          const dx = nodes[b].x - nodes[a].x;
          const dy = nodes[b].y - nodes[a].y;
          const dist2 = dx * dx + dy * dy || 0.01;
          const dist = Math.sqrt(dist2);
          
          const minD = getRadius(a) + getRadius(b) + 15;
          let force = 0;

          if (dist < minD) {
            force = 500 * (minD - dist); // Overlap push
          } else if (dist < 300) {
            force = 15000 / dist2; // Standard repulsion
          }
          
          if (force === 0) continue;
          
          const ux = dx / dist, uy = dy / dist;
          if (!nodes[a].fixed) { fx[a] -= force * ux; fy[a] -= force * uy; }
          if (!nodes[b].fixed) { fx[b] += force * ux; fy[b] += force * uy; }
        }
      }

      // 2. Edge Attraction (Springs)
      edgeList.forEach(([a, b]) => {
        const dx = nodes[b].x - nodes[a].x;
        const dy = nodes[b].y - nodes[a].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const force = 0.15 * (dist - this.idealEdgeLength);
        const ux = dx / dist, uy = dy / dist;
        if (!nodes[a].fixed) { fx[a] += force * ux; fy[a] += force * uy; }
        if (!nodes[b].fixed) { fx[b] -= force * ux; fy[b] -= force * uy; }
      });

      // 3. Boundary Wall Push
      ids.forEach(id => {
        if (nodes[id].fixed) return;
        const r = getRadius(id);
        const wallForce = 15;
        if (nodes[id].x < this.PAD + 50) fx[id] += wallForce;
        if (nodes[id].x > this.W - this.PAD - 50) fx[id] -= wallForce;
        if (nodes[id].y < this.PAD + 50) fy[id] += wallForce;
        if (nodes[id].y > this.H - this.PAD - 50) fy[id] -= wallForce;
      });

      // Apply forces
      ids.forEach(id => {
        if (nodes[id].fixed) return;
        const speed = 20 * cool;
        nodes[id].x += Math.max(-speed, Math.min(speed, fx[id]));
        nodes[id].y += Math.max(-speed, Math.min(speed, fy[id]));
        clamp(id);
      });
    }

    // Phase 2: Post-process for "Edge Avoidance" (Prevent nodes from sitting on unrelated lines)
    for (let pass = 0; pass < 100; pass++) {
      let moved = false;
      ids.forEach(id => {
        if (nodes[id].fixed) return;
        const px = nodes[id].x, py = nodes[id].y;
        const r = getRadius(id);
        const aset = adjOf[id];

        edgeList.forEach(([ea, eb]) => {
          if (ea === id || eb === id || aset.has(ea) || aset.has(eb)) return;
          
          const pA = nodes[ea], pB = nodes[eb];
          const abx = pB.x - pA.x, aby = pB.y - pA.y;
          const ab2 = abx * abx + aby * aby || 0.01;
          const t = Math.max(0, Math.min(1, ((px - pA.x) * abx + (py - pA.y) * aby) / ab2));
          const ex = pA.x + t * abx, ey = pA.y + t * aby;
          const dist = Math.sqrt((px - ex)**2 + (py - ey)**2) || 0.1;
          
          const clearance = r + 25;
          if (dist < clearance) {
            moved = true;
            const push = (clearance - dist);
            const ux = (px - ex) / dist, uy = (py - ey) / dist;
            nodes[id].x += ux * push;
            nodes[id].y += uy * push;
            clamp(id);
          }
        });
      });
      if (!moved) break;
    }

    // Phase 3: Final Hard Node Separation (No overlaps allowed)
    for (let pass = 0; pass < 150; pass++) {
      let moved = false;
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i], b = ids[j];
          const dx = nodes[b].x - nodes[a].x;
          const dy = nodes[b].y - nodes[a].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const minD = getRadius(a) + getRadius(b) + 8;
          if (dist < minD) {
            moved = true;
            const push = (minD - dist) / 2;
            const ux = dx / dist, uy = dy / dist;
            if (!nodes[a].fixed) { nodes[a].x -= ux * push; nodes[a].y -= uy * push; clamp(a); }
            if (!nodes[b].fixed) { nodes[b].x += ux * push; nodes[b].y += uy * push; clamp(b); }
          }
        }
      }
      if (!moved) break;
    }

    // Phase 4: Round and return
    const result = {};
    ids.forEach(id => {
      result[id] = { x: Math.round(nodes[id].x), y: Math.round(nodes[id].y) };
    });
    return result;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DungeonLayout;
} else {
  window.DungeonLayout = DungeonLayout;
}
