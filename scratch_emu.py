
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='public/models/EMU_Suit.glb')
for o in bpy.context.scene.objects:
    print('EMU Obj:', o.name, o.type, o.location, o.dimensions)
    if o.data and hasattr(o.data, 'materials'):
        for m in o.data.materials:
            print('   Mat:', m.name if m else 'None')
