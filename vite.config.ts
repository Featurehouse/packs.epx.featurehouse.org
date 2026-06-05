import { defineConfig } from "vite";
import path from 'path'
import * as generateV2 from './src/buildscript/v2-generate.js'

const thisDir = (p: string) => path.resolve(__dirname, p)

export default defineConfig({
    root: thisDir('.'),
    publicDir: 'public',
    build: {
        outDir: thisDir("dist"),
        rolldownOptions: {
            input: [
                'v2/dl/index.html',
                'v2/translation_copyright.html',
            ]
        }
    },
    plugins: [
        {
            name: 'v2-generate',
            buildStart() {
                generateV2.dumpTimestamp()
                generateV2.generate()
            }
        }
    ]
})