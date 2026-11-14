import {SAMPLE_PROJECT_LAST_PROMISE} from '../data/sampleProject';
import type {FilmProject, ProjectReferenceImage} from '../types/film';

export const STORAGE_PROJECTS_KEY = 'marbrecal_studio_projects_v1';
export const STORAGE_ACTIVE_ID_KEY = 'marbrecal_active_project_id_v1';

const IDB_NAME = 'marbrecal_studio_media_v1';
const IDB_STORE = 'reference_image_blobs';

export interface PersistResult {
  saved: boolean;
  offloadedImagesToIndexedDb?: boolean;
  error?: string;
}

export function generateUniqueProjectId(existingIds: Iterable<string>): string {
  const used = new Set(existingIds);
  let candidate = '';
  do {
    const randomPart =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    candidate = `film-${randomPart}`;
  } while (used.has(candidate));
  return candidate;
}

function normalizeProject(raw: unknown): FilmProject | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<FilmProject>;
  if (!candidate.brief || typeof candidate.brief !== 'object') return null;

  const id =
    typeof candidate.id === 'string' && candidate.id.trim().length > 0
      ? candidate.id.trim()
      : '';

  const safeClips = Array.isArray(candidate.videoClips)
    ? candidate.videoClips.map((clip) => {
        if (clip.videoUrl && clip.videoUrl.startsWith('blob:')) {
          return {
            ...clip,
            status: 'not_generated' as const,
            label: 'No video clip generated yet',
            videoUrl: undefined,
          };
        }
        return clip;
      })
    : undefined;

  return {
    id,
    isSample: Boolean(candidate.isSample),
    createdAt:
      typeof candidate.createdAt === 'string'
        ? candidate.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof candidate.updatedAt === 'string'
        ? candidate.updatedAt
        : new Date().toISOString(),
    geminiGenerations:
      typeof candidate.geminiGenerations === 'number' &&
      Number.isFinite(candidate.geminiGenerations)
        ? candidate.geminiGenerations
        : 0,
    brief: candidate.brief,
    story: candidate.story ?? null,
    screenplay: Array.isArray(candidate.screenplay) ? candidate.screenplay : [],
    characters: Array.isArray(candidate.characters) ? candidate.characters : [],
    storyboard: Array.isArray(candidate.storyboard) ? candidate.storyboard : [],
    production: candidate.production ?? null,
    referenceImages: Array.isArray(candidate.referenceImages)
      ? candidate.referenceImages
      : [],
    videoClips: safeClips,
  };
}

export function dedupeProjectsById(projects: FilmProject[]): FilmProject[] {
  const seenIds = new Set<string>();
  const result: FilmProject[] = [];

  for (const proj of projects) {
    const id =
      proj.id && !seenIds.has(proj.id)
        ? proj.id
        : generateUniqueProjectId(seenIds);
    seenIds.add(id);
    result.push(id === proj.id ? proj : {...proj, id});
  }

  return result;
}

export function readProjectsFromLocalStorage(): {
  found: boolean;
  projects: FilmProject[];
} {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw === null) {
      return {found: false, projects: []};
    }
    const parsed = JSON.parse(raw) as unknown;
    const rawArray = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? [parsed]
        : [];
    const normalized = rawArray
      .map(normalizeProject)
      .filter((item): item is FilmProject => item !== null);
    return {
      found: true,
      projects: dedupeProjectsById(normalized),
    };
  } catch {
    return {found: false, projects: []};
  }
}

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, {keyPath: 'id'});
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

