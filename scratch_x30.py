
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='public/models/Astronaut.glb')
obj = bpy.data.objects.get('astronaut1')
mesh = obj.data

for v in mesh.vertices:
    if abs(v.co.x) > 30:
        print('Vert |x|>30:', list(v.co))
