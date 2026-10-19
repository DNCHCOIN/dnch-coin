#!/usr/bin/env python3
"""Fetch public operational observations, with full source credit, for Vacha River.

Does not guess data or overwrite newer readings with older pages.
"""
import datetime as dt
import html
import json
import re
import sys
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

SOURCE = 'https://plovdiv.meteo.bg/krichim/index.php'
DEST = Path(__file__).resolve().parent.parent / 'data' / 'hydro.json'
BG=ZoneInfo('Europe/Sofia')


def parse(page):
    plain=re.sub(r'<(?:script|style)\b[^>]*>[\s\S]*?</(?:script|style)\s*>',' ',page,flags=re.I)
    plain=html.unescape(re.sub(r'<[^>]+>',' ',plain))
    plain=re.sub(r'\s+',' ',plain)
    pat=r'(?<!\S)(\d{1,2})\.(\d{1,2})\.(20\d{2})\s+(\d{1,2})\s+(-?\d{1,4})\s+(\d+(?:[.,]\d{1,4})?)(?=\s|$)'
    found={}
    for d,m,y,h,level,flow in re.findall(pat,plain):
        try:
            local=dt.datetime(int(y),int(m),int(d),int(h),tzinfo=BG)
            value=int(level);q=float(flow.replace(',','.'))
            if not(0<=value<=2000 and 0<=q<=10000):continue
            if local>dt.datetime.now(BG)+dt.timedelta(hours=1):continue
            key=local.isoformat(timespec='seconds')
            found[key]={'observedAtLocal':local.strftime('%Y-%m-%dT%H:%M:%S'),
                        'observedAt':key,'levelCm':value,'flowM3s':q}
        except ValueError:continue
    values=[found[k] for k in sorted(found)][-96:]
    if len(values)<2:raise ValueError('No reliable NIMH observations found')
    return values


def main():
    req=urllib.request.Request(SOURCE,headers={'User-Agent':'Mozilla/5.0 (compatible; VachaRiver/0.3 public data monitor)','Accept':'text/html'})
    with urllib.request.urlopen(req,timeout=25) as response:
        body=response.read(3_000_000)
        charset=response.headers.get_content_charset() or 'utf-8'
    try:page=body.decode(charset)
    except (UnicodeDecodeError,LookupError):
        try:page=body.decode('utf-8')
        except UnicodeDecodeError:page=body.decode('cp1251',errors='replace')
    rows=parse(page)
    previous=json.loads(DEST.read_text(encoding='utf-8')) if DEST.exists() else {}
    prior=previous.get('latest',{}).get('observedAtLocal','')
    latest=rows[-1]['observedAtLocal']
    if latest<=prior:
        print('No newer observations, keeping existing data:',latest)
        return
    payload={'station':'р. Въча · преди гр. Кричим','source':'НИМХ — филиал Пловдив',
             'sourceUrl':SOURCE,'timezone':'Europe/Sofia',
             'fetchedAt':dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
             'latest':rows[-1],'history':rows,
             'disclaimer':'Оперативни измервания. Не гарантират безопасност при работа на ВЕЦ.'}
    DEST.parent.mkdir(parents=True,exist_ok=True)
    DEST.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Updated:',latest,rows[-1]['levelCm'],'cm,',rows[-1]['flowM3s'],'m³/s')


if __name__=='__main__':
    try: main()
    except Exception as exc:
        print('Update skipped; old data retained:',exc,file=sys.stderr)
        sys.exit(1)
