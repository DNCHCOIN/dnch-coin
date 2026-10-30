extends Node3D
## DNCH COIN MINER v0.2 — geological survey, deterministic deposits and mobile-first 3D gameplay.
## No paid assets or external services required.

const GRID: int = 65
const STEP: float = 0.5
const HALF: float = 16.0
const BAG_MAX: int = 18
const SHOP_SPOT: Vector3 = Vector3(-10.0, 0.0, -9.0)
const SAVE_FILE: String = "user://dnch_miner_save.json"
const ORE_NAMES: Array[String] = ["STONE", "COPPER", "GOLD", "CRYSTAL", "DIAMOND"]
const ORE_PRICES: Array[int] = [2, 8, 22, 42, 85]
const ORE_COLORS: Array[Color] = [Color("8d9898"), Color("cf824d"), Color("ffcc48"), Color("62e5c8"), Color("8ecbff")]

var rng: RandomNumberGenerator = RandomNumberGenerator.new()
var geology: FastNoiseLite = FastNoiseLite.new()
var ore_nodes: Array[Vector2] = []
var dust_particles: CPUParticles3D
var scan_ring: MeshInstance3D
var scan_ring_material: StandardMaterial3D
var sunlight: DirectionalLight3D
var time_of_day: float = 0.22
var scan_cooldown: float = 0.0
var scan_reveal_time: float = 0.0
var scanner_pulse: float = -1.0
var scan_quality: int = 0
var contracts_completed: int = 0
var contract_progress: int = 0
var eco_mode: bool = false
var mini_map: Control
var scanner_label: Label
var contracts_label: Label
var scan_button: Button
var eco_button: Button
var ambience_player: AudioStreamPlayer
var footstep_timer: float = 0.0
var material_cache: Dictionary = {}
var heights: PackedFloat32Array = PackedFloat32Array()
var terrain: MeshInstance3D
var player: Node3D
var avatar: Node3D
var arm_left: Node3D
var arm_right: Node3D
var shovel: Node3D
var camera: Camera3D
var view_yaw: float = 0.25
var input_axis: Vector2 = Vector2.ZERO
var stick_index: int = -1
var camera_index: int = -1
var stick_center: Vector2 = Vector2.ZERO
var last_camera_pos: Vector2 = Vector2.ZERO
var stick_base: Panel
var stick_knob: Panel
var dig_held: bool = false
var dig_cooldown: float = 0.0
var dig_anim: float = 0.0
var walking_time: float = 0.0
var notification_time: float = 0.0
var save_timer: float = 0.0
var coins: int = 50
var shovel_level: int = 1
var drill_level: int = 0
var magnet_level: int = 0
var ores: Array[int] = [0, 0, 0, 0, 0]
var total_digs: int = 0
var pickups: Array = []
var shop_open: bool = false
var ui: Control
var coins_label: Label
var bag_label: Label
var tool_label: Label
var depth_label: Label
var objective_label: Label
var notify_label: Label
var vendor_hint: Label
var shop_panel: Panel
var sell_button: Button
var shop_button: Button
var buy_shovel_button: Button
var buy_drill_button: Button
var buy_magnet_button: Button
var sfx: Dictionary = {}

func _ready() -> void:
	rng.seed = 20261031
	geology.seed = 943217
	geology.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	geology.frequency = 0.13
	geology.fractal_type = FastNoiseLite.FRACTAL_FBM
	geology.fractal_octaves = 3
	_make_environment()
	_make_terrain()
	_make_scenery()
	_make_player()
	_make_camera()
	_make_audio()
	_make_dig_particles()
	_make_scan_ring()
	_make_ui()
	_load_game()
	_apply_eco_mode()
	_redraw_terrain()
	_update_hud()
	_notice("FIND ORE. DIG THE GROUND. RETURN TO CAMP TO SELL.")

func _make_environment() -> void:
	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var sky_material := PanoramaSkyMaterial.new()
	sky_material.panorama = load("res://textures/sky_panorama.png")
	sky.sky_material = sky_material
	environment.sky = sky
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("d2e6d8")
	environment.ambient_light_energy = 0.75
	var world := WorldEnvironment.new()
	world.environment = environment
	add_child(world)
	sunlight = DirectionalLight3D.new()
	sunlight.rotation_degrees = Vector3(-48, -32, 0)
	sunlight.light_color = Color("fff4d9")
	sunlight.light_energy = 1.8
	sunlight.shadow_enabled = true
	add_child(sunlight)
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-35, 145, 0)
	fill.light_color = Color("9dd8f0")
	fill.light_energy = 0.35
	add_child(fill)

func _make_terrain() -> void:
	heights.resize(GRID * GRID)
	for z in range(GRID):
		for x in range(GRID):
			var wx: float = -HALF + float(x) * STEP
			var wz: float = -HALF + float(z) * STEP
			var base: float = 0.09 * sin(wx * 0.9) * cos(wz * 0.7) + 0.045 * sin(wx * 1.9 + wz * 1.3)
			base += 0.13 * smoothstep(9.0, 16.0, max(abs(wx), abs(wz)))
			heights[z * GRID + x] = base
	terrain = MeshInstance3D.new()
	terrain.name = "DIGGABLE_TERRAIN"
	var material := StandardMaterial3D.new()
	material.vertex_color_use_as_albedo = true
	material.roughness = 1.0
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	material.albedo_texture = load("res://textures/soil_albedo.png")
	material.normal_enabled = true
	material.normal_texture = load("res://textures/soil_normal.png")
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	terrain.material_override = material
	add_child(terrain)

func _height_at_grid(x: int, z: int) -> float:
	return heights[clampi(z, 0, GRID - 1) * GRID + clampi(x, 0, GRID - 1)]

func _ground_height(wx: float, wz: float) -> float:
	var gx: float = clampf((wx + HALF) / STEP, 0.0, float(GRID - 1) - 0.001)
	var gz: float = clampf((wz + HALF) / STEP, 0.0, float(GRID - 1) - 0.001)
	var x: int = int(floor(gx))
	var z: int = int(floor(gz))
	var fx: float = gx - float(x)
	var fz: float = gz - float(z)
	var top: float = lerpf(_height_at_grid(x, z), _height_at_grid(x + 1, z), fx)
	var bottom: float = lerpf(_height_at_grid(x, z + 1), _height_at_grid(x + 1, z + 1), fx)
	return lerpf(top, bottom, fz)

