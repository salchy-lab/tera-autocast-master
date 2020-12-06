const ABNORMALITIES_BUFF = [10152340, 10152342, 401300, 10151010, 10151011, 10151012, 10151013, 10151015, 10151016, 10151017, 10151018, 10151019, 10151025,
	10151026, 10155130, 10155131, 10155514, 10155030, 10156006, 10156010, 10155031, 10156007, 10156011, 200700, 200701, 200731, 200732, 201903, 201904,
	201905, 201906, 10154480, 201600, 99008300, 300800, 300801, 300805, 300806, 300808, 300809, 300850, 100800, 100801, 100811, 100812, 105307, 602221,
	501602, 501603, 501604, 501605, 502074, 503061, 503071, 503072, 10153040, 10153041, 10153042, 10153044, 10153561, 10153571
];
module.exports = function SalchyAutoCast(script) {
	
	let config= reloadModule('./config.js');
	let skills= reloadModule('./skills.js');
	
	let job;
	let model;
	
	let cid;
	let myPosition = null;
	let myAngle = null;
	let monsters = [];
	let bosses = [];
	let people = [];
	let party = [];
	let targets_to_lock = [];
	let targetcast;
	let aimloc;
	let targeted = false;
	

	let sorc_job = 4;
	let priest_job = 6;
	let mystic_job = 7;

	let sorc_enab = false;
	let priest_enab = false;
	let mystic_enab = false;
	
	let enabled = config[0].enabled;
	let focusplayer = config[0].focusplayer;
	let players_to_focus = config[0].players_to_focus;
	let pvp = config[0].pvp;
	let pve = config[0].pve;
	let autopull = config[0].autopull;
	let pull_dist = config[0].pull_dist;
	let autoplague = config[0].autoplague;
	let cast_dist = config[0].cast_dist;
	
	script.command.add('cast', () => {
		enabled = !enabled;
		script.command.message(`Salchy's auto cast script is now ${(enabled) ? 'en' : 'dis'}abled.`);
	})
	script.command.add('castpl', () => {
		autoplague = !autoplague;
		script.command.message(`Salchy's auto plague  is now ${(autoplague) ? 'en' : 'dis'}abled.`);
	})	
	script.command.add('castpu', () => {
		autopull = !autopull;
		script.command.message(`Salchy's auto pull  is now ${(autopull) ? 'en' : 'dis'}abled.`);
	})		
	script.command.add('castpvp', () => {
		pvp = true;
		pve = false;
		script.command.message(`Auto Cast PvP mode is now enabled.`);
	})
	script.command.add('castpve', () => {
		pve = true;
		pvp = false;
		script.command.message(`Auto Cast PvE mode is now enabled.`);
	})	
	script.command.add('castplayer', (arg) => {
		if(arg){
		players_to_focus = [];	
		players_to_focus.push(arg);
		script.command.message("Focusing player " + arg);
		} else {
		focusplayer = !focusplayer;
		script.command.message(`Auto Cast Focus player mode is now ${(focusplayer) ? 'en' : 'dis'}abled.`);
		}
	})

	script.command.add('castreload', () => {
		config= reloadModule('./config.js');
		
		enabled = config[0].enabled;
		focusplayer = config[0].focusplayer;
		players_to_focus = config[0].players_to_focus;
		pvp = config[0].pvp;
		pve = config[0].pve;
		autopull = config[0].autopull;
		pull_dist = config[0].pull_dist;
		autoplague = config[0].autoplague;		
		cast_dist = config[0].cast_dist;	
		
		script.command.message(`Auto Cast Configuration reloaded.`);
	})	
	
	script.hook('S_LOGIN', 14, (packet) => {
	cid = packet.gameId;
		model = packet.templateId;
		job = (model - 10101) % 100;
		sorc_enab = [sorc_job].includes(job);
		priest_enab = [priest_job].includes(job);
		mystic_enab = [mystic_job].includes(job);
	})
	script.hook('S_LOAD_TOPO', 3, packet => {
		monsters = [];
		bosses = [];
		people = [];
		targeted = false;
	});	
	script.hook('C_START_SKILL', 7, (packet) => {
			if(!enabled) return;
			let sInfo = getSkillInfo(packet.skill.id);
				for (let s = 0; s < skills.length; s++) {
					if (skills[s].group == sInfo.group && skills[s].job == job && skills[s].enabled) {
						let max_targets = Number(skills[s].max_targets);
						let max_distance = Number(skills[s].max_distance);
						script.toServer('C_START_SKILL', 7, packet);
						targets_to_lock = [];
						if (targeted && (aimloc.dist3D(myPosition) / 25) <= max_distance ) targets_to_lock.push({ gameId: targetcast })
						if(pvp){
							for (let i = 0, n = people.length; i < n; i++) {
								if ((people[i].loc.dist3D(myPosition) / 25) > max_distance ) continue;
								if (people[i].gameId == targetcast) continue;
								targets_to_lock.push({ gameId: people[i].gameId });
								if(targets_to_lock.length == max_targets) break;
							}
							if (targets_to_lock.length > 0) {
								for (let i = 0, n = targets_to_lock.length; i < n; i++) {
									setTimeout(() => {
										script.send('C_CAN_LOCKON_TARGET', 3, {target: targets_to_lock[i].gameId, skill: packet.skill.id});
									}, 0);
								}						
							}
						}
						if(pve){
							for (let i = 0, n = monsters.length; i < n; i++) {
								if ((monsters[i].loc.dist3D(myPosition) / 25) > max_distance ) continue;
								if (monsters[i].gameId == targetcast) continue;
								targets_to_lock.push({ gameId: monsters[i].gameId });
								if(targets_to_lock.length == max_targets) break;
							}
							if (targets_to_lock.length > 0) {
								for (let i = 0, n = targets_to_lock.length; i < n; i++) {
									setTimeout(() => {
										script.send('C_CAN_LOCKON_TARGET', 3, {target: targets_to_lock[i].gameId, skill: packet.skill.id});
									}, 0);
								}						
							}
						}						
						packet.skill.id = packet.skill.id + 10;
						setTimeout(function () {
							script.toServer('C_START_SKILL', 7, packet);
						}, 10);
						return false;						
					}
				}				
	})	
	script.hook('C_PLAYER_LOCATION', 5, (packet) => {
		myPosition = packet.loc;
		myAngle = packet.w;
	})
	script.hook('S_SPAWN_NPC', 11, packet => {
		monsters.push({ gameId: packet.gameId, loc: packet.loc });
	})
	script.hook('S_BOSS_GAGE_INFO', 3, packet => {
		let boss = bosses.find(m => m.gameId === packet.id);
		if(boss) return;
		let monster = monsters.find(m => m.gameId === packet.id);
		if (monster) {
			bosses.push({ gameId: monster.gameId, loc: monster.loc });			
		}
	})
	script.hook('S_SPAWN_USER', 16, (packet) => {
		if (party.length != 0) {
			let member = party.find(m => m.gameId == packet.gameId);
			if (member) {
				member.gameId = packet.gameId;
				member.loc = packet.loc;
				return;
			}
		}
		people.push({
			gameId: packet.gameId,
			loc: packet.loc,
			w: packet.w,
			guild: packet.guildName,
			name: packet.name,
			weapon: packet.weapon
		})
		if(focusplayer && players_to_focus.includes(packet.name)) {
		targetcast = packet.gameId;
		aimloc = packet.loc;
		}
	})	

	script.hook('S_USER_LOCATION', 5, (packet) => {
		let member = party.find(m => m.gameId === packet.gameId);
		if (member) member.loc = packet.loc;
		let jugador = people.find(m => m.gameId === packet.gameId);
		if (jugador) jugador.loc = packet.loc;
		if(packet.gameId == targetcast) {
		aimloc = packet.loc;
		}
	});	
	script.hook('S_NPC_LOCATION', 3, packet => {
		let monster = monsters.find(m => m.gameId === packet.gameId);
		if (monster) monster.loc = packet.loc;		
		let boss = bosses.find(m => m.gameId === packet.gameId);
		if (boss) boss.loc = packet.loc;
		if(packet.gameId == targetcast) {
		aimloc = packet.loc;
		}		
	})
	script.hook('S_DESPAWN_NPC', 3, packet => {
		monsters = monsters.filter(m => m.gameId != packet.gameId);
		bosses = bosses.filter(m => m.gameId != packet.gameId);	
		if(packet.gameId == targetcast) targeted = false;
	})
	script.hook('S_DESPAWN_USER', 3, (packet) => {
		people = people.filter(m => m.gameId != packet.gameId);
		if(packet.gameId == targetcast) targeted = false;
	})	
	script.hook('S_ACTION_STAGE', 9, packet => {
		let monster = monsters.find(m => m.gameId === packet.gameId);
		if (monster) monster.loc = packet.loc;		
		let boss = bosses.find(m => m.gameId === packet.gameId);
		if (boss) boss.loc = packet.loc;		
		let jugador = people.find(m => m.gameId === packet.gameId);
		if (jugador) jugador.loc = packet.loc;	
		if(packet.gameId == targetcast) {
		aimloc = packet.loc;
		}		
		
	})
	script.hook('S_ACTION_END', 5, packet => {
		let monster = monsters.find(m => m.gameId === packet.gameId);
		if (monster) monster.loc = packet.loc;		
		let boss = bosses.find(m => m.gameId === packet.gameId);
		if (boss) boss.loc = packet.loc;
		let jugador = people.find(m => m.gameId === packet.gameId);
		if (jugador) jugador.loc = packet.loc;	
		if(packet.gameId == targetcast) {
		aimloc = packet.loc;
		}		
	})
	script.hook('S_PARTY_MEMBER_LIST', 7, (packet) => {
		const copy = party;
		party = packet.members.filter(m => m.playerId != script.game.me.playerId);
		if (copy) {
			for (let i = 0; i < party.length; i++) {
				const copyMember = copy.find(m => m.playerId == party[i].playerId);
				if (copyMember) {
					party[i].gameId = copyMember.gameId;
					if (copyMember.loc) party[i].loc = copyMember.loc;
				}
			}
		}
	})
	script.hook('S_LEAVE_PARTY', 1, (packet) => {
		party = [];
	})
	script.hook('S_LEAVE_PARTY_MEMBER', 2, (packet) => {
		party = party.filter(m => m.playerId != packet.playerId);
	})	
	function reloadModule(mod_to_reload){
		delete require.cache[require.resolve(mod_to_reload)]
		console.log('Salchy Auto Cast: Reloading ' + mod_to_reload + "...");
		return require(mod_to_reload)
	}

	script.hook('S_EACH_SKILL_RESULT', 14, packet => {
		if (!enabled) return;
		if(packet.type != 1) return;
		if ((packet.source == cid) && (packet.target != cid)) {
				if(pvp) {
					let jugador = people.find(m => m.gameId === packet.target);
					if (jugador) {
						if(focusplayer && !players_to_focus.includes(jugador.name)) return;
						targetcast = packet.target;
						aimloc = jugador.loc;
						targeted = true;
					}
				}
			if(pve) {	
				let monster = monsters.find(m => m.gameId === packet.target);
				if (monster) {
					targetcast = packet.target;
					aimloc = monster.loc;
					targeted = true;
				}
			}
		}
		if ((packet.owner == cid) && (packet.target != cid)) {
			if(pvp) {
				let jugador = people.find(m => m.gameId === packet.target);
				if (jugador) {
					if(focusplayer && !players_to_focus.includes(jugador.name)) return;
					targetcast = packet.target;
					aimloc = jugador.loc;
					targeted = true;
				}
			}
			if(pve) {	
				let monster = monsters.find(m => m.gameId === packet.target);
				if (monster) {
					targetcast = packet.target;
					aimloc = monster.loc;
					targeted = true;
				}
			}
		}
		if (((packet.owner != cid) && (packet.source != cid) && (packet.target == cid))) {
			if(pvp) {
				let jugador = people.find(m => m.gameId === packet.source);
				if (jugador) {
					if(focusplayer && !players_to_focus.includes(jugador.name)) return;
					targetcast = packet.source;
					aimloc = jugador.loc;
					targeted = true;
				}
				else {
					let jugadorOw = people.find(m => m.gameId === packet.owner);
					if (jugadorOw) {
						if(focusplayer && !players_to_focus.includes(jugadorOw.name)) return;
						targetcast = packet.owner;
						aimloc = jugadorOw.loc;
						targeted = true;
					}
				}
			}
			if(pve) {
				let monster = monsters.find(m => m.gameId === packet.source);
				if (monster) {
					targetcast = packet.source;
					aimloc = monster.loc;
					targeted = true;
				}
				else {
					let monsterOw = monsters.find(m => m.gameId === packet.owner);
					if (monsterOw) {
						targetcast = packet.owner;
						aimloc = monsterOw.loc;
						targeted = true;
					}
				}
				let boss = bosses.find(m => m.gameId === packet.source);
				if (boss) {
					targetcast = packet.source;
					aimloc = boss.loc;
					targeted = true;
				}
				else {
					let bossOw = bosses.find(m => m.gameId === packet.owner);
					if (bossOw) {
						targetcast = packet.owner;
						aimloc = bossOw.loc;
						targeted = true;
					}
				}	
			}			
		}
		if ((packet.target != cid) && packet.reaction.enable && priest_enab && autopull) {
			let member = party.find(m => m.gameId == packet.target);
			if (member) {
				if ((member.loc.dist3D(myPosition) / 25) > pull_dist ) return;
				let packet_divine = {
					skill: {
						reserved: 0,
						npc: false,
						type: 1,
						huntingZoneId: 0,
						id: 410200
					},
					w: myAngle,
					loc: myPosition,
					dest: {
						x: 0,
						y: 0,
						z: 0
					},
					unk: true,
					moving: false,
					continue: false,
					target: 0,
					unk2: false
				}
				let packet_divine_locked = {
					skill: {
						reserved: 0,
						npc: false,
						type: 1,
						huntingZoneId: 0,
						id: 410210
					},
					w: myAngle,
					loc: myPosition,
					dest: {
						x: 0,
						y: 0,
						z: 0
					},
					unk: true,
					moving: false,
					continue: false,
					target: packet.target,
					unk2: false
				}
				script.send("S_CUSTOM_STYLE_SYSTEM_MESSAGE", 1, {
					message: ("Pulling party member"),
					style: 54
				});
				script.send("S_PLAY_SOUND", 1, {
					SoundID: 2023
				});				
				script.toServer('C_START_SKILL', 7, packet_divine);
				setTimeout(function () {script.toServer('C_CAN_LOCKON_TARGET', 3, {
					target: packet.target,
					unk: "0",
					skill: 410200
				});},20)
				setTimeout(function () {script.toServer('C_START_SKILL', 7, packet_divine_locked);},40)
			}
		}
	})
	script.hook('S_START_COOLTIME_SKILL', 3, packet => {
		if (packet.skill.id == 300800 && priest_enab && autoplague) {
			autoplague = false;
			setTimeout(function () {
				autoplague = true;
			}, packet.cooldown);
		}
		if (packet.skill.id == 410200 && priest_enab && autopull) {
			autopull = false;
			setTimeout(function () {
				autopull = true;
			}, packet.cooldown);
		}
	})
	script.hook('S_ABNORMALITY_BEGIN', 4, packet => {	
	if (!enabled) return;
	if(!priest_enab) return;
		if(ABNORMALITIES_BUFF.includes(packet.id) && priest_enab && autoplague && (packet.target != cid) && (packet.source != cid)) {
			let jugador = people.find(m => m.gameId === packet.target);
			if (jugador) {
				if ((jugador.loc.dist3D(myPosition) / 25) <= cast_dist ) {
					targetcast = packet.target;
					aimloc = jugador.loc;
					targeted = true;
					let plague_packet = {
						skill: {
							reserved: 0,
							npc: false,
							type: 1,
							huntingZoneId: 0,
							id: 300800
						},
						w: myAngle,
						loc: myPosition,
						dest: aimloc,
						unk: true,
						moving: false,
						continue: false,
						target: targetcast,
						unk2: false
					}
					script.toServer('C_START_SKILL', 7, plague_packet);
					setTimeout(function () {
						script.toServer('C_CAN_LOCKON_TARGET', 3, {
							target: targetcast,
							unk: "0",
							skill: 300800
						});
					}, 0);
					let targets_to_plague = [];
					for (let i = 0, n = people.length; i < n; i++) {
						if ((people[i].loc.dist3D(myPosition) / 25) > cast_dist ) continue;
						if (people[i].gameId == targetcast) continue;
						targets_to_plague.push({ gameId: people[i].gameId })
						if(targets_to_plague.length == 3) break;
					}
					if (targets_to_plague.length > 0) {
						for (let i = 0, n = targets_to_plague.length; i < n; i++) {
							setTimeout(() => {
								script.send('C_CAN_LOCKON_TARGET', 3, {target: targets_to_plague[i].gameId, skill: 300800});
							}, 0);
						}				
					}
					
					let plague_packet_locked = {
						skill: {
							reserved: 0,
							npc: false,
							type: 1,
							huntingZoneId: 0,
							id: 300810
						},
						w: myAngle,
						loc: myPosition,
						dest: aimloc,
						unk: true,
						moving: false,
						continue: false,
						target: targetcast,
						unk2: false
					}
					setTimeout(function () {
						script.toServer('C_START_SKILL', 7, plague_packet_locked);
					}, 20);
				}
			}
		}	
	})
	script.hook('S_ABNORMALITY_REFRESH', 2, packet => {	
	if (!enabled) return;
	if(!priest_enab) return;
		if(ABNORMALITIES_BUFF.includes(packet.id) && priest_enab && autoplague && (packet.target != cid) && (packet.source != cid)) {
			let jugador = people.find(m => m.gameId === packet.target);
			if (jugador) {
				if ((jugador.loc.dist3D(myPosition) / 25) <= cast_dist ) {
					targetcast = packet.target;
					aimloc = jugador.loc;
					targeted = true;
					let plague_packet = {
						skill: {
							reserved: 0,
							npc: false,
							type: 1,
							huntingZoneId: 0,
							id: 300800
						},
						w: myAngle,
						loc: myPosition,
						dest: aimloc,
						unk: true,
						moving: false,
						continue: false,
						target: targetcast,
						unk2: false
					}
					script.toServer('C_START_SKILL', 7, plague_packet);
					setTimeout(function () {
						script.toServer('C_CAN_LOCKON_TARGET', 3, {
							target: targetcast,
							unk: "0",
							skill: 300800
						});
					}, 0);
					let targets_to_plague = [];
					for (let i = 0, n = people.length; i < n; i++) {
						if ((people[i].loc.dist3D(myPosition) / 25) > cast_dist ) continue;
						if (people[i].gameId == targetcast) continue;
						targets_to_plague.push({ gameId: people[i].gameId })
						if(targets_to_plague.length == 3) break;
					}
					if (targets_to_plague.length > 0) {
						for (let i = 0, n = targets_to_plague.length; i < n; i++) {
							setTimeout(() => {
								script.send('C_CAN_LOCKON_TARGET', 3, {target: targets_to_plague[i].gameId, skill: 300800});
							}, 0);
						}				
					}
					
					let plague_packet_locked = {
						skill: {
							reserved: 0,
							npc: false,
							type: 1,
							huntingZoneId: 0,
							id: 300810
						},
						w: myAngle,
						loc: myPosition,
						dest: aimloc,
						unk: true,
						moving: false,
						continue: false,
						target: targetcast,
						unk2: false
					}
					setTimeout(function () {
						script.toServer('C_START_SKILL', 7, plague_packet_locked);
					}, 20);
				}
			}
		}	
	})
    function getSkillInfo(id) {
		let nid = id;
        return {
            id: nid,
            group: Math.floor(nid / 10000),
            level: Math.floor(nid / 100) % 100,
            sub: nid % 100
        };
    }	
	
}
