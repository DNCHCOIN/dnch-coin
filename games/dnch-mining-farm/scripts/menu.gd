extends Node3D

# DNCH Mining Farm: contemporary industrial show floor, not a retro drawn UI.
const ART = preload("res://scripts/art.gd")
var safe_mode: bool = true
var help_visible: bool = false
var start_button: Button
var graphics_button: Button
var help_window: PanelContainer
var status: Label
var camera: Camera3D
var ui: Control
var elapsed: float = 0.0
var fans: Array = []

const WHITE = Color("f5f4ef")
const SECONDARY = Color("a5b3b8")
const AMBER = Color("f0b46c")
const GREEN = Color("98c8b1")
const SURFACE = Color("131d25")

func _ready() -> void:
	Input.set_emulate_mouse_from_touch(true)
	ART.apply_scene_lighting(self)
	ART.create_room(self, 2)
	_build_showroom()
	_build_camera()
	_build_interface()
	fans = get_tree().get_nodes_in_group("spin_fan")
	Engine.max_fps = 30
	set_process(true)

func _build_showroom() -> void:
	var show = Node3D.new()
	show.name = "Hardware Showroom"
	add_child(show)
	for spec in [
		["gpu_3", Vector3(1.0, 0.0, -3.8), 0.25],
		["gpu_2", Vector3(4.0, 0.0, -3.8), 0.25],
		["asic_2", Vector3(7.0, 0.0, -3.8), 0.25],
		["rack", Vector3(3.5, 0.0, 0.3), -0.18],
		["fan", Vector3(7.8, 0.0, 0.5), -0.3],
		["asic_1", Vector3(1.0, 0.0, 3.6), 0.25],
		["cooler", Vector3(7.6, 0.0, 3.5), -0.2]
	]:
		var machine: Node3D = ART.machine(str(spec[0]))
		machine.position = spec[1]
		machine.rotation.y = float(spec[2])
		show.add_child(machine)
	var key = OmniLight3D.new()
	key.name = "Warm Area Light"
	key.position = Vector3(4.5, 5.2, 3.0)
	key.light_color = Color("f1c49a")
	key.light_energy = 1.6
	key.omni_range = 14.0
	add_child(key)

func _build_camera() -> void:
	camera = Camera3D.new()
	camera.name = "Cinematic Showroom Camera"
	camera.current = true
	camera.fov = 54.0
	camera.near = 0.1
	camera.far = 80.0
	camera.position = Vector3(15.6, 11.5, 17.8)
	camera.look_at(Vector3(2.3, 1.35, -0.9))
	add_child(camera)

func _style(color: Color, outline: Color, corner: int = 14) -> StyleBoxFlat:
	var box = StyleBoxFlat.new()
	box.bg_color = color
	box.border_color = outline
	box.set_border_width_all(1)
	box.set_corner_radius_all(corner)
	box.content_margin_left = 14
	box.content_margin_right = 14
	box.content_margin_top = 10
	box.content_margin_bottom = 10
	return box

func _text(value: String, x: float, y: float, w: float, h: float, size: int, tint: Color, parent: Control = null) -> Label:
	var label = Label.new()
	label.text = value
	label.position = Vector2(x,y)
	label.size = Vector2(w,h)
	label.add_theme_font_size_override("font_size",size)
	label.add_theme_color_override("font_color",tint)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	(parent if parent != null else ui).add_child(label)
	return label

func _button(value: String, x: float, y: float, w: float, h: float, callback: Callable, primary: bool = false, parent: Control = null) -> Button:
	var b = Button.new()
	b.text = value
	b.position = Vector2(x,y)
	b.size = Vector2(w,h)
	b.focus_mode = Control.FOCUS_NONE
	b.mouse_filter = Control.MOUSE_FILTER_STOP
	b.add_theme_font_size_override("font_size",21 if primary else 18)
	b.add_theme_color_override("font_color",Color("17252d") if primary else WHITE)
	b.add_theme_stylebox_override("normal",_style(AMBER if primary else Color("202e38"), AMBER if primary else Color("405560"),12))
	b.add_theme_stylebox_override("hover",_style(Color("ffe0a8") if primary else Color("30434d"),WHITE if primary else Color("7998a8"),12))
	b.add_theme_stylebox_override("pressed",_style(Color("e4a45b") if primary else Color("1b2730"),AMBER,12))
	b.pressed.connect(callback)
	(parent if parent != null else ui).add_child(b)
	return b

