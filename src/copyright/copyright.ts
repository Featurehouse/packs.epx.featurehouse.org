// src/copyright/copyright.ts
import { TranslationMetadataSchema, type TranslationMetadata } from '../schema/translation-metadata.js';
import './copyright.css'

// ---------- 界面语言配置 ----------
const UI_SUPPORTED_LANGS = ['en-US', 'zh-CN', 'zh-TW'] as const;
type UILang = typeof UI_SUPPORTED_LANGS[number];

const UI_I18N: Record<UILang, Record<string, string>> = {
    'en-US': {
        'ui.page_title': 'EPX Recommended Pack — Credits',
        'ui.page_subtitle': 'Community translation contributors and license information',
        'ui.invalid_link': 'Invalid URL',
        'ui.error_load': '⚠️ Failed to load credits data. Please check your network and refresh.',
        'ui.badge_mod': 'Mod',
        'ui.badge_chinese': '中文',
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
        'ui.switch_lang': 'UI Language',
        'ui.content_lang': 'Content Language',
    },
    'zh-CN': {
        'ui.page_title': 'EPX Recommended Pack — 翻译鸣谢',
        'ui.page_subtitle': '社区翻译贡献者及许可信息',
        'ui.invalid_link': '无效链接',
        'ui.error_load': '⚠️ 加载鸣谢数据失败，请检查网络并刷新重试。',
        'ui.badge_mod': 'Mod',
        'ui.badge_chinese': '中文',
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
        'ui.modrinth': '终末之诗扩展补丁',
        'ui.source_repo': 'EPX 推荐包仓库',
        'ui.mcmod': 'MC百科',
        'ui.contrib': '参与贡献',
        'ui.switch_lang': '界面语言',
        'ui.content_lang': '译文语言',
    },
    'zh-TW': {
        'ui.page_title': 'EPX Recommended Pack — 翻譯鳴謝',
        'ui.page_subtitle': '社群翻譯貢獻者及許可資訊',
        'ui.invalid_link': '無效連結',
        'ui.error_load': '⚠️ 載入鳴謝資料失敗，請檢查網路並重新整理。',
        'ui.badge_mod': 'Mod',
        'ui.badge_chinese': '中文',
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
        'ui.modrinth': '終末之詩擴展補丁',
        'ui.source_repo': 'EPX 推薦包倉庫',
        'ui.mcmod': 'MC百科',
        'ui.contrib': '參與貢獻',
        'ui.switch_lang': '界面語言',
        'ui.content_lang': '譯文語言',
    }
};

const UI_LANGUAGE_NAMES: Record<UILang, string> = {
    'en-US': 'English',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
}

// 辅助：将 snake_case 转为首字母大写（用于回退显示）
function capitalizeSnake(str: string): string {
    if (!str) return '';
    return str.split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .filter(p => p !== '')
        .join(' ');
}

// 安全的 URL 验证（只允许 https 协议）
function safeUrl(urlString: string, baseUrl: string | null): string | null {
    try {
        const url = new URL(urlString, baseUrl ?? undefined);
        if (url.protocol !== 'https:') return null;
        return url.href;
    } catch {
        return null;
    }
}

// 递归构建 metadata 的 DOM 元素（prefix 仅用于翻译键的拼接，不参与 URL 处理）
function buildMetadataElement(
    metadata: Record<string, any>,
    tUI: (key: string, fallback?: string) => string,
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
                        const nested = buildMetadataElement(item, tUI, '');
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
                nestedDiv.appendChild(buildMetadataElement(value, tUI, fullKey));
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
            // metadata 中的链接必须是绝对 URL，故 baseUrl 传 null
            const validatedUrl = safeUrl(strValue, null);
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
            rawSpan.textContent = `${tUI('ui.raw')} (${tUI('ui.invalid_link')})`;
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
            demoSpan.textContent = `${tUI('ui.demo')} (${tUI('ui.invalid_link')})`;
            demoSpan.style.opacity = '0.6';
            linkGroup.appendChild(demoSpan);
        }

        itemDiv.appendChild(linkGroup);

        if (item.metadata && Object.keys(item.metadata).length) {
            const metadataBlock = document.createElement('div');
            metadataBlock.className = 'metadata-block';
            // 修复：此处不应传递 baseUrl，因为 buildMetadataElement 的第三个参数是 prefix
            metadataBlock.appendChild(buildMetadataElement(item.metadata, tUI));
            itemDiv.appendChild(metadataBlock);
        }

        listContainer.appendChild(itemDiv);
    }

    card.appendChild(listContainer);
    return card;
}

