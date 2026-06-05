import * as z from 'zod'
import urlJoin from "proper-url-join";
import {Buffer} from "buffer";

export const IndexOrRandom = z.union([
    z.literal('random'),
    z.int().nonnegative(),
])
export const Weight = z.number().positive().default(100)

export const RemoteFileSchema = z.union([
    z.object({
        fetch: z.string()
    }),
    z.object({
        base64: z.base64()
    }),
    z.object({
        raw: z.string().default('')
    }),
])

export type RemoteFile = z.infer<typeof RemoteFileSchema>

export function relativizeUri(file: RemoteFile, baseUri: string): void {
    if ('fetch' in file) {
        file.fetch = urlJoin(baseUri, file.fetch)
    }
}

export async function loadFile(file: RemoteFile, baseUrl?: URL): Promise<Uint8Array> {
    if ('fetch' in file) {
        const response = await fetch(new URL(file.fetch, baseUrl))
        if (!response.ok) throw Error(`Failed to fetch "${file.fetch}": HTTP ${response.status}`)
        return Buffer.from(await response.arrayBuffer())
    } else if ('base64' in file) {
        return Buffer.from(file.base64, 'base64')
    } else if ('raw' in file) {
        return Buffer.from(file.raw, 'utf-8')
    } else {
        throw Error('Invalid RemoteFile spec')
    }
}

export const StaticFilesSchema = z.record(z.string(), RemoteFileSchema)
export const DynamicFilesSchema = z.record(z.string(), z.object({
    'default': IndexOrRandom,
    items: z.array(z.object({
        files: StaticFilesSchema,
        weight: Weight,
    })),
}))

export const ZipConfigSchema = z.object({
    static: StaticFilesSchema,
    dynamic: DynamicFilesSchema,
})

export type ZipConfig = z.infer<typeof ZipConfigSchema>
