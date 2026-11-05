
import bpy
import math
import mathutils

# 1. Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# 2. Add camera and lights
scene = bpy.context.scene
scene.render.resolution_x = 800
scene.render.resolution_y = 1000

cam_data = bpy.data.cameras.new('Camera')
cam = bpy.data.objects.new('Camera', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

# Light
light_data = bpy.data.lights.new('Sun', type='SUN')
light_data.energy = 3.0
light = bpy.data.objects.new('Sun', light_data)
scene.collection.objects.link(light)
light.rotation_euler = (math.radians(45), math.radians(20), math.radians(30))

# Ambient fill light
light_fill_data = bpy.data.lights.new('Fill', type='SUN')
light_fill_data.energy = 1.5
light_fill = bpy.data.objects.new('Fill', light_fill_data)
scene.collection.objects.link(light_fill)
light_fill.rotation_euler = (math.radians(-30), math.radians(-40), math.radians(120))

# Import Astronaut.glb
bpy.ops.import_scene.gltf(filepath='public/models/Astronaut.glb')

# Center and frame
mesh_objs = [o for o in scene.objects if o.type == 'MESH']
if mesh_objs:
    # Compute bounds
    min_co = [float('inf')]*3
    max_co = [float('-inf')]*3
    for obj in mesh_objs:
        for v in obj.bound_box:
            world_v = obj.matrix_world @ mathutils.Vector(v)
            for i in range(3):
                min_co[i] = min(min_co[i], world_v[i])
                max_co[i] = max(max_co[i], world_v[i])
    center = [(min_co[i] + max_co[i])/2 for i in range(3)]
    size = [max_co[i] - min_co[i] for i in range(3)]
    max_dim = max(size)
    print('Bounds:', min_co, max_co, 'Center:', center, 'Size:', size)

    # Place camera in front of center
    cam.location = (center[0], center[1] - max_dim * 1.8, center[2])
    cam.rotation_euler = (math.radians(90), 0, 0)

bpy.context.scene.render.filepath = 'public/models/test_astronaut_render.png'
bpy.ops.render.render(write_still=True)
print('Astronaut render saved')

# Now test EMU_Suit.glb
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 800
scene.render.resolution_y = 1000
cam_data = bpy.data.cameras.new('Camera')
cam = bpy.data.objects.new('Camera', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
light_data = bpy.data.lights.new('Sun', type='SUN')
light_data.energy = 3.0
light = bpy.data.objects.new('Sun', light_data)
scene.collection.objects.link(light)
light.rotation_euler = (math.radians(45), math.radians(20), math.radians(30))
light_fill_data = bpy.data.lights.new('Fill', type='SUN')
light_fill_data.energy = 1.5
light_fill = bpy.data.objects.new('Fill', light_fill_data)
scene.collection.objects.link(light_fill)
light_fill.rotation_euler = (math.radians(-30), math.radians(-40), math.radians(120))

bpy.ops.import_scene.gltf(filepath='public/models/EMU_Suit.glb')
mesh_objs = [o for o in scene.objects if o.type == 'MESH']
if mesh_objs:
    min_co = [float('inf')]*3
    max_co = [float('-inf')]*3
    for obj in mesh_objs:
        for v in obj.bound_box:
            world_v = obj.matrix_world @ mathutils.Vector(v)
            for i in range(3):
                min_co[i] = min(min_co[i], world_v[i])
                max_co[i] = max(max_co[i], world_v[i])
    center = [(min_co[i] + max_co[i])/2 for i in range(3)]
    size = [max_co[i] - min_co[i] for i in range(3)]
    max_dim = max(size)
    print('EMU Bounds:', min_co, max_co, 'Center:', center, 'Size:', size)
    cam.location = (center[0], center[1] - max_dim * 1.8, center[2])
    cam.rotation_euler = (math.radians(90), 0, 0)

bpy.context.scene.render.filepath = 'public/models/test_emu_render.png'
bpy.ops.render.render(write_still=True)
print('EMU render saved')
