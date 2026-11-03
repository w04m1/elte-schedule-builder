# Calendar-centered planner

The approved direction preserves green accents and puts the timetable beside course selection. This is an operational tool: readable data and predictable interaction take precedence over ornament.

## Composition

Above 1000px, a 340–390px rail contains compact schedule management, search and selected subjects. The week takes the remaining width. Each area remains accessible while the other grows; long course lists scroll in the rail. At tablet widths the controls precede the full-width calendar; phones use the existing daily agenda for selected events.

## Hierarchy

Find courses and Suggest schedules retain green emphasis. Import, refresh, export and sharing use neutral secondary controls. Destructive actions retain their warning semantics. Lecture, practice and conflict colors remain meaningful in timetable events and legends.

## Typography and surfaces

Use locally hosted Manrope with system fallbacks, semantic color variables and the existing type scale. Separate workspace regions with space and restrained boundaries. Avoid extra badges, gradients, promotional typography and decorative motion. Keep keyboard focus visible and links readable in both themes.

The calendar toolbar wraps only when needed; obvious section labels and promotional subtitles stay out of the visual layout. Theme follows the system until the user explicitly toggles light or dark.

## Responsive behavior

Class choices respond to their container width, not only the viewport. Autocomplete suggestions participate in document flow inside the narrow rail so they cannot cover Find courses. At 320px the header wraps into a brand row and a controls row. An empty mobile week remains scrollable rather than scaled and clipped.

## Scope of this implementation

Restructure presentation without changing selection, persistence, conflict or optimizer logic. Completion indicators, a separate alternatives workflow and richer suggestion ranking explanations remain follow-up product work from the audit; this layout change does not claim to solve those findings.
