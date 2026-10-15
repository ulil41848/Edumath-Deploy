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

    showStats();
})();
