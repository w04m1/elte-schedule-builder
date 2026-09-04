<script>
  /**
   * Inline stroke icon set (feather/lucide style, 24x24 viewBox).
   * Icons are decorative by default; pass `label` for meaningful icons.
   */
  const ICONS = {
    "alert-triangle": [
      [
        "path",
        {
          d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
        },
      ],
      ["line", { x1: 12, y1: 9, x2: 12, y2: 13 }],
      ["line", { x1: 12, y1: 17, x2: 12.01, y2: 17 }],
    ],
    calendar: [
      ["rect", { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }],
      ["line", { x1: 16, y1: 2, x2: 16, y2: 6 }],
      ["line", { x1: 8, y1: 2, x2: 8, y2: 6 }],
      ["line", { x1: 3, y1: 10, x2: 21, y2: 10 }],
    ],
    check: [["polyline", { points: "20 6 9 17 4 12" }]],
    "chevron-down": [["polyline", { points: "6 9 12 15 18 9" }]],
    "chevron-left": [["polyline", { points: "15 18 9 12 15 6" }]],
    "chevron-right": [["polyline", { points: "9 18 15 12 9 6" }]],
    "chevron-up": [["polyline", { points: "18 15 12 9 6 15" }]],
    clock: [
      ["circle", { cx: 12, cy: 12, r: 10 }],
      ["polyline", { points: "12 6 12 12 16 14" }],
    ],
    download: [
      ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
      ["polyline", { points: "7 10 12 15 17 10" }],
      ["line", { x1: 12, y1: 15, x2: 12, y2: 3 }],
    ],
    "external-link": [
      [
        "path",
        { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" },
      ],
      ["polyline", { points: "15 3 21 3 21 9" }],
      ["line", { x1: 10, y1: 14, x2: 21, y2: 3 }],
    ],
    info: [
      ["circle", { cx: 12, cy: 12, r: 10 }],
      ["line", { x1: 12, y1: 16, x2: 12, y2: 12 }],
      ["line", { x1: 12, y1: 8, x2: 12.01, y2: 8 }],
    ],
    mail: [
      [
        "path",
        {
          d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z",
        },
      ],
      ["polyline", { points: "22,6 12,13 2,6" }],
    ],
    "map-pin": [
      ["path", { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" }],
      ["circle", { cx: 12, cy: 10, r: 3 }],
    ],
    monitor: [
      ["rect", { x: 2, y: 3, width: 20, height: 14, rx: 2, ry: 2 }],
      ["line", { x1: 8, y1: 21, x2: 16, y2: 21 }],
      ["line", { x1: 12, y1: 17, x2: 12, y2: 21 }],
    ],
    moon: [["path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }]],
    pencil: [
      [
        "path",
        { d: "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" },
      ],
    ],
    plus: [
      ["line", { x1: 12, y1: 5, x2: 12, y2: 19 }],
      ["line", { x1: 5, y1: 12, x2: 19, y2: 12 }],
    ],
    "book-open": [
      ["path", { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" }],
      ["path", { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" }],
    ],
    "rotate-ccw": [
      ["polyline", { points: "1 4 1 10 7 10" }],
      ["path", { d: "M3.51 15a9 9 0 1 0 2.13-9.36L1 10" }],
    ],
    search: [
      ["circle", { cx: 11, cy: 11, r: 8 }],
      ["line", { x1: 21, y1: 21, x2: 16.65, y2: 16.65 }],
    ],
    send: [
      ["line", { x1: 22, y1: 2, x2: 11, y2: 13 }],
      ["polygon", { points: "22 2 15 22 11 13 2 9 22 2" }],
    ],
    smartphone: [
      ["rect", { x: 5, y: 2, width: 14, height: 20, rx: 2, ry: 2 }],
      ["line", { x1: 12, y1: 18, x2: 12.01, y2: 18 }],
    ],
    sparkles: [
      [
        "path",
        {
          d: "m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z",
        },
      ],
      ["path", { d: "M5 3v4" }],
      ["path", { d: "M19 17v4" }],
      ["path", { d: "M3 5h4" }],
      ["path", { d: "M17 19h4" }],
    ],
    sun: [
      ["circle", { cx: 12, cy: 12, r: 5 }],
      ["line", { x1: 12, y1: 1, x2: 12, y2: 3 }],
      ["line", { x1: 12, y1: 21, x2: 12, y2: 23 }],
      ["line", { x1: 4.22, y1: 4.22, x2: 5.64, y2: 5.64 }],
      ["line", { x1: 18.36, y1: 18.36, x2: 19.78, y2: 19.78 }],
      ["line", { x1: 1, y1: 12, x2: 3, y2: 12 }],
      ["line", { x1: 21, y1: 12, x2: 23, y2: 12 }],
      ["line", { x1: 4.22, y1: 19.78, x2: 5.64, y2: 18.36 }],
      ["line", { x1: 18.36, y1: 5.64, x2: 19.78, y2: 4.22 }],
    ],
    trash: [
      ["polyline", { points: "3 6 5 6 21 6" }],
      [
        "path",
        {
          d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
        },
      ],
    ],
    upload: [
      ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
      ["polyline", { points: "17 8 12 3 7 8" }],
      ["line", { x1: 12, y1: 3, x2: 12, y2: 15 }],
    ],
    user: [
      ["path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }],
      ["circle", { cx: 12, cy: 7, r: 4 }],
    ],
    x: [
      ["line", { x1: 18, y1: 6, x2: 6, y2: 18 }],
      ["line", { x1: 6, y1: 6, x2: 18, y2: 18 }],
    ],
  };

  let { name, size = 18, strokeWidth = 2, label = "" } = $props();

  const shapes = $derived(ICONS[name] ?? []);
</script>

<svg
  class="icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? "img" : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : "true"}
>
  {#each shapes as [tag, attributes] (tag + JSON.stringify(attributes))}
    <svelte:element this={tag} {...attributes} />
  {/each}
</svg>

<style>
  .icon {
    flex-shrink: 0;
    vertical-align: middle;
  }
</style>
