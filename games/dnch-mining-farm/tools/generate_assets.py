#!/usr/bin/env python3
"""Create original textures, Android icons and industrial ambiance."""
from pathlib import Path
import random,math,wave,struct
from PIL import Image,ImageDraw
random.seed(17062026)
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/"art";ART.mkdir(exist_ok=True)
AUD=ROOT/"audio";AUD.mkdir(exist_ok=True)

def save_material(name,base,kind):
    s=384
    im=Image.new("RGB",(s,s)); pix=im.load()
    for y in range(s):
        for x in range(s):
            n=random.gauss(0,10)
            if kind=="concrete":
                n+=math.sin(x*.47)*3+math.sin(y*.3)*3
                n+=-12 if x%127<2 or y%127<2 else 0
            if kind=="steel":
                n+=math.sin(y*2.9)*4+math.sin(y*10)*2
            if kind=="wall":
                n+=math.sin(x*.23)*2+math.sin(y*.17)*2
                n+=-15 if y%128<3 else 0
            pix[x,y]=tuple(int(max(0,min(255,c+n))) for c in base)
    im.save(ART/(name+".png"),optimize=True)

save_material("concrete",(142,153,155),"concrete")
save_material("steel",(105,130,143),"steel")
save_material("wall",(124,137,145),"wall")

def icon(size):
    im=Image.new("RGB",(size,size),(10,30,42));d=ImageDraw.Draw(im)
    u=size/432.0
    def rect(box,fill,outline=None,width=1):
        d.rounded_rectangle(tuple(round(v*u) for v in box),radius=max(1,int(15*u)),fill=fill,outline=outline,width=max(1,int(width*u)))
    for i in range(11):
        d.line([(int((42+i*34)*u),0),(int((42+i*34)*u),size)],fill=(14,50,65),width=max(1,int(2*u)))
    rect((48,72,388,358),(30,59,74),(96,188,198),7)
    for j in range(3):
        yy=97+j*80
        rect((73,yy,360,yy+62),(34,52,66),(115,137,152),5)
        for k in range(3):
            cx=int((119+k*74)*u);cy=int((yy+31)*u);rr=int(24*u)
            d.ellipse((cx-rr,cy-rr,cx+rr,cy+rr),fill=(18,29,42),outline=(69,202,223),width=max(1,int(4*u)))
            for p in range(5):
                a=p*math.pi*2/5+0.38
                d.line((cx,cy,cx+int(math.cos(a)*rr*.7),cy+int(math.sin(a)*rr*.7)),fill=(126,156,171),width=max(1,int(3*u)))
        d.ellipse((int(338*u),int((yy+19)*u),int(349*u),int((yy+30)*u)),fill=(76,245,172))
    return im
for size in (192,432):
    icon(size).save(ART/f"icon_{size}.png",optimize=True)

sr=11025
rng=random.Random(787)
samples=[]
last=0.0
for i in range(4*sr):
    t=i/sr
    last=.985*last+.015*rng.uniform(-1,1)
    sample=(last*.64+.30*math.sin(2*math.pi*66*t)+.12*math.sin(2*math.pi*132*t))*.11
    samples.append(max(-32768,min(32767,int(sample*32767))))
with wave.open(str(AUD/"industrial_fans.wav"),"wb") as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr)
    w.writeframes(struct.pack("<%dh"%len(samples),*samples))
print("Generated original textures, icons and sound.")
