import bpy
import math

# 1. Test render Astronaut.glb
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 800
scene.render.resolution_y = 1000

# Import Astronaut.glb
bpy.ops.import_scene.gltf(filepath="./public\models\Astronaut.glb")

# Camera
cam_data = bpy.data.cameras.new("Cam")
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (0, -3.5, 1.0)
cam_obj.rotation_euler = (math.radians(85), 0, 0)

# Light
light_data = bpy.data.lights.new("Sun", type='SUN')
light_data.energy = 4.0
light_obj = bpy.data.objects.new("Sun", light_data)
scene.collection.objects.link(light_obj)
light_obj.rotation_euler = (math.radians(45), math.radians(20), math.radians(30))

# Ambient
world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.05, 0.08, 1)

# Render
render_path = "./scratch/blender_render_astronaut_glb.png"
scene.render.filepath = render_path
bpy.ops.render.render(write_still=True)
print("Saved render to:", render_path)
