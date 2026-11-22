import { ApiError, mintingConfig, normalizeDoi, publishDoi, validDoi, verifyExistingDoi } from "./doi.js";
import { EmailAuthError, emailAuthEnabled, emailSession, handleEmailAuth, linkedLegacyUser } from "./email-auth.js";

const maxUpload = 20 * 1024 * 1024;
const maxJson = 120 * 1024;
const editableStatuses = new Set(["draft", "changes_requested"]);
const recordTypes = new Set(["event", "material", "thesis"]);
const eventTypes = new Set(["conference", "seminar", "symposium", "workshop", "webinar"]);
const materialTypes = new Set(["proceedingsVolume", "paper", "abstractBook", "abstract", "presentation", "poster",
  "report", "recording", "supportingMaterial"]);
const thesisTypes = new Set(["doctoralThesis", "mastersThesis", "dissertation"]);
const modes = new Set(["inPerson", "online", "hybrid"]);
const accessTypes = new Set(["open", "embargoed", "external"]);
const moderationActions = new Set(["approve", "changes", "reject", "withdraw", "updateEventStatus"]);
const eventStatuses = new Set(["scheduled", "postponed", "cancelled", "held"]);
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const countryCode = /^[A-Z]{2}$/;
const mediaTypes = new Map([
  ["pdf", "application/pdf"], ["png", "image/png"], ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"],
  ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["mp4", "video/mp4"], ["mp3", "audio/mpeg"], ["txt", "text/plain"],
]);
const shortFields = ["title", "authors", "institution", "country", "city", "venue", "timezone", "degree",
  "department", "supervisors", "publisher", "license", "rightsHolder", "organizer",
  "publicContact", "contributorRole", "attendanceFee", "academicStatus", "isbn", "dateType"];
const dateFields = ["startDate", "endDate", "deadline", "paperDeadline", "registrationDeadline", "releaseDate", "embargoUntil"];
const dateTimeFields = ["startTime", "endTime"];
const urlFields = ["registrationUrl", "sourceUrl", "externalUrl", "programmeUrl"];

function json(value, status = 200, headers = {}) {
  return Response.json(value, { status, headers: {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  } });
}

function problem(status, code, message, field) {
  throw new ApiError(status, code, message, field);
}

function invalid(field, message, code = "invalid_field") {
  problem(422, code, message, field);
}

function missing(field) {
  invalid(field, "Complete the required field.", "required_field");
}

function text(value, limit = 500) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function list(value, count, limit) {
  const items = typeof value === "string" ? value.split(/[,;\n]+/u) : (Array.isArray(value) ? value : []);
  return [...new Set(items.map(entry => text(entry, limit)).filter(Boolean))].slice(0, count);
}

function langTag(value, field) {
  const tag = text(value, 63);
  if (!tag) return "";
  try {
    return Intl.getCanonicalLocales(tag)[0];
  } catch {
    invalid(field, "Enter a valid language tag.");
  }
}

function validUrl(value, field) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch {
    // Fall through to the field-specific validation error.
  }
  invalid(field, "Use a full HTTP or HTTPS address.");
}

function validDate(value, field) {
  const date = text(value, 32);
  if (!date) return "";
  const parsed = new Date(date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date) return date;
  invalid(field, "Enter a calendar date.");
}

function translations(value, originalLanguage) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const metadata = Object.create(null);
  for (const [tag, entry] of Object.entries(value).slice(0, 24)) {
    const language = langTag(tag, "metadata");
    if (!entry || typeof entry !== "object" || language === originalLanguage) continue;
    const title = text(entry.title, 500);
    const description = text(entry.description, 8_000);
    const keywords = list(entry.keywords, 20, 100);
    if (title || description || keywords.length) {
      const status = entry.status === "machineTranslation" ? "machineTranslation" : "authorTranslation";
      metadata[language] = { title, description, keywords, status };
    }
  }
  return metadata;
}

