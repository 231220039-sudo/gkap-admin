import { useEffect, useRef, useState } from "react";

interface TextureCompositorOptions {
  baseColor: string;
  userTemplate?: string | null;
  sideImages?: Partial<Record<"front" | "back" | "left" | "right", string | null>>;
  showReferenceTemplate?: boolean;
}

export const useTextureCompositor = ({
  baseColor,
  userTemplate = null,
  sideImages = {},
  showReferenceTemplate = false,
}: TextureCompositorOptions) => {
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const templateRef = useRef<HTMLImageElement | null>(null);
  const referenceRef = useRef<HTMLImageElement | null>(null);
  const imagesRef = useRef<Partial<Record<string, HTMLImageElement>>>({});

  // Load UV template and reference once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/models/Template.png";
    img.onload = () => {
      templateRef.current = img;
    };
    img.onerror = () => {
      console.warn("Failed to load Template.png");
    };

    const ref = new Image();
    ref.crossOrigin = "anonymous";
    ref.src = "/models/Template.png";
    ref.onload = () => {
      referenceRef.current = ref;
    };
    ref.onerror = () => {
      console.warn("Failed to load reference Template.png");
    };
  }, []);

  // Load side images
  useEffect(() => {
    const tempImages: Partial<Record<string, HTMLImageElement>> = {};
    let loaded = 0;
    const toLoad = Object.entries(sideImages || {}).filter(([, v]) => !!v).length;

    if (toLoad === 0) {
      imagesRef.current = {};
      return;
    }

    Object.entries(sideImages || {}).forEach(([key, src]) => {
      if (!src) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        tempImages[key] = img;
        loaded += 1;
        if (loaded === toLoad) {
          imagesRef.current = tempImages;
        }
      };
      img.onerror = () => {
        console.warn("Failed to load image:", key);
        loaded += 1;
        if (loaded === toLoad) {
          imagesRef.current = tempImages;
        }
      };
      img.src = src;
    });
  }, [sideImages]);

  // Composite texture whenever inputs change
  useEffect(() => {
    try {
      const template = templateRef.current;
      const reference = referenceRef.current;
      const loadedImages = imagesRef.current;

      // If user provided a full UV template, use it directly
      if (userTemplate) {
        setTextureUrl(userTemplate);
        return;
      }

      // No images loaded yet - just use base color
      if (!template) {
        // Create a default 2048x2048 canvas with base color
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;
        canvas.width = 2048;
        canvas.height = 2048;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 2048, 2048);
        setTextureUrl(canvas.toDataURL("image/png"));
        return;
      }

      const width = template.width;
      const height = template.height;

      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear and base color
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, width, height);

      // Optional reference overlay
      if (showReferenceTemplate && reference) {
        ctx.save();
        const hasSides = Object.keys(loadedImages || {}).length > 0;
        ctx.globalAlpha = hasSides ? 0.35 : 0.8;
        ctx.drawImage(reference, 0, 0, width, height);
        ctx.restore();
      }

      // If no side images, just use base color
      if (!loadedImages || Object.keys(loadedImages).length === 0) {
        setTextureUrl(canvas.toDataURL("image/png"));
        return;
      }

      // Zones for mapping side images to UV template
      // Based on T-shirt template structure: FRONT (top-center), BACK (bottom-center), LEFT (bottom-left), RIGHT (bottom-right)
      const zones: Record<string, { x: number; y: number; width: number; height: number }> = {
        // Front: Large area at top-center (main chest area)
        front: {
          x: width * 0.2,
          y: height * 0.05,
          width: width * 0.6,
          height: height * 0.45,
        },
        // Back: Large area at bottom-center (main back area)
        back: {
          x: width * 0.2,
          y: height * 0.5,
          width: width * 0.6,
          height: height * 0.45,
        },
        // Left: Smaller area on left (left sleeve)
        left: {
          x: width * 0.05,
          y: height * 0.5,
          width: width * 0.15,
          height: height * 0.45,
        },
        // Right: Smaller area on right (right sleeve)
        right: {
          x: width * 0.8,
          y: height * 0.5,
          width: width * 0.15,
          height: height * 0.45,
        },
      };

      const drawFit = (
        img: HTMLImageElement,
        zone: { x: number; y: number; width: number; height: number }
      ) => {
        try {
          const aspect = img.width / img.height;
          let w = zone.width;
          let h = w / aspect;
          if (h > zone.height) {
            h = zone.height;
            w = h * aspect;
          }
          const dx = zone.x + (zone.width - w) / 2;
          const dy = zone.y + (zone.height - h) / 2;
          ctx.drawImage(img, dx, dy, w, h);
        } catch (err) {
          console.warn("Failed to draw image in zone", err);
        }
      };

      for (const [key, img] of Object.entries(loadedImages || {})) {
        if (img) {
          const zone = zones[key];
          if (zone) {
            drawFit(img, zone);
          }
        }
      }

      const url = canvas.toDataURL("image/png");
      setTextureUrl(url);
    } catch (err) {
      console.error("Texture compositor error:", err);
      setTextureUrl(null);
    }
  }, [baseColor, userTemplate, showReferenceTemplate, sideImages]);

  return textureUrl;
};
