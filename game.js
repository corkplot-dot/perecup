// ============ GAME STATE & INITIALIZATION ============

const gameState = {
  balance: 5000,
  city: 'Москва',
  inventory: [],
  listings: [],
  userListings: [],
  achievements: [],
  theme: localStorage.getItem('theme') || 'classic',
  playerName: localStorage.getItem('playerName') || 'Игрок',
  cards: [],
  activeCard: null,
};

const CITIES = ['Москва', 'СПб', 'Казань', 'Екатеринбург', 'Новосибирск'];
const PLACES = {
  'Москва': [
    { name: 'Парк Горького', desc: 'у центрального входа', dist: '1.2 км', eta: '15 мин', emoji: '🌳', x: 0.3, y: 0.3 },
    { name: 'ВДНХ', desc: 'у фонтана', dist: '3.5 км', eta: '25 мин', emoji: '⛲', x: 0.5, y: 0.2 },
    { name: 'Красная площадь', desc: 'у памятника', dist: '2.1 км', eta: '20 мин', emoji: '🏛', x: 0.4, y: 0.4 },
  ],
  'СПб': [
    { name: 'Дворцовая площадь', desc: 'у Эрмитажа', dist: '0.8 км', eta: '10 мин', emoji: '🏰', x: 0.5, y: 0.5 },
    { name: 'Петропавловская крепость', desc: 'у входа', dist: '2.2 км', eta: '18 мин', emoji: '🛡', x: 0.6, y: 0.3 },
  ],
  'Казань': [
    { name: 'Казанский Кремль', desc: 'главный вход', dist: '1.5 км', eta: '12 мин', emoji: '🏰', x: 0.5, y: 0.5 },
  ],
  'Екатеринбург': [
    { name: 'Исторический сквер', desc: 'центр', dist: '2 км', eta: '16 мин', emoji: '🏛', x: 0.5, y: 0.5 },
  ],
  'Новосибирск': [
    { name: 'Площадь Ленина', desc: 'у театра', dist: '1.8 км', eta: '14 мин', emoji: '🎭', x: 0.5, y: 0.5 },
  ],
};

// ============ SAVE/LOAD SYSTEM ============

function saveGame() {
  const saveData = {
    balance: gameState.balance,
    city: gameState.city,
    inventory: gameState.inventory,
    listings: gameState.listings,
    userListings: gameState.userListings,
    achievements: gameState.achievements,
    playerName: gameState.playerName,
    cards: gameState.cards,
    activeCard: gameState.activeCard,
  };
  localStorage.setItem('perecupSave', JSON.stringify(saveData));
}

function loadGame() {
  const save = localStorage.getItem('perecupSave');
  if (save) {
    const data = JSON.parse(save);
    Object.assign(gameState, data);
  }
}

function resetGame() {
  if (confirm('Вы уверены? Все данные будут удалены и игра вернется к начальному состоянию.')) {
    localStorage.removeItem('perecupSave');
    gameState.balance = 5000;
    gameState.city = 'Москва';
    gameState.inventory = [];
    gameState.listings = [];
    gameState.userListings = [];
    gameState.achievements = [];
    gameState.cards = [];
    gameState.activeCard = null;
    location.reload();
  }
}

// ============ ITEM SYSTEM ============

const ITEM_TYPES = {
  phone: { label: 'Смартфон', emoji: '📱', hasOriginal: true, hasState: true },
  charger: { label: 'Зарядка', emoji: '🔌', hasOriginal: true, hasState: true },
  headphones: { label: 'Наушники', emoji: '🎧', hasOriginal: true, hasState: true },
  car: { label: 'Авто', emoji: '🚗', hasOriginal: false, hasState: true },
  clothes: { label: 'Одежда', emoji: '👕', hasOriginal: false, hasState: true },
};

