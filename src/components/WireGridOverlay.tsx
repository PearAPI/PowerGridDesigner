import { useMemo } from 'react';
import { useStore } from '@xyflow/react';
import { useCircuitStore } from '../store/circuitStore';
import { parseWireKey, type WireLayer } from '../types/circuit';

const CELL_SIZE = 20;

const LAYER_COLORS: Record<WireLayer, string> = {
    front: '#e74c3c',
    back: '#3498db',
};

/**
 * Renders painted wire cells as an SVG overlay inside the React Flow container.
 * Uses the internal viewport store for reactive pan/zoom tracking,
 * ensuring wires stay locked to the grid in world space.
 */
export default function WireGridOverlay() {
    const wireGrid = useCircuitStore(s => s.wireGrid);
    const activeLayer = useCircuitStore(s => s.activeLayer);
    const selectedWireKey = useCircuitStore(s => s.selectedWireKey);

    // Reactive viewport transform — updates on every pan/zoom
    const transform = useStore(s => s.transform);
    const [tx, ty, zoom] = transform;

    const cells = useMemo(() => {
        const result: Array<{ key: string; x: number; y: number; layer: WireLayer }> = [];
        for (const key of wireGrid.keys()) {
            const cell = parseWireKey(key);
            result.push({ key, ...cell });
        }
        return result;
    }, [wireGrid]);

    const inactiveLayer = activeLayer === 'front' ? 'back' : 'front';

    return (
        <svg
            className="wire-grid-overlay"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
                overflow: 'visible',
            }}
        >
            {/* Apply the same camera transform as the React Flow viewport */}
            <g transform={`translate(${tx}, ${ty}) scale(${zoom})`}>
                {/* Inactive layer (behind, dimmed) */}
                {cells
                    .filter(c => c.layer === inactiveLayer)
                    .map(c => (
                        <rect
                            key={c.key}
                            x={c.x * CELL_SIZE - CELL_SIZE / 2}
                            y={c.y * CELL_SIZE - CELL_SIZE / 2}
                            width={CELL_SIZE}
                            height={CELL_SIZE}
                            rx={2}
                            fill={LAYER_COLORS[c.layer]}
                            opacity={0.25}
                        />
                    ))}

                {/* Active layer (full opacity) */}
                {cells
                    .filter(c => c.layer === activeLayer)
                    .map(c => (
                        <rect
                            x={c.x * CELL_SIZE - CELL_SIZE / 2}
                            y={c.y * CELL_SIZE - CELL_SIZE / 2}
                            width={CELL_SIZE}
                            height={CELL_SIZE}
                            rx={2}
                            fill={LAYER_COLORS[c.layer]}
                            opacity={0.85}
                            stroke={c.key === selectedWireKey ? '#fbbf24' : 'none'}
                            strokeWidth={c.key === selectedWireKey ? 2 : 0}
                        />
                    ))}
            </g>
        </svg>
    );
}