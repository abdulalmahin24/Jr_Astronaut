
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='public/models/Astronaut.glb')

obj = bpy.data.objects.get('astronaut1')
mesh = obj.data

print('Vertices count:', len(mesh.vertices))
xs = [v.co.x for v in mesh.vertices]
ys = [v.co.y for v in mesh.vertices]
zs = [v.co.z for v in mesh.vertices]

print('X (left-right):', min(xs), max(xs))
print('Y (height? or depth?):', min(ys), max(ys))
print('Z:', min(zs), max(zs))

# Let us check head vs feet
top_verts = sorted(mesh.vertices, key=lambda v: v.co.y, reverse=True)[:5]
print('Top 5 Y verts:', [list(v.co) for v in top_verts])

top_z_verts = sorted(mesh.vertices, key=lambda v: v.co.z, reverse=True)[:5]
print('Top 5 Z verts:', [list(v.co) for v in top_z_verts])