const CONDITIONS = ['Идеальное', 'Хорошее', 'Нормальное', 'Плохое'];
const DEFECTS = [
  'Трещина на экране',
  'Батарея не держит',
  'Не работает камера',
  'Сломана кнопка',
  'Скрученный пробег',
  'Обслужена после ремонта',
  'Восстановленный',
];

function generateItem(type, isReplica = false, condition = null) {
  const id = Math.random().toString(36).substr(2, 9);
  const cond = condition || CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
  
  let price = 1000;
  if (type === 'phone') price = isReplica ? 2000 : 5000;
  else if (type === 'charger') price = isReplica ? 150 : 400;
  else if (type === 'headphones') price = isReplica ? 500 : 2000;
  else if (type === 'car') price = 50000;
  else if (type === 'clothes') price = 800;
  
  // 70% chance of hidden defect
  let hiddenDefect = null;
  if (Math.random() < 0.7) {
    hiddenDefect = DEFECTS[Math.floor(Math.random() * DEFECTS.length)];
  }

  return {
    id,
    type,
    name: `${ITEM_TYPES[type].label}${isReplica ? ' (реплика)' : ''}`,
    emoji: ITEM_TYPES[type].emoji,
    price,
    condition: cond,
    isReplica,
    hiddenDefect,
    visible: false,
    sellerId: null,
  };
}

// ============ MARKETPLACE LOGIC ============

function generateListings() {
  gameState.listings = [];
  
  for (let i = 0; i < 5; i++) {
    gameState.listings.push(generateItem('phone', Math.random() < 0.4, CONDITIONS[Math.floor(Math.random() * 3)]));
  }
  
  for (let i = 0; i < 4; i++) {
    gameState.listings.push(generateItem('charger', Math.random() < 0.3));
  }
  
  for (let i = 0; i < 4; i++) {
    gameState.listings.push(generateItem('headphones', Math.random() < 0.5));
  }
  
  for (let i = 0; i < 3; i++) {
    gameState.listings.push(generateItem('car'));
  }
  
  for (let i = 0; i < 6; i++) {
    gameState.listings.push(generateItem('clothes', Math.random() < 0.6));
  }
}

function buyItem(itemId, checkResult = null) {
  const item = gameState.listings.find(i => i.id === itemId);
  if (!item || gameState.balance < item.price) return false;
  
  gameState.balance -= item.price;
  const inventoryItem = { ...item, ownedSince: Date.now() };
  
  if (checkResult && checkResult.hasIssues) {
    // Discount logic would be here
  }
  
  gameState.inventory.push(inventoryItem);
  gameState.listings = gameState.listings.filter(i => i.id !== itemId);
  saveGame();
  updateBalance();
  displayListings();
  displayInventory();
  return true;
}

// ============ INSPECTION SYSTEM ============

function inspectItem(item, type) {
  let discovered = false;
  let result = { type, discovered, message: '' };
  
  const chanceToDiscover = 0.5;
  
  if (type === 'authenticity' && ITEM_TYPES[item.type]?.hasOriginal) {
    if (item.isReplica && Math.random() < chanceToDiscover) {
      discovered = true;
      result.message = '🚨 Обнаружена подделка!';
    } else {
      result.message = item.isReplica ? '✓ Похоже на оригинал' : '✓ Оригинал подтвержден';
    }
  } else if (type === 'condition') {
    if (item.hiddenDefect && Math.random() < chanceToDiscover) {
      discovered = true;
      result.message = `⚠️ Найден дефект: ${item.hiddenDefect}`;
    } else {
      result.message = `✓ Состояние: ${item.condition}`;
    }
  }
  
  result.discovered = discovered;
  result.hasIssues = discovered;
  return result;
}

// ============ REPAIR SYSTEM ============

function canRepair(item) {
  if (item.isReplica && !item.name.includes('реплика')) return false;
  return item.hiddenDefect && item.hiddenDefect !== 'Восстановленный';
}

