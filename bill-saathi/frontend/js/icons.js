/**
 * Bill Saathi AI - SVG Icons Dictionary & Icon Generator
 */
window.BillSaathi = window.BillSaathi || {};

(function () {
  const icons = {
    overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    cases: 'M3 7h6l2-3h4l2 3h4v13H3z',
    plus: 'M12 5v14 M5 12h14',
    upload: 'M12 16V3 M7 8l5-5 5 5 M4 16v5h16v-5',
    audit: 'M9 3H5v18h14V3h-4 M9 3v4h6V3z M8 12l2 2 5-5 M8 18h8',
    price: 'M20 12l-8 8L3 11V3h8z M7 7h.01',
    evidence: 'M3 5h7l2 3h9v12H3z M8 12h8 M8 16h5',
    complaint: 'M4 3h16v14H9l-5 4z M8 7h8 M8 11h6',
    affidavit: 'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6',
    reports: 'M5 3h10l4 4v14H5z M14 3v5h5 M8 17v-3 M12 17v-6 M16 17v-4',
    help: 'M9 9a3 3 0 1 1 4 3c-1 0-1 1-1 2 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 4-3 1-1 4H9l-1-4-3-1-2-4 2-5 3-1z',
    search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    bell: 'M18 8a6 6 0 0 0-12 0v7l-2 3h16l-2-3z M10 21h4',
    chevron: 'M9 5l7 7-7 7',
    left: 'M15 5l-7 7 7 7',
    check: 'M5 12l4 4L19 6',
    shield: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
    clock: 'M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    info: 'M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    warning: 'M12 3L2 21h20z M12 9v5 M12 17h.01',
    file: 'M5 3h9l5 5v13H5z M14 3v5h5 M8 12h8 M8 16h5',
    download: 'M12 3v13 M7 11l5 5 5-5 M4 17v4h16v-4',
    menu: 'M3 6h18 M3 12h18 M3 18h18',
    close: 'M5 5l14 14 M19 5L5 19',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    arrow: 'M4 12h16 M15 7l5 5-5 5',
    lock: 'M6 10h12v11H6z M8 10V6a4 4 0 0 1 8 0v4',
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
    heart: 'M12 21L3 12C-2 4 8 0 12 7c4-7 14-3 9 5z',
    edit: 'M14 5l5 5 M4 20l1-6L16 3l5 5-11 11z',
    trash: 'M3 6h18 M8 6V3h8v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
    logout: 'M9 4H4v16h5 M12 12h10 M18 8l4 4-4 4'
  };

  function icon(name, cls = '') {
    const pathData = icons[name] || icons.file;
    return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${pathData}"/></svg>`;
  }

  window.BillSaathi.Icons = {
    get: icon,
    dict: icons
  };
})();
