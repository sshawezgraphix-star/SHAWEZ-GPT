/**
 * Free AI Image Generation & Editing Service for ShawezGPT
 * Powered by zero-quota Pollinations.ai (Flux/Turbo) and HTML5 Canvas Transformation Studio.
 */

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  model?: "flux" | "turbo" | "flux-realism" | "flux-anime" | "flux-3d";
  seed?: number;
  enhance?: boolean;
  nologo?: boolean;
}

export interface ImageFilterOptions {
  brightness?: number; // 0 - 200 (default 100)
  contrast?: number;   // 0 - 200 (default 100)
  saturation?: number; // 0 - 200 (default 100)
  grayscale?: number;  // 0 - 100 (default 0)
  sepia?: number;      // 0 - 100 (default 0)
  blur?: number;       // 0 - 20 (default 0)
  hueRotate?: number;  // 0 - 360 (default 0)
  invert?: number;     // 0 - 100 (default 0)
}

/**
 * Builds a direct URL to a generated AI image
 */
export function buildImageUrl(options: ImageGenerationOptions): string {
  const {
    prompt,
    width = 1024,
    height = 1024,
    model = "flux",
    seed = Math.floor(Math.random() * 1000000),
    enhance = true,
    nologo = true,
  } = options;

  const encodedPrompt = encodeURIComponent(prompt.trim());
  const params = new URLSearchParams({
    width: width.toString(),
    height: height.toString(),
    model,
    seed: seed.toString(),
    enhance: enhance.toString(),
    nologo: nologo.toString(),
  });

  return `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
}

/**
 * Fetches the generated image and returns a base64 Data URL
 */
export async function generateFreeImage(options: ImageGenerationOptions): Promise<string> {
  const url = buildImageUrl(options);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to generate image (HTTP ${response.status})`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Applies visual canvas filters (brightness, contrast, grayscale, rotation, etc.) to an image
 */
export async function applyCanvasFilters(
  imageSrc: string,
  filters: ImageFilterOptions,
  transform: { rotation?: number; flipH?: boolean; flipV?: boolean } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Could not get 2D canvas context"));
      }

      const rot = transform.rotation || 0;
      const is90or270 = rot === 90 || rot === 270;

      canvas.width = is90or270 ? img.height : img.width;
      canvas.height = is90or270 ? img.width : img.height;

      // Filter string
      const b = filters.brightness ?? 100;
      const c = filters.contrast ?? 100;
      const s = filters.saturation ?? 100;
      const g = filters.grayscale ?? 0;
      const sep = filters.sepia ?? 0;
      const bl = filters.blur ?? 0;
      const h = filters.hueRotate ?? 0;
      const inv = filters.invert ?? 0;

      ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) grayscale(${g}%) sepia(${sep}%) blur(${bl}px) hue-rotate(${h}deg) invert(${inv}%)`;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);

      if (rot !== 0) {
        ctx.rotate((rot * Math.PI) / 180);
      }
      if (transform.flipH || transform.flipV) {
        ctx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);
      }

      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => reject(new Error("Failed to load image for editing: " + e));
    img.src = imageSrc;
  });
}
