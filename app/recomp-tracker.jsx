import { useState, useEffect, useRef } from "react";

const MACRO_GOAL = { calories: 2800, protein: 215, carbs: 270, fat: 75 };
const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const FOOD_KEY = "fuellog-v2";
const WORKOUT_KEY = "workoutlog-v2";
const SAVED_MEALS_KEY = "recomp-saved-meals-v1";

// Get dates for the past 7 days
// Always derive the past 7 days dynamically from today's real calendar date
function getPast7Days() {
  const days = {};
  const labels = ["sun","mon","tue","wed","thu","fri","sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12,0,0,0);
    d.setDate(d.getDate() - i);
    const label = labels[d.getDay()];
    days[label] = d.toISOString().slice(0, 10);
  }
  return days;
}
const DATES = getPast7Days();
// WEEK = sorted array of the 7 dates in chronological order
const WEEK = Object.values(DATES).sort();
const todayKey = () => { const d = new Date(); d.setHours(12,0,0,0); return d.toISOString().slice(0,10); };

// ── FULL WEEK DUMMY DATA ──────────────────────────────────────────────────

const DUMMY_FOOD = {
  [DATES.mon]: { // Mon Mar 2 - tight & clean
    Breakfast: [
      { id:1, name:"4 whole eggs scrambled", calories:280, protein:24, carbs:0, fat:20 },
      { id:2, name:"3 egg whites", calories:51, protein:11, carbs:0, fat:0 },
      { id:3, name:"80g oats with blueberries", calories:310, protein:10, carbs:58, fat:5 },
      { id:4, name:"Coffee (black)", calories:5, protein:0, carbs:1, fat:0 },
    ],
    Lunch: [
      { id:5, name:"200g grilled chicken breast", calories:330, protein:62, carbs:0, fat:7 },
      { id:6, name:"180g white rice", calories:234, protein:4, carbs:52, fat:0 },
      { id:7, name:"Steamed broccoli & peppers", calories:60, protein:4, carbs:12, fat:0 },
      { id:8, name:"Olive oil drizzle", calories:60, protein:0, carbs:0, fat:7 },
    ],
    Dinner: [
      { id:9, name:"200g ground turkey 93%", calories:290, protein:44, carbs:0, fat:12 },
      { id:10, name:"Sweet potato 180g", calories:162, protein:3, carbs:38, fat:0 },
      { id:11, name:"Asparagus roasted", calories:40, protein:4, carbs:7, fat:0 },
    ],
    Snacks: [
      { id:12, name:"Gold Standard Whey - Coffee", calories:120, protein:24, carbs:3, fat:1 },
      { id:13, name:"Chobani Non-Fat Greek Yogurt", calories:90, protein:17, carbs:6, fat:0 },
      { id:14, name:"Apple", calories:95, protein:0, carbs:25, fat:0 },
    ],
  },
  [DATES.tue]: { // Tue Mar 3 - solid
    Breakfast: [
      { id:20, name:"3 whole eggs + 4 whites omelette", calories:285, protein:35, carbs:2, fat:14 },
      { id:21, name:"Mission Low Carb Wrap x2", calories:140, protein:10, carbs:38, fat:6 },
      { id:22, name:"Salsa & hot sauce", calories:20, protein:1, carbs:4, fat:0 },
    ],
    Lunch: [
      { id:23, name:"Tuna (2 cans) with light mayo", calories:280, protein:50, carbs:4, fat:6 },
      { id:24, name:"Brown rice 160g cooked", calories:218, protein:5, carbs:46, fat:2 },
      { id:25, name:"Side salad with balsamic", calories:80, protein:2, carbs:12, fat:2 },
    ],
    Dinner: [
      { id:26, name:"Salmon filet 200g baked", calories:412, protein:40, carbs:0, fat:26 },
      { id:27, name:"Quinoa 150g cooked", calories:185, protein:7, carbs:33, fat:3 },
      { id:28, name:"Roasted zucchini", calories:35, protein:2, carbs:7, fat:0 },
    ],
    Snacks: [
      { id:29, name:"Think! Protein Bar", calories:150, protein:20, carbs:15, fat:5 },
      { id:30, name:"Almonds small handful", calories:100, protein:4, carbs:3, fat:9 },
    ],
  },
  [DATES.wed]: { // Wed Mar 4 - slightly over on carbs
    Breakfast: [
      { id:40, name:"Egg white omelette 6 whites", calories:102, protein:22, carbs:2, fat:0 },
      { id:41, name:"Avocado toast on Ezekiel bread", calories:280, protein:8, carbs:32, fat:14 },
      { id:42, name:"Premier Protein Shake", calories:160, protein:30, carbs:4, fat:3 },
    ],
    Lunch: [
      { id:43, name:"Chipotle bowl - double chicken", calories:780, protein:62, carbs:85, fat:18 },
    ],
    Dinner: [
      { id:44, name:"Grilled chicken thighs 250g", calories:390, protein:50, carbs:0, fat:20 },
      { id:45, name:"Pasta 100g dry", calories:356, protein:12, carbs:72, fat:2 },
      { id:46, name:"Marinara sauce", calories:80, protein:3, carbs:14, fat:2 },
    ],
    Snacks: [
      { id:47, name:"Gold Standard Whey", calories:120, protein:24, carbs:3, fat:1 },
      { id:48, name:"Banana", calories:105, protein:1, carbs:27, fat:0 },
      { id:49, name:"Rice cakes x3", calories:105, protein:2, carbs:24, fat:0 },
    ],
  },
  [DATES.thu]: { // Thu Mar 5 - back on track
    Breakfast: [
      { id:60, name:"4 eggs + 3 whites scrambled", calories:331, protein:35, carbs:0, fat:20 },
      { id:61, name:"80g oatmeal plain", calories:304, protein:10, carbs:52, fat:6 },
      { id:62, name:"1 scoop collagen in coffee", calories:35, protein:9, carbs:0, fat:0 },
    ],
    Lunch: [
      { id:63, name:"Chicken breast 220g grilled", calories:363, protein:68, carbs:0, fat:8 },
      { id:64, name:"White rice 200g cooked", calories:260, protein:5, carbs:58, fat:0 },
      { id:65, name:"Mixed veggies stir fry", calories:90, protein:4, carbs:16, fat:2 },
    ],
    Dinner: [
      { id:66, name:"93% lean beef 200g", calories:300, protein:42, carbs:0, fat:14 },
      { id:67, name:"Baked potato large", calories:220, protein:5, carbs:51, fat:0 },
      { id:68, name:"Greek yogurt topping", calories:60, protein:10, carbs:5, fat:0 },
    ],
    Snacks: [
      { id:69, name:"NuGo Slim Bar", calories:200, protein:17, carbs:22, fat:6 },
      { id:70, name:"Cottage cheese 1/2 cup", calories:90, protein:12, carbs:4, fat:2 },
    ],
  },
  [DATES.fri]: { // Fri Mar 6 - pre-weekend, slightly looser
    Breakfast: [
      { id:80, name:"Protein pancakes (3)", calories:380, protein:32, carbs:42, fat:8 },
      { id:81, name:"Turkey bacon x4 strips", calories:140, protein:16, carbs:2, fat:8 },
      { id:82, name:"OJ 8oz", calories:110, protein:1, carbs:26, fat:0 },
    ],
    Lunch: [
      { id:83, name:"Grilled chicken wrap double", calories:520, protein:48, carbs:46, fat:14 },
      { id:84, name:"Side of fries (small)", calories:230, protein:3, carbs:30, fat:11 },
    ],
    Dinner: [
      { id:85, name:"Steak sirloin 220g", calories:440, protein:52, carbs:0, fat:24 },
      { id:86, name:"Roasted potatoes 200g", calories:160, protein:4, carbs:36, fat:1 },
      { id:87, name:"Side salad", calories:60, protein:2, carbs:8, fat:2 },
      { id:88, name:"2 beers", calories:300, protein:2, carbs:30, fat:0 },
    ],
    Snacks: [
      { id:89, name:"Chobani Greek Yogurt", calories:90, protein:17, carbs:6, fat:0 },
      { id:90, name:"Handful mixed nuts", calories:170, protein:5, carbs:6, fat:15 },
    ],
  },
  [DATES.sat]: { // Sat Feb 28 - goes off plan
    Breakfast: [
      { id:100, name:"Bacon egg & cheese bagel", calories:580, protein:28, carbs:58, fat:26 },
      { id:101, name:"Large iced latte with oat milk", calories:190, protein:6, carbs:28, fat:7 },
    ],
    Lunch: [
      { id:102, name:"Chipotle burrito (full)", calories:1050, protein:48, carbs:120, fat:32 },
      { id:103, name:"Chips & guac", calories:380, protein:5, carbs:40, fat:22 },
    ],
    Dinner: [
      { id:104, name:"Pizza 3 slices pepperoni", calories:780, protein:33, carbs:87, fat:30 },
      { id:105, name:"Caesar salad", calories:220, protein:6, carbs:14, fat:16 },
      { id:106, name:"3 glasses wine", calories:375, protein:1, carbs:12, fat:0 },
    ],
    Snacks: [
      { id:107, name:"Ice cream 2 scoops", calories:280, protein:5, carbs:36, fat:14 },
      { id:108, name:"Handful pretzels", calories:110, protein:3, carbs:23, fat:1 },
    ],
  },
  [DATES.sun]: { // Sun Mar 1 - recovery day, moderate
    Breakfast: [
      { id:120, name:"Veggie omelette 4 eggs", calories:320, protein:26, carbs:8, fat:20 },
      { id:121, name:"Whole wheat toast x2", calories:160, protein:7, carbs:30, fat:2 },
      { id:122, name:"Orange juice 6oz", calories:84, protein:1, carbs:20, fat:0 },
    ],
    Lunch: [
      { id:123, name:"Grilled salmon 180g", calories:370, protein:36, carbs:0, fat:23 },
      { id:124, name:"Quinoa & roasted veg bowl", calories:340, protein:12, carbs:52, fat:9 },
    ],
    Dinner: [
      { id:125, name:"Chicken soup homemade large", calories:380, protein:38, carbs:28, fat:10 },
      { id:126, name:"Crusty bread 2 slices", calories:200, protein:7, carbs:38, fat:2 },
    ],
    Snacks: [
      { id:127, name:"Gold Standard Whey", calories:120, protein:24, carbs:3, fat:1 },
      { id:128, name:"Chobani Greek Yogurt", calories:90, protein:17, carbs:6, fat:0 },
      { id:129, name:"Apple with almond butter", calories:195, protein:4, carbs:28, fat:9 },
    ],
  },
};

