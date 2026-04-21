'use strict';

// ─── Utilities ────────────────────────────────────────────────────────────────

const d6 = () => Math.floor(Math.random() * 6) + 1;

function buildAdj(spaces, edges) {
  for (const id of Object.keys(spaces)) spaces[id].adj = [];
  for (const [a, b] of edges) { spaces[a].adj.push(b); spaces[b].adj.push(a); }
}

// Returns the 3 ways to split [d0,d1,d2,d3] into 2 pairs.
// Each entry: { t1, t2, d1a, d1b, d2a, d2b }
function pairSplits(w) {
  return [
    { t1: w[0]+w[1], t2: w[2]+w[3], d1:[w[0],w[1]], d2:[w[2],w[3]] },
    { t1: w[0]+w[2], t2: w[1]+w[3], d1:[w[0],w[2]], d2:[w[1],w[3]] },
    { t1: w[0]+w[3], t2: w[1]+w[2], d1:[w[0],w[3]], d2:[w[1],w[2]] },
  ];
}

// ─── Adventure Builders ───────────────────────────────────────────────────────

function buildAnimals() {
  const spaces = {
    startL:  {id:'startL',  num:null,type:'start',   label:'S'},
    startR:  {id:'startR',  num:null,type:'start',   label:'S'},
    f2a:     {id:'f2a',     num:2,   type:'fist',    label:'2'},
    r2a:     {id:'r2a',     num:2,   type:'regular', label:'2'},
    r3a:     {id:'r3a',     num:3,   type:'regular', label:'3'},
    f4a:     {id:'f4a',     num:4,   type:'fist',    label:'4'},
    r4a:     {id:'r4a',     num:4,   type:'regular', label:'4'},
    r5a:     {id:'r5a',     num:5,   type:'regular', label:'5'},
    r6a:     {id:'r6a',     num:6,   type:'regular', label:'6'},
    f6a:     {id:'f6a',     num:6,   type:'fist',    label:'6'},
    r7a:     {id:'r7a',     num:7,   type:'regular', label:'7'},
    r8a:     {id:'r8a',     num:8,   type:'regular', label:'8'},
    f8a:     {id:'f8a',     num:8,   type:'fist',    label:'8'},
    r9a:     {id:'r9a',     num:9,   type:'regular', label:'9'},
    r10a:    {id:'r10a',    num:10,  type:'regular', label:'10'},
    r11a:    {id:'r11a',    num:11,  type:'regular', label:'11'},
    f10a:    {id:'f10a',    num:10,  type:'fist',    label:'10'},
    r12a:    {id:'r12a',    num:12,  type:'regular', label:'12'},
    f12a:    {id:'f12a',    num:12,  type:'fist',    label:'12'},
    gold1a:  {id:'gold1a',  num:5,   type:'gold',    label:'5'},
    gold2a:  {id:'gold2a',  num:6,   type:'gold',    label:'6'},
    gem1a:   {id:'gem1a',   num:9,   type:'gem',     label:'9'},
    gem2a:   {id:'gem2a',   num:12,  type:'gem',     label:'12'},
    chest1a: {id:'chest1a', num:10,  type:'treasure',label:'10'},
  };
  buildAdj(spaces, [
    ['startL','r2a'],['startL','r7a'],['startL','r9a'],
    ['startR','r4a'],['startR','r6a'],['startR','r8a'],
    ['f2a','startL'],['f2a','r2a'],['f2a','r3a'],
    ['r2a','r3a'],
    ['r3a','r5a'],['r3a','r7a'],
    ['f4a','startR'],['f4a','r4a'],['f4a','r5a'],
    ['r4a','r6a'],
    ['r5a','f6a'],['r5a','r7a'],['r5a','gold1a'],
    ['r6a','f6a'],['r6a','r10a'],['r6a','gold2a'],
    ['f6a','r7a'],['f6a','r8a'],
    ['r8a','f8a'],['r8a','r10a'],
    ['f8a','r9a'],['f8a','r10a'],['f8a','r12a'],
    ['r9a','r11a'],['r9a','gem1a'],
    ['r10a','r12a'],['r10a','chest1a'],
    ['r11a','f10a'],['r11a','r12a'],
    ['f10a','r9a'],['f10a','r12a'],
    ['r12a','f12a'],
    ['f12a','gem2a'],
  ]);
  const monsters = {
    greyWolf:   {id:'greyWolf',  name:'Grey Wolf',       hp:3,  black:[2],    white:[10],   accessFrom:['r2a'],        unlockFrom:'r10a',gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    buffHound:  {id:'buffHound', name:'Buff Hound',       hp:4,  black:[8,10], white:[],     accessFrom:['r8a','r10a'], unlockFrom:null,  gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    primalHare: {id:'primalHare',name:'Primal Hare',      hp:3,  black:[3],    white:[11],   accessFrom:['r3a'],        unlockFrom:'r11a',gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    savageBoar: {id:'savageBoar',name:'Savage Boar',      hp:5,  black:[9,11], white:[],     accessFrom:['r9a','r11a'], unlockFrom:null,  gemFirst:2,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    primalWolf: {id:'primalWolf',name:'Primal Wolf',      hp:4,  black:[4],    white:[6],    accessFrom:['r4a'],        unlockFrom:'r6a', gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    barryBoss:  {id:'barryBoss', name:'Barry Bearcub',    hp:12, black:[7],    white:[9,11], accessFrom:['r7a','r11a'], unlockFrom:'f10a',gemFirst:5,gemSub:3,lifeLoss:0,isBoss:true, isArmored:false},
  };
  const nodes = {
    startL:{x:60,y:200}, startR:{x:60,y:400},
    f2a:{x:155,y:105},   r2a:{x:160,y:195},
    r3a:{x:258,y:115},   f4a:{x:155,y:325},
    r4a:{x:160,y:405},   r5a:{x:262,y:218},
    r6a:{x:258,y:375},   f6a:{x:362,y:295},
    r7a:{x:358,y:178},   r8a:{x:362,y:395},
    f8a:{x:458,y:348},   r9a:{x:458,y:178},
    r10a:{x:462,y:408},  r11a:{x:558,y:178},
    f10a:{x:558,y:295},  r12a:{x:558,y:388},
    f12a:{x:648,y:242},  gold1a:{x:278,y:158},
    gold2a:{x:162,y:455},gem1a:{x:540,y:118},
    gem2a:{x:678,y:312}, chest1a:{x:592,y:455},
  };
  const mNodes = {
    greyWolf:{x:205,y:55},   buffHound:{x:432,y:460},
    primalHare:{x:318,y:58}, savageBoar:{x:642,y:432},
    primalWolf:{x:80,y:462}, barryBoss:{x:678,y:178},
  };
  return {
    key:'animals', name:'Annoyed Animals', difficulty:'Novice', color:'#7a9b5c',
    starts:['startL','startR'], spaces, monsters, nodes, mNodes,
    achievements:{
      startsLinked:{label:'Connect both Starts via visited path',done:false,gemFirst:1,gemSub:0,type:'path'},
      fist5of6:{label:'5 of 6 Fist spaces',count:0,threshold:5,total:6,done:false,gemFirst:3,gemSub:1,type:'count'},
    },
  };
}

function buildCultists() {
  const spaces = {
    start:   {id:'start',   num:null,type:'start',   label:'S'},
    r2c:     {id:'r2c',     num:2,   type:'regular', label:'2'},
    rub2c:   {id:'rub2c',   num:2,   type:'rubble',  label:'2'},
    rub3c:   {id:'rub3c',   num:3,   type:'rubble',  label:'3'},
    r4c:     {id:'r4c',     num:4,   type:'regular', label:'4'},
    r5c:     {id:'r5c',     num:5,   type:'regular', label:'5'},
    rub5c:   {id:'rub5c',   num:5,   type:'rubble',  label:'5'},
    r6c:     {id:'r6c',     num:6,   type:'regular', label:'6'},
    rub7c:   {id:'rub7c',   num:7,   type:'rubble',  label:'7'},
    r7c:     {id:'r7c',     num:7,   type:'regular', label:'7'},
    r8c:     {id:'r8c',     num:8,   type:'regular', label:'8'},
    rub9c:   {id:'rub9c',   num:9,   type:'rubble',  label:'9'},
    r9c:     {id:'r9c',     num:9,   type:'regular', label:'9'},
    rub10c:  {id:'rub10c',  num:10,  type:'rubble',  label:'10'},
    r10c:    {id:'r10c',    num:10,  type:'regular', label:'10'},
    r11c:    {id:'r11c',    num:11,  type:'regular', label:'11'},
    r12c:    {id:'r12c',    num:12,  type:'regular', label:'12'},
    rub12c:  {id:'rub12c',  num:12,  type:'rubble',  label:'12'},
    gold1c:  {id:'gold1c',  num:4,   type:'gold',    label:'4'},
    gem1c:   {id:'gem1c',   num:8,   type:'gem',     label:'8'},
    gem2c:   {id:'gem2c',   num:11,  type:'gem',     label:'11'},
    chest1c: {id:'chest1c', num:6,   type:'treasure',label:'6'},
  };
  buildAdj(spaces, [
    ['start','r2c'],['start','r4c'],['start','rub3c'],
    ['r2c','rub2c'],['r2c','r4c'],
    ['rub2c','rub3c'],['rub2c','r6c'],
    ['rub3c','r5c'],['rub3c','r10c'],
    ['r4c','gold1c'],['r4c','r6c'],['r4c','rub5c'],
    ['rub5c','r5c'],['rub5c','rub7c'],
    ['r5c','r7c'],['r5c','r8c'],['r5c','gem1c'],
    ['r6c','r7c'],['r6c','rub7c'],['r6c','chest1c'],
    ['rub7c','r7c'],['rub7c','r8c'],
    ['r7c','r8c'],['r7c','r11c'],
    ['r8c','rub10c'],['r8c','r9c'],
    ['rub10c','r10c'],['rub10c','r11c'],
    ['r9c','rub9c'],['r9c','r12c'],
    ['rub9c','r12c'],['rub9c','r11c'],
    ['r10c','r11c'],
    ['r11c','r12c'],['r11c','gem2c'],
    ['r12c','rub12c'],
  ]);
  const monsters = {
    forlornPhantom:{id:'forlornPhantom',name:'Forlorn Phantom',    hp:3, black:[3],   white:[9],  accessFrom:['rub3c'],       unlockFrom:'r9c', gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    necroMancer:   {id:'necroMancer',   name:'Necro Mancer',       hp:4, black:[4,6], white:[],   accessFrom:['r4c','r6c'],   unlockFrom:null,  gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    conjuringOp:   {id:'conjuringOp',   name:'Conjuring Operator', hp:4, black:[8],   white:[10], accessFrom:['r8c'],         unlockFrom:'r10c',gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    pastryMancer:  {id:'pastryMancer',  name:'Pastry Mancer',      hp:5, black:[5,7], white:[],   accessFrom:['r5c','r7c'],   unlockFrom:null,  gemFirst:2,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    ghastlyWarden: {id:'ghastlyWarden', name:'Ghastly Warden',     hp:4, black:[6],   white:[8],  accessFrom:['r6c'],         unlockFrom:'r8c', gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    sirPhrim:      {id:'sirPhrim',      name:'Sir Phrim the Fine', hp:3, black:[9],   white:[11], accessFrom:['r9c'],         unlockFrom:'r11c',gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    derekBoss:     {id:'derekBoss',     name:'Derek the Observer', hp:12,black:[7],   white:[5,9],accessFrom:['r7c','r9c'],   unlockFrom:'r5c', gemFirst:5,gemSub:3,lifeLoss:0,isBoss:true, isArmored:false},
  };
  const nodes = {
    start:{x:60,y:280},
    r2c:{x:158,y:200},  rub2c:{x:158,y:295},
    rub3c:{x:158,y:375},r4c:{x:258,y:162},
    gold1c:{x:258,y:82},r5c:{x:258,y:255},
    rub5c:{x:355,y:178},r6c:{x:258,y:358},
    chest1c:{x:162,y:438},r7c:{x:358,y:262},
    rub7c:{x:358,y:358},r8c:{x:458,y:232},
    gem1c:{x:358,y:445},rub9c:{x:558,y:382},
    r9c:{x:458,y:342}, rub10c:{x:558,y:278},
    r10c:{x:458,y:142},r11c:{x:558,y:182},
    gem2c:{x:642,y:122},r12c:{x:558,y:462},
    rub12c:{x:642,y:432},
  };
  const mNodes = {
    forlornPhantom:{x:90,y:432}, necroMancer:{x:190,y:82},
    conjuringOp:{x:528,y:82},    pastryMancer:{x:418,y:82},
    ghastlyWarden:{x:192,y:432}, sirPhrim:{x:638,y:372},
    derekBoss:{x:678,y:232},
  };
  return {
    key:'cultists', name:'Clumsy Cultists', difficulty:'Easy', color:'#6b9bb5',
    starts:['start'], spaces, monsters, nodes, mNodes,
    achievements:{
      bothMancers:{label:'Defeat Pastry Mancer + Necro Mancer',progress:new Set(),threshold:2,done:false,gemFirst:1,gemSub:0,type:'set',targets:['pastryMancer','necroMancer']},
      rubble6of7: {label:'6 of 7 Rubble spaces',count:0,threshold:6,total:7,done:false,gemFirst:3,gemSub:1,type:'count'},
    },
  };
}

function buildPyramid() {
  // cl1p-cl8p: Cloud spaces; player assigns [3,4,5,6,8,9,10,11] at start.
  // cloudGate: auto-visited when the cloud assigned 11 is crossed; gates right side.
  const spaces = {
    start:      {id:'start',      num:null,type:'start',   label:'S'},
    r3p:        {id:'r3p',        num:3,   type:'regular', label:'3'},
    r4p:        {id:'r4p',        num:4,   type:'regular', label:'4'},
    r5p:        {id:'r5p',        num:5,   type:'regular', label:'5'},
    r7p:        {id:'r7p',        num:7,   type:'regular', label:'7'},
    r8p:        {id:'r8p',        num:8,   type:'regular', label:'8'},
    r9p:        {id:'r9p',        num:9,   type:'regular', label:'9'},
    r10p:       {id:'r10p',       num:10,  type:'regular', label:'10'},
    r11p:       {id:'r11p',       num:11,  type:'regular', label:'11'},
    r12p:       {id:'r12p',       num:12,  type:'regular', label:'12'},
    worm1p:     {id:'worm1p',     num:4,   type:'worm',    label:'4'},
    worm2p:     {id:'worm2p',     num:7,   type:'worm',    label:'7'},
    worm3p:     {id:'worm3p',     num:9,   type:'worm',    label:'9'},
    cl1p:       {id:'cl1p',       num:null,type:'cloud',   label:'?'},
    cl2p:       {id:'cl2p',       num:null,type:'cloud',   label:'?'},
    cl3p:       {id:'cl3p',       num:null,type:'cloud',   label:'?'},
    cl4p:       {id:'cl4p',       num:null,type:'cloud',   label:'?'},
    cl5p:       {id:'cl5p',       num:null,type:'cloud',   label:'?'},
    cl6p:       {id:'cl6p',       num:null,type:'cloud',   label:'?'},
    cl7p:       {id:'cl7p',       num:null,type:'cloud',   label:'?'},
    cl8p:       {id:'cl8p',       num:null,type:'cloud',   label:'?'},
    cloudGate:  {id:'cloudGate',  num:null,type:'gateway', label:''},
    r6pR:       {id:'r6pR',       num:6,   type:'regular', label:'6'},
    r10pR:      {id:'r10pR',      num:10,  type:'regular', label:'10'},
    r12pR:      {id:'r12pR',      num:12,  type:'regular', label:'12'},
    gold1p:     {id:'gold1p',     num:3,   type:'gold',    label:'3'},
    gold2p:     {id:'gold2p',     num:10,  type:'gold',    label:'10'},
    gem1p:      {id:'gem1p',      num:5,   type:'gem',     label:'5'},
    gem2p:      {id:'gem2p',      num:12,  type:'gem',     label:'12'},
    chest1p:    {id:'chest1p',    num:8,   type:'treasure',label:'8'},
  };
  buildAdj(spaces, [
    ['start','r3p'],['start','cl1p'],['start','r4p'],
    ['r3p','cl1p'],['r3p','r7p'],['r3p','gold1p'],
    ['r4p','worm1p'],['r4p','cl2p'],['r4p','r5p'],
    ['cl1p','r7p'],['cl1p','cl2p'],
    ['r5p','gem1p'],['r5p','r8p'],['r5p','cl3p'],
    ['cl2p','r9p'],['cl2p','r7p'],
    ['r7p','cl3p'],['r7p','r9p'],
    ['cl3p','r8p'],['cl3p','worm2p'],
    ['r8p','r9p'],['r8p','cl4p'],
    ['r9p','cl4p'],['r9p','r10p'],['r9p','worm3p'],
    ['r10p','cl5p'],['r10p','gold2p'],
    ['cl4p','r10p'],['cl4p','cl5p'],
    ['cl5p','r11p'],['cl5p','cloudGate'],
    ['r11p','chest1p'],['r11p','r12p'],
    ['r12p','gem2p'],
    ['cloudGate','r6pR'],['cloudGate','cl6p'],
    ['r6pR','cl6p'],['r6pR','r10pR'],
    ['cl6p','r10pR'],['cl6p','cl7p'],
    ['r10pR','cl7p'],['r10pR','cl8p'],
    ['cl7p','r12pR'],['cl7p','cl8p'],
    ['cl8p','r12pR'],
  ]);
  const monsters = {
    anubis:      {id:'anubis',     name:'Anubis, Master of Naps',  hp:4, black:[3,9],white:[],     accessFrom:['r3p','r9p'],  unlockFrom:null,   gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    sandyNap:    {id:'sandyNap',   name:"Sandy's Nap",              hp:3, black:[4],  white:[10],   accessFrom:['r4p'],        unlockFrom:'r10p', gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    sandySprint: {id:'sandySprint',name:"Sandy's Sprint",           hp:4, black:[6],  white:[12],   accessFrom:['r6pR'],       unlockFrom:'r12pR',gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    kahmak:      {id:'kahmak',     name:'Kahmak, Master of Treats', hp:5, black:[5,7],white:[],     accessFrom:['r5p','r7p'],  unlockFrom:null,   gemFirst:2,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    sandyBoss:   {id:'sandyBoss',  name:'Sandy (Boss)',              hp:12,black:[8],  white:[10,12],accessFrom:['r10p','r10pR'],unlockFrom:'cl8p', gemFirst:5,gemSub:3,lifeLoss:0,isBoss:true, isArmored:false},
  };
  const nodes = {
    start:{x:60,y:248},
    r3p:{x:158,y:152},  gold1p:{x:158,y:82},
    cl1p:{x:158,y:248}, r4p:{x:158,y:345},
    worm1p:{x:158,y:432},
    r5p:{x:258,y:392},  gem1p:{x:182,y:452},
    cl2p:{x:258,y:212}, r7p:{x:258,y:142},
    cl3p:{x:358,y:282}, r8p:{x:358,y:382},
    worm2p:{x:358,y:462},
    cl4p:{x:458,y:302}, r9p:{x:358,y:192},
    worm3p:{x:458,y:422},r10p:{x:458,y:182},
    gold2p:{x:542,y:142},cl5p:{x:558,y:262},
    r11p:{x:558,y:372}, chest1p:{x:638,y:402},
    r12p:{x:638,y:312}, gem2p:{x:698,y:372},
    cloudGate:{x:632,y:232},
    r6pR:{x:698,y:142}, cl6p:{x:698,y:82},
    r10pR:{x:720,y:212},cl7p:{x:760,y:158},
    cl8p:{x:760,y:252}, r12pR:{x:760,y:332},
  };
  const mNodes = {
    anubis:{x:88,y:432},      sandyNap:{x:90,y:82},
    sandySprint:{x:738,y:462},kahmak:{x:318,y:82},
    sandyBoss:{x:718,y:432},
  };
  return {
    key:'pyramid', name:'Puzzled Pyramid', difficulty:'Standard', color:'#c4a557',
    starts:['start'], spaces, monsters, nodes, mNodes,
    cloudPool:[3,4,5,6,8,9,10,11],
    cloudSpaces:['cl1p','cl2p','cl3p','cl4p','cl5p','cl6p','cl7p','cl8p'],
    achievements:{
      allClouds:{label:'All 8 Cloud spaces visited',count:0,threshold:8,done:false,gemFirst:3,gemSub:1,type:'count'},
      allWorms: {label:'All 3 Worm spaces defeated', count:0,threshold:3,done:false,gemFirst:1,gemSub:0,type:'count'},
    },
  };
}

function buildDefiant() {
  const spaces = {
    start:   {id:'start',   num:null,type:'start',   label:'S'},
    r2d:     {id:'r2d',     num:2,   type:'regular', label:'2'},
    r3d:     {id:'r3d',     num:3,   type:'regular', label:'3'},
    r4d:     {id:'r4d',     num:4,   type:'regular', label:'4'},
    r5d:     {id:'r5d',     num:5,   type:'regular', label:'5'},
    r6d:     {id:'r6d',     num:6,   type:'regular', label:'6'},
    r7d:     {id:'r7d',     num:7,   type:'regular', label:'7'},
    r8d:     {id:'r8d',     num:8,   type:'regular', label:'8'},
    r9d:     {id:'r9d',     num:9,   type:'regular', label:'9'},
    r10d:    {id:'r10d',    num:10,  type:'regular', label:'10'},
    r11d:    {id:'r11d',    num:11,  type:'regular', label:'11'},
    r12d:    {id:'r12d',    num:12,  type:'regular', label:'12'},
    claw3d:  {id:'claw3d',  num:3,   type:'claw',    label:'3', clawUnlocks:{monsterId:'diplocaulus',number:6}},
    claw4d:  {id:'claw4d',  num:4,   type:'claw',    label:'4', clawUnlocks:{monsterId:'triTrex',    number:5}},
    claw5d:  {id:'claw5d',  num:5,   type:'claw',    label:'5', clawUnlocks:{monsterId:'bossKing',   number:7}},
    claw6d:  {id:'claw6d',  num:6,   type:'claw',    label:'6', clawUnlocks:{monsterId:'velociraptor',number:8}},
    claw7d:  {id:'claw7d',  num:7,   type:'claw',    label:'7', clawUnlocks:{monsterId:'thug',       number:9}},
    claw8d:  {id:'claw8d',  num:8,   type:'claw',    label:'8', clawUnlocks:{monsterId:'ankylosaur', number:11}},
    claw10d: {id:'claw10d', num:10,  type:'claw',    label:'10',clawUnlocks:{monsterId:'spinosaurus',number:12}},
    gold1d:  {id:'gold1d',  num:6,   type:'gold',    label:'6'},
    gold2d:  {id:'gold2d',  num:9,   type:'gold',    label:'9'},
    gem1d:   {id:'gem1d',   num:4,   type:'gem',     label:'4'},
    gem2d:   {id:'gem2d',   num:11,  type:'gem',     label:'11'},
    chest1d: {id:'chest1d', num:7,   type:'treasure',label:'7'},
  };
  buildAdj(spaces, [
    ['start','claw3d'],['start','claw4d'],['start','claw6d'],['start','r3d'],
    ['r3d','claw3d'],['r3d','r5d'],['r3d','r7d'],
    ['claw3d','r5d'],
    ['claw4d','r4d'],['claw4d','r5d'],
    ['r4d','r6d'],['r4d','gem1d'],
    ['r5d','claw5d'],['r5d','r7d'],
    ['claw5d','r7d'],['claw5d','r9d'],
    ['r6d','claw6d'],['r6d','r8d'],['r6d','gold1d'],
    ['claw6d','r8d'],
    ['r7d','r9d'],['r7d','claw7d'],['r7d','chest1d'],
    ['claw7d','r9d'],['claw7d','r11d'],
    ['r8d','claw8d'],['r8d','r10d'],
    ['claw8d','r10d'],['claw8d','r12d'],
    ['r9d','r11d'],['r9d','gold2d'],
    ['r10d','r12d'],['r10d','claw10d'],
    ['claw10d','r12d'],
    ['r11d','r12d'],['r11d','gem2d'],
    ['r12d','r2d'],
    ['r2d','r12d'],
  ]);
  const monsters = {
    velociraptor:{id:'velociraptor',name:'Velociraptor', hp:3, black:[5],    white:[8],    accessFrom:['r5d'],        unlockFrom:'r8d', gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    diplocaulus: {id:'diplocaulus', name:'Diplocaulus',  hp:4, black:[3],    white:[6],    accessFrom:['r3d'],        unlockFrom:'r6d', gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    triTrex:     {id:'triTrex',     name:'Tri-Plate Rex',hp:4, black:[4],    white:[5],    accessFrom:['r4d'],        unlockFrom:'r5d', gemFirst:2,gemSub:1,lifeLoss:0,isBoss:false,isArmored:true},
    thug:        {id:'thug',        name:'The Thug',     hp:5, black:[7],    white:[9],    accessFrom:['r7d'],        unlockFrom:'r9d', gemFirst:2,gemSub:1,lifeLoss:0,isBoss:false,isArmored:true},
    ankylosaur:  {id:'ankylosaur',  name:'Ankylosaur',   hp:4, black:[10],   white:[11],   accessFrom:['r10d'],       unlockFrom:'r11d',gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    spinosaurus: {id:'spinosaurus', name:'Spinosaurus',  hp:5, black:[10],   white:[12],   accessFrom:['r10d'],       unlockFrom:'r12d',gemFirst:2,gemSub:1,lifeLoss:0,isBoss:false,isArmored:true},
    bossKing:    {id:'bossKing',    name:'King Rex',     hp:12,black:[2,12], white:[7,9],  accessFrom:['r12d','r2d'], unlockFrom:'r11d',gemFirst:5,gemSub:3,lifeLoss:0,isBoss:true, isArmored:false},
  };
  const nodes = {
    start:{x:60,y:418},
    claw3d:{x:158,y:462},claw4d:{x:258,y:462},
    claw6d:{x:158,y:378},r3d:{x:158,y:292},
    r4d:{x:258,y:372},   gem1d:{x:258,y:462},
    r5d:{x:258,y:292},   claw5d:{x:358,y:352},
    r6d:{x:158,y:202},   gold1d:{x:82,y:202},
    r7d:{x:358,y:252},   claw7d:{x:458,y:312},
    chest1d:{x:438,y:152},
    r8d:{x:258,y:202},   claw8d:{x:358,y:162},
    r9d:{x:458,y:212},   gold2d:{x:558,y:252},
    r10d:{x:358,y:122},  claw10d:{x:458,y:82},
    r11d:{x:558,y:152},  gem2d:{x:638,y:112},
    r12d:{x:558,y:252},  r2d:{x:658,y:212},
  };
  const mNodes = {
    velociraptor:{x:318,y:442}, diplocaulus:{x:80,y:362},
    triTrex:{x:318,y:462},      thug:{x:538,y:412},
    ankylosaur:{x:438,y:452},   spinosaurus:{x:438,y:182},
    bossKing:{x:718,y:182},
  };
  return {
    key:'defiant', name:'Defiant Dinosaurs', difficulty:'Expert', color:'#d4832f',
    starts:['start'], spaces, monsters, nodes, mNodes,
    achievements:{
      armoredTrio:{label:'Defeat 3 Armored Dinosaurs',count:0,threshold:3,done:false,gemFirst:1,gemSub:0,type:'count'},
      claw6of7:   {label:'6 of 7 Claw spaces visited',count:0,threshold:6,total:7,done:false,gemFirst:3,gemSub:1,type:'count'},
    },
  };
}

const ADVENTURES = {
  animals:  buildAnimals(),
  cultists: buildCultists(),
  pyramid:  buildPyramid(),
  defiant:  buildDefiant(),
};

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  screen: 'setup',
  adventure: null,
  life: 10, maxLife: 10, extraLife: 0,
  blackDieUses: 3,
  gems: 0, gold: 0, torches: 0,
  visitedSpaces: new Set(),
  rubbleProgress: {},
  cloudAssignments: {},
  cloudSetupSelected: null,
  monsterState: {},
  bossDamageDealt: 0,
  achievementState: {},
  phase: 'roll',
  whiteDice: [0,0,0,0],
  blackDie: 0,
  selectedSplit: null,
  useBlackDieInPair: null,
  pairs: null,
  pairActions: [null, null],
  currentPair: 0,
  roundDamageDealt: false,
  damageExemptForfeit: false,
  pendingChest: null,
  message: '',
};

function initGame(advKey) {
  const adv = ADVENTURES[advKey];
  Object.assign(state, {
    screen: 'playing',
    adventure: advKey,
    life: 10, maxLife: 10, extraLife: 0,
    blackDieUses: 3,
    gems: 0, gold: 0, torches: 0,
    visitedSpaces: new Set(adv.starts),
    rubbleProgress: {},
    cloudAssignments: {},
    cloudSetupSelected: null,
    bossDamageDealt: 0,
    phase: advKey === 'pyramid' ? 'cloudSetup' : 'roll',
    whiteDice: [0,0,0,0], blackDie: 0,
    selectedSplit: null, useBlackDieInPair: null,
    pairs: null, pairActions: [null, null],
    currentPair: 0,
    roundDamageDealt: false, damageExemptForfeit: false,
    pendingChest: null,
    message: advKey === 'pyramid'
      ? 'Assign numbers 3,4,5,6,8,9,10,11 to the Cloud spaces before starting.'
      : `Welcome to ${adv.name}! Roll the dice to begin.`,
  });
  const monsterState = {};
  for (const [id, m] of Object.entries(adv.monsters)) {
    monsterState[id] = { health: m.hp, unlockedWhite: new Set(), defeated: false, totalDamage: 0 };
  }
  state.monsterState = monsterState;
  const achievementState = {};
  for (const [id, a] of Object.entries(adv.achievements)) {
    achievementState[id] = { done: false, count: a.count ?? 0, progress: a.progress instanceof Set ? new Set() : false };
  }
  state.achievementState = achievementState;
  render();
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

function getAdv() { return ADVENTURES[state.adventure]; }

function spaceNum(spaceId) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];
  if (sp.type === 'cloud') return state.cloudAssignments[spaceId] ?? null;
  return sp.num;
}

function isVisited(spaceId) { return state.visitedSpaces.has(spaceId); }

function hasAdjacentVisited(spaceId) {
  const adv = getAdv();
  return adv.spaces[spaceId].adj.some(id => state.visitedSpaces.has(id));
}

function canVisitSpace(spaceId, pair) {
  if (isVisited(spaceId)) {
    if (getAdv().spaces[spaceId].type === 'rubble' && (state.rubbleProgress[spaceId] ?? 0) < 1) return false;
    if (getAdv().spaces[spaceId].type !== 'rubble') return false;
    if ((state.rubbleProgress[spaceId] ?? 0) >= 2) return false;
  }
  const sp = getAdv().spaces[spaceId];
  if (sp.type === 'gateway') return false;
  const num = spaceNum(spaceId);
  if (num === null && sp.type !== 'start') return false;
  if (sp.type !== 'start' && num !== pair.total) return false;
  if (sp.type === 'fist' && pair.dice[0] !== pair.dice[1]) return false;
  if (sp.type !== 'start' && !hasAdjacentVisited(spaceId)) return false;
  return true;
}

function canAttackMonster(monsterId, pair) {
  const adv = getAdv();
  const m = adv.monsters[monsterId];
  const ms = state.monsterState[monsterId];
  if (ms.defeated) return false;
  if (!m.accessFrom.some(sid => isVisited(sid))) return false;
  const validNums = [...m.black, ...m.white.filter(n => ms.unlockedWhite.has(n))];
  if (!validNums.includes(pair.total)) return false;
  return true;
}

function getValidSpaces(pair) {
  const adv = getAdv();
  return Object.keys(adv.spaces).filter(id => canVisitSpace(id, pair));
}

function getAttackableMonsters(pair) {
  const adv = getAdv();
  return Object.keys(adv.monsters).filter(id => canAttackMonster(id, pair));
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function rollDice() {
  state.whiteDice = [d6(), d6(), d6(), d6()];
  state.blackDie = d6();
  state.selectedSplit = null;
  state.useBlackDieInPair = null;
  state.pairs = null;
  state.pairActions = [null, null];
  state.currentPair = 0;
  state.roundDamageDealt = false;
  state.damageExemptForfeit = false;
  state.phase = 'selectSplit';
  state.message = `Rolled: [${state.whiteDice.join(',')}] + black [${state.blackDie}]. Choose how to pair your white dice.`;
  render();
}

function selectSplit(splitIdx) {
  const splits = pairSplits(state.whiteDice);
  state.selectedSplit = splitIdx;
  const s = splits[splitIdx];
  state.pairs = [
    { dice: s.d1.slice(), total: s.t1, used: false, forfeited: false },
    { dice: s.d2.slice(), total: s.t2, used: false, forfeited: false },
  ];
  state.useBlackDieInPair = null;
  state.phase = 'confirmPairs';
  state.message = `Pairs: [${state.pairs[0].dice}]=${state.pairs[0].total} and [${state.pairs[1].dice}]=${state.pairs[1].total}. Use black die (${state.blackDie}) or confirm.`;
  render();
}

function swapBlackDie(pairIdx, dieIdx) {
  const s = pairSplits(state.whiteDice)[state.selectedSplit];
  const base = pairIdx === 0 ? s.d1.slice() : s.d2.slice();
  if (state.blackDieUses <= 0) return;
  base[dieIdx] = state.blackDie;
  state.pairs[pairIdx] = { dice: base, total: base[0] + base[1], used: false, forfeited: false };
  state.useBlackDieInPair = pairIdx;
  state.message = `Black die swapped into Pair ${pairIdx+1}: [${state.pairs[pairIdx].dice}]=${state.pairs[pairIdx].total}.`;
  render();
}

function confirmPairs() {
  if (state.useBlackDieInPair !== null) state.blackDieUses--;
  state.currentPair = 0;
  state.phase = 'assignPair';
  state.message = `Assign Pair 1: total ${state.pairs[0].total}. Visit a space or attack a monster.`;
  render();
}

function assignToSpace(spaceId) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];
  const pair = state.pairs[state.currentPair];
  if (!canVisitSpace(spaceId, pair)) return;

  if (sp.type === 'rubble') {
    const prog = state.rubbleProgress[spaceId] ?? 0;
    if (prog < 1) {
      state.rubbleProgress[spaceId] = 1;
      state.message = `First cross on Rubble space ${spaceId}. One more to complete it.`;
    } else if (prog === 1) {
      state.rubbleProgress[spaceId] = 2;
      state.visitedSpaces.add(spaceId);
      triggerSpaceEffects(spaceId);
      state.message = `Rubble space ${spaceId} cleared!`;
    }
  } else {
    state.visitedSpaces.add(spaceId);
    triggerSpaceEffects(spaceId);
    state.message = `Visited space ${sp.label}${sp.type === 'gold' ? ' — +1 Gold!' : sp.type === 'gem' ? ' — +1 Gem!' : ''}`;
  }

  pair.used = true;
  advancePair();
}

function triggerSpaceEffects(spaceId) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];

  if (sp.type === 'gold') state.gold++;
  if (sp.type === 'gem') state.gems++;
  if (sp.type === 'treasure') { state.pendingChest = spaceId; }

  // Unlock white numbers for any monster whose unlockFrom = this space
  for (const [mid, m] of Object.entries(adv.monsters)) {
    if (m.unlockFrom === spaceId) {
      for (const n of m.white) state.monsterState[mid].unlockedWhite.add(n);
    }
  }

  // Claw spaces: unlock specific monster white number
  if (sp.type === 'claw' && sp.clawUnlocks) {
    const ms = state.monsterState[sp.clawUnlocks.monsterId];
    if (ms) ms.unlockedWhite.add(sp.clawUnlocks.number);
  }

  // Cloud gateway: if this is the cloud assigned 11
  if (sp.type === 'cloud' && state.cloudAssignments[spaceId] === 11) {
    state.visitedSpaces.add('cloudGate');
  }

  // Fist spaces: deal 1 damage to all monsters on the map
  if (sp.type === 'fist') {
    for (const [mid, ms] of Object.entries(state.monsterState)) {
      if (!ms.defeated) {
        dealDamage(mid, 1, true);
      }
    }
    checkAchievement('fist5of6', spaceId);
  }

  // Worm spaces: deal 3 damage to boss
  if (sp.type === 'worm') {
    const bossId = Object.keys(adv.monsters).find(id => adv.monsters[id].isBoss);
    if (bossId) dealDamage(bossId, 3, false);
    checkAchievement('allWorms', spaceId);
  }

  // Cloud spaces: track for achievement
  if (sp.type === 'cloud') checkAchievement('allClouds', spaceId);

  // Claw spaces: track for achievement
  if (sp.type === 'claw') checkAchievement('claw6of7', spaceId);

  // Annoyed Animals: check if both starts are now connected
  if (state.adventure === 'animals') checkStartsConnected();

  // Rubble achievement
  if (sp.type === 'rubble') checkAchievement('rubble6of7', spaceId);
}

function assignToMonster(monsterId) {
  const pair = state.pairs[state.currentPair];
  const adv = getAdv();
  const m = adv.monsters[monsterId];
  if (!canAttackMonster(monsterId, pair)) return;

  if (m.isArmored) {
    // Armored: must use both pairs simultaneously
    const otherPair = state.pairs[state.currentPair === 0 ? 1 : 0];
    if (otherPair.used || otherPair.forfeited) {
      state.message = `${m.name} is Armored — both pairs must be used together, but pair ${state.currentPair === 0 ? 2 : 1} is already used.`;
      render(); return;
    }
    if (!canAttackMonster(monsterId, otherPair)) {
      state.message = `${m.name} is Armored — both pairs must match its numbers. Pair ${state.currentPair === 0 ? 2 : 1} total ${otherPair.total} doesn't match.`;
      render(); return;
    }
    dealDamage(monsterId, 2, false);
    state.pairs[0].used = true;
    state.pairs[1].used = true;
    state.currentPair = 2; // skip to end
  } else {
    dealDamage(monsterId, 1, false);
    pair.used = true;
    advancePair();
    return;
  }
  endRound();
}

function dealDamage(monsterId, amount, fromFist) {
  const adv = getAdv();
  const m = adv.monsters[monsterId];
  const ms = state.monsterState[monsterId];
  if (ms.defeated) return;
  ms.health = Math.max(0, ms.health - amount);
  ms.totalDamage += amount;
  if (m.isBoss) state.bossDamageDealt += amount;
  if (!fromFist) state.roundDamageDealt = true;
  if (ms.health <= 0) defeatMonster(monsterId);
}

function defeatMonster(monsterId) {
  const adv = getAdv();
  const m = adv.monsters[monsterId];
  const ms = state.monsterState[monsterId];
  ms.defeated = true;
  state.gems += m.gemFirst;
  if (m.lifeLoss > 0) loseLife(m.lifeLoss);
  if (m.isBoss) {
    state.bossDamageDealt = ms.totalDamage;
  }
  // Defiant Dinosaurs: track armored defeats for achievement
  if (m.isArmored) checkAchievement('armoredTrio', monsterId);
  // Cultists: track mancer defeats
  if (state.adventure === 'cultists') checkAchievement('bothMancers', monsterId);
  checkGameEnd();
}

function forfeitPair() {
  const pair = state.pairs[state.currentPair];
  pair.forfeited = true;
  if (state.roundDamageDealt) {
    state.damageExemptForfeit = true;
  }
  advancePair();
}

function advancePair() {
  if (state.currentPair === 0) {
    state.currentPair = 1;
    const p = state.pairs[1];
    state.message = `Assign Pair 2: total ${p.total}. Visit a space or attack a monster.`;
    if (state.pendingChest) { openChest(); return; }
    render();
  } else {
    if (state.pendingChest) { openChest(); return; }
    endRound();
  }
}

function openChest() {
  state.phase = 'chest';
  state.message = 'Treasure chest! Choose a reward:';
  render();
}

function chooseChestReward(reward) {
  if (reward === 'life') {
    state.extraLife += 3;
    state.gems++;
    state.message = '+3 Extra Life and 1 Gem!';
  } else if (reward === 'torch') {
    state.torches += 2;
    state.message = '+2 Torches!';
  } else if (reward === 'blackdie') {
    state.blackDieUses += 3;
    state.message = '+3 Black Die uses!';
  }
  state.pendingChest = null;
  const done0 = state.pairs[0].used || state.pairs[0].forfeited;
  const done1 = state.pairs[1].used || state.pairs[1].forfeited;
  if (!done0 || !done1) {
    state.phase = 'assignPair';
    render();
  } else {
    endRound();
  }
}

function useTorch() {
  if (state.torches <= 0) return;
  state.torches--;
  state.phase = 'torch';
  state.message = 'Torch: select any space adjacent to a visited space.';
  render();
}

function assignTorchToSpace(spaceId) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];
  if (isVisited(spaceId)) return;
  if (!hasAdjacentVisited(spaceId)) return;
  if (sp.type === 'gateway') return;
  state.visitedSpaces.add(spaceId);
  triggerSpaceEffects(spaceId);
  state.message = `Torch: visited space ${sp.label}.`;
  const done0 = state.pairs[0].used || state.pairs[0].forfeited;
  const done1 = state.pairs[1].used || state.pairs[1].forfeited;
  state.phase = (!done0 || !done1) ? 'assignPair' : 'assignPair';
  render();
}

function endRound() {
  state.phase = 'roll';
  const penalties = [];

  // Solo damage rule
  if (!state.roundDamageDealt && !state.damageExemptForfeit) {
    loseLife(1);
    penalties.push('–1 life (no damage dealt this round)');
  }

  // Unused pair penalties
  for (let i = 0; i < 2; i++) {
    const p = state.pairs[i];
    if (p.forfeited && !(i === 1 && state.damageExemptForfeit)) {
      loseLife(1);
      penalties.push(`–1 life (Pair ${i+1} forfeited)`);
    }
  }

  if (checkDeath()) return;

  const penMsg = penalties.length ? ' ' + penalties.join('; ') + '.' : '';
  state.message = `Round over.${penMsg} Roll for next round.`;
  render();
}

function loseLife(n) {
  for (let i = 0; i < n; i++) {
    if (state.extraLife > 0) state.extraLife--;
    else state.life--;
  }
}

function checkDeath() {
  if (state.life <= 0) {
    state.screen = 'gameover';
    state.message = 'You have fallen in the dungeon!';
    render();
    return true;
  }
  return false;
}

function checkGameEnd() {
  const adv = getAdv();
  const allDefeated = Object.values(state.monsterState).every(ms => ms.defeated);
  if (allDefeated) {
    state.screen = 'victory';
    render();
  }
}

function checkAchievement(key, triggerId) {
  const adv = getAdv();
  const ach = adv.achievements[key];
  if (!ach) return;
  const as = state.achievementState[key];
  if (!as || as.done) return;

  if (ach.type === 'count') {
    as.count++;
    if (as.count >= ach.threshold) {
      as.done = true;
      state.gems += ach.gemFirst;
      state.message += ` Achievement: ${ach.label}! +${ach.gemFirst} gem(s).`;
    }
  } else if (ach.type === 'set') {
    as.progress.add(triggerId);
    if (as.progress.size >= ach.threshold) {
      as.done = true;
      state.gems += ach.gemFirst;
      state.message += ` Achievement: ${ach.label}! +${ach.gemFirst} gem(s).`;
    }
  } else if (ach.type === 'path') {
    // handled separately
  }
}

function checkStartsConnected() {
  const adv = getAdv();
  const as = state.achievementState['startsLinked'];
  if (!as || as.done) return;
  // BFS from startL to startR through visited spaces
  if (!isVisited('startL') || !isVisited('startR')) return;
  const visited = new Set(['startL']);
  const queue = ['startL'];
  while (queue.length) {
    const curr = queue.shift();
    if (curr === 'startR') {
      as.done = true;
      state.gems += adv.achievements.startsLinked.gemFirst;
      state.message += ' Achievement: Starts connected! +1 gem.';
      return;
    }
    for (const nbr of adv.spaces[curr].adj) {
      if (!visited.has(nbr) && state.visitedSpaces.has(nbr)) {
        visited.add(nbr);
        queue.push(nbr);
      }
    }
  }
}

// Pyramid cloud setup
function cloudSetupSelect(spaceId) {
  state.cloudSetupSelected = spaceId;
  render();
}

function cloudSetupAssign(num) {
  if (!state.cloudSetupSelected) return;
  const pool = remainingCloudPool();
  if (!pool.includes(num)) return;
  const prev = state.cloudAssignments[state.cloudSetupSelected];
  if (prev !== undefined) {
    // already assigned; do nothing (player must deselect)
  } else {
    state.cloudAssignments[state.cloudSetupSelected] = num;
  }
  state.cloudSetupSelected = null;
  const adv = getAdv();
  if (Object.keys(state.cloudAssignments).length === adv.cloudSpaces.length) {
    state.phase = 'roll';
    state.message = `Welcome to ${adv.name}! Roll the dice to begin.`;
  }
  render();
}

function cloudSetupClear(spaceId) {
  delete state.cloudAssignments[spaceId];
  state.cloudSetupSelected = null;
  render();
}

function remainingCloudPool() {
  const adv = getAdv();
  const used = new Set(Object.values(state.cloudAssignments));
  return adv.cloudPool.filter(n => !used.has(n));
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function render() {
  const app = document.getElementById('app');
  if (state.screen === 'setup') {
    app.style.setProperty('--theme-color', '#d4832f');
    app.innerHTML = renderSetup();
  } else if (state.screen === 'playing') {
    const adv = getAdv();
    app.style.setProperty('--theme-color', adv.color);
    app.innerHTML = renderGame();
  } else if (state.screen === 'victory') {
    app.innerHTML = renderVictory();
  } else if (state.screen === 'gameover') {
    app.innerHTML = renderGameOver();
  }
  attachListeners();
}

function renderSetup() {
  const btns = Object.values(ADVENTURES).map(adv => `
    <button class="realm-btn" data-realm="${adv.key}" style="border-color:${adv.color}">
      <div class="realm-title">${adv.name}</div>
      <div style="font-size:0.85em;color:#aaa;margin-top:6px">${adv.difficulty}</div>
    </button>`).join('');
  return `<div class="realm-selector">
    <h1>&#x1F3B2; Dungeons, Dice &amp; Danger &#x1F3B2;</h1>
    <p>Choose your adventure (Solo mode):</p>
    <div class="realm-grid">${btns}</div>
  </div>`;
}

function renderGame() {
  const adv = getAdv();
  return `<div class="game-container">
    ${renderHeader()}
    <div class="game-grid">
      <div class="left-panel">
        ${renderStatusCard()}
        ${renderMonsterPanel()}
        ${renderAchievements()}
      </div>
      <div class="center-panel">
        ${renderPhaseUI()}
        <div class="board-container">${renderSVGMap()}</div>
        <div class="message-box">${state.message}</div>
      </div>
    </div>
  </div>`;
}

function renderHeader() {
  const adv = getAdv();
  return `<div class="game-header">
    <h2>${adv.name} <span style="font-size:0.6em;color:#aaa">${adv.difficulty}</span></h2>
    <button class="quit-btn" data-action="quit">Exit Realm</button>
  </div>`;
}

function renderStatusCard() {
  const hearts = Array.from({length: state.maxLife}, (_, i) =>
    `<span class="${i < state.life ? 'heart-full' : 'heart-empty'}">&#x2665;</span>`
  ).join('');
  const extras = state.extraLife > 0 ? `<span style="color:#2ecc71"> +${state.extraLife}</span>` : '';
  const lifeTotal = state.life + state.extraLife;
  return `<div class="status-card">
    <div class="status-row"><span>&#x2764; Life:</span><span class="hearts">${hearts}${extras}</span></div>
    <div class="status-row"><span>&#x1F48E; Gems:</span><span class="gem-count">${state.gems}</span></div>
    <div class="status-row"><span>&#x1FAB6; Gold:</span><span>${state.gold}</span></div>
    <div class="status-row"><span>&#x1F3B2; Black Die:</span><span>${state.blackDieUses} uses</span></div>
    ${state.torches > 0 ? `<div class="status-row"><span>&#x1F525; Torches:</span><span>${state.torches}</span></div>` : ''}
    <div class="status-row"><span>&#x1F3C6; Score:</span><span>${calcScore()} VP</span></div>
  </div>`;
}

function renderMonsterPanel() {
  const adv = getAdv();
  const items = Object.values(adv.monsters).map(m => {
    const ms = state.monsterState[m.id];
    if (ms.defeated) return `<div class="monster-item defeated">&#x2713; ${m.name} (defeated)</div>`;
    const hasAccess = m.accessFrom.some(sid => isVisited(sid));
    const pct = (ms.health / m.hp) * 100;
    const accessLabel = hasAccess ? '' : ' <span style="color:#888;font-size:0.8em">(no access)</span>';
    const unlockedNums = [...m.black, ...m.white.filter(n => ms.unlockedWhite.has(n))];
    const whiteLabel = m.white.length ? ` | White: ${m.white.map(n => ms.unlockedWhite.has(n) ? `<b>${n}</b>` : `<span style="color:#888">${n}</span>`).join(',')}` : '';
    const attackBtns = getActivePairForUI() !== null && canAttackMonster(m.id, getActivePairForUI())
      ? `<button class="attack-btn" data-attack="${m.id}">Attack (${getActivePairForUI().total})</button>`
      : '';
    return `<div class="monster-item${m.isBoss ? ' boss-monster' : ''}">
      <div class="monster-name">${m.isBoss ? '&#x1F451; ' : ''}${m.name}${accessLabel}</div>
      <div class="monster-nums">Black: ${m.black.join(',')}${whiteLabel}</div>
      <div class="health-bar-visual"><div class="health-fill" style="width:${pct}%"></div></div>
      <div style="font-size:0.8em">${ms.health}/${m.hp} HP ${m.isArmored ? '<span style="color:#f1c40f">⚔ Armored</span>' : ''}</div>
      ${attackBtns}
    </div>`;
  }).join('');
  return `<div class="monster-panel"><h4>Monsters</h4>${items}</div>`;
}

function getActivePairForUI() {
  if (state.phase !== 'assignPair') return null;
  const p = state.pairs[state.currentPair];
  if (p.used || p.forfeited) return null;
  return p;
}

function renderAchievements() {
  const adv = getAdv();
  const items = Object.entries(adv.achievements).map(([key, ach]) => {
    const as = state.achievementState[key];
    const done = as?.done;
    let progress = '';
    if (ach.type === 'count' && ach.total) progress = ` (${as?.count ?? 0}/${ach.total})`;
    else if (ach.type === 'count') progress = as?.done ? '' : ` (${as?.count ?? 0}/${ach.threshold})`;
    else if (ach.type === 'set') progress = ` (${as?.progress?.size ?? 0}/${ach.threshold})`;
    return `<div class="achievement-row ${done ? 'done' : ''}">${done ? '&#x2713;' : '&#x25CB;'} ${ach.label}${progress}</div>`;
  }).join('');
  return `<div class="achievement-tracker"><h4>Achievements</h4>${items}</div>`;
}

function renderPhaseUI() {
  if (state.phase === 'cloudSetup') return renderCloudSetup();
  if (state.phase === 'chest') return renderChestModal();
  if (state.phase === 'torch') return renderTorchUI();

  const phaseLabels = {roll:'Roll Dice', selectSplit:'Choose Pairs', confirmPairs:'Confirm / Use Black Die', assignPair:'Assign Pairs'};
  const bar = `<div class="phase-bar">${Object.entries(phaseLabels).map(([k,v]) =>
    `<span class="phase-step ${state.phase===k||((k==='assignPair')&&state.phase==='assignPair')?'active':''}">${v}</span>`
  ).join(' &#x203A; ')}</div>`;

  if (state.phase === 'roll') {
    const torchBtn = state.torches > 0
      ? `<button class="action-btn" data-action="useTorch">Use Torch (${state.torches} left)</button>` : '';
    return `${bar}<div class="dice-section">
      <button class="roll-btn" data-action="roll">&#x1F3B2; Roll Dice</button>
      ${torchBtn}
    </div>`;
  }

  if (state.phase === 'selectSplit') {
    const splits = pairSplits(state.whiteDice);
    const splitBtns = splits.map((s, i) =>
      `<button class="split-option" data-split="${i}">[${s.d1}]=${s.t1} &amp; [${s.d2}]=${s.t2}</button>`
    ).join('');
    return `${bar}<div class="dice-section">
      <div class="dice-row">
        ${state.whiteDice.map(v => `<div class="die white">${v}</div>`).join('')}
        <div class="die black">${state.blackDie}</div>
      </div>
      <p style="margin:8px 0;color:#aaa">Choose a split:</p>
      <div class="split-grid">${splitBtns}</div>
    </div>`;
  }

  if (state.phase === 'confirmPairs') {
    const p = state.pairs;
    const blackUseButtons = state.blackDieUses > 0 ? `
      <div class="black-die-section">
        <p>Use Black Die [${state.blackDie}] — select a die to replace (${state.blackDieUses} uses left):</p>
        <div class="black-swap-grid">
          ${p[0].dice.map((v,i) => `<button class="swap-btn" data-bswap="0-${i}">Pair1 die${i+1}[${v}]→[${state.blackDie}]</button>`).join('')}
          ${p[1].dice.map((v,i) => `<button class="swap-btn" data-bswap="1-${i}">Pair2 die${i+1}[${v}]→[${state.blackDie}]</button>`).join('')}
        </div>
      </div>` : '';
    return `${bar}<div class="dice-section">
      <div class="pairs-display">
        <div class="pair-box">Pair 1: [${p[0].dice}] = ${p[0].total}</div>
        <div class="pair-box">Pair 2: [${p[1].dice}] = ${p[1].total}</div>
      </div>
      ${blackUseButtons}
      <button class="roll-btn" data-action="confirmPairs" style="margin-top:12px;font-size:1.1em;padding:12px 28px">Confirm Pairs</button>
    </div>`;
  }

  if (state.phase === 'assignPair') {
    const pIdx = state.currentPair;
    const pair = state.pairs[pIdx];
    const p0done = state.pairs[0].used || state.pairs[0].forfeited;
    const p1done = state.pairs[1].used || state.pairs[1].forfeited;
    const validSpaces = getValidSpaces(pair);
    const attackable = getAttackableMonsters(pair);
    const info = `<div class="pair-assign-header">
      <span>Pair ${pIdx+1}: [${pair.dice}] = <b>${pair.total}</b></span>
      <span style="color:#aaa;font-size:0.85em"> &nbsp;|&nbsp; Pair ${pIdx===0?2:1}: ${state.pairs[pIdx===0?1:0].total} ${p0done&&pIdx===1?'✓':p1done&&pIdx===0?'✓':''}</span>
    </div>`;
    const spaceHint = validSpaces.length > 0 ? `<span style="color:#2ecc71">${validSpaces.length} space(s) available — click on map</span>` : `<span style="color:#888">No matching spaces</span>`;
    const attackHint = attackable.length > 0 ? ` | <span style="color:#e74c3c">${attackable.length} monster(s) attackable</span>` : '';
    const forfeitBtn = `<button class="action-btn skip" data-action="forfeit">Forfeit Pair (–1 life)</button>`;
    const torchBtn = state.torches > 0 ? `<button class="action-btn" data-action="useTorch" style="margin-left:8px">Torch (${state.torches})</button>` : '';
    return `${bar}<div class="dice-section compact">
      ${info}
      <div style="margin:6px 0">${spaceHint}${attackHint}</div>
      <div>${forfeitBtn}${torchBtn}</div>
    </div>`;
  }

  return bar;
}

function renderCloudSetup() {
  const adv = getAdv();
  const pool = remainingCloudPool();
  const assigned = state.cloudAssignments;
  const cloudItems = adv.cloudSpaces.map(id => {
    const num = assigned[id];
    const isSelected = state.cloudSetupSelected === id;
    const label = num !== undefined ? `${num}` : '?';
    return `<div class="cloud-space ${isSelected ? 'selected' : ''} ${num !== undefined ? 'assigned' : ''}" data-cloudspace="${id}">
      ${label}
      ${num !== undefined ? `<button class="cloud-clear" data-cloudclear="${id}">×</button>` : ''}
    </div>`;
  }).join('');
  const poolBtns = pool.map(n =>
    `<button class="cloud-num-btn ${state.cloudSetupSelected ? '' : 'disabled'}" data-cloudnum="${n}">${n}</button>`
  ).join('');
  const canStart = pool.length === 0;
  return `<div class="cloud-setup">
    <h3>Assign Numbers to Cloud Spaces</h3>
    <p style="color:#aaa;margin-bottom:12px">Click a cloud space, then a number from the pool.</p>
    <div class="cloud-grid">${cloudItems}</div>
    <div class="cloud-pool">
      <span>Pool: </span>${poolBtns}
    </div>
    ${canStart ? `<button class="roll-btn" data-action="startFromCloud" style="margin-top:16px">Begin Adventure</button>` : ''}
  </div>`;
}

function renderChestModal() {
  return `<div class="chest-modal">
    <h3>&#x1F4E6; Treasure Chest!</h3>
    <p>Choose one reward:</p>
    <button class="chest-btn" data-chest="life">&#x2764; Extra Life — +3 life &amp; +1 gem</button>
    <button class="chest-btn" data-chest="torch">&#x1F525; Torch — cross out any adjacent space (×2)</button>
    <button class="chest-btn" data-chest="blackdie">&#x1F3B2; Extra Black Dice — +3 black die uses</button>
  </div>`;
}

function renderTorchUI() {
  const adv = getAdv();
  const torchable = Object.keys(adv.spaces).filter(id => {
    if (isVisited(id)) return false;
    if (adv.spaces[id].type === 'gateway') return false;
    return hasAdjacentVisited(id);
  });
  const hint = torchable.length > 0 ? `${torchable.length} space(s) available — click on map` : 'No spaces available.';
  return `<div class="dice-section compact">
    <p>&#x1F525; Torch active — select any adjacent unvisited space. ${hint}</p>
    <button class="action-btn skip" data-action="cancelTorch">Cancel Torch</button>
  </div>`;
}

function renderSVGMap() {
  const adv = getAdv();
  const isTorch = state.phase === 'torch';
  const activePair = !isTorch ? getActivePairForUI() : null;
  const validSpaces = activePair ? getValidSpaces(activePair) : [];
  const torchSpaces = isTorch ? Object.keys(adv.spaces).filter(id =>
    !isVisited(id) && adv.spaces[id].type !== 'gateway' && hasAdjacentVisited(id)
  ) : [];
  const clickable = new Set([...validSpaces, ...torchSpaces]);

  const W = 780, H = 500;
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="dungeon-map">`;

  // Draw edges
  const drawnEdges = new Set();
  for (const [id, sp] of Object.entries(adv.spaces)) {
    if (sp.type === 'gateway') continue;
    const nA = adv.nodes[id];
    if (!nA) continue;
    for (const nbrId of sp.adj) {
      const nbrSp = adv.spaces[nbrId];
      if (!nbrSp || nbrSp.type === 'gateway') continue;
      const edgeKey = [id, nbrId].sort().join('|');
      if (drawnEdges.has(edgeKey)) continue;
      drawnEdges.add(edgeKey);
      const nB = adv.nodes[nbrId];
      if (!nB) continue;
      const bothVisited = isVisited(id) && isVisited(nbrId);
      svg += `<line x1="${nA.x}" y1="${nA.y}" x2="${nB.x}" y2="${nB.y}" class="map-edge ${bothVisited ? 'visited' : ''}" />`;
    }
  }

  // Draw monster access lines (dashed)
  for (const m of Object.values(adv.monsters)) {
    const mn = adv.mNodes[m.id];
    if (!mn) continue;
    for (const sid of m.accessFrom) {
      const sn = adv.nodes[sid];
      if (!sn) continue;
      const ms = state.monsterState[m.id];
      svg += `<line x1="${sn.x}" y1="${sn.y}" x2="${mn.x}" y2="${mn.y}" class="monster-access-line ${ms.defeated ? 'defeated' : isVisited(sid) ? 'accessible' : ''}" />`;
    }
  }

  // Draw monster nodes
  for (const m of Object.values(adv.monsters)) {
    const mn = adv.mNodes[m.id];
    if (!mn) continue;
    const ms = state.monsterState[m.id];
    const hasAccess = m.accessFrom.some(sid => isVisited(sid));
    const cls = ms.defeated ? 'monster-node defeated' : m.isBoss ? 'monster-node boss' : hasAccess ? 'monster-node accessible' : 'monster-node';
    const pct = ms.health / m.hp;
    svg += `<rect x="${mn.x-22}" y="${mn.y-14}" width="44" height="28" rx="4" class="${cls}" />`;
    if (!ms.defeated) {
      svg += `<rect x="${mn.x-20}" y="${mn.y+2}" width="${Math.round(40*pct)}" height="6" class="monster-hp-fill" />`;
      svg += `<rect x="${mn.x-20}" y="${mn.y+2}" width="40" height="6" fill="none" stroke="#555" stroke-width="1" />`;
    }
    svg += `<text x="${mn.x}" y="${mn.y-2}" class="monster-label">${ms.defeated ? '✓' : m.name.split(' ')[0]}</text>`;
  }

  // Draw space nodes
  for (const [id, sp] of Object.entries(adv.spaces)) {
    if (sp.type === 'gateway') continue;
    const n = adv.nodes[id];
    if (!n) continue;
    const vis = isVisited(id);
    const avail = clickable.has(id);
    const rubbleProg = sp.type === 'rubble' ? (state.rubbleProgress[id] ?? 0) : -1;
    const isPartialRubble = rubbleProg === 1;

    let cls = 'space-node';
    if (sp.type === 'start')    cls += ' start-node';
    else if (sp.type === 'fist')    cls += ' fist-node';
    else if (sp.type === 'gold')    cls += ' gold-node';
    else if (sp.type === 'gem')     cls += ' gem-node';
    else if (sp.type === 'treasure')cls += ' chest-node';
    else if (sp.type === 'rubble')  cls += ' rubble-node';
    else if (sp.type === 'cloud')   cls += ' cloud-node';
    else if (sp.type === 'claw')    cls += ' claw-node';
    else if (sp.type === 'worm')    cls += ' worm-node';

    if (vis) cls += ' visited';
    if (isPartialRubble) cls += ' partial';
    if (avail) cls += ' available';

    const r = sp.type === 'start' ? 16 : 14;
    const clickAttr = avail ? `data-visitspace="${id}"` : '';
    svg += `<circle cx="${n.x}" cy="${n.y}" r="${r}" class="${cls}" ${clickAttr} />`;

    // Label
    let lbl = sp.type === 'cloud' ? (state.cloudAssignments[id] ?? '?') : sp.label;
    if (sp.type === 'fist') lbl = lbl + '✊';
    if (sp.type === 'worm') lbl = lbl + '🐛';
    if (sp.type === 'claw') lbl = lbl + '🦴';
    if (isPartialRubble) lbl = '½';
    if (vis && sp.type !== 'start' && sp.type !== 'fist' && sp.type !== 'claw' && sp.type !== 'worm' && sp.type !== 'cloud') {
      lbl = '✓';
    }
    svg += `<text x="${n.x}" y="${n.y+4}" class="space-label ${avail ? 'available-label' : ''}" ${clickAttr}>${lbl}</text>`;
  }

  svg += '</svg>';
  return svg;
}

function calcScore() {
  const adv = getAdv();
  const gemVP = state.gems * 3;
  const goldVP = state.gold * 2;
  const bossId = Object.keys(adv.monsters).find(id => adv.monsters[id].isBoss);
  const bossDefeated = bossId ? state.monsterState[bossId]?.defeated : false;
  const bossVP = bossDefeated ? 0 : Math.floor(state.bossDamageDealt / 3);
  return gemVP + goldVP + bossVP;
}

function scoreRating(score) {
  if (score < 10)  return "You didn't find the entrance. Try again!";
  if (score < 25)  return "The idea was to kill Monsters, not cuddle them!";
  if (score < 40)  return "This is not paint-by-numbers.";
  if (score < 55)  return "Not bad! But hit the boss harder next time!";
  if (score < 70)  return "You are a true hero!";
  if (score < 85)  return "Did you teach Indiana Jones his moves?";
  if (score < 100) return "Wondrous tales will be told for centuries!";
  return "Behold, the DUNGEON MASTER is here!!!";
}

function renderVictory() {
  const score = calcScore();
  return `<div class="app" style="--theme-color:#f1c40f">
    <div class="game-container">
      <div class="victory">
        <h2>&#x1F3C6; Victory!</h2>
        <p style="font-size:1.3em;margin:12px 0">Final Score: <b>${score} VP</b></p>
        <p style="color:#f1c40f;font-style:italic">${scoreRating(score)}</p>
        <div style="margin:16px 0;color:#aaa">Gems: ${state.gems} (${state.gems*3}VP) | Gold: ${state.gold} (${state.gold*2}VP)</div>
        <button data-action="quit">Play Again</button>
      </div>
    </div>
  </div>`;
}

function renderGameOver() {
  const score = calcScore();
  return `<div class="app" style="--theme-color:#e74c3c">
    <div class="game-container">
      <div class="game-over">
        <h2>&#x1F480; Defeated!</h2>
        <p style="font-size:1.1em;margin:12px 0">You fell in the dungeon with <b>${score} VP</b> earned.</p>
        <button data-action="quit">Return to Realm Selection</button>
      </div>
    </div>
  </div>`;
}

// ─── Events ───────────────────────────────────────────────────────────────────

function attachListeners() {
  document.getElementById('app').addEventListener('click', e => {
    const t = e.target.closest('[data-action],[data-realm],[data-split],[data-visitspace],[data-attack],[data-bswap],[data-chest],[data-cloudspace],[data-cloudnum],[data-cloudclear]');
    if (!t) return;

    if (t.dataset.realm)      { initGame(t.dataset.realm); return; }
    if (t.dataset.split)      { selectSplit(+t.dataset.split); return; }
    if (t.dataset.visitspace) { assignToSpace(t.dataset.visitspace); return; }
    if (t.dataset.attack)     { assignToMonster(t.dataset.attack); return; }
    if (t.dataset.bswap)      { const [p,d] = t.dataset.bswap.split('-').map(Number); swapBlackDie(p,d); return; }
    if (t.dataset.chest)      { chooseChestReward(t.dataset.chest); return; }
    if (t.dataset.cloudspace) { cloudSetupSelect(t.dataset.cloudspace); return; }
    if (t.dataset.cloudnum)   { cloudSetupAssign(+t.dataset.cloudnum); return; }
    if (t.dataset.cloudclear) { cloudSetupClear(t.dataset.cloudclear); return; }

    const action = t.dataset.action;
    if (action === 'roll')           rollDice();
    else if (action === 'confirmPairs') confirmPairs();
    else if (action === 'forfeit')   forfeitPair();
    else if (action === 'useTorch')  useTorch();
    else if (action === 'cancelTorch') { state.phase = 'assignPair'; render(); }
    else if (action === 'startFromCloud') { state.phase = 'roll'; state.message = `Welcome to ${getAdv().name}! Roll the dice to begin.`; render(); }
    else if (action === 'quit')      { state.screen = 'setup'; render(); }
  }, { once: true });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

render();
