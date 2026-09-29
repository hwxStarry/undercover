(() => {
  const localHost = ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';
  const apiRoot = window.UNDERCOVER_API_BASE || (localHost
    ? 'http://127.0.0.1:8100/undercover/api/v1'
    : location.hostname === 'undercover.mozhe.cc'
      ? 'https://admin.mozhe.cc/undercover/api/v1'
      : '/undercover/api/v1');
  const tokenKey = 'undercover-player-token:';
  const nicknameKey = 'undercover-nickname';
  const $ = (id) => document.getElementById(id);
  const invitedCode = new URL(location.href).searchParams.get('room')?.toUpperCase() || '';
  const currentRoomKey = invitedCode || localStorage.getItem('undercover-last-room') || '';
  let token = currentRoomKey ? (sessionStorage.getItem(tokenKey + currentRoomKey) || localStorage.getItem(tokenKey + currentRoomKey) || '') : '';
  let state = null;
  let busy = false;
  let polling = false;
  let notice = '';
  let publicRooms = [];
  let publicRoomsPolling = false;
  let nickname = (localStorage.getItem(nicknameKey) || '').trim();
  if (Array.from(nickname).length > 20) nickname = '';
  let editingNickname = false;

  function saveNickname(value) {
    nickname = value;
    localStorage.setItem(nicknameKey, value);
  }

  function requireNickname() {
    if (nickname) return nickname;
    editingNickname = true;
    render();
    $('onlineIdentityInput').focus();
    return '';
  }

  function renderIdentity() {
    const restoring = !state && !!token;
    const needsNickname = !nickname && !state;
    const showingPanel = editingNickname || (needsNickname && !restoring);
    $('onlineIdentityPanel').hidden = !showingPanel;
    $('onlineIdentityBadge').hidden = showingPanel || (!nickname && !state);
    $('onlineIdentityName').textContent = state?.self.nickname || nickname;
    $('onlineIdentityBadge').setAttribute('aria-label', t('online.editNickname'));
    $('onlineIdentityTitle').textContent = t(editingNickname ? 'online.editNickname' : 'online.chooseNickname');
    $('onlineIdentityIntro').textContent = t(editingNickname ? 'online.editNicknameIntro' : 'online.nicknameIntro');
    $('onlineIdentityCancel').hidden = !editingNickname || (!nickname && !state);
    return needsNickname || restoring || editingNickname;
  }

  function roomKey(room) {
    return room.visibility === 'public' ? `id:${room.room_id}` : room.room_code;
  }

  async function request(path, body, playerToken = token) {
    const headers = {'Api-Token': 'undercover-v1'};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (playerToken) headers['X-Player-Token'] = playerToken;
    const response = await fetch(`${apiRoot}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      credentials: 'omit',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok || result.code !== 1) throw new Error(result.info || t('online.requestFailed'));
    return result.data;
  }

  function setNotice(message) {
    notice = message;
    $('onlineNotice').textContent = message || t('site.onlineAvailability');
    $('onlineNotice').hidden = !!state && !message;
  }

  async function act(path, body) {
    if (busy) return;
    busy = true;
    try {
      state = await request(path, body);
      setNotice('');
      render();
    } catch (error) {
      setNotice(error.message || t('online.requestFailed'));
    } finally {
      busy = false;
    }
  }

  function enterRoom(payload) {
    token = payload.player_token;
    state = payload.state;
    saveNickname(state.self.nickname);
    editingNickname = false;
    const key = roomKey(state);
    sessionStorage.setItem(tokenKey + key, token);
    localStorage.setItem(tokenKey + key, token);
    localStorage.setItem('undercover-last-room', key);
    const url = new URL(location.href);
    if (state.visibility === 'private') url.searchParams.set('room', state.room_code);
    else url.searchParams.delete('room');
    history.replaceState(null, '', url);
    setNotice('');
    render();
  }

  function playerName(id) {
    return state.players.find((player) => player.id === id)?.nickname || '?';
  }

  function textElement(tag, text, className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function renderPublicRooms() {
    const list = $('publicRoomList');
    list.replaceChildren();
    if (!publicRooms.length) {
      list.append(textElement('p', t('online.noPublicRooms'), 'public-room-empty'));
      return;
    }
    for (const room of publicRooms) {
      const card = document.createElement('article');
      card.className = 'public-room-card';
      const details = document.createElement('div');
      details.append(textElement('h3', t('online.hostRoom', {0: room.host_nickname})));
      details.append(textElement('p', `${room.category || t('online.allCategories')} · ${t('online.plannedGames', {0: room.games_total})} · ${room.players_count}/${room.max_players}`));
      const button = textElement('button', t('online.joinPublicRoom'), 'btn btn-outline-light room-secondary');
      button.type = 'button';
      button.addEventListener('click', () => joinPublicRoom(room.room_id));
      card.append(details, button);
      list.append(card);
    }
  }

  async function refreshPublicRooms() {
    if (state || publicRoomsPolling) return;
    publicRoomsPolling = true;
    try {
      publicRooms = await request('/rooms/public', undefined, '');
      if (!state) renderPublicRooms();
    } catch (_) {
      if (!state) $('publicRoomList').replaceChildren(textElement('p', t('online.publicRoomsUnavailable'), 'public-room-empty'));
    } finally {
      publicRoomsPolling = false;
    }
  }

  async function joinPublicRoom(roomId) {
    const playerNickname = requireNickname();
    if (!playerNickname || busy) return;
    busy = true;
    try {
      enterRoom(await request('/rooms/join', {room_id: roomId, nickname: playerNickname}, ''));
    } catch (error) {
      setNotice(error.message || t('online.requestFailed'));
      refreshPublicRooms();
    } finally {
      busy = false;
    }
  }

  function renderPlayers() {
    const list = $('roomPlayers');
    list.replaceChildren();
    for (const player of state.players) {
      const item = document.createElement('li');
      item.append(textElement('span', `${player.seat}. ${player.nickname}`));
      const labels = [];
      if (player.is_host) labels.push(t('online.host'));
      if (player.eliminated) labels.push(t('online.eliminated'));
      else if (state.next_speaker_id === player.id) labels.push(t('online.speaking'));
      item.append(textElement('small', labels.join(' · ')));
      list.append(item);
    }
  }

  function renderDescriptions() {
    const list = $('descriptionList');
    list.replaceChildren();
    for (const entry of state.descriptions) {
      const row = document.createElement('p');
      row.append(textElement('strong', `${playerName(entry.player_id)}：`));
      row.append(textElement('span', entry.content));
      list.append(row);
    }
  }

  function renderVoteOptions() {
    const candidates = state.players.filter((player) => !player.eliminated && player.id !== state.self.id);
    const ballot = `${state.game_no}:${state.round_no}:${state.ballot_no}:${candidates.map((player) => player.id).join(',')}`;
    const select = $('voteTarget');
    if (select.dataset.ballot === ballot) return;
    select.replaceChildren(new Option(t('online.choosePlayer'), ''));
    for (const player of candidates) select.add(new Option(player.nickname, String(player.id)));
    select.dataset.ballot = ballot;
  }

  function renderReveal() {
    const panel = $('gameReveal');
    panel.hidden = state.status !== 'finished';
    panel.replaceChildren();
    if (!state.reveal) return;
    panel.append(textElement('h3', state.winner === 'civilians' ? t('online.civiliansWin') : t('online.undercoverWins')));
    panel.append(textElement('p', `${t('online.commonWord')}：${state.reveal.common_word}`));
    panel.append(textElement('p', `${t('online.undercoverWord')}：${state.reveal.undercover_word}`));
    panel.append(textElement('p', `${t('online.undercoverPlayer')}：${playerName(state.reveal.undercover_player_id)}`));
  }

  function renderHistory() {
    const history = $('gameHistory');
    const list = $('gameHistoryList');
    history.hidden = !state.game_results.length;
    list.replaceChildren();
    for (const game of state.game_results) {
      const winner = game.winner === 'civilians' ? t('online.civiliansWin') : t('online.undercoverWins');
      list.append(textElement('li', t('online.gameHistoryItem', {
        0: game.game_no, 1: winner, 2: playerName(game.undercover_player_id)
      })));
    }
  }

  function resultMessage() {
    const result = state.last_result;
    if (!result) return '';
    if (result.type === 'tie') return t('online.tie', {0: result.round_no});
    return t('online.playerEliminated', {0: result.nickname});
  }

  function render() {
    const identityRequired = renderIdentity();
    $('onlineNotice').hidden = !!state && !notice;
    $('onlineOptions').hidden = !!state || identityRequired;
    $('publicLobby').hidden = !!state || identityRequired;
    $('onlineRoom').hidden = !state;
    if (!state) {
      renderPublicRooms();
      return;
    }

    const isPublic = state.visibility === 'public';
    $('roomIdentityLabel').textContent = t(isPublic ? 'online.publicRoom' : 'site.roomCode');
    $('roomCode').textContent = isPublic ? '' : state.room_code;
    $('copyRoomLink').hidden = isPublic;
    $('roomPhase').textContent = t(`online.phase.${state.status}`);
    $('roomVisibility').textContent = t(isPublic ? 'online.publicShort' : 'online.privateShort');
    $('roomCategory').textContent = t('online.roomCategory', {0: state.category || t('online.allCategories')});
    $('roomGame').textContent = state.game_no
      ? t('online.gameProgress', {0: state.game_no, 1: state.games_total})
      : t('online.plannedGames', {0: state.games_total});
    $('roomRound').textContent = state.round_no ? t('online.round', {0: state.round_no}) : '';
    $('roomSeats').textContent = `${state.players.length} / ${state.max_players}`;
    $('roomMessage').textContent = resultMessage();
    $('yourWord').textContent = state.your_word || '?';
    $('yourWord').classList.toggle('revealed', !!state.your_word);
    renderPlayers();
    renderDescriptions();
    renderReveal();
    renderHistory();

    const hostCanStart = state.self.is_host && (state.status === 'lobby' ||
      (state.status === 'finished' && !state.series_complete));
    $('startGameButton').hidden = !hostCanStart;
    $('startGameButton').disabled = state.status === 'lobby' && state.players.length < 3;
    $('startGameButton').textContent = t(state.status === 'lobby' ? 'online.start' : 'online.nextGame');
    $('describeForm').hidden = state.status !== 'describing' || state.self.eliminated || state.next_speaker_id !== state.self.id;
    $('voteForm').hidden = state.status !== 'voting' || state.self.eliminated || state.self.has_voted;
    $('forgetRoomButton').hidden = !state.series_complete;

    if (state.status === 'lobby') {
      $('turnHint').textContent = state.self.is_host
        ? state.players.length >= 3 ? t('online.readyToStart') : t('online.hostWaiting', {0: 3 - state.players.length})
        : t('online.guestWaiting');
    } else if (state.status === 'describing') {
      $('turnHint').textContent = state.self.eliminated ? t('online.spectating')
        : state.next_speaker_id === state.self.id ? t('online.yourTurn')
        : t('online.waitSpeaker', {0: playerName(state.next_speaker_id)});
    } else if (state.status === 'voting') {
      renderVoteOptions();
      $('turnHint').textContent = state.self.eliminated ? t('online.spectating')
        : state.self.has_voted ? t('online.waitVotes', {0: state.votes_received, 1: state.votes_required})
        : t('online.voteNow');
    } else {
      $('turnHint').textContent = state.series_complete
        ? t('online.seriesComplete', {0: state.games_total})
        : t(state.self.is_host ? 'online.nextGameReady' : 'online.nextGameWaiting');
    }
  }

  async function refresh() {
    if (!token || polling || busy) return;
    polling = true;
    const requestedToken = token;
    try {
      const latest = await request('/rooms/state', undefined, requestedToken);
      if (token !== requestedToken) return;
      state = latest;
      if (nickname !== latest.self.nickname) saveNickname(latest.self.nickname);
      render();
    } catch (error) {
      if (token !== requestedToken) return;
      if (/凭证无效|已过期|房间不存在/.test(error.message)) {
        const key = state ? roomKey(state) : currentRoomKey;
        sessionStorage.removeItem(tokenKey + key);
        localStorage.removeItem(tokenKey + key);
        if (localStorage.getItem('undercover-last-room') === key) {
          localStorage.removeItem('undercover-last-room');
        }
        token = '';
        state = null;
        render();
        refreshPublicRooms();
      }
      setNotice(error.message || t('online.requestFailed'));
    } finally {
      polling = false;
    }
  }

  $('createRoomForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const playerNickname = requireNickname();
    if (!playerNickname) return;
    if (busy) return;
    busy = true;
    try {
      const payload = await request('/rooms', {
        nickname: playerNickname,
        max_players: Number($('createMaxPlayers').value),
        category: $('createCategory').value,
        games_total: Number($('createGamesTotal').value),
        visibility: $('createVisibility').value
      }, '');
      enterRoom(payload);
    } catch (error) {
      setNotice(error.message || t('online.requestFailed'));
    } finally {
      busy = false;
    }
  });

  $('joinRoomForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const playerNickname = requireNickname();
    if (!playerNickname) return;
    if (busy) return;
    busy = true;
    try {
      const payload = await request('/rooms/join', {
        room_code: $('joinRoomCode').value.toUpperCase().trim(),
        nickname: playerNickname
      }, '');
      enterRoom(payload);
    } catch (error) {
      setNotice(error.message || t('online.requestFailed'));
    } finally {
      busy = false;
    }
  });

  $('startGameButton').addEventListener('click', () => act('/rooms/start', {}));
  $('onlineIdentityBadge').addEventListener('click', () => {
    editingNickname = true;
    $('onlineIdentityInput').value = state?.self.nickname || nickname;
    render();
    $('onlineIdentityInput').focus();
    $('onlineIdentityInput').select();
  });
  $('onlineIdentityCancel').addEventListener('click', () => {
    editingNickname = false;
    render();
  });
  $('onlineIdentityRandom').addEventListener('click', () => {
    const input = $('onlineIdentityInput');
    input.value = window.generateGameNickname(document.documentElement.lang, input.value.trim());
    input.setCustomValidity('');
    input.focus();
  });
  $('onlineIdentityInput').addEventListener('input', () => $('onlineIdentityInput').setCustomValidity(''));
  $('onlineIdentityForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = $('onlineIdentityInput');
    const value = input.value.trim();
    if (!value || Array.from(value).length > 20) {
      input.setCustomValidity(t('online.nicknameLength'));
      input.reportValidity();
      return;
    }
    if (busy) return;
    if (state && value !== state.self.nickname) {
      busy = true;
      try {
        state = await request('/rooms/nickname', {nickname: value});
      } catch (error) {
        input.setCustomValidity(error.message || t('online.requestFailed'));
        input.reportValidity();
        return;
      } finally {
        busy = false;
      }
    }
    saveNickname(value);
    editingNickname = false;
    input.value = '';
    setNotice('');
    render();
  });
  $('describeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await act('/rooms/describe', {content: $('descriptionInput').value.trim()});
    if (!notice) $('descriptionInput').value = '';
  });
  $('voteForm').addEventListener('submit', (event) => {
    event.preventDefault();
    act('/rooms/vote', {target_player_id: Number($('voteTarget').value)});
  });
  $('copyRoomLink').addEventListener('click', async () => {
    if (state.visibility !== 'private') return;
    const url = new URL(location.href);
    url.searchParams.delete('preview');
    url.searchParams.set('room', state.room_code);
    url.hash = '#online';
    try {
      await navigator.clipboard.writeText(url.toString());
      setNotice(t('online.linkCopied'));
    } catch (_) {
      setNotice(url.toString());
    }
  });
  $('forgetRoomButton').addEventListener('click', () => {
    const key = roomKey(state);
    sessionStorage.removeItem(tokenKey + key);
    localStorage.removeItem(tokenKey + key);
    localStorage.removeItem('undercover-last-room');
    token = '';
    state = null;
    const url = new URL(location.href);
    url.searchParams.delete('room');
    history.replaceState(null, '', url);
    setNotice('');
    render();
    refreshPublicRooms();
  });

  if (invitedCode) $('joinRoomCode').value = invitedCode.toUpperCase();
  render();
  request('/categories', undefined, '').then((categories) => {
    for (const category of categories) {
      $('createCategory').add(new Option(`${category.category} (${category.total})`, category.category));
    }
  }).catch(() => {});
  if (token) refresh();
  refreshPublicRooms();
  setInterval(() => {
    if (document.body.dataset.view === 'online') refresh();
  }, 2500);
  setInterval(() => {
    if (document.body.dataset.view === 'online') refreshPublicRooms();
  }, 5000);
  window.renderOnlineRoom = render;
  document.addEventListener('DOMContentLoaded', render);
})();