func _ground_color(h: float, x: float, z: float) -> Color:
	var noise: float = 0.022 * sin(x * 3.1 + z * 5.7)
	if h < -1.55:
		return Color(0.30 + noise, 0.36 + noise, 0.39 + noise)
	if h < -0.65:
		return Color(0.43 + noise, 0.35 + noise, 0.28 + noise)
	if h < -0.15:
		return Color(0.60 + noise, 0.43 + noise, 0.30 + noise)
	return Color(0.66 + noise, 0.53 + noise, 0.34 + noise)

func _redraw_terrain() -> void:
	var builder := SurfaceTool.new()
	builder.begin(Mesh.PRIMITIVE_TRIANGLES)
	for z in range(GRID - 1):
		for x in range(GRID - 1):
			var x0: float = -HALF + float(x) * STEP
			var z0: float = -HALF + float(z) * STEP
			var a := Vector3(x0, _height_at_grid(x, z), z0)
			var b := Vector3(x0 + STEP, _height_at_grid(x + 1, z), z0)
			var c := Vector3(x0, _height_at_grid(x, z + 1), z0 + STEP)
			var d := Vector3(x0 + STEP, _height_at_grid(x + 1, z + 1), z0 + STEP)
			for vertex in [a, c, b, b, c, d]:
				var surface_tint: Color = _ground_color(vertex.y, vertex.x, vertex.z)
				if vertex.y < -0.25:
					var seam: float = _ore_richness(vertex.x, vertex.z, -vertex.y)
					if seam > 0.74:
						surface_tint = surface_tint.lerp(Color("e1a967"), (seam - 0.74) * 0.55)
				builder.set_color(surface_tint)
				builder.set_uv(Vector2(vertex.x * 0.51, vertex.z * 0.51))
				builder.add_vertex(vertex)
	builder.generate_normals()
	builder.generate_tangents()
	terrain.mesh = builder.commit()

func _material(color: Color, glow: bool = false, texture_kind: String = "") -> StandardMaterial3D:
	var material_id: String = "%s-%s-%s" % [color.to_html(), str(glow), texture_kind]
	if material_cache.has(material_id):
		return material_cache[material_id]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = 0.82
	if glow:
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = 1.4
	elif texture_kind != "":
		m.albedo_texture = load("res://textures/%s_albedo.png" % texture_kind)
		if texture_kind in ["soil", "stone", "sand"]:
			m.normal_enabled = true
			m.normal_texture = load("res://textures/%s_normal.png" % texture_kind)
		m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	material_cache[material_id] = m
	return m

func _box(parent: Node3D, location: Vector3, dimensions: Vector3, color: Color, texture_kind: String = "") -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var shape := BoxMesh.new()
	shape.size = dimensions
	node.mesh = shape
	node.position = location
	node.material_override = _material(color, false, texture_kind)
	parent.add_child(node)
	return node

func _ball(parent: Node3D, location: Vector3, radius: Vector3, color: Color, glow: bool = false, texture_kind: String = "") -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var shape := SphereMesh.new()
	shape.radius = 1.0
	shape.height = 2.0
	shape.radial_segments = 12
	shape.rings = 6
	node.mesh = shape
	node.scale = radius
	node.position = location
	node.material_override = _material(color, glow, texture_kind)
	parent.add_child(node)
	return node

func _cylinder(parent: Node3D, location: Vector3, lower: float, upper: float, length: float, color: Color, glow: bool = false, texture_kind: String = "") -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var shape := CylinderMesh.new()
	shape.bottom_radius = lower
	shape.top_radius = upper
	shape.height = length
	shape.radial_segments = 7
	node.mesh = shape
	node.position = location
	node.material_override = _material(color, glow, texture_kind)
	parent.add_child(node)
	return node

func _make_scenery() -> void:
	var camp := Node3D.new()
	camp.name = "MINER_CAMP"
	camp.position = SHOP_SPOT
	add_child(camp)
	_box(camp, Vector3(0, 0.12, 0), Vector3(6.2, 0.24, 6.0), Color("a99b84"), "wood")
	_box(camp, Vector3(0, 1.35, -1.7), Vector3(5.6, 2.7, 1.1), Color("b8c4c6"), "metal")
	_box(camp, Vector3(0, 2.95, -1.7), Vector3(6.15, 0.55, 1.8), Color("da8b49"))
	_box(camp, Vector3(-2.1, 1.15, -0.9), Vector3(0.25, 2.2, 2.6), Color("43555c"))
	_box(camp, Vector3(2.1, 1.15, -0.9), Vector3(0.25, 2.2, 2.6), Color("43555c"))
	_box(camp, Vector3(0, 0.65, -0.65), Vector3(3.5, 1.25, 0.80), Color("d6b98d"), "wood")
	_box(camp, Vector3(0, 1.34, -0.2), Vector3(3.9, 0.15, 1.55), Color("654734"))
	_box(camp, Vector3(0, 2.15, -1.09), Vector3(4.1, 0.8, 0.1), Color("203d4b"))
	var sign := Label3D.new()
	sign.text = "MINER'S CAMP\nSELL & UPGRADE"
	sign.font_size = 50
	sign.pixel_size = 0.0045
	sign.modulate = Color("ffde87")
	sign.position = Vector3(0, 2.3, -1.02)
	camp.add_child(sign)
	for i in range(3):
		_box(camp, Vector3(-1.4 + float(i) * 1.3, 0.24, 1.65), Vector3(0.82, 0.48, 0.82), Color("795740"))
		_box(camp, Vector3(-1.4 + float(i) * 1.3, 0.51, 1.65), Vector3(0.87, 0.10, 0.87), Color("dfab59"))
	_cylinder(camp, Vector3(-2.7, 1.35, 1.9), 0.09, 0.09, 2.7, Color("4d5861"))
	_ball(camp, Vector3(-2.7, 2.78, 1.9), Vector3(0.28, 0.28, 0.28), Color("ffda71"), true)
	var light := OmniLight3D.new()
	light.position = Vector3(-2.7, 2.8, 1.9)
	light.light_color = Color("ffbb6d")
	light.light_energy = 2.0
	light.omni_range = 5.0
	camp.add_child(light)
	for k in range(90):
		var angle: float = rng.randf_range(-PI, PI)
		var r: float = rng.randf_range(3.4, 22.0)
		var xx: float = cos(angle) * r
		var zz: float = sin(angle) * r
		if abs(xx) > 15.1 or abs(zz) > 15.1:
			continue
		if Vector2(xx - SHOP_SPOT.x, zz - SHOP_SPOT.z).length() < 5.0:
			continue
		var y: float = _ground_height(xx, zz)
		var rock_size: float = rng.randf_range(0.2, 0.75)
		var grey: Color = [Color("6a7775"), Color("75817b"), Color("ad987d")][k % 3]
		_ball(self, Vector3(xx, y + rock_size * 0.39, zz), Vector3(rock_size, rock_size * 0.52, rock_size * 0.76), grey, false, "stone")
	for k in range(17):
		var ang: float = float(k) * 2.399
		var radius: float = 5.5 + float(k % 4) * 2.1
		var p := Vector3(cos(ang) * radius, 0, sin(ang) * radius)
		if Vector2(p.x - SHOP_SPOT.x, p.z - SHOP_SPOT.z).length() < 4.6:
			continue
		p.y = _ground_height(p.x, p.z)
		_make_ore_outcrop(p, k)
		ore_nodes.append(Vector2(p.x, p.z))
	for k in range(10):
		var xx: float = rng.randf_range(-15.0, 15.0)
		var zz: float = rng.randf_range(-15.0, 15.0)
		if Vector2(xx - SHOP_SPOT.x, zz - SHOP_SPOT.z).length() < 5.5:
			continue
		var loc := Vector3(xx, _ground_height(xx, zz), zz)
		_cylinder(self, loc + Vector3(0, 0.8, 0), 0.14, 0.11, 1.6, Color("594d3d"))
		_ball(self, loc + Vector3(0, 1.95, 0), Vector3(0.9, 1.1, 0.9), Color("3b7861"))
		_ball(self, loc + Vector3(0.2, 2.45, 0), Vector3(0.7, 0.7, 0.73), Color("4a8c67"))
	# Perimeter ridges make the scene feel like a mine, not an empty plane.
	for k in range(30):
		var angle: float = TAU * float(k) / 30.0
		var xx: float = sin(angle) * 18.3
		var zz: float = cos(angle) * 18.3
		var top: float = 2.3 + 1.3 * (1.0 + sin(angle * 5.0))
		_cylinder(self, Vector3(xx, top * 0.40 - 0.35, zz), 3.4, 0.0, top, Color("648077"))

