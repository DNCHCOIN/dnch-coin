#!/usr/bin/env python3
"""Create Android launcher icons from the existing NTZ brand tile."""
from pathlib import Path
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
PHOTO = ROOT.parent / "ntz-background.jpg"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
if not PHOTO.is_file() or not ANDROID_RES.is_dir():
    raise SystemExit("Required NTZ tile or Android resources missing")

photo = Image.open(PHOTO).convert("RGB")
# The source is already a square NTZ graphic, not a generic stock icon.
side = min(photo.size)
x, y = (photo.width - side) // 2, (photo.height - side) // 2
photo = photo.crop((x,y,x+side,y+side))
bg = "#142f41"

def image(size):
    return photo.resize((size,size), Image.Resampling.LANCZOS)

def round_icon(size):
    base = image(size).convert("RGBA")
    alpha = Image.new("L",(size,size),0)
    pen = ImageDraw.Draw(alpha)
    pen.ellipse((0,0,size-1,size-1),fill=255)
    base.putalpha(alpha)
    return base

def foreground(size):
    # Android masks adaptive launcher icons (circle/squircle). Keep the complete
    # logo, truck and Bulgaria silhouette inside the 72dp centered safe area.
    canvas = Image.new("RGBA", (size,size), (0,0,0,0))
    inset = round(size * 0.69)
    tile = image(inset).convert("RGBA")
    corners = Image.new("L",(inset,inset),0)
    ImageDraw.Draw(corners).rounded_rectangle(
        (0,0,inset-1,inset-1), radius=max(2,round(inset*0.075)), fill=255
    )
    tile.putalpha(corners)
    p=(size-inset)//2
    canvas.alpha_composite(tile,(p,p))
    return canvas

densities={"mdpi":1,"hdpi":1.5,"xhdpi":2,"xxhdpi":3,"xxxhdpi":4}
for density, factor in densities.items():
    out = ANDROID_RES / ("mipmap-" + density)
    out.mkdir(parents=True,exist_ok=True)
    base = round(48*factor)
    image(base).save(out/"ic_launcher.png", optimize=True)
    round_icon(base).save(out/"ic_launcher_round.png", optimize=True)
    foreground(round(108*factor)).save(out/"ic_launcher_foreground.png",optimize=True)

xml='''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ntz_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
'''
adaptive = ANDROID_RES / "mipmap-anydpi-v26"
adaptive.mkdir(parents=True,exist_ok=True)
for filename in ("ic_launcher.xml","ic_launcher_round.xml"):
    (adaptive/filename).write_text(xml, encoding="utf8")

drawable=ANDROID_RES/"drawable"
drawable.mkdir(parents=True,exist_ok=True)
(drawable/"ntz_launcher_background.xml").write_text(
    '''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#142f41"/>
</shape>
''',encoding="utf8")
# Ensure the app manifest still references the icon resources just regenerated.
manifest=(ANDROID_RES.parent/"AndroidManifest.xml").read_text(encoding="utf8")
if '@mipmap/ic_launcher' not in manifest:
    raise SystemExit("App manifest no longer refers to launcher icon resources")
ET.fromstring(xml)
print("NTZ launcher created for five Android densities + adaptive launcher")
