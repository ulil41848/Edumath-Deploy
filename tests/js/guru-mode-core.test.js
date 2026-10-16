import assert from 'node:assert/strict';
import test from 'node:test';
import {
    HISTORY_LIMIT,
    HISTORY_STORAGE_KEY,
    evaluateAnswer,
    readHistory,
    summarizeSession,
    writeHistory,
} from '../../public/aplikasi/guru-mode-core.js';

function memoryStorage() {
    const values = new Map();
    return {
        getItem(key) { return values.get(key) ?? null; },
        setItem(key, value) { values.set(key, value); },
    };
}

test('evaluates only configured phrase indicators and summarizes a session', () => {
    const ideas = ['nilai tempat', 'penjumlahan berulang'];
    const evaluation = evaluateAnswer('Nilai tempat membantu memahami angka.', ideas);

    assert.deepEqual(evaluation.matchedIdeas, ['nilai tempat']);
    assert.deepEqual(evaluation.missedIdeas, ['penjumlahan berulang']);
    assert.equal(evaluation.percent, 50);
    assert.equal(summarizeSession({ turns: [{ matchedIdeas: ['nilai tempat'] }] }, ideas).percent, 50);
});

test('history survives a storage round trip and is capped', () => {
    const storage = memoryStorage();
    const sessions = Array.from({ length: HISTORY_LIMIT + 2 }, (_, index) => ({
        id: String(index),
        turns: [],
    }));

    assert.equal(writeHistory(sessions, storage), true);
    assert.equal(storage.getItem(HISTORY_STORAGE_KEY) !== null, true);
    assert.equal(readHistory(storage).length, HISTORY_LIMIT);
});

test('storage failures are handled without throwing', () => {
    const unavailable = {
        getItem() { throw new Error('blocked'); },
        setItem() { throw new Error('blocked'); },
    };

    assert.deepEqual(readHistory(unavailable), []);
    assert.equal(writeHistory([], unavailable), false);
});
