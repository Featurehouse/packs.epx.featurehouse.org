// src/copyright/copyright.ts
import { TranslationMetadataSchema, type TranslationMetadata } from '../schema/translation-metadata.js';
// 以下导入仅用于类型推导，运行时不需要 file-spec 的具体逻辑
// import type { RemoteFile, ZipConfig } from '../schema/file-spec.js';

// ---------- 类型与常量定义 ----------
interface I18nMap {
    [key: string]: {
        [key: string]: string;
    };
}

// 预定义界面文本（与原本保持一致，补充缺失键）
const I18N_TEXTS: I18nMap = {
    'en-US': {
        'lang.en_us': 'English (US)',
        'lang.zh_cn': 'Chinese (Simplified)',
        'lang.lzh': 'Literal Chinese',
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
        'ui.source_repo': 'Repository of EPX Recommended Packs',
        'ui.modrinth': 'End Poem Extension',
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
        'ui.source_repo': 'EPX 推荐包仓库',
        'ui.modrinth': '终末之诗扩展补丁',
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
        'ui.source_repo': 'EPX 推薦包倉庫',
        'ui.modrinth': '終末之詩擴展補丁',
        'ui.mcmod': 'MC百科',
        'ui.contrib': '參與貢獻',
    }
};

// 辅助函数：将 snake_case 转为首字母大写词组（用于回退显示）
function capitalizeSnake(str: string): string {
    if (!str) return '';
    return str.split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .filter(p => p !== '')
        .join(' ');
}

// 递归遍历 metadata 对象，生成 HTML 片段（新版轻量递归渲染）
function renderMetadata(
    metadata: Record<string, any>,
    getTranslation: (key: string, defaultVal?: string) => string,
    prefix = ''
): string {
    let html = '<ul class="metadata-list">';
    const entries = Object.entries(metadata);
    for (const [key, value] of entries) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const transKey = `metadata.${fullKey}`;
        const label = getTranslation(transKey, capitalizeSnake(key));

        // 处理嵌套对象或数组
        if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
                // 数组展示为多项列表
                html += `<li><span class="metadata-key">${label}:</span>
                         <ul class="nested-list">`;
                for (const item of value) {
                    if (typeof item === 'object' && item !== null) {
                        html += `<li>${renderMetadata(item, getTranslation, '')}</li>`;
                    } else {
                        html += `<li class="metadata-value">${escapeHtml(String(item))}</li>`;
                    }
                }
                html += `</ul></li>`;
            } else {
                // 对象: 递归展示，并加一个折叠标识
                html += `<li><span class="metadata-key">${label}</span>
                         <div class="nested-metadata">${renderMetadata(value, getTranslation, fullKey)}</div>
                         </li>`;
            }
        } else {
            const strValue = value === null || value === undefined ? '' : String(value);
            // 自动将链接转为可点击链接
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

// 简单的防XSS
function escapeHtml(str: string): string {
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (c) {
        return c;
    });
}

// 选择最佳语言
function selectLanguage(supportedLangs: string[], browserLanguages: readonly string[]): string {
    for (const lang of browserLanguages) {
        if (supportedLangs.includes(lang)) return lang;
        // 处理带region的降级: 'zh-CN' -> 'zh'
        const base = lang.split('-')[0];
        if (supportedLangs.includes(base)) return base;
    }
    return 'en-US';
}

// 构建单个语言板块的HTML
function buildLangPanel(
    langCode: string,
    translationsArray: any[],
    t: (key: string, fallback?: string) => string,
    baseUrl: string
): string {
    const langDisplayName = t(`lang.${langCode}`, langCode);
    let itemsHtml = '';
    translationsArray.forEach((item, idx) => {
        const rawUrl = new URL(item.raw, baseUrl).href;
        const demoUrl = new URL(item.demo, baseUrl).href;

        // 渲染元数据（支持 see_also 等复杂结构）
        let metadataHtml = '';
        if (item.metadata && Object.keys(item.metadata).length) {
            metadataHtml = `<div class="metadata-block">${renderMetadata(item.metadata, t)}</div>`;
        }

        itemsHtml += `
            <div class="translation-item">
                <div class="item-index">#${idx + 1}</div>
                <div class="link-group">
                    <a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener">${t('ui.raw', 'Raw Text')}</a>
                    <a href="${escapeHtml(demoUrl)}" target="_blank" rel="noopener">${t('ui.demo', 'Demo')}</a>
                </div>
                ${metadataHtml}
            </div>
        `;
    });

    return `
        <div class="lang-card" data-lang="${langCode}">
            <div class="card-header">
                <h2>${escapeHtml(langDisplayName)} <span class="lang-badge">${langCode}</span></h2>
            </div>
            <div class="translation-list">
                ${itemsHtml}
            </div>
        </div>
    `;
}

