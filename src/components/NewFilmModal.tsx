import {Film, Loader2, X} from 'lucide-react';
import {useState} from 'react';
import type {ProjectReferenceImage, StoryBrief} from '../types/film';
import {ReferenceUploaderStrip} from './ReferenceUploaderStrip';

interface NewFilmModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onCreateProject: (
    brief: StoryBrief,
    autoGenerateStory: boolean,
    referenceImages: ProjectReferenceImage[],
  ) => Promise<void>;
}

const DEFAULT_BRIEF: StoryBrief = {
  title: '',
  originalIdea: '',
  genre: 'Drama',
  language: 'English',
  duration: '95 minutes',
  setting: '',
  targetAudience: 'International Cinema Audience',
  storytellingStyle: 'Cinematic Realism',
  characterAgesHint: '',
};

export function NewFilmModal({
  isOpen,
  isGenerating,
  onClose,
  onCreateProject,
}: NewFilmModalProps) {
  const [brief, setBrief] = useState<StoryBrief>(DEFAULT_BRIEF);
  const [referenceImages, setReferenceImages] = useState<ProjectReferenceImage[]>([]);
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (autoGenerate: boolean) => {
    if (submitting || isGenerating) return;
    if (!brief.title.trim()) {
      setValidationError('Please enter a film title or working title.');
      return;
    }
    if (!brief.originalIdea.trim()) {
      setValidationError('Please describe your original story idea.');
      return;
    }
    setValidationError('');
    setSubmitting(true);
    try {
      await onCreateProject(
        {
          ...brief,
          title: brief.title.trim(),
          originalIdea: brief.originalIdea.trim(),
          setting: brief.setting.trim() || 'Contemporary Urban & Natural Locations',
        },
        autoGenerate,
        referenceImages,
      );
      setBrief(DEFAULT_BRIEF);
      setReferenceImages([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-film-heading"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#27272F] bg-[#111114] p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#222228] pb-4">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
              MARDIA STUDIO · New Production
            </p>
            <h2
              id="new-film-heading"
              className="mt-1 font-cinema text-2xl font-semibold text-[#F7F5F0] sm:text-3xl"
            >
              Create a New Film Project
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            aria-label="Close modal"
            className="rounded-lg p-2 text-[#A8A49B] transition-colors hover:bg-[#1E1E24] hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {validationError && (
            <div className="rounded-lg border border-red-500/40 bg-red-950/35 px-4 py-2.5 text-sm text-red-200">
              {validationError}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Film Title or Working Title *
            </label>
            <input
              type="text"
              value={brief.title}
              onChange={(e) => setBrief({...brief, title: e.target.value})}
              placeholder="e.g. Echoes of the Savannah"
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] placeholder:text-[#5E5B55] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Original Story Idea *
            </label>
            <textarea
              rows={4}
              value={brief.originalIdea}
              onChange={(e) => setBrief({...brief, originalIdea: e.target.value})}
              placeholder="Describe your central premise, characters, conflict, and world..."
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm leading-relaxed text-[#F7F5F0] placeholder:text-[#5E5B55] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Film Genre
              </label>
              <input
                type="text"
                value={brief.genre}
                onChange={(e) => setBrief({...brief, genre: e.target.value})}
                placeholder="Drama, Thriller, Sci-Fi..."
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Preferred Language
              </label>
              <input
                type="text"
                value={brief.language}
                onChange={(e) => setBrief({...brief, language: e.target.value})}
                placeholder="English, French, Swahili..."
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Target Duration
              </label>
              <input
                type="text"
                value={brief.duration}
                onChange={(e) => setBrief({...brief, duration: e.target.value})}
                placeholder="e.g. 95 minutes or 18-minute short"
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Setting & Location
              </label>
              <input
                type="text"
                value={brief.setting}
                onChange={(e) => setBrief({...brief, setting: e.target.value})}
                placeholder="e.g. Lagos, Nigeria · Rainy Season"
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Target Audience
              </label>
              <input
                type="text"
                value={brief.targetAudience}
                onChange={(e) => setBrief({...brief, targetAudience: e.target.value})}
                placeholder="Festival, Young Adults, Family..."
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Storytelling Style
              </label>
              <input
                type="text"
                value={brief.storytellingStyle}
                onChange={(e) => setBrief({...brief, storytellingStyle: e.target.value})}
                placeholder="Poetic Realism, Neo-Noir, Documentary-Style..."
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Character Ages & Key Names (Optional)
            </label>
            <input
              type="text"
              value={brief.characterAgesHint || ''}
              onChange={(e) => setBrief({...brief, characterAgesHint: e.target.value})}
              placeholder="e.g. Tariq (34), Elder Muna (68)"
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] placeholder:text-[#5E5B55] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <ReferenceUploaderStrip
            title="Visual Story References (Optional)"
            subtitle="Upload photographs or mood images from your device gallery to combine with your story premise."
            defaultCategory="Scene Inspiration"
            images={referenceImages}
            onAddImages={(imgs) => setReferenceImages((prev) => [...prev, ...imgs])}
            onUpdateImage={(id, patch) =>
              setReferenceImages((prev) =>
                prev.map((item) => (item.id === id ? {...item, ...patch} : item)),
              )
            }
            onDeleteImage={(id) =>
              setReferenceImages((prev) => prev.filter((item) => item.id !== id))
            }
          />
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#222228] pt-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => void handleSubmit(false)}
            disabled={isGenerating}
            className="whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2.5 text-sm font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60 hover:bg-[#1F1F26] disabled:opacity-50"
          >
            Save Draft & Open Studio
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit(true)}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-5 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Developing Story...
              </>
            ) : (
              <>
                <Film className="h-4 w-4" />
                Create & Generate Story
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
