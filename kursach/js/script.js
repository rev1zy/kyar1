// ============================================
// GETGO - MAIN JAVASCRIPT FILE
// Загрузка данных из XML
// ============================================

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let isMenuOpen = false;
let currentPage = getCurrentPage();
let currentBookingCar = null;

// Данные для страниц (загружаются из XML)
let carsData = [];
let reviewsData = [];
let faqData = {};
let tariffsData = [];
let selectedTariff = null;
let selectedOptions = new Set();
let currentTotal = 0;
let visibleReviews = 6;

// Определение текущей страницы
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('page1-home')) return 'home';
    if (path.includes('page2-about')) return 'about';
    if (path.includes('page3-fleet')) return 'fleet';
    if (path.includes('page4-reviews')) return 'reviews';
    if (path.includes('page5-faq')) return 'faq';
    if (path.includes('page6-pricing')) return 'pricing';
    return 'home';
}

// ========== ФУНКЦИИ ЗАГРУЗКИ XML ==========
async function loadXML(url) {
    try {
        const response = await fetch(url);
        const xmlText = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(xmlText, 'text/xml');
    } catch (error) {
        console.error(`Ошибка загрузки ${url}:`, error);
        return null;
    }
}

// Загрузка данных об автомобилях
// Загрузка данных об автомобилях (ИСПРАВЛЕННАЯ)
async function loadCarsData() {
    const xml = await loadXML('data/cars.xml');
    if (!xml) {
        console.error('Не удалось загрузить cars.xml');
        return [];
    }
    
    const cars = [];
    const carElements = xml.querySelectorAll('car');
    
    console.log('Найдено автомобилей:', carElements.length);
    
    carElements.forEach((car, index) => {
        // Используем правильные селекторы
        const name = car.querySelector('name')?.textContent || '';
        const price = car.querySelector('price')?.textContent || '';
        const image = car.querySelector('image')?.textContent || '';
        const type = car.querySelector('type')?.textContent || '';
        
        // Спецификации
        const specs = [];
        const specElements = car.querySelectorAll('specs spec');
        specElements.forEach(spec => {
            specs.push(spec.textContent);
        });
        
        // Особенности
        const features = [];
        const featureElements = car.querySelectorAll('features feature');
        featureElements.forEach(feature => {
            features.push(feature.textContent);
        });
        
        cars.push({ 
            id: index + 1,
            name, 
            price, 
            image, 
            type, 
            specs, 
            features 
        });
    });
    
    console.log('Загружено автомобилей:', cars.length);
    return cars;
}

// Загрузка отзывов
async function loadReviewsData() {
    const xml = await loadXML('data/reviews.xml');
    if (!xml) return [];
    
    const reviews = [];
    const reviewElements = xml.querySelectorAll('review');
    
    reviewElements.forEach(review => {
        reviews.push({
            name: review.querySelector('name')?.textContent || '',
            date: review.querySelector('date')?.textContent || '',
            car: review.querySelector('car')?.textContent || '',
            stars: parseInt(review.querySelector('stars')?.textContent) || 5,
            text: review.querySelector('text')?.textContent || '',
            helpful: parseInt(review.querySelector('helpful')?.textContent) || 0
        });
    });
    
    return reviews;
}

// Загрузка FAQ
async function loadFaqData() {
    const xml = await loadXML('data/faq.xml');
    if (!xml) return {};
    
    const faq = {};
    const categories = xml.querySelectorAll('category');
    
    categories.forEach(category => {
        const categoryName = category.getAttribute('name');
        const items = [];
        
        category.querySelectorAll('item').forEach(item => {
            items.push({
                q: item.querySelector('question')?.textContent || '',
                a: item.querySelector('answer')?.textContent || ''
            });
        });
        
        faq[categoryName] = items;
    });
    
    return faq;
}

