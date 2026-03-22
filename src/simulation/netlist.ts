import type { CircuitState } from '../types/circuit';

/** A node in the circuit graph (a connection point / net) */
export interface NetNode {
  id: string;
  /** Component terminal IDs connected at this node */
  connectedTerminals: Array<{ componentId: string; terminal: number }>;
  /** Solved voltage at this node (set by simulator) */
  voltage?: number;
}

/** A branch in the circuit graph (a component between two nodes) */
export interface NetBranch {
  id: string;
  componentId: string;
  type: string;
  /** Node IDs at each end */
  nodeA: string;
  nodeB: string;
  /** Impedance/resistance value in ohms */
  resistance: number;
  /** For diodes: true if current flows A→B only */
  isDirectional: boolean;
  /** Solved current through this branch (set by simulator) */
  current?: number;
}

/** The complete netlist graph */
export interface Netlist {
  nodes: NetNode[];
  branches: NetBranch[];
}

/** Build a netlist from a CircuitState */
export function buildNetlist(state: CircuitState): Netlist {
  const nodes: NetNode[] = [];
  const branches: NetBranch[] = [];
  const nodeMap = new Map<string, NetNode>();

  // Create a net node for each unique connection point
  // Each component terminal is a potential node
  // Connections merge terminal nodes

  // Start by creating a node per component terminal
  for (const comp of state.components) {
    const termCount = comp.type === 'relay_dpdt' ? 8
      : comp.type === 'relay_spdt' ? 5
      : ['potentiometer', 'pnp_bjt', 'npn_bjt', 'static_induction_transistor'].includes(comp.type) ? 3
      : 2;
    for (let t = 0; t < termCount; t++) {
      const termId = `${comp.id}:t${t}`;
      const node: NetNode = {
        id: termId,
        connectedTerminals: [{ componentId: comp.id, terminal: t }],
      };
      nodes.push(node);
      nodeMap.set(termId, node);
    }
  }

  // Merge nodes connected by wires
  const mergedMap = new Map<string, string>(); // termId → rootTermId
  for (const node of nodes) {
    mergedMap.set(node.id, node.id);
  }

  function findRoot(id: string): string {
    while (mergedMap.get(id) !== id) {
      id = mergedMap.get(id)!;
    }
    return id;
  }

  function union(a: string, b: string) {
    const ra = findRoot(a);
    const rb = findRoot(b);
    if (ra !== rb) {
      mergedMap.set(rb, ra);
    }
  }

  for (const conn of state.connections) {
    const srcTerm = `${conn.sourceId}:t${conn.sourceTerminal}`;
    const tgtTerm = `${conn.targetId}:t${conn.targetTerminal}`;
    union(srcTerm, tgtTerm);
  }

  // Deduplicate nodes by root
  const rootNodes = new Map<string, NetNode>();
  for (const node of nodes) {
    const root = findRoot(node.id);
    if (!rootNodes.has(root)) {
      rootNodes.set(root, { id: root, connectedTerminals: [] });
    }
    rootNodes.get(root)!.connectedTerminals.push(...node.connectedTerminals);
  }
  const mergedNodes = Array.from(rootNodes.values());

  // Create branches for each component (2-terminal → 1 branch; 3-terminal → 2 branches)
  for (const comp of state.components) {
    if (comp.type === 'wire') continue; // wires are connections, not branches

    const resistance = comp.value || 1000;
    const isDirectional = comp.type === 'diode';

    const t0Root = findRoot(`${comp.id}:t0`);
    const t1Root = findRoot(`${comp.id}:t1`);

    branches.push({
      id: `${comp.id}_branch`,
      componentId: comp.id,
      type: comp.type,
      nodeA: t0Root,
      nodeB: t1Root,
      resistance,
      isDirectional,
    });
  }

  return { nodes: mergedNodes, branches };
}

/** Find all closed loops in the netlist using DFS */
export function findLoops(netlist: Netlist): string[][] {
  const adj = new Map<string, Array<{ nodeId: string; branchId: string }>>();
  for (const node of netlist.nodes) {
    adj.set(node.id, []);
  }
  for (const branch of netlist.branches) {
    adj.get(branch.nodeA)?.push({ nodeId: branch.nodeB, branchId: branch.id });
    adj.get(branch.nodeB)?.push({ nodeId: branch.nodeA, branchId: branch.id });
  }

  const loops: string[][] = [];
  const visited = new Set<string>();

  function dfs(nodeId: string, path: string[], visitedEdges: Set<string>) {
    visited.add(nodeId);
    const neighbors = adj.get(nodeId) || [];

    for (const { nodeId: nextId, branchId } of neighbors) {
      if (visitedEdges.has(branchId)) continue;

      if (path.includes(nextId)) {
        // Found a loop
        const loopStart = path.indexOf(nextId);
        loops.push(path.slice(loopStart));
        continue;
      }

      const newVisitedEdges = new Set(visitedEdges);
      newVisitedEdges.add(branchId);
      dfs(nextId, [...path, nextId], newVisitedEdges);
    }
  }

  for (const node of netlist.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, [node.id], new Set());
    }
  }

  return loops;
}
