var $=function(s){return document.querySelector(s)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var uid=Date.now()%1e9,pn=10,S,cur=0,sel=null,mode='d',upT=null;
var DEF={h:{w:500,h:100,s:48,text:'Новый заголовок'},p:{w:420,h:80,s:18,text:'Текст абзаца. Нажми и измени справа.',color:'#c4cbef'},btn:{w:200,h:56,s:18,text:'Кнопка',r:28},img:{w:220,h:160,r:16},cube:{w:160,h:160},orb:{w:150,h:150,bg:'#22d3ee'},card:{w:260,h:170,s:16,text:'Заголовок\nОписание карточки',r:20},box:{w:300,h:200,r:24}};
var LBL={h:'Заголовок',p:'Текст',btn:'Кнопка',img:'Картинка',cube:'3D куб',orb:'3D шар',card:'3D карточка',box:'Стеклянный блок'};
var PAL=[['h','🔠','Заголовок'],['p','📝','Текст'],['btn','🔘','Кнопка'],['img','🖼','Картинка'],['logo','⭐','Логотип'],['cube','🧊','3D куб'],['orb','🔮','3D шар'],['card','🃏','3D карточка'],['box','▢','Блок']];
function mk(t,x,y,o,w,h){var f=DEF[t],e={id:'e'+(uid++),type:t,text:f.text||'',color:f.color||'#ffffff',bg:'#7c5cff',r:f.r||0,al:'left',anim:'',src:'',fit:'cover',pg:'',url:'',d:{x:x,y:y,w:w||f.w,h:h||f.h,s:f.s||18}};
for(var k in o)e[k]=o[k];if(o&&o.s){e.d.s=o.s;delete e.s}return e}
function tpl(){var c=['#7c5cff','#ec4899','#10b981'],t=['Конструктор\nСобирай сайт мышкой','Телефон\nОтдельная мобильная версия','Код\nГотовый HTML одним кликом'];
var a=[mk('h',60,110,{text:'Создавай сайты в 3D',anim:'in',s:64},620,160),mk('p',60,290,{text:'Перетаскивай элементы, меняй цвета и размеры, добавляй страницы. Один клик — и готовый код у тебя.',s:19},480,100),mk('btn',60,420,{text:'Подробнее',pg:'p2',anim:'pulse'},200,56),mk('cube',700,120,{},180,180),mk('orb',830,320,{anim:'float'},140,140)];
for(var i=0;i<3;i++)a.push(mk('card',60+i*305,540,{text:t[i],bg:c[i]},270,170));
var b=[mk('h',60,110,{text:'О нас',s:56},500,100),mk('p',60,240,{text:'Это вторая страница. Ссылки между страницами работают через кнопки и меню.',s:19},460,100),mk('box',600,110,{bg:'#22d3ee'},300,300),mk('cube',670,180,{bg:'#ec4899'},160,160)];
return{name:'Мой сайт',c1:'#0b0d17',c2:'#2a1458',font:'system-ui,sans-serif',nav:true,fx:true,pages:[{id:'p1',name:'Главная',h:780,mh:0,els:a},{id:'p2',name:'О нас',h:620,mh:0,els:b}]}}
try{S=JSON.parse(localStorage.getItem('c3d'))}catch(e){}if(!S||!S.pages)S=tpl();
var SC='*{box-sizing:border-box}.e{position:absolute;display:flex;align-items:center;z-index:1}.ei{width:100%;height:100%}.btn{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;text-decoration:none;box-shadow:0 10px 30px #0005;transition:transform .2s}.btn:hover{transform:scale(1.06)}'
+'.a-float{animation:fl 3s ease-in-out infinite}.a-pulse{animation:pu 2s ease-in-out infinite}.a-spin{animation:sp 8s linear infinite}.a-in{animation:inn 1s both}@keyframes fl{50%{transform:translateY(-16px)}}@keyframes pu{50%{transform:scale(1.08)}}@keyframes sp{to{transform:rotate(360deg)}}@keyframes inn{from{opacity:0;transform:translateY(30px)}}'
+'.cw{perspective:900px;display:flex;align-items:center;justify-content:center}.cube{width:var(--s);height:var(--s);position:relative;transform-style:preserve-3d;animation:cr 10s linear infinite}@keyframes cr{from{transform:rotateX(-25deg) rotateY(0)}to{transform:rotateX(-25deg) rotateY(360deg)}}'
+'.cube i{position:absolute;inset:0;border:1px solid #fff5;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c),#000 50%));opacity:.92}.cube i:nth-child(1){transform:translateZ(calc(var(--s)/2))}.cube i:nth-child(2){transform:rotateY(90deg) translateZ(calc(var(--s)/2))}.cube i:nth-child(3){transform:rotateY(180deg) translateZ(calc(var(--s)/2))}.cube i:nth-child(4){transform:rotateY(-90deg) translateZ(calc(var(--s)/2))}.cube i:nth-child(5){transform:rotateX(90deg) translateZ(calc(var(--s)/2))}.cube i:nth-child(6){transform:rotateX(-90deg) translateZ(calc(var(--s)/2))}'
+'.orb{border-radius:50%;background:radial-gradient(circle at 30% 28%,#fffc,var(--c) 42%,#000c);box-shadow:0 20px 70px var(--c)}.tc{perspective:700px}.tci{width:100%;height:100%;padding:20px;border-radius:var(--r);background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c),#000 45%));transform-style:preserve-3d;transition:transform .15s;box-shadow:0 30px 60px #0006}.tci b{display:block;font-size:1.4em;margin-bottom:8px;transform:translateZ(40px)}.tci span{display:block;white-space:pre-wrap;opacity:.9;transform:translateZ(25px)}'
+'.bx,.ph{border-radius:var(--r);background:color-mix(in srgb,var(--c) 25%,transparent);border:1px solid #fff4;backdrop-filter:blur(14px)}.ph{display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff9}'
+'.fx{position:fixed;inset:0;pointer-events:none;z-index:0}.fx i{position:absolute;border-radius:50%;background:#fff;opacity:.5;animation:tw linear infinite}@keyframes tw{50%{opacity:.1;transform:translateY(-28px)}}';
var NC='nav{position:fixed;top:0;left:0;right:0;height:56px;display:flex;align-items:center;gap:22px;padding:0 28px;background:rgba(10,12,24,.55);backdrop-filter:blur(12px);z-index:50;font-weight:600;color:#fff}nav b{margin-right:auto}nav a{color:#fff;text-decoration:none;opacity:.7}nav a.on,nav a:hover{opacity:1}';
var stl=document.createElement('style');stl.textContent=SC+NC;document.head.appendChild(stl);
function FX(r){var f=document.createElement('div');f.className='fx';for(var i=0;i<45;i++){var d=document.createElement('i'),z=2+Math.random()*4;d.style.cssText='left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;width:'+z+'px;height:'+z+'px;animation-duration:'+(5+Math.random()*9)+'s;animation-delay:-'+Math.random()*9+'s';f.appendChild(d)}r.insertBefore(f,r.firstChild)}
function TILT(){document.addEventListener('mousemove',function(e){document.querySelectorAll('.tci').forEach(function(i){i.style.transform=''});var w=e.target.closest&&e.target.closest('.e'),t=w&&w.querySelector('.tc');if(!t)return;var i=t.firstElementChild,r=t.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;i.style.transform='rotateY('+x*26+'deg) rotateX('+-y*26+'deg)'})}
function PAGER(){var P=document.querySelectorAll('.pg'),A=document.querySelectorAll('nav a');function s(){var h=location.hash.slice(1);if(!document.getElementById(h))h=P[0].id;P.forEach(function(p){p.classList.toggle('on',p.id==h)});A.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')=='#'+h)});scrollTo(0,0)}addEventListener('hashchange',s);s()}
function pg(){return S.pages[cur]}function find(id){return pg().els.filter(function(e){return e.id==id})[0]}
function ensureM(p){p.mh=p.mh||600;var y=80;p.els.forEach(function(e){if(e.m)y=Math.max(y,e.m.y+e.m.h+16)});
var u=p.els.filter(function(e){return!e.m}).sort(function(a,b){return a.d.y-b.d.y||a.d.x-b.d.x});
u.forEach(function(e){var w=Math.min(e.d.w,335),s=e.d.s,h;if(e.type=='h'||e.type=='p'){s=Math.max(e.type=='h'?24:14,Math.round(s*(e.type=='h'?.55:.85)));h=Math.max(40,Math.ceil(e.text.length*s*.55/w)*s*1.3)}else h=e.d.h*w/e.d.w;
e.m={x:Math.round((375-w)/2),y:y,w:w,h:Math.round(h),s:s};y+=Math.round(h)+16});if(u.length)p.mh=Math.max(p.mh,y+30,500)}
function navH(){return S.nav?'<nav><b>'+esc(S.name)+'</b>'+S.pages.map(function(p){return'<a href="#'+p.id+'">'+esc(p.name)+'</a>'}).join('')+'</nav>':''}
function pos(e,m,x){var g=e[m?'m':'d'],W=m?375:1000,f=function(v){return x?(v/W*100).toFixed(3)+'%':v+'px'};return'left:'+f(g.x)+';top:'+g.y+'px;width:'+f(g.w)+';height:'+g.h+'px;font-size:'+g.s+'px;--s:'+Math.min(g.w,g.h)+'px;'}
function parts(e){var t=e.type,tx=esc(e.text),i='',jc={left:'flex-start',center:'center',right:'flex-end'}[e.al];
var st='--c:'+e.bg+';--r:'+e.r+'px;color:'+e.color+';justify-content:'+jc+';text-align:'+e.al+';'+(t=='h'?'font-weight:800;line-height:1.1;':t=='p'?'line-height:1.5;':'');
if(t=='h'||t=='p')i='<span style="white-space:pre-wrap">'+tx+'</span>';
else if(t=='btn'){var hr=e.url?' href="'+esc(e.url)+'" target="_blank" rel="noopener"':e.pg?' href="#'+e.pg+'"':'';i='<a class="btn"'+hr+' style="background:'+e.bg+';color:'+e.color+';border-radius:'+e.r+'px">'+tx+'</a>'}
else if(t=='img')i=e.src?'<img class="ei" style="object-fit:'+e.fit+';border-radius:'+e.r+'px" src="'+e.src+'" alt="">':'<div class="ei ph">Изображение</div>';
else if(t=='cube')i='<div class="cw ei"><div class="cube"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>';
else if(t=='orb')i='<div class="orb ei"></div>';
else if(t=='card'){var a=e.text.split('\n');i='<div class="tc ei"><div class="tci"><b>'+esc(a.shift())+'</b><span>'+esc(a.join('\n'))+'</span></div></div>'}
else i='<div class="bx ei"></div>';
return{st:st,i:i,cls:e.anim?'a-'+e.anim:''}}
function render(){var p=pg(),m=mode=='m',cv=$('#cv'),st=$('#st');if(m)ensureM(p);var W=m?375:1000,H=m?p.mh:p.h,sc=Math.min(1,($('#wrap').clientWidth-40)/W);
st.style.width=W*sc+'px';st.style.height=H*sc+'px';st.className=m?'m':'';
cv.style.cssText='width:'+W+'px;height:'+H+'px;transform:scale('+sc+');background:linear-gradient(160deg,'+S.c1+','+S.c2+');font-family:'+S.font+';color:#fff';
cv.innerHTML=navH()+p.els.map(function(e){var P=parts(e);return'<div class="e '+P.cls+(e.id==sel?' sel':'')+'" data-id="'+e.id+'" style="'+pos(e,m,0)+P.st+'">'+P.i+(e.id==sel?'<u class="rz"></u>':'')+'</div>'}).join('');
if(S.fx)FX(cv);clearTimeout(upT);upT=setTimeout(function(){try{localStorage.setItem('c3d',JSON.stringify(S))}catch(x){}},500)}
function tabs(){$('#tabs').innerHTML=S.pages.map(function(p,i){return'<button data-a="tab" data-i="'+i+'"'+(i==cur?' class="on"':'')+'>'+esc(p.name)+'</button>'}).join('')}
function F(l,x){return'<label>'+l+x+'</label>'}
function N(o,k,v,a,b,t){return'<input data-o="'+o+'" data-k="'+k+'" type="'+(t||'number')+'" value="'+esc(v)+'"'+(a!=null?' min="'+a+'" max="'+b+'"':'')+'>'}
function SEL(o,k,v,L){return'<select data-o="'+o+'" data-k="'+k+'">'+L.map(function(x){return'<option value="'+esc(x[0])+'"'+(x[0]==v?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select>'}
function panel(){var e=find(sel),h='',m=mode=='m',p=pg();
if(!e){h='<h3>Сайт</h3>'+F('Название',N('s','name',S.name,null,null,'text'))+F('Градиент: цвет 1',N('s','c1',S.c1,null,null,'color'))+F('Градиент: цвет 2',N('s','c2',S.c2,null,null,'color'))
+F('Шрифт',SEL('s','font',S.font,[['system-ui,sans-serif','Современный'],['Georgia,serif','Классика'],["'Trebuchet MS',sans-serif",'Дружелюбный'],["'Courier New',monospace",'Код']]))
+'<label class="ck"><input type="checkbox" data-o="s" data-k="nav"'+(S.nav?' checked':'')+'> Меню навигации</label><label class="ck"><input type="checkbox" data-o="s" data-k="fx"'+(S.fx?' checked':'')+'> Живой фон (звёзды)</label>'
+'<h3>Страница</h3>'+F('Название',N('p','name',p.name,null,null,'text'))+F('Высота ('+(m?'телефон':'ПК')+')',N('p',m?'mh':'h',m?p.mh:p.h))
+'<div class="row">'+(m?'<button data-a="auto">Авто-раскладка</button>':'')+'<button data-a="delpage">Удалить страницу</button><button data-a="reset">Шаблон заново</button></div><p style="color:var(--m);font-size:12px">Нажми на элемент на холсте, чтобы редактировать. Тяни за угол, чтобы менять размер. Стрелки двигают элемент.</p>'}
else{var t=e.type,g=e[mode],T=/^(h|p|btn|card)$/.test(t);h='<h3>'+LBL[t]+'</h3>';
if(T)h+=F('Текст',"<textarea data-o=\"e\" data-k=\"text\">"+esc(e.text)+'</textarea>')+F('Цвет текста',N('e','color',e.color,null,null,'color'));
if(/^(btn|cube|orb|card|box)$/.test(t))h+=F(t=='cube'||t=='orb'?'Цвет':'Фон',N('e','bg',e.bg,null,null,'color'));
if(T)h+=F('Шрифт '+g.s+'px',N('g','s',g.s,8,140,'range'));
if(/^(btn|img|card|box)$/.test(t))h+=F('Скругление',N('e','r',e.r,0,120,'range'));
if(t=='h'||t=='p')h+=F('Выравнивание',SEL('e','al',e.al,[['left','Слева'],['center','По центру'],['right','Справа']]));
h+='<div class="g2">'+F('X',N('g','x',g.x))+F('Y',N('g','y',g.y))+F('Ширина',N('g','w',g.w))+F('Высота',N('g','h',g.h))+'</div>'
+F('Анимация',SEL('e','anim',e.anim,[['','Нет'],['float','Парение'],['pulse','Пульс'],['spin','Вращение'],['in','Появление']]));
if(t=='img')h+='<div class="row"><button data-a="upimg">Загрузить</button></div>'+F('Вписывание',SEL('e','fit',e.fit,[['cover','Заполнить'],['contain','Вписать (лого)']]));
if(t=='btn')h+=F('Ведёт на страницу',SEL('e','pg',e.pg,[['','— нет —']].concat(S.pages.map(function(x){return[x.id,esc(x.name)]}))))+F('Или ссылка URL',N('e','url',e.url,null,null,'text'));
h+='<div class="row"><button data-a="dup">Дубль</button><button data-a="front">Вперёд</button><button data-a="back">Назад</button><button data-a="del">Удалить</button></div>'}
$('#pr').innerHTML=h}
function refresh(){tabs();render();panel()}
function addEl(t,o){var p=pg(),f=DEF[t=='logo'?'img':t],e=mk(t=='logo'?'img':t,0,0,o,t=='logo'?160:null,t=='logo'?80:null);e.d.x=Math.round((1000-e.d.w)/2);e.d.y=140+Math.floor(Math.random()*60);p.els.push(e);if(mode=='m'){ensureM(p)}sel=e.id;refresh();return e}
function upload(f,cb){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){if(!im.width){cb(r.result);return}var k=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL(/png|svg/.test(f.type)?'image/png':'image/jpeg',.85))};im.src=r.result};r.readAsDataURL(f)}
$('#fi').addEventListener('change',function(){var f=this.files[0],e=find(sel);this.value='';if(!f||!e)return;upload(f,function(d){e.src=d;refresh()})});
function gen(){var css='',mc='',pgs='';
S.pages.forEach(function(p){ensureM(p);var b='';p.els.forEach(function(e){var P=parts(e),c='n'+e.id;css+='.'+c+'{'+pos(e,0,1)+'}';mc+='.'+c+'{'+pos(e,1,1)+'}';b+='<div class="e '+c+(P.cls?' '+P.cls:'')+'" style="'+P.st+'">'+P.i+'</div>\n'});
css+='#'+p.id+'{height:'+p.h+'px}';mc+='#'+p.id+'{height:'+p.mh+'px}';pgs+='<section class="pg" id="'+p.id+'">\n'+b+'</section>\n'});
var base='html,body{margin:0}body{font-family:'+S.font+';background:linear-gradient(160deg,'+S.c1+','+S.c2+') fixed;color:#fff;overflow-x:hidden;min-height:100vh}.pg{position:relative;z-index:1;display:none;overflow:hidden}.pg.on{display:block}';
var js='('+TILT+')();('+PAGER+')();'+(S.fx?'('+FX+')(document.body);':'');
return'<!DOCTYPE html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(S.name)+'</title>\n<style>\n'+base+SC+NC+css+'\n@media(max-width:700px){'+mc+'nav{gap:12px;padding:0 14px;font-size:13px}}\n</style></head><body>\n'+navH()+'\n'+pgs+'<script>\n'+js+'\n</script></body></html>'}
document.addEventListener('click',function(ev){var b=ev.target.closest('[data-a]');if(!b)return;var a=b.dataset.a,p=pg(),e=find(sel),i;
if(a=='tab'){cur=+b.dataset.i;sel=null}
else if(a=='addpage'){S.pages.push({id:'p'+(++pn)+(uid%1000),name:'Страница '+(S.pages.length+1),h:640,mh:0,els:[]});cur=S.pages.length-1;sel=null}
else if(a=='delpage'){if(S.pages.length>1){S.pages.splice(cur,1);cur=0;sel=null}}
else if(a=='reset'){S=tpl();cur=0;sel=null}
else if(a=='dev'){mode=b.dataset.v;document.querySelectorAll('[data-a=dev]').forEach(function(x){x.classList.toggle('on',x==b)});if(mode=='m')ensureM(p)}
else if(a=='add'){addEl(b.dataset.t);return}
else if(a=='logo'){var l=addEl('logo',{fit:'contain'});$('#fi').click();return}
else if(a=='upimg'){$('#fi').click();return}
else if(a=='auto'){p.mh=0;p.els.forEach(function(x){delete x.m});ensureM(p)}
else if(e&&a=='dup'){var c=JSON.parse(JSON.stringify(e));c.id='e'+(uid++);c.d.x+=24;c.d.y+=24;if(c.m){c.m.x+=16;c.m.y+=16}p.els.push(c);sel=c.id}
else if(e&&a=='del'){p.els.splice(p.els.indexOf(e),1);sel=null}
else if(e&&a=='front'){p.els.splice(p.els.indexOf(e),1);p.els.push(e)}
else if(e&&a=='back'){p.els.splice(p.els.indexOf(e),1);p.els.unshift(e)}
else if(a=='export'){var c=gen();$('#code').value=c;$('#ifr').srcdoc=c;$('#md').hidden=false;view('c');return}
else if(a=='view'){view(b.dataset.v);return}
else if(a=='close'){$('#md').hidden=true;return}
else if(a=='copy'){var t=$('#code'),done=function(){$('#cp').textContent='Скопировано ✓';setTimeout(function(){$('#cp').textContent='Копировать код'},1800)};t.select();try{navigator.clipboard.writeText(t.value).then(done,function(){document.execCommand('copy');done()})}catch(x){document.execCommand('copy');done()}return}
refresh()});
function view(v){$('#code').hidden=v!='c';$('#ifr').hidden=v!='p';document.querySelectorAll('[data-a=view]').forEach(function(x){x.classList.toggle('on',x.dataset.v==v)})}
$('#pr').addEventListener('input',function(ev){var t=ev.target,o=t.dataset.o,k=t.dataset.k;if(!o)return;var v=t.type=='checkbox'?t.checked:(t.type=='number'||t.type=='range')?+t.value:t.value;
if(o=='e')find(sel)[k]=v;else if(o=='g')find(sel)[mode][k]=v;else if(o=='p')pg()[k]=v;else S[k]=v;
if(t.type=='range'&&k=='s'){t.parentNode.firstChild.textContent='Шрифт '+v+'px'}if(k=='name')tabs();render()});
$('#cv').addEventListener('pointerdown',function(ev){var t=ev.target,el=t.closest('.e');if(!el){sel=null;render();panel();return}
var e=find(el.dataset.id);if(sel!=e.id){sel=e.id;render();panel();el=$('#cv').querySelector('[data-id="'+e.id+'"]')}
var g=e[mode],m=mode=='m',sc=$('#st').getBoundingClientRect().width/(m?375:1000),sx=ev.clientX,sy=ev.clientY,o={x:g.x,y:g.y,w:g.w,h:g.h},rz=t.classList.contains('rz');
var mv=function(v){var dx=(v.clientX-sx)/sc,dy=(v.clientY-sy)/sc;if(rz){g.w=Math.max(30,Math.round(o.w+dx));g.h=Math.max(20,Math.round(o.h+dy))}else{g.x=Math.round(o.x+dx);g.y=Math.round(o.y+dy)}el.style.cssText=pos(e,m,0)+parts(e).st};
var up=function(){removeEventListener('pointermove',mv);removeEventListener('pointerup',up);panel();render()};addEventListener('pointermove',mv);addEventListener('pointerup',up)});
document.addEventListener('keydown',function(ev){var e=find(sel),n=/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName);if(!e||n)return;var g=e[mode],s=ev.shiftKey?10:1;
if(ev.key=='Delete'||ev.key=='Backspace'){pg().els.splice(pg().els.indexOf(e),1);sel=null}else if(ev.key=='ArrowLeft')g.x-=s;else if(ev.key=='ArrowRight')g.x+=s;else if(ev.key=='ArrowUp')g.y-=s;else if(ev.key=='ArrowDown')g.y+=s;else return;ev.preventDefault();refresh()});
addEventListener('resize',render);
$('#pal').innerHTML=PAL.map(function(x){return'<button data-a="'+(x[0]=='logo'?'logo':'add')+'" data-t="'+x[0]+'"><b>'+x[1]+'</b>'+x[2]+'</button>'}).join('');
TILT();refresh();