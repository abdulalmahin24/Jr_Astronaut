import bpy
import math

print("=== Starting Blender 5.2 NASA Master 3D Astronaut Generator (Fixed Outer Proportions) ===")

# 1. Reset Scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 120

# 2. Setup Vibrant, 100% OPAQUE NASA Materials
def make_mat(name, color, metallic=0.0, roughness=0.4, emissive=(0, 0, 0, 1)):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.blend_method = 'OPAQUE'
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = color
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = 1.0
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emissive
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = emissive
    return mat

mat_suit_white    = make_mat("Suit_White", (0.95, 0.96, 0.98, 1.0), metallic=0.04, roughness=0.32)
mat_suit_shadow   = make_mat("Suit_Grey",  (0.78, 0.80, 0.85, 1.0), metallic=0.10, roughness=0.45)
mat_gold_visor    = make_mat("Gold_Visor", (1.00, 0.74, 0.08, 1.0), metallic=0.98, roughness=0.04)
mat_nasa_blue     = make_mat("NASA_Blue",  (0.02, 0.26, 0.84, 1.0), metallic=0.15, roughness=0.30)
mat_commander_red = make_mat("NASA_Red",   (0.92, 0.06, 0.06, 1.0), metallic=0.10, roughness=0.25)
mat_console_dark  = make_mat("Console",    (0.10, 0.12, 0.16, 1.0), metallic=0.70, roughness=0.35)
mat_boots_tread   = make_mat("Boots_Tread",(0.07, 0.08, 0.10, 1.0), metallic=0.30, roughness=0.85)
mat_led_green     = make_mat("LED_Green",  (0.00, 1.00, 0.40, 1.0), roughness=0.1, emissive=(0.1, 1.0, 0.4, 1.0))
mat_led_cyan      = make_mat("LED_Cyan",   (0.00, 0.85, 1.00, 1.0), roughness=0.1, emissive=(0.0, 0.85, 1.0, 1.0))

parts = []

# --- 3. Body Meshes with VISIBLE OUTER DETAILS ---

# Torso (Upper Suit Body)
bpy.ops.mesh.primitive_cylinder_add(radius=0.34, depth=0.72, vertices=32, location=(0, 0, 1.25))
torso = bpy.context.active_object
torso.name = "Torso"
torso.data.materials.append(mat_suit_white)
parts.append(torso)

# Red Commander Shoulder & Chest Collar
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.54))
red_stripe = bpy.context.active_object
red_stripe.scale = (0.42, 0.38, 0.08)
bpy.ops.object.transform_apply(scale=True)
red_stripe.name = "Commander_Red_Stripe"
red_stripe.data.materials.append(mat_commander_red)
parts.append(red_stripe)

# Front Chest DCM Control Console (Firmly protruding on Front, Y = -0.36)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.36, 1.24))
dcm = bpy.context.active_object
dcm.scale = (0.28, 0.14, 0.24)
bpy.ops.object.transform_apply(scale=True)
dcm.name = "DCM_Console"
dcm.data.materials.append(mat_console_dark)
parts.append(dcm)

# DCM Glowing LED Indicators (On Front of Console, Y = -0.44)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.07, -0.44, 1.26))
led1 = bpy.context.active_object
led1.scale = (0.05, 0.02, 0.05)
bpy.ops.object.transform_apply(scale=True)
led1.name = "DCM_LED_Green"
led1.data.materials.append(mat_led_green)
parts.append(led1)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.07, -0.44, 1.26))
led2 = bpy.context.active_object
led2.scale = (0.05, 0.02, 0.05)
bpy.ops.object.transform_apply(scale=True)
led2.name = "DCM_LED_Cyan"
led2.data.materials.append(mat_led_cyan)
parts.append(led2)

# NASA Blue Mission Patch (Front Left Chest, Y = -0.35)
bpy.ops.mesh.primitive_cylinder_add(radius=0.075, depth=0.03, vertices=24, location=(-0.16, -0.34, 1.40))
patch_blue = bpy.context.active_object
patch_blue.rotation_euler = (math.radians(90), 0, 0)
bpy.ops.object.transform_apply(rotation=True)
patch_blue.name = "NASA_Blue_Patch"
patch_blue.data.materials.append(mat_nasa_blue)
parts.append(patch_blue)

# Helmet (Base White Dome)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.30, segments=36, ring_count=28, location=(0, 0, 1.82))
helmet = bpy.context.active_object
helmet.name = "Helmet"
helmet.data.materials.append(mat_suit_white)
parts.append(helmet)

# Golden Visor (PROTRUDING OUT FRONT, Y = -0.16)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.25, segments=36, ring_count=24, location=(0, -0.16, 1.82))
visor = bpy.context.active_object
visor.scale = (1.05, 0.90, 0.88)
bpy.ops.object.transform_apply(scale=True)
visor.name = "Golden_Visor"
visor.data.materials.append(mat_gold_visor)
parts.append(visor)

# PLSS Life Support Backpack (ON BACK, Y = +0.32)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.32, 1.30))
plss = bpy.context.active_object
plss.scale = (0.48, 0.28, 0.78)
bpy.ops.object.transform_apply(scale=True)
plss.name = "PLSS_Backpack"
plss.data.materials.append(mat_suit_shadow)
parts.append(plss)

