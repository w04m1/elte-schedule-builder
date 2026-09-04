<script>
  import Icon from "./Icon.svelte";
  import Modal from "./Modal.svelte";
  import { language, t } from "../utils/i18n.js";

  let { isOpen = false, onClose } = $props();
</script>

<Modal open={isOpen} wide label={t($language, "helpTitle")} {onClose}>
  {#if $language === "hu"}
    <article class="guide-content">
      <header>
        <div>
          <h2>Súgó és útmutató</h2>
          <p>
            Keress ELTE-s tárgyakat, válassz kurzuscsoportokat, hasonlíts össze
            lehetőségeket, és kezeld több órarendedet ebben a böngészőben.
          </p>
        </div>
        <button
          type="button"
          class="close-btn"
          aria-label="Útmutató bezárása"
          onclick={onClose}
        >
          <Icon name="x" size={20} />
        </button>
      </header>

      <aside class="guide-note">
        <strong
          >A végleges órarendet mindig ellenőrizd egy hivatalos
          ELTE-rendszerben.</strong
        >
        Ez a független eszköz a Tanrend adatait használja, amelyek hiányosak vagy
        elavultak lehetnek.
      </aside>

      <section>
        <h3>1. Gyors kezdés</h3>
        <ol>
          <li>
            Adj meg tárgykódot, kurzusnevet vagy oktatót a <strong
              >Kurzusok hozzáadása a Tanrendből</strong
            > résznél.
          </li>
          <li>
            Nyiss meg egy javasolt tárgyat, vagy válaszd a <strong
              >Kurzusok keresése</strong
            > gombot az összes találat áttekintéséhez.
          </li>
          <li>
            Először az előadások, majd a gyakorlatok jelennek meg, hétfőtől
            péntekig és kezdési idő szerint rendezve. Kattints vagy nyomj Entert
            egy kurzussoron a kiválasztáshoz. Az <strong
              >Összes csoport hozzáadása</strong
            > lehetőséggel minden csoportot összehasonlíthatsz. A találatok nyitva
            maradnak, így egy menetben választhatsz előadást és gyakorlatot.
          </li>
          <li>
            Pontosítsd a csoportokat, ellenőrizd az ütközéseket, majd exportálj
            vagy másold ki a megosztási linket az <strong>Az órarended</strong> résznél.
          </li>
        </ol>
      </section>

      <section>
        <h3>2. Tárgyak keresése vagy importálása</h3>
        <p>
          A kereső egyszerre vizsgálja a tárgykódokat, kurzusneveket és
          oktatóneveket. A nevekben kisebb elírásokat is elfogad, a
          tárgykódoknak viszont pontosnak kell lenniük. Oktató nevére keresve
          megjelennek az általa tartott kurzusok. Két karakter után legfeljebb
          három rangsorolt javaslat jelenik meg. A nyilakkal léphetsz, <kbd
            >Enter</kbd
          >rel nyithatsz meg egy tárgyat, <kbd>Escape</kbd>-pel pedig bezárhatod
          a javaslatokat. Egy javaslat megnyitása még nem adja hozzá a tárgyat
          az órarendhez.
        </p>
        <p>
          Az <strong>Importálás Neptunból</strong> a Neptun Felvett tárgyak
          oldaláról letöltött <code>.xlsx</code> fájlt fogadja. A fájl
          tárgykódokat tartalmaz, nem a kiválasztott kurzuscsoportokat, ezért a
          tervező minden Tanrend-lehetőséget megtart, de az előadás- és
          gyakorlatszakaszokban csak egy kezdő csoportot választ ki. Ellenőrizd
          a csoportokat, vagy használd az Órarendjavaslatokat. A
          <code>DEMO-1</code>–<code>DEMO-6</code> kódokkal élő Tanrend-adatok nélkül
          is kipróbálható a tervező.
        </p>
      </section>

      <section>
        <h3>3. Kiválasztott tárgyak pontosítása</h3>
        <p>
          A kiválasztott kurzussort zöld, az órarenddel ütköző sort piros keret
          és szöveges állapot jelöli. Egy tárgy jelölőnégyzete az összes
          engedélyezett alkalmát mutatja vagy rejti el. A tárgyak ábécérendben
          vannak. A tárgy nevére kattintva nyílnak meg a kurzusai; a
          jelölőnégyzet csak közvetlen kattintásra változik. Egy szakaszon belül
          új kurzus választásakor a korábbi automatikusan lecserélődik, a másik
          szakasz változatlan marad.
        </p>
        <p>
          Az <strong>Órarendjavaslatok</strong> érvényes csoportkombinációkat
          hasonlít össze. Először a legkevesebb ütközést tartalmazó
          lehetőségeket rangsorolja, majd ezek közül azt részesíti előnyben,
          amelyik kevesebb jelenlegi csoportot cserél le. Széles képernyőn a
          lehetőségek egymás mellett jelennek meg, és csak a lecserélendő
          csoportokat mutatják, a jelenlegi és a javasolt időponttal együtt. Az
          <strong>Alkalmazás</strong> módosítja az órarendet.
        </p>
      </section>

      <section>
        <h3>4. Az órarend olvasása</h3>
        <p>
          Az előadások zöldek, a gyakorlatok kékek, az ütközések pirosak.
          Keskeny képernyőn a heti rács helyett napokra bontott lista jelenik
          meg ugyanazokkal a részletekkel.
        </p>
        <p>
          Az <strong>Előadásütközések figyelmen kívül hagyása</strong> beállítást
          csak akkor kapcsold be, ha az előadás látogatása nem kötelező. Ez az ütközés-ellenőrzést
          módosítja, az előadásokat nem távolítja el.
        </p>
      </section>

      <section>
        <h3>5. Órarendek kezelése</h3>
        <p>
          A felső választóval válthatsz órarendet. A mellette lévő gombokkal
          átnevezheted vagy törölheted az aktuális tervet. Az <strong
            >Új órarend</strong
          >
          külön tervet készít, az <strong>Órarend kiürítése</strong> pedig csak az
          aktuális tervből távolítja el a tárgyakat.
        </p>
      </section>

      <section>
        <h3>6. Megosztás és exportálás</h3>
        <p>
          A <strong>Link másolása</strong> az engedélyezett kurzuskódokat és az előadásütközés
          beállítását URL-be teszi. A link megnyitása új helyi órarendet hoz létre,
          a meglévőket pedig megtartja.
        </p>
        <p>
          A <strong>Naptárexport</strong> az összes engedélyezett órát egyetlen csomagban
          tölti le. Az iCalendar (.ics) hetente ismétlődő órákat tartalmaz, és több
          naptáralkalmazással használható. A Google CSV minden óra következő időpontját
          tartalmazza, heti ismétlődés nélkül.
        </p>
      </section>

      <section>
        <h3>Tárolás és adatvédelem</h3>
        <p>
          Az órarendek a böngésző helyi tárhelyén maradnak. A webhelyadatok
          törlése, a privát böngészés vagy másik böngésző használata
          eltávolíthatja vagy elrejtheti őket.
        </p>
        <p>
          Az éles oldal saját üzemeltetésű analitikát, munkamenet-felvételt és
          hőtérképeket is használ. Ezek oldalmegtekintési és interakciós
          adatokat fogadnak az alkalmazás fejlesztéséhez.
        </p>
      </section>
    </article>
  {:else}
    <article class="guide-content">
      <header>
        <div>
          <h2>Help and guide</h2>
          <p>
            Search ELTE subjects, choose class groups, compare alternatives, and
            keep several timetable plans in this browser.
          </p>
        </div>
        <button
          type="button"
          class="close-btn"
          aria-label="Close guide"
          onclick={onClose}
        >
          <Icon name="x" size={20} />
        </button>
      </header>

      <aside class="guide-note">
        <strong
          >Always verify the final timetable in an official ELTE system.</strong
        >
        This independent tool reads Tanrend data, which may be incomplete or outdated.
      </aside>

      <section>
        <h3>1. Quick start</h3>
        <ol>
          <li>
            Enter a subject code, course name, or professor under
            <strong>Add courses from Tanrend</strong>.
          </li>
          <li>
            Open a suggested subject or select <strong>Find courses</strong> to review
            all matches.
          </li>
          <li>
            Review lectures first, followed by practices. Each section is
            ordered Monday to Friday, then by start time. Select a class by
            clicking or pressing its row, or use
            <strong>Add all groups</strong> when you want to compare its available
            groups in the planner. Results stay open after choosing a class so lectures
            and practices can be selected in one pass.
          </li>
          <li>
            Refine the selected groups, check conflicts, then export or copy a
            share link from <strong>Your timetable</strong>.
          </li>
        </ol>
      </section>

      <section>
        <h3>2. Search or import subjects</h3>
        <p>
          Search checks subject codes, course names, and professor names
          together. Small typing errors are tolerated in names, while subject
          codes stay exact. Searching for a professor shows the courses they
          teach. After two characters, up to three ranked suggestions appear.
          The first is selected automatically; use <kbd>↑</kbd> and <kbd>↓</kbd>
          to move,
          <kbd>Enter</kbd> to open the selected subject, and <kbd>Escape</kbd> to
          close the suggestions. Opening a suggestion does not add it to the timetable.
        </p>
        <p>
          <strong>Import Neptun</strong> accepts the <code>.xlsx</code> file
          from Neptun's Registered subjects page. That workbook contains subject
          codes, not the exact registered class groups, so the planner keeps
          every Tanrend alternative but selects only one initial group in each
          lecture/practice section. Review those groups or use Suggest
          schedules. Use <code>DEMO-1</code> through
          <code>DEMO-6</code> to try the planner without live Tanrend data.
        </p>
      </section>

      <section>
        <h3>3. Refine selected subjects</h3>
        <p>
          A selected class row has a green border; a row that would overlap the
          timetable has a red border and a conflict label. These states also
          have text and screen-reader labels, so color is not the only cue. A
          subject's checkbox shows or hides all of its enabled meetings.
          Subjects are listed alphabetically. Select a subject's name to open
          its classes; the checkbox changes only when selected directly.
          Lectures appear first and practices second, each ordered by weekday
          and time. Choosing another class in one section replaces its current
          selection without changing the other section. Use the remove button to
          delete the subject from this schedule.
        </p>
        <p>
          <strong>Suggest schedules</strong> compares valid group combinations.
          It ranks options by the fewest conflicts first, then prefers the one
          that replaces fewer currently selected groups. On wider screens,
          options appear side by side. Each option shows only the groups it
          would replace, organized by the weekday of the proposed class, with
          the current and suggested group shown together. On smaller screens,
          options stack into one column. <strong>Apply</strong> changes the timetable.
        </p>
      </section>

      <section>
        <h3>4. Read the timetable</h3>
        <p>
          Lectures are green, practices are blue, and conflicts are red. On
          narrow screens, the visual week grid becomes a day-by-day schedule
          list with the same class details.
        </p>
        <p>
          Enable <strong>Ignore lecture conflicts</strong> only when lecture attendance
          is not required. This changes conflict detection; it does not remove lectures
          from the timetable.
        </p>
      </section>

      <section>
        <h3>5. Manage timetable plans</h3>
        <p>
          Use the selector at the top to switch plans. The adjacent buttons
          rename or delete the current plan. <strong>New schedule</strong>
          creates a separate plan, while <strong>Clear schedule</strong> removes every
          subject from only the current plan.
        </p>
      </section>

      <section>
        <h3>6. Share or export</h3>
        <p>
          <strong>Copy link</strong> puts the enabled class codes and lecture conflict
          setting into a URL. Anyone with that URL can read those codes. Opening it
          creates a new local plan and preserves existing plans.
        </p>
        <p>
          <strong>Export calendar</strong> downloads every enabled class in one pack.
          The iCalendar (.ics) pack contains weekly recurring events and works with
          several calendar apps. The Google CSV pack contains the next occurrence
          of every class without weekly recurrence.
        </p>
      </section>

      <section>
        <h3>Storage and privacy</h3>
        <p>
          Schedules stay in this browser's local storage. Clearing site data,
          using private browsing, or changing browsers can remove or hide them.
        </p>
        <p>This site does not include analytics or session recording.</p>
      </section>
    </article>
  {/if}
</Modal>

<style>
  .guide-content {
    color: var(--color-text);
  }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  h2 {
    margin: 0;
    color: var(--color-accent-strong);
    font-size: var(--text-2xl);
  }

  header p {
    max-width: 62ch;
    margin: 6px 0 0;
    color: var(--color-text-muted);
  }

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .close-btn:hover {
    background: var(--color-surface-3);
    color: var(--color-text);
  }

  section {
    padding: 18px 0;
    border-top: 1px solid var(--color-border);
  }

  h3 {
    margin: 0 0 8px;
    color: var(--color-accent-strong);
    font-size: var(--text-lg);
  }

  p,
  ol {
    margin: 0 0 10px;
    line-height: 1.6;
  }

  p:last-child,
  ol:last-child {
    margin-bottom: 0;
  }

  ol {
    padding-left: 24px;
  }

  li + li {
    margin-top: 8px;
  }

  code {
    padding: 0.15em 0.4em;
    border-radius: 4px;
    background: var(--color-surface-2);
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.9em;
  }

  .guide-note {
    margin-bottom: 20px;
    padding: 14px 16px;
    border-left: 4px solid var(--color-warning);
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    line-height: 1.5;
  }

  @media (max-width: 640px) {
    h2 {
      font-size: var(--text-xl);
    }
  }
</style>
