import {ArrowRight, BookOpen, Loader2, RefreshCw, Sparkles} from 'lucide-react';
import {useState} from 'react';
import type {
  DevelopedStory,
  FilmProject,
  ProjectReferenceImage,
  StoryBrief,
  StudioSection,
} from '../types/film';
import {ReferenceUploaderStrip} from './ReferenceUploaderStrip';

interface StoryStudioProps {
  project: FilmProject;
  isGenerating: boolean;
  onUpdateBrief: (brief: StoryBrief) => void;
  onUpdateStory: (story: DevelopedStory) => void;
  onGenerateStory: (refinementNote?: string) => Promise<void>;
  onAddImages: (images: ProjectReferenceImage[]) => void;
  onUpdateImage: (id: string, patch: Partial<ProjectReferenceImage>) => void;
  onDeleteImage: (id: string) => void;
  onAnalyzeImage: (image: ProjectReferenceImage) => Promise<void>;
  onNavigate: (section: StudioSection) => void;
}

export function StoryStudio({
  project,
  isGenerating,
  onUpdateBrief,
  onUpdateStory,
  onGenerateStory,
  onAddImages,
  onUpdateImage,
  onDeleteImage,
  onAnalyzeImage,
  onNavigate,
}: StoryStudioProps) {
  const [refinementNote, setRefinementNote] = useState('');
  const {brief, story} = project;

  const updateBriefField = <K extends keyof StoryBrief>(field: K, value: StoryBrief[K]) => {
    onUpdateBrief({
      ...brief,
      [field]: value,
    });
  };

  const updateStoryField = <K extends keyof DevelopedStory>(
    field: K,
    value: DevelopedStory[K],
  ) => {
    if (!story) return;
    onUpdateStory({
      ...story,
      [field]: value,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
            01. Story Development
          </p>
          <h1 className="mt-1 font-cinema text-3xl font-semibold text-[#F7F5F0] sm:text-4xl">
            Story Concept & Narrative Architecture
          </h1>
          <p className="mt-1 text-sm text-[#A8A49B]">
            Define your film parameters below, generate a complete narrative blueprint with Gemini,
            and refine any section inline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onGenerateStory(refinementNote || undefined)}
            disabled={isGenerating || !brief.originalIdea.trim()}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-4 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Story...
              </>
            ) : story ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate Story
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Story
              </>
            )}
          </button>

          {story && (
            <button
              type="button"
              onClick={() => onNavigate('screenplay')}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2.5 text-sm font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60"
            >
              Screenplay Studio
              <ArrowRight className="h-4 w-4 text-[#C8A24B]" />
            </button>
          )}
        </div>
      </div>

      {/* Film Brief Form */}
      <ReferenceUploaderStrip
        title="Visual Story & Location References"
        subtitle="Upload setting, atmosphere, or inspiration images from your gallery—Gemini combines them directly with your written idea."
        defaultCategory="Location Reference"
        images={project.referenceImages ?? []}
        onAddImages={onAddImages}
        onUpdateImage={onUpdateImage}
        onDeleteImage={onDeleteImage}
        onAnalyzeImage={onAnalyzeImage}
        onOpenGallery={() => onNavigate('gallery')}
      />

      <section className="rounded-xl border border-[#222228] bg-[#111114] p-6">
        <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
          Film Brief & Creative Parameters
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Film Title or Working Title
            </label>
            <input
              type="text"
              value={brief.title}
              onChange={(e) => updateBriefField('title', e.target.value)}
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">Film Genre</label>
            <input
              type="text"
              value={brief.genre}
              onChange={(e) => updateBriefField('genre', e.target.value)}
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
              onChange={(e) => updateBriefField('language', e.target.value)}
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Film Duration
            </label>
            <input
              type="text"
              value={brief.duration}
              onChange={(e) => updateBriefField('duration', e.target.value)}
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
              onChange={(e) => updateBriefField('setting', e.target.value)}
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
              onChange={(e) => updateBriefField('targetAudience', e.target.value)}
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Preferred Storytelling Style
            </label>
            <input
              type="text"
              value={brief.storytellingStyle}
              onChange={(e) => updateBriefField('storytellingStyle', e.target.value)}
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Character Ages (Optional)
            </label>
            <input
              type="text"
              value={brief.characterAgesHint || ''}
              onChange={(e) => updateBriefField('characterAgesHint', e.target.value)}
              placeholder="e.g. Kojo (58), Ama (24)"
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] placeholder:text-[#5E5B55] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
            Original Story Idea
          </label>
          <textarea
            rows={4}
            value={brief.originalIdea}
            onChange={(e) => updateBriefField('originalIdea', e.target.value)}
            placeholder="Describe your film premise, central dilemma, and visual world..."
            className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm leading-relaxed text-[#F7F5F0] placeholder:text-[#5E5B55] focus:border-[#C8A24B] focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[#222228] pt-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Optional Director’s Refinement Note (used when regenerating)
            </label>
            <input
              type="text"
              value={refinementNote}
              onChange={(e) => setRefinementNote(e.target.value)}
              placeholder="e.g. Deepen the third-act betrayal and emphasize coastal soundscape"
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2 text-sm text-[#F7F5F0] placeholder:text-[#5E5B55] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void onGenerateStory(refinementNote || undefined)}
            disabled={isGenerating || !brief.originalIdea.trim()}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-5 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Developing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {story ? 'Regenerate Story' : 'Generate Story'}
              </>
            )}
          </button>
        </div>
      </section>

      {/* Developed Story Output */}
      {isGenerating && !story && (
        <div className="rounded-xl border border-[#222228] bg-[#111114] p-8 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#C8A24B]" />
          <p className="mt-3 text-sm font-medium text-[#F7F5F0]">
            Developing logline, synopsis, three-act beats, and thematic arc with Gemini...
          </p>
        </div>
      )}

      {!isGenerating && !story && (
        <div className="rounded-xl border border-dashed border-[#2D2D36] bg-[#111114]/60 p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-[#C8A24B]/70" />
          <h3 className="mt-3 font-cinema text-2xl text-[#F7F5F0]">
            No Developed Story Yet
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#A8A49B]">
            Enter your original story idea above and select <strong>Generate Story</strong> to
            build your logline, synopsis, three-act structure, and character summary.
          </p>
        </div>
      )}

      {story && (
        <section className="space-y-6 rounded-xl border border-[#222228] bg-[#111114] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222228] pb-4">
            <div>
              <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                Developed Story Blueprint
              </h2>
              <p className="text-xs text-[#A8A49B]">
                All fields below are directly editable and saved automatically to your project.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('characters')}
                className="whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2 text-xs font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60"
              >
                Develop Characters
              </button>
              <button
                type="button"
                onClick={() => onNavigate('screenplay')}
                className="whitespace-nowrap rounded-lg bg-[#C8A24B] px-3.5 py-2 text-xs font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D]"
              >
                Write Screenplay
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#C8A24B]">Logline</label>
            <textarea
              rows={2}
              value={story.logline}
              onChange={(e) => updateStoryField('logline', e.target.value)}
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-4 py-3 text-base font-medium leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#C8A24B]">
              Film Synopsis
            </label>
            <textarea
              rows={6}
              value={story.synopsis}
              onChange={(e) => updateStoryField('synopsis', e.target.value)}
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-4 py-3 text-sm leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Act I · Beginning
              </label>
              <textarea
                rows={5}
                value={story.beginning}
                onChange={(e) => updateStoryField('beginning', e.target.value)}
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Act II · Middle
              </label>
              <textarea
                rows={5}
                value={story.middle}
                onChange={(e) => updateStoryField('middle', e.target.value)}
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Act III · Ending
              </label>
              <textarea
                rows={5}
                value={story.ending}
                onChange={(e) => updateStoryField('ending', e.target.value)}
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Main Characters Overview
              </label>
              <textarea
                rows={3}
                value={story.mainCharactersSummary}
                onChange={(e) => updateStoryField('mainCharactersSummary', e.target.value)}
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Central Conflict
              </label>
              <textarea
                rows={3}
                value={story.centralConflict}
                onChange={(e) => updateStoryField('centralConflict', e.target.value)}
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Core Themes
              </label>
              <textarea
                rows={3}
                value={story.themes}
                onChange={(e) => updateStoryField('themes', e.target.value)}
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Intended Emotional Impact
              </label>
              <textarea
                rows={3}
                value={story.emotionalImpact}
                onChange={(e) => updateStoryField('emotionalImpact', e.target.value)}
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