function repairItem(itemId) {
  const item = gameState.inventory.find(i => i.id === itemId);
  if (!item || !canRepair(item)) return false;
  
  const repairCost = Math.floor(item.price * 0.3);
  if (gameState.balance < repairCost) return false;
  
  gameState.balance -= repairCost;
  item.hiddenDefect = null;
  item.condition = 'Хорошее';
  saveGame();
  updateBalance();
  displayInventory();
  alert('✅ Товар отремонтирован!');
  return true;
}

// ============ SELLER LISTING ============

function createListing(item, customSpecs = {}) {
  const listing = { ...item };
  
  if (customSpecs.condition) {
    listing.condition = customSpecs.condition;
  }
  if (customSpecs.isReplica !== undefined) {
    listing.isReplica = customSpecs.isReplica;
  }
  
  listing.isLyingAboutOrigin = item.isReplica && !customSpecs.isReplica;
  
  listing.sellerId = gameState.playerName;
  gameState.userListings.push(listing);
  saveGame();
  return listing;
}

// ============ DELIVERY SYSTEM ============

function scheduleDelivery(item, seller, method) {
  if (method === 'delivery') {
    return {
      status: 'delivering',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      address: 'ул. Примера, д. 1',
    };
  } else {
    return {
      status: 'scheduled',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      time: '14:00',
      place: PLACES[gameState.city][0],
    };
  }
}

// ============ TRADING NEGOTIATION ============

function negotiatePrice(item, offerPrice) {
  const sellerMin = Math.floor(item.price * 0.7);
  const sellerMax = item.price;
  
  if (offerPrice >= sellerMin && offerPrice <= sellerMax) {
    return { accepted: true, finalPrice: offerPrice };
  } else if (offerPrice < sellerMin) {
    return { accepted: false, counterOffer: Math.floor((offerPrice + sellerMin) / 2) };
  } else {
    return { accepted: true, finalPrice: sellerMax };
  }
}

// ============ BUYER INSPECTION ============

function buyerInspectsItem(item) {
  const chanceToFind = 0.8;
  let foundIssues = [];
  
  if (item.isLyingAboutOrigin && Math.random() < chanceToFind) {
    foundIssues.push({ type: 'origin', message: 'Это реплика, не оригинал!' });
  }
  
  if (item.hiddenDefect && Math.random() < chanceToFind) {
    foundIssues.push({ type: 'defect', message: `Дефект: ${item.hiddenDefect}` });
  }
  
  return {
    inspected: true,
    foundIssues,
    hasProblems: foundIssues.length > 0,
  };
}

// ============ ROBBERY SYSTEM ============

function handleRobbery() {
  const robAmount = Math.floor(gameState.balance * (0.15 + Math.random() * 0.25));
  gameState.balance -= robAmount;
  saveGame();
  return robAmount;
}

// ============ CARD SYSTEM ============

function createCard(design, name) {
  const card = {
    id: Math.random().toString(36).substr(2, 9),
    design,
    name,
    number: Math.floor(Math.random() * 10000000000000000),
    balance: 0,
  };
  gameState.cards.push(card);
  gameState.activeCard = card.id;
  saveGame();
  return card;
}

function getCardBalance() {
  if (!gameState.activeCard) return 0;
  const card = gameState.cards.find(c => c.id === gameState.activeCard);
  return card ? card.balance : 0;
}

// ============ UI HANDLERS ============

function goToLock() {
  document.querySelector('.lock-screen').classList.remove('hidden');
  document.querySelector('.home-screen').classList.remove('active');
}

function openApp(appName) {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
  const overlay = document.querySelector(`.overlay-${appName}`);
  if (overlay) {
    overlay.classList.add('active');
    if (appName === 'a8ito') {
      displayListings();
    } else if (appName === 'backpack') {
      displayInventory();
    } else if (appName === 'bank') {
      displayBankCards();
    } else if (appName === 'settings') {
      updateSettingsDisplay();
    }
  }
}

function closeApp() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
}

function updateBalance() {
  const balanceElements = document.querySelectorAll('.balance-value');
  balanceElements.forEach(el => {
    el.textContent = gameState.balance.toLocaleString() + ' ₽';
  });
}

