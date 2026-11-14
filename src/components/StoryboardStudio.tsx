import {
  ArrowRight,
  Camera,
  Check,
  Copy,
  Edit3,
  Film,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
} from 'lucide-react';
import {useState} from 'react';
import type {
  FilmProject,
  ProjectReferenceImage,
  StoryboardScenePlan,
  StoryboardShot,
  StudioSection,
} from '../types/film';
import {ReferenceUploaderStrip} from './ReferenceUploaderStrip';

interface StoryboardStudioProps {
  project: FilmProject;
  isGenerating: boolean;
  regeneratingSceneNumber: number | null;
  onUpdateStoryboard: (storyboard: StoryboardScenePlan[]) => void;
  onGenerateStoryboard: (targetSceneNumber?: number) => Promise<void>;
  onAddImages: (images: ProjectReferenceImage[]) => void;
  onUpdateImage: (id: string, patch: Partial<ProjectReferenceImage>) => void;
  onDeleteImage: (id: string) => void;
  onAnalyzeImage: (image: ProjectReferenceImage) => Promise<void>;
  onNavigate: (section: StudioSection) => void;
}

function getLightingGradient(lighting: string, atmosphere: string): string {
  const text = `${lighting} ${atmosphere}`.toLowerCase();
  if (text.includes('dawn') || text.includes('mist') || text.includes('cool')) {
    return 'from-[#182430] via-[#12161E] to-[#2B2418]';
  }
  if (text.includes('fluorescent') || text.includes('clinical') || text.includes('sterile')) {
    return 'from-[#151D22] via-[#101418] to-[#1A2024]';
  }
  if (text.includes('night') || text.includes('lantern') || text.includes('lamp')) {
    return 'from-[#120F0A] via-[#1D160B] to-[#0A0A0D]';
  }
  return 'from-[#1B160E] via-[#111115] to-[#0C0C0F]';
}

