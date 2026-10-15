
const EDU_LAST_PAGE_KEY = "edumath_last_page";

const EDU_RESTORABLE_PAGES = [
    "home",
    "edubot",
    "pustaka",
    "achievements",
    "kilas",
    "guru",
    "notifications",
    "profile",
    "account-settings",
    "tanya-ai",
    "belajar-ai",
    "jadwal",
    "detail-kursus",
    "halaman-materi",
    "halaman-kuis"
];

async function restoreEduMathAfterRefresh() {
    const splash = document.getElementById("splash");
    const loginScreen = document.getElementById("login");
    const bottomNav = document.getElementById("bottom-nav");

    function hideAllScreens() {
        document.querySelectorAll(".screen").forEach(screen => {
            screen.classList.add("hidden");
        });
    }

    try {
        // Periksa sesi login langsung ke Laravel.
        const response = await fetch("/account", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            credentials: "same-origin",
            cache: "no-store"
        });

        const data = await response.json().catch(() => ({}));

        if (splash) {
            splash.classList.add("hidden");
        }

        // Jika sesi tidak berlaku, tampilkan login.
        if (response.status === 401 || response.status === 419) {
            sessionStorage.removeItem(EDU_LAST_PAGE_KEY);

            hideAllScreens();

            if (loginScreen) {
                loginScreen.classList.remove("hidden");
            }

            if (bottomNav) {
                bottomNav.classList.add("hidden");
            }

            return;
        }

        if (!response.ok) {
            throw new Error("Tidak dapat memeriksa sesi login.");
        }

        // Perbarui nama pengguna dari server.
        if (data.user) {
            updateProfileDisplay(data.user);
        }

        // Ambil halaman yang terakhir dibuka.
        const savedPage = sessionStorage.getItem(EDU_LAST_PAGE_KEY);

        const pageId =
            EDU_RESTORABLE_PAGES.includes(savedPage) &&
            document.getElementById(savedPage)
                ? savedPage
                : "home";

        hideAllScreens();

        document.getElementById(pageId).classList.remove("hidden");
        if (pageId === "home") {
            loadDashboardStats();
        }
        if (bottomNav) {
            bottomNav.classList.remove("hidden");
        }

        // Pulihkan tampilan halaman yang membutuhkan data tambahan.
        if (
            pageId === "account-settings" &&
            typeof openAccountSettings === "function"
        ) {
            await openAccountSettings();
        }

        if (
            pageId === "detail-kursus" &&
            typeof setKelas3Semester === "function"
        ) {
            const semester =
                Number(sessionStorage.getItem("edumath_kelas3_semester"));

            setKelas3Semester(semester === 2 ? 2 : 1);
        }

        if (
            pageId === "halaman-materi" &&
            typeof openKelas3Materi === "function"
        ) {
            const semester =
                Number(sessionStorage.getItem("edumath_kelas3_semester"));

            const storedIndex =
                Number(sessionStorage.getItem("edumath_kelas3_materi"));

            const materialIndex =
                Number.isInteger(storedIndex) &&
                storedIndex >= 0 &&
                storedIndex <= 2
                    ? storedIndex
                    : 0;

            setKelas3Semester(semester === 2 ? 2 : 1);
            openKelas3Materi(materialIndex);
        }

        // Muat kembali progres jika halaman detail kursus dibuka.
        if (
            pageId === "detail-kursus" &&
            typeof loadKelas3Progress === "function"
        ) {
            loadKelas3Progress(kelas3SemesterAktif);
        }

    } catch (error) {
        console.error("Gagal memulihkan halaman EduMath:", error);

        if (splash) {
            splash.classList.add("hidden");
        }

        hideAllScreens();

        if (loginScreen) {
            loginScreen.classList.remove("hidden");
        }

        if (bottomNav) {
            bottomNav.classList.add("hidden");
        }
    }
}

restoreEduMathAfterRefresh();

// Fungsi tombol login


async function login() {
    const emailInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
        alert("Email dan kata sandi harus diisi.");
        return;
    }

    const csrf = document.querySelector(
        'meta[name="csrf-token"]'
    );

    if (!csrf) {
        alert("Token keamanan tidak ditemukan. Muat ulang halaman.");
        return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "X-CSRF-TOKEN": csrf.content
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Login gagal.");
            return;
        }

        if (data.user) updateProfileDisplay(data.user);

        document.getElementById("login").classList.add("hidden");
        document.getElementById("home").classList.remove("hidden");
        loadDashboardStats();
        sessionStorage.setItem(EDU_LAST_PAGE_KEY, "home");

        const bottomNav = document.getElementById("bottom-nav");

        if (bottomNav) {
            bottomNav.classList.remove("hidden");
        }

        if (typeof updateNavActive === "function") {
            updateNavActive(0);
        }

    } catch (error) {
        console.error(error);
        alert("Tidak dapat terhubung ke server. Coba lagi.");
    }
}

function showPage(pageId) {

    document.getElementById("home").classList.add("hidden");
    document.getElementById("edubot").classList.add("hidden");
    document.getElementById("pustaka").classList.add("hidden");
    document.getElementById("kilas").classList.add("hidden");
    document.getElementById("guru").classList.add("hidden");
    document.getElementById("notifications").classList.add("hidden");
    if (document.getElementById("profile")) {
        document.getElementById("profile").classList.add("hidden");
    }
    if (document.getElementById("account-settings")) {
        document.getElementById("account-settings").classList.add("hidden");
    }
    if (document.getElementById("tanya-ai")) {
        document.getElementById("tanya-ai").classList.add("hidden");
    }
    if (document.getElementById("belajar-ai")) {
        document.getElementById("belajar-ai").classList.add("hidden");
    }
    if (document.getElementById("jadwal")) {
        document.getElementById("jadwal").classList.add("hidden");
    }
    if (document.getElementById("detail-kursus")) {
        document.getElementById("detail-kursus").classList.add("hidden");
    }
    if (document.getElementById("halaman-materi")) {
        document.getElementById("halaman-materi").classList.add("hidden");
    }
    if (document.getElementById("halaman-kuis")) {
        document.getElementById("halaman-kuis").classList.add("hidden");
    }
    if (document.getElementById("achievements")) {
        document.getElementById("achievements").classList.add("hidden");
    }
    document.getElementById(pageId).classList.remove("hidden");
    if (EDU_RESTORABLE_PAGES.includes(pageId)) {
    sessionStorage.setItem(EDU_LAST_PAGE_KEY, pageId);
}
    if (pageId === 'detail-kursus') {
    loadKelas3Progress(kelas3SemesterAktif);
    recordDashboardCourseVisit(kelas3SemesterAktif);
}
}


