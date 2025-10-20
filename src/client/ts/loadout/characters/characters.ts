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
}

export type CharactersType = { name: string, model: string, bot: boolean, icon: string };
export const CharactersList = new Map<Tf2Class, CharactersType>([
	[Tf2Class.Scout, { name: 'Scout', bot: false, model: 'models/player/scout', icon: scout, }],
	[Tf2Class.Sniper, { name: 'Sniper', bot: false, model: 'models/player/sniper', icon: sniper, }],
	[Tf2Class.Soldier, { name: 'Soldier', bot: false, model: 'models/player/soldier', icon: soldier, }],
	[Tf2Class.Demoman, { name: 'Demoman', bot: false, model: 'models/player/demo', icon: demoman, }],
	[Tf2Class.Medic, { name: 'Medic', bot: false, model: 'models/player/medic', icon: medic, }],
	[Tf2Class.Heavy, { name: 'Heavy', bot: false, model: 'models/player/heavy', icon: heavy, }],
	[Tf2Class.Pyro, { name: 'Pyro', bot: false, model: 'models/player/pyro', icon: pyro, }],
	[Tf2Class.Spy, { name: 'Spy', bot: false, model: 'models/player/spy', icon: spy, }],
	[Tf2Class.Engineer, { name: 'Engineer', bot: false, model: 'models/player/engineer', icon: engineer, }],

	[Tf2Class.ScoutBot, { name: 'Scout', bot: true, model: 'models/bots/scout/bot_scout', icon: scout, }],
	[Tf2Class.SniperBot, { name: 'Sniper', bot: true, model: 'models/bots/sniper/bot_sniper', icon: sniper, }],
	[Tf2Class.SoldierBot, { name: 'Soldier', bot: true, model: 'models/bots/soldier/bot_soldier', icon: soldier, }],
	[Tf2Class.DemomanBot, { name: 'Demoman', bot: true, model: 'models/bots/demo/bot_demo', icon: demoman, }],
	[Tf2Class.MedicBot, { name: 'Medic', bot: true, model: 'models/bots/medic/bot_medic', icon: medic, }],
	[Tf2Class.HeavyBot, { name: 'Heavy', bot: true, model: 'models/bots/heavy/bot_heavy', icon: heavy, }],
	[Tf2Class.PyroBot, { name: 'Pyro', bot: true, model: 'models/bots/pyro/bot_pyro', icon: pyro, }],
	[Tf2Class.SpyBot, { name: 'Spy', bot: true, model: 'models/bots/spy/bot_spy', icon: spy, }],
	[Tf2Class.EngineerBot, { name: 'Engineer', bot: true, model: 'models/bots/engineer/bot_engineer', icon: engineer, }],
]);
