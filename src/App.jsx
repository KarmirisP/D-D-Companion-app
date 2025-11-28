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
  Zap as Lightning, PlayCircle, PauseCircle, SkipForward, Gift
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

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
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

// --- Constants & Data ---
const RACES = ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Gnome", "Half-Elf", "Half-Orc", "Tiefling", "Aarakocra", "Genasi", "Goliath", "Tabaxi", "Custom"];
const CLASSES = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard", "Artificer", "Custom"];
const CONDITIONS = ["Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious"];
const SPELL_TAGS = ["All", "Damage", "Heal", "Control", "Buff", "Utility"];
const CASTER_CLASSES = ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard", "Artificer"];

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
  "Barbarian": { hp: 12, saves: ["str", "con"], skills: ["Athletics", "Intimidation"], gear: ["Greataxe", "Explorers Pack"], armor: "Unarmored" },
  "Bard": { hp: 8, saves: ["dex", "cha"], skills: ["Performance", "Persuasion", "Deception"], gear: ["Rapier", "Lute"], armor: "Leather", spells: ["Vicious Mockery", "Healing Word"] },
  "Cleric": { hp: 8, saves: ["wis", "cha"], skills: ["Religion", "Insight"], gear: ["Mace", "Shield", "Holy Symbol"], armor: "Scale Mail", spells: ["Sacred Flame", "Cure Wounds"] },
  "Druid": { hp: 8, saves: ["int", "wis"], skills: ["Nature", "Survival"], gear: ["Scimitar", "Wooden Shield"], armor: "Leather", spells: ["Druidcraft", "Entangle"] },
  "Fighter": { hp: 10, saves: ["str", "con"], skills: ["Athletics", "Survival"], gear: ["Greatsword", "Crossbow"], armor: "Chain Mail" },
  "Monk": { hp: 8, saves: ["str", "dex"], skills: ["Acrobatics", "Stealth"], gear: ["Shortsword", "Darts"], armor: "Unarmored" },
  "Paladin": { hp: 10, saves: ["wis", "cha"], skills: ["Athletics", "Religion"], gear: ["Longsword", "Shield"], armor: "Chain Mail" },
  "Ranger": { hp: 10, saves: ["str", "dex"], skills: ["Survival", "Stealth", "Perception"], gear: ["Longbow", "Shortswords"], armor: "Scale Mail" },
  "Rogue": { hp: 8, saves: ["dex", "int"], skills: ["Stealth", "Sleight of Hand", "Acrobatics", "Deception"], gear: ["Shortsword", "Dagger", "Thieves Tools"], armor: "Leather" },
  "Sorcerer": { hp: 6, saves: ["con", "cha"], skills: ["Arcana", "Persuasion"], gear: ["Dagger", "Arcane Focus"], armor: "None", spells: ["Firebolt", "Shield"] },
  "Warlock": { hp: 8, saves: ["wis", "cha"], skills: ["Arcana", "Intimidation"], gear: ["Dagger", "Arcane Focus"], armor: "Leather", spells: ["Eldritch Blast", "Hex"] },
  "Wizard": { hp: 6, saves: ["int", "wis"], skills: ["Arcana", "History"], gear: ["Quarterstaff", "Spellbook"], armor: "None", spells: ["Firebolt", "Magic Missile"] },
  "Artificer": { hp: 8, saves: ["con", "int"], skills: ["Investigation", "Arcana"], gear: ["Hammer", "Scale Mail"], armor: "Scale Mail" }
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

const MONSTER_BUCKETS = {
  Humanoid: MONSTER_MANUAL.filter(m => m.type === "Humanoid"),
  Undead: MONSTER_MANUAL.filter(m => m.type === "Undead"),
  Beast: MONSTER_MANUAL.filter(m => m.type === "Beast"),
  Monstrosity: MONSTER_MANUAL.filter(m => m.type === "Monstrosity"),
  Dragon: MONSTER_MANUAL.filter(m => m.type === "Dragon"),
  City: MONSTER_MANUAL.filter(m => ["Humanoid", "Aberration"].includes(m.type) || ["Mimic"].includes(m.name)),
  Wilderness: MONSTER_MANUAL.filter(m => ["Beast", "Monstrosity", "Dragon", "Giant", "Humanoid"].includes(m.type)),
  Dungeon: MONSTER_MANUAL.filter(m => ["Undead", "Ooze", "Monstrosity", "Aberration", "Humanoid"].includes(m.type)),
  Crypt: MONSTER_MANUAL.filter(m => ["Undead"].includes(m.type)),
};

const BIOME_PRESETS = {
  Any: MONSTER_MANUAL.map(m => m.name),
  City: (MONSTER_BUCKETS.City || []).map(m => m.name),
  Wilderness: (MONSTER_BUCKETS.Wilderness || []).map(m => m.name),
  Dungeon: (MONSTER_BUCKETS.Dungeon || []).map(m => m.name),
  Crypt: (MONSTER_BUCKETS.Crypt || []).map(m => m.name),
};

const SPELL_COMPENDIUM = [
  { name: "Fireball", level: 3, school: "Evocation", time: "1 Action", range: "150ft", components: "V, S, M", duration: "Instant", classes: ["Sorcerer", "Wizard"], tags: ["damage", "control"], desc: "8d6 fire damage in 20ft radius (DEX save half)." },
  { name: "Cure Wounds", level: 1, school: "Evocation", time: "1 Action", range: "Touch", components: "V, S", duration: "Instant", classes: ["Bard", "Cleric", "Druid", "Paladin", "Ranger"], tags: ["heal"], desc: "Heal 1d8 + Mod." },
  { name: "Healing Word", level: 1, school: "Evocation", time: "1 Bonus Action", range: "60ft", components: "V", duration: "Instant", classes: ["Bard", "Cleric", "Druid"], tags: ["heal"], desc: "Heal 1d4 + Mod at range." },
  { name: "Magic Missile", level: 1, school: "Evocation", time: "1 Action", range: "120ft", components: "V, S", duration: "Instant", classes: ["Sorcerer", "Wizard"], tags: ["damage"], desc: "3 darts, 1d4+1 force each. Auto-hit." },
  { name: "Shield", level: 1, school: "Abjuration", time: "Reaction", range: "Self", components: "V, S", duration: "1 Round", classes: ["Sorcerer", "Wizard"], tags: ["buff"], desc: "+5 AC until next turn. Blocks Magic Missile." },
  { name: "Mage Hand", level: 0, school: "Conjuration", time: "1 Action", range: "30ft", components: "V, S", duration: "1 Minute", classes: ["Bard", "Sorcerer", "Warlock", "Wizard"], tags: ["utility"], desc: "Spectral hand manipulates objects." },
  { name: "Eldritch Blast", level: 0, school: "Evocation", time: "1 Action", range: "120ft", components: "V, S", duration: "Instant", classes: ["Warlock"], tags: ["damage"], desc: "1d10 force damage beam." },
  { name: "Haste", level: 3, school: "Transmutation", time: "1 Action", range: "30ft", components: "V, S, M", duration: "Conc, 1 min", classes: ["Sorcerer", "Wizard", "Artificer"], tags: ["buff"], desc: "Double speed, +2 AC, extra action." },
  { name: "Counterspell", level: 3, school: "Abjuration", time: "Reaction", range: "60ft", components: "S", duration: "Instant", classes: ["Sorcerer", "Warlock", "Wizard"], tags: ["control", "utility"], desc: "Interrupt spellcasting." },
  { name: "Revivify", level: 3, school: "Necromancy", time: "1 Action", range: "Touch", components: "V, S, M", duration: "Instant", classes: ["Cleric", "Paladin", "Ranger"], tags: ["heal"], desc: "Revive dead creature (1 min limit). 300gp diamond." },
  { name: "Fly", level: 3, school: "Transmutation", time: "1 Action", range: "Touch", components: "V, S, M", duration: "Conc, 10 min", classes: ["Sorcerer", "Warlock", "Wizard", "Artificer"], tags: ["utility", "buff"], desc: "Target gains 60ft fly speed." },
  { name: "Bless", level: 1, school: "Enchantment", time: "1 Action", range: "30ft", components: "V, S, M", duration: "Conc, 1 min", classes: ["Cleric", "Paladin"], tags: ["buff"], desc: "+1d4 to attacks and saves for 3 targets." },
  { name: "Guiding Bolt", level: 1, school: "Evocation", time: "1 Action", range: "120ft", components: "V, S", duration: "1 Round", classes: ["Cleric"], tags: ["damage", "buff"], desc: "4d6 radiant. Next attack on target has advantage." },
  { name: "Spiritual Weapon", level: 2, school: "Evocation", time: "1 Bonus Action", range: "60ft", components: "V, S", duration: "1 min", classes: ["Cleric"], tags: ["damage"], desc: "Floating weapon attacks as bonus action (1d8 + mod)." },
  { name: "Entangle", level: 1, school: "Conjuration", time: "1 Action", range: "90ft", components: "V, S", duration: "Conc, 1 min", classes: ["Druid"], tags: ["control"], desc: "Restrain creatures in 20ft square (STR save)." },
  { name: "Faerie Fire", level: 1, school: "Evocation", time: "1 Action", range: "60ft", components: "V", duration: "Conc, 1 min", classes: ["Bard", "Druid", "Artificer"], tags: ["buff", "utility"], desc: "Outlines enemies (Advantage to hit, no invisibility)." },
  { name: "Goodberry", level: 1, school: "Transmutation", time: "1 Action", range: "Touch", components: "V, S, M", duration: "24 hr", classes: ["Druid", "Ranger"], tags: ["heal", "utility"], desc: "10 berries, 1 HP each. Nourishes for a day." },
  { name: "Sleep", level: 1, school: "Enchantment", time: "1 Action", range: "90ft", components: "V, S, M", duration: "1 min", classes: ["Bard", "Sorcerer", "Wizard"], tags: ["control"], desc: "5d8 HP of creatures fall asleep (no save)." },
  { name: "Magic Weapon", level: 2, school: "Transmutation", time: "1 Bonus Action", range: "Touch", components: "V, S", duration: "Conc, 1 hr", classes: ["Paladin", "Wizard", "Artificer"], tags: ["buff"], desc: "Weapon becomes magical, +1 to hit/damage." },
  { name: "Firebolt", level: 0, school: "Evocation", time: "1 Action", range: "120ft", components: "V, S", duration: "Instant", classes: ["Sorcerer", "Wizard", "Artificer"], tags: ["damage"], desc: "1d10 fire damage. Cantrip." },
];

const CONDITION_DESCRIPTIONS = [
  { title: "Blinded", text: "Auto-fail sight checks. Attackers have advantage. Your attacks have disadvantage." },
  { title: "Charmed", text: "Can't attack charmer. Charmer has social advantage." },
  { title: "Deafened", text: "Auto-fail hearing checks." },
  { title: "Frightened", text: "Disadv. on checks/attacks while source seen. Can't move closer." },
  { title: "Grappled", text: "Speed 0." },
  { title: "Incapacitated", text: "No actions or reactions." },
  { title: "Invisible", text: "Heavily obscured. Attackers disadv. You have advantage." },
  { title: "Paralyzed", text: "Incapacitated. Auto-fail STR/DEX saves. Attackers adv & auto-crit within 5ft." },
  { title: "Poisoned", text: "Disadvantage on attack rolls and ability checks." },
  { title: "Prone", text: "Crawl. Disadv. on your attacks. Attackers adv (melee) or disadv (ranged)." },
  { title: "Restrained", text: "Speed 0. Attackers adv. You disadv. Disadv on DEX saves." },
  { title: "Stunned", text: "Incapacitated. Auto-fail STR/DEX saves. Attackers adv." },
  { title: "Unconscious", text: "Incapacitated. Drop items. Prone. Auto-fail saves. Attackers adv & auto-crit." },
];

