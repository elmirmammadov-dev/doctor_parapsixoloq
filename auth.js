// ===== USER AUTH SYSTEM =====
const IMGBB_API_KEY = 'b1a73ddcdac93d67a842d887adc92634'; // Free ImgBB API key
const AUTH_TEXTS = {
    az: {
        login: 'Giriş',
        register: 'Qeydiyyat',
        logout: 'Çıxış',
        name: 'Ad',
        surname: 'Soyad',
        email: 'E-poçt',
        password: 'Şifrə',
        confirmPassword: 'Şifrəni təsdiqləyin',
        profilePic: 'Profil şəkli (istəkdən asılı)',
        stayAnonymous: 'Anonim qal',
        loginBtn: 'Daxil ol',
        registerBtn: 'Qeydiyyatdan keç',
        noAccount: 'Hesabınız yoxdur?',
        hasAccount: 'Hesabınız var?',
        switchToRegister: 'Qeydiyyatdan keçin',
        switchToLogin: 'Daxil olun',
        uploading: 'Şəkil yüklənir...',
        registering: 'Qeydiyyat...',
        loggingIn: 'Daxil olunur...',
        passwordMismatch: 'Şifrələr uyğun gəlmir',
        weakPassword: 'Şifrə ən azı 6 simvol olmalıdır',
        emailInUse: 'Bu e-poçt artıq istifadə olunur',
        invalidEmail: 'Yanlış e-poçt formatı',
        wrongPassword: 'Yanlış e-poçt və ya şifrə',
        genericError: 'Xəta baş verdi',
        dailyLimit: 'Günlük limit dolub, növbəti gün sınayın',
        profile: 'Profil',
        anonymous: 'Anonim'
    },
    ru: {
        login: 'Вход',
        register: 'Регистрация',
        logout: 'Выйти',
        name: 'Имя',
        surname: 'Фамилия',
        email: 'Эл. почта',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        profilePic: 'Фото профиля (необязательно)',
        stayAnonymous: 'Остаться анонимным',
        loginBtn: 'Войти',
        registerBtn: 'Зарегистрироваться',
        noAccount: 'Нет аккаунта?',
        hasAccount: 'Уже есть аккаунт?',
        switchToRegister: 'Зарегистрируйтесь',
        switchToLogin: 'Войдите',
        uploading: 'Загрузка фото...',
        registering: 'Регистрация...',
        loggingIn: 'Входим...',
        passwordMismatch: 'Пароли не совпадают',
        weakPassword: 'Пароль должен содержать минимум 6 символов',
        emailInUse: 'Этот email уже используется',
        invalidEmail: 'Неверный формат email',
        wrongPassword: 'Неверный email или пароль',
        genericError: 'Произошла ошибка',
        dailyLimit: 'Дневной лимит исчерпан, попробуйте завтра',
        profile: 'Профиль',
        anonymous: 'Аноним'
    },
    en: {
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        name: 'Name',
        surname: 'Surname',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm password',
        profilePic: 'Profile picture (optional)',
        stayAnonymous: 'Stay anonymous',
        loginBtn: 'Sign in',
        registerBtn: 'Sign up',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        switchToRegister: 'Register',
        switchToLogin: 'Sign in',
        uploading: 'Uploading photo...',
        registering: 'Registering...',
        loggingIn: 'Signing in...',
        passwordMismatch: 'Passwords do not match',
        weakPassword: 'Password must be at least 6 characters',
        emailInUse: 'This email is already in use',
        invalidEmail: 'Invalid email format',
        wrongPassword: 'Wrong email or password',
        genericError: 'An error occurred',
        dailyLimit: 'Daily limit reached, try again tomorrow',
        profile: 'Profile',
        anonymous: 'Anonymous'
    },
    tr: {
        login: 'Giriş',
        register: 'Kayıt',
        logout: 'Çıkış',
        name: 'Ad',
        surname: 'Soyad',
        email: 'E-posta',
        password: 'Şifre',
        confirmPassword: 'Şifreyi onaylayın',
        profilePic: 'Profil fotoğrafı (istəkdən asılı)',
        stayAnonymous: 'Anonim kal',
        loginBtn: 'Giriş yap',
        registerBtn: 'Kayıt ol',
        noAccount: 'Hesabınız yok mu?',
        hasAccount: 'Zaten hesabınız var mı?',
        switchToRegister: 'Kayıt olun',
        switchToLogin: 'Giriş yapın',
        uploading: 'Fotoğraf yükleniyor...',
        registering: 'Kayıt yapılıyor...',
        loggingIn: 'Giriş yapılıyor...',
        passwordMismatch: 'Şifreler uyuşmuyor',
        weakPassword: 'Şifre en az 6 karakter olmalıdır',
        emailInUse: 'Bu e-posta zaten kullanılıyor',
        invalidEmail: 'Geçersiz e-posta formatı',
        wrongPassword: 'Yanlış e-posta veya şifre',
        genericError: 'Bir hata oluştu',
        dailyLimit: 'Günlük limit doldu, yarın tekrar deneyin',
        profile: 'Profil',
        anonymous: 'Anonim'
    }
};

