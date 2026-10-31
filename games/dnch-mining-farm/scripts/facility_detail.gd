extends RefCounted
class_name FacilityDetail

const ART = preload("res://scripts/art.gd")

static func pipe(parent: Node3D, p: Vector3, length: float, horizontal: bool, color: Material) -> void:
	var tube := ART.cylinder(parent, p, .075, length, color, 10)
	if horizontal:
		tube.rotation.z=PI * .5

static func terminal(parent:Node3D, p:Vector3, screen_label:String) -> void:
	var body:=ART.mat("1c2c36",.45,.4)
	var screen:=ART.mat("0d4255",.12,.28,1.25)
	var blue:=ART.mat("58c2dd",.12,.4,1.5)
	ART.block(parent,p+Vector3(0,.60,0),Vector3(.92,.11,.56),body)
	ART.block(parent,p+Vector3(0,.99,-.23),Vector3(.81,.53,.12),body)
	ART.block(parent,p+Vector3(0,1.00,-.15),Vector3(.72,.42,.018),screen)
	for i in range(6):
		var h:=.05+.025*float((i*7+2)%5)
		ART.block(parent,p+Vector3(-.25+i*.095,.88+h*.5,-.128),Vector3(.052,h,.012),blue)
	ART.block(parent,p+Vector3(0,.58,.20),Vector3(.46,.02,.15),ART.mat("59646f",.48,.45))
	ART.add_sign(parent,screen_label,p+Vector3(0,1.43,-.23),19,"b3dbe5")

static func tree(parent:Node3D, p:Vector3, size:float, premium:bool) -> void:
	var planter:=ART.mat("536a73",.45,.46)
	var soil:=ART.mat("352e25",.02,.9)
	var trunk:=ART.mat("856849",.04,.9)
	var leaves:=ART.mat("25735e" if premium else "2d674e",.0,.78)
	ART.cylinder(parent,p+Vector3(0,.24,0),.48,.49,planter,10)
	ART.cylinder(parent,p+Vector3(0,.49,0),.40,.05,soil,10)
	ART.cylinder(parent,p+Vector3(0,.91,0),.095,.90,trunk,8)
	for j in range(5):
		var a:=float(j)*TAU/5.0
		ART.sphere(parent,p+Vector3(cos(a)*.27,1.42+float(j%2)*.12,sin(a)*.28),.40*size,leaves)
	ART.sphere(parent,p+Vector3(0,1.68,0),.50*size,leaves)

static func guard_rail(parent:Node3D, p:Vector3, long_side:bool, length:float) -> void:
	var steel:=ART.mat("4c646f",.7,.32)
	var count:int=int(length/1.5)+1
	for k in range(count+1):
		var z:float=(-length/2.0)+float(k)*(length/float(count))
		var loc:Vector3=p+(Vector3(0,0,z) if long_side else Vector3(z,0,0))
		ART.block(parent,loc+Vector3(0,.57,0),Vector3(.06,1.14,.06),steel)
	ART.block(parent,p+Vector3(0,1.15,0),Vector3(.06,.08,length) if long_side else Vector3(length,.08,.06),steel)
	ART.block(parent,p+Vector3(0,.60,0),Vector3(.05,.055,length) if long_side else Vector3(length,.055,.05),steel)

static func solar_bank(parent: Node3D,p:Vector3,pieces:int) -> void:
	var frame:=ART.mat("6d8696",.8,.25)
	var panel:=ART.mat("122c53",.35,.20)
	var strip:=ART.mat("648bae",.68,.24)
	for n in range(pieces):
		var s:=p+Vector3(float(n%3)*1.82,0,float(n/3)*1.45)
		ART.block(parent,s+Vector3(0,.31,0),Vector3(.05,.63,.08),frame)
		var glass:=ART.block(parent,s+Vector3(0,.78,0),Vector3(1.65,.075,1.24),panel)
		glass.rotation.x=-.27
		for j in range(4):
			ART.block(parent,s+Vector3(-.57+float(j)*.38,.818,0),Vector3(.012,.016,1.15),strip)
		for j in range(2):
			ART.block(parent,s+Vector3(0,.82,-.38+float(j)*.76),Vector3(1.58,.013,.012),strip)

