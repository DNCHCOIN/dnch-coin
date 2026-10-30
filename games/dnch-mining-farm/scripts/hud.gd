extends CanvasLayer
class_name FarmHUD

signal command(action: String, value: String)

const COLOR_BG := Color("10171c")
const COLOR_PANEL := Color(0.075,0.105,0.13,0.94)
const COLOR_LINE := Color("40505c")
const COLOR_CYAN := Color("bad6df")
const COLOR_GOLD := Color("ecb879")
const COLOR_TEXT := Color("e7f5f6")
const CATALOG := [
	["gpu_1","STARTER GPU","$ 650"],
	["gpu_2","PRO GPU RIG","$ 2,600"],
	["gpu_3","ULTRA GPU","$ 5,900"],
	["asic_1","ASIC S-100","$ 8,500"],
	["asic_2","ASIC X-CORE","$ 24,000"],
	["fan","AIR COOLER","$ 650"],
	["cooler","INDUSTRIAL HVAC","$ 4,400"],
	["solar","SOLAR ARRAY","$ 3,600"],
	["battery","POWER BANK","$ 2,500"],
	["rack","SERVER RACK","$ 18,000"]
]

var root: Control
var header: Label
var cash_display: Label
var coin_display: Label
var hash_display: Label
var power_display: Label
var heat_display: Label
var left_stats: RichTextLabel
var mission_label: Label
var right_header: Label
var right_description: Label
var footer: Label
var toast_label: Label
var build_cards: Dictionary = {}
var current_item: String = "gpu_1"
var toast_timer: float = 0.0

func _style(background:Color, border:Color = COLOR_LINE, radius:int = 13) -> StyleBoxFlat:
	var s:=StyleBoxFlat.new()
	s.bg_color=background
	s.border_color=border
	s.set_border_width_all(1)
	s.set_corner_radius_all(radius)
	s.content_margin_left=11
	s.content_margin_right=11
	s.content_margin_top=8
	s.content_margin_bottom=8
	return s

func _label(text:String, size:int, color:Color = COLOR_TEXT) -> Label:
	var l:=Label.new()
	l.text=text
	l.add_theme_font_size_override("font_size",size)
	l.add_theme_color_override("font_color",color)
	l.mouse_filter=Control.MOUSE_FILTER_IGNORE
	return l

func _fixed(parent:Control, pos:Vector2, size:Vector2) -> PanelContainer:
	var p:=PanelContainer.new()
	p.position=pos
	p.size=size
	p.add_theme_stylebox_override("panel",_style(COLOR_PANEL))
	p.mouse_filter=Control.MOUSE_FILTER_STOP
	parent.add_child(p)
	return p

func _column(parent:Node,gap:int=8) -> VBoxContainer:
	var c:=VBoxContainer.new()
	c.add_theme_constant_override("separation",gap)
	parent.add_child(c)
	return c

func _button(name:String,action:String,value:String="",font_size:int=19,accent:bool=false) -> Button:
	var b:=Button.new()
	b.text=name
	b.custom_minimum_size=Vector2(0,48)
	b.add_theme_font_size_override("font_size",font_size)
	b.add_theme_color_override("font_color",Color("061921") if accent else COLOR_TEXT)
	b.add_theme_stylebox_override("normal",_style(COLOR_GOLD if accent else Color("1c2a34"),COLOR_GOLD if accent else COLOR_LINE,8))
	b.add_theme_stylebox_override("hover",_style(Color("f7d1a0") if accent else Color("304151"),COLOR_CYAN,8))
	b.add_theme_stylebox_override("pressed",_style(Color("e59e51") if accent else Color("10232d"),COLOR_GOLD,8))
	b.pressed.connect(func(): command.emit(action,value))
	return b

func _ready() -> void:
	root=Control.new()
	root.name="Farm Interface"
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter=Control.MOUSE_FILTER_IGNORE
	add_child(root)
	_construct_header()
	_construct_left()
	_construct_right()
	_construct_shop()
	toast_label=_label("",26,COLOR_GOLD)
	toast_label.position=Vector2(345,143)
	toast_label.size=Vector2(595,45)
	toast_label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(toast_label)
	toast_label.visible=false
	select_item("gpu_1")

func _construct_header() -> void:
	var bar:=_fixed(root,Vector2(12,10),Vector2(1256,96))
	var h:=HBoxContainer.new()
	h.add_theme_constant_override("separation",22)
	bar.add_child(h)
	var title_box:=_column(h,0)
	title_box.custom_minimum_size=Vector2(240,0)
	title_box.add_child(_label("DNCH  /  MINING FARM",24,COLOR_CYAN))
	header=_label("BUILD YOUR HASH EMPIRE",15,COLOR_GOLD)
	title_box.add_child(header)
	var labels=["CASH","COINS","HASH POWER","ENERGY","HEAT"]
	for i in range(labels.size()):
		var c:=_column(h,1)
		c.size_flags_horizontal=Control.SIZE_EXPAND_FILL
		c.add_child(_label(labels[i],14,Color("8bb1bf")))
		var value:=_label("--",23,COLOR_TEXT)
		c.add_child(value)
		match i:
			0:cash_display=value
			1:coin_display=value
			2:hash_display=value
			3:power_display=value
			4:heat_display=value