function formatDateBirth(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 8) value = value.slice(0, 8);
  
  let formatted = '';
  if (value.length > 0) formatted += value.slice(0, 2);
  if (value.length > 2) formatted += '.' + value.slice(2, 4);
  if (value.length > 4) formatted += '.' + value.slice(4, 8);
  
  input.value = formatted;
}

// ============ CITY SELECTION ============

function openCityModal() {
  const modal = document.querySelector('.lock-city-modal');
  modal.classList.add('open');
}

function closeCityModal() {
  const modal = document.querySelector('.lock-city-modal');
  modal.classList.remove('open');
}

function selectCity(city) {
  gameState.city = city;
  document.querySelector('.lock-city-btn .placeholder').textContent = city;
  closeCityModal();
}

// ============ MARKETPLACE UI ============

function displayListings() {
  const container = document.querySelector('.a8-marketplace-grid');
  if (!container) return;
  
  container.innerHTML = gameState.listings.map(item => `
    <div class="a8-card" onclick="viewItem('${item.id}')">
      <div class="a8-card-image">${item.emoji}</div>
      <div class="a8-card-title">${item.name}</div>
      <div class="a8-card-price">${item.price.toLocaleString()} ₽</div>
      <div class="a8-card-condition">${item.condition}</div>
      <button class="a8-btn" onclick="event.stopPropagation(); viewItem('${item.id}')">Подробнее</button>
    </div>
  `).join('');
}

function viewItem(itemId) {
  const item = gameState.listings.find(i => i.id === itemId);
  if (!item) return;
  
  const modal = document.querySelector('.a8-modal');
  
  modal.innerHTML = `
    <div class="a8-modal-content">
      <div class="a8-modal-header">
        <button class="a8-modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="a8-modal-body">
        <div class="a8-item-emoji">${item.emoji}</div>
        <h2>${item.name}</h2>
        <p class="a8-item-price">${item.price.toLocaleString()} ₽</p>
        <p class="a8-item-condition">Состояние: ${item.condition}</p>
        ${ITEM_TYPES[item.type]?.hasOriginal ? `<p>Статус: ${item.isReplica ? 'Реплика' : 'Оригинал'}</p>` : ''}
      </div>
      <div class="a8-modal-footer">
        ${gameState.balance >= item.price ? `
          <button class="a8-btn-primary" onclick="buyItem('${item.id}'); closeModal(); displayListings();">Купить</button>
          <button class="a8-btn" onclick="inspectItemModal('${item.id}')">Проверить</button>
        ` : `<p style="color: red;">Недостаточно средств</p>`}
        <button class="a8-btn" onclick="closeModal()">Закрыть</button>
      </div>
    </div>
  `;
  modal.classList.add('open');
}

function inspectItemModal(itemId) {
  const item = gameState.listings.find(i => i.id === itemId);
  if (!item) return;
  
  const modal = document.querySelector('.a8-modal');
  const typeButtons = [];
  
  if (ITEM_TYPES[item.type]?.hasOriginal) {
    typeButtons.push(`<button class="a8-btn" onclick="performInspection('${itemId}', 'authenticity')">Проверить оригинальность</button>`);
  }
  if (ITEM_TYPES[item.type]?.hasState) {
    typeButtons.push(`<button class="a8-btn" onclick="performInspection('${itemId}', 'condition')">Проверить состояние</button>`);
  }
  
  modal.innerHTML = `
    <div class="a8-modal-content">
      <div class="a8-modal-header">
        <button class="a8-modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="a8-modal-body">
        <h3>Выберите тип проверки:</h3>
        ${typeButtons.join('')}
      </div>
    </div>
  `;
}

