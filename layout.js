'use strict';

/**
 * Advanced Force-Directed Layout for Dungeons, Dice & Danger.
 * 
 * This engine uses a multi-phase simulation to place nodes in a way that
 * resembles a hand-drawn dungeon map:
 * 1. Initial spring-repulsion simulation.
 * 2. Hard separation to prevent overlaps.
 * 3. Edge-avoidance to keep nodes away from non-adjacent paths.
 * 4. Rectangular avoidance for monster rooms.
 */
class DungeonLayout {
  constructor(options = {}) {
    this.W = options.W || 1000;
    this.H = options.H || 620;
    this.PAD = options.PAD || 40;
    this.idealEdgeLength = options.idealEdgeLength || 75;
    this.iterations = options.iterations || 800;
  }

  calculate(spaces, fixedNodes = {}) {
    const nodes = {};
    const ids = Object.keys(spaces);

    // Initialize positions
    ids.forEach(id => {
      if (fixedNodes[id]) {
        nodes[id] = { x: fixedNodes[id].x, y: fixedNodes[id].y, fixed: true };
      } else {
        // Random initial position within bounds, or centered
        nodes[id] = { 
          x: this.W / 2 + (Math.random() - 0.5) * 100, 
          y: this.H / 2 + (Math.random() - 0.5) * 100, 
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
      if (sp.type === 'start') return 18;
      if (sp.type === 'monster') return 40; // Approximate
      return 15;
    };

    const clamp = (id) => {
      const node = nodes[id];
      if (node.fixed) return;
      const r = getRadius(id);
      node.x = Math.max(this.PAD + r, Math.min(this.W - this.PAD - r, node.x));
      node.y = Math.max(this.PAD + r, Math.min(this.H - this.PAD - r, node.y));
    };

    // Phase 1: Main Simulation
    for (let t = 0; t < this.iterations; t++) {
      const fx = {}, fy = {};
      ids.forEach(id => { fx[id] = 0; fy[id] = 0; });

      // 1.1 Node-Node Repulsion (Coulomb-like)
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i], b = ids[j];
          const dx = nodes[b].x - nodes[a].x;
          const dy = nodes[b].y - nodes[a].y;
          const d2 = dx * dx + dy * dy || 0.01;
          const d = Math.sqrt(d2);
          const minD = getRadius(a) + getRadius(b) + 10;
          
          // Stronger repulsion if too close
          const force = d < minD ? 40000 / d2 : 8000 / d2;
          
          const ux = dx / d, uy = dy / d;
          if (!nodes[a].fixed) { fx[a] -= force * ux; fy[a] -= force * uy; }
          if (!nodes[b].fixed) { fx[b] += force * ux; fy[b] += force * uy; }
        }
      }

      // 1.2 Edge Attraction (Hooke's Law)
      edgeList.forEach(([a, b]) => {
        const dx = nodes[b].x - nodes[a].x;
        const dy = nodes[b].y - nodes[a].y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const force = 0.08 * (d - this.idealEdgeLength);
        const ux = dx / d, uy = dy / d;
        if (!nodes[a].fixed) { fx[a] += force * ux; fy[a] += force * uy; }
        if (!nodes[b].fixed) { fx[b] -= force * ux; fy[b] -= force * uy; }
      });

      // 1.3 Center Gravity (keep things from drifting)
      ids.forEach(id => {
        if (nodes[id].fixed) return;
        const dx = this.W / 2 - nodes[id].x;
        const dy = this.H / 2 - nodes[id].y;
        fx[id] += dx * 0.005;
        fy[id] += dy * 0.005;
      });

      // Apply forces with cooling
      const cool = Math.max(0.05, 1 - t / this.iterations);
      ids.forEach(id => {
        if (nodes[id].fixed) return;
        nodes[id].x += fx[id] * cool;
        nodes[id].y += fy[id] * cool;
        clamp(id);
      });
    }

    // Phase 2: Push nodes off non-adjacent edges
    for (let pass = 0; pass < 50; pass++) {
      let moved = false;
      ids.forEach(id => {
        if (nodes[id].fixed) return;
        const px = nodes[id].x, py = nodes[id].y;
        const aset = adjOf[id];
        const r = getRadius(id);

        edgeList.forEach(([ea, eb]) => {
          if (ea === id || eb === id || aset.has(ea) || aset.has(eb)) return;
          
          const pA = nodes[ea], pB = nodes[eb];
          const abx = pB.x - pA.x, aby = pB.y - pA.y, ab2 = abx * abx + aby * aby || 0.01;
          const tv = Math.max(0, Math.min(1, ((px - pA.x) * abx + (py - pA.y) * aby) / ab2));
          const ex = pA.x + tv * abx, ey = pA.y + tv * aby;
          const ddx = px - ex, ddy = py - ey;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.1;
          
          const clearance = r + 15;
          if (dist < clearance) {
            moved = true;
            const push = (clearance - dist) + 1;
            nodes[id].x += push * (ddx / dist);
            nodes[id].y += push * (ddy / dist);
            clamp(id);
          }
        });
      });
      if (!moved) break;
    }

    // Phase 3: Monster Room Avoidance (Rectangular)
    const monsters = ids.filter(id => spaces[id].type === 'monster');
    for (let pass = 0; pass < 40; pass++) {
      let moved = false;
      ids.forEach(id => {
        if (nodes[id].fixed || spaces[id].type === 'monster') return;
        const node = nodes[id];
        const r = getRadius(id);
        const aset = adjOf[id];

        monsters.forEach(mid => {
          if (aset.has(mid)) return;
          const m = nodes[mid];
          const hw = (spaces[mid].isBoss ? 55 : 40) + r + 10;
          const hh = (spaces[mid].isBoss ? 45 : 30) + r + 10;
          
          const dx = node.x - m.x, dy = node.y - m.y;
          const ox = hw - Math.abs(dx), oy = hh - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            moved = true;
            if (ox < oy) node.x += dx >= 0 ? ox : -ox;
            else node.y += dy >= 0 ? oy : -oy;
            clamp(id);
          }
        });
      });
      if (!moved) break;
    }

    // Phase 4: Final collision check
    for (let pass = 0; pass < 100; pass++) {
      let moved = false;
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i], b = ids[j];
          const dx = nodes[b].x - nodes[a].x;
          const dy = nodes[b].y - nodes[a].y;
          const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const minD = getRadius(a) + getRadius(b) + 5;
          if (d < minD) {
            moved = true;
            const push = (minD - d) / 2 + 0.5;
            const ux = dx / d, uy = dy / d;
            if (!nodes[a].fixed) { nodes[a].x -= ux * push; nodes[a].y -= uy * push; clamp(a); }
            if (!nodes[b].fixed) { nodes[b].x += ux * push; nodes[b].y += uy * push; clamp(b); }
          }
        }
      }
      if (!moved) break;
    }

    // Return rounded results
    const result = {};
    Object.keys(nodes).forEach(id => {
      result[id] = { x: Math.round(nodes[id].x), y: Math.round(nodes[id].y) };
    });
    return result;
  }
}

// Export if in Node, otherwise attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DungeonLayout;
} else {
  window.DungeonLayout = DungeonLayout;
}
