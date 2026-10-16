import {
    HISTORY_LIMIT,
    MAX_TURNS,
    MIN_TURNS,
    evaluateAnswer,
    readHistory,
    summarizeSession,
    writeHistory,
} from '/aplikasi/guru-mode-core.js';

const byId = (id) => document.getElementById(id);
const status = byId('guru-status');
const gradeSelect = byId('grade-select');
const materialSelect = byId('material-select');
const sessionPanel = byId('session-panel');
const setupPanel = byId('setup-panel');
const resultPanel = byId('result-panel');
const historyList = byId('history-list');
const historyEmpty = byId('history-empty');
const studentAnswer = byId('student-answer');
let curriculum = {};
let history = readHistory();
let activeSession = null;
let storageAvailable = writeHistory(history);
let lastTargetIdeas = [];

function setStatus(message = '') {
    status.textContent = message;
}

function persistSession(session) {
    history = [session, ...history.filter((item) => item.id !== session.id)].slice(0, HISTORY_LIMIT);
    storageAvailable = writeHistory(history);
    byId('storage-warning').hidden = storageAvailable;
    renderHistory();
}

function materialsForGrade() {
    return curriculum[gradeSelect.value] || [];
}

function populateMaterials() {
    materialSelect.replaceChildren();
    materialsForGrade().forEach((material) => {
        const option = document.createElement('option');
        option.value = material.key;
        option.textContent = material.title;
        materialSelect.append(option);
    });
    updateObjective();
}

function selectedMaterial() {
    return materialsForGrade().find((material) => material.key === materialSelect.value) || null;
}

function updateObjective() {
    byId('material-objective').textContent = selectedMaterial()?.objective || '';
}

function appendTurn(turn, index) {
    const article = document.createElement('article');
    article.className = 'turn';
    const label = document.createElement('strong');
    label.textContent = `Jawaban ${index + 1}`;
    const question = document.createElement('p');
    question.textContent = `Pertanyaan: ${turn.question}`;
    const answer = document.createElement('p');
    answer.textContent = `Penjelasanmu: ${turn.answer}`;
    const result = document.createElement('small');
    result.textContent = `${turn.matchedIdeas.length} dari ${turn.matchedIdeas.length + turn.missedIdeas.length} frasa konsep cocok dengan jawaban.`;
    article.append(label, question, answer, result);
    byId('turn-list').append(article);
}

function showQuestion(text) {
    byId('current-question').replaceChildren();
    const label = document.createElement('strong');
    label.textContent = 'Murid bertanya';
    const prompt = document.createElement('span');
    prompt.textContent = text;
    byId('current-question').append(label, prompt);
}

function nextQuestion(material, answeredTurns) {
    if (answeredTurns === 1) {
        return `Bisakah kamu membuat contoh lain tentang ${material.title.toLocaleLowerCase('id')}?`;
    }
    if (answeredTurns === 2) {
        return `Bagaimana kamu mengecek bahwa penjelasan tentang ${material.title.toLocaleLowerCase('id')} sudah masuk akal?`;
    }
    return `Coba jelaskan kembali ide utama ${material.title.toLocaleLowerCase('id')} dengan cara yang berbeda.`;
}

function updateProgress() {
    const count = activeSession?.turns.length || 0;
    byId('session-progress').textContent = `${count} / ${MAX_TURNS} jawaban`;
    byId('finish-button').hidden = count < MIN_TURNS;
    byId('answer-button').disabled = count >= MAX_TURNS;
    byId('hint-button').disabled = count >= MAX_TURNS;
    studentAnswer.disabled = count >= MAX_TURNS;
}

