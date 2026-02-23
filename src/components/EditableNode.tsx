import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { MindMapNodeData } from '../types';
import { ColorPicker } from './ColorPicker';

type EditableNodeProps = {
  data: MindMapNodeData;
  id: string;
  selected: boolean;
  isShiftPressed: boolean;
};

export function EditableNode({ data, id, selected, isShiftPressed }: EditableNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: data.width || 150, height: data.height || 80 });
  const [localBackground, setLocalBackground] = useState(data.background || '#fff');
  const [localBorderColor, setLocalBorderColor] = useState(data.borderColor || '#7b2cbf');
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const resizeStartRef = React.useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // sync local state with prop changes
  useEffect(() => {
    setLabel(data.label);
  }, [data.label]);

  useEffect(() => {
    if (data.width !== undefined && data.height !== undefined) {
      setDimensions({ width: data.width, height: data.height });
    }
  }, [data.width, data.height]);

  useEffect(() => {
    setLocalBackground(data.background || '#fff');
    setLocalBorderColor(data.borderColor || '#7b2cbf');
  }, [data.background, data.borderColor]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(id, label);
    }
    if (data.onColorChange) {
      data.onColorChange(id, localBackground, localBorderColor);
    }
    if (data.onResize) {
      data.onResize(id, dimensions.width, dimensions.height);
    }
  }, [data, id, label, localBackground, localBorderColor, dimensions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      if (data.onLabelChange) {
        data.onLabelChange(id, label);
      }
      if (data.onColorChange) {
        data.onColorChange(id, localBackground, localBorderColor);
      }
      if (data.onResize) {
        data.onResize(id, dimensions.width, dimensions.height);
      }
    } else if (e.key === 'Escape') {
      setLabel(data.label);
      setLocalBackground(data.background || '#fff');
      setLocalBorderColor(data.borderColor || '#7b2cbf');
      setDimensions({ width: data.width || 150, height: data.height || 80 });
      setIsEditing(false);
    }
  }, [data, id, label, localBackground, localBorderColor, dimensions]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height,
    };
  }, [dimensions]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      
      let newWidth = Math.max(80, resizeStartRef.current.width + deltaX);
      let newHeight = Math.max(60, resizeStartRef.current.height + deltaY);

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (data.onResize && resizeStartRef.current) {
        data.onResize(id, dimensions.width, dimensions.height);
      }
      resizeStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dimensions, data, id]);

  // memoize shape specific styles, avoids recalc on render
  const shapeStyles = useMemo(() => {
    const shape = data.shape || 'rounded';
    const borderColor = localBorderColor;
    const baseStyle: React.CSSProperties = {
      padding: '10px 20px',
      background: localBackground,
      color: data.color || '#000',
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      textAlign: 'center',
      cursor: isEditing ? 'text' : isShiftPressed ? 'crosshair' : 'grab',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    };

    // apply shape specific styles
    switch (shape) {
      case 'rectangle':
        return { ...baseStyle, borderRadius: '0px', border: `2px solid ${borderColor}` };
      case 'rounded':
        return { ...baseStyle, borderRadius: '8px', border: `2px solid ${borderColor}` };
      case 'circle':
        return { 
          ...baseStyle, 
          borderRadius: '50%',
          border: `2px solid ${borderColor}`,
        };
      case 'diamond':
        return { 
          ...baseStyle,
          background: 'transparent',
          border: 'none',
          padding: '0',
          overflow: 'visible',
        };
      default:
        return { ...baseStyle, borderRadius: '8px', border: `2px solid ${borderColor}` };
    }
  }, [data.shape, data.color, localBackground, localBorderColor, dimensions, isEditing, isShiftPressed]);

  const isDiamond = (data.shape || 'rounded') === 'diamond';

  // memoize color picker buttons
  const colorPickerButtons = useMemo(() => (
    <div className="nodrag" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => { 
          e.stopPropagation(); 
          setShowFillPicker(!showFillPicker); 
          setShowBorderPicker(false); 
        }}
        style={{
          width: '24px',
          height: '24px',
          backgroundColor: localBackground,
          border: '2px solid #fff',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
        title="Fill Color"
      />
      <div
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => { 
          e.stopPropagation(); 
          setShowBorderPicker(!showBorderPicker); 
          setShowFillPicker(false); 
        }}
        style={{
          width: '24px',
          height: '24px',
          backgroundColor: localBorderColor,
          border: '2px solid #fff',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
        title="Border Color"
      />
      <ColorPicker
        show={showFillPicker}
        selectedColor={localBackground}
        onColorSelect={setLocalBackground}
        onClose={() => setShowFillPicker(false)}
      />
      <ColorPicker
        show={showBorderPicker}
        selectedColor={localBorderColor}
        onColorSelect={setLocalBorderColor}
        onClose={() => setShowBorderPicker(false)}
      />
    </div>
  ), [showFillPicker, showBorderPicker, localBackground, localBorderColor]);

  // memoize editing content
  const editingContent = useMemo(() => (
    <>
      <textarea
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
          marginBottom: '8px',
          resize: 'none',
          minHeight: '40px',
        }}
      />
      {colorPickerButtons}
    </>
  ), [label, handleBlur, handleKeyDown, colorPickerButtons]);

  const displayContent = useMemo(() => (
    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{label}</div>
  ), [label]);

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={shapeStyles}
      className={isShiftPressed ? 'nodrag' : ''}
    >
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
      
      {isDiamond ? (
        <>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: localBackground,
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }} />
          <svg 
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points="50,0 100,50 50,100 0,50"
              fill="none"
              stroke={localBorderColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            boxSizing: 'border-box',
            color: data.color || '#000',
          }}>
            {isEditing ? editingContent : displayContent}
          </div>
        </>
      ) : (
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 10px',
          boxSizing: 'border-box',
        }}>
          {isEditing ? editingContent : displayContent}
        </div>
      )}
      
      {selected && !isEditing && (
        <div
          className="resize-handle nodrag"
          onMouseDown={handleResizeStart}
          style={{
            bottom: '-6px',
            right: '-6px',
            display: 'block',
          }}
        />
      )}
    </div>
  );
}
