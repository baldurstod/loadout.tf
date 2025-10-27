import demoman from '../../../img/class/demoman.png';
import engineer from '../../../img/class/engineer.png';
import heavy from '../../../img/class/heavy.png';
import medic from '../../../img/class/medic.png';
import pyro from '../../../img/class/pyro.png';
import scout from '../../../img/class/scout.png';
import sniper from '../../../img/class/sniper.png';
import soldier from '../../../img/class/soldier.png';
import spy from '../../../img/class/spy.png';

export enum Tf2Class {
	Scout = 0,
	Sniper = 1,
	Soldier = 2,
	Demoman = 3,
	Medic = 4,
	Heavy = 5,
	Pyro = 6,
	Spy = 7,
	Engineer = 8,

	ScoutBot = 100,
	SniperBot = 101,
	SoldierBot = 102,
	DemomanBot = 103,
	MedicBot = 104,
	HeavyBot = 105,
	PyroBot = 106,
	SpyBot = 107,
	EngineerBot = 108,

	Random = 1000,
	None = 1001,
}

export type CharactersType = { name: string, path: string, bot: boolean, icon: string };
export const CharactersList = new Map<Tf2Class, CharactersType>([
	[Tf2Class.Scout, { name: 'scout', bot: false, path: 'models/player/scout', icon: scout, }],
	[Tf2Class.Sniper, { name: 'sniper', bot: false, path: 'models/player/sniper', icon: sniper, }],
	[Tf2Class.Soldier, { name: 'soldier', bot: false, path: 'models/player/soldier', icon: soldier, }],
	[Tf2Class.Demoman, { name: 'demoman', bot: false, path: 'models/player/demo', icon: demoman, }],
	[Tf2Class.Medic, { name: 'medic', bot: false, path: 'models/player/medic', icon: medic, }],
	[Tf2Class.Heavy, { name: 'heavy', bot: false, path: 'models/player/heavy', icon: heavy, }],
	[Tf2Class.Pyro, { name: 'pyro', bot: false, path: 'models/player/pyro', icon: pyro, }],
	[Tf2Class.Spy, { name: 'spy', bot: false, path: 'models/player/spy', icon: spy, }],
	[Tf2Class.Engineer, { name: 'engineer', bot: false, path: 'models/player/engineer', icon: engineer, }],

	[Tf2Class.ScoutBot, { name: 'scout', bot: true, path: 'models/bots/scout/bot_scout', icon: scout, }],
	[Tf2Class.SniperBot, { name: 'sniper', bot: true, path: 'models/bots/sniper/bot_sniper', icon: sniper, }],
	[Tf2Class.SoldierBot, { name: 'soldier', bot: true, path: 'models/bots/soldier/bot_soldier', icon: soldier, }],
	[Tf2Class.DemomanBot, { name: 'demoman', bot: true, path: 'models/bots/demo/bot_demo', icon: demoman, }],
	[Tf2Class.MedicBot, { name: 'medic', bot: true, path: 'models/bots/medic/bot_medic', icon: medic, }],
	[Tf2Class.HeavyBot, { name: 'heavy', bot: true, path: 'models/bots/heavy/bot_heavy', icon: heavy, }],
	[Tf2Class.PyroBot, { name: 'pyro', bot: true, path: 'models/bots/pyro/bot_pyro', icon: pyro, }],
	[Tf2Class.SpyBot, { name: 'spy', bot: true, path: 'models/bots/spy/bot_spy', icon: spy, }],
	[Tf2Class.EngineerBot, { name: 'engineer', bot: true, path: 'models/bots/engineer/bot_engineer', icon: engineer, }],

	[Tf2Class.None, { name: 'dummy', bot: false, path: 'models/empty', icon: engineer, }],
]);

export const ClassRemovablePartsOff = ['heavy_hand_dex_bodygroup', 'robotarm_bodygroup', 'darts_bodygroup', 'spyMask', 'rocket', 'medal_bodygroup', 'demo_smiley'];
