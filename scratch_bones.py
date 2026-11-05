
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='public/models/Astronaut.glb')
for o in bpy.context.scene.objects:
    print('Obj:', o.name, o.type)
