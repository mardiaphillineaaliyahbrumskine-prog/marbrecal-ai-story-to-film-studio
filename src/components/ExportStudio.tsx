import {Check, Copy, Download, FileText, Printer} from 'lucide-react';
import {useMemo, useState} from 'react';
import type {FilmProject} from '../types/film';
import {downloadTextFile, formatProjectAsDossier} from '../utils/exportProject';

interface ExportStudioProps {
  project: FilmProject;
}

export function ExportStudio({project}: ExportStudioProps) {
  const [copied, setCopied] = useState(false);

  const dossierText = useMemo(() => formatProjectAsDossier(project), [project]);

  const safeSlug = project.brief.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dossierText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-8">
      <div className="no-print flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
            06. Export Project
          </p>
          <h1 className="mt-1 font-cinema text-3xl font-semibold text-[#F7F5F0] sm:text-4xl">
            Screenplay & Production Dossier
          </h1>
          <p className="mt-1 text-sm text-[#A8A49B]">
            Export your complete film package in readable text, Markdown, JSON, or print-ready PDF
            format.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadTextFile(`${safeSlug || 'film-project'}-dossier.txt`, dossierText, 'text/plain')
            }
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-4 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D]"
          >
            <Download className="h-4 w-4" />
            Download Dossier (.txt)
          </button>

          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `${safeSlug || 'film-project'}-dossier.md`,
                dossierText,
                'text/markdown',
              )
            }
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2.5 text-sm font-medium text-[#F7F5F0] hover:border-[#C8A24B]/60"
          >
            <FileText className="h-4 w-4 text-[#C8A24B]" />
            Download Markdown
          </button>

          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `${safeSlug || 'film-project'}.json`,
                JSON.stringify(project, null, 2),
                'application/json',
              )
            }
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2.5 text-sm font-medium text-[#F7F5F0] hover:border-[#C8A24B]/60"
          >
            Export JSON
          </button>

          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2.5 text-sm font-medium text-[#F7F5F0] hover:border-[#C8A24B]/60"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-[#C8A24B]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Text
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2.5 text-sm font-medium text-[#F7F5F0] hover:border-[#C8A24B]/60"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Readable Preview */}
      <section className="overflow-hidden rounded-xl border border-[#222228] bg-[#111114]">
        <div className="no-print flex items-center justify-between border-b border-[#222228] bg-[#16161B] px-6 py-3">
          <span className="text-xs font-medium text-[#E5C77A]">
            Readable Production Package Preview · {project.brief.title}
          </span>
          <span className="font-mono text-xs tabular-nums text-[#A8A49B]">
            {dossierText.split('\n').length} lines
          </span>
        </div>

        <pre className="max-h-[65vh] overflow-auto p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap text-[#E4E0D8] sm:p-8">
          {dossierText}
        </pre>
      </section>
    </div>
  );
}
