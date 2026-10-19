#!/usr/bin/env python3
"""Update the public hourly Vacha observations. Keep existing records on source failure."""
import datetime as dt
import html
import json
import re
import sys
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

SOURCE = "https://plovdiv.meteo.bg/krichim/index.php"
OUT = Path(__file__).resolve().parent.parent / "data" / "hydro.json"
BG = ZoneInfo("Europe/Sofia")

def parse(page):
    page = re.sub(r"<(?:script|style)\b[^>]*>[\s\S]*?</(?:script|style)\s*>", " ", page, flags=re.I)
    plain = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", page)))
    pat = r"(?<!\S)(\d{1,2})\.(\d{1,2})\.(20\d{2})\s+(\d{1,2})\s+(-?\d{1,4})\s+(\d+(?:[.,]\d{1,4})?)(?=\s|$)"
    observations={}
    for day,month,year,hour,level,flow in re.findall(pat,plain):
        try:
            when=dt.datetime(int(year),int(month),int(day),int(hour),tzinfo=BG)
            h=int(level);q=float(flow.replace(",","."))
            if not (0<=h<=2000 and 0<=q<=10000):continue
            if when>dt.datetime.now(BG)+dt.timedelta(hours=1):continue
            key=when.isoformat(timespec="seconds")
            observations[key]={"observedAtLocal":when.strftime("%Y-%m-%dT%H:%M:%S"),"observedAt":key,"levelCm":h,"flowM3s":q}
        except ValueError:continue
    readings=[observations[k] for k in sorted(observations)][-96:]
    if len(readings)<2:raise ValueError("No valid observations from NIMH")
    return readings

def main():
    req=urllib.request.Request(SOURCE,headers={"User-Agent":"Mozilla/5.0 (VachaRiver public observational monitor)","Accept":"text/html"})
    with urllib.request.urlopen(req,timeout=25) as response:
        body=response.read(3_000_000)
        charset=response.headers.get_content_charset() or "utf-8"
    try: page=body.decode(charset)
    except (UnicodeDecodeError,LookupError):
        try:page=body.decode("utf-8")
        except UnicodeDecodeError:page=body.decode("cp1251",errors="replace")
    readings=parse(page)
    old=json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    newest=readings[-1]["observedAtLocal"]
    if newest<=old.get("latest",{}).get("observedAtLocal",""):
        print("No new NIMH record:",newest)
        return
    result={"station":"р. Въча · преди гр. Кричим","source":"НИМХ — филиал Пловдив","sourceUrl":SOURCE,
            "timezone":"Europe/Sofia","fetchedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
            "latest":readings[-1],"history":readings,
            "disclaimer":"Оперативни данни. Не гарантират безопасност при работа на ВЕЦ."}
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("New NIMH record:",newest,readings[-1]["levelCm"],"cm")

if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("NIMH unavailable; old records retained:",str(exc),file=sys.stderr)
        sys.exit(1)
