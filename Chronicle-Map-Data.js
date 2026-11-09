// Chronicle-Map-Data.js
// Place data and morning sequence for the Chronicle of a Death Foretold town map.
// Page numbers refer to the class PDF of the Rabassa translation (../IB-Study-Guides/Garcia-Marquez-Chronicle-of-a-Death-Foretold.pdf).
// The illustration is interpretive, not an authoritative map: only the adjacencies stated in each
// description come from the text (the Nasar front door faces the square, across from Clotilde Armenta's
// shop beside the church; the rear door opens toward the docks, with the Lanao house next door).
// Every other position is an illustrative convenience. Event titles match Chronicle-Interactive-Timeline.html exactly.

window.CHRONICLE_PLACES = [
  {
    id: 'front',
    name: 'Nasar house: front door',
    x: 720, y: 480,
    description: 'The Nasar house is a converted two-storey warehouse whose main door faces the square and stayed closed and barred except on festive occasions; the investigating judge’s brief called it “The Fatal Door” (p. 8). Santiago left through it at five past six to greet the bishop, and the twins caught and stabbed him against it after Plácida barred it (pp. 8, 46–47); public funds later repaired its knife-chipped wood (p. 22).',
    page: 8,
    events: ['Santiago leaves by the front door','A warning goes unnoticed','Plácida bars the door','Pedro and Pablo attack']
  },
  {
    id: 'rear',
    name: 'Nasar house: rear door and kitchen',
    x: 765, y: 325,
    description: 'The rear door, built a little higher so a horse could enter, opened onto the street to the new docks and was the household’s everyday way in to the stables and kitchen (p. 8). Santiago carried its keys and came home through it at 4:20 a.m. while the twins waited on the square side, and after the attack he walked around the house and re-entered through it to collapse in the kitchen (pp. 22, 27, 48).',
    page: 8,
    events: ['In the kitchen','A message reaches the kitchen','Santiago returns home','Santiago’s final walk']
  },
  {
    id: 'shop',
    name: 'Clotilde Armenta’s milk shop',
    x: 415, y: 535,
    description: 'The shop sold milk at dawn and provisions by day and became a bar after six in the evening; Clotilde opened at three-thirty in the morning (p. 23). The text places it on one side of the church, directly across the sidewalk from Plácida Linero’s house, and the twins drank cane liquor there from 4:10 a.m. while watching Santiago’s dark balcony window (pp. 9, 23, 27).',
    page: 23,
    events: ['Clotilde hears the threat','The mayor takes the knives','A second set of knives','The crowd calls out']
  },
  {
    id: 'church',
    name: 'Church and parish house',
    x: 315, y: 475,
    description: 'The church fronts the paved square, with the bandstand by its front steps (p. 9). Bayardo and Angela’s wedding ceremony took place there (p. 19), and minutes after the killing the twins ran toward it and surrendered in the parish house, laying their clean-bladed knives on Father Amador’s desk (pp. 21, 47).',
    page: 9,
    events: ['A public celebration','The twins surrender']
  },
  {
    id: 'square',
    name: 'The main square',
    x: 540, y: 505,
    description: 'The square was paved up to the church steps and still lay covered with bottles and wedding debris that dawn, with almond trees along one side (p. 9). The milk shop stood on one side and Plácida Linero’s house across the way, and in the last minutes the crowd stationed itself there “the way they did on parade days” to watch (pp. 9, 46).',
    page: 9,
    events: ['Bayardo notices Angela','A priest forgets','Warnings in the square','The crowd calls out']
  },
  {
    id: 'dock',
    name: 'River dock',
    x: 980, y: 250,
    description: 'At the loading pier, the bishop’s boat passed without stopping while the crowd held up roosters (pp. 9–10); Bayardo had arrived on the weekly boat the previous August (p. 12). Near the old dock, the narrator’s aunt Wenefrida saw Santiago on his final walk (p. 47). The map uses one marker for the old and new docks.',
    page: 9,
    events: ['A stranger arrives','The bishop passes','Breakfast plans','Santiago’s final walk']
  },
  {
    id: 'lanao',
    name: 'Lanao family house',
    x: 850, y: 400,
    description: 'The Lanao house stood next door to the Nasar house, on the side toward the old dock; Poncho Lanao, his wife and their five children were sitting down to breakfast when Santiago, carrying his intestines, walked through it to reach his own rear door (pp. 47–48).',
    page: 47,
    events: ['Santiago’s final walk']
  },
  {
    id: 'flora',
    name: 'Flora Miguel’s house',
    x: 925, y: 600,
    description: 'The house of Santiago’s fiancée was kept locked until late by Nahir Miguel’s household of more than fourteen relatives (pp. 44–45). Santiago entered by the main door at 6:45 a.m., received back the chest of his letters from Flora, and left minutes later after Nahir offered him shelter or a rifle (p. 45). It stood around the corner from where Cristo last saw him.',
    page: 44,
    events: ['Flora returns Santiago’s letters','Nahir gives a direct warning']
  },
  {
    id: 'market',
    name: 'Meat market',
    x: 255, y: 680,
    description: 'At the meat market the twins sharpened their knives on the grindstone about 3:20 a.m. and announced the killing in front of the early butchers — twenty-two people later declared they had heard everything (p. 22). The market also held the lunch stands by the old harbor and the town’s only large freezer, which was out of order when the mayor wanted to refrigerate the body (pp. 28, 30).',
    page: 22,
    events: ['The brothers prepare','A second set of knives']
  },
  {
    id: 'vicario',
    name: 'Vicario family house',
    x: 1050, y: 690,
    description: 'A modest house with brick walls, a palm roof, a terrace full of flowerpots, hens and fruit trees in the yard, and the twins’ pigsty with its sacrificial stone at the rear (p. 18). Painted yellow and repaired for the wedding, it is where Bayardo returned Angela before 3 a.m., where Pura beat her, and where Angela named Santiago Nasar in the dining room (pp. 18, 20–21).',
    page: 18,
    events: ['A family agrees for Angela','Angela’s private fear','Angela waits for Bayardo','A public celebration','Bayardo returns Angela','Pura beats her daughter','Angela names Santiago','The brothers prepare','A second set of knives']
  },
  {
    id: 'yamil',
    name: 'Yamil Shaium’s store',
    x: 570, y: 625,
    description: 'Yamil Shaium’s dry goods store stood near the corner of the square; Yamil, Ibrahim Nasar’s old card partner and the family’s hereditary counsellor, waited at its door to warn Santiago and detained Cristo Bedoya there to ask about the rumour (p. 41). In the final minutes he shouted for Santiago to come in and went looking for cartridges for his hunting gun (pp. 45–46).',
    page: 41,
    events: ['Warnings in the square','The crowd calls out']
  },
  {
    id: 'xius',
    name: 'Widower Xius’s house',
    x: 1170, y: 430,
    description: 'The widower Xius’s farmhouse stood on a windswept hill, its terrace overlooking the marshes and, on clear days, the Caribbean horizon (p. 16). Bayardo bought it for ten thousand pesos in cash and carried Angela there after the wedding dance; the following Saturday the mayor’s patrol found Bayardo inside, unconscious among bottles (pp. 17, 20, 34).',
    page: 16,
    events: ['The widower’s house','Bayardo is found','Bayardo’s family takes him away']
  },
  {
    id: 'club',
    name: 'Social club',
    x: 760, y: 650,
    description: 'At the social club’s domino table Bayardo twice sat down with the widower Xius to negotiate for his house, returning with ten thousand pesos in bundled notes (pp. 16–17). It was also where Mayor Aponte stopped to confirm a dominoes engagement moments after promising Cristo Bedoya he would deal with the twins (p. 43).',
    page: 16,
    events: ['The widower’s house','Cristo meets the mayor again']
  },
  {
    id: 'maria',
    name: 'María Alejandrina Cervantes’ house',
    x: 160, y: 445,
    description: 'María Alejandrina Cervantes’s house has rooms for rent and a large dancing courtyard (p. 27). On the wedding night Santiago, the narrator, Cristo Bedoya, Luis Enrique and the Vicario twins drink and sing there together before the group separates (pp. 20, 27).',
    page: 27,
    events: ['The party continues']
  }
];

