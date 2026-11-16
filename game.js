import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#18272a');
scene.fog = new THREE.FogExp2('#18272a', 0.0038);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, .1, 700);
const hemi = new THREE.HemisphereLight(0xb9cbd0, 0x26302b, 1.4); scene.add(hemi);
const moon = new THREE.DirectionalLight(0xc4d4d7, 2.0); moon.position.set(-80, 110, 40); moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.left = -80; moon.shadow.camera.right = 80; moon.shadow.camera.top = 80; moon.shadow.camera.bottom = -80; moon.shadow.bias = -.0004; scene.add(moon);
const warmGlow = new THREE.PointLight(0xffc478, 65, 110, 2); warmGlow.position.set(-27, 16, -69); scene.add(warmGlow);
const materials = {};
function mat(name, color, roughness=.8, extra={}) { return materials[name] ||= new THREE.MeshStandardMaterial({ color, roughness, ...extra }); }
const groundMat = mat('ground','#263432');
const roadMat = mat('road','#303638',.96);
const sidewalkMat = mat('sidewalk','#5c6058');
const curbMat = mat('curb','#a29b83');
const lineMat = mat('line','#c6bd9f',.75,{emissive:'#393327',emissiveIntensity:.3});
const greenMat = mat('green','#45664c');
const darkGreen = mat('darkGreen','#284637');
const lampMat = mat('lamp','#4b5550',.38,{metalness:.65});
const bulbMat = mat('bulb','#ffd998',.3,{emissive:'#ffc56f',emissiveIntensity:2});
const brickMat = mat('brick','#76584b');
const stoneMat = mat('stone','#8b8573');
const redMat = mat('red','#8d302b');
const goldMat = mat('gold','#c4a15f',.4,{metalness:.55});
const truckPaint = mat('truckPaint','#45685f',.38,{metalness:.28});
const truckDark = mat('truckDark','#283a38',.55,{metalness:.3});
const rubber = mat('rubber','#171c1c',.95);
const glass = mat('glass','#8fb0ad',.22,{metalness:.2,transparent:true,opacity:.8,emissive:'#304b4b',emissiveIntensity:.18});
const headlightMat = mat('headlight','#fff0ba',.25,{emissive:'#ffe4a0',emissiveIntensity:4});
const tailMat = mat('tail','#ed4f39',.3,{emissive:'#e73427',emissiveIntensity:2.5});
const beaconMat = mat('beacon','#b9ed91',.25,{emissive:'#92d765',emissiveIntensity:2.5,transparent:true,opacity:.92});
const coinMat = mat('coin','#efbd67',.28,{metalness:.55,emissive:'#9b641d',emissiveIntensity:.25});
function box(parent, name, size, position, material, cast=true, receive=true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material); mesh.name=name; mesh.position.set(...position); mesh.castShadow=cast; mesh.receiveShadow=receive; parent.add(mesh); return mesh;
}
function cylinder(parent, radiusTop, radiusBottom, height, position, material, radial=10) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,radial),material); mesh.position.set(...position); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(700,700),groundMat); ground.rotation.x=-Math.PI/2; ground.position.y=-.12; ground.receiveShadow=true; scene.add(ground);
function roadZ(x,z=0,width=18,length=360){box(scene,'boulevard',[width,.12,length],[x,-.035,z],roadMat,false,true);for(const side of [-1,1]){box(scene,'sidewalk',[2.8,.22,length],[x+side*(width/2+1.4),.01,z],sidewalkMat,false,true);box(scene,'curb',[.22,.3,length],[x+side*(width/2),.04,z],curbMat,false,true);}}
function roadX(x,z,width=15,length=110){box(scene,'cross-street',[length,.12,width],[x,-.035,z],roadMat,false,true);for(const side of [-1,1]){box(scene,'crosswalk-sidewalk',[length,.22,2.5],[x,.01,z+side*(width/2+1.25)],sidewalkMat,false,true);box(scene,'crosswalk-curb',[length,.3,.2],[x,.04,z+side*width/2],curbMat,false,true);}}
roadZ(0, -48, 18, 270); roadZ(32,-103,15,170);
roadX(8,-76,16,96); roadX(5,-15,12,70); roadX(5,-45,12,70); roadX(25,-115,12,70);
// Lane dashes and crosswalks
for(const x of [0,32]) for(let z=-176;z<80;z+=13){box(scene,'lane-dash',[.16,.025,5],[x,.04,z],lineMat,false,false);}
for(let x=-38;x<72;x+=10) for(const z of [-76]) box(scene,'lane-dash-cross',[5,.025,.16],[x,.04,z],lineMat,false,false);
for(const z of [-15,-45,-115]) for(let i=-4;i<=4;i++) box(scene,'crosswalk-stripe',[1.1,.03,.35],[i*1.35,.055,z],lineMat,false,false);
// Buildings and their warm window lights
const buildingMats=['#776f63','#615f57','#8a7965','#68645c','#8a8172','#5e6965'].map((c,i)=>mat(`building${i}`,c,.9));
const windowGeo=new THREE.BoxGeometry(1.05,.72,.08);
const windowMats=['#e3bd78','#a7c3bb','#d88d57'].map((c,i)=>mat(`window${i}`,c,.35,{emissive:c,emissiveIntensity:i===0?1.4:.75}));
const windowBatches=windowMats.map(m=>new THREE.InstancedMesh(windowGeo,m,3500)); windowBatches.forEach(b=>{b.castShadow=false;b.receiveShadow=false;scene.add(b);});
let winCounts=[0,0,0]; const dummy=new THREE.Object3D();
function addBuilding(x,z,w,d,h,style=0){
  const group=new THREE.Group(); group.position.set(x,0,z); scene.add(group);
  const body=box(group,'facade',[w,h,d],[0,h/2,0],buildingMats[style%buildingMats.length]);
  if(style===2||style===5){const roof=cylinder(group,Math.max(w,d)*.38,Math.max(w,d)*.43,1.4,[0,h+.5,0],buildingMats[style],8);roof.rotation.y=Math.PI/8;}
  // classical cornice and parapet
  if(h>15){box(group,'cornice',[w+1,.45,d+1],[0,h-.3,0],buildingMats[(style+1)%buildingMats.length]);}
  for(const side of [-1,1]){
    const cols=Math.max(2,Math.floor(w/3.2)), rows=Math.max(2,Math.floor((h-2.5)/3.3));
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      if(Math.random()<.30||winCounts[0]>=3498)continue;
      const idx=Math.random()<.65?0:(Math.random()<.65?1:2), batch=windowBatches[idx];
      dummy.position.set(x+side*(w/2+.045),1.8+r*3.1,z+(c-(cols-1)/2)*(w/(cols+1)));
      dummy.rotation.set(0,side>0?Math.PI/2:-Math.PI/2,0);dummy.scale.set(1,1,1);dummy.updateMatrix();batch.setMatrixAt(winCounts[idx]++,dummy.matrix);
    }
  }
  // side-wall window scatter
  for(const side of [-1,1]){
    const cols=Math.max(2,Math.floor(d/4)), rows=Math.max(2,Math.floor((h-2.5)/3.4));
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(Math.random()<.43&&winCounts[1]<3498){
      dummy.position.set(x+(c-(cols-1)/2)*(d/(cols+1)),1.8+r*3.1,z+side*(d/2+.045));dummy.rotation.set(0,side<0?Math.PI:0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();windowBatches[1].setMatrixAt(winCounts[1]++,dummy.matrix);
    }
  }
  return group;
}
// Urban blocks flanking the boulevards; gaps at intersections keep the streets readable.
for(let row=0;row<12;row++){
  const z=74-row*24;
  for(const side of [-1,1]){
    const x=side*(24+Math.random()*3); const h=12+Math.random()*16;
    addBuilding(x,z,13+Math.random()*7,14+Math.random()*7,h,Math.floor(Math.random()*6));
    if(row%2===0)addBuilding(side*(49+Math.random()*5),z-8,17+Math.random()*7,17+Math.random()*8,16+Math.random()*19,Math.floor(Math.random()*6));
    if(row%3===0)addBuilding(side*(77+Math.random()*5),z+8,19+Math.random()*8,18+Math.random()*9,20+Math.random()*23,Math.floor(Math.random()*6));
  }
}
// Further illuminated skyline silhouettes
for(let i=0;i<32;i++){const x=(Math.random()>.5?1:-1)*(104+Math.random()*85),z=-170+Math.random()*260;addBuilding(x,z,18+Math.random()*22,18+Math.random()*22,24+Math.random()*45,Math.floor(Math.random()*6));}
windowBatches.forEach(b=>b.count=winCounts[windowBatches.indexOf(b)]);
// Trees, street lamps, and tiny pools of amber light.
const treePositions=[];
for(let z=-170;z<75;z+=19) for(const side of [-1,1]) treePositions.push([side*13.4,z+(Math.random()*4-2)]);
for(const [x,z] of treePositions){cylinder(scene,.18,.27,2.5,[x,1.25,z],lampMat,7);const crown=cylinder(scene,1.4,.15,3.8,[x,4.1,z],greenMat,7);crown.rotation.x=Math.PI;const crown2=new THREE.Mesh(new THREE.IcosahedronGeometry(1.55,0),darkGreen);crown2.position.set(x,5,z);crown2.scale.set(.9,1.25,.9);crown2.castShadow=true;scene.add(crown2);}
const lamps=[];
for(let z=-166;z<72;z+=34) for(const side of [-1,1]){
 const x=side*10.8; cylinder(scene,.09,.13,5.6,[x,2.8,z],lampMat,8);const arm=box(scene,'lamp-arm',[.12,.12,1.05],[x-side*.43,5.45,z],lampMat,false);arm.rotation.z=side*.16;const bulb=new THREE.Mesh(new THREE.SphereGeometry(.19,8,6),bulbMat);bulb.position.set(x-side*.8,5.35,z);scene.add(bulb);lamps.push(bulb.position.clone());
}
// The distant Kremlin silhouette and onion-domed cathedral: landmark framing the route.
const kremlin=new THREE.Group();kremlin.position.set(-39,0,-66);scene.add(kremlin);
box(kremlin,'Kremlin wall',[48,7,2.2],[0,3.5,0],redMat);box(kremlin,'wall cap',[48.8,.55,2.8],[0,7.05,0],goldMat);
for(let i=0;i<5;i++){const x=-21+i*10.5;box(kremlin,'crenel',[1.2,1.2,2.5],[x,7.8,0],redMat);}
function tower(parent,x,z,h=18){const t=cylinder(parent,2.25,2.9,h*.53,[x,h*.265,z],redMat,4);t.rotation.y=Math.PI/4;const roof=cylinder(parent,0,2.4,h*.3,[x,h*.68,z],redMat,4);roof.rotation.y=Math.PI/4;const spire=cylinder(parent,0,.2,2.2,[x,h*.92,z],goldMat,6);return {t,roof,spire};}
tower(kremlin,-20,0,21);tower(kremlin,0,0,24);tower(kremlin,20,0,20);
const cathedral=new THREE.Group();cathedral.position.set(-31,0,-78);scene.add(cathedral);
box(cathedral,'cathedral body',[16,10,12],[0,5,0],stoneMat);
const domeColors=['#be984c','#7d9a83','#a94d3b','#d1b76e','#77988a'];
for(let i=0;i<5;i++){const x=(i-2)*3.2,z=i%2?1.7:-1.6;const drum=cylinder(cathedral,1.1,1.4,1.7,[x,10.5,z],stoneMat,10);const dome=cylinder(cathedral,0,1.65,3.2,[x,12.6,z],mat(`dome${i}`,domeColors[i],.42,{metalness:.2}),12);const fin=cylinder(cathedral,0,.08,1.2,[x,14.7,z],goldMat,6);}
for(const x of [-36,-29,-22]){const tower=cylinder(cathedral,1.1,1.25,5,[x,2.5,-8],redMat,8);const roof=cylinder(cathedral,0,1.35,2.7,[x,6.1,-8],goldMat,9);}
// A few smaller red-roofed city halls around the landmark.
for(const [x,z] of [[-60,-58],[-57,-91],[-8,-95]]){const b=addBuilding(x,z,12,14,15,2);const roof=cylinder(b,0,9,5,[0,17,0],redMat,4);roof.rotation.y=Math.PI/4;}

