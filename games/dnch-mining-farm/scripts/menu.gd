extends Control

# Lightweight startup screen. Do not create the heavy 3D facility until PLAY.
const WHITE = Color("f3f5f5")
const GOLD = Color("f9c57e")
const MUTED = Color("a2bac2")
const GREEN = Color("61e1b5")
const PANEL = Color("10232e")
var safe_mode:bool = true
var help_visible:bool = false
var start_button:Button
var graphics_button:Button
var status:Label
var help_window:Panel
var back_canvas:Control

func _ready()->void:
	Input.set_emulate_mouse_from_touch(true)
	Engine.max_fps=30
	mouse_filter=Control.MOUSE_FILTER_IGNORE
	_draw_menu()
	_write_stage("MENU READY")

func _style(bg:Color,border:Color=Color("4a6370"))->StyleBoxFlat:
	var s:=StyleBoxFlat.new()
	s.bg_color=bg
	s.border_color=border
	s.set_border_width_all(1)
	s.set_corner_radius_all(14)
	s.content_margin_left=12
	s.content_margin_right=12
	s.content_margin_top=9
	s.content_margin_bottom=9
	return s

func _label(text:String,pos:Vector2,dimensions:Vector2,font:int,color:Color,parent:Control=null)->Label:
	var l:=Label.new()
	l.text=text
	l.position=pos
	l.size=dimensions
	l.add_theme_font_size_override("font_size",font)
	l.add_theme_color_override("font_color",color)
	l.vertical_alignment=VERTICAL_ALIGNMENT_CENTER
	l.mouse_filter=Control.MOUSE_FILTER_IGNORE
	(parent if parent!=null else self).add_child(l)
	return l

func _button(text:String,pos:Vector2,dimensions:Vector2,callback:Callable,gold:bool=false,parent:Control=null)->Button:
	var b:=Button.new()
	b.text=text
	b.position=pos
	b.size=dimensions
	b.focus_mode=Control.FOCUS_NONE
	b.mouse_filter=Control.MOUSE_FILTER_STOP
	b.add_theme_font_size_override("font_size",23)
	b.add_theme_color_override("font_color",Color("1d2a30") if gold else WHITE)
	b.add_theme_stylebox_override("normal",_style(GOLD if gold else PANEL,GOLD if gold else Color("3c6b7a")))
	b.add_theme_stylebox_override("hover",_style(Color("ffe0aa") if gold else Color("2c4a5a"),GOLD))
	b.pressed.connect(callback)
	(parent if parent!=null else self).add_child(b)
	return b

func _draw_menu()->void:
	back_canvas=Control.new()
	back_canvas.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	back_canvas.mouse_filter=Control.MOUSE_FILTER_IGNORE
	back_canvas.draw.connect(_draw_background)
	add_child(back_canvas)
	var top=ColorRect.new()
	top.color=Color(.035,.063,.080,.91)
	top.position=Vector2(0,0)
	top.size=Vector2(720,190)
	top.mouse_filter=Control.MOUSE_FILTER_IGNORE
	add_child(top)
	_label("DNCH",Vector2(25,11),Vector2(510,89),75,GOLD)
	_label("MINING FARM",Vector2(30,96),Vector2(530,51),41,WHITE)
	_label("BUILD YOUR HASH EMPIRE",Vector2(31,169),Vector2(530,39),19,MUTED)
	var shade:=Panel.new()
	shade.position=Vector2(21,702)
	shade.size=Vector2(678,550)
	shade.add_theme_stylebox_override("panel",_style(Color(.045,.082,.104,.96),Color("7e725f")))
	shade.mouse_filter=Control.MOUSE_FILTER_STOP
	add_child(shade)
	_label("YOUR FARM. YOUR DECISIONS.",Vector2(24,21),Vector2(618,45),25,WHITE,shade)
	_label("Build a hardware mining empire.",Vector2(24,69),Vector2(621,35),20,MUTED,shade)
	start_button=_button("CONTINUE FARM  ›" if FileAccess.file_exists("user://dnch_mining_farm_v1.json") else "START MINING  ›",Vector2(23,118),Vector2(632,83),_start,true,shade)
	_button("HOW TO PLAY",Vector2(23,226),Vector2(632,72),_toggle_help,false,shade)
	graphics_button=_button("GRAPHICS: SAFE  /  30 FPS",Vector2(23,320),Vector2(632,67),_toggle_mode,false,shade)
	var prev:String="First launch."
	if FileAccess.file_exists("user://dnch_farm_boot.txt"):
		var f:=FileAccess.open("user://dnch_farm_boot.txt",FileAccess.READ)
		if f!=null:
			prev=f.get_as_text()
			f.close()
	status=_label("LAST SESSION: "+prev,Vector2(24,417),Vector2(616,95),16,GREEN,shade)
	status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	help_window=Panel.new()
	help_window.position=Vector2(32,380)
	help_window.size=Vector2(656,643)
	help_window.add_theme_stylebox_override("panel",_style(Color("152733"),GOLD))
	help_window.mouse_filter=Control.MOUSE_FILTER_STOP
	add_child(help_window)
	_label("HOW TO PLAY",Vector2(24,20),Vector2(594,58),31,GOLD,help_window)
	var guide=_label("1   CHOOSE equipment from BUILD.\n\n2   TAP a free space in the 3D facility.\n\n3   SELL mined DNCH for cash.\n\n4   BUY cooling and power upgrades.\n\n5   UPGRADE or RECYCLE selected rigs.\n\n6   EXPAND the warehouse.",Vector2(24,104),Vector2(603,403),22,WHITE,help_window)
	guide.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	_button("CLOSE",Vector2(26,531),Vector2(599,66),_toggle_help,true,help_window)
	help_window.visible=false

