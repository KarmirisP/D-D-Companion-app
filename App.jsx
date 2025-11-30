import React, { useState, useEffect } from 'react';
import { 
  Dices, Users, Skull, Scroll, Save, Edit2, Trash2, Plus, 
  ChevronDown, ChevronUp, Search, Printer, BookOpen, Zap, 
  Flame, Brain, Swords, Sparkles, Map as MapIcon, Copy, 
  Info, Shield, Sword, Ghost, Feather, Lock, LogOut,
  Mail, Key, UserPlus, LogIn, ArrowDownAZ, EyeOff,
  TrendingUp, Award, Filter, Tag, Wand2, Eye, Briefcase,
  Backpack, Anchor, Activity, Target, Play, XCircle, CheckCircle, 
  Map, Moon, Sun, Coffee, Coins, UserX, Cloud, Wind, Snowflake,
  Zap as Lightning, PlayCircle, PauseCircle, SkipForward, Gift, Heart
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, serverTimestamp, query, where 
} from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// --- Firebase Configuration ---
// NEW SECURE CODE:
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-dnd-app';

// --- HELPER FUNCTIONS ---
const getBgClass = (printerMode) => printerMode ? "bg-white text-black" : "bg-slate-950 text-slate-200";
const getCardClass = (printerMode) => printerMode ? "bg-white border-2 border-black text-black shadow-none mb-4" : "bg-slate-800 border border-slate-700 text-white shadow-lg mb-4";
const getInputClass = (printerMode) => printerMode ? "bg-white border border-gray-400 text-black placeholder-gray-500" : "bg-slate-900 border border-slate-700 text-white placeholder-slate-500";
const getHeaderClass = (printerMode) => printerMode ? "bg-gray-100 border-b-2 border-black text-black" : "bg-slate-900 border-b border-slate-800 text-white";
const getBtnPrimary = (printerMode) => printerMode ? "bg-black text-white hover:bg-gray-800" : "bg-amber-500 text-slate-900 hover:bg-amber-400";

const rollStatValue = () => {
  const rolls = Array(4).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
};

const summarizeEncounter = (roster) => {
  const map = {};
  roster.forEach(m => {
    if (!map[m.name]) map[m.name] = { ...m, count: 0 };
    map[m.name].count += 1;
  });
  return Object.values(map);
};

const DICE_REGEX = /(\d+d\d+(?:\s?[+-]\s?\d+)?)/g;

// --- NEW CONSTANTS FOR ENHANCED FEATURES ---
const ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "True Neutral", "Chaotic Neutral",
  "Lawful Evil", "Neutral Evil", "Chaotic Evil"
];

const BACKGROUNDS = [
  "Acolyte", "Charlatan", "Criminal", "Entertainer", "Folk Hero",
  "Guild Artisan", "Hermit", "Noble", "Outlander", "Sage",
  "Sailor", "Soldier", "Urchin", "Custom"
];

const POINT_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