// 构建 UI 语言切换按钮组
function buildUILangSwitcher(currentLang: UILang, tUI: (key: string, fallback?: string) => string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'ui-lang-switcher';
    container.style.display = 'flex';
    container.style.gap = '0.5rem';
    container.style.alignItems = 'center';

    const label = document.createElement('span');
    label.textContent = tUI('ui.switch_lang') + ':';
    label.classList.add('lang-label');
    container.appendChild(label);

    for (const lang of UI_SUPPORTED_LANGS) {
        const btn = document.createElement('button');
        // btn.textContent = lang;
        btn.textContent = UI_LANGUAGE_NAMES[lang];
        btn.title = lang;
        btn.classList.add('lang-btn');
        if (lang === currentLang) btn.classList.add('active');
        btn.addEventListener('click', () => {
            const url = new URL(window.location.href);
            url.searchParams.set('uiLang', lang);
            url.hash = window.location.hash;
            window.history.pushState({}, '', url.toString());
            return init();
        });
        container.appendChild(btn);
    }
    return container;
}

// 渲染整个页面
function renderUI(
    metadata: TranslationMetadata,
    tUI: (key: string, fallback?: string) => string,
    baseUrl: string,
): void {
    const container = document.getElementById('credits-grid');
    const langBar = document.getElementById('lang-bar');
    if (!container || !langBar) return;

    // 收集所有可用翻译语言（板块）
    const translationLangs = new Set<string>();
    translationLangs.add('zh_cn');
    for (const lang of Object.keys(metadata.other_i18n || {})) {
        translationLangs.add(lang);
    }
    const langList = Array.from(translationLangs).sort();

    // 清空并重新构建翻译板块的语言切换按钮
    langBar.innerHTML = '';
    const label = document.createElement('span');
    label.textContent = tUI('ui.content_lang') + ':';
    label.classList.add('lang-label');
    langBar.appendChild(label);

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

    // 底部链接区
    const linksContainer = document.getElementById('links-section');
    if (linksContainer) {
        linksContainer.innerHTML = '';
        const links = [
            { url: 'https://modrinth.com/mod/end-poem-extension', text: tUI('ui.modrinth'), badge: tUI('ui.badge_mod') },
            { url: 'https://github.com/Featurehouse/packs.epx.featurehouse.org', text: tUI('ui.source_repo'), badge: tUI('ui.contrib') },
            { url: 'https://www.mcmod.cn/class/10478.html', text: 'MCMOD', badge: tUI('ui.badge_chinese') }
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

// 选择界面语言
function selectUILanguage(): UILang {
    const urlParams = new URLSearchParams(window.location.search);
    const paramLang = urlParams.get('uiLang');
    if (paramLang && UI_SUPPORTED_LANGS.includes(paramLang as UILang)) {
        return paramLang as UILang;
    }
    const browserLangs = navigator.languages || [navigator.language];
    for (const lang of browserLangs) {
        if (UI_SUPPORTED_LANGS.includes(lang as UILang)) return lang as UILang;
        const base = lang.split('-')[0];
        if (base === 'zh') return 'zh-CN';
        if (base === 'en') return 'en-US';
    }
    return 'en-US';
}

// 重组布局：将 UI 语言切换器和翻译板块切换栏分别置于左右两侧
function reorganizeLayout(): void {
    const container = document.querySelector('.credits-container');
    if (!container) return;

    // 确保 top-bar 存在
    let topBar = document.getElementById('control-top-bar');
    if (!topBar) {
        topBar = document.createElement('div');
        topBar.id = 'control-top-bar';
        topBar.style.display = 'flex';
        topBar.style.justifyContent = 'space-between';
        topBar.style.alignItems = 'center';
        topBar.style.marginBottom = '1.5rem';
        topBar.style.flexWrap = 'wrap';
        topBar.style.gap = '1rem';

        // 插入到 hero 之后，grid 之前
        const hero = container.querySelector('.hero');
        if (hero && hero.nextSibling) {
            container.insertBefore(topBar, hero.nextSibling);
        } else {
            container.appendChild(topBar);
        }
    }

    // 确保左右区域存在
    let leftArea = document.getElementById('ui-lang-area');
    if (!leftArea) {
        leftArea = document.createElement('div');
        leftArea.id = 'ui-lang-area';
        leftArea.style.display = 'flex';
        leftArea.style.alignItems = 'center';
        topBar.prepend(leftArea);
    }
    let rightArea = document.getElementById('translation-lang-area');
    if (!rightArea) {
        rightArea = document.createElement('div');
        rightArea.id = 'translation-lang-area';
        topBar.appendChild(rightArea);
    }

    // 移动 UI 语言切换器容器到 leftArea
    let uiSwitcher = document.getElementById('ui-lang-switcher-container');
    if (uiSwitcher) {
        leftArea.innerHTML = '';
        leftArea.appendChild(uiSwitcher);
    } else {
        leftArea.innerHTML = '';
    }

    // 移动原有的 lang-bar 到 rightArea
    const langBar = document.getElementById('lang-bar');
    if (langBar) {
        rightArea.innerHTML = '';
        rightArea.appendChild(langBar);
        langBar.style.marginBottom = '0';
        langBar.style.justifyContent = 'flex-end';
    }
}

// 主入口
async function init(): Promise<void> {
    let tUI: ((key: string, fallback?: string) => string) | null = null;
    try {
        const response = await fetch('./translation_metadata.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const jsonData = await response.json();
        const metadata = TranslationMetadataSchema.parse(jsonData);

        const uiLang = selectUILanguage();
        const uiPack = UI_I18N[uiLang];
        tUI = (key: string, fallback?: string): string => {
            return uiPack[key] ?? UI_I18N['en-US'][key] ?? fallback ?? key;
        };

        // 设置页面标题和副标题
        document.title = tUI('ui.page_title');
        const heroTitle = document.querySelector('.hero h1');
        const heroSub = document.querySelector('.hero .sub');
        if (heroTitle) heroTitle.textContent = tUI('ui.page_title');
        if (heroSub) heroSub.textContent = tUI('ui.page_subtitle');

        const baseUrl = new URL('/', window.location.href).href;

        reorganizeLayout();

        // 创建或获取 UI 语言切换器容器并填充
        let uiSwitcherContainer = document.getElementById('ui-lang-switcher-container');
        if (!uiSwitcherContainer) {
            uiSwitcherContainer = document.createElement('div');
            uiSwitcherContainer.id = 'ui-lang-switcher-container';
        }
        uiSwitcherContainer.innerHTML = '';
        uiSwitcherContainer.appendChild(buildUILangSwitcher(uiLang, tUI));

        const leftArea = document.getElementById('ui-lang-area');
        if (leftArea) {
            leftArea.innerHTML = '';
            leftArea.appendChild(uiSwitcherContainer);
        } else {
            const topBar = document.getElementById('control-top-bar');
            if (topBar) topBar.prepend(uiSwitcherContainer);
        }

        const langBar = document.getElementById('lang-bar');
        if (langBar) {
            const rightArea = document.getElementById('translation-lang-area');
            if (rightArea && langBar.parentElement !== rightArea) {
                rightArea.innerHTML = '';
                rightArea.appendChild(langBar);
                langBar.style.marginBottom = '0';
                langBar.style.justifyContent = 'flex-end';
            }
        }

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
            const translateUI = tUI ?? ((key, fallback) => UI_I18N['en-US'][key] ?? fallback ?? key);
            errorDiv.textContent = translateUI('ui.error_load');
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
            title.textContent = '';
            const sub = document.createElement('div');
            sub.className = 'sub';
            sub.textContent = '';
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

window.addEventListener('popstate', init);