function recordInput(source, subjects) {
  if (!source || typeof source !== "object" || Array.isArray(source)) invalid("record", "Enter the record details.");
  const record = Object.fromEntries(shortFields.map(field => [field, text(source[field])]));
  record.type = text(source.type);
  if (!recordTypes.has(record.type)) invalid("type", "Choose a record type.");
  record.title = record.title.normalize("NFC");
  record.countryCode = text(source.countryCode, 4);
  if (record.countryCode && !countryCode.test(record.countryCode)) invalid("countryCode", "Choose a valid country.");
  record.description = text(source.description || source.abstract, 8_000);
  record.programme = text(source.programme, 3_000);
  record.speakers = text(source.speakers, 2_000);
  record.verificationNotes = text(source.verificationNotes, 1500);
  record.language = langTag(source.language, "language");
  record.languages = list(source.languages, 12, 63).map(tag => langTag(tag, "language"));
  record.metadataLanguage = langTag(source.metadataLanguage, "metadataLanguage") || record.language;
  record.metadata = translations(source.metadata, record.metadataLanguage);
  record.keywords = list(source.keywords, 20, 100);
  record.subjectCodes = list(source.subjectCodes, 8, 12);
  if (record.subjectCodes.some(code => !/^(?:\d{2}|\d{4}|\d{6})$/.test(code) || (subjects && !subjects.has(code)))) {
    invalid("subjectCodes", "Choose a valid ANZSRC 2020 subject.");
  }
  record.doi = normalizeDoi(text(source.doi, 500));
  if (record.doi && !validDoi(record.doi)) invalid("doi", "Enter a valid DOI.", "invalid_doi");
  record.eventType = text(source.eventType);
  record.eventStatus = text(source.eventStatus) || "scheduled";
  if (!eventStatuses.has(record.eventStatus)) invalid("eventStatus", "Choose a supported event status.");
  record.materialType = text(source.materialType);
  record.thesisType = text(source.thesisType);
  record.mode = text(source.mode);
  record.access = record.type === "event" ? "open" : (text(source.access) || "open");
  if (!accessTypes.has(record.access)) invalid("access", "Choose an access policy.");
  record.year = text(String(source.year ?? ""), 8);
  if (record.year && !/^(?:1[0-9]{3}|2[0-9]{3})$/.test(record.year)) invalid("year", "Enter a four-digit year.");
  for (const field of dateFields) record[field] = validDate(source[field], field);
  for (const field of dateTimeFields) {
    record[field] = text(source[field], 6);
    if (record[field] && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(record[field])) invalid(field, "Enter a time.");
  }
  for (const field of urlFields) record[field] = validUrl(text(source[field], 2_000), field);
  record.relatedId = text(source.relatedId, 80);
  record.relatedEventTitle = text(source.relatedEventTitle, 500);
  record.translationOf = text(source.translationOf, 80);
  record.attachmentIds = list(source.attachmentIds, 10, 36);
  if (record.attachmentIds.some(id => !uuid.test(id))) invalid("attachmentIds", "The upload could not be found.");
  record.authority = source.authority === true || source.terms === true || source.permission === true;
  return record;
}

function validateSubmission(record) {
  for (const field of ["title", "description", "language"]) if (!record[field]) missing(field);
  if (!record.subjectCodes.length) missing("subjectCodes");
  if (!record.authority) missing("authority");
  if (record.type === "event") {
    if (!eventTypes.has(record.eventType)) missing("eventType");
    if (!modes.has(record.mode)) missing("mode");
    for (const field of ["startDate", "endDate", "institution"]) if (!record[field]) missing(field);
    if (record.endDate < record.startDate) invalid("endDate", "The end date must be on or after the start date.", "date_order");
    if (record.startDate === record.endDate && record.endTime && record.startTime && record.endTime < record.startTime) {
      invalid("endTime", "The end time must be on or after the start time.", "date_order");
    }
    if ((record.startTime || record.endTime) && !record.timezone) missing("timezone");
    if (record.timezone) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: record.timezone });
      } catch {
        invalid("timezone", "Enter a valid time zone, for example Asia/Kolkata.");
      }
    }
    if (record.mode !== "online") {
      for (const field of ["city", "country", "venue"]) if (!record[field]) missing(field);
    }
    if (!record.sourceUrl && !record.verificationNotes && !record.attachmentIds.length) missing("sourceUrl");
    return;
  }
  if (!record.authors) missing("authors");
  if (!record.license) missing("license");
  if (!record.year && !record.releaseDate) missing("year");
  if (record.access === "external" && !record.sourceUrl && !record.externalUrl) missing("sourceUrl");
  if (record.access === "embargoed") {
    if (!record.embargoUntil) missing("embargoUntil");
    if (!record.attachmentIds.length) missing("attachmentIds");
  }
  if (!record.attachmentIds.length && !record.sourceUrl && !record.externalUrl) missing("attachmentIds");
  if (record.type === "thesis") {
    if (!thesisTypes.has(record.thesisType)) missing("thesisType");
    for (const field of ["degree", "institution", "country"]) if (!record[field]) missing(field);
  } else {
    if (!materialTypes.has(record.materialType)) missing("materialType");
    if (!record.relatedId && !record.relatedEventTitle) missing("relatedId");
  }
}

