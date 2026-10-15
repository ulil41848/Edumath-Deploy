(() => {
    const questions = [
        { question: 'Berapakah 7 × 8?', choices: ['54', '56', '64', '58'], answer: 1, note: '7 × 8 = 56.' },
        { question: 'Hasil dari 3/4 + 1/4 adalah…', choices: ['1/2', '1', '4/8', '2'], answer: 1, note: 'Penyebut sama, jadi (3 + 1)/4 = 1.' },
        { question: 'Luas persegi dengan sisi 6 cm adalah…', choices: ['12 cm²', '24 cm²', '36 cm²', '30 cm²'], answer: 2, note: 'Luas persegi = sisi × sisi = 6 × 6 = 36 cm².' },
        { question: 'Berapakah 15% dari 200?', choices: ['20', '25', '30', '35'], answer: 2, note: '15% × 200 = 0,15 × 200 = 30.' },
        { question: 'Jika 2x + 5 = 17, maka nilai x adalah…', choices: ['5', '6', '7', '11'], answer: 1, note: '2x = 12, sehingga x = 6.' },
        { question: 'Keliling persegi panjang dengan panjang 8 cm dan lebar 3 cm adalah…', choices: ['11 cm', '22 cm', '24 cm', '48 cm'], answer: 1, note: 'Keliling = 2 × (8 + 3) = 22 cm.' },
        { question: 'Berapakah √81?', choices: ['8', '9', '10', '18'], answer: 1, note: '9 × 9 = 81, jadi √81 = 9.' },
        { question: 'Pola 2, 5, 8, 11, … berlanjut dengan angka…', choices: ['12', '13', '14', '15'], answer: 2, note: 'Pola bertambah 3, jadi angka berikutnya 14.' }
    ];

    const questionEl = document.getElementById('quiz-question');
    const optionsEl = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');
    const actionEl = document.getElementById('quiz-action');
    const metaEl = document.getElementById('quiz-meta');
    let round = [];
    let position = 0;
    let score = 0;
    let answered = false;
    let completed = false;

    const readStats = () => {
        try {
            const value = JSON.parse(localStorage.getItem('edumath-static-stats') || '{}');
            return { best: Number(value.best) || 0, played: Number(value.played) || 0 };
        } catch {
            return { best: 0, played: 0 };
        }
    };

    const showStats = () => {
        const stats = readStats();
        metaEl.textContent = `Skor terbaik: ${stats.best} / 5 · Kuis selesai: ${stats.played}`;
    };

    const startQuiz = () => {
        round = [...questions].sort(() => Math.random() - 0.5).slice(0, 5);
        position = 0;
        score = 0;
        answered = false;
        completed = false;
        actionEl.hidden = true;
        feedbackEl.textContent = '';
        renderQuestion();
    };

    const renderQuestion = () => {
        const item = round[position];
        questionEl.textContent = `Soal ${position + 1} dari ${round.length}: ${item.question}`;
        optionsEl.replaceChildren();
        item.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quiz-option';
            button.textContent = `${String.fromCharCode(65 + index)}. ${choice}`;
            button.addEventListener('click', () => chooseAnswer(index));
            optionsEl.append(button);
        });
        answered = false;
    };

    const chooseAnswer = (selected) => {
        if (answered) return;
        answered = true;
        const item = round[position];
        const correct = selected === item.answer;
        if (correct) score += 1;
        [...optionsEl.children].forEach((button, index) => {
            button.disabled = true;
            if (index === item.answer) button.classList.add('is-correct');
            if (index === selected && !correct) button.classList.add('is-wrong');
        });
        feedbackEl.textContent = `${correct ? 'Benar!' : 'Belum tepat.'} ${item.note}`;
        actionEl.textContent = position === round.length - 1 ? 'Lihat hasil' : 'Soal berikutnya';
        actionEl.hidden = false;
    };

    const finishQuiz = () => {
        const stats = readStats();
        const played = stats.played + 1;
        const best = Math.max(stats.best, score);
        try {
            localStorage.setItem('edumath-static-stats', JSON.stringify({ best, played }));
        } catch { /* Kuis tetap bisa digunakan jika penyimpanan browser dimatikan. */ }
        showStats();
        questionEl.textContent = `Skormu ${score} dari ${round.length}. ${score === round.length ? 'Sempurna, hebat!' : 'Terus berlatih, ya!'}`;
        optionsEl.replaceChildren();
        feedbackEl.textContent = 'Skor terbaik tersimpan secara lokal di browser ini.';
        actionEl.textContent = 'Coba kuis lagi';
        completed = true;
    };

    actionEl.addEventListener('click', () => {
        if (!round.length || completed) {
            startQuiz();
            return;
        }
        if (!answered) return;
        if (position < round.length - 1) {
            position += 1;
            actionEl.hidden = true;
            feedbackEl.textContent = '';
            renderQuestion();
            return;
        }
        finishQuiz();
    });

    document.getElementById('calculator-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const first = Number(form.get('first'));
        const second = Number(form.get('second'));
        const operator = form.get('operator');
        const resultEl = document.getElementById('calculator-result');
        if (operator === '/' && second === 0) {
            resultEl.textContent = 'Tidak bisa membagi dengan nol.';
            return;
        }
        const result = operator === '+' ? first + second
            : operator === '-' ? first - second
                : operator === '*' ? first * second : first / second;
        resultEl.textContent = `Hasil: ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 8 }).format(result)}`;
    });

    const searchEl = document.getElementById('feature-search');
    const cards = [...document.querySelectorAll('.rd-categories [data-feature]')];
    const emptyEl = document.getElementById('feature-empty');
    searchEl.addEventListener('input', () => {
        const query = searchEl.value.trim().toLocaleLowerCase('id');
        let visible = 0;
        cards.forEach((card) => {
            const matches = `${card.dataset.feature} ${card.textContent}`.toLocaleLowerCase('id').includes(query);
            card.hidden = !matches;
            if (matches) visible += 1;
        });
        emptyEl.hidden = visible > 0;
    });

    const botForm = document.getElementById('edubot-form');
    const botInput = document.getElementById('edubot-question');
    const botOutput = document.getElementById('edubot-output');
    const botReply = (question) => {
        const arithmetic = question.match(/(-?\d+(?:[.,]\d+)?)\s*([+\-×x*÷/])\s*(-?\d+(?:[.,]\d+)?)/i);
        if (arithmetic) {
            const left = Number(arithmetic[1].replace(',', '.'));
            const right = Number(arithmetic[3].replace(',', '.'));
            const symbol = arithmetic[2].toLowerCase();
            const operation = symbol === '×' || symbol === 'x' || symbol === '*' ? '×'
                : symbol === '÷' || symbol === '/' ? '÷' : symbol;
            if (operation === '÷' && right === 0) return 'Pembagian dengan nol tidak bisa dilakukan. Coba angka pembagi lain.';
            const result = operation === '+' ? left + right
                : operation === '-' ? left - right
                    : operation === '×' ? left * right : left / right;
            return `${left} ${operation} ${right} = ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 8 }).format(result)}. ${operation === '×' ? 'Perkalian bisa dipahami sebagai penjumlahan berulang.' : operation === '÷' ? 'Pembagian membagi jumlah menjadi kelompok yang sama.' : 'Periksa kembali tanda operasi dan nilainya.'}`;
        }
        const normalized = question.toLocaleLowerCase('id');
        if (normalized.includes('pecahan')) return 'Pecahan menyatakan bagian dari satu keseluruhan. Pada 3/4, angka 3 adalah pembilang (bagian yang diambil) dan 4 adalah penyebut (jumlah bagian yang sama besar).';
        if (normalized.includes('luas') && normalized.includes('persegi')) return 'Luas persegi = sisi × sisi. Contoh: sisi 5 cm menghasilkan luas 5 × 5 = 25 cm².';
        if (normalized.includes('persen') || normalized.includes('persentase')) return 'Persen berarti per seratus. Contoh: 25% = 25/100 = 0,25. Untuk mencari 25% dari 80, hitung 0,25 × 80 = 20.';
        return 'Aku bisa bantu hitung operasi dasar (contoh: 12 × 8), menjelaskan pecahan, persentase, atau luas persegi. Coba salah satu contoh di atas!';
    };
    const sendBotMessage = (message) => {
        const cleanMessage = message.trim();
        if (!cleanMessage) return;
        const userBubble = document.createElement('p');
        userBubble.className = 'chat-bubble user-bubble';
        userBubble.textContent = cleanMessage;
        const answerBubble = document.createElement('p');
        answerBubble.className = 'chat-bubble bot-bubble';
        answerBubble.textContent = botReply(cleanMessage);
        botOutput.replaceChildren(userBubble, answerBubble);
    };
    botForm.addEventListener('submit', (event) => {
        event.preventDefault();
        sendBotMessage(botInput.value);
    });
    document.querySelectorAll('[data-prompt]').forEach((button) => {
        button.addEventListener('click', () => {
            botInput.value = button.dataset.prompt;
            sendBotMessage(botInput.value);
        });
    });

    const libraryItems = [...document.querySelectorAll('.library-item')];
    const librarySearch = document.getElementById('library-search');
    const libraryEmpty = document.getElementById('library-empty');
    const libraryOutput = document.getElementById('library-output');
    librarySearch.addEventListener('input', () => {
        const query = librarySearch.value.trim().toLocaleLowerCase('id');
        let count = 0;
        libraryItems.forEach((item) => {
            const visible = `${item.dataset.library} ${item.textContent}`.toLocaleLowerCase('id').includes(query);
            item.hidden = !visible;
            if (visible) count += 1;
        });
        libraryEmpty.hidden = count > 0;
    });
    const bookNotes = {
        fraction: 'PECahan\n\nPecahan berbentuk a/b. a disebut pembilang, b disebut penyebut, dan b tidak boleh nol. Pecahan senilai punya nilai sama, misalnya 1/2 = 2/4. Untuk menjumlahkan pecahan berpenyebut sama, jumlahkan pembilangnya: 1/5 + 2/5 = 3/5.',
        geometry: 'LUAS DAN KELILING\n\nPersegi: luas = sisi × sisi, keliling = 4 × sisi.\nPersegi panjang: luas = panjang × lebar, keliling = 2 × (panjang + lebar).\nContoh: panjang 8 cm dan lebar 3 cm memiliki luas 24 cm² dan keliling 22 cm.',
        algebra: 'PERSAMAAN LINEAR\n\nVariabel adalah lambang nilai yang belum diketahui. Untuk menyelesaikan persamaan, lakukan operasi yang sama pada kedua sisi.\nContoh: 2x + 4 = 14 → 2x = 10 → x = 5.'
    };
    document.querySelectorAll('[data-read]').forEach((button) => {
        button.addEventListener('click', () => {
            libraryOutput.textContent = bookNotes[button.dataset.read] || 'Ringkasan belum tersedia.';
        });
    });

    document.querySelectorAll('.lesson-options').forEach((options) => {
        options.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-answer]');
            if (!button) return;
            const feedback = options.parentElement.querySelector('.lesson-feedback');
            [...options.querySelectorAll('button')].forEach((choice) => { choice.disabled = true; });
            feedback.textContent = button.dataset.answer === 'correct' ? 'Betul! Kamu memahami konsepnya.' : 'Belum tepat. Baca lagi ringkasan di atas dan coba pelajari langkahnya.';
            feedback.style.color = button.dataset.answer === 'correct' ? '#167653' : '#a34848';
        });
    });

    const scheduleForm = document.getElementById('schedule-form');
    const scheduleList = document.getElementById('schedule-list');
    const scheduleEmpty = document.getElementById('schedule-empty');
    const scheduleFeedback = document.getElementById('schedule-feedback');
    const scheduleStorageKey = 'edumath-static-schedule';
    const readSchedule = () => {
        try {
            const value = JSON.parse(localStorage.getItem(scheduleStorageKey) || '[]');
            return Array.isArray(value) ? value.filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string') : [];
        } catch { return []; }
    };
    const renderSchedule = () => {
        const items = readSchedule().sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
        scheduleList.replaceChildren();
        scheduleEmpty.hidden = items.length > 0;
        items.forEach((item) => {
            const row = document.createElement('li');
            row.className = 'schedule-item';
            const details = document.createElement('div');
            const title = document.createElement('strong');
            title.textContent = item.title;
            const date = document.createElement('small');
            const parsedDate = new Date(`${item.date}T${item.time}`);
            date.textContent = Number.isNaN(parsedDate.getTime()) ? `${item.date} · ${item.time}` : `${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(parsedDate)} · ${item.time}`;
            details.append(title, date);
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'remove-schedule';
            remove.textContent = 'Hapus';
            remove.setAttribute('aria-label', `Hapus jadwal ${item.title}`);
            remove.addEventListener('click', () => {
                try {
                    localStorage.setItem(scheduleStorageKey, JSON.stringify(readSchedule().filter((saved) => saved.id !== item.id)));
                    renderSchedule();
                    scheduleFeedback.textContent = 'Jadwal dihapus dari browser ini.';
                } catch { scheduleFeedback.textContent = 'Penyimpanan browser tidak tersedia.'; }
            });
            row.append(details, remove);
            scheduleList.append(row);
        });
    };
    const scheduleDateInput = scheduleForm.elements.date;
    const localToday = new Date();
    scheduleDateInput.min = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
    scheduleForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(scheduleForm);
        const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title: String(data.get('title')).trim(), date: String(data.get('date')), time: String(data.get('time')) };
        if (!entry.title || entry.date < scheduleDateInput.min) {
            scheduleFeedback.textContent = 'Pilih tanggal hari ini atau setelahnya dan isi nama kegiatan.';
            return;
        }
        try {
            const items = readSchedule();
            if (items.some((item) => item.date === entry.date && item.time === entry.time)) {
                scheduleFeedback.textContent = 'Sudah ada jadwal pada waktu tersebut. Pilih waktu lain.';
                return;
            }
            items.push(entry);
            localStorage.setItem(scheduleStorageKey, JSON.stringify(items));
            scheduleForm.reset();
            scheduleDateInput.min = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
            scheduleFeedback.textContent = 'Jadwal berhasil ditambahkan dan tersimpan di browser ini.';
            renderSchedule();
        } catch { scheduleFeedback.textContent = 'Penyimpanan browser tidak tersedia.'; }
    });
    renderSchedule();

    const teacherForm = document.getElementById('teacher-form');
    const teacherPreview = document.getElementById('teacher-preview');
    teacherForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const values = new FormData(teacherForm);
        const question = document.createElement('h3');
        question.textContent = String(values.get('question')).trim();
        const choices = ['choiceA', 'choiceB', 'choiceC', 'choiceD'].map((name) => String(values.get(name)).trim());
        const correct = Number(values.get('correct'));
        const feedback = document.createElement('p');
        feedback.className = 'teacher-preview-feedback';
        feedback.setAttribute('aria-live', 'polite');
        const buttons = choices.map((choice, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quiz-option';
            button.textContent = `${String.fromCharCode(65 + index)}. ${choice}`;
            button.addEventListener('click', () => {
                [...teacherPreview.querySelectorAll('.quiz-option')].forEach((option) => { option.disabled = true; });
                feedback.textContent = index === correct ? 'Benar! Jawabanmu tepat.' : `Belum tepat. Jawaban benar: ${String.fromCharCode(65 + correct)}. ${choices[correct]}`;
                feedback.style.color = index === correct ? '#167653' : '#a34848';
            });
            return button;
        });
        teacherPreview.replaceChildren(question, ...buttons, feedback);
    });

    showStats();
})();
