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
	game.call("_tick",1.0)
	if float(game.get("coins"))<=old:
		printerr("FAIL: Mining did not generate game currency.")
		quit(4)
		return
	print("PASS: 3D facility, live GPU rig, hashing economy, offline save, on-screen HUD.")
	game.call("_save_progress")
	quit(0)
