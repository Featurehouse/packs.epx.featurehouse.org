// src/copyright/copyright.ts
import { TranslationMetadataSchema, type TranslationMetadata } from '../schema/translation-metadata.js';

// ---------- 界面语言配置 ----------
const UI_SUPPORTED_LANGS = ['en-US', 'zh-CN', 'zh-TW'] as const;
type UILang = typeof UI_SUPPORTED_LANGS[number];

const UI_I18N: Record<UILang, Record<string, string>> = {
    'en-US': {
        'lang.en_us': 'English (US)',
        'lang.zh_cn': 'Chinese (Simplified)',
        'lang.lzh': 'Literary Chinese',
        'lang.zh_hk': 'Chinese (Traditional, HK)',
        'lang.zh_tw': 'Chinese (Traditional, TW)',
        'metadata.author': 'Author',
        'metadata.link': 'Link',
        'metadata.homepage': 'Homepage',
        'metadata.license': 'License',
        'metadata.see_also': 'See also',
        'ui.raw': 'Raw Text',
        'ui.demo': 'Demo',
        'ui.links': '🔗 Links',
        'ui.modrinth': 'End Poem Extension',
        'ui.source_repo': 'EPX Recommended Pack Repository',
        'ui.mcmod': 'MCMOD',
        'ui.contrib': 'Contribute!',
    },
    'zh-CN': {
        'lang.en_us': '美式英语',
        'lang.zh_cn': '简体中文',
        'lang.lzh': '文言',
        'lang.zh_hk': '繁体中文（香港）',
        'lang.zh_tw': '繁体中文（台湾）',
        'metadata.author': '作者',
        'metadata.link': '链接',
        'metadata.homepage': '主页',
        'metadata.license': '许可证',
        'metadata.see_also': '参见',
        'ui.raw': '原文链接',
        'ui.demo': '演示链接',
        'ui.links': '🔗 相关链接',
        'ui.modrinth': '终末诗篇扩展',
        'ui.source_repo': 'EPX 推荐包仓库',
        'ui.mcmod': 'MC百科',
        'ui.contrib': '参与贡献',
    },
    'zh-TW': {
        'lang.en_us': '美式英語',
        'lang.zh_cn': '簡體中文',
        'lang.lzh': '文言',
        'lang.zh_hk': '繁體中文（香港）',
        'lang.zh_tw': '繁體中文（臺灣）',
        'metadata.author': '作者',
        'metadata.link': '連結',
        'metadata.homepage': '主頁',
        'metadata.license': '許可證',
        'metadata.see_also': '參見',
        'ui.raw': '原文連結',
        'ui.demo': '演示連結',
        'ui.links': '🔗 相關連結',
        'ui.modrinth': '終末詩篇擴展',
        'ui.source_repo': 'EPX 推薦包倉庫',
        'ui.mcmod': 'MC百科',
        'ui.contrib': '參與貢獻',
    }
};

// 辅助：将 snake_case 转为首字母大写（用于回退显示）
function capitalizeSnake(str: string): string {
    if (!str) return '';
    return str.split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .filter(p => p !== '')
        .join(' ');
}

// 安全的 URL 验证（只允许 http/https 或相对路径，禁止 javascript: 等）
function safeUrl(urlString: string, baseUrl: string): string | null {
    try {
        const url = new URL(urlString, baseUrl);
        // 只允许 https: 协议
        if (url.protocol !== 'https:') {
            return null;
        }
        return url.href;
    } catch {
        // 无效 URL 则返回 null
        return null;
    }
}

