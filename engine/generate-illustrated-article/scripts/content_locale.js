'use strict';
// Per-language title framing for the content language RTFM passes as
// `content_locale` in RTFM_CONTEXT_FILE (blank = English). Shared by
// recommend-articles' finalize_intent_plan.js and lint_article_copy.js, so a
// French plan and a French article are judged by the same rules.
//
// A locale with no entry here is unknown: its framing checks pass and its
// prefixes are empty, so an unlisted language is never rejected for not
// reading like English. Add a language by adding an entry.

const RULES = {
    en: {
        howTo: /^how to\b/i,
        howToHint: '"How to"',
        concept: /^(?:understanding\b|what (?:is|are)\b)/i,
        faq: /^(?:can|could|do|does|is|are|will|would|should|where|when|who|which|what|why|how)\b/i,
        inferTroubleshooting: /^(?:why\b|what to do when\b|what should i do when\b)/i,
        inferConcept: /^(?:understanding\b|what (?:is|are)\b)/i,
        inferFaq: /^(?:can|could|do|does|is|are|will|should|where|when)\b/i,
        // Matched against normalizeText() output: lower-case, no accents or apostrophes.
        prefixes: [
            'how to ', 'what to do when ', 'what should i do when ',
            'understanding ', 'what is ', 'what are ', 'why ',
        ],
        coordination: /\b(?:and|or)\b/i,
    },
    fr: {
        // "Comment créer un projet" — a how-to is a statement, not a question.
        howTo: /^comment\b(?!.*\?\s*$)/i,
        howToHint: '"Comment"',
        concept: /^(?:comprendre\b|qu['’]est-ce qu(?:e\b|['’]))/i,
        // French questions start with a question word, "est-ce que", or an
        // inverted subject ("Puis-je", "Peut-on", "Faut-il").
        faq: /^(?:est-ce qu|pourquoi\b|o[uù](?=[\s,]|$)|quand\b|combien\b|comment\b|que\b|qu['’]|qui\b|quel(?:le)?s?\b|lequel\b|laquelle\b|[^\s?]+-(?:t-)?(?:je|tu|il|elle|on|nous|vous|ils|elles)\b)/i,
        inferTroubleshooting: /^(?:pourquoi\b|que faire (?:si|lorsque|quand)\b)/i,
        inferConcept: /^(?:comprendre\b|qu['’]est-ce qu)/i,
        inferFaq: /^(?:est-ce qu|o[uù](?=[\s,]|$)|quand\b|combien\b|[^\s?]+-(?:t-)?(?:je|tu|il|elle|on|nous|vous|ils|elles)\b)/i,
        prefixes: [
            'comment ', 'que faire si ', 'que faire lorsque ', 'que faire quand ',
            'comprendre ', 'quest ce que ', 'quest ce qu ', 'pourquoi ',
        ],
        coordination: /(?:^|[^\p{L}])(?:et|ou)(?=$|[^\p{L}])/iu,
    },
};

function localeCode(value) {
    const code = String(value || '').trim().toLowerCase().split(/[-_]/)[0];
    return code || 'en';
}

// The rules for a locale code or a context object carrying content_locale.
function rulesFor(source) {
    const code = localeCode(source && typeof source === 'object' ? source.content_locale : source);
    return { code, known: Object.prototype.hasOwnProperty.call(RULES, code), ...(RULES[code] || {}) };
}

function titleMatchesType(title, intentType, rules = rulesFor('en')) {
    const value = String(title || '').trim();
    if (!rules.known) return ['how-to', 'concept', 'faq', 'troubleshooting'].includes(intentType);
    if (intentType === 'how-to') return rules.howTo.test(value);
    if (intentType === 'concept') return rules.concept.test(value);
    if (intentType === 'faq') return /\?$/.test(value) && rules.faq.test(value);
    if (intentType === 'troubleshooting') return !rules.howTo.test(value);
    return false;
}

function inferArticleType(title, rules = rulesFor('en')) {
    if (!rules.known) return null;
    const value = String(title || '').trim();
    if (rules.inferTroubleshooting.test(value)) return 'troubleshooting';
    if (rules.inferConcept.test(value)) return 'concept';
    if (rules.inferFaq.test(value)) return 'faq';
    if (rules.howTo.test(value)) return 'how-to';
    return null;
}

function containsCoordination(value, rules = rulesFor('en')) {
    return rules.known ? rules.coordination.test(String(value || '')) : false;
}

module.exports = { RULES, rulesFor, titleMatchesType, inferArticleType, containsCoordination };
