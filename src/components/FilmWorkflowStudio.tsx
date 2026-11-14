import {
  AlertCircle,
  BookOpen,
  Camera,
  CheckCircle2,
  Clapperboard,
  ClipboardList,
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Upload,
  Users,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import type {
  FilmProject,
  ProjectReferenceImage,
  SceneVideoClip,
  StoryBrief,
  StudioSection,
} from '../types/film';
import {
  fetchStudioCapabilities,
  requestSceneVideoGeneration,
  type StudioCapabilities,
} from '../services/studioApi';
import {
  downloadTextFile,
  formatProductionPlanOnly,
  formatProjectAsDossier,
  formatScreenplayOnly,
} from '../utils/exportProject';
import {ReferenceUploaderStrip} from './ReferenceUploaderStrip';

interface FilmWorkflowStudioProps {
  project: FilmProject;
  isGenerating: boolean;
  onUpdateBrief: (brief: StoryBrief) => void;
  onRunStoryStep: () => Promise<boolean>;
  onRunScreenplayStep: () => Promise<boolean>;
  onRunCharactersStep: () => Promise<boolean>;
  onRunScenesAndStoryboardStep: () => Promise<boolean>;
  onRunProductionStep: () => Promise<boolean>;
  onUpdateVideoClips: (clips: SceneVideoClip[]) => void;
  onAddImages: (images: ProjectReferenceImage[]) => void;
  onUpdateImage: (id: string, patch: Partial<ProjectReferenceImage>) => void;
  onDeleteImage: (id: string) => void;
  onAnalyzeImage: (image: ProjectReferenceImage) => Promise<void>;
  onNavigate: (section: StudioSection) => void;
}

const WORKFLOW_STEPS = [
  {step: 1, label: 'Story Input', icon: BookOpen},
  {step: 2, label: 'Generate Story', icon: Sparkles},
  {step: 3, label: 'Generate Screenplay', icon: FileText},
  {step: 4, label: 'Generate Characters', icon: Users},
  {step: 5, label: 'Generate Scenes', icon: Camera},
  {step: 6, label: 'Generate Storyboard', icon: ImageIcon},
  {step: 7, label: 'Generate Film', icon: Clapperboard},
] as const;

export function FilmWorkflowStudio({
  project,
  isGenerating,
  onUpdateBrief,
  onRunStoryStep,
  onRunScreenplayStep,
  onRunCharactersStep,
  onRunScenesAndStoryboardStep,
  onRunProductionStep,
  onUpdateVideoClips,
  onAddImages,
  onUpdateImage,
  onDeleteImage,
  onAnalyzeImage,
  onNavigate,
}: FilmWorkflowStudioProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStageLabel, setPipelineStageLabel] = useState('');
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const [capabilities, setCapabilities] = useState<StudioCapabilities>({
    storyAndScript: true,
    multimodalImageAnalysis: true,
    storyboardImageGeneration: false,
    videoGeneration: false,
  });

  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number>(
    project.screenplay[0]?.sceneNumber ?? 1,
  );
  const [videoNotice, setVideoNotice] = useState<string | null>(null);
  const [videoGeneratingScene, setVideoGeneratingScene] = useState<number | null>(null);
  const [isPlayingClip, setIsPlayingClip] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const clipUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [attachingClipScene, setAttachingClipScene] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetchStudioCapabilities()
      .then((caps) => {
        if (active) setCapabilities(caps);
      })
      .catch(() => {
        // Keep safe defaults
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (project.screenplay.length > 0) {
      const exists = project.screenplay.some((s) => s.sceneNumber === selectedSceneNumber);
      if (!exists) {
        setSelectedSceneNumber(project.screenplay[0].sceneNumber);
      }
    }
  }, [project.screenplay, selectedSceneNumber]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stepCompletion = useMemo(() => {
    const hasInput = Boolean(project.brief.originalIdea.trim());
    const hasStory = Boolean(project.story);
    const hasScreenplay = project.screenplay.length > 0;
    const hasCharacters = project.characters.length > 0;
    const hasScenes = project.storyboard.length > 0;
    const hasStoryboardPrompts = project.storyboard.some((sb) => sb.shots.length > 0);
    const hasPlayableVideo = (project.videoClips ?? []).some(
      (c) => c.status === 'playable' && Boolean(c.videoUrl),
    );
    const hasAssemblyReady = hasStory && hasScreenplay && hasScenes;

    return {
      1: hasInput,
      2: hasStory,
      3: hasScreenplay,
      4: hasCharacters,
      5: hasScenes,
      6: hasStoryboardPrompts,
      7: hasPlayableVideo || hasAssemblyReady,
    } as Record<number, boolean>;
  }, [project]);

  const playableClips = useMemo(
    () => (project.videoClips ?? []).filter((c) => c.status === 'playable' && Boolean(c.videoUrl)),
    [project.videoClips],
  );

  const activeScene = useMemo(
    () =>
      project.screenplay.find((s) => s.sceneNumber === selectedSceneNumber) ||
      project.screenplay[0] ||
      null,
    [project.screenplay, selectedSceneNumber],
  );

  const activeStoryboardScene = useMemo(
    () =>
      project.storyboard.find((sb) => sb.sceneNumber === selectedSceneNumber) ||
      project.storyboard[0] ||
      null,
    [project.storyboard, selectedSceneNumber],
  );

  const activeClip = useMemo(
    () =>
      (project.videoClips ?? []).find((c) => c.sceneNumber === selectedSceneNumber) || null,
    [project.videoClips, selectedSceneNumber],
  );

  const handleRunFullPipeline = async () => {
    if (!project.brief.originalIdea.trim()) {
      setPipelineError('Step 1 requires an original story idea before running the pipeline.');
      setCurrentStep(1);
      return;
    }

    setPipelineError(null);
    setPipelineRunning(true);

    try {
      setCurrentStep(2);
      setPipelineStageLabel('Step 2 of 6: Generating Film Title, Synopsis & Story Outline...');
      const okStory = await onRunStoryStep();
      if (!okStory) {
        setPipelineError('Story generation stopped due to an API error. See alert above.');
        return;
      }

      setCurrentStep(3);
      setPipelineStageLabel('Step 3 of 6: Writing Formatted Screenplay Scenes...');
      const okScript = await onRunScreenplayStep();
      if (!okScript) {
        setPipelineError('Screenplay generation stopped due to an API error.');
        return;
      }

      setCurrentStep(4);
      setPipelineStageLabel('Step 4 of 6: Developing Character Profiles & Visual Descriptions...');
      const okChars = await onRunCharactersStep();
      if (!okChars) {
        setPipelineError('Character generation stopped due to an API error.');
        return;
      }

      setCurrentStep(5);
      setPipelineStageLabel(
        'Step 5 & 6 of 6: Breaking Down Cinematic Scenes, Shot Plans & Storyboard Prompts...',
      );
      const okScenes = await onRunScenesAndStoryboardStep();
      if (!okScenes) {
        setPipelineError('Scene & storyboard planning stopped due to an API error.');
        return;
      }

      setPipelineStageLabel('Preparing Production Plan & Film Assembly...');
      await onRunProductionStep();

      setCurrentStep(7);
      setPipelineStageLabel('');
    } finally {
      setPipelineRunning(false);
    }
  };

  const handleAttemptVideoGeneration = async (sceneNumber: number, heading: string) => {
    setVideoGeneratingScene(sceneNumber);
    setVideoNotice(null);
    const sb = project.storyboard.find((s) => s.sceneNumber === sceneNumber);
    const prompt = sb?.shots[0]?.visualStoryboardPrompt;

    try {
      const result = await requestSceneVideoGeneration({
        sceneNumber,
        sceneHeading: heading,
        storyboardPrompt: prompt,
      });
      const existing = project.videoClips ?? [];
      const nextClip: SceneVideoClip = {
        sceneNumber,
        status: 'playable',
        label: `Scene ${sceneNumber} Generated Clip`,
        videoUrl: result.videoUrl,
        durationSec: result.durationSec,
      };
      const updated = existing.some((c) => c.sceneNumber === sceneNumber)
        ? existing.map((c) => (c.sceneNumber === sceneNumber ? nextClip : c))
        : [...existing, nextClip];
      onUpdateVideoClips(updated);
    } catch (err) {
      setVideoNotice(
        err instanceof Error
          ? err.message
          : 'AI Video Generation is not currently connected.',
      );
    } finally {
      setVideoGeneratingScene(null);
    }
  };

  const handleAttachLocalClip = (files: FileList | null) => {
    if (!files || files.length === 0 || attachingClipScene === null) return;
    const file = files[0];
    if (!file.type.startsWith('video/')) {
      setVideoNotice('Please choose a valid video file (.mp4, .webm, .mov).');
      setAttachingClipScene(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const existing = project.videoClips ?? [];
    const nextClip: SceneVideoClip = {
      sceneNumber: attachingClipScene,
      status: 'playable',
      label: file.name,
      videoUrl: objectUrl,
    };
    const updated = existing.some((c) => c.sceneNumber === attachingClipScene)
      ? existing.map((c) => (c.sceneNumber === attachingClipScene ? nextClip : c))
      : [...existing, nextClip];
    onUpdateVideoClips(updated);
    setSelectedSceneNumber(attachingClipScene);
    setAttachingClipScene(null);
    setVideoNotice(null);
    if (clipUploadInputRef.current) clipUploadInputRef.current.value = '';
  };

  const handleTogglePlayPause = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setIsPlayingClip(true);
    } else {
      el.pause();
      setIsPlayingClip(false);
    }
  };

  const handleToggleNarrationReadThrough = () => {
    if (!('speechSynthesis' in window) || !activeScene) return;
    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
      return;
    }
    const narrationText = [
      `Scene ${activeScene.sceneNumber}. ${activeScene.intExt} ${activeScene.location}, ${activeScene.timeOfDay}.`,
      ...activeScene.elements.map((el) => el.text),
    ].join(' ');
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.96;
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsNarrating(true);
  };

  const safeSlug = project.brief.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const completedCount = Object.values(stepCompletion).filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* Header & Full Pipeline Trigger */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-5">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
            Integrated Film Production Pipeline · {project.brief.title}
          </p>
          <h1 className="mt-1 font-cinema text-3xl font-semibold text-[#F7F5F0] sm:text-4xl">
            Generate My Film Workflow
          </h1>
          <p className="mt-1 text-sm text-[#A8A49B]">
            Move from initial story idea to developed synopsis, screenplay, cast dossiers, shot
            plans, storyboard prompts, and assembled film workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleRunFullPipeline()}
          disabled={pipelineRunning || isGenerating || !project.brief.originalIdea.trim()}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-5 py-3 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-50"
        >
          {pipelineRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running Pipeline...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Run Full Pipeline (Steps 2–6)
            </>
          )}
        </button>
      </div>

      {/* Live Pipeline Progress */}
      {(pipelineRunning || pipelineStageLabel || pipelineError) && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            pipelineError
              ? 'border-red-500/40 bg-red-950/35 text-red-200'
              : 'border-[#C8A24B]/45 bg-[#151412] text-[#F7F5F0]'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {pipelineRunning ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#C8A24B]" />
              ) : pipelineError ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#C8A24B]" />
              )}
              <span>{pipelineError || pipelineStageLabel}</span>
            </div>
            <span className="font-mono text-xs tabular-nums text-[#E5C77A]">
              {completedCount}/7 stages ready
            </span>
          </div>
        </div>
      )}

      {/* 7-Step Interactive Stepper */}
      <nav
        aria-label="Film generation steps"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
      >
        {WORKFLOW_STEPS.map((item) => {
          const Icon = item.icon;
          const isCurrent = currentStep === item.step;
          const isDone = stepCompletion[item.step];
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => setCurrentStep(item.step)}
              className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition-colors ${
                isCurrent
                  ? 'border-[#C8A24B] bg-[#171510]'
                  : 'border-[#222228] bg-[#111114] hover:border-[#3A3A44]'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-mono text-[11px] font-semibold tabular-nums text-[#C8A24B]">
                  STEP {item.step}
                </span>
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A24B]" />
                ) : (
                  <Icon className="h-3.5 w-3.5 text-[#76726A]" />
                )}
              </div>
              <span className="mt-2 text-xs font-semibold text-[#F7F5F0]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* STEP 1: STORY INPUT */}
      {currentStep === 1 && (
        <section className="space-y-6">
          <div className="rounded-xl border border-[#222228] bg-[#111114] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222228] pb-4">
              <div>
                <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                  Step 1: Story Input & Creative Brief
                </h2>
                <p className="text-xs text-[#A8A49B]">
                  Enter your story idea, choose genre, language, duration, and upload visual
                  references.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const ok = await onRunStoryStep();
                  if (ok) setCurrentStep(2);
                }}
                disabled={isGenerating || !project.brief.originalIdea.trim()}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-4 py-2.5 text-sm font-semibold text-[#09090B] hover:bg-[#D9B45D] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Story...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Continue to Step 2: Generate Story
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                  Working Title (or leave for Gemini)
                </label>
                <input
                  type="text"
                  value={project.brief.title}
                  onChange={(e) => onUpdateBrief({...project.brief, title: e.target.value})}
                  className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">Genre</label>
                <select
                  value={project.brief.genre}
                  onChange={(e) => onUpdateBrief({...project.brief, genre: e.target.value})}
                  className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
                >
                  {[
                    project.brief.genre,
                    'Drama / Cultural Cinema',
                    'Drama',
                    'Thriller',
                    'Historical Epic',
                    'Sci-Fi',
                    'Mystery',
                    'Romantic Drama',
                    'Documentary-Style Drama',
                  ]
                    .filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i)
                    .map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">Language</label>
                <select
                  value={project.brief.language}
                  onChange={(e) => onUpdateBrief({...project.brief, language: e.target.value})}
                  className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
                >
                  {[
                    project.brief.language,
                    'English',
                    'English & Fante',
                    'English & Twi',
                    'English & Yoruba',
                    'English & Swahili',
                    'French',
                    'French & Wolof',
                    'Arabic',
                  ]
                    .filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i)
                    .map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                  Film Duration
                </label>
                <input
                  type="text"
                  value={project.brief.duration}
                  onChange={(e) => onUpdateBrief({...project.brief, duration: e.target.value})}
                  placeholder="e.g. 95 minutes"
                  className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
                Original Story Idea
              </label>
              <textarea
                rows={4}
                value={project.brief.originalIdea}
                onChange={(e) => onUpdateBrief({...project.brief, originalIdea: e.target.value})}
                placeholder="Write your core film story idea, characters, setting, and emotional conflict..."
                className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
              />
            </div>
          </div>

          <ReferenceUploaderStrip
            title="Upload Reference Photographs"
            subtitle="Attach character, location, costume, props, or mood photographs to guide Steps 2–6."
            defaultCategory="Scene Inspiration"
            images={project.referenceImages ?? []}
            onAddImages={onAddImages}
            onUpdateImage={onUpdateImage}
            onDeleteImage={onDeleteImage}
            onAnalyzeImage={onAnalyzeImage}
            onOpenGallery={() => onNavigate('gallery')}
          />
        </section>
      )}

      {/* STEP 2: GENERATE STORY */}
      {currentStep === 2 && (
        <section className="rounded-xl border border-[#222228] bg-[#111114] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222228] pb-4">
            <div>
              <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                Step 2: Generate Film Title, Synopsis & Plot Structure
              </h2>
              <p className="text-xs text-[#A8A49B]">
                Gemini transforms your story input and reference photos into a structured film
                outline.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onRunStoryStep()}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8A24B] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#D9B45D] disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {project.story ? 'Regenerate Story' : 'Generate Story'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2 text-xs font-medium text-[#F7F5F0] hover:border-[#C8A24B]"
              >
                Next: Generate Screenplay
              </button>
            </div>
          </div>

          {project.story ? (
            <div className="space-y-4 text-sm">
              {project.story.suggestedTitle && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#C8A24B]/30 bg-[#151412] px-4 py-3">
                  <div>
                    <span className="text-xs text-[#C8A24B]">Gemini Suggested Film Title: </span>
                    <span className="font-cinema text-xl font-semibold text-[#F7F5F0]">
                      {project.story.suggestedTitle}
                    </span>
                  </div>
                  {project.story.suggestedTitle !== project.brief.title && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateBrief({
                          ...project.brief,
                          title: project.story?.suggestedTitle || project.brief.title,
                        })
                      }
                      className="rounded-md border border-[#C8A24B]/50 px-3 py-1 text-xs font-medium text-[#E5C77A] hover:bg-[#C8A24B]/15"
                    >
                      Use as Project Title
                    </button>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-[#C8A24B]">Logline</p>
                <p className="mt-1 text-base text-[#F7F5F0]">{project.story.logline}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#C8A24B]">Synopsis</p>
                <p className="mt-1 whitespace-pre-line leading-relaxed text-[#D5D1C8]">
                  {project.story.synopsis}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4">
                  <p className="text-xs font-semibold text-[#E5C77A]">Act I · Beginning</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#D5D1C8]">
                    {project.story.beginning}
                  </p>
                </div>
                <div className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4">
                  <p className="text-xs font-semibold text-[#E5C77A]">Act II · Middle</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#D5D1C8]">
                    {project.story.middle}
                  </p>
                </div>
                <div className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4">
                  <p className="text-xs font-semibold text-[#E5C77A]">Act III · Ending</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#D5D1C8]">
                    {project.story.ending}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-[#A8A49B]">
              Click <strong>Generate Story</strong> above to generate the film title, logline,
              synopsis, and three-act outline with Gemini.
            </p>
          )}
        </section>
      )}

      {/* STEP 3: GENERATE SCREENPLAY */}
      {currentStep === 3 && (
        <section className="rounded-xl border border-[#222228] bg-[#111114] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222228] pb-4">
            <div>
              <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                Step 3: Generate Structured Screenplay
              </h2>
              <p className="text-xs text-[#A8A49B]">
                Gemini develops formatted scenes with sluglines, action lines, and dialogue.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onRunScreenplayStep()}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8A24B] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#D9B45D] disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {project.screenplay.length > 0 ? 'Regenerate Screenplay' : 'Generate Screenplay'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('screenplay')}
                className="rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2 text-xs font-medium text-[#F7F5F0] hover:border-[#C8A24B]"
              >
                Open Full Editor
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2 text-xs font-medium text-[#F7F5F0] hover:border-[#C8A24B]"
              >
                Next: Generate Characters
              </button>
            </div>
          </div>

          {project.screenplay.length > 0 ? (
            <div className="space-y-4">
              {project.screenplay.map((scene) => (
                <div
                  key={scene.id}
                  className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4 font-mono text-xs"
                >
                  <p className="font-semibold text-[#E5C77A]">
                    SCENE {scene.sceneNumber} — {scene.intExt} {scene.location} - {scene.timeOfDay}
                  </p>
                  <p className="mt-2 line-clamp-3 leading-relaxed text-[#D5D1C8]">
                    {scene.elements
                      .map((e) => (e.type === 'character' ? `${e.text}:` : e.text))
                      .join(' ')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-[#A8A49B]">
              Click <strong>Generate Screenplay</strong> to convert your story into formatted
              scenes.
            </p>
          )}
        </section>
      )}

      {/* STEP 4: GENERATE CHARACTERS */}
      {currentStep === 4 && (
        <section className="rounded-xl border border-[#222228] bg-[#111114] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222228] pb-4">
            <div>
              <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                Step 4: Generate Character Profiles & Visual Descriptions
              </h2>
              <p className="text-xs text-[#A8A49B]">
                Gemini generates detailed cast dossiers combining story context and uploaded
                character/costume photos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onRunCharactersStep()}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8A24B] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#D9B45D] disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {project.characters.length > 0 ? 'Regenerate Characters' : 'Generate Characters'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2 text-xs font-medium text-[#F7F5F0] hover:border-[#C8A24B]"
              >
                Next: Generate Scenes
              </button>
            </div>
          </div>

          {project.characters.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {project.characters.map((c) => (
                <div key={c.id} className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4">
                  <p className="font-mono text-xs text-[#C8A24B]">
                    Age {c.age} · {c.role}
                  </p>
                  <h3 className="mt-1 font-cinema text-xl font-semibold text-[#F7F5F0]">
                    {c.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#D5D1C8]">
                    {c.visualAppearance}
                  </p>
                  <p className="mt-1.5 text-xs text-[#A8A49B]">
                    <span className="text-[#E5C77A]">Wardrobe: </span>
                    {c.costumeNotes}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-[#A8A49B]">
              Click <strong>Generate Characters</strong> to create your cast profiles.
            </p>
          )}
        </section>
      )}

      {/* STEP 5: GENERATE SCENES */}
      {currentStep === 5 && (
        <section className="rounded-xl border border-[#222228] bg-[#111114] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222228] pb-4">
            <div>
              <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                Step 5: Cinematic Scene Breakdown & Camera Shot Plans
              </h2>
              <p className="text-xs text-[#A8A49B]">
                Break your screenplay into directorial shot lists with angles, movement, lighting,
                and audio cues.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onRunScenesAndStoryboardStep()}
                disabled={isGenerating || project.screenplay.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8A24B] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#D9B45D] disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {project.storyboard.length > 0 ? 'Regenerate Scene Shots' : 'Generate Scene Shots'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2 text-xs font-medium text-[#F7F5F0] hover:border-[#C8A24B]"
              >
                Next: Generate Storyboard
              </button>
            </div>
          </div>

          {project.storyboard.length > 0 ? (
            <div className="space-y-4">
              {project.storyboard.map((sb) => (
                <div key={sb.id} className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-cinema text-xl font-semibold text-[#F7F5F0]">
                      Scene {sb.sceneNumber}: {sb.sceneTitle}
                    </h3>
                    <span className="font-mono text-xs tabular-nums text-[#C8A24B]">
                      {sb.shots.length} shots
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#A8A49B]">{sb.sceneDescription}</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {sb.shots.map((sh) => (
                      <div
                        key={sh.id}
                        className="rounded border border-[#222228] bg-[#111114] p-3 text-xs"
                      >
                        <p className="font-mono font-semibold text-[#E5C77A]">
                          Shot {sh.shotNumber} · {sh.shotType}
                        </p>
                        <p className="mt-1 text-[#D5D1C8]">
                          {sh.cameraAngle} · {sh.cameraMovement}
                        </p>
                        <p className="mt-1 text-[#A8A49B]">{sh.lightingDirection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-[#A8A49B]">
              {project.screenplay.length === 0
                ? 'Complete Step 3 (Generate Screenplay) first so Gemini can plan scene shots.'
                : 'Click Generate Scene Shots to break your screenplay into detailed shot lists.'}
            </p>
          )}
        </section>
      )}

      {/* STEP 6: GENERATE STORYBOARD */}
      {currentStep === 6 && (
        <section className="rounded-xl border border-[#222228] bg-[#111114] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222228] pb-4">
            <div>
              <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                Step 6: Storyboard Frames & Visual Prompts
              </h2>
              <p className="text-xs text-[#A8A49B]">
                Visual storyboard prompts and concept layout placeholders prepared for each shot.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate('storyboard')}
                className="rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2 text-xs font-medium text-[#F7F5F0] hover:border-[#C8A24B]"
              >
                Open Storyboard Studio
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(7)}
                className="rounded-lg bg-[#C8A24B] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#D9B45D]"
              >
                Next: Generate Film Assembly
              </button>
            </div>
          </div>

          {!capabilities.storyboardImageGeneration && (
            <div className="flex items-start gap-3 rounded-lg border border-[#C8A24B]/35 bg-[#151412] px-4 py-3 text-xs text-[#E4E0D8]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A24B]" />
              <div>
                <span className="font-semibold text-[#E5C77A]">
                  Live AI Storyboard Image Rendering Unavailable on Free Tier:{' '}
                </span>
                <span>
                  MARBRECAL AI stays 100% free of paid image-generation APIs. Below are your
                  Gemini-authored visual storyboard prompts paired with clearly labelled concept
                  placeholder frames (never misrepresented as rendered images).
                </span>
              </div>
            </div>
          )}

          {project.storyboard.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[#A8A49B]">
                No storyboard shots planned yet. Run Step 5 to generate shot plans and prompts.
              </p>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="mt-3 rounded-lg bg-[#C8A24B] px-4 py-2 text-xs font-semibold text-[#09090B]"
              >
                Go to Step 5: Generate Scenes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {project.storyboard.flatMap((sb) =>
                sb.shots.map((shot) => (
                  <div
                    key={shot.id}
                    className="overflow-hidden rounded-lg border border-[#222228] bg-[#0D0D10]"
                  >
                    {shot.previewImage ? (
                      <div className="relative aspect-video bg-[#09090B]">
                        <img
                          src={shot.previewImage}
                          alt={`Sample concept still for shot ${shot.shotNumber}`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 font-mono text-[10px] text-[#E5C77A]">
                          Sample Concept Still · Shot {shot.shotNumber}
                        </span>
                      </div>
                    ) : (
                      <div className="flex aspect-video flex-col items-center justify-center border-b border-[#222228] bg-gradient-to-br from-[#161511] to-[#09090B] p-4 text-center">
                        <Film className="h-5 w-5 text-[#C8A24B]/70" />
                        <p className="mt-2 font-mono text-xs font-semibold text-[#E5C77A]">
                          Concept Placeholder Frame · Shot {shot.shotNumber}
                        </p>
                        <p className="mt-1 text-[11px] text-[#76726A]">
                          Not an AI-rendered image — use prompt below for visual rendering
                        </p>
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-xs font-medium text-[#C8A24B]">
                        Scene {sb.sceneNumber} · {shot.shotType} ({shot.cameraAngle})
                      </p>
                      <p className="mt-1.5 font-mono text-xs leading-relaxed text-[#D5D1C8]">
                        {shot.visualStoryboardPrompt}
                      </p>
                    </div>
                  </div>
                )),
              )}
            </div>
          )}
        </section>
      )}

      {/* STEP 7: GENERATE FILM (Assembly, Preview, Timeline, AI VIDEO GENERATION, Export) */}
      {currentStep === 7 && (
        <div className="space-y-8">
          {/* Film Preview & Player Workspace */}
          <section className="rounded-xl border border-[#222228] bg-[#111114] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222228] pb-4">
              <div>
                <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                  Step 7: Film Assembly & Preview Workspace
                </h2>
                <p className="text-xs text-[#A8A49B]">
                  Unified preview combining your scenes, storyboard assets, screenplay narration,
                  production breakdown, and video clip queue.
                </p>
              </div>
              {!project.production && (
                <button
                  type="button"
                  onClick={() => void onRunProductionStep()}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8A24B]/50 bg-[#C8A24B]/10 px-3.5 py-2 text-xs font-semibold text-[#E5C77A] hover:bg-[#C8A24B]/20"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Generate Production Plan
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Preview Monitor */}
              <div className="lg:col-span-7 space-y-3">
                <div className="overflow-hidden rounded-xl border border-[#27272F] bg-[#09090B]">
                  {activeClip?.status === 'playable' && activeClip.videoUrl ? (
                    <video
                      ref={videoRef}
                      src={activeClip.videoUrl}
                      onPlay={() => setIsPlayingClip(true)}
                      onPause={() => setIsPlayingClip(false)}
                      onEnded={() => setIsPlayingClip(false)}
                      className="aspect-video w-full bg-black object-contain"
                    />
                  ) : activeStoryboardScene?.shots[0]?.previewImage ? (
                    <div className="relative aspect-video">
                      <img
                        src={activeStoryboardScene.shots[0].previewImage}
                        alt={`Scene ${selectedSceneNumber} storyboard visual`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                      <div className="absolute right-4 bottom-4 left-4">
                        <p className="font-mono text-xs text-[#E5C77A]">
                          Scene {selectedSceneNumber} · Concept Still Preview (No Video Clip
                          Generated)
                        </p>
                        <p className="mt-1 text-sm text-[#F7F5F0]">
                          {activeStoryboardScene.sceneTitle}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center bg-gradient-to-br from-[#161511] via-[#0D0D10] to-[#09090B] p-6 text-center">
                      <Film className="h-8 w-8 text-[#C8A24B]/70" />
                      <p className="mt-3 font-cinema text-2xl text-[#F7F5F0]">
                        {activeScene
                          ? `Scene ${activeScene.sceneNumber}: ${activeScene.intExt} ${activeScene.location}`
                          : 'No Scene Selected'}
                      </p>
                      <p className="mt-1 max-w-md text-xs text-[#A8A49B]">
                        {activeStoryboardScene?.shots[0]?.visualStoryboardPrompt ||
                          'No playable video clip has been generated for this scene yet. Review the screenplay narration and storyboard prompt alongside.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Play / Pause & Browser Narration Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#222228] bg-[#0D0D10] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!(activeClip?.status === 'playable' && activeClip.videoUrl)}
                      onClick={handleTogglePlayPause}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#C8A24B] px-3.5 py-2 text-xs font-semibold text-[#09090B] disabled:cursor-not-allowed disabled:bg-[#27272F] disabled:text-[#76726A]"
                    >
                      {isPlayingClip ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          Pause Video
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          Play Video
                        </>
                      )}
                    </button>
                    <span className="text-xs text-[#A8A49B]">
                      {playableClips.length > 0
                        ? `${playableClips.length} playable clip${playableClips.length === 1 ? '' : 's'} ready`
                        : 'No playable video clips exist yet'}
                    </span>
                  </div>

                  {activeScene && 'speechSynthesis' in window && (
                    <button
                      type="button"
                      onClick={handleToggleNarrationReadThrough}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#2D2D36] bg-[#18181D] px-3 py-1.5 text-xs font-medium text-[#F7F5F0] hover:border-[#C8A24B]/60"
                    >
                      {isNarrating ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5 text-[#C8A24B]" />
                          Stop Narration Read-Through
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5 text-[#C8A24B]" />
                          Browser Narration Read-Through
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Active Scene Narration & Assembly Inspector */}
              <div className="lg:col-span-5 rounded-xl border border-[#222228] bg-[#0D0D10] p-5 space-y-4">
                <div className="border-b border-[#222228] pb-3">
                  <p className="font-mono text-xs text-[#C8A24B]">
                    SCENE {String(selectedSceneNumber).padStart(2, '0')} · SCRIPT & AUDIO CUES
                  </p>
                  <h3 className="mt-1 font-cinema text-xl font-semibold text-[#F7F5F0]">
                    {activeScene
                      ? `${activeScene.intExt} ${activeScene.location} - ${activeScene.timeOfDay}`
                      : 'No Scene Available'}
                  </h3>
                </div>

                {activeScene ? (
                  <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1 font-mono text-xs leading-relaxed text-[#D5D1C8]">
                    {activeScene.elements.map((el) => (
                      <p
                        key={el.id}
                        className={
                          el.type === 'character'
                            ? 'pt-1 font-semibold text-[#E5C77A]'
                            : el.type === 'dialogue'
                              ? 'pl-4 text-[#F7F5F0]'
                              : ''
                        }
                      >
                        {el.text}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#A8A49B]">
                    Generate screenplay scenes in Step 3 to populate the scene timeline and script
                    narration.
                  </p>
                )}

                <div className="border-t border-[#222228] pt-3 text-xs text-[#A8A49B]">
                  <span className="font-medium text-[#E5C77A]">Sound & Music Cue: </span>
                  {activeStoryboardScene?.shots[0]?.soundAndMusic ||
                    'Generate scene shots in Step 5 for sound & score cues.'}
                </div>
              </div>
            </div>

            {/* Scene-by-Scene Timeline */}
            <div className="space-y-3 border-t border-[#222228] pt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-cinema text-xl font-semibold text-[#F7F5F0]">
                  Scene-by-Scene Timeline
                </h3>
                <span className="font-mono text-xs tabular-nums text-[#A8A49B]">
                  {project.screenplay.length} scenes · {project.referenceImages?.length ?? 0}{' '}
                  visual references
                </span>
              </div>

              {project.screenplay.length === 0 ? (
                <p className="text-xs text-[#76726A]">
                  No scenes in timeline yet. Run Step 3 to generate your screenplay.
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {project.screenplay.map((scene) => {
                    const isSelected = scene.sceneNumber === selectedSceneNumber;
                    const sb = project.storyboard.find((s) => s.sceneNumber === scene.sceneNumber);
                    const clip = (project.videoClips ?? []).find(
                      (c) => c.sceneNumber === scene.sceneNumber,
                    );
                    return (
                      <button
                        key={scene.id}
                        type="button"
                        onClick={() => {
                          setIsPlayingClip(false);
                          setSelectedSceneNumber(scene.sceneNumber);
                        }}
                        className={`min-w-[210px] shrink-0 rounded-lg border p-3.5 text-left transition-colors ${
                          isSelected
                            ? 'border-[#C8A24B] bg-[#171510]'
                            : 'border-[#222228] bg-[#0D0D10] hover:border-[#3A3A44]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="font-semibold text-[#C8A24B]">
                            SC {String(scene.sceneNumber).padStart(2, '0')}
                          </span>
                          <span className="text-[#76726A]">
                            {clip?.status === 'playable'
                              ? 'Clip Ready'
                              : `${sb?.shots.length ?? 0} shots`}
                          </span>
                        </div>
                        <p className="mt-1.5 truncate text-xs font-semibold text-[#F7F5F0]">
                          {scene.intExt} {scene.location}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-[#A8A49B]">
                          {scene.timeOfDay}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Separate AI VIDEO GENERATION Module */}
          <section className="rounded-xl border border-[#222228] bg-[#111114] p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#222228] pb-4">
              <div>
                <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
                  Separate Video Synthesis Module
                </p>
                <h2 className="mt-1 font-cinema text-2xl font-semibold text-[#F7F5F0]">
                  AI VIDEO GENERATION
                </h2>
              </div>
              <span className="font-mono text-xs text-[#A8A49B]">
                {capabilities.videoGeneration
                  ? 'Video Service Connected'
                  : 'Video Service Not Connected'}
              </span>
            </div>

            {!capabilities.videoGeneration && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/35 bg-amber-950/25 px-4 py-3.5 text-sm text-amber-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <p className="font-semibold text-white">
                    AI Video Generation is not currently connected.
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-100/85">
                    This prototype operates without paid external video-generation APIs, so no AI
                    video clips have been rendered. All story development, screenplay writing,
                    character creation, camera shot planning, storyboard prompts, visual reference
                    analysis, and production exports remain 100% functional. You may also attach a
                    local .mp4/.webm clip per scene below to test timeline playback.
                  </p>
                </div>
              </div>
            )}

            {videoNotice && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-950/35 px-4 py-3 text-xs text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{videoNotice}</span>
              </div>
            )}

            <input
              ref={clipUploadInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => handleAttachLocalClip(e.target.files)}
              className="hidden"
            />

            {/* Video Clip Organization */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#F7F5F0]">
                Video Clip Organization Queue
              </h3>
              {project.screenplay.length === 0 ? (
                <p className="text-xs text-[#76726A]">
                  Create screenplay scenes first to organize scene clip slots.
                </p>
              ) : (
                <div className="divide-y divide-[#222228] overflow-hidden rounded-lg border border-[#222228] bg-[#0D0D10]">
                  {project.screenplay.map((scene) => {
                    const clip = (project.videoClips ?? []).find(
                      (c) => c.sceneNumber === scene.sceneNumber,
                    );
                    const heading = `${scene.intExt} ${scene.location} - ${scene.timeOfDay}`;
                    const isGeneratingThis = videoGeneratingScene === scene.sceneNumber;

                    return (
                      <div
                        key={scene.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-[#E5C77A]">
                            CLIP SLOT {String(scene.sceneNumber).padStart(2, '0')} · {heading}
                          </p>
                          <p className="mt-0.5 text-xs text-[#A8A49B]">
                            {clip?.status === 'playable'
                              ? `Playable video attached: ${clip.label}`
                              : 'Status: No video clip generated yet'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isGeneratingThis}
                            onClick={() =>
                              void handleAttemptVideoGeneration(scene.sceneNumber, heading)
                            }
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#C8A24B]/40 bg-[#C8A24B]/10 px-3 py-1.5 text-xs font-medium text-[#E5C77A] hover:bg-[#C8A24B]/20 disabled:opacity-50"
                          >
                            {isGeneratingThis ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Video className="h-3.5 w-3.5" />
                            )}
                            Generate Scene Clip
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAttachingClipScene(scene.sceneNumber);
                              clipUploadInputRef.current?.click();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#2D2D36] bg-[#18181D] px-3 py-1.5 text-xs text-[#F7F5F0] hover:border-[#C8A24B]/60"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Attach Local Video
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Film Export Bar */}
          <section className="rounded-xl border border-[#222228] bg-[#111114] p-6 space-y-4">
            <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
              Export Film Assets
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `${safeSlug || 'film'}-screenplay.txt`,
                    formatScreenplayOnly(project),
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8A24B] px-4 py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#D9B45D]"
              >
                <Download className="h-3.5 w-3.5" />
                Export Screenplay
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `${safeSlug || 'film'}-production-plan.txt`,
                    formatProductionPlanOnly(project),
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2.5 text-xs font-medium text-[#F7F5F0] hover:border-[#C8A24B]/60"
              >
                <Download className="h-3.5 w-3.5 text-[#C8A24B]" />
                Export Production Plan
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `${safeSlug || 'film'}-complete-dossier.txt`,
                    formatProjectAsDossier(project),
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2.5 text-xs font-medium text-[#F7F5F0] hover:border-[#C8A24B]/60"
              >
                <Download className="h-3.5 w-3.5 text-[#C8A24B]" />
                Export Complete Film Package
              </button>

              <button
                type="button"
                disabled={playableClips.length === 0}
                title={
                  playableClips.length === 0
                    ? 'Unavailable until actual video clips are generated and assembled'
                    : 'Download assembled video clip'
                }
                onClick={() => {
                  const firstClip = playableClips[0];
                  if (firstClip?.videoUrl) {
                    const a = document.createElement('a');
                    a.href = firstClip.videoUrl;
                    a.download = `${safeSlug || 'film'}-scene-${firstClip.sceneNumber}.mp4`;
                    a.click();
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-[#27272F] bg-[#0D0D10] px-4 py-2.5 text-xs font-medium text-[#76726A] disabled:cursor-not-allowed enabled:border-[#C8A24B]/60 enabled:text-[#E5C77A]"
              >
                <Video className="h-3.5 w-3.5" />
                {playableClips.length > 0
                  ? 'Export Completed Video'
                  : 'Export Completed Video (No Video Generated)'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