function performInspection(itemId, type) {
  const item = gameState.listings.find(i => i.id === itemId);
  if (!item) return;
  
  const modal = document.querySelector('.a8-modal');
  modal.innerHTML = `
    <div class="a8-modal-content">
      <div class="a8-inspection-loading">
        <div class="a8-loading-bar"></div>
        <p>Проверка...</p>
      </div>
    </div>
  `;
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 20;
    if (progress >= 100) {
      clearInterval(interval);
      const result = inspectItem(item, type);
      const bgColor = result.discovered ? '#ff6b6b' : '#4CD964';
      
      modal.innerHTML = `
        <div class="a8-modal-content">
          <div class="a8-modal-header">
            <button class="a8-modal-close" onclick="closeModal()">✕</button>
          </div>
          <div class="a8-modal-body" style="background: ${bgColor}; color: white; border-radius: 14px; padding: 20px;">
            <h3>${result.message}</h3>
          </div>
          <div class="a8-modal-footer">
            <button class="a8-btn-primary" onclick="closeModal()">Понимаю</button>
          </div>
        </div>
      `;
    }
  }, 100);
}

function closeModal() {
  document.querySelector('.a8-modal')?.classList.remove('open');
}

// ============ INVENTORY UI ============

function displayInventory() {
  const container = document.querySelector('.bp-grid');
  if (!container) return;
  
  if (gameState.inventory.length === 0) {
    container.innerHTML = '<div class="bp-empty" style="grid-column: 1/-1;">Инвентарь пуст</div>';
    return;
  }
  
  container.innerHTML = gameState.inventory.map(item => {
    const defectChip = item.hiddenDefect ? 
      `<span class="bp-defect-chip">${item.hiddenDefect}</span>` : 
      `<span class="bp-defect-chip none">✓ OK</span>`;
    
    const repairBtn = canRepair(item) ? 
      `<button class="a8-btn" onclick="repairItem('${item.id}')">🔧 Починить</button>` : '';
    
    return `
      <div class="bp-card" onclick="openInventoryItem('${item.id}')">
        <div class="bp-thumb">${item.emoji}</div>
        <div class="bp-name">${item.name}</div>
        <div class="bp-price">${item.price.toLocaleString()} ₽</div>
        <div class="bp-condition">${item.condition}</div>
        <div class="bp-defects">${defectChip}</div>
      </div>
    `;
  }).join('');
}

function openInventoryItem(itemId) {
  const item = gameState.inventory.find(i => i.id === itemId);
  if (!item) return;
  
  const modal = document.querySelector('.a8-modal');
  const repairBtn = canRepair(item) ? 
    `<button class="a8-btn-primary" onclick="repairItem('${item.id}')">Починить</button>` : '';
  
  modal.innerHTML = `
    <div class="a8-modal-content">
      <div class="a8-modal-header">
        <button class="a8-modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="a8-modal-body">
        <div class="a8-item-emoji">${item.emoji}</div>
        <h2>${item.name}</h2>
        <p>Состояние: ${item.condition}</p>
        <p>Дефект: ${item.hiddenDefect || 'Нет'}</p>
      </div>
      <div class="a8-modal-footer">
        ${repairBtn}
        <button class="a8-btn" onclick="closeModal()">Закрыть</button>
      </div>
    </div>
  `;
  modal.classList.add('open');
}

// ============ BANK UI ============

function displayBankCards() {
  const container = document.querySelector('.kb-card-container');
  if (!container) return;
  
  if (gameState.cards.length === 0) {
    container.innerHTML = `
      <div class="kb-onboard">
        <div class="kb-onboard-icon">💳</div>
        <div class="kb-onboard-title">Нет карт</div>
        <div class="kb-onboard-sub">Создайте вашу первую карту</div>
        <button class="kb-btn" onclick="openCardForm()">Создать карту</button>
      </div>
    `;
  } else {
    container.innerHTML = gameState.cards.map(card => `
      <div class="kb-card" style="background: linear-gradient(135deg, ${getDesignGradient(card.design)})">
        <div class="kb-card-logo">K</div>
        <div class="kb-card-bottom">
          <div>
            <div class="kb-card-number">•••• •••• •••• ${card.number.toString().slice(-4)}</div>
            <div class="kb-card-net">VISA</div>
          </div>
        </div>
      </div>
    `).join('') + `
      <div style="width: 100%; text-align: center; margin-top: 20px;">
        <button class="kb-btn" onclick="openCardForm()">+ Создать еще карту</button>
      </div>
    `;
  }
}