const RULES_SRD = {
  basics: [
    { title: "Turn Order", text: "Combat is divided into rounds. Each creature takes a turn in initiative order." },
    { title: "On Your Turn", text: "Move + Action + Bonus Action (if available). Reaction once per round." },
    { title: "Advantage/Disadv.", text: "Roll 2d20. Take higher (Adv) or lower (Dis)." },
    { title: "Ability Checks", text: "Roll d20 + ability mod + proficiency (if trained). DM sets DC (10 easy, 15 med, 20 hard)." },
    { title: "Advantage Sources", text: "Flanking, hiding, guiding bolt, faerie fire, help action, inspiration." },
    { title: "Opportunity Attacks", text: "Reaction when enemy leaves your reach. One melee attack." },
    { title: "Cover", text: "Half (+2 AC), Three-Quarters (+5 AC), Total (Can't be targeted)." },
    { title: "Death Saves", text: "Start turn at 0 HP: Roll d20. 10+ success, <10 fail. 3 of either sets fate. Nat 20 = 1 HP." },
  ],
  conditions: CONDITION_DESCRIPTIONS,
  saves: [
    { title: "STR Save", text: "Resist push/prone/crush." },
    { title: "DEX Save", text: "Dodge fireball/traps." },
    { title: "CON Save", text: "Resist poison/cold. Concentration." },
    { title: "INT Save", text: "Resist psychic/illusions." },
    { title: "WIS Save", text: "Resist charm/fear." },
    { title: "CHA Save", text: "Resist banishment/possession." },
  ],
  magic: [
    { title: "Spell DC", text: "8 + Prof + Mod" },
    { title: "Spell Attack", text: "d20 + Prof + Mod" },
    { title: "Concentration", text: "Take dmg? CON save DC 10 or half dmg." },
  ]
};

const XP_THRESHOLDS = {
  1: [25, 50, 75, 100], 2: [50, 100, 150, 200], 3: [75, 150, 225, 400], 4: [125, 250, 375, 500],
  5: [250, 500, 750, 1100], 6: [300, 600, 900, 1400], 7: [350, 750, 1100, 1700], 8: [450, 900, 1400, 2100],
  9: [550, 1100, 1600, 2400], 10: [600, 1200, 1900, 2800], 11: [800, 1600, 2400, 3600],
  12: [1000, 2000, 3000, 4500], 13: [1100, 2200, 3400, 5100], 14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400], 16: [1600, 3200, 4800, 7200], 17: [2000, 3900, 5900, 8800],
  18: [2100, 4200, 6300, 9500], 19: [2400, 4900, 7300, 10900], 20: [2800, 5700, 8500, 12700],
};

const LEVEL_XP = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000,
  265000, 305000, 355000
];

const LOOT_TABLES = {
  minor: ["10gp", "Healing Potion", "Rope (50ft)", "Torch x5", "Rations (3 days)", "Adventurer's Pack"],
  moderate: ["50gp", "+1 Arrow x10", "Potion of Climbing", "Scroll of Cure Wounds", "Silver Dagger", "Pearl (100gp)"],
  major: ["250gp", "Bag of Holding", "Cloak of Protection", "Wand of Magic Missiles", "Ring of Protection", "Potion of Greater Healing x2"],
  treasure: ["1000gp", "+1 Weapon", "Amulet of Health", "Boots of Speed", "Staff of Fire", "Gem (500gp)"]
};

const WEATHER_CONDITIONS = [
  { icon: Sun, name: "Clear", effect: "Perfect traveling weather" },
  { icon: Cloud, name: "Overcast", effect: "Dim light, -2 Perception" },
  { icon: Cloud, name: "Light Rain", effect: "Lightly obscured, disadvantage on Perception (hearing)" },
  { icon: Wind, name: "Heavy Rain", effect: "Heavily obscured beyond 30ft, disadvantage ranged attacks" },
  { icon: Snowflake, name: "Snow", effect: "Difficult terrain, disadvantage on Perception" },
  { icon: Wind, name: "Strong Wind", effect: "Disadvantage on ranged attacks, extinguish open flames" },
  { icon: Lightning, name: "Thunderstorm", effect: "Deafening, heavily obscured, frequent lightning" }
];

const NPC_NAMES = {
  male: ["Aldric", "Borin", "Cedric", "Dorian", "Eldon", "Finn", "Gareth", "Henrik", "Ivan", "Jorin"],
  female: ["Aria", "Brynn", "Celia", "Diana", "Elara", "Freya", "Gwen", "Helena", "Iris", "Jenna"],
  surnames: ["Ironfoot", "Stormwind", "Brightblade", "Darkwood", "Swiftarrow", "Stonehammer", "Goldleaf", "Silverstream", "Nightshade", "Dawnsinger"]
};

const NPC_TRAITS = [
  "Honest to a fault", "Constantly nervous", "Speaks in rhymes", "Obsessed with gold",
  "Extremely superstitious", "Has a pet rat", "Former soldier", "Secret noble",
  "Brewing conspiracy theories", "Collector of strange trinkets", "Always hungry",
  "Talks to themselves", "Missing an eye", "Covered in tattoos", "Never forgets a face"
];

// --- Components ---

const TraitBadge = ({ trait, onClick }) => (
  <div className="relative group inline-flex items-center px-2 py-1 border rounded text-xs mr-1 mb-1 cursor-help bg-slate-700 border-slate-600 text-slate-200"
       onClick={onClick}>
    <span className="font-bold">{trait.name}</span>
    {trait.desc && (
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 border border-slate-700 rounded p-2 text-xs w-64 z-50 shadow-xl">
        {trait.desc}
      </div>
    )}
  </div>
);

