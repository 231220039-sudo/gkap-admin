import React, { Component, Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  ContactShadows,
  Html,
  useTexture,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";

interface ThreeShirtViewerProps {
  colorHex?: string;
  textureUrl?: string | null;
  modelUrl?: string;
}

const transparentPixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg5j5x98AAAAASUVORK5CYII=";

// ─── Error Boundary ──────────────────────────────────────────────────────────
interface EBProps {
  children: React.ReactNode;
  fallbackRender: (reset: () => void) => React.ReactNode;
}
interface EBState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn("3D viewer error:", error.message);
  }
  handleReset = () => {
    this.setState({ hasError: false });
  };
  render() {
    if (this.state.hasError) {
      return this.props.fallbackRender(this.handleReset);
    }
    return this.props.children;
  }
}

// ─── Shirt Mesh ──────────────────────────────────────────────────────────────
const ShirtMesh = ({
  colorHex = "#f5f5f5",
  modelUrl = "/models/tshirt.glb",
  textureUrl,
}: ThreeShirtViewerProps) => {
  const baseColor = colorHex || "#f5f5f5";
  const shirtRef = useRef<THREE.Mesh>(null);
  const { scene } = useGLTF(modelUrl);

  const texture = useTexture(textureUrl || transparentPixel);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const clonedMaterials = useRef<THREE.Material[]>([]);
  useEffect(() => {
    if (!scene) return;
    const mats: THREE.Material[] = [];
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (!child.userData.__materialCloned) {
          child.material = child.material.clone();
          child.userData.__materialCloned = true;
        }
        child.castShadow = true;
        child.receiveShadow = true;
        mats.push(child.material);
      }
    });
    clonedMaterials.current = mats;
    return () => { mats.forEach((mat) => mat.dispose()); };
  }, [scene]);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (textureUrl && textureUrl !== transparentPixel) {
          child.material.map = texture;
          child.material.color = new THREE.Color('#ffffff');
        } else {
          child.material.map = null;
          child.material.color = new THREE.Color(baseColor);
        }
        if (child.material.roughness === undefined) child.material.roughness = 0.6;
        if (child.material.metalness === undefined) child.material.metalness = 0.05;
        child.material.needsUpdate = true;
      }
    });
  }, [scene, baseColor, textureUrl, texture]);

  return (
    <group position={[0, -0.5, 0]} scale={[0.6, 0.6, 0.6]}>
      <primitive object={scene} />
      <ContactShadows position={[0, -1, 0]} opacity={0.35} scale={4} blur={2.5} far={2} />
    </group>
  );
};

// ─── Background color ────────────────────────────────────────────────────────
const BackgroundColor = ({ colorHex }: { colorHex?: string }) => {
  if (!colorHex) return <color attach="background" args={["#0f172a"]} />;
  const c = colorHex.trim().toLowerCase();
  const hexToRgb = (hex: string) => {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    const num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  };
  let r = 0, g = 0, b = 0;
  if (c.startsWith("#") || /^[0-9a-f]{6}$/.test(c)) {
    ({ r, g, b } = hexToRgb(c.startsWith("#") ? c : `#${c}`));
  }
  if (c.startsWith("rgb")) {
    const nums = c.match(/\d+/g);
    if (nums && nums.length >= 3) [r, g, b] = nums.map(Number);
  }
  if (c === "black") { r = 0; g = 0; b = 0; }
  if (c === "white") { r = 255; g = 255; b = 255; }
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness < 60) return <color attach="background" args={["#dcd0d0"]} />;
  if (brightness > 200) return <color attach="background" args={["#000000"]} />;
  return <color attach="background" args={["#0f172a"]} />;
};

// ─── Fallback UI ─────────────────────────────────────────────────────────────
const WebGLFallback = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="text-5xl mb-4">👕</div>
    <h3 className="text-lg font-semibold text-slate-200 mb-2">3D Preview Unavailable</h3>
    <p className="text-sm text-slate-400 mb-4 max-w-xs">
      Your browser couldn't create a 3D context. This can happen on mobile or when too many tabs are open.
    </p>
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-slate-200 border border-slate-600 hover:bg-slate-700 h-9 px-3"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </button>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-slate-200 border border-slate-600 hover:bg-slate-700 h-9 px-3"
      >
        Reload Page
      </button>
    </div>
    <p className="text-xs text-slate-500 mt-3">
      Your design editor still works below — 3D preview is optional.
    </p>
  </div>
);

