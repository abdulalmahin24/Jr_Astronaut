
import bpy
import math
import mathutils

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 800
scene.render.resolution_y = 1000

# Import EMU_Suit
bpy.ops.import_scene.gltf(filepath='public/models/EMU_Suit.glb')

cam_data = bpy.data.cameras.new('Camera')
cam = bpy.data.objects.new('Camera', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

# Light
light_data = bpy.data.lights.new('Sun', type='SUN')
light_data.energy = 4.0
light = bpy.data.objects.new('Sun', light_data)
scene.collection.objects.link(light)
light.rotation_euler = (math.radians(50), math.radians(20), math.radians(30))

# EMU obj
emu = bpy.data.objects.get('Extravehicular Mobility Unit')
print('EMU location:', emu.location, 'dimensions:', emu.dimensions)

# In Blender, where is the center of EMU?
# Look from front: camera on Y axis
cam.location = (0, -3.5, 1.0)
cam.rotation_euler = (math.radians(90), 0, 0)

scene.render.filepath = r'C:\Users\user\.gemini\antigravity-ide\brain\f32f3914-f53b-4e5d-8152-0c32e556920a\emu_proper_render.png'
bpy.ops.render.render(write_still=True)
print('EMU rendered successfully!')
