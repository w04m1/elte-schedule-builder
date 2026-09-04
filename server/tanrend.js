import axios from "axios";
import { readPositiveInteger } from "../config/runtime.js";

export const MAX_SUBJECT_CODE_LENGTH = 64;
export const MAX_SUBJECT_NAME_LENGTH = 160;
const SUBJECT_CODE_PATTERN = /^[A-Za-z0-9._-]+$/;
const TANREND_SEARCH_MODES = {
  code: "keres_kod_azon",
  name: "keresnevre",
  instructor: "keres_okt",
};

const UPSTREAM_TIMEOUT = readPositiveInteger(
  process.env.UPSTREAM_TIMEOUT_MS,
  10000,
);
const MAX_UPSTREAM_RESPONSE_SIZE = 2 * 1024 * 1024;

export function isValidSubjectCode(subjectCode) {
  return (
    typeof subjectCode === "string" &&
    subjectCode.length <= MAX_SUBJECT_CODE_LENGTH &&
    SUBJECT_CODE_PATTERN.test(subjectCode)
  );
}

export function isValidSubjectName(subjectName) {
  const containsControlCharacter = [...(subjectName ?? "")].some(
    (character) => {
      const characterCode = character.charCodeAt(0);
      return characterCode <= 31 || characterCode === 127;
    },
  );
  return (
    typeof subjectName === "string" &&
    subjectName.trim().length > 0 &&
    subjectName.length <= MAX_SUBJECT_NAME_LENGTH &&
    !containsControlCharacter
  );
}

export function validateSubjectCode(req, res, next) {
  if (!isValidSubjectCode(req.params.code)) {
    return res.status(400).json({ error: "Invalid subject code" });
  }

  next();
}

export function validateSubjectSearch(req, res, next) {
  const searchMode = req.query.by ?? "code";
  const searchTerm = req.params.query;
  if (!Object.hasOwn(TANREND_SEARCH_MODES, searchMode)) {
    return res.status(400).json({ error: "Invalid subject search mode" });
  }

  const isValid =
    searchMode === "code"
      ? isValidSubjectCode(searchTerm)
      : isValidSubjectName(searchTerm);

  if (!isValid) {
    return res.status(400).json({ error: `Invalid subject ${searchMode}` });
  }

  req.subjectSearchMode = searchMode;
  next();
}

export function buildTanrendUrl(searchTerm, term, searchMode = "code") {
  const upstreamMode = TANREND_SEARCH_MODES[searchMode];
  if (!upstreamMode) throw new TypeError("Unsupported subject search mode");

  const targetUrl = new URL("https://tanrend.elte.hu/tanrendnavigation_en.php");
  targetUrl.search = new URLSearchParams({
    f: term,
    m: upstreamMode,
    k: searchTerm,
  });
  return targetUrl.toString();
}

export async function fetchSubjectData(searchTerm, term, searchMode = "code") {
  const targetUrl = buildTanrendUrl(searchTerm, term, searchMode);

  const response = await axios.get(targetUrl, {
    timeout: UPSTREAM_TIMEOUT,
    maxContentLength: MAX_UPSTREAM_RESPONSE_SIZE,
    maxBodyLength: MAX_UPSTREAM_RESPONSE_SIZE,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://tanrend.elte.hu/oktatoitanrend_en",
    },
  });

  return response.data;
}

/**
 * ELTE terms run September-December (fall, "-1") and February-June (spring,
 * "-2"). July marks the transition into the next academic year's fall term.
 */
export function getCurrentTerm() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const semester = month >= 6 ? 1 : 2;
  return `${
    semester === 1 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }-${semester}`;
}