// Ordered sourced moments from the twins' first announcement to the attack and Santiago's final walk.
// Each step is one documented moment; positions of people between steps are not interpolated.
window.CHRONICLE_MAP_MORNING = [
  {
    title: 'Knives sharpened at the meat market',
    time: 'About 3:20 a.m.',
    summary: 'Pedro and Pablo Vicario take their two best pig-butchering knives from the pigsty at home and sharpen them on the grindstone at the meat market, where Pablo announces in front of the early butchers that they are going to kill Santiago Nasar; the butcher Faustino Santos reports the threat to Officer Leandro Pornoy.',
    locationIds: ['vicario','market'],
    eventTitle: 'The brothers prepare',
    page: 22
  },
  {
    title: 'The twins settle in at Clotilde’s shop',
    time: 'About 4:10 a.m.',
    summary: 'The twins arrive at Clotilde Armenta’s milk shop opposite Plácida Linero’s house, drink a bottle of cane liquor in two long swigs and sit watching Santiago’s dark bedroom window; when Clotilde asks, Pedro answers that they are looking for him to kill him.',
    locationIds: ['shop'],
    eventTitle: 'Clotilde hears the threat',
    page: 23
  },
  {
    title: 'Santiago slips home by the rear door',
    time: 'About 4:20 a.m.',
    summary: 'Santiago comes home along the riverbank and enters by the rear door, as he always does, while the twins wait on the square side; he sleeps in his clothes and asks Victoria Guzmán to wake him at five-thirty for the bishop’s arrival.',
    locationIds: ['rear','shop'],
    eventTitle: 'Santiago returns home',
    page: 27
  },
  {
    title: 'The mayor confiscates the knives',
    time: 'Almost 5 a.m.',
    summary: 'Colonel Lázaro Aponte, dressed and breakfasted after hearing the officer’s report, walks to the shop, takes the twins’ knives and sends them home to sleep without arresting them, despite Clotilde Armenta’s protest that they should be held.',
    locationIds: ['shop'],
    eventTitle: 'The mayor takes the knives',
    page: 24
  },
  {
    title: 'Second knives, and coffee at Prudencia’s',
    time: 'After the confiscation',
    summary: 'The twins fetch two more knives from home and have them sharpened again at the market; on the way back they stop for coffee at Prudencia Cotes’s house, where her mother says honour cannot wait, then return to the shop to shave and drink slowly, still watching the window.',
    locationIds: ['vicario','market','shop'],
    eventTitle: 'A second set of knives',
    page: 25
  },
  {
    title: 'Warnings that never reach Santiago',
    time: 'After 5 a.m.',
    summary: 'Clotilde sends an urgent message by the woman begging milk, and it reaches Victoria Guzmán and Divina Flor in the kitchen, but neither warns Santiago; meanwhile someone pushes an envelope naming the threat, the motive and the waiting place under the front door, where it lies unseen.',
    locationIds: ['rear','front'],
    eventTitle: 'A message reaches the kitchen',
    page: 8
  },
  {
    title: 'Santiago leaves by the front door',
    time: 'About 6:05 a.m.',
    summary: 'Dressed in white linen for the bishop, Santiago has Divina Flor open the rarely used front door onto the square and steps out toward the docks; the twins rise at the shop, but Clotilde’s plea for the bishop’s sake makes them sit down again and only follow him with their eyes.',
    locationIds: ['front','square','shop'],
    eventTitle: 'Santiago leaves by the front door',
    page: 8
  },
  {
    title: 'The bishop passes without landing',
    time: 'Around 6 a.m.',
    summary: 'At the crowded pier, stacked with firewood and full of people bearing gift roosters, the bishop’s boat whistles and passes without stopping while the bishop makes a mechanical sign of the cross; Santiago watches with Margot and Cristo Bedoya.',
    locationIds: ['dock'],
    eventTitle: 'The bishop passes',
    page: 9
  },
  {
    title: 'Breakfast plans on the pier',
    time: 'About 6:25 a.m.',
    summary: 'Margot invites Santiago to breakfast; he accepts but sets off with Cristo Bedoya to change his clothes first, promising to follow within fifteen minutes, while Margot learns that Angela has been returned and that the twins are waiting to kill him.',
    locationIds: ['dock'],
    eventTitle: 'Breakfast plans',
    page: 10
  },
  {
    title: 'Warnings dissolve in the square crowd',
    time: 'After leaving the docks',
    summary: 'Walking calmly with Cristo through the crowd, Santiago is passed by Indalecio Pardo, who loses his nerve and does not warn him; at the corner Yamil Shaium calls Cristo aside to ask about the rumour, and Santiago goes on alone toward Flora Miguel’s house.',
    locationIds: ['square','yamil'],
    eventTitle: 'Warnings in the square',
    page: 40
  },
  {
    title: 'Flora returns his letters',
    time: 'Around 6:45 a.m.',
    summary: 'At Flora Miguel’s house, Flora hands back the chest of his letters and locks herself in her bedroom; her father Nahir Miguel then tells Santiago in Arabic that the twins are waiting to kill him and offers shelter in the house or his rifle, but Santiago answers only that he does not understand.',
    locationIds: ['flora'],
    eventTitle: 'Flora returns Santiago’s letters',
    page: 44
  },
  {
    title: 'The attack and the final walk',
    time: 'Final minutes',
    summary: 'Santiago comes out into a shouting crowd that calls contradictory directions; Plácida bars the front door believing him already upstairs, and the twins stab him against it. He then walks more than a hundred yards around the house, through the Lanao family’s breakfast, down the old dock steps past his aunt Wenefrida, and in through the rear door to collapse in the kitchen.',
    locationIds: ['flora','square','yamil','front','lanao','dock','rear'],
    eventTitle: 'Pedro and Pablo attack',
    page: 46
  }
];

