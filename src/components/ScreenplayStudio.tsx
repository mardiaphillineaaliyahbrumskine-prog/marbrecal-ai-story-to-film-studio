import {
  ArrowRight,
  Edit3,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {useState} from 'react';
import type {
  FilmProject,
  ScreenplayElement,
  ScreenplayElementType,
  ScreenplayScene,
  StudioSection,
} from '../types/film';

interface ScreenplayStudioProps {
  project: FilmProject;
  isGenerating: boolean;
  regeneratingSceneNumber: number | null;
  onUpdateScreenplay: (scenes: ScreenplayScene[]) => void;
  onGenerateFullScreenplay: (sceneCount: number, directorNote?: string) => Promise<void>;
  onRegenerateSingleScene: (sceneNumber: number, directorNote?: string) => Promise<void>;
  onNavigate: (section: StudioSection) => void;
}

export function ScreenplayStudio({
  project,
  isGenerating,
  regeneratingSceneNumber,
  onUpdateScreenplay,
  onGenerateFullScreenplay,
  onRegenerateSingleScene,
  onNavigate,
}: ScreenplayStudioProps) {
  const [sceneCount, setSceneCount] = useState(4);
  const [directorNote, setDirectorNote] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [scenePromptMap, setScenePromptMap] = useState<Record<number, string>>({});

  const scenes = project.screenplay;

  const handleAddBlankScene = () => {
    const nextNum = scenes.length > 0 ? Math.max(...scenes.map((s) => s.sceneNumber)) + 1 : 1;
    const newScene: ScreenplayScene = {
      id: `scene-custom-${Date.now()}`,
      sceneNumber: nextNum,
      intExt: 'EXT.',
      location: 'NEW LOCATION',
      timeOfDay: 'DAY',
      transition: 'CUT TO:',
      elements: [
        {
          id: `el-${Date.now()}-1`,
          type: 'action',
          text: 'Describe the visual action entering this scene.',
        },
      ],
    };
    onUpdateScreenplay([...scenes, newScene]);
    setEditingSceneId(newScene.id);
  };

  const handleDeleteScene = (id: string) => {
    const filtered = scenes
      .filter((s) => s.id !== id)
      .map((s, idx) => ({...s, sceneNumber: idx + 1}));
    onUpdateScreenplay(filtered);
    if (editingSceneId === id) setEditingSceneId(null);
  };

  const updateScene = (sceneId: string, updater: (scene: ScreenplayScene) => ScreenplayScene) => {
    onUpdateScreenplay(scenes.map((s) => (s.id === sceneId ? updater(s) : s)));
  };

  const addElementToScene = (sceneId: string, type: ScreenplayElementType) => {
    updateScene(sceneId, (scene) => ({
      ...scene,
      elements: [
        ...scene.elements,
        {
          id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type,
          text:
            type === 'character'
              ? 'CHARACTER NAME'
              : type === 'parenthetical'
                ? '(beat)'
                : type === 'transition'
                  ? 'CUT TO:'
                  : 'Enter text...',
        },
      ],
    }));
  };

  const updateElement = (sceneId: string, elId: string, patch: Partial<ScreenplayElement>) => {
    updateScene(sceneId, (scene) => ({
      ...scene,
      elements: scene.elements.map((el) => (el.id === elId ? {...el, ...patch} : el)),
    }));
  };

  const removeElement = (sceneId: string, elId: string) => {
    updateScene(sceneId, (scene) => ({
      ...scene,
      elements: scene.elements.filter((el) => el.id !== elId),
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
            02. Screenplay Studio
          </p>
          <h1 className="mt-1 font-cinema text-3xl font-semibold text-[#F7F5F0] sm:text-4xl">
            AI Screenplay Writer
          </h1>
          <p className="mt-1 text-sm text-[#A8A49B]">
            Industry-formatted scenes with sluglines, action, character cues, dialogue, and
            transitions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAddBlankScene}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2.5 text-xs font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Scene
          </button>

          {scenes.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('storyboard')}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2.5 text-xs font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60"
            >
              Storyboard Studio
              <ArrowRight className="h-3.5 w-3.5 text-[#C8A24B]" />
            </button>
          )}
        </div>
      </div>

      {/* Screenplay Generation Bar */}
      <section className="rounded-xl border border-[#222228] bg-[#111114] p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Scene Sequence
            </label>
            <select
              value={sceneCount}
              onChange={(e) => setSceneCount(Number(e.target.value))}
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2.5 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
            >
              <option value={3}>3 Key Scenes</option>
              <option value={4}>4 Key Scenes</option>
              <option value={5}>5 Key Scenes</option>
              <option value={6}>6 Key Scenes</option>
            </select>
          </div>

          <div className="lg:col-span-7">
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Screenwriter Guidance (Optional)
            </label>
            <input
              type="text"
              value={directorNote}
              onChange={(e) => setDirectorNote(e.target.value)}
              placeholder="e.g. Keep dialogue sparse and subtext-heavy; highlight coastal weather"
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] placeholder:text-[#5E5B55] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <div className="lg:col-span-3">
            <button
              type="button"
              onClick={() => void onGenerateFullScreenplay(sceneCount, directorNote || undefined)}
              disabled={isGenerating}
              className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-4 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-50"
            >
              {isGenerating && regeneratingSceneNumber === null ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Writing Script...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {scenes.length > 0 ? 'Regenerate Script' : 'Generate Screenplay'}
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Empty / Loading States */}
      {isGenerating && scenes.length === 0 && (
        <div className="rounded-xl border border-[#222228] bg-[#111114] p-10 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#C8A24B]" />
          <p className="mt-3 text-sm font-medium text-[#F7F5F0]">
            Converting your developed story into formatted screenplay scenes with Gemini...
          </p>
        </div>
      )}

      {!isGenerating && scenes.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#2D2D36] bg-[#111114]/60 p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-[#C8A24B]/70" />
          <h3 className="mt-3 font-cinema text-2xl text-[#F7F5F0]">No Screenplay Scenes Yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#A8A49B]">
            Click <strong>Generate Screenplay</strong> above to turn your story into structured
            INT./EXT. scenes, or add a blank scene manually.
          </p>
        </div>
      )}

      {/* Formatted Screenplay Pages */}
      {scenes.length > 0 && (
        <div className="space-y-6">
          {scenes.map((scene) => {
            const isEditing = editingSceneId === scene.id;
            const isRegeneratingThis = regeneratingSceneNumber === scene.sceneNumber;

            return (
              <article
                key={scene.id}
                className="overflow-hidden rounded-xl border border-[#222228] bg-[#111114]"
              >
                {/* Scene Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222228] bg-[#16161B] px-5 py-3">
                  <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                    <span className="font-semibold text-[#C8A24B]">
                      SCENE {String(scene.sceneNumber).padStart(2, '0')}
                    </span>
                    <span className="text-[#76726A]">/</span>
                    <span className="text-[#F7F5F0]">
                      {scene.intExt} {scene.location} — {scene.timeOfDay}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSceneId(isEditing ? null : scene.id)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[#2D2D36] bg-[#111114] px-3 py-1.5 text-xs font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60"
                    >
                      {isEditing ? (
                        <>
                          <Save className="h-3.5 w-3.5 text-[#C8A24B]" />
                          Done Editing
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit Scene
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void onRegenerateSingleScene(
                          scene.sceneNumber,
                          scenePromptMap[scene.sceneNumber],
                        )
                      }
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[#C8A24B]/40 bg-[#C8A24B]/10 px-3 py-1.5 text-xs font-medium text-[#E5C77A] transition-colors hover:bg-[#C8A24B]/20 disabled:opacity-50"
                    >
                      {isRegeneratingThis ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Rewriting...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Regenerate Scene
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteScene(scene.id)}
                      aria-label={`Delete scene ${scene.sceneNumber}`}
                      className="rounded-md p-1.5 text-[#76726A] transition-colors hover:bg-red-950/50 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Scene Rewrite Prompt Strip */}
                <div className="border-b border-[#222228] bg-[#0D0D10] px-5 py-2.5">
                  <input
                    type="text"
                    value={scenePromptMap[scene.sceneNumber] || ''}
                    onChange={(e) =>
                      setScenePromptMap((prev) => ({
                        ...prev,
                        [scene.sceneNumber]: e.target.value,
                      }))
                    }
                    placeholder={`Optional rewrite note for Scene ${scene.sceneNumber} (e.g. "Raise emotional tension between Kojo and Ama")`}
                    className="w-full bg-transparent text-xs text-[#D5D1C8] placeholder:text-[#5E5B55] focus:outline-none"
                  />
                </div>

                {isEditing ? (
                  /* Structured Scene Editor */
                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-xs text-[#A8A49B]">INT / EXT</label>
                        <select
                          value={scene.intExt}
                          onChange={(e) =>
                            updateScene(scene.id, (s) => ({
                              ...s,
                              intExt: e.target.value as ScreenplayScene['intExt'],
                            }))
                          }
                          className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2 font-mono text-xs text-[#F7F5F0]"
                        >
                          <option value="INT.">INT.</option>
                          <option value="EXT.">EXT.</option>
                          <option value="INT./EXT.">INT./EXT.</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-[#A8A49B]">Location</label>
                        <input
                          type="text"
                          value={scene.location}
                          onChange={(e) =>
                            updateScene(scene.id, (s) => ({
                              ...s,
                              location: e.target.value.toUpperCase(),
                            }))
                          }
                          className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2 font-mono text-xs text-[#F7F5F0]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-[#A8A49B]">Time of Day</label>
                        <input
                          type="text"
                          value={scene.timeOfDay}
                          onChange={(e) =>
                            updateScene(scene.id, (s) => ({
                              ...s,
                              timeOfDay: e.target.value.toUpperCase(),
                            }))
                          }
                          className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2 font-mono text-xs text-[#F7F5F0]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {scene.elements.map((el) => (
                        <div key={el.id} className="flex items-start gap-2">
                          <select
                            value={el.type}
                            onChange={(e) =>
                              updateElement(scene.id, el.id, {
                                type: e.target.value as ScreenplayElementType,
                              })
                            }
                            className="w-32 shrink-0 rounded-lg border border-[#27272F] bg-[#09090B] px-2.5 py-2 font-mono text-xs text-[#E5C77A]"
                          >
                            <option value="action">Action</option>
                            <option value="character">Character</option>
                            <option value="parenthetical">Parenthetical</option>
                            <option value="dialogue">Dialogue</option>
                            <option value="transition">Transition</option>
                          </select>
                          <textarea
                            rows={el.type === 'action' || el.type === 'dialogue' ? 2 : 1}
                            value={el.text}
                            onChange={(e) =>
                              updateElement(scene.id, el.id, {text: e.target.value})
                            }
                            className="flex-1 rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2 font-mono text-xs leading-relaxed text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeElement(scene.id, el.id)}
                            aria-label="Remove screenplay line"
                            className="rounded p-2 text-[#76726A] hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#222228] pt-3">
                      <div className="flex flex-wrap gap-2">
                        {(
                          ['action', 'character', 'parenthetical', 'dialogue', 'transition'] as const
                        ).map((elType) => (
                          <button
                            key={elType}
                            type="button"
                            onClick={() => addElementToScene(scene.id, elType)}
                            className="rounded-md border border-[#2D2D36] bg-[#18181D] px-2.5 py-1.5 text-xs capitalize text-[#F7F5F0] hover:border-[#C8A24B]/60"
                          >
                            + {elType}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#A8A49B]">End Transition:</span>
                        <input
                          type="text"
                          value={scene.transition || ''}
                          onChange={(e) =>
                            updateScene(scene.id, (s) => ({
                              ...s,
                              transition: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="CUT TO:"
                          className="w-32 rounded-md border border-[#27272F] bg-[#09090B] px-2.5 py-1 font-mono text-xs text-[#F7F5F0]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Authentic Industry Script Page View */
                  <div className="mx-auto max-w-3xl px-6 py-8 font-mono text-[13px] leading-relaxed text-[#E8E4DC] sm:px-12">
                    <div className="mb-5 flex items-baseline gap-4 font-semibold tracking-wide text-[#F7F5F0]">
                      <span className="tabular-nums text-[#C8A24B]">{scene.sceneNumber}</span>
                      <span>
                        {scene.intExt} {scene.location} - {scene.timeOfDay}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {scene.elements.map((el) => {
                        if (el.type === 'action') {
                          return (
                            <p key={el.id} className="text-[#D8D3C9]">
                              {el.text}
                            </p>
                          );
                        }
                        if (el.type === 'character') {
                          return (
                            <p
                              key={el.id}
                              className="pt-2 pl-24 font-semibold tracking-wider text-[#F7F5F0] uppercase sm:pl-44"
                            >
                              {el.text}
                            </p>
                          );
                        }
                        if (el.type === 'parenthetical') {
                          return (
                            <p key={el.id} className="pl-16 text-[#A8A49B] sm:pl-36">
                              ({el.text.replace(/^\(|\)$/g, '')})
                            </p>
                          );
                        }
                        if (el.type === 'dialogue') {
                          return (
                            <p key={el.id} className="max-w-lg pl-8 text-[#F7F5F0] sm:pl-24">
                              {el.text}
                            </p>
                          );
                        }
                        return (
                          <p
                            key={el.id}
                            className="pt-2 text-right font-semibold tracking-wider text-[#E5C77A] uppercase"
                          >
                            {el.text}
                          </p>
                        );
                      })}
                    </div>

                    {scene.transition && (
                      <p className="mt-6 text-right font-semibold tracking-wider text-[#E5C77A] uppercase">
                        {scene.transition}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
