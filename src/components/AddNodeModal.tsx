import React from 'react';
import type { NodeShape, ColorOption } from '../types';

// component for adding new node. customizable text, shape, fill and border color
type AddNodeModalProps = {
  show: boolean;
  newNodeText: string;
  selectedShape: NodeShape;
  selectedColor: string;
  selectedBorderColor: string;
  colorOptions: ColorOption[];
  onTextChange: (text: string) => void;
  onShapeChange: (shape: NodeShape) => void;
  onColorChange: (color: string) => void;
  onBorderColorChange: (color: string) => void;
  onAdd: () => void;
  onCancel: () => void;
};

// button style for modal actions
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

export const AddNodeModal: React.FC<AddNodeModalProps> = ({
  show,
  newNodeText,
  selectedShape,
  selectedColor,
  selectedBorderColor,
  colorOptions,
  onTextChange,
  onShapeChange,
  onColorChange,
  onBorderColorChange,
  onAdd,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Add New Node</h2>
        
        {/* node text input */}
        <div className="modal-section">
          <h3>Node Text</h3>
          <input
            type="text"
            value={newNodeText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Enter text (optional)"
            style={{
              width: '100%',
              padding: '10px',
              background: '#2a2a2a',
              border: '2px solid #555',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        
        {/* shape selection */}
        <div className="modal-section">
          <h3>Select Shape</h3>
          <div className="shape-options">
            <div 
              className={`shape-option ${selectedShape === 'rectangle' ? 'selected' : ''}`}
              onClick={() => onShapeChange('rectangle')}
            >
              ▭ Rectangle
            </div>
            <div 
              className={`shape-option ${selectedShape === 'rounded' ? 'selected' : ''}`}
              onClick={() => onShapeChange('rounded')}
            >
              ▢ Rounded
            </div>
            <div 
              className={`shape-option ${selectedShape === 'circle' ? 'selected' : ''}`}
              onClick={() => onShapeChange('circle')}
            >
              ● Circle
            </div>
            <div 
              className={`shape-option ${selectedShape === 'diamond' ? 'selected' : ''}`}
              onClick={() => onShapeChange('diamond')}
            >
              ◆ Diamond
            </div>
          </div>
        </div>

        {/* color selection for fill and border */}
        <div className="modal-section">
          <h3>Select Fill Color</h3>
          <div className="color-options">
            {colorOptions.map((color) => (
              <div
                key={color.value}
                className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
                style={{ 
                  backgroundColor: color.value,
                  border: selectedColor === color.value 
                    ? '4px solid #ffffff' 
                    : (color.value === '#ffffff' || color.value === '#000000') ? '2px solid #555' : '2px solid #555'
                }}
                onClick={() => onColorChange(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* border color selection */}
        <div className="modal-section">
          <h3>Select Border Color</h3>
          <div className="color-options">
            {colorOptions.map((color) => (
              <div
                key={color.value}
                className={`color-option ${selectedBorderColor === color.value ? 'selected' : ''}`}
                style={{ 
                  backgroundColor: color.value,
                  border: selectedBorderColor === color.value 
                    ? '4px solid #ffffff' 
                    : (color.value === '#ffffff' || color.value === '#000000') ? '2px solid #555' : '2px solid #555'
                }}
                onClick={() => onBorderColorChange(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* action buttons */}
        <div className="modal-buttons">
          <button onClick={onAdd} style={{...buttonStyle, flex: 1}}>
            Create Node
          </button>
          <button 
            onClick={onCancel} 
            style={{...buttonStyle, backgroundColor: '#555', flex: 1}}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
