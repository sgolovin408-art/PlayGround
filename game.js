(() => {
  const $ = (id) => document.getElementById(id);
  const rocks = [
    {name:'Серый сланец',type:'осадочная порода',hp:40,rarity:'ОБЫЧНЫЙ',depth:12,color:'#69746c',light:'#a1aaa0',dark:'#39433d',note:'«Тишина здесь звучит по-особенному.»'},
    {name:'Медный песчаник',type:'песчаник с прожилками',hp:62,rarity:'НЕОБЫЧНЫЙ',depth:18,color:'#a66e4d',light:'#d49b6a',dark:'#684632',note:'«Тёплая жила уходит глубже. Здесь когда-то была вода.»'},
    {name:'Лунный кварц',type:'кристаллическая порода',hp:86,rarity:'РЕДКИЙ',depth:27,color:'#777d91',light:'#c3c6d9',dark:'#484d61',note:'«Он ловит свет даже там, где нет солнца.»'},
    {name:'Базальтовое сердце',type:'вулканическая порода',hp:112,rarity:'РЕДКИЙ',depth:39,color:'#535b5c',light:'#9ba69e',dark:'#303638',note:'«Камень помнит жар, которого давно нет.»'},
    {name:'Яшма в сумерках',type:'полудрагоценная порода',hp:145,rarity:'ДРАГОЦЕННЫЙ',depth:54,color:'#906354',light:'#d19a77',dark:'#523c3e',note:'«В красных слоях проступает рисунок древнего леса.»'},
    {name:'Глубинный аметист',type:'кристалл глубин',hp:180,rarity:'ДРАГОЦЕННЫЙ',depth:72,color:'#766394',light:'#c4a4dc',dark:'#433957',note:'«Глубина начинает отвечать тебе.»'},
    {name:'Окаменевший метеорит',type:'железный метеорит',hp:225,rarity:'ЭПИЧЕСКИЙ',depth:96,color:'#596b69',light:'#b2c7ae',dark:'#303e42',note:'«Он прилетел сюда раньше, чем появилась шахта.»'},
    {name:'Нефритовый монолит',type:'древний минерал',hp:280,rarity:'ЛЕГЕНДАРНЫЙ',depth:124,color:'#4b7965',light:'#a6d398',dark:'#294b42',note:'«Ты нашёл то, ради чего шахта хранила молчание.»'}
  ];
  const defaults = {stones:0,found:0,specimen:0,pick:1,gloves:0,lamp:0,combo:0,bestCombo:0,sound:false};
  let state = {...defaults};
  try { const saved = JSON.parse(localStorage.getItem('quiet-mine-save')); if(saved) state = {...state,...saved}; } catch {}
  const canvas = $('rock-canvas'), ctx = canvas.getContext('2d');
  let toastTimer, lastHit = 0, audioCtx = null;
  const rockIndex = () => Math.min(state.specimen, rocks.length - 1);
  const currentRock = () => rocks[rockIndex()];
  const maxHp = (r=currentRock()) => Math.round(r.hp * (state.specimen >= rocks.length ? 1 + (state.specimen-rocks.length+1)*.12 : 1));
  const hpNow = () => Math.max(0, maxHp() - (state.damage || 0));
  const costs = () => ({pick:Math.round(8*Math.pow(1.72,state.pick-1)),gloves:Math.round(12*Math.pow(1.75,state.gloves)),lamp:Math.round(20*Math.pow(1.8,state.lamp))});
  const power = () => state.pick + Math.floor(state.pick/3);

  function save(){ localStorage.setItem('quiet-mine-save',JSON.stringify(state)); }
  function update(){
    const r=currentRock(), hp=maxHp(), remaining=hpNow(), c=costs();
    $('stone-count').textContent=state.stones;
    $('rocks-found').innerHTML=`${Math.min(state.found,8)} <small>/ 8</small>`;
    $('depth-stat').innerHTML=`${r.depth} <small>м</small>`;
    $('depth-label').textContent=`${r.depth} м`;
    $('shift-number').textContent=String(Math.floor(state.specimen/4)+1).padStart(2,'0');
    $('specimen-number').textContent=String(state.specimen+1).padStart(3,'0');
    $('horizon-label').textContent=['I','II','III','IV','V','VI','VII','VIII'][rockIndex()];
    $('rock-name').textContent=r.name; $('rock-type').textContent=r.type;
    $('rarity-label').textContent=r.rarity; $('journal-note').textContent=r.note;
    $('hp-label').innerHTML=`${remaining} <i>/ ${hp}</i>`;
    $('hp-fill').style.width=`${Math.max(0,remaining/hp*100)}%`;
    $('power-label').textContent=power();
    $('tool-name').textContent=state.pick>4?'Стальное кайло':state.pick>2?'Усиленное кайло':'Старый кайло';
    $('pick-level').textContent=`ур. ${state.pick}`; $('glove-level').textContent=`ур. ${state.gloves}`; $('lamp-level').textContent=`ур. ${state.lamp}`;
    $('pick-cost').textContent=c.pick; $('glove-cost').textContent=c.gloves; $('lamp-cost').textContent=c.lamp;
    document.querySelectorAll('.buy-button').forEach(b=>{const key=b.dataset.upgrade;b.disabled=state.stones<c[key];b.closest('.upgrade-card').classList.toggle('disabled',b.disabled)});
    const progress=state.specimen%4; $('progress-text').textContent=`${progress} / 4`; $('discovery-progress').style.width=`${progress*25}%`;
    $('next-hint').textContent=state.specimen>=rocks.length?'Ты достиг сердца шахты. Дальше — только глубже.':'Сломай ещё '+(4-progress)+' образца — новый слой откроется.';
    $('combo-display').innerHTML=`СЕРИЯ <b>${state.combo}</b> ×`;
    $('tip-text').textContent=state.gloves?`Перчатки дают ${Math.min(15+state.gloves*10,75)}% шанс на двойной осколок.`:'Не спеши. Иногда камень раскрывается только после трещины.';
    drawRock();
  }
  function seeded(n){let x=Math.sin(n*127.1+state.specimen*311.7)*43758.5453;return x-Math.floor(x)}
  function drawRock(){
    const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h); const r=currentRock(), damage=1-hpNow()/maxHp();
    const cx=w/2,cy=h/2+4, rx=145,ry=126, sides=13,pts=[];
    for(let i=0;i<sides;i++){const a=-Math.PI/2+i*Math.PI*2/sides;const wobble=.84+seeded(i+1)*.29;pts.push({x:cx+Math.cos(a)*rx*wobble,y:cy+Math.sin(a)*ry*wobble})}
    const gradient=ctx.createLinearGradient(cx-rx,cy-ry,cx+rx,cy+ry);gradient.addColorStop(0,r.light);gradient.addColorStop(.38,r.color);gradient.addColorStop(1,r.dark);
    ctx.save();ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=gradient;ctx.shadowColor='#080a08';ctx.shadowBlur=24;ctx.shadowOffsetY=16;ctx.fill();ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.save();ctx.clip();
    for(let i=0;i<13;i++){
      const p1=pts[i],p2=pts[(i+1)%sides], mid={x:(p1.x+p2.x+cx)/3+(seeded(i+29)-.5)*35,y:(p1.y+p2.y+cy)/3+(seeded(i+47)-.5)*30};
      ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(mid.x,mid.y);ctx.lineTo(p2.x,p2.y);ctx.lineTo(cx+(seeded(i+8)-.5)*60,cy+(seeded(i+18)-.5)*50);ctx.closePath();ctx.fillStyle=i%3===0?`${r.light}22`:i%3===1?`${r.dark}30`:`${r.color}55`;ctx.fill();
    }
    ctx.globalAlpha=.22;ctx.strokeStyle=r.light;ctx.lineWidth=1;
    for(let j=0;j<7;j++){ctx.beginPath();let y=cy-75+j*22;ctx.moveTo(cx-rx,y);ctx.bezierCurveTo(cx-70,y-12,cx+40,y+14,cx+rx,y-3);ctx.stroke()}
    ctx.globalAlpha=1;
    if(damage>.22){ctx.strokeStyle='#242824';ctx.lineWidth=2;ctx.lineCap='round';for(let c=0;c<Math.floor(damage*6);c++){let sx=cx+(seeded(c+88)-.5)*145,sy=cy+(seeded(c+93)-.5)*115;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+(seeded(c+99)-.5)*42,sy+18+seeded(c+100)*24);ctx.lineTo(sx+(seeded(c+109)-.5)*72,sy+35+seeded(c+111)*30);ctx.stroke();ctx.strokeStyle='#c1c4ad66';ctx.lineWidth=.7;ctx.stroke();ctx.strokeStyle='#242824';ctx.lineWidth=2}}
    ctx.restore();ctx.strokeStyle=`${r.light}77`;ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
    if(state.lamp){ctx.globalAlpha=.11+state.lamp*.025;ctx.fillStyle='#eddf8a';ctx.beginPath();ctx.ellipse(cx,cy-18,rx+20,ry+30,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  }
  function showToast(text){const t=$('toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1900)}
  function playSound(freq=180){if(!state.sound)return;try{audioCtx ||= new(window.AudioContext||window.webkitAudioContext)();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(freq,audioCtx.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.55,audioCtx.currentTime+.09);gain.gain.setValueAtTime(.07,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.12);osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+.13)}catch{}}
  function floatText(text,x,y,crit=false){const el=document.createElement('span');el.className='float-text'+(crit?' crit':'');el.textContent=text;el.style.left=`${x}px`;el.style.top=`${y}px`;$('float-layer').appendChild(el);setTimeout(()=>el.remove(),850)}
  function burst(x,y){for(let i=0;i<7;i++){const p=document.createElement('i');p.className='debris';p.style.left=`${x}px`;p.style.top=`${y}px`;p.style.setProperty('--dx',`${(Math.random()-.5)*95}px`);p.style.setProperty('--dy',`${(Math.random()-.7)*90}px`);$('float-layer').appendChild(p);setTimeout(()=>p.remove(),550)}}
  function strike(event){
    const now=Date.now();state.combo=now-lastHit<1500?state.combo+1:1;lastHit=now;state.bestCombo=Math.max(state.bestCombo,state.combo);
    const critChance=Math.min(.05+state.gloves*.09+state.lamp*.025,.72), crit=Math.random()<critChance;
    const damage=power()*(crit?2:1);state.damage=(state.damage||0)+damage;
    const rect=canvas.getBoundingClientRect();let px=rect.width?((event?.clientX??rect.left+rect.width/2)-rect.left)/rect.width*canvas.width:220;let py=rect.height?((event?.clientY??rect.top+rect.height/2)-rect.top)/rect.height*canvas.height:180;
    $('rock-stage').classList.remove('shake');void $('rock-stage').offsetWidth;$('rock-stage').classList.add('shake');canvas.classList.remove('hit');void canvas.offsetWidth;canvas.classList.add('hit');$('hit-flash').classList.remove('show');void $('hit-flash').offsetWidth;$('hit-flash').classList.add('show');
    floatText(crit?`КРИТ! −${damage}`:`−${damage}`,Math.max(20,Math.min(rect.width-20,px/ canvas.width*rect.width)),Math.max(35,py/canvas.height*rect.height),crit);burst(px/canvas.width*rect.width,py/canvas.height*rect.height);playSound(crit?260:180);
    if(hpNow()<=0){
      const bonus=state.combo>=5?1:0;let shards=3+Math.floor(Math.random()*3)+bonus;
      if(Math.random()<Math.min(state.gloves*.1, .6))shards*=2;
      if(state.lamp>0&&Math.random()<Math.min(state.lamp*.07,.4))shards++;
      state.stones+=shards;state.found=Math.min(8,state.found+1);state.specimen++;state.damage=0;state.combo=Math.max(state.combo,1);
      floatText(`+${shards} ◆`,rect.width*.5,rect.height*.44,true);showToast(`Образец расколот · +${shards} осколка`);playSound(320);
      if(state.specimen%4===0)showToast('Новый горизонт открыт');
    }
    $('tap-hint').style.opacity='0';update();save();
  }
  $('strike-button').addEventListener('click',()=>strike());
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();strike(e)});
  document.querySelectorAll('.buy-button').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.upgrade,c=costs()[key];if(state.stones<c)return;
    state.stones-=c;state[key]++;showToast(key==='pick'?'Кайло стало крепче':key==='gloves'?'Перчатки улучшены':'Лампа стала ярче');playSound(390);update();save();
  }));
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();strike()} });
  $('sound-toggle').addEventListener('click',()=>{state.sound=!state.sound;$('sound-toggle').textContent=state.sound?'♫':'♩';$('sound-toggle').setAttribute('aria-label',state.sound?'Звук включён':'Звук выключен');if(state.sound)playSound(420);save()});
  $('reset-button').addEventListener('click',()=>{if(confirm('Начать новую смену? Весь прогресс будет сброшен.')){state={...defaults};lastHit=0;save();update();$('tap-hint').style.opacity='';showToast('Новая смена началась')}});
  update();
})();
