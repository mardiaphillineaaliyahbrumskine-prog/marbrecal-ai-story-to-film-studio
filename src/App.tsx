import {
  BookOpen,
  Camera,
  Clapperboard,
  ClipboardList,
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  Plus,
  Users,
  X,
} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {CharacterStudio} from './components/CharacterStudio';
import {DashboardView} from './components/DashboardView';
import {ExportStudio} from './components/ExportStudio';
import {FilmWorkflowStudio} from './components/FilmWorkflowStudio';
import {NewFilmModal} from './components/NewFilmModal';
import {ProductionStudio} from './components/ProductionStudio';
import {ScreenplayStudio} from './components/ScreenplayStudio';
import {StoryboardStudio} from './components/StoryboardStudio';
import {StoryStudio} from './components/StoryStudio';
import {StudioAlert} from './components/StudioAlert';
import {VisualGalleryStudio} from './components/VisualGalleryStudio';
import {SAMPLE_PROJECT_LAST_PROMISE} from './data/sampleProject';
import {
  analyzeReferenceImage,
  generateCharacterProfiles,
  generateProductionBreakdown,
  generateScreenplayScenes,
  generateStoryboardPlan,
  generateStoryFromBrief,
} from './services/studioApi';
import type {
  CharacterProfile,
  DevelopedStory,
  FilmProject,
  ProjectReferenceImage,
  SceneVideoClip,
  ScreenplayScene,
  StoryBrief,
  StoryboardScenePlan,
  StudioSection,
} from './types/film';

import {
  appendProjectToCollection,
  deleteProjectFromCollection,
  loadActiveProjectId,
  loadInitialProjectsCollection,
  persistProjectsToLocalStorage,
  readProjectsFromLocalStorage,
  rehydrateProjectImagesFromIndexedDb,
  saveActiveProjectId,
  STORAGE_PROJECTS_KEY,
  updateProjectInCollection,
} from './utils/projectStorage';

const NAV_ITEMS: Array<{
  id: StudioSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  {id: 'dashboard', label: 'Studio Hub', icon: LayoutDashboard},
  {id: 'workflow', label: 'Generate My Film', icon: Clapperboard},
  {id: 'story', label: 'Story Development', icon: BookOpen},
  {id: 'screenplay', label: 'Screenplay Studio', icon: FileText},
  {id: 'characters', label: 'Character Studio', icon: Users},
  {id: 'storyboard', label: 'Scene & Storyboard', icon: Camera},
  {id: 'production', label: 'Production Planning', icon: ClipboardList},
  {id: 'gallery', label: 'Visual Gallery', icon: ImageIcon},
  {id: 'export', label: 'Export Project', icon: Download},
];