function showHome() {

    document.getElementById("edubot").classList.add("hidden");
    document.getElementById("pustaka").classList.add("hidden");
    document.getElementById("kilas").classList.add("hidden");
    document.getElementById("guru").classList.add("hidden");
    document.getElementById("notifications").classList.add("hidden");
    if (document.getElementById("profile")) {
        document.getElementById("profile").classList.add("hidden");
    }
    if (document.getElementById("account-settings")) {
        document.getElementById("account-settings").classList.add("hidden");
    }
    if (document.getElementById("tanya-ai")) {
        document.getElementById("tanya-ai").classList.add("hidden");
    }
    if (document.getElementById("belajar-ai")) {
        document.getElementById("belajar-ai").classList.add("hidden");
    }
    if (document.getElementById("jadwal")) {
        document.getElementById("jadwal").classList.add("hidden");
    }
    if (document.getElementById("detail-kursus")) {
        document.getElementById("detail-kursus").classList.add("hidden");
    }
    if (document.getElementById("halaman-materi")) {
        document.getElementById("halaman-materi").classList.add("hidden");
    }
    if (document.getElementById("halaman-kuis")) {
        document.getElementById("halaman-kuis").classList.add("hidden");
    }

    document.getElementById("home").classList.remove("hidden");
    sessionStorage.setItem(EDU_LAST_PAGE_KEY, "home");
}
// Membaca satu notifikasi
function readNotification(element) {

    element.classList.remove("unread");
    element.classList.add("read");

    const dot = element.querySelector(".unread-dot");

    if (dot) {
        dot.remove();
    }
}


// Menandai semua sebagai sudah dibaca
function markAllRead() {

    const notifications =
        document.querySelectorAll(".notification-item");

    notifications.forEach(function(notification) {

        notification.classList.remove("unread");
        notification.classList.add("read");

        const dot =
            notification.querySelector(".unread-dot");

        if (dot) {
            dot.remove();
        }

    });
}


// Menghapus semua notifikasi
function clearNotifications() {

    const list =
        document.getElementById("notification-list");

    const empty =
        document.getElementById("empty-notification");

    list.innerHTML = "";

    empty.classList.remove("hidden");
}


// =========================
// PENJADWALAN KURSUS (halaman #jadwal)
// =========================

const JADWAL_KEY = "edumath_jadwal_kursus";
const JADWAL_HARI_PENDEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// Pilihan hari untuk tiap "Frekuensi Belajar" (0 = Senin ... 6 = Minggu)
const JADWAL_PRESET = {
    "setiap-hari": [0, 1, 2, 3, 4, 5, 6],
    "hari-kerja": [0, 1, 2, 3, 4],
    "akhir-pekan": [5, 6]
};

// Tampilan awal = sama seperti desain (Selasa & Rabu, 14:00 - 15:00)
const JADWAL_DEFAULT = {
    days: [1, 2],
    start: "14:00",
    end: "15:00",
    freq: "setiap-hari"
};

function jadwalToMin(time) {
    const parts = time.split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
}

function jadwalFromMin(total) {
    const m = Math.max(0, Math.min(23 * 60 + 59, total));
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}

function jadwalLoad() {
    try {
        const raw = localStorage.getItem(JADWAL_KEY);
        if (!raw) return null;

        const data = JSON.parse(raw);
        const timeOk = function (t) {
            return typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
        };
        const daysOk = Array.isArray(data.days) &&
            data.days.every(function (n) { return Number.isInteger(n) && n >= 0 && n <= 6; });
        const freqOk = data.freq === "pilihan" || Object.prototype.hasOwnProperty.call(JADWAL_PRESET, data.freq);

        if (daysOk && timeOk(data.start) && timeOk(data.end) && freqOk &&
            jadwalToMin(data.end) > jadwalToMin(data.start)) {
            return data;
        }
    } catch (e) {
        // localStorage tidak tersedia / data rusak -> pakai tampilan awal
    }
    return null;
}

