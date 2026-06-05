import JSZip from "jszip";
import {loadFile, RemoteFile, ZipConfig, ZipConfigSchema} from "../schema/file-spec.js";

type SkippableRemoteFile = RemoteFile & {
    'skip_on'?: string | string[]
}

const SKIP_KEY = 'web'
function isSkippable(fileSpec: SkippableRemoteFile): boolean {
    if (!fileSpec || !fileSpec.skip_on) return false

    const skipOn = fileSpec.skip_on;
    if (typeof skipOn === 'string' && skipOn === SKIP_KEY) return true
    return Array.isArray(skipOn) && skipOn.includes(SKIP_KEY);

}

async function addFileToZip(zip: JSZip, filename: string, fileSpec: SkippableRemoteFile, baseUrl: URL) {
    if (isSkippable(fileSpec)) return

    if (filename.endsWith('/')) {
        zip.folder(filename.slice(0, -1))
        return
    }

    const fileContent = await loadFile(fileSpec, baseUrl)
    zip.file(filename, fileContent)
}

function randomIndex(items: { weight: number }[]): number {
    let totalWeight = Math.random() * items.reduce((s, { weight }) => s + weight, 0);
    return items.findIndex((_, i, arr) => (totalWeight -= arr[i].weight) < 0);
}

export async function generateZipFromUrl(zipConfigUrl: URL, params: URLSearchParams): Promise<Blob> {
    const response = await fetch(zipConfigUrl)
    const zipConfig: ZipConfig = ZipConfigSchema.parse(await response.json())
    const zip = new JSZip()

    for (const [filename, fileSpec] of Object.entries(zipConfig.static)) {
        await addFileToZip(zip, filename, fileSpec, zipConfigUrl)
    }

    for (const [key, dynamicData] of Object.entries(zipConfig.dynamic)) {
        const rawParamValue: string | null = params.get(key)
        let paramValue: number | 'random'
        if (rawParamValue === 'random') {
            paramValue = 'random'
        } else {
            const paramValueAsInt = parseInt(rawParamValue ?? '')
            paramValue = isNaN(paramValueAsInt) ? dynamicData.default : paramValueAsInt
        }

        if (paramValue === 'random') {
            // select according to weight
            paramValue = randomIndex(dynamicData.items)
        }

        const item = dynamicData.items[paramValue]
        if (item) {
            for (const [filename, fileSpec] of Object.entries(item.files)) {
                await addFileToZip(zip, filename, fileSpec, zipConfigUrl)
            }
        }
    }

    return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 5
        }
    })
}