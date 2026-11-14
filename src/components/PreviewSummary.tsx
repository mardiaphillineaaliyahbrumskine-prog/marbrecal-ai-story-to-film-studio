import {
  BookOpen,
  CheckCircle2,
  Clapperboard,
  Clock,
  FileText,
  Film,
  Image as ImageIcon,
  Layers,
  MinusCircle,
  Users,
} from 'lucide-react';
import {useMemo} from 'react';
import type {FilmProject} from '../types/film';

interface PreviewSummaryProps {
  project: FilmProject;
  dossierText: string;
}

interface DepartmentStatus {
  key: string;
  label: string;
  ready: boolean;
  detail: string;
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function formatUpdatedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function PreviewSummary({project, dossierText}: PreviewSummaryProps) {
  const metrics = useMemo(() => {
    const sceneCount = project.screenplay.length;
    const characterCount = project.characters.length;
    const storyboardSceneCount = project.storyboard.length;
    const totalShots = project.storyboard.reduce((sum, scene) => sum + scene.shots.length, 0);
    const renderedFrames = project.storyboard.reduce(
      (sum, scene) => sum + scene.shots.filter((shot) => Boolean(shot.previewImage)).length,
      0,
    );
    const totalDialogueLines = project.screenplay.reduce(
      (sum, scene) =>
        sum + scene.elements.filter((element) => element.type === 'dialogue').length,
      0,
    );
    const totalScriptElements = project.screenplay.reduce(
      (sum, scene) => sum + scene.elements.length,
      0,
    );
    const referenceImages = project.referenceImages ?? [];
    const referenceCount = referenceImages.length;
    const analyzedReferences = referenceImages.filter(
      (img) => img.analysisStatus === 'analyzed',
    ).length;
    const playableClips = (project.videoClips ?? []).filter(
      (clip) => clip.status === 'playable',
    ).length;

    const departments: DepartmentStatus[] = [
      {
        key: 'story',
        label: 'Story Blueprint',
        ready: Boolean(project.story),
        detail: project.story ? 'Synopsis & 3-act arc' : 'Not developed',
      },
      {
        key: 'screenplay',
        label: 'Screenplay',
        ready: sceneCount > 0,
        detail: sceneCount > 0 ? `${sceneCount} scene${sceneCount === 1 ? '' : 's'}` : '0 scenes',
      },
      {
        key: 'characters',
        label: 'Characters',
        ready: characterCount > 0,
        detail:
          characterCount > 0
            ? `${characterCount} profile${characterCount === 1 ? '' : 's'}`
            : '0 profiles',
      },
      {
        key: 'storyboard',
        label: 'Storyboard',
        ready: totalShots > 0,
        detail:
          totalShots > 0
            ? `${totalShots} shot${totalShots === 1 ? '' : 's'}`
            : '0 shots',
      },
      {
        key: 'production',
        label: 'Production Plan',
        ready: Boolean(project.production),
        detail: project.production
          ? `${project.production.estimatedShootDays || 'Planned'} · ${project.production.estimatedComplexity || 'Ready'}`
          : 'Not generated',
      },
    ];

    const readyDepartments = departments.filter((dept) => dept.ready).length;
    const readinessPercent = Math.round((readyDepartments / departments.length) * 100);

    const distributionTotal = sceneCount + characterCount + totalShots + referenceCount;
    const distributionItems = [
      {
        label: 'Scenes',
        count: sceneCount,
        colorClass: 'bg-[#C8A24B]',
        percent: distributionTotal > 0 ? Math.round((sceneCount / distributionTotal) * 100) : 0,
      },
      {
        label: 'Characters',
        count: characterCount,
        colorClass: 'bg-[#E5C77A]',
        percent:
          distributionTotal > 0 ? Math.round((characterCount / distributionTotal) * 100) : 0,
      },
      {
        label: 'Shots',
        count: totalShots,
        colorClass: 'bg-[#8F7334]',
        percent: distributionTotal > 0 ? Math.round((totalShots / distributionTotal) * 100) : 0,
      },
      {
        label: 'References',
        count: referenceCount,
        colorClass: 'bg-[#6F6B61]',
        percent:
          distributionTotal > 0 ? Math.round((referenceCount / distributionTotal) * 100) : 0,
      },
    ];

    const dossierBytes = new TextEncoder().encode(dossierText).length;
    const dossierLines = dossierText ? dossierText.split('\n').length : 0;

    return {
      sceneCount,
      characterCount,
      storyboardSceneCount,
      totalShots,
      renderedFrames,
      totalDialogueLines,
      totalScriptElements,
      referenceCount,
      analyzedReferences,
      playableClips,
      departments,
      readyDepartments,
      readinessPercent,
      distributionTotal,
      distributionItems,
      dossierBytes,
      dossierLines,
    };
  }, [project, dossierText]);

  const displayTitle = project.story?.suggestedTitle || project.brief.title || 'Untitled Project';
  const summaryCopy =
    project.story?.logline ||
    project.brief.originalIdea ||
    'No logline or story premise recorded yet.';

  return (
    <section
      aria-label="Export Preview Summary"
      className="rounded-xl border border-[#222228] bg-[#111114] p-5 sm:p-6"
    >
      {/* Top Snapshot Identity & Readiness Header */}
      <div className="flex flex-col gap-4 border-b border-[#222228] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A8A49B]">
            <span className="font-semibold tracking-wider text-[#C8A24B] uppercase">
              Preview Summary
            </span>
            <span className="text-[#3A3A44]">|</span>
            <span>{project.brief.genre}</span>
            <span className="text-[#3A3A44]">|</span>
            <span>{project.brief.language}</span>
            <span className="text-[#3A3A44]">|</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#C8A24B]" />
              {project.brief.duration}
            </span>
          </div>

          <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0] sm:text-3xl">
            {displayTitle}
          </h2>

          <p className="max-w-3xl text-sm leading-relaxed text-[#D5D1C8] line-clamp-2">
            {summaryCopy}
          </p>
        </div>

        {/* Package Readiness Meter */}
        <div className="w-full shrink-0 rounded-lg border border-[#222228] bg-[#09090B] p-4 lg:w-72">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#A8A49B]">Dossier Completeness</span>
            <span className="font-mono font-semibold tabular-nums text-[#E5C77A]">
              {metrics.readyDepartments}/5 departments ({metrics.readinessPercent}%)
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded bg-[#1B1B21]">
            <div
              className="h-full bg-[#C8A24B] transition-all duration-300"
              style={{width: `${metrics.readinessPercent}%`}}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#7D7A72]">
            <span>Updated {formatUpdatedDate(project.updatedAt)}</span>
            <span className="font-mono tabular-nums text-[#A8A49B]">
              {metrics.dossierLines} lines · {formatByteSize(metrics.dossierBytes)}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Project Snapshot Metrics */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4">
          <div className="flex items-center justify-between text-xs text-[#A8A49B]">
            <span>Screenplay Scenes</span>
            <Clapperboard className="h-4 w-4 text-[#C8A24B]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#F7F5F0]">
            {metrics.sceneCount}
          </p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-[#7D7A72]">
            {metrics.totalDialogueLines} dialogue · {metrics.totalScriptElements} script blocks
          </p>
        </div>

        <div className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4">
          <div className="flex items-center justify-between text-xs text-[#A8A49B]">
            <span>Total Characters</span>
            <Users className="h-4 w-4 text-[#C8A24B]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#F7F5F0]">
            {metrics.characterCount}
          </p>
          <p className="mt-1 truncate text-[11px] text-[#7D7A72]">
            {project.characters.length > 0
              ? project.characters
                  .slice(0, 3)
                  .map((c) => c.name)
                  .join(', ')
              : 'No character profiles yet'}
          </p>
        </div>

        <div className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4">
          <div className="flex items-center justify-between text-xs text-[#A8A49B]">
            <span>Storyboard Shots</span>
            <Film className="h-4 w-4 text-[#C8A24B]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#F7F5F0]">
            {metrics.totalShots}
          </p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-[#7D7A72]">
            {metrics.storyboardSceneCount} scene plan{metrics.storyboardSceneCount === 1 ? '' : 's'}
            {metrics.renderedFrames > 0 ? ` · ${metrics.renderedFrames} rendered` : ''}
          </p>
        </div>

        <div className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4">
          <div className="flex items-center justify-between text-xs text-[#A8A49B]">
            <span>Visual References</span>
            <ImageIcon className="h-4 w-4 text-[#C8A24B]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#F7F5F0]">
            {metrics.referenceCount}
          </p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-[#7D7A72]">
            {metrics.analyzedReferences} Gemini-analyzed
            {metrics.playableClips > 0 ? ` · ${metrics.playableClips} clip(s)` : ''}
          </p>
        </div>
      </div>

      {/* Department Checklist + Visual Composition Breakdown */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Included Departments Checklist */}
        <div className="rounded-lg border border-[#222228] bg-[#0D0D10] p-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#E5C77A] uppercase">
              <Layers className="h-3.5 w-3.5 text-[#C8A24B]" />
              Export Package Contents
            </h3>
            <span className="text-[11px] text-[#7D7A72]">Verified from active project</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {metrics.departments.map((dept) => (
              <div
                key={dept.key}
                className="flex items-center justify-between gap-2 rounded border border-[#1E1E24] bg-[#131317] px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {dept.ready ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#C8A24B]" />
                  ) : (
                    <MinusCircle className="h-3.5 w-3.5 shrink-0 text-[#55534D]" />
                  )}
                  <span
                    className={`truncate text-xs font-medium ${
                      dept.ready ? 'text-[#F7F5F0]' : 'text-[#7D7A72]'
                    }`}
                  >
                    {dept.label}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-[#A8A49B]">
                  {dept.detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Element Distribution + Production Footprint */}
        <div className="flex flex-col justify-between rounded-lg border border-[#222228] bg-[#0D0D10] p-4 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#E5C77A] uppercase">
                <BookOpen className="h-3.5 w-3.5 text-[#C8A24B]" />
                Asset Distribution
              </h3>
              <span className="font-mono text-[11px] tabular-nums text-[#A8A49B]">
                {metrics.distributionTotal} total items
              </span>
            </div>

            <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded bg-[#1B1B21]">
              {metrics.distributionTotal > 0 ? (
                metrics.distributionItems.map((item) =>
                  item.count > 0 ? (
                    <div
                      key={item.label}
                      title={`${item.label}: ${item.count}`}
                      className={`${item.colorClass} h-full transition-all duration-300`}
                      style={{width: `${Math.max(item.percent, 4)}%`}}
                    />
                  ) : null,
                )
              ) : (
                <div className="h-full w-full bg-[#1B1B21]" />
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {metrics.distributionItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-[#A8A49B]">
                    <span className={`inline-block h-2 w-2 rounded-xs ${item.colorClass}`} />
                    {item.label}
                  </span>
                  <span className="font-mono tabular-nums text-[#F7F5F0]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#1E1E24] pt-3 text-[11px] text-[#A8A49B]">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#C8A24B]" />
              Setting: <strong className="font-medium text-[#F7F5F0]">{project.brief.setting}</strong>
            </span>
            {project.production ? (
              <span className="font-mono tabular-nums text-[#E5C77A]">
                {project.production.locations.length} location
                {project.production.locations.length === 1 ? '' : 's'} ·{' '}
                {project.production.estimatedShootDays}
              </span>
            ) : (
              <span className="text-[#7D7A72]">Production plan pending</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