function siteUser(request) {
  const id = request.headers.get("oai-authenticated-user-id");
  const email = request.headers.get("oai-authenticated-user-email");
  if (!id || !email) return null;
  const header = request.headers.get("oai-authenticated-user-full-name");
  let name = email;
  if (header && request.headers.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8") {
    try { name = decodeURIComponent(header); } catch { /* Use the email fallback. */ }
  }
  return { id, name, email };
}

async function requestUser(request, env, nativeUser) {
  const emailUser = await emailSession(request, env);
  let user = emailUser && { ...emailUser, authMethod: "email" };
  if (!user && nativeUser) {
    const linked = await linkedLegacyUser(env, nativeUser);
    user = { ...linked, email: nativeUser.email, name: nativeUser.name, authMethod: "chatgpt" };
  }
  if (!user) return null;
  const moderators = String(env.MODERATOR_EMAILS || "").toLowerCase().split(",").map(value => value.trim());
  return { ...user, isModerator: moderators.includes(user.email.toLowerCase()), linkedEmail: Boolean(user.secondaryOwnerId) };
}

function sessionUser(user) {
  if (!user) return null;
  const { id, name, email, isModerator, authMethod, linkedEmail, needsProfile, hasMobile } = user;
  return { id, name, email, isModerator, authMethod, linkedEmail, needsProfile, hasMobile };
}

function owns(user, ownerId) {
  return Boolean(user && ownerId && (ownerId === user.id || ownerId === user.secondaryOwnerId));
}

function requireUser(user, moderator = false) {
  if (!user) problem(401, "sign_in_required", "Sign in to continue.");
  if (moderator && !user.isModerator) problem(403, "moderator_required", "Only repository moderators can do this.");
  return user;
}

function requireDb(env) {
  if (!env.DB) problem(503, "storage_unavailable", "Repository storage is unavailable in this environment.");
  return env.DB;
}

function sameOrigin(request, url, env) {
  const origin = request.headers.get("Origin");
  if (!origin && request.headers.get("Sec-Fetch-Site") !== "cross-site") return;
  const publicOrigin = env.SITE_PUBLIC_URL && URL.canParse(env.SITE_PUBLIC_URL) ? new URL(env.SITE_PUBLIC_URL).origin : "";
  if (origin !== url.origin && origin !== publicOrigin) problem(403, "origin_denied", "Open the website to make this change.");
}

async function requestJson(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type") || "")) {
    problem(415, "json_required", "Send a JSON request.");
  }
  let raw;
  const reader = request.body?.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let length = 0;
  let value = "";
  if (!reader) problem(400, "bad_request", "The request body is missing.");
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > maxJson) {
        await reader.cancel();
        problem(413, "request_too_large", "The submission is too large.");
      }
      value += decoder.decode(chunk.value, { stream: true });
    }
    raw = JSON.parse(value + decoder.decode());
  } catch (error) {
    if (error instanceof ApiError) throw error;
    problem(400, "bad_request", "The request body is not valid JSON.");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) problem(400, "bad_request", "The request body is invalid.");
  return raw;
}

function normalizeFile(row) {
  return { id: row.id, name: row.name, url: "/api/files/" + row.id };
}

function parseAttachments(row) {
  return JSON.parse(row.files_json || "[]").map(normalizeFile);
}

function submission(row) {
  const record = JSON.parse(row.record_json);
  record.id = row.id;
  record.files = parseAttachments(row);
  if (row.published_at) record.doi = row.doi;
  return { id: row.id, status: row.status, note: row.note, record, updatedAt: row.updated_at,
    publishedAt: row.published_at, revision: row.revision, errorCode: row.error_code || null };
}

function openFiles(record) {
  return record.access === "open" || (record.access === "embargoed" && record.embargoUntil &&
    new Date().toISOString().slice(0, 10) >= record.embargoUntil);
}

