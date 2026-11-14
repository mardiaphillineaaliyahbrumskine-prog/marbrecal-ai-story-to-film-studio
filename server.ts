import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import zlib from 'node:zlib';
import {GoogleGenAI, Type} from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw Object.assign(
      new Error(
        'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets to enable live AI generation.',
      ),
      {statusCode: 500, code: 'MISSING_API_KEY'},
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as {status?: number})?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }
      if (attempt < maxRetries) {
        const delayMs = 600 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

function formatApiError(err: unknown): {status: number; message: string; code: string} {
  const e = err as {status?: number; statusCode?: number; code?: string; message?: string};
  const status = e?.statusCode || e?.status || 500;
  const rawMessage = e?.message || 'Unexpected error communicating with Gemini AI.';

  if (e?.code === 'MISSING_API_KEY') {
    return {status: 500, message: rawMessage, code: 'MISSING_API_KEY'};
  }
  if (status === 403 || rawMessage.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message:
        'Gemini API permission denied. Please verify your GEMINI_API_KEY in Settings > Secrets.',
      code: 'PERMISSION_DENIED',
    };
  }
  if (status === 400 || rawMessage.includes('API_KEY_INVALID')) {
    return {
      status: 400,
      message: rawMessage.includes('API_KEY_INVALID')
        ? 'Invalid Gemini API key. Check your key in Settings > Secrets.'
        : rawMessage,
      code: 'BAD_REQUEST',
    };
  }
  if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'Gemini API rate limit or quota reached. Please wait a moment and try again.',
      code: 'RESOURCE_EXHAUSTED',
    };
  }
  if (status === 404 || rawMessage.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: `Requested Gemini model (${MODEL_NAME}) was not found or is unavailable.`,
      code: 'NOT_FOUND',
    };
  }
  return {status: 500, message: rawMessage, code: 'GENERATION_FAILED'};
}

function parseJsonResponse<T>(text: string | undefined, fallbackLabel: string): T {
  if (!text) {
    throw new Error(`Gemini returned an empty response while generating ${fallbackLabel}.`);
  }
  try {
    return JSON.parse(text.trim()) as T;
  } catch {
    throw new Error(`Gemini returned malformed JSON while generating ${fallbackLabel}.`);
  }
}