function initJadwal() {
    const root = document.getElementById("jadwal");
    if (!root) return;

    const dayButtons = Array.from(root.querySelectorAll(".jd-day"));
    const startInput = document.getElementById("jd-start");
    const endInput = document.getElementById("jd-end");
    const startText = document.getElementById("jd-start-text");
    const endText = document.getElementById("jd-end-text");
    const freqSelect = document.getElementById("jd-freq");
    const toast = document.getElementById("jd-toast");

    const saved = jadwalLoad();
    const state = {
        days: new Set((saved || JADWAL_DEFAULT).days),
        start: (saved || JADWAL_DEFAULT).start,
        end: (saved || JADWAL_DEFAULT).end,
        freq: (saved || JADWAL_DEFAULT).freq
    };

    // --- Tanggal minggu ini (Senin - Minggu) ---
    const today = new Date();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    monday.setDate(monday.getDate() - ((today.getDay() + 6) % 7));

    dayButtons.forEach(function (btn, i) {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        btn.querySelector(".jd-day-num").textContent = d.getDate();
    });

    // --- Pesan singkat ---
    let toastTimer = null;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 2400);
    }

    // --- Tampilkan state ke layar ---
    function render() {
        dayButtons.forEach(function (btn) {
            const on = state.days.has(Number(btn.dataset.day));
            btn.classList.toggle("active", on);
            btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
        startText.textContent = state.start;
        endText.textContent = state.end;
        startInput.value = state.start;
        endInput.value = state.end;
        freqSelect.value = state.freq;
    }

    // --- Samakan pilihan frekuensi dengan hari yang dipilih ---
    function syncFreq() {
        const picked = Array.from(state.days).sort().join(",");
        state.freq = "pilihan";
        Object.keys(JADWAL_PRESET).forEach(function (key) {
            if (JADWAL_PRESET[key].join(",") === picked) state.freq = key;
        });
    }

    // --- Jam: selesai harus selalu setelah mulai ---
    function setStart(minutes) {
        const duration = Math.max(15, jadwalToMin(state.end) - jadwalToMin(state.start));
        const start = Math.max(0, Math.min(23 * 60 + 45, minutes));
        let end = jadwalToMin(state.end);
        if (end <= start) end = Math.min(23 * 60 + 59, start + duration);
        state.start = jadwalFromMin(start);
        state.end = jadwalFromMin(end);
    }

    function setEnd(minutes) {
        const min = jadwalToMin(state.start) + 15;
        const end = Math.max(min, Math.min(23 * 60 + 59, minutes));
        if (minutes < min) showToast("Jam selesai harus setelah jam mulai");
        state.end = jadwalFromMin(end);
    }

    // --- Hari ---
    dayButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const day = Number(btn.dataset.day);
            if (state.days.has(day)) state.days.delete(day);
            else state.days.add(day);
            syncFreq();
            render();
        });
    });

    // --- Frekuensi ---
    freqSelect.addEventListener("change", function () {
        state.freq = freqSelect.value;
        if (JADWAL_PRESET[state.freq]) state.days = new Set(JADWAL_PRESET[state.freq]);
        render();
    });

    // --- Jam mulai / selesai (pemilih jam bawaan perangkat) ---
    function openPicker(input) {
        try {
            if (typeof input.showPicker === "function") input.showPicker();
        } catch (e) {
            // browser tidak mengizinkan showPicker -> input tetap bisa diketik
        }
    }

    startInput.addEventListener("click", function () { openPicker(startInput); });
    endInput.addEventListener("click", function () { openPicker(endInput); });

    startInput.addEventListener("change", function () {
        if (startInput.value) setStart(jadwalToMin(startInput.value));
        render();
    });

    endInput.addEventListener("change", function () {
        if (endInput.value) setEnd(jadwalToMin(endInput.value));
        render();
    });

    // --- Tombol "−" (mulai lebih awal 15 menit) ---
    document.getElementById("jd-start-minus").addEventListener("click", function () {
        setStart(jadwalToMin(state.start) - 15);
        render();
    });

    // --- Tombol ⇅ (bagian atas +15 menit, bagian bawah -15 menit) ---
    const endStep = document.getElementById("jd-end-step");

    endStep.addEventListener("click", function (event) {
        const rect = endStep.getBoundingClientRect();
        const upper = (event.clientY - rect.top) < rect.height / 2;
        setEnd(jadwalToMin(state.end) + (upper ? 15 : -15));
        render();
    });

    endStep.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        setEnd(jadwalToMin(state.end) + (event.key === "ArrowUp" ? 15 : -15));
        render();
    });

    // --- Tombol "Ubah Jadwal" (simpan) ---
    document.getElementById("jd-save").addEventListener("click", function () {
        if (state.days.size === 0) {
            showToast("Pilih minimal satu hari belajar");
            return;
        }

        const days = Array.from(state.days).sort();
        const label = days.length === 7
            ? "Setiap hari"
            : days.map(function (d) { return JADWAL_HARI_PENDEK[d]; }).join(", ");

        try {
            localStorage.setItem(JADWAL_KEY, JSON.stringify({
                days: days,
                start: state.start,
                end: state.end,
                freq: state.freq
            }));
            showToast("Jadwal diperbarui: " + label + " · " + state.start + "–" + state.end);
        } catch (e) {
            showToast("Jadwal diubah, tetapi tidak bisa disimpan di perangkat ini");
        }
    });

    render();
}

initJadwal();

const csrfToken = () =>
    document.querySelector('meta[name="csrf-token"]').content;

function showAuthScreen(screenId) {
    ['login', 'register-screen', 'otp-screen'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });

    document.getElementById(screenId).classList.remove('hidden');
}

function openRegister(event) {
    event.preventDefault();
    document.getElementById('register-message').textContent = '';
    showAuthScreen('register-screen');
}

function backToLogin(event) {
    event.preventDefault();
    showAuthScreen('login');
}

function openOtpScreen(email) {
    document.getElementById('otp-email').value = email;
    document.getElementById('otp-code').value = '';
    document.getElementById('otp-message').textContent = '';
    showAuthScreen('otp-screen');
}

async function sendForm(url, formData) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken()
        },
        body: formData
    });

    const data = await response.json();
    return { response, data };
}

async function submitRegistration(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const message = document.getElementById('register-message');

    button.disabled = true;
    message.textContent = 'Sedang memproses pendaftaran...';

    try {
        const { response, data } = await sendForm(
            '/register',
            new FormData(form)
        );

        if (!response.ok) {
            message.textContent =
                data.message || 'Pendaftaran gagal. Periksa data Anda.';
            return;
        }

        form.reset();
        openOtpScreen(data.email);
        document.getElementById('otp-message').textContent =
            data.message || 'Periksa email Anda untuk kode OTP.';
    } catch (error) {
        message.textContent =
            'Tidak dapat terhubung ke server. Periksa koneksi dan coba lagi.';
        console.error(error);
    } finally {
        button.disabled = false;
    }
}

async function submitOtp(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const message = document.getElementById('otp-message');

    button.disabled = true;
    message.textContent = 'Sedang memeriksa kode OTP...';

    try {
        const { response, data } = await sendForm(
            '/verify-otp',
            new FormData(form)
        );

        message.textContent = data.message ||
            (response.ok ? 'Verifikasi berhasil.' : 'Verifikasi gagal.');

        if (response.ok) {
            alert('Email berhasil diverifikasi. Silakan login.');
            showAuthScreen('login');
        }
    } catch (error) {
        message.textContent =
            'Tidak dapat terhubung ke server. Coba lagi.';
        console.error(error);
    } finally {
        button.disabled = false;
    }
}

async function resendOtp(event) {
    event.preventDefault();

    const email = document.getElementById('otp-email').value;
    const message = document.getElementById('otp-message');
    const formData = new FormData();

    formData.append('email', email);
    message.textContent = 'Meminta kode OTP baru...';

    try {
        const { response, data } = await sendForm(
            '/resend-otp',
            formData
        );

        message.textContent = data.message ||
            (response.ok ? 'Permintaan selesai.' : 'Pengiriman ulang gagal.');
    } catch (error) {
        message.textContent =
            'Tidak dapat terhubung ke server. Coba lagi.';
        console.error(error);
    }
}


// =========================
// PENGATURAN PROFIL & AKUN
// =========================
function accountCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

