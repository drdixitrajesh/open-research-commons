const weights = {
  titles: 32,
  subjects: 20,
  keywords: 12,
  contributors: 9,
  details: 4,
  identifiers: 20,
};

const compactScript = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;

export function catalogText(value) {
  return String(value ?? '').normalize('NFKD').toLowerCase()
    .replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
}

function terms(text) {
  return text.split(' ').filter(Boolean).flatMap(word => {
    if (!segmenter || !compactScript.test(word)) return [word];
    return [...segmenter.segment(word)].filter(item => item.isWordLike).map(item => item.segment);
  });
}

function doiIdentifier(value) {
  let identifier = String(value ?? '').trim().replace(/^doi\s*:\s*/i, '');
  if (/^(?:https?:\/\/)?(?:dx\.)?doi\.org\//i.test(identifier)) {
    const url = new URL(/^https?:\/\//i.test(identifier) ? identifier : 'https://' + identifier);
    identifier = url.pathname.slice(1);
  }
  try { identifier = decodeURIComponent(identifier); } catch { /* Use the supplied text. */ }
  return /^10\.\d{4,9}\/\S+$/i.test(identifier) ? identifier.toLowerCase() : '';
}

function firstAtOrAfter(words, term) {
  let low = 0;
  let high = words.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (words[middle] < term) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function buildCatalogIndex(records, describe) {
  const postings = new Map();
  const fieldsByRecord = new Map();
  const dois = new Map();
  for (const record of records) {
    const details = describe(record);
    const fields = {};
    for (const [field, weight] of Object.entries(weights)) {
      const values = details[field] || [];
      const phrases = values.map(catalogText).filter(Boolean);
      fields[field] = phrases;
      for (const term of new Set(phrases.flatMap(terms))) {
        let matches = postings.get(term);
        if (!matches) postings.set(term, matches = new Map());
        matches.set(record, Math.max(matches.get(record) || 0, weight));
      }
    }
    for (const value of details.identifiers || []) {
      const doi = doiIdentifier(value);
      if (!doi) continue;
      if (!dois.has(doi)) dois.set(doi, new Set());
      dois.get(doi).add(record);
    }
    fieldsByRecord.set(record, fields);
  }
  const vocabulary = [...postings.keys()].sort();

  function postingsFor(term) {
    const matches = new Map(postings.get(term));
    if (/\p{N}/u.test(term)) return matches;
    const compact = compactScript.test(term);
    const minLength = compact ? 2 : 3;
    if ([...term].length < minLength) return matches;
    function addMatches(variant) {
      if (variant === term) return;
      for (const [record, weight] of postings.get(variant)) {
        matches.set(record, Math.max(matches.get(record) || 0, weight * 0.55));
      }
    }
    if (compact) {
      for (const variant of vocabulary) if (variant.includes(term)) addMatches(variant);
    } else {
      let i = firstAtOrAfter(vocabulary, term);
      while (vocabulary[i]?.startsWith(term)) addMatches(vocabulary[i++]);
    }
    return matches;
  }

  return {
    search(query) {
      const doi = doiIdentifier(query);
      if (doi) return new Map([...(dois.get(doi) || [])].map(record => [record, 600]));

      const phrase = catalogText(query);
      const queryTerms = [...new Set(terms(phrase))];
      if (!queryTerms.length) return new Map([...fieldsByRecord.keys()].map(record => [record, 1]));

      const [first, ...rest] = queryTerms;
      const scores = postingsFor(first);
      for (const term of rest) {
        const matches = postingsFor(term);
        for (const [record, score] of scores) {
          if (matches.has(record)) scores.set(record, score + matches.get(record));
          else scores.delete(record);
        }
        if (!scores.size) break;
      }

      for (const [record, score] of scores) {
        const fields = fieldsByRecord.get(record);
        let bonus = 0;
        if (fields.identifiers.includes(phrase)) bonus += 128;
        if (fields.titles.includes(phrase)) bonus += 96;
        if (queryTerms.length > 1) {
          const bounded = ' ' + phrase + ' ';
          for (const [field, weight] of Object.entries(weights)) {
            if (fields[field].some(value => (' ' + value + ' ').includes(bounded))) {
              bonus += weight;
            }
          }
        }
        scores.set(record, score + bonus);
      }
      return scores;
    },
  };
}
