const $=id=>document.getElementById(id);
let index=[];
const status=(text,kind='')=>{$('status').textContent=text;$('status').className=`status ${kind}`};
async function refresh(){
 const result=await chrome.storage.local.get('ttmlIndex');
 index=Array.isArray(result.ttmlIndex)?result.ttmlIndex:[];
 $('count').textContent=`${index.length} track${index.length===1?'':'s'}`;
 const keyword=normalizeTitle($('search').value);
 const entries=index.filter(item=>normalizeTitle(item.title).includes(keyword)).sort((a,b)=>a.title.localeCompare(b.title));
 const box=$('library');box.replaceChildren();
 if(!entries.length){const note=document.createElement('p');note.textContent=index.length?'No tracks match your search.':'Import your first TTML file to begin.';box.append(note);return}
 for(const item of entries){
  const row=document.createElement('div');row.className='item';
  const icon=document.createElement('div');icon.className='note';icon.textContent='♫';
  const info=document.createElement('div');info.className='info';
  const heading=document.createElement('strong');heading.textContent=item.title;
  const desc=document.createElement('small');desc.textContent=`${item.kind==='word'?'Word':'Line'}-synced • ${item.count} lines`;
  info.append(heading,desc);
  const remove=document.createElement('button');remove.className='remove';remove.title=`Remove ${item.title}`;remove.textContent='×';
  remove.onclick=async()=>{
    await chrome.storage.local.remove([`track:${item.key}`,`offset:${item.key}`]);
    index=index.filter(entry=>entry.key!==item.key);
    await chrome.storage.local.set({ttmlIndex:index});
    status(`Removed ${item.title}`,'ok');await refresh();
  };
  row.append(icon,info,remove);box.append(row);
 }
}
async function importFiles(files){
 const incoming=[...files].filter(f=>f.name.toLowerCase().endsWith('.ttml'));
 if(!incoming.length){status('No .ttml files selected.','error');return}
 status(`Reading ${incoming.length} TTML file(s)…`);
 const saved=await chrome.storage.local.get('ttmlIndex');
 const map=new Map((saved.ttmlIndex||[]).map(item=>[item.key,item]));
 let imported=0,skipped=0;const errors=[];
 // Word-sync has priority over companion line-sync, regardless of file order.
 const candidates=[];
 for(const file of incoming){
  try{
   let title=file.name.replace(/\.ttml$/i,'').replace(/\s*(?:[-–—]\s*)?(?:word|line)[- ]synced(?:\s+draft)?$/i,'').trim();
   const key=normalizeTitle(title);
   if(!key)throw Error('Could not read filename as song title');
   const parsed=parseTTML(await file.text());
   candidates.push({key,title,kind:parsed.kind,lines:parsed.lines,filename:file.name});
  }catch(e){errors.push(`${file.name}: ${e.message}`)}
 }
 candidates.sort((a,b)=>(a.kind==='word')-(b.kind==='word'));
 for(const item of candidates){
  try{
   const old=map.get(item.key);
   if(old && old.kind==='word'&&item.kind==='line'){skipped++;continue}
   await chrome.storage.local.set({[`track:${item.key}`]:{name:item.title,lines:item.lines,kind:item.kind}});
   map.set(item.key,{key:item.key,title:item.title,kind:item.kind,count:item.lines.length,importedAt:Date.now()});
   imported++;
  }catch(e){errors.push(`${item.filename}: ${e.message}`)}
 }
 await chrome.storage.local.set({ttmlIndex:[...map.values()]});
 await refresh();
 status(`Imported ${imported} file${imported===1?'':'s'}. ${skipped?`${skipped} lower-precision duplicate(s) skipped. `:''}${errors.length?`\n${errors.slice(0,8).join('\n')}`:''}`,errors.length?'error':'ok');
}
$('files').onchange=e=>{importFiles(e.target.files);e.target.value=''};
$('folder').onclick=()=>$('folderInput').click();
$('folderInput').onchange=e=>{importFiles(e.target.files);e.target.value=''};
$('search').oninput=refresh;
$('open').onclick=()=>chrome.tabs.create({url:'https://music.apple.com/'});
$('clear').onclick=async()=>{
 if(!confirm(`Delete all ${index.length} TTML lyrics imported into this extension?`))return;
 const removal=index.flatMap(i=>[`track:${i.key}`,`offset:${i.key}`]);
 if(removal.length)await chrome.storage.local.remove(removal);
 await chrome.storage.local.set({ttmlIndex:[]});
 await refresh();status('Library cleared.','ok');
};
const drop=$('drop');
drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragover')});
drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));
drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragover');importFiles(e.dataTransfer.files)});
refresh().catch(e=>status(`Library unavailable: ${e.message}`,'error'));
