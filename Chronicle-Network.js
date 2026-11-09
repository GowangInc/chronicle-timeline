(() => {
  const el = id => document.getElementById(id);
  const cast = window.CHRONICLE_CAST;
  const normalise = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const names = new Map();
  cast.forEach(person => [person.name, ...(person.aliases || [])].forEach(name => names.set(normalise(name), person)));
  const relations = window.CHRONICLE_RELATIONSHIPS.map(edge => ({...edge, source: names.get(normalise(edge.from)), target: names.get(normalise(edge.to))}));
  const source = 'class-text.html#page=';
  const svg = el('network');
  const ns = 'http://www.w3.org/2000/svg';
  const make = (tag, attributes = {}, text) => {
    const node = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  };
  let person = names.get(normalise('Santiago Nasar'));
  let focusedName = person.name;
  let zoom = 1;
  const groups = [...new Set(cast.map(p => p.group))];
  groups.forEach(group => {
    const option = document.createElement('option'); option.value = group; option.textContent = group; el('cast-group').append(option);
  });
  function renderCast() {
    const query = normalise(el('cast-search').value);
    const group = el('cast-group').value;
    const visible = cast.filter(p => (!group || p.group === group) && (!query || normalise([p.name, p.role, ...(p.aliases || [])].join(' ')).includes(query)));
    el('cast-list').replaceChildren();
    el('cast-count').textContent = visible.length + ' of ' + cast.length + ' entries';
    if (!visible.length) {
      const empty = document.createElement('p'); empty.textContent = 'No characters match. Try another name or group.'; el('cast-list').append(empty);
    }
    visible.forEach(p => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'cast-card';
      button.dataset.name = p.name;
      button.setAttribute('aria-pressed', String(p.name === person.name));
      const name = document.createElement('strong'); name.textContent = p.name;
      const groupLabel = document.createElement('span'); groupLabel.textContent = p.group;
      button.append(name, groupLabel); button.addEventListener('click', () => selectPerson(p)); el('cast-list').append(button);
    });
  }
  function selectPerson(p, center = true) {
    const active = document.activeElement;
    const restoreCast = active?.classList.contains('cast-card');
    const restoreMap = active?.closest('.network-node');
    const restoreConnection = el('connection-list').contains(active);
    person = p; focusedName = p.name;
    el('person-group').textContent = p.group; el('person-name').textContent = p.name; el('person-role').textContent = p.role;
    el('person-source').href = source + p.page; el('person-source').textContent = 'Class PDF p. ' + p.page + ' ↗';
    el('connection-list').replaceChildren();
    const connected = relations.filter(r => r.source.name === p.name || r.target.name === p.name);
    connected.forEach(r => {
      const other = r.source.name === p.name ? r.target : r.source;
      const li = document.createElement('li'), button = document.createElement('button'), label = document.createElement('span'), link = document.createElement('a');
      button.type = 'button'; button.textContent = other.name; button.addEventListener('click', () => selectPerson(other));
      label.className = 'connection-label'; label.textContent = r.label;
      link.href = source + r.page; link.textContent = 'PDF p. ' + r.page; link.setAttribute('aria-label', 'Source for ' + r.label + ': PDF page ' + r.page);
      li.append(button, label, link); el('connection-list').append(li);
    });
    if (!connected.length) {
      const li = document.createElement('li'); li.textContent = p.kind === 'reference' ? 'A passing reference, rather than a member of the town’s community.' : 'See the role above for this character’s part in the story.'; el('connection-list').append(li);
    }
    renderCast(); renderNetwork();
    if (restoreCast) [...el('cast-list').children].find(button => button.dataset.name === p.name)?.focus({preventScroll: true});
    if (restoreMap) [...svg.querySelectorAll('.network-node')].find(node => node.getAttribute('aria-label') === 'Select ' + p.name)?.focus({preventScroll: true});
    if (restoreConnection) {el('person-name').tabIndex = -1; el('person-name').focus({preventScroll: true})}
    if (center && displayPositions.has(p.name)) {
      const position = displayPositions.get(p.name), wrap = el('network-wrap');
      wrap.scrollTo({left: Math.max(0, (position.x + 90) * zoom - wrap.clientWidth / 2), top: Math.max(0, (position.y + 25) * zoom - wrap.clientHeight / 2), behavior: 'instant'});
    }
  }
  const graphCast = cast.filter(p => p.kind !== 'reference');
  const graphGroups = [...new Set(graphCast.map(p => p.group))];
  const coordinates = new Map(), groupBoxes = [];
  const width = 1280;
  let rowTop = 28;
  for (let start = 0; start < graphGroups.length; start += 3) {
    let rowHeight = 0;
    graphGroups.slice(start, start + 3).forEach((group, col) => {
      const members = graphCast.filter(p => p.group === group);
      const x = 25 + col * 420, height = 78 + Math.ceil(members.length / 2) * 72;
      groupBoxes.push({group, x, y: rowTop, height}); rowHeight = Math.max(rowHeight, height);
      members.forEach((p, index) => coordinates.set(p.name, {x: x + 18 + index % 2 * 185, y: rowTop + 58 + Math.floor(index / 2) * 72}));
    });
    rowTop += rowHeight + 35;
  }
  const height = rowTop;
  let displayPositions = coordinates;
  const colors = {family: '#dfbe80', marriage: '#f29c86', social: '#92c6ba', events: '#b4b7e1'};
  const category = type => type === 'family' || type === 'marriage' ? type : ['friendship', 'work', 'romance'].includes(type) ? 'social' : 'events';
  function allowed(edge) {
    const type = el('relationship-type').value;
    return type === 'all' || (type === 'family' ? ['family', 'marriage'].includes(edge.type) : category(edge.type) === type);
  }
  function renderNetwork() {
    const relevant = relations.filter(r => coordinates.has(r.source.name) && coordinates.has(r.target.name) && allowed(r) && (!focusedName || r.source.name === focusedName || r.target.name === focusedName));
    const connectedNames = new Set(focusedName ? [focusedName] : graphCast.map(p => p.name));
    relevant.forEach(r => {connectedNames.add(r.source.name); connectedNames.add(r.target.name)});
    const shown = graphCast.filter(p => connectedNames.has(p.name));
    let viewHeight = height;
    displayPositions = coordinates;
    if (focusedName) {
      const others = shown.filter(p => p.name !== focusedName);
      viewHeight = Math.max(340, Math.ceil(others.length / 2) * 92 + 110);
      displayPositions = new Map([[focusedName, {x: 555, y: viewHeight / 2 - 24}]]);
      others.forEach((p, i) => displayPositions.set(p.name, {x: i % 2 ? 1070 : 40, y: 65 + Math.floor(i / 2) * 92}));
    }
    svg.replaceChildren(); svg.setAttribute('viewBox', `0 0 ${width} ${viewHeight}`); svg.setAttribute('width', width * zoom); svg.setAttribute('height', viewHeight * zoom);
    svg.append(make('title', {}, focusedName ? 'Connections around ' + focusedName : 'Family connections across the cast'));
    if (!focusedName) groupBoxes.forEach(box => {
      svg.append(make('rect', {x: box.x, y: box.y, width: 397, height: box.height, rx: 4, class: 'network-group'}));
      svg.append(make('text', {x: box.x + 18, y: box.y + 30, class: 'network-group-title'}, box.group));
    });
    relevant.forEach((r, index) => {
      const a = displayPositions.get(r.source.name), b = displayPositions.get(r.target.name);
      let x1 = a.x + 85, y1 = a.y + 24, x2 = b.x + 85, y2 = b.y + 24, curve;
      if (focusedName) {
        const other = r.source.name === focusedName ? b : a, center = displayPositions.get(focusedName);
        const left = other.x < center.x;
        x1 = other.x + (left ? 170 : 0); y1 = other.y + 24; x2 = center.x + (left ? 0 : 170); y2 = center.y + 24;
        const mid = (x1 + x2) / 2;
        curve = `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
      } else {
        const bend = Math.max(45, Math.abs(x2 - x1) * .25) + index % 4 * 15;
        curve = `M${x1},${y1} C${x1},${y1 + bend} ${x2},${y2 - bend} ${x2},${y2}`;
      }
      svg.append(make('path', {d: curve, stroke: colors[category(r.type)], class: 'network-edge', 'data-focus': String(!!focusedName), 'aria-hidden': 'true'}));
    });
    shown.forEach(p => {
      const pos = displayPositions.get(p.name), link = make('a', {href: '#person-detail', class: 'network-node', 'data-active': String(p.name === focusedName), 'aria-label': 'Select ' + p.name});
      link.append(make('rect', {x: pos.x, y: pos.y, width: 170, height: 48, rx: 3}));
      const words = p.name.split(' '), lines = [''];
      words.forEach(word => {const last = lines.length - 1; if ((lines[last] + ' ' + word).trim().length > 22 && lines[last]) lines.push(word); else lines[last] = (lines[last] + ' ' + word).trim()});
      const text = make('text', {x: pos.x + 10, y: pos.y + (lines.length === 1 ? 29 : 20)});
      lines.forEach((line, index) => text.append(make('tspan', {x: pos.x + 10, dy: index ? 14 : 0}, line)));
      link.append(text); link.addEventListener('click', event => {
        event.preventDefault();
        selectPerson(p, false);
        el('popup-group').textContent = p.group;
        el('popup-name').textContent = p.name;
        el('popup-role').textContent = p.role;
        el('popup-source').href = source + p.page;
        el('popup-source').textContent = 'Class PDF p. ' + p.page + ' ↗';
        el('character-popup').showModal();
      }); svg.append(link);
    });
    if (focusedName) relevant.forEach(r => {
      const other = displayPositions.get(r.source.name === focusedName ? r.target.name : r.source.name);
      const x = other.x < 555 ? 375 : 905, y = other.y + 14;
      const text = make('text', {x, y, 'text-anchor': 'middle', class: 'edge-label', 'aria-hidden': 'true'});
      const lines = [''];
      r.label.split(' ').forEach(word => {const last = lines.length - 1;if ((lines[last] + ' ' + word).trim().length > 34 && lines[last]) lines.push(word);else lines[last] = (lines[last] + ' ' + word).trim()});
      lines.forEach((line, i) => text.append(make('tspan', {x, dy: i ? 14 : 0}, line))); svg.append(text);
    });
    el('map-caption').textContent = (focusedName ? 'Connections: ' + focusedName : 'Family network') + ' · ' + relevant.length + ' links · ' + Math.round(zoom * 100) + '%';
  }
  el('cast-search').addEventListener('input', renderCast); el('cast-group').addEventListener('change', renderCast);
  el('relationship-type').addEventListener('change', renderNetwork);
  el('family-map').addEventListener('click', () => {focusedName = null; el('relationship-type').value = 'family'; renderNetwork();el('network-wrap').scrollTo({left:0,top:0,behavior:'instant'})});
  function resizeMap(value) {zoom = Math.min(1.75, Math.max(.6, value)); renderNetwork()}
  el('map-minus').addEventListener('click', () => resizeMap(zoom - .2)); el('map-plus').addEventListener('click', () => resizeMap(zoom + .2)); el('map-reset').addEventListener('click', () => resizeMap(1));
  selectPerson(person);
})();