// 递归构建 metadata 的 DOM 元素（完全安全，无字符串拼接）
function buildMetadataElement(
    metadata: Record<string, any>,
    tUI: (key: string, fallback?: string) => string,
    baseUrl: string,
    prefix = ''
): HTMLElement {
    const container = document.createElement('ul');
    container.className = 'metadata-list';

    for (const [key, value] of Object.entries(metadata)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const transKey = `metadata.${fullKey}`;
        const label = tUI(transKey, capitalizeSnake(key));

        const li = document.createElement('li');

        if (value && typeof value === 'object') {
            const keySpan = document.createElement('span');
            keySpan.className = 'metadata-key';
            keySpan.textContent = label + ':';
            li.appendChild(keySpan);

            if (Array.isArray(value)) {
                const ul = document.createElement('ul');
                ul.className = 'nested-list';
                for (const item of value) {
                    const itemLi = document.createElement('li');
                    if (typeof item === 'object' && item !== null) {
                        const nested = buildMetadataElement(item, tUI, baseUrl, '');
                        itemLi.appendChild(nested);
                    } else {
                        const valSpan = document.createElement('span');
                        valSpan.className = 'metadata-value';
                        valSpan.textContent = String(item);
                        itemLi.appendChild(valSpan);
                    }
                    ul.appendChild(itemLi);
                }
                li.appendChild(ul);
            } else {
                const nestedDiv = document.createElement('div');
                nestedDiv.className = 'nested-metadata';
                nestedDiv.appendChild(buildMetadataElement(value, tUI, baseUrl, fullKey));
                li.appendChild(nestedDiv);
            }
        } else {
            const keySpan = document.createElement('span');
            keySpan.className = 'metadata-key';
            keySpan.textContent = label + ':';
            li.appendChild(keySpan);

            const valSpan = document.createElement('span');
            valSpan.className = 'metadata-value';
            const strValue = value === null || value === undefined ? '' : String(value);
            // 检查是否为有效 URL
            const validatedUrl = safeUrl(strValue, baseUrl);
            if (validatedUrl) {
                const link = document.createElement('a');
                link.href = validatedUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = strValue;
                valSpan.appendChild(link);
            } else {
                valSpan.textContent = strValue;
            }
            li.appendChild(valSpan);
        }
        container.appendChild(li);
    }
    return container;
}

// 构建单个语言板块的 DOM 元素
function buildLangPanel(
    langCode: string,
    translations: any[],
    tUI: (key: string, fallback?: string) => string,
    baseUrl: string
): HTMLElement {
    const card = document.createElement('div');
    card.className = 'lang-card';
    card.setAttribute('data-lang', langCode);

    const header = document.createElement('div');
    header.className = 'card-header';
    const title = document.createElement('h2');
    const displayName = tUI(`lang.${langCode}`, langCode);
    title.appendChild(document.createTextNode(displayName));
    const badge = document.createElement('span');
    badge.className = 'lang-badge';
    badge.textContent = langCode;
    title.appendChild(badge);
    header.appendChild(title);
    card.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.className = 'translation-list';

    for (let idx = 0; idx < translations.length; idx++) {
        const item = translations[idx];
        const itemDiv = document.createElement('div');
        itemDiv.className = 'translation-item';

        const indexSpan = document.createElement('div');
        indexSpan.className = 'item-index';
        indexSpan.textContent = `#${idx + 1}`;
        itemDiv.appendChild(indexSpan);

        const linkGroup = document.createElement('div');
        linkGroup.className = 'link-group';

        const rawUrl = safeUrl(item.raw, baseUrl);
        if (rawUrl) {
            const rawLink = document.createElement('a');
            rawLink.href = rawUrl;
            rawLink.target = '_blank';
            rawLink.rel = 'noopener noreferrer';
            rawLink.textContent = tUI('ui.raw');
            linkGroup.appendChild(rawLink);
        } else {
            const rawSpan = document.createElement('span');
            rawSpan.textContent = tUI('ui.raw') + ' (无效链接)';
            rawSpan.style.opacity = '0.6';
            linkGroup.appendChild(rawSpan);
        }

        const demoUrl = safeUrl(item.demo, baseUrl);
        if (demoUrl) {
            const demoLink = document.createElement('a');
            demoLink.href = demoUrl;
            demoLink.target = '_blank';
            demoLink.rel = 'noopener noreferrer';
            demoLink.textContent = tUI('ui.demo');
            linkGroup.appendChild(demoLink);
        } else {
            const demoSpan = document.createElement('span');
            demoSpan.textContent = tUI('ui.demo') + ' (无效链接)';
            demoSpan.style.opacity = '0.6';
            linkGroup.appendChild(demoSpan);
        }

        itemDiv.appendChild(linkGroup);

        if (item.metadata && Object.keys(item.metadata).length) {
            const metadataBlock = document.createElement('div');
            metadataBlock.className = 'metadata-block';
            metadataBlock.appendChild(buildMetadataElement(item.metadata, tUI, baseUrl));
            itemDiv.appendChild(metadataBlock);
        }

        listContainer.appendChild(itemDiv);
    }

    card.appendChild(listContainer);
    return card;
}

