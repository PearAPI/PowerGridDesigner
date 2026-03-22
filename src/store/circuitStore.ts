import { create } from 'zustand';
import {
  type Node,
  type OnNodesChange,
  applyNodeChanges,
} from '@xyflow/react';
import {
  type ComponentType,
  type Facing,
  type WireLayer,
  type ToolType,
  type CircuitState,
  type WireCell,
  COMPONENT_MAP,
  wireKey,
  parseWireKey,
} from '../types/circuit';

/** Counter state per component type prefix for auto-ID */
const idCounters: Record<string, number> = {};

function nextId(prefix: string): string {
  if (!idCounters[prefix]) idCounters[prefix] = 0;
  idCounters[prefix]++;
  return `${prefix}${idCounters[prefix]}`;
}

/** Cycle facing: N→E→S→W→N */
function rotateFacing(f: Facing): Facing {
  const order: Facing[] = ['north', 'east', 'south', 'west'];
  return order[(order.indexOf(f) + 1) % 4];
}

/** Rotation angle in degrees for CSS transform */
export function facingToDeg(f: Facing): number {
  switch (f) {
    case 'north': return 0;
    case 'east': return 90;
    case 'south': return 180;
    case 'west': return 270;
  }
}

export interface CircuitStoreState {
  // ─── Components (React Flow nodes) ───
  nodes: Node[];
  selectedNodeId: string | null;
  onNodesChange: OnNodesChange;

  // ─── Wire Grid (dual layer) ───
  wireGrid: Map<string, boolean>;
  activeLayer: WireLayer;

  // ─── Tool System ───
  activeTool: ToolType;
  isPainting: boolean;

  // ─── Interaction State ───
  hoveredCell: { x: number; y: number } | null;
  setHoveredCell: (cell: { x: number; y: number } | null) => void;
  findComponentAt: (x: number, y: number) => string | null;

  // ─── Selected wire cells ───
  selectedWireKey: string | null;

  // ─── Actions ───
  addComponent: (type: ComponentType, position: { x: number; y: number }) => void;
  removeComponent: (id: string) => void;
  updateComponentData: (id: string, data: Record<string, unknown>) => void;
  rotateComponent: (id: string) => void;
  setSelectedNode: (id: string | null) => void;

  // Wire actions
  paintWire: (x: number, y: number) => void;
  eraseWire: (x: number, y: number) => void;
  toggleLayer: () => void;
  setActiveLayer: (layer: WireLayer) => void;

  // Tool actions
  setActiveTool: (tool: ToolType) => void;
  setIsPainting: (painting: boolean) => void;

  // Wire selection
  setSelectedWireKey: (key: string | null) => void;
  deleteSelected: () => void;

  // Export
  getCircuitState: () => CircuitState;
  clearAll: () => void;
}

