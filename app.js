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
  const trackCard = t => `<article class="track-card">${favBtn("tracks", t.id)}<button class="cover-button" data-play="${t.id}" aria-label="Слухати ${esc(t.title)}"><img class="track-cover" src="${esc(t.cover_url||"")}" alt=""><span class="cover-play">▶</span><span class="cover-expand" data-open-player="${t.id}" role="button" aria-label="Відкрити плеєр">⤢</span></button><div class="track-info"><div><h3><button class="track-title-open" data-open-player="${t.id}">${esc(t.title)}</button></h3><p>${esc(t.artist)}</p></div><button class="more-btn" data-detail="${t.id}" aria-label="Деталі">•••</button></div><div class="track-meta"><span>${t.is_featured?"✦ POPULAR":"SOUNDVIBE"} · <span class="listen-count" data-listens="${t.id}" title="Прослухали до кінця">♪ ${t.play_count||0}</span></span><button data-play="${t.id}">▶ СЛУХАТИ</button></div></article>`;
  const albumCard = a => `<article class="album-card">${favBtn("albums", a.id)}<img src="${esc(a.cover_url || "")}" alt=""><div class="album-overlay"><span>ALBUM</span><h3>${esc(a.title)}</h3><p>${esc(a.artist)}</p></div></article>`;

  function renderFavorites(){
    updateFavBadge();
    const m=$("#me-modal");
    if (m && m.classList.contains("open") && meTab === "favs") renderPane();
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
    syncFav(kind, id, on);
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

    const isAllTracksPage=document.body.classList.contains("tracks-page");
    const isDesktop=window.matchMedia("(min-width: 701px)").matches;
    const viewAll=$("#view-all-tracks");
    if(viewAll){
      const show=viewAll && !isAllTracksPage && isDesktop && activeFilter==="all" && list.length>8;
      viewAll.hidden=!show;
    }
    if(!isAllTracksPage && isDesktop) list=list.slice(0,8);
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
    if($("#now-playing")?.classList.contains("open")) syncNowPlaying();
    if("mediaSession" in navigator){try{navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist,artwork:t.cover_url?[{src:t.cover_url}]:[]});}catch{}}
  }

  function openNowPlaying(id){
    if(id && (tracks[currentIndex]?.id !== id || !audio.src)) playTrack(id);
    const t=tracks[currentIndex];
    if(!t) return;
    const modal=$("#now-playing");
    $("#np-cover").src=t.cover_url||"";
    $("#np-title").textContent=t.title;
    $("#np-artist").textContent=t.artist;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    document.body.classList.add("now-playing-open");
    syncNowPlaying();
  }
  function closeNowPlaying(){
    const modal=$("#now-playing");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    document.body.classList.remove("now-playing-open");
  }
  function syncNowPlaying(){
    const t=tracks[currentIndex];
    if(!t) return;
    $("#np-cover").src=t.cover_url||"";
    $("#np-title").textContent=t.title;
    $("#np-artist").textContent=t.artist;
    const playing=!audio.paused && !audio.ended;
    $("#np-play").textContent=playing?"Ⅱ":"▶";
    $("#np-play").setAttribute("aria-label",playing?"Пауза":"Відтворити");
    $("#np-visualizer").classList.toggle("playing",playing);
    $("#np-current").textContent=fmt(audio.currentTime);
    $("#np-duration").textContent=fmt(audio.duration);
    $("#np-seek").value=audio.duration?audio.currentTime/audio.duration*100:0;
    $("#np-prev").disabled=currentIndex<=0;
    $("#np-next").disabled=currentIndex>=tracks.length-1;
  }

  function syncPlaybackStatus(){
    const playing = !audio.paused && !audio.ended;
    $("#sound-status").textContent = playing ? "ON." : "OFF.";
    $("#play-toggle").textContent = playing ? "Ⅱ" : "▶";
    if($("#now-playing")?.classList.contains("open")) syncNowPlaying();
  }

  function togglePlay(){if(!audio.src){if(tracks[0])playTrack(tracks[0].id);return;}if(audio.paused){audio.play().catch(()=>toast("Не вдалося відтворити аудіофайл."));}else{audio.pause();}}

  function detail(id){
    const t=tracks.find(x=>x.id===id); if(!t)return;
    $("#track-detail-content").innerHTML=`<div class="detail-layout"><img class="detail-cover" src="${esc(t.cover_url||"")}" alt=""><div><div class="eyebrow">TRACK DETAILS</div><h2>${esc(t.title)}</h2><p class="muted">${esc(t.artist)}</p><p>${esc(t.description||"")}</p><p class="listen-line"><span data-listens="${t.id}" data-prefix="♪ Прослухали до кінця: ">♪ Прослухали до кінця: ${t.play_count||0}</span></p><button class="btn btn-primary" data-play="${t.id}">▶ Слухати трек</button><button class="btn btn-ghost fav-wide ${isFav("tracks",t.id)?"active":""}" data-fav-track="${t.id}" data-wide="1">${isFav("tracks",t.id)?"♥ В обраному":"♡ В обране"}</button></div></div><div class="review-area"><h3>Відгуки про трек</h3><form id="review-form" class="review-form"><input name="author_name" maxlength="50" required placeholder="Твоє ім'я"><select name="rating"><option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option><option value="2">★★☆☆☆</option><option value="1">★☆☆☆☆</option></select><textarea name="body" maxlength="1000" required placeholder="Поділися враженнями..."></textarea><button class="btn btn-primary" type="submit">Залишити відгук</button><p id="review-message" style="margin:10px 0 0;font-weight:600;"></p></form><div id="reviews-list">Завантаження відгуків...</div></div>`;
    $("#track-modal").classList.remove("closing");
    $("#track-modal").classList.add("open");
    loadReviews(id);

    const form=$("#review-form");
    if(profile && form.elements.author_name) form.elements.author_name.value = nick();
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

  document.addEventListener("keydown",e=>{
    const playerTrack=e.target.closest(".player-track[data-open-player]");
    if(playerTrack && (e.key==="Enter" || e.key===" ")){e.preventDefault();openNowPlaying();}
  });
  document.addEventListener("click",e=>{
    const fT=e.target.closest("[data-fav-track]");if(fT){toggleFav("tracks",fT.dataset.favTrack);return;}
    const fA=e.target.closest("[data-fav-album]");if(fA){toggleFav("albums",fA.dataset.favAlbum);return;}
    const np=e.target.closest("[data-open-player]");if(np){e.preventDefault();openNowPlaying(np.dataset.openPlayer);return;}
    const p=e.target.closest("[data-play]");if(p)playTrack(p.dataset.play);
    const d=e.target.closest("[data-detail]");if(d)detail(d.dataset.detail);
    const close=e.target.closest("[data-close]");if(close)closeModal($("#"+close.dataset.close));
  });
  window.addEventListener("resize",renderTracks);
  $("#search").addEventListener("input",renderTracks);$("#search-focus").addEventListener("click",()=>{$("#search").focus();$("#tracks").scrollIntoView({behavior:"smooth"});});
  $$(".filter-chip").forEach(b=>b.addEventListener("click",()=>{$$(".filter-chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeFilter=b.dataset.filter;renderTracks();}));
  $("#play-toggle").addEventListener("click",togglePlay);$("#prev-track").addEventListener("click",()=>{if(currentIndex>0)playTrack(tracks[currentIndex-1].id);});$("#next-track").addEventListener("click",()=>{if(currentIndex<tracks.length-1)playTrack(tracks[currentIndex+1].id);});
  audio.addEventListener("play",syncPlaybackStatus);
  audio.addEventListener("pause",syncPlaybackStatus);
  audio.addEventListener("ended",syncPlaybackStatus);
  audio.addEventListener("timeupdate",()=>{trackListening();$("#current-time").textContent=fmt(audio.currentTime);$("#duration").textContent=fmt(audio.duration);$("#seek").value=audio.duration?audio.currentTime/audio.duration*100:0;if($("#now-playing")?.classList.contains("open"))syncNowPlaying();});
  audio.addEventListener("loadedmetadata",syncNowPlaying);
  audio.addEventListener("ended",()=>{registerListen();if(currentIndex<tracks.length-1)playTrack(tracks[currentIndex+1].id);else syncPlaybackStatus();});
  $("#seek").addEventListener("input",e=>{if(audio.duration)audio.currentTime=audio.duration*e.target.value/100;});
  $("#np-close").addEventListener("click",closeNowPlaying);
  $("#np-play").addEventListener("click",togglePlay);
  $("#np-prev").addEventListener("click",()=>{if(currentIndex>0)playTrack(tracks[currentIndex-1].id);});
  $("#np-next").addEventListener("click",()=>{if(currentIndex<tracks.length-1)playTrack(tracks[currentIndex+1].id);});
  $("#np-seek").addEventListener("input",e=>{if(audio.duration)audio.currentTime=audio.duration*e.target.value/100;});
  $("#now-playing").addEventListener("click",e=>{if(e.target===$("#now-playing"))closeNowPlaying();});
  $("#volume").addEventListener("input",e=>audio.volume=Number(e.target.value));$("#mute-toggle").addEventListener("click",()=>{audio.muted=!audio.muted;$("#mute-toggle").textContent=audio.muted?"◖×)":"◖))";});
  // ===== Мобільне меню: закривається по кліку на пункт, поза меню, Esc і при поверненні до ПК-ширини =====
  const menuBtn=$("#mobile-menu"), mainNav=$(".main-nav");
  menuBtn.setAttribute("aria-label","Меню"); menuBtn.setAttribute("aria-expanded","false");
  const setMenu=open=>{mainNav.classList.toggle("nav-open",open);menuBtn.setAttribute("aria-expanded",String(open));menuBtn.textContent=open?"✕":"☰";};
  menuBtn.addEventListener("click",()=>setMenu(!mainNav.classList.contains("nav-open")));
  mainNav.addEventListener("click",e=>{if(e.target.closest("a"))setMenu(false);});
  document.addEventListener("click",e=>{if(mainNav.classList.contains("nav-open")&&!e.target.closest(".main-nav,#mobile-menu"))setMenu(false);});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){setMenu(false);closeNowPlaying();}});
  window.matchMedia("(min-width:701px)").addEventListener("change",e=>{if(e.matches)setMenu(false);});
  // На телефоні вікно треку закривається тапом по затемненню
  $("#track-modal").addEventListener("click",e=>{if(e.target.id==="track-modal"&&window.matchMedia("(max-width:700px)").matches)closeModal(e.target);});
  // Керування з екрана блокування / навушників
  if("mediaSession" in navigator){const ms=navigator.mediaSession,set=(a,f)=>{try{ms.setActionHandler(a,f);}catch{}};
    set("play",()=>audio.play());set("pause",()=>audio.pause());
    set("previoustrack",()=>{if(currentIndex>0)playTrack(tracks[currentIndex-1].id);});
    set("nexttrack",()=>{if(currentIndex<tracks.length-1)playTrack(tracks[currentIndex+1].id);});}

  // =====================================================================
  //  АКАУНТ (реєстрація за бажанням), ПРОФІЛЬ ТА ОБРАНЕ
  // =====================================================================
  let user = null, profile = null, meTab = "favs";
  const PERSON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';
  const nick = () => profile?.nickname || user?.user_metadata?.nickname || (user?.email || "").split("@")[0] || "Слухач";
  const avatarInner = () => profile?.avatar_url ? `<img src="${esc(profile.avatar_url)}" alt="">` : PERSON;
  const openModal = el => { el.classList.remove("closing"); el.classList.add("open"); };
  const authErr = m => {
    m = String(m || "");
    const map = [
      [/invalid login/i, "Невірний email або пароль."],
      [/already registered|already been registered/i, "Цей email уже зареєстровано. Спробуй увійти."],
      [/at least 6|weak/i, "Пароль має містити щонайменше 6 символів."],
      [/not confirmed/i, "Підтверди email — ми надіслали лист із посиланням."],
      [/rate limit|too many|security purposes/i, "Забагато спроб. Спробуй трохи пізніше."],
      [/valid email|invalid email/i, "Введи правильний email."],
      [/same password|different from the old/i, "Новий пароль має відрізнятися від старого."],
      [/schema cache|does not exist|bucket not found/i, "Профілі ще не налаштовано в Supabase — виконай файл setup.sql."]
    ];
    for (const [r, t] of map) if (r.test(m)) return t;
    return m;
  };

  function updateFavBadge(){
    const n = favs.tracks.length + favs.albums.length;
    const b = $("#fav-badge"), g = $("#fav-glyph"), btn = $("#fav-open");
    if (!b) return;
    b.textContent = n > 99 ? "99+" : n; b.hidden = !n;
    g.textContent = n ? "♥" : "♡";
    btn.classList.toggle("has", !!n);
  }
  function renderAuthUI(){
    $("#auth-open").hidden = !!user;
    const a = $("#account-open"); a.hidden = !user;
    if (user) { a.innerHTML = avatarInner(); a.title = nick(); }
    updateFavBadge();
  }

  // ----- профіль -----
  async function loadProfile(){
    const { data, error } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) { profile = data; return; }
    if (error) console.warn("profiles:", error.message);
    const row = { id: user.id, nickname: (user.user_metadata?.nickname || (user.email || "").split("@")[0] || "Слухач").slice(0, 24) };
    const ins = error ? { data: null } : await sb.from("profiles").upsert(row).select().maybeSingle();
    profile = ins.data || row;
  }
  async function saveProfile(patch){
    const row = { id: user.id, nickname: profile?.nickname || nick(), avatar_url: profile?.avatar_url || null, ...patch };
    const { data, error } = await sb.from("profiles").upsert(row).select().maybeSingle();
    if (error) throw error;
    profile = data || row;
  }
  async function resizeImage(file, size = 256){
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const s = Math.min(img.width, img.height), c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      return await new Promise(r => c.toBlob(r, "image/jpeg", .88));
    } finally { URL.revokeObjectURL(url); }
  }

  // ----- обране: синхронізація з акаунтом -----
  async function syncFav(kind, id, on){
    if (!sb || !user) return;
    const q = on
      ? sb.from("favorites").upsert({ user_id: user.id, kind, item_id: String(id) }, { onConflict: "user_id,kind,item_id", ignoreDuplicates: true })
      : sb.from("favorites").delete().match({ user_id: user.id, kind, item_id: String(id) });
    const { error } = await q;
    if (error) console.error("favorites:", error.message);
  }
  async function syncFavsFromServer(){
    const { data, error } = await sb.from("favorites").select("kind,item_id").eq("user_id", user.id);
    if (error) { console.error("favorites:", error.message); return; }
    const server = { tracks: [], albums: [] }, push = [];
    (data || []).forEach(r => server[r.kind]?.push(String(r.item_id)));
    for (const k of ["tracks", "albums"]) {
      favs[k].forEach(id => { if (!server[k].includes(id)) push.push({ user_id: user.id, kind: k, item_id: id }); });
      favs[k] = [...new Set([...server[k], ...favs[k]])];
    }
    writeJSON(FAV_KEY, favs);
    if (push.length) { const r = await sb.from("favorites").upsert(push, { onConflict: "user_id,kind,item_id", ignoreDuplicates: true }); if (r.error) console.error(r.error.message); }
  }

  async function applySession(session){
    const u = session?.user || null;
    if (!u && user) { favs.tracks = []; favs.albums = []; writeJSON(FAV_KEY, favs); } // вихід: не лишаємо обране на чужому пристрої
    user = u; profile = null;
    if (user) { await loadProfile(); await syncFavsFromServer(); }
    renderAuthUI();
    if (tracks.length) renderTracks();
    if (albums.length) renderAlbums();
    renderFavorites();
    if ($("#me-modal").classList.contains("open")) renderMe();
  }

  // ----- вікно входу / реєстрації -----
  function openAuth(mode = "login"){
    const reg = mode === "register";
    closeModal($("#me-modal"));
    $("#auth-content").innerHTML = `
      <div class="eyebrow">SOUNDVIBE ACCOUNT</div>
      <h2 class="auth-title">${reg ? "Створи акаунт" : "З поверненням"}<span>.</span></h2>
      <p class="muted">${reg ? "Реєстрація необов'язкова — вона потрібна, щоб обране та профіль зберігалися на всіх твоїх пристроях." : "Увійди, щоб бачити своє обране та профіль."}</p>
      <div class="auth-tabs"><button type="button" class="${reg ? "" : "active"}" data-auth-tab="login">Вхід</button><button type="button" class="${reg ? "active" : ""}" data-auth-tab="register">Реєстрація</button></div>
      <form id="auth-form" class="auth-form" data-mode="${mode}">
        ${reg ? '<label>Нікнейм<input name="nickname" required minlength="2" maxlength="24" autocomplete="nickname" placeholder="Як тебе називати"></label>' : ""}
        <label>Email<input type="email" name="email" required autocomplete="email" placeholder="you@example.com"></label>
        <label>Пароль<input type="password" name="password" required minlength="6" autocomplete="${reg ? "new-password" : "current-password"}" placeholder="Щонайменше 6 символів"></label>
        <button class="btn btn-primary" type="submit">${reg ? "Зареєструватися" : "Увійти"}</button>
        ${reg ? "" : '<button type="button" class="link-btn" id="forgot-btn">Забув пароль?</button>'}
        <p class="form-message" id="auth-message"></p>
      </form>`;
    openModal($("#auth-modal"));
  }

  // ----- вікно профілю -----
  const favRow = t => `<div class="fav-row"><button class="fav-row-cover" data-play="${esc(t.id)}" aria-label="Слухати ${esc(t.title)}">${t.cover_url ? `<img src="${esc(t.cover_url)}" alt="">` : ""}<span>▶</span></button><button class="fav-row-info" data-detail="${esc(t.id)}"><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></button><button class="fav-btn active" data-fav-track="${esc(t.id)}" aria-label="Прибрати з обраного">♥</button></div>`;
  function favPane(){
    const ft = tracks.filter(t => isFav("tracks", t.id)), fa = albums.filter(a => isFav("albums", a.id));
    let h = "";
    if (!ft.length && !fa.length) h = '<div class="empty-state">Тут буде твоя улюблена музика.<br>Натискай ♡ на треках і альбомах — вони з\'являться тут.</div>';
    else {
      if (ft.length) h += `<h3 class="fav-sub">Треки</h3><div class="fav-list">${ft.map(favRow).join("")}</div>`;
      if (fa.length) h += `<h3 class="fav-sub">Альбоми</h3><div class="fav-albums">${fa.map(albumCard).join("")}</div>`;
    }
    if (!user) h += '<div class="guest-note"><div><b>Хочеш мати обране на всіх пристроях?</b><small>Створи акаунт — це безкоштовно й необов\'язково.</small></div><button class="btn btn-primary small" data-auth-open="register">Створити акаунт</button></div>';
    return h;
  }
  function settingsPane(){
    if (!user) return '<div class="guest-note"><div><b>Профіль доступний після входу</b><small>Тут можна змінити фото, нікнейм і пароль.</small></div><div class="guest-actions"><button class="btn btn-primary small" data-auth-open="login">Увійти</button><button class="btn btn-ghost small" data-auth-open="register">Реєстрація</button></div></div>';
    return `
      <div class="set-avatar"><div class="me-avatar big">${avatarInner()}</div>
        <div class="set-avatar-actions"><label class="btn btn-ghost small file-btn">Змінити фото<input type="file" id="avatar-input" accept="image/*" hidden></label>${profile?.avatar_url ? '<button type="button" class="btn btn-ghost small" id="avatar-remove">Видалити фото</button>' : ""}</div></div>
      <form id="nick-form" class="set-form"><label>Нікнейм<input name="nickname" required minlength="2" maxlength="24" value="${esc(nick())}" autocomplete="nickname"></label><button class="btn btn-primary" type="submit">Зберегти</button></form>
      <form id="pass-form" class="set-form"><label>Новий пароль<input type="password" name="password" required minlength="6" autocomplete="new-password" placeholder="Щонайменше 6 символів"></label><button class="btn btn-ghost" type="submit">Змінити пароль</button></form>
      <p class="form-message" id="set-message"></p>
      <div class="set-row"><span>Email</span><b>${esc(user.email)}</b></div>
      <button type="button" class="btn btn-ghost danger" id="logout-btn">Вийти з акаунта</button>`;
  }
  function renderPane(){
    const pane = $("#me-pane"); if (!pane) return;
    pane.innerHTML = meTab === "favs" ? favPane() : settingsPane();
    const n = favs.tracks.length + favs.albums.length, c = $("#me-fav-n");
    if (c) { c.textContent = n; c.hidden = !n; }
  }
  function renderMe(){
    const logged = !!user;
    $("#me-content").innerHTML = `
      <div class="me-head"><div class="me-avatar">${logged ? avatarInner() : PERSON}</div>
        <div class="me-who"><div class="eyebrow">${logged ? "МІЙ ПРОФІЛЬ" : "ГІСТЬ"}</div><h2>${esc(logged ? nick() : "Гість")}</h2><p class="muted">${esc(logged ? user.email : "Обране зберігається лише в цьому браузері")}</p></div></div>
      <div class="me-tabs"><button type="button" class="me-tab ${meTab === "favs" ? "active" : ""}" data-me-tab="favs">♥ Обране <i id="me-fav-n" hidden>0</i></button><button type="button" class="me-tab ${meTab === "settings" ? "active" : ""}" data-me-tab="settings">⚙ Налаштування</button></div>
      <div id="me-pane"></div>`;
    renderPane();
  }
  function openMe(tab = "favs"){ meTab = tab; closeModal($("#auth-modal")); renderMe(); openModal($("#me-modal")); }

  // ----- події -----
  $("#fav-open").addEventListener("click", () => openMe("favs"));
  $("#auth-open").addEventListener("click", () => openAuth("login"));
  $("#account-open").addEventListener("click", () => openMe("favs"));
  ["auth-modal", "me-modal"].forEach(id => $("#" + id).addEventListener("click", e => { if (e.target.id === id) closeModal(e.target); }));
  document.addEventListener("keydown", e => { if (e.key === "Escape") $$(".modal.open").forEach(closeModal); });

  document.addEventListener("click", async e => {
    const t = e.target; let x;
    if ((x = t.closest("[data-auth-open]"))) { openAuth(x.dataset.authOpen); return; }
    if ((x = t.closest("[data-auth-tab]"))) { openAuth(x.dataset.authTab); return; }
    if ((x = t.closest("[data-me-tab]"))) { meTab = x.dataset.meTab; renderMe(); return; }
    if (t.closest("#me-modal [data-detail]")) { closeModal($("#me-modal")); return; }
    if (t.closest("#forgot-btn")) {
      const email = ($("#auth-form [name=email]").value || "").trim();
      if (!email) { msg("#auth-message", "Спочатку введи свій email.", true); return; }
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] });
      msg("#auth-message", error ? authErr(error.message) : "Готово! Ми надіслали лист для відновлення пароля.", !!error);
      return;
    }
    if (t.closest("#logout-btn")) {
      await sb.auth.signOut(); closeModal($("#me-modal")); toast("Ти вийшов з акаунта");
      return;
    }
    if (t.closest("#avatar-remove")) {
      try { await saveProfile({ avatar_url: null }); toast("Фото видалено"); renderMe(); renderAuthUI(); }
      catch (err) { msg("#set-message", authErr(err.message), true); }
    }
  });

  document.addEventListener("change", async e => {
    if (e.target.id !== "avatar-input") return;
    const file = e.target.files[0]; if (!file || !user) return;
    if (!file.type.startsWith("image/")) { msg("#set-message", "Обери файл із зображенням.", true); return; }
    msg("#set-message", "Завантажуємо фото…");
    try {
      const blob = await resizeImage(file, 256);
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const up = await sb.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", cacheControl: "3600" });
      if (up.error) throw up.error;
      await saveProfile({ avatar_url: sb.storage.from("avatars").getPublicUrl(path).data.publicUrl });
      toast("Фото оновлено ✓"); renderMe(); renderAuthUI();
    } catch (err) { console.error(err); msg("#set-message", err instanceof Event ? "Не вдалося обробити це фото." : authErr(err.message), true); }
  });

  document.addEventListener("submit", async e => {
    const f = e.target;
    if (!["auth-form", "nick-form", "pass-form"].includes(f.id)) return;
    e.preventDefault();
    if (!sb) return;
    const btn = f.querySelector("[type=submit]"), old = btn.textContent, fd = new FormData(f);
    const out = f.id === "auth-form" ? "#auth-message" : "#set-message";
    btn.disabled = true; btn.textContent = "Зачекай…"; msg(out, "");
    try {
      if (f.id === "auth-form") {
        const email = String(fd.get("email")).trim(), password = String(fd.get("password"));
        if (f.dataset.mode === "register") {
          const nickname = String(fd.get("nickname")).trim();
          const { data, error } = await sb.auth.signUp({ email, password, options: { data: { nickname } } });
          if (error) throw error;
          if (data.user && data.user.identities && !data.user.identities.length) throw new Error("already registered");
          if (data.session) { closeModal($("#auth-modal")); toast("Вітаємо, " + nickname + "! ✨"); }
          else msg(out, "Майже готово! Ми надіслали лист на " + email + " — підтверди адресу та увійди.");
        } else {
          const { error } = await sb.auth.signInWithPassword({ email, password });
          if (error) throw error;
          closeModal($("#auth-modal")); toast("З поверненням!");
        }
      } else if (f.id === "nick-form") {
        const nickname = String(fd.get("nickname")).trim();
        await saveProfile({ nickname });
        toast("Нікнейм збережено ✓"); renderMe(); renderAuthUI();
      } else {
        const { error } = await sb.auth.updateUser({ password: String(fd.get("password")) });
        if (error) throw error;
        f.reset(); msg(out, "Пароль змінено ✓");
      }
    } catch (err) { console.error(err); msg(out, authErr(err.message), true); }
    finally { btn.disabled = false; btn.textContent = old; }
  });

  if (sb) {
    sb.auth.onAuthStateChange((ev, session) => {
      setTimeout(() => { // не викликаємо Supabase прямо всередині колбека
        const id = session?.user?.id || null;
        if (ev === "PASSWORD_RECOVERY") { applySession(session).then(() => { toast("Введи новий пароль у налаштуваннях"); openMe("settings"); }); return; }
        if (id === (user?.id || null) && ev !== "USER_UPDATED") return;
        applySession(session);
      }, 0);
    });
    sb.auth.getSession().then(({ data }) => { if (data.session && !user) applySession(data.session); });
  } else {
    $("#auth-open").hidden = true;
  }
  updateFavBadge();

  loadAll();
})();
