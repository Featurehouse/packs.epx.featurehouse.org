// v2-generate.ts, to generate zipconfig.json for EPX extension pack.
// Copyright (C) 2023, 2026 teddyxlandlee. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import * as fs from "node:fs";
import path from "node:path";
import * as z from 'zod'
import {DynamicFilesSchema, relativizeUri, StaticFilesSchema, ZipConfig} from "../schema/file-spec.js";
import {TranslationMetadata, TranslationMetadataSchema} from "../schema/translation-metadata.js";
import {loadSplashes, Splashes} from "../schema/splashes.js";
import {Buffer} from "buffer";

const rootDir = path.join(__dirname, '..', '..')
const publicDir = (p: string) => path.join(rootDir, 'public', p)
const thisDir = (p: string) => path.join(rootDir, p)
const outputDir = (p: string) => path.join(rootDir, 'dist', p)

const paths = {
    metadata: publicDir('v2/translation_metadata.json'),
    static: thisDir('v2/static.json'),
    dynamicOther: thisDir('v2/dynamic_other.json'),
    splashesDir: thisDir('v2/splashes/'),
}

const zhCnKey = 'zh_cn'

function readJson<T>(path: string, zodType: z.ZodType<T>): T {
    const content = fs.readFileSync(path, {
        encoding: 'utf-8'
    })
    return zodType.parse(JSON.parse(content))
}

function dumpString(relativePath: string, content: string | Uint8Array) {
    const filePath = outputDir(relativePath)
    fs.mkdirSync(path.dirname(filePath), {
        recursive: true,
    })
    fs.writeFileSync(filePath, content)
}

function dumpJson(relativePath: string, jsonContent: any) {
    dumpString(relativePath, JSON.stringify(jsonContent))
}

export function generate() {
    const translationMetadata: TranslationMetadata = readJson(paths.metadata, TranslationMetadataSchema)
    const zhCnPoem = translationMetadata.translations
    const i18nPoem = translationMetadata.other_i18n
    i18nPoem[zhCnKey] = zhCnPoem

    const staticFiles = readJson(paths.static, StaticFilesSchema)
    for (const file of Object.values(staticFiles)) {
        relativizeUri(file, '/')
    }

    const dynamicFiles = readJson(paths.dynamicOther, DynamicFilesSchema)
    for (const paramValue of Object.values(dynamicFiles)) {
        for (const item of paramValue.items) {
            for (const file of Object.values(item.files)) {
                relativizeUri(file, '/')
            }
        }
    }

    // main splashes
    dumpJson('v2/splashes.gen', resolveSplashes(paths.splashesDir))
    // splash - others type-2/type-3
    for (const subdir of ['type-2', 'type-3']) {
        dumpJson(`v2/splashes-${subdir}.gen`, resolveSplashes(path.join(paths.splashesDir, subdir)))
    }
    // splash (txt) - whisper, using blank type-4
    for (const subdir of ['whisper-1']) {
        dumpJson(`v2/splashes-text-${subdir}.gen`, resolveSplashes(
            path.join(paths.splashesDir, subdir), true
        ))
    }

    dynamicFiles.poem = {
        'default': 'random',
        'items': []
    }
    const poems = dynamicFiles.poem.items
    for (const [langCode, translationItems] of Object.entries(i18nPoem)) {
        if (langCode !== 'zh_cn' && Object.entries(translationItems).length !== 0) {
            const defaultIndex = translationMetadata.default_indexes[langCode] ?? 'random'
            dynamicFiles[`poem-${langCode}`] = {
                'default': defaultIndex,
                items: []
            }
        }
        for (const translationItem of translationItems) {
            const files: typeof poems[number]['files'] = {}
            const weight = translationItem.weight

            if (langCode === 'zh_cn') {
                poems.push({ files, weight })
            } else {
                dynamicFiles[`poem-${langCode}`].items.push({ files, weight })
            }
            // Poem & Metadata
            files[`assets/end_poem_extension/texts/end_poem/${langCode}.txt`] = {
                fetch: translationItem.raw,
            }
            files[`assets/end_poem_extension/texts/end_poem/${langCode}.metadata`] = {
                base64: Buffer.from(JSON.stringify(translationItem), 'base64').toString('ascii'),
            }
        }
    }

    const out: ZipConfig = {
        static: staticFiles,
        dynamic: dynamicFiles,
    }
    dumpJson('v2/dl/zipconfig.json', out)
}

function resolveSplashes(splashDir: string, isText: boolean = false): Splashes {
    const expectedSuffix = isText ? '.txt' : '.json'
    const files = fs.readdirSync(splashDir)
        .filter(s => s.endsWith(expectedSuffix))
        .map(s => path.join(splashDir, s))

    const fileContentGenerator: Generator<string> = (function*() {
        for (const f of files) {
            yield fs.readFileSync(f, {
                encoding: 'utf-8'
            })
        }
    })()
    return loadSplashes(isText, fileContentGenerator)
}

export function dumpTimestamp() {
    const dateString = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        timeZoneName: 'shortOffset',
    })
    dumpString('timestamp.txt', '# Build Time\n' + dateString)
}