function getAuthLang() {
    return localStorage.getItem('lang') || 'az';
}
function getAuthText() {
    return AUTH_TEXTS[getAuthLang()] || AUTH_TEXTS.az;
}

// Upload image to ImgBB
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    if (data.success) {
        return data.data.thumb.url; // Thumbnail URL (small size)
    }
    throw new Error('Image upload failed');
}

// Resize image before upload (200x200)
function resizeImage(file, maxSize) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > h) { h = maxSize * h / w; w = maxSize; }
                else { w = maxSize * w / h; h = maxSize; }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Initialize auth UI
function initAuth() {
    const auth = firebase.auth();
    const database = firebase.database();

    // Create auth modal HTML
    const modalHtml = `
    <div class="auth-overlay" id="authOverlay">
        <div class="auth-modal">
            <button class="auth-close" id="authClose">&times;</button>

            <!-- Login Form -->
            <div id="authLoginView">
                <h3 class="auth-title" id="authLoginTitle">Giriş</h3>
                <form id="authLoginForm">
                    <div class="auth-field">
                        <label id="authLoginEmailLabel">E-poçt</label>
                        <input type="text" id="authLoginEmail" required>
                    </div>
                    <div class="auth-field">
                        <label id="authLoginPassLabel">Şifrə</label>
                        <div class="auth-pass-wrap">
                            <input type="password" id="authLoginPass" required>
                            <button type="button" class="auth-eye" onclick="toggleAuthPass('authLoginPass', this)"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>
                    <p class="auth-error" id="authLoginError"></p>
                    <button type="submit" class="auth-btn auth-btn-primary" id="authLoginBtn">Daxil ol</button>
                    <button type="button" class="auth-btn auth-btn-anon" id="authAnonBtn" onclick="loginAnonymous()">
                        <i class="fas fa-user-secret"></i> <span id="authAnonText">Anonim qal</span>
                    </button>
                </form>
                <p class="auth-switch" id="authSwitchToRegister">
                    Hesabınız yoxdur? <a href="#" onclick="showAuthView('register'); return false;">Qeydiyyatdan keçin</a>
                </p>
            </div>

            <!-- Register Form -->
            <div id="authRegisterView" style="display:none;">
                <h3 class="auth-title" id="authRegisterTitle">Qeydiyyat</h3>
                <form id="authRegisterForm">
                    <div class="auth-row">
                        <div class="auth-field">
                            <label id="authRegNameLabel">Ad</label>
                            <input type="text" id="authRegName" required>
                        </div>
                        <div class="auth-field">
                            <label id="authRegSurnameLabel">Soyad</label>
                            <input type="text" id="authRegSurname" required>
                        </div>
                    </div>
                    <div class="auth-field">
                        <label id="authRegEmailLabel">E-poçt</label>
                        <input type="email" id="authRegEmail" required>
                    </div>
                    <div class="auth-field">
                        <label id="authRegPassLabel">Şifrə</label>
                        <div class="auth-pass-wrap">
                            <input type="password" id="authRegPass" required minlength="6">
                            <button type="button" class="auth-eye" onclick="toggleAuthPass('authRegPass', this)"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>
                    <div class="auth-field">
                        <label id="authRegConfirmLabel">Şifrəni təsdiqləyin</label>
                        <div class="auth-pass-wrap">
                            <input type="password" id="authRegConfirm" required minlength="6">
                            <button type="button" class="auth-eye" onclick="toggleAuthPass('authRegConfirm', this)"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>
                    <div class="auth-field">
                        <label id="authRegPicLabel">Profil şəkli (istəkdən asılı)</label>
                        <div class="auth-pic-upload">
                            <div class="auth-pic-preview" id="authPicPreview">
                                <i class="fas fa-camera"></i>
                            </div>
                            <div class="auth-pic-controls" id="authPicControls" style="display:none;">
                                <button type="button" class="pic-pos-btn" onclick="adjustPicPos('left')" title="Sola"><i class="fas fa-arrow-left"></i></button>
                                <button type="button" class="pic-pos-btn" onclick="adjustPicPos('center')" title="Mərkəz"><i class="fas fa-compress-arrows-alt"></i></button>
                                <button type="button" class="pic-pos-btn" onclick="adjustPicPos('right')" title="Sağa"><i class="fas fa-arrow-right"></i></button>
                                <button type="button" class="pic-pos-btn" onclick="adjustPicPos('up')" title="Yuxarı"><i class="fas fa-arrow-up"></i></button>
                                <button type="button" class="pic-pos-btn" onclick="adjustPicPos('down')" title="Aşağı"><i class="fas fa-arrow-down"></i></button>
                            </div>
                            <input type="file" id="authRegPic" accept="image/*" onchange="previewAuthPic(this)">
                            <label for="authRegPic" class="auth-pic-btn"><i class="fas fa-upload"></i> <span id="authPicBtnText">Şəkil seç</span></label>
                        </div>
                    </div>
                    <p class="auth-error" id="authRegError"></p>
                    <button type="submit" class="auth-btn auth-btn-primary" id="authRegBtn">Qeydiyyatdan keç</button>
                </form>
                <p class="auth-switch" id="authSwitchToLogin">
                    Hesabınız var? <a href="#" onclick="showAuthView('login'); return false;">Daxil olun</a>
                </p>
            </div>

        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Close modal
    document.getElementById('authClose').addEventListener('click', closeAuthModal);
    document.getElementById('authOverlay').addEventListener('click', function(e) {
        if (e.target === this) closeAuthModal();
    });

    // Login form submit — checks admin credentials first, then Firebase
    document.getElementById('authLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const t = getAuthText();
        const errorEl = document.getElementById('authLoginError');
        const btn = document.getElementById('authLoginBtn');
        const emailOrUser = document.getElementById('authLoginEmail').value.trim();
        const pass = document.getElementById('authLoginPass').value;

        // Check admin credentials
        if (emailOrUser === 'Novokuzneck' && pass === 'Dudenge1!') {
            window.isAdminLoggedIn = true;
            sessionStorage.setItem('adminAuth', 'true');
            closeAuthModal();
            // If on blog post page, set blog-only admin session
            const isOnBlogPost = window.location.pathname.match(/\/blog\//) || document.getElementById('blogDetail');
            if (isOnBlogPost) {
                sessionStorage.setItem('blogAdminAuth', 'true');
                // Update comment form for admin
                const nameInput = document.getElementById('commentName');
                const emailInput = document.getElementById('commentEmail');
                if (nameInput) {
                    nameInput.value = 'Şahsəddin İmanlı';
                    nameInput.readOnly = true;
                    nameInput.style.background = '#f5f5f5';
                }
                if (emailInput) {
                    emailInput.value = 'Shahseddinimanli2016@gmail.com';
                    emailInput.readOnly = true;
                    emailInput.style.background = '#f5f5f5';
                }
                const badgeEl = document.getElementById('adminBadgeLabel');
                if (badgeEl) {
                    const lang = localStorage.getItem('lang') || 'az';
                    badgeEl.textContent = lang === 'ru' ? 'Автор' : 'Müəllif';
                    badgeEl.style.display = 'inline';
                }
                // Update navbar to show admin is logged in
                const authBtn = document.getElementById('userAuthBtn');
                if (authBtn) {
                    authBtn.innerHTML = '<img src="/profil-sekli-1.webp" class="nav-user-avatar" alt="Şahsəddin İmanlı" style="width:32px;height:32px;border-radius:50%;object-fit:cover;"> <span class="nav-user-name">Şahsəddin</span>';
                    // Don't override onclick if blog page already set up dropdown
                    if (!document.getElementById('adminDropdown')) {
                        authBtn.onclick = function() { window.location.href = '/admin.html'; };
                    }
                }
            } else {
                window.location.href = '/admin.html';
            }
            return;
        }

        btn.disabled = true;
        btn.textContent = t.loggingIn;
        errorEl.textContent = '';

        try {
            await auth.signInWithEmailAndPassword(emailOrUser, pass);
            if (typeof window.siteLogActivity === 'function') window.siteLogActivity('auth', 'Hesabına daxil oldu');
            closeAuthModal();
        } catch (err) {
            errorEl.textContent = getFirebaseErrorMsg(err.code);
        } finally {
            btn.disabled = false;
            btn.textContent = t.loginBtn;
        }
    });

    // Register form submit
    document.getElementById('authRegisterForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const t = getAuthText();
        const errorEl = document.getElementById('authRegError');
        const btn = document.getElementById('authRegBtn');
        const name = document.getElementById('authRegName').value.trim();
        const surname = document.getElementById('authRegSurname').value.trim();
        const email = document.getElementById('authRegEmail').value.trim();
        const pass = document.getElementById('authRegPass').value;
        const confirm = document.getElementById('authRegConfirm').value;
        const picFile = document.getElementById('authRegPic').files[0];

        if (pass !== confirm) {
            errorEl.textContent = t.passwordMismatch;
            return;
        }

        btn.disabled = true;
        errorEl.textContent = '';

        try {
            // Upload profile pic if provided
            let photoURL = '';
            if (picFile) {
                btn.textContent = t.uploading;
                try {
                    const resized = await resizeImage(picFile, 200);
                    photoURL = await uploadToImgBB(resized);
                } catch (imgErr) {
                    console.warn('Image upload failed, continuing without photo:', imgErr);
                    photoURL = '';
                }
            }

            btn.textContent = t.registering;
            const cred = await auth.createUserWithEmailAndPassword(email, pass);

            // Update display name
            await cred.user.updateProfile({
                displayName: name + ' ' + surname,
                photoURL: photoURL || null
            });

            // Save to database
            await database.ref('users/' + cred.user.uid).set({
                name: name,
                surname: surname,
                email: email,
                photoURL: photoURL,
                createdAt: Date.now()
            });

            if (typeof window.siteLogActivity === 'function') window.siteLogActivity('auth', name + ' ' + surname + ' qeydiyyatdan keçdi');
            closeAuthModal();
        } catch (err) {
            console.error('Registration error:', err);
            if (err.code) {
                errorEl.textContent = getFirebaseErrorMsg(err.code);
            } else if (err.message === 'Image upload failed') {
                errorEl.textContent = 'Şəkil yüklənmədi. Şəkilsiz yenidən cəhd edin.';
            } else {
                errorEl.textContent = err.message || t.genericError;
            }
        } finally {
            btn.disabled = false;
            btn.textContent = t.registerBtn;
        }
    });

    // Auth state listener
    auth.onAuthStateChanged(function(user) {
        updateNavbarAuth(user);
        updateCommentFormAuth(user);
        if (user && !user.isAnonymous) {
            checkUserWarnings(user.uid);
        }
    });
}

function getFirebaseErrorMsg(code) {
    const t = getAuthText();
    switch (code) {
        case 'auth/email-already-in-use': return t.emailInUse;
        case 'auth/invalid-email': return t.invalidEmail;
        case 'auth/weak-password': return t.weakPassword;
        case 'auth/wrong-password':
        case 'auth/user-not-found':
        case 'auth/invalid-credential': return t.wrongPassword;
        case 'auth/too-many-requests': return t.dailyLimit;
        default: return t.genericError;
    }
}

function openAuthModal() {
    showAuthView('login');
    document.getElementById('authOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    updateAuthTexts();
}

function closeAuthModal() {
    document.getElementById('authOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
    // Reset forms
    document.getElementById('authLoginForm').reset();
    document.getElementById('authRegisterForm').reset();
    document.getElementById('authLoginError').textContent = '';
    document.getElementById('authRegError').textContent = '';
    document.getElementById('authPicPreview').innerHTML = '<i class="fas fa-camera"></i>';
}

function showAuthView(view) {
    document.getElementById('authLoginView').style.display = view === 'login' ? 'block' : 'none';
    document.getElementById('authRegisterView').style.display = view === 'register' ? 'block' : 'none';
    updateAuthTexts();
}

function updateAuthTexts() {
    const t = getAuthText();
    // Login view
    const el = (id) => document.getElementById(id);
    if (el('authLoginTitle')) el('authLoginTitle').textContent = t.login;
    if (el('authLoginEmailLabel')) el('authLoginEmailLabel').textContent = t.email;
    if (el('authLoginPassLabel')) el('authLoginPassLabel').textContent = t.password;
    if (el('authLoginBtn')) el('authLoginBtn').textContent = t.loginBtn;
    if (el('authAnonText')) el('authAnonText').textContent = t.stayAnonymous;
    if (el('authSwitchToRegister')) el('authSwitchToRegister').innerHTML = t.noAccount + ' <a href="#" onclick="showAuthView(\'register\'); return false;">' + t.switchToRegister + '</a>';
    // Register view
    if (el('authRegisterTitle')) el('authRegisterTitle').textContent = t.register;
    if (el('authRegNameLabel')) el('authRegNameLabel').textContent = t.name;
    if (el('authRegSurnameLabel')) el('authRegSurnameLabel').textContent = t.surname;
    if (el('authRegEmailLabel')) el('authRegEmailLabel').textContent = t.email;
    if (el('authRegPassLabel')) el('authRegPassLabel').textContent = t.password;
    if (el('authRegConfirmLabel')) el('authRegConfirmLabel').textContent = t.confirmPassword;
    if (el('authRegPicLabel')) el('authRegPicLabel').textContent = t.profilePic;
    if (el('authRegBtn')) el('authRegBtn').textContent = t.registerBtn;
    if (el('authSwitchToLogin')) el('authSwitchToLogin').innerHTML = t.hasAccount + ' <a href="#" onclick="showAuthView(\'login\'); return false;">' + t.switchToLogin + '</a>';
}

function toggleAuthPass(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

let picPosX = 50;
let picPosY = 50;

function previewAuthPic(input) {
    const preview = document.getElementById('authPicPreview');
    const controls = document.getElementById('authPicControls');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            picPosX = 50;
            picPosY = 50;
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="object-position: ${picPosX}% ${picPosY}%;">`;
            controls.style.display = 'flex';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function adjustPicPos(dir) {
    const step = 10;
    if (dir === 'left') picPosX = Math.max(0, picPosX - step);
    else if (dir === 'right') picPosX = Math.min(100, picPosX + step);
    else if (dir === 'up') picPosY = Math.max(0, picPosY - step);
    else if (dir === 'down') picPosY = Math.min(100, picPosY + step);
    else if (dir === 'center') { picPosX = 50; picPosY = 50; }

    const img = document.querySelector('#authPicPreview img');
    if (img) img.style.objectPosition = `${picPosX}% ${picPosY}%`;
}

async function loginAnonymous() {
    // Close modal immediately - don't wait for Firebase
    closeAuthModal();
    const authBtn = document.getElementById('userAuthBtn');
    if (authBtn) authBtn.innerHTML = '<i class="fas fa-user-secret"></i> <span class="nav-user-name">Anonim</span>';
    try {
        await firebase.auth().signInAnonymously();
        if (typeof window.siteLogActivity === 'function') window.siteLogActivity('auth', 'Anonim olaraq daxil oldu');
    } catch (err) {
        if (authBtn) authBtn.innerHTML = '<i class="fas fa-user"></i> <span class="nav-user-name">Giriş</span>';
    }
}

function logoutUser() {
    if (typeof window.siteLogActivity === 'function') window.siteLogActivity('auth', 'Hesabından çıxış etdi');
    firebase.auth().signOut();
}

// Update navbar based on auth state
function updateNavbarAuth(user) {
    const authBtn = document.getElementById('userAuthBtn');
    if (!authBtn) return;

    // Update anon label visibility
    if (typeof window.updateNavAnonLabel === 'function') window.updateNavAnonLabel();

    // Don't override if blog admin dropdown is active
    if (document.getElementById('adminDropdown')) return;

    if (user && !user.isAnonymous) {
        const name = user.displayName || user.email.split('@')[0];
        const photo = user.photoURL;
        authBtn.innerHTML = photo
            ? `<img src="${photo}" class="nav-user-avatar" alt="${name}"> <span class="nav-user-name">${name.split(' ')[0]}</span>`
            : `<div class="nav-user-initial">${name[0].toUpperCase()}</div> <span class="nav-user-name">${name.split(' ')[0]}</span>`;
        authBtn.onclick = toggleUserDropdown;
        // Show dropdown
        showUserDropdown(user);
    } else if (user && user.isAnonymous) {
        const t = getAuthText();
        authBtn.innerHTML = `<i class="fas fa-user-secret"></i> <span class="nav-user-name">${t.anonymous}</span>`;
        authBtn.onclick = toggleUserDropdown;
        showUserDropdown(user);
    } else {
        const t = getAuthText();
        authBtn.innerHTML = `<i class="fas fa-user"></i> <span class="nav-user-name">${t.login}</span>`;
        authBtn.onclick = function() { openAuthModal(); };
        hideUserDropdown();
    }
}

function showUserDropdown(user) {
    let dd = document.getElementById('userDropdown');
    if (!dd) {
        dd = document.createElement('div');
        dd.id = 'userDropdown';
        dd.className = 'user-dropdown';
        dd.style.display = 'none';
        const authBtn = document.getElementById('userAuthBtn');
        if (authBtn) authBtn.parentNode.appendChild(dd);
    }
    const t = getAuthText();
    dd.innerHTML = `<a href="#" class="user-dropdown-item" onclick="logoutUser(); return false;"><i class="fas fa-sign-out-alt"></i> ${t.logout}</a>`;
}

function hideUserDropdown() {
    const dd = document.getElementById('userDropdown');
    if (dd) dd.remove();
}

function toggleUserDropdown() {
    const dd = document.getElementById('userDropdown');
    if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

// Close dropdown on outside click
document.addEventListener('click', function(e) {
    const dd = document.getElementById('userDropdown');
    const authBtn = document.getElementById('userAuthBtn');
    if (dd && authBtn && !authBtn.contains(e.target) && !dd.contains(e.target)) {
        dd.style.display = 'none';
    }
});

// Update comment form based on auth state
function updateCommentFormAuth(user) {
    const nameInput = document.getElementById('commentName');
    const emailInput = document.getElementById('commentEmail');
    if (!nameInput || !emailInput) return;

    if (user && !user.isAnonymous) {
        nameInput.value = user.displayName || '';
        nameInput.readOnly = true;
        nameInput.style.background = '#f5f5f5';
        emailInput.value = user.email || '';
        emailInput.readOnly = true;
        emailInput.style.background = '#f5f5f5';
    } else if (user && user.isAnonymous) {
        const anonLabel = (window.getAnonVisitorName && window.getAnonVisitorName()) || getAuthText().anonymous;
        nameInput.value = anonLabel;
        nameInput.readOnly = true;
        nameInput.style.background = '#f5f5f5';
        emailInput.value = 'anonim@user.com';
        emailInput.readOnly = true;
        emailInput.style.background = '#f5f5f5';
    } else {
        const anonLabel = (window.getAnonVisitorName && window.getAnonVisitorName()) || '';
        if (anonLabel) {
            nameInput.value = anonLabel;
            nameInput.readOnly = true;
            nameInput.style.background = '#f5f5f5';
            emailInput.value = 'anonim@user.com';
            emailInput.readOnly = true;
            emailInput.style.background = '#f5f5f5';
        } else if (!nameInput.value) {
            // Only clear if not already filled (avoid wiping anon name on auth state flicker)
            nameInput.readOnly = false;
            nameInput.style.background = '';
            emailInput.readOnly = false;
            emailInput.style.background = '';
        }
    }
}

// Check and show unread warnings to user
function checkUserWarnings(uid) {
    const db = firebase.database();
    db.ref('users/' + uid + '/warningList').once('value', snap => {
        const list = snap.val();
        if (!list || !Array.isArray(list)) return;

        // Find unread warnings
        const unread = [];
        list.forEach((w, i) => {
            if (!w.seen) unread.push({ ...w, index: i });
        });

        if (unread.length === 0) return;

        // Show popup for each unread warning (newest first)
        unread.reverse();
        showWarningPopup(unread, uid, list);
    });
}

function showWarningPopup(unreadList, uid, fullList) {
    if (unreadList.length === 0) return;

    const w = unreadList[0];
    const remaining = unreadList.slice(1);
    const lang = localStorage.getItem('lang') || 'az';
    const d = new Date(w.date);
    const dateStr = String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear();

    const titleText = lang === 'ru' ? 'Предупреждение от Шахседдина Иманлы' : 'Şahsəddin İmanlıdan Xəbərdarlıq';
    const dateLabel = lang === 'ru' ? 'Дата' : 'Tarix';
    const reasonLabel = lang === 'ru' ? 'Причина' : 'Səbəb';
    const btnText = lang === 'ru' ? 'Понятно' : 'Anladım';

    // Remove old popup if exists
    const old = document.getElementById('warningPopupOverlay');
    if (old) old.remove();

    const html = `
    <div id="warningPopupOverlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
        <div style="background:#fff;border-radius:16px;padding:0;width:90%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.2);overflow:hidden;">
            <div style="background:#e74c3c;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:10px;color:#fff;">
                    <i class="fas fa-exclamation-triangle" style="font-size:1.3rem;"></i>
                    <strong style="font-size:1rem;">${titleText}</strong>
                </div>
                <button id="warningPopupClose" style="background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;line-height:1;opacity:0.8;">&times;</button>
            </div>
            <div style="padding:24px 20px;">
                <div style="margin-bottom:16px;">
                    <span style="font-size:0.8rem;color:#999;font-weight:600;">${dateLabel}:</span>
                    <span style="font-size:0.85rem;color:#333;margin-left:4px;">${dateStr}</span>
                </div>
                <div style="background:#fff5f5;border:1px solid #f8cccc;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
                    <span style="font-size:0.8rem;color:#999;font-weight:600;display:block;margin-bottom:6px;">${reasonLabel}:</span>
                    <p style="font-size:0.95rem;color:#333;margin:0;line-height:1.5;">${w.reason}</p>
                </div>
                <button id="warningPopupOk" style="width:100%;padding:12px;background:#e74c3c;color:#fff;border:none;border-radius:10px;font-size:0.95rem;font-weight:700;cursor:pointer;">${btnText}</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    function dismiss() {
        document.getElementById('warningPopupOverlay').remove();
        // Mark as seen
        fullList[w.index].seen = true;
        firebase.database().ref('users/' + uid + '/warningList').set(fullList);
        // Show next unread if any
        if (remaining.length > 0) {
            setTimeout(() => showWarningPopup(remaining, uid, fullList), 300);
        }
    }

    document.getElementById('warningPopupClose').addEventListener('click', dismiss);
    document.getElementById('warningPopupOk').addEventListener('click', dismiss);
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', initAuth);