func _draw_background()->void:
	var canvas:Control=back_canvas
	var w:float=720.0
	canvas.draw_rect(Rect2(0,0,w,1280),Color("071a27"))
	var floor_color=Color("1c3643")
	var far_color=Color("17303d")
	for i in range(19):
		var t:float=float(i)/19.0
		canvas.draw_rect(Rect2(0,211+float(i)*26,w,29),far_color.lerp(floor_color,t))
	# Industrial buildings and a network of mining racks, rendered in 2D
	# to ensure the startup screen cannot overload the Android 3D renderer.
	for i in range(10):
		var x:float=-25.0+float(i%5)*161.0
		var y:float=355.0+float(i/5)*167.0
		canvas.draw_rect(Rect2(x,y,151,119),Color("1c3441"))
		canvas.draw_rect(Rect2(x,y,151,119),Color("456978"),false,2.0)
		for j in range(3):
			var px:float=x+34.0+float(j)*43.0
			canvas.draw_arc(Vector2(px,y+60),17,0,TAU,16,Color("61bace"),2.0,true)
			canvas.draw_circle(Vector2(px,y+60),7,Color("071b25"))
		canvas.draw_line(Vector2(x+7,y+97),Vector2(x+144,y+97),Color("e9ad60"),2.0)
	for i in range(24):
		var x:float=float(i)*35.0
		canvas.draw_line(Vector2(x,190),Vector2(x-130,700),Color("567e8d",.20),1.0)
	canvas.draw_line(Vector2(10,674),Vector2(713,674),GOLD,4.0)

func _start()->void:
	start_button.disabled=true
	status.text="LOADING GAME WORLD..."
	_write_stage("START BUTTON PRESSED")
	get_tree().root.set_meta("safe_mode",safe_mode)
	Engine.max_fps=30 if safe_mode else 60
	var err:int=get_tree().change_scene_to_file("res://main.tscn")
	if err!=OK:
		_write_stage("SCENE LOAD ERROR "+str(err))
		status.text="SCENE ERROR: "+str(err)
		start_button.disabled=false

func _toggle_mode()->void:
	safe_mode=not safe_mode
	graphics_button.text="GRAPHICS: SAFE  /  30 FPS" if safe_mode else "GRAPHICS: HIGH  /  60 FPS"
	status.text="LOW GRAPHICS / 30 FPS" if safe_mode else "HIGH GRAPHICS / 60 FPS"

func _toggle_help()->void:
	help_visible=not help_visible
	help_window.visible=help_visible

func _write_stage(stage:String)->void:
	var f:=FileAccess.open("user://dnch_farm_boot.txt",FileAccess.WRITE)
	if f!=null:
		f.store_string(stage)
		f.close()