function updateProfileDisplay(user) {
    if (!user) return;
    const name = document.getElementById('profile-display-name');
    const email = document.getElementById('profile-display-email');
    const dashboardName = document.getElementById('dashboard-display-name');
    const greetingName = document.getElementById('dashboard-greeting-name');
    if (name) name.textContent = user.name || 'Pengguna EduMath';
    if (email) email.textContent = user.email || '';
    if (dashboardName) dashboardName.textContent = user.name || 'Pengguna EduMath';
    if (greetingName) greetingName.textContent = (user.name || 'Sobat EduMath').split(' ')[0];
}

async function openAccountSettings() {
    showPage('account-settings');
    const message = document.getElementById('profile-settings-message');
    if (message) message.textContent = 'Memuat informasi akun...';
    try {
        const response = await fetch('/account', {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 401 || response.status === 419) {
                alert('Sesi login berakhir. Silakan login kembali.');
                showPage('login');
                return;
            }
            throw new Error(data.message || 'Informasi akun gagal dimuat.');
        }
        const nameInput = document.getElementById('settings-name');
        const emailInput = document.getElementById('settings-email');
        if (nameInput) nameInput.value = data.user?.name || '';
        if (emailInput) emailInput.value = data.user?.email || '';
        updateProfileDisplay(data.user);
        if (message) message.textContent = '';
    } catch (error) {
        if (message) message.textContent = error.message || 'Tidak dapat memuat akun.';
    }
}

async function saveProfileSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById('profile-settings-message');
    const button = form.querySelector('button[type="submit"]');
    const name = document.getElementById('settings-name').value.trim();
    if (name.length < 2) {
        message.textContent = 'Nama minimal 2 karakter.';
        return;
    }
    button.disabled = true;
    message.textContent = 'Menyimpan perubahan...';
    try {
        const response = await fetch('/account/profile', {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': accountCsrfToken()
            },
            credentials: 'same-origin',
            body: JSON.stringify({ name })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Profil gagal disimpan.');
        updateProfileDisplay(data.user);
        message.textContent = data.message || 'Profil berhasil diperbarui.';
    } catch (error) {
        message.textContent = error.message || 'Terjadi kesalahan saat menyimpan profil.';
    } finally {
        button.disabled = false;
    }
}

async function savePasswordSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById('password-settings-message');
    const button = form.querySelector('button[type="submit"]');
    const currentPassword = document.getElementById('current-password').value;
    const password = document.getElementById('new-password').value;
    const confirmation = document.getElementById('confirm-password').value;
    if (password.length < 8) {
        message.textContent = 'Kata sandi baru minimal 8 karakter.';
        return;
    }
    if (password !== confirmation) {
        message.textContent = 'Konfirmasi kata sandi baru tidak cocok.';
        return;
    }
    button.disabled = true;
    message.textContent = 'Memperbarui kata sandi...';
    try {
        const response = await fetch('/account/password', {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': accountCsrfToken()
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                current_password: currentPassword,
                password,
                password_confirmation: confirmation
            })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Kata sandi gagal diubah.');
        form.reset();
        message.textContent = data.message || 'Kata sandi berhasil diubah.';
    } catch (error) {
        message.textContent = error.message || 'Terjadi kesalahan saat mengubah kata sandi.';
    } finally {
        button.disabled = false;
    }
}


async function logoutAccount() {
    if (!confirm('Yakin ingin keluar dari akun EduMath?')) return;
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': accountCsrfToken()
            },
            credentials: 'same-origin'
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Logout gagal. Silakan coba lagi.');
        }
        document.querySelectorAll('input[type="password"]').forEach(input => input.value = '');
        showPage('login');
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) bottomNav.classList.add('hidden');
        const loginEmail = document.getElementById('username');
        if (loginEmail) loginEmail.value = '';
        const loginPassword = document.getElementById('password');
        if (loginPassword) loginPassword.value = '';
        alert('Anda berhasil logout.');
    } catch (error) {
        alert(error.message || 'Tidak dapat terhubung ke server.');
    }
}


// Materi Matematika Kelas 3 berdasarkan semester.
// Data materi disimpan di sisi tampilan; tidak mengubah database atau fitur OTP.
const KELAS3_MATERI = {
  1: [
    { title: 'Pertambahan', time: '15 menit', summary: 'Pertambahan adalah operasi untuk menggabungkan dua bilangan atau lebih. Contoh: 125 + 243 = 368.', points: ['Susun angka berdasarkan nilai tempat: satuan, puluhan, dan ratusan.', 'Jumlahkan angka mulai dari kolom satuan.', 'Jika hasil satu kolom 10 atau lebih, simpan angka puluhan ke kolom berikutnya.', 'Contoh: 247 + 135 = 382.'] },
    { title: 'Pengurangan', time: '15 menit', summary: 'Pengurangan digunakan untuk mengetahui selisih atau sisa. Contoh: 452 − 127 = 325.', points: ['Susun bilangan berdasarkan nilai tempat.', 'Kurangkan mulai dari kolom satuan.', 'Jika angka atas lebih kecil, lakukan teknik meminjam dari kolom di sebelah kiri.', 'Periksa jawaban dengan menambahkan hasil dan bilangan pengurang.'] },
    { title: 'Soal Cerita Pertambahan dan Pengurangan', time: '20 menit', summary: 'Soal cerita membantu kita memilih operasi yang sesuai dari kejadian sehari-hari.', points: ['Baca soal dengan teliti.', 'Tentukan informasi yang diketahui dan yang ditanyakan.', 'Gunakan pertambahan untuk menggabungkan jumlah dan pengurangan untuk mencari sisa atau selisih.', 'Tuliskan jawaban beserta satuannya.'] }
  ],
  2: [
    { title: 'Perkalian', time: '15 menit', summary: 'Perkalian adalah penjumlahan berulang. Contoh: 4 × 3 berarti 3 + 3 + 3 + 3 = 12.', points: ['Pahami perkalian sebagai kelompok yang sama banyak.', 'Hafalkan fakta perkalian dasar secara bertahap.', 'Contoh: 6 × 4 = 24.', 'Gunakan gambar kelompok atau susunan benda untuk membantu menghitung.'] },
    { title: 'Pembagian', time: '15 menit', summary: 'Pembagian membagi jumlah menjadi beberapa kelompok sama banyak. Contoh: 20 ÷ 4 = 5.', points: ['Bayangkan membagikan benda secara adil.', 'Hubungkan pembagian dengan perkalian: 20 ÷ 4 = 5 karena 4 × 5 = 20.', 'Periksa hasil dengan mengalikan jawaban dan pembagi.', 'Contoh: 18 ÷ 3 = 6.'] },
    { title: 'Soal Cerita Perkalian dan Pembagian', time: '20 menit', summary: 'Gunakan perkalian untuk menghitung beberapa kelompok sama banyak dan pembagian untuk membagi jumlah menjadi kelompok yang sama.', points: ['Cari jumlah kelompok dan isi setiap kelompok.', 'Pilih perkalian jika mencari jumlah seluruhnya.', 'Pilih pembagian jika jumlah seluruhnya dibagi sama rata.', 'Periksa apakah jawaban masuk akal dengan cerita soal.'] }
  ]
};
let kelas3SemesterAktif = 1;
let kelas3MateriAktif = 0;

