import type {FilmProject} from '../types/film';

export function formatProjectAsDossier(project: FilmProject): string {
  const lines: string[] = [];
  const divider = '====================================================================';

  lines.push(divider);
  lines.push(`MARBRECAL AI – STORY-TO-FILM STUDIO`);
  lines.push(`Developed by MARDIA STUDIO`);
  lines.push(`"Your Story. Your Vision. Your Film."`);
  lines.push(divider);
  lines.push('');
  lines.push(`PROJECT TITLE: ${project.brief.title.toUpperCase()}`);
  lines.push(`GENRE: ${project.brief.genre}`);
  lines.push(`LANGUAGE: ${project.brief.language}`);
  lines.push(`TARGET DURATION: ${project.brief.duration}`);
  lines.push(`SETTING: ${project.brief.setting}`);
  lines.push(`TARGET AUDIENCE: ${project.brief.targetAudience}`);
  lines.push(`STYLE: ${project.brief.storytellingStyle}`);
  lines.push(`LAST UPDATED: ${new Date(project.updatedAt).toLocaleString()}`);
  lines.push('');

  if (project.story) {
    lines.push('--- 1. STORY DEVELOPMENT ---');
    lines.push('');
    lines.push(`LOGLINE:\n${project.story.logline}\n`);
    lines.push(`SYNOPSIS:\n${project.story.synopsis}\n`);
    lines.push(`ACT I (BEGINNING):\n${project.story.beginning}\n`);
    lines.push(`ACT II (MIDDLE):\n${project.story.middle}\n`);
    lines.push(`ACT III (ENDING):\n${project.story.ending}\n`);
    lines.push(`CENTRAL CONFLICT:\n${project.story.centralConflict}\n`);
    lines.push(`THEMES:\n${project.story.themes}\n`);
    lines.push(`INTENDED EMOTIONAL IMPACT:\n${project.story.emotionalImpact}\n`);
  }

  if (project.characters.length > 0) {
    lines.push('--- 2. CHARACTER DOSSIERS ---');
    lines.push('');
    for (const char of project.characters) {
      lines.push(`${char.name.toUpperCase()} (Age ${char.age}) — ${char.role}`);
      lines.push(`Personality: ${char.personality}`);
      lines.push(`Background: ${char.background}`);
      lines.push(`Motivation: ${char.motivation}`);
      lines.push(`Relationships: ${char.relationships}`);
      lines.push(`Arc: ${char.arc}`);
      lines.push(`Visual Appearance: ${char.visualAppearance}`);
      lines.push(`Costume & Styling: ${char.costumeNotes}`);
      lines.push('');
    }
  }

  if (project.screenplay.length > 0) {
    lines.push('--- 3. SCREENPLAY ---');
    lines.push('');
    for (const scene of project.screenplay) {
      lines.push(`SCENE ${scene.sceneNumber}   ${scene.intExt} ${scene.location} - ${scene.timeOfDay}`);
      lines.push('');
      for (const el of scene.elements) {
        if (el.type === 'action') {
          lines.push(el.text);
          lines.push('');
        } else if (el.type === 'character') {
          lines.push(`                    ${el.text.toUpperCase()}`);
        } else if (el.type === 'parenthetical') {
          lines.push(`                 (${el.text.replace(/^\(|\)$/g, '')})`);
        } else if (el.type === 'dialogue') {
          lines.push(`          ${el.text}`);
          lines.push('');
        } else if (el.type === 'transition') {
          lines.push(`                                        ${el.text.toUpperCase()}`);
          lines.push('');
        }
      }
      if (scene.transition) {
        lines.push(`                                        ${scene.transition.toUpperCase()}`);
        lines.push('');
      }
    }
  }

  if (project.storyboard.length > 0) {
    lines.push('--- 4. CINEMATIC STORYBOARD PLAN ---');
    lines.push('');
    for (const sb of project.storyboard) {
      lines.push(`SCENE ${sb.sceneNumber}: ${sb.sceneTitle}`);
      lines.push(`Description: ${sb.sceneDescription}`);
      for (const shot of sb.shots) {
        lines.push(
          `  [SHOT ${shot.shotNumber}] ${shot.shotType} | Angle: ${shot.cameraAngle} | Movement: ${shot.cameraMovement}`,
        );
        lines.push(`    Lighting: ${shot.lightingDirection}`);
        lines.push(`    Atmosphere: ${shot.atmosphere}`);
        lines.push(`    Composition: ${shot.visualComposition}`);
        lines.push(`    Sound & Music: ${shot.soundAndMusic}`);
        lines.push(`    Visual Prompt: ${shot.visualStoryboardPrompt}`);
      }
      lines.push('');
    }
  }

  if (project.production) {
    lines.push('--- 5. PRODUCTION PLANNING BREAKDOWN ---');
    lines.push('');
    lines.push(
      `ESTIMATED COMPLEXITY: ${project.production.estimatedComplexity} (${project.production.estimatedShootDays})`,
    );
    lines.push(`RATIONALE: ${project.production.complexityRationale}\n`);

    lines.push('CASTING REQUIREMENTS:');
    for (const actor of project.production.requiredActors) {
      lines.push(
        `- ${actor.characterName} (${actor.roleType}, Age ${actor.ageRange}): ${actor.castingNotes}`,
      );
    }
    lines.push('');

    lines.push('LOCATIONS:');
    for (const loc of project.production.locations) {
      lines.push(`- ${loc.name} [${loc.environment}]: ${loc.logistics}`);
    }
    lines.push('');

    lines.push(`PROPS: ${project.production.props.join('; ')}`);
    lines.push(`COSTUMES: ${project.production.costumes.join('; ')}`);
    lines.push(`EQUIPMENT: ${project.production.equipmentSuggestions.join('; ')}`);
    lines.push('');
  }

  lines.push(divider);
  lines.push('MARBRECAL AI – An AI Filmmaking Studio by MARDIA STUDIO.');
  lines.push(divider);

  return lines.join('\n');
}

