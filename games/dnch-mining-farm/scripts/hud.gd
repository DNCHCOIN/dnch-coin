extends CanvasLayer
class_name FarmHUD

signal command(action: String, value: String)

const PORTRAIT = preload("res://scripts/equipment_portrait.gd")
const BG := Color("101922")
const PANEL := Color(0.065,0.100,0.136,.95)
const BORDER := Color("37546a")
const WHITE := Color("edf4f7")
const MUTED := Color("a1b6c2")
const GOLD := Color("f6b965")
const CYAN := Color("62d7f0")
const GREEN := Color("57dfa9")
const CATALOG = [
	["gpu_1","STARTER GPU","$650","PRODUCTION"],
	["gpu_2","PRO GPU RIG","$2,600","PRODUCTION"],
	["gpu_3","ULTRA GPU","$5,900","PRODUCTION"],
	["asic_1","ASIC S-100","$8,500","PRODUCTION"],
	["asic_2","ASIC X-CORE","$24,000","PRODUCTION"],
	["rack","SERVER RACK","$18,000","UTILITY"],
	["fan","INDUSTRIAL FAN","$650","COOLING"],
	["cooler","LIQUID HVAC","$4,400","COOLING"],
	["solar","SOLAR ARRAY","$3,600","POWER"],
	["battery","BATTERY BANK","$2,500","POWER"]
]
const TABS := ["BUILD","PRODUCTION","POWER","COOLING","UTILITY"]

var root: Control
var cash_display: Label
var coin_display: Label
var hash_display: Label
var power_display: Label
var heat_display: Label
var cash_rate: Label
var coin_rate: Label
var mission_label: Label
var mission_progress: ProgressBar
var mission_counter: Label
var mission_reward: Label
var facility_label: Label
var warning_label: Label
var toast_label: Label
var footer: Label
var right_description: Label
var right_header: Label
var selected_label: Label
var stats_label: Label
var market_label: Label
var build_cards: Dictionary = {}
var nav_buttons: Dictionary = {}
var card_panels: Dictionary = {}
var scroller: ScrollContainer
var current_item: String = "gpu_1"
var current_tab: String = "BUILD"
var toast_timer: float = 0.0
var action_buttons: Dictionary = {}

func _box(fill:Color=PANEL, edge:Color=BORDER, radius:int=11, width:int=1)->StyleBoxFlat:
	var s:=StyleBoxFlat.new()
	s.bg_color=fill
	s.border_color=edge
	s.set_border_width_all(width)
	s.set_corner_radius_all(radius)
	s.content_margin_left=8
	s.content_margin_right=8
	s.content_margin_top=6
	s.content_margin_bottom=6
	return s

func _panel(parent:Control,x:float,y:float,w:float,h:float,fill:Color=PANEL,edge:Color=BORDER)->Panel:
	var p:=Panel.new()
	p.position=Vector2(x,y)
	p.size=Vector2(w,h)
	p.mouse_filter=Control.MOUSE_FILTER_STOP
	p.add_theme_stylebox_override("panel",_box(fill,edge))
	parent.add_child(p)
	return p

func _label(parent:Control,value:String,x:float,y:float,w:float,h:float,font:int,tint:Color=WHITE,align:int=HORIZONTAL_ALIGNMENT_LEFT)->Label:
	var l:=Label.new()
	l.text=value
	l.position=Vector2(x,y)
	l.size=Vector2(w,h)
	l.horizontal_alignment=align
	l.vertical_alignment=VERTICAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size",font)
	l.add_theme_color_override("font_color",tint)
	l.mouse_filter=Control.MOUSE_FILTER_IGNORE
	parent.add_child(l)
	return l

func _button(parent:Control,name:String,x:float,y:float,w:float,h:float,action:String,arg:String="",prominent:bool=false,font:int=17)->Button:
	var b:=Button.new()
	b.text=name
	b.position=Vector2(x,y)
	b.size=Vector2(w,h)
	b.focus_mode=Control.FOCUS_NONE
	b.mouse_filter=Control.MOUSE_FILTER_STOP
	b.add_theme_font_size_override("font_size",font)
	b.add_theme_color_override("font_color",Color("13202a") if prominent else WHITE)
	b.add_theme_stylebox_override("normal",_box(GOLD if prominent else Color("1a2b39"),GOLD if prominent else BORDER,9))
	b.add_theme_stylebox_override("hover",_box(Color("ffdb9c") if prominent else Color("254557"),WHITE if prominent else CYAN,9))
	b.add_theme_stylebox_override("pressed",_box(Color("de9f4c") if prominent else Color("13242e"),GOLD,9))
	b.pressed.connect(func(): command.emit(action,arg))
	parent.add_child(b)
	return b

