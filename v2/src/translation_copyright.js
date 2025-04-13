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

    let result = '';
    const translationsByLanguage = translationObject.other_i18n;
    translationsByLanguage['zh_cn'] = translationObject.translations;

    Object.entries(translationsByLanguage).forEach(([lang, list]) => {
        // 每个语言面板的完整结构
        result += `
            <div class="column is-6">
                <div class="panel">
                    <p class="panel-heading has-background-primary-light">${getTranslation('lang.' + lang, lang)}</p>
                    <div class="panel-block">
                        <ul class="content ml-2">`;

        list.forEach((trans, idx) => {
            // 每个翻译项的完整结构
            result += `
                            <li class="ml-2 mt-2">
                                <div class="has-text-weight-bold">#${idx + 1}</div>
                                <ul class="mt-1">
                                    <li>${toLink("Raw Text", trans.raw)} | ${toLink("Demo", trans.demo)}</li>`;

            // 元数据处理逻辑
            let metadataResult = '';
            let listStack = [];
            
            const handleMetadata = (key, values) => {
                const transKey = 'metadata.' + key;
                const subtitle = getTranslation(transKey, () => key.charAt(0).toUpperCase() + key.slice(1));

                if (!values) {
                    // 处理 toggle 类型字段
                    metadataResult += `<li>${subtitle}<ul>`;
                    listStack.push('</ul></li>');
                } else if (values.length > 0) {
                    // 处理普通字段
                    const closingTag = values.length > 1 ? 
                        `<ul>${values.map(v => `<li>${v}</li>`).join('')}</ul>` : 
                        values[0];
                    metadataResult += `<li>${subtitle}: ${closingTag}</li>`;
                }
            };

            // 处理元数据并自动闭合未关闭的列表
            recurseJson(trans.metadata, handleMetadata);
            metadataResult += listStack.join('');

            // 拼接元数据内容
            result += metadataResult;
            
            // 闭合翻译项的标签
            result += `
                                </ul>
                            </li>`;
        });

        // 闭合语言面板的标签
        result += `
                        </ul>
                    </div>
                </div>
            </div>`;
    });

    return result;
}
