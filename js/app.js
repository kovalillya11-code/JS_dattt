(function () {
  const STORAGE_KEY = 'timeTrackerPosts';

  const clockEl = document.getElementById('clock');
  const todayEl = document.getElementById('today');
  const form = document.getElementById('postForm');
  const nameInput = document.getElementById('postName');
  const networkSelect = document.getElementById('network');
  const timeInput = document.getElementById('postTime');
  const messageEl = document.getElementById('formMessage');
  const listEl = document.getElementById('postList');
  const countEl = document.getElementById('count');
  const emptyEl = document.getElementById('emptyText');

  let posts = loadPosts();

  // Збереження
  function loadPosts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function savePosts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatClock(date) {
    return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  function formatPublishTime(ms) {
    return new Date(ms).toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Повертає різницю між моментом публікації і поточним часом
  function getTimeDiff(publishMs) {
    const diff = publishMs - Date.now();
    const past = diff < 0;
    const totalSec = Math.floor(Math.abs(diff) / 1000);

    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    return {
      past: past,
      text: days + ' дн. ' + hours + ' год. ' + minutes + ' хв. ' + seconds + ' с'
    };
  }

  function getStatusText(publishMs) {
    const d = getTimeDiff(publishMs);
    if (d.past) {
      return 'Час публікації минув ' + d.text + ' тому';
    }
    return 'До публікації залишилось ' + d.text;
  }

  function createPostItem(post) {
    const li = document.createElement('li');
    li.className = 'post';

    const title = document.createElement('h3');
    title.textContent = post.title;

    const network = document.createElement('p');
    network.textContent = 'Мережа: ' + post.network;

    const date = document.createElement('p');
    date.textContent = 'Дата: ' + formatPublishTime(post.time);

    const status = document.createElement('p');
    status.className = 'status';
    status.dataset.time = String(post.time);
    status.textContent = getStatusText(post.time);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = post.id;
    deleteBtn.textContent = 'Видалити';

    li.append(title, network, date, status, deleteBtn);
    return li;
  }

  function renderList() {
    listEl.textContent = '';
    posts.forEach(post => listEl.appendChild(createPostItem(post)));

    countEl.textContent = posts.length + ' допис(ів)';
    emptyEl.style.display = posts.length ? 'none' : 'block';
  }

  // Оновлює лише текст 
  function updateStatuses() {
    const now = Date.now();
    document.querySelectorAll('.status').forEach(el => {
      const publishMs = Number(el.dataset.time);
      el.textContent = getStatusText(publishMs);
      el.classList.toggle('past', publishMs - now < 0);
    });
  }

  // Годинник 
  function updateClock() {
    const now = new Date();
    clockEl.textContent = formatClock(now);
    todayEl.textContent = now.toLocaleDateString('uk-UA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // Один таймер на все
  function tick() {
    updateClock();
    updateStatuses();
  }

  // Повідомлення форми
  function showMessage(text, isError) {
    messageEl.textContent = text;
    messageEl.classList.toggle('error', Boolean(isError));
  }

  // Додавання публікації
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = nameInput.value.trim();
    if (!title) {
      showMessage('Введіть назву допису.', true);
      return;
    }

    if (!timeInput.value) {
      showMessage('Оберіть дату і час публікації.', true);
      return;
    }

    const time = new Date(timeInput.value).getTime();
    if (Number.isNaN(time)) {
      showMessage('Некоректна дата або час.', true);
      return;
    }

    posts.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      title: title,
      network: networkSelect.value,
      time: time
    });

    posts.sort((a, b) => a.time - b.time);
    savePosts();
    renderList();
    tick();

    nameInput.value = '';
    timeInput.value = '';
    showMessage('Публікацію додано до контент-плану!', false);
  });

  // Видалення
  listEl.addEventListener('click', function (e) {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;

    posts = posts.filter(post => post.id !== btn.dataset.id);
    savePosts();
    renderList();
  });

  // Старт 
  renderList();
  tick();
  setInterval(tick, 1000);
})();