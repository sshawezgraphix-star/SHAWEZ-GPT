import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Download,
  Image as ImageIcon,
  Sliders,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Wand2,
  RefreshCw,
  Send,
  Upload,
  Check,
} from "lucide-react";
import {
  buildImageUrl,
  generateFreeImage,
  applyCanvasFilters,
  ImageFilterOptions,
} from "../services/imageStudio";

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (imageDataUrl: string, promptText: string) => void;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<"generate" | "edit">("generate");

  // Generator State
  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState<"flux" | "flux-realism" | "flux-anime" | "flux-3d" | "turbo">("flux");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedBase64, setGeneratedBase64] = useState<string | null>(null);

  // Editor State
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filters, setFilters] = useState<ImageFilterOptions>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
    hueRotate: 0,
    invert: 0,
  });
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [aiTransformPrompt, setAiTransformPrompt] = useState("");
  const [isAiTransforming, setIsAiTransforming] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      let width = 1024;
      let height = 1024;
      if (aspectRatio === "16:9") {
        width = 1280;
        height = 720;
      } else if (aspectRatio === "9:16") {
        width = 720;
        height = 1280;
      } else if (aspectRatio === "4:3") {
        width = 1024;
        height = 768;
      }

      const fullPrompt = prompt.trim();
      const url = buildImageUrl({
        prompt: fullPrompt,
        width,
        height,
        model: stylePreset,
        enhance: true,
      });
      setGeneratedImageUrl(url);
      setGeneratedBase64(url);
    } catch (err: any) {
      alert("Image generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSourceImage(result);
        setPreviewImage(result);
        setActiveTab("edit");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendToEditor = () => {
    if (generatedImageUrl) {
      setSourceImage(generatedImageUrl);
      setPreviewImage(generatedImageUrl);
      setActiveTab("edit");
    }
  };

  useEffect(() => {
    if (sourceImage) {
      applyCanvasFilters(sourceImage, filters, { rotation, flipH, flipV })
        .then((res) => setPreviewImage(res))
        .catch(console.error);
    }
  }, [filters, rotation, flipH, flipV, sourceImage]);

  const handleDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleAiTransform = async () => {
    if (!aiTransformPrompt.trim()) return;
    setIsAiTransforming(true);
    try {
      const transformedUrl = buildImageUrl({
        prompt: aiTransformPrompt.trim() + ", highly detailed, masterpiece",
        model: "flux-realism",
      });
      setSourceImage(transformedUrl);
      setPreviewImage(transformedUrl);
      setAiTransformPrompt("");
    } catch (err: any) {
      alert("AI Transformation failed: " + err.message);
    } finally {
      setIsAiTransforming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Shawez AI Image Studio</h2>
              <p className="text-xs text-slate-400">100% Free AI Image Generation, Editing & Style Transformation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab("generate")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === "generate"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Generate New Image
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === "edit"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Edit & Transform Image
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "generate" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generator Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Prompt Description
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., A futuristic cyberpunk city in neon lights, ultra realistic 8k, trending on artstation..."
                    className="w-full h-28 bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 transition resize-none placeholder-slate-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    AI Visual Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "flux", label: "✨ Flux Pro" },
                        { id: "flux-realism", label: "📸 Photoreal" },
                        { id: "flux-anime", label: "🎨 Anime" },
                        { id: "flux-3d", label: "🧊 3D Render" },
                        { id: "turbo", label: "⚡ Fast Turbo" },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStylePreset(s.id)}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition text-center ${
                          stylePreset === s.id
                            ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                            : "border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["1:1", "16:9", "9:16", "4:3"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setAspectRatio(r)}
                        className={`p-2 rounded-xl border text-xs font-medium transition text-center ${
                          aspectRatio === r
                            ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                            : "border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating Masterpiece...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Image (100% Free)
                    </>
                  )}
                </button>
              </div>

              {/* Preview Area */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-800 rounded-2xl min-h-[320px]">
                {generatedImageUrl ? (
                  <div className="space-y-4 w-full flex flex-col items-center">
                    <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-2xl max-h-[360px] w-full flex items-center justify-center bg-black/50">
                      <img
                        src={generatedImageUrl}
                        alt="Generated AI"
                        className="max-h-[360px] object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => handleDownload(generatedImageUrl, "shawez_ai_image.png")}
                        className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <button
                        onClick={handleSendToEditor}
                        className="flex-1 py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-xs font-medium text-indigo-300 transition flex items-center justify-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Open in Editor
                      </button>
                      {onSendToChat && (
                        <button
                          onClick={() => {
                            onSendToChat(generatedImageUrl, `[AI Generated Image: "${prompt}"]`);
                            onClose();
                          }}
                          className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 text-slate-500">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">No Image Generated Yet</p>
                      <p className="text-xs text-slate-600">Type a prompt and click Generate</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Image Editor Tab */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Image Source
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </div>

                {/* AI Transformation */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 space-y-2">
                  <label className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Style Re-imagine
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiTransformPrompt}
                      onChange={(e) => setAiTransformPrompt(e.target.value)}
                      placeholder="E.g., Turn into watercolor painting, neon glow..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleAiTransform}
                      disabled={isAiTransforming || !aiTransformPrompt.trim()}
                      className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition"
                    >
                      {isAiTransforming ? "Re-imagining..." : "Transform"}
                    </button>
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-3 p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Brightness</span>
                      <span>{filters.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.brightness}
                      onChange={(e) =>
                        setFilters({ ...filters, brightness: Number(e.target.value) })
                      }
                      className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Contrast</span>
                      <span>{filters.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.contrast}
                      onChange={(e) =>
                        setFilters({ ...filters, contrast: Number(e.target.value) })
                      }
                      className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Saturation</span>
                      <span>{filters.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.saturation}
                      onChange={(e) =>
                        setFilters({ ...filters, saturation: Number(e.target.value) })
                      }
                      className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Grayscale / B&W</span>
                      <span>{filters.grayscale}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.grayscale}
                      onChange={(e) =>
                        setFilters({ ...filters, grayscale: Number(e.target.value) })
                      }
                      className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                {/* Transform Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-300 font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotate 90°
                  </button>
                  <button
                    onClick={() => setFlipH((f) => !f)}
                    className={`flex-1 py-2 border rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                      flipH
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                        : "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    Flip H
                  </button>
                  <button
                    onClick={() => setFlipV((f) => !f)}
                    className={`flex-1 py-2 border rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                      flipV
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                        : "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    Flip V
                  </button>
                </div>
              </div>

              {/* Editor Preview */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-800 rounded-2xl min-h-[320px]">
                {previewImage ? (
                  <div className="space-y-4 w-full flex flex-col items-center">
                    <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-2xl max-h-[360px] w-full flex items-center justify-center bg-black/50">
                      <img
                        src={previewImage}
                        alt="Edited Preview"
                        className="max-h-[360px] object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => handleDownload(previewImage, "shawez_edited_image.png")}
                        className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Edited Image
                      </button>
                      {onSendToChat && (
                        <button
                          onClick={() => {
                            onSendToChat(previewImage, "[Edited Image attached]");
                            onClose();
                          }}
                          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send to Chat
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 text-slate-500">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                      <Sliders className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">No Image Loaded</p>
                      <p className="text-xs text-slate-600">Upload an image or generate one to edit</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
