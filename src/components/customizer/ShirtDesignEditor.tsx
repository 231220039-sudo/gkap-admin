import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Trash2, ZoomIn, ZoomOut, Crop, X, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export interface DesignLayer {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

interface ShirtDesignEditorProps {
  shirtColor?: string;
  onDesignChange?: (hasDesign: boolean) => void;
  onComposedTextureChange?: (dataUrl: string | null) => void;
}

// Larger canvas dimensions for better editing experience
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1000;

// ─── Crop Modal Component ─────────────────────────────────────────────────────
type DragMode = 'none' | 'move' | 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom' | 'left' | 'right';
type CropRect = { x: number; y: number; width: number; height: number };

interface CropModalProps {
  imageUrl: string;
  initialCrop?: CropRect;
  onApply: (crop: CropRect) => void;
  onCancel: () => void;
}

const HANDLE_HIT = 20;
const MIN_CROP = 20;

// Detect which handle/region a point is over
function detectHitZone(
  mx: number, my: number, sc: CropRect,
): DragMode {
  // Corner hits (check first — they overlap edges)
  const corners: Array<{ mode: DragMode; cx: number; cy: number }> = [
    { mode: 'tl', cx: sc.x, cy: sc.y },
    { mode: 'tr', cx: sc.x + sc.width, cy: sc.y },
    { mode: 'bl', cx: sc.x, cy: sc.y + sc.height },
    { mode: 'br', cx: sc.x + sc.width, cy: sc.y + sc.height },
  ];
  for (const { mode, cx, cy } of corners) {
    if (Math.abs(mx - cx) < HANDLE_HIT && Math.abs(my - cy) < HANDLE_HIT) return mode;
  }
  // Edge hits
  if (mx >= sc.x && mx <= sc.x + sc.width) {
    if (Math.abs(my - sc.y) < 8) return 'top';
    if (Math.abs(my - (sc.y + sc.height)) < 8) return 'bottom';
  }
  if (my >= sc.y && my <= sc.y + sc.height) {
    if (Math.abs(mx - sc.x) < 8) return 'left';
    if (Math.abs(mx - (sc.x + sc.width)) < 8) return 'right';
  }
  // Inside crop area
  if (mx >= sc.x && mx <= sc.x + sc.width && my >= sc.y && my <= sc.y + sc.height) return 'move';
  return 'none';
}

function cursorForMode(mode: DragMode): string {
  switch (mode) {
    case 'move': return 'grab';
    case 'tl': case 'br': return 'nwse-resize';
    case 'tr': case 'bl': return 'nesw-resize';
    case 'top': case 'bottom': return 'ns-resize';
    case 'left': case 'right': return 'ew-resize';
    default: return 'default';
  }
}

function computeCrop(
  dragMode: DragMode, start: CropRect, natDx: number, natDy: number, natW: number, natH: number,
): CropRect {
  let { x, y, width, height } = start;
  switch (dragMode) {
    case 'move':
      x = Math.max(0, Math.min(natW - width, x + natDx));
      y = Math.max(0, Math.min(natH - height, y + natDy));
      break;
    case 'tl':
      x = Math.min(x + width - MIN_CROP, Math.max(0, x + natDx));
      y = Math.min(y + height - MIN_CROP, Math.max(0, y + natDy));
      width = start.x + start.width - x;
      height = start.y + start.height - y;
      break;
    case 'tr':
      width = Math.max(MIN_CROP, Math.min(natW - x, width + natDx));
      y = Math.min(y + height - MIN_CROP, Math.max(0, y + natDy));
      height = start.y + start.height - y;
      break;
    case 'bl':
      x = Math.min(x + width - MIN_CROP, Math.max(0, x + natDx));
      width = start.x + start.width - x;
      height = Math.max(MIN_CROP, Math.min(natH - y, height + natDy));
      break;
    case 'br':
      width = Math.max(MIN_CROP, Math.min(natW - x, width + natDx));
      height = Math.max(MIN_CROP, Math.min(natH - y, height + natDy));
      break;
    case 'top':
      y = Math.min(y + height - MIN_CROP, Math.max(0, y + natDy));
      height = start.y + start.height - y;
      break;
    case 'bottom':
      height = Math.max(MIN_CROP, Math.min(natH - y, height + natDy));
      break;
    case 'left':
      x = Math.min(x + width - MIN_CROP, Math.max(0, x + natDx));
      width = start.x + start.width - x;
      break;
    case 'right':
      width = Math.max(MIN_CROP, Math.min(natW - x, width + natDx));
      break;
  }
  return { x, y, width, height };
}

const CropModal: React.FC<CropModalProps> = ({ imageUrl, initialCrop, onApply, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const naturalSizeRef = useRef({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  // The committed crop (used for onApply)
  const [cropRegion, setCropRegion] = useState<CropRect>({ x: 0, y: 0, width: 100, height: 100 });
  // Live crop ref — updated every frame during drag, no React re-render
  const liveCropRef = useRef<CropRect>({ x: 0, y: 0, width: 100, height: 100 });

  // Drag refs (no state — avoids re-renders)
  const dragModeRef = useRef<DragMode>('none');
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, crop: { x: 0, y: 0, width: 0, height: 0 } });
  const rafIdRef = useRef(0);

  // Hover cursor — use direct DOM manipulation to avoid React re-renders
  const lastCursorRef = useRef('default');

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const ns = { width: img.naturalWidth, height: img.naturalHeight };
      naturalSizeRef.current = ns;
      setNaturalSize(ns);
      const initCrop = (initialCrop && initialCrop.width > 0)
        ? initialCrop
        : { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
      setCropRegion(initCrop);
      liveCropRef.current = initCrop;
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl, initialCrop]);

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(measure));
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Compute image display rect (pure function, no deps on crop)
  const getImgDisplay = useCallback(() => {
    if (naturalSize.width === 0 || containerSize.width === 0) return { x: 0, y: 0, width: 0, height: 0 };
    const pad = 20;
    const maxW = containerSize.width - pad * 2;
    const maxH = containerSize.height - pad * 2;
    const scale = Math.min(maxW / naturalSize.width, maxH / naturalSize.height, 1);
    const dw = naturalSize.width * scale;
    const dh = naturalSize.height * scale;
    return { x: (containerSize.width - dw) / 2, y: (containerSize.height - dh) / 2, width: dw, height: dh };
  }, [naturalSize, containerSize]);

  const imgDisplayRef = useRef(getImgDisplay());
  imgDisplayRef.current = getImgDisplay();

  // Convert natural crop to screen rect
  const cropToScreen = useCallback((crop: CropRect) => {
    const d = imgDisplayRef.current;
    const ns = naturalSizeRef.current;
    if (ns.width === 0 || d.width === 0) return { x: 0, y: 0, width: 0, height: 0 };
    const sx = d.width / ns.width;
    const sy = d.height / ns.height;
    return {
      x: d.x + crop.x * sx,
      y: d.y + crop.y * sy,
      width: crop.width * sx,
      height: crop.height * sy,
    };
  }, []);

  // ─── Drawing ────────────────────────────────────────────────────────
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const d = imgDisplayRef.current;
    if (!canvas || !img || d.width === 0) return;

    if (canvas.width !== containerSize.width || canvas.height !== containerSize.height) {
      canvas.width = containerSize.width;
      canvas.height = containerSize.height;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const crop = liveCropRef.current;
    const sc = cropToScreen(crop);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dimmed full image
    ctx.globalAlpha = 0.3;
    ctx.drawImage(img, d.x, d.y, d.width, d.height);

    // Bright crop region
    ctx.globalAlpha = 1.0;
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, sc.x, sc.y, sc.width, sc.height);

    // Crop border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(sc.x, sc.y, sc.width, sc.height);

    // Rule-of-thirds
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(sc.x + (sc.width / 3) * i, sc.y);
      ctx.lineTo(sc.x + (sc.width / 3) * i, sc.y + sc.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sc.x, sc.y + (sc.height / 3) * i);
      ctx.lineTo(sc.x + sc.width, sc.y + (sc.height / 3) * i);
      ctx.stroke();
    }

    // Corner handles
    const hs = 16;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    [
      { x: sc.x, y: sc.y, dx: 1, dy: 1 },
      { x: sc.x + sc.width, y: sc.y, dx: -1, dy: 1 },
      { x: sc.x, y: sc.y + sc.height, dx: 1, dy: -1 },
      { x: sc.x + sc.width, y: sc.y + sc.height, dx: -1, dy: -1 },
    ].forEach(({ x, y, dx, dy }) => {
      ctx.beginPath();
      ctx.moveTo(x + dx * hs, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * hs);
      ctx.stroke();
    });
  }, [containerSize, cropToScreen]);

  // Initial draw & redraw when committed crop/container changes
  useEffect(() => {
    if (imgLoaded) drawFrame();
  }, [imgLoaded, cropRegion, containerSize, drawFrame]);

  // ─── Drag handling (bypasses React state for performance) ───────────
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (dragModeRef.current === 'none') return;
      const dm = dragModeRef.current;
      const ds = dragStartRef.current;
      const d = imgDisplayRef.current;
      const ns = naturalSizeRef.current;
      if (d.width === 0) return;

      const natDx = (e.clientX - ds.mouseX) * (ns.width / d.width);
      const natDy = (e.clientY - ds.mouseY) * (ns.height / d.height);
      liveCropRef.current = computeCrop(dm, ds.crop, natDx, natDy, ns.width, ns.height);

      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(drawFrame);
    };

    const handleUp = () => {
      if (dragModeRef.current === 'none') return;
      dragModeRef.current = 'none';
      // Commit the live crop to React state
      setCropRegion({ ...liveCropRef.current });
      // Reset cursor
      if (containerRef.current) containerRef.current.style.cursor = 'default';
      lastCursorRef.current = 'default';
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [drawFrame]);

  // ─── Mouse down ─────────────────────────────────────────────────────
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const sc = cropToScreen(liveCropRef.current);
    const zone = detectHitZone(mx, my, sc);
    if (zone === 'none') return;

    e.preventDefault();
    e.stopPropagation();
    dragModeRef.current = zone;
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, crop: { ...liveCropRef.current } };
    const c = zone === 'move' ? 'grabbing' : cursorForMode(zone);
    if (containerRef.current) containerRef.current.style.cursor = c;
    lastCursorRef.current = c;
  };

  // ─── Hover cursor (direct DOM — zero React re-renders) ─────────────
  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (dragModeRef.current !== 'none') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const sc = cropToScreen(liveCropRef.current);
    const zone = detectHitZone(mx, my, sc);
    const c = cursorForMode(zone);
    if (c !== lastCursorRef.current) {
      lastCursorRef.current = c;
      if (containerRef.current) containerRef.current.style.cursor = c;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: '50vw',
          maxWidth: 700,
          height: '55vh',
          maxHeight: 600,
          minWidth: 380,
          minHeight: 350,
          background: '#1a1a1a',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <h3 className="text-white font-semibold text-sm">Crop Image</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onApply(liveCropRef.current)}
            className="text-green-400 hover:text-green-300 hover:bg-green-400/10 font-semibold"
          >
            <Check className="w-4 h-4 mr-1" />
            Done
          </Button>
        </div>

        {/* Crop Area */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden select-none"
          onMouseDown={handleContainerMouseDown}
          onMouseMove={handleContainerMouseMove}
          style={{ cursor: 'default' }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          />
          {!imgLoaded && (
            <div className="flex items-center justify-center h-full text-white/50 text-sm">
              Loading image...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-white/40 text-xs">Drag corners or edges to crop • Click inside to move</p>
        </div>
      </div>
    </div>
  );
};

// ─── Main Editor Component ────────────────────────────────────────────────────
export const ShirtDesignEditor: React.FC<ShirtDesignEditorProps> = ({
  shirtColor = '#f5f5f5',
  onDesignChange,
  onComposedTextureChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [layers, setLayers] = useState<DesignLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [hasPendingPreview, setHasPendingPreview] = useState(false);
  const [isApplyingPreview, setIsApplyingPreview] = useState(false);
  const [cropModalLayerId, setCropModalLayerId] = useState<string | null>(null);
  const initialRenderRef = useRef(true);

  const templateRef = useRef<HTMLImageElement | null>(null);

  // Keep refs in sync with state so draw function always reads fresh values
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const selectedLayerIdRef = useRef(selectedLayerId);
  selectedLayerIdRef.current = selectedLayerId;
  const loadedImagesRef = useRef(loadedImages);
  loadedImagesRef.current = loadedImages;
  const templateLoadedRef = useRef(templateLoaded);
  templateLoadedRef.current = templateLoaded;
  const shirtColorRef = useRef(shirtColor);
  shirtColorRef.current = shirtColor;

  // Stable redrawCanvas that reads from refs — never goes stale
  const redrawCanvas = useCallback((overrideImages?: Record<string, HTMLImageElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentLayers = layersRef.current;
    const currentSelectedId = selectedLayerIdRef.current;
    const currentImages = overrideImages ?? loadedImagesRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw shirt background
    if (templateRef.current && templateLoadedRef.current) {
      ctx.drawImage(templateRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = shirtColorRef.current;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw all image layers using cached images
    currentLayers.forEach((layer) => {
      const img = currentImages[layer.id];
      if (!img) return;

      ctx.save();

      // Apply transformations
      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      try {
        if (
          layer.cropX !== undefined &&
          layer.cropY !== undefined &&
          layer.cropWidth !== undefined &&
          layer.cropHeight !== undefined
        ) {
          ctx.drawImage(
            img,
            layer.cropX, layer.cropY, layer.cropWidth, layer.cropHeight,
            layer.x, layer.y, layer.width, layer.height,
          );
        } else {
          ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
        }
      } catch (error) {
        console.error('Error drawing image for layer:', layer.id, error);
      }

      ctx.restore();

      // Draw selection border if selected
      if (currentSelectedId === layer.id) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

        const handleSize = 10;

        const corners = [
          { x: layer.x - handleSize / 2, y: layer.y - handleSize / 2 },
          { x: layer.x + layer.width - handleSize / 2, y: layer.y - handleSize / 2 },
          { x: layer.x - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
          { x: layer.x + layer.width - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
        ];

        ctx.fillStyle = '#3b82f6';
        ctx.setLineDash([]);
        corners.forEach((c) => {
          ctx.fillRect(c.x, c.y, handleSize, handleSize);
        });
      }
    });
  }, []); // stable — reads from refs

  // Load the shirt template
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      templateRef.current = img;
      setTemplateLoaded(true);
    };
    img.onerror = () => {
      console.warn('Failed to load Template.png, using color background');
      setTemplateLoaded(true);
    };
    img.src = '/models/Template.png';
  }, []);

  // Load images when layers change
  useEffect(() => {
    layers.forEach((layer) => {
      setLoadedImages((prev) => {
        if (prev[layer.id]) return prev;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setLoadedImages((current) => ({ ...current, [layer.id]: img }));
        };
        img.onerror = (error) => {
          console.error('Failed to load image for layer:', layer.id, error);
        };
        img.src = layer.imageUrl;
        return prev;
      });
    });

    // Clean up removed layers
    setLoadedImages((prev) => {
      const currentLayerIds = new Set(layers.map((l) => l.id));
      const cleaned = { ...prev };
      let hasChanges = false;
      Object.keys(cleaned).forEach((id) => {
        if (!currentLayerIds.has(id)) {
          delete cleaned[id];
          hasChanges = true;
        }
      });
      return hasChanges ? cleaned : prev;
    });
  }, [layers]);

  // Redraw canvas whenever any visual state changes
  useEffect(() => {
    redrawCanvas();
  }, [layers, selectedLayerId, templateLoaded, shirtColor, loadedImages, redrawCanvas]);

  // Notify parent about design presence & pending preview
  useEffect(() => {
    onDesignChange?.(layers.length > 0);

    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    setHasPendingPreview(true);
  }, [layers, onDesignChange]);

  // Generate composed texture for export
  const generateComposedTexture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 4267;
    exportCanvas.height = 4267;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = exportCanvas.width / CANVAS_WIDTH;
    const scaleY = exportCanvas.height / CANVAS_HEIGHT;

    ctx.fillStyle = shirtColor;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // NOTE: Do NOT draw Template.png here — it contains FRONT/BACK guide text
    // that should only appear in the 2D editor, not on the 3D model.

    let imagesDrawn = 0;
    const totalImages = layers.length;

    if (totalImages === 0) {
      const dataUrl = exportCanvas.toDataURL('image/png');
      onComposedTextureChange?.(dataUrl);
      return dataUrl;
    }

    layers.forEach((layer) => {
      const img = loadedImages[layer.id];
      if (!img) {
        imagesDrawn++;
        if (imagesDrawn === totalImages) {
          const dataUrl = exportCanvas.toDataURL('image/png');
          onComposedTextureChange?.(dataUrl);
        }
        return;
      }

      ctx.save();

      const scaledX = layer.x * scaleX;
      const scaledY = layer.y * scaleY;
      const scaledWidth = layer.width * scaleX;
      const scaledHeight = layer.height * scaleY;

      const centerX = scaledX + scaledWidth / 2;
      const centerY = scaledY + scaledHeight / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      try {
        if (
          layer.cropX !== undefined &&
          layer.cropY !== undefined &&
          layer.cropWidth !== undefined &&
          layer.cropHeight !== undefined
        ) {
          ctx.drawImage(
            img,
            layer.cropX, layer.cropY, layer.cropWidth, layer.cropHeight,
            scaledX, scaledY, scaledWidth, scaledHeight,
          );
        } else {
          ctx.drawImage(img, scaledX, scaledY, scaledWidth, scaledHeight);
        }
      } catch (error) {
        console.warn('Error drawing image to export canvas:', error);
      }

      ctx.restore();
      imagesDrawn++;

      if (imagesDrawn === totalImages) {
        const dataUrl = exportCanvas.toDataURL('image/png');
        onComposedTextureChange?.(dataUrl);
      }
    });

    return exportCanvas.toDataURL('image/png');
  }, [layers, shirtColor, templateLoaded, onComposedTextureChange, loadedImages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;

      const newLayer: DesignLayer = {
        id: Date.now().toString(),
        imageUrl,
        x: CANVAS_WIDTH / 2 - 150,
        y: CANVAS_HEIGHT / 2 - 150,
        width: 300,
        height: 300,
        rotation: 0,
        zIndex: layers.length,
      };

      setLayers((prev) => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getPointerPosition = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Use refs for drag state so mouse-move handler never has stale values
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const coords = getPointerPosition(e);
    if (!coords) return;

    const { x, y } = coords;
    const currentLayers = layersRef.current;

    let targetLayer: DesignLayer | undefined;
    for (const layer of [...currentLayers].reverse()) {
      if (x >= layer.x && x <= layer.x + layer.width && y >= layer.y && y <= layer.y + layer.height) {
        targetLayer = layer;
        break;
      }
    }

    if (!targetLayer) {
      setSelectedLayerId(null);
      isDraggingRef.current = false;
      setIsDragging(false);
      return;
    }

    setSelectedLayerId(targetLayer.id);
    isDraggingRef.current = true;
    dragStartRef.current = { x: x - targetLayer.x, y: y - targetLayer.y };
    setIsDragging(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const currentSelectedId = selectedLayerIdRef.current;
    if (!currentSelectedId || !isDraggingRef.current) return;

    const coords = getPointerPosition(e);
    if (!coords) return;

    const { x, y } = coords;
    const ds = dragStartRef.current;
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === currentSelectedId
          ? {
              ...layer,
              x: Math.max(0, Math.min(CANVAS_WIDTH - layer.width, x - ds.x)),
              y: Math.max(0, Math.min(CANVAS_HEIGHT - layer.height, y - ds.y)),
            }
          : layer,
      ),
    );
  };

  const handleCanvasMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const updateSelectedLayer = (updates: Partial<DesignLayer>) => {
    if (!selectedLayerId) return;
    setLayers((prev) =>
      prev.map((layer) => (layer.id === selectedLayerId ? { ...layer, ...updates } : layer)),
    );
  };

  const deleteSelectedLayer = () => {
    if (!selectedLayerId) return;
    setLayers((prev) => prev.filter((layer) => layer.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  const clearAllLayers = () => {
    setLayers([]);
    setSelectedLayerId(null);
    setLoadedImages({});
  };

  const handleApplyToPreview = () => {
    if (isApplyingPreview || !hasPendingPreview) return;

    setIsApplyingPreview(true);
    requestAnimationFrame(() => {
      if (layers.length === 0) {
        onComposedTextureChange?.(null);
        setHasPendingPreview(false);
        setIsApplyingPreview(false);
        return;
      }
      const texture = generateComposedTexture();
      if (texture) {
        onComposedTextureChange?.(texture);
      }
      setHasPendingPreview(false);
      setIsApplyingPreview(false);
    });
  };

  // Crop modal handlers
  const cropModalLayer = cropModalLayerId ? layers.find((l) => l.id === cropModalLayerId) : null;

  const handleCropApply = (crop: { x: number; y: number; width: number; height: number }) => {
    if (!cropModalLayerId) return;
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== cropModalLayerId) return layer;
        // Update display dimensions to match the new crop aspect ratio
        const cropAspect = crop.width / crop.height;
        const currentArea = layer.width * layer.height;
        // Keep roughly the same visual area but adjust to new aspect ratio
        const newHeight = Math.sqrt(currentArea / cropAspect);
        const newWidth = newHeight * cropAspect;
        return {
          ...layer,
          cropX: crop.x,
          cropY: crop.y,
          cropWidth: crop.width,
          cropHeight: crop.height,
          width: newWidth,
          height: newHeight,
        };
      }),
    );
    setCropModalLayerId(null);
  };

  const handleCropCancel = () => {
    setCropModalLayerId(null);
  };

  const handleResetCrop = () => {
    if (!selectedLayerId) return;
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedLayerId
          ? { ...layer, cropX: undefined, cropY: undefined, cropWidth: undefined, cropHeight: undefined }
          : layer,
      ),
    );
  };

  return (
    <>
      {/* Crop Modal */}
      {cropModalLayer && (
        <CropModal
          imageUrl={cropModalLayer.imageUrl}
          initialCrop={
            cropModalLayer.cropX !== undefined
              ? {
                  x: cropModalLayer.cropX,
                  y: cropModalLayer.cropY!,
                  width: cropModalLayer.cropWidth!,
                  height: cropModalLayer.cropHeight!,
                }
              : undefined
          }
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}

      <div className="space-y-4">
        {/* Upload Button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg">Design Editor</h3>
            <p className="text-sm text-muted-foreground">Upload and position your images on the t-shirt</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Add Image
            </Button>
            {layers.length > 0 && (
              <Button variant="outline" onClick={clearAllLayers}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Background Remover */}
        <a
          href="https://www.remove.bg/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors group"
        >
          <span className="text-sm font-medium text-primary group-hover:underline">🖼️ Background Remover</span>
          <ExternalLink className="w-4 h-4 text-primary" />
        </a>

        {/* Canvas */}
        <div className="border-2 border-dashed border-border rounded-xl p-2 md:p-4 bg-muted/20">
          <div className="overflow-auto max-h-[400px] md:max-h-[800px]">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border border-border rounded-lg bg-white cursor-pointer mx-auto block"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-between rounded-xl border border-dashed border-border px-4 py-3 bg-muted/10">
          <p className="text-sm text-muted-foreground">
            {hasPendingPreview
              ? 'Changes not yet applied to the 3D preview.'
              : '3D preview is up to date.'}
          </p>
          <Button
            onClick={handleApplyToPreview}
            disabled={!hasPendingPreview || isApplyingPreview}
          >
            {isApplyingPreview ? 'Applying…' : 'Apply to 3D Preview'}
          </Button>
        </div>

        {/* Layer Controls */}
        {selectedLayer && (
          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Layer Controls</h4>
              <Button variant="outline" size="sm" onClick={deleteSelectedLayer}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>

            <div className="space-y-4">
              {/* Size Controls */}
              <div>
                <label className="text-sm font-medium mb-2 block">Size</label>
                <div className="flex items-center gap-4 mb-3">
                  <Slider
                    value={[selectedLayer.width]}
                    min={50}
                    max={800}
                    step={5}
                    onValueChange={([val]) => {
                      const ratio = selectedLayer.height / selectedLayer.width;
                      updateSelectedLayer({ width: val, height: val * ratio });
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {Math.round(selectedLayer.width)}px
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateSelectedLayer({
                        width: selectedLayer.width * 0.9,
                        height: selectedLayer.height * 0.9,
                      })
                    }
                  >
                    <ZoomOut className="w-4 h-4 mr-1" />
                    Smaller
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateSelectedLayer({
                        width: selectedLayer.width * 1.1,
                        height: selectedLayer.height * 1.1,
                      })
                    }
                  >
                    <ZoomIn className="w-4 h-4 mr-1" />
                    Larger
                  </Button>
                </div>
              </div>


              {/* Crop Button */}
              <div>
                <label className="text-sm font-medium mb-2 block">Crop</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCropModalLayerId(selectedLayerId)}
                  >
                    <Crop className="w-4 h-4 mr-1" />
                    Crop Image
                  </Button>
                  {selectedLayer.cropX !== undefined && (
                    <Button variant="outline" size="sm" onClick={handleResetCrop}>
                      <X className="w-4 h-4 mr-1" />
                      Reset Crop
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        {layers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Click "Add Image" to start designing your t-shirt</p>
            <p className="text-sm mt-1">You can upload multiple images and position them anywhere</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ShirtDesignEditor;