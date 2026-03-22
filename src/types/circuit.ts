/** Cardinal facing directions (Minecraft block states) */
export type Facing = 'north' | 'south' | 'east' | 'west';

/** Wire routing layers */
export type WireLayer = 'front' | 'back';

/** Tool types — what happens on canvas interaction */
export type ToolType = 'select' | 'wire' | 'eraser' | ComponentType;

/** Supported component types matching Create: Power Grid blocks */
export type ComponentType =
    | 'connector'
    | 'via'
    | 'resistor'
    | 'capacitor'
    | 'diode'
    | 'varistor'
    | 'barretter_tube'
    | 'neon_bulb'
    | 'regulator_tube'
    | 'potentiometer'
    | 'bjt_pnp'
    | 'bjt_npn'
    | 'static_induction_transistor'
    | 'relay_dpdt'
    | 'relay_spdt';

/** A single painted wire cell on the grid */
export interface WireCell {
    x: number;
    y: number;
    layer: WireLayer;
}

/** Create a map key for a wire cell — O(1) lookup */
export function wireKey(x: number, y: number, layer: WireLayer): string {
    return `${x},${y},${layer}`;
}

/** Parse a wire key back into coordinates + layer */
export function parseWireKey(key: string): WireCell {
    const [x, y, layer] = key.split(',');
    return { x: parseInt(x), y: parseInt(y), layer: layer as WireLayer };
}

/** A mathematical definition for a component's logical pin/connector */
export interface ComponentPin {
    /** Internal ID (e.g. 'T1', 'B') */
    id: string;
    /** Display label (e.g. 'Terminal 1', 'Base') */
    label: string;
    /** X coordinate natively (for north-facing), usually 0 to 40 */
    x: number;
    /** Y coordinate natively (for north-facing), usually 0 to 40 */
    y: number;
}

/** A single placed component on the canvas */
export interface CircuitComponent {
    /** Unique ID (e.g. "R1", "D3") */
    id: string;
    /** Component type → maps to powergrid:<type> in NBT palette */
    type: ComponentType;
    /** Grid position (integer, 1 unit = 1 Minecraft block) */
    position: { x: number; y: number };
    /** Visual facing direction (pins stay static) */
    facing: Facing;
    /** Mod-specific rotational integer (0 to 3) */
    orientation?: number;
    /** Component-specific value (ohms, farads, etc.) */
    value?: number;
    /** Optional label for display */
    label?: string;
}

/** The complete circuit state exported from the canvas */
export interface CircuitState {
    /** Schema version for forward compatibility */
    version: 2;
    /** Canvas grid size (width × height in blocks) */
    gridSize: { width: number; height: number };
    /** All placed components */
    components: CircuitComponent[];
    /** All painted wire cells */
    wireCells: WireCell[];
}

/** Component metadata for the palette */
export interface ComponentMeta {
    type: ComponentType;
    label: string;
    /** Short label for the ID prefix (e.g. "R" for Resistor) */
    idPrefix: string;
    /** Default value (ohms, farads, etc.) */
    defaultValue?: number;
    /** Unit symbol */
    unit?: string;
    /** Number of terminals */
    terminals: number;
    /** Category for palette grouping */
    category: 'passive' | 'active' | 'switching';
    /** Color accent for the component */
    color: string;
    /** Keyboard shortcut key (lowercase) */
    shortcutKey?: string;
    /** Pins defined relative to unrotated (north) Top-Left bound */
    pins: ComponentPin[];
    /** Optional custom React Flow container width (default 40) */
    width?: number;
    /** Optional custom React Flow container height (default 40) */
    height?: number;
    /** If true, the node snaps and anchors perfectly to its center rather than top-left */
    centerOrigin?: boolean;
}

// Common pin definitions
const CONNECTOR_PIN: ComponentPin[] = [
    { id: 'C', label: 'C', x: 20, y: 20 },
];

const VIA_PIN: ComponentPin[] = [
    { id: 'C', label: 'C', x: 10, y: 10 },
];

const TWO_PINS: ComponentPin[] = [
    { id: 'T1', label: '1', x: 0, y: 20 },
    { id: 'T2', label: '2', x: 40, y: 20 },
];

const VARISTOR_PINS: ComponentPin[] = [
    { id: 'T1', label: '1', x: 0, y: 20 },
    { id: 'T2', label: '2', x: 60, y: 40 },
];

const TUBE_PINS: ComponentPin[] = [
    { id: 'T1', label: '1', x: 0, y: 0 },
    { id: 'T2', label: '2', x: 20, y: 20 },
];

const REGULATOR_TUBE_PINS: ComponentPin[] = [
    { id: 'Anode', label: '+', x: 0, y: 20 },
    { id: 'Cathode', label: '-', x: 40, y: 20 },
];

const POT_PINS: ComponentPin[] = [
    { id: 'T1', label: '1', x: 20, y: 40 },
    { id: 'T2', label: '2', x: 60, y: 40 },
    { id: 'W', label: 'W', x: 40, y: 60 },
];

const NPN_BJT_PINS: ComponentPin[] = [
    { id: 'B', label: 'B', x: 0, y: 20 },
    { id: 'C', label: 'C', x: 20, y: 0 },
    { id: 'E', label: 'E', x: 20, y: 40 },
];

