const KEY='yuki_cine_projects_v1';let projects=JSON.parse(localStorage.getItem(KEY)||'[]'),activeId=null,deferredPrompt=null;
const $=id=>document.getElementById(id);const save=()=>localStorage.setItem(KEY,JSON.stringify(projects));const active=()=>projects.find(p=>p.id===activeId);
function toast(t){let el=$('toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2100)}
function go(page){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===page));document.querySelectorAll('.navitem').forEach(x=>x.classList.toggle('active',x.dataset.go===page));if(page==='home')renderHome()}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
$('newProjectBtn').onclick=()=>go('create');
function renderHome(){$('projectCount').textContent=projects.length+' dự án';$('projectList').innerHTML=projects.length?projects.slice().reverse().map(p=>`<div class="projectcard"><h3>${esc(p.title)}</h3><p>${esc(p.duration)} · ${esc(p.ratio)} · ${esc(p.style)}</p><div class="sub">${p.scenes.length} phân cảnh · ${new Date(p.updated).toLocaleDateString('vi-VN')}</div><button data-open="${p.id}">Mở dự án →</button></div>`).join(''):'<div class="empty">Chưa có dự án nào.<br>Hãy tạo bộ phim đầu tiên của bạn.</div>';document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openProject(b.dataset.open))}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('createProjectBtn').onclick=()=>{let title=$('pTitle').value.trim()||'Dự án chưa đặt tên',idea=$('pIdea').value.trim();if(!idea){toast('Hãy nhập ý tưởng phim trước nhé');return}let p={id:crypto.randomUUID(),title,idea,purpose:$('pPurpose').value,duration:$('pDuration').value,ratio:$('pRatio').value,language:$('pLanguage').value,style:$('pStyle').value,audio:$('pAudio').value,scenes:[],assets:[],characters:[],updated:Date.now()};projects.push(p);save();activeId=p.id;seedScenes(p);save();openProject(p.id);toast('Đã tạo dự án')}
function seedScenes(p){let count=p.duration.includes('15')?3:p.duration.includes('30')?4:p.duration.includes('60')?6:8;let labels=['Thiết lập không gian','Giới thiệu chủ thể','Chuyển động / hành động','Cao trào thị giác','Khoảnh khắc kết nối','Kết thúc / nhận diện'];for(let i=0;i<count;i++){p.scenes.push({id:crypto.randomUUID(),name:`Cảnh ${String(i+1).padStart(2,'0')} – ${labels[i%labels.length]}`,duration:Math.max(3,Math.round(parseInt(p.duration)||30/count)),shot:'Toàn cảnh mở đầu, thiết lập không gian và bầu không khí.',camera:'Slow dolly-in',angle:['Wide establishing shot','Medium shot','Close-up','Low angle'][i%4],action:p.idea,vi:'',en:''})}}
function openProject(id){activeId=id;let p=active();$('activeTitle').textContent=p.title;$('projectMeta').textContent=`${p.duration}  •  ${p.ratio}  •  ${p.style}  •  ${p.language}`;renderScenes();renderPromptSelect();renderAssets();renderCharacters();document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab==='story'));document.querySelectorAll('.tabpane').forEach(x=>x.classList.toggle('active',x.id==='tab-story'));go('project')}
$('deleteProjectBtn').onclick=()=>{if(!confirm('Xóa dự án này khỏi thiết bị?'))return;projects=projects.filter(p=>p.id!==activeId);activeId=null;save();go('home')};
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tabpane').forEach(x=>x.classList.toggle('active',x.id==='tab-'+b.dataset.tab));if(b.dataset.tab==='prompts')loadPrompt()});
function renderScenes(){let p=active();$('sceneList').innerHTML=p.scenes.map((s,i)=>`<div class="scene" data-scene="${s.id}"><div class="scenehead"><b>${esc(s.name)}</b><small>${i+1} / ${p.scenes.length}</small></div><label>Tên cảnh<input data-field="name" value="${esc(s.name)}"></label><div class="two"><label>Thời lượng (giây)<input data-field="duration" type="number" min="1" value="${s.duration}"></label><label>Camera movement<select data-field="camera">${['Static wide','Slow dolly-in','Dolly-out','Orbit 180°','Tracking shot','Crane / aerial','Handheld','Pan left-to-right','Tilt-up','FPV push-through','Rack focus'].map(v=>`<option ${s.camera===v?'selected':''}>${v}</option>`).join('')}</select></label></div><label>Mô tả hình ảnh / hành động<textarea data-field="shot" rows="3">${esc(s.shot)}</textarea></label><div class="scene-actions"><button class="textbtn" data-remove="${s.id}">Xóa cảnh</button></div></div>`).join('');$('sceneList').querySelectorAll('[data-field]').forEach(el=>el.onchange=()=>{let box=el.closest('[data-scene]'),s=p.scenes.find(x=>x.id===box.dataset.scene);s[el.dataset.field]=el.value;p.updated=Date.now();save();renderPromptSelect()});$('sceneList').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{p.scenes=p.scenes.filter(s=>s.id!==b.dataset.remove);save();renderScenes();renderPromptSelect()})}
$('addSceneBtn').onclick=()=>{let p=active();p.scenes.push({id:crypto.randomUUID(),name:`Cảnh ${p.scenes.length+1}`,duration:5,camera:'Slow dolly-in',angle:'Medium shot',shot:'Mô tả hành động chính của cảnh.'});save();renderScenes();renderPromptSelect()};
$('generateShotsBtn').onclick=()=>{let p=active();if(!p.scenes.length)seedScenes(p);p.scenes.forEach((s,i)=>{if(!s.shot||s.shot.startsWith('Toàn cảnh'))s.shot=`${p.idea}. Cảnh ${i+1}: ${s.name}. Nhấn mạnh bố cục điện ảnh, chiều sâu không gian, ánh sáng có chủ đích và một hành động rõ ràng.`});save();renderScenes();toast('Đã tạo gợi ý mô tả cho các cảnh')};
function renderPromptSelect(){let p=active();$('promptScene').innerHTML=p.scenes.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');if(p.scenes.length)loadPrompt()}
function makePrompts(s,p){let vi=`Video ${p.style.toLowerCase()}, ${p.ratio}. ${s.shot} Bối cảnh và ý tưởng tổng thể: ${p.idea}. Camera: ${s.camera}; góc máy: ${s.angle||'Medium shot'}, thời lượng ${s.duration} giây. Chuyển động tự nhiên, bố cục rõ ràng, ánh sáng điện ảnh, chi tiết chân thực, chuyển động mượt, giữ tính liên tục về nhân vật và không gian. ${p.audio}. ${faceLockText(p)} `;let en=`Cinematic ${p.style.toLowerCase()} video, ${p.ratio} aspect ratio. ${s.shot} Overall concept: ${p.idea}. Camera movement: ${s.camera}; shot angle: ${s.angle||'Medium shot'}, duration ${s.duration} seconds. Natural motion, clear composition, intentional cinematic lighting, realistic details, smooth movement, maintain character and environment continuity. Audio: ${p.audio}. ${faceLockText(p)} `;return {vi,en}}
function loadPrompt(){let p=active(),s=p.scenes.find(x=>x.id===$('promptScene').value)||p.scenes[0];if(!s)return;let q=makePrompts(s,p);$('promptVi').value=s.vi||q.vi;$('promptEn').value=s.en||q.en}
$('promptScene').onchange=loadPrompt;$('promptVi').oninput=()=>{let s=active().scenes.find(x=>x.id===$('promptScene').value);if(s)s.vi=$('promptVi').value;save()};$('promptEn').oninput=()=>{let s=active().scenes.find(x=>x.id===$('promptScene').value);if(s)s.en=$('promptEn').value;save()};
$('copyVi').onclick=()=>copy($('promptVi').value);$('copyEn').onclick=()=>copy($('promptEn').value);async function copy(t){try{await navigator.clipboard.writeText(t);toast('Đã sao chép')}catch(e){toast('Không thể sao chép tự động')}}
$('assetInput').onchange=e=>{let p=active();[...e.target.files].forEach(f=>p.assets.push({name:f.name,type:f.type,size:f.size}));save();renderAssets();e.target.value=''};
function renderAssets(){let p=active();$('assetList').innerHTML=p.assets.length?p.assets.map((a,i)=>`<div class="asset"><span>▧ ${esc(a.name)}</span><span>${(a.size/1024/1024).toFixed(1)} MB</span></div>`).join(''):'<div class="empty">Chưa có tài nguyên.</div>'}
function download(name,content,type){let a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('exportJsonBtn').onclick=()=>download('yuki-cine-project.json',JSON.stringify(active(),null,2),'application/json');$('exportTxtBtn').onclick=()=>{let p=active(),txt=`${p.title}\n${p.idea}\n${p.duration} | ${p.ratio} | ${p.style}\n\n`+p.scenes.map((s,i)=>`CẢNH ${i+1}: ${s.name}\nThời lượng: ${s.duration}s\nCamera: ${s.camera}\nMô tả: ${s.shot}\n\nPROMPT VI:\n${s.vi||makePrompts(s,p).vi}\n\nPROMPT EN:\n${s.en||makePrompts(s,p).en}\n`).join('\n');download('yuki-cine-storyboard.txt',txt,'text/plain;charset=utf-8')};
$('backupBtn').onclick=()=>download('yuki-cine-backup.json',JSON.stringify(projects,null,2),'application/json');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false});$('installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null}else toast('Trên iPhone: Safari → Chia sẻ → Thêm vào MH chính')};
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

function faceLockText(p){let c=(p.characters||[])[0];if(!c)return '';if(c.lock==='strict')return `FACE IDENTITY LOCK: preserve the same character identity and facial structure as the supplied reference image; do not redesign or beautify the face. Character identity: ${c.identity||c.name}.`;if(c.lock==='balanced')return `Maintain recognizable character identity and facial proportions from the reference; allow only natural scene lighting changes. Character: ${c.identity||c.name}.`;return `Character reference: ${c.identity||c.name}.`}
function renderCharacters(){let p=active();if(!p)return;let arr=p.characters||[];$('characterList').innerHTML=arr.length?arr.map((c,i)=>`<div class="asset"><span>◉ <b>${esc(c.name)}</b><br><small>${esc(c.lock)} · ${esc(c.files.join(', ')||'Chưa có ảnh')}</small><br><small>${esc(c.identity)}</small></span><button class="textbtn" data-char-del="${i}">Xóa</button></div>`).join(''):'<div class="empty">Chưa có hồ sơ nhân vật.</div>';document.querySelectorAll('[data-char-del]').forEach(b=>b.onclick=()=>{p.characters.splice(Number(b.dataset.charDel),1);save();renderCharacters()})}
$('saveCharacterBtn').onclick=()=>{let p=active(),name=$('charName').value.trim();if(!name){toast('Nhập tên nhân vật');return}let files=[...$('charImage').files].map(f=>f.name);p.characters=p.characters||[];p.characters.push({name,identity:$('charIdentity').value.trim(),lock:$('charLock').value,files});save();renderCharacters();$('charName').value='';$('charIdentity').value='';$('charImage').value='';toast('Đã lưu hồ sơ nhân vật')};
$('appendMotionBtn').onclick=()=>{let pace=$('motionPace').value,type=$('motionType').value,tail=` Motion direction: ${pace}; ${type}. Keep movement physically plausible, smooth and temporally consistent; avoid abrupt morphing, identity drift, extra limbs, jitter and unintended cuts.`;$('promptVi').value += ` Chỉ dẫn chuyển động: ${pace}; ${type}. Chuyển động tự nhiên, liên tục, không méo hình hoặc thay đổi nhận diện nhân vật.`;$('promptEn').value += tail;let s=active().scenes.find(x=>x.id===$('promptScene').value);if(s){s.vi=$('promptVi').value;s.en=$('promptEn').value;save()}toast('Đã thêm chỉ dẫn chuyển động')};

renderHome();

// ===== YUKI CINE STUDIO V5: real Gemini video analysis via Cloud Run =====
const ANALYSIS_API_KEY = 'yuki_cine_cloud_run_api_url_v1';
let latestVideoAnalysis = null;
const apiUrlInput = $('analysisApiUrl');
if (apiUrlInput) {
  apiUrlInput.value = localStorage.getItem(ANALYSIS_API_KEY) || '';
  $('saveAnalysisApi').onclick = async () => {
    const value = apiUrlInput.value.trim().replace(/\/+$/, '');
    if (!/^https:\/\/.+/.test(value)) { toast('Nhập URL HTTPS của Cloud Run'); return; }
    localStorage.setItem(ANALYSIS_API_KEY, value);
    await checkAnalysisServer();
  };
  $('sourceVideoFile').onchange = e => {
    const f = e.target.files[0];
    $('selectedVideoName').textContent = f ? `${f.name} · ${(f.size/1024/1024).toFixed(1)} MB` : 'Chưa chọn tệp video.';
  };
  $('runVideoAnalysis').onclick = runRealVideoAnalysis;
  $('copyMasterPrompt').onclick = () => copy($('analysisMasterPrompt').value);
  $('copyAllScenePrompts').onclick = () => {
    if (!latestVideoAnalysis) return;
    const text = (latestVideoAnalysis.scenes || []).map((s,i) =>
      `SCENE ${i+1} | ${s.start_time || ''} - ${s.end_time || ''}\nVI: ${s.prompt_vi || ''}\nEN: ${s.prompt_en || ''}`).join('\n\n');
    copy(text);
  };
  $('exportAnalysisJson').onclick = () => {
    if (latestVideoAnalysis) download('yuki-cine-video-analysis.json', JSON.stringify(latestVideoAnalysis,null,2), 'application/json');
  };
  if (localStorage.getItem(ANALYSIS_API_KEY)) checkAnalysisServer();
}
async function checkAnalysisServer() {
  const base = (localStorage.getItem(ANALYSIS_API_KEY) || '').replace(/\/+$/, '');
  const el = $('analysisConnectionState');
  if (!base) { el.textContent = 'Chưa nhập URL Cloud Run.'; return; }
  el.textContent = 'Đang kiểm tra máy chủ…';
  try {
    const r = await fetch(base + '/health');
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || 'Health check failed');
    el.textContent = `Đã kết nối máy chủ · ${j.service || 'YUKI CINE API'} · model ${j.model || 'Gemini'}`;
  } catch (e) {
    el.textContent = 'Chưa kết nối được: ' + e.message;
  }
}
async function runRealVideoAnalysis() {
  const base = (localStorage.getItem(ANALYSIS_API_KEY) || '').replace(/\/+$/, '');
  const file = $('sourceVideoFile').files[0];
  const url = $('sourceVideoUrl').value.trim();
  const progress = $('analysisProgress');
  if (!base) { toast('Hãy lưu URL Cloud Run trước'); return; }
  if (!file && !url) { toast('Chọn video hoặc dán link YouTube'); return; }
  if (file && url) { toast('Chọn một nguồn: video tải lên hoặc link'); return; }
  if (!$('rightsConfirm').checked) { toast('Vui lòng xác nhận quyền sử dụng video'); return; }
  if (file && file.size > 25 * 1024 * 1024) { toast('Video vượt giới hạn 25 MB của bản này'); return; }
  if (url && !/(youtube\.com\/|youtu\.be\/)/i.test(url)) {
    toast('Bản hiện tại nhận link YouTube công khai; nguồn khác hãy tải video lên');
    return;
  }
  const btn = $('runVideoAnalysis');
  btn.disabled = true;
  $('analysisResults').hidden = true;
  progress.textContent = 'Đang gửi video đến Cloud Run…';
  try {
    let response;
    if (file) {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('depth', $('analysisDepth').value);
      fd.append('language', $('analysisLanguage').value);
      fd.append('extra', $('analysisExtra').value);
      response = await fetch(base + '/api/analyze-video', {method:'POST', body:fd});
    } else {
      response = await fetch(base + '/api/analyze-youtube', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url, depth:$('analysisDepth').value, language:$('analysisLanguage').value, extra:$('analysisExtra').value})
      });
    }
    const data = await response.json().catch(()=>({error:'Máy chủ trả về dữ liệu không hợp lệ'}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    latestVideoAnalysis = data.analysis || data;
    renderVideoAnalysis(latestVideoAnalysis);
    progress.textContent = 'Phân tích hoàn tất. Hãy kiểm tra từng cảnh và chỉnh prompt nếu cần.';
    $('analysisResults').hidden = false;
    $('analysisResults').scrollIntoView({behavior:'smooth', block:'start'});
  } catch (e) {
    progress.textContent = 'Phân tích thất bại: ' + e.message;
  } finally {
    btn.disabled = false;
  }
}
function renderVideoAnalysis(a) {
  $('analysisSummary').innerHTML = `<p><b>${esc(a.title || 'Video gốc')}</b></p>
    <p class="muted">${esc(a.overall_summary || '')}</p>
    <p class="tiny muted">Phong cách: ${esc(a.visual_style || 'Chưa xác định')} · Âm thanh: ${esc(a.audio_summary || 'Chưa xác định')}</p>`;
  $('analysisMasterPrompt').value = a.master_prompt || '';
  $('analysisSceneList').innerHTML = (a.scenes || []).map((s,i)=>`
    <article class="analysis-scene">
      <h3>Cảnh ${i+1}: ${esc(s.title || s.action || 'Phân cảnh')}</h3>
      <p class="analysis-time">${esc(s.start_time || '?')} → ${esc(s.end_time || '?')}</p>
      <p><b>Hình ảnh:</b> ${esc(s.visual_description || '')}</p>
      <p><b>Hành động:</b> ${esc(s.action || '')}</p>
      <p><b>Máy quay:</b> ${esc(s.camera || '')} · <b>Góc máy:</b> ${esc(s.shot_type || '')}</p>
      <p><b>Ánh sáng / màu:</b> ${esc(s.lighting_color || '')}</p>
      <p><b>Chuyển cảnh:</b> ${esc(s.transition || '')}</p>
      <label>Prompt VI<textarea readonly rows="5">${esc(s.prompt_vi || '')}</textarea></label>
      <label>Prompt EN<textarea readonly rows="5">${esc(s.prompt_en || '')}</textarea></label>
      <button class="secondary full" data-copy-scene="${i}">Sao chép prompt cảnh này</button>
    </article>`).join('') || '<p class="muted">AI chưa trả về cảnh nào.</p>';
  $('analysisSceneList').querySelectorAll('[data-copy-scene]').forEach(b => b.onclick = () => {
    const s = (a.scenes || [])[Number(b.dataset.copyScene)];
    copy(`VI:\n${s.prompt_vi || ''}\n\nEN:\n${s.prompt_en || ''}`);
  });
}