export function formatScreenplayOnly(project: FilmProject): string {
  const lines: string[] = [];
  lines.push(`${project.brief.title.toUpperCase()} — SCREENPLAY`);
  lines.push(`MARBRECAL AI – STORY-TO-FILM STUDIO | MARDIA STUDIO`);
  lines.push(`Genre: ${project.brief.genre} | Language: ${project.brief.language} | Duration: ${project.brief.duration}`);
  lines.push('====================================================================');
  lines.push('');

  if (project.screenplay.length === 0) {
    lines.push('No screenplay scenes have been generated yet.');
  } else {
    for (const scene of project.screenplay) {
      lines.push(`SCENE ${scene.sceneNumber}   ${scene.intExt} ${scene.location} - ${scene.timeOfDay}`);
      lines.push('');
      for (const el of scene.elements) {
        if (el.type === 'action') {
          lines.push(el.text);
          lines.push('');
        } else if (el.type === 'character') {
          lines.push(`                    ${el.text.toUpperCase()}`);
        } else if (el.type === 'parenthetical') {
          lines.push(`                 (${el.text.replace(/^\(|\)$/g, '')})`);
        } else if (el.type === 'dialogue') {
          lines.push(`          ${el.text}`);
          lines.push('');
        } else if (el.type === 'transition') {
          lines.push(`                                        ${el.text.toUpperCase()}`);
          lines.push('');
        }
      }
      if (scene.transition) {
        lines.push(`                                        ${scene.transition.toUpperCase()}`);
        lines.push('');
      }
    }
  }
  return lines.join('\n');
}

export function formatProductionPlanOnly(project: FilmProject): string {
  const lines: string[] = [];
  lines.push(`${project.brief.title.toUpperCase()} — PRODUCTION PLAN`);
  lines.push(`MARBRECAL AI – STORY-TO-FILM STUDIO | MARDIA STUDIO`);
  lines.push('====================================================================');
  lines.push('');

  if (!project.production) {
    lines.push('No production plan has been generated yet.');
    return lines.join('\n');
  }

  lines.push(
    `ESTIMATED COMPLEXITY: ${project.production.estimatedComplexity} (${project.production.estimatedShootDays})`,
  );
  lines.push(`RATIONALE: ${project.production.complexityRationale}`);
  lines.push('');
  lines.push('CASTING REQUIREMENTS:');
  for (const actor of project.production.requiredActors) {
    lines.push(
      `- ${actor.characterName} (${actor.roleType}, Age ${actor.ageRange}): ${actor.castingNotes}`,
    );
  }
  lines.push('');
  lines.push('LOCATIONS:');
  for (const loc of project.production.locations) {
    lines.push(`- ${loc.name} [${loc.environment}]: ${loc.logistics}`);
  }
  lines.push('');
  lines.push(`PROPS: ${project.production.props.join('; ')}`);
  lines.push(`COSTUMES: ${project.production.costumes.join('; ')}`);
  lines.push(`EQUIPMENT: ${project.production.equipmentSuggestions.join('; ')}`);
  lines.push('');
  lines.push('PER-SCENE REQUIREMENTS:');
  for (const sr of project.production.sceneRequirements) {
    lines.push(`- Scene ${sr.sceneNumber} (${sr.heading}): ${sr.keyNeeds}`);
  }

  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], {type: `${mimeType};charset=utf-8`});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