// ─── Main Viewer ─────────────────────────────────────────────────────────────
// Detect mobile viewport for quality scaling
const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 768;

// Lighter ShirtMesh for mobile — no ContactShadows
const ShirtMeshMobile = ({
  colorHex = "#f5f5f5",
  modelUrl = "/models/tshirt.glb",
  textureUrl,
}: ThreeShirtViewerProps) => {
  const baseColor = colorHex || "#f5f5f5";
  const { scene } = useGLTF(modelUrl);

  const texture = useTexture(textureUrl || transparentPixel);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (!child.userData.__materialCloned) {
          child.material = child.material.clone();
          child.userData.__materialCloned = true;
        }
        child.castShadow = false; // no shadows on mobile
        child.receiveShadow = false;
        if (textureUrl && textureUrl !== transparentPixel) {
          child.material.map = texture;
          child.material.color = new THREE.Color('#ffffff');
        } else {
          child.material.map = null;
          child.material.color = new THREE.Color(baseColor);
        }
        child.material.roughness = 0.6;
        child.material.metalness = 0.05;
        child.material.needsUpdate = true;
      }
    });
  }, [scene, baseColor, textureUrl, texture]);

  return (
    <group position={[0, -0.5, 0]} scale={[0.6, 0.6, 0.6]}>
      <primitive object={scene} />
    </group>
  );
};

const ThreeShirtViewerComponent = ({
  colorHex,
  modelUrl,
  textureUrl,
}: ThreeShirtViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const [isMobile, setIsMobile] = useState(isMobileViewport);

  const composedTextureUrl = textureUrl || null;

  // Track viewport changes (e.g. DevTools responsive mode toggle)
  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileViewport());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-large ${
        isFullscreen ? 'h-screen' : isMobile ? 'h-[280px]' : 'h-[520px]'
      }`}
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 w-9 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm"
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </button>

      <WebGLErrorBoundary
        fallbackRender={(resetBoundary) => (
          <WebGLFallback
            onRetry={() => {
              resetBoundary();
              setCanvasKey((k) => k + 1);
            }}
          />
        )}
      >
        <Canvas
          key={canvasKey}
          frameloop="demand"
          shadows={!isMobile}
          dpr={isMobile ? [1, 1] : [1, 2]}
          camera={{ position: [0, 0.8, 3.5], fov: 45 }}
          gl={{ antialias: !isMobile, powerPreference: 'default' }}
        >
          <BackgroundColor colorHex={colorHex} />
          <ambientLight intensity={isMobile ? 0.7 : 0.5} />
          <directionalLight
            castShadow={!isMobile}
            position={[5, 5, 5]}
            intensity={1.25}
            shadow-mapSize-width={isMobile ? 512 : 2048}
            shadow-mapSize-height={isMobile ? 512 : 2048}
          />
          {!isMobile && <directionalLight position={[-3, 4, -2]} intensity={0.6} />}

          <Suspense
            fallback={
              <Html center>
                <div className="px-4 py-2 rounded-lg bg-white/80 text-slate-900 text-sm font-medium shadow-sm">
                  Loading 3D preview...
                </div>
              </Html>
            }
          >
            {isMobile ? (
              <ShirtMeshMobile
                colorHex={colorHex}
                modelUrl={modelUrl}
                textureUrl={composedTextureUrl}
              />
            ) : (
              <ShirtMesh
                colorHex={colorHex}
                modelUrl={modelUrl}
                textureUrl={composedTextureUrl}
              />
            )}
            <Environment preset="city" />
          </Suspense>

          <OrbitControls enablePan={false} minDistance={2} maxDistance={6} enableDamping />
        </Canvas>
      </WebGLErrorBoundary>

      {!textureUrl && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-300/80 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
          Tip: Upload images to design your shirt
        </div>
      )}
    </div>
  );
};

export const ThreeShirtViewer = React.memo(ThreeShirtViewerComponent);

export default ThreeShirtViewer;

useGLTF.preload("/models/tshirt.glb");
