import * as z from "zod";
import {IndexOrRandom, Weight} from "./file-spec";

const HttpsUrl = z.url({protocol: /^https$/})

const ItemMetadataBase = z.object({
    author: z.optional(z.string()),
    link: z.optional(HttpsUrl),
    homepage: z.optional(HttpsUrl),
}).catchall(z.string())

const TranslationItem = z.object({
    raw: z.string(),
    demo: z.string(),
    weight: Weight,
    metadata: ItemMetadataBase.extend({
        'see_also': z.union([
            ItemMetadataBase,
            z.array(ItemMetadataBase),
        ]).optional()
    }),
})

const LangCode = z.string().toLowerCase()

export const TranslationMetadataSchema = z.object({
    translations: z.array(TranslationItem).nonempty(),
    'other_i18n': z.record(LangCode, z.array(TranslationItem).nonempty()),
    'default_indexes': z.record(LangCode, IndexOrRandom),
})

export type TranslationMetadata = z.infer<typeof TranslationMetadataSchema>
