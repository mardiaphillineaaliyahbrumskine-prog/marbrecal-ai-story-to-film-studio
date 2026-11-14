import {Check, Copy, Download, FileArchive, FileText, Loader2, Printer, ShieldCheck} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import type {FilmProject} from '../types/film';
import {downloadTextFile, formatProjectAsDossier} from '../utils/exportProject';

interface ExportStudioProps {
  project: FilmProject;
}

interface BackupManifest {
  filename: string;
  fileCount: number;
  files: string[];
}

export function ExportStudio({project}: ExportStudioProps) {
  const [copied, setCopied] = useState(false);
  const [manifest, setManifest] = useState<BackupManifest | null>(null);
  const [showFiles, setShowFiles] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  const dossierText = useMemo(() => formatProjectAsDossier(project), [project]);

  useEffect(() => {
    let active = true;
    fetch('/api/studio/backup-manifest')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: BackupManifest | null) => {
        if (active && data?.files) {
          setManifest(data);
        }
      })
      .catch(() => {
        // Manifest preview optional
      });
    return () => {
      active = false;
    };
  }, []);

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

  const handleDownloadBackupZip = async () => {
    setDownloadingZip(true);
    setZipError(null);
    try {
      const response = await fetch('/api/studio/backup-zip');
      if (!response.ok) {
        throw new Error('Unable to generate ZIP backup archive.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = manifest?.filename || 'marbrecal-ai-story-to-film-studio-backup.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setZipError(err instanceof Error ? err.message : 'Failed to download ZIP backup.');
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="no-print flex flex-wrap items-end justify-between gap-4 border-b border-[#222228] pb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#C8A24B] uppercase">
            08. Export Project
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

      {/* Studio Source Backup ZIP Card */}
      <section className="no-print rounded-xl border border-[#C8A24B]/40 bg-[#141310] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#E5C77A]">
              <ShieldCheck className="h-4 w-4 text-[#C8A24B]" />
              <span>GitHub-Safe Source Code Archive (No Secrets, Keys, or Build Artifacts)</span>
            </div>
            <h2 className="font-cinema text-2xl font-semibold text-[#F7F5F0]">
              Complete Studio Source Backup (.zip)
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-[#A8A49B]">
              Packages all source files, server routes, Tailwind/Vite/TypeScript configs,
              package.json, README.md, .env.example, and hardened .gitignore—explicitly excluding
              .env files, API keys, credentials, node_modules, and dist.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={downloadingZip}
              onClick={() => void handleDownloadBackupZip()}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#C8A24B] px-4 py-2.5 text-xs font-semibold text-[#09090B] transition-colors hover:bg-[#D9B45D] disabled:opacity-60"
            >
              {downloadingZip ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Packaging ZIP...
                </>
              ) : (
                <>
                  <FileArchive className="h-4 w-4" />
                  Download Source Backup (.zip)
                </>
              )}
            </button>

            {manifest && (
              <button
                type="button"
                onClick={() => setShowFiles((prev) => !prev)}
                className="rounded-lg border border-[#2D2D36] bg-[#18181D] px-3.5 py-2.5 text-xs font-medium text-[#F7F5F0] hover:border-[#C8A24B]/60"
              >
                {showFiles ? 'Hide Included Files' : `Inspect ${manifest.fileCount} Included Files`}
              </button>
            )}
          </div>
        </div>

        {zipError && (
          <p className="mt-3 text-xs text-red-300">{zipError}</p>
        )}

        {showFiles && manifest && (
          <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-[#222228] bg-[#09090B] p-4">
            <ul className="grid grid-cols-1 gap-1 font-mono text-xs text-[#D5D1C8] sm:grid-cols-2">
              {manifest.files.map((filePath) => (
                <li key={filePath} className="truncate">
                  {filePath}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

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