export default function App() {
  const [projects, setProjects] = useState<FilmProject[]>(() => loadInitialProjectsCollection());
  const [activeProjectId, setActiveProjectId] = useState<string>(() =>
    loadActiveProjectId(loadInitialProjectsCollection()),
  );
  const [activeSection, setActiveSection] = useState<StudioSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newFilmModalOpen, setNewFilmModalOpen] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingSceneNum, setRegeneratingSceneNum] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{type: 'error' | 'success'; message: string} | null>(
    null,
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0] || null,
    [projects, activeProjectId],
  );

  const projectsRef = useRef<FilmProject[]>(projects);
  projectsRef.current = projects;

  const activeProjectIdRef = useRef<string>(activeProject?.id ?? '');
  activeProjectIdRef.current = activeProject?.id ?? '';

  const getActiveProjectLatest = (): FilmProject | null => {
    const list = projectsRef.current;
    return list.find((p) => p.id === activeProjectIdRef.current) || list[0] || null;
  };

  const selectProject = (projectId: string) => {
    activeProjectIdRef.current = projectId;
    setActiveProjectId(projectId);
    saveActiveProjectId(projectId);
  };

  useEffect(() => {
    saveActiveProjectId(activeProject?.id ?? '');
  }, [activeProject?.id]);

  useEffect(() => {
    let active = true;
    void rehydrateProjectImagesFromIndexedDb(projectsRef.current).then((rehydrated) => {
      if (active && rehydrated) {
        projectsRef.current = rehydrated;
        setProjects(rehydrated);
      }
    });

    const handleStorageSync = (event: StorageEvent) => {
      if (event.key !== STORAGE_PROJECTS_KEY) return;
      const {found, projects: synced} = readProjectsFromLocalStorage();
      if (found) {
        projectsRef.current = synced;
        setProjects(synced);
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => {
      active = false;
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  const updateProjectById = (
    projectId: string,
    updater: (project: FilmProject) => FilmProject,
  ) => {
    const {nextProjects, saveResult} = updateProjectInCollection(
      projectsRef.current,
      projectId,
      updater,
    );
    projectsRef.current = nextProjects;
    setProjects(nextProjects);
    if (!saveResult.saved && saveResult.error) {
      setFeedback({type: 'error', message: saveResult.error});
    }
  };

  const updateActiveProject = (updater: (project: FilmProject) => FilmProject) => {
    const current = getActiveProjectLatest();
    if (!current) return;
    updateProjectById(current.id, updater);
  };

  const navigateTo = (section: StudioSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleCreateProject = async (
    brief: StoryBrief,
    autoGenerateStory: boolean,
    referenceImages: ProjectReferenceImage[] = [],
  ) => {
    const nowIso = new Date().toISOString();
    const draftProj: FilmProject = {
      id: '',
      isSample: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      geminiGenerations: 0,
      brief,
      story: null,
      screenplay: [],
      characters: [],
      storyboard: [],
      production: null,
      referenceImages,
    };

    if (!autoGenerateStory) {
      const {nextProjects, createdProject, saveResult} = appendProjectToCollection(
        projectsRef.current,
        draftProj,
      );
      projectsRef.current = nextProjects;
      setProjects(nextProjects);
      selectProject(createdProject.id);
      setNewFilmModalOpen(false);
      setActiveSection('story');
      setFeedback(
        saveResult.saved
          ? {
              type: 'success',
              message: `Created project "${brief.title}" (${nextProjects.length} saved in My Projects).`,
            }
          : {
              type: 'error',
              message: saveResult.error || 'Created project in session, but browser storage failed.',
            },
      );
      return;
    }

    setIsGenerating(true);
    setFeedback(null);
    try {
      const story = await generateStoryFromBrief(brief, undefined, referenceImages);
      const completedProj: FilmProject = {
        ...draftProj,
        geminiGenerations: 1,
        story,
        updatedAt: new Date().toISOString(),
      };
      const {nextProjects, createdProject, saveResult} = appendProjectToCollection(
        projectsRef.current,
        completedProj,
      );
      projectsRef.current = nextProjects;
      setProjects(nextProjects);
      selectProject(createdProject.id);
      setNewFilmModalOpen(false);
      setActiveSection('story');
      setFeedback(
        saveResult.saved
          ? {
              type: 'success',
              message: `Story blueprint generated with Gemini for "${brief.title}".`,
            }
          : {
              type: 'error',
              message: saveResult.error || 'Story generated, but browser storage is full.',
            },
      );
    } catch (err) {
      const {nextProjects, createdProject} = appendProjectToCollection(
        projectsRef.current,
        draftProj,
      );
      projectsRef.current = nextProjects;
      setProjects(nextProjects);
      selectProject(createdProject.id);
      setNewFilmModalOpen(false);
      setActiveSection('story');
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to generate story with Gemini. Your project draft was saved.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const {nextProjects, saveResult} = deleteProjectFromCollection(
      projectsRef.current,
      projectId,
    );
    projectsRef.current = nextProjects;
    setProjects(nextProjects);

    if (!saveResult.saved && saveResult.error) {
      setFeedback({type: 'error', message: saveResult.error});
      return;
    }

    if (nextProjects.length === 0) {
      selectProject('');
      setActiveSection('dashboard');
      setFeedback({type: 'success', message: 'All projects cleared from local studio workspace.'});
      return;
    }

    if (activeProjectIdRef.current === projectId) {
      selectProject(nextProjects[0].id);
    }
    setFeedback({type: 'success', message: 'Selected project removed. Other projects remain saved.'});
  };

  const handleResetSampleProject = () => {
    const others = projectsRef.current.filter((p) => p.id !== SAMPLE_PROJECT_LAST_PROMISE.id);
    const next = [SAMPLE_PROJECT_LAST_PROMISE, ...others];
    projectsRef.current = next;
    setProjects(next);
    persistProjectsToLocalStorage(next);
    selectProject(SAMPLE_PROJECT_LAST_PROMISE.id);
    setFeedback({
      type: 'success',
      message: 'Restored flagship sample project "THE LAST PROMISE".',
    });
  };

  const handleAddReferenceImages = (newImages: ProjectReferenceImage[]) => {
    if (!activeProject) return;
    updateActiveProject((p) => ({
      ...p,
      referenceImages: [...(p.referenceImages ?? []), ...newImages],
    }));
    setFeedback({
      type: 'success',
      message: `Added ${newImages.length} reference image${newImages.length === 1 ? '' : 's'} to "${activeProject.brief.title}".`,
    });
  };

  const handleUpdateReferenceImage = (id: string, patch: Partial<ProjectReferenceImage>) => {
    updateActiveProject((p) => ({
      ...p,
      referenceImages: (p.referenceImages ?? []).map((img) =>
        img.id === id ? {...img, ...patch} : img,
      ),
    }));
  };

  const handleDeleteReferenceImage = (id: string) => {
    updateActiveProject((p) => ({
      ...p,
      referenceImages: (p.referenceImages ?? []).filter((img) => img.id !== id),
    }));
  };

  const handleAnalyzeReferenceImage = async (image: ProjectReferenceImage) => {
    if (!activeProject) return;
    handleUpdateReferenceImage(image.id, {
      analysisStatus: 'analyzing',
      analysisError: undefined,
    });
    setFeedback(null);
    try {
      const analysis = await analyzeReferenceImage({
        image,
        filmContext: `${activeProject.brief.title} (${activeProject.brief.genre}, ${activeProject.brief.setting}): ${activeProject.brief.originalIdea}`,
      });
      updateActiveProject((p) => ({
        ...p,
        geminiGenerations: (p.geminiGenerations ?? 0) + 1,
        referenceImages: (p.referenceImages ?? []).map((item) =>
          item.id === image.id
            ? {
                ...item,
                analysisStatus: 'analyzed',
                analysisError: undefined,
                aiAnalysis: analysis,
              }
            : item,
        ),
      }));
      setFeedback({
        type: 'success',
        message: `Gemini analyzed "${image.name}" (${image.category}).`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gemini visual analysis failed.';
      handleUpdateReferenceImage(image.id, {
        analysisStatus: 'error',
        analysisError: msg,
      });
      setFeedback({type: 'error', message: msg});
    }
  };

  const handleGenerateStory = async (refinementNote?: string): Promise<boolean> => {
    const current = getActiveProjectLatest();
    if (!current) return false;
    setIsGenerating(true);
    setFeedback(null);
    try {
      const story = await generateStoryFromBrief(
        current.brief,
        refinementNote,
        current.referenceImages,
      );
      updateProjectById(current.id, (p) => ({
        ...p,
        story,
        geminiGenerations: (p.geminiGenerations ?? 0) + 1,
      }));
      setFeedback({
        type: 'success',
        message: `Story development updated by Gemini for "${current.brief.title}".`,
      });
      return true;
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Story generation failed.',
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFullScreenplay = async (
    sceneCount: number,
    directorNote?: string,
  ): Promise<boolean> => {
    const current = getActiveProjectLatest();
    if (!current) return false;
    const storyContext: DevelopedStory = current.story || {
      logline: current.brief.originalIdea,
      synopsis: current.brief.originalIdea,
      beginning: '',
      middle: '',
      ending: '',
      mainCharactersSummary: current.brief.characterAgesHint || '',
      centralConflict: '',
      themes: '',
      emotionalImpact: '',
    };

    setIsGenerating(true);
    setRegeneratingSceneNum(null);
    setFeedback(null);
    try {
      const scenes = await generateScreenplayScenes({
        brief: current.brief,
        story: storyContext,
        characters: current.characters,
        existingSceneCount: sceneCount,
        directorNote,
        referenceImages: current.referenceImages,
      });
      updateProjectById(current.id, (p) => ({
        ...p,
        screenplay: scenes,
        geminiGenerations: (p.geminiGenerations ?? 0) + 1,
      }));
      setFeedback({
        type: 'success',
        message: `Generated ${scenes.length} formatted screenplay scenes with Gemini.`,
      });
      return true;
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Screenplay generation failed.',
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSingleScene = async (sceneNumber: number, directorNote?: string) => {
    const current = getActiveProjectLatest();
    if (!current) return;
    const storyContext: DevelopedStory = current.story || {
      logline: current.brief.originalIdea,
      synopsis: current.brief.originalIdea,
      beginning: '',
      middle: '',
      ending: '',
      mainCharactersSummary: current.brief.characterAgesHint || '',
      centralConflict: '',
      themes: '',
      emotionalImpact: '',
    };

    setIsGenerating(true);
    setRegeneratingSceneNum(sceneNumber);
    setFeedback(null);
    try {
      const scenes = await generateScreenplayScenes({
        brief: current.brief,
        story: storyContext,
        characters: current.characters,
        targetSceneNumber: sceneNumber,
        directorNote,
        referenceImages: current.referenceImages,
      });
      if (scenes.length > 0) {
        const replacement = scenes[0];
        updateProjectById(current.id, (p) => ({
          ...p,
          geminiGenerations: (p.geminiGenerations ?? 0) + 1,
          screenplay: p.screenplay.map((s) =>
            s.sceneNumber === sceneNumber ? replacement : s,
          ),
        }));
        setFeedback({
          type: 'success',
          message: `Regenerated Scene ${sceneNumber} with Gemini.`,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : `Failed to regenerate Scene ${sceneNumber}.`,
      });
    } finally {
      setIsGenerating(false);
      setRegeneratingSceneNum(null);
    }
  };

  const handleGenerateCharacters = async (customAgeSpecs?: string): Promise<boolean> => {
    const current = getActiveProjectLatest();
    if (!current) return false;
    const storyContext: DevelopedStory = current.story || {
      logline: current.brief.originalIdea,
      synopsis: current.brief.originalIdea,
      beginning: '',
      middle: '',
      ending: '',
      mainCharactersSummary: customAgeSpecs || current.brief.characterAgesHint || '',
      centralConflict: '',
      themes: '',
      emotionalImpact: '',
    };

    setIsGenerating(true);
    setFeedback(null);
    try {
      const characters = await generateCharacterProfiles({
        brief: current.brief,
        story: storyContext,
        customAgeSpecs,
        referenceImages: current.referenceImages,
      });
      updateProjectById(current.id, (p) => ({
        ...p,
        brief: customAgeSpecs ? {...p.brief, characterAgesHint: customAgeSpecs} : p.brief,
        characters,
        geminiGenerations: (p.geminiGenerations ?? 0) + 1,
      }));
      setFeedback({
        type: 'success',
        message: `Generated ${characters.length} detailed character profiles with Gemini.`,
      });
      return true;
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Character generation failed.',
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateStoryboard = async (targetSceneNumber?: number): Promise<boolean> => {
    const current = getActiveProjectLatest();
    if (!current) return false;
    setIsGenerating(true);
    setRegeneratingSceneNum(targetSceneNumber ?? null);
    setFeedback(null);
    try {
      const generatedPlans = await generateStoryboardPlan({
        brief: current.brief,
        scenes: current.screenplay,
        targetSceneNumber,
        referenceImages: current.referenceImages,
      });

      if (typeof targetSceneNumber === 'number' && generatedPlans.length > 0) {
        const updatedScenePlan = generatedPlans[0];
        updateProjectById(current.id, (p) => {
          const exists = p.storyboard.some((sb) => sb.sceneNumber === targetSceneNumber);
          return {
            ...p,
            geminiGenerations: (p.geminiGenerations ?? 0) + 1,
            storyboard: exists
              ? p.storyboard.map((sb) =>
                  sb.sceneNumber === targetSceneNumber ? updatedScenePlan : sb,
                )
              : [...p.storyboard, updatedScenePlan].sort(
                  (a, b) => a.sceneNumber - b.sceneNumber,
                ),
          };
        });
        setFeedback({
          type: 'success',
          message: `Updated storyboard shots for Scene ${targetSceneNumber} with Gemini.`,
        });
      } else {
        updateProjectById(current.id, (p) => ({
          ...p,
          storyboard: generatedPlans,
          geminiGenerations: (p.geminiGenerations ?? 0) + 1,
        }));
        setFeedback({
          type: 'success',
          message: `Generated storyboard plans across ${generatedPlans.length} scenes with Gemini.`,
        });
      }
      return true;
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Storyboard generation failed.',
      });
      return false;
    } finally {
      setIsGenerating(false);
      setRegeneratingSceneNum(null);
    }
  };

  const handleGenerateProduction = async (): Promise<boolean> => {
    const current = getActiveProjectLatest();
    if (!current) return false;
    const storyContext: DevelopedStory = current.story || {
      logline: current.brief.originalIdea,
      synopsis: current.brief.originalIdea,
      beginning: '',
      middle: '',
      ending: '',
      mainCharactersSummary: '',
      centralConflict: '',
      themes: '',
      emotionalImpact: '',
    };

    setIsGenerating(true);
    setFeedback(null);
    try {
      const production = await generateProductionBreakdown({
        brief: current.brief,
        story: storyContext,
        scenes: current.screenplay,
        characters: current.characters,
      });
      updateProjectById(current.id, (p) => ({
        ...p,
        production,
        geminiGenerations: (p.geminiGenerations ?? 0) + 1,
      }));
      setFeedback({
        type: 'success',
        message: 'Generated full production planning breakdown with Gemini.',
      });
      return true;
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Production breakdown generation failed.',
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const activeNavLabel = NAV_ITEMS.find((n) => n.id === activeSection)?.label || 'Studio Hub';

  return (
    <div className="flex min-h-screen bg-[#09090B] text-[#F7F5F0]">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/75 lg:hidden"
        />
      )}

      {/* Left Studio Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-[#222228] bg-[#0D0D10] transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Identity */}
          <div className="flex items-center justify-between border-b border-[#222228] px-5 py-5">
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="text-left focus:outline-none"
            >
              <span className="block text-[11px] font-medium tracking-widest text-[#C8A24B] uppercase">
                MARDIA STUDIO
              </span>
              <span className="mt-0.5 block font-cinema text-2xl font-semibold tracking-tight text-[#F7F5F0]">
                MARBRECAL AI
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="rounded-lg p-1.5 text-[#A8A49B] hover:bg-[#18181D] hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Active Project Selector */}
          <div className="border-b border-[#222228] px-4 py-4">
            <label
              htmlFor="sidebar-project-select"
              className="mb-1.5 block text-[11px] font-medium text-[#76726A]"
            >
              Active Film Project
            </label>
            <select
              id="sidebar-project-select"
              value={activeProject?.id ?? ''}
              disabled={projects.length === 0}
              onChange={(e) => selectProject(e.target.value)}
              className="w-full truncate rounded-lg border border-[#27272F] bg-[#141418] px-3 py-2 text-xs font-medium text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none disabled:opacity-50"
            >
              {projects.length === 0 ? (
                <option value="">No projects created</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brief.title} {p.isSample ? '(Sample)' : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Department Links */}
          <nav aria-label="Studio departments" className="space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isDisabled = item.id !== 'dashboard' && !activeProject;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => navigateTo(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 ${
                    isActive
                      ? 'bg-[#C8A24B]/15 text-[#E5C77A]'
                      : 'text-[#A8A49B] hover:bg-[#16161B] hover:text-[#F7F5F0]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-[#C8A24B]' : 'text-[#76726A]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Studio Footer */}
        <div className="border-t border-[#222228] px-5 py-4">
          <p className="font-cinema text-sm italic text-[#E5C77A]">
            “Your Story. Your Vision. Your Film.”
          </p>
          <p className="mt-1 text-[11px] text-[#76726A]">MARDIA STUDIO · November 2026</p>
        </div>
      </aside>

      {/* Main Studio Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar Contract (3 zones) */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-6 border-b border-[#222228] bg-[#09090B]/95 px-4 py-3.5 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open studio navigation"
              className="rounded-lg border border-[#27272F] bg-[#141418] p-2 text-[#F7F5F0] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-xs sm:text-sm">
              <span className="hidden font-medium text-[#76726A] sm:inline whitespace-nowrap">
                MARBRECAL AI
              </span>
              <span className="hidden text-[#44444E] sm:inline" aria-hidden="true">
                /
              </span>
              <span className="truncate font-medium text-[#E5C77A] max-w-[110px] sm:max-w-[220px]">
                {activeProject ? activeProject.brief.title : 'No Project Selected'}
              </span>
              <span className="hidden text-[#44444E] sm:inline" aria-hidden="true">
                /
              </span>
              <span className="hidden truncate text-[#F7F5F0] whitespace-nowrap sm:inline">
                {activeNavLabel}
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-5 text-xs font-medium text-[#A8A49B]">
            <button
              type="button"
              onClick={() => navigateTo('story')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#F7F5F0]"
            >
              Story
            </button>
            <button
              type="button"
              onClick={() => navigateTo('screenplay')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#F7F5F0]"
            >
              Screenplay
            </button>
            <button
              type="button"
              onClick={() => navigateTo('characters')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#F7F5F0]"
            >
              Characters
            </button>
            <button
              type="button"
              onClick={() => navigateTo('storyboard')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#F7F5F0]"
            >
              Storyboard
            </button>
            <button
              type="button"
              onClick={() => navigateTo('production')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#F7F5F0]"
            >
              Production
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeProject && (
              <button
                type="button"
                onClick={() => navigateTo('workflow')}
                className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-gradient-to-r from-[#C8A24B] via-[#E5C77A] to-[#C8A24B] px-3 py-2 text-xs font-bold tracking-wide text-[#09090B] transition-all hover:brightness-110"
              >
                <Clapperboard className="h-3.5 w-3.5" />
                GENERATE MY FILM
              </button>
            )}

            <button
              type="button"
              onClick={() => setNewFilmModalOpen(true)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-[#C8A24B]/50 bg-[#171510] px-3 py-2 text-xs font-semibold text-[#E5C77A] transition-colors hover:bg-[#C8A24B]/15"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create a New Film</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {feedback && (
            <div className="no-print mb-6">
              <StudioAlert
                type={feedback.type}
                message={feedback.message}
                onDismiss={() => setFeedback(null)}
              />
            </div>
          )}

          {(activeSection === 'dashboard' || !activeProject) && (
            <DashboardView
              projects={projects}
              activeProject={activeProject}
              onSelectProject={selectProject}
              onNavigate={navigateTo}
              onOpenNewFilm={() => setNewFilmModalOpen(true)}
              onDeleteProject={handleDeleteProject}
              onResetSampleProject={handleResetSampleProject}
            />
          )}

          {activeSection === 'workflow' && activeProject && (
            <FilmWorkflowStudio
              project={activeProject}
              isGenerating={isGenerating}
              onUpdateBrief={(brief: StoryBrief) =>
                updateActiveProject((p) => ({...p, brief}))
              }
              onRunStoryStep={() => handleGenerateStory()}
              onRunScreenplayStep={() => {
                const latest = getActiveProjectLatest();
                const targetCount = latest?.screenplay.length ? latest.screenplay.length : 4;
                return handleGenerateFullScreenplay(targetCount);
              }}
              onRunCharactersStep={() => handleGenerateCharacters()}
              onRunScenesAndStoryboardStep={() => handleGenerateStoryboard()}
              onRunProductionStep={() => handleGenerateProduction()}
              onUpdateVideoClips={(videoClips: SceneVideoClip[]) =>
                updateActiveProject((p) => ({...p, videoClips}))
              }
              onAddImages={handleAddReferenceImages}
              onUpdateImage={handleUpdateReferenceImage}
              onDeleteImage={handleDeleteReferenceImage}
              onAnalyzeImage={handleAnalyzeReferenceImage}
              onNavigate={navigateTo}
            />
          )}

          {activeSection === 'story' && activeProject && (
            <StoryStudio
              project={activeProject}
              isGenerating={isGenerating}
              onUpdateBrief={(brief: StoryBrief) =>
                updateActiveProject((p) => ({...p, brief}))
              }
              onUpdateStory={(story: DevelopedStory) =>
                updateActiveProject((p) => ({...p, story}))
              }
              onGenerateStory={async (note) => {
                await handleGenerateStory(note);
              }}
              onAddImages={handleAddReferenceImages}
              onUpdateImage={handleUpdateReferenceImage}
              onDeleteImage={handleDeleteReferenceImage}
              onAnalyzeImage={handleAnalyzeReferenceImage}
              onNavigate={navigateTo}
            />
          )}

          {activeSection === 'screenplay' && activeProject && (
            <ScreenplayStudio
              project={activeProject}
              isGenerating={isGenerating}
              regeneratingSceneNumber={regeneratingSceneNum}
              onUpdateScreenplay={(screenplay: ScreenplayScene[]) =>
                updateActiveProject((p) => ({...p, screenplay}))
              }
              onGenerateFullScreenplay={async (sceneCount, note) => {
                await handleGenerateFullScreenplay(sceneCount, note);
              }}
              onRegenerateSingleScene={handleRegenerateSingleScene}
              onNavigate={navigateTo}
            />
          )}

          {activeSection === 'characters' && activeProject && (
            <CharacterStudio
              project={activeProject}
              isGenerating={isGenerating}
              onUpdateCharacters={(characters: CharacterProfile[]) =>
                updateActiveProject((p) => ({...p, characters}))
              }
              onGenerateCharacters={async (customAges) => {
                await handleGenerateCharacters(customAges);
              }}
              onAddImages={handleAddReferenceImages}
              onUpdateImage={handleUpdateReferenceImage}
              onDeleteImage={handleDeleteReferenceImage}
              onAnalyzeImage={handleAnalyzeReferenceImage}
              onNavigate={navigateTo}
            />
          )}

          {activeSection === 'storyboard' && activeProject && (
            <StoryboardStudio
              project={activeProject}
              isGenerating={isGenerating}
              regeneratingSceneNumber={regeneratingSceneNum}
              onUpdateStoryboard={(storyboard: StoryboardScenePlan[]) =>
                updateActiveProject((p) => ({...p, storyboard}))
              }
              onGenerateStoryboard={async (sceneNum) => {
                await handleGenerateStoryboard(sceneNum);
              }}
              onAddImages={handleAddReferenceImages}
              onUpdateImage={handleUpdateReferenceImage}
              onDeleteImage={handleDeleteReferenceImage}
              onAnalyzeImage={handleAnalyzeReferenceImage}
              onNavigate={navigateTo}
            />
          )}

          {activeSection === 'production' && activeProject && (
            <ProductionStudio
              project={activeProject}
              isGenerating={isGenerating}
              onGenerateProduction={async () => {
                await handleGenerateProduction();
              }}
              onNavigate={navigateTo}
            />
          )}

          {activeSection === 'gallery' && activeProject && (
            <VisualGalleryStudio
              project={activeProject}
              onAddImages={handleAddReferenceImages}
              onUpdateImage={handleUpdateReferenceImage}
              onDeleteImage={handleDeleteReferenceImage}
              onAnalyzeImage={handleAnalyzeReferenceImage}
            />
          )}

          {activeSection === 'export' && activeProject && (
            <ExportStudio project={activeProject} />
          )}
        </main>

        {/* Required Credits Footer */}
        <footer className="no-print border-t border-[#222228] px-4 py-5 text-center sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-[#76726A] sm:flex-row">
            <span className="inline-flex items-center gap-2 font-medium text-[#A8A49B]">
              <Film className="h-3.5 w-3.5 text-[#C8A24B]" />
              MARBRECAL AI – An AI Filmmaking Studio by MARDIA STUDIO.
            </span>
            <span>Your Story. Your Vision. Your Film.</span>
          </div>
        </footer>
      </div>

      <NewFilmModal
        isOpen={newFilmModalOpen}
        isGenerating={isGenerating}
        onClose={() => setNewFilmModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
