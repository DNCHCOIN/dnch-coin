#!/usr/bin/env python3
"""Rebuild remaining original gameplay cues for cloud Android packaging."""
from pathlib import Path
import wave, math, random
root=Path(__file__).resolve().parent.parent / 'audio'
root.mkdir(exist_ok=True)
rate=22050
random.seed(23)
for name,dur,base in [('dig',.25,90),('pickup',.39,720),('sale',.35,490),('buy',.5,605)]:
    samples=bytearray()
    for i in range(int(rate*dur)):
        t=i/rate
        env=(1-t/dur)**2
        if name=='dig':
            v=(random.random()*2-1)*env*.45 + math.sin(2*math.pi*(base*(1-t/dur*.75))*t)*env*.15
        else:
            v=(math.sin(2*math.pi*base*t*(1+0.45*t))*.27+math.sin(2*math.pi*base*1.5*t)*.10)*env
        n=int(max(-1,min(1,v))*32760)
        samples+=n.to_bytes(2,byteorder='little',signed=True)
    with wave.open(str(root/(name+'.wav')),'wb') as out:
        out.setnchannels(1);out.setframerate(rate);out.setsampwidth(2);out.writeframes(samples)
print('Extra gameplay cues generated')