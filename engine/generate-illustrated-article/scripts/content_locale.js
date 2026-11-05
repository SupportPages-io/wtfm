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
    de: {
        // "Wie Sie ein Projekt erstellen" — a statement that keeps the goal's
        // infinitive word order, so the title contains the plan's canonical_goal
        // ("ein Projekt erstellen"). "So erstellen Sie …" moves the verb and would
        // not. "Wie erstelle ich ein Projekt?" is a question (FAQ).
        howTo: /^wie (?:sie|man)(?![\p{L}])(?!.*\?\s*$)/iu,
        howToHint: '"Wie Sie"',
        // "Was ist ein Projekt?", "Projekte verstehen", "Grundlagen …", "Über …".
        concept: /^(?:was (?:ist|sind)(?![\p{L}])|grundlagen(?![\p{L}])|überblick(?![\p{L}])|einführung(?![\p{L}])|über(?![\p{L}]))|(?:^|\s)verstehen\s*$/iu,
        // German questions open with a question word or with the verb
        // ("Kann ich …?", "Gibt es …?").
        faq: /^(?:wie|was|warum|wieso|weshalb|wozu|wo|woher|wohin|womit|wofür|worauf|wann|welche[rsmn]?|wer|wen|wem|kann|können|darf|dürfen|muss|müssen|soll|sollte|gibt|ist|sind|hat|haben|wird|werden|lässt|funktioniert|unterstützt|brauche|benötige)(?![\p{L}])/iu,
        inferTroubleshooting: /^(?:warum(?![\p{L}])|was (?:tun|ist zu tun),? (?:wenn|falls)(?![\p{L}])|fehlerbehebung(?![\p{L}]))/iu,
        inferConcept: /^(?:was (?:ist|sind)(?![\p{L}])|grundlagen(?![\p{L}])|überblick(?![\p{L}])|einführung(?![\p{L}]))|(?:^|\s)verstehen\s*$/iu,
        inferFaq: /^(?:kann|können|darf|dürfen|muss|müssen|gibt|wann|wo|welche[rsmn]?)(?![\p{L}])/iu,
        prefixes: [
            'wie sie ', 'wie man ', 'was tun wenn ', 'was tun falls ', 'was ist zu tun wenn ',
            'was ist ', 'was sind ', 'grundlagen ', 'warum ',
        ],
        coordination: /(?:^|[^\p{L}])(?:und|oder)(?=$|[^\p{L}])/iu,
    },
    it: {
        // "Come creare un progetto" — a statement; "Come si crea un progetto?" is a question.
        howTo: /^come(?![\p{L}])(?!.*\?\s*$)/iu,
        howToHint: '"Come"',
        concept: /^(?:capire|comprendere|informazioni su|(?:che )?cos['’](?:è|e)|(?:che )?cosa (?:è|sono))(?![\p{L}])/iu,
        // A question word, or the verb a yes/no question opens with ("Posso …?",
        // "Si può …?", "È possibile …?").
        faq: /^(?:come|perché|perche|dove|quando|quant[oaie]|chi|che|cosa|cos['’]|qual|quale|quali|posso|possiamo|si può|si possono|è possibile|devo|serve|esiste|c['’]è|ci sono)(?![\p{L}])/iu,
        inferTroubleshooting: /^(?:perché|perche|(?:che )?cosa fare (?:se|quando)|risoluzione dei problemi)(?![\p{L}])/iu,
        inferConcept: /^(?:capire|comprendere|informazioni su|(?:che )?cos['’](?:è|e)|(?:che )?cosa (?:è|sono))(?![\p{L}])/iu,
        inferFaq: /^(?:dove|quando|quant[oaie]|qual|quale|quali|posso|possiamo|si può|è possibile|devo)(?![\p{L}])/iu,
        prefixes: [
            'come ', 'cosa fare se ', 'cosa fare quando ', 'che cosa fare se ', 'che cosa fare quando ',
            'capire ', 'comprendere ', 'che cose ', 'cose ', 'che cosa sono ', 'cosa sono ', 'perche ',
        ],
        // "è" (is) is a different letter from "e" (and), so it never matches.
        coordination: /(?:^|[^\p{L}])(?:e|ed|o|oppure)(?=$|[^\p{L}])/iu,
    },
    es: {
        // "Cómo crear un proyecto" — a statement; "¿Cómo creo un proyecto?" is a question.
        howTo: /^c[oó]mo(?![\p{L}])(?!.*\?\s*$)/iu,
        howToHint: '"Cómo"',
        concept: /^(?:¿?qu[eé] (?:es|son)|entender|comprender|información sobre|acerca de)(?![\p{L}])/iu,
        // Spanish questions open with "¿", whatever their first word.
        faq: /^¿/,
        inferTroubleshooting: /^(?:¿?por qu[eé]|qu[eé] hacer (?:si|cuando)|soluci[oó]n de problemas)(?![\p{L}])/iu,
        inferConcept: /^(?:¿?qu[eé] (?:es|son)|entender|comprender|información sobre|acerca de)(?![\p{L}])/iu,
        inferFaq: /^¿/,
        prefixes: [
            'como ', 'que hacer si ', 'que hacer cuando ', 'entender ', 'comprender ',
            'que es ', 'que son ', 'por que ',
        ],
        // "y"/"o", and their forms before i-/o- words ("e", "u").
        coordination: /(?:^|[^\p{L}])(?:y|o|e|u)(?=$|[^\p{L}])/iu,
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