// A rugged old-school delivery truck with a detailed cab, box trailer, lights, and animated wheels.
const truck=new THREE.Group(); scene.add(truck);
const chassis=box(truck,'chassis',[2.25,.48,6.1],[0,.83,.15],truckDark);
box(truck,'cargo-box',[2.56,2.52,4.35],[0,2.42,.9],truckPaint);
box(truck,'cargo-roof',[2.68,.12,4.45],[0,3.72,.9],mat('truckRoof','#5e7a70',.4));
box(truck,'cargo-rear-door-left',[1.21,2.18,.08],[-.62,2.43,3.11],mat('doorLeft','#3c5a53',.55));
box(truck,'cargo-rear-door-right',[1.21,2.18,.08],[.62,2.43,3.11],mat('doorRight','#3c5a53',.55));
for(const x of [-.57,.57])box(truck,'door-bar',[.055,2.12,.08],[x,2.43,3.2],lampMat);
box(truck,'cab-body',[2.28,1.72,1.92],[0,1.78,-2.36],truckPaint);
box(truck,'cab-roof',[2.25,.2,1.55],[0,2.7,-2.55],mat('cabRoof','#59776d',.35));
const windscreen=box(truck,'windscreen',[1.83,.82,.055],[0,2.19,-3.34],glass,false);
windscreen.rotation.x=-.12;
for(const x of [-1.12,1.12]){const sideWin=box(truck,'side-window',[.055,.73,.92],[x,2.19,-2.5],glass,false);sideWin.rotation.y=Math.PI/2;box(truck,'mirror-stem',[.35,.07,.07],[x*1.22,2.0,-3.0],truckDark,false);box(truck,'mirror',[.14,.28,.16],[x*1.35,2.06,-3.02],truckDark);}
box(truck,'bumper',[2.52,.23,.22],[0,.69,-3.43],lampMat);
for(const x of [-.85,.85]){const h=new THREE.Mesh(new THREE.BoxGeometry(.37,.28,.1),headlightMat);h.position.set(x,1.03,-3.48);truck.add(h);const t=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.1),tailMat);t.position.set(x,1.03,3.16);truck.add(t);}
for(const z of [-2.15,2.35])for(const x of [-1.2,1.2]){
 const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.56,.56,.34,16),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.58,z);wheel.castShadow=true;wheel.receiveShadow=true;truck.add(wheel);
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.36,12),lampMat);hub.rotation.z=Math.PI/2;hub.position.set(x,.58,z);truck.add(hub);
 for(let k=0;k<6;k++){const bolt=new THREE.Mesh(new THREE.SphereGeometry(.035,5,4),goldMat);bolt.position.set(x+Math.sign(x)*.19,.58+Math.sin(k*Math.PI/3)*.14,z+Math.cos(k*Math.PI/3)*.14);truck.add(bolt);}
}
box(truck,'door-logo',[.08,.7,.53],[1.16,1.63,-2.15],goldMat,false);
for(let i=0;i<5;i++)box(truck,'grille',[.42,.055,.045],[0,1.28+i*.1,-3.48],lampMat,false);
const wheelMeshes=truck.children.filter(o=>o.geometry?.type==='CylinderGeometry'&&o.geometry.parameters.radiusTop===.56);
truck.position.set(0,0,32);