// Загрузка тарифов
async function loadTariffsData() {
    const xml = await loadXML('data/tariffs.xml');
    if (!xml) return [];
    
    const tariffs = [];
    const tariffElements = xml.querySelectorAll('tariff');
    
    tariffElements.forEach(tariff => {
        const name = tariff.querySelector('name')?.textContent || '';
        const price = parseFloat(tariff.querySelector('price')?.textContent) || 0;
        const period = tariff.querySelector('period')?.textContent || '';
        const popular = tariff.getAttribute('popular') === 'true';
        
        const features = [];
        tariff.querySelectorAll('features feature').forEach(feature => {
            features.push(feature.textContent);
        });
        
        tariffs.push({ name, price, period, popular, features });
    });
    
    return tariffs;
}

// ========== МОДАЛЬНОЕ ОКНО ==========
let currentCallback = null;

function openModal(title, subtitle, onSubmitCallback) {
    const modal = document.getElementById('registerModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const form = document.getElementById('registerForm');
    
    if (!modal) return;
    
    modalTitle.textContent = title || 'Создайте аккаунт';
    modalSubtitle.textContent = subtitle || 'Начните использовать GetGo уже сегодня';
    
    currentCallback = onSubmitCallback;
    
    form.onsubmit = null;
    form.onsubmit = function(e) {
        e.preventDefault();
        const name = document.getElementById('userName')?.value.trim() || '';
        const phone = document.getElementById('userPhone')?.value.trim() || '';
        const comment = document.getElementById('userComment')?.value.trim() || '';
        
        if (!name || !phone) {
            alert('Пожалуйста, заполните имя и телефон');
            return;
        }
        
        if (currentCallback) {
            currentCallback(name, phone, comment);
        } else {
            alert(`✅ Спасибо, ${name}!\n\nМы свяжемся с вами по телефону ${phone}\n\nКомментарий: ${comment || 'без комментария'}`);
        }
        
        closeModal();
        form.reset();
    };
    
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
    currentCallback = null;
}

// ========== МОБИЛЬНОЕ МЕНЮ ==========
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    const mainContent = document.getElementById('mainContent');
    
    if (menuBtn && navLinks) {
        const newMenuBtn = menuBtn.cloneNode(true);
        menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
        
        newMenuBtn.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                navLinks.classList.add('active');
                newMenuBtn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccff00" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
                if (mainContent) mainContent.style.marginTop = '180px';
            } else {
                navLinks.classList.remove('active');
                newMenuBtn.innerHTML = `<svg width="30" height="21" viewBox="0 0 30 21" fill="none"><line x1="2" y1="2" x2="28" y2="2" stroke="#ccff00" stroke-width="2.5"/><line x1="2" y1="10.5" x2="28" y2="10.5" stroke="#ccff00" stroke-width="2.5"/><line x1="2" y1="19" x2="28" y2="19" stroke="#ccff00" stroke-width="2.5"/></svg>`;
                if (mainContent) mainContent.style.marginTop = '0';
            }
        });
        
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (isMenuOpen) {
                    navLinks.classList.remove('active');
                    newMenuBtn.innerHTML = `<svg width="30" height="21" viewBox="0 0 30 21" fill="none"><line x1="2" y1="2" x2="28" y2="2" stroke="#ccff00" stroke-width="2.5"/><line x1="2" y1="10.5" x2="28" y2="10.5" stroke="#ccff00" stroke-width="2.5"/><line x1="2" y1="19" x2="28" y2="19" stroke="#ccff00" stroke-width="2.5"/></svg>`;
                    if (mainContent) mainContent.style.marginTop = '0';
                    isMenuOpen = false;
                }
            });
        });
    }
}

