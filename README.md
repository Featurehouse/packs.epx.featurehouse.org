This is a repository for [End Poem Extension](https://modrinth.com/mod/end-poem-extension) Recommended Pack.

API: `https://packs.epx.featurehouse.org/v2/dl`

## Contribute to Poem translation

Feel free to send a PR if you have good translations!

### If you have only ONE version for your language

1. Upload a demo in `demo` folder, prefixed with `X-`. (optional)
2. **Upload a Minecraft-readable version** under `nopool/v2` folder. See the [Traditional Chinese version](https://github.com/Featurehouse/packs.epx.featurehouse.org/blob/master/nopool/v2/zh_tw.txt)
as an example.
It depends on you whether to include the original English script - For Chinese versions, we chose yes.
3. **Add your file to [`static.json`](https://github.com/Featurehouse/packs.epx.featurehouse.org/blob/master/v2/static.json)**. Fill the JSON key with filename specified in the [mod description](https://modrinth.com/mod/end-poem-extension), and value with [file object](#file-object-format).
```json5
{
  //...
  "assets/end_poem_extension/texts/end_poem/fr_fr.txt": {
    "fetch": "nopool/v2/fr_fr.txt"
  }
  //...
}
```
Of course, you are allowed to add a copyright file to the ZIP. For example, create a `fr_fr.copyright` file with a [plaintext file object](#file-object-format).

### If you have multiple versions, and you want the players to select them randomly/as they want
We're not sure if that'll happen, but if it will, you're welcomed!

Create a new object in [`translation_metadata.json`](https://github.com/Featurehouse/packs.epx.featurehouse.org/blob/master/v2/translation_metadata.json) - `other_i18n`. For example:
```json5
  {
    "other_i18n": {
      "lzh": [
      	//...
      ],
      "de_de": [
        {
          "raw": "raw/de_de-0001.txt",
          "demo": "demo/de_de-0001-shortname.txt",
          "weight": 200,    // default 100
          "metadata": {
            // No standard of format.
            // Put author, license/copyright or anything you want to.
          }
        },
        //...
      ]
    },
    "default_indexes": {
      "lzh": "random",
      "de_de": 0
      // If you want to set any translation in your language as default,
      // set its index here (start from zero). Otherwise, set "random".
    }
  }
```
Place the corresponding files to their correct position, e.g. `raw/de_de-0001.txt` (Minecraft-readable) and `demo/de_de-0001-shortname.txt` (Demo) as specified above.

## File object format
A. Plain text:  
(it is recommended to avoid using non-ASCII characters. If you have to, escape them: `\u516d`)
```json
{
  "raw": "#!/usr/bin/env python3\nprint('Hello World')"
}
```

B. Base64-ed text  
(example: 你好世界 _lit. Hello World_)
```json
{
  "base64": "5LiW55WM77yM5L2g5aW977yB"
}
```

C. Remote content  
(This may be the most common type in the resource pack)
```json
{
  "fetch": "nopool/v2/postcredits.zh_hant.txt"
}
```
