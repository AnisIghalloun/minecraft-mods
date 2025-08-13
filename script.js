const STORAGE_KEY = "mc_mods_v1";
const CODE = "ANIS2006";

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function loadMods(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error(e);
    return [];
  }
}

function saveMods(mods){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mods));
}

function fileToDataUrl(file){ 
  return new Promise((res, rej)=>{
    if(!file) return res(null);
    const reader = new FileReader();
    reader.onload = ()=> res(reader.result);
    reader.onerror = ()=> rej("Error reading file");
    reader.readAsDataURL(file);
  });
}

function renderMods(){
  const container = document.getElementById("modsGrid");
  const noMods = document.getElementById("noMods");
  if(!container) return;
  const mods = loadMods();
  container.innerHTML = "";
  if(mods.length === 0){ noMods.style.display = "block"; return; } else noMods.style.display = "none";
  mods.slice().reverse().forEach(mod=>{
    const el = document.createElement("div");
    el.className = "mod";
    el.innerHTML = `
      <img class="thumb" src="${mod.image || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22140%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23eee%22/></svg>'}" alt="${escapeHtml(mod.name)}"/>
      <div class="body">
        <h3>${escapeHtml(mod.name)}</h3>
        <p>${escapeHtml(mod.desc)}</p>
        <div class="actions">
          <a class="btn primary" href="${mod.video ? mod.video : '#'}" ${mod.video ? 'target="_blank"':'onclick="return false"'}><i class="fa-solid fa-play"></i> فيديو</a>
          <a class="btn" href="#" data-id="${mod.id}" onclick="openMod(event)"><i class="fa-solid fa-circle-info"></i> التفاصيل</a>
          <a class="btn ghost" href="#" data-id="${mod.id}" onclick="requestDelete(event)"><i class="fa-solid fa-trash"></i> حذف</a>
        </div>
      </div>
    `;
    container.appendChild(el);
  });
}

function openMod(e){
  e.preventDefault();
  const id = e.currentTarget.dataset.id;
  const mods = loadMods();
  const mod = mods.find(m=>m.id===id);
  if(!mod) return alert("المود غير موجود");
  const modal = document.getElementById("modal");
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <h2>${escapeHtml(mod.name)}</h2>
    <img src="${mod.image || ''}" style="width:100%;max-height:320px;object-fit:cover;border-radius:8px;margin:8px 0"/>
    <p>${escapeHtml(mod.desc)}</p>
    ${mod.video ? `<div style="margin:8px 0"><a class="btn primary" href="${mod.video}" target="_blank"><i class="fa-solid fa-youtube"></i> مشاهدة الفيديو</a></div>` : ''}
    <hr/>
    <h4>التعليقات</h4>
    <div id="commentsList"></div>
    <label>اكتب تعليقك</label>
    <input id="commentName" placeholder="اسمك (اختياري)"/>
    <textarea id="commentText" rows="3" placeholder="نص التعليق"></textarea>
    <div style="margin-top:8px">
      <button class="btn primary" onclick="postComment('${mod.id}')"><i class="fa-solid fa-paper-plane"></i> نشر التعليق</button>
    </div>
    <p class="muted small">التعليقات تحفظ محليًا فقط في متصفحك.</p>
  `;
  loadComments(mod.id);
  modal.classList.remove("hidden");
}

const closeBtn = document.getElementById("closeModal");
if(closeBtn){
  closeBtn.addEventListener("click", ()=>{
    document.getElementById("modal").classList.add("hidden");
  });
}

function commentsKey(modId){ return `comments_${modId}`; }
function loadComments(modId){
  const list = document.getElementById("commentsList");
  const raw = localStorage.getItem(commentsKey(modId));
  const arr = raw ? JSON.parse(raw) : [];
  list.innerHTML = arr.length ? arr.map(c=>`<div style="border-bottom:1px solid #f1f1f1;padding:8px 0"><b>${escapeHtml(c.name||'مستخدم')}</b><p style="margin:6px 0">${escapeHtml(c.text)}</p><small class="muted">${new Date(c.time).toLocaleString()}</small></div>`).join('') : "<p class='muted'>لا يوجد تعليقات بعد.</p>";
}
function postComment(modId){
  const name = document.getElementById("commentName").value.trim();
  const text = document.getElementById("commentText").value.trim();
  if(!text) return alert("اكتب تعليقاً أولاً");
  const key = commentsKey(modId);
  const arr = JSON.parse(localStorage.getItem(key) || "[]");
  arr.push({name:name||"مستخدم", text, time: Date.now()});
  localStorage.setItem(key, JSON.stringify(arr));
  document.getElementById("commentText").value = "";
  document.getElementById("commentName").value = "";
  loadComments(modId);
}

function handleUploadForm(){
  const form = document.getElementById("uploadForm");
  if(!form) return;
  form.addEventListener("submit", async function(ev){
    ev.preventDefault();
    const code = document.getElementById("publishCode").value.trim();
    if(code !== CODE) return alert("كود النشر غير صحيح.");
    const name = document.getElementById("modName").value.trim();
    const desc = document.getElementById("modDesc").value.trim();
    const video = document.getElementById("modVideo").value.trim();
    const file = document.getElementById("modImage").files[0];
    if(!file){
      return alert("يرجى اختيار صورة للمود.");
    }
    const dataUrl = await fileToDataUrl(file).catch(()=>null);
    const mods = loadMods();
    const newMod = { id: uid(), name, desc, video: video || "", image: dataUrl || "", created: Date.now() };
    mods.push(newMod);
    saveMods(mods);
    alert("تم نشر المود بنجاح!");
    window.location.href = "index.html";
  });
}

function requestDelete(e){
  e.preventDefault();
  const id = e.currentTarget.dataset.id;
  const entered = prompt("لحذف هذا المود أدخل كود الحذف:").trim();
  if(!entered) return;
  if(entered !== CODE) return alert("الكود غير صحيح. لا يمكنك الحذف.");
  let mods = loadMods();
  mods = mods.filter(m=>m.id !== id);
  saveMods(mods);
  localStorage.removeItem(commentsKey(id));
  alert("تم حذف المود.");
  document.getElementById("modal").classList.add("hidden");
  renderMods();
}

function escapeHtml(s){
  if(typeof s !== "string") return "";
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

document.addEventListener("DOMContentLoaded", ()=>{
  renderMods();
  handleUploadForm();
});