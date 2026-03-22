import { useCircuitStore } from '../store/circuitStore';
import { downloadNbtBinary } from '../pipeline/nbtCompiler';

export default function Toolbar() {
  const clearAll = useCircuitStore(s => s.clearAll);
  const getCircuitState = useCircuitStore(s => s.getCircuitState);
  const activeLayer = useCircuitStore(s => s.activeLayer);
  const activeTool = useCircuitStore(s => s.activeTool);

  const handleExportJSON = () => {
    const state = getCircuitState();
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'circuit.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportNBT = async () => {
    try {
      const state = getCircuitState();
      await downloadNbtBinary(state, 'circuit_board.nbt');
    } catch (error) {
      alert('Failed to compile NBT schematic. Check console for details.');
      console.error(error);
    }
  };

  const toolLabel = activeTool === 'select' ? 'Select'
    : activeTool === 'wire' ? 'Wire Paint'
    : activeTool === 'eraser' ? 'Eraser'
    : activeTool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-logo">⚡</span>
        <h1 className="toolbar-title">PowerGrid Designer</h1>
      </div>

      <div className="toolbar-status">
        <span className="toolbar-status-item">
          Tool: <strong>{toolLabel}</strong>
        </span>
        <span className={`toolbar-status-item layer-badge ${activeLayer}`}>
          Layer: <strong>{activeLayer.toUpperCase()}</strong>
        </span>
      </div>

      <div className="toolbar-actions">
        <button 
            className="toolbar-btn" 
            onClick={handleExportNBT} 
            title="Export circuit as Minecraft NBT Schematic"
            style={{ backgroundColor: '#10b981', color: '#fff', borderColor: '#059669', fontWeight: 'bold' }}
        >
          🎮 Export NBT
        </button>
        <button className="toolbar-btn" onClick={handleExportJSON} title="Export circuit as JSON">
          📋 Export JSON
        </button>
        <button className="toolbar-btn danger" onClick={clearAll} title="Clear all components">
          🗑 Clear
        </button>
      </div>
    </div>
  );
}
