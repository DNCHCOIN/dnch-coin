extends Node3D

const ART = preload("res://scripts/art.gd")
const DETAIL = preload("res://scripts/facility_detail.gd")
const HUD_SCENE = preload("res://scripts/hud.gd")
const SAVE_PATH = "user://dnch_mining_farm_v1.json"
const TILE_COLS = 7
const TILE_ROWS = 5
const TILE_X = 2.45
const TILE_Z = 2.35
const TYPES: Dictionary = {
	"gpu_1":{"label":"Starter GPU Rig","price":650.0,"hash":24.0,"watts":430.0,"cool":0.0,"solar":0.0,"extra":0.0},
	"gpu_2":{"label":"Pro GPU Rig","price":2600.0,"hash":105.0,"watts":940.0,"cool":0.0,"solar":0.0,"extra":0.0},
	"gpu_3":{"label":"Ultra GPU Rig","price":5900.0,"hash":260.0,"watts":1420.0,"cool":0.0,"solar":0.0,"extra":0.0},
	"asic_1":{"label":"ASIC S-100","price":8500.0,"hash":470.0,"watts":1950.0,"cool":0.0,"solar":0.0,"extra":0.0},
	"asic_2":{"label":"ASIC X-Core","price":24000.0,"hash":1550.0,"watts":3200.0,"cool":0.0,"solar":0.0,"extra":0.0},
	"fan":{"label":"Industrial Air Cooler","price":650.0,"hash":0.0,"watts":95.0,"cool":1350.0,"solar":0.0,"extra":0.0},
	"cooler":{"label":"Precision HVAC","price":4400.0,"hash":0.0,"watts":600.0,"cool":5200.0,"solar":0.0,"extra":0.0},
	"solar":{"label":"Solar Power Array","price":3600.0,"hash":0.0,"watts":0.0,"cool":0.0,"solar":850.0,"extra":0.0},
	"battery":{"label":"Modular Power Bank","price":2500.0,"hash":0.0,"watts":20.0,"cool":0.0,"solar":0.0,"extra":1300.0},
	"rack":{"label":"Integrated Server Rack","price":18000.0,"hash":1200.0,"watts":2650.0,"cool":0.0,"solar":0.0,"extra":0.0}
}
const CONTRACTS: Array = [
	{"name":"TWO MACHINES ONLINE","goal":"miners","target":2,"reward":1400.0},
	{"name":"INSTALL A COOLING UNIT","goal":"coolers","target":1,"reward":1200.0},
	{"name":"BUILD 4 MINING MACHINES","goal":"miners","target":4,"reward":3200.0},
	{"name":"EXPAND TO THE WORKSHOP","goal":"tier","target":2,"reward":6500.0},
	{"name":"BUY YOUR FIRST ASIC","goal":"asics","target":1,"reward":8000.0},
	{"name":"REACH 1 TH/s","goal":"hash","target":1000,"reward":12000.0},
	{"name":"OPEN THE DATA CENTER","goal":"tier","target":3,"reward":28000.0},
	{"name":"INSTALL A SERVER RACK","goal":"rack","target":1,"reward":32000.0},
	{"name":"REACH 5 TH/s","goal":"hash","target":5000,"reward":70000.0},
	{"name":"BUILD A 15-UNIT FARM","goal":"machines","target":15,"reward":150000.0}
]

var cash:float=1900.0
var coins:float=0.0
var total_earned:float=0.0
var tier:int=1
var grid_level:int=0
var contract_index:int=0
var daily_date:String=""
var last_saved:int=0
var placed:Array=[]
var selected_kind:String="gpu_1"
var world_root:Node3D
var equipment_root:Node3D
var tile_root:Node3D
var selected_tile:Vector2i=Vector2i(-1,-1)
var camera:Camera3D
var hud:FarmHUD
var hover_mesh:MeshInstance3D
var rotors:Array=[]
var total_hash:float=0.0
var total_power:float=0.0
var grid_power:float=0.0
var available_power:float=1900.0
var cooling_power:float=0.0
var temperature:float=28.0
var efficiency:float=1.0
var market:float=26.0
var coin_velocity:float=0.0
var power_bill:float=0.0
var tick_clock:float=0.0
var save_clock:float=0.0
var view_yaw:float=0.65
var view_pitch:float=0.78
var view_distance:float=38.0
var touch_down:Vector2=Vector2.ZERO
var pointer_down:bool=false
var touch_dragged:bool=false
var camera_target:Vector3=Vector3(0,1.1,0)
var warned_power:bool=false
var paused:bool=false
var message:String=""

