(function () {
  'use strict';

  const source = document.currentScript && document.currentScript.dataset.feedbackSource;
  const groupUrl = 'https://qm.qq.com/q/UpJl8ygqMs';
  const apiBase = window.MOZHE_FEEDBACK_API_BASE ||
    (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)
      ? 'http://127.0.0.1:8100/feedback/api/v1'
      : 'https://admin.mozhe.cc/feedback/api/v1');
  const storageKey = 'mozhe-feedback-receipts-v1';
  let overlay;
  let lastFocus;

  function copy() {
    const en = document.documentElement.lang.toLowerCase().startsWith('en');
    return en ? {
      title: 'Feedback', close: 'Close', lead: 'Choose how to contact us', qq: 'Join the QQ group',
      group: 'Mozhe community · Group 554520972', online: 'Send feedback online',
      type: 'Type', bug: 'Report a problem', suggestion: 'Suggestion', other: 'Other',
      content: 'Your feedback', placeholder: 'Tell us what happened or what you would like to see (5–2000 characters)',
      contact: 'Contact (optional)', contactHint: 'QQ or email, only if you would like a follow-up',
      send: 'Send feedback', sending: 'Sending…', mine: 'My feedback', lookup: 'Look up a receipt',
      id: 'Feedback ID', token: 'Lookup code', search: 'Check reply', noHistory: 'No feedback saved in this browser yet.',
      new: 'Received', in_progress: 'In progress', resolved: 'Resolved', reply: 'Reply',
      sent: 'Sent. Save this ID and lookup code to check replies on another device:',
      local: 'This browser also saves your receipt.', required: 'Please enter at least 5 characters.',
      error: 'Could not connect. Please try again later or join the QQ group.', invalid: 'Enter an ID and lookup code.',
      checking: 'Checking…', noReply: 'No reply yet.', page: 'Submitted from',
      you: 'You', admin: 'Admin', followup: 'Add a reply (2–2000 characters)',
      sendReply: 'Send reply', replySent: 'Reply sent.'
    } : {
      title: '建议反馈', close: '关闭', lead: '选择适合你的反馈方式', qq: '加入 QQ 群交流',
      group: '墨者网交流群 · 群号 554520972', online: '直接在线提交',
      type: '反馈类型', bug: '遇到问题', suggestion: '功能建议', other: '其他',
      content: '反馈内容', placeholder: '说说遇到的问题或你的想法（5～2000 字）',
      contact: '联系方式（选填）', contactHint: 'QQ 或邮箱；仅在需要进一步沟通时使用',
      send: '提交反馈', sending: '提交中…', mine: '我的反馈', lookup: '凭查询码查看',
      id: '反馈编号', token: '查询码', search: '查看回复', noHistory: '这个浏览器还没有保存的反馈。',
      new: '待处理', in_progress: '处理中', resolved: '已解决', reply: '管理员回复',
      sent: '提交成功。请保存编号和查询码，以便换设备查看回复：',
      local: '当前浏览器也已自动保存凭证。', required: '请至少填写 5 个字。',
      error: '暂时无法连接反馈服务，请稍后重试，或加入 QQ 群交流。', invalid: '请填写反馈编号和查询码。',
      checking: '查询中…', noReply: '暂时还没有回复。', page: '提交页面',
      you: '我', admin: '管理员', followup: '继续回复（2～2000 字）',
      sendReply: '发送回复', replySent: '回复已发送。'
    };
  }

  function readReceipts() {
    try {
      const entries = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(entries) ? entries.filter(item => item.source === source).slice(0, 20) : [];
    } catch (_) { return []; }
  }

  function saveReceipt(receipt) {
    try {
      const entries = [receipt, ...readReceipts().filter(item => item.id !== receipt.id)].slice(0, 20);
      localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch (_) { /* A private browser may disable storage; the receipt remains visible. */ }
  }

  function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function setMessage(text, bad) {
    const message = overlay.querySelector('.mozhe-feedback-message');
    message.textContent = text;
    message.dataset.error = bad ? 'true' : 'false';
  }

  function build() {
    const t = copy();
    overlay = node('div', 'mozhe-feedback-overlay');
    overlay.innerHTML = `
      <section class="mozhe-feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="mozhe-feedback-title">
        <header><div><small>MOZHE · FEEDBACK</small><h2 id="mozhe-feedback-title"></h2></div><button type="button" class="mozhe-feedback-close" aria-label=""></button></header>
        <p class="mozhe-feedback-lead"></p>
        <a class="mozhe-feedback-qq" target="_blank" rel="noopener noreferrer"><strong></strong><span></span><b aria-hidden="true">↗</b></a>
        <div class="mozhe-feedback-tabs"><button type="button" data-feedback-tab="send"></button><button type="button" data-feedback-tab="mine"></button></div>
        <form class="mozhe-feedback-form" data-feedback-panel="send">
          <label for="mozhe-feedback-kind"></label><select id="mozhe-feedback-kind" name="kind" required></select>
          <label for="mozhe-feedback-content"></label><textarea id="mozhe-feedback-content" name="content" maxlength="2000" minlength="5" rows="5" required></textarea>
          <label for="mozhe-feedback-contact"></label><input id="mozhe-feedback-contact" name="contact" maxlength="120" autocomplete="off"><small class="mozhe-feedback-hint"></small>
          <input class="mozhe-feedback-trap" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button type="submit" class="mozhe-feedback-submit"></button>
        </form>
        <div class="mozhe-feedback-history" data-feedback-panel="mine" hidden>
          <div class="mozhe-feedback-receipts"></div>
          <div class="mozhe-feedback-lookup"><strong></strong><input inputmode="numeric" name="id"><input name="token" autocapitalize="off" spellcheck="false"><button type="button"></button></div>
          <div class="mozhe-feedback-result" aria-live="polite"></div>
        </div>
        <p class="mozhe-feedback-message" role="status" aria-live="polite"></p>
      </section>`;
    document.body.appendChild(overlay);
    const dialog = overlay.querySelector('.mozhe-feedback-dialog');
    dialog.querySelector('h2').textContent = t.title;
    dialog.querySelector('.mozhe-feedback-close').textContent = '×';
    dialog.querySelector('.mozhe-feedback-close').ariaLabel = t.close;
    dialog.querySelector('.mozhe-feedback-lead').textContent = t.lead;
    const qq = dialog.querySelector('.mozhe-feedback-qq');
    qq.href = groupUrl;
    qq.querySelector('strong').textContent = t.qq;
    qq.querySelector('span').textContent = t.group;
    dialog.querySelector('[data-feedback-tab="send"]').textContent = t.online;
    dialog.querySelector('[data-feedback-tab="mine"]').textContent = t.mine;
    const form = dialog.querySelector('form');
    const labels = form.querySelectorAll('label');
    labels[0].textContent = t.type;
    labels[1].textContent = t.content;
    labels[2].textContent = t.contact;
    const select = form.querySelector('select');
    [['suggestion', t.suggestion], ['bug', t.bug], ['other', t.other]].forEach(([value, label]) => {
      const option = node('option', '', label); option.value = value; select.appendChild(option);
    });
    form.querySelector('textarea').placeholder = t.placeholder;
    form.querySelector('.mozhe-feedback-hint').textContent = t.contactHint;
    form.querySelector('.mozhe-feedback-submit').textContent = t.send;
    const lookup = dialog.querySelector('.mozhe-feedback-lookup');
    lookup.querySelector('strong').textContent = t.lookup;
    lookup.querySelector('[name="id"]').placeholder = t.id;
    lookup.querySelector('[name="id"]').ariaLabel = t.id;
    lookup.querySelector('[name="token"]').placeholder = t.token;
    lookup.querySelector('[name="token"]').ariaLabel = t.token;
    lookup.querySelector('button').textContent = t.search;
    dialog.querySelector('.mozhe-feedback-close').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    dialog.querySelectorAll('[data-feedback-tab]').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.feedbackTab)));
    form.addEventListener('submit', submit);
    lookup.querySelector('button').addEventListener('click', () => check(
      lookup.querySelector('[name="id"]').value.trim(), lookup.querySelector('[name="token"]').value.trim()
    ));
    switchTab('send');
  }

  function switchTab(tab) {
    overlay.querySelectorAll('[data-feedback-tab]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.feedbackTab === tab)));
    overlay.querySelectorAll('[data-feedback-panel]').forEach(panel => { panel.hidden = panel.dataset.feedbackPanel !== tab; });
    setMessage('', false);
    if (tab === 'mine') renderReceipts();
  }

  function renderReceipts() {
    const t = copy();
    const list = overlay.querySelector('.mozhe-feedback-receipts');
    list.replaceChildren();
    const entries = readReceipts();
    if (!entries.length) { list.appendChild(node('p', '', t.noHistory)); return; }
    entries.forEach(item => {
      const button = node('button', 'mozhe-feedback-receipt', `#${item.id} · ${item.date}`);
      button.type = 'button';
      button.addEventListener('click', () => check(item.id, item.token));
      list.appendChild(button);
    });
  }

  async function submit(event) {
    event.preventDefault();
    const t = copy();
    const form = event.currentTarget;
    const content = form.elements.content.value.trim();
    if (content.length < 5) { setMessage(t.required, true); return; }
    const button = form.querySelector('[type="submit"]');
    button.disabled = true; button.textContent = t.sending;
    try {
      const body = new URLSearchParams({source, kind: form.elements.kind.value, content,
        contact: form.elements.contact.value.trim(), page_url: location.href, website: form.elements.website.value});
      const response = await fetch(`${apiBase}/messages`, {method: 'POST', body});
      const result = await response.json();
      if (!response.ok || result.code !== 1) throw new Error(result.info || t.error);
      const receipt = {source, id: result.data.id, token: result.data.token, date: new Date().toLocaleDateString()};
      saveReceipt(receipt);
      form.reset();
      setMessage(`${t.sent} #${receipt.id} · ${receipt.token}\n${t.local}`, false);
    } catch (error) { setMessage(error.message || t.error, true); }
    finally { button.disabled = false; button.textContent = t.send; }
  }

  async function check(id, token) {
    const t = copy();
    if (!id || !token) { setMessage(t.invalid, true); return; }
    const resultNode = overlay.querySelector('.mozhe-feedback-result');
    resultNode.replaceChildren(node('p', '', t.checking));
    try {
      const response = await fetch(`${apiBase}/messages/status`, {method: 'POST', body: new URLSearchParams({id, token})});
      const result = await response.json();
      if (!response.ok || result.code !== 1) throw new Error(result.info || t.error);
      const item = result.data;
      if (item.source === source) {
        saveReceipt({source, id: item.id, token, date: new Date(item.create_at).toLocaleDateString()});
        renderReceipts();
      }
      resultNode.replaceChildren(
        node('strong', '', `#${item.id} · ${t[item.status] || item.status}`),
        node('p', '', item.content)
      );
      const replies = Array.isArray(item.replies) ? item.replies : [];
      if (replies.length) {
        replies.forEach(reply => {
          const entry = node('div', 'mozhe-feedback-thread-entry');
          entry.append(node('strong', '', `${reply.actor === 'admin' ? t.admin : t.you} · ${reply.create_at}`),
            node('p', '', reply.content));
          resultNode.appendChild(entry);
        });
      } else {
        resultNode.appendChild(node('small', '', `${t.reply} · ${item.public_reply || t.noReply}`));
      }
      const replyForm = node('form', 'mozhe-feedback-reply-form');
      const replyBox = node('textarea');
      replyBox.maxLength = 2000;
      replyBox.minLength = 2;
      replyBox.required = true;
      replyBox.rows = 3;
      replyBox.placeholder = t.followup;
      replyBox.ariaLabel = t.followup;
      const replyButton = node('button', '', t.sendReply);
      replyButton.type = 'submit';
      replyForm.append(replyBox, replyButton);
      replyForm.addEventListener('submit', async event => {
        event.preventDefault();
        const content = replyBox.value.trim();
        if (content.length < 2) return;
        replyButton.disabled = true;
        try {
          const response = await fetch(`${apiBase}/messages/reply`, {method: 'POST',
            body: new URLSearchParams({id, token, content})});
          const replyResult = await response.json();
          if (!response.ok || replyResult.code !== 1) throw new Error(replyResult.info || t.error);
          await check(id, token);
          setMessage(t.replySent, false);
        } catch (error) { setMessage(error.message || t.error, true); replyButton.disabled = false; }
      });
      resultNode.appendChild(replyForm);
    } catch (error) { resultNode.replaceChildren(node('p', '', error.message || t.error)); }
  }

  function open() {
    lastFocus = document.activeElement;
    if (overlay) overlay.remove();
    build();
    overlay.querySelector('.mozhe-feedback-close').focus();
    document.body.classList.add('mozhe-feedback-open');
  }

  function close() {
    if (overlay) { overlay.remove(); overlay = null; }
    document.body.classList.remove('mozhe-feedback-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-feedback-open]');
    if (trigger) { event.preventDefault(); open(); }
  }, true);
  document.addEventListener('keydown', event => { if (overlay && event.key === 'Escape') close(); });
  window.MozheFeedback = {open};
})();