function publicRecord(row) {
  const record = JSON.parse(row.record_json);
  const { attachmentIds, authority, verificationNotes, relatedEventTitle, sourceUrl, externalUrl, ...publicFields } = record;
  const base = { id: row.id, doi: row.doi, doiSource: row.doi_source, publishedAt: row.published_at,
    landingUrl: row.landing_url || "/?record=" + row.id, status: row.status };
  if (row.status === "withdrawn") {
    return { ...base, title: record.title, type: record.type, subjectCodes: record.subjectCodes, description: row.note,
      authors: record.authors, institution: record.institution, language: record.language, files: [], metadata: {} };
  }
  const embargoed = record.access === "embargoed" && !openFiles(record);
  return { ...publicFields, ...base, sourceUrl: embargoed ? "" : sourceUrl, externalUrl: embargoed ? "" : externalUrl,
    files: openFiles(record) ? parseAttachments(row) : [] };
}

const withFiles = "SELECT s.*, (SELECT json_group_array(json_object('id', id, 'name', name)) FROM" +
  " (SELECT u.id, u.name FROM submission_uploads a JOIN uploads u ON u.id = a.upload_id" +
  " WHERE a.submission_id = s.id ORDER BY a.position)) AS files_json FROM submissions s";

async function recordById(db, id) {
  return db.prepare(withFiles + " WHERE s.id = ?").bind(id).first();
}

async function publicRecords(db, url, id) {
  if (id) {
    if (!uuid.test(id)) problem(404, "record_not_found", "This record could not be found.");
    const row = await recordById(db, id);
    if (row && ["published", "withdrawn"].includes(row.status)) return json({ record: publicRecord(row) });
    if (row && ["registering", "doi_failed"].includes(row.status) && row.doi_source === "datacite") {
      return json({ record: { id, status: "publication_pending" } }, 202);
    }
    problem(404, "record_not_found", "This record could not be found.");
  }
  const cursor = url.searchParams.get("cursor");
  const [date, previousId] = cursor ? cursor.split("~") : ["", ""];
  if (cursor && (!/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(date) || !uuid.test(previousId))) {
    problem(400, "bad_cursor", "The records page could not be found.");
  }
  const limitSetting = Number(url.searchParams.get("limit") || "100");
  const limit = Number.isInteger(limitSetting) && limitSetting > 0 ? Math.min(100, limitSetting) : 100;
  const countryFilter = url.searchParams.get("country");
  const countries = countryFilter ? [...new Set(countryFilter.split(",").map(code => code.trim()))] : [];
  if (countries.length > 64 || countries.some(code => !countryCode.test(code))) {
    invalid("countryCode", "Choose up to 64 valid countries.");
  }
  const filters = ["s.status = 'published'"];
  const args = [];
  if (countries.length) {
    filters.push("json_extract(s.record_json, '$.countryCode') IN (" + countries.map(() => "?").join(", ") + ")");
    args.push(...countries);
  }
  if (cursor) {
    filters.push("(s.published_at, s.id) < (?, ?)");
    args.push(date, previousId);
  }
  const query = withFiles + " WHERE " + filters.join(" AND ") + " ORDER BY s.published_at DESC, s.id DESC LIMIT ?";
  const { results } = await db.prepare(query).bind(...args, limit + 1).all();
  const page = results.slice(0, limit);
  const last = page.at(-1);
  const next = results.length > limit ? last.published_at + "~" + last.id : null;
  return json({ records: page.map(publicRecord), next });
}

async function listSubmissions(db, url, user) {
  const queue = url.searchParams.get("queue") === "1";
  requireUser(user, queue);
  const filter = queue ? "s.status IN ('submitted', 'registering', 'doi_failed', 'published')" : "s.owner_id IN (?, ?)";
  const query = db.prepare(withFiles + " WHERE " + filter + " ORDER BY s.updated_at DESC LIMIT 100");
  const { results } = await (queue ? query : query.bind(user.id, user.secondaryOwnerId || null)).all();
  return json({ submissions: results.map(submission) });
}