func _boot_stage(stage:String)->void:
	var file:=FileAccess.open("user://dnch_farm_boot.txt",FileAccess.WRITE)
	if file!=null:
		file.store_string(stage)
		file.close()

func _ready()->void:
	_boot_stage("3D INITIALIZING")
	Input.set_emulate_mouse_from_touch(true)
	Engine.max_fps = 30 if bool(get_tree().root.get_meta("safe_mode",true)) else 60
	_load_progress()
	ART.apply_scene_lighting(self)
	if bool(get_tree().root.get_meta("safe_mode",true)):
		for n in get_children():
			if n is DirectionalLight3D:
				n.shadow_enabled=false
	_boot_stage("LIGHTS READY")
	_create_ambient_audio()
	world_root=Node3D.new()
	world_root.name="The Farm"
	add_child(world_root)
	equipment_root=Node3D.new()
	equipment_root.name="Mining Machines"
	add_child(equipment_root)
	tile_root=Node3D.new()
	tile_root.name="Placement Grid"
	add_child(tile_root)
	_create_camera()
	_boot_stage("CAMERA READY")
	_rebuild_room()
	_boot_stage("ROOM READY")
	_rebuild_equipment()
	_boot_stage("MACHINES READY")
	_create_hud()
	_boot_stage("HUD READY")
	_recalculate()
	if last_saved>0:
		var offline_seconds:float=minf(float(maxi(0,Time.get_unix_time_from_system()-last_saved)),7200.0)
		if offline_seconds>10.0:
			var offline_coins:float=coin_velocity*offline_seconds*.35
			coins+=offline_coins
			_notice("OFFLINE MINING: +%.1f DNCH" % offline_coins)
	_update_ui()
	_save_progress()
	_boot_stage("GAME ACTIVE")

func _create_ambient_audio()->void:
	var sample:Resource=load("res://audio/industrial_fans.wav")
	if sample is AudioStream:
		var ambience:=AudioStreamPlayer.new()
		ambience.stream=sample
		ambience.volume_db=-22.0
		add_child(ambience)
		ambience.finished.connect(func(): ambience.play() if is_instance_valid(ambience) else null)
		ambience.play()

func _create_camera()->void:
	camera=Camera3D.new()
	camera.name="Orbit Camera"
	camera.projection=Camera3D.PROJECTION_PERSPECTIVE
	camera.fov=54
	camera.near=.1
	camera.far=145.0
	camera.current=true
	add_child(camera)
	_orbit()

func _orbit()->void:
	var vx:=cos(view_yaw)*cos(view_pitch)
	var vy:=sin(view_pitch)
	var vz:=sin(view_yaw)*cos(view_pitch)
	camera.position=camera_target+Vector3(vx,vy,vz)*view_distance
	camera.look_at(camera_target,Vector3.UP)

func _rebuild_room()->void:
	for node in world_root.get_children():
		node.queue_free()
	ART.create_room(world_root,tier)
	if not bool(get_tree().root.get_meta("safe_mode",true)):
		DETAIL.palette(world_root,tier,false)
	_rebuild_tiles()

