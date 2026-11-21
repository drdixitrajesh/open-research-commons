const dataCiteApi = "https://api.datacite.org/dois";
const crossrefApi = "https://api.crossref.org/works";
const fetchTimeout = 8_000;

export class ApiError extends Error {
  constructor(status, code, message, field) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

export function normalizeDoi(value) {
  return value.trim().replace(/^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/i, "").toLowerCase();
}

export function validDoi(value) {
  return /^10\.\d{4,9}\/[^\s\u0000-\u001F\u007F]+$/u.test(value) && value.length <= 450;
}

function doiPath(doi) {
  return doi.split("/").map(encodeURIComponent).join("/");
}

function titleKey(title) {
  return (title || "").normalize("NFKC").toLowerCase().replaceAll(/[^\p{L}\p{M}\p{N}]/gu, "");
}

const materialTypes = {
  proceedingsVolume: "ConferenceProceeding",
  paper: "ConferencePaper",
  abstractBook: "Collection",
  abstract: "Text",
  presentation: "Presentation",
  poster: "Poster",
  report: "Report",
  recording: "Audiovisual",
  supportingMaterial: "Other",
};

function dataCiteType(record) {
  if (record.type === "event") return "Event";
  if (record.type === "thesis") return "Dissertation";
  return materialTypes[record.materialType] ?? "Other";
}

const crossrefTypes = {
  proceedingsVolume: ["proceedings", "proceedings-series"],
  paper: ["proceedings-article", "journal-article", "book-chapter"],
  abstractBook: ["proceedings", "book", "edited-book"],
  abstract: ["proceedings-article", "posted-content", "journal-article", "component"],
  presentation: ["posted-content", "component"],
  poster: ["posted-content", "component"],
  report: ["report"],
  recording: ["component", "other"],
  supportingMaterial: ["dataset", "component", "other"],
};

async function lookup(endpoint, options = {}) {
  const response = await fetch(endpoint, { ...options, redirect: "manual", signal: AbortSignal.timeout(fetchTimeout) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("DOI registry request failed");
  return response.json();
}

export async function verifyExistingDoi(doi, record) {
  const [dataCite, crossref] = await Promise.allSettled([
    lookup(dataCiteApi + "/" + doiPath(doi)),
    lookup(crossrefApi + "/" + doiPath(doi)),
  ]);
  const candidates = [];
  const dc = dataCite.status === "fulfilled" && dataCite.value?.data?.attributes;
  if (dc && ["findable", "registered"].includes(dc.state) && normalizeDoi(dc.doi || "") === doi) {
    candidates.push({
      titles: dc.titles?.map(({ title }) => title) ?? [],
      matchesType: dc.types?.resourceTypeGeneral === dataCiteType(record),
    });
  }
  const cr = crossref.status === "fulfilled" && crossref.value?.message;
  if (cr && normalizeDoi(cr.DOI || "") === doi) {
    candidates.push({
      titles: cr.title ?? [],
      matchesType: record.type === "thesis" ? cr.type === "dissertation" :
        record.type === "material" && crossrefTypes[record.materialType]?.includes(cr.type),
    });
  }
  if (!candidates.length) {
    if ([dataCite, crossref].some(({ status }) => status === "rejected")) {
      throw new ApiError(502, "doi_registry_unavailable", "The DOI registry could not be checked. Try again.");
    }
    throw new ApiError(422, "doi_not_found", "The DOI was not found in the supported registries.", "doi");
  }
  const titles = [record.title, ...Object.values(record.metadata).map(({ title }) => title)].map(titleKey).filter(Boolean);
  if (!candidates.some(({ titles: registered, matchesType }) => matchesType && registered.some(title => titles.includes(titleKey(title))))) {
    throw new ApiError(422, "doi_mismatch", "The DOI registry lists a different work title or resource type.", "doi");
  }
}

export function mintingConfig(env, id) {
  const { DATACITE_PREFIX: prefix, DATACITE_USERNAME: username, DATACITE_PASSWORD: password,
    DATACITE_PUBLISHER: publisher, SITE_PUBLIC_URL: site, DATACITE_CONTACT_EMAIL: email } = env;
  let landing;
  try {
    landing = new URL("/", site);
  } catch {
    // Report incomplete configuration through the same actionable workflow error.
  }
  if (!landing || landing.protocol !== "https:" || landing.username || landing.password ||
      !/^10\.\d{4,9}$/.test(prefix || "") || !username || !password || !publisher) {
    throw new ApiError(503, "doi_setup_required", "Set up a production DataCite repository and public landing URL before registering a new DOI.");
  }
  landing.searchParams.set("record", id);
  const headers = {
    "Content-Type": "application/vnd.api+json",
    Authorization: "Basic " + btoa(username + ":" + password),
    ...(email ? { "User-Agent": "Open Research Commons (mailto:" + email + ")" } : {}),
  };
  return { doi: prefix + "/orc." + id.replaceAll("-", ""), landingUrl: landing.href, publisher, headers };
}

function doiMetadata(record, config, subjects, relatedDoi, translatedDoi) {
  const titles = [{ title: record.title, lang: record.metadataLanguage || record.language }];
  const descriptions = [{ description: record.description, descriptionType: record.type === "event" ? "Other" : "Abstract",
    lang: record.metadataLanguage || record.language }];
  for (const [lang, translation] of Object.entries(record.metadata)) {
    if (translation.title) titles.push({ title: translation.title, lang, titleType: "TranslatedTitle" });
    if (translation.description) descriptions.push({
      description: translation.description, lang, descriptionType: record.type === "event" ? "Other" : "Abstract",
    });
  }
  const relatedIdentifiers = [];
  if (relatedDoi) relatedIdentifiers.push({ relatedIdentifier: relatedDoi, relatedIdentifierType: "DOI", relationType: "IsPartOf" });
  if (translatedDoi) relatedIdentifiers.push({ relatedIdentifier: translatedDoi, relatedIdentifierType: "DOI", relationType: "IsTranslationOf" });
  const dates = [];
  if (record.type === "event") dates.push({
    date: record.startDate === record.endDate ? record.startDate : record.startDate + "/" + record.endDate,
    dateType: "Other",
    dateInformation: "Event dates",
  });
  if (record.releaseDate) dates.push({ date: record.releaseDate, dateType: "Issued" });
  if (record.embargoUntil) dates.push({ date: record.embargoUntil, dateType: "Available" });
  return {
    doi: config.doi,
    event: "publish",
    url: config.landingUrl,
    titles,
    descriptions,
    language: record.language,
    creators: record.type === "event" ? [{ name: record.institution, nameType: "Organizational" }]
      : record.authors.split(/[\n;]+/u).map(name => ({ name: name.trim(), nameType: "Personal" })).filter(({ name }) => name),
    types: { resourceTypeGeneral: dataCiteType(record) },
    publisher: record.type === "event" ? record.institution : (record.publisher || config.publisher),
    publicationYear: Number(record.year) || Number(record.releaseDate?.slice(0, 4)) || new Date().getUTCFullYear(),
    dates,
    rightsList: record.license ? [{ rights: record.license }] : [],
    subjects: [
      ...record.subjectCodes.map(code => ({ subject: subjects?.get(code) || code,
        subjectScheme: "ANZSRC 2020 Fields of Research", classificationCode: code })),
      ...record.keywords.map(subject => ({ subject, lang: record.metadataLanguage || record.language })),
      ...Object.entries(record.metadata).flatMap(([lang, { keywords }]) => keywords.map(subject => ({ subject, lang }))),
    ],
    relatedIdentifiers,
  };
}

async function registerRequest(endpoint, method, attributes, config) {
  return fetch(endpoint, {
    method,
    headers: config.headers,
    body: JSON.stringify({ data: { type: "dois", attributes } }),
    signal: AbortSignal.timeout(fetchTimeout),
    redirect: "manual",
  });
}

function confirmedDoi(payload, config) {
  const registered = payload?.data?.attributes;
  return registered?.state === "findable" && normalizeDoi(registered.doi || "") === config.doi &&
    registered.url === config.landingUrl;
}

export async function publishDoi(config, record, subjects, relatedDoi, translatedDoi) {
  const endpoint = dataCiteApi + "/" + doiPath(config.doi);
  const landing = await fetch(config.landingUrl, { redirect: "manual", signal: AbortSignal.timeout(fetchTimeout) });
  if (!landing.ok || !landing.headers.get("Content-Type")?.includes("text/html")) {
    throw new ApiError(503, "doi_landing_unavailable", "Make the permanent landing page publicly accessible before DOI registration.");
  }
  await landing.body?.cancel();
  const existing = await lookup(endpoint, { headers: config.headers });
  if (confirmedDoi(existing, config)) return;
  if (existing && existing.data?.attributes?.url !== config.landingUrl) {
    throw new ApiError(409, "doi_registry_conflict", "The reserved DOI is already linked to a different landing page.");
  }
  const attributes = doiMetadata(record, config, subjects, relatedDoi, translatedDoi);
  const response = existing
    ? await registerRequest(endpoint, "PUT", attributes, config)
    : await registerRequest(dataCiteApi, "POST", attributes, config);
  if (!response.ok || !confirmedDoi(await response.json(), config)) {
    throw new ApiError(502, "doi_registration_failed", "DataCite did not confirm registration. Check the repository configuration or retry.");
  }
}
