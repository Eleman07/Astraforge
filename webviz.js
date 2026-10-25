/** WebGL-based scene renderer. No native OpenGL/ModernGL dependency. */
const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
let threePromise,world;
export async function renderScene(container,description){
  if(!description?.objects)throw Error('No scene was produced. Call show_scene() in Python.');
  if(!threePromise)threePromise=import(THREE_URL);
  const THREE=await threePromise;
  if(world?.renderer)world.renderer.dispose();
  container.replaceChildren();
  const scene=new THREE.Scene();scene.background=new THREE.Color('#161c23');
  const camera=new THREE.PerspectiveCamera(55,1,0.1,100000);
  camera.position.set(10,8,12);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  container.append(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff,1.2));
  const sunlight=new THREE.DirectionalLight(0xffffff,2.1);sunlight.position.set(6,10,8);scene.add(sunlight);
  scene.add(new THREE.GridHelper(20,20,0x4a6070,0x2e3b48));
  const points=[];
  const target=new THREE.Vector3(0,0,0);let radius=15,azimuth=.7,polar=1.0;
  for(const object of description.objects.slice(0,100)){
    const safeColor=/^#[0-9a-f]{6}$/i.test(object.color||'')?object.color:'#80b4e8';
    const material=new THREE.MeshStandardMaterial({color:new THREE.Color(safeColor),roughness:.58,metalness:.12});
    if(object.type==='sphere'||object.type==='box'){
      const geometry=object.type==='sphere'?new THREE.SphereGeometry(Math.min(1000,Math.max(.01,Number(object.radius)||1)),24,16)
        :new THREE.BoxGeometry(...(object.size||[1,1,1]).slice(0,3).map(x=>Math.max(.01,Math.min(1000,Number(x)||1))));
      const mesh=new THREE.Mesh(geometry,material);
      const position=object.position||[0,0,0];mesh.position.set(...position.map(Number));scene.add(mesh);points.push(mesh.position);
    } else if(object.type==='path'){
      const vectors=(object.points||[]).slice(0,8000).map(p=>new THREE.Vector3(...p.map(Number)));
      if(vectors.length<2)continue;
      const geometry=new THREE.BufferGeometry().setFromPoints(vectors);
      scene.add(new THREE.Line(geometry,new THREE.LineBasicMaterial({color:safeColor})));
      points.push(...vectors.slice(0,50));
    }
  }
  if(points.length){
    const bounds=new THREE.Box3().setFromPoints(points),center=bounds.getCenter(new THREE.Vector3());
    const scale=Math.max(4,bounds.getSize(new THREE.Vector3()).length());
    target.copy(center);radius=scale*1.6;
    camera.far=Math.max(100000,scale*20);camera.updateProjectionMatrix();
  }
  const draw=()=>{
    if(!renderer.domElement.isConnected)return;
    const clamped=Math.max(.05,Math.min(Math.PI-.05,polar));
    camera.position.set(target.x+radius*Math.sin(clamped)*Math.cos(azimuth),
      target.y+radius*Math.cos(clamped),target.z+radius*Math.sin(clamped)*Math.sin(azimuth));
    camera.lookAt(target);renderer.render(scene,camera);
  };
  const resize=()=>{
    if(!renderer.domElement.isConnected)return;
    const w=Math.max(160,container.clientWidth),h=Math.max(140,container.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw();
  };
  // One finger rotates the scene; two fingers pinch to zoom on mobile.
  const pointers=new Map();let lastPinch=0;
  renderer.domElement.style.touchAction='none';
  const distance=()=>{
    const values=[...pointers.values()];
    return values.length===2?Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y):0;
  };
  renderer.domElement.addEventListener('pointerdown',event=>{
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2)lastPinch=distance();
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId))return;
    const previous=pointers.get(event.pointerId);
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===1){
      azimuth+=(event.clientX-previous.x)*.008;
      polar=Math.max(.08,Math.min(Math.PI-.08,polar+(event.clientY-previous.y)*.008));
    }else if(pointers.size===2){
      const next=distance();
      if(lastPinch>0&&next>0)radius=Math.max(.1,Math.min(1e7,radius*lastPinch/next));
      lastPinch=next;
    }
    draw();
  });
  const finish=event=>{pointers.delete(event.pointerId);lastPinch=0;};
  renderer.domElement.addEventListener('pointerup',finish);
  renderer.domElement.addEventListener('pointercancel',finish);
  renderer.domElement.addEventListener('wheel',event=>{
    event.preventDefault();radius=Math.max(.1,Math.min(1e7,radius*Math.exp(event.deltaY*.001)));draw();
  },{passive:false});
  resize();
  world={renderer,resize};return world;
}
export function resizeScene(){world?.resize?.()}
