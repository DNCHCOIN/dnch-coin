extends Node3D
# Actual 3D facility behind a portrait Android title screen.
const ART=preload("res://scripts/art.gd")
const DETAIL=preload("res://scripts/facility_detail.gd")

var safe_mode:bool=true
var help_visible:bool=false
var start_button:Button
var quality_button:Button
var help_window:Panel
var status:Label
var camera:Camera3D
var ui:Control
var elapsed:float=0.0
var fans:Array=[]

const WHITE=Color("f3f6f5")
const SECONDARY=Color("afc5ce")
const AMBER=Color("ffc171")
const DEEP=Color("101923")
const GREEN=Color("66e0b1")

func _ready()->void:
	Input.set_emulate_mouse_from_touch(true)
	ART.apply_scene_lighting(self)
	ART.create_room(self,3)
	DETAIL.palette(self,3,true)
	_build_hardware()
	_create_camera()
	_create_interface()
	fans=get_tree().get_nodes_in_group("spin_fan")
	Engine.max_fps=30

func _build_hardware()->void:
	var machines=Node3D.new()
	machines.name="Facility Showcase"
	add_child(machines)
	for spec in [
		["gpu_3",Vector3(-5.1,0,-3.5)],
		["asic_2",Vector3(-1.5,0,-3.6)],
		["rack",Vector3(2.1,0,-3.6)],
		["gpu_3",Vector3(5.6,0,-3.5)],
		["asic_2",Vector3(-5.1,0,.4)],
		["gpu_3",Vector3(-1.5,0,.4)],
		["rack",Vector3(2.1,0,.4)],
		["cooler",Vector3(5.6,0,.4)],
		["asic_1",Vector3(-4.1,0,4.5)],
		["gpu_2",Vector3(.1,0,4.5)],
		["fan",Vector3(4.5,0,4.5)]
	]:
		var machine:Node3D=ART.machine(str(spec[0]))
		machine.position=spec[1]
		machines.add_child(machine)
	var light=OmniLight3D.new()
	light.position=Vector3(-3.0,5.0,3.0)
	light.light_color=Color("ffd39b")
	light.light_energy=1.75
	light.omni_range=17.0
	light.shadow_enabled=false
	add_child(light)

func _create_camera()->void:
	camera=Camera3D.new()
	camera.current=true
	camera.fov=59.0
	camera.far=180.0
	camera.position=Vector3(25,21,29)
	add_child(camera)
	camera.look_at(Vector3(0,1.2,1.3))

func _style(bg:Color,stroke:Color=Color("38515d"),radius:int=13)->StyleBoxFlat:
	var s=StyleBoxFlat.new()
	s.bg_color=bg
	s.border_color=stroke
	s.set_border_width_all(1)
	s.set_corner_radius_all(radius)
	s.content_margin_left=12
	s.content_margin_right=12
	s.content_margin_top=9
	s.content_margin_bottom=9
	return s

func _label(value:String,p:Vector2,d:Vector2,font:int,color:Color,parent:Control=null)->Label:
	var l=Label.new()
	l.text=value
	l.position=p
	l.size=d
	l.vertical_alignment=VERTICAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size",font)
	l.add_theme_color_override("font_color",color)
	l.mouse_filter=Control.MOUSE_FILTER_IGNORE
	(parent if parent!=null else ui).add_child(l)
	return l

func _button(value:String,p:Vector2,d:Vector2,callback:Callable,primary:bool=false,parent:Control=null)->Button:
	var b=Button.new()
	b.text=value
	b.position=p
	b.size=d
	b.focus_mode=Control.FOCUS_NONE
	b.add_theme_font_size_override("font_size",25)
	b.add_theme_color_override("font_color",Color("12212a") if primary else WHITE)
	b.add_theme_stylebox_override("normal",_style(AMBER if primary else Color(.07,.12,.16,.94),AMBER if primary else Color("62839a")))
	b.add_theme_stylebox_override("hover",_style(Color("ffe1ac") if primary else Color("25424f"),AMBER))
	b.add_theme_stylebox_override("pressed",_style(Color("df9e51"),AMBER))
	b.pressed.connect(callback)
	(parent if parent!=null else ui).add_child(b)
	return b