func _ore_richness(wx: float, wz: float, depth: float = 0.0) -> float:
	# Spatially correlated, deterministic ore deposits. The scanner and dig results
	# use the same function; players can genuinely prospect high-yield patches.
	var noise_value: float = (geology.get_noise_2d(wx * 5.2, wz * 5.2) + 1.0) * 0.5
	var seam_value: float = (sin(wx * 0.78 + wz * 0.33) * cos(wz * 0.57 - wx * 0.11) + 1.0) * 0.5
	var vein_bonus: float = 0.0
	for deposit in ore_nodes:
		var proximity: float = deposit.distance_to(Vector2(wx, wz))
		vein_bonus = maxf(vein_bonus, 0.24 * exp(-proximity * 0.8))
	return clampf(noise_value * 0.56 + seam_value * 0.26 + depth * 0.055 + vein_bonus, 0.03, 0.99)

func _make_ore_outcrop(loc: Vector3, seed: int) -> void:
	var cluster := Node3D.new()
	cluster.position = loc
	cluster.name = "ORE_OUTCROP"
	add_child(cluster)
	var color: Color = ORE_COLORS[1 + seed % 4]
	for j in range(3):
		var offset: float = (float(j) - 1.0) * 0.26
		var h: float = 0.55 + 0.25 * float((j + seed) % 3)
		var prism := _cylinder(cluster, Vector3(offset, h * 0.52, sin(float(j) * 1.6) * 0.16), 0.22, 0.0, h, color, true)
		prism.rotation_degrees.z = float(j - 1) * 15.0
	_ball(cluster, Vector3(0, 0.05, 0), Vector3(0.7, 0.17, 0.55), Color("50493d"))

func _make_player() -> void:
	player = Node3D.new()
	player.name = "MINER"
	player.position = Vector3(-7.0, _ground_height(-7.0, -5.0), -5.0)
	add_child(player)
	avatar = Node3D.new()
	player.add_child(avatar)
	# Stylized humanoid with an actual animated shovel, not a static marker.
	_box(avatar, Vector3(0, 1.12, 0), Vector3(0.68, 0.92, 0.39), Color("e39a43"))
	_box(avatar, Vector3(0, 1.40, 0.23), Vector3(0.48, 0.42, 0.17), Color("e0be62"))
	_box(avatar, Vector3(0, 1.11, 0.28), Vector3(0.49, 0.10, 0.08), Color("cfe7ad"))
	_ball(avatar, Vector3(0, 1.86, 0), Vector3(0.28, 0.30, 0.26), Color("d9a178"))
	_cylinder(avatar, Vector3(0, 2.13, 0), 0.37, 0.27, 0.16, Color("f3c74c"))
	_box(avatar, Vector3(0, 2.07, -0.10), Vector3(0.75, 0.08, 0.5), Color("f3c74c"))
	_ball(avatar, Vector3(-0.10, 1.88, -0.23), Vector3(0.035, 0.035, 0.03), Color("263944"))
	_ball(avatar, Vector3(0.10, 1.88, -0.23), Vector3(0.035, 0.035, 0.03), Color("263944"))
	_box(avatar, Vector3(0, 1.10, 0.31), Vector3(0.42, 0.68, 0.35), Color("30495b"))
	for side in [-1.0, 1.0]:
		_box(avatar, Vector3(0.18 * side, 0.48, 0), Vector3(0.23, 0.77, 0.25), Color("2b4857"))
		_box(avatar, Vector3(0.18 * side, 0.12, -0.12), Vector3(0.32, 0.26, 0.48), Color("2d3032"))
	arm_left = Node3D.new()
	arm_left.position = Vector3(-0.45, 1.49, 0)
	avatar.add_child(arm_left)
	_box(arm_left, Vector3(0, -0.38, 0), Vector3(0.20, 0.72, 0.22), Color("d9a178"))
	arm_right = Node3D.new()
	arm_right.position = Vector3(0.45, 1.49, 0)
	avatar.add_child(arm_right)
	_box(arm_right, Vector3(0, -0.35, 0), Vector3(0.2, 0.70, 0.22), Color("d9a178"))
	shovel = Node3D.new()
	shovel.position = Vector3(0, -0.65, -0.12)
	arm_right.add_child(shovel)
	_cylinder(shovel, Vector3(0.02, -0.50, -0.25), 0.042, 0.042, 1.3, Color("b48b56"))
	var spade := _box(shovel, Vector3(0.02, -1.19, -0.28), Vector3(0.36, 0.43, 0.10), Color("d4dce0"))
	spade.rotation_degrees.x = -16.0
	shovel.rotation_degrees.x = -44.0

