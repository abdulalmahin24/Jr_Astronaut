import bpy
import math

# Render EMU_Suit.glb with proper camera framing and lighting
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 800
scene.render.resolution_y = 1000

bpy.ops.import_scene.gltf(filepath="./public\models\EMU_Suit.glb")

# Fix materials to 100% OPAQUE
for mat in bpy.data.materials:
    mat.blend_method = 'OPAQUE'
    if hasattr(mat, 'shadow_method'):
        mat.shadow_method = 'OPAQUE'

# Camera looking at EMU suit
cam_data = bpy.data.cameras.new("Cam")
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
# EMU suit is Y=0 to 2, Z is front/back
cam_obj.location = (0, -3.2, 0.0)
cam_obj.rotation_euler = (math.radians(90), 0, 0)

# Sunlight
sun_data = bpy.data.lights.new("Sun", type='SUN')
sun_data.energy = 4.0
sun = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(45), math.radians(25), 0)

# Fill Light
fill_data = bpy.data.lights.new("Fill", type='SUN')
fill_data.energy = 2.0
fill = bpy.data.objects.new("Fill", fill_data)
scene.collection.objects.link(fill)
fill.rotation_euler = (math.radians(120), math.radians(-30), 0)

out_path = "./scratch/render_emu_real.png"
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print("Rendered EMU to:", out_path)