// 渲染整个页面（纯 DOM 操作）
function renderUI(
    metadata: TranslationMetadata,
    tUI: (key: string, fallback?: string) => string,
    baseUrl: string
): void {
    const container = document.getElementById('credits-grid');
    const langBar = document.getElementById('lang-bar');
    if (!container || !langBar) return;

    // 收集所有可用翻译语言（板块）
    const translationLangs = new Set<string>();
    translationLangs.add('zh_cn');   // translations 字段对应简体中文
    for (const lang of Object.keys(metadata.other_i18n || {})) {
        translationLangs.add(lang);
    }
    const langList = Array.from(translationLangs).sort();

    // 清空并重新构建语言切换按钮
    langBar.innerHTML = '';
    for (const lang of langList) {
        const btn = document.createElement('button');
        btn.textContent = tUI(`lang.${lang}`, lang);
        btn.classList.add('lang-btn');
        btn.addEventListener('click', () => {
            const targetCard = document.querySelector(`.lang-card[data-lang="${lang}"]`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            window.location.hash = lang;
        });
        langBar.appendChild(btn);
    }

    // 清空并重新构建卡片网格
    container.innerHTML = '';
    for (const lang of langList) {
        let items: any[] = [];
        if (lang === 'zh_cn') {
            items = metadata.translations || [];
        } else {
            items = metadata.other_i18n?.[lang] || [];
        }
        if (items.length === 0) continue;
        const card = buildLangPanel(lang, items, tUI, baseUrl);
        container.appendChild(card);
    }

    // 底部链接区（安全构建）
    const linksContainer = document.getElementById('links-section');
    if (linksContainer) {
        linksContainer.innerHTML = '';
        const links = [
            { url: 'https://modrinth.com/mod/end-poem-extension', text: tUI('ui.modrinth'), badge: 'Mod' },
            { url: 'https://github.com/Featurehouse/epx_packs', text: tUI('ui.source_repo'), badge: tUI('ui.contrib') },
            { url: 'https://www.mcmod.cn/class/10478.html', text: 'MCMOD', badge: '中文' }
        ];
        for (const link of links) {
            const a = document.createElement('a');
            a.href = link.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = link.text;
            const badgeSpan = document.createElement('span');
            badgeSpan.className = 'tag-badge';
            badgeSpan.textContent = link.badge;
            a.appendChild(badgeSpan);
            linksContainer.appendChild(a);
        }
    }

    // 处理 hash 滚动
    const hash = window.location.hash.slice(1);
    if (hash) {
        setTimeout(() => {
            const target = document.querySelector(`.lang-card[data-lang="${hash}"]`);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// 选择界面语言（基于浏览器偏好）
function selectUILanguage(): UILang {
    const browserLangs = navigator.languages || [navigator.language];
    for (const lang of browserLangs) {
        if (UI_SUPPORTED_LANGS.includes(lang as UILang)) return lang as UILang;
        const base = lang.split('-')[0];
        if (base === 'zh') return 'zh-CN';
        if (base === 'en') return 'en-US';
    }
    return 'en-US';
}

// 主入口
async function init(): Promise<void> {
    try {
        const response = await fetch('./translation_metadata.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const jsonData = await response.json();
        const metadata = TranslationMetadataSchema.parse(jsonData);

        const uiLang = selectUILanguage();
        const uiPack = UI_I18N[uiLang];
        const tUI = (key: string, fallback?: string): string => {
            return uiPack[key] ?? UI_I18N['en-US'][key] ?? fallback ?? key;
        };

        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        renderUI(metadata, tUI, baseUrl);
        document.documentElement.lang = uiLang.toLowerCase();
    } catch (err) {
        console.error('Failed to load credits:', err);
        const container = document.getElementById('credits-grid');
        if (container) {
            container.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.color = '#b91c1c';
            errorDiv.style.padding = '2rem';
            errorDiv.style.textAlign = 'center';
            errorDiv.textContent = '⚠️ 加载鸣谢数据失败，请检查网络或刷新重试。';
            container.appendChild(errorDiv);
        }
    }
}

// 等待 DOM 并注入必要容器
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('credits-grid')) {
        let container = document.querySelector('.credits-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'credits-container';
            document.body.prepend(container);
        }
        if (!document.querySelector('.hero')) {
            const hero = document.createElement('div');
            hero.className = 'hero';
            const title = document.createElement('h1');
            title.textContent = 'EPX Recommended Pack — 翻译鸣谢';
            const sub = document.createElement('div');
            sub.className = 'sub';
            sub.textContent = '社区翻译贡献者及许可信息';
            hero.appendChild(title);
            hero.appendChild(sub);
            container.prepend(hero);
        }
        if (!document.getElementById('lang-bar')) {
            const bar = document.createElement('div');
            bar.id = 'lang-bar';
            bar.className = 'lang-bar';
            container.appendChild(bar);
        }
        if (!document.getElementById('credits-grid')) {
            const grid = document.createElement('div');
            grid.id = 'credits-grid';
            grid.className = 'credits-grid';
            container.appendChild(grid);
        }
        if (!document.getElementById('links-section')) {
            const links = document.createElement('div');
            links.id = 'links-section';
            links.className = 'links-section';
            container.appendChild(links);
        }
    }
    return init();
});

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const card = document.querySelector(`.lang-card[data-lang="${hash}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});