function showSession(session, material) {
    activeSession = session;
    lastTargetIdeas = material.target_ideas || [];
    gradeSelect.value = String(session.grade);
    populateMaterials();
    materialSelect.value = session.materialKey;
    byId('session-grade').textContent = `Kelas ${session.grade} SD`;
    byId('session-title').textContent = session.materialTitle;
    showQuestion(session.currentQuestion);
    byId('turn-list').replaceChildren();
    session.turns.forEach(appendTurn);
    byId('hint-box').hidden = !session.currentHint;
    byId('hint-box').textContent = session.currentHint ? `Petunjuk: ${session.currentHint}` : '';
    studentAnswer.value = '';
    byId('answer-count').textContent = '0 / 1200';
    setupPanel.hidden = true;
    resultPanel.hidden = true;
    sessionPanel.hidden = false;
    updateProgress();
    sessionPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showResult(session, material) {
    const summary = summarizeSession(session, material.target_ideas || []);
    byId('result-level').textContent = summary.level;
    byId('result-note').textContent = `Indikator frasa yang cocok: ${summary.percent}%. Ini pencocokan kata sederhana, bukan penilaian semantik; sinonim mungkin tidak terdeteksi.`;
    const list = byId('concept-list');
    list.replaceChildren();
    material.target_ideas.forEach((idea) => {
        const item = document.createElement('li');
        const matched = summary.understood.includes(idea);
        item.className = matched ? 'concept-hit' : 'concept-missing';
        item.textContent = `${matched ? 'Terlihat di jawaban' : 'Bisa dilatih lagi'}: ${idea}`;
        list.append(item);
    });
    byId('result-recommendation').textContent = 'Coba ulangi dengan kata-katamu sendiri atau buat contoh baru. Jawaban lengkap tetap kamu tentukan sendiri.';
    sessionPanel.hidden = true;
    resultPanel.hidden = false;
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderHistory() {
    historyList.replaceChildren();
    historyEmpty.hidden = history.length > 0;
    history.forEach((session) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        const date = new Date(session.createdAt);
        const label = `${session.status === 'completed' ? 'Selesai' : 'Berlangsung'} · Kelas ${session.grade} · ${session.materialTitle} · ${Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('id-ID')}`;
        button.textContent = label;
        button.addEventListener('click', () => {
            const material = (curriculum[session.grade] || []).find((entry) => entry.key === session.materialKey);
            if (!material) {
                setStatus('Materi riwayat ini tidak ditemukan di kurikulum.');
                return;
            }
            showSession(session, material);
            if (session.status === 'completed') showResult(session, material);
        });
        item.append(button);
        historyList.append(item);
    });
}

function newId() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function initialize() {
    try {
        const response = await fetch('/guru-curriculum.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error('Kurikulum belum dapat dimuat.');
        curriculum = await response.json();
        populateMaterials();
        renderHistory();
        if (!storageAvailable) byId('storage-warning').hidden = false;
    } catch {
        setStatus('Materi belum dapat dimuat. Muat ulang halaman saat koneksi tersedia.');
        byId('start-form').querySelector('button').disabled = true;
    }
}

gradeSelect.addEventListener('change', populateMaterials);
materialSelect.addEventListener('change', updateObjective);

byId('start-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const material = selectedMaterial();
    if (!material) return;
    const session = {
        id: newId(),
        grade: Number(gradeSelect.value),
        materialKey: material.key,
        materialTitle: material.title,
        currentQuestion: material.opening_question,
        currentHint: null,
        hintCount: 0,
        turns: [],
        status: 'active',
        createdAt: new Date().toISOString(),
    };
    persistSession(session);
    showSession(session, material);
    setStatus('Sesi baru dimulai. Coba jelaskan idemu kepada murid.');
});

studentAnswer.addEventListener('input', () => {
    byId('answer-count').textContent = `${studentAnswer.value.length} / 1200`;
});

byId('answer-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!activeSession || !studentAnswer.value.trim()) return;
    const material = (curriculum[activeSession.grade] || []).find((entry) => entry.key === activeSession.materialKey);
    if (!material) return;
    const result = evaluateAnswer(studentAnswer.value, material.target_ideas || []);
    const turn = {
        question: activeSession.currentQuestion,
        answer: studentAnswer.value.trim(),
        matchedIdeas: result.matchedIdeas,
        missedIdeas: result.missedIdeas,
    };
    activeSession.turns.push(turn);
    activeSession.currentHint = null;
    activeSession.currentQuestion = nextQuestion(material, activeSession.turns.length);
    appendTurn(turn, activeSession.turns.length - 1);
    showQuestion(activeSession.currentQuestion);
    studentAnswer.value = '';
    byId('answer-count').textContent = '0 / 1200';
    byId('hint-box').hidden = true;
    persistSession(activeSession);
    updateProgress();
    setStatus(result.matchedIdeas.length
        ? `Aku menemukan ${result.matchedIdeas.length} frasa konsep pada penjelasanmu. Periksa indikatornya di ringkasan.`
        : 'Frasa konsep belum terdeteksi. Kamu boleh memakai petunjuk atau menjelaskan dengan cara lain.');
});

byId('hint-button').addEventListener('click', () => {
    if (!activeSession) return;
    const material = (curriculum[activeSession.grade] || []).find((entry) => entry.key === activeSession.materialKey);
    const hint = material?.hints?.[activeSession.hintCount];
    if (!hint) {
        setStatus('Petunjuk untuk materi ini sudah digunakan.');
        return;
    }
    activeSession.hintCount += 1;
    activeSession.currentHint = hint;
    byId('hint-box').textContent = `Petunjuk ${activeSession.hintCount}: ${hint}`;
    byId('hint-box').hidden = false;
    persistSession(activeSession);
    setStatus('Gunakan petunjuk untuk menjelaskan dengan bahasamu sendiri.');
});

byId('finish-button').addEventListener('click', () => {
    if (!activeSession || activeSession.turns.length < MIN_TURNS) return;
    const material = (curriculum[activeSession.grade] || []).find((entry) => entry.key === activeSession.materialKey);
    if (!material) return;
    activeSession.status = 'completed';
    activeSession.completedAt = new Date().toISOString();
    persistSession(activeSession);
    showResult(activeSession, material);
    setStatus('Ringkasan sesi siap. Hasilnya berasal dari pencocokan frasa lokal.');
});

byId('new-session-button').addEventListener('click', () => {
    resultPanel.hidden = true;
    setupPanel.hidden = false;
    setStatus('Pilih materi untuk memulai sesi baru.');
    setupPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

byId('clear-history-button').addEventListener('click', () => {
    history = [];
    activeSession = null;
    const saved = writeHistory(history);
    storageAvailable = saved;
    sessionPanel.hidden = true;
    resultPanel.hidden = true;
    setupPanel.hidden = false;
    renderHistory();
    byId('storage-warning').hidden = saved;
    setStatus(saved ? 'Riwayat lokal di browser ini sudah dihapus.' : 'Penyimpanan tidak tersedia; riwayat hanya dibersihkan untuk halaman ini.');
});

initialize();
