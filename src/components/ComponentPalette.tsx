import { COMPONENT_REGISTRY, type ToolType } from '../types/circuit';
import { useCircuitStore } from '../store/circuitStore';

/** Tool-selector component palette sidebar */
export default function ComponentPalette() {
  const activeTool = useCircuitStore(s => s.activeTool);
  const setActiveTool = useCircuitStore(s => s.setActiveTool);
  const activeLayer = useCircuitStore(s => s.activeLayer);
  const toggleLayer = useCircuitStore(s => s.toggleLayer);

  const categories = [
    { key: 'passive', label: '🔧 Passive' },
    { key: 'active', label: '💡 Active' },
    { key: 'switching', label: '🔀 Switching' },
  ] as const;

  return (
    <div className="component-palette">
      <h2 className="palette-title">Tools</h2>

      {/* Built-in tools */}
      <div className="palette-category">
        <h3 className="palette-category-label">🖱 General</h3>
        <div className="palette-items">
          <ToolItem
            tool="select"
            label="Select"
            shortcut="ESC"
            color="#94a3b8"
            active={activeTool === 'select'}
            onSelect={() => setActiveTool('select')}
          />
          <ToolItem
            tool="wire"
            label="Wire Paint"
            shortcut="W"
            color="#f59e0b"
            active={activeTool === 'wire'}
            onSelect={() => setActiveTool('wire')}
          />
          <ToolItem
            tool="eraser"
            label="Eraser"
            shortcut="E"
            color="#f43f5e"
            active={activeTool === 'eraser'}
            onSelect={() => setActiveTool('eraser')}
          />
        </div>
      </div>

      {/* Layer toggle */}
      <div className="palette-category">
        <h3 className="palette-category-label">📐 Layer</h3>
        <div className="palette-items">
          <button
            className={`palette-layer-toggle ${activeLayer}`}
            onClick={toggleLayer}
          >
            <span className="layer-indicator" data-layer={activeLayer} />
            <span className="layer-text">{activeLayer === 'front' ? 'Front' : 'Back'}</span>
            <span className="palette-shortcut">F</span>
          </button>
        </div>
      </div>

      {/* Component tools */}
      {categories.map(cat => {
        const items = COMPONENT_REGISTRY.filter(c => c.category === cat.key);
        if (!items.length) return null;
        return (
          <div key={cat.key} className="palette-category">
            <h3 className="palette-category-label">{cat.label}</h3>
            <div className="palette-items">
              {items.map(comp => (
                <ToolItem
                  key={comp.type}
                  tool={comp.type}
                  label={comp.label}
                  shortcut={comp.shortcutKey?.toUpperCase()}
                  color={comp.color}
                  active={activeTool === comp.type}
                  onSelect={() => setActiveTool(comp.type as ToolType)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ToolItem({ label, shortcut, color, active, onSelect }: {
  tool: string;
  label: string;
  shortcut?: string;
  color: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`palette-item ${active ? 'active' : ''}`}
      onClick={onSelect}
      style={{ '--accent': color } as React.CSSProperties}
    >
      <div className="palette-item-icon" style={{ backgroundColor: color + '20', borderColor: active ? color : 'transparent' }}>
        <span className="palette-item-dot" style={{ backgroundColor: color }} />
      </div>
      <span className="palette-item-label">{label}</span>
      {shortcut && <span className="palette-shortcut">{shortcut}</span>}
    </button>
  );
}
