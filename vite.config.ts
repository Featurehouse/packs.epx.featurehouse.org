import { defineConfig } from "vite";
import path from 'path'
import * as generateV2 from './src/buildscript/v2-generate.js'

export default defineConfig({
    root: path.resolve(__dirname),
    publicDir: 'public',
    build: {
        outDir: path.resolve(__dirname, "dist"),
        rolldownOptions: {
            input: {
                'v2/dl/index': './src/download-v2/dl.html',
                'v2/translation_copyright': './src/copyright/copyright.html',
            },
        },
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