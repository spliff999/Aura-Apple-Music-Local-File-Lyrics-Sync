/* Safe, local TTML parser; no external dependencies. Also used by the popup. */
function parseTime(value) {
  if (value === null || value === undefined) return NaN;
  const input = String(value).trim();
  if (/^\d+(?:\.\d+)?ms$/.test(input)) return parseFloat(input) / 1000;
  if (/^\d+(?:\.\d+)?s$/.test(input)) return parseFloat(input);
  if (/^\d+(?:\.\d+)?m$/.test(input)) return parseFloat(input) * 60;
  if (/^\d+(?:\.\d+)?h$/.test(input)) return parseFloat(input) * 3600;
  if (/^\d+(?:\.\d+)?$/.test(input)) return Number(input);
  const parts = input.split(':').map(Number);
  if (![2, 3].includes(parts.length) || !parts.every(Number.isFinite)) return NaN;
  return parts.reduce((total, part) => total * 60 + part, 0);
}
function normalizeTitle(value) {
  return String(value || '').normalize('NFKD').toLowerCase()
    .replace(/^\d{1,3}[.\s_\-]+/, '')
    .replace(/\s*\((?:feat\.?|ft\.?)\s+[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]+\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
function isSectionLabel(value) {
  return /^\s*\[(?:(?:verse|chorus|hook|intro|outro|bridge|refrain|pre[\s-]?chorus|post[\s-]?chorus|interlude|instrumental|break|solo|drop|produced by)(?:\s*[^\]]*)?)\]\s*$/i.test(value);
}
function parseTTML(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror') || [...doc.getElementsByTagName('*')].some(el=>el.localName==='parsererror')) throw Error('Invalid TTML XML');
  const lyrics = [];
  for (const p of [...doc.getElementsByTagName('*')].filter(el => el.localName === 'p')) {
    const begin = parseTime(p.getAttribute('begin'));
    let end = parseTime(p.getAttribute('end'));
    if (!Number.isFinite(end) && p.hasAttribute('dur') && Number.isFinite(begin)) end = begin + parseTime(p.getAttribute('dur'));
    if (!(Number.isFinite(begin) && Number.isFinite(end) && end > begin)) continue;
    const rawText = (p.textContent || '').replace(/\s+/g, ' ').trim();
    if (!rawText || isSectionLabel(rawText)) continue;
    const timed = [...p.getElementsByTagName('*')].filter(el => el.localName === 'span' && el.hasAttribute('begin'));
    // Leaf timed spans prevent double counting nested Apple word/syllable spans.
    const leafSpans = timed.filter(el=>![...el.getElementsByTagName('*')].some(ch=>ch.localName==='span' && ch.hasAttribute('begin')));
    let words = leafSpans.map(el => {
      const text = el.textContent || '';
      const wbegin = parseTime(el.getAttribute('begin'));
      let wend = parseTime(el.getAttribute('end'));
      if (!Number.isFinite(wend) && el.hasAttribute('dur')) wend = wbegin + parseTime(el.getAttribute('dur'));
      return {text, begin:wbegin, end:wend};
    }).filter(w => w.text.trim() && Number.isFinite(w.begin) && Number.isFinite(w.end) && w.end > w.begin);
    // Explicitly handle relative-to-line stamps only when every word is before its line start.
    if (words.length && begin > 0 && words.every(w => w.end <= begin + 0.001)) {
      words = words.map(w => ({...w, begin:w.begin + begin, end:w.end + begin}));
    }
    if (!words.length) words = [{text:rawText, begin, end}];
    lyrics.push({begin, end, text:rawText, words});
  }
  if (!lyrics.length) throw Error('No valid timed lyric lines found');
  for (let i=1;i<lyrics.length;i++) {
    if (lyrics[i].begin < lyrics[i-1].begin-0.08) throw Error(`Lyrics out of chronological order near line ${i+1}`);
  }
  const hasWordSync = lyrics.some(line=>line.words.length>1);
  return {lines:lyrics, kind:hasWordSync?'word':'line'};
}
