extends RefCounted
class_name FarmArt

# Entire scene is built from original Godot geometry and materials.
# No external models or copyrighted game assets are required.

static func mat(hex: String, metal: float = 0.0, rough: float = 0.55, glow: float = 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(hex)
	m.metallic = metal
	m.roughness = rough
	if glow > 0.0:
		m.emission_enabled = true
		m.emission = Color(hex)
		m.emission_energy_multiplier = glow
	return m

static func block(parent: Node3D, pos: Vector3, size: Vector3, material: Material, tag: String = "") -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.material_override = material
	node.position = pos
	node.name = tag if not tag.is_empty() else "Block"
	parent.add_child(node)
	return node

static func cylinder(parent: Node3D, pos: Vector3, radius: float, height: float, material: Material, sides: int = 16) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = sides
	node.mesh = mesh
	node.material_override = material
	node.position = pos
	parent.add_child(node)
	return node

static func sphere(parent: Node3D, pos: Vector3, radius: float, material: Material) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	mesh.radial_segments = 12
	mesh.rings = 6
	node.mesh = mesh
	node.material_override = material
	node.position = pos
	parent.add_child(node)
	return node

static func sign(parent: Node3D, value: String, pos: Vector3, size: int = 36, color: String = "afdee7") -> Label3D:
	var l := Label3D.new()
	l.text = value
	l.font_size = size
	l.pixel_size = 0.005
	l.modulate = Color(color)
	l.outline_modulate = Color("06151c")
	l.outline_size = 4
	l.position = pos
	parent.add_child(l)
	return l

static func spinning_fan(parent: Node3D, pos: Vector3, radius: float, bright: bool = false) -> Node3D:
	var dark := mat("18252e",0.4)
	var silver := mat("647889",0.8,0.28)
	var accent := mat("37d4e8",0.1,0.45,1.5) if bright else mat("374c5c",0.3)
	var housing := cylinder(parent, pos, radius + 0.07, 0.10, dark, 24)
	housing.rotation.x = PI / 2.0
	var core := Node3D.new()
	core.position = pos + Vector3(0,0,0.075)
	core.add_to_group("spin_fan")
	parent.add_child(core)
	for i in range(5):
		var a := TAU * float(i) / 5.0
		var blade := block(core, Vector3(cos(a) * radius * .42,sin(a) * radius * .42,0), Vector3(radius*.9, radius*.24,.035),silver)
		blade.rotation.z = a + .55
	var hub := cylinder(core,Vector3.ZERO,radius*.23,.12,accent,12)
	hub.rotation.x = PI / 2.0
	return core

static func make_gpu_card(parent: Node3D, p: Vector3, premium: bool = false) -> void:
	var shell := mat("25333d",0.45,.33) if not premium else mat("334958",.7,.22)
	var edge := mat("98aabc",.8,.23) if premium else mat("667788",.7,.3)
	var pcb := mat("15554c",.15,.6)
	block(parent,p,Vector3(.98,.37,.14),shell)
	block(parent,p+Vector3(0,-.15,-.075),Vector3(.95,.045,.17),pcb)
	for j in range(2):
		spinning_fan(parent,p+Vector3(-.24+float(j)*.48,.045,.103),.125,premium)
	block(parent,p+Vector3(0,.17,.02),Vector3(.93,.025,.12),edge)
	block(parent,p+Vector3(.45,-.03,.12),Vector3(.03,.13,.02),mat("39d6e3",0.1,.5,2.6))

static func frame(parent:Node3D, half_width:float, height:float, half_depth:float) -> void:
	var m := mat("7c8c99",.85,.28)
	for x in [-half_width,half_width]:
		for z in [-half_depth,half_depth]:
			block(parent,Vector3(x,height*.5,z),Vector3(.065,height,.065),m)
	for y in [0.10,height]:
		for z in [-half_depth,half_depth]:
			block(parent,Vector3(0,y,z),Vector3(half_width*2,.055,.05),m)
		for x in [-half_width,half_width]:
			block(parent,Vector3(x,y,0),Vector3(.055,.055,half_depth*2),m)

static func machine(kind:String) -> Node3D:
	var root := Node3D.new()
	root.name = "Machine_"+kind
	var rubber := mat("111b23",.08,.8)
	var steel := mat("5b6f81",.8,.32)
	var ink := mat("25343e",.55,.36)
	var blue := mat("39dbe9",.3,.35,1.8)
	var amber := mat("ffbb59",.1,.45,1.7)
	match kind:
		"gpu_1","gpu_2","gpu_3":
			var count := 3 if kind == "gpu_1" else (4 if kind=="gpu_2" else 6)
			frame(root,1.07,1.15,.56)
			block(root,Vector3(0,.11,0),Vector3(1.95,.09,.90),rubber)
			block(root,Vector3(-.58,.24,-.12),Vector3(.56,.22,.55),steel)
			block(root,Vector3(.25,.22,-.12),Vector3(.67,.055,.52),mat("15594e",.18))
			for i in range(count):
				var x := -0.73 + float(i) * (1.46 / float(max(count-1,1)))
				var g := Node3D.new()
				root.add_child(g)
				g.position = Vector3(x,.69,.0)
				g.rotation.y = PI/2.0
				make_gpu_card(g,Vector3.ZERO,kind != "gpu_1")
			for i in range(3):
				block(root,Vector3(-.6+float(i)*.55,.09,.42),Vector3(.11,.02,.04),amber)
			sign(root,"GPU / "+str(count)+" CARDS",Vector3(0,1.33,.0),25)
		"asic_1","asic_2":
			var pro := kind=="asic_2"
			var case := mat("4a5b68",.8,.3) if not pro else mat("192d37",.75,.25)
			block(root,Vector3(0,.65,0),Vector3(1.75,1.06,1.16),case)
			for i in range(3):
				block(root,Vector3(-.56+float(i)*.56,1.18,0),Vector3(.055,.045,1.03),steel)
			for side in [-1,1]:
				block(root,Vector3(side*.88,.65,0),Vector3(.035,.91,1.08),steel)
			for i in range(2):
				spinning_fan(root,Vector3(-.42+float(i)*.84,.69,.61),.29,pro)
			block(root,Vector3(0,.20,.60),Vector3(1.50,.07,.06),rubber)
			for i in range(4):
				block(root,Vector3(-.53+float(i)*.34,1.07,.59),Vector3(.09,.035,.02),blue)
			sign(root,"ASIC  /  "+("X-CORE" if pro else "S-100"),Vector3(0,1.47,0),26)
		"fan":
			block(root,Vector3(0,.13,0),Vector3(1.75,.2,.92),rubber)
			block(root,Vector3(0,.87,-.26),Vector3(.17,1.45,.2),steel)
			spinning_fan(root,Vector3(0,1.42,-.14),.70,true)
			for k in range(4):
				var bar := block(root,Vector3(0,1.42,-.015),Vector3(.06,1.49,.06),steel)
				bar.rotation.z = float(k)*PI/4.0
			block(root,Vector3(0,.12,.43),Vector3(.9,.07,.04),blue)
		"cooler":
			block(root,Vector3(0,.94,0),Vector3(1.84,1.75,1.10),mat("c0d0d7",.65,.27))
			block(root,Vector3(0,1.62,.57),Vector3(1.59,.24,.05),mat("273d49",.2))
			for i in range(8):
				block(root,Vector3(-.70+float(i)*.20,.96,.58),Vector3(.065,.81,.04),mat("405b68",.5))
			block(root,Vector3(.61,1.61,.61),Vector3(.17,.065,.01),blue)
			block(root,Vector3(0,.15,.62),Vector3(1.48,.05,.04),mat("35cfe1",.15,.6,1.8))
			sign(root,"HVAC",Vector3(0,2.08,0),27)
		"solar":
			for i in range(2):
				block(root,Vector3(-.68+float(i)*1.36,.29,0),Vector3(.08,.52,.08),steel)
			var solar_panel := block(root,Vector3(0,.72,0),Vector3(2.18,.07,1.44),mat("143859",.6,.18))
			solar_panel.rotation.x = -.25
			for i in range(5):
				block(root,Vector3(-.86+float(i)*.43,.75,-.05),Vector3(.016,.01,1.22),mat("6296b5",.7))
			for j in range(3):
				block(root,Vector3(0,.75,-.51+float(j)*.51),Vector3(2.04,.01,.015),mat("6296b5",.7))
			sign(root,"SOLAR ARRAY",Vector3(0,1.53,0),26)
		"battery":
			block(root,Vector3(0,.78,0),Vector3(1.54,1.50,1.01),mat("384b56",.72,.31))
			for i in range(3):
				block(root,Vector3(-.45+float(i)*.45,.78,.51),Vector3(.28,1.18,.03),mat("18262f",.25))
				block(root,Vector3(-.45+float(i)*.45,.45,.535),Vector3(.18,.045,.02),blue)
			sign(root,"POWER BANK",Vector3(0,1.76,0),26)
		"rack":
			frame(root,1.04,2.5,.61)
			for tier in range(3):
				block(root,Vector3(0,.34+float(tier)*.72,0),Vector3(1.98,.07,1.16),steel)
				for col in range(2):
					var m := block(root,Vector3(-.49+float(col)*.98,.61+float(tier)*.72,0),Vector3(.89,.39,.91),ink)
					spinning_fan(root,Vector3(-.49+float(col)*.98,.62+float(tier)*.72,.48),.15,true)
			sign(root,"SERVER RACK",Vector3(0,2.75,0),26)
		_:
			block(root,Vector3(0,.5,0),Vector3(1,1,1),steel)
	return root

static func create_room(parent:Node3D,tier:int) -> Node3D:
	var root := Node3D.new()
	root.name="Facility"
	parent.add_child(root)
	var concrete := mat("d0dee2",.18,.85)
	concrete.albedo_texture = load("res://art/concrete.png")
	concrete.uv1_scale = Vector3(7,5,1)
	var walkway := mat("1c303a",.35,.5)
	var steel := mat("9ab0b9",.73,.3)
	steel.albedo_texture = load("res://art/steel.png")
	steel.uv1_scale = Vector3(1,3,1)
	var wall := mat("8daabb",.08,.83)
	wall.albedo_texture = load("res://art/wall.png")
	wall.uv1_scale = Vector3(8,3,1)
	var trim := mat("162c38",.44,.48)
	var glow := mat("31d1e7",.22,.35,2.0)
	var gold := mat("f4aa4d",.25,.42,1.0)
	var danger := mat("d6a44e",.16,.59)
	var floor := block(root,Vector3(0,-.23,0),Vector3(23.5,.45,17.5),concrete)
	block(root,Vector3(0,-.015,0),Vector3(21.3,.045,15.0),walkway)
	for i in range(17):
		block(root,Vector3(-10.0+float(i)*1.25,.014,-7.25),Vector3(.055,.012,14.45),trim)
	for i in range(12):
		block(root,Vector3(0,.016,-6.9+float(i)*1.25),Vector3(21.1,.012,.04),trim)
	# Back wall and left wall keep the isometric scene visually open.
	block(root,Vector3(0,3.4,-8.0),Vector3(23.5,7.2,.42),wall)
	block(root,Vector3(-11.5,3.4,-.2),Vector3(.42,7.2,17),wall)
	for x in [-10.8,10.8]:
		block(root,Vector3(x,3.2,-7.70),Vector3(.19,6.25,.25),steel)
	for x in [-7.8,-2.6,2.6,7.8]:
		block(root,Vector3(x,5.7,-7.72),Vector3(.18,.17,.28),steel)
		block(root,Vector3(x,4.3,-7.68),Vector3(.04,2.3,.1),trim)
		for j in range(3):
			block(root,Vector3(x,2.8+float(j)*.84,-7.47),Vector3(.12,.035,.03),glow)
	for x in [-7.9,0.0,7.9]:
		block(root,Vector3(x,6.55,-5.2),Vector3(.55,.19,3.9),steel)
		block(root,Vector3(x,6.37,-4.1),Vector3(2.2,.07,1.2),mat("b7d5df",.2,.45,1.25))
	for z in [-5.0,0.0,5.0]:
		block(root,Vector3(-11.14,5.3,z),Vector3(.15,.12,1.4),glow)
	# Power lines, warning stripes and floor markings.
	for i in range(12):
		var stripe := block(root,Vector3(-10.8+float(i)*1.9,.042,7.0),Vector3(.86,.025,.12),danger)
		stripe.rotation.y=.52
	for x in [-8.7,8.7]:
		for z in [-5.0,0,5]:
			block(root,Vector3(x,.045,z),Vector3(.07,.025,2.2),gold)
	block(root,Vector3(0,6.75,-7.47),Vector3(7.7,1.04,.16),trim)
	sign(root,"DNCH    /    MINING OPERATIONS",Vector3(0,6.70,-7.27),56,"55ebfc")
	sign(root,["GARAGE  //  STARTUP","WORKSHOP  //  EXPANSION","INDUSTRIAL DATA CENTER"][clampi(tier,0,2)],Vector3(0,5.64,-7.25),26,"eab565")
	# Tinted industrial windows; no transparency sorting on Android.
	var glass:=mat("214d63",.43,.22)
	for i in range(4):
		var x := -7.8+float(i)*5.15
		block(root,Vector3(x,3.1,-7.74),Vector3(2.7,1.38,.06),glass)
		block(root,Vector3(x,3.1,-7.69),Vector3(.055,1.45,.07),steel)
		block(root,Vector3(x,3.1,-7.69),Vector3(2.8,.055,.07),steel)
	# Side pipework.
	for j in range(2):
		block(root,Vector3(-11.1,4.3+float(j)*.37,0),Vector3(.14,.13,14.0),steel)
	for i in range(7):
		block(root,Vector3(-10.9,.2,-6.5+float(i)*2.0),Vector3(.20,.25,.9),trim)
	# Control area equipment, signboards, wall monitors.
	block(root,Vector3(8.6,.75,-6.63),Vector3(3.0,1.55,.86),trim)
	for i in range(2):
		block(root,Vector3(7.9+float(i)*1.4,2.14,-7.50),Vector3(1.18,.81,.11),mat("102f41",.2,.27))
		block(root,Vector3(7.9+float(i)*1.4,2.18,-7.42),Vector3(.88,.095,.02),glow)
	sign(root,"SYSTEMS ONLINE",Vector3(8.55,3.12,-7.36),23,"91dfb6")
	for i in range(5):
		block(root,Vector3(-9.9+float(i)*.31,.08,-6.96),Vector3(.21,.06,.28),danger)
	# Facade adds visibly more architecture per expansion.
	if tier >= 1:
		for x in [-6.0,0.0,6.0]:
			block(root,Vector3(x,4.7,7.2),Vector3(.22,4.4,.24),steel)
		for i in range(4):
			block(root,Vector3(-7.6+float(i)*5.0,6.80,0),Vector3(.20,.16,15.6),steel)
	if tier >= 2:
		for x in [-7.0,0,7.0]:
			block(root,Vector3(x,5.4,7.0),Vector3(.6,.26,1.4),mat("93b5bb",.5,.28,1.1))
	# Exterior silhouettes at far horizon
	for j in range(12):
		var x := -15.0+float(j)*2.7
		var h := 2.0 + float((j*7)%5)
		block(root,Vector3(x,h*.5,-11.0),Vector3(1.8,h,2),mat("1c323e",.24,.69))
	return root

static func apply_scene_lighting(parent:Node3D) -> void:
	var env := WorldEnvironment.new()
	env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_COLOR
	env.environment.background_color = Color("0a1b28")
	env.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.environment.ambient_light_color = Color("b2d2ef")
	env.environment.ambient_light_energy = .48
	env.environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	parent.add_child(env)
	var daylight := DirectionalLight3D.new()
	daylight.rotation_degrees=Vector3(-55,-35,-12)
	daylight.light_color=Color("bcd8ff")
	daylight.light_energy=1.15
	daylight.shadow_enabled=false
	parent.add_child(daylight)
	var warm := OmniLight3D.new()
	warm.position=Vector3(4.5,6.1,1)
	warm.light_color=Color("ffbd85")
	warm.light_energy=1.15
	warm.omni_range=14.0
	warm.shadow_enabled=false
	parent.add_child(warm)
	var cyan := OmniLight3D.new()
	cyan.position=Vector3(-5,5.7,-3)
	cyan.light_color=Color("68dce9")
	cyan.light_energy=1.0
	cyan.omni_range=12.0
	cyan.shadow_enabled=false
	parent.add_child(cyan)

static func add_tile_highlight(parent:Node3D,pos:Vector3,good:bool) -> MeshInstance3D:
	var m:=mat("21d9bf",.05,.7,1.8) if good else mat("ff745f",.05,.7,2.0)
	var n:=block(parent,pos,Vector3(2.35,.035,2.35),m)
	return n