// ========== ОБЩАЯ ФУНКЦИЯ ДЛЯ КНОПОК РЕГИСТРАЦИИ ==========
function initAllButtons() {
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        const newSignupBtn = signupBtn.cloneNode(true);
        signupBtn.parentNode.replaceChild(newSignupBtn, signupBtn);
        newSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('Регистрация в GetGo', 'Создайте аккаунт и начните пользоваться сервисом');
        });
    }
    
    document.querySelectorAll('.btn-cta').forEach(btn => {
        if (btn.id === 'loadMoreBtn') return;
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage === 'pricing') {
                if (typeof openOrderModal === 'function') openOrderModal();
            } else {
                openModal('Регистрация в GetGo', 'Создайте аккаунт и начните пользоваться сервисом');
            }
        });
    });
    
    const heroCta = document.getElementById('heroCta');
    if (heroCta) {
        const newHeroCta = heroCta.cloneNode(true);
        heroCta.parentNode.replaceChild(newHeroCta, heroCta);
        newHeroCta.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('Бронирование автомобиля', 'Оставьте заявку, и мы поможем подобрать авто');
        });
    }
}

// ========== PAGE 3 - FLEET (с загрузкой из XML) ==========
let currentSelectedCar = null;

function openSpecsModal(carName) {
    const car = carsData.find(c => c.name === carName);
    if (!car) return;
    
    currentSelectedCar = car;
    
    document.getElementById('specsCarName').textContent = car.name;
    document.getElementById('specsCarPrice').textContent = car.price;
    
    const specsList = document.getElementById('specsList');
    specsList.innerHTML = car.specs.map(spec => `<li>${spec}</li>`).join('');
    
    const featuresList = document.getElementById('featuresList');
    featuresList.innerHTML = car.features.map(f => `<span class="specs-badge">${f}</span>`).join('');
    
    document.getElementById('specsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSpecsModal() {
    document.getElementById('specsModal').classList.remove('active');
    document.body.style.overflow = '';
}

function openBookingModal(carName, carPrice) {
    currentBookingCar = { name: carName, price: carPrice };
    openModal(`Бронирование: ${carName}`, `Цена: ${carPrice}\nЗаполните форму для подтверждения бронирования`, (name, phone, comment) => {
        alert(`✅ Спасибо за заявку, ${name}!\n\nАвтомобиль: ${carName}\nЦена: ${carPrice}\nТелефон: ${phone}\nКомментарий: ${comment || 'без комментария'}\n\nНаш менеджер свяжется с вами!`);
    });
}

function renderFleet() {
    const grid = document.getElementById('fleetGrid');
    if (!grid) return;
    
    grid.innerHTML = carsData.map(car => `
        <div class="car-card" data-car-name="${car.name}">
            <div class="car-image">
                <img src="${car.image}" alt="${car.name}">
            </div>
            <div class="car-info">
                <h3>${car.name}</h3>
                <div class="car-specs">
                    <span>${car.type}</span>
                </div>
                <div class="car-price">${car.price}</div>
                <button class="btn-secondary specs-btn" style="width:100%; margin-bottom:12px; padding:10px;">📋 Характеристики</button>
                <button class="btn-primary rent-btn" style="width:100%; background:#ccff00; color:#121212;">🔑 Арендовать</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.specs-btn').forEach(btn => {
        const card = btn.closest('.car-card');
        const carName = card.querySelector('h3').textContent;
        btn.addEventListener('click', () => openSpecsModal(carName));
    });
    
    document.querySelectorAll('.rent-btn').forEach(btn => {
        const card = btn.closest('.car-card');
        const carName = card.querySelector('h3').textContent;
        const carPrice = card.querySelector('.car-price').textContent;
        btn.addEventListener('click', () => openBookingModal(carName, carPrice));
    });
}

async function initFleetPage() {
    carsData = await loadCarsData();
    renderFleet();
    
    document.getElementById('closeSpecsBtn')?.addEventListener('click', closeSpecsModal);
    document.getElementById('specsModal')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('specs-modal')) closeSpecsModal();
    });
    document.getElementById('bookFromSpecsBtn')?.addEventListener('click', () => {
        if (currentSelectedCar) {
            closeSpecsModal();
            setTimeout(() => openBookingModal(currentSelectedCar.name, currentSelectedCar.price), 300);
        }
    });
}

// ========== PAGE 4 - REVIEWS (с загрузкой из XML) ==========
let reviews = [];

function renderStars(stars) {
    let html = '';
    for (let i = 0; i < stars; i++) {
        html += `<svg width="18" height="18" viewBox="0 0 24 24" fill="#f5b042" style="display:inline-block"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }
    for (let i = stars; i < 5; i++) {
        html += `<svg width="18" height="18" viewBox="0 0 24 24" fill="#e2e8f0" style="display:inline-block"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }
    return html;
}

function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;
    
    const showReviews = reviews.slice(0, visibleReviews);
    container.innerHTML = showReviews.map(r => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-name">${r.name}</div>
                <div class="review-date">${r.date}</div>
            </div>
            <div class="review-car">${r.car}</div>
            <div class="review-stars">${renderStars(r.stars)}</div>
            <div class="review-text">${r.text}</div>
            <div class="helpful">👍 Полезно (${r.helpful})</div>
        </div>
    `).join('');
    
    const loadBtn = document.getElementById('loadMoreBtn');
    if (loadBtn) loadBtn.style.display = visibleReviews >= reviews.length ? 'none' : 'block';
}

async function initReviewsPage() {
    reviews = await loadReviewsData();
    renderReviews();
    
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
        visibleReviews += 3;
        renderReviews();
    });
}

