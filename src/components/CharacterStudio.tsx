import {
  ArrowRight,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {useState} from 'react';
import type {
  CharacterProfile,
  FilmProject,
  ProjectReferenceImage,
  StudioSection,
} from '../types/film';
import {ReferenceUploaderStrip} from './ReferenceUploaderStrip';

interface CharacterStudioProps {
  project: FilmProject;
  isGenerating: boolean;
  onUpdateCharacters: (characters: CharacterProfile[]) => void;
  onGenerateCharacters: (customAgeSpecs?: string) => Promise<void>;
  onAddImages: (images: ProjectReferenceImage[]) => void;
  onUpdateImage: (id: string, patch: Partial<ProjectReferenceImage>) => void;
  onDeleteImage: (id: string) => void;
  onAnalyzeImage: (image: ProjectReferenceImage) => Promise<void>;
  onNavigate: (section: StudioSection) => void;
}

export function CharacterStudio({
  project,
  isGenerating,
  onUpdateCharacters,
  onGenerateCharacters,
  onAddImages,
  onUpdateImage,
  onDeleteImage,
  onAnalyzeImage,
  onNavigate,
}: CharacterStudioProps) {
  const [ageSpecInput, setAgeSpecInput] = useState(project.brief.characterAgesHint || '');
  const [editingId, setEditingId] = useState<string | null>(null);

  const characters = project.characters;

  const updateCharacter = (id: string, patch: Partial<CharacterProfile>) => {
    onUpdateCharacters(characters.map((c) => (c.id === id ? {...c, ...patch} : c)));
  };

  const handleAddCharacter = () => {
    const newChar: CharacterProfile = {
      id: `char-${Date.now()}`,
      name: 'New Character',
      age: '32',
      role: 'Supporting Role',
      personality: 'Describe temperament, instincts, and contradictions.',
      background: 'Key formative history before the film begins.',
      motivation: 'What this character urgently needs in the story.',
      relationships: 'Connections to other principal characters.',
      arc: 'How this character changes by the final scene.',
      visualAppearance: 'Physical build, posture, expression, and distinguishing traits.',
      costumeNotes: 'Fabrics, palette, silhouette, and signature accessories.',
    };
    onUpdateCharacters([...characters, newChar]);
    setEditingId(newChar.id);
  };

  const handleDeleteCharacter = (id: string) => {
    onUpdateCharacters(characters.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
            03. Character Development Studio
          </p>
          <h1 className="mt-1 font-cinema text-3xl font-semibold text-[#F7F5F0] sm:text-4xl">
            Cast Dossiers & Character Arcs
          </h1>
          <p className="mt-1 text-sm text-[#A8A49B]">
            Generate detailed character profiles honoring exact creator-specified ages, psychology,
            visual presence, and wardrobe direction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAddCharacter}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2.5 text-xs font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Character
          </button>

          {characters.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('production')}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2.5 text-xs font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60"
            >
              Production Planning
              <ArrowRight className="h-3.5 w-3.5 text-[#C8A24B]" />
            </button>
          )}
        </div>
      </div>

      {/* Character & Costume Visual Reference Uploader */}
      <ReferenceUploaderStrip
        title="Character & Costume Visual References"
        subtitle="Upload photographs for fictional character appearance, wardrobe, and styling inspiration (Gemini describes visible styling without identifying real people)."
        defaultCategory="Character Reference"
        images={project.referenceImages ?? []}
        onAddImages={onAddImages}
        onUpdateImage={onUpdateImage}
        onDeleteImage={onDeleteImage}
        onAnalyzeImage={onAnalyzeImage}
        onOpenGallery={() => onNavigate('gallery')}
      />

      {/* Age Specification & Generation Bar */}
      <section className="rounded-xl border border-[#222228] bg-[#111114] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-[#A8A49B]">
              Specify Character Ages & Names (Gemini will preserve these exact ages)
            </label>
            <input
              type="text"
              value={ageSpecInput}
              onChange={(e) => setAgeSpecInput(e.target.value)}
              placeholder="e.g. Kojo (58), Ama (24), Kwesi (43), Nana Efua (71)"
              className="w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F7F5F0] placeholder:text-[#5E5B55] focus:border-[#C8A24B] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void onGenerateCharacters(ageSpecInput || undefined)}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-5 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Building Cast...
              </>
            ) : characters.length > 0 ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate Cast
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Characters
              </>
            )}
          </button>
        </div>
      </section>

      {isGenerating && characters.length === 0 && (
        <div className="rounded-xl border border-[#222228] bg-[#111114] p-10 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#C8A24B]" />
          <p className="mt-3 text-sm font-medium text-[#F7F5F0]">
            Crafting character psychology, arcs, appearance, and wardrobe notes with Gemini...
          </p>
        </div>
      )}

      {!isGenerating && characters.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#2D2D36] bg-[#111114]/60 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-[#C8A24B]/70" />
          <h3 className="mt-3 font-cinema text-2xl text-[#F7F5F0]">No Character Profiles Yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#A8A49B]">
            Specify any exact ages above and click <strong>Generate Characters</strong> to create
            rich production dossiers for your cast.
          </p>
        </div>
      )}

      {characters.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {characters.map((char) => {
            const isEditing = editingId === char.id;
            return (
              <article
                key={char.id}
                className="flex flex-col justify-between rounded-xl border border-[#222228] bg-[#111114] p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-[#222228] pb-4">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <input
                            type="text"
                            value={char.name}
                            onChange={(e) => updateCharacter(char.id, {name: e.target.value})}
                            placeholder="Name"
                            className="rounded border border-[#27272F] bg-[#09090B] px-2.5 py-1.5 text-sm font-semibold text-[#F7F5F0]"
                          />
                          <input
                            type="text"
                            value={char.age}
                            onChange={(e) => updateCharacter(char.id, {age: e.target.value})}
                            placeholder="Age"
                            className="rounded border border-[#27272F] bg-[#09090B] px-2.5 py-1.5 font-mono text-sm text-[#E5C77A]"
                          />
                          <input
                            type="text"
                            value={char.role}
                            onChange={(e) => updateCharacter(char.id, {role: e.target.value})}
                            placeholder="Role"
                            className="rounded border border-[#27272F] bg-[#09090B] px-2.5 py-1.5 text-sm text-[#A8A49B]"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#C8A24B]">
                            <span className="font-mono tabular-nums">Age {char.age}</span>
                            <span aria-hidden="true">·</span>
                            <span>{char.role}</span>
                          </div>
                          <h2 className="mt-1 font-cinema text-2xl font-semibold text-[#F7F5F0]">
                            {char.name}
                          </h2>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : char.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#2D2D36] bg-[#18181D] px-2.5 py-1.5 text-xs text-[#F7F5F0] hover:border-[#C8A24B]/60"
                      >
                        {isEditing ? (
                          <>
                            <Save className="h-3.5 w-3.5 text-[#C8A24B]" />
                            Save
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCharacter(char.id)}
                        aria-label={`Delete ${char.name}`}
                        className="rounded-md p-1.5 text-[#76726A] hover:bg-red-950/50 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-3 text-sm">
                    {(
                      [
                        ['Personality', 'personality'],
                        ['Background', 'background'],
                        ['Motivation', 'motivation'],
                        ['Relationships', 'relationships'],
                        ['Character Development Arc', 'arc'],
                        ['Visual Appearance', 'visualAppearance'],
                        ['Costume & Styling Notes', 'costumeNotes'],
                      ] as const
                    ).map(([label, key]) => (
                      <div key={key}>
                        <dt className="text-xs font-medium text-[#A8A49B]">{label}</dt>
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={char[key]}
                            onChange={(e) => updateCharacter(char.id, {[key]: e.target.value})}
                            className="mt-1 w-full rounded-lg border border-[#27272F] bg-[#09090B] px-3 py-2 text-sm text-[#F7F5F0] focus:border-[#C8A24B] focus:outline-none"
                          />
                        ) : (
                          <dd className="mt-0.5 leading-relaxed text-[#E4E0D8]">{char[key]}</dd>
                        )}
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
