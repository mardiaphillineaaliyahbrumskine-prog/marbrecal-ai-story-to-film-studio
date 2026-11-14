import {
  AlertCircle,
  CheckCircle2,
  Eye,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {useRef, useState} from 'react';
import type {ProjectReferenceImage, ReferenceImageCategory} from '../types/film';
import {
  ALLOWED_IMAGE_ACCEPT,
  processSelectedImageFiles,
  REFERENCE_CATEGORIES,
} from '../utils/imageUpload';

interface ReferenceUploaderStripProps {
  title: string;
  subtitle: string;
  defaultCategory: ReferenceImageCategory;
  images: ProjectReferenceImage[];
  onAddImages: (newImages: ProjectReferenceImage[]) => void;
  onUpdateImage: (id: string, patch: Partial<ProjectReferenceImage>) => void;
  onDeleteImage: (id: string) => void;
  onAnalyzeImage?: (image: ProjectReferenceImage) => Promise<void>;
  onOpenGallery?: () => void;
}

export function ReferenceUploaderStrip({
  title,
  subtitle,
  defaultCategory,
  images,
  onAddImages,
  onUpdateImage,
  onDeleteImage,
  onAnalyzeImage,
  onOpenGallery,
}: ReferenceUploaderStripProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<ReferenceImageCategory>(defaultCategory);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<ProjectReferenceImage | null>(null);

  const handleFilesChosen = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsProcessing(true);
    try {
      const {images: processed, errors} = await processSelectedImageFiles(files, selectedCategory);
      if (processed.length > 0) {
        onAddImages(processed);
      }
      if (errors.length > 0) {
        setUploadError(errors.join(' '));
      }
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplaceChosen = async (files: FileList | null) => {
    if (!files || files.length === 0 || !replacingId) return;
    setUploadError(null);
    setIsProcessing(true);
    try {
      const {images: processed, errors} = await processSelectedImageFiles(
        [files[0]],
        selectedCategory,
      );
      if (processed.length > 0) {
        const next = processed[0];
        onUpdateImage(replacingId, {
          dataUrl: next.dataUrl,
          mimeType: next.mimeType,
          sizeBytes: next.sizeBytes,
          analysisStatus: 'idle',
          analysisError: undefined,
          aiAnalysis: undefined,
        });
      }
      if (errors.length > 0) {
        setUploadError(errors.join(' '));
      }
    } finally {
      setIsProcessing(false);
      setReplacingId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  return (
    <section className="rounded-xl border border-[#222228] bg-[#111114] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#222228] pb-4">
        <div>
          <h3 className="font-cinema text-xl font-semibold text-[#F7F5F0]">{title}</h3>
          <p className="mt-0.5 text-xs text-[#A8A49B]">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Reference image category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ReferenceImageCategory)}
            className="rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2 text-xs text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
          >
            {REFERENCE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            multiple
            onChange={(e) => void handleFilesChosen(e.target.files)}
            className="hidden"
          />

          <input
            ref={replaceInputRef}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            onChange={(e) => void handleReplaceChosen(e.target.files)}
            className="hidden"
          />

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#C8A24B]/60 bg-[#C8A24B]/15 px-3.5 py-2 text-xs font-semibold text-[#E5C77A] transition-colors hover:bg-[#C8A24B]/25 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading Photos...
              </>
            ) : (
              <>
                <ImagePlus className="h-3.5 w-3.5" />
                Upload Image
              </>
            )}
          </button>

          {onOpenGallery && (
            <button
              type="button"
              onClick={onOpenGallery}
              className="whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3 py-2 text-xs font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60"
            >
              Open Gallery ({images.length})
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/35 px-3.5 py-2.5 text-xs text-red-200"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {images.length === 0 ? (
        <p className="mt-4 text-xs text-[#76726A]">
          No visual reference images attached yet. Upload JPG, JPEG, PNG, or WEBP photographs from
          your device gallery to guide Gemini’s creative output.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="flex gap-3 rounded-lg border border-[#27272F] bg-[#0D0D10] p-3"
            >
              <button
                type="button"
                onClick={() => setPreviewImage(img)}
                aria-label={`Preview ${img.name}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-[#27272F] bg-[#09090B]"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="h-full w-full object-cover"
                />
              </button>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <input
                    type="text"
                    value={img.name}
                    onChange={(e) => onUpdateImage(img.id, {name: e.target.value})}
                    aria-label="Reference image name"
                    className="w-full truncate bg-transparent text-xs font-semibold text-[#F7F5F0] focus:border-b focus:border-[#C8A24B] focus:outline-none"
                  />
                  <select
                    value={img.category}
                    onChange={(e) =>
                      onUpdateImage(img.id, {
                        category: e.target.value as ReferenceImageCategory,
                      })
                    }
                    aria-label="Change category"
                    className="mt-1 w-full truncate rounded border border-[#27272F] bg-[#141418] px-1.5 py-1 text-[11px] text-[#E5C77A] focus:outline-none"
                  >
                    {REFERENCE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
                  {img.analysisStatus === 'analyzing' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#E5C77A]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analyzing...
                    </span>
                  ) : img.analysisStatus === 'analyzed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#C8A24B]">
                      <CheckCircle2 className="h-3 w-3" />
                      Analyzed
                    </span>
                  ) : img.analysisStatus === 'error' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                      <AlertCircle className="h-3 w-3" />
                      Failed
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#76726A]">Attached</span>
                  )}

                  <div className="flex items-center gap-1">
                    {onAnalyzeImage && (
                      <button
                        type="button"
                        disabled={img.analysisStatus === 'analyzing'}
                        onClick={() => void onAnalyzeImage(img)}
                        title="Analyze with Gemini"
                        className="rounded border border-[#C8A24B]/40 bg-[#C8A24B]/10 px-2 py-0.5 text-[11px] font-medium text-[#E5C77A] hover:bg-[#C8A24B]/20 disabled:opacity-50"
                      >
                        <Sparkles className="inline h-2.5 w-2.5 mr-0.5" />
                        Analyze
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewImage(img)}
                      aria-label={`Inspect ${img.name}`}
                      className="rounded p-1 text-[#A8A49B] hover:bg-[#1C1C22] hover:text-white"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplacingId(img.id);
                        replaceInputRef.current?.click();
                      }}
                      aria-label={`Replace ${img.name}`}
                      className="rounded p-1 text-[#A8A49B] hover:bg-[#1C1C22] hover:text-white"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteImage(img.id)}
                      aria-label={`Remove ${img.name}`}
                      className="rounded p-1 text-[#76726A] hover:bg-red-950/50 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#27272F] bg-[#111114] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#222228] pb-3">
              <div>
                <p className="text-xs text-[#C8A24B]">{previewImage.category}</p>
                <h4 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                  {previewImage.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-lg border border-[#2D2D36] px-3 py-1.5 text-xs text-[#F7F5F0] hover:border-[#C8A24B]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-[#222228] bg-[#09090B]">
              <img
                src={previewImage.dataUrl}
                alt={previewImage.name}
                className="max-h-[45vh] w-full object-contain"
              />
            </div>

            {previewImage.aiAnalysis ? (
              <div className="mt-4 space-y-2.5 text-xs">
                <div>
                  <span className="font-medium text-[#C8A24B]">Visual Summary: </span>
                  <span className="text-[#E4E0D8]">{previewImage.aiAnalysis.visualSummary}</span>
                </div>
                <div>
                  <span className="font-medium text-[#C8A24B]">Character Appearance: </span>
                  <span className="text-[#E4E0D8]">
                    {previewImage.aiAnalysis.characterAppearanceNotes}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-[#C8A24B]">Costume & Styling: </span>
                  <span className="text-[#E4E0D8]">
                    {previewImage.aiAnalysis.costumeAndStylingNotes}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-[#C8A24B]">Setting & Atmosphere: </span>
                  <span className="text-[#E4E0D8]">
                    {previewImage.aiAnalysis.settingAndAtmosphere}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-[#C8A24B]">Cinematic Composition: </span>
                  <span className="text-[#E4E0D8]">
                    {previewImage.aiAnalysis.cinematicComposition}
                  </span>
                </div>
              </div>
            ) : previewImage.analysisError ? (
              <p className="mt-4 text-xs text-red-300">{previewImage.analysisError}</p>
            ) : (
              <p className="mt-4 text-xs text-[#A8A49B]">
                Not yet analyzed by Gemini. Click Analyze to extract character, costume, setting,
                and composition notes.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
