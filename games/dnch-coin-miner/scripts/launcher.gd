extends Control
## Graphics-free Android startup to isolate native renderer failures.

var status_label: Label
var start_button: Button
var quality_button: Button

func _ready() -> void:
	var backdrop := ColorRect.new()
	backdrop.color = Color("0b1821")
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	backdrop.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(backdrop)
	var column := VBoxContainer.new()
	column.set_anchors_preset(Control.PRESET_CENTER)
	column.grow_horizontal = Control.GROW_DIRECTION_BOTH
	column.grow_vertical = Control.GROW_DIRECTION_BOTH
	column.custom_minimum_size = Vector2(650, 450)
	column.add_theme_constant_override("separation", 20)
	add_child(column)
	var title := Label.new()
	title.text = "DNCH COIN MINER"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 48)
	title.add_theme_color_override("font_color", Color("e9bb53"))
	column.add_child(title)
	var subtitle := Label.new()
	subtitle.text = "ANDROID COMPATIBILITY BUILD 0.3"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 22)
	subtitle.add_theme_color_override("font_color", Color("9fcecf"))
	column.add_child(subtitle)
	start_button = Button.new()
	start_button.text = "START MINING - SAFE GRAPHICS"
	start_button.custom_minimum_size = Vector2(600, 74)
	start_button.add_theme_font_size_override("font_size", 23)
	start_button.pressed.connect(_safe_start)
	column.add_child(start_button)
	quality_button = Button.new()
	quality_button.text = "HIGH GRAPHICS (BETA)"
	quality_button.custom_minimum_size = Vector2(600, 65)
	quality_button.add_theme_font_size_override("font_size", 20)
	quality_button.pressed.connect(_full_start)
	column.add_child(quality_button)
	status_label = Label.new()
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	status_label.custom_minimum_size = Vector2(600, 62)
	status_label.add_theme_font_size_override("font_size", 17)
	status_label.add_theme_color_override("font_color", Color("b5d6dc"))
	column.add_child(status_label)
	var previous := "No previous startup recorded."
	if FileAccess.file_exists("user://dnch_startup_stage.txt"):
		var file := FileAccess.open("user://dnch_startup_stage.txt", FileAccess.READ)
		if file != null:
			previous = "Last startup stage: " + file.get_as_text().strip_edges()
			file.close()
	status_label.text = previous + "\nSafe graphics loads fewer 3D resources."

func _safe_start() -> void:
	_launch(true)

func _full_start() -> void:
	_launch(false)

func _launch(safe: bool) -> void:
	start_button.disabled = true
	quality_button.disabled = true
	status_label.text = "LOADING MINE - " + ("SAFE GRAPHICS" if safe else "HIGH GRAPHICS")
	get_tree().root.set_meta("dnch_safe_mode", safe)
	var error := get_tree().change_scene_to_file("res://main.tscn")
	if error != OK:
		status_label.text = "COULD NOT START GAME. ERROR CODE: %d" % error
		start_button.disabled = false
		quality_button.disabled = false
