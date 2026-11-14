import type {
  CharacterProfile,
  DevelopedStory,
  ImageAnalysisResult,
  ProductionPlan,
  ProjectReferenceImage,
  ScreenplayScene,
  StoryBrief,
  StoryboardScenePlan,
} from '../types/film';

export interface StudioCapabilities {
  storyAndScript: boolean;
  multimodalImageAnalysis: boolean;
  storyboardImageGeneration: boolean;
  videoGeneration: boolean;
}

export async function fetchStudioCapabilities(): Promise<StudioCapabilities> {
  const response = await fetch('/api/health');
  if (!response.ok) {
    throw new Error('Unable to check studio AI service capabilities.');
  }
  const data = (await response.json()) as {capabilities?: StudioCapabilities};
  return (
    data.capabilities ?? {
      storyAndScript: true,
      multimodalImageAnalysis: true,
      storyboardImageGeneration: false,
      videoGeneration: false,
    }
  );
}

export async function requestSceneVideoGeneration(params: {
  sceneNumber: number;
  sceneHeading: string;
  storyboardPrompt?: string;
}): Promise<{videoUrl: string; durationSec?: number}> {
  return postStudioEndpoint<{videoUrl: string; durationSec?: number}>(
    '/api/studio/generate-video',
    params,
  );
}

async function postStudioEndpoint<T>(endpoint: string, payload: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {error?: string} & T;
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}.`);
  }
  return data;
}

export async function analyzeReferenceImage(params: {
  image: ProjectReferenceImage;
  filmContext?: string;
}): Promise<ImageAnalysisResult> {
  const data = await postStudioEndpoint<{analysis: ImageAnalysisResult}>(
    '/api/studio/analyze-image',
    {
      dataUrl: params.image.dataUrl,
      mimeType: params.image.mimeType,
      category: params.image.category,
      name: params.image.name,
      notes: params.image.notes,
      filmContext: params.filmContext,
    },
  );
  return data.analysis;
}

export async function generateStoryFromBrief(
  brief: StoryBrief,
  refinementNote?: string,
  referenceImages?: ProjectReferenceImage[],
): Promise<DevelopedStory> {
  const data = await postStudioEndpoint<{story: DevelopedStory}>(
    '/api/studio/generate-story',
    {brief, refinementNote, referenceImages},
  );
  return data.story;
}

export async function generateScreenplayScenes(params: {
  brief: StoryBrief;
  story: DevelopedStory;
  characters?: CharacterProfile[];
  targetSceneNumber?: number;
  directorNote?: string;
  existingSceneCount?: number;
  referenceImages?: ProjectReferenceImage[];
}): Promise<ScreenplayScene[]> {
  const data = await postStudioEndpoint<{
    scenes: Array<
      Omit<ScreenplayScene, 'id' | 'elements'> & {
        elements: Array<{type: ScreenplayScene['elements'][number]['type']; text: string}>;
      }
    >;
  }>('/api/studio/generate-screenplay', params);

  return data.scenes.map((scene, idx) => ({
    ...scene,
    id: `scene-${scene.sceneNumber}-${Date.now()}-${idx}`,
    elements: (scene.elements || []).map((el, elIdx) => ({
      ...el,
      id: `el-${scene.sceneNumber}-${elIdx}-${Date.now()}`,
    })),
  }));
}

export async function generateCharacterProfiles(params: {
  brief: StoryBrief;
  story: DevelopedStory;
  customAgeSpecs?: string;
  referenceImages?: ProjectReferenceImage[];
}): Promise<CharacterProfile[]> {
  const data = await postStudioEndpoint<{
    characters: Array<Omit<CharacterProfile, 'id'>>;
  }>('/api/studio/generate-characters', params);

  return data.characters.map((char, idx) => ({
    ...char,
    id: `char-${Date.now()}-${idx}`,
  }));
}

export async function generateStoryboardPlan(params: {
  brief: StoryBrief;
  scenes: ScreenplayScene[];
  targetSceneNumber?: number;
  referenceImages?: ProjectReferenceImage[];
}): Promise<StoryboardScenePlan[]> {
  const data = await postStudioEndpoint<{
    storyboard: Array<{
      sceneNumber: number;
      sceneTitle: string;
      sceneDescription: string;
      shots: Array<Omit<StoryboardScenePlan['shots'][number], 'id'>>;
    }>;
  }>('/api/studio/generate-storyboard', params);

  return data.storyboard.map((sb, idx) => ({
    ...sb,
    id: `sb-scene-${sb.sceneNumber}-${Date.now()}-${idx}`,
    shots: (sb.shots || []).map((shot, sIdx) => ({
      ...shot,
      id: `shot-${sb.sceneNumber}-${sIdx}-${Date.now()}`,
    })),
  }));
}

export async function generateProductionBreakdown(params: {
  brief: StoryBrief;
  story: DevelopedStory;
  scenes: ScreenplayScene[];
  characters: CharacterProfile[];
}): Promise<ProductionPlan> {
  const data = await postStudioEndpoint<{production: ProductionPlan}>(
    '/api/studio/generate-production',
    params,
  );
  return data.production;
}