// Every one of the 54 timeline event titles mapped to the anchored places where the text
// puts the scene. [] means the text sets the event somewhere with no anchor on this
// interpretive map (Riohacha, the Guajira, the school, the cemetery, the narrator's house,
// Prudencia Cotes's house) or gives it no single location at all.
window.CHRONICLE_EVENT_PLACES = {
  'The Nasar household': [],
  'Victoria and Divina': [],
  'A stranger arrives': ['dock'],
  'Bayardo notices Angela': ['square'],
  'The music box': [],
  'A family agrees for Angela': ['vicario'],
  'The widower’s house': ['xius','club'],
  'Angela’s private fear': ['vicario'],
  'Angela waits for Bayardo': ['vicario'],
  'A public celebration': ['church','vicario'],
  'The party continues': ['maria'],
  'Bayardo returns Angela': ['vicario'],
  'Pura beats her daughter': ['vicario'],
  'Angela names Santiago': ['vicario'],
  'The brothers prepare': ['vicario','market'],
  'Clotilde hears the threat': ['shop'],
  'Santiago returns home': ['rear'],
  'The mayor takes the knives': ['shop'],
  'A second set of knives': ['vicario','market','shop'],
  'Prudencia’s expectation': [],
  'A message reaches the kitchen': ['rear'],
  'A warning goes unnoticed': ['front'],
  'Santiago wakes': [],
  'Conflicting memories of the weather': [],
  'White clothes and an unloaded gun': [],
  'In the kitchen': ['rear'],
  'Santiago leaves by the front door': ['front'],
  'A priest forgets': ['square'],
  'The bishop passes': ['dock'],
  'Breakfast plans': ['dock'],
  'Luisa tries to warn Plácida': [],
  'Warnings in the square': ['square','yamil'],
  'Flora returns Santiago’s letters': ['flora'],
  'Cristo searches the house': [],
  'Cristo meets the mayor again': ['club'],
  'Another delay for Cristo': [],
  'Nahir gives a direct warning': ['flora'],
  'The crowd calls out': ['square','yamil','shop'],
  'Plácida bars the door': ['front'],
  'Pedro and Pablo attack': ['front'],
  'Santiago’s final walk': ['lanao','dock','rear'],
  'The twins surrender': ['church'],
  'The autopsy': [],
  'Burial and the family’s departure': [],
  'Bayardo is found': ['xius'],
  'Bayardo’s family takes him away': ['xius'],
  'The magistrate investigates': [],
  'Trial and acquittal': [],
  'The brothers take different paths': [],
  'Angela sees Bayardo again': [],
  'Angela writes every week': [],
  'Bayardo returns': [],
  'Angela tells her story': [],
  'The narrator reconstructs': []
};

