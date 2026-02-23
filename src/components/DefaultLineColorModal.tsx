import React from 'react';
import type { ColorOption } from '../types';

// modal for setting current default line color
type DefaultLineColorModalProps = {
  show: boolean;
  defaultLineColor: string;
  colorOptions: ColorOption[];
  onColorChange: (color: string) => void;
  onClose: () => void;
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

export const DefaultLineColorModal: React.FC<DefaultLineColorModalProps> = ({
  show,
  defaultLineColor,
  colorOptions,
  onColorChange,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Set Default Line Color</h2>
        
        <div className="modal-section">
          <h3>Select Fill Color</h3>
          <div className="color-options">
            {colorOptions.map((color) => (
              <div
                key={color.value}
                className={`color-option ${defaultLineColor === color.value ? 'selected' : ''}`}
                style={{ 
                  backgroundColor: color.value,
                  border: defaultLineColor === color.value 
                    ? '4px solid #ffffff' 
                    : (color.value === '#ffffff' || color.value === '#000000') ? '2px solid #555' : '2px solid #555'
                }}
                onClick={() => onColorChange(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="modal-buttons">
          <button 
            onClick={onClose} 
            style={{...buttonStyle, flex: 1}}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