// ========== PAGE 5 - FAQ (с загрузкой из XML) ==========
function buildFaq() {
    const grid = document.getElementById('faqGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    for (const [category, items] of Object.entries(faqData)) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'faq-category';
        categoryDiv.innerHTML = `<h4>${category}</h4>`;
        items.forEach(item => {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            faqItem.innerHTML = `
                <div class="faq-question">
                    ${item.q}
                    <span class="toggle-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccff00" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                    </span>
                </div>
                <div class="faq-answer">${item.a}</div>
            `;
            const questionDiv = faqItem.querySelector('.faq-question');
            const answerDiv = faqItem.querySelector('.faq-answer');
            const iconSpan = questionDiv.querySelector('.toggle-icon');
            
            questionDiv.addEventListener('click', () => {
                answerDiv.classList.toggle('active');
                if (answerDiv.classList.contains('active')) {
                    iconSpan.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccff00" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>`;
                } else {
                    iconSpan.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccff00" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>`;
                }
            });
            categoryDiv.appendChild(faqItem);
        });
        grid.appendChild(categoryDiv);
    }
}

async function initFaqPage() {
    faqData = await loadFaqData();
    buildFaq();
    
    document.getElementById('searchFaq')?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.faq-item').forEach(item => {
            const question = item.querySelector('.faq-question').innerText.toLowerCase();
            item.style.display = question.includes(searchTerm) ? '' : 'none';
        });
    });
}