async function checkRelationships(db, record, ownId, publishing) {
  if (record.relatedId) {
    const related = await db.prepare("SELECT status, doi, record_json FROM submissions WHERE id = ?").bind(record.relatedId).first();
    if (!related || related.status !== "published" || record.relatedId === ownId ||
        !["event", "material"].includes(JSON.parse(related.record_json).type)) {
      invalid("relatedId", "Choose a published event or proceedings volume.", "invalid_relationship");
    }
    const original = JSON.parse(related.record_json);
    if (original.type === "material" && (original.materialType !== "proceedingsVolume" || record.materialType === "proceedingsVolume")) {
      invalid("relatedId", "Choose the published event for this deposit.", "invalid_relationship");
    }
  } else if (publishing && record.type === "material") {
    invalid("relatedId", "Link a published event before publishing this deposit.", "invalid_relationship");
  }
  if (record.translationOf) {
    const original = await db.prepare("SELECT status, record_json FROM submissions WHERE id = ?").bind(record.translationOf).first();
    if (!original || original.status !== "published" || record.translationOf === ownId ||
        JSON.parse(original.record_json).type !== record.type) {
      invalid("translationOf", "Choose the published original work.", "invalid_relationship");
    }
  }
}

async function checkFileOwners(db, ids, user, recordId) {
  if (!ids.length) return;
  const placeholders = ids.map(() => "?").join(",");
  const query = "SELECT u.id, a.submission_id FROM uploads u LEFT JOIN submission_uploads a ON a.upload_id = u.id" +
    " WHERE u.owner_id IN (?, ?) AND u.id IN (" + placeholders + ")";
  const { results } = await db.prepare(query).bind(user.id, user.secondaryOwnerId || null, ...ids).all();
  if (results.length !== ids.length || results.some(row => row.submission_id && row.submission_id !== recordId)) {
    invalid("attachmentIds", "One or more uploads are unavailable for this submission.", "invalid_upload");
  }
}

