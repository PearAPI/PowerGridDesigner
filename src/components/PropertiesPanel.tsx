import { useCircuitStore } from '../store/circuitStore';
import { COMPONENT_MAP, type Facing } from '../types/circuit';

export default function PropertiesPanel() {
    const selectedNodeId = useCircuitStore(s => s.selectedNodeId);
    const selectedWireKey = useCircuitStore(s => s.selectedWireKey);
    const nodes = useCircuitStore(s => s.nodes);
    const updateComponentData = useCircuitStore(s => s.updateComponentData);
    const rotateComponent = useCircuitStore(s => s.rotateComponent);
    const removeComponent = useCircuitStore(s => s.removeComponent);
    const deleteSelected = useCircuitStore(s => s.deleteSelected);

    const node = nodes.find(n => n.id === selectedNodeId);

    // Wire cell selected
    if (selectedWireKey && !node) {
        const parts = selectedWireKey.split(',');
        return (
            <div className="properties-panel">
                <h2 className="panel-title">Wire Cell</h2>
                <div className="prop-group">
                    <label className="prop-label">Position</label>
                    <span className="prop-value-display">({parts[0]}, {parts[1]})</span>
                </div>
                <div className="prop-group">
                    <label className="prop-label">Layer</label>
                    <span className={`prop-value-display layer-badge ${parts[2]}`}>{parts[2]?.toUpperCase()}</span>
                </div>
                <button className="prop-btn danger" onClick={deleteSelected}>
                    🗑 Delete Wire Cell
                </button>
            </div>
        );
    }

    // No selection
    if (!node) {
        return (
            <div className="properties-panel">
                <h2 className="panel-title">Properties</h2>
                <p className="panel-empty">Select a component or wire cell to edit its properties.</p>
                <div className="panel-help">
                    <h3 className="help-title">Shortcuts</h3>
                    <div className="help-item"><kbd>W</kbd> Wire Paint</div>
                    <div className="help-item"><kbd>E</kbd> Eraser</div>
                    <div className="help-item"><kbd>R</kbd> Resistor</div>
                    <div className="help-item"><kbd>C</kbd> Capacitor</div>
                    <div className="help-item"><kbd>F</kbd> Flip Layer</div>
                    <div className="help-item"><kbd>DEL</kbd> Delete</div>
                    <div className="help-item"><kbd>ESC</kbd> Select Tool</div>
                </div>
            </div>
        );
    }

    // Component selected
    const meta = COMPONENT_MAP[node.data.componentType as keyof typeof COMPONENT_MAP];
    const facing = (node.data.facing || 'north') as Facing;

    return (
        <div className="properties-panel">
            <h2 className="panel-title">Properties</h2>

            <div className="prop-group">
                <label className="prop-label">ID</label>
                <span className="prop-value-display">{node.data.label as string}</span>
            </div>

            <div className="prop-group">
                <label className="prop-label">Type</label>
                <span className="prop-value-display">{meta?.label || node.data.componentType as string}</span>
            </div>

            <div className="prop-group">
                <label className="prop-label">Position</label>
                <span className="prop-value-display">
                    ({Math.round(node.position.x / 20)}, {Math.round(node.position.y / 20)})
                </span>
            </div>

            <div className="prop-group">
                <label className="prop-label">Facing (visual only)</label>
                <div className="prop-row">
                    <span className="prop-value-display facing-badge">{facing.toUpperCase()}</span>
                    <button className="prop-btn" onClick={() => rotateComponent(node.id)} title="Rotate 90° (pins stay static)">
                        ↻ Rotate
                    </button>
                </div>
            </div>

            {meta?.properties?.map(prop => (
                <div key={prop.id} className="prop-group">
                    <label className="prop-label">{prop.label} ({prop.unit})</label>
                    <input
                        className="prop-input"
                        type="number"
                        value={(node.data.customProperties as Record<string, number>)?.[prop.id] ?? prop.defaultValue}
                        onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            updateComponentData(node.id, {
                                customProperties: {
                                    ...(node.data.customProperties as Record<string, number> || {}),
                                    [prop.id]: val
                                }
                            });
                        }}
                        min={prop.min}
                        max={prop.max}
                        step={prop.step || 'any'}
                    />
                </div>
            ))}

            <div className="prop-group">
                <label className="prop-label">Label</label>
                <input
                    className="prop-input"
                    type="text"
                    value={(node.data.label as string) || ''}
                    onChange={e => updateComponentData(node.id, { label: e.target.value })}
                />
            </div>

            <button className="prop-btn danger" onClick={() => removeComponent(node.id)}>
                🗑 Delete Component
            </button>
        </div>
    );
}
