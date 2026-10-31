extends CanvasLayer
class_name FarmHUD

signal command(action: String, value: String)

const PORTRAIT = preload("res://scripts/equipment_portrait.gd")
const PANEL = Color(0.042,0.070,0.091,.93)
const PANEL_LIGHT = Color(0.076,0.117,0.148,.94)
const BORDER = Color("416171")
const AMBER = Color("ffc374")
const BLUE = Color("55cfee")
const WHITE = Color("f0f4f5")
const MUTED = Color("a6bbc4")
const GREEN = Color("51dfa9")
const CATALOG = [
	["gpu_1","STARTER GPU","$650","PRODUCTION"],
	["gpu_2","PRO GPU","$2,600","PRODUCTION"],
	["gpu_3","ULTRA GPU","$5,900","PRODUCTION"],
	["asic_1","ASIC S-100","$8,500","PRODUCTION"],
	["asic_2","ASIC X-CORE","$24,000","PRODUCTION"],
	["rack","SERVER RACK","$18,000","UTILITY"],
	["fan","INDUSTRIAL FAN","$650","COOLING"],
	["cooler","LIQUID HVAC","$4,400","COOLING"],
	["solar","SOLAR ARRAY","$3,600","POWER"],
	["battery","BATTERY BANK","$2,500","POWER"]
]
const TABS=["BUILD","RIGS","POWER","COOLING","UTILITY"]

var root: Control
var cash_display:Label
var coin_display:Label
var hash_display:Label
var power_display:Label
var heat_display:Label
var mission_label:Label
var mission_counter:Label
var mission_reward:Label
var mission_progress:ProgressBar
var facility_label:Label
var toast_label:Label
var selected_label:Label
var build_cards:Dictionary={}
var nav_buttons:Dictionary={}
var card_panels:Dictionary={}
var action_buttons:Dictionary={}
var current_item:String="gpu_1"
var current_tab:String="BUILD"
var toast_timer:float=0.0
var scroller:ScrollContainer
var last_note:String=""

func _style(color:Color=PANEL,edge:Color=BORDER,radius:int=12,line:int=1)->StyleBoxFlat:
	var s:=StyleBoxFlat.new()
	s.bg_color=color
	s.border_color=edge
	s.set_border_width_all(line)
	s.set_corner_radius_all(radius)
	s.content_margin_left=6
	s.content_margin_right=6
	s.content_margin_top=5
	s.content_margin_bottom=5
	return s

func _panel(parent:Control,position:Vector2,panel_size:Vector2,fill:Color=PANEL)->Panel:
	var p:=Panel.new()
	p.position=position
	p.size=panel_size
	p.mouse_filter=Control.MOUSE_FILTER_STOP
	p.add_theme_stylebox_override("panel",_style(fill))
	parent.add_child(p)
	return p

func _label(parent:Control,message:String,position:Vector2,label_size:Vector2,font_size:int=18,color:Color=WHITE)->Label:
	var l:=Label.new()
	l.text=message
	l.position=position
	l.size=label_size
	l.vertical_alignment=VERTICAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size",font_size)
	l.add_theme_color_override("font_color",color)
	l.mouse_filter=Control.MOUSE_FILTER_IGNORE
	parent.add_child(l)
	return l

func _button(parent:Control,label:String,position:Vector2,button_size:Vector2,action:String,value:String="",primary:bool=false,font_size:int=18)->Button:
	var b:=Button.new()
	b.text=label
	b.position=position
	b.size=button_size
	b.focus_mode=Control.FOCUS_NONE
	b.mouse_filter=Control.MOUSE_FILTER_STOP
	b.add_theme_font_size_override("font_size",font_size)
	b.add_theme_color_override("font_color",Color("17242b") if primary else WHITE)
	b.add_theme_stylebox_override("normal",_style(AMBER if primary else PANEL_LIGHT,AMBER if primary else BORDER,9))
	b.add_theme_stylebox_override("hover",_style(Color("ffe2a7") if primary else Color("23485b"),BLUE,9))
	b.add_theme_stylebox_override("pressed",_style(Color("d8a057") if primary else PANEL,AMBER,9))
	b.pressed.connect(func(): command.emit(action,value))
	parent.add_child(b)
	return b