let kelas3ProgressData = {
    1: [],
    2: []
};

function renderKelas3ProgressUI() {
    const semester = kelas3SemesterAktif;
    const completed = new Set(
        (kelas3ProgressData[semester] || []).map(Number)
    );

    const total = KELAS3_MATERI[semester].length;
    const percent = Math.round(completed.size / total * 100);

    const circle = document.getElementById('kelas3-progress-circle');
    const percentText = document.getElementById('kelas3-progress-percent');
    const progressText = document.getElementById('kelas3-course-progress');

    if (circle) {
        circle.style.setProperty('--progress', percent + '%');
    }

    if (percentText) {
        percentText.textContent = percent + '%';
    }

    if (progressText) {
        progressText.textContent =
            `${completed.size} dari ${total} materi selesai`;
    }
}

function renderKelas3ModuleList() {
    const list = document.getElementById('kelas3-module-list');
    if (!list) return;

    const semester = kelas3SemesterAktif;
    const completed = new Set(
        (kelas3ProgressData[semester] || []).map(Number)
    );

    list.innerHTML = KELAS3_MATERI[semester].map((materi, index) => {
        const isDone = completed.has(index);

        return `
            <div class="dk-module-card ${isDone ? 'completed' : ''}"
                 onclick="openKelas3Materi(${index})"
                 style="cursor:pointer">

                <div class="dk-icon ${isDone ? 'done' : (index === 0 ? 'play' : 'lock')}">
                    ${isDone ? '✓' : (index === 0 ? '▶' : '📘')}
                </div>

                <div class="dk-module-info" style="flex:1; min-width:0">
                    <span class="bab">Materi ${index + 1}</span>
                    <h4>${materi.title}</h4>
                    <span class="time">${materi.time}</span>
                </div>

                <button type="button"
                    onclick="toggleKelas3Progress(event, ${index})"
                    style="margin-left:8px; padding:8px;
                    border:0; border-radius:8px;
                    font-size:9px; font-weight:bold;
                    background:${isDone ? '#d1fae5' : '#e0f2fe'};
                    color:${isDone ? '#047857' : '#075985'};
                    cursor:pointer; flex-shrink:0">
                    ${isDone ? 'Selesai ✓' : 'Tandai selesai'}
                </button>
            </div>
        `;
    }).join('');
}

async function loadKelas3Progress(semester = kelas3SemesterAktif) {
    try {
        const response = await fetch(
            `/learning-progress?semester=${semester}`,
            {
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status === 401 || response.status === 419) {
                kelas3ProgressData[semester] = [];
                renderKelas3ProgressUI();
                renderKelas3ModuleList();
                return;
            }

            throw new Error(
                data.message || 'Gagal memuat progres belajar.'
            );
        }

        kelas3ProgressData[semester] =
            Array.isArray(data.completed_indices)
                ? data.completed_indices.map(Number)
                : [];

        renderKelas3ProgressUI();
        renderKelas3ModuleList();

    } catch (error) {
        console.error('Gagal memuat progres:', error);
    }
}

async function toggleKelas3Progress(event, index) {
    event.preventDefault();
    event.stopPropagation();

    const semester = kelas3SemesterAktif;
    const completed = new Set(
        (kelas3ProgressData[semester] || []).map(Number)
    );

    const markDone = !completed.has(index);
    const csrf = document.querySelector(
        'meta[name="csrf-token"]'
    );

    if (!csrf) {
        alert('Token keamanan tidak ditemukan. Muat ulang halaman.');
        return;
    }

    const formData = new FormData();
    formData.append('semester', String(semester));
    formData.append('material_index', String(index));
    formData.append('completed', markDone ? '1' : '0');

    try {
        const response = await fetch('/learning-progress', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrf.content
            },
            credentials: 'same-origin',
            body: formData
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status === 401 || response.status === 419) {
                alert('Sesi login tidak tersedia. Silakan login kembali.');
                return;
            }

            alert(data.message || 'Progres gagal diperbarui.');
            return;
        }

        if (Array.isArray(data.progress?.completed_indices)) {
            kelas3ProgressData[semester] =
                data.progress.completed_indices.map(Number);
        }

        renderKelas3ProgressUI();
        renderKelas3ModuleList();

    } catch (error) {
        console.error('Gagal menyimpan progres:', error);
        alert('Tidak dapat terhubung ke server. Coba lagi.');
    }
}


function setKelas3Semester(semester) {
    kelas3SemesterAktif = Number(semester) === 2 ? 2 : 1;
    sessionStorage.setItem(
    "edumath_kelas3_semester",
    String(kelas3SemesterAktif)
);
    kelas3MateriAktif = 0;

    const title = document.getElementById('kelas3-course-title');

    if (title) {
        title.textContent =
            `Matematika Kelas 3 · Semester ${kelas3SemesterAktif}`;
    }

    renderKelas3ProgressUI();
    renderKelas3ModuleList();
    loadKelas3Progress(kelas3SemesterAktif);

    const note = document.querySelector('#belajar-ai .ba-note');

    if (note) {
        note.textContent =
            `Kelas 3 · Semester ${kelas3SemesterAktif}: ` +
            `${KELAS3_MATERI[kelas3SemesterAktif].length} materi Matematika siap dipelajari.`;
    }
}