const objectives=[{x:0,z:-5,label:'OLD ARBAT CHECKPOINT'},{x:0,z:-42,label:'BOLSHOY MOSKVORETSKY'},{x:20,z:-76,label:'RED SQUARE CROSSING'},{x:32,z:-118,label:'DROP POINT · KITAY-GOROD'}];
const gates=[];
for(let i=0;i<objectives.length;i++){
 const p=objectives[i],g=new THREE.Group();g.position.set(p.x,0,p.z);scene.add(g);
 const activeMat=beaconMat;
 for(const x of [-5.2,5.2]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.11,.18,4,8),activeMat);post.position.set(x,2,0);g.add(post);const orb=new THREE.Mesh(new THREE.SphereGeometry(.3,12,8),activeMat);orb.position.set(x,4.12,0);g.add(orb);}
 const crossbar=new THREE.Mesh(new THREE.BoxGeometry(10.6,.18,.24),activeMat);crossbar.position.set(0,4.08,0);g.add(crossbar);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(2.2,.08,7,24),activeMat);ring.rotation.x=Math.PI/2;ring.position.y=.2;g.add(ring);
 const glow=new THREE.PointLight(0xa6e279,12,16,2);glow.position.set(0,3.2,0);g.add(glow);
 gates.push(g);
}
const coins=[];
for(const [x,z] of [[-3,-20],[4,-34],[-4,-55],[4,-68],[8,-76],[17,-84],[30,-100],[26,-127],[37,-139]]){
 const c=new THREE.Group();c.position.set(x,1.45,z);scene.add(c);const disk=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.13,20),coinMat);disk.rotation.x=Math.PI/2;c.add(disk);
 const center=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),goldMat);center.position.z=.09;c.add(center);coins.push({group:c,active:true});
}
const routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(objectives.map(o=>new THREE.Vector3(o.x,.25,o.z))),new THREE.LineDashedMaterial({color:0xbce595,dashSize:1.4,gapSize:1.1,transparent:true,opacity:.65}));routeLine.computeLineDistances();scene.add(routeLine);

