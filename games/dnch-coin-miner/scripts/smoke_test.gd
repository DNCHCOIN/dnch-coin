extends SceneTree

func _initialize() -> void:
	call_deferred("_run_checks")

func _run_checks() -> void:
	var root_scene: PackedScene = load("res://main.tscn")
	if root_scene == null:
		push_error("Main scene could not be loaded.")
		quit(1)
		return
	var game: Variant = root_scene.instantiate()
	root.add_child(game)
	await process_frame
	if game.terrain == null or game.terrain.mesh == null:
		push_error("3D terrain missing.")
		quit(2)
		return
	if game.player == null or game.camera == null:
		push_error("Player or camera missing.")
		quit(3)
		return
	var vertex_before: float = game.heights[32 * 65 + 32]
	# Position player at origin looking toward -Z to guarantee that the dig is in bounds.
	game.player.position = Vector3(0, 0, 1.4)
	game.player.rotation.y = 0.0
	game._dig()
	var vertex_after: float = game.heights[32 * 65 + 32]
	if vertex_after >= vertex_before:
		push_error("Digging did not deform the terrain.")
		quit(4)
		return
	if game.total_digs < 1:
		push_error("Digging counter did not advance.")
		quit(5)
		return
	var rich_a: float = game._ore_richness(1.0, 2.0, 0.2)
	var rich_b: float = game._ore_richness(1.0, 2.0, 0.2)
	if absf(rich_a - rich_b) > 0.00001:
		push_error("Geology must be deterministic.")
		quit(6)
		return
	game._perform_scan()
	if game.scan_reveal_time <= 0.0 or game.scan_cooldown <= 0.0:
		push_error("Geoscanner did not reveal deposits.")
		quit(7)
		return
	game._toggle_eco_mode()
	if not game.eco_mode:
		push_error("Battery saver toggle failed.")
		quit(8)
		return
	print("PASS: terrain, miner, camera, digging, deterministic ore, GEO SCAN and battery saver.")
	game.queue_free()
	quit(0)