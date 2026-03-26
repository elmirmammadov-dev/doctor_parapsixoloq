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
    const FIREBASE_REST = 'https://hekim-sayti-comments-default-rtdb.firebaseio.com';

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
        const WARN_THRESHOLD_MB = 800;

        function estimateSize(val) {
            if (val === null || val === undefined) return 0;
            return new Blob([JSON.stringify(val)]).size;
        }

        // Use REST API instead of SDK to avoid WebSocket hang
        Promise.all([
            fetch(FIREBASE_REST + '/comments.json').then(r => r.json()).then(d => estimateSize(d)),
            fetch(FIREBASE_REST + '/siteTraffic.json').then(r => r.json()).then(d => estimateSize(d)),
            fetch(FIREBASE_REST + '/users.json').then(r => r.json()).then(d => estimateSize(d))
        ]).then(sizes => {
            const totalBytes = sizes[0] + sizes[1] + sizes[2];
            const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
            const pct = ((totalBytes / (1024 * 1024 * 1024)) * 100).toFixed(1);

            if (totalBytes >= WARN_THRESHOLD_MB * 1024 * 1024) {
                showStorageWarning(totalMB, pct);
            }

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

    // Tab init moved to after adminTranslations/adminT are defined (see below)

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
            tabAnnouncements: 'Elanlar',
            annAddNew: 'Yeni elan əlavə et',
            annTitle: 'Başlıq',
            annDesc: 'Açıqlama',
            annLink: 'Link (ixtiyari)',
            annImage: 'Şəkil',
            annChooseImg: 'Şəkil seç',
            annSave: 'Elanı saxla',
            annExisting: 'Mövcud elanlar:',
            annSaved: 'Elan yadda saxlandı!',
            annDeleted: 'Elan silindi!',
            annUploading: 'Şəkil yüklənir...',
            annSaving: 'Saxlanılır...',
            annDeleteConfirm: 'Bu elanı silmək istəyirsiniz?',
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
            confirmDeleteSelectedArticles: 'məqaləni silmək istədiyinizə əminsiniz?',
            confirmDeleteAllArticles: 'BÜTÜN məqalələri silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz!',
            deletingArticles: 'Məqalələr silinir...',
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
            tabAnnouncements: 'Объявления',
            annAddNew: 'Добавить объявление',
            annTitle: 'Заголовок',
            annDesc: 'Описание',
            annLink: 'Ссылка (необязательно)',
            annImage: 'Изображение',
            annChooseImg: 'Выбрать фото',
            annSave: 'Сохранить',
            annExisting: 'Существующие объявления:',
            annSaved: 'Объявление сохранено!',
            annDeleted: 'Объявление удалено!',
            annUploading: 'Загрузка изображения...',
            annSaving: 'Сохранение...',
            annDeleteConfirm: 'Удалить это объявление?',
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
            confirmDeleteSelectedArticles: 'статей — удалить выбранные?',
            confirmDeleteAllArticles: 'Удалить ВСЕ статьи? Это действие нельзя отменить!',
            deletingArticles: 'Удаление статей...',
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
        document.getElementById('tabAnnouncements').style.display = tab === 'announcements' ? 'block' : 'none';

        if (tab === 'articles') loadAdminArticles();
        if (tab === 'comments') loadAdminComments();
        if (tab === 'users') loadAdminUsers();
        if (tab === 'stats') loadAdminStats();
        if (tab === 'reviews') loadAdminReviews();
        if (tab === 'announcements') loadAdminAnnouncements();
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

    // Init admin panel - after all translations and functions are defined
    if (location.hash.startsWith('#admin-')) {
        const savedTab = location.hash.replace('#admin-', '');
        switchAdminTab(savedTab || 'contentful');
    } else {
        switchAdminTab('contentful');
    }
    setTimeout(function() { checkFirebaseStorage(); }, 2000);

    window.loadAdminReviews = function() {
        const list = document.getElementById('adminReviewsList');
        const countEl = document.getElementById('adminReviewsCount');
        const descEl = document.querySelector('#tabReviews p');
        if (!list) return;
        const t = getAdminReviewT();
        if (descEl) descEl.textContent = t.desc;
        list.innerHTML = `<p style="text-align:center;color:#999;padding:20px 0;">${t.loading}</p>`;

        fetch(FIREBASE_REST + '/reviews.json').then(function(r) { return r.json(); }).then(function(data) {
            const snapshot = { forEach: function(cb) { if(data) Object.keys(data).forEach(k => cb({ val: () => data[k], key: k })); } };
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
                            <p class="admin-review-text" id="reviewText_${r._key}" style="font-size:0.9rem;color:#333;line-height:1.6;margin:8px 0;word-break:break-word;overflow-wrap:break-word;">${r.text}</p>
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
        }).catch(function(err) {
            list.innerHTML = '<p style="text-align:center;color:#e74c3c;padding:20px 0;">Xəta: ' + err.message + '. Səhifəni yeniləyin.</p>';
        });
    };

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
            const articleLocale = LANG_TO_LOCALE[adminLang] || 'az';
            const res = await fetch(
                `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}/entries?access_token=${CONTENTFUL_TOKEN}&content_type=blogPost&include=1&order=-sys.createdAt&locale=${articleLocale}`
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

            // Fetch cover images from Firebase SEO
            let seoData = {};
            try {
                const seoSnap = await adminDb.ref('articleSeo').once('value');
                seoData = seoSnap.val() || {};
            } catch(e) {}

            listEl.innerHTML = '';
            adminSelectedArticles.clear();
            updateArticleSelectedCount();
            data.items.forEach(item => {
                const f = item.fields;
                const id = item.sys.id;
                const imgId = f.image && f.image.sys ? f.image.sys.id : null;
                let imgUrl = imgId ? assets[imgId] : null;
                // Prefer ImgBB cover image
                if (seoData[id] && seoData[id].coverImage) imgUrl = seoData[id].coverImage;

                const card = document.createElement('div');
                card.dataset.articleId = id;
                card.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #eee;border-radius:10px;margin-bottom:10px;background:#fafafa;';
                card.innerHTML = `
                    <input type="checkbox" class="admin-article-checkbox" data-id="${id}" onchange="toggleArticleSelect('${id}', this.checked)" style="width:18px;height:18px;cursor:pointer;flex-shrink:0;accent-color:#2e7d32;">
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
            const card = btn.closest('[data-article-id]');
            if (card) {
                adminSelectedArticles.delete(card.dataset.articleId);
                card.remove();
                updateArticleSelectedCount();
            }
            // Refresh blog posts on main page
            if (typeof fetchBlogPosts === 'function') fetchBlogPosts();
        } catch (err) {
            alert('Silmə xətası: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    // Article bulk select/delete
    let adminSelectedArticles = new Set();

    function updateArticleSelectedCount() {
        const countEl = document.getElementById('adminSelectedArticleCount');
        const btn = document.getElementById('adminDeleteSelectedArticles');
        if (countEl) countEl.textContent = adminSelectedArticles.size;
        if (btn) btn.style.display = adminSelectedArticles.size > 0 ? 'inline-flex' : 'none';
    }

    window.toggleArticleSelect = function(id, checked) {
        if (checked) adminSelectedArticles.add(id);
        else adminSelectedArticles.delete(id);
        updateArticleSelectedCount();
    };

    // Select all / deselect all articles
    const selectAllArticlesBtn = document.getElementById('adminSelectAllArticles');
    if (selectAllArticlesBtn) {
        selectAllArticlesBtn.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.admin-article-checkbox');
            const allChecked = adminSelectedArticles.size === checkboxes.length && checkboxes.length > 0;
            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
                const id = cb.dataset.id;
                if (!allChecked) adminSelectedArticles.add(id);
                else adminSelectedArticles.delete(id);
            });
            updateArticleSelectedCount();
        });
    }

    // Delete selected articles
    const deleteSelectedArticlesBtn = document.getElementById('adminDeleteSelectedArticles');
    if (deleteSelectedArticlesBtn) {
        deleteSelectedArticlesBtn.addEventListener('click', async function() {
            if (adminSelectedArticles.size === 0) return;
            if (!confirm(adminSelectedArticles.size + ' ' + adminT('confirmDeleteSelectedArticles'))) return;

            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + adminT('deletingArticles');

            try {
                for (const entryId of adminSelectedArticles) {
                    const res = await fetch(WORKER_URL + '/delete-entry', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ entryId }),
                    });
                    const data = await res.json();
                    if (data.error) console.error('Error deleting ' + entryId + ':', data.error);
                    // Remove card from UI
                    const card = document.querySelector(`[data-article-id="${entryId}"]`);
                    if (card) card.remove();
                }
                adminSelectedArticles.clear();
                updateArticleSelectedCount();
                if (typeof fetchBlogPosts === 'function') fetchBlogPosts();
            } catch (err) {
                alert('Silmə xətası: ' + err.message);
            }

            this.disabled = false;
            this.innerHTML = '<i class="fas fa-trash"></i> <span data-admin-i18n="deleteSelected">' + adminT('deleteSelected') + '</span> (<span id="adminSelectedArticleCount">0</span>)';
        });
    }

    // Delete all articles
    const deleteAllArticlesBtn = document.getElementById('adminDeleteAllArticles');
    if (deleteAllArticlesBtn) {
        deleteAllArticlesBtn.addEventListener('click', async function() {
            const allCards = document.querySelectorAll('[data-article-id]');
            if (allCards.length === 0) return;
            if (!confirm(adminT('confirmDeleteAllArticles'))) return;

            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + adminT('deletingArticles');

            try {
                for (const card of allCards) {
                    const entryId = card.dataset.articleId;
                    const res = await fetch(WORKER_URL + '/delete-entry', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ entryId }),
                    });
                    const data = await res.json();
                    if (data.error) console.error('Error deleting ' + entryId + ':', data.error);
                    card.remove();
                }
                adminSelectedArticles.clear();
                updateArticleSelectedCount();
                const listEl = document.getElementById('adminArticlesList');
                if (listEl && listEl.children.length === 0) {
                    listEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;">Heç bir məqalə tapılmadı.</p>';
                }
                if (typeof fetchBlogPosts === 'function') fetchBlogPosts();
            } catch (err) {
                alert('Silmə xətası: ' + err.message);
            }

            this.disabled = false;
            this.innerHTML = '<i class="fas fa-trash-alt"></i> <span data-admin-i18n="deleteAll">' + adminT('deleteAll') + '</span>';
        });
    }

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
        if (!listEl) return;

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

        fetch(FIREBASE_REST + '/comments.json').then(function(r) { return r.json(); }).then(function(data) {
            const allPosts = data || {};
            // Convert REST data to flat comments array directly
            const allCommentsRaw = [];
            Object.keys(allPosts).forEach(function(postId) {
                const postComments = allPosts[postId];
                if (postComments && typeof postComments === 'object') {
                    Object.keys(postComments).forEach(function(commentId) {
                        allCommentsRaw.push({
                            postId: postId,
                            commentId: commentId,
                            ...postComments[commentId]
                        });
                    });
                }
            });
            // Replace old snapshot-based code
            const allComments = allCommentsRaw;

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
                                <img src="profil-sekli-1.webp" style="width:20px;height:20px;border-radius:50%;object-fit:cover;object-position:top center;">
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
    const IMGBB_API_KEY = '4bb47b5bd678f51c6d670bdf0817dd1d';

    // Convert image to WebP + resize for SEO optimization
    function convertToWebP(file, quality, maxWidth) {
        quality = quality || 0.85;
        maxWidth = maxWidth || 1920;
        return new Promise(function(resolve) {
            var img = new Image();
            img.onload = function() {
                var w = img.width;
                var h = img.height;
                // Resize if wider than maxWidth
                if (w > maxWidth) {
                    h = Math.round(h * (maxWidth / w));
                    w = maxWidth;
                }
                var canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                URL.revokeObjectURL(img.src);
                canvas.toBlob(function(blob) {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
                    } else {
                        resolve(file);
                    }
                }, 'image/webp', quality);
            };
            img.onerror = function() { resolve(file); };
            img.src = URL.createObjectURL(file);
        });
    }

    // Upload image to ImgBB (auto-converts to WebP)
    async function uploadToImgBB(file) {
        // Convert to WebP before uploading
        const webpFile = await convertToWebP(file, 0.85);
        const formData = new FormData();
        formData.append('image', webpFile);
        const res = await fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message || 'Şəkil yüklənmədi');
        return data.data.url;
    }

    // Insert image into rich text editor
    // Image resize controls in editor
    function setupEditorImageResize(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        editor.addEventListener('click', function(e) {
            // If click is inside a resize bar or delete button, don't remove controls
            if (e.target.closest('.img-resize-bar') || e.target.closest('.img-inline-delete')) return;

            // Remove any existing resize controls and delete buttons
            document.querySelectorAll('.img-resize-bar').forEach(b => b.remove());
            document.querySelectorAll('.img-inline-delete').forEach(b => b.remove());
            document.querySelectorAll('.img-selected').forEach(i => { i.classList.remove('img-selected'); i.style.outline = ''; });

            if (e.target.tagName === 'IMG') {
                const img = e.target;
                img.classList.add('img-selected');
                img.style.outline = '2px solid #2d8157';
                // Add X delete button if not already wrapped
                if (!img.parentElement.classList.contains('editor-img-wrap')) {
                    var xBtn = document.createElement('button');
                    xBtn.type = 'button';
                    xBtn.innerHTML = '<i class="fas fa-times"></i>';
                    xBtn.className = 'img-inline-delete';
                    xBtn.style.cssText = 'position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:rgba(231,76,60,0.9);color:#fff;border:none;cursor:pointer;font-size:0.75rem;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:5;';
                    xBtn.onclick = function(ev) { ev.stopPropagation(); img.remove(); xBtn.remove(); };
                    img.style.position = 'relative';
                    img.parentNode.style.position = 'relative';
                    img.parentNode.insertBefore(xBtn, img.nextSibling);
                }

                const bar = document.createElement('div');
                bar.className = 'img-resize-bar';
                bar.contentEditable = 'false';
                bar.style.cssText = 'display:flex;gap:4px;align-items:center;padding:6px 8px;background:#f0faf5;border:1px solid #2d8157;border-radius:8px;margin:4px 0;font-size:0.75rem;flex-wrap:wrap;user-select:none;';
                var curWidth = parseInt(img.style.width) || 100;
                bar.innerHTML = `
                    <span style="color:#2d8157;font-weight:600;">Ölçü:</span>
                    <button type="button" onclick="resizeEditorImg(this,25)" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">25%</button>
                    <button type="button" onclick="resizeEditorImg(this,50)" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">50%</button>
                    <button type="button" onclick="resizeEditorImg(this,75)" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">75%</button>
                    <button type="button" onclick="resizeEditorImg(this,100)" style="padding:3px 8px;border:1px solid #2d8157;border-radius:4px;background:#e8f5e9;cursor:pointer;font-size:0.72rem;font-weight:600;">100%</button>
                    <input type="number" min="1" max="100" value="${curWidth}" onchange="resizeEditorImg(this,this.value)" style="width:54px;padding:4px 2px 4px 6px;border:1px solid #ddd;border-radius:4px;font-size:0.78rem;text-align:center;line-height:1;" title="Xüsusi ölçü (%)">
                    <span style="font-size:0.68rem;color:#999;">%</span>
                    <span style="color:#999;">|</span>
                    <span style="color:#2d8157;font-weight:600;">Hizalama:</span>
                    <button type="button" onclick="alignEditorImg(this,'left')" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">Sol</button>
                    <button type="button" onclick="alignEditorImg(this,'center')" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">Orta</button>
                    <button type="button" onclick="alignEditorImg(this,'right')" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">Sağ</button>
                    <span style="color:#999;">|</span>
                    <button type="button" onclick="removeEditorImg(this)" style="padding:3px 8px;border:1px solid #e74c3c;border-radius:4px;background:#ffeaea;cursor:pointer;font-size:0.72rem;color:#e74c3c;">Sil</button>
                    <span style="color:#999;">|</span>
                    <button type="button" onclick="closeImgResizeBar(this)" style="padding:3px 6px;border:1px solid #999;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;color:#666;" title="Bağla">✕</button>
                `;
                bar.addEventListener('click', function(ev) { ev.stopPropagation(); });
                bar.addEventListener('mousedown', function(ev) { ev.stopPropagation(); });
                img.parentNode.insertBefore(bar, img.nextSibling);
            }
        });
    }

    window.resizeEditorImg = function(btn, pct) {
        const bar = btn.closest('.img-resize-bar');
        const img = bar ? bar.previousElementSibling : null;
        if (img && img.tagName === 'IMG') {
            img.style.maxWidth = pct + '%';
            img.style.width = pct + '%';
        }
    };

    window.alignEditorImg = function(btn, align) {
        const bar = btn.closest('.img-resize-bar');
        const img = bar ? bar.previousElementSibling : null;
        if (img && img.tagName === 'IMG') {
            // Reset all
            img.style.float = 'none';
            img.style.marginLeft = '';
            img.style.marginRight = '';
            img.style.display = 'block';
            if (align === 'center') {
                img.style.marginLeft = 'auto';
                img.style.marginRight = 'auto';
            } else if (align === 'right') {
                img.style.float = 'right';
                img.style.marginLeft = '12px';
                img.style.marginBottom = '8px';
            } else {
                img.style.float = 'left';
                img.style.marginRight = '12px';
                img.style.marginBottom = '8px';
            }
        }
    };

    window.closeImgResizeBar = function(btn) {
        const bar = btn.closest('.img-resize-bar');
        const img = bar ? bar.previousElementSibling : null;
        if (img) { img.classList.remove('img-selected'); img.style.outline = ''; }
        // Remove associated delete button too
        if (bar && bar.nextElementSibling && bar.nextElementSibling.classList.contains('img-inline-delete')) {
            bar.nextElementSibling.remove();
        }
        if (img && img.nextElementSibling && img.nextElementSibling.classList.contains('img-inline-delete')) {
            img.nextElementSibling.remove();
        }
        if (bar) bar.remove();
    };

    window.removeEditorImg = function(btn) {
        const bar = btn.closest('.img-resize-bar');
        const img = bar ? bar.previousElementSibling : null;
        if (img && img.tagName === 'IMG') img.remove();
        if (bar) bar.remove();
    };

    // Setup resize for both editors
    setupEditorImageResize('articleContent');
    setupEditorImageResize('articleContentRu');

    window.insertImageToEditor = function(editorId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async function() {
            const file = input.files[0];
            if (!file) return;

            // Ask for alt text via prompt
            const altText = prompt('Şəkil üçün alt mətn yazın (SEO üçün vacib):', file.name.replace(/\.[^.]+$/, '')) || file.name.replace(/\.[^.]+$/, '');

            const editor = document.getElementById(editorId);
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'text-align:center;padding:10px;color:#999;font-size:0.8rem;';
            placeholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Şəkil yüklənir...';
            editor.appendChild(placeholder);
            try {
                const url = await uploadToImgBB(file);
                placeholder.remove();
                const wrap = document.createElement('div');
                wrap.style.cssText = 'position:relative;display:inline-block;max-width:100%;margin:8px 0;';
                wrap.className = 'editor-img-wrap';
                const img = document.createElement('img');
                img.src = url;
                img.alt = altText;
                img.style.cssText = 'max-width:100%;height:auto;border-radius:8px;display:block;';
                const xBtn = document.createElement('button');
                xBtn.type = 'button';
                xBtn.innerHTML = '<i class="fas fa-times"></i>';
                xBtn.style.cssText = 'position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:rgba(231,76,60,0.9);color:#fff;border:none;cursor:pointer;font-size:0.75rem;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:5;';
                xBtn.title = 'Şəkli sil';
                xBtn.onclick = function() { wrap.remove(); };
                wrap.appendChild(img);
                wrap.appendChild(xBtn);
                const sel = window.getSelection();
                if (sel.rangeCount && editor.contains(sel.anchorNode)) {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(wrap);
                    range.collapse(false);
                } else {
                    editor.appendChild(wrap);
                }
                editor.appendChild(document.createElement('br'));
            } catch (err) {
                placeholder.innerHTML = '<span style="color:#e74c3c;">Xəta: ' + err.message + '</span>';
                setTimeout(() => placeholder.remove(), 3000);
            }
        };
        input.click();
    }

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
    const coverPreviewWrap = document.getElementById('coverPreviewWrap');
    const coverPreviewCard = document.getElementById('coverPreviewCard');
    let coverPosX = 50, coverPosY = 50, coverZoom = 1;

    function updateCoverLabel() {
        var lbl = document.getElementById('coverPosLabel');
        if (lbl) lbl.textContent = coverPosX.toFixed(0) + '% ' + coverPosY.toFixed(0) + '% | Zoom: ' + (coverZoom * 100).toFixed(0) + '%';
    }
    function applyCoverView() {
        if (!coverPreviewCard) return;
        // Calculate background-size to achieve cover + zoom
        var img = articleImagePreview;
        var natW = img.naturalWidth, natH = img.naturalHeight;
        if (natW && natH) {
            var contW = 220, contH = 220;
            var coverScale = Math.max(contW / natW, contH / natH);
            var bgW = natW * coverScale * coverZoom;
            var bgH = natH * coverScale * coverZoom;
            coverPreviewCard.style.backgroundSize = bgW.toFixed(0) + 'px ' + bgH.toFixed(0) + 'px';
        } else {
            coverPreviewCard.style.backgroundSize = (coverZoom * 100) + '%';
        }
        coverPreviewCard.style.backgroundPosition = coverPosX.toFixed(1) + '% ' + coverPosY.toFixed(1) + '%';
    }

    if (articleImageInput) {
        articleImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    var dataUrl = ev.target.result;
                    articleImagePreview.src = dataUrl;
                    articleImagePreview.onload = function() {
                        coverPreviewCard.style.backgroundImage = 'url(' + dataUrl + ')';
                        if (coverPreviewWrap) coverPreviewWrap.style.display = 'block';
                        coverPosX = 50; coverPosY = 50; coverZoom = 1;
                        applyCoverView();
                        updateCoverLabel();
                    };
                };
                reader.readAsDataURL(file);
            } else {
                if (coverPreviewWrap) coverPreviewWrap.style.display = 'none';
            }
        });
    }

    // Drag to reposition cover image
    if (coverPreviewCard) {
        let dragging = false, startX, startY, startPosX, startPosY;
        coverPreviewCard.addEventListener('mousedown', function(e) {
            if (e.target.closest('button')) return;
            dragging = true; startX = e.clientX; startY = e.clientY;
            startPosX = coverPosX; startPosY = coverPosY;
            coverPreviewCard.style.cursor = 'grabbing';
            e.preventDefault();
        });
        coverPreviewCard.addEventListener('touchstart', function(e) {
            if (e.target.closest('button')) return;
            dragging = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY;
            startPosX = coverPosX; startPosY = coverPosY;
            e.preventDefault();
        }, {passive: false});
        document.addEventListener('mousemove', function(e) {
            if (!dragging) return;
            var dx = e.clientX - startX, dy = e.clientY - startY;
            // Sensitivity scales with zoom — more zoom = finer control
            var sens = 0.3 / coverZoom;
            coverPosX = Math.max(0, Math.min(100, startPosX - dx * sens));
            coverPosY = Math.max(0, Math.min(100, startPosY - dy * sens));
            applyCoverView();
            updateCoverLabel();
        });
        document.addEventListener('touchmove', function(e) {
            if (!dragging) return;
            var dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
            var sens = 0.3 / coverZoom;
            coverPosX = Math.max(0, Math.min(100, startPosX - dx * sens));
            coverPosY = Math.max(0, Math.min(100, startPosY - dy * sens));
            applyCoverView();
            updateCoverLabel();
        }, {passive: false});
        document.addEventListener('mouseup', function() { dragging = false; if (coverPreviewCard) coverPreviewCard.style.cursor = 'grab'; });
        document.addEventListener('touchend', function() { dragging = false; });

        // Scroll to zoom
        coverPreviewCard.addEventListener('wheel', function(e) {
            e.preventDefault();
            var delta = e.deltaY > 0 ? -0.05 : 0.05;
            coverZoom = Math.max(1, Math.min(3, coverZoom + delta));
            applyCoverView();
            updateCoverLabel();
        }, {passive: false});
    }

    window.resetCoverPos = function() {
        coverPosX = 50; coverPosY = 50; coverZoom = 1;
        applyCoverView();
        updateCoverLabel();
    };

    // Cover image resize controls
    if (articleImagePreview) {
        articleImagePreview.addEventListener('click', function() {
            var oldBar = document.getElementById('coverImgResizeBar');
            if (oldBar) { oldBar.remove(); return; }
            var img = articleImagePreview;
            var curW = parseInt(img.style.maxWidth) || 100;
            var bar = document.createElement('div');
            bar.id = 'coverImgResizeBar';
            bar.style.cssText = 'display:flex;gap:4px;align-items:center;padding:6px 8px;background:#f0faf5;border:1px solid #2d8157;border-radius:8px;margin:4px 0;font-size:0.75rem;flex-wrap:wrap;';
            bar.innerHTML = '<span style="color:#2d8157;font-weight:600;">Ölçü:</span>'
                + '<button type="button" onclick="resizeCoverImg(25)" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">25%</button>'
                + '<button type="button" onclick="resizeCoverImg(50)" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">50%</button>'
                + '<button type="button" onclick="resizeCoverImg(75)" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">75%</button>'
                + '<button type="button" onclick="resizeCoverImg(100)" style="padding:3px 8px;border:1px solid #2d8157;border-radius:4px;background:#e8f5e9;cursor:pointer;font-size:0.72rem;font-weight:600;">100%</button>'
                + '<input type="number" min="1" max="100" value="' + curW + '" onchange="resizeCoverImg(this.value)" style="width:54px;padding:4px 2px 4px 6px;border:1px solid #ddd;border-radius:4px;font-size:0.78rem;text-align:center;line-height:1;" title="Xüsusi ölçü (%)">'
                + '<span style="font-size:0.68rem;color:#999;">%</span>'
                + '<span style="color:#999;">|</span>'
                + '<span style="color:#2d8157;font-weight:600;">Hizalama:</span>'
                + '<button type="button" onclick="alignCoverImg(\'left\')" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">Sol</button>'
                + '<button type="button" onclick="alignCoverImg(\'center\')" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">Orta</button>'
                + '<button type="button" onclick="alignCoverImg(\'right\')" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:0.72rem;">Sağ</button>'
                + '<span style="color:#999;">|</span>'
                + '<button type="button" onclick="removeCoverImg()" style="padding:3px 8px;border:1px solid #e74c3c;border-radius:4px;background:#ffeaea;cursor:pointer;font-size:0.72rem;color:#e74c3c;">Sil</button>';
            img.parentNode.insertBefore(bar, img.nextSibling);
        });
    }

    window.resizeCoverImg = function(pct) {
        var img = document.getElementById('articleImagePreview');
        if (img) { img.style.maxWidth = pct + '%'; img.style.width = pct + '%'; }
    };
    window.alignCoverImg = function(align) {
        var img = document.getElementById('articleImagePreview');
        if (!img) return;
        if (align === 'center') { img.style.marginLeft = 'auto'; img.style.marginRight = 'auto'; img.style.display = 'block'; }
        else if (align === 'right') { img.style.marginLeft = 'auto'; img.style.marginRight = '0'; img.style.display = 'block'; }
        else { img.style.marginLeft = '0'; img.style.marginRight = 'auto'; img.style.display = 'block'; }
    };
    window.removeCoverImg = function() {
        var img = document.getElementById('articleImagePreview');
        if (img) img.src = '';
        var card = document.getElementById('coverPreviewCard');
        if (card) { card.style.backgroundImage = ''; card.style.backgroundSize = 'cover'; card.style.backgroundPosition = '50% 50%'; }
        var inp = document.getElementById('articleImage');
        if (inp) inp.value = '';
        var bar = document.getElementById('coverImgResizeBar');
        if (bar) bar.remove();
        var wrap = document.getElementById('coverPreviewWrap');
        if (wrap) wrap.style.display = 'none';
        coverPosX = 50; coverPosY = 50; coverZoom = 1;
        updateCoverLabel();
    };

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

    // Force default paragraph separator to <p> instead of <div>
    document.execCommand('defaultParagraphSeparator', false, 'p');

    // Ensure editors always wrap text in <p> tags
    function ensureParagraphWrapping(editor) {
        // On focus: if empty, start with a <p>
        editor.addEventListener('focus', function() {
            if (!editor.innerHTML.trim() || editor.innerHTML.trim() === '<br>') {
                editor.innerHTML = '<p><br></p>';
                // Place cursor inside the <p>
                const sel = window.getSelection();
                const range = document.createRange();
                range.setStart(editor.firstChild, 0);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });

        // On input: convert any top-level naked text or <div> to <p>
        editor.addEventListener('input', function() {
            let changed = false;
            Array.from(editor.childNodes).forEach(node => {
                // Wrap naked text nodes (non-whitespace) in <p>
                if (node.nodeType === 3 && node.textContent.trim()) {
                    const p = document.createElement('p');
                    editor.insertBefore(p, node);
                    p.appendChild(node);
                    changed = true;
                }
                // Convert <div> to <p>
                if (node.nodeType === 1 && node.tagName === 'DIV' && !node.classList.contains('editor-img-wrap')) {
                    const p = document.createElement('p');
                    p.innerHTML = node.innerHTML;
                    // Copy alignment style if present
                    if (node.style.textAlign) p.style.textAlign = node.style.textAlign;
                    editor.replaceChild(p, node);
                    changed = true;
                }
            });
            if (changed) saveSelection();
        });

        // On paste: clean up after a short delay
        editor.addEventListener('paste', function() {
            setTimeout(() => {
                Array.from(editor.childNodes).forEach(node => {
                    if (node.nodeType === 3 && node.textContent.trim()) {
                        const p = document.createElement('p');
                        editor.insertBefore(p, node);
                        p.appendChild(node);
                    }
                    if (node.nodeType === 1 && node.tagName === 'DIV' && !node.classList.contains('editor-img-wrap')) {
                        const p = document.createElement('p');
                        p.innerHTML = node.innerHTML;
                        if (node.style.textAlign) p.style.textAlign = node.style.textAlign;
                        editor.replaceChild(p, node);
                    }
                });
            }, 0);
        });
    }

    // Save selection when editors lose focus (before toolbar click)
    ['articleContent', 'articleContentRu'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            ensureParagraphWrapping(el);
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
                document.execCommand('formatBlock', false, heading.value || 'p');
                heading.value = 'p';
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

            // Load raw HTML from Firebase (preserves images and formatting)
            let firebaseHtml = null;
            try {
                const htmlRes = await fetch(FIREBASE_REST + '/articleHtml/' + entryId + '.json');
                firebaseHtml = await htmlRes.json();
            } catch(e) {}

            if (firebaseHtml && firebaseHtml.az) {
                document.getElementById('articleContent').innerHTML = firebaseHtml.az;
            } else {
                document.getElementById('articleContent').innerHTML = f.content?.az ? richTextToHtml(f.content.az) : '';
            }

            // Populate RU fields if they exist
            const titleRuEl = document.getElementById('articleTitleRu');
            const dateRuEl = document.getElementById('articleDateRu');
            const contentRuEl = document.getElementById('articleContentRu');
            const ruFields = document.getElementById('ruLocaleFields');
            const ruContentField = document.getElementById('ruContentField');

            if (f.title?.ru || f.date?.ru || f.content?.ru || (firebaseHtml && firebaseHtml.ru)) {
                if (ruFields) ruFields.style.display = 'flex';
                if (ruContentField) ruContentField.style.display = 'block';
                if (titleRuEl) titleRuEl.value = f.title?.ru || '';
                if (dateRuEl) dateRuEl.value = f.date?.ru || '';
                if (contentRuEl) {
                    if (firebaseHtml && firebaseHtml.ru) {
                        contentRuEl.innerHTML = firebaseHtml.ru;
                    } else {
                        contentRuEl.innerHTML = f.content?.ru ? richTextToHtml(f.content.ru) : '';
                    }
                }
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
                const slEl = document.getElementById('articleSlug');
                if (slEl) { slEl.value = seo.slug || ''; slugManuallyEdited = true; }
                const mdRuEl = document.getElementById('articleMetaDescRu');
                const kwRuEl = document.getElementById('articleKeywordRu');
                if (mdRuEl) { mdRuEl.value = seo.metaDescRu || ''; const ctr = document.getElementById('metaDescCountRu'); if(ctr) ctr.textContent = (seo.metaDescRu || '').length; }
                if (kwRuEl) kwRuEl.value = seo.keywordRu || '';
                const iaRuEl = document.getElementById('articleImageAltRu');
                if (iaRuEl) iaRuEl.value = seo.imageAltRu || '';
                // Show cover image preview if exists
                const previewEl = document.getElementById('articleImagePreview');
                const wrapEl = document.getElementById('coverPreviewWrap');
                if (previewEl && seo.coverImage) {
                    previewEl.src = seo.coverImage;
                    var cardEl = document.getElementById('coverPreviewCard');
                    if (cardEl) cardEl.style.backgroundImage = 'url(' + seo.coverImage + ')';
                    if (wrapEl) wrapEl.style.display = 'block';
                    if (seo.coverPos) {
                        var parts = seo.coverPos.split('%');
                        coverPosX = parseFloat(parts[0]) || 50;
                        coverPosY = parseFloat(parts[1]) || 50;
                    }
                    coverZoom = seo.coverZoom || 1;
                    // Wait for image to load natural dimensions, then apply view
                    previewEl.onload = function() { applyCoverView(); updateCoverLabel(); };
                    applyCoverView();
                    updateCoverLabel();
                }
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
        // Reset cover image preview
        var coverWrap2 = document.getElementById('coverPreviewWrap');
        var coverCard2 = document.getElementById('coverPreviewCard');
        if (coverWrap2) coverWrap2.style.display = 'none';
        if (coverCard2) { coverCard2.style.backgroundImage = ''; coverCard2.style.backgroundPosition = ''; coverCard2.style.backgroundSize = ''; }
        coverPosX = 50; coverPosY = 50; coverZoom = 1;
        var posLabel2 = document.getElementById('coverPosLabel');
        if (posLabel2) posLabel2.textContent = 'Pozisiya: 50.0% 50.0% | Zoom: 100%';
    };

    // Clean editor HTML: convert <font> tags to <span>, <div> to <p>, remove editor artifacts
    function cleanEditorHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;

        // Remove editor delete buttons (image remove buttons)
        tmp.querySelectorAll('button').forEach(btn => btn.remove());

        // Remove Word artifacts: <o:p>, MsoNormal class
        tmp.querySelectorAll('o\\:p').forEach(el => el.replaceWith(el.textContent));
        tmp.querySelectorAll('[class*="Mso"]').forEach(el => el.removeAttribute('class'));

        // Convert <font> to <span> with proper styles
        const fontSizeMap = { '1': '0.625rem', '2': '0.8125rem', '3': '1rem', '4': '1.125rem', '5': '1.5rem', '6': '2rem', '7': '2.25rem' };
        tmp.querySelectorAll('font').forEach(font => {
            const span = document.createElement('span');
            const styles = [];
            if (font.size) styles.push('font-size:' + (fontSizeMap[font.size] || '1rem'));
            if (font.color) styles.push('color:' + font.color);
            if (font.face) styles.push('font-family:' + font.face);
            if (styles.length) span.style.cssText = styles.join(';');
            span.innerHTML = font.innerHTML;
            font.replaceWith(span);
        });

        // Convert top-level <div> to <p> (skip image wrappers)
        Array.from(tmp.children).forEach(node => {
            if (node.tagName === 'DIV' && !node.classList.contains('editor-img-wrap')) {
                const p = document.createElement('p');
                p.innerHTML = node.innerHTML;
                if (node.style.textAlign) p.style.textAlign = node.style.textAlign;
                node.replaceWith(p);
            }
        });

        return tmp.innerHTML;
    }

    // Auto-generate slug from title
    function generateSlug(text) {
        const azMap = {'ə':'e','ı':'i','ö':'o','ü':'u','ş':'s','ç':'c','ğ':'g','Ə':'e','I':'i','İ':'i','Ö':'o','Ü':'u','Ş':'s','Ç':'c','Ğ':'g'};
        return text.toLowerCase().replace(/[əıöüşçğƏIİÖÜŞÇĞ]/g, c => azMap[c] || c)
            .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    const articleTitleEl = document.getElementById('articleTitle');
    const articleSlugEl = document.getElementById('articleSlug');
    let slugManuallyEdited = false;
    if (articleSlugEl) {
        articleSlugEl.addEventListener('input', function() { slugManuallyEdited = true; });
    }
    if (articleTitleEl && articleSlugEl) {
        articleTitleEl.addEventListener('input', function() {
            if (!slugManuallyEdited && !editingEntryId) {
                articleSlugEl.value = generateSlug(articleTitleEl.value);
            }
        });
    }

    const newArticleForm = document.getElementById('newArticleForm');
    if (newArticleForm) {
        newArticleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('articleSubmitBtn');
            const statusEl = document.getElementById('articleStatus');
            const title = document.getElementById('articleTitle').value.trim();
            const date = document.getElementById('articleDate').value.trim();
            const contentHtml = cleanEditorHtml(document.getElementById('articleContent').innerHTML);
            const imageFile = document.getElementById('articleImage').files[0];

            // SEO fields
            const metaDescEl = document.getElementById('articleMetaDesc');
            const keywordEl = document.getElementById('articleKeyword');
            const imageAltEl = document.getElementById('articleImageAlt');
            const slugEl = document.getElementById('articleSlug');
            const metaDesc = metaDescEl ? metaDescEl.value.trim() : '';
            const keyword = keywordEl ? keywordEl.value.trim() : '';
            const imageAlt = imageAltEl ? imageAltEl.value.trim() : '';
            const articleSlug = slugEl ? slugEl.value.trim() : '';

            // Russian SEO fields
            const metaDescRuEl = document.getElementById('articleMetaDescRu');
            const keywordRuEl = document.getElementById('articleKeywordRu');
            const imageAltRuEl = document.getElementById('articleImageAltRu');
            const metaDescRu = metaDescRuEl ? metaDescRuEl.value.trim() : '';
            const keywordRu = keywordRuEl ? keywordRuEl.value.trim() : '';
            const imageAltRu = imageAltRuEl ? imageAltRuEl.value.trim() : '';

            // Russian locale fields
            const titleRuEl = document.getElementById('articleTitleRu');
            const dateRuEl = document.getElementById('articleDateRu');
            const contentRuEl = document.getElementById('articleContentRu');
            const titleRu = titleRuEl ? titleRuEl.value.trim() : '';
            const dateRu = dateRuEl ? dateRuEl.value.trim() : '';
            const contentRuHtml = contentRuEl ? cleanEditorHtml(contentRuEl.innerHTML) : '';

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
                let coverImageUrl = null;

                // Upload cover image to ImgBB if provided
                if (imageFile) {
                    statusEl.textContent = 'Şəkil yüklənir (ImgBB)...';
                    coverImageUrl = await uploadToImgBB(imageFile);
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
                        body: JSON.stringify({ entryId: editingEntryId, title, date, content: richText, assetId: null, titleRu, dateRu, contentRu: richTextRu }),
                    });
                    const entryData = await entryRes.json();
                    if (entryData.error) throw new Error(entryData.error);

                    // Save raw HTML to Firebase for accurate rendering
                    const htmlData = { az: contentHtml };
                    if (contentRuHtml && contentRuHtml !== '<br>' && contentRuHtml.trim()) {
                        htmlData.ru = contentRuHtml;
                    }
                    await adminDb.ref('articleHtml/' + editingEntryId).set(htmlData);
                    const seoObj = { metaDesc, keyword, imageAlt, coverPos: coverPosX.toFixed(1) + '% ' + coverPosY.toFixed(1) + '%', coverZoom: coverZoom };
                    if (coverImageUrl) seoObj.coverImage = coverImageUrl;
                    if (articleSlug) seoObj.slug = articleSlug;
                    if (metaDescRu) seoObj.metaDescRu = metaDescRu;
                    if (keywordRu) seoObj.keywordRu = keywordRu;
                    if (imageAltRu) seoObj.imageAltRu = imageAltRu;
                    await adminDb.ref('articleSeo/' + editingEntryId).update(seoObj);
                    // Update slug mapping
                    if (articleSlug) await adminDb.ref('articleSlugs/' + articleSlug).set(editingEntryId);

                    statusEl.textContent = 'Məqalə uğurla yeniləndi!';
                    statusEl.style.color = '#27ae60';
                    // Formu sıfırlamadan edit rejimində qal
                    if (typeof fetchBlogPosts === 'function') fetchBlogPosts();
                } else {
                    // CREATE new entry
                    statusEl.textContent = 'Məqalə yaradılır...';
                    const entryRes = await fetch(WORKER_URL + '/create-entry', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, date, content: richText, assetId: null, titleRu, dateRu, contentRu: richTextRu }),
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
                        const seoObj2 = { metaDesc, keyword, imageAlt, coverPos: coverPosX.toFixed(1) + '% ' + coverPosY.toFixed(1) + '%', coverZoom: coverZoom };
                        if (coverImageUrl) seoObj2.coverImage = coverImageUrl;
                        if (articleSlug) seoObj2.slug = articleSlug;
                        if (metaDescRu) seoObj2.metaDescRu = metaDescRu;
                        if (keywordRu) seoObj2.keywordRu = keywordRu;
                        if (imageAltRu) seoObj2.imageAltRu = imageAltRu;
                        await adminDb.ref('articleSeo/' + newEntryId).set(seoObj2);
                        // Save slug mapping
                        if (articleSlug) await adminDb.ref('articleSlugs/' + articleSlug).set(newEntryId);
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
                    if (imageAltRuEl) imageAltRuEl.value = '';
                    if (slugEl) slugEl.value = '';
                    slugManuallyEdited = false;
                    articleImagePreview.style.display = 'none';
                    // Reset cover image preview
                    var coverWrap = document.getElementById('coverPreviewWrap');
                    var coverCard = document.getElementById('coverPreviewCard');
                    if (coverWrap) coverWrap.style.display = 'none';
                    if (coverCard) { coverCard.style.backgroundImage = ''; coverCard.style.backgroundPosition = ''; coverCard.style.backgroundSize = ''; }
                    coverPosX = 50; coverPosY = 50; coverZoom = 1;
                    var posLabel = document.getElementById('coverPosLabel');
                    if (posLabel) posLabel.textContent = 'Pozisiya: 50.0% 50.0% | Zoom: 100%';
                }

                // Refresh blog posts
                if (typeof fetchBlogPosts === 'function') fetchBlogPosts();
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
        if (!listEl) return;

        listEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;"><i class="fas fa-spinner fa-spin"></i> ' + adminT('loading') + '</p>';

        fetch(FIREBASE_REST + '/users.json').then(function(r) { return r.json(); }).then(function(data) {
            const snapshot = { forEach: function(cb) { if(data) Object.keys(data).forEach(k => cb({ key: k, val: () => data[k] })); } };
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
                    <div class="admin-user-card" style="border:1px solid ${isBanned ? '#f8cccc' : '#eee'};border-radius:12px;margin-bottom:10px;background:${isBanned ? '#fff5f5' : '#fafafa'};overflow:hidden;">
                        <div class="admin-user-info" style="display:flex;align-items:center;gap:14px;padding:14px 16px;flex-wrap:wrap;">
                            ${avatar}
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:600;font-size:0.95rem;color:var(--text-primary);">${name} ${statusHtml}</div>
                                <div style="font-size:0.82rem;color:var(--text-muted);margin-top:2px;word-break:break-all;">${email}</div>
                                <div style="font-size:0.75rem;color:#999;margin-top:2px;">${date}</div>
                            </div>
                            <div class="admin-user-actions" style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">
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
        }).catch(function(err) {
            listEl.innerHTML = '<p style="text-align:center;color:#e74c3c;padding:20px 0;">Xəta: ' + err.message + '</p>';
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
        if (!container) return;

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
            fetch(FIREBASE_REST + '/siteTraffic/dailyCounts.json').then(r => r.json()),
            fetch(FIREBASE_REST + '/siteTraffic/visits/' + todayKey + '.json').then(r => r.json()),
            fetch(FIREBASE_REST + '/siteTraffic/activities.json?orderBy="timestamp"&limitToLast=30').then(r => r.json()).catch(() => null),
            fetch(FIREBASE_REST + '/siteTraffic/clickStats.json').then(r => r.json())
        ]).then(([dailyCounts_raw, todayVisits_raw, activities_raw, clickStats_raw]) => {
            const dailyCounts = dailyCounts_raw || {};

            // Calculate visitor counts
            let todayCount = dailyCounts[todayKey] || 0;
            let weekCount = 0, monthCount = 0;

            Object.keys(dailyCounts).forEach(key => {
                const count = dailyCounts[key] || 0;
                if (key >= monthStart) monthCount += count;
                if (key >= weekStart) weekCount += count;
            });

            // Calculate average session duration from today's visits
            const todayVisits = todayVisits_raw || {};
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
            if (activities_raw) {
                Object.keys(activities_raw).forEach(k => {
                    activities.push(activities_raw[k]);
                });
            }
            activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            activities.splice(30);

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
            const clickStats = clickStats_raw || {};
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

    // === ANNOUNCEMENTS / CAMPAIGNS ===
    const annImageFile = document.getElementById('annImageFile');
    const annImagePreview = document.getElementById('annImagePreview');
    const annImageName = document.getElementById('annImageName');
    let annEditId = null;

    const annCoverWrap = document.getElementById('annCoverPreviewWrap');
    const annCoverCard = document.getElementById('annCoverPreviewCard');
    let annPosX = 50, annPosY = 50, annZoom = 1;
    let annDragging = false, annStartX, annStartY, annStartPosX, annStartPosY;

    function updateAnnCoverLabel() {
        var lbl = document.getElementById('annCoverPosLabel');
        if (lbl) lbl.textContent = annPosX.toFixed(0) + '% ' + annPosY.toFixed(0) + '% | Zoom: ' + (annZoom * 100).toFixed(0) + '%';
    }
    function applyAnnCoverView() {
        if (!annCoverCard) return;
        annCoverCard.style.backgroundSize = (annZoom * 100) + '%';
        annCoverCard.style.backgroundPosition = annPosX.toFixed(1) + '% ' + annPosY.toFixed(1) + '%';
        updateAnnCoverLabel();
    }

    if (annImageFile) {
        annImageFile.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                annImageName.textContent = file.name;
                const reader = new FileReader();
                reader.onload = function(e) {
                    annImagePreview.src = e.target.result;
                    annCoverCard.style.backgroundImage = 'url(' + e.target.result + ')';
                    annPosX = 50; annPosY = 50; annZoom = 1;
                    applyAnnCoverView();
                    annCoverWrap.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Drag
    if (annCoverCard) {
        annCoverCard.addEventListener('mousedown', function(e) {
            annDragging = true; annStartX = e.clientX; annStartY = e.clientY;
            annStartPosX = annPosX; annStartPosY = annPosY;
            this.style.cursor = 'grabbing'; e.preventDefault();
        });
        annCoverCard.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                annDragging = true; annStartX = e.touches[0].clientX; annStartY = e.touches[0].clientY;
                annStartPosX = annPosX; annStartPosY = annPosY;
            }
        }, { passive: true });
        document.addEventListener('mousemove', function(e) {
            if (!annDragging) return;
            var dx = e.clientX - annStartX, dy = e.clientY - annStartY;
            var sens = 0.3 / annZoom;
            annPosX = Math.max(0, Math.min(100, annStartPosX - dx * sens));
            annPosY = Math.max(0, Math.min(100, annStartPosY - dy * sens));
            applyAnnCoverView();
        });
        document.addEventListener('touchmove', function(e) {
            if (!annDragging || e.touches.length !== 1) return;
            var dx = e.touches[0].clientX - annStartX, dy = e.touches[0].clientY - annStartY;
            var sens = 0.3 / annZoom;
            annPosX = Math.max(0, Math.min(100, annStartPosX - dx * sens));
            annPosY = Math.max(0, Math.min(100, annStartPosY - dy * sens));
            applyAnnCoverView();
        }, { passive: true });
        document.addEventListener('mouseup', function() { annDragging = false; if (annCoverCard) annCoverCard.style.cursor = 'grab'; });
        document.addEventListener('touchend', function() { annDragging = false; });

        // Zoom with scroll (desktop)
        annCoverCard.addEventListener('wheel', function(e) {
            e.preventDefault();
            var delta = e.deltaY < 0 ? 0.1 : -0.1;
            annZoom = Math.max(1, Math.min(5, annZoom + delta));
            applyAnnCoverView();
        }, { passive: false });

        // Pinch-to-zoom (mobile/tablet)
        var annPinchStartDist = 0;
        var annPinchStartZoom = 1;
        annCoverCard.addEventListener('touchstart', function(e) {
            if (e.touches.length === 2) {
                annDragging = false;
                var dx = e.touches[0].clientX - e.touches[1].clientX;
                var dy = e.touches[0].clientY - e.touches[1].clientY;
                annPinchStartDist = Math.sqrt(dx * dx + dy * dy);
                annPinchStartZoom = annZoom;
                e.preventDefault();
            }
        }, { passive: false });
        annCoverCard.addEventListener('touchmove', function(e) {
            if (e.touches.length === 2) {
                var dx = e.touches[0].clientX - e.touches[1].clientX;
                var dy = e.touches[0].clientY - e.touches[1].clientY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (annPinchStartDist > 0) {
                    annZoom = Math.max(1, Math.min(5, annPinchStartZoom * (dist / annPinchStartDist)));
                    applyAnnCoverView();
                }
                e.preventDefault();
            }
        }, { passive: false });
    }

    // Reset
    var annResetBtn = document.getElementById('annCoverReset');
    if (annResetBtn) {
        annResetBtn.addEventListener('click', function() {
            annPosX = 50; annPosY = 50; annZoom = 1;
            applyAnnCoverView();
        });
    }

    // Announcement language tab switching
    document.querySelectorAll('.ann-lang-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            var lang = this.dataset.annLang;
            document.querySelectorAll('.ann-lang-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.annLang === lang); });
            document.querySelectorAll('.ann-lang-panel').forEach(function(p) { p.style.display = p.dataset.annLangPanel === lang ? '' : 'none'; });
        });
    });

    async function uploadAnnImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) return data.data.url;
        throw new Error('Image upload failed');
    }

    document.getElementById('annSaveBtn').addEventListener('click', async function() {
        const title = document.getElementById('annTitle_az').value.trim();
        const desc = document.getElementById('annDesc_az').value.trim();
        const link = document.getElementById('annLink').value.trim();
        const msg = document.getElementById('annMsg');
        const file = annImageFile.files[0];

        if (!title) { msg.style.display = 'block'; msg.style.color = '#e74c3c'; msg.textContent = 'Başlıq yazın!'; return; }

        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (adminT('annSaving') || 'Saxlanılır...');

        try {
            let imageUrl = '';
            if (file) {
                msg.style.display = 'block'; msg.style.color = '#999'; msg.textContent = adminT('annUploading') || 'Şəkil yüklənir...';
                imageUrl = await uploadAnnImage(file);
            } else if (annEditId) {
                // Keep existing image when editing without new file
                const snap = await adminDb.ref('announcements/' + annEditId + '/image').once('value');
                imageUrl = snap.val() || '';
            }

            const dateInput = document.getElementById('annDate').value;
            let dateStr = '';
            let dateTimestamp = Date.now();
            if (dateInput) {
                const d = new Date(dateInput);
                dateStr = String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
                dateTimestamp = d.getTime();
            } else {
                const now = new Date();
                dateStr = String(now.getDate()).padStart(2, '0') + '.' + String(now.getMonth() + 1).padStart(2, '0') + '.' + now.getFullYear();
            }

            // Generate slug from title
            function generateAnnSlug(text) {
                var map = {'ə':'e','ü':'u','ö':'o','ş':'s','ç':'c','ğ':'g','ı':'i','İ':'i','Ə':'e','Ü':'u','Ö':'o','Ş':'s','Ç':'c','Ğ':'g'};
                return text.toLowerCase().replace(/[əüöşçğıİƏÜÖŞÇĞ]/g, function(c) { return map[c] || c; })
                    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
            }
            var annSlug = generateAnnSlug(title);

            const annData = {
                title: title,
                desc: desc,
                slug: annSlug,
                title_az: title,
                desc_az: desc,
                title_ru: document.getElementById('annTitle_ru').value.trim(),
                desc_ru: document.getElementById('annDesc_ru').value.trim(),
                title_en: document.getElementById('annTitle_en').value.trim(),
                desc_en: document.getElementById('annDesc_en').value.trim(),
                title_tr: document.getElementById('annTitle_tr').value.trim(),
                desc_tr: document.getElementById('annDesc_tr').value.trim(),
                link: link,
                image: imageUrl,
                coverPos: annPosX.toFixed(1) + '% ' + annPosY.toFixed(1) + '%',
                coverZoom: annZoom,
                showBadge: document.getElementById('annShowBadge').checked,
                date: dateStr,
                dateRaw: dateInput || new Date().toISOString().split('T')[0],
                timestamp: dateTimestamp,
                active: true
            };

            if (annEditId) {
                await adminDb.ref('announcements/' + annEditId).update(annData);
            } else {
                await adminDb.ref('announcements').push(annData);
            }

            msg.style.display = 'block'; msg.style.color = '#2d8157'; msg.textContent = adminT('annSaved') || 'Elan yadda saxlandı!';
            // Reset form
            ['az','ru','en','tr'].forEach(function(l) {
                document.getElementById('annTitle_' + l).value = '';
                document.getElementById('annDesc_' + l).value = '';
            });
            document.getElementById('annLink').value = '';
            document.getElementById('annDate').value = '';
            document.getElementById('annShowBadge').checked = true;
            annImageFile.value = '';
            annImagePreview.style.display = 'none';
            annImageName.textContent = 'Seçilməyib';
            annCoverWrap.style.display = 'none';
            annPosX = 50; annPosY = 50; annZoom = 1;
            annEditId = null;
            setTimeout(() => { msg.style.display = 'none'; }, 3000);
            loadAdminAnnouncements();
        } catch(err) {
            msg.style.display = 'block'; msg.style.color = '#e74c3c'; msg.textContent = 'Xəta: ' + err.message;
        }
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-save"></i> ' + (adminT('annSave') || 'Elanı saxla');
    });

    function loadAdminAnnouncements() {
        const list = document.getElementById('annList');
        const countEl = document.getElementById('annCount');
        list.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;"><i class="fas fa-spinner fa-spin"></i></p>';

        adminDb.ref('announcements').orderByChild('timestamp').once('value').then(snap => {
            const data = snap.val();
            if (!data) { list.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;">Elan yoxdur</p>'; countEl.textContent = '0'; return; }
            const items = Object.entries(data).map(([id, v]) => ({ id, ...v })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            countEl.textContent = items.length;

            list.innerHTML = items.map(item => `
                <div style="display:flex;gap:12px;padding:12px;background:#fff;border:1.5px solid #e8e8e8;border-radius:12px;margin-bottom:8px;align-items:center;">
                    ${item.image ? `<img src="${item.image}" style="width:56px;height:56px;border-radius:10px;object-fit:cover;flex-shrink:0;">` : `<div style="width:56px;height:56px;border-radius:10px;background:#f0f7f3;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-bullhorn" style="color:#ccc;"></i></div>`}
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title}</div>
                        <div style="font-size:0.78rem;color:#999;margin-top:2px;">${item.date || ''}</div>
                        ${item.desc ? `<div style="font-size:0.8rem;color:#666;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${item.desc}</div>` : ''}
                    </div>
                    <div style="display:flex;gap:6px;flex-shrink:0;">
                        <button onclick="editAnnouncement('${item.id}')" style="width:32px;height:32px;border:1.5px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;color:#666;font-size:0.8rem;" title="Redaktə"><i class="fas fa-pen"></i></button>
                        <button onclick="toggleAnnouncement('${item.id}', ${!item.active})" style="width:32px;height:32px;border:1.5px solid ${item.active ? '#2d8157' : '#e0e0e0'};border-radius:8px;background:${item.active ? '#f0faf5' : '#fff'};cursor:pointer;color:${item.active ? '#2d8157' : '#999'};font-size:0.8rem;" title="${item.active ? 'Deaktiv et' : 'Aktiv et'}"><i class="fas fa-${item.active ? 'eye' : 'eye-slash'}"></i></button>
                        <button onclick="deleteAnnouncement('${item.id}')" style="width:32px;height:32px;border:1.5px solid #e74c3c;border-radius:8px;background:#fff;cursor:pointer;color:#e74c3c;font-size:0.8rem;" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        });
    }

    window.editAnnouncement = function(id) {
        adminDb.ref('announcements/' + id).once('value').then(snap => {
            const item = snap.val();
            if (!item) return;
            annEditId = id;
            document.getElementById('annTitle_az').value = item.title_az || item.title || '';
            document.getElementById('annDesc_az').value = item.desc_az || item.desc || '';
            document.getElementById('annTitle_ru').value = item.title_ru || '';
            document.getElementById('annDesc_ru').value = item.desc_ru || '';
            document.getElementById('annTitle_en').value = item.title_en || '';
            document.getElementById('annDesc_en').value = item.desc_en || '';
            document.getElementById('annTitle_tr').value = item.title_tr || '';
            document.getElementById('annDesc_tr').value = item.desc_tr || '';
            // Reset lang tabs to AZ
            document.querySelectorAll('.ann-lang-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.annLang === 'az'); });
            document.querySelectorAll('.ann-lang-panel').forEach(function(p) { p.style.display = p.dataset.annLangPanel === 'az' ? '' : 'none'; });
            document.getElementById('annLink').value = item.link || '';
            document.getElementById('annDate').value = item.dateRaw || '';
            document.getElementById('annShowBadge').checked = item.showBadge !== false;
            if (item.image) {
                annImagePreview.src = item.image;
                annCoverCard.style.backgroundImage = 'url(' + item.image + ')';
                // Restore position & zoom
                if (item.coverPos) {
                    var parts = item.coverPos.split('%').map(s => parseFloat(s.trim()));
                    if (parts.length >= 2) { annPosX = parts[0]; annPosY = parts[1]; }
                }
                annZoom = item.coverZoom || 1;
                applyAnnCoverView();
                annCoverWrap.style.display = 'block';
                annImageName.textContent = 'Mövcud şəkil';
            } else {
                annImagePreview.src = '';
                annImagePreview.style.display = 'none';
                annCoverCard.style.backgroundImage = '';
                annCoverWrap.style.display = 'none';
                annImageName.textContent = 'Seçilməyib';
                annPosX = 50; annPosY = 50; annZoom = 1;
                document.getElementById('annImageFile').value = '';
            }
            document.getElementById('tabAnnouncements').scrollTop = 0;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };

    window.toggleAnnouncement = function(id, active) {
        adminDb.ref('announcements/' + id + '/active').set(active).then(() => loadAdminAnnouncements());
    };

    window.deleteAnnouncement = function(id) {
        if (!confirm(adminT('annDeleteConfirm') || 'Bu elanı silmək istəyirsiniz?')) return;
        adminDb.ref('announcements/' + id).remove().then(() => {
            loadAdminAnnouncements();
        });
    };

});
