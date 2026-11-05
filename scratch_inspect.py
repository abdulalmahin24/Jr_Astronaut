
import bpy
import math

bpy.ops.wm.read_factory_settings(use_empty=True)

# Import Astronaut.glb
bpy.ops.import_scene.gltf(filepath='public/models/Astronaut.glb')

# Check objects
for obj in bpy.context.scene.objects:
    print('Astronaut.glb obj:', obj.name, obj.type, obj.dimensions)

bpy.ops.wm.read_factory_settings(use_empty=True)
# Import EMU_Suit.glb
bpy.ops.import_scene.gltf(filepath='public/models/EMU_Suit.glb')
for obj in bpy.context.scene.objects:
    print('EMU_Suit.glb obj:', obj.name, obj.type, obj.dimensions)
