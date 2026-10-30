#!/usr/bin/env python3
"""Original procedural PBR-like texture and audio source assets for DNCH Coin Miner.
All visuals/audio in the project are original algorithmic assets, not placeholder padding.
Run: python3 tools/generate_assets.py (requires numpy, Pillow, scipy; ffmpeg optional)
"""
import math, wave, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter, zoom

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'textures'
OUT.mkdir(exist_ok=True)
rng = np.random.default_rng(3102026)
SIZE = 1024


def field(sz=SIZE):
    f = np.zeros((sz, sz), np.float32)
    weight = 0.
    for grid, amp in [(4, .42), (8, .24), (16, .13), (32, .08), (64, .05), (128, .04), (256, .025)]:
        a = rng.normal(size=(grid, grid)).astype(np.float32)
        tile = Image.fromarray(np.clip(a * 28 + 128, 0, 255).astype('uint8')).resize((sz, sz), Image.Resampling.BICUBIC)
        n = (np.asarray(tile).astype(np.float32) - 128) / 28
        f += n * amp
        weight += amp
    f = f / weight
    f += rng.normal(0, 0.10, size=f.shape).astype(np.float32)
    f -= f.mean()
    f /= max(.01, f.std())
    return np.clip(f, -3, 3)


def make_map(name, base, amplitude, streak=0, crystals=False):
    n = field()
    y, x = np.indices(n.shape)
    if streak:
        n += np.sin(x * .028 + y * .07 + np.sin(x * .004) * 5) * streak
    if crystals:
        n += (np.sin(x * .11 + y * .22) ** 26) * .3
    arr = np.empty((SIZE, SIZE, 3), dtype=np.uint8)
    grain = np.clip(n * amplitude, -65, 65)
    for c, b in enumerate(base):
        arr[:, :, c] = np.clip(b + grain * (1 + .07*c) + rng.normal(0, 4, n.shape), 0, 255)
    Image.fromarray(arr, 'RGB').save(OUT / f'{name}_albedo.png', optimize=True)
    if name in ('soil', 'stone', 'sand'):
        height = gaussian_filter(n, sigma=1.2)
        gy, gx = np.gradient(height)
        strength = 2.3 if name == 'stone' else 1.5
        nx, ny, nz = -gx * strength, -gy * strength, np.ones_like(gx)
        norm = np.sqrt(nx*nx + ny*ny + nz*nz)
        normal = np.stack([(nx/norm*.5+.5)*255, (ny/norm*.5+.5)*255, (nz/norm*.5+.5)*255], axis=2)
        Image.fromarray(normal.astype(np.uint8), 'RGB').save(OUT / f'{name}_normal.png', optimize=True)

make_map('soil', (198, 181, 152), 26)
make_map('stone', (177, 178, 172), 29, streak=.37)
make_map('sand', (204, 184, 150), 18, streak=.12)
make_map('wood', (187, 154, 119), 21, streak=.65)
make_map('metal', (166, 176, 185), 11, streak=.18)

# Original high-resolution icon artwork at both Play Store and adaptive sizes.
N = 1024
im = Image.new('RGBA', (N,N), (4,12,24,255))
p = im.load()
for y in range(N):
    for x in range(N):
        r = ((x-N*.5)**2 + (y-N*.45)**2)**.5/(N*.75)
        p[x,y]=(int(9+15*(1-r)), int(22+35*(1-r)), int(39+47*(1-r)),255)
d = ImageDraw.Draw(im, 'RGBA')
for r in range(370, 140, -10):
    a = int((370-r)*.13+8)
    d.ellipse((512-r,470-r,512+r,470+r),outline=(55,208,224,a),width=5)
poly=[(512,140),(785,285),(785,620),(512,775),(239,620),(239,285)]
d.polygon(poly, fill=(21,64,76,255))
d.line(poly+[poly[0]],fill=(99,227,220,255),width=18,joint='curve')
# Twin metallic pickaxes crossing.
for mult in [-1,1]:
    d.line([(512-mult*169,337),(512+mult*135,671)], fill=(37,30,26,255),width=53)
    d.line([(512-mult*169,337),(512+mult*135,671)], fill=(198,149,71,255),width=38)
    d.polygon([(512-mult*185,280),(512-mult*228,303),(512-mult*100,411),(512-mult*15,365),(512-mult*128,346)],fill=(227,238,238,255))
d.ellipse((442,390,582,530), fill=(247,192,57,255),outline=(255,229,128,255),width=12)
d.text((512,461),'D',anchor='mm',fill=(30,48,58,255),stroke_width=1,font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',103))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',94)
d.text((512,871),'DNCH', anchor='mm',font=font,fill=(255,208,96,255),stroke_width=2,stroke_fill=(5,15,24,255))
im.convert('RGB').save(ROOT / 'art' / 'icon_1024.png', optimize=True)
for s in [192,432,512]:
    im.resize((s,s),Image.Resampling.LANCZOS).save(ROOT/'art'/f'icon_{s}.png', optimize=True)

SR=22050

def write_wav(path, samples):
    arr=(np.clip(samples,-1,1)*32767).astype('<i2')
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(arr.tobytes())

# Atmospheric original generative wind/cave soundbed: evolving filtered noise,
# three-note synth pads, drifting stereo-free resonances. 58 seconds then loop.
t=np.arange(SR*58,dtype=np.float32)/SR
noise=np.random.default_rng(88).normal(size=len(t)).astype(np.float32)
wind=gaussian_filter(noise, sigma=34)
wind=wind/(np.max(np.abs(wind))+.01)
fades=np.sin(np.pi*np.linspace(0,1,len(t)))**.4
chord=np.zeros_like(t)
for f0 in [110.,164.81,220.,293.66]:
    chord+=.13*(np.sin(2*np.pi*f0*t)+.4*np.sin(2*np.pi*(f0*.5)*t))*(.55+.45*np.sin(2*np.pi*t/27+f0))
amb=(wind*.1 + chord*.18 + np.sin(t*2*np.pi*0.18)*.01)*fades
write_wav(ROOT/'audio'/'atmosphere_master.wav',amb)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(ROOT/'audio'/'atmosphere_master.wav'),'-c:a','libvorbis','-qscale:a','5',str(ROOT/'audio'/'atmosphere.ogg')],check=True)
(ROOT/'audio'/'atmosphere_master.wav').unlink()

# Non-looping scanner, impact and rare discovery cues.
for name, dur, freqs, decay in [
    ('scan',1.35,[330,490,650],2.0), ('reveal',1.0,[660,880,1320],2.7),
    ('contract',1.8,[440,554,660,880],1.4),('footstep',.13,[90,145],19)]:
    tt=np.arange(int(SR*dur),dtype=np.float32)/SR
    sound=np.zeros_like(tt)
    for j,f0 in enumerate(freqs):
        envelope=np.exp(-tt*(decay+j*.6))
        sound+=np.sin(2*np.pi*(f0*tt+tt*tt*27.0))*envelope/(j+2)
    if name=='footstep':
        sound+=np.random.default_rng(2).normal(0,0.12,len(tt)).astype(np.float32)*np.exp(-tt*35)
    write_wav(ROOT/'audio'/f'{name}.wav',sound*.4)

print('Created original texture maps, icon, procedural ambient sound and sound effects.')