import {
  ArrowRight,
  ClipboardList,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type {FilmProject, StudioSection} from '../types/film';

interface ProductionStudioProps {
  project: FilmProject;
  isGenerating: boolean;
  onGenerateProduction: () => Promise<void>;
  onNavigate: (section: StudioSection) => void;
}

export function ProductionStudio({
  project,
  isGenerating,
  onGenerateProduction,
  onNavigate,
}: ProductionStudioProps) {
  const plan = project.production;
  const canGenerate = Boolean(project.story || project.screenplay.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
            05. Production Planning
          </p>
          <h1 className="mt-1 font-cinema text-3xl font-semibold text-[#F7F5F0] sm:text-4xl">
            Production Breakdown & Logistics
          </h1>
          <p className="mt-1 text-sm text-[#A8A49B]">
            Practical unit breakdown covering casting requirements, locations, props, wardrobe,
            camera/sound gear, and shoot complexity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onGenerateProduction()}
            disabled={isGenerating || !canGenerate}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-4 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Building Breakdown...
              </>
            ) : plan ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate Plan
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Production Plan
              </>
            )}
          </button>

          {plan && (
            <button
              type="button"
              onClick={() => onNavigate('export')}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-4 py-2.5 text-sm font-medium text-[#F7F5F0] transition-colors hover:border-[#C8A24B]/60"
            >
              Export Project
              <ArrowRight className="h-4 w-4 text-[#C8A24B]" />
            </button>
          )}
        </div>
      </div>

      {isGenerating && !plan && (
        <div className="rounded-xl border border-[#222228] bg-[#111114] p-10 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#C8A24B]" />
          <p className="mt-3 text-sm font-medium text-[#F7F5F0]">
            Compiling casting, location logistics, equipment, and scene requirements with Gemini...
          </p>
        </div>
      )}

      {!isGenerating && !plan && (
        <div className="rounded-xl border border-dashed border-[#2D2D36] bg-[#111114]/60 p-10 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-[#C8A24B]/70" />
          <h3 className="mt-3 font-cinema text-2xl text-[#F7F5F0]">
            No Production Breakdown Yet
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#A8A49B]">
            {canGenerate
              ? 'Click Generate Production Plan above to turn your story and scenes into an actionable shoot checklist.'
              : 'Develop a story or screenplay first before generating your production plan.'}
          </p>
        </div>
      )}

      {plan && (
        <div className="space-y-6">
          {/* Complexity & Schedule Strip */}
          <section className="grid grid-cols-1 divide-y divide-[#222228] overflow-hidden rounded-xl border border-[#222228] bg-[#111114] md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="p-5">
              <p className="text-xs text-[#A8A49B]">Estimated Production Complexity</p>
              <p className="mt-1 font-cinema text-2xl font-semibold text-[#E5C77A]">
                {plan.estimatedComplexity}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-[#A8A49B]">Estimated Shoot Schedule</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[#F7F5F0]">
                {plan.estimatedShootDays}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-[#A8A49B]">Complexity Assessment</p>
              <p className="mt-1 text-sm leading-relaxed text-[#D5D1C8]">
                {plan.complexityRationale}
              </p>
            </div>
          </section>

          {/* Required Actors Table */}
          <section className="overflow-hidden rounded-xl border border-[#222228] bg-[#111114]">
            <div className="border-b border-[#222228] px-6 py-4">
              <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                Required Actors & Casting Notes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#222228] bg-[#16161B] text-xs text-[#A8A49B]">
                  <tr>
                    <th className="px-6 py-3 font-medium">Character</th>
                    <th className="px-6 py-3 font-medium">Role Type</th>
                    <th className="px-6 py-3 font-medium">Age Range</th>
                    <th className="px-6 py-3 font-medium">Casting Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222228]">
                  {plan.requiredActors.map((actor, idx) => (
                    <tr key={idx} className="hover:bg-[#16161B]/60">
                      <td className="px-6 py-3.5 font-medium text-[#F7F5F0]">
                        {actor.characterName}
                      </td>
                      <td className="px-6 py-3.5 text-[#E5C77A]">{actor.roleType}</td>
                      <td className="px-6 py-3.5 font-mono text-xs tabular-nums text-[#D5D1C8]">
                        {actor.ageRange}
                      </td>
                      <td className="px-6 py-3.5 text-[#A8A49B]">{actor.castingNotes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Locations */}
          <section className="overflow-hidden rounded-xl border border-[#222228] bg-[#111114]">
            <div className="border-b border-[#222228] px-6 py-4">
              <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                Locations & Unit Logistics
              </h2>
            </div>
            <div className="divide-y divide-[#222228]">
              {plan.locations.map((loc, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 px-6 py-4 md:grid-cols-12 md:gap-6"
                >
                  <div className="md:col-span-4">
                    <p className="font-medium text-[#F7F5F0]">{loc.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-[#C8A24B]">{loc.environment}</p>
                  </div>
                  <div className="text-sm leading-relaxed text-[#A8A49B] md:col-span-8">
                    {loc.logistics}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Props, Costumes, Equipment */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-[#222228] bg-[#111114] p-6">
              <h3 className="font-cinema text-xl font-semibold text-[#F7F5F0]">Key Props</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#D5D1C8]">
                {plan.props.map((item, idx) => (
                  <li key={idx} className="border-b border-[#222228] pb-2 last:border-b-0">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[#222228] bg-[#111114] p-6">
              <h3 className="font-cinema text-xl font-semibold text-[#F7F5F0]">
                Costumes & Wardrobe
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#D5D1C8]">
                {plan.costumes.map((item, idx) => (
                  <li key={idx} className="border-b border-[#222228] pb-2 last:border-b-0">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[#222228] bg-[#111114] p-6">
              <h3 className="font-cinema text-xl font-semibold text-[#F7F5F0]">
                Equipment Suggestions
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#D5D1C8]">
                {plan.equipmentSuggestions.map((item, idx) => (
                  <li key={idx} className="border-b border-[#222228] pb-2 last:border-b-0">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Scene Requirements */}
          <section className="overflow-hidden rounded-xl border border-[#222228] bg-[#111114]">
            <div className="border-b border-[#222228] px-6 py-4">
              <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
                Per-Scene Requirements
              </h2>
            </div>
            <div className="divide-y divide-[#222228]">
              {plan.sceneRequirements.map((sr, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 px-6 py-4 md:grid-cols-12 md:items-center md:gap-6"
                >
                  <div className="font-mono text-xs text-[#E5C77A] tabular-nums md:col-span-4">
                    SCENE {String(sr.sceneNumber).padStart(2, '0')} · {sr.heading}
                  </div>
                  <div className="text-sm text-[#D5D1C8] md:col-span-8">{sr.keyNeeds}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
