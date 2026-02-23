import React from 'react';
import { QUICK_COLORS } from '../constants/colors';

// quick color picker for node and line modals
type ColorPickerProps = {
  show: boolean;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
};

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  show, 
  selectedColor, 
  onColorSelect,
  onClose,
  position = 'top'
}) => {
  if (!show) return null;

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: 'absolute',
        top: position === 'top' ? '30px' : 'auto',
        bottom: position === 'bottom' ? '30px' : 'auto',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#2a2a2a',
        padding: '8px',
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: 1000,
      }}
    >
      {QUICK_COLORS.map(color => (
        <div
          key={color}
          onClick={() => {
            onColorSelect(color);
            onClose();
          }}
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: color,
            border: selectedColor === color ? '2px solid #fff' : '1px solid #555',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        />
      ))}
    </div>
  );
};
