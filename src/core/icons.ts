const SVG_NS = 'http://www.w3.org/2000/svg';

function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
}

function rect(x: number, y: number, width: number, height: number, r: number): string {
  return `M${x + r} ${y}h${width - r * 2}a${r} ${r} 0 0 1 ${r} ${r}v${height - r * 2}a${r} ${r} 0 0 1 ${-r} ${r}h${-(width - r * 2)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(height - r * 2)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
}

const ICON_PATHS = {
  home: ['M3 11l9-7 9 7', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  clock: [circle(12, 12, 9), 'M12 7v5l3 2'],
  quote: ['M6 3h9l4 4v14H6z', 'M14 3v5h5', 'M9 13h7', 'M9 17h5'],
  lock: [rect(5, 11, 14, 10, 2), 'M8 11V8a4 4 0 0 1 8 0v3'],
  unlock: [rect(5, 11, 14, 10, 2), 'M8 11V8a4 4 0 0 1 7.5-2'],
  braces: ['M8 4H7a2 2 0 0 0-2 2v4l-2 2 2 2v4a2 2 0 0 0 2 2h1', 'M16 4h1a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2h-1'],
  settings: ['M4 7h10', 'M18 7h2', 'M4 17h4', 'M12 17h8', circle(16, 7, 2), circle(10, 17, 2)],
  sun: [circle(12, 12, 4), 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  moon: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  monitor: [rect(3, 4, 18, 12, 2), 'M8 20h8', 'M12 16v4'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  search: [circle(11, 11, 7), 'M20 20l-4-4'],
  plus: ['M12 5v14', 'M5 12h14'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13 7l4 4'],
  copy: [rect(9, 9, 12, 12, 2), 'M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4'],
  download: ['M12 4v12', 'M7 11l5 5 5-5', 'M5 20h14'],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M5 20h14'],
  play: ['M7 5v14l12-7z'],
  stop: [rect(6, 6, 12, 12, 2)],
  'chevron-left': ['M15 6l-6 6 6 6'],
  'chevron-right': ['M9 6l6 6-6 6'],
  refresh: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
  cloud: ['M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z'],
  'cloud-off': ['M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z', 'M3 3l18 18'],
  check: ['M5 12l5 5 9-10'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  printer: ['M7 8V3h10v5', rect(3, 8, 18, 9, 2), 'M7 14h10v7H7z'],
  users: [circle(9, 8, 3.5), 'M2.5 20a6.5 6.5 0 0 1 13 0', 'M16 4.5a3.5 3.5 0 0 1 0 7', 'M18 14a6.5 6.5 0 0 1 3.5 6'],
  folder: ['M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  swap: ['M4 8h14l-4-4', 'M20 16H6l4 4'],
  file: ['M6 3h9l4 4v14H6z', 'M14 3v5h5'],
  shield: ['M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z', 'M9 12l2 2 4-4'],
  user: [circle(12, 8, 4), 'M4 21a8 8 0 0 1 16 0'],
  'log-out': ['M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4', 'M15 16l4-4-4-4', 'M19 12H9'],
  book: ['M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5', 'M12 6.5C14 5 17 4.5 20 5v13c-3-.5-6 0-8 1.5', 'M12 6.5v13'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  list: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01'],
  'chevron-down': ['M6 9l6 6 6-6'],
  info: [circle(12, 12, 9), 'M12 11v5', 'M12 8h.01'],
  alert: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17h.01'],
  blade: ['M5 13.5L18.6 5.2c1.7-.9 2.8.8 1.4 1.9L12.4 13.5', rect(3, 13.5, 18, 6, 3), circle(6, 16.5, 1)],
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function icon(name: IconName, size = 18): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'icon');
  for (const d of ICON_PATHS[name]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}