function openKelas3Materi(index) {
  const materi = KELAS3_MATERI[kelas3SemesterAktif]?.[index];
  if (!materi) return;
  kelas3MateriAktif = index;
  sessionStorage.setItem(
    "edumath_kelas3_materi",
    String(index)
);
  const header = document.getElementById('kelas3-lesson-header');
  const title = document.getElementById('kelas3-lesson-title');
  const subtitle = document.getElementById('kelas3-lesson-subtitle');
  const summary = document.getElementById('kelas3-lesson-summary');
  const points = document.getElementById('kelas3-lesson-points');
  if (header) header.textContent = `Materi ${index + 1}: ${materi.title}`;
  if (title) title.textContent = materi.title;
  if (subtitle) subtitle.textContent = `Matematika Kelas 3 · Semester ${kelas3SemesterAktif}`;
  if (summary) summary.textContent = materi.summary;
  if (points) points.innerHTML = materi.points.map(point => `<li>${point}</li>`).join('');
  showPage('halaman-materi');
}

// Inisialisasi materi Semester 1 saat halaman dimuat.
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('kelas3-module-list')) setKelas3Semester(1);
});

/* ==========================================
   EDUBOT: PESAN TEKS DAN PESAN SUARA
   ========================================== */

let eduBotRecorder = null;
let eduBotAudioStream = null;
let eduBotAudioChunks = [];

function appendEduBotMessage({ text = null, audioUrl = null }) {
    const chat = document.getElementById("edubot-messages");

    if (!chat) {
        alert("Area percakapan EduBot tidak ditemukan.");
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "chat-bubble-container user";

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble user";

    if (text !== null) {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        paragraph.style.whiteSpace = "pre-wrap";
        bubble.appendChild(paragraph);
    }

    if (audioUrl !== null) {
        const label = document.createElement("p");
        label.textContent = "🎙️ Pesan suara";
        bubble.appendChild(label);

        const audio = document.createElement("audio");
        audio.controls = true;
        audio.preload = "metadata";
        audio.src = audioUrl;
        audio.style.display = "block";
        audio.style.maxWidth = "100%";
        audio.style.marginTop = "8px";

        bubble.appendChild(audio);
    }

    const time = document.createElement("span");
    time.className = "chat-time";
    time.textContent = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
    });

    bubble.appendChild(time);
    wrapper.appendChild(bubble);
    chat.appendChild(wrapper);

    // Gulir ke pesan terakhir.
    chat.scrollTop = chat.scrollHeight;
}

function sendEduBotText(event) {
    event.preventDefault();

    const input = document.getElementById("edubot-text-input");

    if (!input) {
        alert("Kolom pesan EduBot tidak ditemukan.");
        return;
    }

    const text = input.value.trim();

    if (!text) {
        input.focus();
        return;
    }

    if (text.length > 2000) {
        alert("Pesan maksimal 2.000 karakter.");
        return;
    }

    appendEduBotMessage({ text });

    input.value = "";
    input.focus();

    // Pesan akan dikirim ke AI setelah endpoint AI tersedia.
}

async function toggleEduBotRecording() {
    const button = document.getElementById("edubot-record-btn");
    const input = document.getElementById("edubot-text-input");

    if (!button) return;

    // Jika sedang merekam, tekan tombol lagi untuk berhenti.
    if (eduBotRecorder && eduBotRecorder.state === "recording") {
        eduBotRecorder.stop();
        button.disabled = true;
        button.textContent = "⏳";
        return;
    }

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia ||
        !window.MediaRecorder
    ) {
        alert(
            "Browser ini belum mendukung perekaman suara. " +
            "Gunakan browser terbaru dan buka melalui localhost."
        );
        return;
    }

    try {
        // Browser akan meminta izin menggunakan mikrofon.
        eduBotAudioStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        eduBotAudioChunks = [];

        const mimeCandidates = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus"
        ];

        const mimeType = mimeCandidates.find(type =>
            MediaRecorder.isTypeSupported(type)
        );

        eduBotRecorder = mimeType
            ? new MediaRecorder(eduBotAudioStream, { mimeType })
            : new MediaRecorder(eduBotAudioStream);

        const recorder = eduBotRecorder;

        recorder.ondataavailable = event => {
            if (event.data && event.data.size > 0) {
                eduBotAudioChunks.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(eduBotAudioChunks, {
                type: recorder.mimeType || "audio/webm"
            });

            // Matikan mikrofon setelah perekaman selesai.
            if (eduBotAudioStream) {
                eduBotAudioStream.getTracks().forEach(track => {
                    track.stop();
                });
                eduBotAudioStream = null;
            }

            button.disabled = false;
            button.textContent = "🎙️";
            button.setAttribute("aria-label", "Rekam pesan suara");
            button.title = "Rekam pesan suara";

            if (input) {
                input.placeholder = "Ketik pertanyaanmu di sini...";
            }

            if (blob.size > 0) {
                const audioUrl = URL.createObjectURL(blob);
                appendEduBotMessage({ audioUrl });
            } else {
                alert("Rekaman kosong. Silakan coba kembali.");
            }

            eduBotAudioChunks = [];
        };

        recorder.onerror = () => {
            if (eduBotAudioStream) {
                eduBotAudioStream.getTracks().forEach(track => {
                    track.stop();
                });
                eduBotAudioStream = null;
            }

            button.disabled = false;
            button.textContent = "🎙️";

            if (input) {
                input.placeholder = "Ketik pertanyaanmu di sini...";
            }

            alert("Terjadi masalah saat merekam suara.");
        };

        recorder.start();

        button.textContent = "⏹️";
        button.setAttribute("aria-label", "Hentikan rekaman");
        button.title = "Hentikan rekaman";

        if (input) {
            input.placeholder =
                "Sedang merekam... tekan tombol stop untuk selesai";
        }

    } catch (error) {
        console.error("Gagal mengakses mikrofon:", error);

        if (eduBotAudioStream) {
            eduBotAudioStream.getTracks().forEach(track => {
                track.stop();
            });
            eduBotAudioStream = null;
        }

        button.textContent = "🎙️";
        button.disabled = false;

        alert(
            "Mikrofon tidak dapat digunakan. " +
            "Izinkan akses mikrofon pada browser, lalu coba lagi."
        );
    }
}

/* =====================================
   EDUBOT: MENU, HAPUS PESAN, DAN BERBAGI
   ===================================== */