# Twin Oxygen Cylinders on Top of PLSS Backpack (Back, Y = 0.32)
for x_side in (-0.14, 0.14):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.28, vertices=20, location=(x_side, 0.32, 1.74))
    tank = bpy.context.active_object
    tank.name = f"Tank_{'L' if x_side < 0 else 'R'}"
    tank.data.materials.append(mat_console_dark)
    parts.append(tank)

# Left Arm (With Blue Mission Stripe & Blue Glove)
bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.42, vertices=24, location=(-0.46, 0, 1.30))
arm_l1 = bpy.context.active_object
arm_l1.name = "Upper_Arm_L"
arm_l1.data.materials.append(mat_suit_white)
parts.append(arm_l1)

bpy.ops.mesh.primitive_cylinder_add(radius=0.126, depth=0.08, vertices=24, location=(-0.46, 0, 1.35))
stripe_arm_l = bpy.context.active_object
stripe_arm_l.name = "Arm_Stripe_L"
stripe_arm_l.data.materials.append(mat_nasa_blue)
parts.append(stripe_arm_l)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.115, segments=20, ring_count=20, location=(-0.46, 0, 1.06))
elbow_l = bpy.context.active_object
elbow_l.name = "Elbow_L"
elbow_l.data.materials.append(mat_console_dark)
parts.append(elbow_l)

bpy.ops.mesh.primitive_cylinder_add(radius=0.105, depth=0.38, vertices=24, location=(-0.46, -0.06, 0.84))
arm_l2 = bpy.context.active_object
arm_l2.name = "Forearm_L"
arm_l2.data.materials.append(mat_suit_white)
parts.append(arm_l2)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.46, -0.10, 0.60))
glove_l = bpy.context.active_object
glove_l.scale = (0.13, 0.16, 0.16)
bpy.ops.object.transform_apply(scale=True)
glove_l.name = "Glove_L"
glove_l.data.materials.append(mat_nasa_blue)
parts.append(glove_l)

# Right Arm (With Red Commander Stripe & Blue Glove)
bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.42, vertices=24, location=(0.46, 0, 1.30))
arm_r1 = bpy.context.active_object
arm_r1.name = "Upper_Arm_R"
arm_r1.data.materials.append(mat_suit_white)
parts.append(arm_r1)

bpy.ops.mesh.primitive_cylinder_add(radius=0.126, depth=0.08, vertices=24, location=(0.46, 0, 1.35))
stripe_arm_r = bpy.context.active_object
stripe_arm_r.name = "Arm_Stripe_R"
stripe_arm_r.data.materials.append(mat_commander_red)
parts.append(stripe_arm_r)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.115, segments=20, ring_count=20, location=(0.46, 0, 1.06))
elbow_r = bpy.context.active_object
elbow_r.name = "Elbow_R"
elbow_r.data.materials.append(mat_console_dark)
parts.append(elbow_r)

bpy.ops.mesh.primitive_cylinder_add(radius=0.105, depth=0.38, vertices=24, location=(0.46, -0.06, 0.84))
arm_r2 = bpy.context.active_object
arm_r2.name = "Forearm_R"
arm_r2.data.materials.append(mat_suit_white)
parts.append(arm_r2)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.46, -0.10, 0.60))
glove_r = bpy.context.active_object
glove_r.scale = (0.13, 0.16, 0.16)
bpy.ops.object.transform_apply(scale=True)
glove_r.name = "Glove_R"
glove_r.data.materials.append(mat_nasa_blue)
parts.append(glove_r)

# Legs & Charcoal Lunar Boots
# Left Leg
bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.52, vertices=24, location=(-0.20, 0, 0.70))
thigh_l = bpy.context.active_object
thigh_l.name = "Thigh_L"
thigh_l.data.materials.append(mat_suit_white)
parts.append(thigh_l)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.135, segments=20, ring_count=20, location=(-0.20, 0, 0.42))
knee_l = bpy.context.active_object
knee_l.name = "Knee_L"
knee_l.data.materials.append(mat_console_dark)
parts.append(knee_l)

bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.48, vertices=24, location=(-0.20, 0, 0.18))
shin_l = bpy.context.active_object
shin_l.name = "Shin_L"
shin_l.data.materials.append(mat_suit_white)
parts.append(shin_l)

# Charcoal Lunar Boot (Front toe extends to Y = -0.28)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.20, -0.10, -0.06))
boot_l = bpy.context.active_object
boot_l.scale = (0.22, 0.38, 0.16)
bpy.ops.object.transform_apply(scale=True)
boot_l.name = "Boot_L"
boot_l.data.materials.append(mat_boots_tread)
parts.append(boot_l)

# Right Leg
bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.52, vertices=24, location=(0.20, 0, 0.70))
thigh_r = bpy.context.active_object
thigh_r.name = "Thigh_R"
thigh_r.data.materials.append(mat_suit_white)
parts.append(thigh_r)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.135, segments=20, ring_count=20, location=(0.20, 0, 0.42))
knee_r = bpy.context.active_object
knee_r.name = "Knee_R"
knee_r.data.materials.append(mat_console_dark)
parts.append(knee_r)

bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.48, vertices=24, location=(0.20, 0, 0.18))
shin_r = bpy.context.active_object
shin_r.name = "Shin_R"
shin_r.data.materials.append(mat_suit_white)
parts.append(shin_r)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.20, -0.10, -0.06))
boot_r = bpy.context.active_object
boot_r.scale = (0.22, 0.38, 0.16)
bpy.ops.object.transform_apply(scale=True)
boot_r.name = "Boot_R"
boot_r.data.materials.append(mat_boots_tread)
parts.append(boot_r)

# Join All Meshes into a Single Clean Model
bpy.ops.object.select_all(action='DESELECT')
for p in parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = torso
bpy.ops.object.join()
astro_mesh = bpy.context.active_object
astro_mesh.name = "NASA_Artemis_Astronaut_3D"

for poly in astro_mesh.data.polygons:
    poly.use_smooth = True

# --- 4. Armature & Bone Rigging ---
bpy.ops.object.armature_add(location=(0, 0, 0))
armature = bpy.context.active_object
armature.name = "Astronaut_Rig"

bpy.ops.object.mode_set(mode='EDIT')
bones = armature.data.edit_bones

root_b = bones["Bone"]
root_b.name = "Root"
root_b.head = (0, 0, 0)
root_b.tail = (0, 0, 0.85)

spine_b = bones.new("Spine")
spine_b.head = (0, 0, 0.85)
spine_b.tail = (0, 0, 1.55)
spine_b.parent = root_b

head_b = bones.new("Head")
head_b.head = (0, 0, 1.55)
head_b.tail = (0, 0, 2.10)
head_b.parent = spine_b

arm_l_b = bones.new("Arm_L")
arm_l_b.head = (-0.35, 0, 1.45)
arm_l_b.tail = (-0.46, -0.06, 0.55)
arm_l_b.parent = spine_b

arm_r_b = bones.new("Arm_R")
arm_r_b.head = (0.35, 0, 1.45)
arm_r_b.tail = (0.46, -0.06, 0.55)
arm_r_b.parent = spine_b

bpy.ops.object.mode_set(mode='OBJECT')

# Parent Mesh to Armature with Automatic Weights
bpy.ops.object.select_all(action='DESELECT')
astro_mesh.select_set(True)
armature.select_set(True)
bpy.context.view_layer.objects.active = armature
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# --- 5. Looping Idle Breathing & Natural Sway Animation (120 frames @ 30fps) ---
bpy.ops.object.mode_set(mode='POSE')
p_bones = armature.pose.bones

action = bpy.data.actions.new(name="Idle_Breathing")
armature.animation_data_create()
armature.animation_data.action = action

for f in range(1, 121):
    scene.frame_set(f)
    t = (f - 1) / 120.0 * 2.0 * math.pi

    # Spine: Natural breathing expansion
    b_elev = math.sin(t * 2.0) * 0.015
    b_rot = math.sin(t * 2.0) * 0.020
    p_bones["Spine"].location = (0, 0, b_elev)
    p_bones["Spine"].rotation_euler = (b_rot, 0, 0)
    p_bones["Spine"].keyframe_insert(data_path="location", frame=f)
    p_bones["Spine"].keyframe_insert(data_path="rotation_euler", frame=f)

    # Head: Subtle scanning survey
    h_pan = math.sin(t) * 0.09
    h_tilt = math.cos(t * 0.8) * 0.035
    p_bones["Head"].rotation_euler = (h_tilt, 0, h_pan)
    p_bones["Head"].keyframe_insert(data_path="rotation_euler", frame=f)

    # Arms: Natural low-gravity idle sway
    a_sway = math.sin(t * 1.5) * 0.035
    p_bones["Arm_L"].rotation_euler = (a_sway, 0, -a_sway)
    p_bones["Arm_R"].rotation_euler = (a_sway, 0, a_sway)
    p_bones["Arm_L"].keyframe_insert(data_path="rotation_euler", frame=f)
    p_bones["Arm_R"].keyframe_insert(data_path="rotation_euler", frame=f)

    # Root: Low-G weight shift
    sway_x = math.sin(t) * 0.018
    p_bones["Root"].location = (sway_x, 0, 0)
    p_bones["Root"].keyframe_insert(data_path="location", frame=f)

bpy.ops.object.mode_set(mode='OBJECT')

# Ensure ALL Materials are 100% OPAQUE
for mat in bpy.data.materials:
    mat.blend_method = 'OPAQUE'
    if hasattr(mat, 'shadow_method'):
        mat.shadow_method = 'OPAQUE'

# --- 6. Export to GLTF Binary (.glb) ---
export_path = "./public\models\Astronaut_Animated.glb"
print(f"Exporting to {export_path}...")

bpy.ops.export_scene.gltf(
    filepath=export_path,
    export_format='GLB',
    export_animations=True,
    export_materials='EXPORT',
    export_animation_mode='ACTIONS'
)

print("=== Successfully Exported Solid, Opaque, Colorful NASA Astronaut! ===")
