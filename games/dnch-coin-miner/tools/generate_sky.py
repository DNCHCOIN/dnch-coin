"""Generate a seamless, original 2K panorama sky for the mining valley."""
from pathlib import Path
import numpy as np
from PIL import Image
W,H=2048,1024
rng=np.random.default_rng(32)
y,x=np.indices((H,W),dtype=np.float32)
t=y/H
# Blue at zenith, warm at horizon, hazy lower hemisphere.
colors=np.zeros((H,W,3),dtype=np.float32)
for channel,(a,b,c) in enumerate(zip((19,48,83),(104,162,190),(218,182,145))):
    u=np.clip(t*2.2,0,1)
    v=np.clip((t-.47)*4.0,0,1)
    colors[:,:,channel]=a*(1-u)+b*u
    colors[:,:,channel]=colors[:,:,channel]*(1-v)+c*v
# Continuous panoramic cloud field from waves and turbulence.
cloud=.48*np.sin(x/W*2*np.pi*7.0+np.sin(y*.015)*2.1)+.32*np.sin(x/W*2*np.pi*13.0-y*.055)+.22*np.cos(x/W*2*np.pi*29+y*.079)
wisps=np.clip((cloud-.33)*1.2,0,.78) * np.exp(-((t-.38)/.17)**2)
colors=colors*(1-wisps[:,:,None]*.50)+np.array([249,241,213],dtype=np.float32)*wisps[:,:,None]*.50
# Gentle sunrise toward one edge.
distance=np.abs((x/W-.72+.5)%1-.5)
sun=np.exp(-(distance/.06)**2-((t-.48)/.065)**2)
colors+=np.array([45,25,1])*sun[:,:,None]
colors+=rng.normal(0,1.1,size=(H,W,1))
img=Image.fromarray(np.clip(colors,0,255).astype('uint8'),'RGB')
img.save(Path(__file__).resolve().parent.parent/'textures'/'sky_panorama.png',optimize=True)
print('Original panorama generated.')