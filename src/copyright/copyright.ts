import { TranslationMetadata } from '../schema/translation-metadata';

/**
 * Select language based on browser languages and supported languages
 * @param supportedLangs List of supported languages
 * @param browserLanguages List of browser languages
 * @returns Selected language code
 */
function selectLanguage(supportedLangs: readonly string[], browserLanguages: readonly string[]): string {
    const supportedSet = new Set(supportedLangs);
    for (const lang of browserLanguages) {
        if (supportedSet.has(lang)) {
            return lang;
        }
    }
    return 'en-US';
}

/**
 * Create a link element
 * @param text Link text
 * @param href Link URL
 * @returns HTMLAnchorElement
 */
function createLink(text: string, href: string): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    return link;
}

/**
 * Generate DOM elements for translations
 * @param translationObject The translation metadata object
 * @param websiteI18n Internationalization mapping
 * @param root Root URL for links
 * @returns HTMLDivElement containing all translation panels
 */
export function readTranslations(translationObject: TranslationMetadata, websiteI18n: Record<string, string>, root: string): HTMLElement {
    const getTranslation = function(key: string, defaultFactory: string): string {
        return websiteI18n[key] || defaultFactory;
    };

    // Create main container
    const container = document.createElement('div');
    container.className = 'columns is-multiline';

    const translationsByLanguage = translationObject.other_i18n;
    
    // due to historical namings
    translationsByLanguage['zh_cn'] = translationObject.translations;

    Object.entries(translationsByLanguage).forEach(([lang, list]) => {
        // Create panel container
        const column = document.createElement('div');
        column.className = 'column is-6-desktop is-12-mobile';
        
        const panel = document.createElement('div');
        panel.className = 'panel translation-panel';
        
        // Create panel heading
        const heading = document.createElement('p');
        heading.className = 'panel-heading has-background-primary-light';
        heading.textContent = getTranslation('lang.' + lang, lang);
        panel.appendChild(heading);
        
        // Create panel block
        const panelBlock = document.createElement('div');
        panelBlock.className = 'panel-block panel-content';
        
        // Create content container
        const content = document.createElement('div');
        content.className = 'content';
        
        // Process each translation item
        list.forEach((trans, idx) => {
            const {raw, demo, metadata} = trans;
            
            // Create translation item container
            const itemContainer = document.createElement('div');
            itemContainer.className = 'translation-item';
            
            // Create item number
            const itemNumber = document.createElement('div');
            itemNumber.className = 'item-number';
            itemNumber.textContent = `#${idx + 1}`;
            itemContainer.appendChild(itemNumber);
            
            // Create links container
            const linksContainer = document.createElement('div');
            linksContainer.className = 'mt-2';
            
            const rawLink = createLink("Raw Text", new URL(raw, new URL(root, window.location.href)).href);
            const demoLink = createLink("Demo", new URL(demo, new URL(root, window.location.href)).href);
            
            linksContainer.appendChild(rawLink);
            linksContainer.appendChild(document.createTextNode(' | '));
            linksContainer.appendChild(demoLink);
            
            itemContainer.appendChild(linksContainer);
            
            // Process metadata - simplified approach to avoid complex nested types
            const metadataContainer = document.createElement('div');
            
            // Create simple metadata display
            Object.entries(metadata).forEach(([key, value]) => {
                const transKey = 'metadata.' + key;
                const subtitleLocalized = getTranslation(transKey, key);
                
                // If value is an array, display each item
                if (Array.isArray(value)) {
                    const metadataItem = document.createElement('div');
                    metadataItem.className = 'metadata-item';
                    
                    const keySpan = document.createElement('span');
                    keySpan.className = 'metadata-key';
                    keySpan.textContent = subtitleLocalized;
                    metadataItem.appendChild(keySpan);
                    
                    const valueList = document.createElement('ul');
                    valueList.className = 'metadata-list';
                    
                    value.forEach(item => {
                        if (typeof item === 'string') {
                            const listItem = document.createElement('li');
                            listItem.className = 'metadata-value';
                            listItem.textContent = item;
                            valueList.appendChild(listItem);
                        }
                    });
                    
                    metadataItem.appendChild(document.createTextNode(': '));
                    metadataItem.appendChild(valueList);
                    metadataContainer.appendChild(metadataItem);
                }  else if (typeof value === 'string') {
                    // For primitive values
                    const metadataItem = document.createElement('div');
                    metadataItem.className = 'metadata-item';
                    
                    const keySpan = document.createElement('span');
                    keySpan.className = 'metadata-key';
                    keySpan.textContent = subtitleLocalized;
                    metadataItem.appendChild(keySpan);
                    
                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'metadata-value';
                    valueSpan.textContent = value;
                    metadataItem.appendChild(document.createTextNode(': '));
                    metadataItem.appendChild(valueSpan);
                    
                    metadataContainer.appendChild(metadataItem);
                } else if (typeof value === 'object' && value !== null) {
                    // For nested objects, just display the keys
                    const metadataItem = document.createElement('div');
                    metadataItem.className = 'metadata-item';
                    
                    const keySpan = document.createElement('span');
                    keySpan.className = 'metadata-key';
                    keySpan.textContent = subtitleLocalized;
                    metadataItem.appendChild(keySpan);
                    
                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'metadata-value';
                    valueSpan.textContent = '[object]';
                    metadataItem.appendChild(document.createTextNode(': '));
                    metadataItem.appendChild(valueSpan);
                    
                    metadataContainer.appendChild(metadataItem);
                }
            });
            
            itemContainer.appendChild(metadataContainer);
            content.appendChild(itemContainer);
        });
        
        panelBlock.appendChild(content);
        panel.appendChild(panelBlock);
        column.appendChild(panel);
        container.appendChild(column);
    });
    
    return container;
}