func _rebuild_tiles()->void:
	for node in tile_root.get_children():
		node.queue_free()
	# Subtle floor corner brackets replace the distracting cyan/orange X grid.
	var marker:=ART.mat("7daaa7",.20,.67,.25)
	for z in range(TILE_ROWS):
		for x in range(TILE_COLS):
			if not _is_unlocked(x,z):
				continue
			var p:=_tile_position(x,z)
			var min_x:float=-1.06
			var min_z:float=-1.0
			for flip in [-1.0,1.0]:
				for edge in [-1.0,1.0]:
					var ox:float=flip*1.05
					var oz:float=edge*1.0
					ART.block(tile_root,p+Vector3(ox,.022,oz),Vector3(.28,.008,.025),marker)
					ART.block(tile_root,p+Vector3(ox,.023,oz),Vector3(.025,.008,.28),marker)
	hover_mesh=ART.add_tile_highlight(tile_root,_tile_position(3,2)+Vector3(0,.045,0),true)
	hover_mesh.visible=false

func _rebuild_equipment()->void:
	for node in equipment_root.get_children():
		node.queue_free()
	for unit in placed:
		var visual:Node3D=ART.machine(str(unit.get("type","gpu_1")),bool(get_tree().root.get_meta("safe_mode",true)))
		visual.position=_tile_position(int(unit.get("x",3)),int(unit.get("z",2)))
		equipment_root.add_child(visual)
	rotors=get_tree().get_nodes_in_group("spin_fan")

func _create_hud()->void:
	hud=HUD_SCENE.new()
	add_child(hud)
	hud.command.connect(_on_command)
	hud.select_item(selected_kind)
	if message!="":
		hud.show_toast(message)
		message=""

func _tile_position(x:int,z:int)->Vector3:
	return Vector3((float(x)-3.0)*TILE_X,0,(float(z)-2.0)*TILE_Z)

func _is_unlocked(x:int,z:int)->bool:
	if tier==1:
		return x>=2 and x<=4 and z>=1 and z<=3
	if tier==2:
		return x>=1 and x<=5 and z>=0 and z<=4
	return x>=0 and x<TILE_COLS and z>=0 and z<TILE_ROWS

func _occupied(x:int,z:int)->bool:
	for unit in placed:
		if int(unit.get("x",-1))==x and int(unit.get("z",-1))==z:
			return true
	return false

func _selected_index()->int:
	for i in range(placed.size()):
		if int(placed[i].get("x",-1))==selected_tile.x and int(placed[i].get("z",-1))==selected_tile.y:
			return i
	return -1

func _upgrade_selected()->void:
	var idx:int=_selected_index()
	if idx<0:
		_notice("TAP AN INSTALLED MACHINE FIRST")
		return
	var typ:String=str(placed[idx].get("type",""))
	var next_types:Dictionary={"gpu_1":"gpu_2","gpu_2":"gpu_3","asic_1":"asic_2","fan":"cooler"}
	if not next_types.has(typ):
		_notice("THIS UNIT IS ALREADY MAX LEVEL")
		return
	var target:String=str(next_types[typ])
	var cost:float=ceil((float(TYPES[target]["price"])-float(TYPES[typ]["price"]))*0.85)
	if cash<cost:
		_notice("NEED $%.0f TO UPGRADE"%cost)
		return
	cash-=cost
	placed[idx]["type"]=target
	placed[idx]["health"]=1.0
	_rebuild_equipment()
	_recalculate()
	_notice("UPGRADED TO "+str(TYPES[target]["label"]).to_upper())
	_save_progress()

func _recycle_selected()->void:
	var idx:int=_selected_index()
	if idx<0:
		_notice("TAP AN INSTALLED MACHINE FIRST")
		return
	var typ:String=str(placed[idx].get("type","gpu_1"))
	var returned:float=floor(float(TYPES[typ]["price"])*.62*float(placed[idx].get("health",1.0)))
	cash+=returned
	placed.remove_at(idx)
	selected_tile=Vector2i(-1,-1)
	_rebuild_equipment()
	_recalculate()
	_notice("UNIT RECYCLED: +$%.0f"%returned)
	_save_progress()