func _build_interface() -> void:
	var overlay = CanvasLayer.new()
	overlay.name = "Interface"
	add_child(overlay)
	ui = Control.new()
	ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.add_child(ui)

	var left = ColorRect.new()
	left.position=Vector2(0,0)
	left.size=Vector2(556,720)
	left.color=Color(0.046,0.075,0.091,0.97)
	left.mouse_filter=Control.MOUSE_FILTER_IGNORE
	ui.add_child(left)

	var accent = ColorRect.new()
	accent.position=Vector2(55,95)
	accent.size=Vector2(56,4)
	accent.color=AMBER
	accent.mouse_filter=Control.MOUSE_FILTER_IGNORE
	ui.add_child(accent)

	_text("DNCH    /    GAME STUDIOS",54,45,440,36,18,SECONDARY)
	_text("MINING",52,123,470,97,76,WHITE)
	_text("FARM",52,207,470,93,76,WHITE)
	_text("BUILD YOUR OWN CRYPTO OPERATION",56,312,480,37,21,AMBER)
	var description=_text("Start with one GPU rig. Build an industrial\nmining facility. Control energy, cooling\nand profit.",56,363,460,81,18,SECONDARY)
	description.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART

	var progress_exists = FileAccess.file_exists("user://dnch_mining_farm_v1.json")
	start_button = _button("CONTINUE YOUR FARM     ›" if progress_exists else "START YOUR FARM     ›",55,477,441,67,_start,true)
	_button("HOW TO PLAY",55,561,209,60,_show_help)
	graphics_button = _button("30 FPS  ·  BATTERY",280,561,216,60,_toggle_quality)
	status=_text("YOUR FACILITY. YOUR DECISIONS.",57,660,466,35,15,GREEN)

	var preview = PanelContainer.new()
	preview.position=Vector2(803,624)
	preview.size=Vector2(453,67)
	preview.add_theme_stylebox_override("panel",_style(Color(0.051,0.086,0.105,0.90),Color(0.22,0.31,0.35,0.66),14))
	preview.mouse_filter=Control.MOUSE_FILTER_IGNORE
	ui.add_child(preview)
	_text("LIVE 3D FACILITY",20,7,410,25,18,WHITE,preview)
	_text("GPU RIGS   /   ASIC   /   POWER   /   COOLING",20,31,425,24,15,SECONDARY,preview)

	help_window = PanelContainer.new()
	help_window.position=Vector2(590,129)
	help_window.size=Vector2(617,461)
	help_window.add_theme_stylebox_override("panel",_style(Color("16232b"),Color("607b87"),16))
	help_window.mouse_filter=Control.MOUSE_FILTER_STOP
	ui.add_child(help_window)
	_text("HOW TO PLAY",22,16,560,42,31,WHITE,help_window)
	var guide = _text("1    CHOOSE a mining rig from Equipment Market.\n\n2    TAP a free floor slot to install it.\n\n3    MINE DNCH and SELL it for cash.\n\n4    UPGRADE the power grid and cooling.\n\n5    EXPAND your facility and unlock ASIC rigs.\n\n6    COMPLETE contracts and grow your empire.",22,79,565,304,19,SECONDARY,help_window)
	guide.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	_button("CLOSE",21,388,563,52,_show_help,true,help_window)
	help_window.visible=false

func _start() -> void:
	start_button.disabled=true
	status.text="OPENING YOUR FARM..."
	Engine.max_fps=30 if safe_mode else 60
	get_tree().root.set_meta("safe_mode",safe_mode)
	var error = get_tree().change_scene_to_file("res://main.tscn")
	if error != OK:
		status.text="UNABLE TO START  /  ERROR %d" % error
		start_button.disabled=false

func _toggle_quality() -> void:
	safe_mode = not safe_mode
	graphics_button.text = "30 FPS  ·  BATTERY" if safe_mode else "60 FPS  ·  SMOOTH"
	status.text = "PERFORMANCE: BATTERY SAVER" if safe_mode else "PERFORMANCE: 60 FPS"

func _show_help() -> void:
	help_visible = not help_visible
	help_window.visible=help_visible
	status.text="GAME INSTRUCTIONS" if help_visible else "YOUR FACILITY. YOUR DECISIONS."

func _process(delta: float) -> void:
	elapsed += delta
	if camera!=null:
		camera.position.x=15.6+sin(elapsed*0.22)*0.42
		camera.look_at(Vector3(2.3,1.35,-0.9))
	for fan in fans:
		if is_instance_valid(fan):
			fan.rotation.z += delta * 8.0