const PNP_BJT_PINS: ComponentPin[] = [
    { id: 'B', label: 'B', x: 0, y: 20 },
    { id: 'E', label: 'E', x: 20, y: 0 },
    { id: 'C', label: 'C', x: 20, y: 40 },
];

const VFET_PINS: ComponentPin[] = [
    { id: 'D', label: 'D', x: 0, y: 0 },
    { id: 'S', label: 'S', x: 40, y: 0 },
    { id: 'G', label: 'G', x: 20, y: 40 },
];

const DPDT_PINS: ComponentPin[] = [
    // Left side (coil)
    { id: 'C1', label: 'C1', x: 0, y: 0 },
    { id: 'C2', label: 'C2', x: 0, y: 80 },
    // Middle (Switch 1)
    { id: 'NO1', label: 'NO', x: 40, y: 0 },
    { id: 'COM1', label: 'CM', x: 40, y: 40 },
    { id: 'NC1', label: 'NC', x: 40, y: 80 },
    // Right (Switch 2)
    { id: 'NO2', label: 'NO', x: 80, y: 0 },
    { id: 'COM2', label: 'CM', x: 80, y: 40 },
    { id: 'NC2', label: 'NC', x: 80, y: 80 },
];

const SPDT_PINS: ComponentPin[] = [
    { id: 'C1', label: 'C1', x: 0, y: 0 },
    { id: 'C2', label: 'C2', x: 0, y: 80 },
    { id: 'NO', label: 'NO', x: 40, y: 0 },
    { id: 'COM', label: 'CM', x: 60, y: 40 },
    { id: 'NC', label: 'NC', x: 40, y: 80 },
];

/** Registry of all components with their metadata */
export const COMPONENT_REGISTRY: ComponentMeta[] = [
    // Passive
    { type: 'connector', label: 'Wire Connector', idPrefix: 'WC', terminals: 1, category: 'passive', color: '#64748b', pins: CONNECTOR_PIN, width: 40, height: 40 },
    { type: 'via', label: 'Via', idPrefix: 'V', terminals: 1, category: 'passive', color: '#64748b', pins: VIA_PIN, width: 20, height: 20, centerOrigin: true },
    { type: 'resistor', label: 'Resistor', idPrefix: 'R', defaultValue: 1000, unit: 'Ω', terminals: 2, category: 'passive', color: '#ef4444', shortcutKey: 'r', pins: TWO_PINS },
    { type: 'capacitor', label: 'Capacitor', idPrefix: 'C', defaultValue: 0.001, unit: 'F', terminals: 2, category: 'passive', color: '#3b82f6', shortcutKey: 'c', pins: TWO_PINS },
    { type: 'varistor', label: 'Varistor', idPrefix: 'VR', defaultValue: 100, unit: 'Ω', terminals: 2, category: 'passive', color: '#f97316', pins: VARISTOR_PINS, width: 60, height: 40 },
    { type: 'potentiometer', label: 'Potentiometer', idPrefix: 'POT', defaultValue: 10000, unit: 'Ω', terminals: 3, category: 'passive', color: '#8b5cf6', pins: POT_PINS, width: 60, height: 60 },
    // Active
    { type: 'diode', label: 'Diode', idPrefix: 'D', defaultValue: 0.7, unit: 'V', terminals: 2, category: 'active', color: '#10b981', pins: TWO_PINS },
    { type: 'barretter_tube', label: 'Barretter Tube', idPrefix: 'BT', terminals: 2, category: 'active', color: '#ec4899', pins: TUBE_PINS },
    { type: 'neon_bulb', label: 'Neon Bulb', idPrefix: 'NE', defaultValue: 90, unit: 'V', terminals: 2, category: 'active', color: '#fbbf24', pins: TUBE_PINS },
    { type: 'regulator_tube', label: 'Regulator Tube', idPrefix: 'VT', terminals: 2, category: 'active', color: '#6366f1', pins: REGULATOR_TUBE_PINS },
    { type: 'bjt_pnp', label: 'PNP BJT', idPrefix: 'Q', terminals: 3, category: 'active', color: '#f43f5e', pins: PNP_BJT_PINS },
    { type: 'bjt_npn', label: 'NPN BJT', idPrefix: 'Q', terminals: 3, category: 'active', color: '#14b8a6', pins: NPN_BJT_PINS },
    { type: 'static_induction_transistor', label: 'Static Induction Transistor', idPrefix: 'SIT', terminals: 3, category: 'active', color: '#a855f7', pins: VFET_PINS },
    // Switching
    { type: 'relay_dpdt', label: 'Relay DPDT', idPrefix: 'K', terminals: 8, category: 'switching', color: '#64748b', pins: DPDT_PINS, width: 80, height: 80 },
    { type: 'relay_spdt', label: 'Relay SPDT', idPrefix: 'K', terminals: 5, category: 'switching', color: '#94a3b8', pins: SPDT_PINS, width: 60, height: 80 },
];

/** Map from ComponentType to ComponentMeta for quick lookup */
export const COMPONENT_MAP: Record<ComponentType, ComponentMeta> = Object.fromEntries(
    COMPONENT_REGISTRY.map(m => [m.type, m])
) as Record<ComponentType, ComponentMeta>;