func _on_command(action:String,value:String)->void:
	match action:
		"select":
			selected_kind=value
			hud.select_item(value) if hud.current_item!=value else _update_ui()
			_notice("SELECT A FREE FLOOR SLOT TO BUILD")
		"selected":
			selected_kind=value
			_update_ui()
		"sell":
			if coins<=0.0:
				_notice("NO COINS TO SELL YET")
			else:
				var earned:float=coins*market
				cash+=earned
				total_earned+=earned
				coins=0.0
				_notice("SOLD DNCH FOR $%.0f" % earned)
				_save_progress()
		"grid":
			var cost:=_grid_price()
			if cash<cost:
				_notice("NEED $%.0f FOR GRID UPGRADE"%cost)
			else:
				cash-=cost
				grid_level+=1
				_notice("ELECTRICAL GRID UPGRADED")
				_recalculate()
				_save_progress()
		"expand":
			if tier>=3:
				_notice("MAXIMUM FACILITY SIZE REACHED")
			else:
				var cost:=_expansion_price()
				if cash<cost:
					_notice("NEED $%.0f TO EXPAND"%cost)
				else:
					cash-=cost
					tier+=1
					_rebuild_room()
					_notice("FACILITY EXPANDED! NEW BUILD SLOTS UNLOCKED")
					_recalculate()
					_save_progress()
		"repair":
			var broken:int=0
			for unit in placed:
				if float(unit.get("health",1.0))<1.0:
					broken+=1
			if broken<=0:
				_notice("ALL MACHINES HEALTHY")
			elif cash<float(broken)*125.0:
				_notice("NEED $%.0f FOR REPAIRS" % (float(broken)*125.0))
			else:
				cash-=float(broken)*125.0
				for unit in placed:
					unit["health"]=1.0
				_notice("ALL MACHINES REPAIRED")
				_recalculate()
				_save_progress()
		"daily":
			var today:=Time.get_date_string_from_system()
			if daily_date==today:
				_notice("DAILY SUPPLY ALREADY CLAIMED")
			else:
				daily_date=today
				var amount:=float(900*tier)
				cash+=amount
				_notice("DAILY SUPPLY: +$%.0f"%amount)
				_save_progress()
		"zoom_in":
			view_distance=clampf(view_distance-2.0,25.0,65.0)
			_orbit()
		"zoom_out":
			view_distance=clampf(view_distance+2.0,25.0,65.0)
			_orbit()
		"upgrade_unit":
			_upgrade_selected()
		"recycle_unit":
			_recycle_selected()
		"claim":
			_claim_contract()
	_update_ui()

func _place(x:int,z:int)->void:
	if not _is_unlocked(x,z):
		_notice("EXPAND THE FACILITY TO UNLOCK THIS SLOT")
		return
	if _occupied(x,z):
		var kind:String=""
		for unit in placed:
			if int(unit.get("x",-1))==x and int(unit.get("z",-1))==z:
				kind=str(unit["type"])
				break
		selected_tile=Vector2i(x,z)
		_notice("SELECTED "+str(TYPES.get(kind,{}).get("label","MACHINE")).to_upper()+" - UPGRADE OR RECYCLE")
		_update_ui()
		return
	if not TYPES.has(selected_kind):
		return
	var info:Dictionary=TYPES[selected_kind]
	var cost:float=float(info.get("price",0.0))
	if cash<cost:
		_notice("INSUFFICIENT CASH - NEED $%.0f"%cost)
		return
	var projected:float=grid_power+float(info["watts"])-float(info["solar"])-float(info["extra"])
	if projected>available_power+2400.0:
		_notice("GRID OVERLOAD. UPGRADE YOUR POWER SYSTEM.")
		return
	cash-=cost
	selected_tile=Vector2i(x,z)
	placed.append({"type":selected_kind,"x":x,"z":z,"health":1.0})
	var visual:Node3D=ART.machine(selected_kind,bool(get_tree().root.get_meta("safe_mode",true)))
	visual.position=_tile_position(x,z)
	equipment_root.add_child(visual)
	rotors=get_tree().get_nodes_in_group("spin_fan")
	_recalculate()
	_notice("%s INSTALLED"%str(info["label"]).to_upper())
	_save_progress()
	_update_ui()

