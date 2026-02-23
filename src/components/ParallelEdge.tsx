import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react';

export function ParallelEdge({ 
  id, 
  source, 
  target, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  style, 
  markerEnd, 
  data 
}: EdgeProps) {
  const offset = Number(data?.offset) || 0;
  
  // normalize direction based on node id, makes perpendicular both directions
  const shouldFlip = source > target;
  const normalizedDx = shouldFlip ? sourceX - targetX : targetX - sourceX;
  const normalizedDy = shouldFlip ? sourceY - targetY : targetY - sourceY;
  const length = Math.sqrt(normalizedDx * normalizedDx + normalizedDy * normalizedDy);
  
  const perpX = -normalizedDy / length;
  const perpY = normalizedDx / length;
  
  const offsetSourceX = sourceX + perpX * offset;
  const offsetSourceY = sourceY + perpY * offset;
  const offsetTargetX = targetX + perpX * offset;
  const offsetTargetY = targetY + perpY * offset;
  
  const [edgePath] = getStraightPath({
    sourceX: offsetSourceX,
    sourceY: offsetSourceY,
    targetX: offsetTargetX,
    targetY: offsetTargetY,
  });

  return <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />;
}
