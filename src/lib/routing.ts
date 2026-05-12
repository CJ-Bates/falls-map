// Trail-network routing.
//
// We build an undirected graph from src/data/trails.json:
//   - Each unique (lng,lat) vertex becomes a node.
//   - Adjacent vertices in a trail's LineString form an edge weighted by
//     haversine distance and tagged with the trail's surface + name.
//   - Vertices closer than EPSILON_M (~3m) are merged into the same node
//     so the snapping work we already did across trail endpoints reads
//     as a true intersection in the graph.
//
// We can then snap any (lng,lat) point — a cabin, a POI, the user's live
// location — to the nearest graph node, and run Dijkstra over it.

import trailsData from "@/data/trails.json";

export type Surface = "paved" | "gravel" | "4wd" | "trail";
export type LngLat = [number, number];

type Trail = {
  type: "Feature";
  properties: {
    name?: string;
    surface?: Surface | string;
    description?: string;
  };
  geometry: { type: "LineString"; coordinates: number[][] };
};

const EPSILON_M = 3;  // merge graph nodes within 3 m of each other
const EARTH_R = 6371000;

export function haversine(a: LngLat, b: LngLat): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const dφ = ((lat2 - lat1) * Math.PI) / 180;
  const dλ = ((lng2 - lng1) * Math.PI) / 180;
  const h =
    Math.sin(dφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

export type Edge = {
  to: number;          // index of the neighbor node
  dist: number;        // edge length in meters
  surface: Surface;    // for ETA + summary
  trailName: string;   // human-readable label
};

export type Graph = {
  nodes: LngLat[];                 // index → (lng,lat)
  adj: Edge[][];                   // index → outgoing edges
};

let cached: Graph | null = null;

// Build the graph once and memoize.
export function getTrailGraph(): Graph {
  if (cached) return cached;

  const trails = (trailsData as { features: Trail[] }).features;

  // Step 1 — collect every unique vertex, merging within EPSILON_M.
  const nodes: LngLat[] = [];
  // Simple O(n²) merge is fine: trails.json has ~200 vertices total.
  const indexFor = (p: LngLat): number => {
    for (let i = 0; i < nodes.length; i++) {
      if (haversine(nodes[i], p) < EPSILON_M) return i;
    }
    nodes.push(p);
    return nodes.length - 1;
  };

  const adj: Edge[][] = [];
  const addEdge = (a: number, b: number, dist: number, surface: Surface, name: string) => {
    if (a === b) return;
    if (!adj[a]) adj[a] = [];
    if (!adj[b]) adj[b] = [];
    adj[a].push({ to: b, dist, surface, trailName: name });
    adj[b].push({ to: a, dist, surface, trailName: name });
  };

  // Step 2 — walk each trail's coordinate list and emit edges.
  for (const t of trails) {
    const coords = t.geometry.coordinates;
    const surface = (t.properties.surface ?? "trail") as Surface;
    const name = t.properties.name ?? "Trail";
    let prev = indexFor(coords[0] as LngLat);
    for (let i = 1; i < coords.length; i++) {
      const cur = indexFor(coords[i] as LngLat);
      const d = haversine(nodes[prev], nodes[cur]);
      addEdge(prev, cur, d, surface, name);
      prev = cur;
    }
  }
  // Ensure every index has an entry (some edge-case nodes might not).
  for (let i = 0; i < nodes.length; i++) adj[i] ??= [];

  cached = { nodes, adj };
  return cached;
}

// Snap an arbitrary (lng,lat) to the nearest node. Returns { node, dist }.
export function snapToGraph(graph: Graph, p: LngLat): { node: number; dist: number } {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < graph.nodes.length; i++) {
    const d = haversine(graph.nodes[i], p);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { node: best, dist: bestD };
}

export type Route = {
  coords: LngLat[];             // the full geometry of the route
  distance: number;             // meters
  segments: {                   // for the surface-breakdown UI
    surface: Surface;
    distance: number;
    trailName: string;
  }[];
};

// Dijkstra. Returns null if there's no path (graph disconnected).
export function shortestPath(
  graph: Graph,
  start: number,
  end: number,
): Route | null {
  if (start === end) {
    return {
      coords: [graph.nodes[start]],
      distance: 0,
      segments: [],
    };
  }
  const n = graph.nodes.length;
  const dist = new Array<number>(n).fill(Infinity);
  const prev = new Array<number>(n).fill(-1);
  const prevEdge = new Array<Edge | null>(n).fill(null);
  dist[start] = 0;

  // Simple binary-heap priority queue. We expect <500 nodes so a basic
  // version is fine.
  const heap: [number, number][] = [[0, start]]; // [distance, node]
  const heapPush = (entry: [number, number]) => {
    heap.push(entry);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const heapPop = (): [number, number] | undefined => {
    if (heap.length === 0) return undefined;
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        const l = i * 2 + 1, r = i * 2 + 2;
        let smallest = i;
        if (l < heap.length && heap[l][0] < heap[smallest][0]) smallest = l;
        if (r < heap.length && heap[r][0] < heap[smallest][0]) smallest = r;
        if (smallest === i) break;
        [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
        i = smallest;
      }
    }
    return top;
  };

  while (heap.length) {
    const popped = heapPop();
    if (!popped) break;
    const [d, u] = popped;
    if (u === end) break;
    if (d > dist[u]) continue;
    for (const e of graph.adj[u]) {
      const nd = d + e.dist;
      if (nd < dist[e.to]) {
        dist[e.to] = nd;
        prev[e.to] = u;
        prevEdge[e.to] = e;
        heapPush([nd, e.to]);
      }
    }
  }

  if (dist[end] === Infinity) return null;

  // Reconstruct path.
  const path: number[] = [];
  for (let cur = end; cur !== -1; cur = prev[cur]) path.unshift(cur);

  const coords: LngLat[] = path.map((i) => graph.nodes[i]);
  // Build surface segments by collapsing consecutive same-surface,
  // same-trail edges.
  const segments: Route["segments"] = [];
  for (let i = 1; i < path.length; i++) {
    const e = prevEdge[path[i]];
    if (!e) continue;
    const last = segments[segments.length - 1];
    if (last && last.surface === e.surface && last.trailName === e.trailName) {
      last.distance += e.dist;
    } else {
      segments.push({
        surface: e.surface,
        distance: e.dist,
        trailName: e.trailName,
      });
    }
  }

  return {
    coords,
    distance: dist[end],
    segments,
  };
}

// Walking and 4WD pace constants (meters per second).
export const WALK_M_PER_S = 1.25;   // ~3 mph
export const DRIVE_M_PER_S = 6.7;   // ~15 mph (slow gravel/4WD)

export function etaMinutes(meters: number, pace: number): number {
  return Math.max(1, Math.round(meters / pace / 60));
}

export function metersToMiles(m: number): number {
  return m / 1609.344;
}
