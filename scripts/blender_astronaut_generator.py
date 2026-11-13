import bpy
import math

print("=== Starting Blender 5.2 NASA Astronaut 3D Generator ===")

# 1. Reset Scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 120

# 2. Setup Materials
def create_material(name, base_color, metallic=0.0, roughness=0.5, emissive=(0, 0, 0, 1)):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = base_color
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emissive
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = emissive
    return mat

mat_suit = create_material("SuitWhite", (0.92, 0.94, 0.96, 1.0), metallic=0.08, roughness=0.38)
mat_joints = create_material("SuitJoints", (0.15, 0.18, 0.22, 1.0), metallic=0.3, roughness=0.7)
mat_visor = create_material("GoldVisor", (1.0, 0.72, 0.12, 1.0), metallic=0.98, roughness=0.05)
mat_plss = create_material("PLSS_Pack", (0.85, 0.88, 0.90, 1.0), metallic=0.25, roughness=0.35)
mat_boots = create_material("LunarBoots", (0.12, 0.14, 0.18, 1.0), metallic=0.4, roughness=0.8)
mat_patch_red = create_material("NASA_Red", (0.88, 0.12, 0.12, 1.0), roughness=0.4)
mat_patch_blue = create_material("NASA_Blue", (0.05, 0.35, 0.82, 1.0), roughness=0.4)

# 3. Create High-Fidelity 3D Meshes
meshes = []

# Torso (Upper body)
bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=0.72, vertices=28, location=(0, 0, 1.25))
torso = bpy.context.active_object
torso.name = "Astronaut_Torso"
torso.data.materials.append(mat_suit)
meshes.append(torso)

# Red Mission Commander Stripe on Torso
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.48))
stripe = bpy.context.active_object
stripe.scale = (0.44, 0.38, 0.08)
bpy.ops.object.transform_apply(scale=True)
stripe.name = "Commander_Stripe"
stripe.data.materials.append(mat_patch_red)
meshes.append(stripe)

# NASA Blue Patch
bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.02, location=(-0.18, -0.22, 1.35))
patch = bpy.context.active_object
patch.rotation_euler = (math.radians(90), 0, 0)
bpy.ops.object.transform_apply(rotation=True)
patch.name = "NASA_Patch"
patch.data.materials.append(mat_patch_blue)
meshes.append(patch)

# Chest DCM Console
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.24, 1.22))
dcm = bpy.context.active_object
dcm.scale = (0.28, 0.12, 0.22)
bpy.ops.object.transform_apply(scale=True)
dcm.name = "DCM_Console"
dcm.data.materials.append(mat_joints)
meshes.append(dcm)

# PLSS Backpack
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.28, 1.30))
plss = bpy.context.active_object
plss.scale = (0.50, 0.28, 0.78)
bpy.ops.object.transform_apply(scale=True)
plss.name = "PLSS_Backpack"
plss.data.materials.append(mat_plss)
meshes.append(plss)

# Helmet
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.34, segments=32, ring_count=24, location=(0, 0, 1.82))
helmet = bpy.context.active_object
helmet.name = "Astronaut_Helmet"
helmet.data.materials.append(mat_suit)
meshes.append(helmet)

# Golden Visor
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.28, segments=32, ring_count=20, location=(0, -0.10, 1.82))
visor = bpy.context.active_object
visor.scale = (0.95, 0.75, 0.85)
bpy.ops.object.transform_apply(scale=True)
visor.name = "Gold_Visor"
visor.data.materials.append(mat_visor)
meshes.append(visor)

# Arms & Shoulders
# Left Arm
bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.40, vertices=20, location=(-0.46, 0, 1.30))
arm_l1 = bpy.context.active_object
arm_l1.name = "Arm_Upper_L"
arm_l1.data.materials.append(mat_suit)
meshes.append(arm_l1)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=16, ring_count=16, location=(-0.46, 0, 1.08))
elbow_l = bpy.context.active_object
elbow_l.name = "Elbow_L"
elbow_l.data.materials.append(mat_joints)
meshes.append(elbow_l)

bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.38, vertices=20, location=(-0.46, -0.05, 0.86))
arm_l2 = bpy.context.active_object
arm_l2.name = "Forearm_L"
arm_l2.data.materials.append(mat_suit)
meshes.append(arm_l2)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.46, -0.08, 0.62))
glove_l = bpy.context.active_object
glove_l.scale = (0.13, 0.16, 0.14)
bpy.ops.object.transform_apply(scale=True)
glove_l.name = "Glove_L"
glove_l.data.materials.append(mat_patch_blue)
meshes.append(glove_l)

# Right Arm
bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.40, vertices=20, location=(0.46, 0, 1.30))
arm_r1 = bpy.context.active_object
arm_r1.name = "Arm_Upper_R"
arm_r1.data.materials.append(mat_suit)
meshes.append(arm_r1)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=16, ring_count=16, location=(0.46, 0, 1.08))
elbow_r = bpy.context.active_object
elbow_r.name = "Elbow_R"
elbow_r.data.materials.append(mat_joints)
meshes.append(elbow_r)

bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.38, vertices=20, location=(0.46, -0.05, 0.86))
arm_r2 = bpy.context.active_object
arm_r2.name = "Forearm_R"
arm_r2.data.materials.append(mat_suit)
meshes.append(arm_r2)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.46, -0.08, 0.62))
glove_r = bpy.context.active_object
glove_r.scale = (0.13, 0.16, 0.14)
bpy.ops.object.transform_apply(scale=True)
glove_r.name = "Glove_R"
glove_r.data.materials.append(mat_patch_blue)
meshes.append(glove_r)

# Legs & Boots
# Left Leg
bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.50, vertices=20, location=(-0.20, 0, 0.70))
thigh_l = bpy.context.active_object
thigh_l.name = "Thigh_L"
thigh_l.data.materials.append(mat_suit)
meshes.append(thigh_l)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, segments=16, ring_count=16, location=(-0.20, 0, 0.42))
knee_l = bpy.context.active_object
knee_l.name = "Knee_L"
knee_l.data.materials.append(mat_joints)
meshes.append(knee_l)

bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.46, vertices=20, location=(-0.20, 0, 0.20))
shin_l = bpy.context.active_object
shin_l.name = "Shin_L"
shin_l.data.materials.append(mat_suit)
meshes.append(shin_l)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.20, -0.08, -0.04))
boot_l = bpy.context.active_object
boot_l.scale = (0.20, 0.36, 0.16)
bpy.ops.object.transform_apply(scale=True)
boot_l.name = "Boot_L"
boot_l.data.materials.append(mat_boots)
meshes.append(boot_l)

# Right Leg
bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.50, vertices=20, location=(0.20, 0, 0.70))
thigh_r = bpy.context.active_object
thigh_r.name = "Thigh_R"
thigh_r.data.materials.append(mat_suit)
meshes.append(thigh_r)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, segments=16, ring_count=16, location=(0.20, 0, 0.42))
knee_r = bpy.context.active_object
knee_r.name = "Knee_R"
knee_r.data.materials.append(mat_joints)
meshes.append(knee_r)

bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.46, vertices=20, location=(0.20, 0, 0.20))
shin_r = bpy.context.active_object
shin_r.name = "Shin_R"
shin_r.data.materials.append(mat_suit)
meshes.append(shin_r)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.20, -0.08, -0.04))
boot_r = bpy.context.active_object
boot_r.scale = (0.20, 0.36, 0.16)
bpy.ops.object.transform_apply(scale=True)
boot_r.name = "Boot_R"
boot_r.data.materials.append(mat_boots)
meshes.append(boot_r)

# Join all meshes into a single clean character mesh
bpy.ops.object.select_all(action='DESELECT')
for m in meshes:
    m.select_set(True)
bpy.context.view_layer.objects.active = torso
bpy.ops.object.join()
astro_mesh = bpy.context.active_object
astro_mesh.name = "NASA_Artemis_Astronaut"

# Enable Smooth Shading & Auto-smooth
for poly in astro_mesh.data.polygons:
    poly.use_smooth = True