const DUMMY_WORKOUTS = {
  [DATES.mon]: { // Mon Mar 2 - Chest & Triceps (real lifts)
    workoutName: "Chest & Triceps", rating: 8.4, calsBurned: 480,
    analysis: "Excellent volume day — 7 exercises, 26 sets. The 5-second negative on incline press after hitting failure is smart TUT programming. Triple tricep finisher well sequenced by head. Dips at 208lb BW to close shows solid work capacity. Push 90lb incline to 6 clean reps before adding weight.",
    workouts: [
      { id:1, name:"Incline DB Bench Press", type:"strength", sets:[{weight:"60",reps:"12"},{weight:"80",reps:"10"},{weight:"90",reps:"7"},{weight:"90",reps:"4"},{weight:"60",reps:"11"}]},
      { id:2, name:"Pectoral Fly (Hammer Strength)", type:"strength", sets:[{weight:"38",reps:"10"},{weight:"38",reps:"10"},{weight:"40",reps:"10"},{weight:"42.5",reps:"10"},{weight:"42.5",reps:"10"}]},
      { id:3, name:"Dumbbell Cross Raise", type:"strength", sets:[{weight:"17.5",reps:"20"},{weight:"25",reps:"12"},{weight:"25",reps:"12"}]},
      { id:4, name:"Skull Crushers", type:"strength", sets:[{weight:"32.5",reps:"12"},{weight:"32.5",reps:"11"},{weight:"32.5",reps:"10"}]},
      { id:5, name:"Overhead Rope Pulley Extension", type:"strength", sets:[{weight:"32.5",reps:"10"},{weight:"42.5",reps:"10"},{weight:"47.5",reps:"10"}]},
      { id:6, name:"Single Arm Cross Body Tricep Extension", type:"strength", sets:[{weight:"12.5",reps:"10"},{weight:"17.5",reps:"10"},{weight:"17.5",reps:"10"}]},
      { id:7, name:"Dips", type:"strength", sets:[{weight:"BW",reps:"12"},{weight:"BW",reps:"12"},{weight:"BW",reps:"12"}]},
    ],
  },
  [DATES.tue]: { // Tue Mar 3 - Cycling + Yoga
    workoutName: "Cycling & Yoga", rating: 7.8, calsBurned: 520,
    analysis: "Strong cardio output — 45 min cycling at moderate-high intensity is excellent for recomp, burning fat while preserving muscle. Following with 30 min yoga is smart programming: improves recovery, mobility, and reduces cortisol. Great active recovery pairing.",
    workouts: [
      { id:20, name:"Cycling", type:"cycling", duration:45, intensity:"Moderate-High", location:"Peloton", calories:380, notes:"Avg HR 152bpm" },
      { id:21, name:"Yoga", type:"yoga", duration:30, intensity:"Moderate", location:"Studio", calories:140, notes:"Vinyasa flow — focused on hip flexors and thoracic spine" },
    ],
  },
  [DATES.wed]: { // Wed Mar 4 - Back & Biceps (real session)
    workoutName: "Back & Biceps", rating: 8.7, calsBurned: 520,
    analysis: "Excellent pulling session — 7 exercises, 33 sets, big volume day. Single arm DB row topping at 100x6 is strong unilateral output. The Life Fitness row holding 100x12 for all 4 sets is a standout — great mind-muscle connection. HS lat pulldown at 130x8 is solid intermediate-plus territory. Bicep work is thorough: DB curl and hammer curl both taken to 35lb, hitting the long head and brachialis. One flag: forearm fatigue limiting the RDL at 70lb is a grip issue, not back strength. Add straps next session and you will get full ROM and proper loading. Target 105lb on DB rows next session.",
    workouts: [
      { id:30, name:"Single Arm Dumbbell Row", type:"strength", sets:[{weight:"60",reps:"12"},{weight:"70",reps:"10"},{weight:"80",reps:"10"},{weight:"90",reps:"10"},{weight:"100",reps:"6"}]},
      { id:31, name:"High Row (Life Fitness)", type:"strength", sets:[{weight:"70",reps:"12"},{weight:"80",reps:"10"},{weight:"90",reps:"10"},{weight:"100",reps:"9"},{weight:"80",reps:"10"}]},
      { id:32, name:"Dumbbell RDL", type:"strength", sets:[{weight:"60",reps:"10"},{weight:"70",reps:"9"},{weight:"70",reps:"8"}]},
      { id:33, name:"Life Fitness Row", type:"strength", sets:[{weight:"70",reps:"12"},{weight:"80",reps:"12"},{weight:"90",reps:"12"},{weight:"100",reps:"12"}]},
      { id:34, name:"Hammer Strength Lat Pulldown (Wide Grip)", type:"strength", sets:[{weight:"100",reps:"10"},{weight:"115",reps:"10"},{weight:"130",reps:"8"},{weight:"100",reps:"10"}]},
      { id:35, name:"Dumbbell Curl", type:"strength", sets:[{weight:"27.5",reps:"12"},{weight:"32.5",reps:"10"},{weight:"32.5",reps:"8"},{weight:"35",reps:"7"}]},
      { id:36, name:"Hammer Curl", type:"strength", sets:[{weight:"27.5",reps:"10"},{weight:"32.5",reps:"10"},{weight:"32.5",reps:"8"},{weight:"35",reps:"6"}]},
    ],
  },
  [DATES.thu]: { // Thu Mar 5 - HOTWORX
    workoutName: "HOTWORX Isometric", rating: 8.1, calsBurned: 560,
    analysis: "HOTWORX isometric session is a high-value tool for recomp — the infrared heat dramatically elevates calorie burn vs standard yoga, and isometric holds build functional strength and endurance. 560 cal in 45 min is excellent output. This complements the lifting well and supports recovery.",
    workouts: [
      { id:40, name:"HOTWORX Isometric Session", type:"hotworx", duration:45, intensity:"High", location:"HOTWORX Studio", calories:560, notes:"Infrared sauna pod — warrior, plank, chair sequences" },
    ],
  },
  [DATES.fri]: { // Fri Mar 6 - Back & Biceps (today — real session)
    workoutName: "Back & Biceps", rating: 8.7, calsBurned: 520,
    analysis: "Excellent pulling session — 7 exercises, 33 sets, big volume day. Single arm DB row topping at 100x6 is strong unilateral output. Life Fitness row holding 100x12 for all 4 sets is a standout — great mind-muscle connection. HS lat pulldown at 130x8 is solid intermediate-plus territory. Bicep work is thorough: DB curl and hammer curl both taken to 35lb, hitting long head and brachialis. One flag: forearm fatigue limiting RDL at 70lb is a grip issue, not back strength. Add straps next session for full load. Target 105lb on DB rows next time.",
    workouts: [
      { id:50, name:"Single Arm Dumbbell Row", type:"strength", sets:[{weight:"60",reps:"12"},{weight:"70",reps:"10"},{weight:"80",reps:"10"},{weight:"90",reps:"10"},{weight:"100",reps:"6"}]},
      { id:51, name:"High Row (Life Fitness)", type:"strength", sets:[{weight:"70",reps:"12"},{weight:"80",reps:"10"},{weight:"90",reps:"10"},{weight:"100",reps:"9"},{weight:"80",reps:"10"}]},
      { id:52, name:"Dumbbell RDL", type:"strength", sets:[{weight:"60",reps:"10"},{weight:"70",reps:"9"},{weight:"70",reps:"8"}]},
      { id:53, name:"Life Fitness Row", type:"strength", sets:[{weight:"70",reps:"12"},{weight:"80",reps:"12"},{weight:"90",reps:"12"},{weight:"100",reps:"12"}]},
      { id:54, name:"Hammer Strength Lat Pulldown (Wide Grip)", type:"strength", sets:[{weight:"100",reps:"10"},{weight:"115",reps:"10"},{weight:"130",reps:"8"},{weight:"100",reps:"10"}]},
      { id:55, name:"Dumbbell Curl", type:"strength", sets:[{weight:"27.5",reps:"12"},{weight:"32.5",reps:"10"},{weight:"32.5",reps:"8"},{weight:"35",reps:"7"}]},
      { id:56, name:"Hammer Curl", type:"strength", sets:[{weight:"27.5",reps:"10"},{weight:"32.5",reps:"10"},{weight:"32.5",reps:"8"},{weight:"35",reps:"6"}]},
    ],
  },
  [DATES.sat]: { // Sat Feb 28 - Yoga (recovery / cheat day balance)
    workoutName: "Yoga & Stretch", rating: 7.2, calsBurned: 220,
    analysis: "Given the higher calorie intake today, a dedicated mobility session is better than nothing. 60 min of yoga maintains flexibility and parasympathetic recovery. Cortisol management on rest days matters for recomp. Next Saturday consider adding a 20 min walk to offset the surplus.",
    workouts: [
      { id:60, name:"Yoga", type:"yoga", duration:60, intensity:"Low-Moderate", location:"Home", calories:180, notes:"Yin yoga — long holds, hip openers, shoulder mobility" },
      { id:61, name:"Walk", type:"walk", duration:25, intensity:"Easy", calories:110, notes:"Evening walk after dinner" },
    ],
  },
  [DATES.sun]: { // Sun Mar 1 - Legs (finally)
    workoutName: "Legs", rating: 7.5, calsBurned: 510,
    analysis: "Legs finally get their session — good. Squat depth and volume is a solid starting point. Leg press load is conservative but appropriate for reestablishing the pattern. Romanian deadlifts will help with the posterior chain. Leg curl and extension finisher is thorough. Add another leg day next week to make up for the missed sessions earlier.",
    workouts: [
      { id:70, name:"Back Squat", type:"strength", sets:[{weight:"135",reps:"10"},{weight:"185",reps:"8"},{weight:"205",reps:"6"},{weight:"205",reps:"6"},{weight:"185",reps:"8"}]},
      { id:71, name:"Leg Press", type:"strength", sets:[{weight:"270",reps:"12"},{weight:"360",reps:"10"},{weight:"360",reps:"10"},{weight:"360",reps:"9"}]},
      { id:72, name:"Romanian Deadlift", type:"strength", sets:[{weight:"155",reps:"10"},{weight:"175",reps:"8"},{weight:"175",reps:"8"}]},
      { id:73, name:"Leg Curl Machine", type:"strength", sets:[{weight:"100",reps:"12"},{weight:"110",reps:"10"},{weight:"110",reps:"10"}]},
      { id:74, name:"Leg Extension Machine", type:"strength", sets:[{weight:"110",reps:"12"},{weight:"120",reps:"10"},{weight:"120",reps:"10"}]},
      { id:75, name:"Calf Raise", type:"strength", sets:[{weight:"180",reps:"15"},{weight:"180",reps:"15"},{weight:"180",reps:"15"}]},
    ],
  },
};

