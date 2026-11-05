
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='public/models/Astronaut.glb')
obj = bpy.data.objects.get('astronaut1')
mesh = obj.data

for x_thresh in [8, 12, 16, 20, 24, 28, 32]:
    verts = [v for v in mesh.vertices if v.co.x > x_thresh and v.co.y > 5]
    if verts:
        mean_y = sum(v.co.y for v in verts) / len(verts)
        mean_z = sum(v.co.z for v in verts) / len(verts)
        print(f'X > {x_thresh}: count={len(verts)}, mean_y={mean_y:.2f}, mean_z={mean_z:.2f}')