func _recalculate()->void:
	total_hash=0.0
	total_power=0.0
	cooling_power=0.0
	var solar:float=0.0
	var boost:float=0.0
	for unit in placed:
		var info:Dictionary=TYPES.get(str(unit.get("type","gpu_1")),{})
		var health:float=float(unit.get("health",1.0))
		var op:float=1.0 if health>0.01 else 0.0
		total_hash+=float(info.get("hash",0.0))*op
		total_power+=float(info.get("watts",0.0))*op
		cooling_power+=float(info.get("cool",0.0))*op
		solar+=float(info.get("solar",0.0))*op
		boost+=float(info.get("extra",0.0))*op
	grid_power=maxf(0.0,total_power-solar)
	available_power=1900.0+float(grid_level)*2400.0+boost
	temperature=clampf(28.0+total_power*.016-cooling_power*.020,18.0,130.0)
	efficiency=1.0
	if grid_power>available_power:
		efficiency*=.28
	if temperature>62.0:
		efficiency*=maxf(.12,1.0-(temperature-62.0)*.032)
	if cash<0:
		efficiency*=.2
	market=clampf(26.0+6.0*sin(float(Time.get_unix_time_from_system())*.007)+2.7*sin(float(Time.get_unix_time_from_system())*.031),10.0,50.0)
	coin_velocity=total_hash*.009*efficiency
	power_bill=grid_power*.00058

func _tick(seconds:float)->void:
	_recalculate()
	if total_hash>0.0:
		coins+=coin_velocity*seconds
	if grid_power>0.0:
		cash-=power_bill*seconds
	if cash< -2000.0:
		cash= -2000.0
	if temperature>90.0 and randf()<seconds*.018:
		for unit in placed:
			if str(unit.get("type","")).begins_with("gpu") or str(unit.get("type","")).begins_with("asic"):
				if float(unit.get("health",1.0))>0.1:
					unit["health"]=0.0
					_notice("HARDWARE OVERHEATED! REPAIR REQUIRED.")
					break
	if grid_power>available_power and not warned_power:
		_notice("POWER CAPACITY EXCEEDED - MINING SLOWED")
		warned_power=true
	if grid_power<=available_power:
		warned_power=false
	_update_ui()

func _contract_count(name:String)->float:
	match name:
		"miners":
			var number:int=0
			for unit in placed:
				if float(TYPES.get(str(unit.get("type","")),{}).get("hash",0.0))>0.0:
					number+=1
			return float(number)
		"machines":
			return float(placed.size())
		"coolers":
			var n:int=0
			for unit in placed:
				if str(unit.get("type",""))=="fan" or str(unit.get("type",""))=="cooler":
					n+=1
			return float(n)
		"asics":
			var n:int=0
			for unit in placed:
				if str(unit.get("type","")).begins_with("asic"):
					n+=1
			return float(n)
		"rack":
			for unit in placed:
				if str(unit.get("type",""))=="rack":
					return 1.0
		"tier":
			return float(tier)
		"hash":
			return total_hash
	return 0.0

func _claim_contract()->void:
	if contract_index>=CONTRACTS.size():
		if coins>=250.0:
			coins-=250.0
			cash+=11000.0
			_notice("REPEAT CONTRACT COMPLETE: +$11,000")
			_save_progress()
		else:
			_notice("MINE 250 DNCH TO COMPLETE THIS CONTRACT")
		return
	var c:Dictionary=CONTRACTS[contract_index]
	var progress:float=_contract_count(str(c["goal"]))
	if progress<float(c["target"]):
		_notice("CONTRACT IN PROGRESS: %.0f / %.0f"%[progress,float(c["target"])])
		return
	cash+=float(c["reward"])
	contract_index+=1
	_notice("CONTRACT COMPLETE: +$%.0f"%float(c["reward"]))
	_save_progress()

func _grid_price()->float:
	return 1400.0*pow(1.65,float(grid_level))

func _expansion_price()->float:
	return 8000.0 if tier==1 else 42000.0

