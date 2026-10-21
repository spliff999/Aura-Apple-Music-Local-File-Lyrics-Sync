/* Aura Lyrics — original Apple Music Web overlay inspired by the visual
 * language of Spicy Lyrics. No code or assets from Spicy Lyrics are used.
 */
(() => {
  if (window.__AURA_LYRICS_UI__) return;
  window.__AURA_LYRICS_UI__ = true;

  const defaults={theme:'violet',font:52,blur:76,position:'left',glow:true,art:true,follow:true,offsetStep:0.25,view:'cinema'};
  const s={index:[],settings:{...defaults},song:'',artist:'',art:'',duration:null,
    key:'',file:null,lines:[],kind:'',forceKey:'',offset:0,active:-1,
    playerPosition:null,playerPaused:true,playerSource:'',receivedAt:0,
    manual:false,manualPosition:0,manualReceivedAt:0,manualPaused:false,
    view:'cinema',shown:false,settingsOpen:false,dragged:false,dragging:false,
    suppressFollowUntil:0,loadRevision:0,lastTime:NaN};

  const NS='http://www.w3.org/2000/svg';
  const glyph=(name)=>{
    const icons={
      wave:'<path d="M3 14v-4m4 8V6m4 14V4m4 11V9m4 9V6m4 6v-2"/>',
      sliders:'<path d="M4 7h16M4 17h16M9 4v6m6 4v6"/>',
      minimize:'<path d="M5 12h14"/>',
      expand:'<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/>',
      shrink:'<path d="M4 9h5V4m11 5h-5V4M4 15h5v5m11-5h-5v5"/>',
      close:'<path d="m5 5 14 14M19 5 5 19"/>',
      arrow:'<path d="m9 18 6-6-6-6"/>',
      left:'<path d="m15 18-6-6 6-6"/>',
      plus:'<path d="M12 5v14M5 12h14"/>',
      minus:'<path d="M5 12h14"/>',
      vinyl:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3a9 9 0 0 1 9 9"/>',
      check:'<path d="m5 12 4 4L19 6"/>',
      clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      music:'<path d="M9 18V6l12-2v12M9 9l12-2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
      fullscreen:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]||icons.wave}</svg>`;
  };

  const host=document.createElement('div');
  host.id='aura-lyrics-extension-root';
  document.documentElement.appendChild(host);
  const shadow=host.attachShadow({mode:'open'});
  const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=chrome.runtime.getURL('overlay.css');
  shadow.append(stylesheet);
  const surface=document.createElement('div');
  surface.innerHTML=`
    <button class="aura-launch" id="launch" aria-label="Open Aura Lyrics">${glyph('wave')}<span>LYRICS</span></button>
    <main class="aura-app mode-cinema" id="app" aria-label="Custom TTML Lyrics">
      <div class="aura-art-bg" id="artBg"></div><div class="aura-gradient"></div><div class="aura-grain"></div>
      <header class="aura-header">
        <div class="aura-logo">${glyph('wave')}<span>AURA <b>LYRICS</b></span><span class="aura-version">LOCAL TTML</span></div>
        <div class="aura-actions">
          <button class="aura-icon-button" id="view" title="Switch between cinema and compact view">${glyph('shrink')}</button>
          <button class="aura-icon-button" id="full" title="Toggle fullscreen">${glyph('fullscreen')}</button>
          <button class="aura-icon-button" id="settingsBtn" title="Lyrics appearance and settings">${glyph('sliders')}</button>
          <button class="aura-icon-button" id="hide" title="Hide lyrics">${glyph('close')}</button>
        </div>
      </header>
      <section class="aura-body">
        <aside class="aura-track-panel">
          <div class="aura-art-shell"><div class="aura-cover" id="cover"><div id="coverPlaceholder">${glyph('vinyl')}</div></div><div class="aura-art-sheen"></div></div>
          <div class="aura-now-tag"><i></i><span>NOW PLAYING</span></div>
          <h1 id="trackTitle">Your music, your lyrics.</h1>
          <p id="trackArtist">Personalized TTML lyrics for Apple Music</p>
          <div class="aura-track-pill" id="trackPill">NO TRACK DETECTED</div>
          <div class="aura-track-bottom">
            <div class="aura-seek-info"><span id="currentTime">0:00</span><span id="totalTime">—:—</span></div>
            <div class="aura-progress"><div id="progressFill"></div></div>
            <div class="aura-source" id="playerSource">Waiting for playback</div>
          </div>
        </aside>
        <div class="aura-lyric-pane" id="pane">
          <div class="aura-lyrics-fade top"></div>
          <div class="aura-lyrics-scroll" id="lyricsScroll" tabindex="0" aria-label="Synchronized lyrics">
            <div class="aura-lines" id="lines"><div class="aura-empty"><div class="aura-empty-icon">${glyph('music')}</div><strong>Let the lyrics take over.</strong><span>Import your TTML files in the extension toolbar popup. We'll match them to your tracks.</span></div></div>
          </div>
          <div class="aura-lyrics-fade bottom"></div>
          <div class="aura-follow-indicator" id="followHint">Auto-follow paused • click to resume</div>
        </div>
      </section>
      <footer class="aura-footer">
        <div class="aura-status"><div class="aura-status-dot" id="statusDot"></div><span id="status">Waiting for Apple Music</span></div>
        <div class="aura-footer-controls">
          <label for="trackSelect">LYRICS</label><select id="trackSelect" aria-label="Select local lyrics file"><option value="">Auto-match song</option></select>
          <span class="aura-divider"></span><span class="aura-offset-label">OFFSET</span>
          <button class="aura-round" id="earlier" title="Lyrics earlier">${glyph('minus')}</button>
          <output id="offsetValue">0.00s</output>
          <button class="aura-round" id="later" title="Lyrics later">${glyph('plus')}</button>
          <button class="aura-text-button" id="manualSync" title="Start a manual clock at the beginning of the song">${glyph('clock')} Start sync</button>
        </div>
      </footer>
      <div class="aura-settings-backdrop" id="settingsShade" hidden></div>
      <aside class="aura-settings" id="settings" aria-label="Aura Lyrics settings" hidden>
        <div class="aura-settings-head"><div><small>PERSONALIZE</small><h2>Appearance</h2></div><button id="settingsClose" class="aura-icon-button" title="Close settings">${glyph('close')}</button></div>
        <div class="aura-settings-inner">
          <span class="aura-label">ATMOSPHERE</span>
          <div class="aura-swatches">
            <button class="aura-swatch swatch-violet" data-theme="violet" title="Midnight violet"><i></i>Violet</button>
            <button class="aura-swatch swatch-ember" data-theme="ember" title="Warm ember"><i></i>Ember</button>
            <button class="aura-swatch swatch-ocean" data-theme="ocean" title="Deep ocean"><i></i>Ocean</button>
            <button class="aura-swatch swatch-obsidian" data-theme="obsidian" title="Obsidian"><i></i>Dark</button>
          </div>
          <label class="aura-setting-row">Lyric size <output id="fontReadout">52px</output></label>
          <input id="fontSize" type="range" min="28" max="80" step="2" value="52" />
          <label class="aura-setting-row">Backdrop blur <output id="blurReadout">76px</output></label>
          <input id="blurSize" type="range" min="20" max="110" step="5" value="76" />
          <div class="aura-segment"><button data-align="left">Left align</button><button data-align="center">Center align</button></div>
          <label class="aura-toggle"><span>Animated word highlight <small>Precise karaoke fill</small></span><input id="glowToggle" type="checkbox" checked /><i></i></label>
          <label class="aura-toggle"><span>Album artwork backdrop <small>Soft color glow behind lyrics</small></span><input id="artToggle" type="checkbox" checked /><i></i></label>
          <label class="aura-toggle"><span>Auto-follow active line <small>Keep vocals centered</small></span><input id="followToggle" type="checkbox" checked /><i></i></label>
          <p class="aura-settings-note">Your TTML files and preferences stay in this browser. No lyric data is uploaded.</p>
        </div>
      </aside>
    </main>`;
  while(surface.firstChild)shadow.append(surface.firstChild);
  const $=(id)=>shadow.getElementById(id);
  const app=$('app'),scroll=$('lyricsScroll'),list=$('lines');
  let lineNodes=[],wordNodes=[];
  const clamp=(v,low,high)=>Math.min(high,Math.max(low,v));
  const stamp=t=>{if(!Number.isFinite(t)||t<0)return '—:—';const n=Math.floor(t);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`};
  const setText=(id,value)=>{$(id).textContent=String(value||'')};
  const pauseFollow=(millis=5500)=>{s.suppressFollowUntil=performance.now()+millis;$('followHint').classList.add('visible')};
  const readClock=()=>{
    if(s.manual)return s.manualPosition+(s.manualPaused?0:Math.max(0,(performance.now()-s.manualReceivedAt)/1000));
    return Number.isFinite(s.playerPosition) ? s.playerPosition+(s.playerPaused?0:Math.max(0,(performance.now()-s.receivedAt)/1000)) : NaN;
  };
  const updateStatus=()=>{
    const hasClock=Number.isFinite(readClock());
    const message=!s.lines.length?'NO MATCHED TTML':s.manual?'MANUAL SYNC':hasClock?`${s.kind==='word'?'WORD':'LINE'} SYNCED • ${s.playerSource||'PLAYER'}`:'NEEDS PLAYBACK CLOCK';
    setText('status',message);
    $('statusDot').classList.toggle('live',hasClock&&!!s.lines.length);
    $('trackPill').textContent=s.lines.length ? (s.kind==='word'?'✦ WORD-SYNCED LYRICS':'✦ LINE-SYNCED LYRICS'):'NO MATCHED LYRICS';
    setText('playerSource',hasClock?s.manual?'Using manual playback clock':`Clock: ${s.playerSource}`:'Play a track or start manual sync');
  };
  const applySettings=()=>{
    const cfg=s.settings;
    app.dataset.theme=cfg.theme;
    app.dataset.align=cfg.position;
    app.style.setProperty('--aura-font',`${cfg.font}px`);
    app.style.setProperty('--aura-blur',`${cfg.blur}px`);
    app.classList.toggle('no-glow',!cfg.glow);
    app.classList.toggle('hide-art',!cfg.art);
    $('fontSize').value=cfg.font;
    $('blurSize').value=cfg.blur;
    setText('fontReadout',`${cfg.font}px`);
    setText('blurReadout',`${cfg.blur}px`);
    $('glowToggle').checked=cfg.glow;
    $('artToggle').checked=cfg.art;
    $('followToggle').checked=cfg.follow;
    shadow.querySelectorAll('[data-theme]').forEach(b=>b.classList.toggle('picked',b.dataset.theme===cfg.theme));
    shadow.querySelectorAll('[data-align]').forEach(b=>b.classList.toggle('picked',b.dataset.align===cfg.position));
    setView(s.view,false);
  };
  const persistSettings=()=>{chrome.storage.local.set({auraSettings:s.settings}).catch(()=>{});applySettings()};
  function setView(view,save=true){
    s.view=view;
    app.classList.toggle('mode-floating',view==='floating');
    app.classList.toggle('mode-cinema',view==='cinema');
    $('view').innerHTML=glyph(view==='cinema'?'shrink':'expand');
    $('view').title=view==='cinema'?'Compact window':'Cinema view';
    if(save){s.settings.view=view;chrome.storage.local.set({auraSettings:s.settings})}
  }
  function show(){s.shown=true;host.classList.add('open');$('launch').classList.add('hidden');app.classList.add('visible');}
  function hide(){s.shown=false;host.classList.remove('open');app.classList.remove('visible');$('launch').classList.remove('hidden');}
  async function refreshIndex(){
    const found=await chrome.storage.local.get('ttmlIndex');
    s.index=Array.isArray(found.ttmlIndex)?found.ttmlIndex:[];
    const select=$('trackSelect');
    const previous=select.value;select.replaceChildren();
    const auto=document.createElement('option');auto.value='';auto.textContent='Auto-match song';select.append(auto);
    for(const item of s.index.sort((a,b)=>a.title.localeCompare(b.title))){
      const opt=document.createElement('option');opt.value=item.key;opt.textContent=item.title;select.append(opt);
    }
    select.value=s.forceKey||previous||'';
  }
  const lookupKey=()=>{
    if(s.forceKey && s.index.some(x=>x.key===s.forceKey))return s.forceKey;
    const key=normalizeForMatch(s.song);return s.index.some(x=>x.key===key)?key:'';
  };
  function normalizeForMatch(v){return String(v||'').normalize('NFKD').toLowerCase()
    .replace(/^\d{1,3}[.\s_\-]+/,'').replace(/\s*\((?:feat\.?|ft\.?)\s+[^)]*\)/gi,'')
    .replace(/\s*\[[^\]]+\]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
  async function loadTrack(){
    const target=lookupKey();const loadId=++s.loadRevision;
    const keys=target?[`track:${target}`,`offset:${target}`]:[];
    const found=await chrome.storage.local.get(keys);
    if(loadId!==s.loadRevision)return;
    const data=target?found[`track:${target}`]:null;
    s.key=target;s.file=data||null;s.lines=data?.lines||[];s.kind=data?.kind||'line';
    s.offset=Number(found[`offset:${target}`]||0);s.active=-1;lineNodes=[];wordNodes=[];
    $('offsetValue').textContent=(s.offset>0?'+':'')+s.offset.toFixed(2)+'s';
    if(s.lines.length){
      const fragment=document.createDocumentFragment();
      s.lines.forEach((line,i)=>{
        const row=document.createElement('div');row.className='aura-line';row.dataset.i=i;
        if(line.words?.length){
          wordNodes[i]=[];
          line.words.forEach((word)=>{
            const w=document.createElement('span');w.className='aura-word';w.textContent=word.text;
            w.style.setProperty('--progress','0%');row.append(w);wordNodes[i].push(w);
          });
        }else{
          const w=document.createElement('span');w.className='aura-word';w.textContent=line.text;row.append(w);
          wordNodes[i]=[w];
        }
        fragment.append(row);lineNodes.push(row);
      });
      list.replaceChildren(fragment);
      setTimeout(()=>{if(s.active<0)scroll.scrollTop=0},75);
    }else{
      list.replaceChildren();
      const empty=document.createElement('div');empty.className='aura-empty';
      const icon=document.createElement('div');icon.className='aura-empty-icon';icon.innerHTML=glyph('music');
      const heading=document.createElement('strong');heading.textContent=s.index.length?`No lyrics for “${s.song||'this song'}”`:'Your lyrics live here.';
      const help=document.createElement('span');help.textContent=s.index.length?'Use the lyrics dropdown to choose a file, or import a matching TTML in the extension popup.':'Use the extension toolbar popup to import .ttml files, then play a song.';
      empty.append(icon,heading,help);list.append(empty);
    }
    updateStatus();
  }
  function applyMetadata(data){
    const isNew=!!data.title && data.title!==s.song;
    if(isNew){
      s.song=data.title;s.artist=data.artist||'';s.forceKey='';s.manual=false;s.active=-1;
      $('trackSelect').value='';
      setText('trackTitle',s.song);setText('trackArtist',s.artist||'Apple Music');
      loadTrack().catch(console.warn);
    }else if(data.artist && data.artist!==s.artist){s.artist=data.artist;setText('trackArtist',s.artist)}
    if(data.artwork && data.artwork!==s.art){
      s.art=data.artwork;
      $('artBg').style.backgroundImage=`url(${JSON.stringify(s.art)})`;
      $('cover').style.backgroundImage=`url(${JSON.stringify(s.art)})`;
      $('coverPlaceholder').hidden=true;
    }
    if(Number.isFinite(data.duration))s.duration=data.duration;
    if(!s.manual){
      if(Number.isFinite(data.position)&&data.position>=0){
        s.playerPosition=data.position;s.receivedAt=performance.now();s.playerPaused=data.paused!==false;s.playerSource=data.source||'Player';
      }else{s.playerPosition=null;s.playerPaused=true;s.playerSource='';}
    }
    updateStatus();
  }
  const lineAt=time=>{
    // Use the latest started lyric, even across natural instrumental gaps.
    let low=0,high=s.lines.length-1,answer=-1;
    while(low<=high){const mid=(low+high)>>1;if(s.lines[mid].begin<=time){answer=mid;low=mid+1}else high=mid-1;}
    return answer;
  };
  function followLine(i){
    if(i<0||!lineNodes[i]||!s.settings.follow||performance.now()<s.suppressFollowUntil)return;
    const line=lineNodes[i];
    const desired=line.offsetTop+line.offsetHeight/2-scroll.clientHeight*0.43;
    scroll.scrollTo({top:clamp(desired,0,scroll.scrollHeight-scroll.clientHeight),behavior:'smooth'});
  }
  function tick(){
    if(!s.shown)return;
    const songTime=readClock();
    if(Number.isFinite(songTime)){
      const lyricsTime=songTime-s.offset;
      setText('currentTime',stamp(songTime));setText('totalTime',stamp(s.duration));
      $('progressFill').style.width=`${clamp(s.duration?100*songTime/s.duration:0,0,100)}%`;
      if(s.lines.length){
        const idx=lineAt(lyricsTime);
        if(idx!==s.active){
          s.active=idx;
          for(let i=0;i<lineNodes.length;i++){
            lineNodes[i].classList.toggle('active',i===idx);
            lineNodes[i].classList.toggle('passed',i<idx);
            lineNodes[i].classList.toggle('next',i===idx+1);
          }
          followLine(idx);
        }
        if(idx>=0){
          const line=s.lines[idx];
          const words=line.words?.length?line.words:[{begin:line.begin,end:line.end,text:line.text}];
          for(let i=0;i<words.length;i++){
            const word=words[i];
            const pct=lyricsTime<word.begin?0:lyricsTime>=word.end?100:clamp(100*(lyricsTime-word.begin)/(word.end-word.begin),0,100);
            const el=wordNodes[idx]?.[i];
            if(el)el.style.setProperty('--progress',`${pct.toFixed(1)}%`);
          }
        }
      }
    }
    if(performance.now()>s.suppressFollowUntil)$('followHint').classList.remove('visible');
  }
  function adjust(delta){
    s.offset=Math.round((s.offset+delta)*100)/100;
    $('offsetValue').textContent=(s.offset>0?'+':'')+s.offset.toFixed(2)+'s';
    if(s.key)chrome.storage.local.set({[`offset:${s.key}`]:s.offset});
    s.active=-1;
    lineNodes.forEach((r,i)=>{r.classList.remove('active','passed','next');wordNodes[i]?.forEach(w=>w.style.setProperty('--progress','0%'))});
  }
  const setSettingsOpen=(open)=>{
    s.settingsOpen=open;
    $('settings').hidden=!open;$('settingsShade').hidden=!open;
    $('settingsBtn').classList.toggle('selected',open);
  };

  $('launch').onclick=show;
  $('hide').onclick=hide;
  $('view').onclick=()=>setView(s.view==='cinema'?'floating':'cinema');
  $('full').onclick=async()=>{
    try{if(document.fullscreenElement===host)await document.exitFullscreen();else await host.requestFullscreen();}
    catch(e){console.info('Fullscreen is unavailable in this browser:',e)}
  };
  $('earlier').onclick=()=>adjust(-s.settings.offsetStep);
  $('later').onclick=()=>adjust(s.settings.offsetStep);
  $('manualSync').onclick=()=>{
    // Clicking at track start creates a reliable *manual* clock, but cannot
    // magically know the song's current position if Apple hides its time.
    s.manual=true;s.manualPosition=0;s.manualReceivedAt=performance.now();s.manualPaused=false;
    s.playerSource='Manual';s.active=-1;updateStatus();
  };
  $('trackSelect').onchange=async(e)=>{s.forceKey=e.target.value;await loadTrack()};
  $('settingsBtn').onclick=()=>setSettingsOpen(!s.settingsOpen);
  $('settingsClose').onclick=()=>setSettingsOpen(false);
  $('settingsShade').onclick=()=>setSettingsOpen(false);
  $('fontSize').oninput=e=>{s.settings.font=+e.target.value;persistSettings()};
  $('blurSize').oninput=e=>{s.settings.blur=+e.target.value;persistSettings()};
  $('glowToggle').onchange=e=>{s.settings.glow=e.target.checked;persistSettings()};
  $('artToggle').onchange=e=>{s.settings.art=e.target.checked;persistSettings()};
  $('followToggle').onchange=e=>{s.settings.follow=e.target.checked;persistSettings()};
  shadow.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{s.settings.theme=b.dataset.theme;persistSettings()});
  shadow.querySelectorAll('[data-align]').forEach(b=>b.onclick=()=>{s.settings.position=b.dataset.align;persistSettings()});
  scroll.addEventListener('wheel',()=>pauseFollow(),{passive:true});
  scroll.addEventListener('touchstart',()=>pauseFollow(),{passive:true});
  scroll.addEventListener('pointerdown',()=>pauseFollow());
  $('followHint').onclick=()=>{s.suppressFollowUntil=0;$('followHint').classList.remove('visible');followLine(s.active)};
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&s.shown){if(s.settingsOpen)setSettingsOpen(false);else hide()}
  });
  window.addEventListener('message',e=>{
    if(e.source!==window||e.origin!==location.origin||e.data?.type!=='AURA_LYRICS_PLAYBACK')return;
    applyMetadata(e.data);
  });
  chrome.storage.onChanged.addListener(async(changes,where)=>{
    if(where!=='local')return;
    if(changes.ttmlIndex){await refreshIndex();await loadTrack()}
    if(s.key&&changes[`track:${s.key}`])await loadTrack();
    if(changes.auraSettings){s.settings={...defaults,...changes.auraSettings.newValue};applySettings()}
  });

  async function init(){
    const saved=await chrome.storage.local.get('auraSettings');
    s.settings={...defaults,...(saved.auraSettings||{})};
    s.view=s.settings.view==='floating'?'floating':'cinema';
    applySettings();await refreshIndex();await loadTrack();
    // Page bridge is registered directly into the page's MAIN world using
    // Manifest V3, avoiding CSP restrictions on injected <script> elements.
    setInterval(tick,65);
    // Start hidden, with an unobtrusive launcher on the right.
  }
  init().catch(err=>console.error('Aura Lyrics startup failed:',err));
})();