const DEMO_SAVED_MEALS = [
  { id:"s1", name:"Egg White Oat Bowl", items:"3 eggs, 4 whites, 80g oats, berries", cal:520, protein:48, carbs:58, fat:10, rating:9.1, ratingNote:"High protein, complex carbs, low fat — near perfect for recomp goals.", savedAt:"2024-01-15" },
  { id:"s2", name:"Chicken & Rice", items:"200g grilled chicken, 180g white rice, broccoli", cal:610, protein:52, carbs:72, fat:8, rating:9.4, ratingNote:"Excellent macro split. Lean protein + complex carbs is ideal.", savedAt:"2024-01-14" },
  { id:"s3", name:"PBJ Sandwich", items:"2 slices white bread, 2 tbsp PB, 1 tbsp jelly", cal:390, protein:12, carbs:52, fat:16, rating:3.8, ratingNote:"Low protein for the calories. High simple carbs and fat. Poor recomp choice.", savedAt:"2024-01-13" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function getActivityType(name) {
  const n = (name||"").toLowerCase();
  // Explicit strength exercise overrides — checked first to prevent false cardio matches
  // "row" appears in cable row, db row, machine row etc — these are ALL strength
  // "run" appears in "romanian" (RDL) — strength
  // "walk" appears in "dumbbell" — strength
  const strengthKeywords = [
    "dumbbell","barbell","cable","hammer strength","machine","press","curl","extension",
    "pulldown","pull down","pull-down","pushdown","push down","squat","lunge","deadlift",
    "rdl","romanian","hip thrust","shrug","fly","flye","raise","face pull","dip",
    "crunch","plank","ab ","abs","lat pull","chest","bench","incline","decline",
    "seated","standing db","single arm","bilateral","unilateral","life fitness row",
    "high row","low row","t-bar","cable row","db row","dumbbell row","seated row",
    "supported row","chest supported"
  ];
  if (strengthKeywords.some(k => n.includes(k))) return "strength";
  // Cardio / class detection — only after ruling out strength
  if (n.includes("cycling")||n.includes("bike")||n.includes("spin")||n.includes("peloton")) return "cycling";
  if (n.includes("hotworx")||n.includes("hot yoga")||n.includes("infrared")||n.includes("isometric")) return "hotworx";
  if (n.includes("yoga")||n.includes("vinyasa")||n.includes("yin yoga")) return "yoga";
  if (n.includes("pilates")) return "pilates";
  if (n.includes("treadmill")||n.includes("jogging")||(n.includes("run")&&!n.includes("romanian"))) return "run";
  if (n==="walk"||n.includes("walking")||n.includes("hike")) return "walk";
  if (n.includes("swim")||n.includes("pool laps")) return "swim";
  if (n.includes("hiit")||n.includes("circuit")||n.includes("bootcamp")) return "hiit";
  if (n==="rowing machine"||n==="row machine"||n==="erg"||n.includes("rowing machine")) return "rowing";
  if (n.includes("elliptical")||n.includes("stair climber")||n.includes("stepper")) return "cardio_machine";
  if (n.includes("stretch")||n.includes("mobility")||n.includes("foam roll")) return "mobility";
  return "strength";
}
function activityIcon(type) {
  return {cycling:"🚴",yoga:"🧘",run:"🏃",walk:"🚶",swim:"🏊",hiit:"⚡",pilates:"🤸",hotworx:"🔥",class:"🎯",rowing:"🚣",cardio_machine:"⚙️",mobility:"🙆",strength:"💪"}[type]||"💪";
}
function activityAccentColor(type) {
  return {cycling:"#47c8ff",yoga:"#c447ff",run:"#ff9f47",walk:"#4aff7a",swim:"#47c8ff",hiit:"#ff6b6b",pilates:"#c447ff",hotworx:"#ff6b6b",class:"#e8ff47",rowing:"#47c8ff",cardio_machine:"#ff9f47",mobility:"#4aff7a",strength:"#888"}[type]||"#888";
}
function isCardioType(type) {
  return ["cycling","yoga","run","walk","swim","hiit","pilates","hotworx","class","rowing","cardio_machine","mobility"].includes(type);
}
function muscleColor(n) {
  n=(n||"").toLowerCase();
  if(n.includes("press")||n.includes("delt")||n.includes("shoulder")||n.includes("lateral")||n.includes("raise")||n.includes("seated db"))return"#ff9f47";
  if(n.includes("pull")||n.includes("row")||n.includes("back")||n.includes("lat")||n.includes("deadlift")||n.includes("face pull"))return"#47c8ff";
  if(n.includes("chest")||n.includes("fly")||n.includes("pec")||n.includes("incline")||n.includes("bench"))return"#c447ff";
  if(n.includes("squat")||n.includes("leg")||n.includes("lunge")||n.includes("calf"))return"#ff6b6b";
  if(n.includes("curl")||n.includes("bicep"))return"#e8ff47";
  if(n.includes("tricep")||n.includes("skull")||n.includes("overhead")||n.includes("extension")||n.includes("rope")||n.includes("dip"))return"#aaffaa";
  return"#888";
}
function muscleGroup(n) {
  n=(n||"").toLowerCase();
  if(n.includes("incline")||n.includes("bench")||n.includes("chest")||n.includes("pec")||n.includes("fly"))return"Chest";
  if(n.includes("dip"))return"Triceps";
  if(n.includes("seated db")||n.includes("shoulder press")||n.includes("lateral")||n.includes("face pull")||n.includes("rear delt"))return"Shoulders";
  if(n.includes("deadlift")||n.includes("cable row")||n.includes("lat pull")||n.includes("pulldown"))return"Back";
  if(n.includes("squat")||n.includes("leg press")||n.includes("leg curl")||n.includes("leg extension")||n.includes("romanian")||n.includes("calf"))return"Legs";
  if(n.includes("curl")||n.includes("bicep"))return"Biceps";
  if(n.includes("tricep")||n.includes("skull")||n.includes("overhead")||n.includes("rope"))return"Triceps";
  return"Other";
}

function MacroBar({ label, value, goal, color }) {
  const pct=Math.min((value/goal)*100,100), over=value>goal;
  return (
    <div style={{marginBottom:9}}>
      <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'DM Mono',monospace",fontSize:10,marginBottom:3}}>
        <span style={{color:over?"#ff6b6b":"#555",letterSpacing:1}}>{label.toUpperCase()}</span>
        <span style={{color:over?"#ff6b6b":color}}>{value}<span style={{color:"#252525"}}>/{goal}{label==="Cal"?"":"g"}</span></span>
      </div>
      <div style={{background:"#141414",borderRadius:3,height:5}}>
        <div style={{width:`${pct}%`,height:"100%",background:over?"#ff6b6b":color,borderRadius:3,transition:"width 0.5s"}}/>
      </div>
    </div>
  );
}

function ratingColor(score) {
  return !score?"#555":score>=8?"#4aff7a":score>=6?"#e8ff47":score>=4?"#ff9f47":"#ff6b6b";
}

function MealRatingModal({ meal, onClose, onRated }) {
  // If already rated, seed with existing values; otherwise compute fresh
  const [rating, setRating] = useState(meal.rating ? { score: meal.rating, notes: meal.ratingNote||"" } : null);
  const [loading, setLoading] = useState(!meal.rating);

  useEffect(()=>{
    if (meal.rating) return; // already rated — skip re-computation
    const go = async () => {
      setLoading(true);
      await new Promise(r=>setTimeout(r,1100));
      const totalCal=meal.cal||0, protein=meal.protein||0, fat=meal.fat||0;
      const proteinPct=(protein*4/Math.max(totalCal,1))*100;
      let score=5;
      if(proteinPct>35)score+=2.5; else if(proteinPct>25)score+=1.5; else if(proteinPct<15)score-=2;
      if(fat>30)score-=1.5;
      score=Math.max(1,Math.min(10,+score.toFixed(1)));
      const notes=score>=8?"Strong macro split for recomp — high protein, controlled fat. This meal works hard for your goals."
        :score>=6?"Decent meal with room to optimize. Bumping protein or reducing fat would improve the score."
        :score>=4?"Moderate choice. Consider swapping for a leaner protein source to improve the macro balance."
        :"Poor macro split for your goals. High in fat/carbs with low protein. Occasional treat is fine but avoid making this a staple.";
      const result = { score, notes };
      setRating(result);
      setLoading(false);
      // Persist immediately when computed
      onRated && onRated(result);
    };
    go();
  },[]);

  const sc = ratingColor(rating?.score);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(8px)"}}>
      <div style={{background:"#0c0c0c",border:"1px solid #1e1e1e",borderRadius:20,padding:24,width:320,maxWidth:"90vw"}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#333",letterSpacing:2,marginBottom:4}}>AI MEAL RATING</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,color:"#bbb",letterSpacing:1,marginBottom:16}}>{meal.name.toUpperCase()}</div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,background:"#111",borderRadius:12,padding:"12px 16px"}}>
          {loading
            ? <div style={{width:18,height:18,border:"2px solid #222",borderTop:"2px solid #888",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
            : <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,color:sc,lineHeight:1}}>{rating?.score}</div>}
          <div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#333",letterSpacing:1}}>{loading?"ANALYZING...":"RECOMP SCORE / 10"}</div>
            {!loading&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:sc,marginTop:3}}>{rating?.score>=8?"EXCELLENT":rating?.score>=6?"GOOD":rating?.score>=4?"FAIR":"POOR"} CHOICE</div>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>
          {[["CAL",meal.cal,"#e8ff47"],["PRO",`${meal.protein}g`,"#47c8ff"],["CARB",`${meal.carbs}g`,"#ff9f47"],["FAT",`${meal.fat}g`,"#c447ff"]].map(([l,v,c])=>(
            <div key={l} style={{background:"#111",borderRadius:8,padding:"8px 4px",textAlign:"center"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:c,lineHeight:1}}>{v}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        {rating&&<div style={{fontSize:12,color:"#666",lineHeight:1.7,marginBottom:16,padding:"10px 12px",background:"#080808",borderRadius:10,borderLeft:"3px solid "+sc}}>{rating.notes}</div>}
        <button onClick={onClose} style={{width:"100%",padding:12,background:"#e8ff47",border:"none",borderRadius:10,color:"#080808",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:2,cursor:"pointer"}}>DONE</button>
      </div>
    </div>
  );
}

function ManualModal({ meal, onAdd, onClose }) {
  const [f,setF]=useState({name:"",calories:"",protein:"",carbs:"",fat:""});
  const s={background:"#0a0a0a",border:"1px solid #202020",borderRadius:6,padding:"8px 10px",color:"#ccc",fontFamily:"'DM Mono',monospace",fontSize:12,width:"100%",outline:"none",boxSizing:"border-box"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(8px)"}}>
      <div style={{background:"#0c0c0c",border:"1px solid #1e1e1e",borderRadius:16,padding:24,width:320}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#e8ff47",letterSpacing:2,marginBottom:14}}>ADD TO {meal.toUpperCase()}</div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          <input value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="Food name *" style={s}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[["Calories *","calories"],["Protein (g)","protein"],["Carbs (g)","carbs"],["Fat (g)","fat"]].map(([p,k])=>(
              <input key={k} value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} placeholder={p} type="number" style={s}/>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{flex:1,padding:9,background:"transparent",border:"1px solid #1e1e1e",borderRadius:7,color:"#444",fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer"}}>CANCEL</button>
          <button onClick={()=>{if(f.name&&f.calories){onAdd({name:f.name,calories:+f.calories,protein:+f.protein||0,carbs:+f.carbs||0,fat:+f.fat||0,id:Date.now()});onClose();}}}
            style={{flex:2,padding:9,background:"#e8ff47",border:"none",borderRadius:7,color:"#080808",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:1.5,cursor:"pointer"}}>ADD</button>
        </div>
      </div>
    </div>
  );
}

// ── Food Tab ───────────────────────────────────────────────────────────────
function FoodTab({ log, activeDate, onSave }) {
  const [modal,setModal]=useState(null);
  const [ratingMeal,setRatingMeal]=useState(null); // { name, cal, protein, carbs, fat, _slot, _id? }
  const dayData=log[activeDate]||{};
  const meals=MEAL_SLOTS.reduce((a,m)=>({...a,[m]:dayData[m]||[]}),{});
  const totals=Object.values(meals).flat().reduce((a,f)=>({calories:a.calories+f.calories,protein:a.protein+f.protein,carbs:a.carbs+f.carbs,fat:a.fat+f.fat}),{calories:0,protein:0,carbs:0,fat:0});
  const calLeft=MACRO_GOAL.calories-totals.calories;
  const addFood=(meal,food)=>onSave({...log,[activeDate]:{...dayData,[meal]:[...(dayData[meal]||[]),food]}});
  const removeFood=(meal,id)=>onSave({...log,[activeDate]:{...dayData,[meal]:(dayData[meal]||[]).filter(f=>f.id!==id)}});

  // Persist rating back onto the food item or meal slot
  const saveRating = (result) => {
    if (!ratingMeal) return;
    const { _slot, _id } = ratingMeal;
    const slotFoods = dayData[_slot] || [];
    let updated;
    if (_id) {
      // Rating a single food item
      updated = slotFoods.map(f => f.id === _id ? { ...f, rating: result.score, ratingNote: result.notes } : f);
    } else {
      // Rating the whole meal slot — attach to first item as representative
      updated = slotFoods.map((f, i) => i === 0 ? { ...f, _mealRating: result.score, _mealRatingNote: result.notes } : f);
    }
    onSave({ ...log, [activeDate]: { ...dayData, [_slot]: updated } });
  };

  return (
    <div style={{paddingBottom:40}}>
      {ratingMeal&&<MealRatingModal meal={ratingMeal} onClose={()=>setRatingMeal(null)} onRated={saveRating}/>}
      <div style={{margin:"0 14px 12px",background:"#0c0c0c",border:"1px solid #181818",borderRadius:14,padding:"13px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#3a3a3a",letterSpacing:1.5}}>DAILY MACROS</div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:calLeft<0?"#ff6b6b":"#e8ff47",lineHeight:1}}>{Math.abs(calLeft)}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#3a3a3a",letterSpacing:1}}>{calLeft<0?"OVER":"CAL LEFT"}</div>
          </div>
        </div>
        <MacroBar label="Cal" value={totals.calories} goal={MACRO_GOAL.calories} color="#e8ff47"/>
        <MacroBar label="Protein" value={totals.protein} goal={MACRO_GOAL.protein} color="#47c8ff"/>
        <MacroBar label="Carbs" value={totals.carbs} goal={MACRO_GOAL.carbs} color="#ff9f47"/>
        <MacroBar label="Fat" value={totals.fat} goal={MACRO_GOAL.fat} color="#c447ff"/>
      </div>

      {MEAL_SLOTS.map(meal=>{
        const foods=meals[meal];
        const mc=foods.reduce((s,f)=>s+f.calories,0),mp=foods.reduce((s,f)=>s+f.protein,0);
        const mt={cal:mc,protein:mp,carbs:foods.reduce((s,f)=>s+f.carbs,0),fat:foods.reduce((s,f)=>s+f.fat,0)};
        return (
          <div key={meal} style={{margin:"0 14px 9px",background:"#0c0c0c",border:"1px solid #181818",borderRadius:11,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 13px 8px"}}>
              <div>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:2,color:"#bbb"}}>{meal.toUpperCase()}</span>
                {foods.length>0&&<span style={{marginLeft:7,fontFamily:"'DM Mono',monospace",fontSize:9,color:"#333"}}>{mc} kcal · {mp}g pro</span>}
              </div>
              <div style={{display:"flex",gap:5}}>
                {foods.length>0&&(()=>{
                  const mealRating=foods[0]?._mealRating;
                  const sc=ratingColor(mealRating);
                  return <button onClick={()=>setRatingMeal({name:meal,...mt,_slot:meal,rating:mealRating,ratingNote:foods[0]?._mealRatingNote})}
                    style={{background:"#0a1a0a",border:`1px solid ${mealRating?"#1e4a1e":"#1e3a1e"}`,borderRadius:5,color:mealRating?sc:"#4aff7a",fontFamily:"'DM Mono',monospace",fontSize:9,padding:"3px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                    {mealRating&&<span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,lineHeight:1}}>{mealRating}</span>}
                    {mealRating?"re-rate":"rate"}
                  </button>;
                })()}
                <button onClick={()=>setModal(meal)} style={{background:"#141414",border:"1px solid #222",borderRadius:5,color:"#444",fontFamily:"'DM Mono',monospace",fontSize:9,padding:"3px 8px",cursor:"pointer"}}>+add</button>
              </div>
            </div>
            {foods.length===0
              ?<div style={{padding:"2px 13px 10px",fontFamily:"'DM Mono',monospace",fontSize:9,color:"#1a1a1a"}}>Nothing logged</div>
              :<div style={{borderTop:"1px solid #111"}}>
                {foods.map(f=>(
                  <div key={f.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 13px",borderBottom:"1px solid #0e0e0e"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{fontSize:12,color:"#aaa",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.name}</div>
                        {f.rating&&(
                          <button onClick={()=>setRatingMeal({name:f.name,cal:f.calories,protein:f.protein,carbs:f.carbs,fat:f.fat,_slot:meal,_id:f.id,rating:f.rating,ratingNote:f.ratingNote})}
                            style={{background:ratingColor(f.rating)+"22",border:`1px solid ${ratingColor(f.rating)}44`,borderRadius:4,color:ratingColor(f.rating),fontFamily:"'Bebas Neue',sans-serif",fontSize:10,padding:"1px 5px",cursor:"pointer",flexShrink:0,lineHeight:1.4}}>
                            {f.rating}
                          </button>
                        )}
                      </div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#333",marginTop:2}}>
                        <span style={{color:"#e8ff47"}}>{f.calories}cal</span>
                        {f.protein>0&&<span> · <span style={{color:"#47c8ff"}}>{f.protein}p</span></span>}
                        {f.carbs>0&&<span> · <span style={{color:"#ff9f47"}}>{f.carbs}c</span></span>}
                        {f.fat>0&&<span> · <span style={{color:"#c447ff"}}>{f.fat}f</span></span>}
                      </div>
                    </div>
                    <button onClick={()=>removeFood(meal,f.id)} style={{background:"none",border:"none",color:"#222",cursor:"pointer",fontSize:14,padding:"0 3px",flexShrink:0}}>x</button>
                  </div>
                ))}
              </div>
            }
          </div>
        );
      })}

      <div style={{margin:"8px 14px 0",background:"#0c0c0c",border:"1px solid #181818",borderRadius:10,padding:"10px 13px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",textAlign:"center"}}>
          {[["CAL",totals.calories,"#e8ff47"],["PRO",`${totals.protein}g`,"#47c8ff"],["CARB",`${totals.carbs}g`,"#ff9f47"],["FAT",`${totals.fat}g`,"#c447ff"]].map(([l,v,c])=>(
            <div key={l}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,color:c,lineHeight:1}}>{v}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a",letterSpacing:0.5,marginTop:2}}>{l}</div></div>
          ))}
        </div>
      </div>
      {modal&&<ManualModal meal={modal} onAdd={f=>addFood(modal,f)} onClose={()=>setModal(null)}/>}
    </div>
  );
}

// ── Activity Card ──────────────────────────────────────────────────────────
function ActivityCard({ w, onRemove }) {
  const aType=w.type&&w.type!=="strength"?w.type:getActivityType(w.name);
  const isCardio=isCardioType(aType);
  const accentColor=isCardio?activityAccentColor(aType):muscleColor(w.name);
  const icon=activityIcon(aType);

  if(isCardio){
    return (
      <div style={{marginBottom:7,background:"#0c0c0c",border:`1px solid ${accentColor}22`,borderLeft:`3px solid ${accentColor}`,borderRadius:11,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 13px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:22,lineHeight:1}}>{icon}</div>
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:1.5,color:"#bbb"}}>{w.name.toUpperCase()}</div>
              <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                {w.duration&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:accentColor,background:accentColor+"18",padding:"2px 7px",borderRadius:4}}>{w.duration} min</span>}
                {w.intensity&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#555",background:"#141414",padding:"2px 7px",borderRadius:4}}>{w.intensity}</span>}
                {w.calories&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#ff6b6b",background:"#ff6b6b15",padding:"2px 7px",borderRadius:4}}>{w.calories} cal</span>}
                {w.location&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#333",background:"#111",padding:"2px 7px",borderRadius:4}}>{w.location}</span>}
              </div>
              {w.notes&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a",marginTop:5,lineHeight:1.5}}>{w.notes}</div>}
            </div>
          </div>
          {onRemove&&<button onClick={()=>onRemove(w.id)} style={{background:"none",border:"none",color:"#222",cursor:"pointer",fontSize:14,padding:"0 3px",flexShrink:0}}>x</button>}
        </div>
      </div>
    );
  }

  const sets=w.sets||[];
  const vol=sets.reduce((s,set)=>{const w2=set.weight==="BW"?208:(+set.weight||0);return s+w2*(+set.reps||0);},0);
  const nonBW=sets.filter(s=>s.weight!=="BW");
  const maxW=nonBW.length>0?Math.max(...nonBW.map(s=>+s.weight||0)):"BW";
  return (
    <div style={{marginBottom:7,background:"#0c0c0c",border:"1px solid #181818",borderRadius:11,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 13px 7px",borderBottom:"1px solid #111"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:3,height:14,background:accentColor,borderRadius:2}}/>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1.5,color:"#bbb"}}>{w.name.toUpperCase()}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2e2e2e",marginTop:1}}>{sets.length} sets · max {maxW}{maxW!=="BW"?"lb":""} · {vol.toLocaleString()} vol</div>
          </div>
        </div>
        {onRemove&&<button onClick={()=>onRemove(w.id)} style={{background:"none",border:"none",color:"#222",cursor:"pointer",fontSize:14,padding:"0 3px"}}>x</button>}
      </div>
      <div style={{padding:"5px 13px 9px"}}>
        <div style={{display:"grid",gridTemplateColumns:"18px 1fr 1fr 1fr",gap:3,marginBottom:3}}>
          {["","WEIGHT","REPS","VOL"].map((h,i)=>(<div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a",letterSpacing:1}}>{h}</div>))}
        </div>
        {sets.map((set,i)=>{
          const w2=set.weight==="BW"?208:(+set.weight||0);
          const sv=w2*(+set.reps||0);
          return (
            <div key={i} style={{display:"grid",gridTemplateColumns:"18px 1fr 1fr 1fr",gap:3,padding:"3px 0",borderTop:"1px solid #0e0e0e"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:"#2a2a2a"}}>{i+1}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#999"}}>{set.weight}{set.weight!=="BW"?"lb":""}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#999"}}>{set.reps}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#3a3a3a"}}>{sv>0?sv.toLocaleString():"—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Workout Tab ────────────────────────────────────────────────────────────
function WorkoutTab({ log, activeDate, onSave }) {
  const dayData=log[activeDate]||{};
  const workouts=dayData.workouts||[];
  const cardio=workouts.filter(w=>{const t=w.type&&w.type!=="strength"?w.type:getActivityType(w.name);return isCardioType(t);});
  const strength=workouts.filter(w=>{const t=w.type&&w.type!=="strength"?w.type:getActivityType(w.name);return!isCardioType(t);});
  const totalSets=strength.reduce((s,w)=>s+(w.sets||[]).length,0);
  const totalVol=strength.reduce((s,w)=>s+(w.sets||[]).reduce((s2,set)=>{const w2=set.weight==="BW"?208:(+set.weight||0);return s2+w2*(+set.reps||0);},0),0);
  const byMuscle={};
  strength.forEach(w=>{const mg=muscleGroup(w.name);if(!byMuscle[mg])byMuscle[mg]=[];byMuscle[mg].push(w);});
  const removeEx=id=>onSave({...log,[activeDate]:{...dayData,workouts:workouts.filter(w=>w.id!==id)}});
  const sessionType=dayData.workoutName?getActivityType(dayData.workoutName):"strength";

  return (
    <div style={{paddingBottom:40}}>
      <div style={{margin:"0 14px 12px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
        {[["EX",workouts.length,"#47c8ff"],["SETS",totalSets||"—","#ff9f47"],["VOL",totalVol>0?`${Math.round(totalVol/1000)}k`:"—","#c447ff"],["BURN",dayData.calsBurned>0?dayData.calsBurned:"—","#ff6b6b"]].map(([l,v,c])=>(
          <div key={l} style={{background:"#0c0c0c",border:"1px solid #181818",borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:c,lineHeight:1}}>{v}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a",letterSpacing:0.5,marginTop:3}}>{l}</div>
          </div>
        ))}
      </div>

      {dayData.analysis&&(
        <div style={{margin:"0 14px 12px",background:"#0c0c0c",border:"1px solid #1a2e1a",borderRadius:14,padding:"13px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:"#4aff7a",letterSpacing:2}}>
              {activityIcon(sessionType)} {(dayData.workoutName||"WORKOUT").toUpperCase()}
            </div>
            {dayData.rating&&<div style={{background:"#111",borderRadius:6,padding:"3px 10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:"#e8ff47"}}>{dayData.rating}/10</div>}
          </div>
          <div style={{fontSize:12,color:"#888",lineHeight:1.7}}>{dayData.analysis}</div>
          {dayData.calsBurned>0&&(
            <div style={{marginTop:12,display:"flex",alignItems:"center",gap:12,background:"#111",borderRadius:8,padding:"10px 14px"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:"#ff6b6b",lineHeight:1}}>{dayData.calsBurned}</div>
              <div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#555",letterSpacing:1}}>EST. CALORIES BURNED</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a"}}>208lb bodyweight</div>
              </div>
            </div>
          )}
        </div>
      )}

      {workouts.length===0&&(
        <div style={{margin:"0 14px 12px",background:"#0c0c0c",border:"1px dashed #181818",borderRadius:12,padding:"28px 20px",textAlign:"center"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:"#1e1e1e",letterSpacing:2,marginBottom:6}}>REST DAY</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#1a1a1a",lineHeight:1.9}}>Navigate to other days to see the full week</div>
        </div>
      )}

      {cardio.length>0&&(
        <div style={{margin:"0 14px 10px"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#333",letterSpacing:2,marginBottom:5,paddingLeft:2}}>CARDIO & CLASSES</div>
          {cardio.map(w=><ActivityCard key={w.id} w={w} onRemove={removeEx}/>)}
        </div>
      )}

      {Object.entries(byMuscle).map(([group,exercises])=>(
        <div key={group} style={{margin:"0 14px 10px"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#333",letterSpacing:2,marginBottom:5,paddingLeft:2}}>{group.toUpperCase()}</div>
          {exercises.map(w=><ActivityCard key={w.id} w={w} onRemove={removeEx}/>)}
        </div>
      ))}
    </div>
  );
}

// ── Trends Tab ─────────────────────────────────────────────────────────────
function TrendsTab({ foodLog, workoutLog }) {
  const [section,setSection]=useState("nutrition");
  const [ratingMeal,setRatingMeal]=useState(null);

  // Compute real weekly stats from dummy data
  const weekStats = WEEK.map(date=>{
    const dayFood=foodLog[date]||{};
    const allFoods=MEAL_SLOTS.flatMap(m=>dayFood[m]||[]);
    const cal=allFoods.reduce((s,f)=>s+f.calories,0);
    const protein=allFoods.reduce((s,f)=>s+f.protein,0);
    const d=new Date(date+"T12:00:00");
    const dow=d.getDay();
    const isWeekend=dow===0||dow===6;
    const dayLabel=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dow];
    const w=workoutLog[date]||{};
    return {date,dayLabel,cal,protein,isWeekend,calsBurned:w.calsBurned||0,rating:w.rating||null,workoutName:w.workoutName||null};
  });

  const weekdays=weekStats.filter(d=>!d.isWeekend&&d.cal>0);
  const weekends=weekStats.filter(d=>d.isWeekend&&d.cal>0);
  const avgWdCal=weekdays.length?Math.round(weekdays.reduce((s,d)=>s+d.cal,0)/weekdays.length):0;
  const avgWeCal=weekends.length?Math.round(weekends.reduce((s,d)=>s+d.cal,0)/weekends.length):0;
  const avgWdPro=weekdays.length?Math.round(weekdays.reduce((s,d)=>s+d.protein,0)/weekdays.length):0;
  const avgWePro=weekends.length?Math.round(weekends.reduce((s,d)=>s+d.protein,0)/weekends.length):0;
  const calDiff=avgWeCal-avgWdCal;
  const proDiff=avgWePro-avgWdPro;
  const maxCal=Math.max(...weekStats.map(d=>d.cal),1);

  // Muscle group frequency from real workouts
  const muscleFreq={};
  const cardioFreq={};
  WEEK.forEach(date=>{
    const w=workoutLog[date];
    if(!w||!w.workouts) return;
    w.workouts.forEach(ex=>{
      const t=ex.type&&ex.type!=="strength"?ex.type:getActivityType(ex.name);
      if(isCardioType(t)){
        const grp=t==="yoga"?"Yoga/Flex":t==="cycling"?"Cycling":t==="hotworx"?"HOTWORX":t==="walk"?"Walking":"Cardio";
        if(!cardioFreq[grp])cardioFreq[grp]={sessions:0,mins:0};
        cardioFreq[grp].sessions++;
        cardioFreq[grp].mins+=(ex.duration||0);
      } else {
        const mg=muscleGroup(ex.name);
        if(!muscleFreq[mg])muscleFreq[mg]={sets:0};
        muscleFreq[mg].sets+=(ex.sets||[]).length;
      }
    });
  });
  const allGroups=["Chest","Back","Shoulders","Legs","Biceps","Triceps"];
  const muscleRows=allGroups.map(g=>{
    const sets=muscleFreq[g]?.sets||0;
    const status=sets>=30?"optimal":sets>=12?"under":"neglected";
    const color={Chest:"#c447ff",Back:"#47c8ff",Shoulders:"#ff9f47",Legs:"#ff6b6b",Biceps:"#e8ff47",Triceps:"#aaffaa"}[g]||"#888";
    return {group:g,sets,status,color};
  });
  const cardioRows=Object.entries(cardioFreq).map(([g,v])=>({group:g,sessions:v.sessions,mins:v.mins,color:"#4aff7a"}));

  // PRs - find max weight per strength exercise across the week
  const prMap={};
  WEEK.forEach(date=>{
    const w=workoutLog[date];
    if(!w?.workouts) return;
    w.workouts.forEach(ex=>{
      const t=ex.type&&ex.type!=="strength"?ex.type:getActivityType(ex.name);
      if(isCardioType(t)) return;
      (ex.sets||[]).forEach(set=>{
        const wt=set.weight==="BW"?208:(+set.weight||0);
        if(!prMap[ex.name]||wt>prMap[ex.name].weight||(wt===prMap[ex.name].weight&&+set.reps>prMap[ex.name].reps)){
          prMap[ex.name]={weight:set.weight,reps:+set.reps,date};
        }
      });
    });
  });
  const prs=Object.entries(prMap).slice(0,6).map(([name,v])=>({exercise:name,...v}));

  // Best/worst days sorted by cal deviation
  const sortedDays=[...weekStats].filter(d=>d.cal>0).sort((a,b)=>{
    const aS=Math.abs(a.cal-MACRO_GOAL.calories)/MACRO_GOAL.calories+Math.abs(a.protein-MACRO_GOAL.protein)/MACRO_GOAL.protein;
    const bS=Math.abs(b.cal-MACRO_GOAL.calories)/MACRO_GOAL.calories+Math.abs(b.protein-MACRO_GOAL.protein)/MACRO_GOAL.protein;
    return aS-bS;
  });

  // ── Weekly Scores ─────────────────────────────────────────────────────────
  // NUTRITION SCORE /10
  // Per day: start at 10, deduct for cal deviation, protein miss, weekend surplus
  const loggedDays = weekStats.filter(d=>d.cal>0);
  const nutritionDayScores = loggedDays.map(d=>{
    let s = 10;
    const calDev = Math.abs(d.cal - MACRO_GOAL.calories) / MACRO_GOAL.calories;
    const proDev = Math.max(0, MACRO_GOAL.protein - d.protein) / MACRO_GOAL.protein;
    s -= calDev * 4;       // up to -4 for being way off calories
    s -= proDev * 3;       // up to -3 for missing protein
    if(d.isWeekend && d.cal > MACRO_GOAL.calories * 1.15) s -= 1.5; // weekend blowout penalty
    return Math.max(1, Math.min(10, +s.toFixed(1)));
  });
  const nutritionScore = loggedDays.length
    ? +(nutritionDayScores.reduce((a,b)=>a+b,0)/nutritionDayScores.length).toFixed(1)
    : null;
  // Breakdown labels
  const daysLogged = loggedDays.length;
  const daysOnTarget = loggedDays.filter(d=>{
    return Math.abs(d.cal-MACRO_GOAL.calories)/MACRO_GOAL.calories < 0.1 && d.protein >= MACRO_GOAL.protein*0.9;
  }).length;
  const avgProtein = daysLogged ? Math.round(loggedDays.reduce((s,d)=>s+d.protein,0)/daysLogged) : 0;
  const nutritionGrade = !nutritionScore?"—":nutritionScore>=8.5?"A":nutritionScore>=7.5?"B":nutritionScore>=6.5?"C":nutritionScore>=5?"D":"F";
  const nutritionVerdict = !nutritionScore?"No data":nutritionScore>=8.5?"Dialed in":nutritionScore>=7.5?"Solid week":nutritionScore>=6.5?"Room to improve":nutritionScore>=5?"Inconsistent":"Needs work";

  // WORKOUT SCORE /10
  // Average of session ratings, penalize missing days (>1 rest day in 7)
  const sessionRatings = WEEK.map(date=>workoutLog[date]?.rating||null).filter(Boolean);
  const workoutDaysCount = WEEK.filter(date=>workoutLog[date]?.workouts?.length>0).length;
  const restDays = 7 - workoutDaysCount;
  const rawWorkoutScore = sessionRatings.length
    ? sessionRatings.reduce((a,b)=>a+b,0)/sessionRatings.length
    : 0;
  const restPenalty = Math.max(0, restDays - 1) * 0.3; // 1 rest day is fine, each extra costs 0.3
  const workoutScore = sessionRatings.length
    ? +(Math.max(1, rawWorkoutScore - restPenalty)).toFixed(1)
    : null;
  const totalSetsWeek = WEEK.reduce((acc,date)=>{
    const w=workoutLog[date];
    if(!w?.workouts) return acc;
    return acc+w.workouts.reduce((s,ex)=>s+(ex.sets?.length||0),0);
  },0);
  const totalCalsBurned = WEEK.reduce((acc,date)=>acc+(workoutLog[date]?.calsBurned||0),0);
  const workoutGrade = !workoutScore?"—":workoutScore>=9?"A+":workoutScore>=8.5?"A":workoutScore>=7.5?"B":workoutScore>=6.5?"C":"D";
  const workoutVerdict = !workoutScore?"No data":workoutScore>=9?"Elite week":workoutScore>=8.5?"Excellent":workoutScore>=7.5?"Strong":workoutScore>=6.5?"Decent":"Below target";

  // Combined weekly grade
  const bothScores = [nutritionScore, workoutScore].filter(Boolean);
  const overallScore = bothScores.length ? +(bothScores.reduce((a,b)=>a+b,0)/bothScores.length).toFixed(1) : null;

  return (
    <div style={{paddingBottom:40}}>
      {ratingMeal&&<MealRatingModal meal={ratingMeal} onClose={()=>setRatingMeal(null)}/>}

      {/* ── Weekly Score Banner ── */}
      <div style={{margin:"0 14px 14px"}}>
        {/* Overall score */}
        {overallScore&&(
          <div style={{background:"#0c0c0c",border:"1px solid #252525",borderRadius:14,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a",letterSpacing:2,marginBottom:4}}>WEEK OF {new Date(WEEK[0]+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})} – {new Date(WEEK[6]+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#555",letterSpacing:1}}>
                {workoutDaysCount} sessions · {totalSetsWeek} sets · {totalCalsBurned.toLocaleString()} cal burned
              </div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:42,color:ratingColor(overallScore),lineHeight:1}}>{overallScore}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a",letterSpacing:1,marginTop:1}}>OVERALL / 10</div>
            </div>
          </div>
        )}

        {/* Two score cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {/* Nutrition score */}
          <div style={{background:"#0c0c0c",border:`1px solid ${ratingColor(nutritionScore)}22`,borderRadius:12,padding:"12px 12px 10px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:ratingColor(nutritionScore),opacity:0.6,borderRadius:"12px 12px 0 0"}}/>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a",letterSpacing:1.5,marginBottom:8}}>NUTRITION</div>
            <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:8}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:ratingColor(nutritionScore),lineHeight:1}}>{nutritionScore||"—"}</div>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#444",lineHeight:1}}>{nutritionGrade}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a"}}>/ 10</div>
              </div>
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:ratingColor(nutritionScore),marginBottom:8,letterSpacing:0.5}}>{nutritionVerdict}</div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {[
                [`${daysLogged}/7 days logged`, daysLogged>=5?"#4aff7a":"#ff9f47"],
                [`${daysOnTarget} days on target`, daysOnTarget>=4?"#4aff7a":"#ff9f47"],
                [`${avgProtein}g avg protein`, avgProtein>=MACRO_GOAL.protein*0.9?"#47c8ff":"#ff9f47"],
              ].map(([label,c])=>(
                <div key={label} style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:c,display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:3,height:3,borderRadius:"50%",background:c,flexShrink:0}}/>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Workout score */}
          <div style={{background:"#0c0c0c",border:`1px solid ${ratingColor(workoutScore)}22`,borderRadius:12,padding:"12px 12px 10px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:ratingColor(workoutScore),opacity:0.6,borderRadius:"12px 12px 0 0"}}/>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a",letterSpacing:1.5,marginBottom:8}}>TRAINING</div>
            <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:8}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:ratingColor(workoutScore),lineHeight:1}}>{workoutScore||"—"}</div>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#444",lineHeight:1}}>{workoutGrade}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a"}}>/ 10</div>
              </div>
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:ratingColor(workoutScore),marginBottom:8,letterSpacing:0.5}}>{workoutVerdict}</div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {[
                [`${workoutDaysCount}/7 sessions`, workoutDaysCount>=5?"#4aff7a":"#ff9f47"],
                [`${totalSetsWeek} total sets`, totalSetsWeek>=100?"#4aff7a":"#ff9f47"],
                [`${totalCalsBurned.toLocaleString()} cal burned`, totalCalsBurned>=2000?"#ff6b6b":"#ff9f47"],
              ].map(([label,c])=>(
                <div key={label} style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:c,display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:3,height:3,borderRadius:"50%",background:c,flexShrink:0}}/>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{margin:"0 14px 14px",display:"flex",background:"#0c0c0c",border:"1px solid #181818",borderRadius:10,padding:3}}>
        {[["nutrition","NUTRITION"],["workout","TRAINING"],["meals","SAVED"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSection(k)} style={{flex:1,padding:"7px 4px",background:section===k?"#181818":"transparent",border:"none",borderRadius:7,color:section===k?"#e8ff47":"#2a2a2a",fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1,cursor:"pointer",transition:"all 0.2s"}}>{l}</button>
        ))}
      </div>

      {section==="nutrition"&&(
        <>
          <div style={{margin:"0 14px 12px",background:"#0c0c0c",border:"1px solid #181818",borderRadius:14,padding:"14px"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#3a3a3a",letterSpacing:1.5,marginBottom:12}}>WEEKDAY VS WEEKEND</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[["WEEKDAY AVG",avgWdCal,"#47c8ff",avgWdPro],["WEEKEND AVG",avgWeCal,"#ff6b6b",avgWePro]].map(([l,cal,c,pro])=>(
                <div key={l} style={{background:"#111",borderRadius:10,padding:"12px 10px"}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#333",letterSpacing:1,marginBottom:4}}>{l}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:c,lineHeight:1}}>{cal}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a",marginTop:2}}>cal · {pro}g pro</div>
                </div>
              ))}
            </div>
            {calDiff>0&&(
              <div style={{background:"#1a0808",border:"1px solid #4a1a1a",borderRadius:10,padding:"10px 12px",marginBottom:14}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#ff8a6a",lineHeight:1.6}}>
                  Weekend calories are <span style={{color:"#ff6b6b",fontWeight:700}}>+{calDiff} cal</span> and <span style={{color:"#ff6b6b"}}>-{Math.abs(proDiff)}g protein</span> vs weekdays. Over a month that's ~{Math.round(calDiff*8/3500*10)/10}lb of potential fat gain from weekends alone.
                </div>
              </div>
            )}
            <div style={{display:"flex",alignItems:"flex-end",gap:4,height:90}}>
              {weekStats.map(d=>{
                const pct=d.cal>0?(d.cal/maxCal)*100:0;
                const color=d.isWeekend?"#ff6b6b":d.cal>0&&d.cal<=MACRO_GOAL.calories?"#47c8ff":d.cal>0?"#ff9f47":"#1a1a1a";
                return (
                  <div key={d.dayLabel} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    {d.cal>0&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:6,color:color}}>{d.cal>=1000?`${(d.cal/1000).toFixed(1)}k`:d.cal}</div>}
                    <div style={{width:"100%",background:"#111",borderRadius:3,height:60,display:"flex",alignItems:"flex-end"}}>
                      <div style={{width:"100%",background:color,borderRadius:3,height:`${pct}%`,opacity:0.85,transition:"height 0.5s"}}/>
                    </div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:d.isWeekend?"#ff6b6b":"#333"}}>{d.dayLabel}</div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:12,marginTop:8}}>
              {[["#47c8ff","On target"],["#ff9f47","Over goal"],["#ff6b6b","Weekend"]].map(([c,l])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:6,height:6,background:c,borderRadius:"50%"}}/>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a"}}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{margin:"0 14px 12px",background:"#0c0c0c",border:"1px solid #181818",borderRadius:14,padding:"14px"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#3a3a3a",letterSpacing:1.5,marginBottom:10}}>BEST & WORST DAYS THIS WEEK</div>
            {sortedDays.map((d,i)=>{
              const cd=d.cal-MACRO_GOAL.calories, pd=d.protein-MACRO_GOAL.protein;
              const isBest=i===0, isWorst=i===sortedDays.length-1;
              return (
                <div key={d.date} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #0e0e0e"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontSize:12,width:16}}>{isBest?"🏆":isWorst?"💀":"  "}</div>
                    <div>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:isBest?"#4aff7a":isWorst?"#ff6b6b":"#777",letterSpacing:1}}>
                        {d.dayLabel} {d.isWeekend?"(wknd)":""}
                      </div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a"}}>{d.cal} cal · {d.protein}g pro</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:cd>0?"#ff6b6b":"#4aff7a"}}>{cd>0?"+":""}{cd} cal</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:pd<0?"#ff9f47":"#47c8ff"}}>{pd>0?"+":""}{pd}g pro</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {section==="workout"&&(
        <>
          <div style={{margin:"0 14px 12px",background:"#0c0c0c",border:"1px solid #181818",borderRadius:14,padding:"14px"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#3a3a3a",letterSpacing:1.5,marginBottom:12}}>WEEK AT A GLANCE</div>
            <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4}}>
              {weekStats.map(d=>{
                const w=workoutLog[d.date];
                const hasWorkout=w&&w.workouts&&w.workouts.length>0;
                const wType=w?.workoutName?getActivityType(w.workoutName):"rest";
                const ic=hasWorkout?activityIcon(wType):"—";
                const bc=hasWorkout?activityAccentColor(wType):"#1a1a1a";
                return (
                  <div key={d.dayLabel} style={{flex:"0 0 calc(14.28% - 4px)",background:"#111",borderRadius:8,padding:"8px 4px",textAlign:"center",border:`1px solid ${bc}22`}}>
                    <div style={{fontSize:16,lineHeight:1,marginBottom:4}}>{ic}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,color:hasWorkout?"#bbb":"#2a2a2a",letterSpacing:1}}>{d.dayLabel}</div>
                    {w?.rating&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#e8ff47",marginTop:2}}>{w.rating}/10</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{margin:"0 14px 12px",background:"#0c0c0c",border:"1px solid #181818",borderRadius:14,padding:"14px"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#3a3a3a",letterSpacing:1.5,marginBottom:4}}>MUSCLE GROUP FREQUENCY</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a",marginBottom:12}}>7 days · strength sessions only</div>
            {muscleRows.map(m=>{
              const statusColor=m.status==="optimal"?"#4aff7a":m.status==="under"?"#ff9f47":"#ff6b6b";
              const statusLabel=m.status==="optimal"?"OPTIMAL":m.status==="under"?"UNDERTRAINED":"NEGLECTED";
              const barPct=Math.min((m.sets/50)*100,100);
              return (
                <div key={m.group} style={{marginBottom:11}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:3,height:11,background:m.color,borderRadius:2}}/>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:"#bbb",letterSpacing:1}}>{m.group.toUpperCase()}</span>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a"}}>{m.sets} sets</span>
                    </div>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:statusColor,background:statusColor+"15",padding:"2px 6px",borderRadius:4}}>{statusLabel}</span>
                  </div>
                  <div style={{background:"#141414",borderRadius:3,height:4}}>
                    <div style={{width:`${barPct}%`,height:"100%",background:m.status==="neglected"?"#ff6b6b55":m.color,borderRadius:3,opacity:0.8}}/>
                  </div>
                </div>
              );
            })}
            {cardioRows.length>0&&(
              <>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a",letterSpacing:1.5,margin:"14px 0 8px"}}>CARDIO & CLASSES</div>
                {cardioRows.map(m=>(
                  <div key={m.group} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #0e0e0e"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:3,height:11,background:m.color,borderRadius:2}}/>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:"#bbb",letterSpacing:1}}>{m.group.toUpperCase()}</span>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#4aff7a"}}>{m.sessions}x</span>
                      {m.mins>0&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a",marginLeft:6}}>{m.mins} min</span>}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div style={{margin:"0 14px 12px",background:"#0c0c0c",border:"1px solid #181818",borderRadius:14,padding:"14px"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#3a3a3a",letterSpacing:1.5,marginBottom:12}}>PERSONAL RECORDS THIS WEEK</div>
            {prs.map((pr,i)=>{
              const isBW=pr.weight==="BW";
              return (
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #0e0e0e"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                    <div style={{width:3,height:26,background:muscleColor(pr.exercise),borderRadius:2,flexShrink:0}}/>
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:"#bbb",letterSpacing:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pr.exercise.toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:"#e8ff47",lineHeight:1}}>{isBW?"BW":pr.weight+"lb"}</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#333"}}>x{pr.reps}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {section==="meals"&&(
        <>
          <div style={{margin:"0 14px 6px",fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a",letterSpacing:1}}>TAP RATE FOR AI SCORING ON ANY SAVED MEAL</div>
          {DEMO_SAVED_MEALS.map(meal=>{
            const sc=!meal.rating?"#555":meal.rating>=8?"#4aff7a":meal.rating>=6?"#e8ff47":meal.rating>=4?"#ff9f47":"#ff6b6b";
            return (
              <div key={meal.id} style={{margin:"0 14px 10px",background:"#0c0c0c",border:"1px solid #181818",borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"12px 14px 10px",borderBottom:"1px solid #111"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:"#bbb",letterSpacing:1.5}}>{meal.name.toUpperCase()}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{meal.items}</div>
                    </div>
                    {meal.rating&&(
                      <div style={{background:"#111",borderRadius:8,padding:"4px 10px",marginLeft:10,flexShrink:0,textAlign:"center"}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:sc,lineHeight:1}}>{meal.rating}</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:6,color:"#2a2a2a",marginTop:1}}>/ 10</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:"1px solid #111"}}>
                  {[["CAL",meal.cal,"#e8ff47"],["PRO",`${meal.protein}g`,"#47c8ff"],["CARB",`${meal.carbs}g`,"#ff9f47"],["FAT",`${meal.fat}g`,"#c447ff"]].map(([l,v,c])=>(
                    <div key={l} style={{padding:"8px 4px",textAlign:"center",borderRight:"1px solid #111"}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:c,lineHeight:1}}>{v}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:6,color:"#2a2a2a",marginTop:2}}>{l}</div>
                    </div>
                  ))}
                </div>
                {meal.ratingNote&&(
                  <div style={{padding:"8px 14px",background:"#080808",borderBottom:"1px solid #111"}}>
                    <div style={{fontSize:10,color:"#444",lineHeight:1.6,borderLeft:`2px solid ${sc}`,paddingLeft:8}}>{meal.ratingNote}</div>
                  </div>
                )}
                <div style={{display:"flex"}}>
                  <button onClick={()=>setRatingMeal(meal)} style={{flex:1,padding:"9px 0",background:"transparent",border:"none",borderRight:"1px solid #111",color:"#4aff7a",fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer"}}>{meal.rating?"re-rate":"rate"}</button>
                  <button style={{flex:1,padding:"9px 0",background:"transparent",border:"none",color:"#6a8aff",fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer"}}>log again</button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Recap Card ────────────────────────────────────────────────────────────
function RecapCard({ recap, onClose, onExpand }) {
  const isFood = recap.type === "food";
  const accentColor = isFood ? "#e8ff47" : "#4aff7a";
  const s = recap.summary;

  return (
    <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",zIndex:400,maxWidth:460,width:"calc(100% - 28px)",animation:"slideUp 0.25s ease-out"}}>
      <div style={{background:"#0c0c0c",border:`1px solid ${accentColor}33`,borderRadius:16,overflow:"hidden",boxShadow:`0 8px 40px ${accentColor}18`}}>

        {/* Quick snapshot */}
        <div style={{padding:"14px 16px 12px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
            <div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:accentColor,letterSpacing:1.5,marginBottom:3}}>
                {isFood ? "✓ FOOD LOGGED" : "✓ WORKOUT LOGGED"}
              </div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:"#ccc",letterSpacing:1,lineHeight:1.2,maxWidth:240}}>
                {(s.name||"").toUpperCase()}
              </div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:"#2a2a2a",cursor:"pointer",fontSize:16,padding:"0 2px",lineHeight:1,marginTop:2}}>×</button>
          </div>

          {/* Macro pills - food */}
          {isFood && (
            <>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {[["CAL",s.cal,"#e8ff47"],["PRO",`${s.pro}g`,"#47c8ff"],["CARB",`${s.carb}g`,"#ff9f47"],["FAT",`${s.fat}g`,"#c447ff"]].map(([l,v,c])=>(
                  <div key={l} style={{background:"#111",borderRadius:7,padding:"5px 10px",display:"flex",gap:5,alignItems:"baseline"}}>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:c,lineHeight:1}}>{v}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a"}}>{l}</span>
                  </div>
                ))}
              </div>
              <div style={{background:"#111",borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#444"}}>TODAY SO FAR</div>
                <div style={{display:"flex",gap:12,alignItems:"baseline"}}>
                  <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:s.calLeft<0?"#ff6b6b":"#e8ff47",lineHeight:1}}>{Math.abs(s.calLeft)}</span>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#333"}}>{s.calLeft<0?"CAL OVER":"CAL LEFT"}</span>
                  <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:"#47c8ff",lineHeight:1}}>{s.proLeft>0?`${s.proLeft}g pro left`:""}</span>
                </div>
              </div>
            </>
          )}

          {/* Session stats - workout */}
          {!isFood && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {s.sets>0 && <div style={{background:"#111",borderRadius:7,padding:"5px 10px",display:"flex",gap:5,alignItems:"baseline"}}><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#4aff7a",lineHeight:1}}>{s.sets}</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a"}}>SETS</span></div>}
              {s.duration && <div style={{background:"#111",borderRadius:7,padding:"5px 10px",display:"flex",gap:5,alignItems:"baseline"}}><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#47c8ff",lineHeight:1}}>{s.duration}m</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a"}}>MIN</span></div>}
              {s.calories && <div style={{background:"#111",borderRadius:7,padding:"5px 10px",display:"flex",gap:5,alignItems:"baseline"}}><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#ff6b6b",lineHeight:1}}>{s.calories}</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#2a2a2a"}}>CAL</span></div>}
            </div>
          )}
        </div>

        {/* Quip line */}
        <div style={{padding:"8px 16px",background:"#080808",borderTop:`1px solid ${accentColor}18`,borderBottom:"1px solid #111"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#555",lineHeight:1.5}}>{recap.quip}</div>
        </div>

        {/* Expanded analysis */}
        {recap.expanded && (
          <div style={{padding:"12px 16px",background:"#080808",borderTop:"1px solid #111",animation:"fadeIn 0.2s ease-out"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:accentColor,letterSpacing:1.5,marginBottom:8}}>FULL ANALYSIS</div>
            <div style={{fontSize:12,color:"#666",lineHeight:1.75,borderLeft:`2px solid ${accentColor}44`,paddingLeft:10}}>{recap.analysis}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{display:"flex",borderTop:"1px solid #111"}}>
          <button onClick={onExpand}
            style={{flex:1,padding:"10px 0",background:"transparent",border:"none",borderRight:"1px solid #111",color:accentColor,fontFamily:"'DM Mono',monospace",fontSize:9,cursor:"pointer",letterSpacing:0.5}}>
            {recap.expanded ? "hide analysis" : "full analysis ↓"}
          </button>
          <button onClick={onClose}
            style={{flex:1,padding:"10px 0",background:"transparent",border:"none",color:"#333",fontFamily:"'DM Mono',monospace",fontSize:9,cursor:"pointer"}}>
            dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Smart Input Bar (text + voice + photo) ─────────────────────────────────
function SmartInputBar({ tab, activeDate, foodLog, workoutLog, onFoodSave, onWorkoutSave }) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("text"); // text | voice | photo
  const [listening, setListening] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [toast, setToast] = useState(null);
  const [recap, setRecap] = useState(null); // { type:"food"|"workout", summary:{}, analysis:"", expanded:false }
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoData, setPhotoData] = useState(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);

  const showToast = (msg, color="#e8ff47") => { setToast({msg,color}); setTimeout(()=>setToast(null), 3000); };
  const showRecap = (data) => setRecap({ ...data, expanded: false });

  // ── Voice ──
  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast("Voice not supported in this browser","#ff6b6b"); return; }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = e => { setText(e.results[0][0].transcript); setListening(false); setMode("text"); };
    rec.onerror = () => { setListening(false); showToast("Mic error — try again","#ff6b6b"); };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    setMode("voice");
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); setMode("text"); };

  // ── Photo ──
  const handlePhoto = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPhotoPreview(ev.target.result);
      setPhotoData(ev.target.result.split(",")[1]); // base64
      setMode("photo");
    };
    reader.readAsDataURL(file);
  };

  // ── Parse & log ──
  const parse = async () => {
    if (parsing) return;
    const hasText = text.trim().length > 0;
    const hasPhoto = photoData !== null;
    if (!hasText && !hasPhoto) return;

    setParsing(true);

    const isWorkoutTab = tab === "workout";
    const context = isWorkoutTab
      ? `You are parsing a WORKOUT log. Extract exercises (with sets/reps/weight) OR cardio activities (with duration/intensity/calories). 
         Return JSON: { "type": "workout", "workoutName": "string", "rating": number_1_to_10, "calsBurned": number, "analysis": "2-3 sentence coaching note", "workouts": [ { "id": number, "name": "string", "type": "strength|cycling|yoga|run|walk|hotworx|hiit|pilates|class|mobility", "sets": [{"weight":"string","reps":"string"}] OR null, "duration": number_minutes_or_null, "intensity": "string_or_null", "calories": number_or_null, "notes": "string_or_null" } ] }`
      : `You are parsing a FOOD log for a 6'2" 208lb male doing body recomp. Daily targets: 2800 cal, 215g protein, 270g carbs, 75g fat.
         Parse all foods mentioned. Use reasonable estimates for vague portions. Return JSON: { "type": "food", "meal": "Breakfast|Lunch|Dinner|Snacks", "items": [ { "id": number, "name": "string", "calories": number, "protein": number, "carbs": number, "fat": number } ] }
         If no meal is specified, infer from context or default to Snacks.`;

    const userContent = hasPhoto
      ? [ { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:photoData } }, { type:"text", text: hasText ? text : "Parse this food/workout from the image." } ]
      : text;

    // Simulate parse in demo (real version calls proxy)
    await new Promise(r => setTimeout(r, 900));

    try {
      if (isWorkoutTab) {
        // Demo: parse simple workout text
        const lower = text.toLowerCase();
        const newActivity = {
          id: Date.now(),
          name: text.trim() || "Workout from photo",
          type: lower.includes("cycling")||lower.includes("bike")||lower.includes("spin") ? "cycling"
              : lower.includes("yoga") ? "yoga"
              : lower.includes("hotworx")||lower.includes("isometric") ? "hotworx"
              : lower.includes("run")||lower.includes("jog") ? "run"
              : lower.includes("walk") ? "walk"
              : lower.includes("hiit")||lower.includes("circuit") ? "hiit"
              : "strength",
          duration: text.match(/(\d+)\s*min/i)?.[1] ? +text.match(/(\d+)\s*min/i)[1] : null,
          intensity: lower.includes("high")||lower.includes("hard") ? "High" : lower.includes("easy")||lower.includes("light") ? "Easy" : "Moderate",
          calories: text.match(/(\d+)\s*cal/i)?.[1] ? +text.match(/(\d+)\s*cal/i)[1] : null,
          notes: hasPhoto ? "Logged from photo" : null,
        };
        const dayData = workoutLog[activeDate] || {};
        const updated = { ...workoutLog, [activeDate]: { ...dayData, workouts: [...(dayData.workouts||[]), newActivity] }};
        onWorkoutSave(updated);
        const totalSets = newActivity.sets?.length || 0;
        showRecap({
          type: "workout",
          summary: {
            name: newActivity.name,
            sets: totalSets,
            duration: newActivity.duration,
            calories: newActivity.calories,
            type: newActivity.type,
          },
          headline: totalSets > 0 ? `${totalSets} sets logged` : newActivity.duration ? `${newActivity.duration} min session` : "Activity logged",
          quip: "Solid work. Check the Training tab for your full session.",
          analysis: `${newActivity.name} logged successfully. On the deployed app, Claude will rate this session, calculate estimated calories burned, and give you specific coaching notes — targets for next session, form cues, and volume recommendations based on your history.`,
        });
      } else {
        // Demo: add as snack with rough estimate
        const newFood = {
          id: Date.now(),
          name: hasPhoto ? "Food from photo" : text.trim(),
          calories: 250, protein: 20, carbs: 28, fat: 6,
        };
        const dayData = foodLog[activeDate] || {};
        const updated = { ...foodLog, [activeDate]: { ...dayData, Snacks: [...(dayData.Snacks||[]), newFood] }};
        onFoodSave(updated);
        // Compute running day totals after adding this item
        const allFoods = Object.values({...dayData, Snacks:[...(dayData.Snacks||[]), newFood]}).flat();
        const totalCal = allFoods.reduce((s,f)=>s+(f.calories||0),0);
        const totalPro = allFoods.reduce((s,f)=>s+(f.protein||0),0);
        const totalCarb = allFoods.reduce((s,f)=>s+(f.carbs||0),0);
        const totalFat = allFoods.reduce((s,f)=>s+(f.fat||0),0);
        const calLeft = 2800 - totalCal;
        const proLeft = 215 - totalPro;
        showRecap({
          type: "food",
          summary: { name: newFood.name, cal: newFood.calories, pro: newFood.protein, carb: newFood.carbs, fat: newFood.fat, totalCal, totalPro, calLeft, proLeft },
          headline: `${newFood.calories} cal · ${newFood.protein}g protein`,
          quip: calLeft > 0 ? `${calLeft} cal remaining today` : `${Math.abs(calLeft)} cal over goal`,
          analysis: `On the deployed app, Claude will accurately parse every item you mention — portions, brands, restaurant meals — and give you a real macro breakdown. It will also flag if this meal is pushing you over your fat or carb targets, suggest protein-dense options to hit your remaining ${proLeft}g protein goal, and rate the meal for recomp quality.`,
        });
      }
    } catch(e) {
      showToast("Parse error — try again","#ff6b6b");
    }

    setText(""); setPhotoPreview(null); setPhotoData(null); setMode("text");
    setParsing(false);
  };

  const accentColor = tab === "workout" ? "#47c8ff" : tab === "food" ? "#e8ff47" : "#4aff7a";
  const placeholder = tab === "workout"
    ? "45 min cycling · yoga class · bench 4x8 @ 185..."
    : "4 eggs oatmeal · Chipotle bowl double chicken · whey shake...";

  return (
    <>
      {toast && (
        <div style={{position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",background:toast.color,color:"#080808",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,padding:"7px 18px",borderRadius:30,zIndex:500,whiteSpace:"nowrap",boxShadow:`0 4px 24px ${toast.color}55`}}>
          {toast.msg}
        </div>
      )}

      {recap && (
        <RecapCard
          recap={recap}
          onClose={()=>setRecap(null)}
          onExpand={()=>setRecap(r=>({...r,expanded:!r.expanded}))}
        />
      )}

      {/* Photo preview */}
      {photoPreview && (
        <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",zIndex:400,maxWidth:460,width:"calc(100% - 28px)"}}>
          <div style={{background:"#0c0c0c",border:"1px solid #2a2a2a",borderRadius:14,overflow:"hidden",position:"relative"}}>
            <img src={photoPreview} alt="preview" style={{width:"100%",maxHeight:200,objectFit:"cover",display:"block"}}/>
            <div style={{position:"absolute",top:8,right:8,display:"flex",gap:6}}>
              <button onClick={()=>{setPhotoPreview(null);setPhotoData(null);setMode("text");}} style={{background:"rgba(0,0,0,0.8)",border:"1px solid #333",borderRadius:20,color:"#ff6b6b",fontFamily:"'DM Mono',monospace",fontSize:9,padding:"4px 10px",cursor:"pointer"}}>remove</button>
            </div>
            <div style={{padding:"8px 12px",fontFamily:"'DM Mono',monospace",fontSize:9,color:"#555"}}>
              Photo ready · {text.trim() ? "add note above or" : ""} tap LOG to parse
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(8,8,8,0.97)",borderTop:"1px solid #141414",padding:"10px 14px 20px",zIndex:200,backdropFilter:"blur(12px)"}}>

        {/* Voice listening indicator */}
        {listening && (
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"7px 12px",background:"#0a1a0a",border:"1px solid #1a4a1a",borderRadius:10}}>
            <div style={{display:"flex",gap:3}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:3,background:"#4aff7a",borderRadius:2,animation:`voiceBar${i} 0.8s ease-in-out infinite`,animationDelay:`${i*0.15}s`,height:12}}/>
              ))}
            </div>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#4aff7a",letterSpacing:1}}>LISTENING...</span>
            <button onClick={stopVoice} style={{marginLeft:"auto",background:"none",border:"1px solid #2a4a2a",borderRadius:5,color:"#4aff7a",fontFamily:"'DM Mono',monospace",fontSize:8,padding:"2px 8px",cursor:"pointer"}}>stop</button>
          </div>
        )}

        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          {/* Text input */}
          <div style={{flex:1,background:"#0c0c0c",border:`1px solid ${text||photoData?"#2a2a2a":"#161616"}`,borderRadius:12,padding:"10px 12px",transition:"border-color 0.2s"}}>
            <textarea
              value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();parse();}}}
              placeholder={placeholder}
              rows={text.length>60?2:1}
              style={{width:"100%",background:"transparent",border:"none",outline:"none",color:"#ccc",fontFamily:"'DM Sans',sans-serif",fontSize:13,resize:"none",lineHeight:1.5}}
            />
            {/* Input type badges */}
            <div style={{display:"flex",gap:5,marginTop:text||photoData?6:0,height:text||photoData?16:0,overflow:"hidden",transition:"height 0.2s"}}>
              {text&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:accentColor,background:accentColor+"18",padding:"2px 6px",borderRadius:4,letterSpacing:0.5}}>TEXT</span>}
              {photoData&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#c447ff",background:"#c447ff18",padding:"2px 6px",borderRadius:4,letterSpacing:0.5}}>PHOTO</span>}
            </div>
          </div>

          {/* Voice button */}
          <button
            onClick={listening ? stopVoice : startVoice}
            style={{width:42,height:42,background:listening?"#0a1a0a":"#0c0c0c",border:`1px solid ${listening?"#4aff7a":"#1e1e1e"}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.2s"}}>
            <span style={{fontSize:18}}>{listening?"⏹":"🎙"}</span>
          </button>

          {/* Photo button */}
          <button
            onClick={()=>fileRef.current?.click()}
            style={{width:42,height:42,background:photoData?"#1a0a1a":"#0c0c0c",border:`1px solid ${photoData?"#c447ff":"#1e1e1e"}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.2s"}}>
            <span style={{fontSize:18}}>📷</span>
          </button>

          {/* Log button */}
          <button
            onClick={parse}
            disabled={(!text.trim()&&!photoData)||parsing}
            style={{width:42,height:42,background:(!text.trim()&&!photoData)||parsing?"#111":accentColor,border:"none",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:(!text.trim()&&!photoData)||parsing?"default":"pointer",flexShrink:0,transition:"all 0.2s"}}>
            {parsing
              ? <div style={{width:14,height:14,border:"2px solid #333",borderTop:"2px solid #080808",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
              : <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:"#080808",letterSpacing:1}}>LOG</span>}
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:"none"}}/>
      </div>

      <style>{`
        @keyframes voiceBar0{0%,100%{height:6px}50%{height:16px}}
        @keyframes voiceBar1{0%,100%{height:10px}50%{height:20px}}
        @keyframes voiceBar2{0%,100%{height:8px}50%{height:18px}}
        @keyframes voiceBar3{0%,100%{height:5px}50%{height:14px}}
      `}</style>
    </>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function RecompTracker() {
  const [tab,setTab]=useState("workout");
  const [foodLog,setFoodLog]=useState(DUMMY_FOOD);
  const [workoutLog,setWorkoutLog]=useState(DUMMY_WORKOUTS);
  const [activeDate,setActiveDate]=useState(todayKey());

  const saveFood=nl=>{setFoodLog(nl);try{window.storage.set(FOOD_KEY,JSON.stringify(nl),true);}catch{}};
  const saveWorkout=nl=>{setWorkoutLog(nl);try{window.storage.set(WORKOUT_KEY,JSON.stringify(nl),true);}catch{}};

  const shiftDate=dir=>{
    const d=new Date(activeDate+"T12:00:00");
    d.setDate(d.getDate()+dir);
    const next=d.toISOString().slice(0,10);
    if(WEEK.includes(next)||next===todayKey())setActiveDate(next);
  };
  const isToday=activeDate===todayKey();
  const isFirstDay=activeDate===WEEK[0];
  const dateLabel=()=>new Date(activeDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});

  const dayFood=foodLog[activeDate]||{};
  const totalCals=MEAL_SLOTS.flatMap(m=>dayFood[m]||[]).reduce((s,f)=>s+f.calories,0);
  const totalPro=MEAL_SLOTS.flatMap(m=>dayFood[m]||[]).reduce((s,f)=>s+f.protein,0);
  const dayWorkout=workoutLog[activeDate]||{};

  // Day indicator strip
  const dayLabels=WEEK.map(d=>new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"}).slice(0,2));

  return (
    <div style={{background:"#080808",minHeight:"100vh",color:"#eee",fontFamily:"'DM Sans',sans-serif",maxWidth:480,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&family=DM+Mono:wght@400;600&display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{background:"#080808",borderBottom:"1px solid #0f0f0f",padding:"14px 14px 0",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:3,background:"linear-gradient(90deg,#e8ff47,#47c8ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>RECOMP</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#2a2a2a",letterSpacing:1.5,marginTop:1}}>208 to 195 · 6'2 · 208LB · 38YO</div>
          </div>
          <div style={{display:"flex",gap:5}}>
            {[[totalCals,"CAL","#e8ff47"],[`${totalPro}g`,"PRO","#47c8ff"],[(dayWorkout.workouts||[]).length,"EX","#ff9f47"],[dayWorkout.calsBurned>0?dayWorkout.calsBurned:"—","BURN","#ff6b6b"]].map(([v,l,c])=>(
              <div key={l} style={{background:"#0c0c0c",border:"1px solid #141414",borderRadius:7,padding:"5px 6px",textAlign:"center"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:c,lineHeight:1}}>{v}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:6,color:"#2a2a2a",letterSpacing:0.5}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {tab!=="trends"&&(
          <>
            {/* Day strip */}
            <div style={{display:"flex",gap:3,marginBottom:8}}>
              {WEEK.map((date,i)=>{
                const isActive=date===activeDate;
                const hasFood=Object.values(foodLog[date]||{}).flat().length>0;
                const hasWork=workoutLog[date]?.workouts?.length>0;
                const dow=new Date(date+"T12:00:00").getDay();
                const isWknd=dow===0||dow===6;
                return (
                  <button key={date} onClick={()=>setActiveDate(date)}
                    style={{flex:1,padding:"5px 2px",background:isActive?"#1a1a1a":"transparent",border:`1px solid ${isActive?"#333":"#111"}`,borderRadius:5,cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:isActive?"#e8ff47":isWknd?"#ff6b6b44":"#2a2a2a",marginBottom:2}}>{dayLabels[i]}</div>
                    <div style={{display:"flex",justifyContent:"center",gap:2}}>
                      <div style={{width:4,height:4,borderRadius:"50%",background:hasFood?(isWknd?"#ff6b6b":"#47c8ff"):"#1a1a1a"}}/>
                      <div style={{width:4,height:4,borderRadius:"50%",background:hasWork?"#4aff7a":"#1a1a1a"}}/>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Date nav */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <button onClick={()=>shiftDate(-1)} disabled={isFirstDay} style={{background:"none",border:"1px solid #181818",borderRadius:5,color:isFirstDay?"#111":"#3a3a3a",cursor:isFirstDay?"default":"pointer",padding:"3px 10px",fontSize:14}}>‹</button>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:12,color:"#999",fontWeight:600}}>{dateLabel()}</div>
                {isToday&&<div style={{fontSize:8,color:"#e8ff47",fontFamily:"'DM Mono',monospace",letterSpacing:1}}>TODAY</div>}
              </div>
              <button onClick={()=>shiftDate(1)} disabled={isToday} style={{background:"none",border:"1px solid #181818",borderRadius:5,color:isToday?"#181818":"#3a3a3a",cursor:isToday?"default":"pointer",padding:"3px 10px",fontSize:14}}>›</button>
            </div>
          </>
        )}

        <div style={{display:"flex"}}>
          {[["food","NUTRITION","#e8ff47"],["workout","TRAINING","#47c8ff"],["trends","TRENDS","#4aff7a"]].map(([key,label,color])=>(
            <button key={key} onClick={()=>setTab(key)} style={{flex:1,background:"none",border:"none",borderBottom:tab===key?`2px solid ${color}`:"2px solid transparent",color:tab===key?color:"#2a2a2a",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,padding:"7px 0 9px",cursor:"pointer",transition:"all 0.2s"}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{paddingTop:12,paddingBottom:90}}>
        {tab==="food"&&<FoodTab log={foodLog} activeDate={activeDate} onSave={saveFood}/>}
        {tab==="workout"&&<WorkoutTab log={workoutLog} activeDate={activeDate} onSave={saveWorkout}/>}
        {tab==="trends"&&<TrendsTab foodLog={foodLog} workoutLog={workoutLog}/>}
      </div>

      {tab!=="trends"&&(
        <SmartInputBar
          tab={tab}
          activeDate={activeDate}
          foodLog={foodLog}
          workoutLog={workoutLog}
          onFoodSave={saveFood}
          onWorkoutSave={saveWorkout}
        />
      )}
    </div>
  );
}
