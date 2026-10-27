#!/usr/bin/env node
'use strict';
// One synthetic repo per translation layout: each probe finds exactly the
// French file(s) of its layout and the matching default-language file(s).

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { findLocaleFiles } = require('./find_locale_files.js');

function repo(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rtfm-locale-files-'));
    for (const [name, text] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
        fs.writeFileSync(path.join(dir, name), text);
    }
    return dir;
}

function probe(label, files, { target, defaults, format }) {
    const dir = repo(files);
    try {
        const result = findLocaleFiles(dir, 'fr');
        assert.deepStrictEqual(result.target_files, target, `${label}: target_files`);
        assert.deepStrictEqual(result.default_files, defaults, `${label}: default_files`);
        assert.strictEqual(result.has_locale, target.length > 0, `${label}: has_locale`);
        if (format) assert.deepStrictEqual(result.formats, [format], `${label}: formats`);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

probe('rails yaml', {
    'config/locales/en.yml': 'en:\n  save: Save\n',
    'config/locales/fr.yml': 'fr:\n  save: Enregistrer\n',
    'config/locales/models/user.fr.yml': 'fr:\n  user: Utilisateur\n',
}, { target: ['config/locales/fr.yml', 'config/locales/models/user.fr.yml'], defaults: ['config/locales/en.yml'], format: 'yaml' });

probe('rails yaml keyed by root, not filename', {
    'config/locales/devise.yml': '# Devise\nfr:\n  sign_in: Se connecter\n',
    'config/locales/devise.en.yml': 'en:\n  sign_in: Sign in\n',
    'config/database.yml': 'fr:\n  adapter: sqlite\n',
}, { target: ['config/locales/devise.yml'], defaults: ['config/locales/devise.en.yml'], format: 'yaml' });

probe('laravel php', {
    'resources/lang/en/messages.php': "<?php return ['save' => 'Save'];",
    'resources/lang/fr/messages.php': "<?php return ['save' => 'Enregistrer'];",
}, { target: ['resources/lang/fr/messages.php'], defaults: ['resources/lang/en/messages.php'], format: 'php' });

probe('i18next json, flat and namespaced, with a region variant', {
    'src/locales/en.json': '{"save":"Save"}',
    'src/locales/fr-FR.json': '{"save":"Enregistrer"}',
    'public/locales/fr/common.json': '{"cancel":"Annuler"}',
    'public/locales/en/common.json': '{"cancel":"Cancel"}',
    'src/data/fr.json': '{"not":"a locale dir"}',
}, { target: ['public/locales/fr/common.json', 'src/locales/fr-FR.json'], defaults: ['public/locales/en/common.json', 'src/locales/en.json'], format: 'json' });

probe('gettext', {
    'locale/fr/LC_MESSAGES/django.po': 'msgid "Save"\nmsgstr "Enregistrer"\n',
    'locale/en/LC_MESSAGES/django.po': 'msgid "Save"\nmsgstr ""\n',
    'po/fr_CA.po': 'msgid "Save"\nmsgstr "Sauvegarder"\n',
}, { target: ['locale/fr/LC_MESSAGES/django.po', 'po/fr_CA.po'], defaults: ['locale/en/LC_MESSAGES/django.po'], format: 'gettext' });

probe('flutter arb', {
    'lib/l10n/app_en.arb': '{"save":"Save"}',
    'lib/l10n/app_fr.arb': '{"save":"Enregistrer"}',
}, { target: ['lib/l10n/app_fr.arb'], defaults: ['lib/l10n/app_en.arb'], format: 'arb' });

probe('android', {
    'app/src/main/res/values/strings.xml': '<resources><string name="save">Save</string></resources>',
    'app/src/main/res/values-fr/strings.xml': '<resources><string name="save">Enregistrer</string></resources>',
    'app/src/main/res/values-fr-rCA/strings.xml': '<resources><string name="save">Sauvegarder</string></resources>',
    'app/src/main/res/values-night/strings.xml': '<resources/>',
}, { target: ['app/src/main/res/values-fr-rCA/strings.xml', 'app/src/main/res/values-fr/strings.xml'], defaults: ['app/src/main/res/values/strings.xml'], format: 'android' });

probe('apple .lproj', {
    'App/Base.lproj/Main.strings': '"save" = "Save";',
    'App/en.lproj/Localizable.strings': '"save" = "Save";',
    'App/fr.lproj/Localizable.strings': '"save" = "Enregistrer";',
}, { target: ['App/fr.lproj/Localizable.strings'], defaults: ['App/Base.lproj/Main.strings', 'App/en.lproj/Localizable.strings'], format: 'apple-strings' });

probe('xcstrings with a French localization', {
    'App/Localizable.xcstrings': JSON.stringify({ sourceLanguage: 'en', strings: { Save: { localizations: { fr: { stringUnit: { value: 'Enregistrer' } } } } } }),
}, { target: ['App/Localizable.xcstrings'], defaults: ['App/Localizable.xcstrings'], format: 'xcstrings' });

probe('xcstrings without French', {
    'App/Localizable.xcstrings': JSON.stringify({ sourceLanguage: 'en', strings: { Save: { localizations: { de: {} } } } }),
}, { target: [], defaults: ['App/Localizable.xcstrings'] });

probe('skipped directories', {
    'node_modules/lib/locales/fr.json': '{}',
    'vendor/gem/config/locales/fr.yml': 'fr:\n',
    'config/locales/en.yml': 'en:\n',
}, { target: [], defaults: ['config/locales/en.yml'] });

// Negative: an English-only product has no French files.
{
    const dir = repo({ 'config/locales/en.yml': 'en:\n  save: Save\n', 'app/views/index.html.erb': '<h1>Save</h1>' });
    const result = spawnSync(process.execPath, [path.join(__dirname, 'find_locale_files.js'), dir, 'fr'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0, result.stderr);
    const json = JSON.parse(result.stdout);
    assert.strictEqual(json.has_locale, false);
    assert.deepStrictEqual(json.target_files, []);
    assert.deepStrictEqual(json.formats, []);
    assert.strictEqual(json.default_locale_guess, 'en');
    fs.rmSync(dir, { recursive: true, force: true });
}

console.log('find_locale_files tests passed');
