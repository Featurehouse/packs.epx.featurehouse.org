import {generateZipFromUrl} from "./generate-zip";
import {saveAs} from "file-saver";

(function() {
    const SLUG_LIMIT = Math.pow(2, 7)
    function randomSlug(): string {
        return Math.trunc(SLUG_LIMIT * Math.random()).toString(16)
    }

    const args = new URLSearchParams(window.location.search)
    const zipConfigUrl = new URL(
        args.get('zipconfig') ?? '/v2/dl/zipconfig.json',
        window.location.href,
    )
    generateZipFromUrl(zipConfigUrl, args).then((blob) => {
        saveAs(blob, `epx_recommended_pack-${randomSlug()}-v2.zip`)
    })
})()