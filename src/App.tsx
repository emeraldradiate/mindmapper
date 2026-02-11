import React, { useCallback, useState, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  Panel,
  Handle,
  Position,
  addEdge,
  ConnectionLineType,
  type Node,
  type Connection
} from '@xyflow/react';

// Import the mandatory React Flow styles
import '@xyflow/react/dist/style.css';

// Custom styles to center connection points
const customStyles = `
  /* Center all handles at node center with 1px size for centered connections */
  .react-flow__node .react-flow__handle {
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 1px !important;
    height: 1px !important;
  }
  /* Large invisible hit area (200px) for easy shift+drag interaction */
  .react-flow__node .react-flow__handle::before {
    content: '';
    position: absolute;
    width: 200px;
    height: 200px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  /* Style connection lines */
  .react-flow__edge-path {
    stroke: #fff !important;
    stroke-width: 2 !important;
  }
`;

// --- CUSTOM NODE COMPONENT ---
type MindMapNodeData = {
  label: string;
  background?: string;
  color?: string;
  onLabelChange?: (id: string, label: string) => void;
};

function EditableNode({ data, id }: { data: MindMapNodeData; id: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    setLabel(data.label);
  }, [data.label]);

  // Track shift key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(id, label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (data.onLabelChange) {
        data.onLabelChange(id, label);
      }
    } else if (e.key === 'Escape') {
      setLabel(data.label);
      setIsEditing(false);
    }
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: data.background || '#fff',
        color: data.color || '#000',
        border: '2px solid #7b2cbf',
        minWidth: '150px',
        textAlign: 'center',
        cursor: isEditing ? 'text' : isShiftPressed ? 'crosshair' : 'grab',
        position: 'relative',
      }}
      className={isShiftPressed ? 'nodrag' : ''}
    >
      {/* Small centered handles for connection points with large hit area */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ opacity: 0 }} 
        isConnectable={isShiftPressed} 
      />
      <Handle 
        type="source" 
        position={Position.Top} 
        style={{ opacity: 0 }} 
        isConnectable={isShiftPressed} 
      />
      
      {isEditing ? (
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="nodrag"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'inherit',
            fontSize: '14px',
            textAlign: 'center',
            fontFamily: 'inherit',
          }}
        />
      ) : (
        <div>{label}</div>
      )}
    </div>
  );
}

// Custom node types registry
const nodeTypes = {
  editableNode: EditableNode,
};

// --- STYLING ---
const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#7b2cbf',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
  display: 'inline-block',
  fontSize: '14px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

// --- INITIAL DATA ---
const initialNodes: Node<MindMapNodeData>[] = [
  { 
    id: '1', 
    type: 'editableNode',
    position: { x: 250, y: 5 }, 
    data: { 
      label: '🧠 My Main Idea',
      background: '#7b2cbf',
      color: '#fff'
    }
  },
  { 
    id: '2', 
    type: 'editableNode',
    position: { x: 100, y: 150 }, 
    data: { label: '✨ Aesthetic Feature' } 
  },
  { 
    id: '3', 
    type: 'editableNode',
    position: { x: 400, y: 150 }, 
    data: { label: '💾 File System Ready' } 
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', type: 'straight' },
  { id: 'e1-3', source: '1', target: '3', type: 'straight' },
];

// --- MAIN COMPONENT ---
export default function App() {
  // Try to load from localStorage first, otherwise use initial nodes
  const getInitialNodes = () => {
    const saved = localStorage.getItem('mindmap-nodes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialNodes;
      }
    }
    return initialNodes;
  };

  const getInitialEdges = () => {
    const saved = localStorage.getItem('mindmap-edges');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialEdges;
      }
    }
    return initialEdges;
  };

  // useNodesState and useEdgesState allow the UI to update when you drag things
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());

  // Auto-save to localStorage whenever nodes or edges change
  useEffect(() => {
    localStorage.setItem('mindmap-nodes', JSON.stringify(nodes));
    localStorage.setItem('mindmap-edges', JSON.stringify(edges));
  }, [nodes, edges]);

  // FUNCTION: Handle label changes from editable nodes
  const handleLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // FUNCTION: Add a new node
  const addNode = () => {
    const newNode = {
      id: `${Date.now()}`,
      type: 'editableNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: '💡 New Idea' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // FUNCTION: Handle new connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: 'straight' }, eds));
    },
    [setEdges]
  );

  // Add the onLabelChange callback to all nodes
  const nodesWithCallback = React.useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onLabelChange: handleLabelChange,
        },
      })),
    [nodes, handleLabelChange]
  );

  // FUNCTION: Save to Device
  const saveToJson = () => {
    const dataToSave = { nodes, edges };
    const fileData = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([fileData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = "mind-map-save.json";
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // FUNCTION: Load from Device
  const loadFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.nodes && json.edges) {
          setNodes(json.nodes);
          setEdges(json.edges);
        }
      } catch (err) {
        alert("Oops! That file doesn't look like a valid mind map.");
      }
    };
    reader.readAsText(file);
    // Reset the input so you can load the same file twice if needed
    event.target.value = "";
  };

  // FUNCTION: Clear and reset to initial state
  const clearMindMap = () => {
    if (confirm('Are you sure you want to clear the mind map and start fresh?')) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      localStorage.removeItem('mindmap-nodes');
      localStorage.removeItem('mindmap-edges');
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <div style={{ width: '100vw', height: '100vh', background: '#121212' }}>
        <ReactFlow 
          nodes={nodesWithCallback} 
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          selectionOnDrag={false}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          defaultEdgeOptions={{ type: 'straight' }}
          connectionLineType={ConnectionLineType.Straight}
          connectionLineStyle={{ stroke: '#7b2cbf', strokeWidth: 2 }}
          fitView
        >
        <Background color="#333" gap={20} />
        <Controls />
        <MiniMap nodeStrokeColor="#7b2cbf" maskColor="rgba(0,0,0,0.2)" />
        
        {/* The Action Panel */}
        <Panel position="top-right" style={{ display: 'flex', gap: '10px' }}>
          <button onClick={addNode} style={buttonStyle}>
            ➕ Add Node
          </button>

          <button onClick={saveToJson} style={buttonStyle}>
            💾 Save JSON
          </button>

          <label style={buttonStyle}>
            📂 Load JSON
            <input 
              type="file" 
              accept=".json" 
              onChange={loadFromJson} 
              style={{ display: 'none' }} 
            />
          </label>

          <button onClick={clearMindMap} style={{...buttonStyle, backgroundColor: '#d32f2f'}}>
            🗑️ Clear
          </button>
        </Panel>
      </ReactFlow>
    </div>
    </>
  );
}