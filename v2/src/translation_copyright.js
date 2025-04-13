function capitalize(input) {
    if (input === null || input === undefined || input.trim() === '') {
        return '';
    }
    return input.split('_')
        .map(part => {
            if (part === '') return '';
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .filter(part => part !== '')
        .join(' ');
}

/**
 * Recursively consume a JSON object
 * @param {object} jsonObject The object.
 * @param {(key: string, value: string[] | null) => void} consumer 
 */
function recurseJson(jsonObject, consumer) {
    if (typeof jsonObject !== 'object' || jsonObject === null || Array.isArray(jsonObject)) {
        throw new TypeError('jsonObject must be a non-null object');
    }
    if (typeof consumer !== 'function') {
        throw new TypeError('consumer must be a function');
    }

    const processValue = (value) => {
        if (value === null) return 'null';
        if (typeof value === 'object') return JSON.stringify(value);
        return '' + value;
    };

    const recurse = (obj, prefix) => {
        Object.entries(obj).forEach(([key, value]) => {
            const realKey = prefix + key;

            if (value !== null && typeof value === 'object') {
                if (Array.isArray(value)) {
                    const arrValues = value.map(item => processValue(item));
                    consumer(realKey, arrValues);
                } else {
                    consumer(realKey, null);
                    recurse(value, realKey + '.');
                    consumer(realKey, null);
                }
            } else {
                if (value === null || value === undefined) return;
                consumer(realKey, ['' + value]);
            }
        });
    };

    recurse(jsonObject, '');
}

function selectLanguage(supportedLangs, browserLanguages) {
    const supportedSet = new Set(supportedLangs);
    for (const lang of browserLanguages) {
      if (supportedSet.has(lang)) {
        return lang;
      }
    }
    return 'en-US';
}

//////////////////////////////////////////////////////////////////

/**
 * @param {object} translationObject 
 * @param {object} websiteI18n 
 * @returns {string} HTML text
 */
function readTranslations(translationObject, websiteI18n, root) {
    const getTranslation = function(key, defaultFactory) {
        const defaultValue = typeof defaultFactory === 'function' ? defaultFactory() : defaultFactory;
        return websiteI18n[key] || defaultValue;
    };

    const toLink = function(text, link) {
        return `<span class="is-link"><a href="${new URL(link, new URL(root, window.location))}">${text}</a></span>`;
    };

    var result = '';
    const translationsByLanguage = translationObject.other_i18n;
    // due to historical namings
    translationsByLanguage['zh_cn'] = translationObject.translations;

    Object.entries(translationsByLanguage).forEach(([lang, list]) => {
        result += `
            <div class="column is-6">
                <div class="panel">
                    <p class="panel-heading has-background-primary-light>${getTranslation('language.' + lang, lang)}</p>
                    <div class="panel-block">
                        <ul class="content ml-2">
        `;
        list.forEach((trans, idx) => {
            let {raw, demo, metadata} = trans;
            
            result += `
                <li class="ml-2 mt-2">
                    <div class="has-text-weight-bold">#${idx + 1}</div>
                    <ul class="mt-1">
                        <li>${toLink("Raw Text", raw)} | ${toLink("Demo", demo)}</li>
            `;

            var lastListExpanded = null;
            recurseJson(metadata, (key, values) => {
                const transKey = 'metadata.' + key;
                const subtitleLocalized = getTranslation(transKey, () => capitalize(transKey.match(/\.([^.]+)$/)?.[1] || ''));  // after last dot

                if (!values) {
                    if (!lastListExpanded) {
                        result += `<li>${subtitleLocalized}<ul>`;
                        lastListExpanded = key;
                    } else {
                        result += '</ul></li>';
                        lastListExpanded = null;
                    }
                } else if (values.length === 1) {
                    result += `<li>${subtitleLocalized}: ${values[0]}</li>`;
                } else {
                    result += `<li>${subtitleLocalized}:
                        <ul>
                        ${values.map(v => `<li>${v}</li>`).join('')}
                    </ul></li>`;
                }
            });
            if (lastListExpanded) console.warn('Weird list unclosed:', lastListExpanded);
            result += '</ul></div></li>';
        });
        result += '</ul></div></p></div></div>';
    })
}