func _create_interface()->void:
	var canvas=CanvasLayer.new()
	add_child(canvas)
	ui=Control.new()
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.mouse_filter=Control.MOUSE_FILTER_IGNORE
	canvas.add_child(ui)
	var header=ColorRect.new()
	header.color=Color(.04,.07,.09,.90)
	header.position=Vector2(0,0)
	header.size=Vector2(720,174)
	header.mouse_filter=Control.MOUSE_FILTER_IGNORE
	ui.add_child(header)
	_label("DNCH",Vector2(28,14),Vector2(480,81),76,AMBER)
	_label("MINING FARM",Vector2(33,91),Vector2(541,52),41,WHITE)
	_label("BUILD YOUR HASH EMPIRE",Vector2(36,164),Vector2(520,38),20,SECONDARY)
	var front=Panel.new()
	front.position=Vector2(21,697)
	front.size=Vector2(678,549)
	front.add_theme_stylebox_override("panel",_style(Color(.044,.073,.092,.96),Color("a17b4d"),22))
	front.mouse_filter=Control.MOUSE_FILTER_PASS
	ui.add_child(front)
	var has_save=FileAccess.file_exists("user://dnch_mining_farm_v1.json")
	_label("YOUR FARM. YOUR EMPIRE.",Vector2(24,23),Vector2(630,43),24,WHITE,front)
	_label("From a single GPU to a mining city.",Vector2(24,66),Vector2(632,40),20,SECONDARY,front)
	start_button=_button("CONTINUE GAME  ›" if has_save else "START GAME  ›",Vector2(24,123),Vector2(630,82),_start,true,front)
	_button("HOW TO PLAY",Vector2(24,228),Vector2(630,72),_show_help,false,front)
	quality_button=_button("GRAPHICS  /  30 FPS",Vector2(24,320),Vector2(630,70),_toggle_quality,false,front)
	status=_label("3D WORLD  /  HARDWARE  /  POWER  /  STRATEGY",Vector2(24,427),Vector2(627,57),18,GREEN,front)

	help_window=Panel.new()
	help_window.position=Vector2(35,400)
	help_window.size=Vector2(650,630)
	help_window.add_theme_stylebox_override("panel",_style(Color("142630"),AMBER,18))
	help_window.mouse_filter=Control.MOUSE_FILTER_STOP
	ui.add_child(help_window)
	_label("HOW TO PLAY",Vector2(25,21),Vector2(575,65),34,AMBER,help_window)
	var steps=_label(
		"1  CHOOSE hardware in the BUILD bar.\n\n"+
		"2  TAP a floor slot to install a rig.\n\n"+
		"3  SELL mined DNCH for cash.\n\n"+
		"4  UPGRADE power and cooling.\n\n"+
		"5  SELECT machines to improve or recycle.\n\n"+
		"6  EXPAND your facility.",Vector2(26,102),Vector2(582,387),22,WHITE,help_window)
	steps.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	_button("CLOSE",Vector2(25,530),Vector2(601,70),_show_help,true,help_window)
	help_window.visible=false

func _start()->void:
	start_button.disabled=true
	status.text="LOADING 3D FACILITY ..."
	get_tree().root.set_meta("safe_mode",safe_mode)
	Engine.max_fps=30 if safe_mode else 60
	var err=get_tree().change_scene_to_file("res://main.tscn")
	if err!=OK:
		status.text="START FAILED: "+str(err)
		start_button.disabled=false

func _toggle_quality()->void:
	safe_mode=not safe_mode
	quality_button.text="GRAPHICS  /  30 FPS" if safe_mode else "GRAPHICS  /  60 FPS"
	status.text="ECO GRAPHICS" if safe_mode else "HIGH GRAPHICS"

func _show_help()->void:
	help_visible=not help_visible
	help_window.visible=help_visible

func _process(delta:float)->void:
	elapsed+=delta
	if camera!=null:
		camera.position.x=25.0+sin(elapsed*.16)*1.2
		camera.look_at(Vector3(0,1.2,1.3))
	for fan in fans:
		if is_instance_valid(fan):
			fan.rotation.z+=delta*8.0