interface IncomingReferenceImage {
  name?: string;
  category?: string;
  mimeType?: string;
  dataUrl?: string;
  notes?: string;
  aiAnalysis?: {
    visualSummary?: string;
    characterAppearanceNotes?: string;
    costumeAndStylingNotes?: string;
    settingAndAtmosphere?: string;
    cinematicComposition?: string;
  };
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

function extractBase64FromDataUrl(dataUrl: string): {mimeType: string; data: string} | null {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(
    dataUrl.trim(),
  );
  if (!match) return null;
  const normalizedMime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  return {mimeType: normalizedMime, data: match[2]};
}

function buildMultimodalContents(
  basePrompt: string,
  referenceImages?: IncomingReferenceImage[],
): string | {parts: Array<{text: string} | {inlineData: {mimeType: string; data: string}}>} {
  if (!referenceImages || referenceImages.length === 0) {
    return basePrompt;
  }

  const imageParts: Array<{inlineData: {mimeType: string; data: string}}> = [];
  const referenceNotes: string[] = [];

  for (const img of referenceImages.slice(0, 4)) {
    const parsed = img.dataUrl ? extractBase64FromDataUrl(img.dataUrl) : null;
    if (parsed) {
      imageParts.push({
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      });
    }
    const summaryBits = [
      `${img.name || 'Reference Image'} (${img.category || 'Visual Reference'})`,
      img.notes ? `Creator note: ${img.notes}` : '',
      img.aiAnalysis?.visualSummary ? `Visual summary: ${img.aiAnalysis.visualSummary}` : '',
      img.aiAnalysis?.characterAppearanceNotes
        ? `Appearance: ${img.aiAnalysis.characterAppearanceNotes}`
        : '',
      img.aiAnalysis?.costumeAndStylingNotes
        ? `Costume/Styling: ${img.aiAnalysis.costumeAndStylingNotes}`
        : '',
      img.aiAnalysis?.settingAndAtmosphere
        ? `Setting/Atmosphere: ${img.aiAnalysis.settingAndAtmosphere}`
        : '',
      img.aiAnalysis?.cinematicComposition
        ? `Framing/Composition: ${img.aiAnalysis.cinematicComposition}`
        : '',
    ]
      .filter(Boolean)
      .join(' | ');
    referenceNotes.push(`- ${summaryBits}`);
  }

  const combinedPrompt = `${basePrompt}

ATTACHED VISUAL STORY REFERENCES (combine these visual details with the written film concept; treat any people shown strictly as fictional visual inspiration without identifying real individuals):
${referenceNotes.join('\n')}`;

  if (imageParts.length === 0) {
    return combinedPrompt;
  }

  return {
    parts: [...imageParts, {text: combinedPrompt}],
  };
}

async function createServer() {
  const app = express();
  app.use(express.json({limit: '15mb'}));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      studio: 'MARBRECAL AI – MARDIA STUDIO',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      capabilities: {
        storyAndScript: Boolean(process.env.GEMINI_API_KEY?.trim()),
        multimodalImageAnalysis: Boolean(process.env.GEMINI_API_KEY?.trim()),
        storyboardImageGeneration: false,
        videoGeneration: false,
      },
    });
  });

  // Honest AI Video Generation endpoint (returns 501 when no video service is connected)
  app.post('/api/studio/generate-video', (_req, res) => {
    res.status(501).json({
      error:
        'AI Video Generation is not currently connected. No external video-generation API is configured in this prototype, so no playable video clips were produced.',
      code: 'VIDEO_SERVICE_NOT_CONNECTED',
    });
  });

  // Safe GitHub-ready source backup ZIP & manifest (excludes .env*, keys, node_modules, dist)
  const EXCLUDED_DIRS = new Set([
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git',
    '.vite',
    '.aistudio',
    'secrets',
  ]);

  function isSafeBackupFile(relativePath: string): boolean {
    const base = path.basename(relativePath);
    if (base === '.env.example') return true;
    if (base.startsWith('.env')) return false;
    if (
      base === '.DS_Store' ||
      base === 'Thumbs.db' ||
      base === 'server.js' ||
      base === 'credentials.json' ||
      base === 'firebase-applet-config.json'
    ) {
      return false;
    }
    if (/\.(pem|key|p12|secret|zip|log)$/i.test(base)) return false;
    return true;
  }

  function collectSafeBackupFiles(rootDir: string, currentDir = rootDir): string[] {
    const entries = fs.readdirSync(currentDir, {withFileTypes: true});
    const collected: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(rootDir, fullPath).split(path.sep).join('/');

      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          collected.push(...collectSafeBackupFiles(rootDir, fullPath));
        }
      } else if (entry.isFile() && isSafeBackupFile(relPath)) {
        collected.push(relPath);
      }
    }
    return collected.sort();
  }

  const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function computeCrc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function buildZipArchive(rootDir: string, relPaths: string[]): Buffer {
    const localChunks: Buffer[] = [];
    const centralChunks: Buffer[] = [];
    let offset = 0;

    const now = new Date();
    const dosTime =
      ((now.getHours() & 0x1f) << 11) |
      ((now.getMinutes() & 0x3f) << 5) |
      ((now.getSeconds() >> 1) & 0x1f);
    const dosDate =
      (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) |
      (((now.getMonth() + 1) & 0x0f) << 5) |
      (now.getDate() & 0x1f);

    for (const relPath of relPaths) {
      const raw = fs.readFileSync(path.join(rootDir, relPath));
      const compressed = zlib.deflateRawSync(raw);
      const crc = computeCrc32(raw);
      const nameBuf = Buffer.from(relPath, 'utf8');

      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0x0800, 6);
      localHeader.writeUInt16LE(8, 8);
      localHeader.writeUInt16LE(dosTime, 10);
      localHeader.writeUInt16LE(dosDate, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(compressed.length, 18);
      localHeader.writeUInt32LE(raw.length, 22);
      localHeader.writeUInt16LE(nameBuf.length, 26);
      localHeader.writeUInt16LE(0, 28);

      localChunks.push(localHeader, nameBuf, compressed);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(0x031e, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0x0800, 8);
      centralHeader.writeUInt16LE(8, 10);
      centralHeader.writeUInt16LE(dosTime, 12);
      centralHeader.writeUInt16LE(dosDate, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(compressed.length, 20);
      centralHeader.writeUInt32LE(raw.length, 24);
      centralHeader.writeUInt16LE(nameBuf.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE((0o100644 << 16) >>> 0, 38);
      centralHeader.writeUInt32LE(offset, 42);

      centralChunks.push(centralHeader, nameBuf);
      offset += localHeader.length + nameBuf.length + compressed.length;
    }

    const centralDirBuf = Buffer.concat(centralChunks);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(relPaths.length, 8);
    eocd.writeUInt16LE(relPaths.length, 10);
    eocd.writeUInt32LE(centralDirBuf.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...localChunks, centralDirBuf, eocd]);
  }

  app.get('/api/studio/backup-manifest', (_req, res) => {
    try {
      const files = collectSafeBackupFiles(__dirname);
      res.json({
        filename: 'marbrecal-ai-story-to-film-studio-backup.zip',
        fileCount: files.length,
        files,
      });
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({error: formatted.message, code: 'BACKUP_MANIFEST_ERROR'});
    }
  });

  const sendBackupZip = (_req: express.Request, res: express.Response) => {
    try {
      const files = collectSafeBackupFiles(__dirname);
      const zipBuffer = buildZipArchive(__dirname, files);
      res.status(200);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="marbrecal-ai-story-to-film-studio-backup.zip"',
      );
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-store');
      res.end(zipBuffer);
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({error: formatted.message, code: 'BACKUP_ZIP_ERROR'});
    }
  };

  app.get('/api/studio/backup-zip', sendBackupZip);
  app.get('/api/studio/backup-zip/:filename', sendBackupZip);

  // 0. Multimodal Reference Image Understanding
  app.post('/api/studio/analyze-image', async (req, res) => {
    try {
      const {dataUrl, mimeType, category, name, notes, filmContext} = req.body as {
        dataUrl?: string;
        mimeType?: string;
        category?: string;
        name?: string;
        notes?: string;
        filmContext?: string;
      };

      if (!dataUrl) {
        res.status(400).json({error: 'Image data is required for visual analysis.'});
        return;
      }

      const parsed = extractBase64FromDataUrl(dataUrl);
      const effectiveMime = parsed?.mimeType || mimeType?.toLowerCase() || '';
      if (!parsed || !ALLOWED_IMAGE_MIME_TYPES.has(effectiveMime)) {
        res.status(400).json({
          error: 'Unsupported image format. Upload JPG, JPEG, PNG, or WEBP images.',
        });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `Analyze this uploaded visual reference image for a film project at MARDIA STUDIO.
Reference Label: ${name || 'Untitled Reference'}
Category: ${category || 'Scene Inspiration'}
${notes ? `Filmmaker Notes: ${notes}` : ''}
${filmContext ? `Film Project Context: ${filmContext}` : ''}

IMPORTANT PRIVACY & CREATIVE RULE:
If a person appears in the photograph, NEVER identify or guess any real-world person's name or identity. Describe only visible fictional character attributes (posture, age impression, facial expression, hairstyle, silhouette, wardrobe, fabrics, colors) suitable for character development and costume design.

Provide structured cinematic observations covering overall visual summary, character appearance notes, costume and styling details, setting/atmosphere/props, and cinematic composition/storyboard guidance.`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: parsed.mimeType,
                  data: parsed.data,
                },
              },
              {text: prompt},
            ],
          },
          config: {
            systemInstruction:
              'You are a Cinematographer, Production Designer, and Costume Supervisor at MARDIA STUDIO. Analyze visual references in structured JSON without ever identifying real individuals.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                visualSummary: {
                  type: Type.STRING,
                  description: 'Concise overview of what is visible and how it supports film storytelling.',
                },
                characterAppearanceNotes: {
                  type: Type.STRING,
                  description:
                    'Visible posture, hair, age impression, and styling cues if a subject is shown, or N/A if purely environment/object.',
                },
                costumeAndStylingNotes: {
                  type: Type.STRING,
                  description: 'Visible garments, textures, accessories, and color palette notes.',
                },
                settingAndAtmosphere: {
                  type: Type.STRING,
                  description: 'Environment, architecture, lighting direction, weather, props, and mood.',
                },
                cinematicComposition: {
                  type: Type.STRING,
                  description:
                    'Camera angle, framing, color grade, and ready-to-use storyboard visual prompt ideas.',
                },
              },
              required: [
                'visualSummary',
                'characterAppearanceNotes',
                'costumeAndStylingNotes',
                'settingAndAtmosphere',
                'cinematicComposition',
              ],
            },
          },
        }),
      );

      const analysis = parseJsonResponse<Record<string, string>>(
        response.text,
        'reference image analysis',
      );
      res.json({
        analysis: {
          ...analysis,
          analyzedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({error: formatted.message, code: formatted.code});
    }
  });

  // 1. Story Development Generator
  app.post('/api/studio/generate-story', async (req, res) => {
    try {
      const {brief, refinementNote, referenceImages} = req.body as {
        brief?: Record<string, string>;
        refinementNote?: string;
        referenceImages?: IncomingReferenceImage[];
      };
      if (!brief?.originalIdea?.trim()) {
        res.status(400).json({error: 'Please enter an original story idea first.'});
        return;
      }

      const ai = getGeminiClient();
      const prompt = `Transform this film concept into a richly developed cinematic story dossier.
Film Title: ${brief.title || 'Untitled Project'}
Original Story Idea: ${brief.originalIdea}
Genre: ${brief.genre || 'Drama'}
Preferred Language: ${brief.language || 'English'}
Target Duration: ${brief.duration || '90 minutes'}
Setting & Location: ${brief.setting || 'Contemporary'}
Target Audience: ${brief.targetAudience || 'General International Audience'}
Storytelling Style: ${brief.storytellingStyle || 'Cinematic Realism'}
${brief.characterAgesHint ? `Specified Character Ages / Notes: ${brief.characterAgesHint}` : ''}
${refinementNote ? `Director's Refinement Request: ${refinementNote}` : ''}

Deliver deeply human, filmable narrative beats with grounded emotional stakes and cultural authenticity.`;

      const contents = buildMultimodalContents(prompt, referenceImages);

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents,
          config: {
            systemInstruction:
              'You are an acclaimed feature film development executive and screenwriter at MARDIA STUDIO. Return strictly structured JSON matching the requested schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                suggestedTitle: {
                  type: Type.STRING,
                  description:
                    'A memorable, cinematic feature film title (use the provided working title if strong, or elevate it if untitled).',
                },
                logline: {
                  type: Type.STRING,
                  description: 'A tight, compelling 1-2 sentence film logline.',
                },
                synopsis: {
                  type: Type.STRING,
                  description: 'A cinematic 2-3 paragraph synopsis of the full film.',
                },
                beginning: {
                  type: Type.STRING,
                  description: 'Act I setup, inciting incident, and protagonist world.',
                },
                middle: {
                  type: Type.STRING,
                  description: 'Act II escalating complications, midpoint turn, and low point.',
                },
                ending: {
                  type: Type.STRING,
                  description: 'Act III climax, resolution, and final resonant image.',
                },
                mainCharactersSummary: {
                  type: Type.STRING,
                  description:
                    'Overview of principal characters, including their ages and central drives.',
                },
                centralConflict: {
                  type: Type.STRING,
                  description: 'The core internal and external dramatic tension driving the film.',
                },
                themes: {
                  type: Type.STRING,
                  description: 'Major thematic motifs and moral questions explored.',
                },
                emotionalImpact: {
                  type: Type.STRING,
                  description: 'Intended emotional journey and lingering resonance for viewers.',
                },
              },
              required: [
                'suggestedTitle',
                'logline',
                'synopsis',
                'beginning',
                'middle',
                'ending',
                'mainCharactersSummary',
                'centralConflict',
                'themes',
                'emotionalImpact',
              ],
            },
          },
        }),
      );

      const data = parseJsonResponse(response.text, 'story development');
      res.json({story: data});
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({error: formatted.message, code: formatted.code});
    }
  });

  // 2. Screenplay Writer (Full or Single Scene)
  app.post('/api/studio/generate-screenplay', async (req, res) => {
    try {
      const {
        brief,
        story,
        characters,
        targetSceneNumber,
        directorNote,
        existingSceneCount,
        referenceImages,
      } = req.body as {
        brief: Record<string, string>;
        story: Record<string, string>;
        characters?: Array<Record<string, string>>;
        targetSceneNumber?: number;
        directorNote?: string;
        existingSceneCount?: number;
        referenceImages?: IncomingReferenceImage[];
      };

      if (!story?.synopsis && !brief?.originalIdea) {
        res
          .status(400)
          .json({error: 'Story synopsis or original idea is required to write screenplay scenes.'});
        return;
      }

      const ai = getGeminiClient();
      const characterContext = characters?.length
        ? `\nEstablished Characters:\n${characters
            .map((c) => `- ${c.name} (${c.age}, ${c.role}): ${c.personality} | Voice/Motivation: ${c.motivation}`)
            .join('\n')}`
        : '';

      const isSingleScene = typeof targetSceneNumber === 'number' && targetSceneNumber > 0;
      const prompt = isSingleScene
        ? `Rewrite and elevate ONLY Scene ${targetSceneNumber} of the screenplay for "${brief?.title || 'Untitled'}".
Genre: ${brief?.genre || 'Drama'} | Language: ${brief?.language || 'English'} | Style: ${brief?.storytellingStyle || 'Cinematic'}
Story Logline: ${story?.logline || ''}
Story Synopsis: ${story?.synopsis || brief?.originalIdea || ''}
${characterContext}
${directorNote ? `Specific Direction for Scene ${targetSceneNumber}: ${directorNote}` : ''}
Return an array containing exactly 1 scene object numbered ${targetSceneNumber} with vivid visual action lines, crisp subtext-rich dialogue, parentheticals only when necessary, and proper transitions.`
        : `Write a properly formatted sequence of ${existingSceneCount || 4} key dramatic screenplay scenes covering the arc of "${brief?.title || 'Untitled'}".
Genre: ${brief?.genre || 'Drama'} | Language: ${brief?.language || 'English'} | Setting: ${brief?.setting || ''} | Style: ${brief?.storytellingStyle || 'Cinematic'}
Logline: ${story?.logline || ''}
Synopsis: ${story?.synopsis || brief?.originalIdea || ''}
Act I (Beginning): ${story?.beginning || ''}
Act II (Middle): ${story?.middle || ''}
Act III (Ending): ${story?.ending || ''}
${characterContext}
${directorNote ? `Screenwriter Notes: ${directorNote}` : ''}

Format every scene in authentic industry screenplay style: proper INT./EXT. sluglines, location, time of day, cinematic present-tense action lines, uppercase character cues, natural dialogue, and appropriate transitions.`;

      const contents = buildMultimodalContents(prompt, referenceImages);

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents,
          config: {
            systemInstruction:
              'You are a master screenwriter at MARDIA STUDIO. Write visual, tightly paced scenes with subtext and authentic dialogue. Output strictly structured JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sceneNumber: {type: Type.INTEGER},
                      intExt: {
                        type: Type.STRING,
                        description: 'Must be INT., EXT., or INT./EXT.',
                      },
                      location: {
                        type: Type.STRING,
                        description: 'Uppercase screenplay location slug, e.g. COASTAL HARBOR PIER',
                      },
                      timeOfDay: {
                        type: Type.STRING,
                        description: 'Uppercase time of day, e.g. DUSK, NIGHT, DAWN, DAY',
                      },
                      transition: {
                        type: Type.STRING,
                        description: 'Optional scene transition such as CUT TO:, DISSOLVE TO:, FADE OUT.',
                      },
                      elements: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            type: {
                              type: Type.STRING,
                              description: 'One of: action, character, dialogue, parenthetical, transition',
                            },
                            text: {type: Type.STRING},
                          },
                          required: ['type', 'text'],
                        },
                      },
                    },
                    required: ['sceneNumber', 'intExt', 'location', 'timeOfDay', 'elements'],
                  },
                },
              },
              required: ['scenes'],
            },
          },
        }),
      );

      const data = parseJsonResponse<{scenes: unknown[]}>(response.text, 'screenplay scenes');
      res.json({scenes: data.scenes});
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({error: formatted.message, code: formatted.code});
    }
  });

  // 3. Character Development Studio
  app.post('/api/studio/generate-characters', async (req, res) => {
    try {
      const {brief, story, customAgeSpecs, referenceImages} = req.body as {
        brief: Record<string, string>;
        story: Record<string, string>;
        customAgeSpecs?: string;
        referenceImages?: IncomingReferenceImage[];
      };

      if (!story?.synopsis && !brief?.originalIdea) {
        res
          .status(400)
          .json({error: 'Story details are required before generating character profiles.'});
        return;
      }

      const ai = getGeminiClient();
      const prompt = `Create 4 deeply realized character profiles for the film "${brief?.title || 'Untitled'}".
Genre: ${brief?.genre || 'Drama'} | Setting: ${brief?.setting || ''} | Language: ${brief?.language || 'English'}
Logline: ${story?.logline || ''}
Synopsis: ${story?.synopsis || brief?.originalIdea || ''}
Main Characters Overview: ${story?.mainCharactersSummary || ''}
Central Conflict: ${story?.centralConflict || ''}
${customAgeSpecs || brief?.characterAgesHint ? `IMPORTANT - Honor these creator-specified character ages exactly: ${customAgeSpecs || brief?.characterAgesHint}` : ''}

If any Character Reference or Costume Reference images are attached, incorporate their visible appearance, wardrobe, fabrics, and styling cues into the fictional characters without ever identifying real people.

Each profile must include an explicit age (honoring any specified ages verbatim), nuanced psychology, concrete visual appearance details, and authentic costume & styling notes suited to the film's setting.`;

      const contents = buildMultimodalContents(prompt, referenceImages);

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents,
          config: {
            systemInstruction:
              'You are a lead casting director and character architect at MARDIA STUDIO. Produce rich, production-ready character dossiers in valid JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                characters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: {type: Type.STRING},
                      age: {type: Type.STRING, description: 'Exact age as specified or appropriate integer age, e.g. 58 or 24'},
                      role: {type: Type.STRING, description: 'Protagonist, Deuteragonist, Antagonist, Mentor, etc.'},
                      personality: {type: Type.STRING},
                      background: {type: Type.STRING},
                      motivation: {type: Type.STRING},
                      relationships: {type: Type.STRING},
                      arc: {type: Type.STRING},
                      visualAppearance: {type: Type.STRING},
                      costumeNotes: {type: Type.STRING},
                    },
                    required: [
                      'name',
                      'age',
                      'role',
                      'personality',
                      'background',
                      'motivation',
                      'relationships',
                      'arc',
                      'visualAppearance',
                      'costumeNotes',
                    ],
                  },
                },
              },
              required: ['characters'],
            },
          },
        }),
      );

      const data = parseJsonResponse<{characters: unknown[]}>(
        response.text,
        'character profiles',
      );
      res.json({characters: data.characters});
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({error: formatted.message, code: formatted.code});
    }
  });

  // 4. Cinematic Scene & Storyboard Studio
  app.post('/api/studio/generate-storyboard', async (req, res) => {
    try {
      const {brief, scenes, targetSceneNumber, referenceImages} = req.body as {
        brief: Record<string, string>;
        scenes: Array<{
          sceneNumber: number;
          intExt: string;
          location: string;
          timeOfDay: string;
          elements: Array<{type: string; text: string}>;
        }>;
        targetSceneNumber?: number;
        referenceImages?: IncomingReferenceImage[];
      };

      if (!scenes?.length) {
        res.status(400).json({error: 'Generate or add screenplay scenes first to plan storyboards.'});
        return;
      }

      const selectedScenes =
        typeof targetSceneNumber === 'number'
          ? scenes.filter((s) => s.sceneNumber === targetSceneNumber)
          : scenes;

      const ai = getGeminiClient();
      const scenesText = selectedScenes
        .map(
          (s) =>
            `SCENE ${s.sceneNumber}: ${s.intExt} ${s.location} - ${s.timeOfDay}\n${s.elements
              .map((el) => `[${el.type.toUpperCase()}] ${el.text}`)
              .join('\n')}`,
        )
        .join('\n\n---\n\n');

      const prompt = `Break down the following screenplay scene(s) for "${brief?.title || 'Untitled'}" (${brief?.storytellingStyle || 'Cinematic'}) into detailed directorial storyboard plans.
For each scene, design 2 to 3 evocative shots with precise cinematography, lighting, sound design, and an AI-ready visual storyboard prompt. Draw inspiration from any attached Location, Scene, Props, Costume, or Cinematic Style Reference images.

${scenesText}`;

      const contents = buildMultimodalContents(prompt, referenceImages);

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents,
          config: {
            systemInstruction:
              'You are a Director of Photography and Storyboard Supervisor at MARDIA STUDIO. Return cinematic, actionable shot lists in strictly valid JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                storyboard: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sceneNumber: {type: Type.INTEGER},
                      sceneTitle: {type: Type.STRING},
                      sceneDescription: {type: Type.STRING},
                      shots: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            shotNumber: {type: Type.STRING, description: 'e.g. 1A, 1B, 2A'},
                            shotType: {
                              type: Type.STRING,
                              description: 'e.g. Wide Establishing, Medium Close-Up, Over-the-Shoulder, Extreme Close-Up',
                            },
                            cameraAngle: {
                              type: Type.STRING,
                              description: 'e.g. Eye-Level, Low Angle, High Angle, Dutch Tilt',
                            },
                            cameraMovement: {
                              type: Type.STRING,
                              description: 'e.g. Slow Dolly Push-In, Static Tripod, Handheld Tracking, Crane Rise',
                            },
                            lightingDirection: {type: Type.STRING},
                            atmosphere: {type: Type.STRING},
                            visualComposition: {type: Type.STRING},
                            soundAndMusic: {type: Type.STRING},
                            visualStoryboardPrompt: {
                              type: Type.STRING,
                              description: 'Detailed prompt describing the frame composition, lens, subject, lighting, and color palette.',
                            },
                          },
                          required: [
                            'shotNumber',
                            'shotType',
                            'cameraAngle',
                            'cameraMovement',
                            'lightingDirection',
                            'atmosphere',
                            'visualComposition',
                            'soundAndMusic',
                            'visualStoryboardPrompt',
                          ],
                        },
                      },
                    },
                    required: ['sceneNumber', 'sceneTitle', 'sceneDescription', 'shots'],
                  },
                },
              },
              required: ['storyboard'],
            },
          },
        }),
      );

      const data = parseJsonResponse<{storyboard: unknown[]}>(
        response.text,
        'cinematic storyboard',
      );
      res.json({storyboard: data.storyboard});
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({error: formatted.message, code: formatted.code});
    }
  });

  // 5. Production Planning Breakdown
  app.post('/api/studio/generate-production', async (req, res) => {
    try {
      const {brief, story, scenes, characters} = req.body as {
        brief: Record<string, string>;
        story: Record<string, string>;
        scenes: Array<{
          sceneNumber: number;
          intExt: string;
          location: string;
          timeOfDay: string;
          elements: Array<{type: string; text: string}>;
        }>;
        characters: Array<Record<string, string>>;
      };

      if (!story?.synopsis && !scenes?.length) {
        res
          .status(400)
          .json({error: 'Develop your story or screenplay before generating a production plan.'});
        return;
      }

      const ai = getGeminiClient();
      const prompt = `Generate a practical line-producer's production breakdown for "${brief?.title || 'Untitled'}".
Genre: ${brief?.genre || 'Drama'} | Setting: ${brief?.setting || ''} | Target Duration: ${brief?.duration || '90 min'}
Synopsis: ${story?.synopsis || ''}
Characters: ${characters?.map((c) => `${c.name} (${c.age}, ${c.role})`).join(', ') || 'From story'}
Scenes: ${scenes?.map((s) => `Scene ${s.sceneNumber}: ${s.intExt} ${s.location} (${s.timeOfDay})`).join(' | ') || 'From synopsis'}

Provide concrete actor casting requirements, location logistics, key props, costume inventory, camera/lighting/sound equipment suggestions, per-scene production requirements, and realistic production complexity assessment.`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction:
              'You are an experienced Line Producer and Unit Production Manager at MARDIA STUDIO. Deliver practical, realistic film production breakdowns in strictly valid JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                requiredActors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      characterName: {type: Type.STRING},
                      ageRange: {type: Type.STRING},
                      roleType: {type: Type.STRING},
                      castingNotes: {type: Type.STRING},
                    },
                    required: ['characterName', 'ageRange', 'roleType', 'castingNotes'],
                  },
                },
                locations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: {type: Type.STRING},
                      environment: {type: Type.STRING},
                      logistics: {type: Type.STRING},
                    },
                    required: ['name', 'environment', 'logistics'],
                  },
                },
                props: {type: Type.ARRAY, items: {type: Type.STRING}},
                costumes: {type: Type.ARRAY, items: {type: Type.STRING}},
                equipmentSuggestions: {type: Type.ARRAY, items: {type: Type.STRING}},
                sceneRequirements: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sceneNumber: {type: Type.INTEGER},
                      heading: {type: Type.STRING},
                      keyNeeds: {type: Type.STRING},
                    },
                    required: ['sceneNumber', 'heading', 'keyNeeds'],
                  },
                },
                estimatedComplexity: {type: Type.STRING},
                complexityRationale: {type: Type.STRING},
                estimatedShootDays: {type: Type.STRING},
              },
              required: [
                'requiredActors',
                'locations',
                'props',
                'costumes',
                'equipmentSuggestions',
                'sceneRequirements',
                'estimatedComplexity',
                'complexityRationale',
                'estimatedShootDays',
              ],
            },
          },
        }),
      );

      const data = parseJsonResponse(response.text, 'production plan');
      res.json({production: data});
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({error: formatted.message, code: formatted.code});
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MARBRECAL AI – Story-to-Film Studio server listening on port ${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start MARBRECAL AI server:', err);
  process.exit(1);
});
