#!/usr/bin/env python3
"""Integrity checks for a Godot source package (not a substitute for engine testing)."""
from pathlib import Path
from PIL import Image
import re, wave, subprocess
ROOT = Path(__file__).resolve().parent.parent
main = (ROOT / 'scripts/game.gd').read_text()
map_code = (ROOT / 'scripts/geo_map.gd').read_text()
scene = (ROOT / 'main.tscn').read_text()
assert 'res://scripts/game.gd' in scene
assert 'func _ore_richness(' in main and 'func _perform_scan(' in main
assert 'func _save_game(' in main and 'func _load_game(' in main
assert 'func _redraw_terrain(' in main and 'func _make_player(' in main
assert 'res://textures/soil_albedo.png' in main
assert 'source._ore_richness(' in map_code
for name in ('game', 'geo_map', 'smoke_test'):
    script = (ROOT / 'scripts' / (name + '.gd')).read_text()
    funcs = re.findall(r'^func (\w+)\(', script, re.M)
    assert len(set(funcs)) == len(funcs), f'duplicate GDScript functions in {name}'
    for line in script.splitlines():
        assert not line.startswith(' '), f'Non-tab indentation in {name}: {line[:50]}'
for rel in sorted(set(re.findall(r'res://([A-Za-z0-9_./%-]+)', main + map_code + scene))):
    if '%' in rel: continue
    assert (ROOT / rel).exists(), f'Missing referenced resource {rel}'
for name in ('soil','stone','sand','wood','metal'):
    img=Image.open(ROOT/'textures'/f'{name}_albedo.png')
    assert img.size == (1024, 1024)
for name in ('soil','stone','sand'):
    img=Image.open(ROOT/'textures'/f'{name}_normal.png')
    assert img.size == (1024, 1024)
assert Image.open(ROOT/'textures/sky_panorama.png').size == (2048,1024)
for name in ('dig','pickup','sale','buy','scan','reveal','contract','footstep'):
    with wave.open(str(ROOT/'audio'/f'{name}.wav')) as sound:
        assert sound.getnframes()>100
res=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1',str(ROOT/'audio/atmosphere.ogg')],capture_output=True,text=True)
assert res.returncode==0 and 'duration=' in res.stdout
print('PASS: project source, required assets, textures, original sounds and scene references.')
print('NOTE: Godot runtime and Android binary have NOT been tested.')