function getDesignGradient(design) {
  const designs = {
    midnight: '#2b2b3a, #0a0a12',
    sunset: '#ff8a5c, #d6373a',
    mint: '#3fe0c5, #0f8a72',
    amethyst: '#b06bff, #5b2a9e',
  };
  return designs[design] || '#2b2b3a, #0a0a12';
}

function openCardForm() {
  const modal = document.querySelector('.a8-modal');
  modal.innerHTML = `
    <div class="a8-modal-content">
      <div class="a8-modal-header">
        <button class="a8-modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="a8-modal-body">
        <div class="kb-form">
          <label class="kb-label">Имя на карте</label>
          <input type="text" class="kb-input" id="cardName" placeholder="Ваше имя" value="${gameState.playerName}">
          
          <label class="kb-label">Дата рождения</label>
          <input type="text" class="kb-input" id="cardBirth" placeholder="ДД.МММ.ГГГГ" maxlength="10" oninput="formatDateBirth(this)">
          
          <label class="kb-label">Выберите дизайн</label>
          <div class="kb-designs">
            <div class="kb-design-swatch kb-d-midnight" onclick="selectCardDesign('midnight')">Midnight</div>
            <div class="kb-design-swatch kb-d-sunset" onclick="selectCardDesign('sunset')">Sunset</div>
            <div class="kb-design-swatch kb-d-mint" onclick="selectCardDesign('mint')">Mint</div>
            <div class="kb-design-swatch kb-d-amethyst" onclick="selectCardDesign('amethyst')">Amethyst</div>
          </div>
          
          <button class="kb-btn" onclick="submitCard()">Создать карту</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('open');
}

let selectedDesign = 'midnight';

function selectCardDesign(design) {
  selectedDesign = design;
  document.querySelectorAll('.kb-design-swatch').forEach(s => s.classList.remove('selected'));
  document.querySelector(`.kb-d-${design}`).classList.add('selected');
}

function submitCard() {
  const name = document.querySelector('#cardName')?.value || gameState.playerName;
  const birth = document.querySelector('#cardBirth')?.value;
  
  if (!birth || !birth.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    alert('Введите дату в формате ДД.МММ.ГГГГ');
    return;
  }
  
  createCard(selectedDesign, name);
  closeModal();
  displayBankCards();
}

// ============ SETTINGS ============

function updateSettingsDisplay() {
  document.getElementById('playerName').textContent = gameState.playerName;
  document.getElementById('playerBalance').textContent = gameState.balance.toLocaleString() + ' ₽';
  
  const themeSwitch = document.getElementById('themeSwitch');
  if (gameState.theme === 'amoled') {
    themeSwitch.classList.add('on');
  } else {
    themeSwitch.classList.remove('on');
  }
}

function toggleTheme() {
  const newTheme = gameState.theme === 'classic' ? 'amoled' : 'classic';
  gameState.theme = newTheme;
  document.querySelector('.phone').classList.toggle('theme-amoled');
  localStorage.setItem('theme', newTheme);
  updateSettingsDisplay();
  saveGame();
}

function openResetDialog() {
  resetGame();
}

// ============ MAP INTEGRATION ============

function goToMap() {
  openApp('map');
  initMapApp();
}

function initMapApp() {
  const placeList = document.querySelector('.map-list');
  if (!placeList) return;
  
  const places = PLACES[gameState.city] || [];
  placeList.innerHTML = places.map((place, idx) => `
    <div class="map-place-row" onclick="selectPlace(${idx})">
      <div class="map-place-icon">${place.emoji}</div>
      <div class="map-place-info">
        <div class="map-place-name">${place.name}</div>
        <div class="map-place-desc">${place.desc}</div>
      </div>
      <div class="map-place-meta">
        <div class="map-place-dist">${place.dist}</div>
        <div class="map-place-eta">${place.eta}</div>
      </div>
    </div>
  `).join('');
}

function selectPlace(idx) {
  const place = PLACES[gameState.city]?.[idx];
  if (!place) return;
  
  const modal = document.querySelector('#mapPlaceModal');
  if (!modal) return;
  
  modal.innerHTML = `
    <div id="mapPlaceModal" class="map-place-modal" style="position:absolute; inset:0; z-index:60; background:rgba(0,0,0,0.6); display:flex; align-items:flex-end; justify-content:center; opacity:1; pointer-events:auto;">
      <div class="a8-filter-sheet">
        <div class="map-sheet-handle-row">
          <div class="a8-filter-handle"></div>
        </div>
        <div class="map-place-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
            <div class="map-place-card-title">${place.name}</div>
            <div class="map-place-card-close" onclick="closeMapPlace()">✕</div>
          </div>
          <div class="map-place-card-desc">${place.desc}</div>
          <div class="map-place-card-dist">📍 ${place.dist}</div>
          <div class="map-place-card-actions">
            <button class="map-place-card-walk-btn" onclick="walkToPlace()">
              🚶 Пешком
              <div class="walk-time">${place.eta}</div>
            </button>
            <button class="map-place-card-taxi-btn" onclick="orderTaxi()">🚕 Такси</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function closeMapPlace() {
  const modal = document.querySelector('#mapPlaceModal');
  if (modal) modal.innerHTML = '';
}

function walkToPlace() {
  alert('⏳ Вы идете на встречу...');
  closeMapPlace();
  setTimeout(() => {
    showDealWindow();
  }, 2000);
}

function orderTaxi() {
  alert('🚕 Заказ такси...');
  closeMapPlace();
  setTimeout(() => {
    showDealWindow();
  }, 3000);
}

function showDealWindow() {
  const overlay = document.querySelector('.map-trip-overlay');
  if (!overlay) return;
  
  overlay.classList.add('on');
  overlay.innerHTML = `
    <div class="a8-deal-window">
      <div style="position:absolute; top:10px; right:10px; cursor:pointer; font-size:20px; z-index:100;" onclick="closeDealWindow()">✕</div>
      <div class="a8-deal-photo">📱</div>
      <div class="a8-deal-seller">Продавец: Иван К.</div>
      <div class="a8-deal-actions">
        <button class="a8-btn-primary" onclick="alert('Вы проверили товар')">Проверить товар</button>
        <button class="a8-btn" onclick="alert('Вы купили товар!'); closeDealWindow();">Купить без проверки</button>
        <button class="a8-btn" onclick="closeDealWindow()">Отказаться</button>
      </div>
    </div>
  `;
}

function closeDealWindow() {
  document.querySelector('.map-trip-overlay')?.classList.remove('on');
}

// ============ INITIALIZATION ============

window.addEventListener('load', () => {
  loadGame();
  
  if (gameState.theme === 'amoled') {
    document.querySelector('.phone').classList.add('theme-amoled');
  }
  
  if (gameState.listings.length === 0) {
    generateListings();
  }
  
  updateBalance();
  displayListings();
  displayInventory();
  displayBankCards();
  
  if (document.querySelector('.lock-city-btn .placeholder')) {
    document.querySelector('.lock-city-btn .placeholder').textContent = gameState.city;
  }
  
  const cityList = document.querySelector('.lock-city-list');
  if (cityList) {
    cityList.innerHTML = CITIES.map(city => `
      <div class="lock-city-option ${city === gameState.city ? 'selected' : ''}" onclick="selectCity('${city}')">${city}</div>
    `).join('');
  }
  
  saveGame();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveGame();
});