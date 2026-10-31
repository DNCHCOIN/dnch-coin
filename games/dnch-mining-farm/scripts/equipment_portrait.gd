extends Control
class_name EquipmentPortrait

var kind: String = "gpu_1"
var pulse: float = 0.0

const METAL = Color("7e9ba9")
const METAL_LIGHT = Color("afc1c7")
const DARK = Color("142b37")
const CYAN = Color("49d5ef")
const AMBER = Color("f3b95d")
const GREEN = Color("66d4ab")

func _process(delta:float) -> void:
	pulse += delta
	if pulse >= .16:
		pulse=0.0
		queue_redraw()

func _panel(r:Rect2,fill:Color,stroke:Color=METAL)->void:
	draw_rect(r,fill)
	draw_rect(r,stroke,false,1.2)

func _fan(c:Vector2,r:float,light:Color)->void:
	draw_circle(c,r+3,Color("172b34"))
	draw_arc(c,r,0.0,TAU,28,light,2.6,true)
	draw_circle(c,r*.55,DARK)
	for j in range(5):
		var a=float(j)*TAU/5.0+pulse*2
		var origin=c+Vector2(cos(a),sin(a))*r*.24
		draw_line(origin,origin+Vector2(cos(a+0.6),sin(a+0.6))*r*.58,METAL_LIGHT,3.0,true)
	draw_circle(c,r*.16,light)

func _ready()->void:
	custom_minimum_size=Vector2(150,79)
	mouse_filter=Control.MOUSE_FILTER_IGNORE

func _draw()->void:
	var w:=size.x
	var h:=size.y
	draw_rect(Rect2(Vector2.ZERO,size),Color("182d3b"))
	for j in range(3):
		draw_line(Vector2(0,12+j*23),Vector2(w,12+j*23),Color(0.2,0.34,0.42,.3),1.0)
	for j in range(7):
		draw_line(Vector2(j*w/6,0),Vector2(j*w/6,h),Color(0.2,.34,.42,.2),1)
	var box=Rect2(16,12,w-32,h-23)
	match kind:
		"gpu_1","gpu_2","gpu_3":
			_panel(box,Color("253d48"))
			for y in range(2):
				draw_line(Vector2(22,20+y*29),Vector2(w-22,20+y*29),METAL,2.0,true)
			var n=3 if kind=="gpu_1" else (4 if kind=="gpu_2" else 5)
			for i in range(n):
				_fan(Vector2(29+float(i)*(w-58)/float(n-1),h*.49),minf(13.0,68.0/float(n)),CYAN if i%2==0 else AMBER)
			_panel(Rect2(25,h-14,w-50,4),Color("30464d"),METAL)
		"asic_1","asic_2":
			_panel(box,Color("72858f"))
			_panel(Rect2(22,18,w-44,h-35),Color("344b56"))
			_fan(Vector2(w*.40,h*.49),19,CYAN)
			_fan(Vector2(w*.72,h*.49),19,CYAN if kind=="asic_2" else AMBER)
			for i in range(3):
				draw_rect(Rect2(24+i*11,14,7,2),AMBER)
		"fan":
			_panel(box,Color("5b707a"))
			_fan(Vector2(w*.50,h*.48),27,CYAN)
		"cooler":
			_panel(box,Color("8aaab7"))
			_panel(Rect2(29,22,w-58,h-43),Color("294758"))
			for i in range(6):
				draw_line(Vector2(31+i*(w-62)/6,23),Vector2(31+i*(w-62)/6,h-23),CYAN,1.7)
			draw_rect(Rect2(w*.69,16,10,5),GREEN)
		"solar":
			var coords=PackedVector2Array([Vector2(35,14),Vector2(w-16,21),Vector2(w-29,h-20),Vector2(18,h-27)])
			draw_colored_polygon(coords,Color("143a64"))
			for i in range(1,5):
				var dx=float(i)*w/5
				draw_line(Vector2(20+dx*.66,18+dx*.07),Vector2(9+dx*.76,h-25),METAL_LIGHT,1.0)
			for j in range(2):
				draw_line(Vector2(27,30+j*13),Vector2(w-24,37+j*13),CYAN,1)
		"battery":
			_panel(box,Color("9aaab3"))
			for i in range(3):
				_panel(Rect2(26+i*(w-52)/3.0,21,(w-65)/3.0,h-41),DARK)
				draw_rect(Rect2(31+i*(w-52)/3.0,h-28,(w-80)/3.0,4),GREEN)
		"rack":
			_panel(box,Color("435b68"))
			for i in range(2):
				for j in range(3):
					_panel(Rect2(25+i*(w-44)/2.0,19+j*(h-30)/3.0,(w-55)/2.0,(h-41)/3.0),Color("243a43"))
					_fan(Vector2(47+i*(w-44)/2.0,25+j*(h-30)/3.0),6,CYAN)
		_:
			_panel(box,DARK)
	draw_line(Vector2(19,h-6),Vector2(w-19,h-6),AMBER,2.0,true)
