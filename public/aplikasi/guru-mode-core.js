export const HISTORY_STORAGE_KEY = 'edumath-guru-mode-history-v1';
export const HISTORY_LIMIT = 20;
export const MIN_TURNS = 3;
export const MAX_TURNS = 5;

export function normalizePhrase(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('id')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

export function evaluateAnswer(answer, targetIdeas) {
    const normalizedAnswer = normalizePhrase(answer);
    const matchedIdeas = [];
    const missedIdeas = [];

    targetIdeas.forEach((idea) => {
        const normalizedIdea = normalizePhrase(idea);
        const terms = normalizedIdea.split(' ').filter((term) => term.length > 2);
        const termMatches = terms.filter((term) => normalizedAnswer.split(' ').includes(term));
        const requiredMatches = terms.length <= 1 ? terms.length : Math.max(2, Math.ceil(terms.length * 0.65));
        const matches = normalizedIdea.length > 0 && (
            normalizedAnswer.includes(normalizedIdea) ||
            termMatches.length >= requiredMatches
        );

        (matches ? matchedIdeas : missedIdeas).push(idea);
    });

    return {
        matchedIdeas,
        missedIdeas,
        percent: targetIdeas.length === 0 ? 0 : Math.round((matchedIdeas.length / targetIdeas.length) * 100),
    };
}

export function summarizeSession(session, targetIdeas) {
    const found = new Set((session.turns || []).flatMap((turn) => turn.matchedIdeas || []));
    const understood = targetIdeas.filter((idea) => found.has(idea));
    const percent = targetIdeas.length === 0 ? 0 : Math.round((understood.length / targetIdeas.length) * 100);
    const level = percent >= 75 ? 'Mantap, banyak konsep sudah kamu jelaskan'
        : percent >= 35 ? 'Pemahamanmu sedang berkembang'
            : 'Ayo berlatih menjelaskan konsep lagi';

    return { level, percent, understood, toReview: targetIdeas.filter((idea) => !found.has(idea)) };
}

export function readHistory(storage = undefined) {
    try {
        const store = storage ?? globalThis.localStorage;
        const parsed = JSON.parse(store.getItem(HISTORY_STORAGE_KEY) || '[]');
        return Array.isArray(parsed)
            ? parsed.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.turns)).slice(0, HISTORY_LIMIT)
            : [];
    } catch {
        return [];
    }
}

export function writeHistory(sessions, storage = undefined) {
    try {
        const store = storage ?? globalThis.localStorage;
        store.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sessions.slice(0, HISTORY_LIMIT)));
        return true;
    } catch {
        return false;
    }
}
