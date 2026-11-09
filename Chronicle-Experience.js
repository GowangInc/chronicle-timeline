(() => {
  const el = id => document.getElementById(id);
  const places = window.CHRONICLE_PLACES;
  const eventPlaces = window.CHRONICLE_EVENT_PLACES;
  const eventLight = window.CHRONICLE_EVENT_LIGHT;
  const byId = new Map(places.map(place => [place.id, place]));
  const byTitle = new Map(events.map((event, index) => [event.title, index]));
  const slider = el('map-time');
  let current = 0, playing = false, timer, selectedPlace = null;
  slider.max = events.length;
  el('map-event-total').textContent = events.length;

  function pause() {
    playing = false;
    clearTimeout(timer);
    el('map-play').textContent = '▶ Play';
    el('map-play').setAttribute('aria-pressed', 'false');
  }
  function schedule() {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(() => {
      if (current >= events.length - 1) { pause(); return; }
      showEvent(current + 1);
      if (current === events.length - 1) pause(); else schedule();
    }, Number(el('map-delay').value));
  }
  function showPlace(place) {
    selectedPlace = place?.id || null;
    el('place-number').textContent = place ? 'Place ' + String(places.indexOf(place) + 1).padStart(2, '0') : 'No mapped place';
    el('place-name').textContent = place ? place.name : 'Location not on this map';
    el('place-description').textContent = place ? place.description : 'The location of this event is not represented on this town map.';
    el('place-source').hidden = !place;
    if (place) { el('place-source').href = base + '#page=' + place.page; el('place-source').textContent = 'Class PDF p. ' + place.page + ' ↗'; }
    const list = el('place-events'); list.replaceChildren();
    if (place) place.events.forEach(title => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'map-event'; button.textContent = title + ' →';
      button.addEventListener('click', () => openTimeline(title)); list.append(button);
    });
    if (!place || !place.events.length) {const p = document.createElement('p'); p.textContent = place ? 'No timeline event is linked to this place.' : 'Choose a numbered place to explore it.'; list.append(p)}
    document.querySelectorAll('.map-pin').forEach(pin => pin.setAttribute('aria-pressed', String(pin.dataset.id === selectedPlace)));
  }
  function openTimeline(title) {
    const index = byTitle.get(title);
    if (index === undefined) return;
    pause(); search.value = ''; chapter.value = '';
    if (orderMode !== 'events') setOrder('events');
    selected = index; render();
    document.getElementById('explore').scrollIntoView({behavior: motionEnabled ? 'smooth' : 'instant'});
  }
  places.forEach((place, index) => {
    const pin = document.createElement('button'); pin.type = 'button'; pin.className = 'map-pin'; pin.dataset.id = place.id;
    pin.style.left = (place.x / 14) + '%'; pin.style.top = (place.y / 8.5) + '%';
    pin.setAttribute('aria-label', 'Place ' + (index + 1) + ': ' + place.name); pin.textContent = index + 1;
    pin.addEventListener('click', () => {pause(); showPlace(place)}); el('map-pins').append(pin);
    const item = document.createElement('button'); item.type = 'button'; item.textContent = (index + 1) + ' · ' + place.name;
    item.addEventListener('click', () => {pause(); showPlace(place)}); el('place-list-buttons').append(item);
  });
  function updateLight() {
    const setting = el('map-light').value;
    const light = setting === 'auto' ? (eventLight[events[current].title] || 'unknown') : setting;
    el('map-shade').dataset.light = light;
    const label = light === 'unknown' ? 'Time of day not stated for this event; the map is shown in neutral light.' : setting === 'auto' ? 'Illustrative light: ' + (light === 'dawn' ? 'dawn' : light === 'day' ? 'daytime' : 'night') + '.' : 'Lighting set to ' + (light === 'day' ? 'daylight' : 'night') + '.';
    el('map-light-status').textContent = label;
  }
  function showEvent(index) {
    current = Math.max(0, Math.min(events.length - 1, index));
    const event = events[current], ids = eventPlaces[event.title] || [];
    slider.value = current + 1;
    slider.setAttribute('aria-valuetext', 'Event ' + (current + 1) + ' of ' + events.length + ': ' + event.title + ', ' + event.when);
    el('map-event-number').textContent = current + 1;
    el('map-event-time').textContent = event.period + ' · ' + event.when;
    el('map-event-title').textContent = event.title;
    el('map-event-summary').textContent = event.text;
    el('map-event-location').textContent = ids.length ? 'On the map: ' + ids.map(id => byId.get(id).name).join(' · ') : 'This event has no location on this map.';
    el('map-prev-event').disabled = current === 0; el('map-next-event').disabled = current === events.length - 1;
    document.querySelectorAll('.map-pin').forEach(pin => pin.dataset.scene = String(ids.includes(pin.dataset.id)));
    showPlace(ids.length ? byId.get(ids[0]) : null);
    updateLight();
  }
  slider.addEventListener('input', () => {pause(); showEvent(Number(slider.value) - 1)});
  el('map-prev-event').addEventListener('click', () => {pause(); showEvent(current - 1)});
  el('map-next-event').addEventListener('click', () => {pause(); showEvent(current + 1)});
  el('map-play').addEventListener('click', () => {
    if (playing) {pause(); return}
    if (current === events.length - 1) showEvent(0);
    playing = true; el('map-play').textContent = '❚❚ Pause'; el('map-play').setAttribute('aria-pressed', 'true'); schedule();
  });
  el('map-delay').addEventListener('change', schedule);
  el('map-light').addEventListener('change', updateLight);
  el('map-open-event').addEventListener('click', () => openTimeline(events[current].title));
  document.addEventListener('visibilitychange', () => {if (document.hidden) pause()});
  showEvent(0);

  [
    ['Chapter 1 · The morning','The narrator announces Santiago’s death, recalls his morning, the bishop’s visit and the warnings, and follows Luisa as she tries to reach Plácida.',5,'Santiago wakes'],
    ['Chapter 2 · The wedding','The narrative moves back to Bayardo’s arrival, his courtship of Angela, the wedding, her return to her parents and her accusation.',12,'A stranger arrives'],
    ['Chapter 3 · The warnings','After the twins surrender, the narrative returns to their preparations, the people they tell and the attempts to stop them.',21,'The brothers prepare'],
    ['Chapter 4 · After the killing','The account turns to the autopsy, the family’s departure and the brothers’ futures, then follows Angela’s later life and letters to Bayardo.',30,'The autopsy'],
    ['Chapter 5 · The final approach','The narrator examines the investigation and returns to Santiago’s last movements, the attack and his walk home.',38,'Warnings in the square']
  ].forEach(([title, text, page, eventTitle]) => {
    const card = document.createElement('article'); card.className = 'witness-card';
    const heading = document.createElement('h3'), description = document.createElement('p'), link = document.createElement('a'), jump = document.createElement('button');
    heading.textContent = title; description.textContent = text; link.href = base + '#page=' + page; link.textContent = 'Class PDF p. ' + page + ' ↗';
    jump.type = 'button'; jump.className = 'map-event'; jump.textContent = 'Compare with the event timeline →'; jump.addEventListener('click', () => openTimeline(eventTitle));
    card.append(heading, description, link, document.createElement('br'), jump); el('story-chapters').append(card);
  });
  const comparisons = {
    weather: [
      {name:'Some witnesses',text:'Some remember a radiant morning with a sea breeze.',page:5},
      {name:'Other witnesses',text:'Most remember a low, cloudy sky; some recall drizzle when Santiago was attacked.',page:5},
      {name:'Victoria Guzmán',text:'Victoria says it did not rain that day or during the whole month.',page:7}
    ],
    warning: [
      {name:'Victoria Guzmán',text:'Victoria says she did not warn Santiago because she believed the threat was drunken talk.',page:8},
      {name:'Divina Flor',text:'After Victoria’s death, Divina says her mother stayed silent because she wanted Santiago killed. Divina says she was too frightened to act.',page:8}
    ],
    door: [
      {name:'Divina Flor',text:'Divina tells Plácida that Santiago has come inside and gone upstairs. Divina later describes seeing him dressed in white.',page:46},
      {name:'Plácida Linero',text:'Plácida says she saw the twins running toward the house and barred the door because she believed Santiago was already inside.',page:46}
    ]
  };
  function renderWitnesses() {
    const container = el('witness-cards'); container.replaceChildren();
    comparisons[el('witness-choice').value].forEach(witness => {
      const card = document.createElement('article'); card.className = 'witness-card';
      const name = document.createElement('h3'), text = document.createElement('p'), link = document.createElement('a');
      name.textContent = witness.name; text.textContent = witness.text; link.href = base + '#page=' + witness.page; link.textContent = 'Class PDF p. ' + witness.page + ' ↗';
      card.append(name, text, link); container.append(card);
    });
  }
  el('witness-choice').addEventListener('change', renderWitnesses); renderWitnesses();
})();