// Broad time of day per event, assigned only where the text states a time or light condition.
// 'unknown' means the text gives none for that event. Monday-morning clock times come from the
// narrative itself: the street lights are still on at six (p. 9); a golden sun is already
// coming through the windows just before seven (p. 42).
window.CHRONICLE_EVENT_LIGHT = {
  'The Nasar household': 'unknown',
  'Victoria and Divina': 'unknown',
  'A stranger arrives': 'unknown',
  'Bayardo notices Angela': 'day',
  'The music box': 'unknown',
  'A family agrees for Angela': 'night',
  'The widower’s house': 'night',
  'Angela’s private fear': 'unknown',
  'Angela waits for Bayardo': 'day',
  'A public celebration': 'day',
  'The party continues': 'night',
  'Bayardo returns Angela': 'night',
  'Pura beats her daughter': 'night',
  'Angela names Santiago': 'night',
  'The brothers prepare': 'night',
  'Clotilde hears the threat': 'night',
  'Santiago returns home': 'night',
  'The mayor takes the knives': 'night',
  'A second set of knives': 'dawn',
  'Prudencia’s expectation': 'dawn',
  'A message reaches the kitchen': 'dawn',
  'A warning goes unnoticed': 'unknown',
  'Santiago wakes': 'dawn',
  'Conflicting memories of the weather': 'dawn',
  'White clothes and an unloaded gun': 'dawn',
  'In the kitchen': 'dawn',
  'Santiago leaves by the front door': 'dawn',
  'A priest forgets': 'dawn',
  'The bishop passes': 'dawn',
  'Breakfast plans': 'dawn',
  'Luisa tries to warn Plácida': 'day',
  'Warnings in the square': 'day',
  'Flora returns Santiago’s letters': 'day',
  'Cristo searches the house': 'day',
  'Cristo meets the mayor again': 'day',
  'Another delay for Cristo': 'day',
  'Nahir gives a direct warning': 'day',
  'The crowd calls out': 'day',
  'Plácida bars the door': 'day',
  'Pedro and Pablo attack': 'day',
  'Santiago’s final walk': 'day',
  'The twins surrender': 'day',
  'The autopsy': 'day',
  'Burial and the family’s departure': 'dawn',
  'Bayardo is found': 'unknown',
  'Bayardo’s family takes him away': 'day',
  'The magistrate investigates': 'unknown',
  'Trial and acquittal': 'unknown',
  'The brothers take different paths': 'unknown',
  'Angela sees Bayardo again': 'unknown',
  'Angela writes every week': 'night',
  'Bayardo returns': 'day',
  'Angela tells her story': 'day',
  'The narrator reconstructs': 'unknown'
};
