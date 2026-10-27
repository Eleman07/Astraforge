/** AstraForge WebGL viewport: browser-native 3D primitives and animation.
 * This is not the native ModernGL API. The Python-to-WebGL bridge only sends
 * validated geometry/transforms and registered interaction event identifiers.
 */
const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
let threePromise,world;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export async function renderScene(container,description,{onPick}={}){
  if(!description || !Array.isArray(description.objects))throw Error('Call show_scene() in Python first.');
  if(!threePromise)threePromise=import(THREE_URL);
  const THREE=await threePromise;
  const previous=world?.cameraState||null;
  if(world?.dispose)world.dispose();
  container.replaceChildren();
  const scene=new THREE.Scene();scene.background=new THREE.Color('#0D1B2A');
  const camera=new THREE.PerspectiveCamera(55,1,0.1,1e8);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  container.append(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff,1.4));
  const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(6,10,8);scene.add(sun);
  scene.add(new THREE.GridHelper(20,20,0x415A77,0x1B263B));
  const meshById=new Map(),pickable=[],positions=[];
  let currentTarget=new THREE.Vector3(),radius=15,azimuth=.7,polar=1.05;
  for(const item of description.objects.slice(0,100)){
    const color=/^#[a-f0-9]{6}$/i.test(item.color||'')?item.color:'#D4C4A8';
    const id=String(item.id||'');
    if(item.type==='sphere'||item.type==='box'){
      const geometry=item.type==='sphere'?
        new THREE.SphereGeometry(clamp(Number(item.radius)||1,.01,10000),24,16):
        new THREE.BoxGeometry(...(item.size||[1,1,1]).map(x=>clamp(Number(x)||1,.01,10000)));
      const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,metalness:.14,roughness:.6}));
      const pos=(item.position||[0,0,0]).map(Number);
      mesh.position.set(...pos);scene.add(mesh);positions.push(mesh.position);mesh.userData={id,action:item.on_click};
      pickable.push(mesh);meshById.set(id,mesh);
    }else if(item.type==='path'){
      const vectors=(item.points||[]).slice(0,8000).map(p=>new THREE.Vector3(...p.map(Number)));
      if(vectors.length>=2){
        const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(vectors),new THREE.LineBasicMaterial({color}));
        scene.add(line);positions.push(...vectors.slice(0,100));meshById.set(id,line);
      }
    }
  }
  if(positions.length){
    const bounds=new THREE.Box3().setFromPoints(positions),center=bounds.getCenter(new THREE.Vector3());
    currentTarget.copy(center);radius=clamp(bounds.getSize(new THREE.Vector3()).length()*1.6,5,1e6);
    camera.far=Math.max(100000,radius*50);camera.updateProjectionMatrix();
  }
  if(previous){currentTarget.copy(previous.target);radius=previous.radius;azimuth=previous.azimuth;polar=previous.polar;}
  const frames=Array.isArray(description.frames)?description.frames.slice(0,1500):[];
  const fps=clamp(Number(description.fps)||24,1,60);
  let frame=0,playing=false,raf=0,elapsed=0,lastFrameTime=0,dragged=false;
  const draw=()=>{
    if(!renderer.domElement.isConnected)return;
    camera.position.set(currentTarget.x+radius*Math.sin(polar)*Math.cos(azimuth),
      currentTarget.y+radius*Math.cos(polar),currentTarget.z+radius*Math.sin(polar)*Math.sin(azimuth));
    camera.lookAt(currentTarget);renderer.render(scene,camera);
  };
  const resize=()=>{
    if(!renderer.domElement.isConnected)return;
    const width=Math.max(160,container.clientWidth),height=Math.max(150,container.clientHeight- (frames.length?42:0));
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();draw();
  };
  const bar=document.createElement('div');bar.className='af-scene-playback';
  const play=document.createElement('button');play.textContent='▶ Play';play.type='button';
  const reset=document.createElement('button');reset.textContent='↺';reset.title='Reset animation';reset.type='button';
  const seek=document.createElement('input');seek.type='range';seek.min='0';seek.max=String(Math.max(0,frames.length-1));seek.value='0';seek.setAttribute('aria-label','Animation frame');
  const frameLabel=document.createElement('span');frameLabel.textContent=`0 / ${frames.length}`;
  const applyFrame=index=>{
    frame=clamp(Math.round(index),0,frames.length-1);
    for(const [id,point] of Object.entries(frames[frame]||{})){
      const mesh=meshById.get(id);if(mesh&&mesh.position&&Array.isArray(point))mesh.position.set(...point.map(Number));
    }
    seek.value=String(frame);frameLabel.textContent=`${frame+1} / ${frames.length}`;draw();
  };
  if(frames.length){
    bar.append(play,reset,seek,frameLabel);container.append(bar);
    play.onclick=()=>{playing=!playing;play.textContent=playing?'Ⅱ Pause':'▶ Play';lastFrameTime=0;if(playing)raf=requestAnimationFrame(tick)};
    reset.onclick=()=>{playing=false;play.textContent='▶ Play';cancelAnimationFrame(raf);applyFrame(0)};
    seek.oninput=()=>{playing=false;play.textContent='▶ Play';cancelAnimationFrame(raf);applyFrame(Number(seek.value))};
    applyFrame(0);
  }
  function tick(now){
    if(!playing||!renderer.domElement.isConnected)return;
    if(!lastFrameTime)lastFrameTime=now;
    elapsed+=now-lastFrameTime;lastFrameTime=now;
    if(elapsed>=1000/fps){
      const step=Math.min(20,Math.floor(elapsed/(1000/fps)));elapsed%=1000/fps;
      let next=frame+step;
      if(next>=frames.length){if(description.loop)next%=frames.length;else {next=frames.length-1;playing=false;play.textContent='▶ Play';}}
      applyFrame(next);
    }
    if(playing)raf=requestAnimationFrame(tick);
  }
  const pointers=new Map();let pinchDistance=0;
  renderer.domElement.style.touchAction='none';
  const dist=()=>{const v=[...pointers.values()];return v.length===2?Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y):0};
  renderer.domElement.addEventListener('pointerdown',e=>{dragged=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2)pinchDistance=dist();renderer.domElement.setPointerCapture(e.pointerId)});
  renderer.domElement.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const prev=pointers.get(e.pointerId);const deltaX=e.clientX-prev.x,deltaY=e.clientY-prev.y;
    if(Math.abs(deltaX)+Math.abs(deltaY)>3)dragged=true;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===1){azimuth+=deltaX*.008;polar=clamp(polar+deltaY*.008,.08,Math.PI-.08)}
    else if(pointers.size===2){const next=dist();if(pinchDistance>0&&next>0)radius=clamp(radius*pinchDistance/next,.1,1e8);pinchDistance=next}
    draw();
  });
  const pointerup=e=>{pointers.delete(e.pointerId);pinchDistance=0};
  renderer.domElement.addEventListener('pointerup',pointerup);
  renderer.domElement.addEventListener('pointercancel',pointerup);
  renderer.domElement.addEventListener('click',event=>{
    if(dragged)return;
    const rect=renderer.domElement.getBoundingClientRect();
    const pointer=new THREE.Vector2(2*(event.clientX-rect.left)/rect.width-1,1-2*(event.clientY-rect.top)/rect.height);
    const raycaster=new THREE.Raycaster();raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(pickable)[0];
    if(hit?.object?.userData?.action&&typeof onPick==='function'){
      const {id,action}=hit.object.userData;
      void onPick(action,id).catch(error=>console.warn('3D callback:',error));
    }
  });
  renderer.domElement.addEventListener('wheel',event=>{event.preventDefault();radius=clamp(radius*Math.exp(event.deltaY*.001),.1,1e8);draw()},{passive:false});
  resize();
  const resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;resizeObserver?.observe(container);
  world={renderer,resize,cameraState:{get target(){return currentTarget},get radius(){return radius},get azimuth(){return azimuth},get polar(){return polar}},
    dispose(){playing=false;cancelAnimationFrame(raf);resizeObserver?.disconnect();for(const id of meshById.values()){id.geometry?.dispose();id.material?.dispose?.()}renderer.dispose()}};
  return world;
}
export function resizeScene(){world?.resize?.()}
