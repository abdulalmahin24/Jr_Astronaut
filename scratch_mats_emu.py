
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='public/models/EMU_Suit.glb')
emu = bpy.data.objects.get('Extravehicular Mobility Unit')
mesh = emu.data

for i, m in enumerate(mesh.materials):
    name = m.name if m else 'None'
    # Find polys using this mat
    polys = [p for p in mesh.polygons if p.material_index == i]
    if not polys:
        print(f'{i:2d}: {name} - (0 polys)')
        continue
    # compute center of these polys
    verts = set()
    for p in polys:
        for v in p.vertices:
            verts.add(v)
    coords = [emu.matrix_world @ mesh.vertices[v].co for v in verts]
    mean_x = sum(c.x for c in coords)/len(coords)
    mean_y = sum(c.y for c in coords)/len(coords)
    mean_z = sum(c.z for c in coords)/len(coords)
    print(f'{i:2d}: {name} - count={len(polys):5d}, center=({mean_x:.2f}, {mean_y:.2f}, {mean_z:.2f})')
