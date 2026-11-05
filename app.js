(() => {
  const cfg = window.SOUNDVIBE_CONFIG || {};
  const configured = cfg.SUPABASE_URL?.includes("supabase.co") && !cfg.SUPABASE_URL.includes("YOUR-PROJECT") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR_");
  const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const audio = $("#audio");
  let tracks = [], albums = [], currentIndex = -1, activeFilter = "all";

  $("#year").textContent = new Date().getFullYear();
  const fmt = n => { if (!Number.isFinite(n)) return "0:00"; const m=Math.floor(n/60),s=Math.floor(n%60); return `${m}:${String(s).padStart(2,"0")}`; };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = msg => { const el=$("#toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),3000); };
  const msg = (id, text, bad=false) => { const el=$(id); if(el){el.textContent=text;el.className="form-message "+(bad?"error":"success");} };

  // Плавні анімації вікна відгуків
  const animStyle = document.createElement("style");
  animStyle.textContent = `
    @keyframes svFadeIn{from{opacity:0}to{opacity:1}}
    @keyframes svFadeOut{from{opacity:1}to{opacity:0}}
    @keyframes svPop{from{opacity:0;transform:translateY(28px) scale(.96)}to{opacity:1;transform:none}}
    @keyframes svPopOut{from{opacity:1;transform:none}to{opacity:0;transform:translateY(18px) scale(.97)}}
    @keyframes svRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
    .modal.open{animation:svFadeIn .3s ease both}
    .modal.open .modal-card{animation:svPop .45s cubic-bezier(.22,1,.36,1) both}
    .modal.open .review-area{animation:svRise .55s .15s cubic-bezier(.22,1,.36,1) both}
    .modal.open .review-form>*{animation:svRise .5s cubic-bezier(.22,1,.36,1) both}
    .modal.open .review-form>*:nth-child(1){animation-delay:.22s}
    .modal.open .review-form>*:nth-child(2){animation-delay:.28s}
    .modal.open .review-form>*:nth-child(3){animation-delay:.34s}
    .modal.open .review-form>*:nth-child(4){animation-delay:.40s}
    .modal.open .review-form>*:nth-child(5){animation-delay:.46s}
    .modal.open.closing{animation:svFadeOut .25s ease both}
    .modal.open.closing .modal-card{animation:svPopOut .25s ease both}
    .review{animation:svRise .45s cubic-bezier(.22,1,.36,1) both}
    #review-message{transition:opacity .3s ease}
    @media (prefers-reduced-motion:reduce){
      .modal.open,.modal.open .modal-card,.modal.open .review-area,.modal.open .review-form>*,.review{animation:none!important}
    }
  `;
  document.head.appendChild(animStyle);
  const closeModal = el => {
    if (!el || !el.classList.contains("open") || el.classList.contains("closing")) return;
    el.classList.add("closing");
    setTimeout(() => el.classList.remove("open", "closing"), 250);
  };


  // ===== Обране (зберігається в браузері відвідувача) =====
  const FAV_KEY = "soundvibe_favorites";
  const LISTENED_KEY = "soundvibe_listened";
  // true  = один відвідувач (браузер) рахується один раз для кожного треку ("скільки людей послухали")
  // false = рахується кожне повне прослуховування
  const COUNT_ONCE_PER_DEVICE = true;
  const readJSON = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key) || ""); return v ?? fallback; } catch { return fallback; } };
  const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const savedFavs = readJSON(FAV_KEY, {});
  const favs = { tracks: Array.isArray(savedFavs.tracks) ? savedFavs.tracks : [], albums: Array.isArray(savedFavs.albums) ? savedFavs.albums : [] };
  const listenedSet = new Set(readJSON(LISTENED_KEY, []));
  const isFav = (kind, id) => favs[kind].includes(String(id));

  const favStyle = document.createElement("style");
  favStyle.textContent = `
    @keyframes svHeart{0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)}}
    .track-card{position:relative}
    .fav-btn{width:34px;height:34px;border-radius:50%;border:1px solid #ffffff2a;background:rgba(9,9,9,.68);backdrop-filter:blur(6px);color:#fff;font-size:17px;line-height:1;display:grid;place-items:center;padding:0;transition:.25s}
    .fav-btn:hover{transform:scale(1.12);border-color:var(--lime);color:var(--lime)}
    .fav-btn.active{background:var(--lime);color:#111;border-color:var(--lime)}
    .fav-btn.pop,.fav-wide.pop{animation:svHeart .45s ease}
    .track-card>.fav-btn{position:absolute;top:20px;right:20px;z-index:3}
    .album-card>.fav-btn{position:absolute;top:14px;right:14px;z-index:3}
    .fav-wide{margin-left:8px}
    .fav-wide.active{background:var(--lime);color:#111;border-color:var(--lime)}
    .detail-layout .btn{margin-top:6px}
    .listen-count{letter-spacing:1px}
    .listen-line{color:var(--lime)!important;font-weight:600}
    .fav-count{display:inline-block;margin-left:6px;min-width:18px;padding:1px 6px;border-radius:10px;background:var(--lime);color:#111;font-size:10px;font-weight:700;text-align:center}
    .fav-sub{font:600 16px var(--display);color:#ccc;margin:28px 0 14px}
    .fav-sub:first-of-type{margin-top:0}
  `;
  document.head.appendChild(favStyle);

  const favBtn = (kind, id) => `<button class="fav-btn ${isFav(kind, id) ? "active" : ""}" data-fav-${kind === "tracks" ? "track" : "album"}="${id}" aria-label="В обране">${isFav(kind, id) ? "♥" : "♡"}</button>`;
  const trackCard = t => `<article class="track-card">${favBtn("tracks", t.id)}<button class="cover-button" data-play="${t.id}" aria-label="Слухати ${esc(t.title)}"><img class="track-cover" src="${esc(t.cover_url||"")}" alt=""><span class="cover-play">▶</span></button><div class="track-info"><div><h3>${esc(t.title)}</h3><p>${esc(t.artist)}</p></div><button class="more-btn" data-detail="${t.id}" aria-label="Деталі">•••</button></div><div class="track-meta"><span>${t.is_featured?"✦ POPULAR":"SOUNDVIBE"} · <span class="listen-count" data-listens="${t.id}" title="Прослухали до кінця">♪ ${t.play_count||0}</span></span><button data-play="${t.id}">▶ СЛУХАТИ</button></div></article>`;
  const albumCard = a => `<article class="album-card">${favBtn("albums", a.id)}<img src="${esc(a.cover_url || "")}" alt=""><div class="album-overlay"><span>ALBUM</span><h3>${esc(a.title)}</h3><p>${esc(a.artist)}</p></div></article>`;

  function renderFavorites(){
    const tg = $("#fav-track-grid"), ag = $("#fav-album-grid");
    if (!tg || !ag) return;
    const ft = tracks.filter(t => isFav("tracks", t.id));
    const fa = albums.filter(x => isFav("albums", x.id));
    tg.innerHTML = ft.length ? ft.map(trackCard).join("") : '<div class="empty-state">Тут буде твоя улюблена музика. Натисни ♡ на треку, щоб додати його сюди.</div>';
    ag.innerHTML = fa.length ? fa.map(albumCard).join("") : '<div class="empty-state">Улюблених альбомів поки немає. Натисни ♡ на альбомі, щоб додати його сюди.</div>';
    const c = $("#fav-count"), n = ft.length + fa.length;
    if (c) { c.textContent = n; c.hidden = !n; }
  }

  function toggleFav(kind, id){
    id = String(id);
    const arr = favs[kind], i = arr.indexOf(id), on = i < 0;
    if (on) arr.push(id); else arr.splice(i, 1);
    writeJSON(FAV_KEY, favs);
    const attr = kind === "tracks" ? "data-fav-track" : "data-fav-album";
    $$(`[${attr}="${id}"]`).forEach(b => {
      b.classList.toggle("active", on);
      b.textContent = b.dataset.wide ? (on ? "♥ В обраному" : "♡ В обране") : (on ? "♥" : "♡");
      if (on) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
    });
    toast(on ? "Додано в обране ♥" : "Прибрано з обраного");
    renderFavorites();
  }

  // ===== Прослуховування (рахується лише якщо трек прослухали до кінця) =====
  let listened = 0, lastTime = 0;
  const resetListenTracking = () => { listened = 0; lastTime = 0; };
  function trackListening(){
    const now = audio.currentTime, d = now - lastTime;
    if (d > 0 && d < 1.5 && !audio.paused) listened += d; // перемотка не додає часу
    lastTime = now;
  }
  function updateListenCount(t){
    $$(`[data-listens="${t.id}"]`).forEach(el => { el.textContent = (el.dataset.prefix || "♪ ") + (t.play_count || 0); });
  }
  async function registerListen(){
    const t = tracks[currentIndex];
    const dur = audio.duration;
    if (!t || !sb || !Number.isFinite(dur) || dur <= 0) return;
    if (listened < dur * 0.9) return; // не дослухали — не рахуємо
    if (COUNT_ONCE_PER_DEVICE && listenedSet.has(String(t.id))) return;
    const { error } = await sb.rpc("increment_play_count", { p_track_id: String(t.id) });
    if (error) { console.error(error); return; }
    if (COUNT_ONCE_PER_DEVICE) { listenedSet.add(String(t.id)); writeJSON(LISTENED_KEY, [...listenedSet]); }
    t.play_count = (t.play_count || 0) + 1;
    updateListenCount(t);
  }

  async function loadAll(){
    if(!sb){ $("#track-grid").innerHTML='<div class="empty-state config-warning">Потрібно підключити Supabase. Відкрий README.md та заповни config.js.</div>'; return; }
    try {
      const [trackResult,albumResult]=await Promise.all([
        sb.from("tracks").select("*").order("created_at",{ascending:false}),
        sb.from("albums").select("*").order("created_at",{ascending:false})
      ]);
      if(trackResult.error) throw trackResult.error;
      if(albumResult.error) throw albumResult.error;
      tracks=trackResult.data||[]; albums=albumResult.data||[];
      renderTracks(); renderAlbums(); renderFavorites();
      const postsResult=await sb.from("posts").select("*").order("created_at",{ascending:false});
      if(postsResult.error) throw postsResult.error;
      renderPosts(postsResult.data||[]);
    } catch(e){ console.error(e); $("#track-grid").innerHTML=`<div class="empty-state">Не вдалося завантажити дані: ${esc(e.message)}</div>`; }
  }

  function renderTracks(){
    const q=$("#search").value.trim().toLowerCase();
    let list=tracks.filter(t=>(`${t.title} ${t.artist}`.toLowerCase().includes(q)));
    if(activeFilter==="new") list=list.slice(0,8);
    if(activeFilter==="popular") list=list.filter(t=>t.is_featured);
    $("#track-grid").innerHTML=list.length?list.map(trackCard).join(""):'<div class="empty-state">За цим запитом нічого не знайдено.</div>';
  }

  function renderAlbums(){
    const albumGrid = $("#album-grid");
    if (albumGrid) {
      albumGrid.innerHTML = albums.length
        ? albums.map(albumCard).join("")
        : '<div class="empty-state">Альбоми ще не додані.</div>';
    }

    // Цей список є лише в адмін-панелі, тому на головній сторінці
    // елементу #track-album може не бути.
    const albumSelect = $("#track-album");
    if (albumSelect) {
      albumSelect.innerHTML = '<option value="">Без альбому</option>' +
        albums.map(a => `<option value="${a.id}">${esc(a.title)}</option>`).join("");
    }
  }

  function renderPosts(posts){
    const grid=$("#post-grid");
    if(!grid) return;
    grid.innerHTML=posts.length?posts.map(p=>`<article class="post-card">${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:""}<div class="post-content"><span class="eyebrow">SOUNDVIBE JOURNAL · ${new Date(p.created_at).toLocaleDateString("uk-UA")}</span><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></div></article>`).join(""):'<div class="empty-state">Поки немає дописів.</div>';
  }

  function playTrack(id){
    const i=tracks.findIndex(t=>t.id===id); if(i<0)return;
    currentIndex=i; const t=tracks[i];
    audio.src=t.audio_url; audio.play().catch(()=>toast("Не вдалося відтворити аудіофайл."));
    $("#player-title").textContent=t.title; $("#player-artist").textContent=t.artist;
    $("#player-cover").src=t.cover_url||""; $("#player").classList.add("visible"); $("#play-toggle").textContent="Ⅱ";
    resetListenTracking();
  }

  function syncPlaybackStatus(){
    const playing = !audio.paused && !audio.ended;
    $("#sound-status").textContent = playing ? "ON." : "OFF.";
    $("#play-toggle").textContent = playing ? "Ⅱ" : "▶";
  }

  function togglePlay(){if(!audio.src){if(tracks[0])playTrack(tracks[0].id);return;}if(audio.paused){audio.play().catch(()=>toast("Не вдалося відтворити аудіофайл."));}else{audio.pause();}}

  function detail(id){
    const t=tracks.find(x=>x.id===id); if(!t)return;
    $("#track-detail-content").innerHTML=`<div class="detail-layout"><img class="detail-cover" src="${esc(t.cover_url||"")}" alt=""><div><div class="eyebrow">TRACK DETAILS</div><h2>${esc(t.title)}</h2><p class="muted">${esc(t.artist)}</p><p>${esc(t.description||"")}</p><p class="listen-line"><span data-listens="${t.id}" data-prefix="♪ Прослухали до кінця: ">♪ Прослухали до кінця: ${t.play_count||0}</span></p><button class="btn btn-primary" data-play="${t.id}">▶ Слухати трек</button><button class="btn btn-ghost fav-wide ${isFav("tracks",t.id)?"active":""}" data-fav-track="${t.id}" data-wide="1">${isFav("tracks",t.id)?"♥ В обраному":"♡ В обране"}</button></div></div><div class="review-area"><h3>Відгуки про трек</h3><form id="review-form" class="review-form"><input name="author_name" maxlength="50" required placeholder="Твоє ім'я"><select name="rating"><option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option><option value="2">★★☆☆☆</option><option value="1">★☆☆☆☆</option></select><textarea name="body" maxlength="1000" required placeholder="Поділися враженнями..."></textarea><button class="btn btn-primary" type="submit">Залишити відгук</button><p id="review-message" style="margin:10px 0 0;font-weight:600;"></p></form><div id="reviews-list">Завантаження відгуків...</div></div>`;
    $("#track-modal").classList.remove("closing");
    $("#track-modal").classList.add("open");
    loadReviews(id);

    const form=$("#review-form");
    const reviewMsg=(text,bad=false)=>{
      const el=$("#review-message");
      if(!el)return;
      el.textContent=text;
      el.style.color=bad?"#ff6b6b":"#c8ff4d";
    };
    let msgTimer;

    form.addEventListener("submit",async e=>{
      e.preventDefault();
      if(!sb)return;
      const btn=form.querySelector("[type=submit]");
      const oldText=btn.textContent;
      btn.disabled=true;
      btn.textContent="Надсилаємо…";
      reviewMsg("");
      const f=new FormData(form);
      const {error}=await sb.from("reviews").insert({
        track_id:id,
        author_name:f.get("author_name"),
        rating:Number(f.get("rating")),
        body:f.get("body")
      });
      btn.disabled=false;
      btn.textContent=oldText;
      if(error){
        reviewMsg("Не вдалося надіслати відгук: "+error.message,true);
        return;
      }
      form.reset();
      reviewMsg("✓ Відгук надіслано. Дякуємо за відгук!");
      toast("Дякуємо за відгук!");
      clearTimeout(msgTimer);
      msgTimer=setTimeout(()=>reviewMsg(""),5000);
      loadReviews(id);
    });
  }

  async function loadReviews(id){
    if(!sb)return;
    const {data,error}=await sb.from("reviews").select("*").eq("track_id",id).eq("is_visible",true).order("created_at",{ascending:false});
    const list=$("#reviews-list");
    if(!list)return;
    list.innerHTML=error?"Не вдалося завантажити відгуки.":data.length?data.map(r=>`<div class="review"><div><b>${esc(r.author_name)}</b><span>${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</span></div><p>${esc(r.body)}</p></div>`).join(""):'<p class="muted">Поки немає відгуків. Будь першим!</p>';
  }

  document.addEventListener("click",e=>{
    const fT=e.target.closest("[data-fav-track]");if(fT){toggleFav("tracks",fT.dataset.favTrack);return;}
    const fA=e.target.closest("[data-fav-album]");if(fA){toggleFav("albums",fA.dataset.favAlbum);return;}
    const p=e.target.closest("[data-play]");if(p)playTrack(p.dataset.play);
    const d=e.target.closest("[data-detail]");if(d)detail(d.dataset.detail);
    const close=e.target.closest("[data-close]");if(close)closeModal($("#"+close.dataset.close));
  });
  $("#search").addEventListener("input",renderTracks);$("#search-focus").addEventListener("click",()=>{$("#search").focus();$("#tracks").scrollIntoView({behavior:"smooth"});});
  $$(".filter-chip").forEach(b=>b.addEventListener("click",()=>{$$(".filter-chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeFilter=b.dataset.filter;renderTracks();}));
  $("#play-toggle").addEventListener("click",togglePlay);$("#prev-track").addEventListener("click",()=>{if(currentIndex>0)playTrack(tracks[currentIndex-1].id);});$("#next-track").addEventListener("click",()=>{if(currentIndex<tracks.length-1)playTrack(tracks[currentIndex+1].id);});
  audio.addEventListener("play",syncPlaybackStatus);
  audio.addEventListener("pause",syncPlaybackStatus);
  audio.addEventListener("ended",syncPlaybackStatus);
  audio.addEventListener("timeupdate",()=>{trackListening();$("#current-time").textContent=fmt(audio.currentTime);$("#duration").textContent=fmt(audio.duration);$("#seek").value=audio.duration?audio.currentTime/audio.duration*100:0;});
  audio.addEventListener("ended",()=>{registerListen();if(currentIndex<tracks.length-1)playTrack(tracks[currentIndex+1].id);else syncPlaybackStatus();});
  $("#seek").addEventListener("input",e=>{if(audio.duration)audio.currentTime=audio.duration*e.target.value/100;});
  $("#volume").addEventListener("input",e=>audio.volume=Number(e.target.value));$("#mute-toggle").addEventListener("click",()=>{audio.muted=!audio.muted;$("#mute-toggle").textContent=audio.muted?"◖×)":"◖))";});
  $("#mobile-menu").addEventListener("click",()=>$(".main-nav").classList.toggle("nav-open"));
  loadAll();
})();
