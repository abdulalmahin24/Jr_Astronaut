import bpy
import math

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 800
scene.render.resolution_y = 1000

bpy.ops.import_scene.gltf(filepath='public/models/ACES_Suit.glb')

cam_data = bpy.data.cameras.new('Camera')
cam = bpy.data.objects.new('Camera', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

sun_data = bpy.data.lights.new('Sun', type='SUN')
sun_data.energy = 2.5
sun = bpy.data.objects.new('Sun', sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(50), math.radians(20), math.radians(30))

# Frame on objects
mesh_objs = [o for o in scene.objects if o.type == 'MESH']
if mesh_objs:
    min_co = [float('inf')]*3
    max_co = [float('-inf')]*3
    for obj in mesh_objs:
        for v in obj.bound_box:
            import mathutils
            world_v = obj.matrix_world @ mathutils.Vector(v)
            for i in range(3):
                min_co[i] = min(min_co[i], world_v[i])
                max_co[i] = max(max_co[i], world_v[i])
    center = [(min_co[i] + max_co[i])/2 for i in range(3)]
    size = [max_co[i] - min_co[i] for i in range(3)]
    max_dim = max(size)
    print('ACES bounds:', min_co, max_co, 'Center:', center, 'Size:', size)
    cam.location = (center[0], center[1] - max_dim * 1.8, center[2])
    cam.rotation_euler = (math.radians(90), 0, 0)

scene.render.filepath = 'public/models/aces_render.png'
bpy.ops.render.render(write_still=True)
print('Done ACES render!')
