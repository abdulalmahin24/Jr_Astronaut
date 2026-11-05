
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='public/models/EMU_Suit.glb')
emu = bpy.data.objects.get('Extravehicular Mobility Unit')
mesh = emu.data

# Find material indices for visor
visor_mat_idx = [i for i, m in enumerate(mesh.materials) if 'blinn3' in m.name or 'blinn12' in m.name]
print('Visor mat indices:', visor_mat_idx)

# Find faces with visor material
visor_verts = set()
for poly in mesh.polygons:
    if poly.material_index in visor_mat_idx:
        for v in poly.vertices:
            visor_verts.add(v)

print('Num visor verts:', len(visor_verts))
if visor_verts:
    coords = [emu.matrix_world @ mesh.vertices[v].co for v in visor_verts]
    mean_x = sum(c.x for c in coords)/len(coords)
    mean_y = sum(c.y for c in coords)/len(coords)
    mean_z = sum(c.z for c in coords)/len(coords)
    print(f'World Visor center: X={mean_x:.3f}, Y={mean_y:.3f}, Z={mean_z:.3f}')

# Whole body bounds
all_coords = [emu.matrix_world @ v.co for v in mesh.vertices]
body_center_x = sum(c.x for c in all_coords)/len(all_coords)
body_center_y = sum(c.y for c in all_coords)/len(all_coords)
body_center_z = sum(c.z for c in all_coords)/len(all_coords)
print(f'World Body center: X={body_center_x:.3f}, Y={body_center_y:.3f}, Z={body_center_z:.3f}')