const ActiveMonsterCard = ({ monster, idx, onUpdateHP, onRoll, onRemove }) => {
  const [hp, setHp] = useState(monster.currentHp ?? monster.hp);
  const [conditions, setConditions] = useState([]);
  const [initiative, setInitiative] = useState(monster.initiative || 0);

  const changeHp = (amount) => {
    const newHp = Math.max(0, hp + amount);
    setHp(newHp);
    onUpdateHP(idx, newHp);
  };

  const toggleCondition = (cond) => {
    setConditions(prev => prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]);
  };

  const actionParts = monster.actions.split('.').filter(s => s.trim().length > 0);

  return (
    <div className={`p-3 rounded border mb-2 transition-all ${hp <= 0 ? 'bg-red-900/20 border-red-800 opacity-60' : 'bg-slate-800 border-slate-700'}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-white flex items-center gap-2">
          <span className="bg-slate-700 text-xs px-2 py-0.5 rounded">#{idx + 1}</span>
          <span>{monster.name}</span>
          <input
            type="number"
            value={initiative}
            onChange={(e) => setInitiative(parseInt(e.target.value) || 0)}
            className="w-12 bg-slate-900 border border-slate-600 rounded px-1 text-xs text-center"
            title="Initiative"
          />
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => changeHp(-1)} className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-500">-1</button>
          <button onClick={() => changeHp(-5)} className="bg-red-800 text-white text-xs px-2 py-1 rounded hover:bg-red-700">-5</button>
          <button onClick={() => changeHp(5)} className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-500">+5</button>
          <span className={`font-mono w-16 text-center ${hp < monster.hp / 2 ? 'text-red-400' : 'text-green-400'}`}>{hp}/{monster.hp}</span>
          {hp <= 0 && <button onClick={() => onRemove(idx)} className="bg-slate-700 text-white text-xs px-2 py-1 rounded hover:bg-slate-600">✓</button>}
        </div>
      </div>

      <div className="text-xs text-slate-400 mb-2">
        AC: <span className="text-white font-bold">{monster.ac}</span> | CR: {monster.cr} | {monster.equipment && <span>Gear: {monster.equipment}</span>}
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {CONDITIONS.slice(0, 8).map(c => (
          <button
            key={c}
            onClick={() => toggleCondition(c)}
            className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${conditions.includes(c) ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
          >
            {c.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {actionParts.map((act, i) => {
          const diceMatches = act.match(DICE_REGEX);
          return (
            <div key={i} className="text-xs text-slate-300 flex flex-wrap items-center gap-2 border-l-2 border-slate-600 pl-2 py-1">
              <span className="flex-1">{act}</span>
              {diceMatches && diceMatches.map((dmg, dIdx) => (
                <button
                  key={dIdx}
                  onClick={() => onRoll(monster.name, `Action [${idx + 1}]`, 0, dmg)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-0.5 rounded flex items-center transition-colors"
                >
                  <Dices size={10} className="mr-1" /> {dmg}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EncounterMonsterItem = ({ monster, printerMode }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`p-2 rounded border transition-colors cursor-pointer hover:bg-opacity-80 ${printerMode ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800'}`}
      onClick={() => setExpanded(!expanded)}>
      <div className="flex justify-between items-center">
        <div>
          <span className={`font-bold ${printerMode ? 'text-black' : 'text-amber-400'}`}>
            {monster.count > 1 ? `${monster.count}× ${monster.name}` : monster.name}
          </span>
          <span className="text-xs opacity-50 ml-2">{monster.type} • CR {monster.cr} • {monster.xp}xp each</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-sm font-mono ${printerMode ? 'text-black' : 'text-slate-300'}`}>
            HP: {monster.hp} | AC: {monster.ac}
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div className={`mt-3 pt-3 border-t text-xs leading-relaxed ${printerMode ? 'border-gray-300 text-gray-800' : 'border-slate-600 text-slate-300'}`}>
          <div className="mb-2">
            <span className="font-bold opacity-70">Stats:</span> {monster.stats}
          </div>
          <div className="mb-1">
            <span className="font-bold opacity-70">Equipment:</span> {monster.equipment || "None"}
          </div>
          <div>
            <span className="font-bold text-red-400">Actions:</span> {monster.actions}
          </div>
        </div>
      )}
    </div>
  );
};

const CharacterCard = ({ char, printerMode, updateCharacter, deleteCharacter, cloneCharacter, onFocusSpells, onRoll, onGenericRoll }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localChar, setLocalChar] = useState(char);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [newTrait, setNewTrait] = useState({ name: "", type: "race", desc: "" });

  if (!localChar.stats) localChar.stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

  useEffect(() => { if (!isEditing) setLocalChar(char); }, [char, isEditing]);

  const handleSave = () => { updateCharacter(char.id, localChar); setIsEditing(false); };
  const handleDelete = () => {
    if (confirmDelete) deleteCharacter(char.id);
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
  };

  const mod = (score) => Math.floor((score - 10) / 2);
  const fmtMod = (score) => { const m = mod(score); return m >= 0 ? `+${m}` : m; };
  const profBonus = Math.ceil(1 + (localChar.level / 4));

  const getSpellStats = () => {
    if (!CASTER_CLASSES.includes(localChar.class)) return null;
    const abilityMap = {
      Wizard: 'int', Artificer: 'int', Cleric: 'wis', Druid: 'wis', Ranger: 'wis',
      Bard: 'cha', Paladin: 'cha', Sorcerer: 'cha', Warlock: 'cha'
    };
    const ability = abilityMap[localChar.class];
    if (!ability) return null;
    const score = localChar.stats[ability] || 10;
    const m = Math.floor((score - 10) / 2);
    return { dc: 8 + profBonus + m, atk: profBonus + m, mod: m };
  };
  const spellStats = getSpellStats();

  const clickStat = (stat) => {
    const modifier = mod(localChar.stats[stat] || 10);
    if (onRoll) onRoll(localChar.name, `${stat.toUpperCase()} Check`, modifier);
  };

  const clickSave = (stat) => {
    const isProf = localChar.proficiencies?.saves?.[stat];
    const m = mod(localChar.stats[stat] || 10);
    const modifier = m + (isProf ? profBonus : 0);
    if (onRoll) onRoll(localChar.name, `${stat.toUpperCase()} Save`, modifier);
  };

  const clickSkill = (skillName) => {
    if (isEditing) {
      let skills = localChar.proficiencies?.skills || [];
      if (skills.includes(skillName)) skills = skills.filter(s => s !== skillName);
      else skills = [...skills, skillName];
      setLocalChar({ ...localChar, proficiencies: { ...localChar.proficiencies, skills } });
    } else {
      const skill = SKILLS_DATA.find(s => s.name === skillName);
      const isProf = localChar.proficiencies?.skills?.includes(skillName);
      const modifier = mod(localChar.stats[skill.stat] || 10) + (isProf ? profBonus : 0);
      if (onRoll) onRoll(localChar.name, `${skillName} Check`, modifier);
    }
  };

  const clickWeapon = (weaponName) => {
    const strMod = mod(localChar.stats.str);
    const dexMod = mod(localChar.stats.dex);
    const bestMod = Math.max(strMod, dexMod);
    const hitBonus = bestMod + profBonus;
    if (onRoll) onRoll(localChar.name, `Attack (${weaponName})`, hitBonus);
  };

  const clickSpell = (spellName) => {
    if (spellStats) {
      if (onRoll) onRoll(localChar.name, `Cast ${spellName}`, spellStats.atk);
    } else {
      if (onRoll) onRoll(localChar.name, `Cast ${spellName}`, 0);
    }
  };

  const clickInit = () => {
    const initMod = mod(localChar.stats.dex);
    if (onRoll) onRoll(localChar.name, "Initiative", initMod);
  };

  const clickAC = () => {
    if (onGenericRoll) onGenericRoll(localChar.name, `Defending with AC ${localChar.ac}`, null);
  };

  const toggleSave = (stat) => {
    const saves = { ...(localChar.proficiencies?.saves || {}) };
    saves[stat] = !saves[stat];
    setLocalChar({ ...localChar, proficiencies: { ...localChar.proficiencies, saves } });
  };

  const addItem = () => setLocalChar({ ...localChar, inventory: [...(localChar.inventory || []), { name: "New Item", weight: 0 }] });
  const updateItem = (idx, field, val) => { const inv = [...(localChar.inventory || [])]; inv[idx][field] = val; setLocalChar({ ...localChar, inventory: inv }); };
  const removeItem = (idx) => { const inv = [...(localChar.inventory || [])]; inv.splice(idx, 1); setLocalChar({ ...localChar, inventory: inv }); };

  const addSpell = () => setLocalChar({ ...localChar, knownSpells: [...(localChar.knownSpells || []), "New Spell"] });
  const updateSpell = (idx, val) => { const s = [...(localChar.knownSpells || [])]; s[idx] = val; setLocalChar({ ...localChar, knownSpells: s }); };
  const removeSpell = (idx) => { const s = [...(localChar.knownSpells || [])]; s.splice(idx, 1); setLocalChar({ ...localChar, knownSpells: s }); };

  const getSaveVal = (stat) => {
    const isProf = localChar.proficiencies?.saves?.[stat];
    const val = mod(localChar.stats[stat] || 10) + (isProf ? profBonus : 0);
    return val >= 0 ? `+${val}` : val;
  };

  const getPassive = (skillName) => {
    const skill = SKILLS_DATA.find(s => s.name === skillName);
    const statMod = mod(localChar.stats[skill.stat] || 10);
    const isProf = localChar.proficiencies?.skills?.includes(skillName);
    return 10 + statMod + (isProf ? profBonus : 0);
  };

  const getTotalWeight = () => {
    return (localChar.inventory || []).reduce((acc, item) => acc + (parseFloat(item.weight) || 0), 0);
  };

  const currentXp = char.xp || 0;
  const nextLevelXp = LEVEL_XP[char.level] || 999999;
  const prevLevelXp = LEVEL_XP[char.level - 1] || 0;
  const xpProgress = Math.min(100, Math.max(0, ((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));
  const canLevelUp = currentXp >= nextLevelXp;

  const levelUp = () => {
    const conMod = Math.floor(((localChar.stats?.con || 10) - 10) / 2);
    const hpGain = 6 + conMod;
    updateCharacter(char.id, {
      level: char.level + 1,
      maxHp: (char.maxHp || 10) + hpGain,
      hp: (char.hp || 10) + hpGain
    });
  };

  const addTrait = () => {
    if (!newTrait.name) return;
    const desc = newTrait.desc || COMMON_TRAITS_LOOKUP[newTrait.name] || "";
    const updatedTraits = [...(localChar.traitsList || []), { ...newTrait, desc }];
    setLocalChar({ ...localChar, traitsList: updatedTraits });
    setNewTrait({ name: "", type: "race", desc: "" });
  };

  const autoFillTraits = () => {
    const raceTraits = STANDARD_DATA.races[localChar.race] || [];
    const classTraits = STANDARD_DATA.classes[localChar.class] || [];
    const existingNames = new Set((localChar.traitsList || []).map(t => t.name));
    const newTraits = [
      ...raceTraits.filter(t => !existingNames.has(t.name)),
      ...classTraits.filter(t => !existingNames.has(t.name))
    ];
    if (newTraits.length > 0) {
      setLocalChar({ ...localChar, traitsList: [...(localChar.traitsList || []), ...newTraits] });
    }
  };

  const removeTrait = (idx) => {
    const updatedTraits = [...(localChar.traitsList || [])];
    updatedTraits.splice(idx, 1);
    setLocalChar({ ...localChar, traitsList: updatedTraits });
  };

  const toggleCondition = (cond) => {
    let conds = localChar.conditions || [];
    if (conds.includes(cond)) conds = conds.filter(c => c !== cond);
    else conds = [...conds, cond];
    setLocalChar({ ...localChar, conditions: conds });
  };

  const renderTraits = () => (
    <div className="flex flex-wrap mb-2">
      {(localChar.traitsList || []).map((t, idx) => (
        <div key={idx} className="relative group">
          <TraitBadge trait={t} onClick={() => isEditing && removeTrait(idx)} />
          {isEditing && (
            <button type="button" onClick={() => removeTrait(idx)}
              className="absolute -top-2 -right-1 bg-red-500 rounded-full w-3 h-3 flex items-center justify-center text-[8px] cursor-pointer">
              x
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`${getCardClass(printerMode)} rounded-lg overflow-hidden transition-all duration-300 relative`}>
      <div className={`p-4 flex items-center justify-between ${printerMode ? 'bg-gray-50 border-b border-black' : 'bg-slate-900'}`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${canLevelUp ? 'bg-amber-400 text-black animate-pulse cursor-pointer' : (printerMode ? 'border-2 border-black text-black' : 'bg-indigo-900 text-indigo-200')}`}
              onClick={() => canLevelUp && levelUp()} title={canLevelUp ? "Level Up!" : "Level"}>
              {isEditing ? (
                <input type="number" className="w-full h-full text-center bg-transparent border-none focus:outline-none"
                  value={localChar.level} onChange={(e) => setLocalChar({ ...localChar, level: parseInt(e.target.value) || 1 })} />
              ) : (
                <span>{char.level}</span>
              )}
            </div>
            {canLevelUp && (
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-0.5">
                <TrendingUp size={10} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <h3 className={`font-bold text-lg ${printerMode ? 'text-black' : 'text-white'}`}>{char.name}</h3>
            <div className={`text-xs ${printerMode ? 'text-gray-600' : 'text-slate-400'}`}>{char.race} {char.class}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono font-bold ${printerMode ? 'text-black' : 'text-white'}`}>
            HP {char.hp}/{char.maxHp}
          </div>
          <button onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
      </div>

      <div className={`h-1.5 w-full ${printerMode ? 'bg-gray-200' : 'bg-slate-800'}`}>
        <div className="h-full bg-purple-600 transition-all" style={{ width: `${xpProgress}%` }}></div>
      </div>

      {expanded && (
        <div className={`p-4 ${printerMode ? 'bg-white' : 'border-t border-slate-700'}`}>
          <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div className={`bg-slate-800 p-1 rounded ${!isEditing ? 'cursor-pointer hover:bg-slate-700' : ''}`}
              onClick={() => !isEditing && clickAC()} title="Click to Broadcast AC">
              <div className="text-[10px] uppercase opacity-50">AC</div>
              <div className="font-bold text-white">{localChar.ac}</div>
            </div>
            <div className={`bg-slate-800 p-1 rounded ${!isEditing ? 'cursor-pointer hover:bg-slate-700' : ''}`}
              onClick={() => !isEditing && clickInit()} title="Click to Roll Init">
              <div className="text-[10px] uppercase opacity-50">Init</div>
              <div className="font-bold text-white">{fmtMod(localChar.stats.dex)}</div>
            </div>
            <div className="bg-slate-800 p-1 rounded">
              <div className="text-[10px] uppercase opacity-50">Speed</div>
              <div className="font-bold text-white">{localChar.speed || 30}ft</div>
            </div>
            <div className="bg-slate-800 p-1 rounded">
              <div className="text-[10px] uppercase opacity-50">Prof</div>
              <div className="font-bold text-white">+{profBonus}</div>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-1 mb-4">
            {Object.keys(localChar.stats).map(stat => (
              <div key={stat} className={`flex flex-col items-center p-1 bg-slate-900/50 rounded border border-slate-800 ${!isEditing ? 'cursor-pointer hover:bg-slate-800 hover:border-amber-500/50' : ''}`}
                onClick={() => !isEditing && clickStat(stat)}
                title={!isEditing ? `Roll ${stat.toUpperCase()} Check` : ""}>
                <span className="text-[9px] uppercase font-bold text-slate-500">{stat}</span>
                {isEditing ? (
                  <input type="number" className="w-full text-center bg-transparent font-bold text-amber-500 text-sm"
                    value={localChar.stats[stat]}
                    onChange={e => setLocalChar({ ...localChar, stats: { ...localChar.stats, [stat]: parseInt(e.target.value) || 10 } })} />
                ) : (
                  <span className="font-bold text-white text-sm">{localChar.stats[stat]}</span>
                )}
                <span className="text-[9px] text-slate-400">{fmtMod(localChar.stats[stat])}</span>
              </div>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
              <h4 className="text-xs font-bold uppercase mb-2 text-slate-400 flex items-center">
                <Shield size={12} className="mr-1" /> Saving Throws (Click)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(localChar.stats).map(stat => (
                  <div key={stat} className={`flex items-center justify-between text-xs ${!isEditing ? 'cursor-pointer hover:text-amber-400' : ''}`}
                    onClick={() => !isEditing && clickSave(stat)}>
                    <span className="uppercase">{stat}</span>
                    <div className="flex items-center">
                      {isEditing && (
                        <input type="checkbox" checked={localChar.proficiencies?.saves?.[stat]}
                          onChange={() => toggleSave(stat)} className="mr-1" />
                      )}
                      <span className={`font-mono ${localChar.proficiencies?.saves?.[stat] ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
                        {getSaveVal(stat)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
              <h4 className="text-xs font-bold uppercase mb-2 text-slate-400 flex items-center">
                <Eye size={12} className="mr-1" /> Passive Senses
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Perception:</span>
                  <span className="font-bold text-white">{getPassive("Perception")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Investigation:</span>
                  <span className="font-bold text-white">{getPassive("Investigation")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vision:</span>
                  <span className="font-bold text-white">{localChar.vision || "0"} ft</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] uppercase font-bold opacity-50">Skills (Click to Roll)</label>
              {isEditing && (
                <button onClick={() => setShowSkillPicker(!showSkillPicker)}
                  className="text-[9px] bg-slate-700 px-2 rounded hover:bg-slate-600">
                  Edit
                </button>
              )}
            </div>

            {showSkillPicker && isEditing && (
              <div className="mb-2 p-2 bg-slate-900 border border-slate-600 rounded grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                {SKILLS_DATA.map(skill => (
                  <label key={skill.name} className="flex items-center text-xs space-x-2 cursor-pointer hover:bg-slate-800 p-1 rounded">
                    <input type="checkbox"
                      checked={localChar.proficiencies?.skills?.includes(skill.name)}
                      onChange={() => clickSkill(skill.name)} />
                    <span>{skill.name} <span className="opacity-50">({skill.stat})</span></span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {(localChar.proficiencies?.skills || []).map(s => (
                <span key={s}
                  onClick={() => clickSkill(s)}
                  className={`text-xs px-2 py-1 bg-slate-800 border border-slate-600 rounded text-slate-300 cursor-pointer hover:bg-slate-700 hover:border-amber-500 transition-colors`}
                  title="Roll Skill">
                  {s} <span className="text-white font-bold ml-1">
                    +{mod(localChar.stats[SKILLS_DATA.find(k => k.name === s)?.stat || 'str']) + profBonus}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {!isEditing && localChar.weapons && (
            <div className="mb-4">
              <label className="text-[9px] uppercase font-bold opacity-50 mb-1 block">Weapons (Click to Attack)</label>
              <div className="flex flex-wrap gap-2">
                {localChar.weapons.split(',').map(w => w.trim()).filter(w => w).map((w, i) => (
                  <button key={i} onClick={() => clickWeapon(w)}
                    className="flex items-center px-2 py-1 bg-red-900/30 border border-red-800 rounded text-xs hover:bg-red-800 hover:text-white transition-colors">
                    <Swords size={12} className="mr-1" /> {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(localChar.knownSpells?.length > 0 || isEditing) && (
            <div className="mb-4">
              <label className="text-[9px] uppercase font-bold opacity-50 mb-1 block">
                Known Spells {spellStats && `(DC ${spellStats.dc}, +${spellStats.atk})`}
              </label>
              <div className="flex flex-wrap gap-2">
                {(localChar.knownSpells || []).map((s, i) => (
                  <div key={i} className="flex items-center">
                    {isEditing ? (
                      <>
                        <input className="bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white w-24"
                          value={s} onChange={e => updateSpell(i, e.target.value)} />
                        <button onClick={() => removeSpell(i)} className="ml-1 text-red-400 hover:text-red-300">x</button>
                      </>
                    ) : (
                      <button onClick={() => clickSpell(s)}
                        className="flex items-center px-2 py-1 bg-purple-900/30 border border-purple-800 rounded text-xs hover:bg-purple-800 hover:text-white transition-colors">
                        <Wand2 size={12} className="mr-1" /> {s}
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button onClick={addSpell} className="text-xs bg-slate-700 px-2 rounded hover:bg-slate-600">
                    + Spell
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase text-slate-400">
                  <Backpack size={12} className="inline mr-1" /> Inventory
                </h4>
                <span className="text-[9px] opacity-70">{getTotalWeight()} lbs</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {(localChar.inventory || []).map((item, idx) => (
                  <div key={idx} className="flex items-center text-xs space-x-1">
                    {isEditing ? (
                      <>
                        <input className={`flex-1 p-1 rounded bg-slate-900 border-none text-white h-6`}
                          value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} />
                        <input type="number" className={`w-12 p-1 rounded bg-slate-900 border-none text-white h-6 text-center`}
                          value={item.weight} onChange={e => updateItem(idx, 'weight', e.target.value)} />
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={12} />
                        </button>
                      </>
                    ) : (
                      <div className="flex justify-between w-full px-1">
                        <span>{item.name}</span>
                        <span className="opacity-50">{item.weight} lb</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <button onClick={addItem} className="w-full mt-2 text-[10px] bg-slate-700 py-1 rounded hover:bg-slate-600">
                  + Add Item
                </button>
              )}
            </div>

            <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
              <h4 className="text-xs font-bold uppercase mb-1 text-slate-400">
                <Anchor size={12} className="inline mr-1" /> Mount
              </h4>
              {isEditing ? (
                <div className="grid grid-cols-3 gap-1">
                  <input placeholder="Name" className="col-span-3 bg-slate-900 border-none rounded p-1 text-xs text-white"
                    value={localChar.mount?.name || ''}
                    onChange={e => setLocalChar({ ...localChar, mount: { ...localChar.mount, name: e.target.value } })} />
                  <input placeholder="HP" className="bg-slate-900 border-none rounded p-1 text-xs text-white"
                    value={localChar.mount?.hp || ''}
                    onChange={e => setLocalChar({ ...localChar, mount: { ...localChar.mount, hp: e.target.value } })} />
                  <input placeholder="Spd" className="bg-slate-900 border-none rounded p-1 text-xs text-white"
                    value={localChar.mount?.speed || ''}
                    onChange={e => setLocalChar({ ...localChar, mount: { ...localChar.mount, speed: e.target.value } })} />
                  <input placeholder="AC" className="bg-slate-900 border-none rounded p-1 text-xs text-white"
                    value={localChar.mount?.ac || ''}
                    onChange={e => setLocalChar({ ...localChar, mount: { ...localChar.mount, ac: e.target.value } })} />
                </div>
              ) : (
                localChar.mount?.name ? (
                  <div className="text-xs">
                    <div className="font-bold text-amber-400">{localChar.mount.name}</div>                
                    <div className="opacity-70">
                  HP: {localChar.mount.hp} | AC: {localChar.mount.ac} | Spd: {localChar.mount.speed}
                </div>
              </div>
            ) : (
              <div className="text-xs opacity-40 italic">No mount.</div>
            )
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mb-4 p-2 bg-slate-800/50 rounded border border-slate-700">
          <div className="flex space-x-2 mb-2">
            <div className="flex-1">
              <label className="text-[9px] uppercase font-bold opacity-50 block">Race / Class</label>
              <div className="flex space-x-1">
                <select className={`w-1/2 p-1 text-xs rounded ${getInputClass(false)}`}
                  value={localChar.race}
                  onChange={e => setLocalChar({ ...localChar, race: e.target.value })}>
                  {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className={`w-1/2 p-1 text-xs rounded ${getInputClass(false)}`}
                  value={localChar.class}
                  onChange={e => setLocalChar({ ...localChar, class: e.target.value })}>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={autoFillTraits}
                className="mt-1 w-full bg-indigo-700 hover:bg-indigo-600 text-white text-[10px] py-1 rounded flex items-center justify-center shadow">
                <Zap size={10} className="mr-1" /> Fill Traits
              </button>
            </div>
            <div className="flex-1">
              <label className="text-[9px] uppercase font-bold opacity-50 block">XP Editor</label>
              <div className="flex space-x-1">
                <input type="number" className={`w-full p-1 text-xs rounded ${getInputClass(false)}`}
                  placeholder="Total XP" value={localChar.xp || 0}
                  onChange={e => setLocalChar({ ...localChar, xp: parseInt(e.target.value) || 0 })} />
                <div className="flex space-x-1">
                  {[10, 50, 100].map(amt => (
                    <button key={amt} type="button"
                      onClick={() => setLocalChar({ ...localChar, xp: (localChar.xp || 0) + amt })}
                      className="px-1 bg-slate-700 text-[9px] text-white rounded hover:bg-slate-600">
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <label className="text-[9px] uppercase font-bold opacity-50 block mb-1">Conditions</label>
          <div className="flex flex-wrap gap-1">
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => toggleCondition(c)}
                className={`px-2 py-0.5 text-[9px] rounded border transition-colors ${localChar.conditions?.includes(c) ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-900 border-slate-600 text-slate-400 hover:bg-slate-800'
                  }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {renderTraits()}

      {isEditing && (
        <div className="mb-4 p-2 bg-slate-900/50 rounded border border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Add Custom Trait</div>
          <div className="flex space-x-2 mb-2">
            <input className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
              placeholder="Trait Name" value={newTrait.name}
              onChange={e => setNewTrait({ ...newTrait, name: e.target.value })} />
            <select className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
              value={newTrait.type} onChange={e => setNewTrait({ ...newTrait, type: e.target.value })}>
              <option value="race">Race</option>
              <option value="class">Class</option>
              <option value="feat">Feat</option>
            </select>
          </div>
          <textarea className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white mb-2"
            rows="2" placeholder="Description..." value={newTrait.desc}
            onChange={e => setNewTrait({ ...newTrait, desc: e.target.value })} />
          <button onClick={addTrait} className="w-full bg-slate-700 hover:bg-slate-600 text-xs py-1 rounded">
            Add Custom Trait
          </button>
        </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
        <div className="flex space-x-2">
          <button onClick={handleDelete}
            className={`text-xs hover:text-red-300 flex items-center ${confirmDelete ? 'text-red-600 font-bold' : 'text-red-400'}`}>
            <Trash2 size={12} className="mr-1" />
            {confirmDelete ? "Confirm?" : "Delete"}
          </button>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <button onClick={handleSave}
              className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold shadow">
              <Save size={12} className="mr-1" /> Save
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)}
              className="flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold shadow">
              <Edit2 size={12} className="mr-1" /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )}
</div>
);
};
// --- Auth Screen ---
const AuthScreen = () => {
const [isRegistering, setIsRegistering] = useState(false);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const handleAuth = async (e) => {
e.preventDefault();
setError("");
try {
if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
else await signInWithEmailAndPassword(auth, email, password);
} catch (err) { setError(err.message); }
};
const handleGuest = async () => {
try { await signInAnonymously(auth); } catch (err) { setError("Guest login failed. " + err.message); }
};
return (
<div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-200 p-4">
<div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
<div className="flex flex-col items-center mb-8">
<div className="bg-amber-600 p-3 rounded-xl mb-4 shadow-lg shadow-amber-900/20">
<Dices size={40} className="text-slate-900" />
</div>
<h1 className="text-3xl font-bold text-white tracking-wider">DM's COMPANION</h1>
<p className="text-slate-500 text-sm">Your complete digital dungeon master toolkit</p>
</div>
<form onSubmit={handleAuth} className="space-y-4">
<div>
<label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email</label>
<div className="relative">
<Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
<input type="email"
className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-amber-500 focus:outline-none transition-colors"
placeholder="wizard@dnd.com" value={email} onChange={e => setEmail(e.target.value)} required />
</div>
</div>
<div>
<label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password</label>
<div className="relative">
<Key className="absolute left-3 top-2.5 text-slate-500" size={16} />
<input type="password"
className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-amber-500 focus:outline-none transition-colors"
placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
</div>
</div>
{error && (
<div className="text-red-500 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">
{error}
</div>
)}
<button type="submit"
         className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center">
{isRegistering ? <UserPlus size={18} className="mr-2" /> : <LogIn size={18} className="mr-2" />}
{isRegistering ? "Create Account" : "Sign In"}
</button>
</form>
<div className="mt-6 flex flex-col items-center space-y-4">
<button onClick={() => setIsRegistering(!isRegistering)}
className="text-xs text-amber-500 hover:text-amber-400 font-bold">
{isRegistering ? "Already have an account? Login" : "Need an account? Register"}
</button>
<div className="w-full flex items-center space-x-4">
<div className="h-px bg-slate-800 flex-1"></div>
<span className="text-slate-600 text-xs">OR</span>
<div className="h-px bg-slate-800 flex-1"></div>
</div>
<button onClick={handleGuest} className="text-xs text-slate-500 hover:text-white flex items-center">
<EyeOff size={14} className="mr-1" /> Continue as Guest
</button>
</div>
</div>
</div>
);
};
// --- Main Component ---
export default function DnDCompanion() {
const [user, setUser] = useState(null);
const [loadingAuth, setLoadingAuth] = useState(true);
const [activeTab, setActiveTab] = useState('party');
const [printerMode, setPrinterMode] = useState(false);
const [currentCampaign, setCurrentCampaign] = useState("Main Adventure");
const [campaignList, setCampaignList] = useState(["Main Adventure"]);
const [showCampaignModal, setShowCampaignModal] = useState(false);
const [newCampaignInput, setNewCampaignInput] = useState("");
const [targetCampaignForClone, setTargetCampaignForClone] = useState("");
const [characterToClone, setCharacterToClone] = useState(null);
const [compendiumType, setCompendiumType] = useState('monsters');
const [searchTerm, setSearchTerm] = useState("");
const [spellClassFilter, setSpellClassFilter] = useState("All");
const [spellTagFilter, setSpellTagFilter] = useState("All");
const [spellFilterClass, setSpellFilterClass] = useState(null);
const [spellFilterSource, setSpellFilterSource] = useState(null);
const [encPartyLevel, setEncPartyLevel] = useState(1);
const [encPartySize, setEncPartySize] = useState(4);
const [encDifficulty, setEncDifficulty] = useState(1);
const [encTheme, setEncTheme] = useState("Any");
const [encClusterSize, setEncClusterSize] = useState("Any");
const [generatedEncounter, setGeneratedEncounter] = useState([]);
const [encounterXP, setEncounterXP] = useState(0);
const [encounterBudget, setEncounterBudget] = useState(0);
const [campaignNotes, setCampaignNotes] = useState({ title: "", content: "" });
const [campaignDocId, setCampaignDocId] = useState(null);
const [allCharacters, setAllCharacters] = useState([]);
const [characters, setCharacters] = useState([]);
const [diceLog, setDiceLog] = useState([]);
const [notification, setNotification] = useState(null);
const [sortMode, setSortMode] = useState('initiative');
const [activeCombat, setActiveCombat] = useState(null);
const [campaignMode, setCampaignMode] = useState("Random");
const [campaignIndex, setCampaignIndex] = useState(0);
const [combatTurn, setCombatTurn] = useState(0);
const [weather, setWeather] = useState(null);
const [showLootGenerator, setShowLootGenerator] = useState(false);
const [showNPCGenerator, setShowNPCGenerator] = useState(false);
useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoadingAuth(false); });
return () => unsubscribe();
}, []);
useEffect(() => {
if (!user) return;
const qChars = query(collection(db, 'artifacts', appId, 'users', user.uid, 'characters'));
const unsubChars = onSnapshot(qChars, (snapshot) => {
const chars = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
setAllCharacters(chars);
const distinctCampaigns = new Set(["Main Adventure"]);
chars.forEach(c => { if (c.campaign) distinctCampaigns.add(c.campaign); });
setCampaignList(Array.from(distinctCampaigns).sort());
});
const diceQ = query(collection(db, 'artifacts', appId, 'users', user.uid, 'dicelog'));
const unsubDice = onSnapshot(diceQ, (snapshot) => {
let logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
logs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
setDiceLog(logs.slice(0, 100));
});
const campQ = query(collection(db, 'artifacts', appId, 'users', user.uid, 'campaigns'));
const unsubCamp = onSnapshot(campQ, (snapshot) => {
const notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).find(c => c.campaignName === currentCampaign);
if (notes) { setCampaignNotes(notes); setCampaignDocId(notes.id); }
else { setCampaignNotes({ title: "", content: "" }); setCampaignDocId(null); }
});
return () => { unsubChars(); unsubDice(); unsubCamp(); };
}, [user, currentCampaign]);
useEffect(() => {
const filtered = allCharacters.filter(c => {
if (!c.campaign && currentCampaign === "Main Adventure") return true;
return c.campaign === currentCampaign;
});
filtered.sort((a, b) => {
if (sortMode === 'initiative') {
if ((b.initiative || 0) !== (a.initiative || 0)) return (b.initiative || 0) - (a.initiative || 0);
return a.name.localeCompare(b.name);
}
return a.name.localeCompare(b.name);
});
setCharacters(filtered);
}, [allCharacters, currentCampaign, sortMode]);
const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
const handleRoll = async (charName, label, mod, diceString = null) => {
if (!user) return;
let result = 0;
let detail = "";
let natMsg = "";
if (diceString) {
  const match = diceString.match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!match) return;

  const [, count, faces, bonus] = match;
  const numCount = parseInt(count);
  const numFaces = parseInt(faces);
  const numBonus = bonus ? parseInt(bonus) : 0;

  let rolls = [];
  for (let i = 0; i < numCount; i++) {
    rolls.push(Math.floor(Math.random() * numFaces) + 1);
  }
  const sum = rolls.reduce((a, b) => a + b, 0);
  result = sum + numBonus;

  if (numFaces === 20 && numCount === 1) {
    if (rolls[0] === 20) natMsg = " 🎯 CRITICAL!";
    if (rolls[0] === 1) natMsg = " ❌ FAIL!";
  }

  detail = `${label}: [${rolls.join(',')}]${numBonus !== 0 ? ` ${numBonus >= 0 ? '+' : ''}${numBonus}` : ''} = ${result}`;
} else {
  const d20 = Math.floor(Math.random() * 20) + 1;
  result = d20 + mod;
  if (d20 === 20) natMsg = " 🎯 NAT 20!";
  if (d20 === 1) natMsg = " ❌ NAT 1!";
  detail = `${label}: [${d20}] + ${mod} = ${result}`;
}

await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'dicelog'), {
  roller: charName,
  sides: diceString ? 0 : 20,
  result,
  detail,
  timestamp: serverTimestamp(),
  campaign: currentCampaign
});

showNotification(`${charName}: ${detail}${natMsg}`);
};
const handleGenericRoll = async (charName, label, result) => {
if (!user) return;
await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'dicelog'), {
roller: charName,
sides: 0,
result: 0,
detail: label,
timestamp: serverTimestamp(),
campaign: currentCampaign
});
showNotification(`${charName}: ${label}`);
};
const addCharacter = async (autoRoll = false) => {
if (!user) return;
const randomClass = CLASSES[Math.floor(Math.random() * CLASSES.length)];
const randomRace = RACES[Math.floor(Math.random() * RACES.length)];
const chosenClass = autoRoll ? randomClass : "Fighter";
const chosenRace = autoRoll ? randomRace : "Human";
let stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
if (autoRoll) stats = {
str: rollStatValue(), dex: rollStatValue(), con: rollStatValue(),
int: rollStatValue(), wis: rollStatValue(), cha: rollStatValue()
};
const defaults = CLASS_DEFAULTS[chosenClass] || CLASS_DEFAULTS["Fighter"];
const profs = { saves: {}, skills: autoRoll ? defaults.skills : [] };
defaults.saves.forEach(s => profs.saves[s] = true);
const inventory = (autoRoll ? defaults.gear : ["Backpack", "Rations (5)"]).map(name => ({ name, weight: 2 }));
const knownSpells = autoRoll && defaults.spells ? defaults.spells : [];

let ac = 10 + Math.floor((stats.dex - 10) / 2);
if (defaults.armor === "Chain Mail") ac = 16;
if (defaults.armor === "Scale Mail") ac = 14 + Math.min(2, Math.floor((stats.dex - 10) / 2));
if (defaults.armor === "Leather") ac = 11 + Math.floor((stats.dex - 10) / 2);
if (chosenClass === "Monk") ac = 10 + Math.floor((stats.dex - 10) / 2) + Math.floor((stats.wis - 10) / 2);
if (chosenClass === "Barbarian") ac = 10 + Math.floor((stats.dex - 10) / 2) + Math.floor((stats.con - 10) / 2);

const newChar = {
  name: autoRoll ? "Random Hero" : "New Hero",
  race: chosenRace, class: chosenClass, level: 1, hp: defaults.hp, maxHp: defaults.hp, ac: ac,
  speed: 30, vision: "Normal", profession: "Adventurer", stats, traitsList: [], bio: "",
  campaign: currentCampaign, initiative: 0, conditions: [], xp: 0,
  proficiencies: profs, inventory: inventory, mount: { name: "", hp: 0, ac: 0, speed: 0 },
  otherProfs: `Armor: ${defaults.armor}. Languages: Common.`, weapons: (defaults.gear || []).join(', '),
  knownSpells: knownSpells
};
await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'characters'), newChar);
showNotification("Hero added to " + currentCampaign);
};
const updateCharacter = async (id, data) => {
if (user) await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'characters', id), data);
};
const deleteCharacter = async (id) => {
if (user) {
await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'characters', id));
showNotification("Deleted");
}
};
const handleCloneCharacter = async () => {
if (!characterToClone || !targetCampaignForClone || !user) return;
const { id, ...charDataRest } = characterToClone;
const clonedChar = { ...charDataRest, name: `${characterToClone.name} (Copy)`, campaign: targetCampaignForClone };
await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'characters'), clonedChar);
showNotification(`Cloned to ${targetCampaignForClone}`);
setCharacterToClone(null);
};
const rollDice = async (sides) => {
if (!user) return;
const res = Math.floor(Math.random() * sides) + 1;
await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'dicelog'), {
roller: "DM", sides, result: res, timestamp: serverTimestamp(), campaign: currentCampaign
});
};
const saveCampaignNotes = async () => {
if (!user) return;
const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'campaigns');
const dataToSave = { ...campaignNotes, campaignName: currentCampaign };
if (campaignDocId) await updateDoc(doc(colRef, campaignDocId), dataToSave);
else await addDoc(colRef, dataToSave);
showNotification("Notes saved.");
};
const generateEncounter = () => {
if (campaignMode !== "Random") {
const module = CAMPAIGN_MODULES[campaignMode];
if (module && module.encounters && module.encounters[campaignIndex]) {
const encounter = module.encounters[campaignIndex];
const monsters = encounter.monsters.map(name => MONSTER_MANUAL.find(m => m.name === name)).filter(Boolean);
setGeneratedEncounter(monsters);
setEncounterXP(monsters.reduce((acc, m) => acc + m.xp, 0));
showNotification(`Loaded: ${encounter.name}`);
return;
} else {
showNotification("Campaign Complete!");
return;
}
}
// Random mode
const thresholds = XP_THRESHOLDS[encPartyLevel] || [25, 50, 75, 100];
const budget = thresholds[encDifficulty] * encPartySize;
setEncounterBudget(budget);

let pool = MONSTER_MANUAL.filter(m => {
  if (encTheme !== "Any") {
    const allowed = BIOME_PRESETS[encTheme] || [];
    if (!allowed.includes(m.name)) return false;
  }
  return true;
});

if (pool.length === 0) { setGeneratedEncounter([]); return; }

let filteredPool = [...pool];
if (encClusterSize === "Solo") {
  filteredPool.sort((a, b) => Math.abs(budget - a.xp) - Math.abs(budget - b.xp));
  setGeneratedEncounter([filteredPool[0]]);
  setEncounterXP(filteredPool[0].xp);
  return;
}

let currentXP = 0;
let roster = [];
let attempts = 0;
while (currentXP < budget && attempts < 100) {
  attempts++;
  const m = filteredPool[Math.floor(Math.random() * filteredPool.length)];
  if (currentXP + m.xp <= budget * 1.2) {
    roster.push(m);
    currentXP += m.xp;
  }
}

if (roster.length === 0 && filteredPool.length > 0) roster.push(filteredPool[0]);

const summaryMap = {};
roster.forEach(m => {
  if (!summaryMap[m.name]) summaryMap[m.name] = { ...m, count: 0 };
  summaryMap[m.name].count++;
});
setGeneratedEncounter(Object.values(summaryMap));
setEncounterXP(currentXP);
};
const startCombat = () => {
if (generatedEncounter.length === 0) return;
let combatRoster = [];
generatedEncounter.forEach(m => {
const count = m.count || 1;
for (let i = 0; i < count; i++) {
const dexMod = Math.floor(((m.stats?.dex || 10) - 10) / 2);
const initiative = Math.floor(Math.random() * 20) + 1 + dexMod;
combatRoster.push({
...m,
instanceId: `${m.name}-${i}`,
currentHp: m.hp,
initiative
});
}
});
combatRoster.sort((a, b) => b.initiative - a.initiative);
setActiveCombat(combatRoster);
setCombatTurn(0);
showNotification("Combat started! Roll initiative for PCs.");
};
const endCombat = () => {
if (activeCombat) {
const xpPerPlayer = Math.floor(encounterXP / characters.length);
characters.forEach(char => {
updateCharacter(char.id, { xp: (char.xp || 0) + xpPerPlayer });
});
showNotification(`Awarded ${xpPerPlayer} XP to each player!`);
}
setActiveCombat(null);
if (campaignMode !== "Random") {
setCampaignIndex(campaignIndex + 1);
setGeneratedEncounter([]);
}
};
const updateMonsterHp = (idx, newHp) => {
const newCombat = [...activeCombat];
newCombat[idx].currentHp = newHp;
setActiveCombat(newCombat);
};
const removeMonster = (idx) => {
const newCombat = [...activeCombat];
newCombat.splice(idx, 1);
setActiveCombat(newCombat);
};
const nextTurn = () => {
setCombatTurn((combatTurn + 1) % (activeCombat.length + characters.length));
};
const handleRest = (type) => {
characters.forEach(char => {
const updates = { hp: char.maxHp };
if (type === 'long') {
updates.conditions = [];
}
updateCharacter(char.id, updates);
});
showNotification(`Party took a ${type} rest!`);
};
const generateLoot = (tier) => {
const table = LOOT_TABLES[tier] || LOOT_TABLES.minor;
const item = table[Math.floor(Math.random() * table.length)];
showNotification(`Loot: ${item}`);
return item;
};
const generateNPC = () => {
const gender = Math.random() > 0.5 ? 'male' : 'female';
const firstName = NPC_NAMES[gender][Math.floor(Math.random() * NPC_NAMES[gender].length)];
const lastName = NPC_NAMES.surnames[Math.floor(Math.random() * NPC_NAMES.surnames.length)];
const trait = NPC_TRAITS[Math.floor(Math.random() * NPC_TRAITS.length)];
return { name: `${firstName} ${lastName}`, trait };
};
const generateWeather = () => {
const w = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
setWeather(w);
showNotification(`Weather: ${w.name} - ${w.effect}`);
};
const sortInitiative = () => { setSortMode('initiative'); showNotification("Sorted by Initiative"); };
const sortByName = () => { setSortMode('name'); showNotification("Sorted by Name"); };
const handleFocusSpells = (char) => {
setCompendiumType('spells');
setSpellFilterClass(char.class);
setSpellFilterSource({ name: char.name, class: char.class });
setActiveTab('compendium');
};
if (loadingAuth) return (
<div className="h-screen bg-slate-950 text-slate-500 flex items-center justify-center">
Loading Arcane Script...
</div>
);
if (!user) return <AuthScreen />;
// Get current campaign module info
const currentModule = CAMPAIGN_MODULES[campaignMode];
const currentEncounter = currentModule?.encounters?.[campaignIndex];
return (
<div className={`flex flex-col h-screen font-sans ${getBgClass(printerMode)}`}>
{/* Header */}
<header className={`p-4 shadow-md flex items-center justify-between z-10 ${getHeaderClass(printerMode)}`}>
<div className="flex items-center space-x-3">
<div className={`p-2 rounded-lg ${printerMode ? 'bg-black text-white' : 'bg-amber-600 text-slate-900'}`}>
<Dices size={24} />
</div>
<div>
<h1 className={`text-xl font-bold leading-none ${printerMode ? 'text-black' : 'text-amber-500'}`}>
DM's COMPANION
</h1>
<button onClick={() => setShowCampaignModal(true)}
className="flex items-center text-xs opacity-70 hover:opacity-100 mt-1 font-mono">
{user.isAnonymous ? (
<Ghost size={10} className="mr-1 text-slate-400" />
) : (
<Lock size={10} className="mr-1 text-green-500" />
)}
<MapIcon size={12} className="mr-1" /> {currentCampaign}
<ChevronDown size={12} className="ml-1" />
</button>
</div>
</div>
<div className="flex items-center space-x-2">
<button onClick={() => setPrinterMode(!printerMode)}
className={`p-2 rounded-full ${printerMode ? 'bg-gray-200 text-black' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
<Printer size={18} />
</button>
<button onClick={() => signOut(auth)}
className="p-2 rounded-full bg-slate-800 text-red-400 hover:bg-red-900/50" title="Sign Out">
<LogOut size={18} />
</button>
</div>
</header>
  {notification && (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-amber-500 text-black px-4 py-2 rounded-full shadow-lg z-50 font-bold text-sm animate-bounce flex items-center">
      <Info size={16} className="mr-2" /> {notification}
    </div>
  )}

  {/* Campaign Modal */}
  {showCampaignModal && (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <MapIcon className="mr-2" /> Select Campaign
        </h2>
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {campaignList.map(c => (
            <button key={c}
              onClick={() => {
                setCurrentCampaign(c);
                setShowCampaignModal(false);
                showNotification(`Loaded ${c}`);
              }}
              className={`w-full text-left p-3 rounded flex justify-between items-center transition-colors ${currentCampaign === c ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}>
              <span>{c}</span>
              {currentCampaign === c && <Zap size={16} />}
            </button>
          ))}
        </div>
        <div className="pt-4 border-t border-slate-700 flex space-x-2">
          <input className="flex-1 bg-slate-950 border border-slate-600 rounded p-2 text-white"
            placeholder="New Campaign..." value={newCampaignInput}
            onChange={e => setNewCampaignInput(e.target.value)} />
          <button onClick={() => {
            if (newCampaignInput) {
              setCampaignList([...campaignList, newCampaignInput]);
              setCurrentCampaign(newCampaignInput);
              setNewCampaignInput("");
              setShowCampaignModal(false);
            }
          }} className="bg-green-600 text-white px-4 rounded font-bold hover:bg-green-500">
            Create
          </button>
        </div>
        <button onClick={() => setShowCampaignModal(false)}
          className="mt-4 text-slate-500 text-xs w-full text-center hover:text-slate-400">
          Close
        </button>
      </div>
    </div>
  )}

  {/* Clone Character Modal */}
  {characterToClone && (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">Extract Player</h3>
        <p className="text-slate-400 text-sm mb-4">
          Copy <span className="text-white font-bold">{characterToClone.name}</span> to:
        </p>
        <select className="w-full bg-slate-800 border border-slate-600 text-white p-2 rounded mb-4"
          value={targetCampaignForClone} onChange={e => setTargetCampaignForClone(e.target.value)}>
          <option value="">Select Campaign...</option>
          {campaignList.filter(c => c !== currentCampaign).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex space-x-2">
          <button onClick={() => setCharacterToClone(null)}
            className="flex-1 bg-slate-700 text-slate-300 py-2 rounded font-bold hover:bg-slate-600">
            Cancel
          </button>
          <button onClick={handleCloneCharacter} disabled={!targetCampaignForClone}
            className="flex-1 bg-blue-600 text-white py-2 rounded font-bold disabled:opacity-50 hover:bg-blue-500">
            Copy
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Loot Generator Modal */}
  {showLootGenerator && (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <Gift size={20} className="mr-2" /> Loot Generator
        </h3>
        <div className="space-y-2">
          {Object.keys(LOOT_TABLES).map(tier => (
            <button key={tier}
              onClick={() => generateLoot(tier)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded flex items-center justify-between">
              <span className="capitalize font-bold">{tier}</span>
              <Coins size={16} />
            </button>
          ))}
        </div>
        <button onClick={() => setShowLootGenerator(false)}
          className="mt-4 text-slate-500 text-xs w-full text-center">
          Close
        </button>
      </div>
    </div>
  )}

  {/* NPC Generator Modal */}
  {showNPCGenerator && (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <UserX size={20} className="mr-2" /> NPC Generator
        </h3>
        <button onClick={() => {
          const npc = generateNPC();
          showNotification(`${npc.name}: ${npc.trait}`);
        }}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white p-3 rounded font-bold flex items-center justify-center">
          <Sparkles size={16} className="mr-2" /> Generate Random NPC
        </button>
        <button onClick={() => setShowNPCGenerator(false)}
          className="mt-4 text-slate-500 text-xs w-full text-center">
          Close
        </button>
      </div>
    </div>
  )}

  <main className="flex-1 overflow-y-auto p-4 pb-24 custom-scrollbar">
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Party Tab */}
      {activeTab === 'party' && (
        <>
          <div className={`p-4 rounded-xl flex items-center justify-between ${printerMode ? 'bg-gray-100 border border-black' : 'bg-slate-800 border border-slate-700'}`}>
            <div className="flex items-center space-x-2">
              <Users className={printerMode ? 'text-black' : 'text-amber-500'} />
              <div>
                <h2 className={`font-bold ${printerMode ? 'text-black' : 'text-white'}`}>Party Roster</h2>
                <div className="text-xs opacity-60">Campaign: {currentCampaign}</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={sortInitiative}
                className={`px-3 py-1.5 rounded text-sm font-bold flex items-center ${printerMode ? 'bg-white border border-black' : 'bg-indigo-700 text-white hover:bg-indigo-600'}`}
                title="Sort by Initiative">
                <ArrowDownAZ size={14} className="mr-1" /> Init
              </button>
              <button onClick={() => handleRest('short')}
                className={`px-3 py-1.5 rounded text-sm font-bold flex items-center ${printerMode ? 'bg-white border border-black' : 'bg-blue-700 text-white hover:bg-blue-600'}`}>
                <Coffee size={14} className="mr-1" /> Short Rest
              </button>
              <button onClick={() => handleRest('long')}
                className={`px-3 py-1.5 rounded text-sm font-bold flex items-center ${printerMode ? 'bg-white border border-black' : 'bg-purple-700 text-white hover:bg-purple-600'}`}>
                <Moon size={14} className="mr-1" /> Long Rest
              </button>
              <button onClick={() => addCharacter(false)}
                className={`px-3 py-1.5 rounded text-sm font-bold ${printerMode ? 'bg-white border border-black' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                + Manual
              </button>
              <button onClick={() => addCharacter(true)}
                className={`px-3 py-1.5 rounded text-sm font-bold flex items-center ${getBtnPrimary(printerMode)}`}>
                <Zap size={14} className="mr-1" /> Auto-Gen
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map(char => (
              <CharacterCard key={char.id} char={char} printerMode={printerMode}
                updateCharacter={updateCharacter} deleteCharacter={deleteCharacter}
                cloneCharacter={setCharacterToClone} onFocusSpells={handleFocusSpells}
                onRoll={handleRoll} onGenericRoll={handleGenericRoll} />
            ))}
            {characters.length === 0 && (
              <div className="col-span-full py-12 text-center opacity-50 border-2 border-dashed border-slate-700 rounded-xl">
                <p>No heroes in this campaign yet.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Encounters Tab */}
      {activeTab === 'encounters' && activeCombat ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-red-900/20 p-3 rounded border border-red-800">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <Swords className="mr-2" /> Active Combat
              </h2>
              <div className="text-xs text-slate-400 mt-1">
                Turn: {combatTurn + 1} | Total XP: {encounterXP}
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={nextTurn}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold flex items-center">
                <SkipForward size={16} className="mr-1" /> Next Turn
              </button>
              <button onClick={endCombat}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold">
                End Combat
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCombat.map((m, i) => (
              <ActiveMonsterCard key={i} idx={i} monster={m}
                onUpdateHP={updateMonsterHp} onRoll={handleRoll} onRemove={removeMonster} />
            ))}
          </div>
        </div>
      ) : activeTab === 'encounters' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold flex items-center ${printerMode ? 'text-black' : 'text-white'}`}>
              <Swords className="mr-2" /> Encounter Generator
            </h2>
            <div className="flex space-x-2">
              <button onClick={() => setShowLootGenerator(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm font-bold flex items-center">
                <Gift size={14} className="mr-1" /> Loot
              </button>
              <button onClick={() => setShowNPCGenerator(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-bold flex items-center">
                <UserX size={14} className="mr-1" /> NPC
              </button>
              <button onClick={generateWeather}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold flex items-center">
                <Cloud size={14} className="mr-1" /> Weather
              </button>
            </div>
          </div>

          {weather && (
            <div className={`p-4 rounded-lg border flex items-center space-x-3 ${printerMode ? 'bg-white border-black' : 'bg-slate-800 border-slate-700'}`}>
              <weather.icon size={24} className="text-blue-400" />
              <div>
                <div className="font-bold">{weather.name}</div>
                <div className="text-xs opacity-70">{weather.effect}</div>
              </div>
            </div>
          )}

          <div className={`p-6 rounded-xl border ${printerMode ? 'bg-white border-black' : 'bg-slate-800 border-slate-700'}`}>
            <label className="text-xs uppercase font-bold text-slate-500 mb-2 block">Game Mode</label>
            <div className="flex gap-2 mb-4">
              <select className={`flex-1 p-2 rounded ${getInputClass(printerMode)}`}
                value={campaignMode} onChange={e => { setCampaignMode(e.target.value); setCampaignIndex(0); }}>
                {Object.keys(CAMPAIGN_MODULES).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              {campaignMode !== "Random" && (
                <div className={`self-center font-mono text-xs ${printerMode ? 'text-black' : 'text-white'}`}>
                  Stage: {campaignIndex + 1}/{currentModule?.encounters?.length || 0}
                </div>
              )}
            </div>

            {currentModule?.description && (
              <div className="mb-4 p-3 bg-amber-900/20 border border-amber-800 rounded text-xs">
                <strong>Campaign:</strong> {currentModule.description}
              </div>
            )}

            {currentEncounter && (
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded text-xs">
                <div className="font-bold text-blue-400 mb-1">{currentEncounter.name}</div>
                <div className="text-slate-300 mb-2">{currentEncounter.text}</div>
                {currentEncounter.notes && (
                  <div className="text-slate-400 italic text-[11px]">Note: {currentEncounter.notes}</div>
                )}
              </div>
            )}

            {campaignMode === "Random" && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold uppercase mb-2 opacity-70">Lvl</label>
                  <input type="number" min="1" max="20" className={`w-full p-2 rounded ${getInputClass(printerMode)}`}
                    value={encPartyLevel} onChange={e => setEncPartyLevel(parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-2 opacity-70">Size</label>
                  <input type="number" min="1" max="10" className={`w-full p-2 rounded ${getInputClass(printerMode)}`}
                    value={encPartySize} onChange={e => setEncPartySize(parseInt(e.target.value) || 4)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-2 opacity-70">Diff</label>
                  <select className={`w-full p-2 rounded ${getInputClass(printerMode)}`}
                    value={encDifficulty} onChange={e => setEncDifficulty(parseInt(e.target.value))}>
                    <option value={0}>Easy</option>
                    <option value={1}>Medium</option>
                    <option value={2}>Hard</option>
                    <option value={3}>Deadly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-2 opacity-70">Biome</label>
                  <select className={`w-full p-2 rounded ${getInputClass(printerMode)}`}
                    value={encTheme} onChange={e => setEncTheme(e.target.value)}>
                    <option value="Any">Any</option>
                    <option value="City">City</option>
                    <option value="Wilderness">Wilderness</option>
                    <option value="Dungeon">Dungeon</option>
                    <option value="Crypt">Crypt</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-2 opacity-70">Count</label>
                  <select className={`w-full p-2 rounded ${getInputClass(printerMode)}`}
                    value={encClusterSize} onChange={e => setEncClusterSize(e.target.value)}>
                    <option value="Any">Any</option>
                    <option value="Solo">Solo Boss</option>
                  </select>
                </div>
              </div>
            )}

            <button onClick={generateEncounter}
              className={`w-full py-3 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center transform transition active:scale-95 ${getBtnPrimary(printerMode)}`}>
              {campaignMode === "Random" ? "Generate Random Encounter" : "Load Next Scenario"}
            </button>
          </div>

          {generatedEncounter.length > 0 && (
            <div className={`rounded-xl overflow-hidden border ${printerMode ? 'bg-white border-black' : 'bg-slate-900 border-slate-800'}`}>
              <div className={`p-4 border-b flex justify-between items-center ${printerMode ? 'bg-gray-100 border-black' : 'bg-slate-800 border-slate-700'}`}>
                <div className="flex flex-col">
                  <span className="font-bold">Encounter Plan</span>
                  {currentEncounter && (
                    <span className="text-xs opacity-70 italic">{currentEncounter.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${printerMode ? 'bg-black text-white' : 'bg-slate-950 text-slate-400'}`}>
                    Total XP: {encounterXP}
                  </span>
                  <button onClick={startCombat}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded font-bold flex items-center text-xs">
                    <Swords size={14} className="mr-1" /> Fight!
                  </button>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 gap-3">
                {summarizeEncounter(generatedEncounter).map((m, i) => (
                  <EncounterMonsterItem key={i} monster={m} printerMode={printerMode} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Compendium Tab */}
      {activeTab === 'compendium' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold flex items-center ${printerMode ? 'text-black' : 'text-white'}`}>
              <BookOpen className="mr-2" /> Compendium
            </h2>
            <div className={`flex rounded-lg overflow-hidden border ${printerMode ? 'border-black' : 'border-slate-700'}`}>
              <button onClick={() => setCompendiumType('monsters')}
                className={`px-4 py-1 text-sm font-bold transition-colors ${compendiumType === 'monsters' ? (printerMode ? 'bg-black text-white' : 'bg-amber-500 text-slate-900') : (printerMode ? 'bg-white text-black' : 'bg-slate-900 text-slate-400')
                  }`}>
                Monsters
              </button>
              <button onClick={() => setCompendiumType('spells')}
                className={`px-4 py-1 text-sm font-bold transition-colors ${compendiumType === 'spells' ? (printerMode ? 'bg-black text-white' : 'bg-purple-500 text-white') : (printerMode ? 'bg-white text-black' : 'bg-slate-900 text-slate-400')
                  }`}>
                Spells
              </button>
            </div>
          </div>

          {compendiumType === 'spells' && (
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-1">
                <Filter size={12} className={printerMode ? 'text-black' : 'text-slate-400'} />
                <span className="uppercase tracking-wide opacity-70">Class Filter</span>
              </div>
              <select value={spellClassFilter} onChange={e => setSpellClassFilter(e.target.value)}
                className={`text-xs px-2 py-1 rounded ${getInputClass(printerMode)}`} style={{ width: 'auto' }}>
                <option value="All">All casters</option>
                {CASTER_CLASSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {spellFilterClass && (
            <div className={`mb-2 px-3 py-2 rounded border text-xs flex items-center justify-between ${printerMode ? 'bg-white border-black text-black' : 'bg-slate-900 border-slate-700 text-slate-200'}`}>
              <div>Using class filter from <span className="font-bold">{spellFilterSource?.name || "party"} ({spellFilterClass})</span></div>
              <button type="button" onClick={() => { setSpellFilterClass(null); setSpellFilterSource(null); }}
                className={`ml-2 px-2 py-1 rounded text-[10px] border ${printerMode ? 'border-black hover:bg-black hover:text-white' : 'border-slate-600 hover:bg-slate-700'}`}>
                Clear
              </button>
            </div>
          )}

          <div className="relative mb-2">
            <Search className={`absolute left-3 top-2.5 ${printerMode ? 'text-black' : 'text-slate-500'}`} size={16} />
            <input type="text" placeholder={`Search ${compendiumType}...`}
              className={`rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none w-full ${getInputClass(printerMode)}`}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {compendiumType === 'spells' && (
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-1 mb-1 text-[11px] uppercase opacity-70">
                <Tag size={12} className={printerMode ? 'text-black' : 'text-slate-400'} />
                <span>Spell Tags</span>
              </div>
              <div className="w-full flex flex-wrap gap-2">
                {SPELL_TAGS.map(tag => (
                  <button key={tag} onClick={() => setSpellTagFilter(tag)}
                    className={`px-2 py-1 rounded-full text-xs font-bold border transition-colors ${spellTagFilter === tag ? (printerMode ? 'bg-black text-white border-black' : 'bg-purple-500 text-white border-purple-400') : (printerMode ? 'bg-white text-black border-black' : 'bg-slate-800 text-slate-300 border-slate-600')
                      }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {(compendiumType === 'monsters' ? MONSTER_MANUAL : SPELL_COMPENDIUM)
              .filter(i => {
                const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
                if (!matchesSearch) return false;
                if (compendiumType === 'spells') {
                  if (spellFilterClass && (!i.classes || !i.classes.includes(spellFilterClass))) return false;
                  if (spellClassFilter !== "All" && (!i.classes || !i.classes.includes(spellClassFilter))) return false;
                  if (spellTagFilter !== "All") {
                    if (!i.tags) return false;
                    const tagKeyMap = { Damage: "damage", Heal: "heal", Control: "control", Buff: "buff", Utility: "utility" };
                    const key = tagKeyMap[spellTagFilter];
                    if (!i.tags.includes(key)) return false;
                  }
                }
                return true;
              })
              .map((item, idx) => (
                <div key={idx} className={`${getCardClass(printerMode)} p-4 rounded-lg`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={`text-lg font-bold ${printerMode ? 'text-black' : (compendiumType === 'monsters' ? 'text-amber-400' : 'text-purple-400')}`}>
                        {item.name}
                      </h3>
                      <span className={`text-xs italic ${printerMode ? 'text-gray-600' : 'text-slate-400'}`}>
                        {item.type || item.school}
                        {compendiumType === 'spells' && ` • Level ${item.level}`}
                        {compendiumType === 'monsters' && ` • CR ${item.cr} (${item.xp}xp)`}
                      </span>
                    </div>
                  </div>
                  {compendiumType === 'monsters' && (
                    <div className={`mt-2 text-xs ${printerMode ? 'text-black' : 'text-slate-400'}`}>
                      {item.stats && <div><span className="font-bold">Stats:</span> {item.stats}</div>}
                      {item.equipment && <div><span className="font-bold">Gear:</span> {item.equipment}</div>}
                    </div>
                  )}
                  {compendiumType === 'spells' && (
                    <div className={`mt-2 text-xs ${printerMode ? 'text-black' : 'text-slate-400'}`}>
                      <div><span className="font-bold">Time:</span> {item.time} • <span className="font-bold">Range:</span> {item.range}</div>
                      <div><span className="font-bold">Components:</span> {item.components} • <span className="font-bold">Duration:</span> {item.duration}</div>
                      {item.classes && <div><span className="font-bold">Classes:</span> {item.classes.join(', ')}</div>}
                    </div>
                  )}
                  <div className={`text-sm leading-relaxed mt-2 ${printerMode ? 'text-black' : 'text-slate-300'}`}>
                    {item.desc || item.actions}
                  </div>
                  {item.desc?.match(DICE_REGEX) && (
                    <button onClick={() => handleRoll("Compendium", `${compendiumType === 'spells' ? 'Cast' : 'Use'} ${item.name}`, 0, item.desc.match(DICE_REGEX)[0])}
                      className={`mt-2 text-xs px-2 py-1 rounded flex items-center ${compendiumType === 'spells' ? 'bg-purple-700 hover:bg-purple-600' : 'bg-amber-700 hover:bg-amber-600'} text-white`}>
                      <Dices size={12} className="mr-1" /> Roll ({item.desc.match(DICE_REGEX)[0]})
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold flex items-center ${printerMode ? 'text-black' : 'text-white'}`}>
              <Scroll className="mr-2" /> Notes: {currentCampaign}
            </h2>
            <button onClick={saveCampaignNotes}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-md ${getBtnPrimary(printerMode)}`}>
              <Save size={16} className="mr-2" /> Save
            </button>
          </div>
          <div className={`rounded-lg shadow-xl overflow-hidden flex-1 flex flex-col relative ${printerMode ? 'bg-white border-2 border-black text-black' : 'bg-yellow-50 text-slate-800'}`}>
            {!printerMode && (
              <div className="h-full w-full absolute top-0 left-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
            )}
            <input type="text" placeholder="Title..."
              className="bg-transparent w-full p-4 text-2xl font-serif font-bold border-b border-opacity-20 border-black focus:outline-none z-10"
              value={campaignNotes.title}
              onChange={(e) => setCampaignNotes({ ...campaignNotes, title: e.target.value })} />
            <textarea
              className="flex-1 w-full bg-transparent p-4 font-serif text-lg leading-relaxed focus:outline-none resize-none z-10"
              placeholder="Adventure log..."
              value={campaignNotes.content}
              onChange={(e) => setCampaignNotes({ ...campaignNotes, content: e.target.value })}></textarea>
          </div>
        </div>
      )}

      {/* Dice Tab */}
      {activeTab === 'dice' && (
        <div className="space-y-4">
          <h2 className={`text-2xl font-bold flex items-center ${printerMode ? 'text-black' : 'text-white'}`}>
            <Dices className="mr-2" /> Dice Roller
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {[4, 6, 8, 10, 12, 20].map(s => (
              <button key={s} onClick={() => rollDice(s)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 ${printerMode ? 'bg-white border-2 border-black hover:bg-gray-100' : 'bg-slate-800 border border-slate-700 hover:bg-indigo-600'
                  }`}>
                <Dices size={32} className={printerMode ? 'text-black' : 'text-white'} />
                <span className={`text-2xl font-bold mt-2 ${printerMode ? 'text-black' : 'text-white'}`}>d{s}</span>
              </button>
            ))}
          </div>
          <div className={`rounded-xl p-4 mt-4 h-96 overflow-y-auto custom-scrollbar ${printerMode ? 'bg-gray-100 border-black' : 'bg-slate-900 border border-slate-800'}`}>
            <h3 className="text-xs font-bold uppercase opacity-50 mb-2">Unified Roll Log</h3>
            {diceLog.map(l => (
              <div key={l.id} className={`flex justify-between items-center py-2 border-b ${printerMode ? 'border-gray-300' : 'border-slate-800'}`}>
                <div className="flex-1">
                  <div className="text-sm font-bold">{l.roller}</div>
                  <div className="text-xs opacity-70">{l.detail}</div>
                </div>
                {l.result > 0 && (
                  <span className={`font-bold text-lg ${l.result === 20 ? 'text-amber-500' : l.result === 1 ? 'text-red-500' : ''}`}>
                    {l.result}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <h2 className={`text-2xl font-bold flex items-center ${printerMode ? 'text-black' : 'text-white'}`}>
            <BookOpen className="mr-2" /> Rules Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${printerMode ? 'bg-white border-black' : 'bg-slate-800 border-slate-700'}`}>
              <h3 className={`font-bold mb-3 border-b pb-2 flex items-center ${printerMode ? 'text-black border-black' : 'text-white border-slate-600'}`}>
                <Skull size={16} className="mr-2" /> Conditions
              </h3>
              <div className="space-y-3 h-64 overflow-y-auto custom-scrollbar pr-2">
                {RULES_SRD.conditions.map((r, i) => (
                  <div key={i}>
                    <span className={`font-bold text-sm ${printerMode ? 'text-black' : 'text-amber-400'}`}>{r.title}: </span>
                    <span className="text-sm opacity-80">{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${printerMode ? 'bg-white border-black' : 'bg-slate-800 border-slate-700'}`}>
              <h3 className={`font-bold mb-3 border-b pb-2 flex items-center ${printerMode ? 'text-black border-black' : 'text-white border-slate-600'}`}>
                <Flame size={16} className="mr-2" /> Saves & Magic
              </h3>
              <div className="space-y-2 h-64 overflow-y-auto custom-scrollbar pr-2">
                {RULES_SRD.saves.map((r, i) => (
                  <div key={i} className="text-sm pl-2 border-l border-slate-600 mt-1">
                    <span className={`font-bold ${printerMode ? 'text-black' : 'text-blue-400'}`}>{r.title}</span>
                    <span className="opacity-80 text-xs"> - {r.text}</span>
                  </div>
                ))}
                {RULES_SRD.magic.map((r, i) => (
                  <div key={i} className="text-sm pl-2 border-l border-slate-600 mt-1">
                    <span className={`font-bold ${printerMode ? 'text-black' : 'text-purple-400'}`}>{r.title}</span>
                    <span className="opacity-80 text-xs"> - {r.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${printerMode ? 'bg-white border-black' : 'bg-slate-800 border-slate-700'}`}>
              <h3 className={`font-bold mb-3 border-b pb-2 flex items-center ${printerMode ? 'text-black border-black' : 'text-white border-slate-600'}`}>
                <Brain size={16} className="mr-2" /> Basics
              </h3>
              <div className="space-y-2 h-64 overflow-y-auto custom-scrollbar pr-2">
                {RULES_SRD.basics.map((r, i) => (
                  <div key={i} className="text-sm">
                    <div className={printerMode ? 'font-bold text-black' : 'font-bold text-emerald-400'}>{r.title}</div>
                    <div className="opacity-80 text-xs">{r.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </main>

  {/* Bottom Navigation */}
  <nav className={`safe-area-bottom ${printerMode ? 'bg-gray-100 border-t-2 border-black' : 'bg-slate-900 border-t border-slate-800'}`}>
    <div className="max-w-md mx-auto flex justify-around p-2">
      {[
        { id: 'party', icon: Users, label: 'Party' },
        { id: 'encounters', icon: Swords, label: 'Battle' },
        { id: 'dice', icon: Dices, label: 'Dice' },
        { id: 'compendium', icon: Skull, label: 'Data' },
        { id: 'notes', icon: Scroll, label: 'Notes' },
        { id: 'rules', icon: BookOpen, label: 'Rules' },
      ].map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id)}
          className={`flex flex-col items-center p-2 rounded w-12 transition-colors ${activeTab === t.id ? (printerMode ? 'bg-gray-300 text-black' : 'bg-slate-800 text-amber-500') : 'opacity-50 hover:opacity-75'
            }`}>
          <t.icon size={20} />
          <span className="text-[9px] mt-1 font-bold">{t.label}</span>
        </button>
      ))}
    </div>
  </nav>

  <style jsx>{`
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.3);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(100, 116, 139, 0.5);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(100, 116, 139, 0.7);
    }
  `}</style>
</div>
);
}