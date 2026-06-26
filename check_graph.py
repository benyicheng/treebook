import json, sys
d = json.load(sys.stdin)
items = d.get('data', d).get('items', [])
for i in items:
    ch = i.get('chapter')
    sp = i.get('spinoff')
    br = i.get('branch')
    tt = '?'
    if ch and ch.get('title'):
        tt = ch['title']
    elif sp and sp.get('title'):
        tt = sp['title']
    elif br and br.get('title'):
        tt = br['title']
    else:
        tt = (i.get('targetId') or '?')[:20]
    print(f"{i['targetType']:12s} ch={'Y' if ch else 'N'} sp={'Y' if sp else 'N'} br={'Y' if br else 'N'} title={tt}")