// 渲染整个页面（包括语言卡片和底部链接）
function renderUI(
    metadata: TranslationMetadata,
    currentLang: string,
    t: (key: string, fallback?: string) => string,
    baseUrl: string
): void {
    const container = document.getElementById('credits-grid');
    const langBar = document.getElementById('lang-bar');
    if (!container) return;

    // 收集所有可用语言（从 other_i18n 加 translations 键）
    const allLanguages = new Set<string>();
    allLanguages.add('zh_cn'); // translations 字段映射为 zh_cn
    for (const lang of Object.keys(metadata.other_i18n || {})) {
        allLanguages.add(lang);
    }
    const langList = Array.from(allLanguages).sort();

    // 构建语言切换按钮
    if (langBar) {
        langBar.innerHTML = '';
        for (const lang of langList) {
            const btn = document.createElement('button');
            btn.textContent = t(`lang.${lang}`, lang);
            btn.classList.add('lang-btn');
            if (lang === currentLang) btn.classList.add('active');
            btn.addEventListener('click', () => {
                // 更新URL hash或者重新渲染
                window.history.replaceState(null, '', `#${lang}`);
                initializePage(lang);
            });
            langBar.appendChild(btn);
        }
    }

    // 生成卡片: 对于 zh_cn 特殊处理，展示 metadata.translations
    let cardsHtml = '';
    for (const lang of langList) {
        let items: any[] = [];
        if (lang === 'zh_cn') {
            items = metadata.translations || [];
        } else {
            items = metadata.other_i18n?.[lang] || [];
        }
        if (items.length === 0) continue;
        cardsHtml += buildLangPanel(lang, items, t, baseUrl);
    }
    container.innerHTML = cardsHtml;

    // 底部链接区（保留原有关键链接）
    const linksContainer = document.getElementById('links-section');
    if (linksContainer) {
        linksContainer.innerHTML = `
            <a href="https://modrinth.com/mod/end-poem-extension" target="_blank" rel="noopener">
                ${t('ui.modrinth', 'End Poem Extension')} <span class="tag-badge">Mod</span>
            </a>
            <a href="https://github.com/Featurehouse/epx_packs" target="_blank" rel="noopener">
                ${t('ui.source_repo', 'Repository of EPX Recommended Packs')} 
                <span class="tag-badge">${t('ui.contrib', 'Contribute!')}</span>
            </a>
            <a href="https://www.mcmod.cn/class/10478.html" target="_blank" rel="noopener">
                MCMOD <span class="tag-badge">中文</span>
            </a>
        `;
    }
}

// 获取当前浏览器最佳语言（优先检测 hash，其次浏览器语言）
function getEffectiveLanguage(supportedLangs: string[]): string {
    const hash = window.location.hash.slice(1);
    if (hash && supportedLangs.includes(hash)) return hash;
    const browserLangs = navigator.languages || [navigator.language];
    return selectLanguage(supportedLangs, browserLangs);
}

// 主入口：拉取翻译元数据，渲染界面
async function initializePage(forcedLang: string | null): Promise<void> {
    try {
        // 1. 获取 translation_metadata.json （相对路径）
        const response = await fetch('./translation_metadata.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const jsonData = await response.json();

        // 2. 验证数据结构
        const metadata = TranslationMetadataSchema.parse(jsonData) as TranslationMetadata;

        // 3. 确定语言
        const availableLangs = Object.keys(metadata.other_i18n || {}).concat('zh_cn');
        const currentLang = forcedLang ?? getEffectiveLanguage(availableLangs);

        // 4. 获取翻译函数
        const i18nPack = I18N_TEXTS[currentLang] || I18N_TEXTS['en-US'];
        const t = (key: string, fallback?: string): string => {
            return i18nPack[key] ?? I18N_TEXTS['en-US'][key] ?? fallback ?? key;
        };

        // 5. 确定 baseUrl (用来拼接 raw/demo 的相对路径)
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');

        // 6. 渲染UI
        renderUI(metadata, currentLang, t, baseUrl);

        // 更新文档语言属性
        document.documentElement.lang = currentLang;
    } catch (err) {
        console.error('Failed to load credits:', err);
        const container = document.getElementById('credits-grid');
        if (container) {
            container.innerHTML = `<div class="error-message" style="color:red;padding:2rem;">⚠️ 加载鸣谢数据失败，请检查网络或刷新重试。</div>`;
        }
    }
}

// 等待 DOM 加载完成后启动
document.addEventListener('DOMContentLoaded', () => {
    // 注入页面所需 DOM 结构（如果已有则复用，但为了保证完整，动态确保容器存在）
    if (!document.getElementById('credits-grid')) {
        // const main = document.querySelector('.credits-container') || document.body;
        const gridDiv = document.createElement('div');
        gridDiv.id = 'credits-grid';
        gridDiv.className = 'credits-grid';
        const linksDiv = document.createElement('div');
        linksDiv.id = 'links-section';
        linksDiv.className = 'links-section';
        const barDiv = document.createElement('div');
        barDiv.id = 'lang-bar';
        barDiv.className = 'lang-bar';

        // 确保主容器存在
        let container = document.querySelector('.credits-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'credits-container';
            document.body.prepend(container);
        }
        container.prepend(barDiv);
        container.appendChild(gridDiv);
        container.appendChild(linksDiv);

        // 添加hero标题（若不存在）
        if (!document.querySelector('.hero')) {
            const hero = document.createElement('div');
            hero.className = 'hero';
            hero.innerHTML = `<h1>EPX Recommended Pack — 翻译鸣谢</h1><div class="sub">社区翻译贡献者及许可信息</div>`;
            container.prepend(hero);
        }
    }
    return initializePage(null);
});

// 监听 hash 变化以切换语言
window.addEventListener('hashchange', () => {
    const hashLang = window.location.hash.slice(1);
    return initializePage(hashLang || null)
});