const RACIAL_BONUSES = {
  "Human": { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
  "Elf": { dex: 2 },
  "Dwarf": { con: 2 },
  "Halfling": { dex: 2 },
  "Dragonborn": { str: 2, cha: 1 },
  "Gnome": { int: 2 },
  "Half-Elf": { cha: 2 },
  "Half-Orc": { str: 2, con: 1 },
  "Tiefling": { cha: 2, int: 1 },
  "Aarakocra": { dex: 2, wis: 1 },
  "Genasi": { con: 2 },
  "Goliath": { str: 2, con: 1 },
  "Tabaxi": { dex: 2, cha: 1 },
  "Custom": {}
};

// Spell slots by class level
const SPELL_SLOTS_BY_LEVEL = {
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
};
// --- Constants & Data ---
const RACES = ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Gnome", "Half-Elf", "Half-Orc", "Tiefling", "Aarakocra", "Genasi", "Goliath", "Tabaxi", "Custom"];
const CLASSES = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard", "Artificer", "Custom"];
const CONDITIONS = ["Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious"];
const SPELL_TAGS = ["All", "Damage", "Heal", "Control", "Buff", "Utility"];
const CASTER_CLASSES = ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard", "Artificer"];

const CLASS_SKILL_LIMITS = {
  "Barbarian": 2, "Bard": 3, "Cleric": 2, "Druid": 2,
  "Fighter": 2, "Monk": 2, "Paladin": 2, "Ranger": 3,
  "Rogue": 4, "Sorcerer": 2, "Warlock": 2, "Wizard": 2,
  "Artificer": 2, "Custom": 2
};

const SKILLS_DATA = [
  { name: "Acrobatics", stat: "dex", desc: "Stay on your feet in tricky situations, acrobatics stunts." },
  { name: "Animal Handling", stat: "wis", desc: "Calm down a domesticated or wild animal." },
  { name: "Arcana", stat: "int", desc: "Recall lore about spells, magic items, eldritch symbols." },
  { name: "Athletics", stat: "str", desc: "Climb, jump, swim, grapple, force open doors." },
  { name: "Deception", stat: "cha", desc: "Hide the truth, mislead others verbally." },
  { name: "History", stat: "int", desc: "Recall lore about historical events, legendary people." },
  { name: "Insight", stat: "wis", desc: "Determine the true intentions of a creature." },
  { name: "Intimidation", stat: "cha", desc: "Influence someone through overt threats/hostile actions." },
  { name: "Investigation", stat: "int", desc: "Look around for clues and make deductions." },
  { name: "Medicine", stat: "wis", desc: "Stabilize a dying companion or diagnose an illness." },
  { name: "Nature", stat: "int", desc: "Recall lore about terrain, plants and animals." },
  { name: "Perception", stat: "wis", desc: "Spot, hear, or detect the presence of something." },
  { name: "Performance", stat: "cha", desc: "Delight an audience with music, dance, acting." },
  { name: "Persuasion", stat: "cha", desc: "Influence someone with tact, social graces, or good nature." },
  { name: "Religion", stat: "int", desc: "Recall lore about deities, rites, and prayers." },
  { name: "Sleight of Hand", stat: "dex", desc: "Plant an object, steal something, conceal an object." },
  { name: "Stealth", stat: "dex", desc: "Conceal yourself from enemies, slink past guards." },
  { name: "Survival", stat: "wis", desc: "Follow tracks, hunt wild game, guide group through wasteland." }
];

const CLASS_DEFAULTS = {
  "Barbarian": { hp: 12, saves: ["str", "con"], skills: ["Athletics", "Intimidation"], gear: ["Greataxe", "Explorers Pack"], armor: "Unarmored", spells: [] },
  "Bard": { hp: 8, saves: ["dex", "cha"], skills: ["Performance", "Persuasion", "Deception"], gear: ["Rapier", "Lute"], armor: "Leather", spells: ["Vicious Mockery", "Healing Word", "Cure Wounds"] },
  "Cleric": { hp: 8, saves: ["wis", "cha"], skills: ["Religion", "Insight"], gear: ["Mace", "Shield", "Holy Symbol"], armor: "Scale Mail", spells: ["Sacred Flame", "Cure Wounds", "Bless", "Guiding Bolt"] },
  "Druid": { hp: 8, saves: ["int", "wis"], skills: ["Nature", "Survival"], gear: ["Scimitar", "Wooden Shield"], armor: "Leather", spells: ["Druidcraft", "Entangle", "Goodberry", "Healing Word"] },
  "Fighter": { hp: 10, saves: ["str", "con"], skills: ["Athletics", "Survival"], gear: ["Greatsword", "Crossbow"], armor: "Chain Mail", spells: [] },
  "Monk": { hp: 8, saves: ["str", "dex"], skills: ["Acrobatics", "Stealth"], gear: ["Shortsword", "Darts"], armor: "Unarmored", spells: [] },
  "Paladin": { hp: 10, saves: ["wis", "cha"], skills: ["Athletics", "Religion"], gear: ["Longsword", "Shield"], armor: "Chain Mail", spells: ["Cure Wounds", "Bless", "Divine Favor"] },
  "Ranger": { hp: 10, saves: ["str", "dex"], skills: ["Survival", "Stealth", "Perception"], gear: ["Longbow", "Shortswords"], armor: "Scale Mail", spells: ["Cure Wounds", "Goodberry", "Hunters Mark"] },
  "Rogue": { hp: 8, saves: ["dex", "int"], skills: ["Stealth", "Sleight of Hand", "Acrobatics", "Deception"], gear: ["Shortsword", "Dagger", "Thieves Tools"], armor: "Leather", spells: [] },
  "Sorcerer": { hp: 6, saves: ["con", "cha"], skills: ["Arcana", "Persuasion"], gear: ["Dagger", "Arcane Focus"], armor: "None", spells: ["Firebolt", "Shield", "Magic Missile", "Mage Armor"] },
  "Warlock": { hp: 8, saves: ["wis", "cha"], skills: ["Arcana", "Intimidation"], gear: ["Dagger", "Arcane Focus"], armor: "Leather", spells: ["Eldritch Blast", "Hex", "Armor of Agathys"] },
  "Wizard": { hp: 6, saves: ["int", "wis"], skills: ["Arcana", "History"], gear: ["Quarterstaff", "Spellbook"], armor: "None", spells: ["Firebolt", "Magic Missile", "Shield", "Mage Armor", "Detect Magic"] },
  "Artificer": { hp: 8, saves: ["con", "int"], skills: ["Investigation", "Arcana"], gear: ["Hammer", "Scale Mail"], armor: "Scale Mail", spells: ["Fire Bolt", "Cure Wounds", "Identify"] },
  "Custom": { hp: 8, saves: ["str", "dex"], skills: [], gear: [], armor: "None", spells: [] }
};

const STANDARD_DATA = {
  races: {
    "Elf": [
      { name: "Darkvision", type: "race", desc: "See in dim light within 60ft as bright, darkness as dim." },
      { name: "Fey Ancestry", type: "race", desc: "Advantage vs charm, magic can't put you to sleep." },
    ],
    "Dwarf": [
      { name: "Darkvision", type: "race", desc: "See in dim light within 60ft as bright, darkness as dim." },
      { name: "Dwarven Resilience", type: "race", desc: "Advantage on saves vs poison, resistance to poison damage." }
    ],
    "Halfling": [ { name: "Lucky", type: "race", desc: "Reroll 1s on d20." }, { name: "Brave", type: "race", desc: "Advantage vs fright." } ],
    "Dragonborn": [ { name: "Breath Weapon", type: "race", desc: "Exhale destructive energy." }, { name: "Resistance", type: "race", desc: "Resistance to ancestry damage." } ],
    "Gnome": [ { name: "Gnome Cunning", type: "race", desc: "Advantage on Int/Wis/Cha saves vs magic." }, { name: "Darkvision", type: "race", desc: "60ft." } ],
    "Half-Orc": [ { name: "Relentless Endurance", type: "race", desc: "Drop to 1 HP instead of 0 (1/long rest)." }, { name: "Savage Attacks", type: "race", desc: "Extra die on crit." } ],
    "Tiefling": [ { name: "Hellish Resistance", type: "race", desc: "Resistance to fire." }, { name: "Darkvision", type: "race", desc: "60ft." } ],
    "Human": []
  },
  classes: {
    "Fighter": [ { name: "Second Wind", type: "class", desc: "Bonus Action: Regain 1d10 + Level HP (1/short rest)." }, { name: "Action Surge", type: "class", desc: "Take one additional action on your turn (1/short rest)." } ],
    "Rogue": [ { name: "Sneak Attack", type: "class", desc: "Extra damage on advantage or ally adjacent." }, { name: "Cunning Action", type: "class", desc: "Bonus action Dash, Disengage, Hide." } ],
    "Barbarian": [ { name: "Rage", type: "class", desc: "Advantage STR checks/saves, Resist B/P/S damage, +Dmg." }, { name: "Unarmored Defense", type: "class", desc: "AC = 10 + DEX + CON." } ],
    "Monk": [ { name: "Martial Arts", type: "class", desc: "DEX for unarmed/monk weapons, d4 dmg, bonus unarmed strike." }, { name: "Unarmored Defense", type: "class", desc: "AC = 10 + DEX + WIS." } ],
    "Paladin": [ { name: "Divine Sense", type: "class", desc: "Detect celestial/fiend/undead." }, { name: "Lay on Hands", type: "class", desc: "Pool of healing = Level * 5." } ],
    "Bard": [], "Cleric": [], "Druid": [], "Ranger": [], "Sorcerer": [], "Warlock": [], "Wizard": [], "Artificer": []
  }
};

const COMMON_TRAITS_LOOKUP = (() => {
  const map = {};
  Object.values(STANDARD_DATA.races).flat().forEach(t => { map[t.name] = t.desc; });
  Object.values(STANDARD_DATA.classes).flat().forEach(t => { map[t.name] = t.desc; });
  if (!map["Darkvision"]) map["Darkvision"] = "See in dim light within 60ft as bright light, and darkness as dim light.";
  return map;
})();
// --- FULL CAMPAIGN DATA ---
const CAMPAIGN_MODULES = {
  "Random": {
    description: "Random encounters based on your party level and preferences",
    encounters: null
  },
  "Lost Mine of Phandelver": {
    description: "A classic introductory adventure for levels 1-5",
    encounters: [
      { 
        name: "Goblin Ambush", 
        level: 1,
        text: "The party is ambushed by goblins on the Triboar Trail near a dead horse.",
        monsters: ["Goblin", "Goblin", "Goblin", "Goblin"],
        notes: "The goblins have taken Sildar Hallwinter prisoner. A trail leads to their hideout."
      },
      { 
        name: "Cragmaw Hideout - Entrance", 
        level: 1,
        text: "Two goblin sentries guard the cave entrance with a chained wolf.",
        monsters: ["Goblin", "Goblin", "Wolf"],
        notes: "Stealth may allow the party to surprise the guards. The stream provides cover."
      },
      { 
        name: "Cragmaw Hideout - Klarg's Cave", 
        level: 1,
        text: "Klarg the bugbear commands his goblins from a natural bridge.",
        monsters: ["Thug", "Wolf", "Goblin"],
        notes: "Klarg uses Thug stats. The bridge can be collapsed. Sildar is here as prisoner."
      },
      { 
        name: "Redbrand Ruffians", 
        level: 2,
        text: "Four Redbrand thugs harass townsfolk in Phandalin's streets.",
        monsters: ["Bandit", "Bandit", "Bandit", "Bandit"],
        notes: "Townspeople watch nervously. Defeating them earns the party respect in town."
      },
      { 
        name: "Redbrand Hideout - Common Room", 
        level: 2,
        text: "Three Redbrands gamble and drink in the cellar hideout.",
        monsters: ["Bandit", "Bandit", "Bandit"],
        notes: "They are distracted and can be surprised. A secret door leads deeper."
      },
      { 
        name: "Redbrand Hideout - Prison", 
        level: 2,
        text: "A captured family is guarded by two Redbrands and their bugbear leader.",
        monsters: ["Thug", "Bandit", "Bandit"],
        notes: "The Dendrar family must be protected. Mosk the bugbear has the prison keys."
      },
      { 
        name: "Old Owl Well", 
        level: 3,
        text: "A necromancer and his undead servants guard ancient ruins.",
        monsters: ["Thug", "Zombie", "Zombie", "Zombie", "Zombie"],
        notes: "Use Thug stats for Hamun Kost. He may negotiate if approached peacefully."
      },
      { 
        name: "Cragmaw Castle - Courtyard", 
        level: 3,
        text: "Hobgoblins patrol the ruined castle grounds.",
        monsters: ["Orc", "Orc", "Goblin", "Goblin"],
        notes: "Use Orc stats for hobgoblins. The castle is partially collapsed."
      },
      { 
        name: "Cragmaw Castle - King Grol", 
        level: 3,
        text: "King Grol the bugbear holds Gundren Rockseeker captive with his drow ally.",
        monsters: ["Thug", "Thug", "Wolf"],
        notes: "King Grol and the drow (both use Thug stats) have the map. Wolf is Grol's pet."
      },
      { 
        name: "Wave Echo Cave - Entrance", 
        level: 4,
        text: "Ochre jellies guard the entrance to the legendary mine.",
        monsters: ["Gelatinous Cube"],
        notes: "The ooze is hidden in darkness. It has absorbed various mining tools."
      },
      { 
        name: "Wave Echo Cave - Undead", 
        level: 4,
        text: "Zombies and ghouls roam the cursed halls of the lost mine.",
        monsters: ["Ghoul", "Ghoul", "Zombie", "Zombie"],
        notes: "The undead are remnants of the ancient battle. They mindlessly guard the mine."
      },
      { 
        name: "Wave Echo Cave - Black Spider", 
        level: 5,
        text: "The Black Spider and his forces have taken control of the Forge of Spells.",
        monsters: ["Wight", "Skeleton", "Skeleton", "Skeleton"],
        notes: "Use Wight stats for Nezznar the Black Spider. He has powerful magical items."
      }
    ]
  },
  "Curse of Strahd": {
    description: "Gothic horror in the domain of Barovia for levels 1-10",
    encounters: [
      { 
        name: "Gates of Barovia", 
        level: 1,
        text: "Mists engulf the party as dire wolves howl in the cursed forest.",
        monsters: ["Dire Wolf", "Dire Wolf"],
        notes: "The mists prevent escape. The wolves are servants of Strahd."
      },
      { 
        name: "Village of Barovia", 
        level: 2,
        text: "Zombies shamble through the muddy streets of the trapped village.",
        monsters: ["Zombie", "Zombie", "Zombie"],
        notes: "Villagers cower in their homes. The church offers sanctuary."
      },
      { 
        name: "Death House - Basement", 
        level: 1,
        text: "Ghouls lurk in the sacrificial chamber beneath the haunted mansion.",
        monsters: ["Ghoul", "Ghoul"],
        notes: "The cultist ghasts retain fragments of memory. They guard dark secrets."
      },
      { 
        name: "Old Bonegrinder", 
        level: 4,
        text: "Three night hags disguised as old women sell dream pastries.",
        monsters: ["Wight", "Thug", "Thug"],
        notes: "Use Wight for Morgantha, Thugs for daughters. They grind children's bones."
      },
      { 
        name: "Vallaki - Feast of St. Andral", 
        level: 5,
        text: "Vampire spawn attack during the town festival.",
        monsters: ["Wight", "Wight", "Wight"],
        notes: "Use Wight stats for vampire spawn. The church has lost its protection."
      },
      { 
        name: "Wizard of Wines", 
        level: 5,
        text: "Blights and druids have corrupted the winery.",
        monsters: ["Thug", "Thug", "Ghoul", "Ghoul"],
        notes: "Use Thugs for evil druids. The gems that power the winery are stolen."
      },
      { 
        name: "Yester Hill", 
        level: 6,
        text: "Druids perform a dark ritual atop the sacred hill.",
        monsters: ["Thug", "Thug", "Thug", "Wolf", "Wolf"],
        notes: "They're animating a giant tree blight. The ritual can be disrupted."
      },
      { 
        name: "Argynvostholt", 
        level: 7,
        text: "The revenants of the Order of the Silver Dragon still fight Strahd.",
        monsters: ["Wight", "Wight", "Wight", "Skeleton"],
        notes: "The revenants may become allies. The skull of Argynvost is missing."
      },
      { 
        name: "Amber Temple - Guardians", 
        level: 8,
        text: "Ancient constructs defend the temple of dark secrets.",
        monsters: ["Ogre", "Ogre"],
        notes: "Use Ogre stats for flameskulls. The temple contains forbidden knowledge."
      },
      { 
        name: "Castle Ravenloft - Catacombs", 
        level: 9,
        text: "Vampire spawn nest in the catacombs beneath Strahd's castle.",
        monsters: ["Wight", "Wight", "Wight", "Wight"],
        notes: "Use Wight for vampire spawn. They guard Strahd's coffin."
      },
      { 
        name: "Castle Ravenloft - Heart of Sorrow", 
        level: 9,
        text: "Strahd's animated armor guards the Heart of Sorrow.",
        monsters: ["Wight", "Wight", "Skeleton", "Skeleton"],
        notes: "Destroying the Heart weakens Strahd significantly."
      },
      { 
        name: "Strahd von Zarovich", 
        level: 10,
        text: "The vampire lord of Barovia makes his final stand.",
        monsters: ["Lich"],
        notes: "Use Lich stats for Strahd. He has lair actions. Only killable in his coffin."
      }
    ]
  },
  "Dragon of Icespire Peak": {
    description: "Face a young white dragon terrorizing the Sword Coast (levels 1-6)",
    encounters: [
      { 
        name: "Dwarven Excavation - Ochre Jelly", 
        level: 1,
        text: "An ochre jelly has consumed the mine workers.",
        monsters: ["Gelatinous Cube"],
        notes: "The ooze blocks the main shaft. Survivors may be trapped deeper in."
      },
      { 
        name: "Gnomengarde - Mimics", 
        level: 2,
        text: "Shapeshifting monsters terrorize the gnome inventors.",
        monsters: ["Mimic", "Mimic"],
        notes: "The mimics have disguised themselves as inventions."
      },
      { 
        name: "Umbrage Hill - Manticore", 
        level: 2,
        text: "A manticore threatens the midwife's windmill.",
        monsters: ["Owlbear"],
        notes: "Use Owlbear stats for the manticore. It can be driven off."
      },
      { 
        name: "Woodland Manse - Ankhegs", 
        level: 3,
        text: "Burrowing monsters infest the abandoned manor.",
        monsters: ["Thug", "Thug"],
        notes: "Use Thug stats for ankhegs. They burst from the ground."
      },
      { 
        name: "Mountain's Toe - Wererats", 
        level: 3,
        text: "Lycanthropes have taken over the gold mine.",
        monsters: ["Bandit Captain", "Bandit", "Bandit"],
        notes: "The wererat boss uses Bandit Captain stats. Silvered weapons help."
      },
      { 
        name: "Butterskull Ranch - Orcs", 
        level: 4,
        text: "An orc war band has raided the ranch.",
        monsters: ["Orc", "Orc", "Orc", "Orc"],
        notes: "The ranch's owners are being held captive."
      },
      { 
        name: "Loggers' Camp - Anchorite", 
        level: 4,
        text: "An evil half-orc cultist leads timber attacks.",
        monsters: ["Thug", "Orc", "Orc"],
        notes: "Use Thug for the anchorite. He worships Talos, god of storms."
      },
      { 
        name: "Shrine of Savras - Wraith", 
        level: 5,
        text: "An undead oracle guards the abandoned temple.",
        monsters: ["Wight", "Skeleton", "Skeleton"],
        notes: "Use Wight for the wraith. The oracle may answer one question."
      },
      { 
        name: "Falcon's Lodge - Dragon Cultists", 
        level: 5,
        text: "Dragon-worshipping veterans have fortified the hunting lodge.",
        monsters: ["Bandit Captain", "Bandit", "Bandit", "Bandit"],
        notes: "They serve Cryovain. The lodge has strategic value."
      },
      { 
        name: "Tower of Storms - Anchorites", 
        level: 5,
        text: "Storm cultists and their leader occupy the lighthouse.",
        monsters: ["Thug", "Thug", "Thug"],
        notes: "The tower summons the dragon. It can be disabled."
      },
      { 
        name: "Icespire Hold - Dragon's Lair", 
        level: 6,
        text: "Kobolds defend the outer areas of the white dragon's fortress.",
        monsters: ["Kobold", "Kobold", "Kobold", "Kobold", "Kobold"],
        notes: "The kobolds worship Cryovain. They set traps throughout."
      },
      { 
        name: "Cryovain the White Dragon", 
        level: 6,
        text: "The young white dragon that has terrorized the region.",
        monsters: ["Young Red Dragon"],
        notes: "Use Young Red Dragon but change damage to cold. Lair actions available."
      }
    ]
  },
  "Tomb of Annihilation": {
    description: "Jungle exploration and deadly dungeon crawl (levels 1-11)",
    encounters: [
      { 
        name: "Port Nyanzaru - Street Fight", 
        level: 1,
        text: "Thugs ambush the party in the crowded market.",
        monsters: ["Bandit", "Bandit", "Bandit"],
        notes: "City guards may intervene if the fight goes on too long."
      },
      { 
        name: "Jungle - Pterafolk", 
        level: 2,
        text: "Flying reptilian humanoids swoop down from the canopy.",
        monsters: ["Bandit", "Bandit", "Bandit", "Bandit"],
        notes: "They attempt to grab party members and carry them off."
      },
      { 
        name: "Camp Vengeance - Undead Attack", 
        level: 3,
        text: "Zombies assault the besieged Order of the Gauntlet camp.",
        monsters: ["Zombie", "Zombie", "Zombie", "Zombie", "Zombie"],
        notes: "The fort is running low on supplies. Help earns their support."
      },
      { 
        name: "Firefinger - Pterafolk Nest", 
        level: 4,
        text: "The pterafolk king rules from atop the ancient spire.",
        monsters: ["Bandit Captain", "Bandit", "Bandit", "Bandit"],
        notes: "Use Bandit Captain for the king. Treasure includes rare feathers."
      },
      { 
        name: "Nangalore - Yuan-ti", 
        level: 5,
        text: "Snake people guard the gardens of the cursed monastery.",
        monsters: ["Thug", "Thug", "Thug"],
        notes: "Use Thugs for yuan-ti. They're collecting rare orchids."
      },
      { 
        name: "Omu - Red Wizards", 
        level: 6,
        text: "Thayan necromancers and their undead clash with the party.",
        monsters: ["Wight", "Skeleton", "Skeleton", "Skeleton"],
        notes: "The Red Wizards also seek the tomb. Temporary alliance possible."
      },
      { 
        name: "Tomb of the Nine Gods - Level 1", 
        level: 7,
        text: "Gargoyles animate as the party enters the forbidden tomb.",
        monsters: ["Thug", "Thug", "Thug"],
        notes: "Use Thugs for gargoyles. The tomb is filled with deadly traps."
      },
      { 
        name: "Tomb of the Nine Gods - Level 3", 
        level: 8,
        text: "Ghouls and wights lurk in the flooded passages.",
        monsters: ["Wight", "Ghoul", "Ghoul", "Ghoul"],
        notes: "The water is contaminated. Swimming invites disease."
      },
      { 
        name: "Tomb of the Nine Gods - Level 5", 
        level: 9,
        text: "An atropal, an undead godling, bars the way.",
        monsters: ["Young Red Dragon"],
        notes: "Use dragon stats for atropal. It has death magic and summons wraiths."
      },
      { 
        name: "Tomb of the Nine Gods - Acererak", 
        level: 11,
        text: "The demilich archlich awaits in his sanctum.",
        monsters: ["Lich"],
        notes: "Acererak is one of D&D's most dangerous villains. He can possess the Soulmonger."
      }
    ]
  }
};

const MONSTER_MANUAL = [
  { name: "Kobold", type: "Humanoid", hp: 5, ac: 12, cr: "1/8", xp: 25, stats: "STR -2, DEX +2, CON -1, INT -1, WIS -2, CHA -1", equipment: "Dagger, Sling", actions: "Dagger: +4 to hit (1d4+2). Pack Tactics." },
  { name: "Goblin", type: "Humanoid", hp: 7, ac: 15, cr: "1/4", xp: 50, stats: "STR -1, DEX +2, CON 0, INT 0, WIS -1, CHA -1", equipment: "Leather Armor, Shield, Scimitar", actions: "Scimitar: +4 to hit (1d6+2). Nimble Escape." },
  { name: "Skeleton", type: "Undead", hp: 13, ac: 13, cr: "1/4", xp: 50, stats: "STR 0, DEX +2, CON +2, INT -2, WIS -1, CHA -3", equipment: "Shortbow, Shortsword, Armor Scraps", actions: "Shortsword: +4 to hit (1d6+2). Shortbow: +4 (1d6+2)." },
  { name: "Orc", type: "Humanoid", hp: 15, ac: 13, cr: "1/2", xp: 100, stats: "STR +3, DEX +1, CON +3, INT -2, WIS +0, CHA -1", equipment: "Hide Armor, Greataxe, Javelin", actions: "Greataxe: +5 to hit (1d12+3). Aggressive (bonus dash toward enemy)." },
  { name: "Thug", type: "Humanoid", hp: 32, ac: 11, cr: "1/2", xp: 100, stats: "STR +2, DEX +0, CON +2, INT +0, WIS +0, CHA +0", equipment: "Leather Armor, Mace", actions: "Mace: +4 to hit (1d6+2). Pack Tactics." },
  { name: "Wolf", type: "Beast", hp: 11, ac: 13, cr: "1/4", xp: 50, stats: "STR +1, DEX +2, CON +1, INT -4, WIS +1, CHA -2", equipment: "Natural Armor", actions: "Bite: +4 to hit (2d4+2). Pack Tactics. Knock prone DC 11 STR." },
  { name: "Dire Wolf", type: "Beast", hp: 37, ac: 14, cr: "1", xp: 200, stats: "STR +3, DEX +2, CON +2, INT -4, WIS +1, CHA -2", equipment: "Natural Armor", actions: "Bite: +5 to hit (2d6+3). Prone DC 13 STR. Pack Tactics." },
  { name: "Gelatinous Cube", type: "Ooze", hp: 84, ac: 6, cr: "2", xp: 450, stats: "STR +2, DEX -3, CON +5, INT -5, WIS -2, CHA -5", equipment: "None", actions: "Engulf: DC 12 DEX save or 3d6 acid. Transparent (DC 15 to spot)." },
  { name: "Mimic", type: "Monstrosity", hp: 58, ac: 12, cr: "2", xp: 450, stats: "STR +3, DEX +1, CON +2, INT -3, WIS +1, CHA -1", equipment: "Natural Armor", actions: "Pseudopod: +5 to hit (1d8+3). Adhesive. Shapechanger." },
  { name: "Bandit", type: "Humanoid", hp: 11, ac: 12, cr: "1/8", xp: 25, stats: "STR 0, DEX +1, CON 0, INT 0, WIS 0, CHA 0", equipment: "Leather Armor, Scimitar", actions: "Scimitar: +3 to hit (1d6+1)." },
  { name: "Bandit Captain", type: "Humanoid", hp: 65, ac: 15, cr: "2", xp: 450, stats: "STR +2, DEX +3, CON +2, INT +2, WIS +0, CHA +1", equipment: "Studded Leather, Scimitar, Dagger", actions: "Multiattack: 2 Scimitar or 3 Dagger. Parry reaction (+2 AC)." },
  { name: "Zombie", type: "Undead", hp: 22, ac: 8, cr: "1/4", xp: 50, stats: "STR +1, DEX -2, CON +3, INT -4, WIS -2, CHA -3", equipment: "None", actions: "Slam: +3 to hit (1d6+1). Undead Fortitude (CON save vs 0 HP)." },
  { name: "Ghoul", type: "Undead", hp: 22, ac: 12, cr: "1", xp: 200, stats: "STR +1, DEX +2, CON +0, INT -2, WIS 0, CHA -2", equipment: "Natural Armor", actions: "Claws: +4 to hit (2d4+2). DC 10 CON or paralyzed 1 min." },
  { name: "Ogre", type: "Giant", hp: 59, ac: 11, cr: "2", xp: 450, stats: "STR +4, DEX -1, CON +3, INT -3, WIS -2, CHA -2", equipment: "Hide Armor, Greatclub", actions: "Greatclub: +6 to hit (2d8+4)." },
  { name: "Wight", type: "Undead", hp: 45, ac: 14, cr: "3", xp: 700, stats: "STR +2, DEX +2, CON +2, INT +0, WIS +0, CHA +2", equipment: "Studded Leather, Longsword, Longbow", actions: "Longsword: +4 (1d8+2). Life Drain: +4 (1d6+2 necrotic, DC 13 CON or max HP reduced)." },
  { name: "Owlbear", type: "Monstrosity", hp: 59, ac: 13, cr: "3", xp: 700, stats: "STR +5, DEX +1, CON +3, INT -4, WIS +1, CHA -2", equipment: "Natural Armor", actions: "Multiattack: Beak (+7, 1d10+5) & Claws (+7, 2d8+5)." },
  { name: "Troll", type: "Giant", hp: 84, ac: 15, cr: "5", xp: 1800, stats: "STR +4, DEX +1, CON +5, INT -2, WIS -1, CHA -2", equipment: "Natural Armor", actions: "Multiattack: Bite (+7, 1d6+4) & 2 Claws (+7, 2d6+4). Regeneration: 10 HP/turn (acid/fire stops)." },
  { name: "Mind Flayer", type: "Aberration", hp: 71, ac: 15, cr: "7", xp: 2900, stats: "STR +0, DEX +1, CON +1, INT +4, WIS +3, CHA +3", equipment: "Breastplate", actions: "Mind Blast: 60ft cone, DC 15 INT or 4d8+4 psychic & stunned. Extract Brain: Kill incapacitated humanoid." },
  { name: "Young Red Dragon", type: "Dragon", hp: 178, ac: 18, cr: "10", xp: 5900, stats: "STR +6, DEX +0, CON +5, INT +2, WIS +0, CHA +4", equipment: "Natural Armor", actions: "Multiattack: Bite (+10, 2d10+6) & 2 Claws (+10, 2d6+6). Fire Breath: 30ft cone, DC 17 DEX or 16d6 fire (recharge 5-6)." },
  { name: "Lich", type: "Undead", hp: 135, ac: 17, cr: "21", xp: 33000, stats: "STR +0, DEX +3, CON +3, INT +5, WIS +2, CHA +3", equipment: "Natural Armor, Staff, Phylactery", actions: "Paralyzing Touch: +12 to hit, 3d6 cold, DC 18 CON or paralyzed. Spellcasting: 9th level slots. Legendary Actions (3/round)." }
];
// --- COMPREHENSIVE SPELL LIST ---
const SPELL_COMPENDIUM = [
  // CANTRIPS (0-level)
  { name: "Acid Splash", level: 0, school: "Conjuration", castingTime: "1 action", range: "60 ft", components: "V, S", duration: "Instantaneous", classes: ["Sorcerer", "Wizard", "Artificer"], description: "Hurl acid at 1-2 creatures. DEX save or 1d6 acid damage (scales with level)." },
  { name: "Blade Ward", level: 0, school: "Abjuration", castingTime: "1 action", range: "Self", components: "V, S", duration: "1 round", classes: ["Bard", "Sorcerer", "Warlock", "Wizard"], description: "Resistance to bludgeoning, piercing, slashing from weapons." },
  { name: "Chill Touch", level: 0, school: "Necromancy", castingTime: "1 action", range: "120 ft", components: "V, S", duration: "1 round", classes: ["Sorcerer", "Warlock", "Wizard"], description: "Ranged spell attack, 1d8 necrotic. Target can't regain HP until your next turn." },
  { name: "Dancing Lights", level: 0, school: "Evocation", castingTime: "1 action", range: "120 ft", components: "V, S, M", duration: "Conc, 1 min", classes: ["Bard", "Sorcerer", "Wizard", "Artificer"], description: "Create up to 4 torch-sized lights that hover and move." },
  { name: "Eldritch Blast", level: 0, school: "Evocation", castingTime: "1 action", range: "120 ft", components: "V, S", duration: "Instantaneous", classes: ["Warlock"], description: "Ranged spell attack, 1d10 force damage. Multiple beams at higher levels." },
  { name: "Fire Bolt", level: 0, school: "Evocation", castingTime: "1 action", range: "120 ft", components: "V, S", duration: "Instantaneous", classes: ["Sorcerer", "Wizard", "Artificer"], description: "Ranged spell attack, 1d10 fire damage. Can ignite objects." },
  { name: "Guidance", level: 0, school: "Divination", castingTime: "1 action", range: "Touch", components: "V, S", duration: "Conc, 1 min", classes: ["Cleric", "Druid", "Artificer"], description: "Target adds 1d4 to one ability check before spell ends." },
  { name: "Light", level: 0, school: "Evocation", castingTime: "1 action", range: "Touch", components: "V, M", duration: "1 hour", classes: ["Bard", "Cleric", "Sorcerer", "Wizard", "Artificer"], description: "Object sheds bright light 20 ft, dim 20 ft more." },
  { name: "Mage Hand", level: 0, school: "Conjuration", castingTime: "1 action", range: "30 ft", components: "V, S", duration: "1 minute", classes: ["Bard", "Sorcerer", "Warlock", "Wizard", "Artificer"], description: "Spectral hand manipulates objects, opens doors, retrieves items (10 lbs max)." },
  { name: "Mending", level: 0, school: "Transmutation", castingTime: "1 minute", range: "Touch", components: "V, S, M", duration: "Instantaneous", classes: ["Bard", "Cleric", "Druid", "Sorcerer", "Wizard", "Artificer"], description: "Repair single break or tear in an object." },
  { name: "Minor Illusion", level: 0, school: "Illusion", castingTime: "1 action", range: "30 ft", components: "S, M", duration: "1 minute", classes: ["Bard", "Sorcerer", "Warlock", "Wizard"], description: "Create sound or image of object. Investigation check to disbelieve." },
  { name: "Poison Spray", level: 0, school: "Conjuration", castingTime: "1 action", range: "10 ft", components: "V, S", duration: "Instantaneous", classes: ["Druid", "Sorcerer", "Warlock", "Wizard", "Artificer"], description: "CON save or 1d12 poison damage." },
  { name: "Prestidigitation", level: 0, school: "Transmutation", castingTime: "1 action", range: "10 ft", components: "V, S", duration: "Up to 1 hour", classes: ["Bard", "Sorcerer", "Warlock", "Wizard", "Artificer"], description: "Minor magical trick: light candles, clean items, chill/warm, create small illusions." },
  { name: "Produce Flame", level: 0, school: "Conjuration", castingTime: "1 action", range: "Self", components: "V, S", duration: "10 minutes", classes: ["Druid"], description: "Flame in hand for light or ranged attack (1d8 fire)." },
  { name: "Ray of Frost", level: 0, school: "Evocation", castingTime: "1 action", range: "60 ft", components: "V, S", duration: "Instantaneous", classes: ["Sorcerer", "Wizard", "Artificer"], description: "Ranged spell attack, 1d8 cold. Speed reduced by 10 ft." },
  { name: "Sacred Flame", level: 0, school: "Evocation", castingTime: "1 action", range: "60 ft", components: "V, S", duration: "Instantaneous", classes: ["Cleric"], description: "DEX save or 1d8 radiant damage. No cover benefit." },
  { name: "Shocking Grasp", level: 0, school: "Evocation", castingTime: "1 action", range: "Touch", components: "V, S", duration: "Instantaneous", classes: ["Sorcerer", "Wizard", "Artificer"], description: "Melee spell attack, 1d8 lightning. Advantage vs metal armor. No reactions." },
  { name: "Spare the Dying", level: 0, school: "Necromancy", castingTime: "1 action", range: "Touch", components: "V, S", duration: "Instantaneous", classes: ["Cleric", "Artificer"], description: "Stabilize dying creature at 0 HP." },
  { name: "Thaumaturgy", level: 0, school: "Transmutation", castingTime: "1 action", range: "30 ft", components: "V", duration: "Up to 1 min", classes: ["Cleric"], description: "Minor divine effect: voice boom, flames flicker, doors slam, ground trembles." },
  { name: "Thorn Whip", level: 0, school: "Transmutation", castingTime: "1 action", range: "30 ft", components: "V, S, M", duration: "Instantaneous", classes: ["Druid", "Artificer"], description: "Melee spell attack, 1d6 piercing. Pull creature 10 ft closer." },
  { name: "Vicious Mockery", level: 0, school: "Enchantment", castingTime: "1 action", range: "60 ft", components: "V", duration: "Instantaneous", classes: ["Bard"], description: "WIS save or 1d4 psychic. Disadvantage on next attack." },

  // 1ST LEVEL SPELLS
  { name: "Burning Hands", level: 1, school: "Evocation", castingTime: "1 action", range: "Self (15ft cone)", components: "V, S", duration: "Instantaneous", classes: ["Sorcerer", "Wizard"], description: "DEX save or 3d6 fire damage, half on success." },
  { name: "Charm Person", level: 1, school: "Enchantment", castingTime: "1 action", range: "30 ft", components: "V, S", duration: "1 hour", classes: ["Bard", "Druid", "Sorcerer", "Warlock", "Wizard"], description: "WIS save or charmed. Advantage if you're fighting it." },
  { name: "Cure Wounds", level: 1, school: "Evocation", castingTime: "1 action", range: "Touch", components: "V, S", duration: "Instantaneous", classes: ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Artificer"], description: "Touch heals 1d8 + spellcasting modifier HP." },
  { name: "Detect Magic", level: 1, school: "Divination", castingTime: "1 action", range: "Self", components: "V, S", duration: "Conc, 10 min", classes: ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Wizard", "Artificer"], description: "Sense magic within 30 ft, determine school of magic." },
  { name: "Disguise Self", level: 1, school: "Illusion", castingTime: "1 action", range: "Self", components: "V, S", duration: "1 hour", classes: ["Bard", "Sorcerer", "Wizard", "Artificer"], description: "Change appearance including clothing, armor, weapons, possessions." },
  { name: "Faerie Fire", level: 1, school: "Evocation", castingTime: "1 action", range: "60 ft", components: "V", duration: "Conc, 1 min", classes: ["Bard", "Druid", "Artificer"], description: "DEX save or outlined in light. Attacks vs target have advantage." },
  { name: "Healing Word", level: 1, school: "Evocation", castingTime: "1 bonus action", range: "60 ft", components: "V", duration: "Instantaneous", classes: ["Bard", "Cleric", "Druid"], description: "Bonus action, heals 1d4 + modifier HP at range." },
  { name: "Mage Armor", level: 1, school: "Abjuration", castingTime: "1 action", range: "Touch", components: "V, S, M", duration: "8 hours", classes: ["Sorcerer", "Wizard"], description: "AC becomes 13 + DEX modifier for unarmored target." },
  { name: "Magic Missile", level: 1, school: "Evocation", castingTime: "1 action", range: "120 ft", components: "V, S", duration: "Instantaneous", classes: ["Sorcerer", "Wizard"], description: "3 darts, each hits automatically for 1d4+1 force damage." },
  { name: "Shield", level: 1, school: "Abjuration", castingTime: "1 reaction", range: "Self", components: "V, S", duration: "1 round", classes: ["Sorcerer", "Wizard"], description: "Reaction: +5 AC until start of your next turn. Blocks Magic Missile." },
  { name: "Sleep", level: 1, school: "Enchantment", castingTime: "1 action", range: "90 ft", components: "V, S, M", duration: "1 minute", classes: ["Bard", "Sorcerer", "Wizard"], description: "5d8 HP worth of creatures fall unconscious (lowest HP first)." },
  { name: "Thunderwave", level: 1, school: "Evocation", castingTime: "1 action", range: "Self (15ft cube)", components: "V, S", duration: "Instantaneous", classes: ["Bard", "Druid", "Sorcerer", "Wizard"], description: "CON save or 2d8 thunder & pushed 10 ft. Loud 300 ft." },

  // 2ND LEVEL SPELLS
  { name: "Aid", level: 2, school: "Abjuration", castingTime: "1 action", range: "30 ft", components: "V, S, M", duration: "8 hours", classes: ["Cleric", "Paladin", "Artificer"], description: "3 creatures gain 5 temp HP and max HP increases by 5." },
  { name: "Blur", level: 2, school: "Illusion", castingTime: "1 action", range: "Self", components: "V", duration: "Conc, 1 min", classes: ["Sorcerer", "Wizard", "Artificer"], description: "Attackers have disadvantage unless they see through illusions." },
  { name: "Darkness", level: 2, school: "Evocation", castingTime: "1 action", range: "60 ft", components: "V, M", duration: "Conc, 10 min", classes: ["Sorcerer", "Warlock", "Wizard"], description: "15 ft sphere of magical darkness. Blocks darkvision." },
  { name: "Hold Person", level: 2, school: "Enchantment", castingTime: "1 action", range: "60 ft", components: "V, S, M", duration: "Conc, 1 min", classes: ["Bard", "Cleric", "Druid", "Sorcerer", "Warlock", "Wizard"], description: "WIS save or paralyzed. Repeat save each turn." },
  { name: "Invisibility", level: 2, school: "Illusion", castingTime: "1 action", range: "Touch", components: "V, S, M", duration: "Conc, 1 hour", classes: ["Bard", "Sorcerer", "Warlock", "Wizard", "Artificer"], description: "Target invisible until attacks/casts or concentration ends." },
  { name: "Misty Step", level: 2, school: "Conjuration", castingTime: "1 bonus action", range: "Self", components: "V", duration: "Instantaneous", classes: ["Sorcerer", "Warlock", "Wizard"], description: "Bonus action teleport 30 ft to visible unoccupied space." },
  { name: "Scorching Ray", level: 2, school: "Evocation", castingTime: "1 action", range: "120 ft", components: "V, S", duration: "Instantaneous", classes: ["Sorcerer", "Wizard"], description: "3 ranged spell attacks, each 2d6 fire damage." },
  { name: "Spiritual Weapon", level: 2, school: "Evocation", castingTime: "1 bonus action", range: "60 ft", components: "V, S", duration: "1 minute", classes: ["Cleric"], description: "Bonus action: summon & attack with floating weapon (1d8+modifier force)." },
  { name: "Suggestion", level: 2, school: "Enchantment", castingTime: "1 action", range: "30 ft", components: "V, M", duration: "Conc, 8 hours", classes: ["Bard", "Sorcerer", "Warlock", "Wizard"], description: "WIS save or follow reasonable-sounding suggestion." },

  // 3RD LEVEL SPELLS
  { name: "Counterspell", level: 3, school: "Abjuration", castingTime: "1 reaction", range: "60 ft", components: "S", duration: "Instantaneous", classes: ["Sorcerer", "Warlock", "Wizard"], description: "Reaction: Interrupt spell. Auto-cancel ≤3rd, check for higher." },
  { name: "Dispel Magic", level: 3, school: "Abjuration", castingTime: "1 action", range: "120 ft", components: "V, S", duration: "Instantaneous", classes: ["Bard", "Cleric", "Druid", "Paladin", "Sorcerer", "Warlock", "Wizard", "Artificer"], description: "End spells/effects ≤3rd level automatically, check for higher." },
  { name: "Fireball", level: 3, school: "Evocation", castingTime: "1 action", range: "150 ft", components: "V, S, M", duration: "Instantaneous", classes: ["Sorcerer", "Wizard"], description: "20 ft sphere. DEX save or 8d6 fire, half on success." },
  { name: "Fly", level: 3, school: "Transmutation", castingTime: "1 action", range: "Touch", components: "V, S, M", duration: "Conc, 10 min", classes: ["Sorcerer", "Warlock", "Wizard", "Artificer"], description: "Target gains 60 ft fly speed. Falls if concentration ends." },
  { name: "Haste", level: 3, school: "Transmutation", castingTime: "1 action", range: "30 ft", components: "V, S, M", duration: "Conc, 1 min", classes: ["Sorcerer", "Wizard", "Artificer"], description: "Double speed, +2 AC, advantage DEX saves, extra action. Lethargy when ends." },
  { name: "Lightning Bolt", level: 3, school: "Evocation", castingTime: "1 action", range: "Self (100ft line)", components: "V, S, M", duration: "Instantaneous", classes: ["Sorcerer", "Wizard"], description: "100×5 ft line. DEX save or 8d6 lightning, half on success." },
  { name: "Revivify", level: 3, school: "Necromancy", castingTime: "1 action", range: "Touch", components: "V, S, M (300gp diamond)", duration: "Instantaneous", classes: ["Cleric", "Paladin", "Artificer"], description: "Return creature to life that died within 1 minute. 1 HP." },
  { name: "Speak with Dead", level: 3, school: "Necromancy", castingTime: "1 action", range: "10 ft", components: "V, S, M", duration: "10 minutes", classes: ["Bard", "Cleric"], description: "Ask corpse 5 questions. Knows only what it knew in life." },

  // 4TH LEVEL SPELLS
  { name: "Banishment", level: 4, school: "Abjuration", castingTime: "1 action", range: "60 ft", components: "V, S, M", duration: "Conc, 1 min", classes: ["Cleric", "Paladin", "Sorcerer", "Warlock", "Wizard"], description: "CHA save or sent to harmless demiplane. Permanent if native to other plane." },
  { name: "Greater Invisibility", level: 4, school: "Illusion", castingTime: "1 action", range: "Touch", components: "V, S", duration: "Conc, 1 min", classes: ["Bard", "Sorcerer", "Wizard"], description: "Invisible even when attacking or casting." },
  { name: "Polymorph", level: 4, school: "Transmutation", castingTime: "1 action", range: "60 ft", components: "V, S, M", duration: "Conc, 1 hour", classes: ["Bard", "Druid", "Sorcerer", "Wizard"], description: "WIS save or transform into beast of equal/lower CR. New HP pool." },
  { name: "Wall of Fire", level: 4, school: "Evocation", castingTime: "1 action", range: "120 ft", components: "V, S, M", duration: "Conc, 1 min", classes: ["Druid", "Sorcerer", "Wizard"], description: "Wall deals 5d8 fire when entered/starts turn in it. DEX half." },

  // 5TH LEVEL SPELLS
  { name: "Cone of Cold", level: 5, school: "Evocation", castingTime: "1 action", range: "Self (60ft cone)", components: "V, S, M", duration: "Instantaneous", classes: ["Sorcerer", "Wizard"], description: "60 ft cone. CON save or 8d8 cold, half on success." },
  { name: "Mass Cure Wounds", level: 5, school: "Evocation", castingTime: "1 action", range: "60 ft", components: "V, S", duration: "Instantaneous", classes: ["Bard", "Cleric", "Druid"], description: "Up to 6 creatures regain 3d8 + modifier HP." },
  { name: "Raise Dead", level: 5, school: "Necromancy", castingTime: "1 hour", range: "Touch", components: "V, S, M (500gp diamond)", duration: "Instantaneous", classes: ["Bard", "Cleric", "Paladin"], description: "Return creature dead ≤10 days. Penalties until 4 long rests." },
  { name: "Scrying", level: 5, school: "Divination", castingTime: "10 minutes", range: "Self", components: "V, S, M", duration: "Conc, 10 min", classes: ["Bard", "Cleric", "Druid", "Warlock", "Wizard"], description: "WIS save or see/hear target on same plane. Modifiers based on knowledge." },
  { name: "Teleportation Circle", level: 5, school: "Conjuration", castingTime: "1 minute", range: "10 ft", components: "V, M (50gp chalk)", duration: "1 round", classes: ["Bard", "Sorcerer", "Wizard"], description: "Portal to permanent circle whose sigil you know." },

  // 6TH LEVEL SPELLS
  { name: "Chain Lightning", level: 6, school: "Evocation", castingTime: "1 action", range: "150 ft", components: "V, S, M", duration: "Instantaneous", classes: ["Sorcerer", "Wizard"], description: "Primary target DEX save or 10d8 lightning. Arcs to 3 others." },
  { name: "Disintegrate", level: 6, school: "Transmutation", castingTime: "1 action", range: "60 ft", components: "V, S, M", duration: "Instantaneous", classes: ["Sorcerer", "Wizard"], description: "DEX save or 10d6+40 force. Reduced to 0 = dust." },
  { name: "Heal", level: 6, school: "Evocation", castingTime: "1 action", range: "60 ft", components: "V, S", duration: "Instantaneous", classes: ["Cleric", "Druid"], description: "Target regains 70 HP. Ends blindness, deafness, diseases." },
  { name: "True Seeing", level: 6, school: "Divination", castingTime: "1 action", range: "Touch", components: "V, S, M (25gp ointment)", duration: "1 hour", classes: ["Bard", "Cleric", "Sorcerer", "Warlock", "Wizard"], description: "See in darkness, see invisible, detect illusions, see into Ethereal." },

  // 7TH-9TH LEVEL SPELLS
  { name: "Finger of Death", level: 7, school: "Necromancy", castingTime: "1 action", range: "60 ft", components: "V, S", duration: "Instantaneous", classes: ["Sorcerer", "Warlock", "Wizard"], description: "CON save or 7d8+30 necrotic. Killed target rises as zombie." },
  { name: "Resurrection", level: 7, school: "Necromancy", castingTime: "1 hour", range: "Touch", components: "V, S, M (1000gp diamond)", duration: "Instantaneous", classes: ["Bard", "Cleric"], description: "Return creature dead ≤100 years. Restores body parts." },
  { name: "Power Word Stun", level: 8, school: "Enchantment", castingTime: "1 action", range: "60 ft", components: "V", duration: "Instantaneous", classes: ["Bard", "Sorcerer", "Warlock", "Wizard"], description: "If target ≤150 HP, stunned. CON save each turn to end." },
  { name: "Maze", level: 8, school: "Conjuration", castingTime: "1 action", range: "60 ft", components: "V, S", duration: "Conc, 10 min", classes: ["Wizard"], description: "Banished to demiplane labyrinth. INT check DC 20 to escape." },
  { name: "Meteor Swarm", level: 9, school: "Evocation", castingTime: "1 action", range: "1 mile", components: "V, S", duration: "Instantaneous", classes: ["Sorcerer", "Wizard"], description: "4 meteors, 40 ft spheres. DEX save or 20d6 fire + 20d6 bludgeoning." },
  { name: "Power Word Kill", level: 9, school: "Enchantment", castingTime: "1 action", range: "60 ft", components: "V", duration: "Instantaneous", classes: ["Bard", "Sorcerer", "Warlock", "Wizard"], description: "If target ≤100 HP, it dies. No save." },
  { name: "True Resurrection", level: 9, school: "Necromancy", castingTime: "1 hour", range: "Touch", components: "V, S, M (25000gp diamond)", duration: "Instantaneous", classes: ["Cleric", "Druid"], description: "Return creature dead ≤200 years. Creates new body if needed." },
  { name: "Wish", level: 9, school: "Conjuration", castingTime: "1 action", range: "Self", components: "V", duration: "Instantaneous", classes: ["Sorcerer", "Wizard"], description: "Ultimate spell. Duplicate any spell ≤8th or create custom effect. Risk of never casting again." }
];

// --- HELPER FUNCTIONS ---

// Calculate ability modifier from score
const getModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

// Calculate proficiency bonus by level
const getProficiencyBonus = (level) => {
  return Math.ceil(level / 4) + 1;
};

// Calculate Point Buy cost for a given ability score
const getPointBuyCost = (score) => {
  const costs = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  return costs[score] || 0;
};

// Calculate total points spent in Point Buy system
const calculatePointsSpent = (stats) => {
  return Object.values(stats).reduce((total, score) => total + getPointBuyCost(score), 0);
};

// Apply racial bonuses to base stats
const applyRacialBonuses = (baseStats, race) => {
  const bonuses = RACIAL_BONUSES[race] || {};
  const finalStats = { ...baseStats };
  
  Object.keys(finalStats).forEach(stat => {
    const bonus = bonuses[stat] || 0;
    finalStats[stat] = Math.min(20, baseStats[stat] + bonus); // Cap at 20
  });
  
  return finalStats;
};

// Get default spells for a class
const getDefaultSpellsForClass = (className) => {
  const classData = CLASS_DEFAULTS[className];
  return classData?.defaultSpells || [];
};

// Check if class is a spellcaster
const isSpellcaster = (className) => {
  const casters = ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard", "Artificer"];
  return casters.includes(className);
};

// Get spell slots for a given class and level
const getSpellSlots = (className, level) => {
  const slots = SPELL_SLOTS_BY_LEVEL[className];
  if (!slots || !slots[level]) return null;
  return slots[level];
};

// Validate Point Buy allocation
const validatePointBuy = (stats) => {
  const spent = calculatePointsSpent(stats);
  const withinBudget = spent <= 27;
  const validRange = Object.values(stats).every(score => score >= 8 && score <= 15);
  
  return {
    valid: withinBudget && validRange,
    spent,
    remaining: 27 - spent,
    errors: [
      ...(!withinBudget ? [`Over budget by ${spent - 27} points`] : []),
      ...(!validRange ? ['All base stats must be between 8-15'] : [])
    ]
  };
};

// Format modifier with + or - sign
const formatModifier = (mod) => {
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

// Calculate skill bonus (ability modifier + proficiency if proficient)
const getSkillBonus = (abilityScore, isProficient, level) => {
  const modifier = getModifier(abilityScore);
  const profBonus = isProficient ? getProficiencyBonus(level) : 0;
  return modifier + profBonus;
};

// Generate random stats using 4d6 drop lowest
const rollStats = () => {
  const rollOneStat = () => {
    const rolls = Array(4).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    return rolls.slice(1).reduce((sum, val) => sum + val, 0);
  };
  
  return {
    str: rollOneStat(),
    dex: rollOneStat(),
    con: rollOneStat(),
    int: rollOneStat(),
    wis: rollOneStat(),
    cha: rollOneStat()
  };
};


// --- MAIN APP COMPONENT ---
function App() {
  // ========== AUTHENTICATION STATE ==========
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ========== CAMPAIGN & MODULE STATE ==========
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedModule, setSelectedModule] = useState("Random");

  // ========== CHARACTER STATE ==========
  const [characters, setCharacters] = useState([]);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [showPointBuyHelper, setShowPointBuyHelper] = useState(false);

  // ========== ENCOUNTER STATE ==========
  const [encounters, setEncounters] = useState([]);
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [round, setRound] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(0);

  // ========== NOTES STATE ==========
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);

  // ========== DICE ROLLER STATE ==========
  const [diceResults, setDiceResults] = useState([]);
  const [diceHistory, setDiceHistory] = useState([]);

  // ========== UI STATE ==========
  const [activeTab, setActiveTab] = useState("campaigns");
  const [printerMode, setPrinterMode] = useState(false);
  const [showMonsterManual, setShowMonsterManual] = useState(false);
  const [showSpellCompendium, setShowSpellCompendium] = useState(false);
  const [monsterFilter, setMonsterFilter] = useState("");
  const [spellFilter, setSpellFilter] = useState("");
  const [spellLevelFilter, setSpellLevelFilter] = useState("all");
  const [spellClassFilter, setSpellClassFilter] = useState("all");

  // ========== NEW CHARACTER FORM STATE ==========
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    race: "Human",
    class: "Fighter",
    level: 1,
    background: "Soldier",
    alignment: "Lawful Good",
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, // For Point Buy
    hp: 10,
    maxHp: 10,
    tempHp: 0,
    ac: 10,
    speed: 30,
    initiative: 0,
    proficiencyBonus: 2,
    skills: [],
    equipment: [],
    spells: [],
    features: [],
    notes: "",
    xp: 0,
    portraitUrl: "",
    personalityTraits: "",
    ideals: "",
    bonds: "",
    flaws: "",
    inspiration: false,
    deathSaves: { successes: 0, failures: 0 },
    exhaustion: 0,
    spellSlots: {},
    currentSpellSlots: {},
    attunedItems: [],
    useMilestones: false
  });

  // ========== AUTHENTICATION EFFECT ==========
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Load user data from Firestore
        await loadUserData(currentUser.uid);
      } else {
        // Clear data when logged out
        setCampaigns([]);
        setCharacters([]);
        setEncounters([]);
        setNotes([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // ========== FIRESTORE DATA LOADING ==========
  const loadUserData = async (userId) => {
    try {
      const userDocRef = doc(db, `artifacts/dnd-companion-v1/users/${userId}`);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCampaigns(data.campaigns || []);
        setCharacters(data.characters || []);
        setEncounters(data.encounters || []);
        setNotes(data.notes || []);
        setDiceHistory(data.diceHistory || []);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // ========== FIRESTORE DATA SAVING ==========
  const saveUserData = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, `artifacts/dnd-companion-v1/users/${user.uid}`);
      await setDoc(userDocRef, {
        campaigns,
        characters,
        encounters,
        notes,
        diceHistory: diceHistory.slice(0, 50), // Keep last 50 rolls
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  // Auto-save whenever data changes
  useEffect(() => {
    if (user && !loading) {
      const timeoutId = setTimeout(() => {
        saveUserData();
      }, 1000); // Debounce saves by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [campaigns, characters, encounters, notes, user, loading]);

  // ========== AUTHENTICATION HANDLERS ==========
  const handleSignUp = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Sign up error: " + error.message);
    }
  };

  const handleSignIn = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Sign in error: " + error.message);
    }
  };

  const handleSignInAnonymously = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      alert("Anonymous sign in error: " + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert("Sign out error: " + error.message);
    }
  };

  // ========== CAMPAIGN HANDLERS ==========
  const createCampaign = (name, description = "") => {
    const newCampaign = {
      id: `campaign-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      module: "Random",
      characterIds: [],
      encounterIds: [],
      notes: ""
    };
    setCampaigns([...campaigns, newCampaign]);
    setSelectedCampaign(newCampaign.id);
    return newCampaign;
  };

  const deleteCampaign = (campaignId) => {
    if (window.confirm("Delete this campaign? This cannot be undone.")) {
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
      if (selectedCampaign === campaignId) {
        setSelectedCampaign(null);
      }
    }
  };

  const updateCampaign = (campaignId, updates) => {
    setCampaigns(campaigns.map(c => 
      c.id === campaignId ? { ...c, ...updates } : c
    ));
  };

  // ========== CHARACTER HANDLERS ==========
  const addCharacter = () => {
    // Calculate final stats with racial bonuses
    const finalStats = applyRacialBonuses(newCharacter.baseStats, newCharacter.race);
    
    // Get default spells for class
    const defaultSpells = isSpellcaster(newCharacter.class) 
      ? getDefaultSpellsForClass(newCharacter.class) 
      : [];
    
    // Get spell slots for level 1
    const spellSlots = isSpellcaster(newCharacter.class)
      ? getSpellSlots(newCharacter.class, 1)
      : {};
    
    // Calculate HP from class
    const classData = CLASS_DEFAULTS[newCharacter.class];
    const conModifier = getModifier(finalStats.con);
    const maxHp = (classData?.hitDie || 8) + conModifier;
    
    const character = {
      ...newCharacter,
      id: `char-${Date.now()}`,
      stats: finalStats,
      hp: maxHp,
      maxHp: maxHp,
      initiative: getModifier(finalStats.dex),
      proficiencyBonus: 2,
      spells: defaultSpells,
      spellSlots: spellSlots,
      currentSpellSlots: { ...spellSlots },
      features: classData?.features || [],
      equipment: classData?.equipment || []
    };

    setCharacters([...characters, character]);
    
    // Add to current campaign if one is selected
    if (selectedCampaign) {
      updateCampaign(selectedCampaign, {
        characterIds: [
          ...campaigns.find(c => c.id === selectedCampaign).characterIds,
          character.id
        ]
      });
    }
    
    // Reset form
    setNewCharacter({
      name: "",
      race: "Human",
      class: "Fighter",
      level: 1,
      background: "Soldier",
      alignment: "Lawful Good",
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      hp: 10,
      maxHp: 10,
      tempHp: 0,
      ac: 10,
      speed: 30,
      initiative: 0,
      proficiencyBonus: 2,
      skills: [],
      equipment: [],
      spells: [],
      features: [],
      notes: "",
      xp: 0,
      portraitUrl: "",
      personalityTraits: "",
      ideals: "",
      bonds: "",
      flaws: "",
      inspiration: false,
      deathSaves: { successes: 0, failures: 0 },
      exhaustion: 0,
      spellSlots: {},
      currentSpellSlots: {},
      attunedItems: [],
      useMilestones: false
    });
    
    setShowCharacterForm(false);
    setShowPointBuyHelper(false);
  };

  const deleteCharacter = (charId) => {
    if (window.confirm("Delete this character? This cannot be undone.")) {
      setCharacters(characters.filter(c => c.id !== charId));
      
      // Remove from all campaigns
      setCampaigns(campaigns.map(campaign => ({
        ...campaign,
        characterIds: campaign.characterIds.filter(id => id !== charId)
      })));
    }
  };

  const updateCharacter = (charId, updates) => {
    setCharacters(characters.map(c => 
      c.id === charId ? { ...c, ...updates } : c
    ));
  };

  // ========== LOADING SCREEN ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Sword className="w-16 h-16 text-amber-500 animate-pulse mx-auto mb-4" />
          <p className="text-white text-xl">Loading D&D Companion...</p>
        </div>
      </div>
    );
  }

  // ========== LOGIN SCREEN ==========
  if (!user) {
    return <LoginScreen 
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
      onSignInAnonymously={handleSignInAnonymously}
    />;
  }
  // ========== ENCOUNTER HANDLERS ==========
  const createEncounter = (name, participants = []) => {
    const encounter = {
      id: `enc-${Date.now()}`,
      name,
      participants: participants.map((p, idx) => ({
        ...p,
        id: p.id || `participant-${Date.now()}-${idx}`,
        initiative: p.initiative || 0,
        currentHp: p.hp || p.maxHp || 10,
        maxHp: p.maxHp || 10,
        ac: p.ac || 10,
        isPlayer: p.isPlayer || false,
        conditions: p.conditions || []
      })),
      round: 0,
      currentTurn: 0,
      log: [],
      isActive: false,
      createdAt: new Date().toISOString()
    };
    setEncounters([...encounters, encounter]);
    return encounter;
  };

  const deleteEncounter = (encId) => {
    if (window.confirm("Delete this encounter?")) {
      setEncounters(encounters.filter(e => e.id !== encId));
      if (activeEncounter?.id === encId) {
        setActiveEncounter(null);
      }
    }
  };

  const startEncounter = (encounter) => {
    // Sort by initiative (highest first)
    const sorted = [...encounter.participants].sort((a, b) => b.initiative - a.initiative);
    const started = {
      ...encounter,
      participants: sorted,
      round: 1,
      currentTurn: 0,
      isActive: true,
      log: [`Combat started! Round 1 begins.`]
    };
    setActiveEncounter(started);
    updateEncounter(encounter.id, started);
  };

  const endEncounter = () => {
    if (activeEncounter) {
      const ended = {
        ...activeEncounter,
        isActive: false,
        log: [...activeEncounter.log, "Combat ended."]
      };
      updateEncounter(activeEncounter.id, ended);
      setActiveEncounter(null);
    }
  };

  const nextTurn = () => {
    if (!activeEncounter) return;
    
    const nextTurnIndex = (activeEncounter.currentTurn + 1) % activeEncounter.participants.length;
    const isNewRound = nextTurnIndex === 0;
    
    const updated = {
      ...activeEncounter,
      currentTurn: nextTurnIndex,
      round: isNewRound ? activeEncounter.round + 1 : activeEncounter.round,
      log: [
        ...activeEncounter.log,
        isNewRound ? `--- Round ${activeEncounter.round + 1} ---` : "",
        `${activeEncounter.participants[nextTurnIndex].name}'s turn.`
      ].filter(Boolean)
    };
    
    setActiveEncounter(updated);
    updateEncounter(activeEncounter.id, updated);
  };

  const updateEncounter = (encId, updates) => {
    setEncounters(encounters.map(e => 
      e.id === encId ? { ...e, ...updates } : e
    ));
  };

  const damageParticipant = (participantId, damage) => {
    if (!activeEncounter) return;
    
    const updated = {
      ...activeEncounter,
      participants: activeEncounter.participants.map(p => {
        if (p.id === participantId) {
          const newHp = Math.max(0, p.currentHp - damage);
          const isDown = newHp === 0 && p.currentHp > 0;
          return {
            ...p,
            currentHp: newHp,
            conditions: isDown ? [...p.conditions, "Unconscious"] : p.conditions
          };
        }
        return p;
      }),
      log: [
        ...activeEncounter.log,
        `${activeEncounter.participants.find(p => p.id === participantId).name} takes ${damage} damage.`
      ]
    };
    
    setActiveEncounter(updated);
    updateEncounter(activeEncounter.id, updated);
  };

  const healParticipant = (participantId, healing) => {
    if (!activeEncounter) return;
    
    const updated = {
      ...activeEncounter,
      participants: activeEncounter.participants.map(p => {
        if (p.id === participantId) {
          const newHp = Math.min(p.maxHp, p.currentHp + healing);
          const wasDown = p.currentHp === 0;
          return {
            ...p,
            currentHp: newHp,
            conditions: wasDown ? p.conditions.filter(c => c !== "Unconscious") : p.conditions
          };
        }
        return p;
      }),
      log: [
        ...activeEncounter.log,
        `${activeEncounter.participants.find(p => p.id === participantId).name} heals ${healing} HP.`
      ]
    };
    
    setActiveEncounter(updated);
    updateEncounter(activeEncounter.id, updated);
  };

  const addCondition = (participantId, condition) => {
    if (!activeEncounter) return;
    
    const updated = {
      ...activeEncounter,
      participants: activeEncounter.participants.map(p => {
        if (p.id === participantId && !p.conditions.includes(condition)) {
          return { ...p, conditions: [...p.conditions, condition] };
        }
        return p;
      }),
      log: [
        ...activeEncounter.log,
        `${activeEncounter.participants.find(p => p.id === participantId).name} gains condition: ${condition}`
      ]
    };
    
    setActiveEncounter(updated);
    updateEncounter(activeEncounter.id, updated);
  };

  const removeCondition = (participantId, condition) => {
    if (!activeEncounter) return;
    
    const updated = {
      ...activeEncounter,
      participants: activeEncounter.participants.map(p => {
        if (p.id === participantId) {
          return { ...p, conditions: p.conditions.filter(c => c !== condition) };
        }
        return p;
      }),
      log: [
        ...activeEncounter.log,
        `${activeEncounter.participants.find(p => p.id === participantId).name} loses condition: ${condition}`
      ]
    };
    
    setActiveEncounter(updated);
    updateEncounter(activeEncounter.id, updated);
  };

  // ========== DICE ROLLER ==========
  const rollDice = (diceNotation, label = "") => {
    // Parse dice notation like "2d20+5" or "1d6"
    const match = diceNotation.match(/(\d+)d(\d+)([+-]\d+)?/i);
    if (!match) return;
    
    const [, numDice, diceSize, modifier] = match;
    const count = parseInt(numDice);
    const size = parseInt(diceSize);
    const mod = modifier ? parseInt(modifier) : 0;
    
    const rolls = Array(count).fill(0).map(() => Math.floor(Math.random() * size) + 1);
    const total = rolls.reduce((sum, val) => sum + val, 0) + mod;
    
    const result = {
      notation: diceNotation,
      rolls,
      modifier: mod,
      total,
      label,
      timestamp: new Date().toISOString()
    };
    
    setDiceResults([result, ...diceResults.slice(0, 4)]); // Keep last 5
    setDiceHistory([result, ...diceHistory.slice(0, 49)]); // Keep last 50
    
    return result;
  };

  const rollAbilityCheck = (abilityScore, proficient = false, level = 1, label = "") => {
    const modifier = getModifier(abilityScore);
    const profBonus = proficient ? getProficiencyBonus(level) : 0;
    const totalMod = modifier + profBonus;
    
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + totalMod;
    
    const result = {
      notation: `1d20${totalMod >= 0 ? '+' : ''}${totalMod}`,
      rolls: [roll],
      modifier: totalMod,
      total,
      label: label || `Ability Check (${totalMod >= 0 ? '+' : ''}${totalMod})`,
      timestamp: new Date().toISOString(),
      isCrit: roll === 20,
      isFail: roll === 1
    };
    
    setDiceResults([result, ...diceResults.slice(0, 4)]);
    setDiceHistory([result, ...diceHistory.slice(0, 49)]);
    
    return result;
  };

  // ========== NOTES HANDLERS ==========
  const saveNote = () => {
    if (!noteTitle.trim() && !currentNote.trim()) return;
    
    if (editingNoteId) {
      // Update existing note
      setNotes(notes.map(n => 
        n.id === editingNoteId 
          ? { ...n, title: noteTitle, content: currentNote, updatedAt: new Date().toISOString() }
          : n
      ));
      setEditingNoteId(null);
    } else {
      // Create new note
      const newNote = {
        id: `note-${Date.now()}`,
        title: noteTitle || "Untitled Note",
        content: currentNote,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setNotes([newNote, ...notes]);
    }
    
    setNoteTitle("");
    setCurrentNote("");
  };

  const editNote = (note) => {
    setNoteTitle(note.title);
    setCurrentNote(note.content);
    setEditingNoteId(note.id);
    setActiveTab("notes");
  };

  const deleteNote = (noteId) => {
    if (window.confirm("Delete this note?")) {
      setNotes(notes.filter(n => n.id !== noteId));
      if (editingNoteId === noteId) {
        setNoteTitle("");
        setCurrentNote("");
        setEditingNoteId(null);
      }
    }
  };

  // ========== QUICK ENCOUNTER BUILDER ==========
  const buildQuickEncounter = (moduleEncounter) => {
    const monsterParticipants = moduleEncounter.monsters.map((monsterName, idx) => {
      const monsterData = MONSTER_MANUAL.find(m => m.name === monsterName);
      return {
        id: `monster-${Date.now()}-${idx}`,
        name: `${monsterName} ${idx + 1}`,
        hp: monsterData?.hp || 10,
        maxHp: monsterData?.hp || 10,
        currentHp: monsterData?.hp || 10,
        ac: monsterData?.ac || 10,
        initiative: Math.floor(Math.random() * 20) + 1,
        isPlayer: false,
        type: monsterData?.type || "Unknown",
        cr: monsterData?.cr || "?",
        actions: monsterData?.actions || "No actions listed"
      };
    });

    const playerParticipants = characters
      .filter(c => selectedCampaign ? 
        campaigns.find(camp => camp.id === selectedCampaign)?.characterIds.includes(c.id) 
        : true)
      .map(c => ({
        id: c.id,
        name: c.name,
        hp: c.hp,
        maxHp: c.maxHp,
        currentHp: c.hp,
        ac: c.ac,
        initiative: Math.floor(Math.random() * 20) + 1 + getModifier(c.stats.dex),
        isPlayer: true,
        class: c.class,
        level: c.level
      }));

    const encounter = createEncounter(
      moduleEncounter.name,
      [...playerParticipants, ...monsterParticipants]
    );

    setActiveTab("combat");
    return encounter;
  };

  // ========== HELPER COMPONENTS ==========
  
  // Login Screen Component
  const LoginScreen = ({ onSignIn, onSignUp, onSignInAnonymously }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full border border-amber-700">
          <div className="text-center mb-8">
            <Sword className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-amber-500 mb-2">D&D Companion</h1>
            <p className="text-slate-300">Your Ultimate Campaign Manager</p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
            />
            
            <button
              onClick={() => isSignUp ? onSignUp(email, password) : onSignIn(email, password)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition"
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-amber-400 hover:text-amber-300 text-sm transition"
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">Or</span>
              </div>
            </div>

            <button
              onClick={onSignInAnonymously}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded transition"
            >
              Continue as Guest
            </button>
          </div>

          <p className="mt-6 text-center text-slate-400 text-xs">
            Guest mode: Your data is saved locally but won't sync across devices
          </p>
        </div>
      </div>
    );
  };

  // Stat Block Component
  const StatBlock = ({ stat, value, modifier, isPrinter = false }) => (
    <div className={`text-center p-2 rounded ${isPrinter ? 'border border-black' : 'bg-slate-700'}`}>
      <div className={`text-xs font-semibold ${isPrinter ? 'text-black' : 'text-amber-400'} uppercase`}>
        {stat}
      </div>
      <div className={`text-2xl font-bold ${isPrinter ? 'text-black' : 'text-white'}`}>
        {value}
      </div>
      <div className={`text-sm ${isPrinter ? 'text-black' : 'text-slate-300'}`}>
        {formatModifier(modifier)}
      </div>
    </div>
  );

  // Dice Button Component
  const DiceButton = ({ notation, label, size = "normal" }) => {
    const sizeClasses = {
      small: "px-2 py-1 text-xs",
      normal: "px-3 py-2 text-sm",
      large: "px-4 py-3 text-base"
    };

    return (
      <button
        onClick={() => rollDice(notation, label)}
        className={`bg-amber-600 hover:bg-amber-700 text-white font-bold rounded transition ${sizeClasses[size]}`}
      >
        {label || notation}
      </button>
    );
  };
  // ========== CHARACTER CARD COMPONENT ==========
  const CharacterCard = ({ char }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localChar, setLocalChar] = useState({ ...char });
    const [showFullSpells, setShowFullSpells] = useState(false);
    const [showPointBuy, setShowPointBuy] = useState(false);
    const [selectedSpellLevel, setSelectedSpellLevel] = useState(0);

    // Calculate derived stats
    const statModifiers = {
      str: getModifier(localChar.stats.str),
      dex: getModifier(localChar.stats.dex),
      con: getModifier(localChar.stats.con),
      int: getModifier(localChar.stats.int),
      wis: getModifier(localChar.stats.wis),
      cha: getModifier(localChar.stats.cha)
    };

    const profBonus = getProficiencyBonus(localChar.level);

    // Save changes
    const saveChanges = () => {
      // Recalculate HP if CON changed
      if (localChar.stats.con !== char.stats.con) {
        const oldConMod = getModifier(char.stats.con);
        const newConMod = getModifier(localChar.stats.con);
        const hpDiff = (newConMod - oldConMod) * localChar.level;
        localChar.maxHp = Math.max(1, localChar.maxHp + hpDiff);
        localChar.hp = Math.max(0, localChar.hp + hpDiff);
      }

      // Update spell slots if class/level changed
      if (isSpellcaster(localChar.class)) {
        const newSlots = getSpellSlots(localChar.class, localChar.level);
        localChar.spellSlots = newSlots || {};
        // Reset current slots to max
        localChar.currentSpellSlots = { ...newSlots };
      }

      updateCharacter(char.id, localChar);
      setIsEditing(false);
    };

    const cancelEditing = () => {
      setLocalChar({ ...char });
      setIsEditing(false);
      setShowPointBuy(false);
    };

    // Point Buy helper
    const updateBaseStat = (stat, value) => {
      const newValue = Math.max(8, Math.min(15, parseInt(value) || 8));
      const newBaseStats = { ...localChar.baseStats, [stat]: newValue };
      const newFinalStats = applyRacialBonuses(newBaseStats, localChar.race);
      setLocalChar({ 
        ...localChar, 
        baseStats: newBaseStats,
        stats: newFinalStats
      });
    };

    // Spell management
    const addSpellToCharacter = (spellName) => {
      if (!localChar.spells.includes(spellName)) {
        setLocalChar({ ...localChar, spells: [...localChar.spells, spellName] });
      }
    };

    const removeSpellFromCharacter = (spellName) => {
      setLocalChar({ ...localChar, spells: localChar.spells.filter(s => s !== spellName) });
    };

    const useSpellSlot = (level) => {
      if (localChar.currentSpellSlots[level] > 0) {
        const updated = {
          ...localChar,
          currentSpellSlots: {
            ...localChar.currentSpellSlots,
            [level]: localChar.currentSpellSlots[level] - 1
          }
        };
        updateCharacter(char.id, updated);
        setLocalChar(updated);
      }
    };

    const restoreSpellSlot = (level) => {
      if (localChar.currentSpellSlots[level] < localChar.spellSlots[level]) {
        const updated = {
          ...localChar,
          currentSpellSlots: {
            ...localChar.currentSpellSlots,
            [level]: localChar.currentSpellSlots[level] + 1
          }
        };
        updateCharacter(char.id, updated);
        setLocalChar(updated);
      }
    };

    const longRest = () => {
      const updated = {
        ...localChar,
        hp: localChar.maxHp,
        tempHp: 0,
        currentSpellSlots: { ...localChar.spellSlots },
        deathSaves: { successes: 0, failures: 0 }
      };
      updateCharacter(char.id, updated);
      setLocalChar(updated);
    };

    // Death saves
    const rollDeathSave = () => {
      const roll = Math.floor(Math.random() * 20) + 1;
      const updated = { ...localChar };
      
      if (roll === 20) {
        // Nat 20: regain 1 HP
        updated.hp = 1;
        updated.deathSaves = { successes: 0, failures: 0 };
        alert("Natural 20! Character regains 1 HP!");
      } else if (roll === 1) {
        // Nat 1: 2 failures
        updated.deathSaves.failures = Math.min(3, updated.deathSaves.failures + 2);
        if (updated.deathSaves.failures >= 3) {
          alert("Character has died!");
        }
      } else if (roll >= 10) {
        // Success
        updated.deathSaves.successes = Math.min(3, updated.deathSaves.successes + 1);
        if (updated.deathSaves.successes >= 3) {
          updated.hp = 1;
          updated.deathSaves = { successes: 0, failures: 0 };
          alert("Stabilized! Character has 1 HP.");
        }
      } else {
        // Failure
        updated.deathSaves.failures = Math.min(3, updated.deathSaves.failures + 1);
        if (updated.deathSaves.failures >= 3) {
          alert("Character has died!");
        }
      }
      
      updateCharacter(char.id, updated);
      setLocalChar(updated);
    };

    // Attunement management
    const toggleAttunement = (itemName) => {
      const isAttuned = localChar.attunedItems.includes(itemName);
      let newAttuned = [...localChar.attunedItems];
      
      if (isAttuned) {
        newAttuned = newAttuned.filter(i => i !== itemName);
      } else {
        if (newAttuned.length >= 3) {
          alert("Maximum 3 attuned items! Remove one first.");
          return;
        }
        newAttuned.push(itemName);
      }
      
      const updated = { ...localChar, attunedItems: newAttuned };
      updateCharacter(char.id, updated);
      setLocalChar(updated);
    };

    // Point Buy validation display
    const pointBuyValidation = validatePointBuy(localChar.baseStats);
    const racialBonusesForRace = RACIAL_BONUSES[localChar.race] || {};

    return (
      <div className={`${printerMode ? 'bg-white text-black border-2 border-black' : 'bg-slate-800 border border-amber-700'} rounded-lg p-6 shadow-xl`}>
        {/* ========== HEADER ========== */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                className={`font-bold text-2xl ${printerMode ? 'bg-white border border-black' : 'bg-slate-900 border border-slate-600'} rounded px-3 py-2 text-white w-full mb-2`}
                value={localChar.name}
                onChange={(e) => setLocalChar({ ...localChar, name: e.target.value })}
              />
            ) : (
              <h3 className={`font-bold text-2xl mb-2 ${printerMode ? 'text-black' : 'text-white'}`}>
                {char.name}
              </h3>
            )}
            
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={localChar.race}
                    onChange={(e) => {
                      const newRace = e.target.value;
                      const newStats = applyRacialBonuses(localChar.baseStats, newRace);
                      setLocalChar({ ...localChar, race: newRace, stats: newStats });
                    }}
                    className={`${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 border border-slate-600 text-white'} rounded px-2 py-1`}
                  >
                    {RACES.map(race => (
                      <option key={race} value={race}>{race}</option>
                    ))}
                  </select>
                  
                  <select
                    value={localChar.class}
                    onChange={(e) => {
                      const newClass = e.target.value;
                      const classData = CLASS_DEFAULTS[newClass];
                      const newSpells = isSpellcaster(newClass) ? getDefaultSpellsForClass(newClass) : [];
                      setLocalChar({ ...localChar, class: newClass, spells: newSpells });
                    }}
                    className={`${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 border border-slate-600 text-white'} rounded px-2 py-1`}
                  >
                    {CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <select
                  value={localChar.alignment}
                  onChange={(e) => setLocalChar({ ...localChar, alignment: e.target.value })}
                  className={`${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 border border-slate-600 text-white'} rounded px-2 py-1 w-full`}
                >
                  {ALIGNMENTS.map(align => (
                    <option key={align} value={align}>{align}</option>
                  ))}
                </select>

                <select
                  value={localChar.background}
                  onChange={(e) => setLocalChar({ ...localChar, background: e.target.value })}
                  className={`${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 border border-slate-600 text-white'} rounded px-2 py-1 w-full`}
                >
                  {BACKGROUNDS.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <label className={`text-sm ${printerMode ? 'text-black' : 'text-slate-300'}`}>
                    Level:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={localChar.level}
                    onChange={(e) => setLocalChar({ ...localChar, level: parseInt(e.target.value) || 1 })}
                    className={`${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 border border-slate-600 text-white'} rounded px-2 py-1 w-20`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className={`text-sm ${printerMode ? 'text-black' : 'text-slate-300'}`}>
                    Portrait URL:
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={localChar.portraitUrl || ""}
                    onChange={(e) => setLocalChar({ ...localChar, portraitUrl: e.target.value })}
                    className={`${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 border border-slate-600 text-white'} rounded px-2 py-1 flex-1 text-sm`}
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className={`${printerMode ? 'text-black' : 'text-slate-300'} text-lg`}>
                  {char.race} {char.class}
                </p>
                <p className={`${printerMode ? 'text-gray-700' : 'text-slate-400'} text-sm`}>
                  Level {char.level} • {char.alignment}
                </p>
                <p className={`${printerMode ? 'text-gray-700' : 'text-slate-400'} text-sm`}>
                  {char.background}
                </p>
              </div>
            )}
          </div>

          {/* Portrait */}
          {localChar.portraitUrl && !printerMode && (
            <img 
              src={localChar.portraitUrl} 
              alt={localChar.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-amber-600 ml-4"
              onError={(e) => e.target.style.display = 'none'}
            />
          )}

          {!printerMode && (
            <div className="flex gap-2 ml-4">
              {isEditing ? (
                <>
                  <button
                    onClick={saveChanges}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteCharacter(char.id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ========== CORE STATS ========== */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`text-center p-3 rounded ${printerMode ? 'border border-black' : 'bg-slate-700'}`}>
            <div className={`text-sm ${printerMode ? 'text-black' : 'text-amber-400'}`}>AC</div>
            {isEditing ? (
              <input
                type="number"
                value={localChar.ac}
                onChange={(e) => setLocalChar({ ...localChar, ac: parseInt(e.target.value) || 10 })}
                className={`text-2xl font-bold text-center w-full ${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 text-white'} rounded`}
              />
            ) : (
              <div className={`text-2xl font-bold ${printerMode ? 'text-black' : 'text-white'}`}>{char.ac}</div>
            )}
          </div>

          <div className={`text-center p-3 rounded ${printerMode ? 'border border-black' : 'bg-slate-700'}`}>
            <div className={`text-sm ${printerMode ? 'text-black' : 'text-amber-400'}`}>Initiative</div>
            <div className={`text-2xl font-bold ${printerMode ? 'text-black' : 'text-white'}`}>
              {formatModifier(statModifiers.dex)}
            </div>
          </div>

          <div className={`text-center p-3 rounded ${printerMode ? 'border border-black' : 'bg-slate-700'}`}>
            <div className={`text-sm ${printerMode ? 'text-black' : 'text-amber-400'}`}>Speed</div>
            {isEditing ? (
              <input
                type="number"
                value={localChar.speed}
                onChange={(e) => setLocalChar({ ...localChar, speed: parseInt(e.target.value) || 30 })}
                className={`text-2xl font-bold text-center w-full ${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 text-white'} rounded`}
              />
            ) : (
              <div className={`text-2xl font-bold ${printerMode ? 'text-black' : 'text-white'}`}>{char.speed} ft</div>
            )}
          </div>
        </div>

        {/* ========== HP & TEMP HP ========== */}
        <div className="mb-6 space-y-3">
          <div className={`p-4 rounded ${printerMode ? 'border border-black' : 'bg-slate-700'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-semibold ${printerMode ? 'text-black' : 'text-amber-400'}`}>
                Hit Points
              </span>
              {!printerMode && !isEditing && (
                <div className="flex gap-1">
                  <button
                    onClick={() => updateCharacter(char.id, { hp: Math.max(0, char.hp - 1) })}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => updateCharacter(char.id, { hp: Math.min(char.maxHp, char.hp + 1) })}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                  >
                    +1
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              {isEditing ? (
                <div className="flex gap-2 items-center flex-1">
                  <input
                    type="number"
                    value={localChar.hp}
                    onChange={(e) => setLocalChar({ ...localChar, hp: parseInt(e.target.value) || 0 })}
                    className={`${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 text-white'} rounded px-2 py-1 w-20`}
                  />
                  <span className={printerMode ? 'text-black' : 'text-white'}>/</span>
                  <input
                    type="number"
                    value={localChar.maxHp}
                    onChange={(e) => setLocalChar({ ...localChar, maxHp: parseInt(e.target.value) || 1 })}
                    className={`${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 text-white'} rounded px-2 py-1 w-20`}
                  />
                </div>
              ) : (
                <div className={`text-2xl font-bold ${printerMode ? 'text-black' : 'text-white'}`}>
                  {char.hp} / {char.maxHp}
                </div>
              )}
              <div className={`text-sm ${printerMode ? 'text-gray-700' : 'text-slate-300'}`}>
                ({Math.round((char.hp / char.maxHp) * 100)}%)
              </div>
            </div>
          </div>

          {/* Temporary HP */}
          <div className={`p-3 rounded ${printerMode ? 'border border-black' : 'bg-slate-700'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm font-semibold ${printerMode ? 'text-black' : 'text-blue-400'}`}>
                Temp HP
              </span>
              {isEditing ? (
                <input
                  type="number"
                  value={localChar.tempHp || 0}
                  onChange={(e) => setLocalChar({ ...localChar, tempHp: parseInt(e.target.value) || 0 })}
                  className={`${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 text-white'} rounded px-2 py-1 w-20`}
                />
              ) : (
                <div className={`text-xl font-bold ${printerMode ? 'text-black' : 'text-white'}`}>
                  {char.tempHp || 0}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* ========== ABILITY SCORES ========== */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className={`font-bold ${printerMode ? 'text-black' : 'text-amber-400'}`}>Ability Scores</h4>
            {isEditing && (
              <button
                onClick={() => setShowPointBuy(!showPointBuy)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
              >
                {showPointBuy ? 'Hide' : 'Show'} Point Buy
              </button>
            )}
          </div>

          {/* Point Buy Helper */}
          {isEditing && showPointBuy && (
            <div className={`mb-4 p-4 rounded ${printerMode ? 'border border-black' : 'bg-slate-900 border border-purple-500'}`}>
              <div className="mb-3">
                <h5 className={`font-bold mb-2 ${printerMode ? 'text-black' : 'text-purple-400'}`}>
                  Point Buy System (27 points)
                </h5>
                <div className={`text-sm mb-2 ${pointBuyValidation.valid ? 'text-green-400' : 'text-red-400'}`}>
                  Points: {pointBuyValidation.spent} / 27 
                  {pointBuyValidation.remaining > 0 && ` (${pointBuyValidation.remaining} remaining)`}
                  {pointBuyValidation.spent > 27 && ` (${pointBuyValidation.spent - 27} over budget!)`}
                </div>
                {pointBuyValidation.errors.length > 0 && (
                  <div className="text-xs text-yellow-400 mb-2">
                    ⚠️ {pointBuyValidation.errors.join(', ')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => {
                  const baseStat = localChar.baseStats[stat];
                  const racialBonus = racialBonusesForRace[stat] || 0;
                  const finalStat = localChar.stats[stat];
                  const cost = getPointBuyCost(baseStat);
                  
                  return (
                    <div key={stat} className={`p-2 rounded ${printerMode ? 'border border-black' : 'bg-slate-800'}`}>
                      <div className={`text-xs uppercase font-semibold mb-1 ${printerMode ? 'text-black' : 'text-amber-400'}`}>
                        {stat.toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="8"
                          max="15"
                          value={baseStat}
                          onChange={(e) => updateBaseStat(stat, e.target.value)}
                          className={`w-16 px-2 py-1 rounded text-center font-bold ${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-700 text-white'}`}
                        />
                        {racialBonus !== 0 && (
                          <span className={`text-sm ${printerMode ? 'text-black' : 'text-green-400'}`}>
                            +{racialBonus}
                          </span>
                        )}
                        <span className={`text-sm font-bold ${printerMode ? 'text-black' : 'text-white'}`}>
                          = {finalStat}
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ${printerMode ? 'text-gray-600' : 'text-slate-400'}`}>
                        Cost: {cost} {cost === 1 ? 'pt' : 'pts'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Racial Bonuses Summary */}
              <div className={`text-xs p-2 rounded ${printerMode ? 'bg-gray-100 border border-black' : 'bg-slate-800'}`}>
                <span className={`font-semibold ${printerMode ? 'text-black' : 'text-green-400'}`}>
                  {localChar.race} Bonuses:
                </span>
                <span className={`ml-2 ${printerMode ? 'text-black' : 'text-slate-300'}`}>
                  {Object.entries(racialBonusesForRace).length > 0 
                    ? Object.entries(racialBonusesForRace).map(([stat, bonus]) => 
                        `${stat.toUpperCase()} +${bonus}`
                      ).join(', ')
                    : 'None'}
                </span>
              </div>

              {/* Point Buy Reference Table */}
              <details className="mt-3">
                <summary className={`cursor-pointer text-xs ${printerMode ? 'text-black' : 'text-purple-400'} hover:underline`}>
                  Show Point Buy Costs
                </summary>
                <div className={`mt-2 text-xs ${printerMode ? 'text-black' : 'text-slate-300'} grid grid-cols-4 gap-2`}>
                  <div>8 = 0 pts</div>
                  <div>9 = 1 pt</div>
                  <div>10 = 2 pts</div>
                  <div>11 = 3 pts</div>
                  <div>12 = 4 pts</div>
                  <div>13 = 5 pts</div>
                  <div>14 = 7 pts</div>
                  <div>15 = 9 pts</div>
                </div>
              </details>
            </div>
          )}

          {/* Standard Ability Score Display */}
          <div className="grid grid-cols-3 gap-3">
            {isEditing && !showPointBuy ? (
              // Simple edit mode (without Point Buy)
              ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                <div key={stat} className={`text-center p-2 rounded ${printerMode ? 'border border-black' : 'bg-slate-700'}`}>
                  <div className={`text-xs font-semibold uppercase mb-1 ${printerMode ? 'text-black' : 'text-amber-400'}`}>
                    {stat}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={localChar.stats[stat]}
                    onChange={(e) => setLocalChar({ 
                      ...localChar, 
                      stats: { ...localChar.stats, [stat]: parseInt(e.target.value) || 1 }
                    })}
                    className={`text-2xl font-bold text-center w-full ${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 text-white'} rounded mb-1`}
                  />
                  <div className={`text-sm ${printerMode ? 'text-gray-700' : 'text-slate-300'}`}>
                    {formatModifier(getModifier(localChar.stats[stat]))}
                  </div>
                </div>
              ))
            ) : (
              // Display mode
              ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                <StatBlock
                  key={stat}
                  stat={stat.toUpperCase()}
                  value={char.stats[stat]}
                  modifier={statModifiers[stat]}
                  isPrinter={printerMode}
                />
              ))
            )}
          </div>
        </div>

        {/* ========== PROFICIENCY BONUS ========== */}
        <div className={`mb-6 p-3 rounded text-center ${printerMode ? 'border border-black' : 'bg-slate-700'}`}>
          <div className={`text-sm ${printerMode ? 'text-black' : 'text-amber-400'} mb-1`}>
            Proficiency Bonus
          </div>
          <div className={`text-2xl font-bold ${printerMode ? 'text-black' : 'text-white'}`}>
            {formatModifier(profBonus)}
          </div>
        </div>

        {/* ========== SKILLS ========== */}
        <div className="mb-6">
          <h4 className={`font-bold mb-3 ${printerMode ? 'text-black' : 'text-amber-400'}`}>Skills</h4>
          {isEditing ? (
            <div className="space-y-2">
              <div className={`text-xs ${printerMode ? 'text-gray-700' : 'text-slate-400'} mb-2`}>
                Max proficient skills for {localChar.class}: {CLASS_DEFAULTS[localChar.class]?.maxSkills || 2}
                {localChar.skills.length > (CLASS_DEFAULTS[localChar.class]?.maxSkills || 2) && (
                  <span className="text-yellow-500 ml-2">
                    ⚠️ Too many skills selected!
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SKILLS.map(skill => (
                  <label key={skill} className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                    localChar.skills.includes(skill)
                      ? (printerMode ? 'bg-gray-200 border border-black' : 'bg-slate-700')
                      : (printerMode ? 'bg-white border border-gray-400' : 'bg-slate-900')
                  }`}>
                    <input
                      type="checkbox"
                      checked={localChar.skills.includes(skill)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLocalChar({ ...localChar, skills: [...localChar.skills, skill] });
                        } else {
                          setLocalChar({ ...localChar, skills: localChar.skills.filter(s => s !== skill) });
                        }
                      }}
                      className="form-checkbox"
                    />
                    <span className={`text-sm ${printerMode ? 'text-black' : 'text-white'}`}>{skill}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {SKILLS.map(skill => {
                const abilityForSkill = SKILL_ABILITIES[skill];
                const abilityScore = char.stats[abilityForSkill];
                const isProficient = char.skills.includes(skill);
                const bonus = getSkillBonus(abilityScore, isProficient, char.level);
                
                return (
                  <div key={skill} className={`flex justify-between items-center p-2 rounded ${
                    isProficient 
                      ? (printerMode ? 'bg-gray-200 border border-black' : 'bg-slate-700') 
                      : (printerMode ? 'bg-white border border-gray-400' : 'bg-slate-900')
                  }`}>
                    <span className={`text-sm ${printerMode ? 'text-black' : 'text-white'}`}>
                      {isProficient && '⬤ '}{skill}
                    </span>
                    <span className={`font-bold ${printerMode ? 'text-black' : 'text-amber-400'}`}>
                      {formatModifier(bonus)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========== INSPIRATION & DEATH SAVES ========== */}
        {!printerMode && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Inspiration */}
            <div className={`p-3 rounded ${localChar.inspiration ? 'bg-yellow-900 border border-yellow-600' : 'bg-slate-700'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-amber-400">Inspiration</span>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={localChar.inspiration}
                    onChange={(e) => setLocalChar({ ...localChar, inspiration: e.target.checked })}
                    className="form-checkbox h-5 w-5"
                  />
                ) : (
                  <button
                    onClick={() => updateCharacter(char.id, { inspiration: !char.inspiration })}
                    className={`px-3 py-1 rounded text-sm font-bold ${
                      char.inspiration 
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                    }`}
                  >
                    {char.inspiration ? '★' : '☆'}
                  </button>
                )}
              </div>
            </div>

            {/* Exhaustion */}
            <div className="p-3 rounded bg-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-red-400">Exhaustion</span>
                <span className="text-lg font-bold text-white">{localChar.exhaustion}/6</span>
              </div>
              {isEditing && (
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={localChar.exhaustion}
                  onChange={(e) => setLocalChar({ ...localChar, exhaustion: parseInt(e.target.value) })}
                  className="w-full"
                />
              )}
            </div>
          </div>
        )}

        {/* Death Saves (only show if unconscious) */}
        {char.hp === 0 && !printerMode && (
          <div className="mb-6 p-4 rounded bg-red-900 border border-red-600">
            <h4 className="font-bold text-red-300 mb-3">Death Saves</h4>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm text-green-400 mb-1">Successes</div>
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-6 h-6 rounded border-2 ${
                      localChar.deathSaves.successes >= i 
                        ? 'bg-green-600 border-green-400' 
                        : 'border-green-600'
                    }`} />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-red-400 mb-1">Failures</div>
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-6 h-6 rounded border-2 ${
                      localChar.deathSaves.failures >= i 
                        ? 'bg-red-600 border-red-400' 
                        : 'border-red-600'
                    }`} />
                  ))}
                </div>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={rollDeathSave}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Roll Death Save
              </button>
            )}
          </div>
        )}

        {/* ========== SPELL SLOTS (for casters) ========== */}
        {isSpellcaster(char.class) && char.spellSlots && Object.keys(char.spellSlots).length > 0 && (
          <div className="mb-6">
            <h4 className={`font-bold mb-3 ${printerMode ? 'text-black' : 'text-amber-400'}`}>Spell Slots</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(char.spellSlots).map(([level, maxSlots]) => (
                <div key={level} className={`p-2 rounded ${printerMode ? 'border border-black' : 'bg-slate-700'}`}>
                  <div className={`text-xs mb-1 ${printerMode ? 'text-black' : 'text-purple-400'}`}>
                    Level {level}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${printerMode ? 'text-black' : 'text-white'}`}>
                      {char.currentSpellSlots[level] || 0} / {maxSlots}
                    </span>
                    {!printerMode && !isEditing && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => useSpellSlot(level)}
                          className="bg-red-600 hover:bg-red-700 text-white px-1 text-xs rounded"
                          disabled={!char.currentSpellSlots[level] || char.currentSpellSlots[level] === 0}
                        >
                          -
                        </button>
                        <button
                          onClick={() => restoreSpellSlot(level)}
                          className="bg-green-600 hover:bg-green-700 text-white px-1 text-xs rounded"
                          disabled={char.currentSpellSlots[level] >= maxSlots}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ========== SPELLS (for casters only) ========== */}
        {isSpellcaster(char.class) && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className={`font-bold ${printerMode ? 'text-black' : 'text-amber-400'}`}>
                Spells ({char.spells.length})
              </h4>
              {!printerMode && isEditing && (
                <button
                  onClick={() => setShowFullSpells(!showFullSpells)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                >
                  {showFullSpells ? 'Hide' : 'Add'} Spells
                </button>
              )}
            </div>

            {/* Spell Adding Interface */}
            {isEditing && showFullSpells && (
              <div className={`mb-4 p-4 rounded ${printerMode ? 'border border-black' : 'bg-slate-900 border border-purple-500'}`}>
                <h5 className={`font-bold mb-2 ${printerMode ? 'text-black' : 'text-purple-400'}`}>
                  Add Spells from Compendium
                </h5>
                
                {/* Filters */}
                <div className="flex gap-2 mb-3">
                  <select
                    value={selectedSpellLevel}
                    onChange={(e) => setSelectedSpellLevel(parseInt(e.target.value))}
                    className={`${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-800 text-white border border-slate-600'} rounded px-2 py-1 text-sm`}
                  >
                    <option value={0}>Cantrips</option>
                    {[1,2,3,4,5,6,7,8,9].map(lvl => (
                      <option key={lvl} value={lvl}>Level {lvl}</option>
                    ))}
                  </select>
                </div>

                {/* Spell List */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {SPELL_COMPENDIUM
                    .filter(spell => spell.level === selectedSpellLevel)
                    .filter(spell => spell.classes.includes(localChar.class))
                    .map(spell => (
                      <div key={spell.name} className={`p-2 rounded ${printerMode ? 'border border-gray-400' : 'bg-slate-800'} flex justify-between items-start`}>
                        <div className="flex-1">
                          <div className={`font-semibold text-sm ${printerMode ? 'text-black' : 'text-purple-300'}`}>
                            {spell.name}
                          </div>
                          <div className={`text-xs ${printerMode ? 'text-gray-600' : 'text-slate-400'}`}>
                            {spell.school} • {spell.castingTime} • {spell.range}
                          </div>
                          <div className={`text-xs mt-1 ${printerMode ? 'text-black' : 'text-slate-300'}`}>
                            {spell.description}
                          </div>
                        </div>
                        {localChar.spells.includes(spell.name) ? (
                          <button
                            onClick={() => removeSpellFromCharacter(spell.name)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs ml-2"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => addSpellToCharacter(spell.name)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs ml-2"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Known Spells Display */}
            <div className="space-y-2">
              {char.spells.length === 0 ? (
                <p className={`text-sm ${printerMode ? 'text-gray-600' : 'text-slate-400'} italic`}>
                  No spells prepared
                </p>
              ) : (
                char.spells.map(spellName => {
                  const spell = SPELL_COMPENDIUM.find(s => s.name === spellName);
                  if (!spell) return null;
                  
                  return (
                    <div key={spellName} className={`p-3 rounded ${printerMode ? 'border border-black' : 'bg-slate-700'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className={`font-semibold ${printerMode ? 'text-black' : 'text-purple-300'}`}>
                            {spell.name}
                            <span className={`ml-2 text-xs ${printerMode ? 'text-gray-600' : 'text-slate-400'}`}>
                              {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                            </span>
                          </div>
                          <div className={`text-xs ${printerMode ? 'text-gray-700' : 'text-slate-400'} mt-1`}>
                            {spell.school} • {spell.castingTime} • {spell.range}
                          </div>
                          <div className={`text-sm mt-2 ${printerMode ? 'text-black' : 'text-slate-300'}`}>
                            {spell.description}
                          </div>
                          <div className={`text-xs mt-1 ${printerMode ? 'text-gray-600' : 'text-slate-500'}`}>
                            Components: {spell.components} • Duration: {spell.duration}
                          </div>
                        </div>
                        {isEditing && !printerMode && (
                          <button
                            onClick={() => removeSpellFromCharacter(spellName)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded ml-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========== EQUIPMENT ========== */}
        <div className="mb-6">
          <h4 className={`font-bold mb-3 ${printerMode ? 'text-black' : 'text-amber-400'}`}>Equipment</h4>
          {isEditing ? (
            <textarea
              value={localChar.equipment.join('\n')}
              onChange={(e) => setLocalChar({ 
                ...localChar, 
                equipment: e.target.value.split('\n').filter(item => item.trim())
              })}
              placeholder="Enter equipment (one per line)"
              className={`w-full h-32 ${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 text-white border border-slate-600'} rounded p-2 text-sm`}
            />
          ) : (
            <div className={`${printerMode ? 'border border-black' : 'bg-slate-700'} rounded p-3`}>
              {char.equipment.length === 0 ? (
                <p className={`text-sm ${printerMode ? 'text-gray-600' : 'text-slate-400'} italic`}>
                  No equipment listed
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {char.equipment.map((item, idx) => (
                    <li key={idx} className={`text-sm ${printerMode ? 'text-black' : 'text-white'}`}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Attunement Slots */}
          {!printerMode && (
            <div className="mt-3">
              <div className="text-sm text-slate-400 mb-2">
                Attuned Items ({localChar.attunedItems.length}/3)
              </div>
              {isEditing ? (
                <div className="space-y-1">
                  {localChar.equipment.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={localChar.attunedItems.includes(item)}
                        onChange={() => toggleAttunement(item)}
                        className="form-checkbox"
                      />
                      <span className="text-white">{item}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  {localChar.attunedItems.map((item, idx) => (
                    <span key={idx} className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========== FEATURES & TRAITS ========== */}
        <div className="mb-6">
          <h4 className={`font-bold mb-3 ${printerMode ? 'text-black' : 'text-amber-400'}`}>
            Features & Traits
          </h4>
          {isEditing ? (
            <textarea
              value={localChar.features.join('\n')}
              onChange={(e) => setLocalChar({ 
                ...localChar, 
                features: e.target.value.split('\n').filter(f => f.trim())
              })}
              placeholder="Enter features & traits (one per line)"
              className={`w-full h-32 ${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 text-white border border-slate-600'} rounded p-2 text-sm`}
            />
          ) : (
            <div className={`${printerMode ? 'border border-black' : 'bg-slate-700'} rounded p-3`}>
              {char.features.length === 0 ? (
                <p className={`text-sm ${printerMode ? 'text-gray-600' : 'text-slate-400'} italic`}>
                  No features listed
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {char.features.map((feature, idx) => (
                    <li key={idx} className={`text-sm ${printerMode ? 'text-black' : 'text-white'}`}>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ========== PERSONALITY TRAITS ========== */}
        {!printerMode && (
          <div className="mb-6">
            <h4 className="font-bold mb-3 text-amber-400">Personality</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Personality Traits</label>
                {isEditing ? (
                  <textarea
                    value={localChar.personalityTraits || ""}
                    onChange={(e) => setLocalChar({ ...localChar, personalityTraits: e.target.value })}
                    placeholder="Kind, brave, curious..."
                    className="w-full h-16 bg-slate-900 text-white border border-slate-600 rounded p-2 text-sm"
                  />
                ) : (
                  <div className="bg-slate-700 rounded p-2 text-sm text-white min-h-[3rem]">
                    {char.personalityTraits || <span className="text-slate-400 italic">None listed</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Ideals</label>
                {isEditing ? (
                  <textarea
                    value={localChar.ideals || ""}
                    onChange={(e) => setLocalChar({ ...localChar, ideals: e.target.value })}
                    placeholder="Justice, freedom, power..."
                    className="w-full h-16 bg-slate-900 text-white border border-slate-600 rounded p-2 text-sm"
                  />
                ) : (
                  <div className="bg-slate-700 rounded p-2 text-sm text-white min-h-[3rem]">
                    {char.ideals || <span className="text-slate-400 italic">None listed</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Bonds</label>
                {isEditing ? (
                  <textarea
                    value={localChar.bonds || ""}
                    onChange={(e) => setLocalChar({ ...localChar, bonds: e.target.value })}
                    placeholder="Family, mentor, homeland..."
                    className="w-full h-16 bg-slate-900 text-white border border-slate-600 rounded p-2 text-sm"
                  />
                ) : (
                  <div className="bg-slate-700 rounded p-2 text-sm text-white min-h-[3rem]">
                    {char.bonds || <span className="text-slate-400 italic">None listed</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Flaws</label>
                {isEditing ? (
                  <textarea
                    value={localChar.flaws || ""}
                    onChange={(e) => setLocalChar({ ...localChar, flaws: e.target.value })}
                    placeholder="Reckless, greedy, arrogant..."
                    className="w-full h-16 bg-slate-900 text-white border border-slate-600 rounded p-2 text-sm"
                  />
                ) : (
                  <div className="bg-slate-700 rounded p-2 text-sm text-white min-h-[3rem]">
                    {char.flaws || <span className="text-slate-400 italic">None listed</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========== NOTES ========== */}
        <div className="mb-6">
          <h4 className={`font-bold mb-3 ${printerMode ? 'text-black' : 'text-amber-400'}`}>Notes</h4>
          {isEditing ? (
            <textarea
              value={localChar.notes}
              onChange={(e) => setLocalChar({ ...localChar, notes: e.target.value })}
              placeholder="Character notes, backstory, goals..."
              className={`w-full h-32 ${printerMode ? 'bg-white border border-black text-black' : 'bg-slate-900 text-white border border-slate-600'} rounded p-2 text-sm`}
            />
          ) : (
            <div className={`${printerMode ? 'border border-black' : 'bg-slate-700'} rounded p-3`}>
              {char.notes ? (
                <p className={`text-sm ${printerMode ? 'text-black' : 'text-white'} whitespace-pre-wrap`}>
                  {char.notes}
                </p>
              ) : (
                <p className={`text-sm ${printerMode ? 'text-gray-600' : 'text-slate-400'} italic`}>
                  No notes
                </p>
              )}
            </div>
          )}
        </div>

        {/* ========== XP & MILESTONES ========== */}
        {!printerMode && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-bold text-amber-400">Experience</h4>
              {isEditing && (
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={localChar.useMilestones}
                    onChange={(e) => setLocalChar({ ...localChar, useMilestones: e.target.checked })}
                    className="form-checkbox"
                  />
                  Use Milestone Leveling
                </label>
              )}
            </div>
            
            {!localChar.useMilestones && (
              <div className={`${printerMode ? 'border border-black' : 'bg-slate-700'} rounded p-3`}>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-300">XP:</label>
                    <input
                      type="number"
                      value={localChar.xp}
                      onChange={(e) => setLocalChar({ ...localChar, xp: parseInt(e.target.value) || 0 })}
                      className="bg-slate-900 text-white border border-slate-600 rounded px-2 py-1 w-24"
                    />
                  </div>
                ) : (
                  <div className="text-white">
                    <span className="text-2xl font-bold">{char.xp.toLocaleString()}</span>
                    <span className="text-sm text-slate-400 ml-2">XP</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========== LONG REST BUTTON ========== */}
        {!printerMode && !isEditing && (
          <button
            onClick={longRest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Long Rest
            <span className="text-xs opacity-75">(Restore HP & Spell Slots)</span>
          </button>
        )}
      </div>
    );
  };
  // ========== MAIN RENDER ==========
  return (
    <div className={`min-h-screen ${printerMode ? 'bg-white' : 'bg-gradient-to-br from-slate-900 to-slate-800'} pb-20`}>
      {/* ========== HEADER ========== */}
      <header className={`${printerMode ? 'bg-white border-b-2 border-black' : 'bg-slate-800 border-b border-amber-700'} p-4 sticky top-0 z-50 shadow-lg`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sword className={`w-8 h-8 ${printerMode ? 'text-black' : 'text-amber-500'}`} />
            <h1 className={`text-2xl font-bold ${printerMode ? 'text-black' : 'text-amber-500'}`}>
              D&D Companion
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {!printerMode && (
              <>
                <span className="text-slate-300 text-sm">
                  {user.email || 'Guest User'}
                </span>
                <button
                  onClick={() => setPrinterMode(true)}
                  className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded"
                  title="Printer-Friendly Mode"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
                >
                  Sign Out
                </button>
              </>
            )}
            {printerMode && (
              <button
                onClick={() => setPrinterMode(false)}
                className="bg-black text-white px-4 py-2 rounded font-semibold"
              >
                Exit Print Mode
              </button>
            )}
          </div>
        </div>

        {/* ========== NAVIGATION TABS ========== */}
        {!printerMode && (
          <div className="max-w-7xl mx-auto mt-4 flex gap-2 overflow-x-auto">
            {[
              { id: 'campaigns', label: 'Campaigns', icon: Map },
              { id: 'characters', label: 'Characters', icon: Users },
              { id: 'combat', label: 'Combat', icon: Swords },
              { id: 'dice', label: 'Dice Roller', icon: Dices },
              { id: 'compendium', label: 'Compendium', icon: Book },
              { id: 'notes', label: 'Notes', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-semibold whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-7xl mx-auto p-4">
        {/* ========== CAMPAIGNS TAB ========== */}
        {activeTab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-bold ${printerMode ? 'text-black' : 'text-white'}`}>
                Campaigns
              </h2>
              {!printerMode && (
                <button
                  onClick={() => {
                    const name = prompt("Campaign name:");
                    if (name) {
                      const description = prompt("Campaign description (optional):");
                      createCampaign(name, description || "");
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Campaign
                </button>
              )}
            </div>

            {campaigns.length === 0 ? (
              <div className={`text-center py-12 ${printerMode ? 'bg-gray-100 border border-black' : 'bg-slate-800'} rounded-lg`}>
                <Map className={`w-16 h-16 ${printerMode ? 'text-gray-400' : 'text-slate-600'} mx-auto mb-4`} />
                <p className={`${printerMode ? 'text-gray-700' : 'text-slate-400'} text-lg`}>
                  No campaigns yet. Create one to get started!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {campaigns.map(campaign => (
                  <div
                    key={campaign.id}
                    className={`${printerMode ? 'bg-white border-2 border-black' : 'bg-slate-800 border border-amber-700'} rounded-lg p-6 shadow-xl`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className={`text-2xl font-bold mb-2 ${printerMode ? 'text-black' : 'text-white'}`}>
                          {campaign.name}
                        </h3>
                        {campaign.description && (
                          <p className={`${printerMode ? 'text-gray-700' : 'text-slate-300'} mb-3`}>
                            {campaign.description}
                          </p>
                        )}
                        <p className={`text-sm ${printerMode ? 'text-gray-600' : 'text-slate-400'}`}>
                          Created: {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!printerMode && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCampaign(campaign.id === selectedCampaign ? null : campaign.id)}
                            className={`px-4 py-2 rounded font-semibold ${
                              selectedCampaign === campaign.id
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {selectedCampaign === campaign.id ? 'Selected' : 'Select'}
                          </button>
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Campaign Module Selection */}
                    {!printerMode && selectedCampaign === campaign.id && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <label className="text-sm text-slate-400 mb-2 block">Campaign Module:</label>
                        <select
                          value={campaign.module || "Random"}
                          onChange={(e) => {
                            updateCampaign(campaign.id, { module: e.target.value });
                            setSelectedModule(e.target.value);
                          }}
                          className="bg-slate-900 text-white border border-slate-600 rounded px-3 py-2 w-full"
                        >
                          {Object.keys(CAMPAIGN_MODULES).map(moduleName => (
                            <option key={moduleName} value={moduleName}>
                              {moduleName}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-2">
                          {CAMPAIGN_MODULES[campaign.module || "Random"].description}
                        </p>
                      </div>
                    )}

                    {/* Campaign Characters */}
                    <div className="mt-4">
                      <h4 className={`font-semibold mb-2 ${printerMode ? 'text-black' : 'text-amber-400'}`}>
                        Party Members ({campaign.characterIds?.length || 0})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {campaign.characterIds?.map(charId => {
                          const char = characters.find(c => c.id === charId);
                          return char ? (
                            <span
                              key={charId}
                              className={`${printerMode ? 'bg-gray-200 text-black border border-black' : 'bg-slate-700 text-white'} px-3 py-1 rounded text-sm`}
                            >
                              {char.name} ({char.class} {char.level})
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {/* Quick Encounter Builder from Module */}
                    {!printerMode && selectedCampaign === campaign.id && CAMPAIGN_MODULES[campaign.module || "Random"].encounters && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <h4 className="font-semibold mb-3 text-amber-400">
                          Module Encounters
                        </h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {CAMPAIGN_MODULES[campaign.module || "Random"].encounters.map((enc, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-900 rounded p-3 border border-slate-700"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-white">
                                    {enc.name}
                                    <span className="ml-2 text-xs text-amber-400">
                                      (Level {enc.level})
                                    </span>
                                  </h5>
                                  <p className="text-sm text-slate-400 mt-1">{enc.text}</p>
                                </div>
                                <button
                                  onClick={() => buildQuickEncounter(enc)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm ml-3"
                                >
                                  Start
                                </button>
                              </div>
                              <div className="text-xs text-slate-500 mt-2">
                                Monsters: {enc.monsters.join(', ')}
                              </div>
                              {enc.notes && (
                                <div className="text-xs text-slate-400 mt-1 italic">
                                  💡 {enc.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== CHARACTERS TAB ========== */}
        {activeTab === 'characters' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-bold ${printerMode ? 'text-black' : 'text-white'}`}>
                Characters
              </h2>
              {!printerMode && (
                <button
                  onClick={() => setShowCharacterForm(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Character
                </button>
              )}
            </div>

            {/* Character Creation Form */}
            {showCharacterForm && !printerMode && (
              <div className="bg-slate-800 border border-amber-700 rounded-lg p-6 shadow-xl mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">Create New Character</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Name</label>
                    <input
                      type="text"
                      value={newCharacter.name}
                      onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                      placeholder="Character name"
                      className="w-full bg-slate-900 text-white border border-slate-600 rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Race</label>
                    <select
                      value={newCharacter.race}
                      onChange={(e) => setNewCharacter({ ...newCharacter, race: e.target.value })}
                      className="w-full bg-slate-900 text-white border border-slate-600 rounded px-3 py-2"
                    >
                      {RACES.map(race => (
                        <option key={race} value={race}>{race}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Class</label>
                    <select
                      value={newCharacter.class}
                      onChange={(e) => setNewCharacter({ ...newCharacter, class: e.target.value })}
                      className="w-full bg-slate-900 text-white border border-slate-600 rounded px-3 py-2"
                    >
                      {CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Background</label>
                    <select
                      value={newCharacter.background}
                      onChange={(e) => setNewCharacter({ ...newCharacter, background: e.target.value })}
                      className="w-full bg-slate-900 text-white border border-slate-600 rounded px-3 py-2"
                    >
                      {BACKGROUNDS.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Alignment</label>
                    <select
                      value={newCharacter.alignment}
                      onChange={(e) => setNewCharacter({ ...newCharacter, alignment: e.target.value })}
                      className="w-full bg-slate-900 text-white border border-slate-600 rounded px-3 py-2"
                    >
                      {ALIGNMENTS.map(align => (
                        <option key={align} value={align}>{align}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Level</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={newCharacter.level}
                      onChange={(e) => setNewCharacter({ ...newCharacter, level: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-900 text-white border border-slate-600 rounded px-3 py-2"
                    />
                  </div>
                </div>

                {/* Point Buy Toggle */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowPointBuyHelper(!showPointBuyHelper)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                  >
                    {showPointBuyHelper ? 'Hide' : 'Show'} Point Buy Helper
                  </button>
                </div>

                {/* Point Buy or Simple Stats */}
                {showPointBuyHelper ? (
                  <div className="bg-slate-900 border border-purple-500 rounded p-4 mb-4">
                    <h4 className="font-bold text-purple-400 mb-3">Point Buy (27 points)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                        <div key={stat}>
                          <label className="text-xs text-slate-400 uppercase mb-1 block">{stat}</label>
                          <input
                            type="number"
                            min="8"
                            max="15"
                            value={newCharacter.baseStats[stat]}
                            onChange={(e) => {
                              const value = Math.max(8, Math.min(15, parseInt(e.target.value) || 8));
                              const newBaseStats = { ...newCharacter.baseStats, [stat]: value };
                              const newStats = applyRacialBonuses(newBaseStats, newCharacter.race);
                              setNewCharacter({ 
                                ...newCharacter, 
                                baseStats: newBaseStats,
                                stats: newStats
                              });
                            }}
                            className="w-full bg-slate-800 text-white border border-slate-600 rounded px-2 py-1 text-center"
                          />
                          <div className="text-xs text-green-400 text-center mt-1">
                            Final: {newCharacter.stats[stat]}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-sm">
                      <span className={calculatePointsSpent(newCharacter.baseStats) <= 27 ? 'text-green-400' : 'text-red-400'}>
                        Points: {calculatePointsSpent(newCharacter.baseStats)} / 27
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                      <div key={stat}>
                        <label className="text-xs text-slate-400 uppercase mb-1 block">{stat}</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={newCharacter.stats[stat]}
                          onChange={(e) => setNewCharacter({ 
                            ...newCharacter, 
                            stats: { ...newCharacter.stats, [stat]: parseInt(e.target.value) || 10 }
                          })}
                          className="w-full bg-slate-900 text-white border border-slate-600 rounded px-2 py-1"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={addCharacter}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Create Character
                  </button>
                  <button
                    onClick={() => {
                      setShowCharacterForm(false);
                      setShowPointBuyHelper(false);
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Character List */}
            {characters.length === 0 ? (
              <div className={`text-center py-12 ${printerMode ? 'bg-gray-100 border border-black' : 'bg-slate-800'} rounded-lg`}>
                <Users className={`w-16 h-16 ${printerMode ? 'text-gray-400' : 'text-slate-600'} mx-auto mb-4`} />
                <p className={`${printerMode ? 'text-gray-700' : 'text-slate-400'} text-lg`}>
                  No characters yet. Create one to begin your adventure!
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {characters.map(char => (
                  <CharacterCard key={char.id} char={char} />
                ))}
              </div>
            )}
          </div>
        )}
        {/* ========== COMBAT TAB ========== */}
        {activeTab === 'combat' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-bold ${printerMode ? 'text-black' : 'text-white'}`}>
                Combat Tracker
              </h2>
              {!printerMode && (
                <button
                  onClick={() => {
                    const name = prompt("Encounter name:");
                    if (name) createEncounter(name, []);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Encounter
                </button>
              )}
            </div>

            {/* Active Encounter */}
            {activeEncounter && !printerMode && (
              <div className="bg-slate-800 border-2 border-red-600 rounded-lg p-6 shadow-xl mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{activeEncounter.name}</h3>
                    <p className="text-slate-400">
                      Round {activeEncounter.round} • 
                      {activeEncounter.participants[activeEncounter.currentTurn]?.name}'s Turn
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={nextTurn}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                    >
                      Next Turn
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={endEncounter}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      End Combat
                    </button>
                  </div>
                </div>

                {/* Initiative Order */}
                <div className="space-y-2 mb-6">
                  {activeEncounter.participants.map((participant, idx) => (
                    <div
                      key={participant.id}
                      className={`p-4 rounded ${
                        idx === activeEncounter.currentTurn
                          ? 'bg-amber-600 border-2 border-amber-400'
                          : participant.isPlayer
                          ? 'bg-blue-900 border border-blue-700'
                          : 'bg-red-900 border border-red-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-white">
                              {participant.initiative}
                            </span>
                            <div>
                              <h4 className="font-bold text-white text-lg">
                                {participant.name}
                                {participant.isPlayer && (
                                  <span className="ml-2 text-xs text-blue-300">
                                    ({participant.class} {participant.level})
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm text-slate-300">
                                AC {participant.ac} • HP: {participant.currentHp}/{participant.maxHp}
                              </p>
                              {participant.conditions && participant.conditions.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {participant.conditions.map((condition, cidx) => (
                                    <span
                                      key={cidx}
                                      className="bg-yellow-600 text-white px-2 py-0.5 rounded text-xs"
                                    >
                                      {condition}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const dmg = prompt("Damage amount:");
                              if (dmg) damageParticipant(participant.id, parseInt(dmg));
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Damage
                          </button>
                          <button
                            onClick={() => {
                              const heal = prompt("Healing amount:");
                              if (heal) healParticipant(participant.id, parseInt(heal));
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Heal
                          </button>
                          <button
                            onClick={() => {
                              const condition = prompt("Add condition (e.g., Poisoned, Stunned):");
                              if (condition) addCondition(participant.id, condition);
                            }}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                          >
                            +Condition
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Combat Log */}
                <div className="bg-slate-900 rounded p-4 max-h-64 overflow-y-auto">
                  <h4 className="font-bold text-amber-400 mb-2">Combat Log</h4>
                  <div className="space-y-1">
                    {activeEncounter.log.slice().reverse().map((entry, idx) => (
                      <p key={idx} className="text-sm text-slate-300">
                        {entry}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Saved Encounters */}
            <div>
              <h3 className={`text-xl font-bold mb-4 ${printerMode ? 'text-black' : 'text-white'}`}>
                Saved Encounters
              </h3>
              {encounters.length === 0 ? (
                <div className={`text-center py-12 ${printerMode ? 'bg-gray-100 border border-black' : 'bg-slate-800'} rounded-lg`}>
                  <Swords className={`w-16 h-16 ${printerMode ? 'text-gray-400' : 'text-slate-600'} mx-auto mb-4`} />
                  <p className={`${printerMode ? 'text-gray-700' : 'text-slate-400'} text-lg`}>
                    No encounters saved yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {encounters.map(enc => (
                    <div
                      key={enc.id}
                      className={`${printerMode ? 'bg-white border-2 border-black' : 'bg-slate-800 border border-amber-700'} rounded-lg p-4`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className={`font-bold text-lg ${printerMode ? 'text-black' : 'text-white'}`}>
                            {enc.name}
                          </h4>
                          <p className={`text-sm ${printerMode ? 'text-gray-600' : 'text-slate-400'}`}>
                            {enc.participants.length} participants
                          </p>
                        </div>
                        {!printerMode && (
                          <div className="flex gap-2">
                            {!enc.isActive && (
                              <button
                                onClick={() => startEncounter(enc)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Start
                              </button>
                            )}
                            <button
                              onClick={() => deleteEncounter(enc.id)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {enc.participants.map(p => (
                          <span
                            key={p.id}
                            className={`${
                              p.isPlayer
                                ? (printerMode ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-blue-900 text-blue-300')
                                : (printerMode ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-red-900 text-red-300')
                            } px-2 py-1 rounded text-xs`}
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== DICE ROLLER TAB ========== */}
        {activeTab === 'dice' && (
          <div>
            <h2 className={`text-3xl font-bold mb-6 ${printerMode ? 'text-black' : 'text-white'}`}>
              Dice Roller
            </h2>

            {/* Quick Dice Buttons */}
            {!printerMode && (
              <div className="bg-slate-800 border border-amber-700 rounded-lg p-6 shadow-xl mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Quick Rolls</h3>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <DiceButton notation="1d4" label="d4" size="large" />
                  <DiceButton notation="1d6" label="d6" size="large" />
                  <DiceButton notation="1d8" label="d8" size="large" />
                  <DiceButton notation="1d10" label="d10" size="large" />
                  <DiceButton notation="1d12" label="d12" size="large" />
                  <DiceButton notation="1d20" label="d20" size="large" />
                  <DiceButton notation="1d100" label="d100" size="large" />
                  <DiceButton notation="2d6" label="2d6" size="large" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <DiceButton notation="2d20" label="Advantage (2d20)" />
                  <DiceButton notation="3d6" label="3d6" />
                  <DiceButton notation="4d6" label="4d6" />
                  <DiceButton notation="8d6" label="8d6 (Fireball)" />
                  <DiceButton notation="1d20+5" label="d20+5" />
                  <DiceButton notation="2d8+3" label="2d8+3" />
                </div>

                {/* Custom Roll */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-bold text-amber-400 mb-2">Custom Roll</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., 2d20+5"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          rollDice(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 bg-slate-900 text-white border border-slate-600 rounded px-3 py-2"
                    />
                    <button
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        if (input.value) {
                          rollDice(input.value);
                          input.value = '';
                        }
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded"
                    >
                      Roll
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Results */}
            {!printerMode && diceResults.length > 0 && (
              <div className="bg-slate-800 border border-amber-700 rounded-lg p-6 shadow-xl mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Recent Results</h3>
                <div className="space-y-3">
                  {diceResults.map((result, idx) => (
                    <div key={idx} className="bg-slate-900 rounded p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-sm">{result.label || result.notation}</span>
                        <span className={`text-3xl font-bold ${
                          result.isCrit ? 'text-green-400' : result.isFail ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {result.total}
                          {result.isCrit && ' ✨'}
                          {result.isFail && ' 💀'}
                        </span>
                      </div>
                      <div className="flex gap-2 text-sm text-slate-300">
                        <span>Rolls: [{result.rolls.join(', ')}]</span>
                        {result.modifier !== 0 && (
                          <span>
                            Modifier: {result.modifier >= 0 ? '+' : ''}{result.modifier}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dice History */}
            {!printerMode && diceHistory.length > 0 && (
              <div className="bg-slate-800 border border-amber-700 rounded-lg p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">Roll History</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {diceHistory.map((result, idx) => (
                    <div key={idx} className="bg-slate-900 rounded p-2 flex justify-between items-center">
                      <span className="text-sm text-slate-400">
                        {result.label || result.notation}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          [{result.rolls.join(', ')}]
                        </span>
                        <span className="font-bold text-amber-400">
                          {result.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== COMPENDIUM TAB ========== */}
        {activeTab === 'compendium' && (
          <div>
            <h2 className={`text-3xl font-bold mb-6 ${printerMode ? 'text-black' : 'text-white'}`}>
              Compendium
            </h2>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setShowMonsterManual(!showMonsterManual)}
                className={`px-4 py-2 rounded font-semibold ${
                  showMonsterManual
                    ? 'bg-amber-600 text-white'
                    : (printerMode ? 'bg-gray-200 text-black border border-black' : 'bg-slate-700 text-slate-300')
                }`}
              >
                Monster Manual
              </button>
              <button
                onClick={() => setShowSpellCompendium(!showSpellCompendium)}
                className={`px-4 py-2 rounded font-semibold ${
                  showSpellCompendium
                    ? 'bg-amber-600 text-white'
                    : (printerMode ? 'bg-gray-200 text-black border border-black' : 'bg-slate-700 text-slate-300')
                }`}
              >
                Spell Compendium
              </button>
            </div>

            {/* Monster Manual */}
            {showMonsterManual && (
              <div className={`${printerMode ? 'bg-white border-2 border-black' : 'bg-slate-800 border border-amber-700'} rounded-lg p-6 shadow-xl mb-6`}>
                <h3 className={`text-2xl font-bold mb-4 ${printerMode ? 'text-black' : 'text-white'}`}>
                  Monster Manual ({MONSTER_MANUAL.length} creatures)
                </h3>
                
                {!printerMode && (
                  <input
                    type="text"
                    placeholder="Search monsters..."
                    value={monsterFilter}
                    onChange={(e) => setMonsterFilter(e.target.value)}
                    className="w-full bg-slate-900 text-white border border-slate-600 rounded px-3 py-2 mb-4"
                  />
                )}

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {MONSTER_MANUAL
                    .filter(monster => 
                      monster.name.toLowerCase().includes(monsterFilter.toLowerCase()) ||
                      monster.type.toLowerCase().includes(monsterFilter.toLowerCase())
                    )
                    .map((monster, idx) => (
                      <div key={idx} className={`${printerMode ? 'border border-black' : 'bg-slate-900'} rounded p-4`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className={`font-bold text-lg ${printerMode ? 'text-black' : 'text-amber-400'}`}>
                              {monster.name}
                            </h4>
                            <p className={`text-sm ${printerMode ? 'text-gray-600' : 'text-slate-400'}`}>
                              {monster.type} • CR {monster.cr} ({monster.xp} XP)
                            </p>
                          </div>
                        </div>
                        <div className={`grid grid-cols-3 gap-2 mb-2 text-sm ${printerMode ? 'text-black' : 'text-white'}`}>
                          <div>HP: {monster.hp}</div>
                          <div>AC: {monster.ac}</div>
                          <div>Equipment: {monster.equipment}</div>
                        </div>
                        <div className={`text-xs ${printerMode ? 'text-gray-700' : 'text-slate-400'} mb-2`}>
                          {monster.stats}
                        </div>
                        <div className={`text-sm ${printerMode ? 'text-black' : 'text-slate-300'}`}>
                          <span className="font-semibold">Actions:</span> {monster.actions}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Spell Compendium */}
            {showSpellCompendium && (
              <div className={`${printerMode ? 'bg-white border-2 border-black' : 'bg-slate-800 border border-amber-700'} rounded-lg p-6 shadow-xl`}>
                <h3 className={`text-2xl font-bold mb-4 ${printerMode ? 'text-black' : 'text-white'}`}>
                  Spell Compendium ({SPELL_COMPENDIUM.length} spells)
                </h3>
                
                {!printerMode && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <input
                      type="text"
                      placeholder="Search spells..."
                      value={spellFilter}
                      onChange={(e) => setSpellFilter(e.target.value)}
                      className="bg-slate-900 text-white border border-slate-600 rounded px-3 py-2"
                    />
                    <select
                      value={spellLevelFilter}
                      onChange={(e) => setSpellLevelFilter(e.target.value)}
                      className="bg-slate-900 text-white border border-slate-600 rounded px-3 py-2"
                    >
                      <option value="all">All Levels</option>
                      <option value="0">Cantrips</option>
                      {[1,2,3,4,5,6,7,8,9].map(lvl => (
                        <option key={lvl} value={lvl}>Level {lvl}</option>
                      ))}
                    </select>
                    <select
                      value={spellClassFilter}
                      onChange={(e) => setSpellClassFilter(e.target.value)}
                      className="bg-slate-900 text-white border border-slate-600 rounded px-3 py-2"
                    >
                      <option value="all">All Classes</option>
                      {CLASSES.filter(c => isSpellcaster(c)).map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {SPELL_COMPENDIUM
                    .filter(spell => 
                      spell.name.toLowerCase().includes(spellFilter.toLowerCase()) ||
                      spell.description.toLowerCase().includes(spellFilter.toLowerCase())
                    )
                    .filter(spell => spellLevelFilter === 'all' || spell.level === parseInt(spellLevelFilter))
                    .filter(spell => spellClassFilter === 'all' || spell.classes.includes(spellClassFilter))
                    .map((spell, idx) => (
                      <div key={idx} className={`${printerMode ? 'border border-black' : 'bg-slate-900'} rounded p-4`}>
                        <h4 className={`font-bold ${printerMode ? 'text-black' : 'text-purple-400'} mb-1`}>
                          {spell.name}
                          <span className={`ml-2 text-sm ${printerMode ? 'text-gray-600' : 'text-slate-400'}`}>
                            {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                          </span>
                        </h4>
                        <p className={`text-xs ${printerMode ? 'text-gray-600' : 'text-slate-400'} mb-2`}>
                          {spell.school} • {spell.castingTime} • Range: {spell.range}
                        </p>
                        <p className={`text-sm ${printerMode ? 'text-black' : 'text-slate-300'} mb-2`}>
                          {spell.description}
                        </p>
                        <div className={`text-xs ${printerMode ? 'text-gray-600' : 'text-slate-500'}`}>
                          Components: {spell.components} • Duration: {spell.duration}
                        </div>
                        <div className={`text-xs ${printerMode ? 'text-gray-600' : 'text-slate-500'} mt-1`}>
                          Classes: {spell.classes.join(', ')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* ========== NOTES TAB ========== */}
        {activeTab === 'notes' && (
          <div>
            <h2 className={`text-3xl font-bold mb-6 ${printerMode ? 'text-black' : 'text-white'}`}>
              Campaign Notes
            </h2>

            {/* Note Editor */}
            {!printerMode && (
              <div className="bg-slate-800 border border-amber-700 rounded-lg p-6 shadow-xl mb-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  {editingNoteId ? 'Edit Note' : 'New Note'}
                </h3>
                
                <input
                  type="text"
                  placeholder="Note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-slate-900 text-white border border-slate-600 rounded px-3 py-2 mb-3"
                />

                <textarea
                  placeholder="Write your notes here... Track NPCs, plot hooks, quest details, session summaries..."
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  className="w-full h-64 bg-slate-900 text-white border border-slate-600 rounded px-3 py-2 mb-3 resize-y"
                />

                <div className="flex gap-2">
                  <button
                    onClick={saveNote}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingNoteId ? 'Update Note' : 'Save Note'}
                  </button>
                  {editingNoteId && (
                    <button
                      onClick={() => {
                        setNoteTitle("");
                        setCurrentNote("");
                        setEditingNoteId(null);
                      }}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Saved Notes */}
            <div>
              <h3 className={`text-xl font-bold mb-4 ${printerMode ? 'text-black' : 'text-white'}`}>
                Saved Notes ({notes.length})
              </h3>
              
              {notes.length === 0 ? (
                <div className={`text-center py-12 ${printerMode ? 'bg-gray-100 border border-black' : 'bg-slate-800'} rounded-lg`}>
                  <FileText className={`w-16 h-16 ${printerMode ? 'text-gray-400' : 'text-slate-600'} mx-auto mb-4`} />
                  <p className={`${printerMode ? 'text-gray-700' : 'text-slate-400'} text-lg`}>
                    No notes yet. Start writing to track your campaign!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {notes.map(note => (
                    <div
                      key={note.id}
                      className={`${printerMode ? 'bg-white border-2 border-black' : 'bg-slate-800 border border-amber-700'} rounded-lg p-6 shadow-xl`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className={`font-bold text-xl mb-2 ${printerMode ? 'text-black' : 'text-white'}`}>
                            {note.title}
                          </h4>
                          <p className={`text-xs ${printerMode ? 'text-gray-600' : 'text-slate-400'} mb-3`}>
                            Created: {new Date(note.createdAt).toLocaleString()}
                            {note.updatedAt !== note.createdAt && (
                              <span className="ml-2">
                                • Updated: {new Date(note.updatedAt).toLocaleString()}
                              </span>
                            )}
                          </p>
                        </div>
                        {!printerMode && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => editNote(note)}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className={`${printerMode ? 'text-black' : 'text-slate-300'} whitespace-pre-wrap`}>
                        {note.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========== PRINT MODE FOOTER ========== */}
      {printerMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black p-4 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-6 py-3 rounded font-bold mr-3"
          >
            Print / Save as PDF
          </button>
          <button
            onClick={() => setPrinterMode(false)}
            className="bg-gray-600 text-white px-6 py-3 rounded font-bold"
          >
            Exit Print Mode
          </button>
        </div>
      )}
    </div>
  );
}

// ========== EXPORT ==========
export default App;