func _ready()->void:
	root=Control.new()
	root.name="Premium Farm HUD"
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter=Control.MOUSE_FILTER_IGNORE
	add_child(root)
	_header()
	_mission()
	_actions()
	_shop()
	_camera_controls()
	toast_label=_label(root,"",296,111,680,43,22,GOLD,HORIZONTAL_ALIGNMENT_CENTER)
	toast_label.visible=false
	select_item("gpu_1")
	_set_tab("BUILD")

func _camera_controls()->void:
	# Large visible on-screen zoom buttons; Android users need no gesture tutorial.
	var panel:=_panel(root,900,429,93,87,Color(.07,.12,.16,.88))
	_button(panel,"+",6,5,80,36,"zoom_in","",false,23)
	_button(panel,"−",6,45,80,36,"zoom_out","",false,23)

func _header()->void:
	var logo:=_panel(root,13,10,217,87,Color("17242c"),Color("9e7451"))
	_label(logo,"DNCH",12,5,194,47,38,GOLD)
	_label(logo,"MINING FARM",14,51,192,25,18,WHITE)
	var metrics: Array = [
		["CASH","$","+$ / min"],
		["DNCH","COINS","+ DNCH / min"],
		["HASH POWER","GH/s","LIVE HASHRATE"],
		["POWER USE","kW","GRID CAPACITY"],
		["TEMP","°C","COOLING STATUS"]
	]
	var elements: Array = []
	for i in range(5):
		var px:float=238.0+float(i)*207.0
		var m:=_panel(root,px,10,199,87)
		_label(m,metrics[i][0],12,6,177,19,14,MUTED)
		var lv:=_label(m,"--",12,26,180,33,22,WHITE)
		var subtitle:=_label(m,metrics[i][2],12,62,178,16,12,GREEN)
		elements.append([lv,subtitle])
	cash_display=elements[0][0]
	cash_rate=elements[0][1]
	coin_display=elements[1][0]
	coin_rate=elements[1][1]
	hash_display=elements[2][0]
	power_display=elements[3][0]
	heat_display=elements[4][0]

func _mission()->void:
	var p:=_panel(root,13,110,263,404)
	_label(p,"CURRENT CONTRACT",16,9,235,28,18,WHITE)
	_label(p,"PRODUCTION  /  LIVE",16,42,234,21,13,CYAN)
	_bar(p,67)
	mission_label=_label(p,"",15,82,233,69,18,WHITE)
	mission_label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	mission_progress=ProgressBar.new()
	mission_progress.position=Vector2(15,159)
	mission_progress.size=Vector2(233,18)
	mission_progress.min_value=0
	mission_progress.max_value=100
	mission_progress.value=0
	mission_progress.show_percentage=false
	mission_progress.add_theme_stylebox_override("background",_box(Color("182f39"),BORDER,4))
	mission_progress.add_theme_stylebox_override("fill",_box(GREEN,GREEN,4))
	p.add_child(mission_progress)
	mission_counter=_label(p,"0 / 0",15,181,232,24,15,CYAN,HORIZONTAL_ALIGNMENT_RIGHT)
	_bar(p,215)
	_label(p,"CONTRACT REWARD",15,229,231,22,15,MUTED)
	mission_reward=_label(p,"",15,251,230,26,20,GOLD)
	_button(p,"CLAIM REWARD",16,294,231,51,"claim","",true,17)
	facility_label=_label(p,"GARAGE / LEVEL 1",15,355,235,30,14,CYAN)

func _bar(parent:Control,y:float)->void:
	var line=ColorRect.new()
	line.position=Vector2(15,y)
	line.size=Vector2(parent.size.x-30,1)
	line.color=Color("47606a")
	line.mouse_filter=Control.MOUSE_FILTER_IGNORE
	parent.add_child(line)

func _actions()->void:
	var p:=_panel(root,1003,110,265,404)
	_label(p,"FARM MANAGEMENT",14,9,236,29,17,WHITE)
	_bar(p,45)
	var selected_note:=_label(p,"TAP A RIG TO UPGRADE IT",14,39,236,18,12,CYAN)
	selected_label=selected_note
	var actions=[
		["SELL CRYPTO","sell"],
		["UPGRADE GRID","grid"],
		["EXPAND FACILITY","expand"],
		["REPAIR ALL","repair"],
		["DAILY SUPPLY","daily"],
		["UPGRADE UNIT","upgrade_unit"],
		["RECYCLE SELECTED","recycle_unit"]
	]
	for i in range(actions.size()):
		var y:float=63+float(i)*47.0
		var a=actions[i]
		var b:=_button(p,str(a[0]),14,y,235,42,str(a[1]),"",i==0,16)
		action_buttons[a[1]]=b