func _make_camera() -> void:
	camera = Camera3D.new()
	camera.name = "THIRD_PERSON_CAMERA"
	camera.fov = 66.0
	camera.current = true
	add_child(camera)
	_follow_camera(1.0)

func _follow_camera(weight: float) -> void:
	var behind := Vector3(sin(view_yaw) * 7.8, 5.6, cos(view_yaw) * 7.8)
	var destination: Vector3 = player.position + behind
	camera.position = camera.position.lerp(destination, weight)
	camera.look_at(player.position + Vector3(0, 1.0, 0), Vector3.UP)

func _make_audio() -> void:
	for name in ["dig", "pickup", "sale", "buy", "scan", "reveal", "contract", "footstep"]:
		var sound := AudioStreamPlayer.new()
		sound.stream = load("res://audio/%s.wav" % name)
		sound.volume_db = -9.0 if name == "dig" else -6.0
		add_child(sound)
		sfx[name] = sound
	ambience_player = AudioStreamPlayer.new()
	ambience_player.stream = load("res://audio/atmosphere.ogg")
	ambience_player.volume_db = -16.0
	add_child(ambience_player)
	ambience_player.finished.connect(_restart_ambience)
	ambience_player.play()

func _restart_ambience() -> void:
	if is_instance_valid(ambience_player):
		ambience_player.play()

func _make_dig_particles() -> void:
	dust_particles = CPUParticles3D.new()
	dust_particles.name = "DIG_DUST_PARTICLES"
	dust_particles.amount = 26
	dust_particles.lifetime = 0.72
	dust_particles.one_shot = true
	dust_particles.explosiveness = 0.98
	dust_particles.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	dust_particles.emission_sphere_radius = 0.15
	dust_particles.direction = Vector3(0, 1, 0)
	dust_particles.spread = 75.0
	dust_particles.gravity = Vector3(0, -5.3, 0)
	dust_particles.initial_velocity_min = 1.1
	dust_particles.initial_velocity_max = 3.2
	dust_particles.scale_amount_min = 0.55
	dust_particles.scale_amount_max = 1.3
	dust_particles.color = Color("ae8967")
	var particle_mesh := SphereMesh.new()
	particle_mesh.radius = 0.062
	particle_mesh.height = 0.124
	particle_mesh.radial_segments = 6
	particle_mesh.rings = 3
	dust_particles.mesh = particle_mesh
	dust_particles.emitting = false
	add_child(dust_particles)

func _make_scan_ring() -> void:
	scan_ring = MeshInstance3D.new()
	scan_ring.name = "GEOLOGICAL_SCAN_PULSE"
	var ring := TorusMesh.new()
	ring.inner_radius = 0.92
	ring.outer_radius = 1.0
	ring.rings = 32
	ring.ring_segments = 6
	scan_ring.mesh = ring
	scan_ring_material = StandardMaterial3D.new()
	scan_ring_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	scan_ring_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	scan_ring_material.albedo_color = Color("4de4e7")
	scan_ring_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	scan_ring.material_override = scan_ring_material
	scan_ring.visible = false
	add_child(scan_ring)

func _play(sound_name: String) -> void:
	if sfx.has(sound_name):
		var sound: AudioStreamPlayer = sfx[sound_name]
		sound.play()

func _ui_panel(parent: Control, pos: Vector2, dimensions: Vector2, bg: Color, radius: int = 15) -> Panel:
	var panel := Panel.new()
	panel.position = pos
	panel.size = dimensions
	var style := StyleBoxFlat.new()
	style.bg_color = bg
	style.corner_radius_top_left = radius
	style.corner_radius_top_right = radius
	style.corner_radius_bottom_left = radius
	style.corner_radius_bottom_right = radius
	style.border_width_bottom = 2
	style.border_color = Color("38586a")
	panel.add_theme_stylebox_override("panel", style)
	parent.add_child(panel)
	return panel

