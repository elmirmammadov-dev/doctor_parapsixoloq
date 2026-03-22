document.addEventListener("DOMContentLoaded", function() {
    // Admin auth check
    if (sessionStorage.getItem("adminAuth") !== "true") {
        window.location.href = "index.html";
        return;
    }
    // Shared variables needed from main script
    let currentLang = localStorage.getItem('lang') || 'az';
    const LANG_TO_LOCALE = { az: 'az', ru: 'ru', en: 'az', tr: 'az' };
    const CONTENTFUL_SPACE = 'q3fe87ca4p3k';
    const CONTENTFUL_TOKEN = 'uyQ8WH4Rhs40Y1OBAoXI9nzQGunrNUAtEU4lizTZL-o';

    // Show admin panel immediately
    const overlay = document.getElementById("adminPanelOverlay");
    if (overlay) overlay.classList.add("active");

    const adminPanelOverlay = document.getElementById('adminPanelOverlay');
    const adminPanelClose = document.getElementById('adminPanelClose');

    // Admin panel is standalone page - always visible
    window.openAdminPanel = function(tab) {
        const targetTab = tab || 'contentful';
        switchAdminTab(targetTab);
        location.hash = 'admin-' + targetTab;
        checkFirebaseStorage();
    };

    // Check Firebase storage usage and warn if close to limit
    function checkFirebaseStorage() {
        const db = firebase.database();
        const WARN_THRESHOLD_MB = 800; // Warn at 800 MB (limit is 1 GB)
        let totalBytes = 0;

        function estimateSize(val) {
            if (val === null || val === undefined) return 0;
            return new Blob([JSON.stringify(val)]).size;
        }

        Promise.all([
            db.ref('comments').once('value').then(s => estimateSize(s.val())),
            db.ref('siteTraffic').once('value').then(s => estimateSize(s.val())),
            db.ref('users').once('value').then(s => estimateSize(s.val()))
        ]).then(sizes => {
            totalBytes = sizes[0] + sizes[1] + sizes[2];
            const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
            const pct = ((totalBytes / (1024 * 1024 * 1024)) * 100).toFixed(1);

            if (totalBytes >= WARN_THRESHOLD_MB * 1024 * 1024) {
                showStorageWarning(totalMB, pct);
            }

            // Remove old warning if under threshold
            const oldWarn = document.getElementById('adminStorageWarning');
            if (oldWarn && totalBytes < WARN_THRESHOLD_MB * 1024 * 1024) {
                oldWarn.remove();
            }
        }).catch(() => {});
    }

    function showStorageWarning(totalMB, pct) {
        if (document.getElementById('adminStorageWarning')) return;
        const html = `
            <div id="adminStorageWarning" style="background:#fff3cd;border:1px solid #ffc107;border-radius:12px;padding:16px 20px;margin:16px 20px;display:flex;align-items:center;gap:12px;">
                <i class="fas fa-exclamation-triangle" style="color:#e67e22;font-size:1.5rem;"></i>
                <div>
                    <strong style="color:#856404;">${adminT('storageWarningTitle')}</strong>
                    <p style="margin:4px 0 0;color:#856404;font-size:0.9rem;">
                        <strong>${totalMB} MB</strong> / 1024 MB (${pct}%). ${adminT('storageWarningText')}
                    </p>
                </div>
            </div>
        `;
        const panel = document.querySelector('.admin-panel-body') || document.querySelector('.admin-panel');
        if (panel) panel.insertAdjacentHTML('afterbegin', html);
    }

    if (adminPanelClose) {
        adminPanelClose.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Restore admin panel on page load if hash present
    // Restore tab from hash or default to contentful
    if (location.hash.startsWith('#admin-')) {
        const savedTab = location.hash.replace('#admin-', '');
        switchAdminTab(savedTab || 'contentful');
    } else {
        switchAdminTab('contentful');
    }
    checkFirebaseStorage();

    // Admin panel is now a full page — no overlay click-to-close

    // Tab switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchAdminTab(btn.dataset.tab);
            location.hash = 'admin-' + btn.dataset.tab;
        });
    });

    // === ADMIN PANEL LANGUAGE SWITCHER ===
    const adminTranslations = {
        az: {
            goToSiteText: 'Sayta keç',
            tabNewArticle: 'Yeni Məqalə',
            tabArticles: 'Məqalələr',
            tabComments: 'Şərhlər',
            tabUsers: 'İstifadəçilər',
            tabStats: 'Statistika',
            tabReviews: 'Rəylər',
            labelTitle: 'Başlıq',
            labelDate: 'Tarix',
            labelImage: 'Şəkil',
            labelText: 'Mətn',
            placeholderTitle: 'Məqalənin başlığı',
            placeholderDate: 'Məs: 9 mart 2026',
            toggleRuSupport: 'Rus dili dəstəyini aç',
            publishArticle: 'Məqaləni Dərc Et',
            cancelEdit: 'Ləğv et',
            articlesDesc: 'Məqaləni redaktə etmək və ya silmək üçün yanındakı düymələrə basın:',
            commentsDesc: 'Bütün blog şərhləri:',
            sortNewest: 'Ən yeni əvvəl',
            sortOldest: 'Ən köhnə əvvəl',
            selectAll: 'Hamısını seç',
            deleteSelected: 'Seçilənləri sil',
            deleteAll: 'Hamısını sil',
            usersDesc: 'Qeydiyyatdan keçən istifadəçilər:',
            storageWarningTitle: 'Diqqət! Firebase yaddaşı dolur',
            storageWarningText: 'Zəhmət olmasa köhnə şərhləri və ya trafik məlumatlarını silin.',
            // Stats
            statToday: 'Bugün',
            statWeek: 'Bu həftə',
            statMonth: 'Bu ay',
            statAvgStay: 'Ort. qalma',
            resetToday: 'Bugünü sıfırla',
            resetWeek: 'Həftəni sıfırla',
            resetMonth: 'Ayı sıfırla',
            resetActivities: 'Fəaliyyətləri sıfırla',
            resetAll: 'Hamısını sıfırla',
            todaySessions: 'Bugünkü sessiyalar',
            noSessions: 'Hələ sessiya məlumatı yoxdur.',
            recentActivities: 'Son fəaliyyətlər',
            noActivities: 'Hələ fəaliyyət yoxdur.',
            potentialCustomers: 'Potensial Müştərilər',
            uniqueIpNote: '(unikal IP — 1 IP = 1 klik)',
            mainPage: 'Ana Səhifə',
            blogPage: 'Bloq',
            totalLabel: 'Cəmi',
            resetClickStats: 'Klik statistikasını sıfırla',
            confirmResetClicks: 'Klik statistikasını sıfırlamaq istədiyinizə əminsiniz?',
            clickStatsReset: 'Klik statistikası sıfırlandı!',
            resetConfirmPrefix: '',
            resetConfirmSuffix: ' sıfırlamaq istədiyinizə əminsiniz?',
            resetDone: 'Sıfırlandı!',
            errorPrefix: 'Xəta: ',
            loading: 'Yüklənir...',
            // Stats reset labels
            resetLabelToday: 'bugünkü statistikanı',
            resetLabelWeek: 'bu həftənin statistikasını',
            resetLabelMonth: 'bu ayın statistikasını',
            resetLabelActivities: 'bütün fəaliyyətləri',
            resetLabelAll: 'BÜTÜN statistika və fəaliyyətləri',
            // Users
            userCount: 'istifadəçi',
            noUsers: 'Heç bir qeydiyyatlı istifadəçi yoxdur.',
            unnamed: 'Adsız',
            banned: 'BANLI',
            warningCount: 'xəbərdarlıq',
            unban: 'Ban aç',
            ban: 'Banla',
            warningHistory: 'Xəbərdarlıq tarixçəsi',
            seen: 'Oxunub',
            notSeen: 'Oxunmayıb',
            warn: 'Xəbərdar et',
            deleteUser: 'Sil',
            warnReasonPrompt: 'Xəbərdarlıq səbəbi',
            warnedAlert: 'istifadəçisinə xəbərdarlıq verildi.',
            banConfirm: 'istifadəçisini banlamaq istəyirsiniz?\nBanlanan istifadəçi yalnız oxucu olaraq qalacaq, şərh yaza bilməyəcək.',
            banReasonPrompt: 'Ban səbəbi:',
            bannedAlert: 'banlandı.',
            deleteUserConfirm: 'istifadəçisini silmək istədiyinizə əminsiniz?\nBu əməliyyat geri qaytarıla bilməz.',
            deletedAlert: 'silindi.',
            // Articles
            edit: 'Redaktə',
            deleteBtn: 'Sil',
            noTitle: 'Başlıqsız',
            confirmDeleteArticle: 'Bu məqaləni silmək istədiyinizə əminsiniz?',
            // Comments
            confirmDeleteReply: 'Bu cavabı silmək istədiyinizə əminsiniz?',
            confirmDeleteComment: 'Bu şərhi silmək istədiyinizə əminsiniz?',
            confirmDeleteAllComments: 'BÜTÜN şərhləri silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz!',
            confirmDeleteSelected: 'şərhi silmək istədiyinizə əminsiniz?',
            replyAgain: 'Yenidən cavabla',
            replyWrite: 'Cavab yaz',
            replyPlaceholder: 'Cavabınızı yazın...',
            send: 'Göndər',
            cancelReply: 'Ləğv et',
            save: 'Yadda saxla',
            editReply: 'Düzəlt',
            deleteReply: 'Sil',
            unknownArticle: 'Naməlum məqalə',
            // Click stat labels
            clickSeansaYazil: 'Seansa Yazıl',
            clickWhatsappFloat: 'WhatsApp (float düymə)',
            clickWhatsappSocial: 'WhatsApp (sosial)',
            clickCalendar: 'Təqvim gün seçimi',
            clickCallForm: 'Zəng sifarişi formu',
            clickTiktok: 'TikTok',
            clickFacebook: 'Facebook',
            clickInstagram: 'Instagram',
            clickYoutube: 'YouTube'
        },
        ru: {
            goToSiteText: 'На сайт',
            tabNewArticle: 'Новая Статья',
            tabArticles: 'Статьи',
            tabComments: 'Комментарии',
            tabUsers: 'Пользователи',
            tabStats: 'Статистика',
            tabReviews: 'Отзывы',
            labelTitle: 'Заголовок',
            labelDate: 'Дата',
            labelImage: 'Изображение',
            labelText: 'Текст',
            placeholderTitle: 'Заголовок статьи',
            placeholderDate: 'Напр: 9 марта 2026',
            toggleRuSupport: 'Включить поддержку русского языка',
            publishArticle: 'Опубликовать Статью',
            cancelEdit: 'Отменить',
            articlesDesc: 'Нажмите кнопки рядом со статьёй для редактирования или удаления:',
            commentsDesc: 'Все комментарии блога:',
            sortNewest: 'Сначала новые',
            sortOldest: 'Сначала старые',
            selectAll: 'Выбрать все',
            deleteSelected: 'Удалить выбранные',
            deleteAll: 'Удалить все',
            usersDesc: 'Зарегистрированные пользователи:',
            storageWarningTitle: 'Внимание! Хранилище Firebase заполняется',
            storageWarningText: 'Пожалуйста, удалите старые комментарии или данные трафика.',
            // Stats
            statToday: 'Сегодня',
            statWeek: 'Эта неделя',
            statMonth: 'Этот месяц',
            statAvgStay: 'Ср. время',
            resetToday: 'Сбросить сегодня',
            resetWeek: 'Сбросить неделю',
            resetMonth: 'Сбросить месяц',
            resetActivities: 'Сбросить активности',
            resetAll: 'Сбросить все',
            todaySessions: 'Сегодняшние сессии',
            noSessions: 'Данных о сессиях пока нет.',
            recentActivities: 'Последние действия',
            noActivities: 'Действий пока нет.',
            potentialCustomers: 'Потенциальные Клиенты',
            uniqueIpNote: '(уникальный IP — 1 IP = 1 клик)',
            mainPage: 'Главная',
            blogPage: 'Блог',
            totalLabel: 'Итого',
            resetClickStats: 'Сбросить статистику кликов',
            confirmResetClicks: 'Вы уверены, что хотите сбросить статистику кликов?',
            clickStatsReset: 'Статистика кликов сброшена!',
            resetConfirmPrefix: '',
            resetConfirmSuffix: ' — вы уверены, что хотите сбросить?',
            resetDone: 'Сброшено!',
            errorPrefix: 'Ошибка: ',
            loading: 'Загрузка...',
            // Stats reset labels
            resetLabelToday: 'статистику за сегодня',
            resetLabelWeek: 'статистику за эту неделю',
            resetLabelMonth: 'статистику за этот месяц',
            resetLabelActivities: 'все действия',
            resetLabelAll: 'ВСЮ статистику и действия',
            // Users
            userCount: 'пользователей',
            noUsers: 'Нет зарегистрированных пользователей.',
            unnamed: 'Без имени',
            banned: 'ЗАБАНЕН',
            warningCount: 'предупреждение',
            unban: 'Разбанить',
            ban: 'Забанить',
            warningHistory: 'История предупреждений',
            seen: 'Прочитано',
            notSeen: 'Не прочитано',
            warn: 'Предупредить',
            deleteUser: 'Удалить',
            warnReasonPrompt: 'Причина предупреждения',
            warnedAlert: 'получил предупреждение.',
            banConfirm: '— забанить пользователя?\nЗабаненный пользователь сможет только читать, но не сможет комментировать.',
            banReasonPrompt: 'Причина бана:',
            bannedAlert: 'забанен.',
            deleteUserConfirm: '— удалить пользователя?\nЭто действие нельзя отменить.',
            deletedAlert: 'удалён.',
            // Articles
            edit: 'Редактировать',
            deleteBtn: 'Удалить',
            noTitle: 'Без заголовка',
            confirmDeleteArticle: 'Вы уверены, что хотите удалить эту статью?',
            // Comments
            confirmDeleteReply: 'Вы уверены, что хотите удалить этот ответ?',
            confirmDeleteComment: 'Вы уверены, что хотите удалить этот комментарий?',
            confirmDeleteAllComments: 'Удалить ВСЕ комментарии? Это действие нельзя отменить!',
            confirmDeleteSelected: 'комментарий — удалить выбранные?',
            replyAgain: 'Ответить снова',
            replyWrite: 'Ответить',
            replyPlaceholder: 'Напишите ваш ответ...',
            send: 'Отправить',
            cancelReply: 'Отменить',
            save: 'Сохранить',
            editReply: 'Изменить',
            deleteReply: 'Удалить',
            unknownArticle: 'Неизвестная статья',
            // Click stat labels
            clickSeansaYazil: 'Записаться на сеанс',
            clickWhatsappFloat: 'WhatsApp (кнопка)',
            clickWhatsappSocial: 'WhatsApp (соц.)',
            clickCalendar: 'Выбор дня в календаре',
            clickCallForm: 'Форма заказа звонка',
            clickTiktok: 'TikTok',
            clickFacebook: 'Facebook',
            clickInstagram: 'Instagram',
            clickYoutube: 'YouTube'
        }
    };

    let adminLang = localStorage.getItem('adminLang') || 'az';

    function adminT(key) {
        const t = adminTranslations[adminLang];
        return (t && t[key]) || adminTranslations.az[key] || key;
    }
    window.adminT = adminT;

    function applyAdminTranslations(lang) {
        const t = adminTranslations[lang];
        if (!t) return;
        adminLang = lang;
        localStorage.setItem('adminLang', lang);

        // Text content
        document.querySelectorAll('[data-admin-i18n]').forEach(el => {
            const key = el.getAttribute('data-admin-i18n');
            if (t[key]) el.textContent = t[key];
        });

        // Placeholders
        document.querySelectorAll('[data-admin-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-admin-i18n-placeholder');
            if (t[key]) el.placeholder = t[key];
        });

        // Update active button style
        document.querySelectorAll('.admin-lang-btn').forEach(btn => {
            const isActive = btn.dataset.adminLang === lang;
            btn.style.background = isActive ? 'var(--gold)' : '#fff';
            btn.style.color = isActive ? '#fff' : 'var(--gold)';
            btn.classList.toggle('active', isActive);
        });

        // Re-render dynamic admin content
        if (typeof loadAdminStats === 'function') loadAdminStats();
        if (typeof loadAdminUsers === 'function') loadAdminUsers();
        if (typeof loadAdminArticles === 'function') loadAdminArticles();
        if (typeof loadAdminComments === 'function') loadAdminComments();
        if (typeof loadAdminReviews === 'function') loadAdminReviews();
    }

    // Init admin lang buttons
    document.querySelectorAll('.admin-lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyAdminTranslations(btn.dataset.adminLang);
        });
    });

    // Apply saved admin language on load
    if (adminLang !== 'az') {
        applyAdminTranslations(adminLang);
    }

    function switchAdminTab(tab) {
        document.querySelectorAll('.admin-tab-btn').forEach(b => {
            const isActive = b.dataset.tab === tab;
            b.classList.toggle('active', isActive);
            b.style.background = isActive ? 'var(--gold)' : '#fff';
            b.style.color = isActive ? '#fff' : 'var(--gold)';
        });
        document.getElementById('tabContentful').style.display = tab === 'contentful' ? 'block' : 'none';
        document.getElementById('tabArticles').style.display = tab === 'articles' ? 'block' : 'none';
        document.getElementById('tabComments').style.display = tab === 'comments' ? 'block' : 'none';
        document.getElementById('tabUsers').style.display = tab === 'users' ? 'block' : 'none';
        document.getElementById('tabStats').style.display = tab === 'stats' ? 'block' : 'none';
        document.getElementById('tabReviews').style.display = tab === 'reviews' ? 'block' : 'none';

        if (tab === 'articles') loadAdminArticles();
        if (tab === 'comments') loadAdminComments();
        if (tab === 'users') loadAdminUsers();
        if (tab === 'stats') loadAdminStats();
        if (tab === 'reviews') loadAdminReviews();
    }

    // === ADMIN REVIEWS ===
    const ADMIN_REVIEW_TEXTS = {
        az: { desc: 'Pasiyent rəyləri:', count: 'rəy', loading: 'Yüklənir...', empty: 'Hələ rəy yoxdur.', selectAll: 'Hamısını seç', deleteSelected: 'Seçilənləri sil', deleteAll: 'Hamısını sil', edit: 'Redaktə', del: 'Sil', save: 'Yadda saxla', cancel: 'Ləğv et', selected: 'seçilib', confirmOne: 'adlı rəyi silmək istədiyinizdən əminsiniz?', confirmSelected: 'rəyi silmək istədiyinizdən əminsiniz?', confirmAll1: 'BÜTÜN rəyləri silmək istədiyinizdən əminsiniz? Bu əməliyyat geri qaytarıla bilməz!', confirmAll2: 'Son dəfə təsdiq edin - bütün rəylər Firebase-dən silinəcək!', noSelection: 'Heç bir rəy seçilməyib.', months: ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'] },
        ru: { desc: 'Отзывы пациентов:', count: 'отз.', loading: 'Загрузка...', empty: 'Отзывов пока нет.', selectAll: 'Выбрать все', deleteSelected: 'Удалить выбранные', deleteAll: 'Удалить все', edit: 'Редакт.', del: 'Удалить', save: 'Сохранить', cancel: 'Отмена', selected: 'выбрано', confirmOne: '— удалить этот отзыв?', confirmSelected: 'отзыв(ов) удалить?', confirmAll1: 'Удалить ВСЕ отзывы? Это действие необратимо!', confirmAll2: 'Подтвердите — все отзывы будут удалены из Firebase!', noSelection: 'Ничего не выбрано.', months: ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'] },
        en: { desc: 'Patient reviews:', count: 'reviews', loading: 'Loading...', empty: 'No reviews yet.', selectAll: 'Select all', deleteSelected: 'Delete selected', deleteAll: 'Delete all', edit: 'Edit', del: 'Delete', save: 'Save', cancel: 'Cancel', selected: 'selected', confirmOne: '— delete this review?', confirmSelected: 'review(s) to delete?', confirmAll1: 'Delete ALL reviews? This cannot be undone!', confirmAll2: 'Confirm — all reviews will be deleted from Firebase!', noSelection: 'Nothing selected.', months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] },
        tr: { desc: 'Hasta yorumları:', count: 'yorum', loading: 'Yükleniyor...', empty: 'Henüz yorum yok.', selectAll: 'Tümünü seç', deleteSelected: 'Seçilenleri sil', deleteAll: 'Tümünü sil', edit: 'Düzenle', del: 'Sil', save: 'Kaydet', cancel: 'İptal', selected: 'seçildi', confirmOne: '— bu yorumu silmek istiyor musunuz?', confirmSelected: 'yorum silinsin mi?', confirmAll1: 'TÜM yorumları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!', confirmAll2: 'Son onay — tüm yorumlar Firebase\'den silinecek!', noSelection: 'Hiçbir şey seçilmedi.', months: ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'] }
    };

    function getAdminReviewT() {
        return ADMIN_REVIEW_TEXTS[adminLang] || ADMIN_REVIEW_TEXTS.az;
    }

    function loadAdminReviews() {
        const list = document.getElementById('adminReviewsList');
        const countEl = document.getElementById('adminReviewsCount');
        const descEl = document.querySelector('#tabReviews p');
        if (!list) return;
        const t = getAdminReviewT();
        if (descEl) descEl.textContent = t.desc;
        list.innerHTML = `<p style="text-align:center;color:#999;padding:20px 0;">${t.loading}</p>`;

        adminDb.ref('reviews').orderByChild('timestamp').once('value', snapshot => {
            const reviews = [];
            snapshot.forEach(child => {
                const r = child.val();
                r._key = child.key;
                reviews.push(r);
            });
            reviews.reverse();

            if (countEl) countEl.textContent = reviews.length + ' ' + t.count;

            if (reviews.length === 0) {
                list.innerHTML = `<p style="text-align:center;color:#999;padding:20px 0;">${t.empty}</p>`;
                return;
            }

            let topBar = `
                <div style="display:flex;gap:8px;margin-bottom:14px;align-items:center;flex-wrap:wrap;">
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.85rem;font-weight:600;color:var(--text-secondary);">
                        <input type="checkbox" id="reviewSelectAll" onchange="toggleAllReviews(this.checked)" style="width:16px;height:16px;cursor:pointer;">
                        ${t.selectAll}
                    </label>
                    <button onclick="deleteSelectedReviews()" style="padding:6px 14px;border:1px solid #e74c3c;background:#fff;color:#e74c3c;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:all 0.3s;">
                        <i class="fas fa-trash"></i> ${t.deleteSelected}
                    </button>
                    <button onclick="deleteAllReviews()" style="padding:6px 14px;border:none;background:#e74c3c;color:#fff;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:all 0.3s;">
                        <i class="fas fa-trash-alt"></i> ${t.deleteAll}
                    </button>
                    <span id="reviewSelectedCount" style="font-size:0.8rem;color:#999;margin-left:auto;"></span>
                </div>
            `;

            list.innerHTML = topBar + reviews.map(r => {
                const date = new Date(r.timestamp);
                const dateStr = `${date.getDate()} ${t.months[date.getMonth()]} ${date.getFullYear()}, ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
                let starsHtml = '';
                for (let i = 0; i < 5; i++) {
                    starsHtml += `<i class="fas fa-star" style="color:${i < r.rating ? '#ffa534' : '#ddd'};font-size:0.8rem;"></i>`;
                }
                return `
                    <div style="background:#f8faf9;border-radius:12px;padding:16px;margin-bottom:12px;border-left:3px solid var(--gold);display:flex;gap:12px;align-items:flex-start;" id="adminReview_${r._key}">
                        <input type="checkbox" class="review-checkbox" data-key="${r._key}" onchange="updateReviewSelectionCount()" style="width:18px;height:18px;cursor:pointer;margin-top:2px;flex-shrink:0;">
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                                <div>
                                    <strong style="font-size:0.95rem;">${r.name}</strong>
                                    ${r.city ? `<span style="color:#999;font-size:0.82rem;margin-left:8px;"><i class="fas fa-map-marker-alt"></i> ${r.city}</span>` : ''}
                                    <div style="margin-top:4px;">${starsHtml}</div>
                                </div>
                                <span style="font-size:0.75rem;color:#999;">${dateStr}</span>
                            </div>
                            <p class="admin-review-text" id="reviewText_${r._key}" style="font-size:0.9rem;color:#333;line-height:1.6;margin:8px 0;">${r.text}</p>
                            <div id="reviewBtns_${r._key}" style="display:flex;gap:8px;margin-top:10px;">
                                <button onclick="editAdminReview('${r._key}')" style="padding:6px 14px;border:1px solid var(--gold);background:#fff;color:var(--gold);border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:all 0.3s;">
                                    <i class="fas fa-edit"></i> ${t.edit}
                                </button>
                                <button onclick="deleteAdminReview('${r._key}','${r.name.replace(/'/g, "\\'")}')" style="padding:6px 14px;border:1px solid #e74c3c;background:#fff;color:#e74c3c;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:all 0.3s;">
                                    <i class="fas fa-trash"></i> ${t.del}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        });
    }

    window.toggleAllReviews = function(checked) {
        document.querySelectorAll('.review-checkbox').forEach(cb => cb.checked = checked);
        updateReviewSelectionCount();
    };

    window.updateReviewSelectionCount = function() {
        const t = getAdminReviewT();
        const checked = document.querySelectorAll('.review-checkbox:checked').length;
        const total = document.querySelectorAll('.review-checkbox').length;
        const countEl = document.getElementById('reviewSelectedCount');
        if (countEl) countEl.textContent = checked > 0 ? `${checked} / ${total} ${t.selected}` : '';
        const selectAll = document.getElementById('reviewSelectAll');
        if (selectAll) selectAll.checked = checked === total && total > 0;
    };

    window.deleteSelectedReviews = function() {
        const t = getAdminReviewT();
        const checked = document.querySelectorAll('.review-checkbox:checked');
        if (checked.length === 0) return alert(t.noSelection);
        if (!confirm(`${checked.length} ${t.confirmSelected}`)) return;
        const updates = {};
        checked.forEach(cb => { updates[cb.dataset.key] = null; });
        adminDb.ref('reviews').update(updates).then(() => loadAdminReviews());
    };

    window.deleteAllReviews = function() {
        const t = getAdminReviewT();
        if (!confirm(t.confirmAll1)) return;
        if (!confirm(t.confirmAll2)) return;
        adminDb.ref('reviews').remove().then(() => loadAdminReviews());
    };

    window.deleteAdminReview = function(key, name) {
        const t = getAdminReviewT();
        if (!confirm(`"${name}" ${t.confirmOne}`)) return;
        adminDb.ref('reviews/' + key).remove().then(() => {
            loadAdminReviews();
        });
    };

    window.editAdminReview = function(key) {
        const t = getAdminReviewT();
        const textEl = document.getElementById('reviewText_' + key);
        if (!textEl) return;
        const currentText = textEl.textContent;
        const btnsDiv = document.getElementById('reviewBtns_' + key);
        if (!btnsDiv) return;

        // Replace text with textarea
        textEl.outerHTML = `
            <textarea id="reviewEditArea_${key}" style="width:100%;padding:10px;border:1.5px solid var(--gold);border-radius:8px;font-size:0.9rem;font-family:inherit;min-height:80px;box-sizing:border-box;resize:vertical;">${currentText}</textarea>
        `;

        // Replace buttons
        btnsDiv.innerHTML = `
            <button onclick="saveAdminReview('${key}')" style="padding:6px 14px;border:none;background:var(--gold);color:#fff;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;">
                <i class="fas fa-save"></i> ${t.save}
            </button>
            <button onclick="loadAdminReviews()" style="padding:6px 14px;border:1px solid #999;background:#fff;color:#999;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;">
                <i class="fas fa-times"></i> ${t.cancel}
            </button>
        `;
    };

    window.saveAdminReview = function(key) {
        const textarea = document.getElementById('reviewEditArea_' + key);
        if (!textarea) return;
        const newText = textarea.value.trim();
        if (!newText) return;

        adminDb.ref('reviews/' + key).update({ text: newText }).then(() => {
            loadAdminReviews();
        });
    };

    // Load articles list for deletion
    async function loadAdminArticles() {
        const listEl = document.getElementById('adminArticlesList');
        if (!listEl) return;
        listEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;"><i class="fas fa-spinner fa-spin"></i> ' + adminT('loading') + '</p>';

        try {
            const res = await fetch(
                `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries?access_token=${CONTENTFUL_TOKEN}&content_type=blogPost&include=1&order=-sys.createdAt&locale=az`
            );
            const data = await res.json();
            if (!data.items || data.items.length === 0) {
                listEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;">Heç bir məqalə tapılmadı.</p>';
                return;
            }

            const assets = {};
            if (data.includes && data.includes.Asset) {
                data.includes.Asset.forEach(a => {
                    assets[a.sys.id] = 'https:' + a.fields.file.url;
                });
            }

            listEl.innerHTML = '';
            data.items.forEach(item => {
                const f = item.fields;
                const id = item.sys.id;
                const imgId = f.image && f.image.sys ? f.image.sys.id : null;
                const imgUrl = imgId ? assets[imgId] : null;

                const card = document.createElement('div');
                card.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #eee;border-radius:10px;margin-bottom:10px;background:#fafafa;';
                card.innerHTML = `
                    ${imgUrl ? `<img src="${imgUrl}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : `<div style="width:60px;height:60px;background:#f0f7f3;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-image" style="color:#ccc;"></i></div>`}
                    <div style="flex:1;min-width:0;">
                        <p style="font-weight:600;font-size:0.9rem;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${f.title || adminT('noTitle')}</p>
                        <span style="font-size:0.8rem;color:#999;">${f.date || ''}</span>
                    </div>
                    <div style="display:flex;gap:6px;flex-shrink:0;">
                        <button onclick="editArticle('${id}')" style="padding:8px 14px;background:var(--gold);color:#fff;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap;">
                            <i class="fas fa-edit"></i> ${adminT('edit')}
                        </button>
                        <button onclick="deleteArticle('${id}', this)" style="padding:8px 14px;background:#e74c3c;color:#fff;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap;">
                            <i class="fas fa-trash"></i> ${adminT('deleteBtn')}
                        </button>
                    </div>
                `;
                listEl.appendChild(card);
            });
        } catch (err) {
            listEl.innerHTML = '<p style="text-align:center;color:#e74c3c;padding:20px 0;">' + adminT('errorPrefix') + err.message + '</p>';
        }
    }

    // Delete article from Contentful
    window.deleteArticle = async function(entryId, btn) {
        if (!confirm(adminT('confirmDeleteArticle'))) return;

        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const res = await fetch(WORKER_URL + '/delete-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entryId }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Remove card from UI
            btn.closest('div[style]').remove();
            // Refresh blog posts on main page
            fetchBlogPosts();
        } catch (err) {
            alert('Silmə xətası: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    // Load all comments from Firebase (with blog post titles from Contentful)
    let adminCommentSortOrder = 'newest';
    let adminSelectedComments = new Set();

    const sortSelect = document.getElementById('adminCommentSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            adminCommentSortOrder = this.value;
            loadAdminComments();
        });
    }

    // Select all / deselect all
    const selectAllBtn = document.getElementById('adminSelectAllComments');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.admin-comment-checkbox');
            const allChecked = adminSelectedComments.size === checkboxes.length && checkboxes.length > 0;
            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
                const key = cb.dataset.postid + '/' + cb.dataset.commentid;
                if (!allChecked) adminSelectedComments.add(key);
                else adminSelectedComments.delete(key);
            });
            updateSelectedCount();
        });
    }

    // Delete selected
    const deleteSelectedBtn = document.getElementById('adminDeleteSelectedComments');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', function() {
            if (adminSelectedComments.size === 0) return;
            if (!confirm(adminSelectedComments.size + ' ' + adminT('confirmDeleteSelected'))) return;
            const promises = [];
            adminSelectedComments.forEach(key => {
                promises.push(adminDb.ref('comments/' + key).remove());
            });
            Promise.all(promises).then(() => {
                adminSelectedComments.clear();
                updateSelectedCount();
                loadAdminComments();
            });
        });
    }

    function updateSelectedCount() {
        const countEl = document.getElementById('adminSelectedCount');
        const btn = document.getElementById('adminDeleteSelectedComments');
        if (countEl) countEl.textContent = adminSelectedComments.size;
        if (btn) btn.style.display = adminSelectedComments.size > 0 ? 'inline-flex' : 'none';
    }

    window.toggleCommentSelect = function(postId, commentId, checked) {
        const key = postId + '/' + commentId;
        if (checked) adminSelectedComments.add(key);
        else adminSelectedComments.delete(key);
        updateSelectedCount();
    };

    function renderAdminReplies(postId, commentId, replies) {
        const keys = Object.keys(replies);
        if (keys.length === 0) return '';
        const sorted = keys.map(k => ({ key: k, ...replies[k] })).sort((a, b) => a.timestamp - b.timestamp);
        return `<div style="margin-top:8px;border-left:3px solid #ddd;padding-left:10px;">
            ${sorted.map(r => {
                const rd = new Date(r.timestamp);
                const rDate = String(rd.getDate()).padStart(2,'0') + '.' + String(rd.getMonth()+1).padStart(2,'0') + '.' + rd.getFullYear() + ' - ' + String(rd.getHours()).padStart(2,'0') + ':' + String(rd.getMinutes()).padStart(2,'0');
                const replyToTag = r.replyTo ? `<span style="color:var(--gold);font-weight:600;font-size:0.78rem;">@${escapeAdminHtml(r.replyTo)}</span> ` : '';
                const authorLabel = adminLang === 'ru' ? 'Автор' : 'Müəllif';
                const authorBadge = r.isAuthor ? ' <span style="background:var(--gold);color:#fff;font-size:0.65rem;padding:1px 6px;border-radius:4px;font-weight:600;">' + authorLabel + '</span>' : '';
                return `<div style="padding:6px 8px;background:#f9f9f9;border-radius:6px;margin-bottom:4px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:0.78rem;font-weight:600;">${escapeAdminHtml(r.name)}${authorBadge}</span>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-size:0.68rem;color:#999;">${rDate}</span>
                            <button onclick="deleteSingleReply('${postId}','${commentId}','${r.key}')" style="padding:2px 6px;background:#fde8e8;color:#e74c3c;border:none;border-radius:4px;font-size:0.68rem;cursor:pointer;" title="Cavabı sil"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <p style="font-size:0.8rem;color:#444;margin:2px 0 0;">${replyToTag}${escapeAdminHtml(r.text)}</p>
                </div>`;
            }).join('')}
        </div>`;
    }

    window.deleteSingleReply = function(postId, commentId, replyKey) {
        if (!confirm(adminT('confirmDeleteReply'))) return;
        adminDb.ref('comments/' + postId + '/' + commentId + '/replies/' + replyKey).remove().then(() => {
            loadAdminComments();
        });
    };

    function loadAdminComments() {
        const listEl = document.getElementById('adminCommentsList');
        if (!listEl || typeof adminDb === 'undefined') return;

        listEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;"><i class="fas fa-spinner fa-spin"></i> ' + adminT('loading') + '</p>';

        // Fetch blog posts from Contentful (title + content), then load comments
        const locale = LANG_TO_LOCALE[currentLang] || 'az';
        fetch(`https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries?access_token=${CONTENTFUL_TOKEN}&content_type=blogPost&locale=${locale}&limit=100&include=1`)
            .then(r => r.json())
            .then(data => {
                const postData = {};
                const assets = {};
                if (data.includes && data.includes.Asset) {
                    data.includes.Asset.forEach(a => {
                        assets[a.sys.id] = 'https:' + a.fields.file.url;
                    });
                }
                if (data.items) {
                    data.items.forEach(item => {
                        const f = item.fields;
                        const imgId = f.image && f.image.sys ? f.image.sys.id : null;
                        postData[item.sys.id] = {
                            title: f.title,
                            date: f.date || '',
                            content: f.content || null,
                            image: imgId ? assets[imgId] : null
                        };
                    });
                }
                return postData;
            })
            .catch(() => ({}))
            .then(postData => {

        adminPostDataCache = postData;
        adminDb.ref('comments').once('value', snapshot => {
            const allComments = [];
            snapshot.forEach(postSnap => {
                const postId = postSnap.key;
                postSnap.forEach(commentSnap => {
                    allComments.push({
                        postId: postId,
                        commentId: commentSnap.key,
                        ...commentSnap.val()
                    });
                });
            });

            if (adminCommentSortOrder === 'oldest') {
                allComments.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            } else {
                allComments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }

            if (allComments.length === 0) {
                listEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;">Heç bir şərh yoxdur.</p>';
                return;
            }

            listEl.innerHTML = allComments.map(c => {
                const post = postData[c.postId] || {};
                const postTitle = post.title || adminT('unknownArticle');
                const initial = (c.name || '?')[0].toUpperCase();
                const d = new Date(c.timestamp);
                const date = String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear() + ' - ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
                const safeText = escapeAdminHtml(c.text || '');
                const safeName = escapeAdminHtml(c.name || '');
                // Show existing reply if any
                let replyHtml = '';
                if (c.reply) {
                    const rd = new Date(c.reply.timestamp);
                    const replyDate = String(rd.getDate()).padStart(2,'0') + '.' + String(rd.getMonth()+1).padStart(2,'0') + '.' + rd.getFullYear() + ' - ' + String(rd.getHours()).padStart(2,'0') + ':' + String(rd.getMinutes()).padStart(2,'0');
                    replyHtml = `
                        <div style="margin-top:8px;padding:10px 12px;background:#e8f5e9;border-radius:8px;border-left:3px solid var(--gold);">
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                                <img src="profil sekli.png" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">
                                <strong style="font-size:0.8rem;color:var(--gold);">Şahsəddin İmanlı</strong>
                                <span style="font-size:0.7rem;color:#999;">${replyDate}</span>
                            </div>
                            <div id="replyContent_${c.postId}_${c.commentId}">
                                <p style="font-size:0.82rem;color:#333;margin:0;line-height:1.4;">${escapeAdminHtml(c.reply.text)}</p>
                            </div>
                            <div id="replyEditForm_${c.postId}_${c.commentId}" style="display:none;">
                                <textarea id="replyEditText_${c.postId}_${c.commentId}" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.82rem;min-height:50px;resize:vertical;box-sizing:border-box;font-family:inherit;">${escapeAdminHtml(c.reply.text)}</textarea>
                                <div style="display:flex;gap:6px;margin-top:6px;">
                                    <button onclick="saveEditReply('${c.postId}','${c.commentId}')" style="padding:4px 12px;background:var(--gold);color:#fff;border:none;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer;">
                                        <i class="fas fa-check"></i> ${adminT('save')}
                                    </button>
                                    <button onclick="cancelEditReply('${c.postId}','${c.commentId}')" style="padding:4px 12px;background:#eee;color:#666;border:none;border-radius:6px;font-size:0.78rem;cursor:pointer;">
                                        <i class="fas fa-times"></i> ${adminT('cancelReply')}
                                    </button>
                                </div>
                            </div>
                            <div class="admin-reply-actions">
                                <button class="admin-reply-edit-btn" onclick="editReply('${c.postId}','${c.commentId}')">
                                    <i class="fas fa-pen"></i> ${adminT('editReply')}
                                </button>
                                <button class="admin-reply-delete-btn" onclick="deleteReply('${c.postId}','${c.commentId}')">
                                    <i class="fas fa-trash"></i> ${adminT('deleteReply')}
                                </button>
                            </div>
                        </div>
                    `;
                }

                const isSelected = adminSelectedComments.has(c.postId + '/' + c.commentId);
                return `
                    <div style="display:flex;gap:12px;padding:12px;border:1px solid ${isSelected ? '#e74c3c' : '#f0f0f0'};border-radius:10px;margin-bottom:8px;align-items:flex-start;${isSelected ? 'background:#fef5f5;' : ''}">
                        <input type="checkbox" class="admin-comment-checkbox" data-postid="${c.postId}" data-commentid="${c.commentId}" ${isSelected ? 'checked' : ''} onchange="toggleCommentSelect('${c.postId}','${c.commentId}',this.checked)" style="margin-top:10px;width:18px;height:18px;cursor:pointer;flex-shrink:0;accent-color:#e74c3c;">
                        <div style="width:36px;height:36px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex-shrink:0;">${escapeAdminHtml(initial)}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="margin-bottom:6px;">
                                <button onclick="toggleArticlePreview('${c.postId}','${c.commentId}')" style="font-size:0.72rem;color:#2e7d32;padding:3px 8px;background:#e8f5e9;border-radius:5px;border:1px solid #a5d6a7;cursor:pointer;">
                                    <i class="fas fa-eye"></i> Məqaləni göstər
                                </button>
                            </div>
                            <div id="articlePreview_${c.postId}_${c.commentId}" style="display:none;margin-bottom:8px;padding:12px 16px;background:#fafafa;border:1px solid #e0e0e0;border-radius:8px;max-height:400px;overflow-y:auto;">
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <strong style="font-size:0.88rem;">${safeName}</strong>
                                <span style="font-size:0.75rem;color:#999;">${date}</span>
                            </div>
                            <p style="font-size:0.78rem;color:#888;margin:2px 0 0;"><i class="fas fa-envelope" style="font-size:0.7rem;margin-right:4px;"></i>${escapeAdminHtml(c.email || '')}</p>
                            <p style="font-size:0.85rem;color:var(--text-secondary);margin:4px 0 0;line-height:1.5;">${safeText}</p>
                            ${replyHtml}
                            ${c.replies ? renderAdminReplies(c.postId, c.commentId, c.replies) : ''}
                            <div style="margin-top:8px;display:flex;gap:6px;">
                                <button onclick="toggleReplyForm('${c.postId}','${c.commentId}')" style="padding:5px 10px;background:#e8f2ec;color:var(--gold);border:none;border-radius:6px;font-size:0.78rem;cursor:pointer;" title="Cavab yaz">
                                    <i class="fas fa-reply"></i> ${c.reply ? adminT('replyAgain') : adminT('replyWrite')}
                                </button>
                            </div>
                            <div id="replyForm_${c.postId}_${c.commentId}" style="display:none;margin-top:8px;">
                                <textarea id="replyText_${c.postId}_${c.commentId}" placeholder="${adminT('replyPlaceholder')}" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.85rem;min-height:60px;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>
                                <button onclick="submitReply('${c.postId}','${c.commentId}')" style="margin-top:6px;padding:6px 16px;background:var(--gold);color:#fff;border:none;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer;">
                                    <i class="fas fa-paper-plane"></i> ${adminT('send')}
                                </button>
                            </div>
                        </div>
                        <button onclick="deleteComment('${c.postId}','${c.commentId}')" style="padding:6px 10px;background:#fde8e8;color:#e74c3c;border:none;border-radius:6px;font-size:0.78rem;cursor:pointer;flex-shrink:0;" title="Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }).join('');
        });

        }); // end postData .then
    }

    function escapeAdminHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Render Contentful rich text to HTML (for admin inline preview)
    function adminRenderRichText(node) {
        if (!node) return '';
        if (node.nodeType === 'text') {
            let text = escapeAdminHtml(node.value || '');
            if (node.marks) {
                node.marks.forEach(mark => {
                    if (mark.type === 'bold') text = '<strong>' + text + '</strong>';
                    if (mark.type === 'italic') text = '<em>' + text + '</em>';
                    if (mark.type === 'underline') text = '<u>' + text + '</u>';
                });
            }
            return text;
        }
        const children = (node.content || []).map(adminRenderRichText).join('');
        const align = node.data && node.data.align;
        const alignStyle = align ? ' style="text-align:' + align + '"' : '';
        switch (node.nodeType) {
            case 'document': return children;
            case 'paragraph': return '<p' + alignStyle + '>' + children + '</p>';
            case 'heading-1': return '<h2' + alignStyle + '>' + children + '</h2>';
            case 'heading-2': return '<h3' + alignStyle + '>' + children + '</h3>';
            case 'heading-3': return '<h4' + alignStyle + '>' + children + '</h4>';
            case 'blockquote': return '<blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;">' + children + '</blockquote>';
            case 'unordered-list': return '<ul>' + children + '</ul>';
            case 'ordered-list': return '<ol>' + children + '</ol>';
            case 'list-item': return '<li>' + children + '</li>';
            case 'hr': return '<hr>';
            case 'hyperlink':
                const uri = node.data && node.data.uri ? node.data.uri : '#';
                return '<a href="' + uri + '" target="_blank" rel="noopener">' + children + '</a>';
            default: return children;
        }
    }

    // Cache for post data (set in loadAdminComments)
    let adminPostDataCache = {};

    // Toggle inline article preview
    window.toggleArticlePreview = function(postId, commentId) {
        const previewEl = document.getElementById('articlePreview_' + postId + '_' + commentId);
        if (!previewEl) return;

        if (previewEl.style.display !== 'none') {
            previewEl.style.display = 'none';
            return;
        }

        const post = adminPostDataCache[postId];
        if (!post) {
            previewEl.innerHTML = '<p style="color:#999;font-size:0.85rem;">Məqalə tapılmadı.</p>';
            previewEl.style.display = 'block';
            return;
        }

        let html = '';
        if (post.image) {
            html += '<img src="' + post.image + '" style="width:100%;border-radius:8px;margin-bottom:12px;" alt="">';
        }
        html += '<h3 style="margin:0 0 4px;font-size:1rem;color:var(--text-primary);">' + escapeAdminHtml(post.title) + '</h3>';
        if (post.date) {
            html += '<span style="font-size:0.75rem;color:#999;">' + escapeAdminHtml(post.date) + '</span>';
        }
        if (post.content) {
            html += '<div style="margin-top:12px;font-size:0.85rem;line-height:1.6;color:#333;">' + adminRenderRichText(post.content) + '</div>';
        }
        previewEl.innerHTML = html;
        previewEl.style.display = 'block';
    };

    // Toggle reply form
    window.toggleReplyForm = function(postId, commentId) {
        const form = document.getElementById('replyForm_' + postId + '_' + commentId);
        if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
    };

    // Submit reply
    window.submitReply = function(postId, commentId) {
        const textarea = document.getElementById('replyText_' + postId + '_' + commentId);
        if (!textarea) return;
        const text = textarea.value.trim();
        if (!text) return;

        adminDb.ref('comments/' + postId + '/' + commentId + '/reply').set({
            text: text,
            author: 'Şahsəddin İmanlı',
            timestamp: Date.now()
        }).then(() => {
            loadAdminComments();
        });
    };

    // Delete reply only
    window.deleteReply = function(postId, commentId) {
        if (!confirm(adminT('confirmDeleteReply'))) return;
        adminDb.ref('comments/' + postId + '/' + commentId + '/reply').remove().then(() => {
            loadAdminComments();
        });
    };

    // Edit reply — show edit form
    window.editReply = function(postId, commentId) {
        const content = document.getElementById('replyContent_' + postId + '_' + commentId);
        const editForm = document.getElementById('replyEditForm_' + postId + '_' + commentId);
        if (content) content.style.display = 'none';
        if (editForm) editForm.style.display = 'block';
    };

    // Cancel edit reply
    window.cancelEditReply = function(postId, commentId) {
        const content = document.getElementById('replyContent_' + postId + '_' + commentId);
        const editForm = document.getElementById('replyEditForm_' + postId + '_' + commentId);
        if (content) content.style.display = 'block';
        if (editForm) editForm.style.display = 'none';
    };

    // Save edited reply
    window.saveEditReply = function(postId, commentId) {
        const textarea = document.getElementById('replyEditText_' + postId + '_' + commentId);
        if (!textarea) return;
        const text = textarea.value.trim();
        if (!text) return;

        adminDb.ref('comments/' + postId + '/' + commentId + '/reply').update({
            text: text,
            timestamp: Date.now()
        }).then(() => {
            loadAdminComments();
        });
    };

    // Delete single comment
    window.deleteComment = function(postId, commentId) {
        if (!confirm(adminT('confirmDeleteComment'))) return;
        adminDb.ref('comments/' + postId + '/' + commentId).remove().then(() => {
            loadAdminComments();
        });
    };

    // Delete all comments
    const deleteAllBtn = document.getElementById('adminDeleteAllComments');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            if (!confirm(adminT('confirmDeleteAllComments'))) return;
            adminDb.ref('comments').remove().then(() => {
                loadAdminComments();
            });
        });
    }

    // === NEW ARTICLE — ADMIN PANEL ===
    const WORKER_URL = 'https://polished-mouse-8b71contentful-proxy.abdullayevmeherrem10.workers.dev';

    // Image preview
    // Russian locale toggle
    const toggleRuBtn = document.getElementById('toggleRuLocale');
    const ruFields = document.getElementById('ruLocaleFields');
    const ruContentField = document.getElementById('ruContentField');
    const closeRuBtn = document.getElementById('closeRuLocale');

    if (toggleRuBtn) {
        toggleRuBtn.addEventListener('click', () => {
            if (ruFields) ruFields.style.display = 'block';
            if (ruContentField) ruContentField.style.display = 'block';
            toggleRuBtn.style.display = 'none';
        });
    }
    if (closeRuBtn) {
        closeRuBtn.addEventListener('click', () => {
            if (ruFields) ruFields.style.display = 'none';
            if (ruContentField) ruContentField.style.display = 'none';
            if (toggleRuBtn) toggleRuBtn.style.display = 'inline-flex';
        });
    }

    const articleImageInput = document.getElementById('articleImage');
    const articleImagePreview = document.getElementById('articleImagePreview');
    if (articleImageInput) {
        articleImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    articleImagePreview.src = ev.target.result;
                    articleImagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                articleImagePreview.style.display = 'none';
            }
        });
    }

    // === Rich text toolbar helper: save/restore selection ===
    let savedSelection = null;
    function saveSelection() {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            savedSelection = sel.getRangeAt(0).cloneRange();
        }
    }
    function restoreSelection() {
        if (savedSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelection);
        }
    }

    // Prevent focus loss on mousedown for all toolbar buttons & selects
    document.querySelectorAll('.rt-btn, .rt-btn-ru').forEach(btn => {
        btn.addEventListener('mousedown', e => e.preventDefault());
    });

    // Save selection when editors lose focus (before toolbar click)
    ['articleContent', 'articleContentRu'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keyup', saveSelection);
            el.addEventListener('mouseup', saveSelection);
            el.addEventListener('blur', saveSelection);
        }
    });

    // Generic execCommand runner
    function runCmd(cmd) {
        if (cmd === 'bold') document.execCommand('bold');
        else if (cmd === 'italic') document.execCommand('italic');
        else if (cmd === 'underline') document.execCommand('underline');
        else if (cmd === 'strikethrough') document.execCommand('strikeThrough');
        else if (cmd === 'justifyLeft') document.execCommand('justifyLeft');
        else if (cmd === 'justifyCenter') document.execCommand('justifyCenter');
        else if (cmd === 'justifyRight') document.execCommand('justifyRight');
        else if (cmd === 'justifyFull') document.execCommand('justifyFull');
        else if (cmd === 'ul') document.execCommand('insertUnorderedList');
        else if (cmd === 'ol') document.execCommand('insertOrderedList');
        else if (cmd === 'quote') document.execCommand('formatBlock', false, 'blockquote');
        else if (cmd === 'undo') document.execCommand('undo');
        else if (cmd === 'redo') document.execCommand('redo');
        else if (cmd === 'removeFormat') document.execCommand('removeFormat');
    }

    // AZ toolbar buttons
    document.querySelectorAll('.rt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            restoreSelection();
            runCmd(btn.dataset.cmd);
            saveSelection();
        });
    });

    // RU toolbar buttons
    document.querySelectorAll('.rt-btn-ru').forEach(btn => {
        btn.addEventListener('click', () => {
            restoreSelection();
            runCmd(btn.dataset.cmd);
            saveSelection();
        });
    });

    // Setup toolbar selects/inputs for a given editor
    function setupToolbarControls(fontFamilyId, fontSizeId, headingId, textColorId, bgColorId) {
        const fontFamily = document.getElementById(fontFamilyId);
        if (fontFamily) {
            fontFamily.addEventListener('mousedown', e => { e.target.tagName !== 'OPTION' || e.preventDefault(); });
            fontFamily.addEventListener('change', () => {
                restoreSelection();
                if (fontFamily.value) document.execCommand('fontName', false, fontFamily.value);
                saveSelection();
            });
        }

        const fontSize = document.getElementById(fontSizeId);
        if (fontSize) {
            fontSize.addEventListener('change', () => {
                restoreSelection();
                if (fontSize.value) document.execCommand('fontSize', false, fontSize.value);
                saveSelection();
            });
        }

        const heading = document.getElementById(headingId);
        if (heading) {
            heading.addEventListener('change', () => {
                restoreSelection();
                if (heading.value) document.execCommand('formatBlock', false, heading.value);
                else document.execCommand('formatBlock', false, 'p');
                heading.value = '';
                saveSelection();
            });
        }

        const textColor = document.getElementById(textColorId);
        if (textColor) {
            textColor.addEventListener('input', () => {
                restoreSelection();
                document.execCommand('foreColor', false, textColor.value);
                saveSelection();
            });
        }

        const bgColor = document.getElementById(bgColorId);
        if (bgColor) {
            bgColor.addEventListener('input', () => {
                restoreSelection();
                document.execCommand('hiliteColor', false, bgColor.value);
                saveSelection();
            });
        }
    }

    // AZ toolbar controls
    setupToolbarControls('rtFontFamily', 'rtFontSize', 'rtHeading', 'rtTextColor', 'rtBgColor');
    // RU toolbar controls
    setupToolbarControls('rtFontFamilyRu', 'rtFontSizeRu', 'rtHeadingRu', 'rtTextColorRu', 'rtBgColorRu');

    // Convert HTML from contenteditable to Contentful rich text document
    function htmlToRichText(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const content = [];

        function parseInline(node) {
            const marks = [];
            if (!node) return [];
            if (node.nodeType === 3) {
                const text = node.textContent;
                if (!text) return [];
                return [{ nodeType: 'text', value: text, marks: [], data: {} }];
            }
            if (node.nodeType !== 1) return [];

            const tag = node.tagName.toLowerCase();
            let currentMarks = [];
            if (tag === 'b' || tag === 'strong') currentMarks.push({ type: 'bold' });
            if (tag === 'i' || tag === 'em') currentMarks.push({ type: 'italic' });
            if (tag === 'u') currentMarks.push({ type: 'underline' });

            if (currentMarks.length > 0) {
                const results = [];
                node.childNodes.forEach(child => {
                    const children = parseInline(child);
                    children.forEach(c => {
                        c.marks = [...c.marks, ...currentMarks];
                        results.push(c);
                    });
                });
                return results;
            }

            // For spans and other inline elements
            const results = [];
            node.childNodes.forEach(child => {
                results.push(...parseInline(child));
            });
            return results;
        }

        function parseBlock(node) {
            if (node.nodeType === 3) {
                const text = node.textContent.trim();
                if (!text) return null;
                return { nodeType: 'paragraph', data: {}, content: [{ nodeType: 'text', value: text, marks: [], data: {} }] };
            }
            if (node.nodeType !== 1) return null;

            const tag = node.tagName.toLowerCase();

            if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
                const level = tag.charAt(1);
                const align = node.style && node.style.textAlign;
                const data = align && align !== 'left' && align !== 'start' ? { align: align } : {};
                return { nodeType: 'heading-' + level, data: data, content: parseInline(node).length ? parseInline(node) : [{ nodeType: 'text', value: '', marks: [], data: {} }] };
            }

            if (tag === 'blockquote') {
                const innerContent = [];
                node.childNodes.forEach(child => {
                    const block = parseBlock(child);
                    if (block) innerContent.push(block);
                });
                if (innerContent.length === 0) {
                    innerContent.push({ nodeType: 'paragraph', data: {}, content: parseInline(node).length ? parseInline(node) : [{ nodeType: 'text', value: '', marks: [], data: {} }] });
                }
                return { nodeType: 'blockquote', data: {}, content: innerContent };
            }

            if (tag === 'ul' || tag === 'ol') {
                const listType = tag === 'ul' ? 'unordered-list' : 'ordered-list';
                const items = [];
                node.querySelectorAll(':scope > li').forEach(li => {
                    items.push({
                        nodeType: 'list-item',
                        data: {},
                        content: [{ nodeType: 'paragraph', data: {}, content: parseInline(li).length ? parseInline(li) : [{ nodeType: 'text', value: '', marks: [], data: {} }] }]
                    });
                });
                return { nodeType: listType, data: {}, content: items };
            }

            if (tag === 'p' || tag === 'div') {
                const inline = parseInline(node);
                if (inline.length === 0) return null;
                const align = node.style && node.style.textAlign;
                const data = align && align !== 'left' && align !== 'start' ? { align: align } : {};
                return { nodeType: 'paragraph', data: data, content: inline };
            }

            // Fallback: treat as paragraph
            const inline = parseInline(node);
            if (inline.length === 0) return null;
            const align = node.style && node.style.textAlign;
            const data = align && align !== 'left' && align !== 'start' ? { align: align } : {};
            return { nodeType: 'paragraph', data: data, content: inline };
        }

        temp.childNodes.forEach(node => {
            const block = parseBlock(node);
            if (block) content.push(block);
        });

        // If empty, add empty paragraph
        if (content.length === 0) {
            content.push({ nodeType: 'paragraph', data: {}, content: [{ nodeType: 'text', value: '', marks: [], data: {} }] });
        }

        return { nodeType: 'document', data: {}, content: content };
    }

    // Submit new article
    // === EDIT ARTICLE FUNCTIONALITY ===
    let editingEntryId = null;

    // Convert Contentful rich text back to HTML for the editor
    function richTextToHtml(doc) {
        if (!doc || !doc.content) return '';
        function renderMarks(textNode) {
            let text = textNode.value || '';
            // Escape HTML
            text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (textNode.marks) {
                textNode.marks.forEach(m => {
                    if (m.type === 'bold') text = `<strong>${text}</strong>`;
                    if (m.type === 'italic') text = `<em>${text}</em>`;
                    if (m.type === 'underline') text = `<u>${text}</u>`;
                });
            }
            return text;
        }
        function renderNode(node) {
            if (node.nodeType === 'text') return renderMarks(node);
            const children = (node.content || []).map(renderNode).join('');
            const align = node.data && node.data.align;
            const alignStyle = align ? ` style="text-align:${align}"` : '';
            switch (node.nodeType) {
                case 'paragraph': return `<p${alignStyle}>${children}</p>`;
                case 'heading-1': return `<h1${alignStyle}>${children}</h1>`;
                case 'heading-2': return `<h2${alignStyle}>${children}</h2>`;
                case 'heading-3': return `<h3${alignStyle}>${children}</h3>`;
                case 'heading-4': return `<h4${alignStyle}>${children}</h4>`;
                case 'heading-5': return `<h5${alignStyle}>${children}</h5>`;
                case 'heading-6': return `<h6${alignStyle}>${children}</h6>`;
                case 'blockquote': return `<blockquote>${children}</blockquote>`;
                case 'unordered-list': return `<ul>${children}</ul>`;
                case 'ordered-list': return `<ol>${children}</ol>`;
                case 'list-item': return `<li>${children}</li>`;
                default: return children;
            }
        }
        return doc.content.map(renderNode).join('');
    }

    // Edit article: fetch full data from CMA via CDN and populate form
    window.editArticle = async function(entryId) {
        const statusEl = document.getElementById('articleStatus');
        statusEl.textContent = 'Məqalə yüklənir...';
        statusEl.style.color = 'var(--text-secondary)';

        // Switch to "Yeni Məqalə" tab
        document.querySelectorAll('.admin-tab-btn').forEach(b => {
            b.style.background = b.dataset.tab === 'contentful' ? 'var(--gold)' : '#fff';
            b.style.color = b.dataset.tab === 'contentful' ? '#fff' : 'var(--gold)';
            b.classList.toggle('active', b.dataset.tab === 'contentful');
        });
        document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
        document.getElementById('tabContentful').style.display = 'block';

        try {
            // Fetch entry with all locales
            const res = await fetch(
                `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries/${entryId}?access_token=${CONTENTFUL_TOKEN}&locale=*`
            );
            const entry = await res.json();
            if (entry.sys && entry.sys.type === 'Error') throw new Error(entry.message);

            const f = entry.fields;

            // Populate AZ fields
            document.getElementById('articleTitle').value = f.title?.az || '';
            document.getElementById('articleDate').value = f.date?.az || '';
            document.getElementById('articleContent').innerHTML = f.content?.az ? richTextToHtml(f.content.az) : '';

            // Populate RU fields if they exist
            const titleRuEl = document.getElementById('articleTitleRu');
            const dateRuEl = document.getElementById('articleDateRu');
            const contentRuEl = document.getElementById('articleContentRu');
            const ruFields = document.getElementById('ruLocaleFields');
            const ruContentField = document.getElementById('ruContentField');

            if (f.title?.ru || f.date?.ru || f.content?.ru) {
                if (ruFields) ruFields.style.display = 'flex';
                if (ruContentField) ruContentField.style.display = 'block';
                if (titleRuEl) titleRuEl.value = f.title?.ru || '';
                if (dateRuEl) dateRuEl.value = f.date?.ru || '';
                if (contentRuEl) contentRuEl.innerHTML = f.content?.ru ? richTextToHtml(f.content.ru) : '';
            }

            // Load SEO data from Firebase
            try {
                const seoSnap = await adminDb.ref('articleSeo/' + entryId).once('value');
                const seo = seoSnap.val() || {};
                const mdEl = document.getElementById('articleMetaDesc');
                const kwEl = document.getElementById('articleKeyword');
                const iaEl = document.getElementById('articleImageAlt');
                if (mdEl) { mdEl.value = seo.metaDesc || ''; document.getElementById('metaDescCount').textContent = (seo.metaDesc || '').length; }
                if (kwEl) kwEl.value = seo.keyword || '';
                if (iaEl) iaEl.value = seo.imageAlt || '';
                const mdRuEl = document.getElementById('articleMetaDescRu');
                const kwRuEl = document.getElementById('articleKeywordRu');
                if (mdRuEl) { mdRuEl.value = seo.metaDescRu || ''; const ctr = document.getElementById('metaDescCountRu'); if(ctr) ctr.textContent = (seo.metaDescRu || '').length; }
                if (kwRuEl) kwRuEl.value = seo.keywordRu || '';
            } catch(e) {}

            // Set edit mode
            editingEntryId = entryId;
            const submitBtn = document.getElementById('articleSubmitBtn');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Dəyişiklikləri Yadda Saxla';
            document.getElementById('cancelEditBtn').style.display = 'inline-flex';

            statusEl.textContent = 'Məqaləni redaktə edin və yadda saxlayın.';
            statusEl.style.color = 'var(--gold)';
        } catch (err) {
            statusEl.textContent = adminT('errorPrefix') + err.message;
            statusEl.style.color = '#e74c3c';
        }
    };

    // Cancel edit mode
    window.cancelEditMode = function() {
        editingEntryId = null;
        const submitBtn = document.getElementById('articleSubmitBtn');
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> ' + adminT('publishArticle');
        document.getElementById('cancelEditBtn').style.display = 'none';
        document.getElementById('articleStatus').textContent = '';

        // Reset form
        document.getElementById('newArticleForm').reset();
        document.getElementById('articleContent').innerHTML = '';
        const contentRuEl = document.getElementById('articleContentRu');
        if (contentRuEl) contentRuEl.innerHTML = '';
        const articleImagePreviewEl = document.getElementById('articleImagePreview');
        if (articleImagePreviewEl) articleImagePreviewEl.style.display = 'none';
    };

    const newArticleForm = document.getElementById('newArticleForm');
    if (newArticleForm) {
        newArticleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('articleSubmitBtn');
            const statusEl = document.getElementById('articleStatus');
            const title = document.getElementById('articleTitle').value.trim();
            const date = document.getElementById('articleDate').value.trim();
            const contentHtml = document.getElementById('articleContent').innerHTML;
            const imageFile = document.getElementById('articleImage').files[0];

            // SEO fields
            const metaDescEl = document.getElementById('articleMetaDesc');
            const keywordEl = document.getElementById('articleKeyword');
            const imageAltEl = document.getElementById('articleImageAlt');
            const metaDesc = metaDescEl ? metaDescEl.value.trim() : '';
            const keyword = keywordEl ? keywordEl.value.trim() : '';
            const imageAlt = imageAltEl ? imageAltEl.value.trim() : '';

            // Russian SEO fields
            const metaDescRuEl = document.getElementById('articleMetaDescRu');
            const keywordRuEl = document.getElementById('articleKeywordRu');
            const metaDescRu = metaDescRuEl ? metaDescRuEl.value.trim() : '';
            const keywordRu = keywordRuEl ? keywordRuEl.value.trim() : '';

            // Russian locale fields
            const titleRuEl = document.getElementById('articleTitleRu');
            const dateRuEl = document.getElementById('articleDateRu');
            const contentRuEl = document.getElementById('articleContentRu');
            const titleRu = titleRuEl ? titleRuEl.value.trim() : '';
            const dateRu = dateRuEl ? dateRuEl.value.trim() : '';
            const contentRuHtml = contentRuEl ? contentRuEl.innerHTML : '';

            if (!title || !date) {
                statusEl.textContent = 'Başlıq və tarix doldurulmalıdır.';
                statusEl.style.color = '#e74c3c';
                return;
            }

            submitBtn.disabled = true;
            statusEl.textContent = 'Göndərilir...';
            statusEl.style.color = 'var(--text-secondary)';

            try {
                let assetId = null;

                // Upload image if provided
                if (imageFile) {
                    statusEl.textContent = 'Şəkil yüklənir...';
                    const formData = new FormData();
                    formData.append('file', imageFile);
                    formData.append('fileName', imageFile.name);
                    const uploadRes = await fetch(WORKER_URL + '/upload-asset', {
                        method: 'POST',
                        body: formData,
                    });
                    const uploadData = await uploadRes.json();
                    if (uploadData.error) throw new Error(uploadData.error);
                    assetId = uploadData.assetId;
                }

                // Convert HTML to Contentful rich text
                const richText = htmlToRichText(contentHtml);

                // Russian rich text (if provided)
                let richTextRu = null;
                if (contentRuHtml && contentRuHtml !== '<br>' && contentRuHtml.trim()) {
                    richTextRu = htmlToRichText(contentRuHtml);
                }

                if (editingEntryId) {
                    // UPDATE existing entry
                    statusEl.textContent = 'Məqalə yenilənir...';
                    const entryRes = await fetch(WORKER_URL + '/update-entry', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ entryId: editingEntryId, title, date, content: richText, assetId, titleRu, dateRu, contentRu: richTextRu }),
                    });
                    const entryData = await entryRes.json();
                    if (entryData.error) throw new Error(entryData.error);

                    // Save raw HTML to Firebase for accurate rendering
                    const htmlData = { az: contentHtml };
                    if (contentRuHtml && contentRuHtml !== '<br>' && contentRuHtml.trim()) {
                        htmlData.ru = contentRuHtml;
                    }
                    await adminDb.ref('articleHtml/' + editingEntryId).set(htmlData);
                    const seoObj = { metaDesc, keyword, imageAlt };
                    if (metaDescRu) seoObj.metaDescRu = metaDescRu;
                    if (keywordRu) seoObj.keywordRu = keywordRu;
                    await adminDb.ref('articleSeo/' + editingEntryId).set(seoObj);

                    statusEl.textContent = 'Məqalə uğurla yeniləndi!';
                    statusEl.style.color = '#27ae60';
                    // Formu sıfırlamadan edit rejimində qal
                    fetchBlogPosts();
                } else {
                    // CREATE new entry
                    statusEl.textContent = 'Məqalə yaradılır...';
                    const entryRes = await fetch(WORKER_URL + '/create-entry', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, date, content: richText, assetId, titleRu, dateRu, contentRu: richTextRu }),
                    });
                    const entryData = await entryRes.json();
                    if (entryData.error) throw new Error(entryData.error);

                    // Save raw HTML to Firebase for accurate rendering
                    const newEntryId = entryData.entryId || entryData.id;
                    if (newEntryId) {
                        const htmlData = { az: contentHtml };
                        if (contentRuHtml && contentRuHtml !== '<br>' && contentRuHtml.trim()) {
                            htmlData.ru = contentRuHtml;
                        }
                        await adminDb.ref('articleHtml/' + newEntryId).set(htmlData);
                        const seoObj2 = { metaDesc, keyword, imageAlt };
                        if (metaDescRu) seoObj2.metaDescRu = metaDescRu;
                        if (keywordRu) seoObj2.keywordRu = keywordRu;
                        await adminDb.ref('articleSeo/' + newEntryId).set(seoObj2);
                    }

                    statusEl.textContent = 'Məqalə uğurla dərc edildi!';
                    statusEl.style.color = '#27ae60';
                    newArticleForm.reset();
                    document.getElementById('articleContent').innerHTML = '';
                    if (contentRuEl) contentRuEl.innerHTML = '';
                    if (titleRuEl) titleRuEl.value = '';
                    if (dateRuEl) dateRuEl.value = '';
                    if (metaDescEl) { metaDescEl.value = ''; document.getElementById('metaDescCount').textContent = '0'; }
                    if (keywordEl) keywordEl.value = '';
                    if (imageAltEl) imageAltEl.value = '';
                    if (metaDescRuEl) { metaDescRuEl.value = ''; const ctr = document.getElementById('metaDescCountRu'); if(ctr) ctr.textContent = '0'; }
                    if (keywordRuEl) keywordRuEl.value = '';
                    articleImagePreview.style.display = 'none';
                }

                // Refresh blog posts
                fetchBlogPosts();
            } catch (err) {
                statusEl.textContent = adminT('errorPrefix') + err.message;
                statusEl.style.color = '#e74c3c';
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // Load registered users from Firebase
    function loadAdminUsers() {
        const listEl = document.getElementById('adminUsersList');
        const countEl = document.getElementById('adminUsersCount');
        if (!listEl || typeof adminDb === 'undefined') return;

        listEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;"><i class="fas fa-spinner fa-spin"></i> ' + adminT('loading') + '</p>';

        adminDb.ref('users').once('value', snapshot => {
            const users = [];
            snapshot.forEach(userSnap => {
                users.push({
                    uid: userSnap.key,
                    ...userSnap.val()
                });
            });

            // Sort by newest first
            users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

            if (countEl) countEl.textContent = users.length + ' ' + adminT('userCount');

            if (users.length === 0) {
                listEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;">' + adminT('noUsers') + '</p>';
                return;
            }

            listEl.innerHTML = users.map(u => {
                const name = escapeAdminHtml((u.name || '') + ' ' + (u.surname || '')).trim() || adminT('unnamed');
                const email = escapeAdminHtml(u.email || '');
                const d = u.createdAt ? new Date(u.createdAt) : null;
                const date = d ? (String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear() + ' - ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0')) : '';
                const avatar = u.photoURL
                    ? `<img src="${u.photoURL}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
                    : `<div style="width:40px;height:40px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;">${name[0].toUpperCase()}</div>`;

                const isBanned = u.banned === true;
                const warnCount = u.warnings || 0;

                // Status badges
                let statusHtml = '';
                if (isBanned) {
                    statusHtml = '<span style="display:inline-block;padding:2px 8px;background:#e74c3c;color:#fff;border-radius:20px;font-size:0.7rem;font-weight:600;">' + adminT('banned') + '</span>';
                }
                if (warnCount > 0) {
                    statusHtml += ` <span style="display:inline-block;padding:2px 8px;background:#f39c12;color:#fff;border-radius:20px;font-size:0.7rem;font-weight:600;">${warnCount} ${adminT('warningCount')}</span>`;
                }

                // Ban/unban button
                const banBtn = isBanned
                    ? `<button onclick="adminUnbanUser('${u.uid}')" style="padding:6px 10px;background:#27ae60;color:#fff;border:none;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer;"><i class="fas fa-unlock"></i> ${adminT('unban')}</button>`
                    : `<button onclick="adminBanUser('${u.uid}','${name}')" style="padding:6px 10px;background:#e67e22;color:#fff;border:none;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer;"><i class="fas fa-ban"></i> ${adminT('ban')}</button>`;

                // Warning history
                let warningHistoryHtml = '';
                const warningList = u.warningList || [];
                if (warningList.length > 0) {
                    const warningItems = [...warningList].reverse().map(w => {
                        const wd = new Date(w.date);
                        const wDate = String(wd.getDate()).padStart(2,'0') + '.' + String(wd.getMonth()+1).padStart(2,'0') + '.' + wd.getFullYear() + ' - ' + String(wd.getHours()).padStart(2,'0') + ':' + String(wd.getMinutes()).padStart(2,'0');
                        const seenIcon = w.seen ? '<i class="fas fa-check" style="color:#27ae60;font-size:0.7rem;" title="' + adminT('seen') + '"></i>' : '<i class="fas fa-clock" style="color:#f39c12;font-size:0.7rem;" title="' + adminT('notSeen') + '"></i>';
                        return `
                            <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px;background:#fff;border-radius:8px;border-left:3px solid #f39c12;">
                                <div style="flex:1;">
                                    <div style="font-size:0.82rem;color:#333;line-height:1.4;">${escapeAdminHtml(w.reason)}</div>
                                    <div style="font-size:0.7rem;color:#999;margin-top:4px;">${wDate} ${seenIcon}</div>
                                </div>
                            </div>`;
                    }).join('');

                    warningHistoryHtml = `
                        <div id="warnHistory_${u.uid}" style="display:none;margin-top:10px;padding:12px;background:#fff9f0;border:1px solid #fde8c8;border-radius:10px;">
                            <div style="font-size:0.8rem;font-weight:600;color:#e67e22;margin-bottom:8px;"><i class="fas fa-history"></i> ${adminT('warningHistory')}</div>
                            <div style="display:flex;flex-direction:column;gap:6px;">${warningItems}</div>
                        </div>`;
                }

                // Toggle button for warning history
                const warnToggleBtn = warningList.length > 0
                    ? `<button onclick="document.getElementById('warnHistory_${u.uid}').style.display=document.getElementById('warnHistory_${u.uid}').style.display==='none'?'block':'none'" style="padding:6px 10px;background:#fff3e0;color:#e67e22;border:1px solid #fde8c8;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer;" title="Tarixçə"><i class="fas fa-history"></i> ${warningList.length}</button>`
                    : '';

                return `
                    <div style="border:1px solid ${isBanned ? '#f8cccc' : '#eee'};border-radius:12px;margin-bottom:10px;background:${isBanned ? '#fff5f5' : '#fafafa'};overflow:hidden;">
                        <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;">
                            ${avatar}
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:600;font-size:0.95rem;color:var(--text-primary);">${name} ${statusHtml}</div>
                                <div style="font-size:0.82rem;color:var(--text-muted);margin-top:2px;">${email}</div>
                                <div style="font-size:0.75rem;color:#999;margin-top:2px;">${date}</div>
                            </div>
                            <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">
                                ${warnToggleBtn}
                                <button onclick="adminWarnUser('${u.uid}','${name}')" style="padding:6px 10px;background:#f39c12;color:#fff;border:none;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer;"><i class="fas fa-exclamation-triangle"></i> ${adminT('warn')}</button>
                                ${banBtn}
                                <button onclick="adminDeleteUser('${u.uid}','${name}')" style="padding:6px 10px;background:#e74c3c;color:#fff;border:none;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer;"><i class="fas fa-trash"></i> ${adminT('deleteUser')}</button>
                            </div>
                        </div>
                        ${warningHistoryHtml}
                    </div>
                `;
            }).join('');
        });
    }

    // Warn user
    window.adminWarnUser = function(uid, name) {
        const reason = prompt(adminT('warnReasonPrompt') + ' (' + name + '):');
        if (!reason) return;

        adminDb.ref('users/' + uid).once('value', snap => {
            const data = snap.val();
            const currentWarnings = (data && data.warnings) || 0;
            const warningList = (data && data.warningList) || [];
            warningList.push({ reason: reason, date: Date.now() });

            adminDb.ref('users/' + uid).update({
                warnings: currentWarnings + 1,
                warningList: warningList
            }).then(() => {
                alert(name + ' ' + adminT('warnedAlert') + '\n' + reason);
                loadAdminUsers();
            });
        });
    };

    // Ban user (read-only, no commenting)
    window.adminBanUser = function(uid, name) {
        if (!confirm(name + ' ' + adminT('banConfirm'))) return;

        const reason = prompt(adminT('banReasonPrompt'));
        if (!reason) return;

        adminDb.ref('users/' + uid).update({
            banned: true,
            banReason: reason,
            banDate: Date.now()
        }).then(() => {
            alert(name + ' ' + adminT('bannedAlert'));
            loadAdminUsers();
        });
    };

    // Unban user
    window.adminUnbanUser = function(uid) {
        adminDb.ref('users/' + uid).update({
            banned: false,
            banReason: null,
            banDate: null
        }).then(() => {
            loadAdminUsers();
        });
    };

    // Delete user
    window.adminDeleteUser = function(uid, name) {
        if (!confirm(name + ' ' + adminT('deleteUserConfirm'))) return;

        // Delete user data from database
        adminDb.ref('users/' + uid).remove().then(() => {
            alert(name + ' ' + adminT('deletedAlert'));
            loadAdminUsers();
        });
    };

    // ===== STATISTICS =====
    function loadAdminStats() {
        const container = document.getElementById('adminStatsContent');
        if (!container || typeof adminDb === 'undefined') return;

        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;"><i class="fas fa-spinner fa-spin"></i> ' + adminT('loading') + '</p>';

        const now = new Date();
        const todayKey = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');

        // Generate date keys for ranges
        function dateKey(d) {
            return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        }
        // Week: Monday to Sunday (calendar week)
        const weekStartDate = new Date(now);
        const dayOfWeek = weekStartDate.getDay(); // 0=Sunday
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStartDate.setDate(weekStartDate.getDate() - diffToMonday);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        const weekStart = dateKey(weekStartDate);

        // Month: 1st to last day of current month
        const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthStart = dateKey(monthStartDate);

        // Formatted date strings for display
        function formatDate(d) {
            return String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear();
        }
        const todayDisplay = formatDate(now);
        const weekDisplay = formatDate(weekStartDate) + ' — ' + formatDate(weekEndDate);
        const monthDisplay = formatDate(monthStartDate) + ' — ' + formatDate(monthEndDate);

        Promise.all([
            adminDb.ref('siteTraffic/dailyCounts').once('value'),
            adminDb.ref('siteTraffic/visits/' + todayKey).once('value'),
            adminDb.ref('siteTraffic/activities').orderByChild('timestamp').limitToLast(30).once('value'),
            adminDb.ref('siteTraffic/clickStats').once('value')
        ]).then(([countsSnap, todayVisitsSnap, activitiesSnap, clickStatsSnap]) => {
            const dailyCounts = countsSnap.val() || {};

            // Calculate visitor counts
            let todayCount = dailyCounts[todayKey] || 0;
            let weekCount = 0, monthCount = 0;

            Object.keys(dailyCounts).forEach(key => {
                const count = dailyCounts[key] || 0;
                if (key >= monthStart) monthCount += count;
                if (key >= weekStart) weekCount += count;
            });

            // Calculate average session duration from today's visits
            const todayVisits = todayVisitsSnap.val() || {};
            let totalDuration = 0, durationCount = 0;
            Object.values(todayVisits).forEach(v => {
                if (v.duration && v.duration > 0) {
                    totalDuration += v.duration;
                    durationCount++;
                }
            });
            const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
            const avgMins = Math.floor(avgDuration / 60);
            const avgSecs = avgDuration % 60;
            const avgText = avgDuration > 0 ? (avgMins > 0 ? avgMins + ' dəq ' + avgSecs + ' san' : avgSecs + ' san') : '-';

            // Session durations list (today)
            const sessions = [];
            Object.values(todayVisits).forEach(v => {
                if (v.duration && v.duration > 0) {
                    const m = Math.floor(v.duration / 60);
                    const s = v.duration % 60;
                    const durText = m > 0 ? m + ' dəq ' + s + ' san' : s + ' san';
                    const enterDate = new Date(v.enteredAt);
                    const timeStr = String(enterDate.getHours()).padStart(2,'0') + ':' + String(enterDate.getMinutes()).padStart(2,'0');
                    sessions.push({
                        name: v.userName || (adminLang === 'ru' ? 'Аноним' : 'Anonim ziyarətçi'),
                        page: v.page || '/',
                        duration: durText,
                        time: timeStr,
                        rawDuration: v.duration,
                        enteredAt: v.enteredAt || 0
                    });
                }
            });
            sessions.sort((a, b) => b.enteredAt - a.enteredAt);

            // Activities
            const activities = [];
            activitiesSnap.forEach(snap => {
                activities.push(snap.val());
            });
            activities.reverse();

            // Build HTML
            let html = '';

            // Stat cards
            html += `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px;">
                <div style="background:linear-gradient(135deg,#27ae60,#2ecc71);border-radius:14px;padding:18px 16px;color:#fff;text-align:center;">
                    <div style="font-size:2rem;font-weight:800;">${todayCount}</div>
                    <div style="font-size:0.8rem;opacity:0.9;margin-top:4px;">${adminT('statToday')}</div>
                    <div style="font-size:0.7rem;opacity:0.7;margin-top:2px;">${todayDisplay}</div>
                </div>
                <div style="background:linear-gradient(135deg,#2980b9,#3498db);border-radius:14px;padding:18px 16px;color:#fff;text-align:center;">
                    <div style="font-size:2rem;font-weight:800;">${weekCount}</div>
                    <div style="font-size:0.8rem;opacity:0.9;margin-top:4px;">${adminT('statWeek')}</div>
                    <div style="font-size:0.65rem;opacity:0.7;margin-top:2px;">${weekDisplay}</div>
                </div>
                <div style="background:linear-gradient(135deg,#8e44ad,#9b59b6);border-radius:14px;padding:18px 16px;color:#fff;text-align:center;">
                    <div style="font-size:2rem;font-weight:800;">${monthCount}</div>
                    <div style="font-size:0.8rem;opacity:0.9;margin-top:4px;">${adminT('statMonth')}</div>
                    <div style="font-size:0.65rem;opacity:0.7;margin-top:2px;">${monthDisplay}</div>
                </div>
                <div style="background:linear-gradient(135deg,#2c3e50,#34495e);border-radius:14px;padding:18px 16px;color:#fff;text-align:center;">
                    <div style="font-size:1.4rem;font-weight:800;">${avgText}</div>
                    <div style="font-size:0.8rem;opacity:0.9;margin-top:4px;">${adminT('statAvgStay')}</div>
                </div>
            </div>`;

            // Reset buttons
            const resetBtnStyle = 'padding:6px 14px;border:none;border-radius:8px;font-size:0.75rem;font-weight:600;cursor:pointer;color:#fff;';
            html += `
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
                <button onclick="window._resetStats('today')" style="${resetBtnStyle}background:#e74c3c;"><i class="fas fa-eraser" style="margin-right:4px;"></i>${adminT('resetToday')}</button>
                <button onclick="window._resetStats('week')" style="${resetBtnStyle}background:#e67e22;"><i class="fas fa-eraser" style="margin-right:4px;"></i>${adminT('resetWeek')}</button>
                <button onclick="window._resetStats('month')" style="${resetBtnStyle}background:#8e44ad;"><i class="fas fa-eraser" style="margin-right:4px;"></i>${adminT('resetMonth')}</button>
                <button onclick="window._resetStats('activities')" style="${resetBtnStyle}background:#2980b9;"><i class="fas fa-eraser" style="margin-right:4px;"></i>${adminT('resetActivities')}</button>
                <button onclick="window._resetStats('all')" style="${resetBtnStyle}background:#2c3e50;"><i class="fas fa-trash-alt" style="margin-right:4px;"></i>${adminT('resetAll')}</button>
            </div>`;

            // ===== Potensial Müştərilər (Unique IP Click Stats) =====
            const clickStats = clickStatsSnap.val() || {};
            const mainClicks = clickStats.main || {};
            const blogClicks = clickStats.blog || {};

            function countUniqueIPs(obj) {
                return obj ? Object.keys(obj).length : 0;
            }

            const clickElements = [
                { key: 'seansaYazil', labelKey: 'clickSeansaYazil', icon: 'fa-calendar-check', color: '#27ae60' },
                { key: 'whatsapp_float', labelKey: 'clickWhatsappFloat', icon: 'fa-whatsapp', color: '#25d366' },
                { key: 'whatsapp_social', labelKey: 'clickWhatsappSocial', icon: 'fa-whatsapp', color: '#128c7e' },
                { key: 'calendar', labelKey: 'clickCalendar', icon: 'fa-calendar-day', color: '#2980b9' },
                { key: 'callForm', labelKey: 'clickCallForm', icon: 'fa-phone-alt', color: '#e67e22' },
                { key: 'tiktok', labelKey: 'clickTiktok', icon: 'fa-tiktok', color: '#000' },
                { key: 'facebook', labelKey: 'clickFacebook', icon: 'fa-facebook-f', color: '#1877f2' },
                { key: 'instagram', labelKey: 'clickInstagram', icon: 'fa-instagram', color: '#e4405f' },
                { key: 'youtube', labelKey: 'clickYoutube', icon: 'fa-youtube', color: '#ff0000' }
            ];

            html += `
            <div style="margin-bottom:24px;">
                <h4 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;">
                    <i class="fas fa-users" style="color:var(--gold);margin-right:6px;"></i>${adminT('potentialCustomers')} <span style="font-size:0.75rem;color:#999;font-weight:400;">${adminT('uniqueIpNote')}</span>
                </h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1.5px solid #e0e0e0;border-radius:12px;overflow:hidden;">
                    <div style="padding:12px 16px;background:linear-gradient(135deg,#f8f9fa,#fff);border-bottom:1px solid #e0e0e0;border-right:1px solid #e0e0e0;font-weight:700;font-size:0.82rem;color:var(--text-primary);text-align:center;">
                        <i class="fas fa-home" style="margin-right:4px;color:var(--gold);"></i> ${adminT('mainPage')}
                    </div>
                    <div style="padding:12px 16px;background:linear-gradient(135deg,#f8f9fa,#fff);border-bottom:1px solid #e0e0e0;font-weight:700;font-size:0.82rem;color:var(--text-primary);text-align:center;">
                        <i class="fas fa-blog" style="margin-right:4px;color:var(--gold);"></i> ${adminT('blogPage')}
                    </div>`;

            clickElements.forEach((el, i) => {
                const mainCount = countUniqueIPs(mainClicks[el.key]);
                const blogCount = countUniqueIPs(blogClicks[el.key]);
                const isLast = i === clickElements.length - 1;
                const borderBottom = isLast ? '' : 'border-bottom:1px solid #f0f0f0;';
                const iconClass = el.key === 'tiktok' || el.key === 'facebook' || el.key === 'instagram' || el.key === 'youtube' || el.key === 'whatsapp_float' || el.key === 'whatsapp_social' ? 'fab' : 'fas';

                html += `
                    <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;${borderBottom}border-right:1px solid #e0e0e0;font-size:0.82rem;">
                        <i class="${iconClass} ${el.icon}" style="color:${el.color};width:18px;text-align:center;"></i>
                        <span style="flex:1;color:var(--text-secondary);">${adminT(el.labelKey)}</span>
                        <span style="font-weight:800;font-size:1rem;color:${mainCount > 0 ? '#27ae60' : '#ccc'};">${mainCount}</span>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:center;padding:10px 16px;${borderBottom}font-size:0.82rem;">
                        <span style="font-weight:800;font-size:1rem;color:${blogCount > 0 ? '#27ae60' : '#ccc'};">${blogCount}</span>
                    </div>`;
            });

            // Total row
            let totalMain = 0, totalBlog = 0;
            clickElements.forEach(el => {
                totalMain += countUniqueIPs(mainClicks[el.key]);
                totalBlog += countUniqueIPs(blogClicks[el.key]);
            });

            html += `
                    <div style="padding:12px 16px;background:linear-gradient(135deg,#f0fff4,#e8faf0);border-top:2px solid var(--gold);border-right:1px solid #e0e0e0;font-weight:700;font-size:0.85rem;color:var(--text-primary);display:flex;align-items:center;justify-content:space-between;">
                        <span><i class="fas fa-chart-line" style="margin-right:6px;color:var(--gold);"></i>${adminT('totalLabel')}</span>
                        <span style="font-size:1.2rem;color:#27ae60;">${totalMain}</span>
                    </div>
                    <div style="padding:12px 16px;background:linear-gradient(135deg,#f0fff4,#e8faf0);border-top:2px solid var(--gold);font-weight:700;font-size:0.85rem;text-align:center;">
                        <span style="font-size:1.2rem;color:#27ae60;">${totalBlog}</span>
                    </div>
                </div>
                <button onclick="window._resetClickStats()" style="margin-top:10px;padding:6px 14px;border:none;border-radius:8px;font-size:0.75rem;font-weight:600;cursor:pointer;color:#fff;background:#e74c3c;"><i class="fas fa-eraser" style="margin-right:4px;"></i>${adminT('resetClickStats')}</button>
            </div>`;

            // Session durations (today)
            html += `
            <div style="margin-bottom:24px;">
                <h4 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:12px;"><i class="fas fa-clock" style="color:var(--gold);margin-right:6px;"></i>${adminT('todaySessions')} (${sessions.length})</h4>`;

            if (sessions.length > 0) {
                html += '<div style="display:flex;flex-direction:column;gap:6px;max-height:250px;overflow-y:auto;">';
                sessions.forEach(s => {
                    html += `
                    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8f9fa;border-radius:8px;font-size:0.82rem;">
                        <span style="color:var(--gold);font-weight:600;min-width:45px;">${s.time}</span>
                        <span style="font-weight:600;color:var(--text-primary);min-width:90px;">${escapeAdminHtml(s.name)}</span>
                        <span style="flex:1;color:var(--text-secondary);"><i class="fas fa-file-alt" style="margin-right:4px;color:#999;font-size:0.75rem;"></i>${escapeAdminHtml(s.page)}</span>
                        <span style="font-weight:700;color:#2c3e50;min-width:80px;text-align:right;">${s.duration}</span>
                    </div>`;
                });
                html += '</div>';
            } else {
                html += '<p style="color:#999;font-size:0.85rem;">' + adminT('noSessions') + '</p>';
            }
            html += '</div>';

            // Recent activities
            html += `
            <div>
                <h4 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:12px;"><i class="fas fa-stream" style="color:var(--gold);margin-right:6px;"></i>${adminT('recentActivities')}</h4>
                <div style="display:flex;flex-direction:column;gap:4px;max-height:350px;overflow-y:auto;">`;

            if (activities.length > 0) {
                const actionStyles = {
                    visit:    { icon: 'fa-sign-in-alt',         color: '#27ae60', bg: '#f0fff4' },
                    exit:     { icon: 'fa-sign-out-alt',        color: '#e74c3c', bg: '#fff5f5' },
                    click:    { icon: 'fa-mouse-pointer',       color: '#3498db', bg: '#f0f8ff' },
                    blog:     { icon: 'fa-newspaper',           color: '#8e44ad', bg: '#faf0ff' },
                    comment:  { icon: 'fa-comment',             color: '#e67e22', bg: '#fff9f0' },
                    like:     { icon: 'fa-thumbs-up',           color: '#27ae60', bg: '#f0fff4' },
                    dislike:  { icon: 'fa-thumbs-down',         color: '#e74c3c', bg: '#fff5f5' },
                    calendar: { icon: 'fa-calendar-check',      color: '#2980b9', bg: '#f0f8ff' },
                    form:     { icon: 'fa-phone-alt',           color: '#27ae60', bg: '#f0fff4' },
                    faq:      { icon: 'fa-question-circle',     color: '#f39c12', bg: '#fff9f0' },
                    tab:      { icon: 'fa-th-large',            color: '#95a5a6', bg: '#f8f9fa' },
                    lang:     { icon: 'fa-globe',               color: '#2980b9', bg: '#f0f8ff' },
                    auth:     { icon: 'fa-user',                color: '#8e44ad', bg: '#faf0ff' }
                };

                activities.forEach(a => {
                    const ad = new Date(a.timestamp);
                    const aTime = String(ad.getDate()).padStart(2,'0') + '.' + String(ad.getMonth()+1).padStart(2,'0') + ' ' + String(ad.getHours()).padStart(2,'0') + ':' + String(ad.getMinutes()).padStart(2,'0');
                    const style = actionStyles[a.action] || { icon: 'fa-circle', color: '#999', bg: '#f8f9fa' };
                    html += `
                    <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;font-size:0.8rem;background:${style.bg};">
                        <i class="fas ${style.icon}" style="color:${style.color};font-size:0.85rem;width:16px;text-align:center;"></i>
                        <span style="color:#999;min-width:75px;font-size:0.78rem;">${aTime}</span>
                        <span style="font-weight:600;color:var(--text-primary);min-width:100px;">${escapeAdminHtml(a.userName || (adminLang === 'ru' ? 'Аноним' : 'Anonim ziyarətçi'))}</span>
                        <span style="flex:1;color:var(--text-muted);">${escapeAdminHtml(a.details || a.action)}</span>
                    </div>`;
                });
            } else {
                html += '<p style="color:#999;font-size:0.85rem;">' + adminT('noActivities') + '</p>';
            }

            html += '</div></div>';

            container.innerHTML = html;
        }).catch(err => {
            container.innerHTML = '<p style="text-align:center;color:#e74c3c;padding:20px 0;">' + adminT('errorPrefix') + err.message + '</p>';
        });
    }

    // Reset stats function
    window._resetClickStats = function() {
        if (!confirm(adminT('confirmResetClicks'))) return;
        adminDb.ref('siteTraffic/clickStats').remove().then(() => {
            alert(adminT('clickStatsReset'));
            loadAdminStats();
        }).catch(err => {
            alert(adminT('errorPrefix') + err.message);
        });
    };

    window._resetStats = function(scope) {
        const labelKeys = {
            today: 'resetLabelToday',
            week: 'resetLabelWeek',
            month: 'resetLabelMonth',
            activities: 'resetLabelActivities',
            all: 'resetLabelAll'
        };
        if (!confirm(adminT(labelKeys[scope]) + adminT('resetConfirmSuffix'))) return;

        const now = new Date();
        function dk(d) {
            return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        }
        const todayKey = dk(now);

        // Week start (Monday)
        const ws = new Date(now);
        const dow = ws.getDay();
        ws.setDate(ws.getDate() - (dow === 0 ? 6 : dow - 1));

        const promises = [];

        if (scope === 'today' || scope === 'all') {
            promises.push(adminDb.ref('siteTraffic/visits/' + todayKey).remove());
            promises.push(adminDb.ref('siteTraffic/dailyCounts/' + todayKey).remove());
            promises.push(adminDb.ref('siteTraffic/uniqueVisitors/' + todayKey).remove());
        }

        if (scope === 'week' || scope === 'all') {
            // Delete each day of this week
            for (let i = 0; i < 7; i++) {
                const d = new Date(ws);
                d.setDate(d.getDate() + i);
                const key = dk(d);
                if (key > todayKey) break;
                promises.push(adminDb.ref('siteTraffic/visits/' + key).remove());
                promises.push(adminDb.ref('siteTraffic/dailyCounts/' + key).remove());
                promises.push(adminDb.ref('siteTraffic/uniqueVisitors/' + key).remove());
            }
        }

        if (scope === 'month' || scope === 'all') {
            // Delete each day of this month
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(now.getFullYear(), now.getMonth(), i);
                const key = dk(d);
                if (key > todayKey) break;
                promises.push(adminDb.ref('siteTraffic/visits/' + key).remove());
                promises.push(adminDb.ref('siteTraffic/dailyCounts/' + key).remove());
                promises.push(adminDb.ref('siteTraffic/uniqueVisitors/' + key).remove());
            }
        }

        if (scope === 'activities' || scope === 'all') {
            promises.push(adminDb.ref('siteTraffic/activities').remove());
        }

        if (scope === 'all') {
            promises.push(adminDb.ref('siteTraffic').remove());
        }

        Promise.all(promises).then(() => {
            alert(adminT('resetDone'));
            loadAdminStats();
        }).catch(err => {
            alert(adminT('errorPrefix') + err.message);
        });
    };

    // Meta description character counters
    const metaDescInput = document.getElementById('articleMetaDesc');
    const metaDescCounter = document.getElementById('metaDescCount');
    if (metaDescInput && metaDescCounter) {
        metaDescInput.addEventListener('input', function() {
            metaDescCounter.textContent = this.value.length;
            metaDescCounter.style.color = this.value.length > 155 ? '#e74c3c' : '#999';
        });
    }
    const metaDescInputRu = document.getElementById('articleMetaDescRu');
    const metaDescCounterRu = document.getElementById('metaDescCountRu');
    if (metaDescInputRu && metaDescCounterRu) {
        metaDescInputRu.addEventListener('input', function() {
            metaDescCounterRu.textContent = this.value.length;
            metaDescCounterRu.style.color = this.value.length > 155 ? '#e74c3c' : '#999';
        });
    }

});
