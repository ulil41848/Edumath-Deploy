(() => {
    const root = document.querySelector('.guru-mode-shell');
    const curriculumElement = document.getElementById('guru-mode-curriculum');
    if (!root || !curriculumElement) return;

    let curriculum;
    try {
        curriculum = JSON.parse(curriculumElement.textContent);
    } catch (error) {
        return;
    }

    const byId = (id) => document.getElementById(id);
    const gradeSelect = byId('guru-mode-grade');
    const materialSelect = byId('guru-mode-material');
    const status = byId('guru-mode-status');
    const conversation = byId('guru-mode-conversation');
    const sessionCard = byId('guru-mode-session');
    const resultCard = byId('guru-mode-result');
    const answer = byId('guru-mode-answer');
    const answerForm = byId('guru-mode-answer-form');
    const startForm = byId('guru-mode-start-form');
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    const endpoint = root.dataset.sessionEndpoint;
    let activeSession = null;
    let minTurns = 3;
    let maxTurns = 5;
    let turnCount = 0;
    let lastSelection = null;

    function setStatus(message = '') {
        status.textContent = message;
    }

    async function request(path, options = {}) {
        const response = await fetch(path, {
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token || '',
                ...(options.headers || {}),
            },
            ...options,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const validation = data.errors && Object.values(data.errors).flat()[0];
            throw new Error(validation || data.message || 'Permintaan tidak berhasil. Coba lagi.');
        }
        return data;
    }

    function populateMaterials() {
        const entries = curriculum[gradeSelect.value] || [];
        materialSelect.replaceChildren();
        entries.forEach((material) => {
            const option = document.createElement('option');
            option.value = material.key;
            option.textContent = material.title;
            materialSelect.append(option);
        });
    }

    function addBubble(role, text) {
        const bubble = document.createElement('div');
        bubble.className = `guru-mode-bubble guru-mode-bubble-${role}`;
        const label = document.createElement('p');
        label.textContent = role === 'murid' ? 'Murid' : 'Guru Cilik';
        const content = document.createElement('div');
        content.textContent = text;
        bubble.append(label, content);
        conversation.append(bubble);
        bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function updateProgress() {
        byId('guru-mode-progress').textContent = `${turnCount} / ${maxTurns} jawaban`;
        byId('guru-mode-complete-button').hidden = turnCount < minTurns;
        answer.disabled = turnCount >= maxTurns;
        answerForm.querySelector('[type="submit"]').disabled = turnCount >= maxTurns;
        byId('guru-mode-hint-button').disabled = turnCount >= maxTurns;
    }

    function setBusy(form, busy) {
        form.querySelectorAll('button').forEach((button) => {
            button.disabled = busy;
        });
    }

    function populateList(id, values, emptyText) {
        const list = byId(id);
        list.replaceChildren();
        (values.length ? values : [emptyText]).forEach((value) => {
            const item = document.createElement('li');
            item.textContent = value;
            list.append(item);
        });
    }

    function renderEvaluation(evaluation, title = 'Sesi selesai') {
        const levels = {
            insufficient: 'Perlu lebih banyak latihan',
            guidance: 'Mari belajar bersama lagi',
            developing: 'Pemahamanmu sedang berkembang',
            good: 'Kamu sudah memahami banyak bagian',
            strong: 'Kamu menjelaskan konsep dengan kuat',
        };
        byId('guru-mode-result-level').textContent = levels[evaluation.level] || title;
        byId('guru-mode-estimate-note').textContent = evaluation.interpretation_note || 'Ringkasan ini berdasarkan jawabanmu pada sesi ini.';
        const criterionLabels = {
            concept_accuracy: 'Ketepatan konsep',
            calculation_accuracy: 'Ketepatan perhitungan',
            completeness: 'Kelengkapan penjelasan',
            example_quality: 'Kesesuaian contoh',
            reasoning_consistency: 'Konsistensi alasan',
        };
        const criteria = byId('guru-mode-criteria');
        criteria.replaceChildren();
        Object.entries(criterionLabels).forEach(([key, label]) => {
            const item = document.createElement('li');
            const score = evaluation.criteria?.[key];
            item.textContent = `${label}: ${score === null || score === undefined ? 'belum cukup bukti' : `${score} dari 3`}`;
            criteria.append(item);
        });
        populateList('guru-mode-understood', evaluation.concepts_understood || [], 'Belum ada konsep yang tercatat.');
        populateList('guru-mode-misconceptions', evaluation.misconceptions || [], 'Tidak ada miskonsepsi yang tercatat.');
        byId('guru-mode-recommendation').textContent = evaluation.practice_recommendation || '';
        byId('guru-mode-example').textContent = evaluation.example_explanation || '';
        const material = (curriculum[gradeSelect.value] || []).find((item) => item.key === (lastSelection?.material_key || materialSelect.value));
        const studyNote = byId('guru-mode-study-note');
        studyNote.textContent = material?.study_note || '';
        studyNote.hidden = !material?.study_note;
        sessionCard.hidden = true;
        resultCard.hidden = false;
    }

    async function loadHistory() {
        const list = byId('guru-mode-history-list');
        const empty = byId('guru-mode-history-empty');
        try {
            const data = await request(endpoint, { method: 'GET' });
            list.replaceChildren();
            empty.hidden = data.sessions.length > 0;
            data.sessions.forEach((session) => {
                const item = document.createElement('li');
                const button = document.createElement('button');
                const label = document.createElement('span');
                label.textContent = `Kelas ${session.grade} · ${session.material_title} · ${session.status === 'completed' ? 'Selesai' : 'Berlangsung'}`;
                button.append(label);
                button.addEventListener('click', () => openHistorySession(session.id));
                item.append(button);
                list.append(item);
            });
        } catch (error) {
            empty.hidden = false;
            empty.textContent = 'Riwayat belum dapat dimuat. Periksa koneksi lalu coba lagi.';
        }
    }

    async function openHistorySession(id) {
        try {
            const data = await request(`${endpoint}/${id}`, { method: 'GET' });
            const session = data.session;
            lastSelection = { grade: String(session.grade), material_key: session.material_key };
            gradeSelect.value = String(session.grade);
            populateMaterials();
            materialSelect.value = session.material_key;
            activeSession = session.id;
            turnCount = (session.turns || []).length;
            minTurns = 3;
            maxTurns = 5;
            byId('guru-mode-session-grade').textContent = `Kelas ${session.grade} SD`;
            byId('guru-mode-session-title').textContent = session.material_title;
            conversation.replaceChildren();
            (session.turns || []).forEach((turn) => {
                addBubble('murid', turn.question);
                if (turn.hint) addBubble('guru', `Petunjuk: ${turn.hint}`);
                addBubble('guru', `Jawaban murid: ${turn.answer}`);
                addBubble('murid', turn.feedback);
            });
            if (session.status === 'active') addBubble('murid', session.current_question);
            resultCard.hidden = true;
            sessionCard.hidden = false;
            byId('guru-mode-setup').hidden = true;
            answer.value = '';
            updateProgress();
            if (session.status === 'completed' && session.evaluation) {
                renderEvaluation(session.evaluation);
            }
            sessionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            setStatus(error.message);
        }
    }

    gradeSelect.addEventListener('change', populateMaterials);
    populateMaterials();

    startForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setStatus('Menyiapkan sesi…');
        setBusy(startForm, true);
        lastSelection = { grade: gradeSelect.value, material_key: materialSelect.value };
        try {
            const data = await request(endpoint, {
                method: 'POST',
                body: JSON.stringify(lastSelection),
            });
            activeSession = data.session.id;
            turnCount = data.session.turn_count;
            minTurns = data.session.min_turns;
            maxTurns = data.session.max_turns;
            byId('guru-mode-session-grade').textContent = `Kelas ${data.session.grade} SD`;
            byId('guru-mode-session-title').textContent = data.session.material_title;
            conversation.replaceChildren();
            addBubble('murid', data.session.current_question);
            resultCard.hidden = true;
            sessionCard.hidden = false;
            byId('guru-mode-setup').hidden = true;
            answer.value = '';
            byId('guru-mode-hint').hidden = true;
            updateProgress();
            setStatus('Sesi dimulai. Coba jelaskan dengan bahasamu sendiri.');
            sessionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            loadHistory();
        } catch (error) {
            setStatus(error.message);
        } finally {
            setBusy(startForm, false);
        }
    });

    answer.addEventListener('input', () => {
        byId('guru-mode-character-count').textContent = `${answer.value.length} / 1200`;
    });

    answerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!activeSession || !answer.value.trim()) return;
        const submittedAnswer = answer.value.trim();
        setStatus('Murid sedang berpikir…');
        setBusy(answerForm, true);
        try {
            const data = await request(`${endpoint}/${activeSession}/turns`, {
                method: 'POST',
                body: JSON.stringify({ answer: submittedAnswer }),
            });
            addBubble('guru', submittedAnswer);
            addBubble('murid', data.feedback);
            if (data.next_question) addBubble('murid', data.next_question);
            answer.value = '';
            byId('guru-mode-character-count').textContent = '0 / 1200';
            byId('guru-mode-hint').hidden = true;
            turnCount = data.turn_count;
            updateProgress();
            setStatus('Penjelasanmu sudah tersimpan.');
            loadHistory();
        } catch (error) {
            setStatus(error.message);
        } finally {
            setBusy(answerForm, false);
            updateProgress();
        }
    });

    byId('guru-mode-hint-button').addEventListener('click', async () => {
        if (!activeSession) return;
        setStatus('Mencari petunjuk…');
        try {
            const data = await request(`${endpoint}/${activeSession}/hints`, {
                method: 'POST', body: JSON.stringify({}),
            });
            const hint = byId('guru-mode-hint');
            hint.textContent = `Petunjuk ${data.hint_count}/${data.hint_limit}: ${data.hint}`;
            hint.hidden = false;
            setStatus('Gunakan petunjuk ini untuk menyusun penjelasanmu.');
        } catch (error) {
            setStatus(error.message);
        }
    });

    byId('guru-mode-complete-button').addEventListener('click', async () => {
        if (!activeSession) return;
        setStatus('Menyusun ringkasan belajar…');
        try {
            const data = await request(`${endpoint}/${activeSession}/complete`, {
                method: 'POST', body: JSON.stringify({}),
            });
            renderEvaluation(data.evaluation);
            setStatus('Ringkasan belajarmu sudah siap.');
            loadHistory();
        } catch (error) {
            setStatus(error.message);
        }
    });

    byId('guru-mode-retry-button').addEventListener('click', () => {
        resultCard.hidden = true;
        sessionCard.hidden = true;
        byId('guru-mode-setup').hidden = false;
        startForm.requestSubmit();
    });

    byId('guru-mode-study-button').addEventListener('click', () => {
        const material = (curriculum[gradeSelect.value] || []).find((item) => item.key === (lastSelection?.material_key || materialSelect.value));
        if (material) {
            const studyNote = byId('guru-mode-study-note');
            studyNote.hidden = false;
            studyNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    const observer = new MutationObserver(() => {
        if (!document.getElementById('guru').classList.contains('hidden')) loadHistory();
    });
    observer.observe(document.getElementById('guru'), { attributes: true, attributeFilter: ['class'] });
    loadHistory();
})();
