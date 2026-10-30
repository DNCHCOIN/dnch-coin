extends Control

var safe_mode:bool=true
var help_visible:bool=false
var time_passed:float=0.0
var status:Label
var subtitle:Label

func _ready()->void:
	mouse_filter=Control.MOUSE_FILTER_PASS
	_create_ui()
	set_process(true)

func _panel_style(bg:Color, border:Color)->StyleBoxFlat:
	var s:=StyleBoxFlat.new()
	s.bg_color=bg
	s.border_color=border
	s.set_border_width_all(2)
	s.set_corner_radius_all(12)
	s.content_margin_left=18
	s.content_margin_right=18
	s.content_margin_top=12
	s.content_margin_bottom=12
	return s

func _make_button(value:String,pos:Vector2,size:Vector2,action:Callable,highlight:bool=false)->Button:
	var b:=Button.new()
	b.position=pos
	b.size=size
	b.text=value
	b.add_theme_font_size_override("font_size",23)
	b.add_theme_color_override("font_color",Color("0b2632") if highlight else Color("e7f9fa"))
	b.add_theme_stylebox_override("normal",_panel_style(Color("f0bd68") if highlight else Color("163746"),Color("f5c57c") if highlight else Color("49899a")))
	b.add_theme_stylebox_override("hover",_panel_style(Color("fce4a1") if highlight else Color("1e5260"),Color("79f5ff")))
	b.add_theme_stylebox_override("pressed",_panel_style(Color("d59c4a"),Color("c8f7ff")))
	b.pressed.connect(action)
	add_child(b)
	return b

func _text(value:String,pos:Vector2,size:Vector2,font_size:int,color:Color)->Label:
	var l:=Label.new()
	l.position=pos
	l.size=size
	l.text=value
	l.add_theme_font_size_override("font_size",font_size)
	l.add_theme_color_override("font_color",color)
	add_child(l)
	return l

func _create_ui()->void:
	_text("DNCH / INTERACTIVE",Vector2(74,70),Vector2(500,40),25,Color("62dcf0"))
	_text("MINING FARM",Vector2(71,128),Vector2(650,93),72,Color("f3f7f8"))
	_text("BUILD YOUR HASH EMPIRE",Vector2(76,230),Vector2(600,45),27,Color("efbe74"))
	subtitle=_text("HARDWARE  /  ENERGY  /  STRATEGY",Vector2(77,296),Vector2(650,34),20,Color("83b0be"))
	_make_button("START MINING",Vector2(74,383),Vector2(365,71),_start,true)
	_make_button("GRAPHICS: SAFE",Vector2(74,468),Vector2(365,61),_toggle)
	_make_button("HOW TO PLAY",Vector2(74,544),Vector2(365,61),_help)
	status=_text("",Vector2(78,622),Vector2(990,70),18,Color("a5c5cd"))
	status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	var f:=FileAccess.open("user://dnch_mining_farm_v1.json",FileAccess.READ)
	if f!=null:
		status.text="PROGRESS FOUND  /  CONTINUE YOUR FARM"
		f.close()
	else:
		status.text="NEW GAME  /  ONE RIG  /  ONE BIG DREAM"

func _start()->void:
	get_tree().root.set_meta("safe_mode",safe_mode)
	status.text="INITIALIZING 3D MINING FACILITY..."
	var error:=get_tree().change_scene_to_file("res://main.tscn")
	if error!=OK:
		status.text="START FAILED: "+str(error)

func _toggle()->void:
	safe_mode=not safe_mode
	for node in get_children():
		if node is Button and node.text.begins_with("GRAPHICS:"):
			node.text="GRAPHICS: SAFE" if safe_mode else "GRAPHICS: HIGH"
	status.text="SAFE = 30 FPS / SIMPLER EFFECTS" if safe_mode else "HIGH = 60 FPS / MORE VISUAL DETAIL"

func _help()->void:
	help_visible=not help_visible
	status.text="BUY HARDWARE > TAP A FLOOR SLOT > MINE DNCH > SELL > UPGRADE GRID > EXPAND" if help_visible else "START WITH A GPU RIG. GROW INTO A FULL DATA CENTER."

func _process(delta:float)->void:
	time_passed+=delta
	queue_redraw()

func _draw()->void:
	var w:float=size.x
	var h:float=size.y
	draw_rect(Rect2(Vector2.ZERO,size),Color("081923"))
	# A coherent high-contrast tech-industrial art direction.
	for i in range(22):
		var t:float=float(i)/22.0
		draw_rect(Rect2(0.0,t*h,w,34.0),Color(0.01+t*.045,0.08+t*.035,0.13+t*.045,0.12))
	for i in range(16):
		draw_line(Vector2(0,65+float(i)*62),Vector2(w,40+float(i)*62),Color(0.15,.36,.43,.13),1.0)
	for i in range(24):
		var x:=float(i)*80.0
		draw_line(Vector2(x,0),Vector2(x,h),Color(.12,.35,.42,.095),1.0)
	# Decorative industrial server room vignette, right-hand side.
	draw_rect(Rect2(w*.595,h*.145,w*.36,h*.70),Color("112c3a"),true)
	draw_rect(Rect2(w*.60,h*.16,w*.35,h*.68),Color("456373"),false,3.0)
	for rack in range(4):
		var x:float=w*.625+float(rack)*86.0
		var y:float=h*.226
		draw_rect(Rect2(x,y,73,345),Color("172632"))
		draw_rect(Rect2(x-3,y-3,79,353),Color("7794a2"),false,5)
		for section in range(5):
			var iy:float=y+25+float(section)*61
			draw_rect(Rect2(x+9,iy,56,45),Color("293e4c"))
			for p in range(2):
				var a:float=(time_passed*3.0+float(rack)*1.7+float(section)*2.0)*(.6+float(p)*.4)
				var px:float=x+24+float(p)*25.0
				draw_circle(Vector2(px,iy+23),13,Color("506c7a"))
				draw_circle(Vector2(px,iy+23),10,Color("101d2c"))
				for k in range(4):
					var angle:float=a+TAU*float(k)/4.0
					draw_line(Vector2(px,iy+23),Vector2(px+cos(angle)*8,iy+23+sin(angle)*8),Color("9fb9c8"),3.0)
			draw_circle(Vector2(x+65,iy+8),3.5,Color("6afac4") if fmod(time_passed*2.0+float(section)+float(rack),2.0)<1.5 else Color("274e53"))
	draw_rect(Rect2(w*.62,h*.77,w*.31,8.0),Color("51d3e4"))
	draw_line(Vector2(w*.61,h*.15),Vector2(w*.98,h*.06),Color(.29,.75,.85,.45),3.0)
	draw_line(Vector2(w*.60,h*.85),Vector2(w*.94,h*.92),Color(.29,.75,.85,.37),3.0)
	draw_rect(Rect2(63,119,5,161),Color("51d3e4"))
	for i in range(4):
		draw_circle(Vector2(78+float(i)*22,h-23),4.0,Color(.29,.87,.91,.50+sin(time_passed*2+float(i))*.22))