func _ready()->void:
	root=Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter=Control.MOUSE_FILTER_IGNORE
	add_child(root)
	_create_header()
	_create_mission()
	_create_actions()
	_create_shop()
	_create_camera_controls()
	toast_label=_label(root,"",Vector2(120,796),Vector2(480,51),20,AMBER)
	toast_label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
	toast_label.visible=false
	select_item(current_item)
	_set_tab("BUILD")

func _metric(parent:Control,x:float,heading:String,value:String)->Label:
	var p:=_panel(parent,Vector2(x,88),Vector2(136,79),PANEL)
	_label(p,heading,Vector2(8,5),Vector2(122,22),14,MUTED)
	var label:=_label(p,value,Vector2(8,30),Vector2(126,32),20,WHITE)
	return label

func _create_header()->void:
	var mast:=_panel(root,Vector2(10,8),Vector2(700,72),PANEL)
	_label(mast,"DNCH",Vector2(14,5),Vector2(178,48),38,AMBER)
	_label(mast,"MINING FARM",Vector2(188,17),Vector2(271,35),27,WHITE)
	_label(mast,"OPERATIONS LIVE",Vector2(523,28),Vector2(164,25),14,GREEN)
	cash_display=_metric(root,10,"CASH","$0")
	coin_display=_metric(root,151,"DNCH","0")
	hash_display=_metric(root,292,"HASHRATE","0")
	power_display=_metric(root,433,"POWER","0")
	heat_display=_metric(root,574,"TEMP","0")

func _create_mission()->void:
	var panel:=_panel(root,Vector2(11,179),Vector2(303,220))
	_label(panel,"CURRENT CONTRACT",Vector2(12,7),Vector2(272,29),16,AMBER)
	mission_label=_label(panel,"",Vector2(12,39),Vector2(274,62),17,WHITE)
	mission_label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	mission_progress=ProgressBar.new()
	mission_progress.position=Vector2(12,107)
	mission_progress.size=Vector2(278,16)
	mission_progress.show_percentage=false
	mission_progress.max_value=100
	mission_progress.add_theme_stylebox_override("background",_style(Color("1a333d"),BORDER,4))
	mission_progress.add_theme_stylebox_override("fill",_style(GREEN,GREEN,4))
	panel.add_child(mission_progress)
	mission_counter=_label(panel,"0/0",Vector2(12,126),Vector2(279,22),15,BLUE)
	mission_counter.horizontal_alignment=HORIZONTAL_ALIGNMENT_RIGHT
	mission_reward=_label(panel,"",Vector2(12,149),Vector2(272,25),18,AMBER)
	_button(panel,"CLAIM REWARD",Vector2(12,179),Vector2(277,35),"claim","",true,16)

func _create_actions()->void:
	var p:=_panel(root,Vector2(480,179),Vector2(230,296))
	_label(p,"FARM ACTIONS",Vector2(9,7),Vector2(213,27),15,BLUE)
	var actions=[
		["SELL CRYPTO","sell"],
		["UPGRADE GRID","grid"],
		["EXPAND","expand"],
		["REPAIR ALL","repair"],
		["DAILY SUPPLY","daily"],
		["UPGRADE UNIT","upgrade_unit"],
		["RECYCLE UNIT","recycle_unit"]
	]
	for i in range(actions.size()):
		var a=actions[i]
		var b:=_button(p,str(a[0]),Vector2(8,34+i*36),Vector2(214,33),str(a[1]),"",i==0,14)
		action_buttons[str(a[1])]=b

func _create_camera_controls()->void:
	var p:=_panel(root,Vector2(646,800),Vector2(64,116))
	_button(p,"+",Vector2(6,5),Vector2(52,49),"zoom_in","",false,28)
	_button(p,"-",Vector2(6,60),Vector2(52,49),"zoom_out","",false,28)
	facility_label=_label(root,"GARAGE  •  LEVEL 1",Vector2(18,899),Vector2(470,27),17,AMBER)
	selected_label=_label(root,"TAP ANY MACHINE TO UPGRADE",Vector2(17,866),Vector2(610,32),15,WHITE)

