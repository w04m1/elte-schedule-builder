import { writable } from "svelte/store";
import { STORAGE_KEYS } from "./storageKeys.js";

const SUPPORTED_LANGUAGES = ["en", "hu"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const language = writable<Language>("en");

const MESSAGES = {
  en: {
    skipToMain: "Skip to main content",
    appSubtitle: "Your semester, clearly planned.",
    language: "Language",
    english: "English",
    hungarian: "Hungarian",
    colorTheme: "Color theme: {theme}. Activate to change.",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    help: "Help",
    confirm: "Confirm",
    cancel: "Cancel",
    delete: "Delete",
    deleteNamed: "Delete {name}",
    clear: "Clear",
    importedSchedule: "Imported schedule",
    newScheduleName: "New schedule",
    deleteSchedule: "Delete schedule",
    deleteScheduleMessage: 'Delete "{name}"? You can\'t undo this.',
    resetSchedule: "Reset schedule",
    clearScheduleMessage: "Remove every subject from this schedule?",
    schedulePlanner: "Schedule planner",
    scheduleWorkspace: "Schedule workspace",
    schedule: "Schedule",
    scheduleName: "Schedule name",
    saveScheduleName: "Save schedule name",
    cancelRenaming: "Cancel renaming",
    renameSchedule: "Rename {name}",
    keepOneSchedule: "You need to keep at least one schedule",
    clearSchedule: "Clear schedule",
    newSchedule: "New schedule",
    dataNoticeTitle: "Check the details before trusting this schedule",
    dataNoticeBody:
      "Not affiliated with ELTE. Course data comes from Tanrend and can be incomplete or out of date — check anything important in official ELTE systems.",
    dismiss: "Dismiss",
    projectInformation: "Project information",
    notAffiliated: "Not affiliated with ELTE.",
    builtBy: "Built by",
    and: "and",
    opensNewTab: "opens in a new tab",
    projectLinks: "Project links",
    starOnGithub: "Star on GitHub",
    email: "Email",
    community: "Community",
    timetableOptions: "Timetable display options",
    lecture: "Lecture",
    practice: "Practice",
    conflict: "Conflict",
    ignoreLectureConflicts: "Ignore lecture conflicts",
    timetableActions: "Timetable actions",
    exportGoogle: "Export calendar",
    copyShareLink: "Copy link",
    shareCopied: "Share link copied to clipboard.",
    shareFailed:
      "The share link could not be copied — check clipboard permissions and try again.",
    yourTimetable: "Your timetable",
    startBuilding: "Search for a course above to start your week.",
    weeklyGrid: "Weekly schedule grid",
    weekReady: "Your week is ready to plan",
    findThenChoose: "Find a subject above, then pick a class.",
    weeklyList: "Weekly schedule list",
    scheduleList: "Schedule list",
    agendaIntro: "Classes are grouped by day and sorted by time.",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    other: "Other",
    group: "Group",
    classDetails: "Class details",
    professor: "Professor",
    room: "Room",
    courseCode: "Course",
    details: "details",
    to: "to",
    code: "code",
    location: "location",
    instructor: "instructor",
    conflictsWithEvent: "conflicts with another event",
    selectedSubjects: "Selected subjects",
    showSubject: "Show {name} in timetable",
    editClasses: "Edit classes for {name}",
    removeSubject: "Remove subject {name}",
    removeSubjectTitle: "Remove subject",
    groupsFor: "Groups for {name}",
    chooseOneEach: "Choose one class from each section.",
    lectures: "Lectures",
    practices: "Practices",
    otherClasses: "Other classes",
    selected: "Selected",
    conflicts: "Conflicts",
    selectClass: "Select class",
    selectedClass: "Selected class",
    addCourses: "Add courses from Tanrend",
    searchPlaceholder: "Subject code, course, or professor",
    findCourses: "Find courses",
    importNeptun: "Import Neptun",
    uploadNeptun: "Upload the .xlsx file from Neptun Registered subjects",
    subjectSuggestions: "Subject suggestions",
    findingMatches: "Finding matches…",
    bestMatches: "Best matches",
    suggestionKeyboard: "Arrow keys to move · Enter to select",
    taughtBy: "Taught by {name}",
    checking: "Checking {term}",
    searchResults: "Tanrend search results",
    closeResults: "Close search results",
    addAllGroups: "Add all groups",
    noResults: "No matching courses found.",
    searchLabel: "Subject code, course name, or professor",
    searchHint:
      "Type at least two characters of a subject code, course name, or professor. Names forgive small typos; codes must be exact. Arrow keys move through up to three suggestions, Enter selects.",
    searching: "Searching…",
    enterSearch: "Type a subject code, course name, or professor.",
    enterCode: "Type at least one subject code.",
    noClassesAll:
      "No classes found. Check the subject code, course, or professor name.",
    noClassesCode: "No classes found. Check the subject code.",
    addedMeetings:
      "{name} added with {count} class meetings. Pick classes below if needed.",
    addedMeeting:
      "{name} added with {count} class meeting. Pick classes below if needed.",
    alreadySelected: "{name}: {when} is already selected.",
    classSelected:
      "{name}: {when} selected. Select another class or close the results.",
    noCodesInFile:
      "No subject codes found. Use the Neptun Registered subjects export — it needs a Code column.",
    fileReadFailed:
      "Could not read that file. Export it from Neptun and try again.",
    neptunAdded:
      "{count} subjects added from Neptun. One starting group per section is selected — review them or use Suggest schedules.",
    neptunAddedOne:
      "{count} subject added from Neptun. One starting group per section is selected — review it or use Suggest schedules.",
    failedSearches: "No usable classes found for: {items}.",
    progressCode: "code: {term}",
    progressProfessor: "professor: {term}",
    progressCourse: "course: {term}",
    progressSimilarProfessor: "similar professor names",
    progressSimilarCourse: "similar course names",
    class: "Class",
    locationMissing: "Location not listed",
    instructorMissing: "Instructor not listed",
    conflictsWithTimetable: "conflicts with your timetable",
    conflictsWithCourses: "Conflicts with {courses}",
    scheduleSuggestions: "Schedule suggestions",
    closeSuggestions: "Close suggestions",
    currentConflicts: "Your current selection has {count} conflict.",
    currentConflictsPlural: "Your current selection has {count} conflicts.",
    option: "Option {number}",
    noConflicts: "No conflicts",
    swapsGroup: "Swaps {count} group",
    swapsGroups: "Swaps {count} groups",
    current: "Current",
    suggested: "Suggested",
    apply: "Apply",
    applyOption: "Apply option {number}",
    suggestSchedules: "Suggest schedules",
    noSuggestionData:
      "Nothing to suggest yet — add subjects with schedule data first.",
    onlyCombination: "That's the only possible combination for your subjects.",
    noImprovingSchedule:
      "No available group swap reduces these conflicts. Check the fixed meetings, or turn on Ignore lecture conflicts if lectures are optional.",
    noReplacements: "No replacements",
    replacements: "{count} replacements",
    replacement: "{count} replacement",
    conflictCount: "{count} conflict",
    conflictCountPlural: "{count} conflicts",
    keepsSelection: "Keeps all your currently selected groups.",
    calendarPack: "Full timetable",
    exportDialogTitle: "Export timetable",
    exportDialogDescription:
      "Download all enabled classes in one calendar file.",
    closeExport: "Close export dialog",
    classIncluded: "{count} class included",
    classesIncluded: "{count} classes included",
    icalendarTitle: "iCalendar (.ics)",
    recommended: "Recommended",
    icalendarDescription:
      "Weekly recurring timetable for Apple Calendar, Outlook, Google Calendar, and most calendar apps.",
    downloadICalendar: "Download iCalendar pack",
    googleCsvTitle: "Google Calendar (.csv)",
    googleCsvDescription:
      "Next occurrence of every class in Google's format. No weekly recurrence.",
    downloadGoogleCsv: "Download Google Calendar CSV pack",
    exportComplete: "Downloaded a pack with {count} class.",
    exportCompletePlural: "Downloaded a pack with {count} classes.",
    calendarExportFailed: "Couldn't create the calendar pack. Try again.",
    helpTitle: "Help and guide",
    closeGuide: "Close guide",
  },
  hu: {
    skipToMain: "Ugrás a fő tartalomhoz",
    appSubtitle: "A féléved átláthatóan megtervezve.",
    language: "Nyelv",
    english: "Angol",
    hungarian: "Magyar",
    colorTheme: "Színtéma: {theme}. Aktiválással válthatsz.",
    themeSystem: "Rendszer",
    themeLight: "Világos",
    themeDark: "Sötét",
    help: "Súgó",
    confirm: "Megerősítés",
    cancel: "Mégse",
    delete: "Törlés",
    deleteNamed: "{name} törlése",
    clear: "Kiürítés",
    importedSchedule: "Importált órarend",
    newScheduleName: "Új órarend",
    deleteSchedule: "Órarend törlése",
    deleteScheduleMessage:
      "Biztosan törlöd ezt: „{name}”? Ez nem vonható vissza.",
    resetSchedule: "Órarend kiürítése",
    clearScheduleMessage: "Eltávolítod az összes tárgyat ebből az órarendből?",
    schedulePlanner: "Órarendtervező",
    scheduleWorkspace: "Órarend munkaterület",
    schedule: "Órarend",
    scheduleName: "Órarend neve",
    saveScheduleName: "Órarend nevének mentése",
    cancelRenaming: "Átnevezés megszakítása",
    renameSchedule: "{name} átnevezése",
    keepOneSchedule: "Legalább egy órarendet meg kell tartani",
    clearSchedule: "Órarend kiürítése",
    newSchedule: "Új órarend",
    dataNoticeTitle:
      "Ellenőrizd a fontos adatokat, mielőtt erre az órarendre hagyatkozol",
    dataNoticeBody:
      "Ez a független eszköz nem áll kapcsolatban az ELTE-vel. A kurzusadatok a Tanrendből származnak, és hiányosak vagy elavultak lehetnek, ezért a fontos részleteket ellenőrizd az ELTE hivatalos rendszereiben.",
    dismiss: "Bezárás",
    projectInformation: "Projektinformációk",
    notAffiliated: "Nem áll kapcsolatban az ELTE-vel.",
    builtBy: "Készítette",
    and: "és",
    opensNewTab: "új lapon nyílik meg",
    projectLinks: "Projektlinkek",
    starOnGithub: "Csillag a GitHubon",
    email: "E-mail",
    community: "Közösség",
    timetableOptions: "Órarend megjelenítési beállításai",
    lecture: "Előadás",
    practice: "Gyakorlat",
    conflict: "Ütközés",
    ignoreLectureConflicts: "Előadásütközések figyelmen kívül hagyása",
    timetableActions: "Órarend műveletei",
    exportGoogle: "Naptárexport",
    copyShareLink: "Link másolása",
    shareCopied: "A megosztási link a vágólapra került.",
    shareFailed:
      "A megosztási linket nem sikerült másolni. Ellenőrizd a vágólapengedélyeket, majd próbáld újra.",
    yourTimetable: "Az órarended",
    startBuilding:
      "Keress egy kurzust fent, és kezdd el összeállítani a hetedet.",
    weeklyGrid: "Heti órarendrács",
    weekReady: "A heted készen áll a tervezésre",
    findThenChoose: "Keress egy tárgyat fent, majd válassz egy kurzust.",
    weeklyList: "Heti órarendlista",
    scheduleList: "Órarendlista",
    agendaIntro:
      "A kurzusok nap szerint vannak csoportosítva és időrendben jelennek meg.",
    monday: "Hétfő",
    tuesday: "Kedd",
    wednesday: "Szerda",
    thursday: "Csütörtök",
    friday: "Péntek",
    saturday: "Szombat",
    sunday: "Vasárnap",
    other: "Egyéb",
    group: "Csoport",
    classDetails: "Kurzus részletei",
    professor: "Oktató",
    room: "Terem",
    courseCode: "Kurzus",
    details: "részletei",
    to: "–",
    code: "kód",
    location: "helyszín",
    instructor: "oktató",
    conflictsWithEvent: "ütközik egy másik órával",
    selectedSubjects: "Kiválasztott tárgyak",
    showSubject: "{name} megjelenítése az órarendben",
    editClasses: "{name} kurzusainak szerkesztése",
    removeSubject: "{name} eltávolítása",
    removeSubjectTitle: "Tárgy eltávolítása",
    groupsFor: "{name} csoportjai",
    chooseOneEach: "Válassz egy kurzust minden szakaszból.",
    lectures: "Előadások",
    practices: "Gyakorlatok",
    otherClasses: "Egyéb kurzusok",
    selected: "Kiválasztva",
    conflicts: "Ütközik",
    selectClass: "Kurzus kiválasztása",
    selectedClass: "Kiválasztott kurzus",
    addCourses: "Kurzusok hozzáadása a Tanrendből",
    searchPlaceholder: "Tárgykód, kurzus vagy oktató",
    findCourses: "Kurzusok keresése",
    importNeptun: "Importálás Neptunból",
    uploadNeptun:
      "A Neptun Felvett tárgyak oldaláról letöltött .xlsx fájl feltöltése",
    subjectSuggestions: "Tárgyjavaslatok",
    findingMatches: "Találatok keresése…",
    bestMatches: "Legjobb találatok",
    suggestionKeyboard: "Nyilakkal lépj · Enterrel válassz",
    taughtBy: "Oktató: {name}",
    checking: "Ellenőrzés: {term}",
    searchResults: "Tanrend keresési találatok",
    closeResults: "Keresési találatok bezárása",
    addAllGroups: "Összes csoport hozzáadása",
    noResults: "Nincs megfelelő kurzus.",
    searchLabel: "Tárgykód, kurzusnév vagy oktató",
    searchHint:
      "Írj be legalább két karaktert egy tárgykódból, kurzusnévből vagy oktató nevéből. A kurzus- és oktatónevek keresése kisebb elírásokat is elfogad. A legfeljebb három javaslat között a nyilakkal léphetsz, Enterrel választhatsz.",
    searching: "Keresés…",
    enterSearch: "Adj meg egy tárgykódot, kurzusnevet vagy oktatót.",
    enterCode: "Adj meg legalább egy tárgykódot.",
    noClassesAll:
      "Nem található kurzus. Ellenőrizd a tárgykódot, a kurzus vagy az oktató nevét, majd próbáld újra.",
    noClassesCode:
      "Nem található kurzus. Ellenőrizd a tárgykódot, majd próbáld újra.",
    addedMeetings:
      "{name} hozzáadva {count} alkalommal. Szükség esetén válassz kurzust lent.",
    addedMeeting:
      "{name} hozzáadva {count} alkalommal. Szükség esetén válassz kurzust lent.",
    alreadySelected: "{name}: {when} már ki van választva.",
    classSelected:
      "{name}: {when} kiválasztva. Válassz másik kurzust is, vagy zárd be a találatokat, ha elkészültél.",
    noCodesInFile:
      "Nem található tárgykód. Használd a Neptun Felvett tárgyak exportját, amely tartalmaz Kód oszlopot.",
    fileReadFailed:
      "A fájl nem olvasható. Exportáld újra a Neptunból, majd próbáld újra.",
    neptunAdded:
      "{count} tárgy hozzáadva a Neptunból. Szakaszonként egy kezdő csoport van kiválasztva; ellenőrizd a csoportokat, vagy használd az Órarendjavaslatokat.",
    neptunAddedOne:
      "{count} tárgy hozzáadva a Neptunból. Szakaszonként egy kezdő csoport van kiválasztva; ellenőrizd a csoportokat, vagy használd az Órarendjavaslatokat.",
    failedSearches: "Nem található használható kurzus ezekhez: {items}.",
    progressCode: "kód: {term}",
    progressProfessor: "oktató: {term}",
    progressCourse: "kurzus: {term}",
    progressSimilarProfessor: "hasonló oktatónevek",
    progressSimilarCourse: "hasonló kurzusnevek",
    class: "Kurzus",
    locationMissing: "Nincs megadott helyszín",
    instructorMissing: "Nincs megadott oktató",
    conflictsWithTimetable: "ütközik az órarendeddel",
    conflictsWithCourses: "Ütközik ezzel: {courses}",
    scheduleSuggestions: "Órarendjavaslatok",
    closeSuggestions: "Javaslatok bezárása",
    currentConflicts: "A jelenlegi kiválasztásban {count} ütközés van.",
    currentConflictsPlural: "A jelenlegi kiválasztásban {count} ütközés van.",
    option: "{number}. lehetőség",
    noConflicts: "Nincs ütközés",
    swapsGroup: "{count} csoportot cserél",
    swapsGroups: "{count} csoportot cserél",
    current: "Jelenlegi",
    suggested: "Javasolt",
    apply: "Alkalmazás",
    applyOption: "{number}. lehetőség alkalmazása",
    suggestSchedules: "Órarendjavaslatok",
    noSuggestionData:
      "Még nincs mit javasolni. Előbb adj hozzá időponttal rendelkező tárgyakat.",
    onlyCombination: "Ez az egyetlen lehetséges kombináció a tárgyaidhoz.",
    noImprovingSchedule:
      "Az elérhető csoportcserék egyike sem csökkenti az ütközések számát. Ellenőrizd a kötött időpontokat, vagy kapcsold be az Előadásütközések figyelmen kívül hagyása lehetőséget, ha az előadások látogatása nem kötelező.",
    noReplacements: "Nincs csere",
    replacements: "{count} csere",
    replacement: "{count} csere",
    conflictCount: "{count} ütközés",
    conflictCountPlural: "{count} ütközés",
    keepsSelection:
      "Ez a lehetőség megtart minden jelenleg kiválasztott csoportot.",
    calendarPack: "Teljes órarend",
    exportDialogTitle: "Órarend exportálása",
    exportDialogDescription:
      "Töltsd le az összes engedélyezett órát együtt, egyetlen naptárfájlban.",
    closeExport: "Exportálási ablak bezárása",
    classIncluded: "{count} óra a csomagban",
    classesIncluded: "{count} óra a csomagban",
    icalendarTitle: "iCalendar (.ics)",
    recommended: "Ajánlott",
    icalendarDescription:
      "Hetente ismétlődő órarend Apple Naptárhoz, Outlookhoz, Google Naptárhoz és más naptáralkalmazásokhoz.",
    downloadICalendar: "iCalendar-csomag letöltése",
    googleCsvTitle: "Google Naptár (.csv)",
    googleCsvDescription:
      "Google-kompatibilis csomag minden óra következő időpontjával. A CSV nem őrzi meg a heti ismétlődést.",
    downloadGoogleCsv: "Google Naptár CSV-csomag letöltése",
    exportComplete: "Letöltött csomag: {count} óra.",
    exportCompletePlural: "Letöltött csomag: {count} óra.",
    calendarExportFailed:
      "Nem sikerült létrehozni a naptárcsomagot. Próbáld újra.",
    helpTitle: "Súgó és útmutató",
    closeGuide: "Útmutató bezárása",
  },
};

function isSupported(value: unknown): value is Language {
  return (
    typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as Language)
  );
}