async function saveSubmission(db, input, user, subjects) {
  requireUser(user);
  if (!["draft", "submit"].includes(input.action)) problem(400, "bad_action", "Choose how to save the submission.");
  const existingId = text(input.id, 80);
  if (existingId && !uuid.test(existingId)) problem(404, "submission_not_found", "This submission could not be found.");
  const existing = existingId ? await recordById(db, existingId) : null;
  if (existingId && !owns(user, existing?.owner_id)) {
    problem(404, "submission_not_found", "This submission could not be found.");
  }
  if (existing && !editableStatuses.has(existing.status)) problem(409, "not_editable", "This submission cannot currently be edited.");
  if (existing && input.revision != null && input.revision !== existing.revision) {
    problem(409, "revision_conflict", "The submission was updated in another session. Open it again.");
  }
  const record = recordInput(input.record, subjects);
  if (existing) {
    const previous = JSON.parse(existing.record_json);
    const changed = ["title", "description", "keywords", "metadataLanguage"].some(field =>
      JSON.stringify(previous[field]) !== JSON.stringify(record[field]));
    for (const [tag, current] of Object.entries(record.metadata)) {
      const old = previous.metadata[tag];
      if (old && (changed || old.status === "reviewRequired") &&
          ["title", "description"].every(field => old[field] === current[field]) &&
          old.keywords.join("\n") === current.keywords.join("\n")) {
        current.status = "reviewRequired";
      }
    }
  }
  const id = existingId || crypto.randomUUID();
  if (input.action === "submit") {
    validateSubmission(record);
    await checkRelationships(db, record, id, false);
  }
  await checkFileOwners(db, record.attachmentIds, user, id);
  const updatedAt = new Date().toISOString();
  const status = input.action === "submit" ? "submitted" : (existing?.status || "draft");
  const lock = crypto.randomUUID();
  const recordJson = JSON.stringify(record);
  const save = existing
    ? db.prepare("UPDATE submissions SET record_json=?, status=?, updated_at=?, revision=revision+1, lease_token=? " +
      "WHERE id=? AND owner_id=? AND revision=? AND status IN ('draft', 'changes_requested')")
      .bind(recordJson, status, updatedAt, lock, id, existing.owner_id, existing.revision)
    : db.prepare("INSERT INTO submissions (id, owner_id, record_json, status, created_at, updated_at, lease_token) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, user.id, recordJson, status, updatedAt, updatedAt, lock);
  const containsLock = "EXISTS (SELECT 1 FROM submissions WHERE id = ? AND lease_token = ?)";
  const batches = [
    save,
    db.prepare("DELETE FROM submission_uploads WHERE submission_id = ? AND " + containsLock).bind(id, id, lock),
    ...record.attachmentIds.map((uploadId, index) => db.prepare(
      "INSERT INTO submission_uploads (upload_id, submission_id, position) SELECT ?, ?, ? WHERE " + containsLock
    ).bind(uploadId, id, index, id, lock)),
    db.prepare("UPDATE submissions SET lease_token=NULL WHERE id=? AND lease_token=?").bind(id, lock),
  ];
  let result;
  try {
    [result] = await db.batch(batches);
  } catch (error) {
    if (String(error).includes("UNIQUE constraint failed: submission_uploads")) {
      invalid("attachmentIds", "An upload was already linked to a different submission.", "invalid_upload");
    }
    throw error;
  }
  if (!result.meta.changes) problem(409, "revision_conflict", "The submission changed. Open it again before saving.");
  return json({ submission: submission(await recordById(db, id)) }, existing ? 200 : 201);
}

function fileResponseAllowed(file) {
  if (file.status !== "published") return false;
  return openFiles(JSON.parse(file.record_json));
}

async function loadFile(db, bucket, id, user, head) {
  if (!uuid.test(id)) problem(404, "file_not_found", "The file could not be found.");
  const query = "SELECT u.*, s.status, s.record_json FROM uploads u" +
    " LEFT JOIN submission_uploads a ON a.upload_id = u.id LEFT JOIN submissions s ON s.id = a.submission_id WHERE u.id = ?";
  const file = await db.prepare(query).bind(id).first();
  if (!file || (!fileResponseAllowed(file) && !owns(user, file.owner_id) && !user?.isModerator)) {
    problem(404, "file_not_found", "The file could not be found.");
  }
  if (!bucket) problem(503, "files_unavailable", "File storage is unavailable in this environment.");
  const object = head ? await bucket.head(id) : await bucket.get(id);
  if (!object) problem(404, "file_not_found", "The file could not be found.");
  const extension = file.name.split(".").at(-1).toLowerCase();
  const filename = encodeURIComponent(file.name).replace(/['()*]/g, char => "%" + char.charCodeAt(0).toString(16));
  return new Response(head ? null : object.body, { headers: {
    "Content-Type": file.media_type, "Content-Length": String(file.size),
    "Content-Disposition": 'attachment; filename="deposit.' + extension + '"; filename*=UTF-8\'\'' + filename,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  } });
}

async function readUpload(request) {
  const claimedSize = Number(request.headers.get("Content-Length") || 0);
  if (claimedSize > maxUpload + 64 * 1024) problem(413, "file_too_large", "Upload a file of at most 20 MiB.");
  const mediaType = request.headers.get("Content-Type") || "";
  if (!/^multipart\/form-data\s*;/i.test(mediaType) || !request.body) {
    problem(415, "invalid_upload", "Choose a file to upload.");
  }
  let size = 0;
  const limited = request.body.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      size += chunk.byteLength;
      if (size > maxUpload + 64 * 1024) {
        controller.error(new ApiError(413, "file_too_large", "Upload a file of at most 20 MiB."));
        return;
      }
      controller.enqueue(chunk);
    },
  }));
  try {
    const form = await new Response(limited, { headers: { "Content-Type": mediaType } }).formData();
    return form.get("file");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    problem(400, "invalid_upload", "The upload could not be read.");
  }
}

async function uploadFile(request, db, bucket, user) {
  requireUser(user);
  if (!bucket) problem(503, "files_unavailable", "File storage is unavailable in this environment.");
  const file = await readUpload(request);
  if (!(file instanceof File) || !file.size) problem(422, "invalid_upload", "Choose a file to upload.");
  if (file.size > maxUpload) problem(413, "file_too_large", "Upload a file of at most 20 MiB.");
  const cleanName = file.name.toWellFormed().replace(/[\u0000-\u001F\u007F/\\]/gu, "").trim();
  const extension = cleanName.split(".").at(-1)?.toLowerCase();
  const fileType = mediaTypes.get(extension);
  if (!cleanName || cleanName.length > 200 || !cleanName.includes(".") || !fileType) {
    problem(415, "unsupported_file", "Upload PDF, PNG, JPEG, DOCX, PPTX, MP3, MP4, or plain text.");
  }
  if (extension === "pdf" && !new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()).startsWith("%PDF-")) {
    problem(415, "invalid_upload", "The file is not a PDF document.");
  }
  const id = crypto.randomUUID();
  await bucket.put(id, file);
  try {
    await db.prepare("INSERT INTO uploads (id, owner_id, name, media_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, user.id, cleanName, fileType, file.size, new Date().toISOString()).run();
  } catch (error) {
    await bucket.delete(id);
    throw error;
  }
  return json({ ...normalizeFile({ id, name: cleanName }), size: file.size }, 201);
}