function StoryboardFrameVisual({shot}: {shot: StoryboardShot}) {
  const [imgError, setImgError] = useState(false);

  if (shot.previewImage && !imgError) {
    return (
      <div className="relative aspect-video w-full overflow-hidden border-b border-[#222228] bg-[#09090B]">
        <img
          src={shot.previewImage}
          alt={`Storyboard visual reference for shot ${shot.shotNumber}`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090B]/80 via-transparent to-[#09090B]/30" />
        <div className="absolute top-3 left-3 flex items-center gap-2 font-mono text-[11px] text-[#F7F5F0]">
          <span className="bg-[#09090B]/80 px-2 py-0.5 font-semibold text-[#E5C77A]">
            SHOT {shot.shotNumber}
          </span>
          <span className="bg-[#09090B]/75 px-2 py-0.5 text-[#D5D1C8]">{shot.shotType}</span>
        </div>
        <div className="absolute right-3 bottom-2.5 left-3 flex items-center justify-between text-[11px] text-[#D5D1C8]">
          <span>Storyboard Reference Frame</span>
          <span className="font-mono text-[#E5C77A]">16:9</span>
        </div>
      </div>
    );
  }

  const gradientClass = getLightingGradient(shot.lightingDirection, shot.atmosphere);

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden border-b border-[#222228] bg-gradient-to-br ${gradientClass} p-4`}
    >
      {/* Rule of thirds & optical viewfinder guides */}
      <div className="pointer-events-none absolute inset-3 border border-[#C8A24B]/25">
        <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-[#C8A24B]/15" />
        <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-[#C8A24B]/15" />
        <div className="absolute inset-y-0 left-1/3 border-l border-dashed border-[#C8A24B]/15" />
        <div className="absolute inset-y-0 left-2/3 border-l border-dashed border-[#C8A24B]/15" />
      </div>

      {/* Subtle atmospheric glow */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-[#C8A24B]/15 blur-2xl" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="font-semibold text-[#E5C77A]">SHOT {shot.shotNumber}</span>
          <span className="text-[#A8A49B]">
            {shot.cameraAngle} · {shot.cameraMovement}
          </span>
        </div>

        <div className="my-auto px-2 text-center">
          <Film className="mx-auto h-5 w-5 text-[#C8A24B]/70" />
          <p className="mt-2 font-cinema text-lg font-medium text-[#F7F5F0]">{shot.shotType}</p>
          <p className="mx-auto mt-1 line-clamp-2 max-w-sm text-xs leading-relaxed text-[#A8A49B]">
            {shot.visualComposition}
          </p>
        </div>

        <div className="flex items-center justify-between font-mono text-[10px] text-[#76726A]">
          <span>Storyboard Placeholder Frame · Concept Layout</span>
          <span className="text-[#C8A24B]">2.39:1 / 16:9</span>
        </div>
      </div>
    </div>
  );
}

export function StoryboardStudio({
  project,
  isGenerating,
  regeneratingSceneNumber,
  onUpdateStoryboard,
  onGenerateStoryboard,
  onAddImages,
  onUpdateImage,
  onDeleteImage,
  onAnalyzeImage,
  onNavigate,
}: StoryboardStudioProps) {
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  const [copiedShotId, setCopiedShotId] = useState<string | null>(null);

  const storyboard = project.storyboard;
  const hasScreenplay = project.screenplay.length > 0;

  const updateShot = (
    sceneId: string,
    shotId: string,
    patch: Partial<StoryboardShot>,
  ) => {
    onUpdateStoryboard(
      storyboard.map((sb) =>
        sb.id === sceneId
          ? {
              ...sb,
              shots: sb.shots.map((sh) => (sh.id === shotId ? {...sh, ...patch} : sh)),
            }
          : sb,
      ),
    );
  };

  const handleCopyPrompt = async (shotId: string, prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedShotId(shotId);
      setTimeout(() => setCopiedShotId(null), 1800);
    } catch {
      // Clipboard fallback not critical
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
            04. Cinematic Scene & Storyboard Studio
          </p>
          <h1 className="mt-1 font-cinema text-3xl font-semibold text-[#F7F5F0] sm:text-4xl">
            Directorial Shot Plans & Storyboard Frames
          </h1>
          <p className="mt-1 text-sm text-[#A8A49B]">
            Every screenplay scene translated into camera angles, movement, lighting direction,
            sound cues, and visual storyboard prompts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onGenerateStoryboard()}
            disabled={isGenerating || !hasScreenplay}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-4 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-50"
          >
            {isGenerating && regeneratingSceneNumber === null ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Planning Shots...
              </>
            ) : storyboard.length > 0 ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate All Storyboards
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Storyboard Plan
              </>
            )}
          </button>

          {storyboard.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('production')}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2.5 text-sm font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60"
            >
              Production Planning
              <ArrowRight className="h-4 w-4 text-[#C8A24B]" />
            </button>
          )}
        </div>
      </div>

      <ReferenceUploaderStrip
        title="Scene Inspiration & Cinematic Style References"
        subtitle="Upload reference frames, location photos, or lighting inspiration to shape Gemini's camera compositions and storyboard prompts."
        defaultCategory="Cinematic Style Reference"
        images={project.referenceImages ?? []}
        onAddImages={onAddImages}
        onUpdateImage={onUpdateImage}
        onDeleteImage={onDeleteImage}
        onAnalyzeImage={onAnalyzeImage}
        onOpenGallery={() => onNavigate('gallery')}
      />

      {!hasScreenplay && (
        <div className="rounded-xl border border-dashed border-[#2D2D36] bg-[#111114]/60 p-10 text-center">
          <Camera className="mx-auto h-8 w-8 text-[#C8A24B]/70" />
          <h3 className="mt-3 font-cinema text-2xl text-[#F7F5F0]">
            Screenplay Scenes Needed First
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#A8A49B]">
            Generate or write at least one scene in the Screenplay Studio before breaking down shots
            and visual storyboards.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('screenplay')}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#C8A24B] px-4 py-2.5 text-sm font-semibold text-[#09090B]"
          >
            Go to Screenplay Studio
          </button>
        </div>
      )}

      {hasScreenplay && isGenerating && storyboard.length === 0 && (
        <div className="rounded-xl border border-[#222228] bg-[#111114] p-10 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#C8A24B]" />
          <p className="mt-3 text-sm font-medium text-[#F7F5F0]">
            Designing shot compositions, lighting schemes, and sound cues with Gemini...
          </p>
        </div>
      )}

      {hasScreenplay && !isGenerating && storyboard.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#2D2D36] bg-[#111114]/60 p-10 text-center">
          <Camera className="mx-auto h-8 w-8 text-[#C8A24B]/70" />
          <h3 className="mt-3 font-cinema text-2xl text-[#F7F5F0]">
            Ready to Plan Cinematic Shots
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#A8A49B]">
            Click <strong>Generate Storyboard Plan</strong> above to convert your{' '}
            {project.screenplay.length} screenplay scenes into directorial storyboard cards.
          </p>
        </div>
      )}

      {storyboard.length > 0 && (
        <div className="space-y-10">
          {storyboard.map((scenePlan) => {
            const isRegeneratingScene = regeneratingSceneNumber === scenePlan.sceneNumber;

            return (
              <section key={scenePlan.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222228] pb-3">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs text-[#C8A24B] tabular-nums">
                      <span>SCENE {String(scenePlan.sceneNumber).padStart(2, '0')}</span>
                      <span className="text-[#76726A]">·</span>
                      <span>{scenePlan.shots.length} shots</span>
                    </div>
                    <h2 className="mt-0.5 font-cinema text-2xl font-semibold text-[#F7F5F0]">
                      {scenePlan.sceneTitle}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-[#A8A49B]">
                      {scenePlan.sceneDescription}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void onGenerateStoryboard(scenePlan.sceneNumber)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#C8A24B]/40 bg-[#C8A24B]/10 px-3.5 py-2 text-xs font-medium text-[#E5C77A] transition-colors hover:bg-[#C8A24B]/20 disabled:opacity-50"
                  >
                    {isRegeneratingScene ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Replanning Scene...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerate Scene Shots
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {scenePlan.shots.map((shot) => {
                    const isEditing = editingShotId === shot.id;
                    const isCopied = copiedShotId === shot.id;

                    return (
                      <article
                        key={shot.id}
                        className="flex flex-col overflow-hidden rounded-xl border border-[#222228] bg-[#111114]"
                      >
                        <StoryboardFrameVisual shot={shot} />

                        <div className="flex-1 space-y-4 p-5">
                          <div className="flex items-center justify-between gap-2 border-b border-[#222228] pb-3">
                            <div className="text-xs text-[#A8A49B]">
                              <span className="font-mono font-semibold text-[#F7F5F0]">
                                {shot.shotType}
                              </span>
                              <span className="mx-1.5" aria-hidden="true">
                                ·
                              </span>
                              <span>{shot.cameraAngle}</span>
                              <span className="mx-1.5" aria-hidden="true">
                                ·
                              </span>
                              <span>{shot.cameraMovement}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setEditingShotId(isEditing ? null : shot.id)}
                              className="inline-flex items-center gap-1 rounded border border-[#2D2D36] bg-[#18181D] px-2.5 py-1 text-xs text-[#F7F5F0] hover:border-[#C8A24B]/60"
                            >
                              {isEditing ? (
                                <>
                                  <Save className="h-3 w-3 text-[#C8A24B]" />
                                  Save
                                </>
                              ) : (
                                <>
                                  <Edit3 className="h-3 w-3" />
                                  Edit
                                </>
                              )}
                            </button>
                          </div>

                          {isEditing ? (
                            <div className="space-y-3 text-xs">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={shot.shotType}
                                  onChange={(e) =>
                                    updateShot(scenePlan.id, shot.id, {shotType: e.target.value})
                                  }
                                  placeholder="Shot Type"
                                  className="rounded border border-[#27272F] bg-[#09090B] px-2.5 py-1.5 text-[#F7F5F0]"
                                />
                                <input
                                  type="text"
                                  value={shot.cameraAngle}
                                  onChange={(e) =>
                                    updateShot(scenePlan.id, shot.id, {
                                      cameraAngle: e.target.value,
                                    })
                                  }
                                  placeholder="Camera Angle"
                                  className="rounded border border-[#27272F] bg-[#09090B] px-2.5 py-1.5 text-[#F7F5F0]"
                                />
                              </div>
                              <input
                                type="text"
                                value={shot.cameraMovement}
                                onChange={(e) =>
                                  updateShot(scenePlan.id, shot.id, {
                                    cameraMovement: e.target.value,
                                  })
                                }
                                placeholder="Camera Movement"
                                className="w-full rounded border border-[#27272F] bg-[#09090B] px-2.5 py-1.5 text-[#F7F5F0]"
                              />
                              {(
                                [
                                  ['Lighting Direction', 'lightingDirection'],
                                  ['Atmosphere', 'atmosphere'],
                                  ['Visual Composition', 'visualComposition'],
                                  ['Sound & Music', 'soundAndMusic'],
                                  ['AI Visual Storyboard Prompt', 'visualStoryboardPrompt'],
                                ] as const
                              ).map(([label, key]) => (
                                <div key={key}>
                                  <label className="mb-1 block text-[#A8A49B]">{label}</label>
                                  <textarea
                                    rows={2}
                                    value={shot[key]}
                                    onChange={(e) =>
                                      updateShot(scenePlan.id, shot.id, {[key]: e.target.value})
                                    }
                                    className="w-full rounded border border-[#27272F] bg-[#09090B] px-2.5 py-1.5 text-[#F7F5F0]"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <dl className="space-y-2.5 text-sm">
                              <div>
                                <dt className="text-xs font-medium text-[#A8A49B]">
                                  Lighting Direction
                                </dt>
                                <dd className="mt-0.5 text-[#E4E0D8]">
                                  {shot.lightingDirection}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-[#A8A49B]">Atmosphere</dt>
                                <dd className="mt-0.5 text-[#E4E0D8]">{shot.atmosphere}</dd>
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-[#A8A49B]">
                                  Visual Composition
                                </dt>
                                <dd className="mt-0.5 text-[#E4E0D8]">
                                  {shot.visualComposition}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-[#A8A49B]">
                                  Sound & Music Suggestions
                                </dt>
                                <dd className="mt-0.5 text-[#E4E0D8]">{shot.soundAndMusic}</dd>
                              </div>
                            </dl>
                          )}

                          <div className="border-t border-[#222228] pt-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-[#C8A24B]">
                                AI Visual Storyboard Prompt
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleCopyPrompt(shot.id, shot.visualStoryboardPrompt)
                                }
                                className="inline-flex items-center gap-1 text-xs text-[#A8A49B] hover:text-[#F7F5F0]"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="h-3 w-3 text-[#C8A24B]" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    Copy Prompt
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="mt-1.5 font-mono text-xs leading-relaxed text-[#A8A49B]">
                              {shot.visualStoryboardPrompt}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
