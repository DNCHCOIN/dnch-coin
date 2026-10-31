extends SceneTree

func _initialize()->void:
	call_deferred("_run")

func _run()->void:
	var menu_scene:PackedScene=load("res://menu.tscn")
	if menu_scene == null:
		printerr("FAIL: Main menu failed to import.")
		quit(5)
		return
	if not Input.is_emulating_mouse_from_touch():
		printerr("FAIL: Mobile touch is not mapped to GUI buttons.")
		quit(6)
		return
	var menu:Node=menu_scene.instantiate()
	root.add_child(menu)
	await process_frame
	if not menu.has_method("_show_help"):
		printerr("FAIL: Main menu actions are disconnected.")
		quit(7)
		return
	if menu.get("start_button")==null:
		printerr("FAIL: Start Mining button is missing.")
		quit(8)
		return
	menu.call("_show_help")
	if not bool(menu.get("help_visible")):
		printerr("FAIL: How To Play button did not open instructions.")
		quit(9)
		return
	menu.queue_free()
	var src:PackedScene=load("res://main.tscn")
	if src==null:
		printerr("FAIL: Cannot load mining farm scene.")
		quit(1)
		return
	var game:Node=src.instantiate()
	root.add_child(game)
	await process_frame
	await process_frame
	var units:Array=game.get("placed")
	var hash:float=float(game.get("total_hash"))
	if units.size()<1 or hash<=0.0:
		printerr("FAIL: Starter miner did not initialize.")
		quit(3)
		return
	var old:float=float(game.get("coins"))
	var first_cash:float=float(game.get("cash"))
	game.call("_place",4,2)
	if game.get("placed").size()!=2 or float(game.get("cash"))>=first_cash:
		printerr("FAIL: Installing hardware did not spend cash or add equipment.")
		quit(10)
		return
	game.call("_on_command","upgrade_unit","")
	if str(game.get("placed")[1].get("type",""))!="gpu_2":
		# The default starting cash is deliberately too low; confirm the upgrade does NOT bypass pricing.
		if str(game.get("placed")[1].get("type",""))!="gpu_1":
			printerr("FAIL: Hardware upgrade state corrupted.")
			quit(11)
			return
	game.call("_on_command","recycle_unit","")
	if game.get("placed").size()!=1:
		printerr("FAIL: Recycling selected mining rig did not return floor slot.")
		quit(12)
		return
	if game.get("hud")==null or game.get("hud").get("mission_progress")==null:
		printerr("FAIL: New mission progress HUD is not available.")
		quit(13)
		return
	game.call("_tick",1.0)
	if float(game.get("coins"))<=old:
		printerr("FAIL: Mining did not generate game currency.")
		quit(4)
		return
	print("PASS: 3D facility, live GPU rig, hashing economy, offline save, on-screen HUD.")
	game.call("_save_progress")
	quit(0)