async function changeModeration(db, row, action, input) {
  const statusMap = { changes: "changes_requested", reject: "rejected", withdraw: "withdrawn" };
  const note = text(input.note, 1500);
  if (action === "updateEventStatus") {
    if (row.status !== "published") problem(409, "not_published", "This event is not published.");
    const record = JSON.parse(row.record_json);
    if (record.type !== "event" || !eventStatuses.has(input.eventStatus)) invalid("eventStatus", "Choose an event status.");
    record.eventStatus = input.eventStatus;
    for (const field of ["startDate", "endDate", "deadline", "paperDeadline", "registrationDeadline"]) {
      if (Object.hasOwn(input, field)) record[field] = validDate(input[field], field);
    }
    for (const field of ["timezone", "venue", "city", "country", "countryCode"]) {
      if (Object.hasOwn(input, field)) record[field] = text(input[field]);
    }
    if (record.countryCode && !countryCode.test(record.countryCode)) invalid("countryCode", "Choose a valid country.");
    validateSubmission(record);
    const result = await db.prepare("UPDATE submissions SET record_json=?, updated_at=?, revision=revision+1 WHERE id=? AND revision=?")
      .bind(JSON.stringify(record), new Date().toISOString(), row.id, row.revision).run();
    if (!result.meta.changes) problem(409, "revision_conflict", "The record changed. Reload and try again.");
    return;
  }
  const valid = action === "withdraw" ? row.status === "published"
    : row.status === "submitted" || (row.status === "doi_failed" && row.doi_source !== "datacite");
  if (!valid) problem(409, "invalid_status", "This action is unavailable for the current status.");
  if (!note) missing("note");
  const isWithdrawal = action === "withdraw";
  const result = await db.prepare("UPDATE submissions SET status=?, note=?, updated_at=?, revision=revision+1, " +
    "doi=CASE WHEN ? THEN doi ELSE NULL END, doi_source=CASE WHEN ? THEN doi_source ELSE NULL END," +
    " landing_url=CASE WHEN ? THEN landing_url ELSE NULL END, error_code=NULL WHERE id=? AND revision=?")
    .bind(statusMap[action], note, new Date().toISOString(), Number(isWithdrawal), Number(isWithdrawal),
      Number(isWithdrawal), row.id, row.revision).run();
  if (!result.meta.changes) problem(409, "revision_conflict", "The submission changed. Reload and try again.");
}

async function relationshipDoi(db, id) {
  if (!id) return undefined;
  return db.prepare("SELECT doi FROM submissions WHERE id = ? AND status = 'published'").bind(id).first("doi");
}