export function detectDeviceLanguage(
  deviceLanguages?: string | readonly string[] | string[],
): Language {
  const primaryLanguage =
    typeof deviceLanguages === "string"
      ? deviceLanguages
      : Array.from(deviceLanguages ?? [])[0];
  return /^hu(?:-|$)/i.test(primaryLanguage || "") ? "hu" : "en";
}

function applyDocumentLanguage(value: Language): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = value === "hu" ? "hu" : "en";
  }
}

export function initLanguage(
  storage: Storage | null = typeof localStorage === "undefined"
    ? null
    : localStorage,
  deviceLanguages: readonly string[] | string[] = typeof navigator ===
  "undefined"
    ? []
    : navigator.languages?.length
      ? navigator.languages
      : [navigator.language],
): Language {
  let storedLanguage: string | null = null;
  try {
    storedLanguage = storage?.getItem(STORAGE_KEYS.language) ?? null;
  } catch {
    // Storage can be unavailable; device language still provides a default.
  }
  const nextLanguage = isSupported(storedLanguage)
    ? storedLanguage
    : detectDeviceLanguage(deviceLanguages);
  language.set(nextLanguage);
  applyDocumentLanguage(nextLanguage);
  return nextLanguage;
}

export function setLanguage(
  value: string,
  storage: Storage | null = typeof localStorage === "undefined"
    ? null
    : localStorage,
): boolean {
  if (!isSupported(value)) return false;
  language.set(value);
  try {
    storage?.setItem(STORAGE_KEYS.language, value);
  } catch {
    // The language can still change when storage is unavailable.
  }
  applyDocumentLanguage(value);
  return true;
}

export function t(
  activeLanguage: string,
  key: string,
  variables: Record<string, unknown> = {},
): string {
  const langMessages =
    (MESSAGES as Record<string, Record<string, string>>)[activeLanguage] ??
    MESSAGES.en;
  const template =
    langMessages[key] ??
    (MESSAGES.en as Record<string, string>)[key] ??
    String(key);
  return Object.entries(variables).reduce(
    (result, [name, value]) =>
      result.replaceAll(`{${name}}`, String(value ?? "")),
    template,
  );
}

export function dayName(activeLanguage: string, day: string): string {
  return t(activeLanguage, day.toLocaleLowerCase("en-US"));
}
