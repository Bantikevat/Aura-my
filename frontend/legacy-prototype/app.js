/* ORBIT — a local-first spatial task workspace */
(() => {
  const initialTasks = [
    { id: 1, title: 'Refine mobile onboarding flow', space: 'Product launch', priority: 'high', status: 'progress', due: 'Today · 11:30', person: 'AK', pos: [-3.1, .4, .1] },
    { id: 2, title: 'Approve launch narrative', space: 'Product launch', priority: 'high', status: 'ready', due: 'Today · 14:00', person: 'SK', pos: [-1.25, 1.25, -.3] },
    { id: 3, title: 'Create empty-state illustrations', space: 'Design system', priority: 'medium', status: 'progress', due: 'Tomorrow', person: 'RM', pos: [.65, -.4, .4] },
    { id: 4, title: 'Audit accessibility contrast', space: 'Design system', priority: 'medium', status: 'ready', due: 'Oct 21', person: 'SK', pos: [2.5, 1.05, -.2] },
    { id: 5, title: 'Book founder interview', space: 'Personal', priority: 'low', status: 'ready', due: 'Oct 23', person: 'SK', pos: [3.25, -.8, .1] },
    { id: 6, title: 'QA event tracking', space: 'Product launch', priority: 'high', status: 'progress', due: 'Today · 16:00', person: 'DV', pos: [.25, 1.7, .2] },
    { id: 7, title: 'Review competitor positioning', space: 'Product launch', priority: 'low', status: 'done', due: 'Done', person: 'AK', pos: [-2.4, -1.25, -.1] },
    { id: 8, title: 'Consolidate research notes', space: 'Personal', priority: 'low', status: 'done', due: 'Done', person: 'SK', pos: [1.75, -1.4, .3] }
  ];
  let tasks = JSON.parse(localStorage.getItem('orbit-tasks') || 'null') || initialTasks;
  let selectedId = Number(localStorage.getItem('orbit-selected')) || 1;
  let scene, camera, renderer, controls, raycaster, pointer, nodeMap = new Map(), focusTimer, elapsed = 0;
  const $ = s => document.querySelector(s);
  const color = { high: 0xff6e7a, medium: 0xffc366, low: 0x61d9a0 };
  const safe = value => String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const active = () => tasks.find(t => t.id === selectedId) || tasks[0];
  function save() { localStorage.setItem('orbit-tasks', JSON.stringify(tasks)); localStorage.setItem('orbit-selected', selectedId); }
  function label(status) { return status === 'progress' ? 'In progress' : status === 'done' ? 'Completed' : 'Ready to start'; }
  function render() {
    const total = tasks.length, done = tasks.filter(t => t.status === 'done').length, pct = Math.round(done / total * 100);
    $('#done-count').textContent = done; $('#total-count').textContent = total; $('#completion').textContent = `${pct}%`; $('#my-count').textContent = tasks.filter(t => t.status !== 'done').length;
    $('#task-lane').innerHTML = tasks.filter(t => t.status !== 'done').slice(0, 4).map(t => `<article class="task-card ${t.id === selectedId ? 'selected':''} cursor-pointer rounded-xl border border-white/10 bg-white/[.025] p-4" data-task="${t.id}"><div class="flex justify-between gap-3"><span class="priority-${t.priority} rounded-full text-[10px] uppercase tracking-wider px-2 py-1">${t.priority}</span><button data-complete="${t.id}" title="Mark complete" class="w-5 h-5 rounded-full border border-slate-500 hover:border-mint text-[10px]">✓</button></div><h3 class="font-medium text-sm mt-3">${safe(t.title)}</h3><div class="flex justify-between text-xs mt-3 text-slate-500"><span>${safe(t.space)}</span><span>${t.due}</span></div></article>`).join('');
    $('#list-view').innerHTML = tasks.filter(t => t.status !== 'done').map(t => `<button data-task="${t.id}" class="w-full text-left py-3 border-b border-white/5 last:border-0 flex items-center gap-3"><span class="w-2 h-2 rounded-full" style="background:#${color[t.priority].toString(16)}"></span><span class="text-sm flex-1">${safe(t.title)}</span><span class="text-xs text-slate-500">${t.due}</span></button>`).join('');
    const t = active(); if (!t) return;
    $('#focus-name').textContent = t.title; $('#focus-meta').textContent = `${t.space} · ${label(t.status)} · ${t.due}`;
    $('#activity').innerHTML = [`<div class="flex gap-3"><span class="text-mint">●</span><p><b>${safe(t.person)}</b> moved <b>${safe(t.title)}</b> into focus<small class="block text-slate-500 mt-1">just now</small></p></div>`, `<div class="flex gap-3"><span class="text-ice">◆</span><p><b>Riya</b> completed “Research synthesis”<small class="block text-slate-500 mt-1">18 min ago</small></p></div>`, `<div class="flex gap-3"><span class="text-amber-300">●</span><p><b>Dev</b> added an update in Product launch<small class="block text-slate-500 mt-1">42 min ago</small></p></div>`].join('');
    $('#space-list').innerHTML = ['Product launch','Design system','Personal'].map((name, i) => `<button class="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 flex items-center gap-2"><i class="w-2 h-2 rounded-full ${i===0?'bg-rose-400':i===1?'bg-ice':'bg-mint'}"></i>${name}<span class="ml-auto text-xs">${tasks.filter(t => t.space === name && t.status !== 'done').length}</span></button>`).join('');
    buildNodes(); save();
  }
  function init3D() {
    const host = $('#space-canvas'); scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x0b1121, .11);
    camera = new THREE.PerspectiveCamera(43, host.clientWidth/host.clientHeight, .1, 100); camera.position.set(0, 0, 10);
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true }); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(host.clientWidth,host.clientHeight); renderer.outputEncoding = THREE.sRGBEncoding; host.prepend(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement); controls.enablePan = false; controls.minDistance = 6; controls.maxDistance = 14; controls.autoRotate = true; controls.autoRotateSpeed = .35; controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0x7994c9, .75)); const key = new THREE.PointLight(0x8be7ff, 1.2, 25); key.position.set(-4, 4, 5); scene.add(key);
    const grid = new THREE.GridHelper(13, 16, 0x34506e, 0x18243a); grid.rotation.x = Math.PI/2; grid.material.opacity = .38; grid.material.transparent = true; scene.add(grid);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.4,3.44,80), new THREE.MeshBasicMaterial({color:0x68cff4,transparent:true,opacity:.16,side:THREE.DoubleSide})); scene.add(ring);
    raycaster = new THREE.Raycaster(); pointer = new THREE.Vector2(); renderer.domElement.addEventListener('pointerdown', pick); window.addEventListener('resize', resize);
    animate();
  }
  function buildNodes() {
    if (!scene) return; nodeMap.forEach(o => scene.remove(o)); nodeMap.clear();
    tasks.filter(t => t.status !== 'done').forEach((t, ix) => { const group = new THREE.Group(); const core = new THREE.Mesh(new THREE.IcosahedronGeometry(t.id===selectedId?.42:.31, 2), new THREE.MeshStandardMaterial({color:color[t.priority], emissive:color[t.priority], emissiveIntensity:t.id===selectedId?1.2:.4, roughness:.4})); const halo = new THREE.Mesh(new THREE.RingGeometry(.48,.51,32),new THREE.MeshBasicMaterial({color:color[t.priority],transparent:true,opacity:.45,side:THREE.DoubleSide})); halo.rotation.x=Math.PI/2; group.add(core,halo); group.position.set(...(t.pos || [Math.cos(ix)*2,Math.sin(ix)*1.5,0])); group.userData={taskId:t.id, core, halo, phase:ix}; scene.add(group); nodeMap.set(t.id, group); });
  }
  function pick(event) { const box=renderer.domElement.getBoundingClientRect(); pointer.x=(event.clientX-box.left)/box.width*2-1; pointer.y=-(event.clientY-box.top)/box.height*2+1; raycaster.setFromCamera(pointer,camera); const all=[...nodeMap.values()]; const hit=raycaster.intersectObjects(all,true)[0]; if(hit){ let obj=hit.object; while(obj && !obj.userData.taskId) obj=obj.parent; if(obj){ selectedId=obj.userData.taskId; render(); } } }
  function resize(){ const h=$('#space-canvas'); if(renderer){camera.aspect=h.clientWidth/h.clientHeight;camera.updateProjectionMatrix();renderer.setSize(h.clientWidth,h.clientHeight)} }
  function animate(){ requestAnimationFrame(animate); if(scene){const now=performance.now()*.001;nodeMap.forEach(g=>{g.position.z=Math.sin(now+g.userData.phase)*.28;g.children[1].rotation.z=now*.6;});controls.update();renderer.render(scene,camera)} }
  function taskClick(e){ const complete=e.target.closest('[data-complete]'); if(complete){e.stopPropagation(); const t=tasks.find(x=>x.id===Number(complete.dataset.complete)); t.status='done'; if(selectedId===t.id) selectedId=tasks.find(x=>x.status!=='done')?.id; render(); return;} const card=e.target.closest('[data-task]'); if(card){selectedId=Number(card.dataset.task);render();} }
  function setup(){
    init3D(); render();
    $('#task-lane').addEventListener('click',taskClick); $('#list-view').addEventListener('click',taskClick);
    document.querySelectorAll('.view-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.view-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#space-canvas').classList.toggle('hidden',b.dataset.view==='list');$('#list-view').classList.toggle('hidden',b.dataset.view==='spatial');});
    document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
    $('#new-task').onclick=()=>$('#task-dialog').showModal(); $('#task-dialog form').addEventListener('submit',e=>{e.preventDefault(); const title=$('#task-title').value.trim();if(!title)return; const id=Math.max(...tasks.map(t=>t.id))+1;tasks.unshift({id,title,space:$('#task-space').value,priority:$('#task-priority').value,status:'ready',due:'New',person:'SK',pos:[(Math.random()-.5)*5,(Math.random()-.5)*3,0]});selectedId=id;$('#task-title').value='';$('#task-dialog').close();render();});
    $('#clear-completed').onclick=()=>{tasks=tasks.filter(t=>t.status!=='done');if(!tasks.find(t=>t.id===selectedId))selectedId=tasks[0]?.id;render()};
    $('#focus-toggle').onclick=()=>document.body.classList.toggle('focus-mode'); $('#start-focus').onclick=()=>{clearInterval(focusTimer);elapsed=0;const b=$('#start-focus');b.textContent='Focus running';focusTimer=setInterval(()=>{elapsed++;$('#focus-progress').style.width=`${Math.min(100,elapsed/15*100)}%`;if(elapsed>=15){clearInterval(focusTimer);b.textContent='Complete focus';}},1000)};
    $('#momentum-bars').innerHTML=[28,45,36,62,49,82,66,94,58,73,88,68].map((n,i)=>`<i class="flex-1 rounded-sm ${i===7?'bg-ice':'bg-slate-700'}" style="height:${n}%"></i>`).join('');
  }
  document.addEventListener('DOMContentLoaded',setup);
})();
