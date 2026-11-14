import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {useMemo, useRef, useState} from 'react';
import type {
  FilmProject,
  ProjectReferenceImage,
  ReferenceImageCategory,
} from '../types/film';
import {
  ALLOWED_IMAGE_ACCEPT,
  processSelectedImageFiles,
  REFERENCE_CATEGORIES,
} from '../utils/imageUpload';

interface VisualGalleryStudioProps {
  project: FilmProject;
  onAddImages: (images: ProjectReferenceImage[]) => void;
  onUpdateImage: (id: string, patch: Partial<ProjectReferenceImage>) => void;
  onDeleteImage: (id: string) => void;
  onAnalyzeImage: (image: ProjectReferenceImage) => Promise<void>;
}

export function VisualGalleryStudio({
  project,
  onAddImages,
  onUpdateImage,
  onDeleteImage,
  onAnalyzeImage,
}: VisualGalleryStudioProps) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadCategory, setUploadCategory] =
    useState<ReferenceImageCategory>('Scene Inspiration');
  const [filterCategory, setFilterCategory] = useState<'All' | ReferenceImageCategory>('All');
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lightboxImageId, setLightboxImageId] = useState<string | null>(null);

  const images = project.referenceImages ?? [];

  const filteredImages = useMemo(
    () =>
      filterCategory === 'All'
        ? images
        : images.filter((img) => img.category === filterCategory),
    [images, filterCategory],
  );

  const lightboxImage = useMemo(
    () => images.find((img) => img.id === lightboxImageId) || null,
    [images, lightboxImageId],
  );

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsProcessing(true);
    try {
      const {images: processed, errors} = await processSelectedImageFiles(files, uploadCategory);
      if (processed.length > 0) {
        onAddImages(processed);
      }
      if (errors.length > 0) {
        setUploadError(errors.join(' '));
      }
    } finally {
      setIsProcessing(false);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const handleReplaceFile = async (files: FileList | null) => {
    if (!files || files.length === 0 || !replacingId) return;
    setUploadError(null);
    setIsProcessing(true);
    try {
      const {images: processed, errors} = await processSelectedImageFiles(
        [files[0]],
        uploadCategory,
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
            Visual Reference Gallery
          </p>
          <h1 className="mt-1 font-cinema text-3xl font-semibold text-[#F7F5F0] sm:text-4xl">
            Image Gallery & Visual Story References
          </h1>
          <p className="mt-1 text-sm text-[#A8A49B]">
            Upload photographs from your device gallery to guide character appearance, locations,
            costumes, props, and cinematography with Gemini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Default category for new uploads"
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value as ReferenceImageCategory)}
            className="rounded-lg border border-[#27272F] bg-[#111114] px-3 py-2.5 text-xs text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
          >
            {REFERENCE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            ref={uploadInputRef}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            multiple
            onChange={(e) => void handleUploadFiles(e.target.files)}
            className="hidden"
          />

          <input
            ref={replaceInputRef}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            onChange={(e) => void handleReplaceFile(e.target.files)}
            className="hidden"
          />

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => uploadInputRef.current?.click()}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-4 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Images...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Upload Image
              </>
            )}
          </button>
        </div>
      </div>

      {uploadError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-950/35 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#222228] bg-[#111114] p-1.5">
        {(['All', ...REFERENCE_CATEGORIES] as const).map((cat) => {
          const isActive = filterCategory === cat;
          const count =
            cat === 'All' ? images.length : images.filter((i) => i.category === cat).length;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#C8A24B] text-[#09090B]'
                  : 'text-[#A8A49B] hover:bg-[#1B1B22] hover:text-[#F7F5F0]'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {filteredImages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2D2D36] bg-[#111114]/60 p-10 text-center">
          <ImageIcon className="mx-auto h-9 w-9 text-[#C8A24B]/70" />
          <h2 className="mt-3 font-cinema text-2xl text-[#F7F5F0]">
            {images.length === 0
              ? 'No Reference Images Uploaded'
              : `No Images in "${filterCategory}"`}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#A8A49B]">
            Select JPG, JPEG, PNG, or WEBP photographs from your phone or computer gallery to build
            a visual lookbook for <strong>{project.brief.title}</strong>.
          </p>
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#C8A24B] px-4 py-2.5 text-sm font-semibold text-[#09090B]"
          >
            <ImagePlus className="h-4 w-4" />
            Upload Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredImages.map((img) => (
            <article
              key={img.id}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#222228] bg-[#111114]"
            >
              <div>
                <div className="relative aspect-video w-full overflow-hidden border-b border-[#222228] bg-[#09090B]">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxImageId(img.id)}
                    aria-label={`Open full preview of ${img.name}`}
                    className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md bg-black/75 px-2.5 py-1.5 text-xs font-medium text-[#F7F5F0] backdrop-blur hover:bg-black"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#C8A24B]" />
                    Preview
                  </button>
                </div>

                <div className="space-y-3 p-5">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#A8A49B]">
                      Reference Title
                    </label>
                    <input
                      type="text"
                      value={img.name}
                      onChange={(e) => onUpdateImage(img.id, {name: e.target.value})}
                      className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2 text-sm font-medium text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#A8A49B]">
                      Reference Category
                    </label>
                    <select
                      value={img.category}
                      onChange={(e) =>
                        onUpdateImage(img.id, {
                          category: e.target.value as ReferenceImageCategory,
                        })
                      }
                      className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2 text-xs text-[#E5C77A] focus:border-[#C8A24B] focus:outline-none"
                    >
                      {REFERENCE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#A8A49B]">
                      Filmmaker Notes
                    </label>
                    <textarea
                      rows={2}
                      value={img.notes || ''}
                      onChange={(e) => onUpdateImage(img.id, {notes: e.target.value})}
                      placeholder="e.g. Use this warm lantern lighting and indigo wrap palette for Scene 1"
                      className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2 text-xs text-[#F7F5F0] placeholder:text-[#5E5B55] focus:border-[#C8A24B] focus:outline-none"
                    />
                  </div>

                  {/* Gemini Analysis Status & Output */}
                  {img.analysisStatus === 'analyzing' && (
                    <div className="flex items-center gap-2 rounded-lg border border-[#C8A24B]/30 bg-[#C8A24B]/10 px-3 py-2 text-xs text-[#E5C77A]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Analyzing visual details with Gemini...</span>
                    </div>
                  )}

                  {img.analysisStatus === 'error' && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/35 px-3 py-2 text-xs text-red-200">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                      <span>{img.analysisError || 'Gemini image analysis failed.'}</span>
                    </div>
                  )}

                  {img.analysisStatus === 'analyzed' && img.aiAnalysis && (
                    <div className="space-y-1.5 border-t border-[#222228] pt-3 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-[#C8A24B]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Gemini Visual Analysis</span>
                      </div>
                      <p className="leading-relaxed text-[#E4E0D8]">
                        {img.aiAnalysis.visualSummary}
                      </p>
                      <button
                        type="button"
                        onClick={() => setLightboxImageId(img.id)}
                        className="text-xs font-medium text-[#E5C77A] hover:underline"
                      >
                        Read full breakdown
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#222228] bg-[#16161B] px-5 py-3">
                <button
                  type="button"
                  disabled={img.analysisStatus === 'analyzing'}
                  onClick={() => void onAnalyzeImage(img)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[#C8A24B] px-3 py-1.5 text-xs font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {img.analysisStatus === 'analyzed' ? 'Re-Analyze' : 'Analyze with Gemini'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingId(img.id);
                      replaceInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-[#2D2D36] bg-[#111114] px-2.5 py-1.5 text-xs text-[#F7F5F0] hover:border-[#C8A24B]/60"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteImage(img.id)}
                    aria-label={`Delete ${img.name}`}
                    className="rounded-md p-1.5 text-[#76726A] hover:bg-red-950/50 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxImageId(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#27272F] bg-[#111114] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#222228] pb-4">
              <div>
                <p className="text-xs font-medium text-[#C8A24B]">{lightboxImage.category}</p>
                <h2 className="mt-0.5 font-cinema text-3xl font-semibold text-[#F7F5F0]">
                  {lightboxImage.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImageId(null)}
                aria-label="Close lightbox"
                className="rounded-lg p-2 text-[#A8A49B] hover:bg-[#1E1E24] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-[#222228] bg-[#09090B]">
              <img
                src={lightboxImage.dataUrl}
                alt={lightboxImage.name}
                className="max-h-[52vh] w-full object-contain"
              />
            </div>

            {lightboxImage.aiAnalysis ? (
              <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-[#C8A24B]">Visual Summary</dt>
                  <dd className="mt-1 leading-relaxed text-[#E4E0D8]">
                    {lightboxImage.aiAnalysis.visualSummary}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#C8A24B]">
                    Character Appearance (Fictional Reference)
                  </dt>
                  <dd className="mt-1 leading-relaxed text-[#E4E0D8]">
                    {lightboxImage.aiAnalysis.characterAppearanceNotes}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#C8A24B]">
                    Costume & Styling Suggestions
                  </dt>
                  <dd className="mt-1 leading-relaxed text-[#E4E0D8]">
                    {lightboxImage.aiAnalysis.costumeAndStylingNotes}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#C8A24B]">Setting & Atmosphere</dt>
                  <dd className="mt-1 leading-relaxed text-[#E4E0D8]">
                    {lightboxImage.aiAnalysis.settingAndAtmosphere}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#C8A24B]">
                    Cinematic Composition & Storyboard Guidance
                  </dt>
                  <dd className="mt-1 leading-relaxed text-[#E4E0D8]">
                    {lightboxImage.aiAnalysis.cinematicComposition}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#222228] pt-4">
                <p className="text-sm text-[#A8A49B]">
                  {lightboxImage.analysisError ||
                    'Run Gemini Visual Analysis to extract structured character, wardrobe, setting, and composition insights.'}
                </p>
                <button
                  type="button"
                  disabled={lightboxImage.analysisStatus === 'analyzing'}
                  onClick={() => void onAnalyzeImage(lightboxImage)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#C8A24B] px-4 py-2 text-xs font-semibold text-[#09090B]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze with Gemini
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