async function saveImageBlobsToIndexedDb(images: ProjectReferenceImage[]): Promise<void> {
  if (images.length === 0) return;
  try {
    const db = await openMediaDb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    for (const img of images) {
      if (img.dataUrl) {
        store.put({id: img.id, dataUrl: img.dataUrl});
      }
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Best-effort overflow cache
  }
}

export async function rehydrateProjectImagesFromIndexedDb(
  projects: FilmProject[],
): Promise<FilmProject[] | null> {
  const missingIds: string[] = [];
  for (const proj of projects) {
    for (const img of proj.referenceImages ?? []) {
      if (!img.dataUrl && img.id) {
        missingIds.push(img.id);
      }
    }
  }
  if (missingIds.length === 0) return null;

  try {
    const db = await openMediaDb();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const recovered = new Map<string, string>();

    await Promise.all(
      missingIds.map(
        (id) =>
          new Promise<void>((resolve) => {
            const req = store.get(id);
            req.onsuccess = () => {
              const rec = req.result as {id: string; dataUrl: string} | undefined;
              if (rec?.dataUrl) {
                recovered.set(id, rec.dataUrl);
              }
              resolve();
            };
            req.onerror = () => resolve();
          }),
      ),
    );
    db.close();

    if (recovered.size === 0) return null;
    return projects.map((proj) => ({
      ...proj,
      referenceImages: (proj.referenceImages ?? []).map((img) =>
        !img.dataUrl && recovered.has(img.id)
          ? {...img, dataUrl: recovered.get(img.id)!}
          : img,
      ),
    }));
  } catch {
    return null;
  }
}

export function persistProjectsToLocalStorage(projects: FilmProject[]): PersistResult {
  const safeList = dedupeProjectsById(projects);

  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(safeList));
    return {saved: true};
  } catch {
    // If large reference image dataUrls exceed the ~5MB localStorage quota,
    // preserve every project record in localStorage and cache image payloads in IndexedDB.
    try {
      const allImages = safeList.flatMap((p) => p.referenceImages ?? []);
      void saveImageBlobsToIndexedDb(allImages);

      const compactList = safeList.map((proj) => ({
        ...proj,
        referenceImages: (proj.referenceImages ?? []).map((img) => ({
          ...img,
          dataUrl: '',
        })),
      }));
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(compactList));
      return {saved: true, offloadedImagesToIndexedDb: true};
    } catch (err) {
      return {
        saved: false,
        error:
          err instanceof Error
            ? err.message
            : 'Unable to persist projects to browser storage.',
      };
    }
  }
}

export function loadInitialProjectsCollection(): FilmProject[] {
  const {found, projects} = readProjectsFromLocalStorage();
  if (found) {
    return projects;
  }
  const initial = [SAMPLE_PROJECT_LAST_PROMISE];
  persistProjectsToLocalStorage(initial);
  return initial;
}

export function mergeWithPersistedCollection(
  inMemoryProjects: FilmProject[],
): FilmProject[] {
  const {found, projects: stored} = readProjectsFromLocalStorage();
  if (!found || stored.length === 0) {
    return dedupeProjectsById(inMemoryProjects);
  }

  const byId = new Map<string, FilmProject>();
  for (const item of stored) {
    byId.set(item.id, item);
  }
  for (const item of inMemoryProjects) {
    byId.set(item.id, item);
  }
  return dedupeProjectsById(Array.from(byId.values()));
}

export function appendProjectToCollection(
  currentProjects: FilmProject[],
  draftProject: FilmProject,
): {
  nextProjects: FilmProject[];
  createdProject: FilmProject;
  saveResult: PersistResult;
} {
  const existingCollection = mergeWithPersistedCollection(currentProjects);
  const uniqueId = generateUniqueProjectId(existingCollection.map((p) => p.id));
  const createdProject: FilmProject = {
    ...draftProject,
    id: uniqueId,
  };
  const nextProjects = [createdProject, ...existingCollection];
  const saveResult = persistProjectsToLocalStorage(nextProjects);
  return {nextProjects, createdProject, saveResult};
}

export function updateProjectInCollection(
  currentProjects: FilmProject[],
  projectId: string,
  updater: (project: FilmProject) => FilmProject,
): {
  nextProjects: FilmProject[];
  saveResult: PersistResult;
} {
  const existingCollection = mergeWithPersistedCollection(currentProjects);
  const nowIso = new Date().toISOString();
  const nextProjects = existingCollection.map((p) =>
    p.id === projectId ? {...updater(p), id: p.id, updatedAt: nowIso} : p,
  );
  const saveResult = persistProjectsToLocalStorage(nextProjects);
  return {nextProjects, saveResult};
}

export function deleteProjectFromCollection(
  currentProjects: FilmProject[],
  projectId: string,
): {
  nextProjects: FilmProject[];
  saveResult: PersistResult;
} {
  const nextProjects = currentProjects.filter((p) => p.id !== projectId);
  const saveResult = persistProjectsToLocalStorage(nextProjects);
  return {nextProjects, saveResult};
}

export function loadActiveProjectId(projects: FilmProject[]): string {
  try {
    const saved = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
    if (saved && projects.some((p) => p.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage read error
  }
  return projects[0]?.id ?? '';
}

export function saveActiveProjectId(projectId: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_ID_KEY, projectId);
  } catch {
    // Ignore storage write error
  }
}
