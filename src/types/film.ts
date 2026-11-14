export type StudioSection =
  | 'dashboard'
  | 'workflow'
  | 'story'
  | 'screenplay'
  | 'characters'
  | 'storyboard'
  | 'production'
  | 'gallery'
  | 'export';

export type ReferenceImageCategory =
  | 'Character Reference'
  | 'Location Reference'
  | 'Costume Reference'
  | 'Props Reference'
  | 'Scene Inspiration'
  | 'Cinematic Style Reference';

export interface ImageAnalysisResult {
  visualSummary: string;
  characterAppearanceNotes: string;
  costumeAndStylingNotes: string;
  settingAndAtmosphere: string;
  cinematicComposition: string;
  analyzedAt: string;
}

export interface ProjectReferenceImage {
  id: string;
  name: string;
  category: ReferenceImageCategory;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
  notes?: string;
  analysisStatus: 'idle' | 'analyzing' | 'analyzed' | 'error';
  analysisError?: string;
  aiAnalysis?: ImageAnalysisResult;
  createdAt: string;
}

export interface StoryBrief {
  title: string;
  originalIdea: string;
  genre: string;
  language: string;
  duration: string;
  setting: string;
  targetAudience: string;
  storytellingStyle: string;
  characterAgesHint?: string;
}

export interface DevelopedStory {
  suggestedTitle?: string;
  logline: string;
  synopsis: string;
  beginning: string;
  middle: string;
  ending: string;
  mainCharactersSummary: string;
  centralConflict: string;
  themes: string;
  emotionalImpact: string;
}

export type ScreenplayElementType =
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition';

export interface ScreenplayElement {
  id: string;
  type: ScreenplayElementType;
  text: string;
}

export interface ScreenplayScene {
  id: string;
  sceneNumber: number;
  intExt: 'INT.' | 'EXT.' | 'INT./EXT.';
  location: string;
  timeOfDay: string;
  transition?: string;
  elements: ScreenplayElement[];
}

export interface CharacterProfile {
  id: string;
  name: string;
  age: string;
  role: string;
  personality: string;
  background: string;
  motivation: string;
  relationships: string;
  arc: string;
  visualAppearance: string;
  costumeNotes: string;
}

export interface StoryboardShot {
  id: string;
  shotNumber: string;
  shotType: string;
  cameraAngle: string;
  cameraMovement: string;
  lightingDirection: string;
  atmosphere: string;
  visualComposition: string;
  soundAndMusic: string;
  visualStoryboardPrompt: string;
  previewImage?: string;
}

export interface StoryboardScenePlan {
  id: string;
  sceneNumber: number;
  sceneTitle: string;
  sceneDescription: string;
  shots: StoryboardShot[];
}

export interface ProductionActorRequirement {
  characterName: string;
  ageRange: string;
  roleType: string;
  castingNotes: string;
}

export interface ProductionLocationRequirement {
  name: string;
  environment: string;
  logistics: string;
}

export interface ProductionSceneRequirement {
  sceneNumber: number;
  heading: string;
  keyNeeds: string;
}

export interface ProductionPlan {
  requiredActors: ProductionActorRequirement[];
  locations: ProductionLocationRequirement[];
  props: string[];
  costumes: string[];
  equipmentSuggestions: string[];
  sceneRequirements: ProductionSceneRequirement[];
  estimatedComplexity: string;
  complexityRationale: string;
  estimatedShootDays: string;
}

export interface SceneVideoClip {
  sceneNumber: number;
  status: 'not_generated' | 'playable';
  label: string;
  videoUrl?: string;
  durationSec?: number;
}

export interface FilmProject {
  id: string;
  isSample?: boolean;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  geminiGenerations?: number;
  brief: StoryBrief;
  story: DevelopedStory | null;
  screenplay: ScreenplayScene[];
  characters: CharacterProfile[];
  storyboard: StoryboardScenePlan[];
  production: ProductionPlan | null;
  referenceImages?: ProjectReferenceImage[];
  videoClips?: SceneVideoClip[];
}