func _shop()->void:
	var nav:=_panel(root,13,526,1255,45,Color("101a23"))
	for i in range(TABS.size()):
		var tab:String=TABS[i]
		var b:=_button(nav,tab,7+float(i)*248,5,239,36,"tab",tab,false,17)
		# Tap is handled immediately inside the HUD; tab must not depend on the game.
		b.pressed.connect(_set_tab.bind(tab))
		nav_buttons[tab]=b
	var store:=_panel(root,13,580,1255,130,Color("0e1a25"))
	scroller=ScrollContainer.new()
	scroller.position=Vector2(7,4)
	scroller.size=Vector2(1240,122)
	scroller.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED
	scroller.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_AUTO
	store.add_child(scroller)
	var row:=HBoxContainer.new()
	row.add_theme_constant_override("separation",9)
	scroller.add_child(row)
	for info in CATALOG:
		var kind:String=info[0]
		var label:String=info[1]
		var price:String=info[2]
		var card:=Panel.new()
		card.custom_minimum_size=Vector2(165,116)
		card.mouse_filter=Control.MOUSE_FILTER_PASS
		card.add_theme_stylebox_override("panel",_box(Color("172b39"),BORDER,9))
		row.add_child(card)
		var picture=PORTRAIT.new()
		picture.kind=kind
		picture.position=Vector2(5,5)
		picture.size=Vector2(155,65)
		card.add_child(picture)
		_label(card,label,9,71,150,19,13,WHITE)
		var b:=_button(card,price+"  /  BUILD",6,91,153,23,"select",kind,false,13)
		build_cards[kind]=b
		card_panels[kind]=[card,str(info[3])]

func _set_tab(tab:String)->void:
	current_tab=tab
	for key in nav_buttons.keys():
		var b:Button=nav_buttons[key]
		var active:bool=key==tab
		b.add_theme_stylebox_override("normal",_box(Color("4b3926") if active else Color("1a2b39"),GOLD if active else BORDER,7))
		b.add_theme_color_override("font_color",GOLD if active else MUTED)
	for kind in card_panels.keys():
		var entry:Array=card_panels[kind]
		(entry[0] as Panel).visible=tab=="BUILD" or str(entry[1])==tab
	if scroller!=null:
		scroller.scroll_horizontal=0

func select_item(key:String)->void:
	if not build_cards.has(key):
		return
	current_item=key
	for kind in card_panels.keys():
		var card:Panel=card_panels[kind][0]
		card.add_theme_stylebox_override("panel",_box(Color("314550") if key==kind else Color("172b39"),GOLD if key==kind else BORDER,9,2 if key==kind else 1))
	command.emit("selected",key)

func _process(delta:float)->void:
	if toast_timer>0.0:
		toast_timer-=delta
		if toast_timer<=0.0:
			toast_label.visible=false

func show_toast(message:String)->void:
	toast_label.text=message
	toast_label.visible=true
	toast_timer=3.6

func update_data(data:Dictionary)->void:
	var cash:float=float(data.get("cash",0.0))
	var coins:float=float(data.get("coins",0.0))
	var hp:float=float(data.get("hash",0.0))
	var power:float=float(data.get("power",0.0))
	var capacity:float=float(data.get("capacity",0.0))
	var temp:float=float(data.get("heat",0.0))
	cash_display.text="$"+_money(cash)
	cash_rate.text="OPERATING CASH"
	coin_display.text=_decimal(coins)
	coin_rate.text="+%.2f DNCH / MIN" % float(data.get("mining_rate",0.0))
	hash_display.text="%.1f GH/s" % hp if hp<1000.0 else "%.2f TH/s" % (hp/1000.0)
	power_display.text="%.1f / %.1f kW" % [power/1000.0,capacity/1000.0]
	heat_display.text="%.0f°C" % temp
	heat_display.add_theme_color_override("font_color",Color("ff8b71") if temp>75.0 else GREEN)
	facility_label.text="%s  /  LEVEL %d" % [str(data.get("facility","GARAGE")),int(data.get("tier",1))]
	mission_label.text=str(data.get("mission",""))
	mission_reward.text="$"+_money(float(data.get("mission_reward",0.0)))
	if selected_label!=null:
		selected_label.text=str(data.get("selected_unit","TAP A RIG TO UPGRADE IT"))
	mission_progress.value=clampf(float(data.get("mission_percent",0.0)),0.0,100.0)
	mission_counter.text="%.0f / %.0f" % [float(data.get("mission_current",0.0)),float(data.get("mission_target",0.0))]
	# Keep progress, profitability and hardware data visible without oversized panels.
	var source:Dictionary=data.get("descriptions",{})
	var descriptor:String=str(source.get(current_item,""))
	var warning:String=str(data.get("warning",""))
	if warning!="":
		cash_rate.text=warning.substr(0,27)
		cash_rate.add_theme_color_override("font_color",Color("ff9170"))
	else:
		cash_rate.add_theme_color_override("font_color",GREEN)

func _money(value:float)->String:
	if absf(value)>=1000000.0:
		return "%.2fM" % (value/1000000.0)
	if absf(value)>=10000.0:
		return "%.0fK" % (value/1000.0)
	return "%.0f" % value

func _decimal(value:float)->String:
	return "%.2f" % value
