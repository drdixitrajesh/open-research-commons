// ANZSRC 2020 codes from dist/data/subjects.json. Match explicit subject wording
// so generic event formats and organizer names are not mistaken for subjects.
const titleSubjects = [
  ['3606', /\b(?:printmaking|risograph)\b/iu],
  ['3703', /\b(?:geochemistry|isotope anomalies in meteorites|building materials in meteorites)\b/iu],
  ['370507', /\bplanetary geology\b/iu],
  ['370604', /\b(?:geodynamics|geodynamos?|core[ -]mantle (?:coupling|heat flux))\b/iu],
  ['390109', /\bmathematics education\b/iu],
  ['390303', /\b(?:higher education|undergraduate research)\b/iu],
  ['4007', /\b(?:robotics|mechatronics)\b/iu],
  ['4101', /\bclimate change (?:impacts?|adaptation)\b/iu],
  ['4202', /\bepidemiology\b/iu],
  ['4402', /\b(?:criminology|human trafficking)\b/iu],
  ['4602', /\b(?:artificial intelligence|generative ai|genai|large language models?)\b/iu],
  ['460208', /\bnatural language processing\b/iu],
  ['4604', /\bcybersecurity\b/iu],
  ['460501', /\b(?:data engineering|data science)\b/iu],
  ['4611', /\bmachine learning\b/iu],
  ['461103', /\bdeep learning\b/iu],
  ['490401', /\bnumber theory\b/iu],
  ['490402', /\b(?:algebraic|differential|symplectic) geometry\b/iu],
  ['490404', /\b(?:combinatorics|discrete mathematics)\b/iu],
  ['490406', /\blie groups?\b/iu],
  ['490412', /\balgebraic topology\b/iu],
  ['510105', /\b(?:general relativity|gravitational waves?)\b/iu],
  ['510108', /\b(?:coronal holes?|solar (?:corona|flares?|inertial modes?|physics|rossby modes?)|surface magnetic field of the sun)\b/iu],
  ['510109', /\b(?:exoplanets?|extrasolar planets?|planet formation around (?:late )?[a-z] dwarfs?)\b/iu],
  ['5107', /\bhigh[ -]energy physics\b/iu],
  ['510703', /\b(?:particle physics|(?:hadron|lepton|lepton[ -]hadron|particle) colliders?)\b/iu],
  ['510803', /\bquantum (?:computation|computing|information)\b/iu],
  ['510902', /\b(?:heliophysics|space weather)\b/iu],
  ['510905', /(?=.*\b(?:planet formation|planetesimals|planetary science)\b).*\bsolar system\b/iu],
  ['510906', /\bspace instrumentation\b|\bonboard\b.*\bspectropolarimetry\b.*\bESA\b/iu],
  ['511001', /\b(?:particle accelerators?|accelerator (?:institutes|physics)|radio[ -]frequency quadrupoles?)\b/iu],
  ['511003', /\bsynchrotrons?\b/iu],
];

function seminarSubject(title, sourceUrl) {
  if (!URL.canParse(sourceUrl) || new URL(sourceUrl).origin !== 'https://www.mps.mpg.de') return '';
  // The institute's official seminar listings identify these series' research areas.
  if (/^ESPOS:/iu.test(title)) return '510108';
  if (/^S(?:3|³) seminar\b/iu.test(title)) return '5109';
  return '';
}

export function organizerEventSubjectCodes(record) {
  if (typeof record?.title !== 'string' || !record.title.trim()) return [];
  const title = record.title.trim().replace(/[‐‑–—]/gu, '-');
  const matches = titleSubjects.filter(([, pattern]) => pattern.test(title)).map(([code]) => code);
  if (!matches.length) {
    const seminar = seminarSubject(title, record.sourceUrl);
    return seminar ? [seminar] : [];
  }
  // The event index derives parent groups from their field codes.
  return matches.filter(code => !matches.some(other => other !== code && other.startsWith(code))).slice(0, 8);
}