func _update_ui()->void:
	if hud==null:
		return
	var count:int=0
	var desc:Dictionary={}
	for kind in TYPES.keys():
		var info:Dictionary=TYPES[kind]
		desc[kind]="Cost: $%.0f\nMining: %.0f GH/s\nDraw: %.0f watts\nCooling: %.0f units\nTap an empty slot to install." % [float(info["price"]),float(info["hash"]),float(info["watts"]),float(info["cool"])]
		desc["grid"]="Electrical grid upgrade"
	var warning:String=""
	if temperature>78.0:
		warning="OVERHEATING! INSTALL MORE COOLING."
	elif grid_power>available_power:
		warning="GRID OVERLOADED: UPGRADE ELECTRICAL CAPACITY."
	elif cash<0.0:
		warning="NEGATIVE BALANCE: SELL CRYPTO TO PAY THE BILL."
	if contract_index<CONTRACTS.size():
		var c:Dictionary=CONTRACTS[contract_index]
		var v:float=_contract_count(str(c["goal"]))
		message="%s  (%.0f/%.0f)"%[str(c["name"]),v,float(c["target"])]
	else:
		message="REPEAT: MINE AND DELIVER 250 DNCH"
	var reward:float=11000.0 if contract_index>=CONTRACTS.size() else float(CONTRACTS[contract_index]["reward"])
	var target_value:float=250.0
	var current_value:float=coins
	if contract_index<CONTRACTS.size():
		var active:Dictionary=CONTRACTS[contract_index]
		target_value=float(active["target"])
		current_value=_contract_count(str(active["goal"]))
	hud.update_data({
		"cash":cash,"coins":coins,"hash":total_hash,"power":grid_power,
		"capacity":available_power,"heat":temperature,"eff":efficiency,
		"mining_rate":coin_velocity*60.0,"bill_rate":power_bill*60.0,
		"market":market,"count":placed.size(),"slots":9 if tier==1 else (25 if tier==2 else 35),
		"facility":["","GARAGE","WORKSHOP","DATA CENTER"][tier],"tier":tier,
		"cooling":cooling_power,"mission":message,"mission_reward":reward,
		"descriptions":desc,"warning":warning,
		"mission_current":current_value,
		"mission_target":target_value,
		"mission_percent":100.0*current_value/maxf(1.0,target_value),
		"selected_unit":_selected_description()
	})

func _selected_description()->String:
	var idx:int=_selected_index()
	if idx>=0:
		var item:Dictionary=placed[idx]
		return str(TYPES.get(str(item.get("type","")),{}).get("label","MACHINE")).to_upper()+"  •  HEALTH "+str(int(float(item.get("health",1.0))*100))+"%"
	return "TAP A RIG TO UPGRADE IT"

func _notice(text:String)->void:
	message=text
	if hud!=null:
		hud.show_toast(text)

func _process(delta:float)->void:
	if paused:
		return
	for rotor in rotors:
		if is_instance_valid(rotor):
			rotor.rotation.z+=delta*10.2
	tick_clock+=delta
	save_clock+=delta
	if tick_clock>=.25:
		_tick(tick_clock)
		tick_clock=0.0
	if save_clock>=18.0:
		_save_progress()
		save_clock=0.0

func _unhandled_input(event:InputEvent)->void:
	if event is InputEventScreenTouch:
		if not _is_build_area(event.position):
			pointer_down = false
			return
		if event.pressed:
			pointer_down=true
			touch_dragged=false
			touch_down=event.position
		elif pointer_down:
			pointer_down=false
			if not touch_dragged:
				_place_from_screen(event.position)
	elif event is InputEventScreenDrag:
		if pointer_down:
			if touch_down.distance_to(event.position)>13.0:
				touch_dragged=true
			if touch_dragged:
				_rotate_by(event.relative)
	elif event is InputEventMouseButton:
		if event.button_index==MOUSE_BUTTON_LEFT and event.pressed and not OS.has_feature("mobile"):
			if _is_build_area(event.position):
				_place_from_screen(event.position)
		elif event.button_index==MOUSE_BUTTON_WHEEL_UP and event.pressed:
			view_distance=clampf(view_distance-1.5,25.0,65.0)
			_orbit()
		elif event.button_index==MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
			view_distance=clampf(view_distance+1.5,25.0,65.0)
			_orbit()
	elif event is InputEventMouseMotion:
		if Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
			_rotate_by(event.relative)