static func transformer(parent:Node3D,p:Vector3) -> void:
	var steel:=ART.mat("9babb3",.7,.33)
	var dark:=ART.mat("1b2c38",.44,.44)
	var gold:=ART.mat("e2ae62",.12,.34,1.1)
	ART.block(parent,p+Vector3(0,.74,0),Vector3(2.2,1.36,1.3),steel)
	ART.block(parent,p+Vector3(0,1.44,0),Vector3(2.26,.12,1.34),dark)
	for i in range(7):
		var x:float=-.86+float(i)*.286
		ART.block(parent,p+Vector3(x,.75,.677),Vector3(.07,.90,.03),dark)
	for i in range(3):
		ART.cylinder(parent,p+Vector3(-.65+float(i)*.65,1.65,-.1),.14,.35,dark,12)
		ART.cylinder(parent,p+Vector3(-.65+float(i)*.65,1.88,-.1),.095,.10,gold,12)
	ART.block(parent,p+Vector3(0,.45,.69),Vector3(.57,.13,.025),gold)

static func corporate_office(parent:Node3D,p:Vector3,premium:bool)->void:
	var steel:=ART.mat("546d78",.75,.28)
	var panels:=ART.mat("152a37",.35,.4)
	var glass:=ART.mat("255970",.40,.19)
	glass.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA
	glass.albedo_color.a=.40
	var gold:=ART.mat("f6c77a",.19,.33,2.4)
	ART.block(parent,p+Vector3(0,.05,0),Vector3(5.4,.1,3.25),panels)
	for x in [-2.68,2.68]:
		for z in [-1.58,1.58]:
			ART.block(parent,p+Vector3(x,1.62,z),Vector3(.11,3.24,.11),steel)
	ART.block(parent,p+Vector3(0,3.25,0),Vector3(5.55,.22,3.40),panels)
	ART.block(parent,p+Vector3(0,3.02,1.64),Vector3(5.30,.08,.08),gold)
	ART.block(parent,p+Vector3(0,1.61,1.60),Vector3(5.25,2.93,.045),glass)
	ART.block(parent,p+Vector3(-2.67,1.61,0),Vector3(.045,2.90,3.1),glass)
	ART.block(parent,p+Vector3(2.67,1.61,0),Vector3(.045,2.90,3.1),glass)
	ART.add_sign(parent,"DNCH  /  CONTROL CENTER",p+Vector3(0,3.64,1.67),31,"ffd28e")
	for x in [-1.45,0.0,1.45]:
		terminal(parent,p+Vector3(x,0,-.4),"STATUS")
	if premium:
		tree(parent,p+Vector3(2.2,0,1.15),.65,true)

static func cooling_system(parent:Node3D,p:Vector3,high_end:bool) -> void:
	var alloy:=ART.mat("a6bfc8",.76,.28)
	var dark:=ART.mat("273947",.50,.28)
	var blue:=ART.mat("328ba5",.40,.28,1.4)
	var count:int=3 if high_end else 2
	for i in range(count):
		var q:=p+Vector3(float(i)*1.85,0,0)
		ART.block(parent,q+Vector3(0,1.05,0),Vector3(1.55,1.83,1.55),alloy)
		for j in range(2):
			ART.block(parent,q+Vector3(0,.35+float(j)*.80,.81),Vector3(1.30,.13,.04),dark)
		ART.block(parent,q+Vector3(0,1.98,0),Vector3(1.65,.13,1.66),dark)
		for j in range(3):
			var vent:=ART.block(parent,q+Vector3(-.49+float(j)*.49,2.08,0),Vector3(.20,.06,1.25),dark)
		if i>0:
			pipe(parent,q+Vector3(-.9,.48,-.5),1.85,true,blue)
	ART.add_sign(parent,"LIQUID COOLING",p+Vector3(float(count-1)*.95,2.54,-.35),25,"75d6fa")

