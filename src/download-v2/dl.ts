import {generateZipFromUrl} from "./generate-zip";
import {saveAs} from "file-saver";

(function() {
    function randomSlug(length: number = 7): string {
        let ret = ''
        while (length > 0) {
            const num = Math.floor(Math.random() * 16)
            ret += num.toString(16)

            length -= 1
        }
        return ret
    }

    const args = new URLSearchParams(window.location.search)
    const zipConfigUrl = new URL(
        args.get('zipconfig') ?? '/v2/dl/zipconfig.json',
        window.location.href,
    )
    generateZipFromUrl(zipConfigUrl, args).then((blob) => {
        saveAs(blob, `epx_recommended_pack-${randomSlug(7)}-v2.zip`)
    })
})()