const keys=new Set();let started=false,finished=false,checkpoint=0,score=0,coinsCollected=0,speed=0,yaw=0,elapsed=0,lastToast=0;
const toast=document.querySelector('#toast');
function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(lastToast);lastToast=setTimeout(()=>toast.classList.remove('show'),2100);}
function setCheckpoint(index){checkpoint=index;document.querySelector('#progress-fill').style.width=`${checkpoint/objectives.length*100}%`;document.querySelector('#progress-label').textContent=`${checkpoint} / ${objectives.length}`;document.querySelector('#mission-copy').textContent=checkpoint<objectives.length?`Drive to ${objectives[checkpoint].label.toLowerCase()}.`:'Cargo delivered. Excellent work.';document.querySelector('#objective-text').textContent=checkpoint<objectives.length?objectives[checkpoint].label:'DELIVERY COMPLETE';gates.forEach((g,i)=>{g.visible=i>=checkpoint;if(i===checkpoint)g.scale.setScalar(1.05);});}
setCheckpoint(0);
function startGame(){started=true;document.querySelector('#start-screen').classList.add('dismissed');showToast('ENGINE ON · WATCH THE WET ROAD');}
document.querySelector('#start-button').addEventListener('click',startGame);
document.querySelector('#again-button').addEventListener('click',()=>{document.querySelector('#delivery-modal').classList.add('hidden');truck.position.set(0,0,32);truck.rotation.y=0;yaw=0;speed=0;elapsed=0;coinsCollected=0;score=0;coins.forEach(c=>{c.active=true;c.group.visible=true;});setCheckpoint(0);started=true;finished=false;});
addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();keys.add(key);if(key==='r')resetTruck();if(key==='enter'&&!started)startGame();});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function resetTruck(){truck.position.set(0,0,32);truck.rotation.y=0;yaw=0;speed=0;showToast('TRUCK RESET · BACK ON ROUTE');}
for(const button of document.querySelectorAll('[data-control]')){
 const keyMap={left:'arrowleft',right:'arrowright',throttle:'arrowup',brake:' '},key=keyMap[button.dataset.control];
 const down=e=>{e.preventDefault();button.classList.add('active');keys.add(key);};const up=e=>{e.preventDefault();button.classList.remove('active');keys.delete(key);};
 button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('pointerleave',up);
}
const headlights=[];
for(const x of [-.78,.78]){const target=new THREE.Object3D();target.position.set(x,1,-24);truck.add(target);const light=new THREE.SpotLight(0xffe6b5,34,40,Math.PI/7,.42,1.3);light.position.set(x,1.08,-3.42);light.target=target;light.castShadow=false;truck.add(light);headlights.push(light);}
// Soft rain streaks stay near the truck so the road feels alive without obscuring it.
const rainCount=360,rainPositions=new Float32Array(rainCount*6),rainGroup=new THREE.Group();
for(let i=0;i<rainCount;i++){const x=(Math.random()-.5)*95,y=2+Math.random()*34,z=(Math.random()-.5)*95,k=i*6;rainPositions[k]=x;rainPositions[k+1]=y;rainPositions[k+2]=z;rainPositions[k+3]=x-.17;rainPositions[k+4]=y-.75;rainPositions[k+5]=z-.1;}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xb8d4d3,transparent:true,opacity:.22}));rainGroup.add(rain);scene.add(rainGroup);
const mapCanvas=document.querySelector('#minimap'),mapCtx=mapCanvas.getContext('2d');
function drawMap(){
 const ctx=mapCtx,w=180,h=180,cx=w/2,cy=h/2,scale=.76;ctx.clearRect(0,0,w,h);ctx.fillStyle='#192725';ctx.fillRect(0,0,w,h);
 const px=truck.position.x,pz=truck.position.z;
 const project=(x,z)=>[cx+(x-px)*scale,cy+(z-pz)*scale];
 ctx.strokeStyle='#34403b';ctx.lineWidth=7;
 for(const x of [0,32]){let a=project(x,-190),b=project(x,90);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
 for(const z of [-15,-45,-76,-115]){let a=project(-55,z),b=project(70,z);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
 ctx.strokeStyle='#778479';ctx.lineWidth=1;for(const x of [0,32]){let a=project(x,-190),b=project(x,90);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
 ctx.setLineDash([4,3]);ctx.strokeStyle='#b9da91';ctx.lineWidth=2;ctx.beginPath();objectives.slice(checkpoint).forEach((o,i)=>{const p=project(o.x,o.z);if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p);});ctx.stroke();ctx.setLineDash([]);
 objectives.forEach((o,i)=>{if(i<checkpoint)return;const [x,y]=project(o.x,o.z);ctx.fillStyle=i===checkpoint?'#d8b576':'#9bc87e';ctx.beginPath();ctx.arc(x,y,i===checkpoint?3.5:2,0,Math.PI*2);ctx.fill();});
 for(const [x,z] of [[-39,-66],[-31,-78]]){const p=project(x,z);ctx.fillStyle='#b66750';ctx.fillRect(p[0]-3,p[1]-3,6,6);}
 ctx.save();ctx.translate(cx,cy);ctx.rotate(-yaw);ctx.fillStyle='#f0d093';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(4,5);ctx.lineTo(0,3);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();
 ctx.strokeStyle='#ffffff18';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,57,0,Math.PI*2);ctx.stroke();
}
let audioContext=null,engineOsc=null,engineGain=null,soundOn=false;
const soundButton=document.querySelector('#sound-button');
soundButton.addEventListener('click',()=>{
 soundOn=!soundOn;
 if(soundOn&&!audioContext){audioContext=new AudioContext();engineOsc=audioContext.createOscillator();engineGain=audioContext.createGain();const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;engineOsc.type='sawtooth';engineOsc.frequency.value=48;engineGain.gain.value=0;engineOsc.connect(filter);filter.connect(engineGain);engineGain.connect(audioContext.destination);engineOsc.start();}
 if(soundOn)audioContext?.resume();soundButton.innerHTML=soundOn?'♫ <span>SOUND ON</span>':'♫ <span>SOUND</span>';if(engineGain)engineGain.gain.setTargetAtTime(soundOn?.035:0,audioContext.currentTime,.12);
});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));}
addEventListener('resize',resize);
function finishDelivery(){finished=true;speed=0;document.querySelector('#delivery-modal').classList.remove('hidden');document.querySelector('#engine-status').textContent='DELIVERY COMPLETE';}
function update(dt){
 elapsed+=dt;
 const forward=keys.has('w')||keys.has('arrowup'),reverse=keys.has('s')||keys.has('arrowdown'),braking=keys.has(' ');
 const steer=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
 if(started&&!finished){
  if(forward)speed=Math.min(32,speed+8.2*dt);else if(reverse){if(speed>.8)speed=Math.max(0,speed-13*dt);else speed=Math.max(-7,speed-4*dt);}else speed*=Math.max(0,1-.75*dt);
  if(braking)speed*=Math.max(0,1-4.8*dt);
  const turnFactor=Math.min(1,Math.abs(speed)/4);yaw-=steer*1.12*turnFactor*dt*Math.sign(speed||1);
  truck.rotation.y=yaw;
  const direction=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
  truck.position.addScaledVector(direction,speed*dt);
  wheelMeshes.forEach(w=>{w.rotation.x+=speed*dt/.56;});
  coins.forEach(c=>{if(c.active){c.group.rotation.y+=dt*1.5;if(c.group.position.distanceTo(truck.position)<2.5){c.active=false;c.group.visible=false;coinsCollected++;score+=250;showToast('RUBLE PICKUP  + ₽250');}}});
  if(checkpoint<objectives.length){const target=objectives[checkpoint];if(Math.hypot(truck.position.x-target.x,truck.position.z-target.z)<7.5){setCheckpoint(checkpoint+1);if(checkpoint===objectives.length){finishDelivery();}else showToast(`CHECKPOINT ${checkpoint} / ${objectives.length} · ${target.label}`);}}
 }
 gates.forEach((g,i)=>{if(g.visible){g.children.forEach(o=>{if(o.geometry?.type==='TorusGeometry')o.rotation.z+=dt*.32;});if(i===checkpoint)g.position.y=.12+Math.sin(elapsed*2)*.08;}});
 coins.forEach(c=>{if(c.active)c.group.rotation.z+=dt*.5;});
 const offset=new THREE.Vector3(0,7.3,13.8).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
 const desired=truck.position.clone().add(offset);camera.position.lerp(desired,1-Math.exp(-4.2*dt));
 const look=truck.position.clone().add(new THREE.Vector3(0,1.3,-7).applyAxisAngle(new THREE.Vector3(0,1,0),yaw));camera.lookAt(look);
 rainGroup.position.set(truck.position.x,0,truck.position.z);for(let i=0;i<rainCount;i++){const k=i*6;rainPositions[k+1]-=19*dt;rainPositions[k+4]-=19*dt;if(rainPositions[k+1]<1){const x=(Math.random()-.5)*95,y=26+Math.random()*12,z=(Math.random()-.5)*95;rainPositions[k]=x;rainPositions[k+1]=y;rainPositions[k+2]=z;rainPositions[k+3]=x-.17;rainPositions[k+4]=y-.75;rainPositions[k+5]=z-.1;}}rainGeo.attributes.position.needsUpdate=true;
 const kmh=Math.abs(speed)*3.6;document.querySelector('#speed').textContent=String(Math.round(kmh)).padStart(2,'0');document.querySelector('#gear').textContent=speed<-.5?'R':kmh<1?'N':kmh<20?'1':kmh<42?'2':kmh<70?'3':'4';document.querySelector('#engine-status').textContent=!started?'ENGINE IDLE':finished?'DELIVERY COMPLETE':kmh>2?'ENGINE RUNNING':'ENGINE IDLE';
 const clockMinutes=Math.floor(elapsed*1.8),minute=(40+clockMinutes)%60,hour=(21+Math.floor((40+clockMinutes)/60))%24;document.querySelector('#clock').textContent=`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
 if(checkpoint<objectives.length){const target=objectives[checkpoint],m=Math.round(Math.hypot(truck.position.x-target.x,truck.position.z-target.z));document.querySelector('#distance').textContent=`${m} m`;}
 if(engineOsc&&audioContext){engineOsc.frequency.setTargetAtTime(42+kmh*.9,audioContext.currentTime,.08);engineGain.gain.setTargetAtTime(soundOn?(started&&!finished?.025+Math.min(kmh/32,.5)*.045:0):0,audioContext.currentTime,.1);}
 drawMap();
}
let previous=performance.now();
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.04,(now-previous)/1000);previous=now;update(dt);renderer.render(scene,camera);}
truck.rotation.y=yaw;camera.position.set(0,9,47);camera.lookAt(0,1,-6);drawMap();requestAnimationFrame(animate);
