import type {FilmProject} from '../types/film';

export const HERO_STUDIO_IMAGE = '/src/assets/images/hero_cinema_stage_1794639961439.jpg';
export const SAMPLE_ESTABLISHING_IMAGE =
  '/src/assets/images/sample_promise_establishing_1794639961714.jpg';
export const SAMPLE_COURTYARD_IMAGE =
  '/src/assets/images/sample_promise_courtyard_1794639961651.jpg';

export const SAMPLE_PROJECT_LAST_PROMISE: FilmProject = {
  id: 'sample-the-last-promise',
  isSample: true,
  coverImage: SAMPLE_ESTABLISHING_IMAGE,
  createdAt: '2026-11-10T09:00:00.000Z',
  updatedAt: '2026-11-13T18:30:00.000Z',
  geminiGenerations: 0,
  brief: {
    title: 'THE LAST PROMISE',
    originalIdea:
      'In a West African coastal fishing town threatened by a commercial deep-water port expansion, an aging master canoe carver refuses to sell his ancestral lagoon workshop despite mounting community debt, forcing his estranged daughter—a civil engineer hired to survey the new harbor—to choose between progress and a deathbed vow made to her late mother.',
    genre: 'Drama / Cultural Cinema',
    language: 'English & Fante',
    duration: '105 minutes',
    setting: 'Elmina Coastline & Benya Lagoon, Ghana',
    targetAudience: 'International Festival & Pan-African Drama Audience',
    storytellingStyle: 'Poetic Realism with Intimate Natural Light',
    characterAgesHint: 'Kojo Mensah (58), Ama Mensah (24), Kwesi Boateng (43), Nana Efua (71)',
  },
  story: {
    logline:
      'When a marine engineering firm targets her coastal hometown for a commercial harbor, a young surveyor must reconcile with her stubborn boatbuilder father before his ancestral lagoon—and the last promise made to her dying mother—are erased beneath concrete.',
    synopsis:
      'Along the salt-washed shores of Elmina, 58-year-old KOJO MENSAH is one of the last artisans carving seaworthy wooden pirogues by hand. For twelve years, he has kept a silent vow made to his late wife: never to surrender the mangrove lagoon where their family buried her memory, even as rising tides and industrial trawlers starve the local fleet.\n\nHis daughter AMA MENSAH (24), who left the coast on an engineering scholarship, returns wearing a surveyor’s vest for Atlantic Corridor Ventures. Tasked with mapping the Benya Lagoon for dredging, Ama expects to rescue the town through modern jobs and a funded clinic. Instead, she confronts a father who views her blueprints as betrayal—and a harbor developer, KWESI BOATENG (43), quietly cutting corners on environmental safeguards.\n\nAs storm season approaches and elders divide over compensation payouts, Ama uncovers falsified coastal erosion reports hidden by Kwesi. Caught between her career, the town’s urgent survival, and her father’s final carved vessel, Ama must orchestrate an uneasy alliance—proving that honoring heritage and building a future belong to the same tide.',
    beginning:
      'Dusk settles over the Benya Lagoon as Kojo inspects the hull of his final hand-carved pirogue by lantern light. Across town, Ama arrives after four years away, carrying survey instruments and the quiet hope of reconciling with her father while securing the harbor contract that will fund the village clinic.',
    middle:
      'Tension erupts in the family courtyard when Kojo learns Ama works for Kwesi Boateng’s development consortium. While surveying the mangrove roots, Ama discovers altered hydrographic data showing the concrete breakwater will flood the lower settlement within five winters. Kwesi pressures her to bury the addendum before the elders’ final vote.',
    ending:
      'During the stormy dawn assembly at the pier, Ama places the true erosion charts before the council alongside her mother’s brass sea-lantern. Rather than halting development altogether, she proposes a protected mangrove-buffer harbor redesign that spares the boatyard. Kojo launches his final canoe into the breaking light, finally stepping onto the pier beside his daughter.',
    mainCharactersSummary:
      'Kojo Mensah (58, master canoe carver bound by grief and honor); Ama Mensah (24, sharp-minded coastal engineer torn between modernity and lineage); Kwesi Boateng (43, pragmatic harbor consortium director chasing regional prestige); Nana Efua (71, community elder and keeper of lagoon oral history).',
    centralConflict:
      'Can a community survive economic collapse without erasing the ecological and spiritual lineage that defines it—and can a father and daughter forgive each other across a generational divide?',
    themes:
      'Intergenerational duty, ecological stewardship vs. extractive progress, grief transformed into legacy, and the quiet dignity of craft.',
    emotionalImpact:
      'Intimate, deeply rooted, and cathartic—leaving audiences with the salt-air ache of reconciliation and reverence for coastal heritage.',
  },
  characters: [
    {
      id: 'char-kojo',
      name: 'Kojo Mensah',
      age: '58',
      role: 'Protagonist (The Master Boatbuilder)',
      personality:
        'Stoic, meticulous, fiercely proud, speaks rarely but every sentence carries weight. Masks deep tenderness behind gruff discipline.',
      background:
        'Third-generation canoe carver trained by his uncle along the Gold Coast. Lost his wife Akosua twelve years ago during a difficult childbirth after the local clinic lacked power.',
      motivation:
        'Keep his deathbed promise to Akosua to protect the lagoon mangroves and finish carving one last vessel worthy of carrying her name.',
      relationships:
        'Deeply fractured yet aching bond with daughter Ama; quietly respected by elder Nana Efua; openly adversarial toward developer Kwesi Boateng.',
      arc: 'Shifts from rigid isolation and survivor’s guilt to trusting Ama’s vision and releasing the past without abandoning his craft.',
      visualAppearance:
        'Weathered broad shoulders, silver-flecked short beard, sawdust permanently caught in his knuckles, steady dark eyes that read tides before people.',
      costumeNotes:
        'Faded indigo cotton work shirt rolled to the elbows, hand-woven wrap cloth worn over canvas trousers, leather adze belt, bare feet on sand.',
    },
    {
      id: 'char-ama',
      name: 'Ama Mensah',
      age: '24',
      role: 'Co-Protagonist (The Coastal Engineer)',
      personality:
        'Analytical, fiercely determined, impatient with fatalism, yet secretly hungry for her father’s approval.',
      background:
        'Earned a civil engineering degree in Accra after her mother’s preventable death drove her to believe modern infrastructure is the only true protection.',
      motivation:
        'Bring a reliable deep-water clinic jetty and storm seawall to Elmina while proving to Kojo that leaving home was an act of love, not abandonment.',
      relationships:
        'Strained loyalty toward Kojo; mentored professionally by Kwesi Boateng until his ethics fracture; confidante to Nana Efua.',
      arc: 'Discovers that technical efficiency without local memory becomes violence; learns to fuse engineering rigor with ancestral stewardship.',
      visualAppearance:
        'Tall, poised, braided hair pulled back under a sunlit yellow hard hat during fieldwork, focused gaze, calloused hands that know both compass and oar.',
      costumeNotes:
        'Olive field chinos, crisp sweat-stained linen shirt, reflective surveyor vest in harbor scenes, transitioning to warm terracotta cotton dress at dusk.',
    },
    {
      id: 'char-kwesi',
      name: 'Kwesi Boateng',
      age: '43',
      role: 'Antagonist (Consortium Project Director)',
      personality:
        'Charismatic, persuasive, immaculate under pressure, genuinely believes big capital is the fastest mercy for neglected towns.',
      background:
        'Rose from modest inland beginnings to head regional infrastructure deals; views sentimentality as a luxury poor towns cannot afford.',
      motivation:
        'Deliver the Elmina deep-water port ahead of schedule to secure ministerial backing—at any environmental cost.',
      relationships:
        'Recruited Ama as his hometown bridge; treats Kojo as an archaic obstacle to be bought out.',
      arc: 'Unravels when technical evidence exposes his shortcuts, forced into public accountability before the town council.',
      visualAppearance:
        'Tailored slate-gray linen suit even in coastal humidity, gold wristwatch, polished loafers dusted with red coastal clay.',
      costumeNotes:
        'Structured charcoal blazer over open-collar white shirt, tortoiseshell glasses, leather folio.',
    },
    {
      id: 'char-efua',
      name: 'Nana Efua',
      age: '71',
      role: 'Mentor & Community Anchor (Lagoon Elder)',
      personality:
        'Warm, razor-sharp memory, humorous when tension runs high, uncompromising when truth is at stake.',
      background:
        'Former fishmonger guild leader who helped raise Ama after Akosua passed; knows every family’s history along the bay.',
      motivation:
        'Prevent the town from tearing itself apart between hunger and heritage.',
      relationships:
        'Moral compass for both Kojo and Ama; speaks plainly to Kwesi without fear.',
      arc: 'Bridges the final council assembly, ensuring the elders hear Ama’s truth.',
      visualAppearance:
        'Regal posture, silver-braided crown wrapped in indigo-and-gold cloth, expressive hands adorned with brass bangles.',
      costumeNotes:
        'Deep ochre and navy printed wax wrapper, heirloom coral necklace, woven market shawl.',
    },
  ],
  screenplay: [
    {
      id: 'scene-1',
      sceneNumber: 1,
      intExt: 'EXT.',
      location: 'BENYA LAGOON SHORELINE',
      timeOfDay: 'DUSK',
      transition: 'CUT TO:',
      elements: [
        {
          id: 's1-e1',
          type: 'action',
          text: 'Amber light bleeds across calm tidal flats. Half-built wooden pirogues rest like sleeping ribs along the wet sand. At the water’s edge, KOJO MENSAH (58) stands beside a weathered canoe painted SEA QUEEN, holding a glowing brass kerosene lantern.',
        },
        {
          id: 's1-e2',
          type: 'action',
          text: 'He lowers the lantern toward the cedar hull, his thumb tracing a fresh chisel mark along the prow. Distant engine rumble echoes from the highway ridge—modern, impatient.',
        },
        {
          id: 's1-e3',
          type: 'character',
          text: 'NANA EFUA (O.S.)',
        },
        {
          id: 's1-e4',
          type: 'dialogue',
          text: 'The tide has already turned, Kojo. You are still reading yesterday’s water.',
        },
        {
          id: 's1-e5',
          type: 'action',
          text: 'NANA EFUA (71) steps down the timber ramp carrying two enamel bowls wrapped in cloth. Kojo does not look up.',
        },
        {
          id: 's1-e6',
          type: 'character',
          text: 'KOJO',
        },
        {
          id: 's1-e7',
          type: 'dialogue',
          text: 'Wood remembers the storm longer than concrete ever will.',
        },
        {
          id: 's1-e8',
          type: 'action',
          text: 'Headlights sweep across the coconut palms above the ridge. A white 4x4 survey truck slows near the boatyard gate. Kojo’s jaw tightens.',
        },
      ],
    },
    {
      id: 'scene-2',
      sceneNumber: 2,
      intExt: 'EXT.',
      location: 'MENSAH FAMILY COURTYARD',
      timeOfDay: 'NIGHT',
      transition: 'DISSOLVE TO:',
      elements: [
        {
          id: 's2-e1',
          type: 'action',
          text: 'A single kerosene lamp flickers on a low wooden table, casting tall shadows across clay walls hung with woven baskets and drying nets. AMA MENSAH (24) sits opposite Kojo, a rolled blueprint tube resting untouched beside her untouched bowl.',
        },
        {
          id: 's2-e2',
          type: 'character',
          text: 'AMA',
        },
        {
          id: 's2-e3',
          type: 'parenthetical',
          text: '(quiet, steady)',
        },
        {
          id: 's2-e4',
          type: 'dialogue',
          text: 'The clinic generator failed twice last month, Papa. With the deep-water jetty, power lines reach the lower ward before rainy season.',
        },
        {
          id: 's2-e5',
          type: 'character',
          text: 'KOJO',
        },
        {
          id: 's2-e6',
          type: 'dialogue',
          text: 'And where do the fishermen land when your consortium walls off the mouth of the lagoon?',
        },
        {
          id: 's2-e7',
          type: 'character',
          text: 'AMA',
        },
        {
          id: 's2-e8',
          type: 'dialogue',
          text: 'We built compensation stalls into the east basin—',
        },
        {
          id: 's2-e9',
          type: 'character',
          text: 'KOJO',
        },
        {
          id: 's2-e10',
          type: 'dialogue',
          text: 'I did not ask for stalls, Ama. I gave your mother my word on this sand.',
        },
        {
          id: 's2-e11',
          type: 'action',
          text: 'Silence drops heavy as smoke curling from the clay hearth. Ama pulls the brass lantern closer, studying the worn initials carved into its base.',
        },
      ],
    },
    {
      id: 'scene-3',
      sceneNumber: 3,
      intExt: 'INT.',
      location: 'PORT SURVEY TRAILER',
      timeOfDay: 'DAY',
      transition: 'CUT TO:',
      elements: [
        {
          id: 's3-e1',
          type: 'action',
          text: 'Harsh fluorescent light hums over metal desks crowded with tidal charts. Ama compares two bathymetric printouts side by side, circling red elevation numbers with a trembling pen.',
        },
        {
          id: 's3-e2',
          type: 'action',
          text: 'KWESI BOATENG (43) enters, unbuttoning his charcoal blazer, effortlessly calm.',
        },
        {
          id: 's3-e3',
          type: 'character',
          text: 'KWESI',
        },
        {
          id: 's3-e4',
          type: 'dialogue',
          text: 'The elders convene at dawn. Sign off on Revision Four and the Ministry releases the clinic grant by Friday.',
        },
        {
          id: 's3-e5',
          type: 'character',
          text: 'AMA',
        },
        {
          id: 's3-e6',
          type: 'dialogue',
          text: 'Revision Four removes the eastern mangrove surge data. If we dredge past three meters without the buffer channel, spring tides will flood forty homes.',
        },
        {
          id: 's3-e7',
          type: 'character',
          text: 'KWESI',
        },
        {
          id: 's3-e8',
          type: 'parenthetical',
          text: '(leaning in)',
        },
        {
          id: 's3-e9',
          type: 'dialogue',
          text: 'You came home to save your town, Ama. Do not drown it in paperwork.',
        },
      ],
    },
    {
      id: 'scene-4',
      sceneNumber: 4,
      intExt: 'EXT.',
      location: 'TIMBER PIER & LAGOON MOUTH',
      timeOfDay: 'DAWN',
      transition: 'FADE OUT.',
      elements: [
        {
          id: 's4-e1',
          type: 'action',
          text: 'Sea mist curls over silver dawn water. Town elders, fishermen, and Kwesi’s team gather along the timber pier. Ama steps forward, spreading BOTH blueprints across the weathered planks—weighing the edges down with her father’s iron plane and the brass lantern.',
        },
        {
          id: 's4-e2',
          type: 'character',
          text: 'AMA',
        },
        {
          id: 's4-e3',
          type: 'dialogue',
          text: 'We do not have to bury the lagoon to build the jetty. Keep the mangrove spine intact—and route the cargo berth half a kilometer west.',
        },
        {
          id: 's4-e4',
          type: 'action',
          text: 'Murmurs ripple through the crowd. Nana Efua nods slowly. At the shoreline, Kojo’s newly finished canoe slides into the brightening tide. He steps onto the pier beside Ama, resting one sawdust-dusted hand briefly on her shoulder.',
        },
      ],
    },
  ],
  storyboard: [
    {
      id: 'sb-scene-1',
      sceneNumber: 1,
      sceneTitle: 'The Lantern at Low Tide',
      sceneDescription:
        'Establishing the coastal world, Kojo’s devotion to traditional craft, and the encroaching shadow of industrial harbor development.',
      shots: [
        {
          id: 'shot-1a',
          shotNumber: '1A',
          shotType: 'Wide Establishing',
          cameraAngle: 'Eye-Level Horizon',
          cameraMovement: 'Slow Dolly Push-In',
          lightingDirection:
            'Natural golden-hour dusk backlight with warm practical lantern key light on Kojo.',
          atmosphere: 'Salt mist, tranquil reflection, quiet foreboding.',
          visualComposition:
            'Rule-of-thirds placement: weathered wooden boat anchors the left foreground, Kojo and brass lantern centered near the waterline, glowing sunset horizon stretching right.',
          soundAndMusic:
            'Gentle ocean wash, distant wooden hull creak, sparse solo kora harmonic drone.',
          visualStoryboardPrompt:
            'Cinematic 35mm anamorphic wide shot of a West African coastal fishing shore at dusk, elder craftsman standing beside a hand-painted wooden pirogue holding a glowing brass lantern, golden sunlight piercing coastal mist, deep charcoal shadows.',
          previewImage: SAMPLE_ESTABLISHING_IMAGE,
        },
        {
          id: 'shot-1b',
          shotNumber: '1B',
          shotType: 'Close-Up',
          cameraAngle: 'Slightly Low Angle',
          cameraMovement: 'Static Handheld Micro-Breath',
          lightingDirection:
            'Warm amber lantern under-lighting catching calloused fingers and carved cedar grain.',
          atmosphere: 'Intimate, tactile, reverent.',
          visualComposition:
            'Shallow depth of field framing Kojo’s weathered hands running along the boat prow while out-of-focus truck headlights flare along the upper ridge.',
          soundAndMusic:
            'Dry palm scraping cedar wood, low distant diesel rumble entering from off-screen.',
          visualStoryboardPrompt:
            'Close-up cinematic frame on weathered artisan hands tracing freshly carved wood grain lit by warm kerosene lantern light, distant vehicle headlights blurred in twilight palm silhouettes behind.',
        },
      ],
    },
    {
      id: 'sb-scene-2',
      sceneNumber: 2,
      sceneTitle: 'Blueprints by Kerosene Light',
      sceneDescription:
        'Father and daughter face off across twelve years of unspoken grief and competing ideas of survival.',
      shots: [
        {
          id: 'shot-2a',
          shotNumber: '2A',
          shotType: 'Medium Wide Two-Shot',
          cameraAngle: 'Eye-Level Tabletop',
          cameraMovement: 'Slow Lateral Track',
          lightingDirection:
            'Single central practical kerosene lamp casting warm chiaroscuro across adobe courtyard walls.',
          atmosphere: 'Intimate, tense, smoky twilight stillness.',
          visualComposition:
            'Symmetrical courtyard framing with carved wooden doorway behind; kerosene lamp sits directly between Kojo and Ama, dividing light and shadow.',
          soundAndMusic:
            'Crackling charcoal hearth, soft night insects, tense silence between lines.',
          visualStoryboardPrompt:
            'Cinematic film still of an African family courtyard at twilight, central glowing kerosene lamp on a low wooden table illuminating adobe walls and carved wooden doorway, dramatic chiaroscuro shadows, atmospheric hearth smoke.',
          previewImage: SAMPLE_COURTYARD_IMAGE,
        },
        {
          id: 'shot-2b',
          shotNumber: '2B',
          shotType: 'Over-the-Shoulder Medium Close-Up',
          cameraAngle: 'Eye-Level',
          cameraMovement: 'Static Locked Frame',
          lightingDirection: 'Warm amber key from lamp left, cool twilight blue rim on shoulders.',
          atmosphere: 'Emotional restraint breaking under quiet pressure.',
          visualComposition:
            'Kojo’s shoulder softens the left edge while Ama’s determined face fills the right third, blueprint tube lying diagonally across the foreground.',
          soundAndMusic:
            'Soft intake of breath, muted cello swell under Kojo’s line about the promise.',
          visualStoryboardPrompt:
            'Over-the-shoulder medium close-up of a young African woman engineer across a dimly lit wooden table, warm oil lamp glow on her face, cool dusk twilight rim light, shallow 50mm lens bokeh.',
        },
      ],
    },
    {
      id: 'sb-scene-3',
      sceneNumber: 3,
      sceneTitle: 'The Altered Charts',
      sceneDescription:
        'Inside the sterile harbor trailer, Ama uncovers Kwesi’s buried flood projections.',
      shots: [
        {
          id: 'shot-3a',
          shotNumber: '3A',
          shotType: 'High-Angle Insert to Medium',
          cameraAngle: 'High Angle Tilting Up',
          cameraMovement: 'Tilt Up & Push',
          lightingDirection:
            'Cool clinical overhead fluorescent tubes contrasting sharply against prior warm lagoon tones.',
          atmosphere: 'Claustrophobic, bureaucratic tension.',
          visualComposition:
            'Overhead shot of red-inked hydrographic elevation lines tilting up to reveal Kwesi blocking the trailer doorway.',
          soundAndMusic:
            'Fluorescent ballast hum, sharp paper rustle, heavy steel door latch.',
          visualStoryboardPrompt:
            'High-angle cinematic shot moving from red-annotated coastal bathymetric charts on a metal desk up to an African female engineer confronting a suited executive in a fluorescent-lit field trailer.',
        },
      ],
    },
    {
      id: 'sb-scene-4',
      sceneNumber: 4,
      sceneTitle: 'The Dawn Redesign',
      sceneDescription:
        'Public reckoning on the pier as heritage and engineering converge in the breaking morning light.',
      shots: [
        {
          id: 'shot-4a',
          shotNumber: '4A',
          shotType: 'Wide Crane Rise',
          cameraAngle: 'Eye-Level Rising to High Angle',
          cameraMovement: 'Smooth Crane Ascent',
          lightingDirection:
            'Crisp cool dawn mist breaking into warm golden morning sunbeams over the lagoon.',
          atmosphere: 'Cathartic, expansive, hopeful.',
          visualComposition:
            'Ama and Kojo stand shoulder to shoulder on the timber pier in the foreground as the hand-carved canoe glides into open sunlit water beyond.',
          soundAndMusic:
            'Full swell of acoustic strings, traditional talking drum pulse, seabirds lifting off the tide.',
          visualStoryboardPrompt:
            'Cinematic dawn crane shot rising over a coastal timber pier in Ghana, father and daughter standing beside unrolled blueprints weighed by a brass lantern while a wooden canoe glides across golden morning mist.',
        },
      ],
    },
  ],
  production: {
    requiredActors: [
      {
        characterName: 'Kojo Mensah',
        ageRange: '55–62',
        roleType: 'Lead Male',
        castingNotes:
          'Requires authentic Fante/English cadence, physical comfort handling carpentry tools, and commanding quiet presence.',
      },
      {
        characterName: 'Ama Mensah',
        ageRange: '22–27',
        roleType: 'Lead Female',
        castingNotes:
          'Bilingual English & Fante; balances technical authority with vulnerable emotional restraint.',
      },
      {
        characterName: 'Kwesi Boateng',
        ageRange: '40–48',
        roleType: 'Supporting Antagonist',
        castingNotes:
          'Polished corporate poise without caricature; persuasive charm that makes his compromise unsettling.',
      },
      {
        characterName: 'Nana Efua',
        ageRange: '68–76',
        roleType: 'Supporting Elder',
        castingNotes:
          'Warm matriarchal gravity and natural comedic timing; anchors community scenes.',
      },
    ],
    locations: [
      {
        name: 'Benya Lagoon Canoe Yard (Elmina)',
        environment: 'EXT. Waterfront / Boatbuilding Shed',
        logistics:
          'Coordinate tidal schedules for dusk/dawn waterlines; secure coastal council permit and community liaison.',
      },
      {
        name: 'Traditional Mud-Brick Family Courtyard',
        environment: 'EXT. Enclosed Domestic Courtyard',
        logistics:
          'Requires practical fire-safe kerosene lanterns, rain/wind flags, and quiet acoustic perimeter for night dialogue.',
      },
      {
        name: 'Harbor Construction Site Trailer',
        environment: 'INT. Portable Office Container',
        logistics:
          'Dress with engineering plotters, hard hats, and coastal maps; controllable daylight/fluorescent lighting.',
      },
      {
        name: 'Timber Fishing Pier',
        environment: 'EXT. Open Lagoon Mouth',
        logistics:
          '15–20 local extras (fishermen, market women, elders); marine safety boat positioned off-camera.',
      },
    ],
    props: [
      'Hand-carved wooden pirogue (finished & mid-carve hull)',
      'Engraved antique brass kerosene lantern',
      'Carpenter adze, wooden mallet, hand plane, cedar shavings',
      'Rolled architectural blueprints & bathymetric tidal charts',
      'Surveyor total-station tripod, hard hat, reflective vest',
      'Enamel food bowls, woven raffia baskets, clay cooking hearth',
    ],
    costumes: [
      'Kojo: Indigo work shirt, woven wrap cloth, weathered canvas trousers',
      'Ama: Olive cargo chinos, reflective engineer vest, terracotta dusk dress',
      'Kwesi: Tailored charcoal linen suit, open-collar crisp shirt, leather folio',
      'Nana Efua & Elders: Indigo/ochre wax prints, headwraps, brass bangles',
    ],
    equipmentSuggestions: [
      'Digital cinema camera (4K RAW, dual native ISO for lantern-lit night exteriors)',
      'Anamorphic or vintage spherical prime lens set (24mm, 35mm, 50mm, 85mm)',
      'Compact 12ft jib/crane and doorway dolly with 16ft track for shoreline glides',
      '2x Bi-color LED tubes + tungsten fresnel accents to match kerosene warmth',
      'Boom mic with deadcat wind protection + 4 wireless lavaliers for harbor wind',
    ],
    sceneRequirements: [
      {
        sceneNumber: 1,
        heading: 'EXT. BENYA LAGOON SHORELINE - DUSK',
        keyNeeds: 'Tight 40-minute magic-hour window; practical lantern + distant truck headlights.',
      },
      {
        sceneNumber: 2,
        heading: 'EXT. MENSAH FAMILY COURTYARD - NIGHT',
        keyNeeds: 'Controlled lantern flicker rig, warm hearth smoke, quiet dialogue capture.',
      },
      {
        sceneNumber: 3,
        heading: 'INT. PORT SURVEY TRAILER - DAY',
        keyNeeds: 'Printed hydrographic map inserts, overhead practical fluorescent fixtures.',
      },
      {
        sceneNumber: 4,
        heading: 'EXT. TIMBER PIER & LAGOON MOUTH - DAWN',
        keyNeeds: '20 community extras, active canoe launch on water, crane/jib setup on pier.',
      },
    ],
    estimatedComplexity: 'Mid-Scale Coastal Drama',
    complexityRationale:
      'Manageable cast of 4 principals and 4 core locations, elevated by water-adjacent magic-hour scheduling, traditional boat props, and a 20-person dawn pier ensemble.',
    estimatedShootDays: '14–18 Production Days',
  },
};