function toggleEduBotSettingsMenu() {
    const menu = document.getElementById("edubot-settings-menu");
    const button = document.getElementById("edubot-settings-button");

    if (!menu || !button) return;

    const isOpening = menu.classList.contains("hidden");

    menu.classList.toggle("hidden", !isOpening);
    button.setAttribute("aria-expanded", String(isOpening));
}

function closeEduBotSettingsMenu() {
    const menu = document.getElementById("edubot-settings-menu");
    const button = document.getElementById("edubot-settings-button");

    if (menu) menu.classList.add("hidden");

    if (button) button.setAttribute("aria-expanded", "false");
}

// Tutup menu jika pengguna mengeklik di luar menu.
document.addEventListener("click", function (event) {
    if (
        !event.target.closest("#edubot-settings-menu") &&
        !event.target.closest("#edubot-settings-button")
    ) {
        closeEduBotSettingsMenu();
    }
});

// Menghapus seluruh pesan di area percakapan.
function clearEduBotMessages() {
    const chat = document.getElementById("edubot-messages");

    if (!chat) {
        alert("Area percakapan EduBot tidak ditemukan.");
        return;
    }

    const confirmed = confirm(
        "Hapus semua pesan dalam percakapan EduBot ini?"
    );

    if (!confirmed) return;

    // Hentikan audio dan lepaskan URL rekaman sementara.
    chat.querySelectorAll("audio").forEach(audio => {
        audio.pause();

        if (audio.src.startsWith("blob:")) {
            URL.revokeObjectURL(audio.src);
        }
    });

    chat.replaceChildren();

    closeEduBotSettingsMenu();

    const emptyMessage = document.createElement("p");
    emptyMessage.className = "edubot-empty-message";
    emptyMessage.textContent =
        "Percakapan telah dibersihkan. Mulai pesan baru di bawah.";

    chat.appendChild(emptyMessage);

    alert("Semua pesan berhasil dihapus dari tampilan percakapan.");
}

// Menyusun percakapan menjadi teks untuk dibagikan.
function getEduBotShareText() {
    const chat = document.getElementById("edubot-messages");

    if (!chat) return "";

    const bubbles = [...chat.querySelectorAll(".chat-bubble")];

    const lines = bubbles.map(bubble => {
        const isUser = bubble.classList.contains("user");
        const speaker = isUser ? "Saya" : "EduBot";

        const clone = bubble.cloneNode(true);

        // Hapus elemen waktu dan kontrol audio dari salinan teks.
        clone.querySelectorAll(".chat-time, audio, button").forEach(el => {
            el.remove();
        });

        let content = clone.innerText.trim();

        if (bubble.querySelector("audio")) {
            content += content
                ? "\n[Pesan suara; file audio tidak disertakan]"
                : "[Pesan suara; file audio tidak disertakan]";
        }

        if (!content) return "";

        return `${speaker}: ${content}`;
    }).filter(Boolean);

    return [
        "Percakapan EduBot AI — EduMath",
        "",
        ...lines
    ].join("\n\n");
}

// Membagikan percakapan melalui fitur berbagi perangkat
// atau menyalin teks jika fitur itu tidak tersedia.
async function shareEduBotConversation() {
    const text = getEduBotShareText();

    closeEduBotSettingsMenu();

    if (!text.trim()) {
        alert("Belum ada pesan untuk dibagikan.");
        return;
    }

    try {
        if (navigator.share) {
            await navigator.share({
                title: "Percakapan EduBot — EduMath",
                text: text
            });

            return;
        }

        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);

            alert(
                "Percakapan berhasil disalin. " +
                "Anda dapat menempelkannya ke WhatsApp atau aplikasi lain."
            );

            return;
        }

        window.prompt("Salin teks percakapan berikut:", text);

    } catch (error) {
        // Pengguna mungkin membatalkan dialog berbagi.
        if (error.name === "AbortError") return;

        console.error("Gagal membagikan percakapan:", error);

        window.prompt("Salin teks percakapan berikut:", text);
    }
}

/* =========================================
   DASHBOARD: PROGRESS, STREAK, DAN LENCANA
   ========================================= */

async function loadDashboardStats() {
    try {
        const response = await fetch('/dashboard/stats', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'same-origin',
            cache: 'no-store'
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || 'Statistik dashboard gagal dimuat.'
            );
        }

        const course = data.last_course || {};
        const progress = Math.max(
            0,
            Math.min(100, Number(course.percent) || 0)
        );

        const streak = Math.max(0, Number(data.day_streak) || 0);
        const badgeCount = Math.max(0, Number(data.badge_count) || 0);
        const badgeTotal = Math.max(0, Number(data.badge_total) || 0);

        // Progress kursus terakhir
        const coursePercent = document.getElementById(
            'dashboard-course-percent'
        );
        const courseName = document.getElementById(
            'dashboard-course-name'
        );
        const courseBar = document.getElementById(
            'dashboard-course-bar'
        );

        if (coursePercent) {
            coursePercent.textContent = `${progress}%`;
        }

        if (courseName) {
            courseName.textContent = course.name
                ? `${course.name} · Semester ${course.semester}`
                : 'Belum ada kursus dibuka';
        }

        if (courseBar) {
            courseBar.style.width = `${progress}%`;
        }

        // Day Streak: kemajuan menuju target 7 hari.
        const streakElement = document.getElementById(
            'dashboard-day-streak'
        );
        const streakBar = document.getElementById(
            'dashboard-streak-bar'
        );

        if (streakElement) {
            streakElement.textContent = streak;
        }

        if (streakBar) {
            streakBar.style.width =
                `${Math.min(100, (streak / 7) * 100)}%`;
        }

        // Badge pencapaian
        const badgeElement = document.getElementById(
            'dashboard-badge-count'
        );
        const badgeBar = document.getElementById(
            'dashboard-badge-bar'
        );

        if (badgeElement) {
            badgeElement.textContent = badgeCount;
        }

        if (badgeBar) {
            badgeBar.style.width = badgeTotal > 0
                ? `${Math.min(100, (badgeCount / badgeTotal) * 100)}%`
                : '0%';
        }

    } catch (error) {
        console.error('Gagal memuat statistik EduMath:', error);
    }
}