const i18n = {
    "en-US": {
        'lang.en_us': "English (US)",
        'lang.zh_cn': "Chinese (Simplified)",
        'lang.lzh': "Literal Chinese",
        'lang.zh_hk': "Chinese (Traditional, HK)",
        'lang.zh_tw': "Chinese (Traditional, TW)",
        'metadata.author': 'Author',
        'metadata.link': 'Link',
        'metadata.homepage': 'Homepage',
        'metadata.license': 'License',
    },
    "zh-CN": {
        'lang.en_us': "美式英语",
        'lang.zh_cn': "简体中文",
        'lang.lzh': "文言",
        'lang.zh_hk': "繁体中文（香港）",
        'lang.zh_tw': "繁体中文（台湾）",
        'metadata.author': '作者',
        'metadata.link': '链接',
        'metadata.homepage': '主页',
        'metadata.license': '许可证',
    },
    "zh-TW": {
        'lang.en_us': "美式英语",
        'lang.zh_cn': "簡體中文",
        'lang.lzh': "文言",
        'lang.zh_hk': "繁體中文（香港）",
        'lang.zh_tw': "繁體中文（臺灣）",
    },
};

// This function is needed to handle the browser language selection
export function getSelectedLanguage<T extends Record<string, any>>(i18nData: T): keyof T {
    const browserLanguages = window.navigator.languages || [];
    const supportedLangs = Object.keys(i18nData);
    return selectLanguage(supportedLangs, browserLanguages);
}

// Main execution logic
async function initialize(): Promise<void> {
    try {
        const translationObject = await fetch('translation_metadata.json')
            .then(async (r) => {
                const text = await r.text();
                return JSON.parse(text);
            });

        const usedI18n = i18n[getSelectedLanguage(i18n)];
        const insertedContent = readTranslations(translationObject, usedI18n, '/');
        const panelElement = document.getElementById('translation-panel');
        
        if (panelElement) {
            // Clear existing content and append new content
            panelElement.innerHTML = '';
            panelElement.appendChild(insertedContent);
        }
    } catch (error) {
        console.error("Failed to initialize translation copyright:", error);
        const panelElement = document.getElementById('translation-panel');
        if (panelElement) {
            panelElement.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'column is-12';
            const errorP = document.createElement('p');
            errorP.className = 'has-text-danger';
            errorP.textContent = 'Failed to load translations. Please try again later.';
            errorDiv.appendChild(errorP);
            panelElement.appendChild(errorDiv);
        }
    }
}

// Initialize when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}