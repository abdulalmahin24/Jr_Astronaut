import bpy
import math

print("=== Starting Blender 5.2 NASA EMU Suit Rig & Animation ===")

# Reset Factory Settings
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 120

# Import EMU_Suit.glb
emu_path = "./public\models\EMU_Suit.glb"
print(f"Importing {emu_path} into Blender...")
bpy.ops.import_scene.gltf(filepath=emu_path)

# Find EMU Mesh
mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        mesh_obj = obj
        break

if not mesh_obj:
    raise Exception("No mesh object found after importing EMU_Suit.glb")

print(f"Found suit mesh: {mesh_obj.name}")

from mathutils import Vector

# Compute Bounding Box
min_z = min(corner[2] for corner in mesh_obj.bound_box)
max_z = max(corner[2] for corner in mesh_obj.bound_box)
min_y = min(corner[1] for corner in mesh_obj.bound_box)
max_y = max(corner[1] for corner in mesh_obj.bound_box)
min_x = min(corner[0] for corner in mesh_obj.bound_box)
max_x = max(corner[0] for corner in mesh_obj.bound_box)
height = max_z - min_z
print(f"Mesh dimensions: X={max_x - min_x:.2f}, Y={max_y - min_y:.2f}, Z={height:.2f}")

# Fix Materials: Force OPAQUE rendering (fix Maya transparency bug)
for mat in bpy.data.materials:
    mat.use_nodes = True
    if hasattr(mat, 'blend_method'):
        mat.blend_method = 'OPAQUE'
    if hasattr(mat, 'shadow_method'):
        mat.shadow_method = 'OPAQUE'
    
    # Inspect principled BSDF
    nodes = mat.node_tree.nodes if mat.node_tree else None
    if nodes:
        bsdf = nodes.get("Principled BSDF")
        if bsdf:
            # If gold visor, ensure gold reflection
            if "visor" in mat.name.lower() or "gold" in mat.name.lower():
                if "Base Color" in bsdf.inputs:
                    bsdf.inputs["Base Color"].default_value = (1.0, 0.75, 0.15, 1.0)
                if "Metallic" in bsdf.inputs:
                    bsdf.inputs["Metallic"].default_value = 0.98
                if "Roughness" in bsdf.inputs:
                    bsdf.inputs["Roughness"].default_value = 0.08
            else:
                # Spacesuit fabric
                if "Roughness" in bsdf.inputs:
                    bsdf.inputs["Roughness"].default_value = 0.45

# Create Armature
bpy.ops.object.armature_add(location=(0, 0, min_z))
armature = bpy.context.active_object
armature.name = "EMU_Rig"

bpy.ops.object.mode_set(mode='EDIT')
bones = armature.data.edit_bones

# Pelvis / Root
root_b = bones["Bone"]
root_b.name = "Root"
root_b.head = (0, 0, min_z + height * 0.48)
root_b.tail = (0, 0, min_z + height * 0.58)

# Spine
spine_b = bones.new("Spine")
spine_b.head = (0, 0, min_z + height * 0.58)
spine_b.tail = (0, 0, min_z + height * 0.82)
spine_b.parent = root_b

# Head / Helmet
head_b = bones.new("Head")
head_b.head = (0, 0, min_z + height * 0.82)
head_b.tail = (0, 0, max_z)
head_b.parent = spine_b

# Left Arm
arm_l = bones.new("Arm_L")
arm_l.head = (-0.35, 0, min_z + height * 0.78)
arm_l.tail = (-0.48, 0, min_z + height * 0.35)
arm_l.parent = spine_b

# Right Arm
arm_r = bones.new("Arm_R")
arm_r.head = (0.35, 0, min_z + height * 0.78)
arm_r.tail = (0.48, 0, min_z + height * 0.35)
arm_r.parent = spine_b

bpy.ops.object.mode_set(mode='OBJECT')

# Parent Mesh to Armature
bpy.ops.object.select_all(action='DESELECT')
mesh_obj.select_set(True)
armature.select_set(True)
bpy.context.view_layer.objects.active = armature
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# Create Looping Idle Breathing Action (120 frames @ 30fps)
bpy.ops.object.mode_set(mode='POSE')
p_bones = armature.pose.bones

action = bpy.data.actions.new(name="Idle_Breathing")
armature.animation_data_create()
armature.animation_data.action = action

for f in range(1, 121):
    scene.frame_set(f)
    t = (f - 1) / 120.0 * 2.0 * math.pi

    # Spine Breathing Expansion & subtle elevation
    b_elev = math.sin(t * 2.0) * 0.012
    b_rot = math.sin(t * 2.0) * 0.018
    p_bones["Spine"].location = (0, 0, b_elev)
    p_bones["Spine"].rotation_euler = (b_rot, 0, 0)
    p_bones["Spine"].keyframe_insert(data_path="location", frame=f)
    p_bones["Spine"].keyframe_insert(data_path="rotation_euler", frame=f)

    # Head subtle look-around survey
    h_pan = math.sin(t) * 0.08
    h_tilt = math.cos(t * 0.8) * 0.03
    p_bones["Head"].rotation_euler = (h_tilt, 0, h_pan)
    p_bones["Head"].keyframe_insert(data_path="rotation_euler", frame=f)

    # Arms natural idle sway
    a_sway = math.sin(t * 1.5) * 0.025
    p_bones["Arm_L"].rotation_euler = (a_sway, 0, -a_sway)
    p_bones["Arm_R"].rotation_euler = (a_sway, 0, a_sway)
    p_bones["Arm_L"].keyframe_insert(data_path="rotation_euler", frame=f)
    p_bones["Arm_R"].keyframe_insert(data_path="rotation_euler", frame=f)

    # Root low gravity weight shift
    sway_x = math.sin(t) * 0.015
    p_bones["Root"].location = (sway_x, 0, 0)
    p_bones["Root"].keyframe_insert(data_path="location", frame=f)

bpy.ops.object.mode_set(mode='OBJECT')

# Export GLTF Binary (.glb)
export_path = "./public\models\Astronaut_Animated.glb"
print(f"Exporting rigged and animated EMU suit to {export_path}...")

bpy.ops.export_scene.gltf(
    filepath=export_path,
    export_format='GLB',
    export_animations=True,
    export_materials='EXPORT',
    export_animation_mode='ACTIONS'
)

print("=== Successfully Created and Exported Animated NASA EMU Suit from Blender! ===")