export const useCircuitStore = create<CircuitStoreState>((set, get) => ({
  nodes: [],
  selectedNodeId: null,
  wireGrid: new Map(),
  activeLayer: 'front' as WireLayer,
  activeTool: 'select' as ToolType,
  isPainting: false,
  selectedWireKey: null,
  hoveredCell: null,

  setHoveredCell: (cell) => set({ hoveredCell: cell }),

  findComponentAt: (x, y) => {
    const nodes = get().nodes;
    for (const node of nodes) {
      if (!node.data || !node.data.componentType) continue;
      const meta = COMPONENT_MAP[node.data.componentType as ComponentType];
      if (!meta) continue;

      const ox = meta.centerOrigin ? 0.5 : 0;
      const widthPx = meta.width || 40;
      const heightPx = meta.height || 40;

      const facing = node.data.facing as Facing;
      let wPx = widthPx;
      let hPx = heightPx;
      if (facing === 'east' || facing === 'west') {
        wPx = heightPx; hPx = widthPx;
      }

      const left = node.position.x - (wPx * ox);
      const top = node.position.y - (hPx * ox);

      const px = x * 20;
      const py = y * 20;

      // Checking if grid dot explicitly tests within the exact rendered box
      // STRICT BOUNDARY: Use < instead of <= to prevent +1 visual inflation bug
      if (px >= left && px < left + wPx && py >= top && py < top + hPx) {
        return node.id;
      }
    }
    return null;
  },

  onNodesChange: (changes) => {
    const nodes = get().nodes;
    const nextChanges = changes.map(change => {
      if (change.type === 'position' && change.position) {
        return {
          ...change,
          position: {
            x: Math.round(change.position.x / 20) * 20,
            y: Math.round(change.position.y / 20) * 20,
          },
        };
      }
      if (change.type === 'dimensions' && change.dimensions) {
        const node = nodes.find(n => n.id === change.id);
        const meta = node ? COMPONENT_MAP[node.data.componentType as ComponentType] : null;
        if (meta) {
          return {
            ...change,
            dimensions: {
              width: meta.width || 40,
              height: meta.height || 40,
            },
          };
        }
      }
      return change;
    });
    set({ nodes: applyNodeChanges(nextChanges, get().nodes) });
  },

  addComponent: (type, position) => {
    const meta = COMPONENT_MAP[type];
    const id = nextId(meta.idPrefix);

    // Initialize custom properties from metadata defaults
    const customProperties: Record<string, number> = {};
    meta.properties?.forEach(p => {
      customProperties[p.id] = p.defaultValue;
    });

    const newNode: Node = {
      id,
      type,
      origin: meta.centerOrigin ? [0.5, 0.5] : [0, 0],
      position: {
        x: Math.round(position.x / 20) * 20,
        y: Math.round(position.y / 20) * 20,
      },
      width: meta.width || 40,
      height: meta.height || 40,
      style: { width: meta.width || 40, height: meta.height || 40 },
      data: {
        label: id,
        componentType: type,
        facing: 'north' as Facing,
        orientation: 0,
        customProperties,
        color: meta.color,
        terminals: meta.terminals,
      },
      draggable: true,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  removeComponent: (id) => {
    set({
      nodes: get().nodes.filter(n => n.id !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  updateComponentData: (id, data) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    });
  },

  rotateComponent: (id) => {
    // Visual-only rotation: only changes the facing (SVG display), pins stay static
    set({
      nodes: get().nodes.map(n =>
        n.id === id
          ? { ...n, data: { ...n.data, facing: rotateFacing(n.data.facing as Facing), orientation: (((n.data.orientation as number) || 0) + 1) % 4 } }
          : n
      ),
    });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedWireKey: null }),

  // ─── Wire Grid Actions ───

  paintWire: (x, y) => {
    const { wireGrid, activeLayer } = get();
    const key = wireKey(x, y, activeLayer);
    if (!wireGrid.has(key)) {
      const newGrid = new Map(wireGrid);
      newGrid.set(key, true);
      set({ wireGrid: newGrid });
    }
  },

  eraseWire: (x, y) => {
    const { wireGrid, activeLayer } = get();
    const key = wireKey(x, y, activeLayer);
    if (wireGrid.has(key)) {
      const newGrid = new Map(wireGrid);
      newGrid.delete(key);
      set({ wireGrid: newGrid });
    }
  },

  toggleLayer: () => {
    set({ activeLayer: get().activeLayer === 'front' ? 'back' : 'front' });
  },

  setActiveLayer: (layer) => set({ activeLayer: layer }),

  // ─── Tool Actions ───

  setActiveTool: (tool) => set({ activeTool: tool }),
  setIsPainting: (painting) => set({ isPainting: painting }),

  // ─── Wire Selection ───

  setSelectedWireKey: (key) => set({ selectedWireKey: key, selectedNodeId: null }),

  deleteSelected: () => {
    const { selectedNodeId, selectedWireKey } = get();
    if (selectedNodeId) {
      get().removeComponent(selectedNodeId);
    }
    if (selectedWireKey) {
      const newGrid = new Map(get().wireGrid);
      newGrid.delete(selectedWireKey);
      set({ wireGrid: newGrid, selectedWireKey: null });
    }
  },

  // ─── Export ───

  getCircuitState: (): CircuitState => {
    const { nodes, wireGrid } = get();
    const wireCells: WireCell[] = [];
    for (const key of wireGrid.keys()) {
      wireCells.push(parseWireKey(key));
    }
    return {
      version: 2,
      gridSize: { width: 64, height: 64 },
      components: nodes.map(n => ({
        id: n.id,
        type: n.data.componentType as ComponentType,
        position: { x: Math.round(n.position.x / 20), y: Math.round(n.position.y / 20) },
        facing: (n.data.facing || 'north') as Facing,
        orientation: (n.data.orientation as number) || 0,
        customProperties: n.data.customProperties as Record<string, number>,
        label: n.data.label as string | undefined,
      })),
      wireCells,
    };
  },

  clearAll: () => {
    set({ nodes: [], wireGrid: new Map(), selectedNodeId: null, selectedWireKey: null, activeTool: 'select' });
    Object.keys(idCounters).forEach(k => { idCounters[k] = 0; });
  },
}));
