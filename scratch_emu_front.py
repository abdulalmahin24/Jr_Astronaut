import bpy
import math

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 800
scene.render.resolution_y = 1000

bpy.ops.import_scene.gltf(filepath='public/models/EMU_Suit.glb')

cam_data = bpy.data.cameras.new('Camera')
cam = bpy.data.objects.new('Camera', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

sun_data = bpy.data.lights.new('Sun', type='SUN')
sun_data.energy = 3.5
sun = bpy.data.objects.new('Sun', sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(30), math.radians(20), math.radians(-30))

emu = bpy.data.objects.get('Extravehicular Mobility Unit')
mesh = emu.data
min_v = [min(v.co[i] for v in mesh.vertices) for i in range(3)]
max_v = [max(v.co[i] for v in mesh.vertices) for i in range(3)]
center = [(min_v[i] + max_v[i])/2 for i in range(3)]

# Y is UP, Z is DEPTH, X is LEFT/RIGHT
cam.location = (center[0], center[1], center[2] + 2.8)
cam.rotation_euler = (0, 0, 0)

scene.render.filepath = 'public/models/emu_front.png'
bpy.ops.render.render(write_still=True)
print('Done!')