/* Catat aktivitas saat siswa membuka kursus. */
async function recordDashboardCourseVisit(semester) {
    const csrf = document.querySelector(
        'meta[name="csrf-token"]'
    );

    if (!csrf) {
        console.error('Token keamanan tidak ditemukan.');
        return;
    }

    const formData = new FormData();
    formData.append('course_key', 'matematika-kelas-3');
    formData.append(
        'semester',
        String(Number(semester) === 2 ? 2 : 1)
    );

    try {
        const response = await fetch('/dashboard/visit-course', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrf.content
            },
            credentials: 'same-origin',
            body: formData
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || 'Aktivitas belajar gagal dicatat.'
            );
        }

        await loadDashboardStats();

    } catch (error) {
        console.error('Gagal mencatat aktivitas belajar:', error);
    }
}

/* =========================================
   EDUMATH: HALAMAN LENCANA PENCAPAIAN
   ========================================= */

async function loadAchievements() {
    const list = document.getElementById("achievement-list");
    const unlockedCount = document.getElementById(
        "achievement-unlocked-count"
    );
    const totalCount = document.getElementById(
        "achievement-total-count"
    );

    if (!list) {
        console.error("Elemen achievement-list tidak ditemukan.");
        return;
    }

    list.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "achievement-loading";
    loading.textContent = "Memuat lencana pencapaian...";
    list.appendChild(loading);

    try {
        const response = await fetch("/achievements", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            credentials: "same-origin",
            cache: "no-store"
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || "Gagal mengambil data lencana."
            );
        }

        list.replaceChildren();

        if (unlockedCount) {
            unlockedCount.textContent =
                Number(data.badge_count) || 0;
        }

        if (totalCount) {
            totalCount.textContent =
                Number(data.badge_total) || 16;
        }

        const categories = Array.isArray(data.categories)
            ? data.categories
            : [];

        if (categories.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "Belum ada data lencana.";
            list.appendChild(empty);
            return;
        }

        categories.forEach(category => {
            const section = document.createElement("section");
            section.className = "achievement-category";

            const header = document.createElement("div");
            header.className = "achievement-category-header";

            const title = document.createElement("h3");
            title.textContent =
                `${category.icon || "🏆"} ${category.title}`;

            const summary = document.createElement("p");

            if (category.key === "day_streak") {
                summary.textContent =
                    `${category.count} hari saat ini · ` +
                    `Rekor ${category.record} hari`;
            } else {
                summary.textContent =
                    `${category.count} ${category.unit || "pencapaian"}`;
            }

            header.append(title, summary);
            section.appendChild(header);

            const grid = document.createElement("div");
            grid.className = "achievement-grid";

            (category.badges || []).forEach(badge => {
                const unlocked = badge.unlocked === true;

                const card = document.createElement("article");
                card.className =
                    "achievement-badge " +
                    (unlocked ? "unlocked" : "locked");

                const icon = document.createElement("div");
                icon.className = "achievement-badge-icon";
                icon.textContent = unlocked
                    ? (category.icon || "🏆")
                    : "🔒";

                const name = document.createElement("h4");
                name.textContent = badge.name;

                const threshold = Number(badge.threshold) || 0;
                let targetText;

                switch (category.key) {
                    case "day_streak":
                        targetText =
                            `${threshold.toLocaleString("id-ID")} hari`;
                        break;
                    case "ask_ai":
                        targetText =
                            `${threshold.toLocaleString("id-ID")} pertanyaan`;
                        break;
                    case "study":
                        targetText =
                            `${threshold.toLocaleString("id-ID")} sesi belajar`;
                        break;
                    case "reading":
                        targetText =
                            `${threshold.toLocaleString("id-ID")} buku`;
                        break;
                    default:
                        targetText = `Target ${threshold}`;
                }

                const target = document.createElement("p");
                target.className = "achievement-target";
                target.textContent = targetText;

                const progress = Math.max(
                    0,
                    Math.min(100, Number(badge.progress) || 0)
                );

                const progressTrack = document.createElement("div");
                progressTrack.className = "achievement-progress-track";

                const progressBar = document.createElement("div");
                progressBar.className = "achievement-progress-bar";
                progressBar.style.width = `${progress}%`;

                progressTrack.appendChild(progressBar);

                const status = document.createElement("span");
                status.className = "achievement-status";
                status.textContent = unlocked
                    ? "✓ Lencana diperoleh"
                    : `${progress}% menuju target`;

                card.append(
                    icon,
                    name,
                    target,
                    progressTrack,
                    status
                );

                grid.appendChild(card);
            });

            section.appendChild(grid);
            list.appendChild(section);
        });

    } catch (error) {
        console.error("Gagal memuat lencana:", error);

        list.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.className = "achievement-error";
        errorMessage.textContent =
            "Lencana belum dapat dimuat. Pastikan Anda login dan coba lagi.";

        list.appendChild(errorMessage);
    }
}

async function loadDayStreakHistory() {
    const calendar = document.getElementById('streak-calendar');
    const totalDaysElement = document.getElementById('streak-total-days');

    if (!calendar) return;

    try {
        const response = await fetch('/day-streak/history', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Gunakan streak dari statistik dashboard yang sudah ada.
        const streakElement = document.getElementById(
            'dashboard-day-streak'
        );
        const streakBar = document.getElementById(
            'dashboard-streak-bar'
        );

        if (streakElement) {
            streakElement.textContent = data.current_streak;
        }

        if (streakBar) {
            streakBar.style.width =
                `${Math.min(100, (data.current_streak / 7) * 100)}%`;
        }

        if (totalDaysElement) {
            totalDaysElement.textContent =
                `${data.total_login_days} hari login`;
        }

        calendar.replaceChildren();

        data.calendar.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'rd-streak-day';

            if (day.logged_in) {
                cell.classList.add('is-logged');
            }

            if (day.is_today) {
                cell.classList.add('is-today');
            }

            cell.title = `${day.date}: ${
                day.logged_in ? 'Sudah login' : 'Belum login'
            }`;

            const number = document.createElement('span');
            number.className = 'rd-streak-day-number';
            number.textContent = day.day_number;

            const label = document.createElement('span');
            label.className = 'rd-streak-day-label';
            label.textContent = day.day;

            cell.append(number, label);
            calendar.appendChild(cell);
        });
    } catch (error) {
        console.error('Gagal memuat riwayat login:', error);
        calendar.textContent = 'Riwayat login belum dapat dimuat.';
    }
}

document.addEventListener('DOMContentLoaded', loadDayStreakHistory);
