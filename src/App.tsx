import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  useReactFlow,
  ReactFlowProvider,
  Panel,
  ConnectionLineType,
  type Node,
  type Connection,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './App.css';

import { EditableNode } from './components/EditableNode';
import { ParallelEdge } from './components/ParallelEdge';
import { AddNodeModal } from './components/AddNodeModal';
import { DefaultLineColorModal } from './components/DefaultLineColorModal';
import type { MindMapNodeData, NodeShape } from './types';
import { COLOR_OPTIONS, QUICK_COLORS } from './constants/colors';

const nodeTypes = {
  editableNode: (props: any) => <EditableNode {...props} isShiftPressed={props.data.isShiftPressed} />,
};

const edgeTypes = {
  parallel: ParallelEdge,
};

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

// initial data - 3 nodes and 2 edges to start with
const initialNodes: Node<MindMapNodeData>[] = [
  { 
    id: '1', 
    type: 'editableNode',
    position: { x: 250, y: 5 }, 
    data: { 
      label: 'Main Idea',
      background: '#a855f7',
      color: '#fff',
      borderColor: '#ec4899',
      shape: 'rounded',
      width: 150,
      height: 80,
    }
  },
  { 
    id: '2', 
    type: 'editableNode',
    position: { x: 100, y: 150 }, 
    data: { 
      label: 'Goal',
      background: '#10b981',
      color: '#fff',
      borderColor: '#06b6d4',
      shape: 'circle',
      width: 120,
      height: 120,
    } 
  },
  { 
    id: '3', 
    type: 'editableNode',
    position: { x: 400, y: 150 }, 
    data: { 
      label: 'Idea',
      background: '#f97316',
      color: '#fff',
      borderColor: '#eab308',
      shape: 'diamond',
      width: 140,
      height: 100,
    } 
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', type: 'parallel', style: { stroke: '#10b981', strokeWidth: 2 }, data: { offset: 0 } },
  { id: 'e1-3', source: '1', target: '3', type: 'parallel', style: { stroke: '#f97316', strokeWidth: 2 }, data: { offset: 0 } },
];

// main Component
function AppContent() {
  const reactFlowInstance = useReactFlow();

  // shift key state, track at parent level and pass down
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // loads data from localStorage helper
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

  // useNodesState and useEdgesState update UI when dragging
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedShape, setSelectedShape] = useState<NodeShape>('rounded');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedBorderColor, setSelectedBorderColor] = useState('#ef4444');
  const [newNodeText, setNewNodeText] = useState('');
  
  // edge color picker state
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  // default line color state
  const [showDefaultLineColorModal, setShowDefaultLineColorModal] = useState(false);
  const [defaultLineColor, setDefaultLineColor] = useState('#ffffff');

  // undo/redo history state
  const [history, setHistory] = useState<Array<{ nodes: any[]; edges: any[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  // copy/paste state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copiedNode, setCopiedNode] = useState<any[]>([]);

  // track shift key state globally 
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

  // debounced autosave to localStorage when nodes or edges change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('mindmap-nodes', JSON.stringify(nodes));
      localStorage.setItem('mindmap-edges', JSON.stringify(edges));
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [nodes, edges]);

  // record history when nodes or edges change (but not during undo/redo)
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    // record current state, remove future history, and add new state
    const newState = { nodes, edges };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // limit to 100 steps (and current) to prevent memory issues
    if (newHistory.length > 101) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [nodes, edges]);

  // undo function
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    
    isUndoRedoRef.current = true;
    const previousState = history[historyIndex - 1];
    setNodes(previousState.nodes);
    setEdges(previousState.edges);
    setHistoryIndex(historyIndex - 1);
  }, [history, historyIndex, setNodes, setEdges]);

  // redo function
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    isUndoRedoRef.current = true;
    const nextState = history[historyIndex + 1];
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setHistoryIndex(historyIndex + 1);
  }, [history, historyIndex, setNodes, setEdges]);

  // handle label changes
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

  // handle resize changes
  const handleResize = useCallback((nodeId: string, width: number, height: number) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              width,
              height,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // handle color changes
  const handleColorChange = useCallback((nodeId: string, background: string, borderColor: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              background,
              borderColor,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // open modal for adding node
  const openAddNodeModal = useCallback(() => {
    setNewNodeText('');
    setShowModal(true);
  }, []);

  // add new node
  const addNode = useCallback(() => {
    const shape = selectedShape;
    // diamond shapes need larger dimensions to look good
    const width = shape === 'diamond' ? 160 : 80;
    const height = shape === 'diamond' ? 120 : 60;
    
    // get center of current viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // calculate center position in flow coordinates, offset by half to center
    const centerPosition = reactFlowInstance.screenToFlowPosition({
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    });
    
    const newNode = {
      id: `${Date.now()}`,
      type: 'editableNode',
      position: { 
        x: centerPosition.x - width / 2,
        y: centerPosition.y - height / 2
      },
      data: { 
        label: newNodeText.trim() || 'BLANK',
        background: selectedColor,
        color: '#fff',
        borderColor: selectedBorderColor,
        shape,
        width,
        height,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowModal(false);
  }, [selectedShape, selectedColor, selectedBorderColor, newNodeText, reactFlowInstance, setNodes]);

  // new connections between nodes (supports up to 3 edges between same nodes)
  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      
      setEdges((eds) => {
        const existingEdges = eds.filter(
          (edge) =>
            (edge.source === source && edge.target === target) ||
            (edge.source === target && edge.target === source)
        );
        
        if (existingEdges.length >= 3) {
          return eds;
        }
        
        // calculate offset for parallel lines (center first, then offset left/right)
        const offsets = [0, -10, 10];
        const offset = offsets[existingEdges.length] || 0;
        
        const newEdge = {
          ...connection,
          id: `${source}-${target}-${Date.now()}`, // unique ID to prevent overwrites
          type: 'parallel',
          style: { stroke: defaultLineColor, strokeWidth: 2 },
          data: { offset }, // store offset for custom rendering
        };
        
        return [...eds, newEdge];
      });
    },
    [setEdges, defaultLineColor]
  );

  // delete edge on right-click
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.preventDefault();
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    },
    [setEdges]
  );

  // delete selected nodes
  const deleteSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) return;
    
    const nodesToDelete = selectedNodes.map(n => n.id);
    setNodes((nds) => nds.filter((n) => !nodesToDelete.includes(n.id)));
    setEdges((eds) => eds.filter((e) => !nodesToDelete.includes(e.source) && !nodesToDelete.includes(e.target)));
  }, [nodes, setNodes, setEdges]);

  // delete node on right-click
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault();
      const selectedNodes = nodes.filter(n => n.selected);
      const nodesToDelete = selectedNodes.length > 0 ? selectedNodes.map(n => n.id) : [node.id];
      
      setNodes((nds) => nds.filter((n) => !nodesToDelete.includes(n.id)));
      setEdges((eds) => eds.filter((e) => !nodesToDelete.includes(e.source) && !nodesToDelete.includes(e.target)));
    },
    [setNodes, setEdges, nodes]
  );

  // track selected node on click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id);
    },
    []
  );

  // copy selected node(s)
  const copyNode = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0 && selectedNodeId) {
      const nodeToCopy = nodes.find(n => n.id === selectedNodeId);
      if (nodeToCopy) {
        setCopiedNode([nodeToCopy]);
      }
    } else if (selectedNodes.length > 0) {
      setCopiedNode(selectedNodes);
    }
  }, [selectedNodeId, nodes]);

  // paste copied node(s)
  const pasteNode = useCallback(() => {
    if (!copiedNode || copiedNode.length === 0) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerPosition = reactFlowInstance.screenToFlowPosition({
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    });

    // calculate center of copied nodes group
    const copiedArray = Array.isArray(copiedNode) ? copiedNode : [copiedNode];
    const avgX = copiedArray.reduce((sum, node) => sum + node.position.x, 0) / copiedArray.length;
    const avgY = copiedArray.reduce((sum, node) => sum + node.position.y, 0) / copiedArray.length;

    // create new nodes, maintain relative positions
    const newNodes = copiedArray.map((node, index) => ({
      ...node,
      id: `${Date.now()}-${index}`,
      position: {
        x: centerPosition.x + (node.position.x - avgX),
        y: centerPosition.y + (node.position.y - avgY),
      },
      selected: false,
    }));
    
    setNodes((nds) => [...nds, ...newNodes]);
    if (newNodes.length > 0) {
      setSelectedNodeId(newNodes[0].id);
    }
  }, [copiedNode, setNodes, reactFlowInstance]);

  // keyboard shortcuts for undo/redo/copy/paste/delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyNode();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteNode();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // don't delete if user is typing in an input or textarea
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          deleteSelectedNodes();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, copyNode, pasteNode, deleteSelectedNodes]);

  // open color picker on edge click
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: any) => {
      setSelectedEdgeId(edge.id);
    },
    []
  );

  // update edge color
  const updateEdgeColor = useCallback((color: string) => {
    if (!selectedEdgeId) return;
    
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === selectedEdgeId) {
          return {
            ...edge,
            style: { ...edge.style, stroke: color, strokeWidth: 2 },
          };
        }
        return edge;
      })
    );
  }, [selectedEdgeId, setEdges]);

  // add callbacks to all nodes - memoized
  const nodesWithCallback = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onLabelChange: handleLabelChange,
          onResize: handleResize,
          onColorChange: handleColorChange,
          isShiftPressed,
        },
      })),
    [nodes, handleLabelChange, handleResize, handleColorChange, isShiftPressed]
  );

  // save to JSON
  const saveToJson = useCallback(() => {
    const dataToSave = { nodes, edges };
    const fileData = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([fileData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = "mind-map-save.json";
    link.click();
    
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // load from JSON
  const loadFromJson = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
        alert("File is not a valid mind map.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }, [setNodes, setEdges]);

  // clear mind map
  const clearMindMap = useCallback(() => {
    if (confirm('Are you sure you want to clear the mind map and start fresh?')) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      localStorage.removeItem('mindmap-nodes');
      localStorage.removeItem('mindmap-edges');
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#121212' }}>
      <ReactFlow 
          nodes={nodesWithCallback} 
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          selectionOnDrag={false}
          selectionKeyCode={null}
          multiSelectionKeyCode='Shift'
          defaultEdgeOptions={{ type: 'parallel' }}
          connectionLineType={ConnectionLineType.Straight}
          connectionLineStyle={{ stroke: '#7b2cbf', strokeWidth: 2 }}
          fitView
        >
        <Background color="#333" gap={20} />
        <Controls />
        <MiniMap nodeStrokeColor="#7b2cbf" maskColor="rgba(0,0,0,0.2)" />
        
        {/* current line color panel */}
        <Panel position="top-left" style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowDefaultLineColorModal(true)} 
            style={{
              ...buttonStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: defaultLineColor,
                border: '2px solid white',
                borderRadius: '4px',
              }}
            />
            Current Line Color
          </button>
          <button onClick={openAddNodeModal} style={buttonStyle}>
            ➕ Add Node
          </button>
          <button 
            onClick={undo} 
            disabled={historyIndex <= 0}
            style={{
              ...buttonStyle,
              backgroundColor: historyIndex <= 0 ? '#555' : '#7b2cbf',
              cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
              opacity: historyIndex <= 0 ? 0.5 : 1,
            }}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            onClick={redo} 
            disabled={historyIndex >= history.length - 1}
            style={{
              ...buttonStyle,
              backgroundColor: historyIndex >= history.length - 1 ? '#555' : '#7b2cbf',
              cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
              opacity: historyIndex >= history.length - 1 ? 0.5 : 1,
            }}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
        </Panel>
        
        {/* action panel */}
        <Panel position="top-right" style={{ display: 'flex', gap: '10px' }}>

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

        {/* edge color picker panel */}
        {selectedEdgeId && (
          <Panel position="top-center" style={{
            background: '#2a2a2a',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '6px',
          }}>
            {QUICK_COLORS.map(color => (
              <div
                key={color}
                onClick={() => { updateEdgeColor(color); setSelectedEdgeId(null); }}
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: color,
                  border: '2px solid #555',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            ))}
          </Panel>
        )}
      </ReactFlow>

      {/* add node modal */}
      <AddNodeModal
        show={showModal}
        newNodeText={newNodeText}
        selectedShape={selectedShape}
        selectedColor={selectedColor}
        selectedBorderColor={selectedBorderColor}
        colorOptions={COLOR_OPTIONS}
        onTextChange={setNewNodeText}
        onShapeChange={setSelectedShape}
        onColorChange={setSelectedColor}
        onBorderColorChange={setSelectedBorderColor}
        onAdd={addNode}
        onCancel={() => { setShowModal(false); setNewNodeText(''); }}
      />

      {/* default line color modal */}
      <DefaultLineColorModal
        show={showDefaultLineColorModal}
        defaultLineColor={defaultLineColor}
        colorOptions={COLOR_OPTIONS}
        onColorChange={setDefaultLineColor}
        onClose={() => setShowDefaultLineColorModal(false)}
      />
    </div>
  );
}

// wrapper component for ReactFlow context
export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}