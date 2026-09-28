(() => {
  const views = {
    home: document.getElementById('homeView'),
    online: document.getElementById('onlineView'),
    offline: document.getElementById('offlineView')
  };

  function renderCurrentView() {
    const requested = window.location.hash.slice(1);
    const active = Object.prototype.hasOwnProperty.call(views, requested) ? requested : 'home';

    Object.entries(views).forEach(([name, element]) => {
      element.hidden = name !== active;
    });
    document.body.dataset.view = active;

    if (typeof t === 'function') {
      const titleKey = active === 'offline' ? 'site.offlineDocumentTitle' : 'site.documentTitle';
      document.title = t(titleKey);
    }
  }

  window.addEventListener('hashchange', () => {
    renderCurrentView();
    window.scrollTo(0, 0);
  });

  window.renderCurrentView = renderCurrentView;
  renderCurrentView();
})();