static func cable_run(parent:Node3D,p:Vector3,length:float) -> void:
	var frame:=ART.mat("475e69",.64,.33)
	var cable:=ART.mat("d7a65e",.38,.45,.88)
	for j in range(3):
		ART.block(parent,p+Vector3(-.12+float(j)*.12,0,0),Vector3(.065,.06,length),cable)
	for i in range(9):
		var z=-length*.5+float(i)*(length/8.0)
		ART.block(parent,p+Vector3(0,-.03,z),Vector3(.56,.04,.07),frame)
	for x in [-.32,.32]:
		ART.block(parent,p+Vector3(x,-.02,0),Vector3(.035,.12,length),frame)

static func palette(parent:Node3D,tier:int,safe_mode:bool) -> void:
	# All geometry is outside buildable grid: player placement remains unobstructed.
	var root:=Node3D.new()
	root.name="FacilityDetails"
	parent.add_child(root)
	var dark:=ART.mat("192932",.34,.42)
	var stripe:=ART.mat("dfa64c",.22,.45,1.5)
	var blue:=ART.mat("65d5f3",.08,.45,1.5)
	ART.add_sign(root,"DNCH  /  OPERATIONS",Vector3(-5.3,4.5,-7.15),30,"fff1d5")
	ART.add_sign(root,"GPU ZONE",Vector3(-2.5,3.86,-7.14),29,"f5be80")
	ART.add_sign(root,"ASIC ZONE",Vector3(2.8,3.86,-7.14),29,"80dcf7")
	ART.add_sign(root,"POWER  /  COMPUTE  /  GROW",Vector3(0,5.02,-7.05),23,"c1eced")
	# Decorative lighting and rack zones on the edges.
	for k in range(4):
		var x=-7.2+float(k)*4.7
		ART.block(root,Vector3(x,6.2,-6.4),Vector3(1.95,.07,.11),stripe)
	for k in range(5):
		var z=-6.7+float(k)*2.95
		ART.block(root,Vector3(-10.6,2.1,z),Vector3(.1,1.5,.15),blue)
		if not safe_mode:
			ART.block(root,Vector3(10.7,1.2,z),Vector3(.11,1.7,.1),stripe)
	# Side industrial conduits run around the placement floor.
	cable_run(root,Vector3(-9.55,2.55,0),13.5)
	cable_run(root,Vector3(9.55,2.55,0),13.5)
	for k in range(3):
		var z=-5.7+float(k)*5.0
		pipe(root,Vector3(-10.75,2.8,z),.5,true,blue)
		transformer(root,Vector3(-9.0,0,z))
	# No decoration blocks player placement slots.
	guard_rail(root,Vector3(-10.25,0,0),true,13.2)
	guard_rail(root,Vector3(10.25,0,0),true,13.2)
	# Visible perimeter manufacturing equipment, solar, HVAC and offices.
	solar_bank(root,Vector3(-7.0,0,10.2),3 if safe_mode else 6)
	cooling_system(root,Vector3(2.0,0,10.8),tier>=2)
	ART.add_sign(root,"SOLAR PLANT",Vector3(-4.8,2.9,10),29,"f8c86d")
	for j in range(3):
		tree(root,Vector3(9.4,0,-5.9+float(j)*5.8),.75,tier>=2)
	if tier>=2:
		corporate_office(root,Vector3(0,0,16.6),tier>=3)
		for x in [-6.8,6.8]:
			ART.block(root,Vector3(x,.23,15.2),Vector3(.8,.4,6.0),dark)
		ART.add_sign(root,"SECURE SERVER OPERATIONS",Vector3(0,4.5,16.6),29,"f1cf89")
	if tier>=3:
		for x in [-7.5,7.5]:
			ART.block(root,Vector3(x,.06,15.5),Vector3(3.1,.12,9.0),dark)
			for j in range(3):
				ART.block(root,Vector3(x,2.2,12.2+float(j)*2.2),Vector3(2.9,.11,.14),stripe)
		ART.add_sign(root,"DNCH  /  DATA CENTER",Vector3(0,6.2,-7.2),40,"f2bc64")
