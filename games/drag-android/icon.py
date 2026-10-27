from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parent
res=root/'android'/'app'/'src'/'main'/'res'
logo=Image.open(root/'www'/'assets'/'icons'/'dnch-512.png').convert('RGBA')
for density,scale in [('mdpi',1),('hdpi',1.5),('xhdpi',2),('xxhdpi',3),('xxxhdpi',4)]:
    folder=res/('mipmap-'+density)
    folder.mkdir(parents=True,exist_ok=True)
    side=round(48*scale)
    full=logo.resize((side,side),Image.Resampling.LANCZOS)
    full.save(folder/'ic_launcher.png')
    mask=Image.new('L',(side,side),0)
    ImageDraw.Draw(mask).ellipse((0,0,side-1,side-1),fill=255)
    rounded=full.copy()
    rounded.putalpha(mask)
    rounded.save(folder/'ic_launcher_round.png')
    canvas_side=round(108*scale)
    canvas=Image.new('RGBA',(canvas_side,canvas_side),(0,0,0,0))
    foreground_side=round(canvas_side*0.68)
    icon=logo.resize((foreground_side,foreground_side),Image.Resampling.LANCZOS)
    canvas.alpha_composite(icon,((canvas_side-foreground_side)//2,)*2)
    canvas.save(folder/'ic_launcher_foreground.png')
drawable=res/'drawable'
drawable.mkdir(parents=True,exist_ok=True)
(drawable/'dnch_drag_background.xml').write_text(
    '<shape xmlns:android="http://schemas.android.com/apk/res/android"><solid android:color="#080a10"/></shape>')
xml='<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@drawable/dnch_drag_background"/><foreground android:drawable="@mipmap/ic_launcher_foreground"/></adaptive-icon>'
folder=res/'mipmap-anydpi-v26'
folder.mkdir(parents=True,exist_ok=True)
for name in ['ic_launcher.xml','ic_launcher_round.xml']:
    (folder/name).write_text(xml)
print('DNCH Drag icon generated.')