func _construct_left() -> void:
	var panel:=_fixed(root,Vector2(12,117),Vector2(275,424))
	var c:=_column(panel,10)
	c.add_child(_label("OPERATIONS / LIVE",19,COLOR_CYAN))
	left_stats=RichTextLabel.new()
	left_stats.bbcode_enabled=true
	left_stats.fit_content=false
	left_stats.scroll_active=false
	left_stats.custom_minimum_size=Vector2(245,225)
	left_stats.add_theme_font_size_override("normal_font_size",17)
	left_stats.add_theme_color_override("default_color",COLOR_TEXT)
	c.add_child(left_stats)
	c.add_child(_label("CURRENT CONTRACT",16,COLOR_GOLD))
	mission_label=_label("Build your first rig.",16)
	mission_label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	mission_label.custom_minimum_size=Vector2(242,49)
	c.add_child(mission_label)
	var row:=HBoxContainer.new()
	row.add_theme_constant_override("separation",6)
	c.add_child(row)
	var claim:=_button("CLAIM", "claim","",16,true)
	claim.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	row.add_child(claim)
	var repair:=_button("REPAIR","repair","",16)
	repair.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	row.add_child(repair)

func _construct_right() -> void:
	var panel:=_fixed(root,Vector2(984,117),Vector2(284,424))
	var c:=_column(panel,10)
	c.add_child(_label("BUILDING MANAGER",20,COLOR_CYAN))
	right_header=_label("STARTER GPU",23,COLOR_GOLD)
	c.add_child(right_header)
	right_description=_label("Choose a machine and tap an empty floor slot.",17)
	right_description.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	right_description.custom_minimum_size=Vector2(245,91)
	c.add_child(right_description)
	c.add_child(_label("FACILITY OPERATIONS",16,COLOR_CYAN))
	for info in [["SELL CRYPTO","sell"],["GRID + POWER","grid"],["EXPAND FACILITY","expand"],["DAILY SUPPLY","daily"]]:
		var button:=_button(info[0],info[1],"",16,info[1]=="sell")
		button.custom_minimum_size=Vector2(0,46)
		c.add_child(button)

func _construct_shop() -> void:
	var panel:=_fixed(root,Vector2(12,550),Vector2(1256,158))
	var container:=_column(panel,8)
	var heading:=HBoxContainer.new()
	heading.add_theme_constant_override("separation",20)
	container.add_child(heading)
	heading.add_child(_label("EQUIPMENT MARKET",18,COLOR_CYAN))
	footer=_label("TAP AN ITEM, THEN TAP A FLOOR SLOT TO PLACE IT.",15,Color("9bc0c5"))
	footer.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	heading.add_child(footer)
	var scroller:=ScrollContainer.new()
	scroller.custom_minimum_size=Vector2(1220,97)
	scroller.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED
	scroller.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_AUTO
	container.add_child(scroller)
	var row:=HBoxContainer.new()
	row.add_theme_constant_override("separation",8)
	scroller.add_child(row)
	for entry in CATALOG:
		var key:String=entry[0]
		var title:String=entry[1]
		var price:String=entry[2]
		var b:=_button(title+"\n"+price,"select",key,15)
		b.custom_minimum_size=Vector2(157,86)
		b.alignment=HORIZONTAL_ALIGNMENT_CENTER
		row.add_child(b)
		build_cards[key]=b

func select_item(key:String) -> void:
	current_item=key
	for item in build_cards.keys():
		var button:Button=build_cards[item]
		button.add_theme_stylebox_override("normal",_style(Color("38535e") if item==key else Color("17313f"),COLOR_CYAN if item==key else COLOR_LINE,9))
	right_header.text=key.replace("_"," ").to_upper()
	for entry in CATALOG:
		if entry[0]==key:
			right_header.text=entry[1]
			break
	command.emit("selected",key)

func show_toast(message:String) -> void:
	toast_label.text=message
	toast_label.visible=true
	toast_timer=3.3

func _process(delta:float)->void:
	if toast_timer>0.0:
		toast_timer-=delta
		if toast_timer<=0.0:
			toast_label.visible=false

func update_data(data:Dictionary) -> void:
	cash_display.text="$ "+_money(data.get("cash",0.0))
	coin_display.text="%.2f DNCH" % float(data.get("coins",0.0))
	hash_display.text="%.0f GH/s" % float(data.get("hash",0.0))
	power_display.text="%.1f / %.1f kW" % [float(data.get("power",0.0))/1000.0,float(data.get("capacity",0.0))/1000.0]
	heat_display.text="%.0f°C" % float(data.get("heat",0.0))
	var efficiency:float=float(data.get("eff",1.0))*100.0
	left_stats.text="[color=#76e5ec]FACILITY[/color]  %s\n" % str(data.get("facility","GARAGE"))
	left_stats.text+="[color=#f4c178]LEVEL[/color]   %d / 3\n" % int(data.get("tier",1))
	left_stats.text+="Machines:   %d / %d\n" % [int(data.get("count",0)),int(data.get("slots",0))]
	left_stats.text+="Cooling:      %.0f kW\n" % (float(data.get("cooling",0))/1000.0)
	left_stats.text+="Efficiency:  %.0f%%\n" % efficiency
	left_stats.text+="Mining:       %.2f DNCH/min\n" % float(data.get("mining_rate",0.0))
	left_stats.text+="Power bill:  $%.2f/min\n" % float(data.get("bill_rate",0.0))
	left_stats.text+="Grid limit:   %.0f W\n" % float(data.get("capacity",0.0))
	left_stats.text+="Market:       $%.2f / DNCH\n" % float(data.get("market",0.0))
	mission_label.text="%s\nREWARD: $%s" % [str(data.get("mission","Complete a contract")), _money(float(data.get("mission_reward",0.0)))]
	var descriptions:Dictionary=data.get("descriptions",{})
	right_description.text=str(descriptions.get(current_item,"Select an empty floor tile to place this equipment."))
	if data.get("warning","")!="":
		footer.text=str(data.get("warning",""))
	else:
		footer.text="DRAG TO ORBIT  •  PINCH TO ZOOM  •  TAP FLOOR TO BUILD"

func _money(value:float)->String:
	return "%0.0f" % value