# 4. Create Armature / Rig
bpy.ops.object.armature_add(location=(0, 0, 0))
armature = bpy.context.active_object
armature.name = "Astronaut_Rig"

bpy.ops.object.mode_set(mode='EDIT')
bones = armature.data.edit_bones

# Base Bone
root_b = bones["Bone"]
root_b.name = "Root"
root_b.head = (0, 0, 0)
root_b.tail = (0, 0, 0.85)

# Spine Bone
spine_b = bones.new("Spine")
spine_b.head = (0, 0, 0.85)
spine_b.tail = (0, 0, 1.55)
spine_b.parent = root_b

# Head Bone
head_b = bones.new("Head")
head_b.head = (0, 0, 1.55)
head_b.tail = (0, 0, 2.05)
head_b.parent = spine_b

# Arm Left
arm_l_b = bones.new("Arm_L")
arm_l_b.head = (-0.35, 0, 1.45)
arm_l_b.tail = (-0.46, -0.05, 0.55)
arm_l_b.parent = spine_b

# Arm Right
arm_r_b = bones.new("Arm_R")
arm_r_b.head = (0.35, 0, 1.45)
arm_r_b.tail = (0.46, -0.05, 0.55)
arm_r_b.parent = spine_b

bpy.ops.object.mode_set(mode='OBJECT')

# Parent Mesh to Armature with Automatic Weights
bpy.ops.object.select_all(action='DESELECT')
astro_mesh.select_set(True)
armature.select_set(True)
bpy.context.view_layer.objects.active = armature
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# 5. Keyframe Real Lifelike Idle Breathing & Sway Animation (120 frames = 4 seconds)
bpy.ops.object.mode_set(mode='POSE')
p_bones = armature.pose.bones

action = bpy.data.actions.new(name="Idle_Breathing")
armature.animation_data_create()
armature.animation_data.action = action

# Animate across 120 frames
for f in range(1, 121):
    scene.frame_set(f)
    t = (f - 1) / 120.0 * 2.0 * math.pi

    # Breathing: Spine subtly expands and elevates
    breath_elev = math.sin(t * 2.0) * 0.015
    breath_rot = math.sin(t * 2.0) * 0.02
    p_bones["Spine"].location = (0, 0, breath_elev)
    p_bones["Spine"].rotation_euler = (breath_rot, 0, 0)
    p_bones["Spine"].keyframe_insert(data_path="location", frame=f)
    p_bones["Spine"].keyframe_insert(data_path="rotation_euler", frame=f)

    # Head: Subtle scanning look-around
    head_pan = math.sin(t) * 0.10
    head_tilt = math.cos(t * 0.8) * 0.04
    p_bones["Head"].rotation_euler = (head_tilt, 0, head_pan)
    p_bones["Head"].keyframe_insert(data_path="rotation_euler", frame=f)

    # Arms: Natural sway at sides
    arm_sway = math.sin(t * 1.5) * 0.03
    p_bones["Arm_L"].rotation_euler = (arm_sway, 0, -arm_sway)
    p_bones["Arm_R"].rotation_euler = (arm_sway, 0, arm_sway)
    p_bones["Arm_L"].keyframe_insert(data_path="rotation_euler", frame=f)
    p_bones["Arm_R"].keyframe_insert(data_path="rotation_euler", frame=f)

    # Root: Low-G subtle weight shift
    sway_x = math.sin(t) * 0.02
    p_bones["Root"].location = (sway_x, 0, 0)
    p_bones["Root"].keyframe_insert(data_path="location", frame=f)

bpy.ops.object.mode_set(mode='OBJECT')

# 6. Export to GLTF Binary (.glb)
export_path = "./public\models\Astronaut_Animated.glb"
print(f"Exporting animated 3D astronaut to {export_path}...")

bpy.ops.export_scene.gltf(
    filepath=export_path,
    export_format='GLB',
    export_animations=True,
    export_materials='EXPORT',
)

print("=== Successfully Exported Animated NASA 3D Astronaut! ===")