func _rotate_by(rel:Vector2)->void:
	view_yaw-=rel.x*.007
	view_pitch=clampf(view_pitch+rel.y*.004,.37,1.10)
	_orbit()

func _is_build_area(point:Vector2)->bool:
	var viewport_size:Vector2=get_viewport().get_visible_rect().size
	if viewport_size.x<=1.0 or viewport_size.y<=1.0:
		return false
	var x:float=point.x*720.0/viewport_size.x
	var y:float=point.y*1280.0/viewport_size.y
	return x>8.0 and x<712.0 and y>176.0 and y<936.0

func _place_from_screen(point:Vector2)->void:
	var start:Vector3=camera.project_ray_origin(point)
	var direction:Vector3=camera.project_ray_normal(point)
	if absf(direction.y)<.0001:
		return
	var distance:float=(0.12-start.y)/direction.y
	if distance<0.0:
		return
	var hit:Vector3=start+direction*distance
	var gx:int=roundi(hit.x/TILE_X+3.0)
	var gz:int=roundi(hit.z/TILE_Z+2.0)
	if gx<0 or gx>=TILE_COLS or gz<0 or gz>=TILE_ROWS:
		return
	selected_tile=Vector2i(gx,gz)
	var valid:bool=_is_unlocked(gx,gz) and not _occupied(gx,gz)
	hover_mesh.material_override=ART.mat("35e7cf",0.0,.6,1.8) if valid else ART.mat("f68661",0.0,.6,2.0)
	hover_mesh.position=_tile_position(gx,gz)+Vector3(0,.095,0)
	hover_mesh.visible=true
	_place(gx,gz)

func _save_progress()->void:
	var data:Dictionary={
		"cash":cash,"coins":coins,"total_earned":total_earned,
		"tier":tier,"grid_level":grid_level,"contract_index":contract_index,
		"daily_date":daily_date,"placed":placed,
		"last_saved":int(Time.get_unix_time_from_system())
	}
	var f:=FileAccess.open(SAVE_PATH,FileAccess.WRITE)
	if f!=null:
		f.store_string(JSON.stringify(data))
		f.close()

func _load_progress()->void:
	placed=[{"type":"gpu_1","x":3,"z":2,"health":1.0}]
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file:=FileAccess.open(SAVE_PATH,FileAccess.READ)
	if file==null:
		return
	var parsed=JSON.parse_string(file.get_as_text())
	file.close()
	if not (parsed is Dictionary):
		return
	cash=float(parsed.get("cash",1900.0))
	coins=float(parsed.get("coins",0.0))
	total_earned=float(parsed.get("total_earned",0.0))
	tier=clampi(int(parsed.get("tier",1)),1,3)
	grid_level=clampi(int(parsed.get("grid_level",0)),0,70)
	contract_index=clampi(int(parsed.get("contract_index",0)),0,CONTRACTS.size())
	daily_date=str(parsed.get("daily_date",""))
	last_saved=int(parsed.get("last_saved",0))
	var loaded=parsed.get("placed",[])
	if loaded is Array:
		placed=[]
		for item in loaded:
			if item is Dictionary:
				var typ:String=str(item.get("type","gpu_1"))
				var x:int=int(item.get("x",3))
				var z:int=int(item.get("z",2))
				if TYPES.has(typ) and x>=0 and x<TILE_COLS and z>=0 and z<TILE_ROWS and _is_unlocked(x,z):
					placed.append({"type":typ,"x":x,"z":z,"health":float(item.get("health",1.0))})

func _exit_tree()->void:
	_save_progress()