func _create_shop()->void:
	var bottom:=_panel(root,Vector2(8,944),Vector2(704,327),Color(.04,.064,.082,.975))
	for i in range(TABS.size()):
		var tab:String=TABS[i]
		var button:=_button(bottom,tab,Vector2(8+float(i)*139,7),Vector2(133,48),"tab",tab,false,16)
		button.pressed.connect(_set_tab.bind(tab))
		nav_buttons[tab]=button
	scroller=ScrollContainer.new()
	scroller.position=Vector2(7,69)
	scroller.size=Vector2(688,249)
	scroller.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED
	scroller.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_AUTO
	bottom.add_child(scroller)
	var row:=HBoxContainer.new()
	row.add_theme_constant_override("separation",11)
	scroller.add_child(row)
	for entry in CATALOG:
		var kind:String=entry[0]
		var p:=Panel.new()
		p.custom_minimum_size=Vector2(178,229)
		p.add_theme_stylebox_override("panel",_style(PANEL_LIGHT))
		p.mouse_filter=Control.MOUSE_FILTER_PASS
		row.add_child(p)
		var picture=PORTRAIT.new()
		picture.position=Vector2(9,9)
		picture.size=Vector2(160,123)
		picture.kind=kind
		p.add_child(picture)
		_label(p,str(entry[1]),Vector2(9,137),Vector2(160,28),16,WHITE)
		var price:String=str(entry[2])
		var button:=_button(p,price,Vector2(9,177),Vector2(160,44),"select",kind,true,18)
		build_cards[kind]=button
		card_panels[kind]=[p,str(entry[3])]

func _set_tab(tab:String)->void:
	current_tab=tab
	for key in nav_buttons.keys():
		var b:Button=nav_buttons[key]
		var active=key==tab
		b.add_theme_stylebox_override("normal",_style(Color("624326") if active else PANEL_LIGHT,AMBER if active else BORDER))
		b.add_theme_color_override("font_color",AMBER if active else WHITE)
	for key in card_panels.keys():
		var info:Array=card_panels[key]
		var p:Panel=info[0]
		p.visible=tab=="BUILD" or (tab=="RIGS" and str(info[1])=="PRODUCTION") or str(info[1])==tab
	if scroller!=null:
		scroller.scroll_horizontal=0

func select_item(key:String)->void:
	if not build_cards.has(key):
		return
	current_item=key
	for kind in card_panels.keys():
		var p:Panel=card_panels[kind][0]
		p.add_theme_stylebox_override("panel",_style(Color("334450") if kind==key else PANEL_LIGHT,AMBER if kind==key else BORDER,10,2 if kind==key else 1))
	command.emit("selected",key)

func show_toast(message:String)->void:
	if toast_label!=null:
		toast_label.text=message
		toast_label.visible=true
		toast_timer=3.8

func _process(delta:float)->void:
	if toast_timer>0.0:
		toast_timer-=delta
		if toast_timer<=0.0:
			toast_label.visible=false

func update_data(data:Dictionary)->void:
	cash_display.text="$"+_money(float(data.get("cash",0.0)))
	coin_display.text="%.1f"%float(data.get("coins",0.0))
	var hashing:float=float(data.get("hash",0.0))
	hash_display.text="%.0f GH/s"%hashing if hashing<1000.0 else "%.1f TH/s"%(hashing/1000.0)
	power_display.text="%.1f kW"%(float(data.get("power",0.0))/1000.0)
	heat_display.text="%.0f°C"%float(data.get("heat",0.0))
	heat_display.add_theme_color_override("font_color",Color("ff7960") if float(data.get("heat",0.0))>78.0 else GREEN)
	var mission:String=str(data.get("mission",""))
	mission_label.text=mission
	mission_progress.value=clampf(float(data.get("mission_percent",0.0)),0.0,100.0)
	mission_counter.text="%.0f / %.0f"%[float(data.get("mission_current",0.0)),float(data.get("mission_target",0.0))]
	mission_reward.text="REWARD  $"+_money(float(data.get("mission_reward",0.0)))
	facility_label.text=str(data.get("facility","GARAGE"))+"  •  LEVEL "+str(int(data.get("tier",1)))
	selected_label.text=str(data.get("selected_unit","TAP ANY MACHINE TO UPGRADE"))
	var warning:String=str(data.get("warning",""))
	if warning!="" and warning!=last_note:
		show_toast(warning)
		last_note=warning
	elif warning=="":
		last_note=""

func _money(v:float)->String:
	if absf(v)>=1000000.0:
		return "%.1fM"%(v/1000000.0)
	if absf(v)>=10000.0:
		return "%.1fK"%(v/1000.0)
	return "%.0f"%v