// ========== PAGE 6 - PRICING (с загрузкой из XML) ==========
function renderPricing() {
    const container = document.getElementById('pricingGrid');
    if (!container) return;
    
    container.innerHTML = tariffsData.map(tariff => `
        <div class="pricing-card ${tariff.popular ? 'popular' : ''}" data-tariff='${JSON.stringify(tariff)}'>
            ${tariff.popular ? '<div class="popular-badge">Популярный</div>' : ''}
            <h3>${tariff.name}</h3>
            <div class="price">${tariff.price}<span> ${tariff.period}</span></div>
            <ul class="features">
                ${tariff.features.map(f => `<li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccff00" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> ${f}</li>`).join('')}
            </ul>
            <button class="btn-plan select-tariff">Выбрать</button>
        </div>
    `).join('');

    document.querySelectorAll('.select-tariff').forEach((btn, index) => {
        btn.addEventListener('click', () => selectTariff(tariffsData[index]));
    });
}

function selectTariff(tariff) {
    selectedTariff = tariff;
    document.getElementById('selectedTariffName').innerHTML = `${tariff.name} - ${tariff.price} ${tariff.period}`;
    updateTotal();
    
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.style.borderColor = '#e0e0e0';
        card.style.transform = 'scale(1)';
    });
    const selectedCard = Array.from(document.querySelectorAll('.pricing-card')).find(card => 
        card.querySelector('h3')?.innerText === tariff.name
    );
    if (selectedCard) {
        selectedCard.style.borderColor = '#ccff00';
        selectedCard.style.transform = 'scale(1.02)';
    }
}

function initPriceOptions() {
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
            const option = card.dataset.option;
            if (selectedOptions.has(option)) {
                selectedOptions.delete(option);
                card.classList.remove('selected');
            } else {
                selectedOptions.add(option);
                card.classList.add('selected');
            }
            updateTotal();
        });
    });
}

function updateTotal() {
    if (!selectedTariff) {
        currentTotal = 0;
        document.getElementById('totalPrice').innerHTML = '0<span> руб</span>';
        return;
    }
    
    let total = selectedTariff.price;
    selectedOptions.forEach(option => {
        const card = document.querySelector(`.option-card[data-option="${option}"]`);
        if (card) {
            total += parseInt(card.dataset.price);
        }
    });
    
    currentTotal = total;
    const priceElement = document.getElementById('totalPrice');
    priceElement.classList.add('price-update');
    priceElement.innerHTML = `${total}<span> ${selectedTariff.period}</span>`;
    setTimeout(() => priceElement.classList.remove('price-update'), 300);
}

function openOrderModal() {
    if (!selectedTariff) {
        alert('Пожалуйста, сначала выберите тариф');
        return;
    }
    
    const optionsNames = Array.from(selectedOptions).map(opt => {
        const card = document.querySelector(`.option-card[data-option="${opt}"]`);
        return card?.querySelector('.option-name')?.innerText || opt;
    });
    
    const optionsNamesText = optionsNames.length > 0 ? `\n➕ Доп. опции: ${optionsNames.join(', ')}` : '';
    const optionsPrice = selectedOptions.size > 0 ? `\n💰 Стоимость опций: +${currentTotal - selectedTariff.price} руб` : '';
    
    openModal(`Оформление: ${selectedTariff.name}`, `Сумма: ${currentTotal} ${selectedTariff.period}${optionsNamesText}${optionsPrice}`, (name, phone, comment) => {
        alert(`✅ Заказ оформлен, ${name}!\n\nТариф: ${selectedTariff.name} - ${currentTotal} ${selectedTariff.period}\n📞 Телефон: ${phone}\n${optionsNames.length > 0 ? `➕ Дополнительные опции: ${optionsNames.join(', ')}\n` : ''}💬 Комментарий: ${comment || 'без комментария'}\n\nСпасибо за выбор GetGo! 🚗`);
    });
}

async function initPricingPage() {
    tariffsData = await loadTariffsData();
    renderPricing();
    initPriceOptions();
    
    document.getElementById('orderBtn')?.addEventListener('click', openOrderModal);
}

// ========== PAGE 1 - HOME ==========
function initHomePage() {
    // Дополнительная логика для главной страницы
}

// ========== PAGE 2 - ABOUT ==========
function initAboutPage() {
    document.querySelectorAll('.btn-cta, .btn-primary').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('Связаться с нами', 'Оставьте заявку, и мы расскажем все о GetGo');
        });
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ МОДАЛЬНОГО ОКНА ==========
function initModal() {
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', closeModal);
    }
    
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) closeModal();
        });
    }
}

// ========== ГЛАВНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ==========
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script initialized, current page:', currentPage);
    
    // Инициализация общих компонентов
    initMobileMenu();
    initAllButtons();
    initModal();
    
    // Инициализация страниц с загрузкой данных
    if (currentPage === 'home') {
        initHomePage();
    } else if (currentPage === 'about') {
        initAboutPage();
    } else if (currentPage === 'fleet') {
        await initFleetPage();
    } else if (currentPage === 'reviews') {
        await initReviewsPage();
    } else if (currentPage === 'faq') {
        await initFaqPage();
    } else if (currentPage === 'pricing') {
        await initPricingPage();
    }
});