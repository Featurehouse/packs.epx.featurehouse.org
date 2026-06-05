import * as z from 'zod'

const SplashesSchema = z.object({
    add: z.array(z.string()).default(() => []),
    remove: z.array(z.string()).default(() => []),
})

export type Splashes = z.infer<typeof SplashesSchema>

function blankSplashes() : Splashes {
    return { add: [], remove: [] }
}

function fromText(fileContent: string): Splashes {
    const ret = blankSplashes()

    for (let line of fileContent.split(/\n|\r\n|\r/)) {
        line = line.trim()
        if (!line || line.startsWith('#')) continue

        let target = ret.add
        if (line.startsWith('!')) {
            if (!line.startsWith('!!')) {
                target = ret.remove
            }
            line = line.slice(1).trimStart()
        }
        target.push(line)
    }
    return ret
}

export function loadSplashes(isText: boolean, fileContents: Iterable<string>): Splashes {
    const ret = blankSplashes()
    for (const content of fileContents) {
        const splashes: Splashes = isText ? fromText(content) : SplashesSchema.parse(JSON.parse(content))
        ret.add.push(...splashes.add)
        ret.remove.push(...splashes.remove)
    }
    return ret
}