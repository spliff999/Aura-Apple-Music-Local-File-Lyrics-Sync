/* Runs in Apple Music's page context. Read-only: media metadata & playback state. */
(() => {
 if (window.__AURA_LYRICS_BRIDGE__) return;
 window.__AURA_LYRICS_BRIDGE__ = true;
 const publish = () => {
  const data = {type:'AURA_LYRICS_PLAYBACK',title:'',artist:'',artwork:'',position:null,paused:null,duration:null,source:''};
  try {
    const metadata=navigator.mediaSession?.metadata;
    data.title=metadata?.title||'';
    data.artist=metadata?.artist||'';
    const image=metadata?.artwork?.slice()?.sort((a,b)=>(parseInt(b.sizes)||0)-(parseInt(a.sizes)||0))[0];
    data.artwork=image?.src||'';
  } catch (_) {}
  try {
    const kit=window.MusicKit?.getInstance?.();
    if (kit) {
      const item=kit.nowPlayingItem;
      data.title=data.title||item?.attributes?.name||item?.title||'';
      data.artist=data.artist||item?.attributes?.artistName||item?.artistName||'';
      const art=item?.attributes?.artwork;
      if (!data.artwork && art?.url) data.artwork=art.url.replace(/\{w\}/g,'600').replace(/\{h\}/g,'600').replace(/\{f\}/g,'jpg');
      const t=kit.currentPlaybackTime;
      if (Number.isFinite(t) && t>=0) {data.position=t;data.source='MusicKit';}
      if (typeof kit.isPlaying==='boolean') data.paused=!kit.isPlaying;
      const duration=item?.attributes?.durationInMillis;
      if(Number.isFinite(duration)) data.duration=duration/1000;
    }
  } catch (_) {}
  try {
    // A native <audio> clock is not always available on Apple Music Web.
    const media=[...document.querySelectorAll('audio,video')].filter(el=>Number.isFinite(el.currentTime) && Number.isFinite(el.duration) && el.duration>15);
    const chosen=media.find(el=>!el.paused)||media[0];
    if (chosen && (data.position===null || !chosen.paused)) {
      data.position=chosen.currentTime;
      data.paused=chosen.paused;
      data.duration=chosen.duration;
      data.source='HTML media';
    }
  } catch (_) {}
  window.postMessage(data,location.origin === "null" ? "*" : location.origin);
 };
 document.addEventListener('visibilitychange',publish);
 setInterval(publish,250);
 publish();
})();