func _ui_label(parent: Control, txt: String, pos: Vector2, dimensions: Vector2, font: int, color: Color, align: HorizontalAlignment = HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var label := Label.new()
	label.text = txt
	label.position = pos
	label.size = dimensions
	label.horizontal_alignment = align
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", font)
	label.add_theme_color_override("font_color", color)
	parent.add_child(label)
	return label

func _ui_button(parent: Control, txt: String, pos: Vector2, dimensions: Vector2, bg: Color, font_size: int = 22) -> Button:
	var btn := Button.new()
	btn.text = txt	btn.position = pos
	btn.size = dimensions
	btn.add_theme_font_size_override("font_size", font_size)
	btn.add_theme_color_override("font_color", Color("ffffff"))
	btn.add_theme_color_override("font_hover_color", Color("ffffff"))
	for style_type in ["normal", "hover", "pressed"]:
		var style := StyleBoxFlat.new()
		style.bg_color = bg.lightened(0.14) if style_type == "hover" else (bg.darkened(0.22) if style_type == "pressed" else bg)
		style.corner_radius_top_left = 16
		style.corner_radius_top_right = 16
		style.corner_radius_bottom_left = 16
		style.corner_radius_bottom_right = 16
		style.border_width_bottom = 4
		style.border_color = Color("203947")
		btn.add_theme_stylebox_override(style_type, style)
	btn.focus_mode = Control.FOCUS_NONE
	parent.add_child(btn)
	return btn

func _make_ui() -> void:
	var canvas := CanvasLayer.new()
	canvas.layer = 10
	add_child(canvas)
	ui = Control.new()
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(ui)
	var brand := _ui_panel(ui, Vector2(22, 17), Vector2(425, 102), Color("152d3ae9"))
	_ui_label(brand, "DNCH  COIN MINER", Vector2(19, 9), Vector2(400, 50), 32, Color("ffd06d"))
	_ui_label(brand, "DIG  /  DISCOVER  /  UPGRADE", Vector2(22, 57), Vector2(360, 32), 16, Color("b9dee8"))
	var stats := _ui_panel(ui, Vector2(960, 18), Vector2(295, 129), Color("142e3de8"))
	coins_label = _ui_label(stats, "COINS    50", Vector2(17, 7), Vector2(270, 33), 24, Color("ffda78"))
	bag_label = _ui_label(stats, "BAG    0 / 18", Vector2(17, 45), Vector2(260, 28), 18, Color("ffffff"))
	tool_label = _ui_label(stats, "SHOVEL  LV. 1", Vector2(17, 78), Vector2(260, 31), 17, Color("a9e9db"))
	depth_label = _ui_label(ui, "", Vector2(475, 17), Vector2(430, 41), 18, Color("ffffff"), HORIZONTAL_ALIGNMENT_CENTER)
	objective_label = _ui_label(ui, "EXPLORE THE VALLEY", Vector2(418, 52), Vector2(445, 36), 18, Color("ffdfaa"), HORIZONTAL_ALIGNMENT_CENTER)
	vendor_hint = _ui_label(ui, "", Vector2(420, 150), Vector2(445, 26), 17, Color("e8f5dd"), HORIZONTAL_ALIGNMENT_CENTER)
	var instructions := _ui_panel(ui, Vector2(22, 135), Vector2(385, 53), Color("15303b9e"), 11)
	_ui_label(instructions, "WASD MOVE  |  SPACE DIG  |  G SCAN", Vector2(13, 3), Vector2(364, 46), 15, Color("e3edee"))
	var map_panel := _ui_panel(ui, Vector2(22, 206), Vector2(240, 236), Color("071a26e8"), 14)
	var map_script: GDScript = load("res://scripts/geo_map.gd")
	mini_map = Control.new()
	mini_map.set_script(map_script)
	mini_map.position = Vector2(9, 9)
	mini_map.size = Vector2(222, 218)
	mini_map.mouse_filter = Control.MOUSE_FILTER_IGNORE
	map_panel.add_child(mini_map)
	mini_map.set("source", self)
	scanner_label = _ui_label(ui, "GEOSCAN READY", Vector2(438, 119), Vector2(428, 29), 17, Color("78fff1"), HORIZONTAL_ALIGNMENT_CENTER)
	contracts_label = _ui_label(ui, "CONTRACT: 0 / 12 DIGS", Vector2(413, 88), Vector2(450, 28), 16, Color("ffe2a6"), HORIZONTAL_ALIGNMENT_CENTER)
	notify_label = _ui_label(ui, "", Vector2(300, 179), Vector2(690, 42), 18, Color("fff7ca"), HORIZONTAL_ALIGNMENT_CENTER)
	var joystick := _ui_panel(ui, Vector2(53, 529), Vector2(156, 156), Color("23465588"), 78)
	stick_base = joystick
	stick_knob = _ui_panel(joystick, Vector2(48, 48), Vector2(60, 60), Color("80ced9ce"), 30)
	stick_knob.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_ui_label(ui, "MOVE", Vector2(90, 494), Vector2(90, 28), 17, Color("ffffff"), HORIZONTAL_ALIGNMENT_CENTER)
	var dig := _ui_button(ui, "DIG", Vector2(1093, 525), Vector2(151, 151), Color("cf8a36"), 40)
	dig.button_down.connect(_begin_dig)
	dig.button_up.connect(_stop_dig)
	var collect := _ui_button(ui, "PICK UP", Vector2(930, 600), Vector2(143, 75), Color("387f76"), 20)
	collect.pressed.connect(_collect_nearby)
	sell_button = _ui_button(ui, "SELL ORE", Vector2(940, 492), Vector2(130, 67), Color("367a5f"), 19)
	sell_button.pressed.connect(_sell_ores)
	shop_button = _ui_button(ui, "SHOP", Vector2(785, 600), Vector2(133, 75), Color("426685"), 21)
	shop_button.pressed.connect(_toggle_shop)
	scan_button = _ui_button(ui, "GEO SCAN", Vector2(783, 506), Vector2(138, 74), Color("237d8d"), 18)
	scan_button.pressed.connect(_perform_scan)
	eco_button = _ui_button(ui, "ECO MODE", Vector2(22, 449), Vector2(170, 45), Color("355a66"), 16)
	eco_button.pressed.connect(_toggle_eco_mode)
	_ui_label(ui, "+", Vector2(615, 338), Vector2(50, 52), 29, Color("fff4d2"), HORIZONTAL_ALIGNMENT_CENTER)
	_make_shop_overlay()

func _make_shop_overlay() -> void:
	shop_panel = _ui_panel(ui, Vector2(374, 155), Vector2(535, 422), Color("132c39f5"), 22)
	shop_panel.visible = false
	_ui_label(shop_panel, "MINER'S SUPPLY SHOP", Vector2(28, 19), Vector2(460, 53), 31, Color("ffd177"))
	_ui_label(shop_panel, "Spend the coins you earn by selling ore.", Vector2(29, 70), Vector2(470, 36), 17, Color("c9dce1"))
	buy_shovel_button = _ui_button(shop_panel, "UPGRADE SHOVEL", Vector2(27, 126), Vector2(481, 60), Color("b77e37"), 22)
	buy_shovel_button.pressed.connect(_buy_shovel)
	buy_drill_button = _ui_button(shop_panel, "BUY POWER DRILL", Vector2(27, 204), Vector2(481, 60), Color("477b91"), 22)
	buy_drill_button.pressed.connect(_buy_drill)
	buy_magnet_button = _ui_button(shop_panel, "UPGRADE MAGNET", Vector2(27, 282), Vector2(481, 60), Color("397969"), 22)
	buy_magnet_button.pressed.connect(_buy_magnet)
	var exit := _ui_button(shop_panel, "CLOSE", Vector2(373, 366), Vector2(136, 42), Color("6c4f5b"), 18)
	exit.pressed.connect(_toggle_shop)
	_update_shop()

func _begin_dig() -> void:
	dig_held = true
	_dig()

func _stop_dig() -> void:
	dig_held = false

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			if stick_index == -1 and stick_base.get_global_rect().grow(35).has_point(event.position):
				stick_index = event.index
				stick_center = stick_base.global_position + stick_base.size * 0.5
				_update_stick(event.position)
			elif camera_index == -1 and event.position.x > 420 and event.position.y < 470 and not shop_open:
				camera_index = event.index
				last_camera_pos = event.position
		else:
			if event.index == stick_index:
				stick_index = -1
				input_axis = Vector2.ZERO
				stick_knob.position = Vector2(48, 48)
			if event.index == camera_index:
				camera_index = -1
	elif event is InputEventScreenDrag:
		if event.index == stick_index:
			_update_stick(event.position)
		elif event.index == camera_index:
			view_yaw -= (event.position.x - last_camera_pos.x) * 0.005
			last_camera_pos = event.position
	elif event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		view_yaw -= event.relative.x * 0.005
	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_E:
			_collect_nearby()
		elif event.keycode == KEY_F:
			_sell_ores()
		elif event.keycode == KEY_B:
			_toggle_shop()
		elif event.keycode == KEY_G:
			_perform_scan()
		elif event.keycode == KEY_P:
			_toggle_eco_mode()
		elif event.keycode == KEY_ESCAPE and shop_open:
			_toggle_shop()

func _update_stick(where: Vector2) -> void:
	var displacement: Vector2 = (where - stick_center).limit_length(59.0)
	input_axis = displacement / 59.0
	stick_knob.position = Vector2(48, 48) + displacement

func _process(delta: float) -> void:
	var keys := Vector2.ZERO
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		keys.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		keys.y += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		keys.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		keys.x += 1.0
	var axis := (input_axis + keys).limit_length(1.0)
	if shop_open:
		axis = Vector2.ZERO
	var forward := Vector3(-sin(view_yaw), 0, -cos(view_yaw))
	var right := Vector3(cos(view_yaw), 0, -sin(view_yaw))
	var move_direction := (right * axis.x - forward * axis.y).normalized()
	var speed: float = 4.1
	if Input.is_key_pressed(KEY_SHIFT):
		speed = 5.9
	if move_direction.length() > 0.02:
		player.position.x = clampf(player.position.x + move_direction.x * speed * delta, -14.0, 14.0)
		player.position.z = clampf(player.position.z + move_direction.z * speed * delta, -14.0, 14.0)
		player.rotation.y = lerp_angle(player.rotation.y, atan2(-move_direction.x, -move_direction.z), minf(1.0, delta * 11.0))
		walking_time += delta * 11.0
		footstep_timer += delta
		if footstep_timer > 0.41:
			footstep_timer = 0.0
			_play("footstep")
	else:
		walking_time = 0.0
		footstep_timer = 0.0
	player.position.y = lerpf(player.position.y, _ground_height(player.position.x, player.position.z), minf(1.0, delta * 10.0))
	avatar.position.y = abs(sin(walking_time)) * 0.08 if move_direction.length() > 0.02 else 0.0
	arm_left.rotation.x = sin(walking_time) * 0.28
	arm_right.rotation.x = -sin(walking_time) * 0.20
	dig_cooldown = maxf(0.0, dig_cooldown - delta)
	if (dig_held or Input.is_key_pressed(KEY_SPACE)) and dig_cooldown <= 0.0 and not shop_open:
		_dig()
	dig_anim = maxf(0.0, dig_anim - delta * 2.6)
	shovel.rotation.x = -0.75 + sin((1.0 - dig_anim) * PI) * 1.5 if dig_anim > 0.0 else -0.75
	_follow_camera(minf(1.0, delta * 5.5))
	_update_pickups(delta)
	_update_scanner(delta)
	if notification_time > 0.0:
		notification_time -= delta
		if notification_time <= 0.0:
			notify_label.text = ""
	save_timer += delta
	if save_timer > 40.0:
		save_timer = 0.0
		_save_game()
	_update_hud()

func _dig() -> void:
	if shop_open or dig_cooldown > 0.0:
		return
	var back := Vector3(sin(player.rotation.y), 0, cos(player.rotation.y))
	var target: Vector3 = player.position - back * 1.45
	if target.x < -14.4 or target.x > 14.4 or target.z < -14.4 or target.z > 14.4:
		_notice("MOVE INSIDE THE MINE TO DIG")
		return
	if Vector2(target.x - SHOP_SPOT.x, target.z - SHOP_SPOT.z).length() < 4.2:
		_notice("CAMP GROUND IS PROTECTED. DIG OUTSIDE.")
		return
	if _bag_count() >= BAG_MAX:
		_notice("BAG FULL! SELL ORE AT MINER'S CAMP.")
		return
	var gx: int = clampi(int(round((target.x + HALF) / STEP)), 2, GRID - 3)
	var gz: int = clampi(int(round((target.z + HALF) / STEP)), 2, GRID - 3)
	var depth_before: float = _height_at_grid(gx, gz)
	if depth_before < -3.2:
		_notice("SOLID BEDROCK! TRY A NEW SPOT.")
		return
	var strength: float = 0.29 + float(shovel_level - 1) * 0.10 + float(drill_level) * 0.13
	for z in range(maxi(0, gz - 4), mini(GRID, gz + 5)):
		for x in range(maxi(0, gx - 4), mini(GRID, gx + 5)):
			var dx: float = float(x - gx) * STEP
			var dz: float = float(z - gz) * STEP
			var d: float = sqrt(dx * dx + dz * dz)
			if d < 1.85:
				var falloff: float = pow(1.0 - d / 1.85, 1.5)
				var index: int = z * GRID + x
				heights[index] = maxf(-3.35, heights[index] - strength * falloff)
	_redraw_terrain()
	total_digs += 1
	dig_cooldown = maxf(0.30, 0.64 - float(drill_level) * 0.10)
	dig_anim = 1.0
	_play("dig")
	if not eco_mode:
		dust_particles.position = Vector3(target.x, _ground_height(target.x, target.z) + 0.13, target.z)
		dust_particles.restart()
	if OS.get_name() == "Android":
		Input.vibrate_handheld(30)
	contract_progress += 1
	if contract_progress >= _contract_goal():
		contract_progress = 0
		contracts_completed += 1
		var bonus: int = 65 + contracts_completed * 25
		coins += bonus
		_play("contract")
		_notice("CONTRACT COMPLETE! +%d BONUS COINS" % bonus)
	var depth: float = maxf(0.0, -_height_at_grid(gx, gz))
	var richness: float = _ore_richness(target.x, target.z, depth)
	var chance: float = clampf(0.28 + richness * 0.65 + 0.07 * float(drill_level), 0.25, 0.94)
	if rng.randf() < chance:
		var luck: float = rng.randf() * (0.78 + richness * 0.35) + depth * 0.065 + float(shovel_level - 1) * 0.018
		var ore_type: int = 0
		if luck > 1.11:
			ore_type = 4
		elif luck > 0.97:
			ore_type = 3
		elif luck > 0.80:
			ore_type = 2
		elif luck > 0.49:
			ore_type = 1
		_spawn_pickup(Vector3(target.x, _ground_height(target.x, target.z) + 0.38, target.z), ore_type)
		if ore_type >= 2:
			_notice("YOU FOUND %s! PICK IT UP!" % ORE_NAMES[ore_type])
	else:
		_notice("KEEP DIGGING. THERE'S MORE BELOW!")

func _spawn_pickup(where: Vector3, ore_type: int) -> void:
	var pickup := Node3D.new()
	pickup.name = "FIND_%s" % ORE_NAMES[ore_type]
	pickup.position = where
	add_child(pickup)
	_ball(pickup, Vector3.ZERO, Vector3(0.28, 0.28, 0.28), ORE_COLORS[ore_type], ore_type >= 2)
	if ore_type > 1:
		_cylinder(pickup, Vector3(0, 0.25, 0), 0.20, 0.02, 0.45, ORE_COLORS[ore_type], true)
	pickups.append({"node": pickup, "kind": ore_type, "time": 0.0, "origin": where})

func _update_pickups(delta: float) -> void:
	for i in range(pickups.size() - 1, -1, -1):
		var pickup: Dictionary = pickups[i]
		var node: Node3D = pickup["node"]
		pickup["time"] = float(pickup["time"]) + delta
		node.position.y = (pickup["origin"] as Vector3).y + 0.15 * sin(float(pickup["time"]) * 4.0)
		node.rotation.y += delta * 1.3
		var distance: float = Vector2(node.position.x - player.position.x, node.position.z - player.position.z).length()
		if distance < 0.8 + float(magnet_level) * 0.6 and _bag_count() < BAG_MAX:
			_take_pickup(i)

func _take_pickup(index: int) -> void:
	var item: Dictionary = pickups[index]
	var kind: int = int(item["kind"])
	ores[kind] += 1
	(item["node"] as Node3D).queue_free()
	pickups.remove_at(index)
	_play("pickup")
	_notice("+1 %s    /    BAG %d / %d" % [ORE_NAMES[kind], _bag_count(), BAG_MAX])

func _collect_nearby() -> void:
	if _bag_count() >= BAG_MAX:
		_notice("BAG FULL. SELL ORE AT CAMP.")
		return
	for i in range(pickups.size() - 1, -1, -1):
		var node: Node3D = pickups[i]["node"]
		if Vector2(node.position.x - player.position.x, node.position.z - player.position.z).length() < 2.35 + float(magnet_level) * 0.35:
			_take_pickup(i)
			return
	_notice("MOVE CLOSER TO A MINERAL TO PICK IT UP.")

func _bag_count() -> int:
	var count: int = 0
	for amount in ores:
		count += amount
	return count

func _near_camp() -> bool:
	return Vector2(player.position.x - SHOP_SPOT.x, player.position.z - SHOP_SPOT.z).length() < 5.1

func _sell_ores() -> void:
	if not _near_camp():
		_notice("RETURN TO MINER'S CAMP TO SELL.")
		return
	var earned: int = 0
	for i in range(ores.size()):
		earned += ores[i] * ORE_PRICES[i]
		ores[i] = 0
	if earned == 0:
		_notice("YOUR BAG IS EMPTY. MINE SOME ORE FIRST.")
		return
	coins += earned
	_play("sale")
	_notice("ORE SOLD! +%d COINS" % earned)
	_save_game()

func _toggle_shop() -> void:
	if not shop_open and not _near_camp():
		_notice("VISIT MINER'S CAMP TO OPEN THE SHOP.")
		return
	shop_open = not shop_open
	shop_panel.visible = shop_open
	dig_held = false
	_update_shop()

func _buy_shovel() -> void:
	if shovel_level >= 5:
		_notice("SHOVEL FULLY UPGRADED!")
		return
	var price: int = 80 * shovel_level * shovel_level
	if coins < price:
		_notice("NOT ENOUGH COINS. YOU NEED %d." % price)
		return
	coins -= price
	shovel_level += 1
	_play("buy")
	_notice("SHOVEL UPGRADED TO LEVEL %d!" % shovel_level)
	_update_shop()
	_save_game()

func _buy_drill() -> void:
	if drill_level >= 3:
		_notice("DRILL FULLY UPGRADED!")
		return
	var price: int = 250 * (drill_level + 1)
	if coins < price:
		_notice("NOT ENOUGH COINS. YOU NEED %d." % price)
		return
	coins -= price
	drill_level += 1
	_play("buy")
	_notice("POWER DRILL LEVEL %d UNLOCKED!" % drill_level)
	_update_shop()
	_save_game()

func _buy_magnet() -> void:
	if magnet_level >= 3:
		_notice("MAGNET FULLY UPGRADED!")
		return
	var price: int = 120 * (magnet_level + 1)
	if coins < price:
		_notice("NOT ENOUGH COINS. YOU NEED %d." % price)
		return
	coins -= price
	magnet_level += 1
	_play("buy")
	_notice("ORE MAGNET LEVEL %d UNLOCKED!" % magnet_level)
	_update_shop()
	_save_game()

func _update_shop() -> void:
	if buy_shovel_button == null:
		return
	buy_shovel_button.text = "SHOVEL LV.%d  •  %d COINS" % [shovel_level + 1, 80 * shovel_level * shovel_level] if shovel_level < 5 else "SHOVEL MAX LEVEL"
	buy_drill_button.text = "DRILL LV.%d  •  %d COINS" % [drill_level + 1, 250 * (drill_level + 1)] if drill_level < 3 else "DRILL MAX LEVEL"
	buy_magnet_button.text = "MAGNET LV.%d  •  %d COINS" % [magnet_level + 1, 120 * (magnet_level + 1)] if magnet_level < 3 else "MAGNET MAX LEVEL"

func _update_hud() -> void:
	coins_label.text = "COINS    %d" % coins
	bag_label.text = "BAG    %d / %d" % [_bag_count(), BAG_MAX]
	tool_label.text = "SHOVEL  LV.%d    |    DIGS  %d" % [shovel_level, total_digs]
	depth_label.text = "DEPTH   %.1f M" % maxf(0.0, -_ground_height(player.position.x, player.position.z))
	contracts_label.text = "CONTRACT %d   %d / %d DIGS" % [contracts_completed + 1, contract_progress, _contract_goal()]
	scan_button.text = "GEO SCAN" if scan_cooldown <= 0.0 else "SCAN %d S" % int(ceil(scan_cooldown))
	scan_button.disabled = scan_cooldown > 0.0 or shop_open
	if _near_camp():
		objective_label.text = "MINER'S CAMP"
		vendor_hint.text = "SELL ORE  /  SHOP  /  UPGRADE"
	else:
		objective_label.text = "EXPLORE THE VALLEY"
		vendor_hint.text = ""
	sell_button.disabled = not _near_camp()
	shop_button.disabled = not _near_camp() and not shop_open

func _notice(message: String) -> void:
	if notify_label == null:
		return
	notify_label.text = message
	notification_time = 3.0

func _save_game() -> void:
	var save: Dictionary = {
		"version": 2,
		"coins": coins,
		"contracts_completed": contracts_completed,
		"contract_progress": contract_progress,
		"eco_mode": eco_mode,
		"shovel_level": shovel_level,
		"drill_level": drill_level,
		"magnet_level": magnet_level,
		"ore": ores,
		"total_digs": total_digs,
		"player_position": [player.position.x, player.position.z],
		"heightmap": Array(heights)
	}
	var file := FileAccess.open(SAVE_FILE, FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify(save))
		file.close()

func _load_game() -> void:
	if not FileAccess.file_exists(SAVE_FILE):
		return
	var file := FileAccess.open(SAVE_FILE, FileAccess.READ)
	if file == null:
		return
	var data = JSON.parse_string(file.get_as_text())
	file.close()
	if typeof(data) != TYPE_DICTIONARY or int(data.get("version", 0)) not in [1, 2]:
		return
	coins = maxi(0, int(data.get("coins", 50)))
	contracts_completed = maxi(0, int(data.get("contracts_completed", 0)))
	contract_progress = clampi(int(data.get("contract_progress", 0)), 0, _contract_goal() - 1)
	eco_mode = bool(data.get("eco_mode", false))
	_apply_eco_mode()
	shovel_level = clampi(int(data.get("shovel_level", 1)), 1, 5)
	drill_level = clampi(int(data.get("drill_level", 0)), 0, 3)
	magnet_level = clampi(int(data.get("magnet_level", 0)), 0, 3)
	total_digs = maxi(0, int(data.get("total_digs", 0)))
	var saved_ore: Array = data.get("ore", [])
	if saved_ore.size() == ORE_NAMES.size():
		for i in range(ores.size()):
			ores[i] = clampi(int(saved_ore[i]), 0, BAG_MAX)
	var saved_h: Array = data.get("heightmap", [])
	if saved_h.size() == GRID * GRID:
		for i in range(heights.size()):
			heights[i] = clampf(float(saved_h[i]), -3.35, 2.0)
	var coords: Array = data.get("player_position", [])
	if coords.size() == 2:
		player.position.x = clampf(float(coords[0]), -14.0, 14.0)
		player.position.z = clampf(float(coords[1]), -14.0, 14.0)
		player.position.y = _ground_height(player.position.x, player.position.z)
	_update_shop()

func _contract_goal() -> int:
	return mini(32, 12 + contracts_completed * 3)

func _perform_scan() -> void:
	if scan_cooldown > 0.0 or shop_open:
		return
	scan_cooldown = 14.0
	scan_reveal_time = 8.0
	scanner_pulse = 0.0
	scan_ring.visible = not eco_mode
	scan_ring.position = player.position + Vector3(0, 0.24, 0)
	scan_quality = int(round(_ore_richness(player.position.x, player.position.z, 0.8) * 100.0))
	_play("scan")
	_notice("GEO SCAN: LOCAL MINERAL YIELD %d%%" % scan_quality)
	if OS.get_name() == "Android":
		Input.vibrate_handheld(75)

func _update_scanner(delta: float) -> void:
	scan_cooldown = maxf(0.0, scan_cooldown - delta)
	scan_reveal_time = maxf(0.0, scan_reveal_time - delta)
	if scanner_pulse >= 0.0:
		scanner_pulse += delta * 0.45
		if scanner_pulse >= 1.0:
			scanner_pulse = -1.0
			scan_ring.visible = false
		else:
			scan_ring.scale = Vector3.ONE * (0.2 + scanner_pulse * 12.0)
			scan_ring_material.albedo_color = Color(0.30, 0.89, 0.91, 0.72 * (1.0 - scanner_pulse))
	if scan_reveal_time > 0.0:
		scanner_label.text = "MINERAL YIELD: %d%%  |  SCAN ACTIVE" % scan_quality
	else:
		scanner_label.text = "GEOSCAN READY" if scan_cooldown <= 0.0 else "GEOSCAN RECHARGING"
	if mini_map != null:
		mini_map.queue_redraw()
	# Solar cycle has subtle light shifts, capped for a readable mobile scene.
	time_of_day = fmod(time_of_day + delta / 480.0, 1.0)
	var warmth: float = 0.65 + 0.35 * sin(time_of_day * TAU)	sunlight.light_energy = 1.20 + warmth * 0.6

func _toggle_eco_mode() -> void:
	eco_mode = not eco_mode
	_apply_eco_mode()
	_notice("BATTERY SAVER ENABLED" if eco_mode else "HIGH QUALITY ENABLED")
	_save_game()

func _apply_eco_mode() -> void:
	if sunlight != null:
		sunlight.shadow_enabled = not eco_mode
	if dust_particles != null and eco_mode:
		dust_particles.emitting = false
	if scan_ring != null and eco_mode:
		scan_ring.visible = false
	Engine.max_fps = 30 if eco_mode else 60
	if eco_button != null:
		eco_button.text = "ECO: ON  30 FPS" if eco_mode else "ECO: OFF  60 FPS"

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_PAUSED:
		_save_game()

func _exit_tree() -> void:
	if player != null and heights.size() == GRID * GRID:
		_save_game()