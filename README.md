# MARBRECAL AI – Story-to-Film Studio

**Developed by MARDIA STUDIO**  
*"Your Story. Your Vision. Your Film."*

MARBRECAL AI is a responsive, full-stack AI filmmaking studio powered by server-side Google Gemini intelligence (`gemini-4-hydrogen`), React 19, TypeScript, Tailwind CSS v4, and Express. It helps filmmakers move from an initial story spark through narrative development, screenplay writing, character dossiers, camera shot planning, storyboard prompts, visual reference analysis, and production breakdowns.

---

## Core Studio Departments

1. **Generate My Film (`FilmWorkflowStudio`)**  
   Integrated 7-step story-to-film pipeline (*Story Input -> Generate Story -> Generate Screenplay -> Generate Characters -> Generate Scenes -> Generate Storyboard -> Generate Film Assembly*), featuring automated sequential pipeline execution, scene-by-scene timeline, browser SpeechSynthesis narration read-through, local clip testing, and an honest **AI VIDEO GENERATION** status module (`501 VIDEO_SERVICE_NOT_CONNECTED` when no paid video service is configured).
2. **Story Development (`StoryStudio`)**  
   Generates film title suggestions, loglines, synopses, three-act narrative arcs, central conflicts, themes, and emotional impact from creator briefs and uploaded visual references.
3. **Screenplay Studio (`ScreenplayStudio`)**  
   Produces industry-formatted scenes with sluglines, action lines, characters, parentheticals, dialogue, and transitions, with inline editing and single-scene regeneration.
4. **Character Studio (`CharacterStudio`)**  
   Builds detailed cast dossiers respecting creator-specified character ages, motivations, relationships, story arcs, visual appearance, and wardrobe notes.
5. **Scene & Storyboard Studio (`StoryboardStudio`)**  
   Breaks screenplay scenes into directorial shot lists with shot types, camera angles, movement, lighting, atmosphere, sound/music cues, and visual storyboard prompts.
6. **Production Planning (`ProductionStudio`)**  
   Generates casting requirements, location logistics, props, costumes, equipment suggestions, per-scene unit needs, shoot-day estimates, and complexity scores.
7. **Visual Gallery (`VisualGalleryStudio` & `ReferenceUploaderStrip`)**  
   Device gallery photo picker (JPG, JPEG, PNG, WEBP) across workspaces with categorization (*Character*, *Location*, *Costume*, *Props*, *Scene Inspiration*, *Cinematic Style*) and multimodal Gemini visual analysis.
8. **Export Project (`ExportStudio`)**  
   Exports individual film projects as `.txt`, Markdown (`.md`), JSON (`.json`), or print-ready PDF, and includes a safe project source backup download (`.zip`).

---

## Multi-Project Persistence & Security

- **Persistent Collection (`src/utils/projectStorage.ts`)**: Projects receive collision-free unique IDs (`crypto.randomUUID()`), append safely to the existing `localStorage` collection (`marbrecal_studio_projects_v1`), update and delete strictly by unique project ID, synchronize across browser tabs, and offload oversized image payloads to IndexedDB (`marbrecal_studio_media_v1`) if browser `localStorage` approaches quota limits.
- **Server-Side AI Proxy (`server.ts`)**: All `@google/genai` calls execute on the Express backend using `process.env.GEMINI_API_KEY`. No API keys or secrets are embedded in client-side code.
- **No Paid Video Dependencies**: Storyboard image generation and video synthesis stay transparently disabled (`storyboardImageGeneration: false`, `videoGeneration: false`) without paid external services.

---

## Local Development Setup

### Prerequisites
- **Node.js** 20+ (tested on Node 22)
- **npm** (or **bun**)
- A Google Gemini API key (`GEMINI_API_KEY`)

### Installation & Run

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and add your Gemini API key locally (`.env` is excluded by `.gitignore` and must never be committed):
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   APP_URL="http://localhost:3000"
   ```

3. **Run in development mode** (Express API + Vite middleware on port `3000`):
   ```bash
   npm run dev
   ```

4. **Verify TypeScript & production build**:
   ```bash
   npm run lint
   npm run build
   ```

5. **Run production build**:
   ```bash
   NODE_ENV=production npm start
   ```

---

## Project Structure

```text
.
├── .env.example              # Safe environment variable template (no secrets)
├── .gitignore                # Excludes .env*, keys, node_modules, dist, logs
├── index.html                # HTML entry point & typography metadata
├── metadata.json             # Studio manifest & capabilities
├── package.json              # Dependencies and scripts
├── server.ts                 # Express server, Gemini API routes & safe ZIP backup route
├── tsconfig.json             # TypeScript compiler configuration
├── vite.config.ts            # Vite + Tailwind CSS v4 configuration
├── public/
│   └── favicon.ico           # Studio favicon
└── src/
    ├── App.tsx               # Main studio layout, navigation & project state
    ├── index.css             # Tailwind CSS v4 global stylesheet
    ├── main.tsx              # React DOM entry point
    ├── assets/images/        # Local studio & sample stills
    ├── components/           # Studio views (Dashboard, Workflow, Story, Script, Cast, Board, Production, Gallery, Export)
    ├── data/                 # Flagship sample film project ("THE LAST PROMISE")
    ├── services/             # Client API wrappers (/api/studio/*)
    ├── types/                # TypeScript domain models
    └── utils/                # Export formatters, image upload optimizer & multi-project storage
```
