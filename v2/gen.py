#!/usr/bin/env python3
# gen.py, to generate zipconfig.json for EPX extension pack.
# Copyright (C) 2023 teddyxlandlee. All rights reserved.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
SPLASH_DIR = os.path.join(_HERE, 'splashes')
WEB_ROOT = '/epx_packs/'
DEST = os.path.join(_HERE, 'dl/zipconfig.json')

def readjson(fn):
    with open(fn) as f:
        return json.load(f)

def listdir(d):
    return list(os.path.join(d, x) for x in os.listdir(d) if x.endswith('.json'))


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


def resolve_splashes():
    add = []
    remove = []
    for fn in listdir(SPLASH_DIR):
        j = readjson(fn)
        add += j.get('add', [])
        remove += j.get('remove', [])
    return {'add':add,'remove':remove}


def main():
    l = readjson(METADATA).get('translations', [])
    s = readjson(METADATA_STATIC)
    fixup(s)
    out = {'static': s}
    
    dynamic = readjson(METADATA_DYNAMIC)
    #fixup(dynamic)
    for k in dynamic:
        for v in dynamic[k].get('items', []):
            fixup(v.get('files', {}))
    out['dynamic'] = dynamic
    
    # Splashes
    sp = resolve_splashes()
    with open(os.path.join(_HERE, 'splashes.gen'), 'w') as f:
        json.dump(sp, f)
    
    # Poem
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
