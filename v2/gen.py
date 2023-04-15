#!/usr/bin/env python3
import json
import os
import sys
import base64
import datetime

_HERE = os.path.dirname(sys.argv[0])
# ROOT = os.path.join(_HERE, '..')
METADATA = os.path.join(_HERE, 'translation_metadata.json')
METADATA_STATIC = os.path.join(_HERE, 'static.json')
METADATA_DYNAMIC = os.path.join(_HERE, 'dynamic_other.json')
WEB_ROOT = '/epx_packs/'
DEST = os.path.join(_HERE, 'dl/zipconfig.json')

def readjson(fn):
    with open(fn) as f:
        return json.load(f)


def fixup(d):
    for k in d:
        o = d[k]
        if k.endswith('/'):
            continue
        # Legacy compat
        if o.get('file'):
            o['fetch'] = o['file']
        if o.get('fetch'):
            o['fetch'] = WEB_ROOT + o['fetch']


def main():
    l = readjson(METADATA).get('translations', [])
    s = readjson(METADATA_STATIC)
    fixup(s)
    out = {'static': s}
    
    dynamic = readjson(METADATA_DYNAMIC)
    fixup(dynamic)
    out['dynamic'] = dynamic
    
    poem_dict = []
    dynamic['poem'] = {'default': 'random', 'items': poem_dict}
    
    for o in l:
        files = {}
        poem_dict.append({'files': files})
        files['assets/end_poem_extension/texts/end_poem/zh_cn.txt'] = {'fetch': WEB_ROOT + o['raw']}
        if o.get('metadata'):
            files['assets/end_poem_extension/texts/end_poem/zh_cn.copyright'] = {'base64': base64.b64encode(json.dumps(o['metadata']).encode('utf-8')).decode('ascii')}
    
    with open(DEST, 'w') as f:
        json.dump(out, f)


if __name__ == "__main__":
    # time
    with open(os.path.join(_HERE, 'version.txt'), 'w') as f:
        f.write(datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat('T', "seconds"))
    main()
