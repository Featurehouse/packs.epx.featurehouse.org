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

// 简单转义 HTML
function escapeHtml(str: string): string {
    return str.replace(/[&<>]/g, (m) => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// 递归渲染 metadata 对象
function renderMetadata(
    metadata: Record<string, any>,
    tUI: (key: string, fallback?: string) => string,
    prefix = ''
): string {
    let html = '<ul class="metadata-list">';
    for (const [key, value] of Object.entries(metadata)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const transKey = `metadata.${fullKey}`;
        const label = tUI(transKey, capitalizeSnake(key));

        if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
                html += `<li><span class="metadata-key">${label}:</span><ul class="nested-list">`;
                for (const item of value) {
                    if (typeof item === 'object' && item !== null) {
                        html += `<li>${renderMetadata(item, tUI, '')}</li>`;
                    } else {
                        html += `<li class="metadata-value">${escapeHtml(String(item))}</li>`;
                    }
                }
                html += `</ul></li>`;
            } else {
                html += `<li><span class="metadata-key">${label}</span><div class="nested-metadata">${renderMetadata(value, tUI, fullKey)}</div></li>`;
            }
        } else {
            let strValue = value === null || value === undefined ? '' : String(value);
            let displayValue = escapeHtml(strValue);
            if (strValue.match(/^https?:\/\//i)) {
                displayValue = `<a href="${escapeHtml(strValue)}" target="_blank" rel="noopener noreferrer">${escapeHtml(strValue)}</a>`;
            }
            html += `<li><span class="metadata-key">${label}:</span> <span class="metadata-value">${displayValue}</span></li>`;
        }
    }
    html += '</ul>';
    return html;
}

// 选择界面语言（基于浏览器偏好）
function selectUILanguage(): UILang {
    const browserLangs = navigator.languages || [navigator.language];
    for (const lang of browserLangs) {
        // 精确匹配
        if (UI_SUPPORTED_LANGS.includes(lang as UILang)) return lang as UILang;
        // 降级：zh -> zh-CN, en -> en-US
        const base = lang.split('-')[0];
        if (base === 'zh') return 'zh-CN';
        if (base === 'en') return 'en-US';
    }
    return 'en-US';
}

// 构建单个语言板块的 HTML
function buildLangPanel(
    langCode: string,           // 例如 'zh_cn', 'en_us', 'lzh'
    translations: any[],
    tUI: (key: string, fallback?: string) => string,
    baseUrl: string
): string {
    const displayName = tUI(`lang.${langCode}`, langCode);
    let itemsHtml = '';
    for (let idx = 0; idx < translations.length; idx++) {
        const item = translations[idx];
        const rawUrl = new URL(item.raw, baseUrl).href;
        const demoUrl = new URL(item.demo, baseUrl).href;

        let metadataHtml = '';
        if (item.metadata && Object.keys(item.metadata).length) {
            metadataHtml = `<div class="metadata-block">${renderMetadata(item.metadata, tUI)}</div>`;
        }

        itemsHtml += `
            <div class="translation-item">
                <div class="item-index">#${idx + 1}</div>
                <div class="link-group">
                    <a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener">${tUI('ui.raw')}</a>
                    <a href="${escapeHtml(demoUrl)}" target="_blank" rel="noopener">${tUI('ui.demo')}</a>
                </div>
                ${metadataHtml}
            </div>
        `;
    }

    return `
        <div class="lang-card" data-lang="${langCode}">
            <div class="card-header">
                <h2>${escapeHtml(displayName)} <span class="lang-badge">${langCode}</span></h2>
            </div>
            <div class="translation-list">
                ${itemsHtml}
            </div>
        </div>
    `;
}

// 渲染整个页面
function renderUI(
    metadata: TranslationMetadata,
    tUI: (key: string, fallback?: string) => string,
    baseUrl: string
): void {
    const container = document.getElementById('credits-grid');
    const langBar = document.getElementById('lang-bar');
    if (!container) return;

    // 收集所有可用翻译语言（板块）
    const translationLangs = new Set<string>();
    translationLangs.add('zh_cn');   // translations 字段对应简体中文
    for (const lang of Object.keys(metadata.other_i18n || {})) {
        translationLangs.add(lang);
    }
    const langList = Array.from(translationLangs).sort();

    // 生成语言切换按钮（按界面文本显示）
    if (langBar) {
        langBar.innerHTML = '';
        for (const lang of langList) {
            const btn = document.createElement('button');
            btn.textContent = tUI(`lang.${lang}`, lang);
            btn.classList.add('lang-btn');
            // 高亮当前显示的板块？不，切换的是“可见性”？原设计未做筛选，此处保留按钮仅用于跳转锚点
            btn.addEventListener('click', () => {
                const targetCard = document.querySelector(`.lang-card[data-lang="${lang}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                window.location.hash = lang;
            });
            langBar.appendChild(btn);
        }
    }

    // 渲染所有板块卡片
    let cardsHtml = '';
    for (const lang of langList) {
        let items: any[] = [];
        if (lang === 'zh_cn') {
            items = metadata.translations || [];
        } else {
            items = metadata.other_i18n?.[lang] || [];
        }
        if (items.length === 0) continue;
        cardsHtml += buildLangPanel(lang, items, tUI, baseUrl);
    }
    container.innerHTML = cardsHtml;

    // 底部链接区
    const linksContainer = document.getElementById('links-section');
    if (linksContainer) {
        linksContainer.innerHTML = `
            <a href="https://modrinth.com/mod/end-poem-extension" target="_blank" rel="noopener">
                ${tUI('ui.modrinth')} <span class="tag-badge">Mod</span>
            </a>
            <a href="https://github.com/Featurehouse/epx_packs" target="_blank" rel="noopener">
                ${tUI('ui.source_repo')} 
                <span class="tag-badge">${tUI('ui.contrib')}</span>
            </a>
            <a href="https://www.mcmod.cn/class/10478.html" target="_blank" rel="noopener">
                MCMOD <span class="tag-badge">中文</span>
            </a>
        `;
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

// 主入口
async function init(): Promise<void> {
    try {
        // 1. 获取翻译元数据
        const response = await fetch('./translation_metadata.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const jsonData = await response.json();
        const metadata = TranslationMetadataSchema.parse(jsonData);

        // 2. 选择界面语言
        const uiLang = selectUILanguage();
        const uiPack = UI_I18N[uiLang];
        const tUI = (key: string, fallback?: string): string => {
            return uiPack[key] ?? UI_I18N['en-US'][key] ?? fallback ?? key;
        };

        // 3. 基础 URL（用于拼接相对路径）
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');

        // 4. 渲染
        renderUI(metadata, tUI, baseUrl);

        // 设置文档语言
        document.documentElement.lang = uiLang.toLowerCase();
    } catch (err) {
        console.error('Failed to load credits:', err);
        const container = document.getElementById('credits-grid');
        if (container) {
            container.innerHTML = `<div class="error-message" style="color:#b91c1c;padding:2rem;text-align:center;">⚠️ 加载鸣谢数据失败，请检查网络或刷新重试。</div>`;
        }
    }
}

// 等待 DOM 并注入必要容器
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('credits-grid')) {
        const containerDiv = document.querySelector('.credits-container');
        if (!containerDiv) {
            const wrapper = document.createElement('div');
            wrapper.className = 'credits-container';
            document.body.prepend(wrapper);
        }
        const container = document.querySelector('.credits-container')!;
        if (!document.querySelector('.hero')) {
            const hero = document.createElement('div');
            hero.className = 'hero';
            hero.innerHTML = `<h1>EPX Recommended Pack — 翻译鸣谢</h1><div class="sub">社区翻译贡献者及许可信息</div>`;
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

// 监听 hash 变化，滚动到对应卡片
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const card = document.querySelector(`.lang-card[data-lang="${hash}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});