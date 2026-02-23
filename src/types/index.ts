export type NodeShape = 'rectangle' | 'rounded' | 'circle' | 'diamond';

export type MindMapNodeData = {
  label: string;
  background?: string;
  color?: string;
  borderColor?: string;
  shape?: NodeShape;
  width?: number;
  height?: number;
  onLabelChange?: (id: string, label: string) => void;
  onResize?: (id: string, width: number, height: number) => void;
  onColorChange?: (id: string, background: string, borderColor: string) => void;
};

export type ColorOption = {
  name: string;
  value: string;
};