async function approveSubmission(db, env, row, subjects) {
  const now = new Date();
  const expired = row.status === "registering" && row.lease_until < now.toISOString();
  if (!["submitted", "doi_failed"].includes(row.status) && !expired) {
    problem(409, "invalid_status", "This submission is unavailable for approval.");
  }
  const record = JSON.parse(row.record_json);
  validateSubmission(record);
  await checkRelationships(db, record, row.id, true);
  const external = Boolean(record.doi);
  const config = external ? null : mintingConfig(env, row.id);
  if (config && row.doi) {
    config.doi = row.doi;
    config.landingUrl = row.landing_url;
  }
  const doi = external ? record.doi : config.doi;
  const source = external ? "external" : "datacite";
  const lock = crypto.randomUUID();
  const leaseUntil = new Date(now.getTime() + 60_000).toISOString();
  const update = db.prepare("UPDATE submissions SET status='registering', doi=?, doi_source=?, landing_url=?, " +
    "lease_token=?, lease_until=?, updated_at=?, error_code=NULL, revision=revision+1 WHERE id=? AND revision=?");
  let locked;
  try {
    locked = await update.bind(doi, source, config?.landingUrl || null, lock, leaseUntil, now.toISOString(), row.id, row.revision).run();
  } catch (error) {
    if (String(error).includes("UNIQUE constraint failed: submissions.doi")) {
      problem(409, "doi_duplicate", "This DOI already identifies another repository record.", "doi");
    }
    throw error;
  }
  if (!locked.meta.changes) problem(409, "revision_conflict", "Another moderator updated this submission.");
  try {
    if (external) {
      await verifyExistingDoi(doi, record);
    } else {
      const [relatedDoi, translatedDoi] = await Promise.all([
        relationshipDoi(db, record.relatedId),
        relationshipDoi(db, record.translationOf),
      ]);
      await publishDoi(config, record, subjects, relatedDoi, translatedDoi);
    }
  } catch (error) {
    const issue = error instanceof ApiError ? error :
      new ApiError(502, "doi_registration_failed", "The DOI registry did not respond. Retry this submission.");
    await db.prepare("UPDATE submissions SET status='doi_failed', error_code=?, note=?, lease_token=NULL, lease_until=NULL, " +
      "doi=CASE WHEN doi_source='external' THEN NULL ELSE doi END, updated_at=?, revision=revision+1 WHERE id=? AND lease_token=?")
      .bind(issue.code, issue.message, new Date().toISOString(), row.id, lock).run();
    throw issue;
  }
  const published = new Date().toISOString();
  const result = await db.prepare("UPDATE submissions SET status='published', note='', published_at=?, updated_at=?, error_code=NULL, " +
    "lease_token=NULL, lease_until=NULL, revision=revision+1 WHERE id=? AND lease_token=?")
    .bind(published, published, row.id, lock).run();
  if (!result.meta.changes) problem(409, "revision_conflict", "The approval lease expired. Retry this submission.");
}

async function moderate(db, env, input, user, subjects) {
  requireUser(user, true);
  const id = text(input.id, 36);
  const action = text(input.action);
  if (!moderationActions.has(action)) problem(400, "bad_action", "Choose a moderation action.");
  const row = uuid.test(id) && await recordById(db, id);
  if (!row) problem(404, "submission_not_found", "This submission could not be found.");
  if (action === "approve") await approveSubmission(db, env, row, subjects);
  else await changeModeration(db, row, action, input);
  return json({ submission: submission(await recordById(db, id)) });
}

export async function handleApi(request, env, subjects) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").slice(1);
  const [, route, id] = parts;
  const method = request.method;
  try {
    if (parts.length > 3 || parts[0] !== "api") problem(404, "not_found", "This page could not be found.");
    if (method === "POST") sameOrigin(request, url, env);
    if (route === "records" && method === "GET") return await publicRecords(requireDb(env), url, id);
    const nativeUser = siteUser(request);
    if (route === "auth" && method === "POST" && ["start", "verify", "profile", "logout"].includes(id)) {
      return await handleEmailAuth(request, env, id, id === "logout" ? {} : await requestJson(request), nativeUser);
    }
    const user = await requestUser(request, env, nativeUser);
    if (route === "session" && method === "GET" && !id) {
      return json({ user: sessionUser(user), persistent: Boolean(env.DB), files: Boolean(env.DB && env.BUCKET),
        emailAuth: emailAuthEnabled(env), hasNative: Boolean(nativeUser) });
    }
    if (route === "submissions" && !id && ["GET", "POST"].includes(method)) {
      requireUser(user, url.searchParams.get("queue") === "1");
      if (method === "GET") return await listSubmissions(requireDb(env), url, user);
      return await saveSubmission(requireDb(env), await requestJson(request), user, subjects);
    }
    if (route === "uploads" && !id && method === "POST") {
      requireUser(user);
      return await uploadFile(request, requireDb(env), env.BUCKET, user);
    }
    if (route === "files" && id && ["GET", "HEAD"].includes(method)) {
      return await loadFile(requireDb(env), env.BUCKET, id, user, method === "HEAD");
    }
    if (route === "moderate" && !id && method === "POST") {
      requireUser(user, true);
      return await moderate(requireDb(env), env, await requestJson(request), user, subjects);
    }
    problem(404, "not_found", "This page could not be found.");
  } catch (error) {
    if (error instanceof ApiError || error instanceof EmailAuthError) {
      return json({ error: error.message, code: error.code, ...(error.field ? { field: error.field } : {}) }, error.status);
    }
    console.error("Repository request failed", route, error?.name || "Error");
    return json({ error: "The repository could not complete the request.", code: "server_error" }, 500);
  }
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith("/api/")) return handleApi(request, env);
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
  },
};
