extends Control
## World-space geological scanner. High-yield cells are real and match mining rolls.
## The scan reveals the same deterministic geology function used by digging.

var source = null
const MARGIN: float = 10.0
const CELLS: int = 13

func _draw() -> void:
	if source == null or source.player == null:
		return
	var top: float = 22.0
	var side: float = minf(size.x - 2.0 * MARGIN, size.y - top - 9.0)
	var start: Vector2 = Vector2((size.x - side) * 0.5, top)
	var cell: float = side / float(CELLS)
	var reveal: bool = source.scan_reveal_time > 0.0
	draw_rect(Rect2(Vector2.ZERO, size), Color("091e2a"), true)
	for z in range(CELLS):
		for x in range(CELLS):
			var wx: float = -15.0 + (float(x) + 0.5) / float(CELLS) * 30.0
			var wz: float = -15.0 + (float(z) + 0.5) / float(CELLS) * 30.0
			var yield_value: float = source._ore_richness(wx, wz, 0.8)
			var level: float = 0.22 + yield_value * 0.40
			var color: Color = Color(0.09 + level * .13, 0.25 + level * .35, 0.32 + level * .18, 1.0)
			if reveal:
				if yield_value > 0.72:
					color = Color("e0ae50")
				elif yield_value > 0.56:
					color = Color("9db85a")
				else:
					color = Color("246478")
			var rect := Rect2(start + Vector2(x * cell, z * cell), Vector2(cell - 1.2, cell - 1.2))
			draw_rect(rect, color, true)
	var camp: Vector2 = _map_pos(Vector2(-10.0, -9.0), start, side)
	draw_circle(camp, 5.2, Color("ffd08d"))
	draw_arc(camp, 9, 0, TAU, 18, Color("f1cf72"), 1.5)
	var here: Vector2 = _map_pos(Vector2(source.player.position.x, source.player.position.z), start, side)
	draw_circle(here, 5.5, Color("ffffff"))
	draw_arc(here, 9, 0, TAU, 18, Color("6ce8ed"), 2.0)
	var facing: float = source.player.rotation.y
	draw_line(here, here + Vector2(-sin(facing), -cos(facing)) * 13, Color("ebffff"), 2.0)
	if reveal:
		draw_arc(here, 11 + (8 - source.scan_reveal_time) * 2.0, 0, TAU, 32, Color("50d7de"), 1.2)
	var heading: String = "GEOLOGICAL SURVEY" if reveal else "TOPOGRAPHIC MAP"
	draw_string(ThemeDB.fallback_font, Vector2(11, 17), heading, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("cff3ef"))
	if reveal:
		draw_string(ThemeDB.fallback_font, Vector2(11, size.y - 1), "GOLD = HIGH YIELD", HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color("edd49a"))
	else:
		draw_string(ThemeDB.fallback_font, Vector2(11, size.y - 1), "USE GEO SCAN TO REVEAL ORE", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color("96bbc5"))

func _map_pos(world_xz: Vector2, start: Vector2, side: float) -> Vector2:
	return start + Vector2((world_xz.x + 15.0) / 30.0 * side, (world_xz.y + 15.0) / 30.0 * side)