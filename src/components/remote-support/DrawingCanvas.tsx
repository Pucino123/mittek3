import { useRef, useEffect, useCallback } from 'react';

interface DrawingPoint {
  x: number;
  y: number;
  type: 'start' | 'draw' | 'end';
  tool: 'pencil' | 'circle' | 'arrow' | 'eraser';
  color: string;
}

interface DrawingCanvasProps {
  width: number;
  height: number;
  drawingPoints: DrawingPoint[];
  isAdmin?: boolean;
  selectedTool?: 'pencil' | 'circle' | 'arrow' | 'eraser';
  selectedColor?: string;
  onDraw?: (point: DrawingPoint) => void;
  onClear?: () => void;
}

export function DrawingCanvas({
  width,
  height,
  drawingPoints,
  isAdmin = false,
  selectedTool = 'pencil',
  selectedColor = '#ef4444',
  onDraw,
  onClear,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Render all drawing points to canvas
  const renderDrawings = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all points
    let currentPath: DrawingPoint[] = [];
    
    for (const point of drawingPoints) {
      if (point.type === 'start') {
        currentPath = [point];
      } else if (point.type === 'draw') {
        currentPath.push(point);
        
        if (point.tool === 'pencil' && currentPath.length >= 2) {
          const prev = currentPath[currentPath.length - 2];
          ctx.strokeStyle = point.color;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
          ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
          ctx.stroke();
        } else if (point.tool === 'eraser' && currentPath.length >= 2) {
          const prev = currentPath[currentPath.length - 2];
          ctx.clearRect(
            point.x * canvas.width - 15, 
            point.y * canvas.height - 15, 
            30, 
            30
          );
        }
      } else if (point.type === 'end') {
        if (currentPath.length > 0) {
          const start = currentPath[0];
          
          if (point.tool === 'circle') {
            const radius = Math.sqrt(
              Math.pow((point.x - start.x) * canvas.width, 2) +
              Math.pow((point.y - start.y) * canvas.height, 2)
            );
            ctx.strokeStyle = point.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(start.x * canvas.width, start.y * canvas.height, radius, 0, 2 * Math.PI);
            ctx.stroke();
          } else if (point.tool === 'arrow') {
            const startX = start.x * canvas.width;
            const startY = start.y * canvas.height;
            const endX = point.x * canvas.width;
            const endY = point.y * canvas.height;
            const headLength = 20;
            const angle = Math.atan2(endY - startY, endX - startX);
            
            ctx.strokeStyle = point.color;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            
            // Line
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headLength * Math.cos(angle - Math.PI / 6),
              endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headLength * Math.cos(angle + Math.PI / 6),
              endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
        }
        currentPath = [];
      }
    }
  }, [drawingPoints]);

  // Re-render when drawingPoints change
  useEffect(() => {
    renderDrawings();
  }, [renderDrawings]);

  // Get normalized coordinates (0-1 range)
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || e.changedTouches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || e.changedTouches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Normalize to 0-1 range for cross-device consistency
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isAdmin || !onDraw) return;
    e.preventDefault();
    
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    lastPosRef.current = coords;
    
    onDraw({
      ...coords,
      type: 'start',
      tool: selectedTool,
      color: selectedColor,
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isAdmin || !onDraw || !isDrawingRef.current) return;
    e.preventDefault();
    
    const coords = getCanvasCoords(e);
    
    if (selectedTool === 'pencil' || selectedTool === 'eraser') {
      onDraw({
        ...coords,
        type: 'draw',
        tool: selectedTool,
        color: selectedColor,
      });
    }
    
    lastPosRef.current = coords;
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isAdmin || !onDraw || !isDrawingRef.current) return;
    
    const coords = getCanvasCoords(e);
    
    onDraw({
      ...coords,
      type: 'end',
      tool: selectedTool,
      color: selectedColor,
    });
    
    isDrawingRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute inset-0 w-full h-full ${isAdmin ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
}
