import type { CircuitState } from '../types/circuit';
import { buildNetlist, findLoops, type Netlist } from './netlist';
import { solveLinearSystem, zeroMatrix, zeroVector } from './matrixSolver';

/** Result for a single component */
export interface ComponentResult {
  componentId: string;
  voltage: number;
  current: number;
  power: number;
  warnings: string[];
}

/** Full simulation result */
export interface SimulationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  nodeVoltages: Record<string, number>;
  componentResults: ComponentResult[];
  loops: string[][];
}

/**
 * Run a lightweight SPICE-like simulation on the circuit.
 * Uses Modified Nodal Analysis (MNA) for DC operating point.
 */
export function simulate(state: CircuitState): SimulationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (state.components.length === 0) {
    return { success: false, errors: ['No components in circuit'], warnings: [], nodeVoltages: {}, componentResults: [], loops: [] };
  }

  // Build netlist
  const netlist: Netlist = buildNetlist(state);
  const loops = findLoops(netlist);

  if (loops.length === 0) {
    warnings.push('No closed loops found — circuit may be incomplete');
  }

  // Node indexing (exclude ground node — first node is ground)
  const nodeIds = netlist.nodes.map(n => n.id);
  if (nodeIds.length < 2) {
    return { success: false, errors: ['Circuit needs at least 2 nodes'], warnings, nodeVoltages: {}, componentResults: [], loops };
  }

  const groundNode = nodeIds[0];
  const nonGroundNodes = nodeIds.slice(1);
  const nodeIndex = new Map<string, number>();
  nonGroundNodes.forEach((id, i) => nodeIndex.set(id, i));

  const n = nonGroundNodes.length;
  const G = zeroMatrix(n);
  const I = zeroVector(n);

  // Build conductance matrix
  for (const branch of netlist.branches) {
    const conductance = 1 / Math.max(branch.resistance, 1e-9);
    const iA = nodeIndex.get(branch.nodeA);
    const iB = nodeIndex.get(branch.nodeB);

    if (iA !== undefined) G[iA][iA] += conductance;
    if (iB !== undefined) G[iB][iB] += conductance;
    if (iA !== undefined && iB !== undefined) {
      G[iA][iB] -= conductance;
      G[iB][iA] -= conductance;
    }
  }

  // Solve G·V = I
  const voltages = solveLinearSystem(G, I);
  const nodeVoltages: Record<string, number> = {};
  nodeVoltages[groundNode] = 0;

  if (voltages) {
    nonGroundNodes.forEach((id, i) => {
      nodeVoltages[id] = voltages[i];
    });
  } else {
    errors.push('Matrix is singular — check for disconnected nodes or short circuits');
  }

  // Calculate per-component results
  const componentResults: ComponentResult[] = [];
  for (const branch of netlist.branches) {
    const vA = nodeVoltages[branch.nodeA] || 0;
    const vB = nodeVoltages[branch.nodeB] || 0;
    const voltage = vA - vB;
    const current = voltage / Math.max(branch.resistance, 1e-9);
    const power = voltage * current;

    const compWarnings: string[] = [];

    // Diode polarity check
    if (branch.isDirectional && current < 0) {
      compWarnings.push('Current flows against diode polarity (reverse bias)');
    }

    // Power warning
    if (Math.abs(power) > 100) {
      compWarnings.push(`High power dissipation: ${power.toFixed(2)}W`);
    }

    componentResults.push({
      componentId: branch.componentId,
      voltage,
      current,
      power,
      warnings: compWarnings,
    });
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
    nodeVoltages,
    componentResults,
    loops,
  };
}
