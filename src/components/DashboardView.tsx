import {
  Activity,
  ArrowRight,
  BookOpen,
  Camera,
  Clapperboard,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileText,
  Film,
  FolderKanban,
  Gauge,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import {HERO_STUDIO_IMAGE} from '../data/sampleProject';
import type {FilmProject, StudioSection} from '../types/film';

interface DashboardViewProps {
  projects: FilmProject[];
  activeProject: FilmProject | null;
  onSelectProject: (projectId: string) => void;
  onNavigate: (section: StudioSection) => void;
  onOpenNewFilm: () => void;
  onDeleteProject: (projectId: string) => void;
  onResetSampleProject: () => void;
}

const STUDIO_MODULES: Array<{
  id: StudioSection;
  number: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
}> = [
  {
    id: 'workflow',
    number: '01',
    title: 'Generate My Film',
    description:
      'Run the integrated 7-step story-to-film pipeline from original premise to screenplay, cast, shots, and assembly.',
    icon: Clapperboard,
  },
  {
    id: 'story',
    number: '02',
    title: 'Story Development',
    description:
      'Transform a raw premise into a sharp logline, three-act narrative arc, themes, and emotional stakes.',
    icon: BookOpen,
  },
  {
    id: 'screenplay',
    number: '03',
    title: 'Screenplay Studio',
    description:
      'Convert story beats into industry-formatted scenes with sluglines, action lines, dialogue, and transitions.',
    icon: FileText,
  },
  {
    id: 'characters',
    number: '04',
    title: 'Character Studio',
    description:
      'Build detailed cast dossiers with creator-specified ages, motivations, arcs, and wardrobe direction.',
    icon: Users,
  },
  {
    id: 'storyboard',
    number: '05',
    title: 'Scene & Storyboard Studio',
    description:
      'Plan shot lists, camera angles, lighting moods, sound cues, and visual storyboard prompts per scene.',
    icon: Camera,
  },
  {
    id: 'production',
    number: '06',
    title: 'Production Planning',
    description:
      'Generate casting requirements, locations, props, equipment packages, and shoot-day complexity estimates.',
    icon: ClipboardList,
  },
  {
    id: 'gallery',
    number: '07',
    title: 'Visual Gallery',
    description:
      'Upload photographs and visual story references for Gemini character, costume, setting, and composition analysis.',
    icon: ImageIcon,
  },
  {
    id: 'export',
    number: '08',
    title: 'Export Project',
    description:
      'Compile your complete screenplay, shot plans, and production breakdown into a printable dossier.',
    icon: Download,
  },
];

function calculateComplexityScore(project: FilmProject | null): {
  score: number;
  label: string;
  detail: string;
} {
  if (!project || !project.production) {
    return {
      score: 0,
      label: 'Not Planned',
      detail: 'Generate a production plan to compute complexity',
    };
  }

  const {production, screenplay} = project;
  const locationPoints = Math.min(3, production.locations.length * 0.75);
  const castPoints = Math.min(2.5, production.requiredActors.length * 0.6);
  const scenePoints = Math.min(2.5, (screenplay.length || production.sceneRequirements.length) * 0.6);
  const logisticsPoints = Math.min(
    2,
    (production.props.length + production.equipmentSuggestions.length) * 0.18,
  );
  const computed = Math.max(
    1,
    Math.min(10, Math.round(locationPoints + castPoints + scenePoints + logisticsPoints)),
  );

  return {
    score: computed,
    label: production.estimatedComplexity,
    detail: production.estimatedShootDays,
  };
}

export function DashboardView({
  projects,
  activeProject,
  onSelectProject,
  onNavigate,
  onOpenNewFilm,
  onDeleteProject,
  onResetSampleProject,
}: DashboardViewProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const sampleProject = projects.find((p) => p.isSample);

  const studioStats = useMemo(() => {
    const totalProjects = projects.length;
    const storiesDeveloped = projects.filter((p) => Boolean(p.story)).length;
    const screenplayScenes = projects.reduce((sum, p) => sum + p.screenplay.length, 0);
    const charactersCreated = projects.reduce((sum, p) => sum + p.characters.length, 0);
    const storyboardShots = projects.reduce(
      (sum, p) => sum + p.storyboard.reduce((sAcc, sb) => sAcc + sb.shots.length, 0),
      0,
    );
    const productionPlans = projects.filter((p) => Boolean(p.production)).length;
    const geminiGenerations = projects.reduce(
      (sum, p) => sum + (p.geminiGenerations ?? 0),
      0,
    );

    return [
      {
        label: 'Total Film Projects Created',
        value: totalProjects,
        icon: FolderKanban,
        note: totalProjects === 1 ? '1 active slate' : `${totalProjects} saved slates`,
      },
      {
        label: 'Stories Developed',
        value: storiesDeveloped,
        icon: BookOpen,
        note: 'Loglines & 3-act arcs',
      },
      {
        label: 'Screenplay Scenes Generated',
        value: screenplayScenes,
        icon: FileText,
        note: 'Formatted script scenes',
      },
      {
        label: 'Characters Created',
        value: charactersCreated,
        icon: Users,
        note: 'Detailed cast dossiers',
      },
      {
        label: 'Storyboard Shots Planned',
        value: storyboardShots,
        icon: Camera,
        note: 'Camera & lighting setups',
      },
      {
        label: 'Production Plans Completed',
        value: productionPlans,
        icon: ClipboardCheck,
        note: 'Full unit breakdowns',
      },
      {
        label: 'Successful Gemini AI Generations',
        value: geminiGenerations,
        icon: Sparkles,
        note: 'Verified live AI outputs',
        highlight: true,
      },
    ];
  }, [projects]);

  const activeSceneCount = activeProject ? activeProject.screenplay.length : 0;
  const activeCharacterCount = activeProject ? activeProject.characters.length : 0;
  const activeShotCount = activeProject
    ? activeProject.storyboard.reduce((sum, s) => sum + s.shots.length, 0)
    : 0;
  const complexity = useMemo(() => calculateComplexityScore(activeProject), [activeProject]);

  return (
    <div className="space-y-10">
      {/* Cinematic Split Hero */}
      <section className="grid grid-cols-1 items-stretch overflow-hidden rounded-xl border border-[#222228] bg-[#111114] lg:grid-cols-12">
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7 lg:p-10">
          <div>
            <p className="text-xs font-medium tracking-widest text-[#C8A24B] uppercase">
              MARDIA STUDIO Presents
            </p>
            <h1 className="mt-3 max-w-2xl font-cinema text-4xl font-semibold leading-[1.08] tracking-tight text-[#F7F5F0] [text-wrap:balance] sm:text-5xl">
              MARBRECAL AI – Story-to-Film Studio
            </h1>
            <p className="mt-3 font-cinema text-xl italic text-[#E5C77A]">
              “Your Story. Your Vision. Your Film.”
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#A8A49B] sm:text-base">
              Develop original film concepts from first spark to production-ready screenplay,
              character dossiers, shot-by-shot storyboards, and practical shoot breakdowns—powered
              by live Google Gemini intelligence.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (activeProject) {
                  onNavigate('workflow');
                } else {
                  onOpenNewFilm();
                }
              }}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-[#C8A24B] via-[#E5C77A] to-[#C8A24B] px-5 py-3 text-sm font-bold tracking-wide text-[#09090B] shadow-[0_0_24px_rgba(200,162,75,0.22)] transition-all hover:brightness-110"
            >
              <Clapperboard className="h-4 w-4" />
              GENERATE MY FILM
            </button>

            <button
              type="button"
              onClick={onOpenNewFilm}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[#C8A24B]/50 bg-[#171510] px-4 py-3 text-sm font-semibold text-[#E5C77A] transition-colors hover:bg-[#C8A24B]/15"
            >
              <Plus className="h-4 w-4" />
              Create a New Film
            </button>

            {sampleProject ? (
              <button
                type="button"
                onClick={() => {
                  onSelectProject(sampleProject.id);
                  onNavigate('story');
                }}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-3 text-sm font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60 hover:bg-[#1E1E25]"
              >
                <Sparkles className="h-4 w-4 text-[#C8A24B]" />
                Explore Sample: THE LAST PROMISE
              </button>
            ) : (
              <button
                type="button"
                onClick={onResetSampleProject}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-3 text-sm font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60 hover:bg-[#1E1E25]"
              >
                <RotateCcw className="h-4 w-4 text-[#C8A24B]" />
                Load Sample: THE LAST PROMISE
              </button>
            )}
          </div>
        </div>

        <div className="relative min-h-[260px] border-t border-[#222228] bg-[#0B0B0E] lg:col-span-5 lg:min-h-[380px] lg:border-t-0 lg:border-l">
          {!heroImgFailed ? (
            <img
              src={HERO_STUDIO_IMAGE}
              alt="MARBRECAL AI dark cinema soundstage and camera rig"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#18181D] via-[#09090B] to-[#1A150B] p-8 text-center">
              <Film className="h-12 w-12 text-[#C8A24B]/70" />
              <p className="mt-3 font-cinema text-xl text-[#F7F5F0]">MARDIA STUDIO</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090B]/90 via-[#09090B]/30 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 p-6">
            <p className="text-xs text-[#E5C77A]">
              {activeProject
                ? `Active Workspace · ${activeProject.brief.title}`
                : 'No Active Film Project'}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-[#F7F5F0]">
              {activeProject
                ? activeProject.story?.logline || activeProject.brief.originalIdea
                : 'Create a new film or restore the sample project to begin production.'}
            </p>
          </div>
        </div>
      </section>

      {/* Active Project Overview Section */}
      <section aria-labelledby="project-overview-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-3">
          <div>
            <h2
              id="project-overview-heading"
              className="font-cinema text-2xl font-semibold text-[#F7F5F0] sm:text-3xl"
            >
              Active Project Overview
            </h2>
            <p className="text-sm text-[#A8A49B]">
              {activeProject ? (
                <>
                  <span className="font-medium text-[#E5C77A]">{activeProject.brief.title}</span>
                  <span className="mx-2" aria-hidden="true">
                    ·
                  </span>
                  <span>{activeProject.brief.genre}</span>
                  <span className="mx-2" aria-hidden="true">
                    ·
                  </span>
                  <span>{activeProject.brief.duration}</span>
                </>
              ) : (
                'No project currently selected — metrics stand at zero.'
              )}
            </p>
          </div>

          {activeProject && (
            <button
              type="button"
              onClick={() => onNavigate('production')}
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-[#E5C77A] transition-colors hover:text-[#F7F5F0]"
            >
              View Production Breakdown
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#222228] bg-[#111114] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A8A49B]">Total Scene Count</span>
              <FileText className="h-4 w-4 text-[#C8A24B]" />
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-[#F7F5F0]">
              {activeSceneCount}
            </p>
            <p className="mt-1 text-xs text-[#76726A]">
              {activeSceneCount === 0
                ? 'No screenplay scenes yet'
                : 'Written scenes in active script'}
            </p>
          </div>

          <div className="rounded-xl border border-[#222228] bg-[#111114] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A8A49B]">Number of Characters</span>
              <Users className="h-4 w-4 text-[#C8A24B]" />
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-[#F7F5F0]">
              {activeCharacterCount}
            </p>
            <p className="mt-1 text-xs text-[#76726A]">
              {activeCharacterCount === 0
                ? 'No character dossiers yet'
                : 'Cast profiles with ages & arcs'}
            </p>
          </div>

          <div className="rounded-xl border border-[#222228] bg-[#111114] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A8A49B]">Storyboard Shots</span>
              <Camera className="h-4 w-4 text-[#C8A24B]" />
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-[#F7F5F0]">
              {activeShotCount}
            </p>
            <p className="mt-1 text-xs text-[#76726A]">
              {activeShotCount === 0
                ? 'No shots planned yet'
                : 'Planned camera & lighting setups'}
            </p>
          </div>

          <div className="rounded-xl border border-[#C8A24B]/40 bg-[#151412] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#E5C77A]">
                Estimated Complexity Score
              </span>
              <Gauge className="h-4 w-4 text-[#C8A24B]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tabular-nums text-[#E5C77A]">
                {complexity.score}
              </span>
              <span className="font-mono text-sm tabular-nums text-[#A8A49B]">/ 10</span>
              <span className="ml-1 truncate text-xs font-medium text-[#F7F5F0]">
                · {complexity.label}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-[#A8A49B]">{complexity.detail}</p>
          </div>
        </div>
      </section>

      {/* Studio-Wide Project Statistics Section */}
      <section aria-labelledby="project-statistics-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-3">
          <div>
            <h2
              id="project-statistics-heading"
              className="font-cinema text-2xl font-semibold text-[#F7F5F0] sm:text-3xl"
            >
              Project Statistics
            </h2>
            <p className="text-sm text-[#A8A49B]">
              Live studio metrics computed directly from your saved projects and verified Gemini
              generations.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-[#A8A49B]">
            <Activity className="h-3.5 w-3.5 text-[#C8A24B]" />
            <span>Auto-synced with local studio storage</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {studioStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`flex flex-col justify-between rounded-xl border p-5 ${
                  stat.highlight
                    ? 'border-[#C8A24B]/45 bg-gradient-to-br from-[#171510] to-[#111114] sm:col-span-2 lg:col-span-2'
                    : 'border-[#222228] bg-[#111114]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-medium text-[#A8A49B]">{stat.label}</span>
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      stat.highlight ? 'text-[#E5C77A]' : 'text-[#C8A24B]'
                    }`}
                  />
                </div>

                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <span
                    className={`font-mono text-3xl font-semibold tabular-nums ${
                      stat.highlight ? 'text-[#E5C77A]' : 'text-[#F7F5F0]'
                    }`}
                  >
                    {stat.value}
                  </span>
                  <span className="text-xs text-[#76726A]">{stat.note}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* My Projects Section */}
      <section aria-labelledby="my-projects-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222228] pb-3">
          <div>
            <h2
              id="my-projects-heading"
              className="font-cinema text-2xl font-semibold text-[#F7F5F0] sm:text-3xl"
            >
              My Projects
            </h2>
            <p className="text-sm text-[#A8A49B]">
              Select a film slate to open across all studio departments, or start a fresh production.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetSampleProject}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#27272F] bg-[#111114] px-3 py-2 text-xs font-medium text-[#A8A49B] transition-colors hover:border-[#C8A24B]/50 hover:text-[#F7F5F0]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore Sample
            </button>
            <button
              type="button"
              onClick={onOpenNewFilm}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#C8A24B]/50 bg-[#C8A24B]/10 px-3.5 py-2 text-xs font-semibold text-[#E5C77A] transition-colors hover:bg-[#C8A24B]/20"
            >
              <Plus className="h-3.5 w-3.5" />
              New Film
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2D2D36] bg-[#111114]/60 p-10 text-center">
            <Film className="mx-auto h-8 w-8 text-[#C8A24B]/70" />
            <h3 className="mt-3 font-cinema text-2xl text-[#F7F5F0]">No Saved Projects</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-[#A8A49B]">
              Create a new film project to begin generating stories, screenplays, characters, and
              storyboards with Gemini, or restore the sample film.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenNewFilm}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8A24B] px-4 py-2.5 text-sm font-semibold text-[#09090B]"
              >
                <Plus className="h-4 w-4" />
                Create a New Film
              </button>
              <button
                type="button"
                onClick={onResetSampleProject}
                className="inline-flex items-center gap-2 rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2.5 text-sm font-medium text-[#F7F5F0]"
              >
                <RotateCcw className="h-4 w-4 text-[#C8A24B]" />
                Restore Sample
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {projects.map((proj) => {
              const isActive = activeProject?.id === proj.id;
              const totalShots = proj.storyboard.reduce((sum, s) => sum + s.shots.length, 0);

              return (
                <div
                  key={proj.id}
                  className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                    isActive
                      ? 'border-[#C8A24B] bg-[#151412]'
                      : 'border-[#222228] bg-[#111114] hover:border-[#3A3A44]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#A8A49B]">
                          {proj.isSample && (
                            <>
                              <span className="font-medium text-[#E5C77A]">
                                Sample Demonstration
                              </span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span>{proj.brief.genre}</span>
                          <span aria-hidden="true">·</span>
                          <span>{proj.brief.duration}</span>
                        </div>
                        <h3 className="mt-1 truncate font-cinema text-2xl font-semibold text-[#F7F5F0]">
                          {proj.brief.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteProject(proj.id)}
                        aria-label={`Delete ${proj.brief.title}`}
                        className="rounded-lg p-2 text-[#76726A] transition-colors hover:bg-red-950/50 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#A8A49B]">
                      {proj.story?.logline || proj.brief.originalIdea}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#76726A] tabular-nums">
                      <span>{proj.brief.language}</span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.screenplay.length} scenes</span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.characters.length} characters</span>
                      <span aria-hidden="true">·</span>
                      <span>{totalShots} shots</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#222228] pt-4">
                    <span className="truncate text-xs text-[#76726A]">
                      {isActive ? 'Currently Loaded in Studio' : `Setting: ${proj.brief.setting}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProject(proj.id);
                          onNavigate('workflow');
                        }}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#C8A24B] px-3 py-2 text-xs font-bold text-[#09090B] transition-colors hover:bg-[#D9B45D]"
                      >
                        <Clapperboard className="h-3.5 w-3.5" />
                        GENERATE MY FILM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProject(proj.id);
                          onNavigate('story');
                        }}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3 py-2 text-xs font-medium text-[#F7F5F0] transition-colors hover:bg-[#23232B]"
                      >
                        {isActive ? 'Open Studio' : 'Load Project'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Studio Departments Grid */}
      <section aria-labelledby="departments-heading" className="space-y-4">
        <div className="border-b border-[#222228] pb-3">
          <h2
            id="departments-heading"
            className="font-cinema text-2xl font-semibold text-[#F7F5F0] sm:text-3xl"
          >
            Production Departments
          </h2>
          <p className="text-sm text-[#A8A49B]">
            {activeProject ? (
              <>
                Navigate directly to any stage of your active project:{' '}
                <span className="font-medium text-[#F7F5F0]">{activeProject.brief.title}</span>.
              </>
            ) : (
              'Create or load a film project to enter the studio production departments.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {STUDIO_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  if (activeProject) {
                    onNavigate(mod.id);
                  } else {
                    onOpenNewFilm();
                  }
                }}
                className="group flex flex-col justify-between rounded-xl border border-[#222228] bg-[#111114] p-5 text-left transition-colors hover:border-[#C8A24B]/60 hover:bg-[#151519]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium tabular-nums text-[#C8A24B]">
                      {mod.number}.
                    </span>
                    <Icon className="h-4 w-4 text-[#76726A] transition-colors group-hover:text-[#C8A24B]" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#F7F5F0]">{mod.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#A8A49B]">
                    {mod.description}
                  </p>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#E5C77A]">
                  <span>{activeProject ? 'Enter Studio' : 'Create Film to Begin'}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
