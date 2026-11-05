import bpy
import math
import mathutils
import os

def look_at(obj, target):
    loc = obj.location
    direction = target - loc
    rot_quat = direction.to_track_quat('-Z', 'Y')
    obj.rotation_euler = rot_quat.to_euler()

def create_pbr_material(name, base_color=(0.8, 0.8, 0.8, 1.0), metallic=0.0, roughness=0.5, emission_color=(0,0,0,1), emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    bsdf.inputs['Base Color'].default_value = base_color
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if 'Emission Color' in bsdf.inputs:
        bsdf.inputs['Emission Color'].default_value = emission_color
        bsdf.inputs['Emission Strength'].default_value = emission_strength
    elif 'Emission' in bsdf.inputs:
        bsdf.inputs['Emission'].default_value = emission_color
        
    out = nodes.new('ShaderNodeOutputMaterial')
    out.location = (300, 0)
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat

print("=== REBUILDING AAA LUNAR HANGAR WITH SOLID GLTF PARENTING ===")

# 1. Reset Scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "AAA_Lunar_Hangar_Lobby"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# Color Management for punchy AAA look
scene.view_settings.view_transform = 'Filmic'
scene.view_settings.look = 'High Contrast'
scene.view_settings.exposure = 0.2

# 2. Deep Space World Environment
world = bpy.data.worlds.new("DeepSpace_World")
scene.world = world
world.use_nodes = True
nodes = world.node_tree.nodes
nodes.clear()
bg_node = nodes.new('ShaderNodeBackground')
bg_node.inputs['Color'].default_value = (0.005, 0.008, 0.016, 1.0)
bg_node.inputs['Strength'].default_value = 0.8
world_out = nodes.new('ShaderNodeOutputWorld')
world.node_tree.links.new(bg_node.outputs['Background'], world_out.inputs['Surface'])

# Paths
base_dir = r"C:\Users\user\OneDrive\Desktop\Jr_AstroCamp-main"
models_dir = os.path.join(base_dir, "public", "models")
assets_dir = os.path.join(base_dir, "public", "assets")

# 3. Wet Concrete / Industrial Floor
bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 6, 0))
floor = bpy.context.active_object
floor.name = "Hangar_Floor"
mat_floor = create_pbr_material("Wet_Floor", base_color=(0.06, 0.07, 0.09, 1.0), metallic=0.7, roughness=0.18)
floor.data.materials.append(mat_floor)

# Yellow/Hazard Floor Decal Line
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -1.8, 0.005))
hazard_strip = bpy.context.active_object
hazard_strip.name = "Hazard_Floor_Strip"
hazard_strip.scale = (22.0, 0.2, 1.0)
mat_hazard = create_pbr_material("Hazard_Yellow", base_color=(0.95, 0.65, 0.05, 1.0), metallic=0.1, roughness=0.35)
hazard_strip.data.materials.append(mat_hazard)

# Floor tracks
for x_t in [-3.8, 3.8]:
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x_t, 6.0, 0.004))
    track = bpy.context.active_object
    track.scale = (0.08, 18.0, 1.0)
    mat_track = create_pbr_material("Floor_Track", base_color=(0.03, 0.03, 0.04, 1.0), metallic=0.9, roughness=0.2)
    track.data.materials.append(mat_track)

# 4. Panoramic Bay Window & Earth View
bpy.ops.mesh.primitive_uv_sphere_add(radius=22, location=(14, 45, 6.5))
earth = bpy.context.active_object
earth.name = "Background_Earth"
bpy.ops.object.shade_smooth()

mat_earth = create_pbr_material("Earth_Glow", base_color=(0.08, 0.35, 0.85, 1.0), roughness=0.35, emission_color=(0.12, 0.45, 0.95, 1.0), emission_strength=2.0)
earth_tex_path = os.path.join(assets_dir, "earth_orbit.jpg")
if os.path.exists(earth_tex_path):
    nodes = mat_earth.node_tree.nodes
    bsdf = [n for n in nodes if n.type == 'BSDF_PRINCIPLED'][0]
    tex_node = nodes.new('ShaderNodeTexImage')
    tex_node.image = bpy.data.images.load(earth_tex_path)
    mat_earth.node_tree.links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
    if 'Emission Color' in bsdf.inputs:
        mat_earth.node_tree.links.new(tex_node.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 1.8
earth.data.materials.append(mat_earth)

# Hangar Back Walls & Window Frame
mat_metal_beam = create_pbr_material("Industrial_Steel", base_color=(0.12, 0.14, 0.17, 1.0), metallic=0.88, roughness=0.35)
mat_white_wall = create_pbr_material("Hangar_White_Panels", base_color=(0.48, 0.50, 0.54, 1.0), metallic=0.3, roughness=0.45)

# Left & Right Back Walls framing window
bpy.ops.mesh.primitive_cube_add(size=1, location=(-15, 22, 8.0))
back_wall_l = bpy.context.active_object
back_wall_l.scale = (14, 0.8, 16)
back_wall_l.data.materials.append(mat_white_wall)

bpy.ops.mesh.primitive_cube_add(size=1, location=(18, 22, 8.0))
back_wall_r = bpy.context.active_object
back_wall_r.scale = (12, 0.8, 16)
back_wall_r.data.materials.append(mat_white_wall)

# Upper Gantry Header above window
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 22, 14.5))
window_header = bpy.context.active_object
window_header.scale = (44, 1.2, 3.0)
window_header.data.materials.append(mat_metal_beam)

# Window Struts / Mullions
for x_off, rot_z in [(-5.0, 12), (6.5, -12), (0.8, 0)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.20, depth=14, location=(x_off, 21.8, 7.0))
    mullion = bpy.context.active_object
    mullion.name = f"Window_Mullion_{x_off}"
    mullion.rotation_euler = (math.radians(10), 0, math.radians(rot_z))
    mullion.data.materials.append(mat_metal_beam)

# 5. Industrial Beams, Overhead Trusses & Columns
for x_col in [-10.5, 10.5]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_col, 3.0, 7.5))
    col = bpy.context.active_object
    col.scale = (1.6, 1.8, 15.0)
    col.data.materials.append(mat_metal_beam)

bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 3.0, 12.0))
cross_beam = bpy.context.active_object
cross_beam.scale = (24.0, 0.9, 0.9)
cross_beam.data.materials.append(mat_metal_beam)

# Overhead Pipes
mat_pipe = create_pbr_material("Industrial_Pipes", base_color=(0.20, 0.22, 0.26, 1.0), metallic=0.85, roughness=0.3)
for y_p, z_p in [(2.6, 11.2), (3.0, 11.6), (2.3, 10.8)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=28, location=(0, y_p, z_p))
    p = bpy.context.active_object
    p.rotation_euler = (0, math.radians(90), 0)
    p.data.materials.append(mat_pipe)

# Left Wall Cargo Crates
mat_crate_dark = create_pbr_material("Crate_Dark", base_color=(0.10, 0.12, 0.14, 1.0), metallic=0.75, roughness=0.4)
mat_crate_orange = create_pbr_material("Crate_Hazard_Orange", base_color=(0.88, 0.38, 0.05, 1.0), metallic=0.45, roughness=0.35)

crate_configs = [
    ((-7.2, 5.0, 1.1), (2.4, 1.8, 2.2), mat_crate_dark),
    ((-7.0, 8.0, 1.4), (2.6, 2.0, 2.8), mat_crate_orange),
    ((-7.1, 6.4, 2.8), (2.0, 1.5, 1.6), mat_crate_dark),
]
for loc, scl, mat_c in crate_configs:
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    c = bpy.context.active_object
    c.scale = scl
    c.data.materials.append(mat_c)

# 6. Modular Habitat Cylinders in Midground
mat_hab_white = create_pbr_material("Hab_Thermal_Covering", base_color=(0.76, 0.78, 0.82, 1.0), metallic=0.35, roughness=0.32)
for i, y_hab in enumerate([10.5, 14.5]):
    bpy.ops.mesh.primitive_cylinder_add(radius=2.2, depth=7.0, location=(-1.8 + i*1.2, y_hab, 2.2))
    hab = bpy.context.active_object
    hab.name = f"Station_Module_{i}"
    hab.rotation_euler = (0, math.radians(90), math.radians(18))
    hab.data.materials.append(mat_hab_white)

# 7. IMPORT NASA LUNAR ROVER (Proper Group Parenting -> Shifted to Far Right!)
rover_path = os.path.join(models_dir, "Mars_Perseverance_Rover.glb")
if os.path.exists(rover_path):
    print("Importing NASA Rover with Group Parenting...")
    before_objs = set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=rover_path)
    new_objs = set(scene.objects) - before_objs
    
    # Parent ALL root objects of the rover to one empty
    rover_parent = bpy.data.objects.new("NASA_Rover_Group", None)
    scene.collection.objects.link(rover_parent)
    for o in new_objs:
        if o.parent is None:
            o.parent = rover_parent
            
    # Shift to FAR RIGHT side of hangar floor (never blocks center astronaut!)
    rover_parent.location = (6.4, 8.0, 0.05)
    rover_parent.scale = (0.38, 0.38, 0.38)
    rover_parent.rotation_euler = (0, 0, math.radians(-38))
    print("Successfully shifted full NASA Rover to far-right floor.")

# 8. IMPORT DEEP SPACE COMMUNICATION DISH (Parented to Far Right Background)
dish_path = os.path.join(models_dir, "Dish_70m.glb")
if os.path.exists(dish_path):
    print("Importing Dish Antenna...")
    before_objs = set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=dish_path)
    new_objs = set(scene.objects) - before_objs
    
    dish_parent = bpy.data.objects.new("Dish_Antenna_Group", None)
    scene.collection.objects.link(dish_parent)
    for o in new_objs:
        if o.parent is None:
            o.parent = dish_parent
            
    dish_parent.location = (9.5, 16.0, 0.0)
    dish_parent.scale = (0.22, 0.22, 0.22)
    dish_parent.rotation_euler = (0, 0, math.radians(135))

# 9. IMPORT AUTHENTIC NASA EMU ASTRONAUT (HEROIC, CENTERED, LARGE)
astronaut_path = os.path.join(models_dir, "EMU_Suit.glb")
astro_objects = []
astro_parent = None
if os.path.exists(astronaut_path):
    print("Importing authentic NASA EMU Astronaut...")
    before_objs = set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=astronaut_path)
    new_objs = set(scene.objects) - before_objs
    astro_objects = list(new_objs)
    
    astro_parent = bpy.data.objects.new("Hero_Astronaut_Group", None)
    scene.collection.objects.link(astro_parent)
    for o in new_objs:
        if o.parent is None:
            o.parent = astro_parent
            
    # HEROIC IDLE POSE: FACING CAMERA (180 deg), PROMINENT & LARGE MATCHING REFERENCE IMAGE
    astro_parent.location = (0.0, 0.2, 0.0)
    astro_parent.scale = (1.32, 1.32, 1.32)
    astro_parent.rotation_euler = (0, 0, math.radians(180))
    print("Astronaut rotated 180 deg to FACE camera, scaled 1.32x (Hero Stance).")
        
    # Upgrade materials: 24K Gold reflective helmet visor
    for mat in bpy.data.materials:
        if not mat.node_tree:
            continue
        principled = None
        for n in mat.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                principled = n
                break
        if not principled:
            continue
        mat_name = mat.name.lower()
        if 'blinn1' in mat_name or 'blinn3' in mat_name or 'blinn12' in mat_name or 'visor' in mat_name:
            principled.inputs['Base Color'].default_value = (1.0, 0.84, 0.05, 1.0)
            principled.inputs['Metallic'].default_value = 1.0
            principled.inputs['Roughness'].default_value = 0.03
            print("Upgraded visor to 24K Gold Mirror PBR!")

# 10. Studio Cinematic Lighting (COD / PUBG AAA Look)
# A. Warm Industrial Amber Spotlight from Front-Left (Shines on right shoulder & visor)
spot_orange = bpy.data.lights.new("Overhead_Orange_Spot", type='SPOT')
spot_orange.energy = 3200.0
spot_orange.color = (1.0, 0.55, 0.12)
spot_orange.spot_size = math.radians(60)
spot_orange.spot_blend = 0.45
spot_orange_obj = bpy.data.objects.new("Overhead_Orange_Spot", spot_orange)
scene.collection.objects.link(spot_orange_obj)
spot_orange_obj.location = (-2.8, -3.2, 5.5)
look_at(spot_orange_obj, mathutils.Vector((0.0, 0.2, 1.3)))

# B. Cool Cyan / Blue Spotlight from Front-Right (Shines on left shoulder & visor)
spot_cyan = bpy.data.lights.new("Overhead_Cyan_Spot", type='SPOT')
spot_cyan.energy = 3400.0
spot_cyan.color = (0.05, 0.85, 1.0)
spot_cyan.spot_size = math.radians(62)
spot_cyan.spot_blend = 0.48
spot_cyan_obj = bpy.data.objects.new("Overhead_Cyan_Spot", spot_cyan)
scene.collection.objects.link(spot_cyan_obj)
spot_cyan_obj.location = (2.8, -3.0, 5.8)
look_at(spot_cyan_obj, mathutils.Vector((0.0, 0.2, 1.3)))

# C. Earthshine Rim Light from Bay Window (Outlining the Astronaut from behind)
rim_blue = bpy.data.lights.new("Earthshine_Rim_Light", type='AREA')
rim_blue.energy = 1600.0
rim_blue.color = (0.28, 0.70, 1.0)
rim_blue.size = 14.0
rim_blue_obj = bpy.data.objects.new("Earthshine_Rim_Light", rim_blue)
scene.collection.objects.link(rim_blue_obj)
rim_blue_obj.location = (2.5, 14.0, 4.0)
look_at(rim_blue_obj, mathutils.Vector((0.0, 0.2, 1.4)))

# D. Front Key Sunlight for Crystal-Clear White Spacesuit Details
front_sun = bpy.data.lights.new("Front_Key_Sun", type='SUN')
front_sun.energy = 4.5
front_sun.color = (0.95, 0.98, 1.0)
front_sun_obj = bpy.data.objects.new("Front_Key_Sun", front_sun)
scene.collection.objects.link(front_sun_obj)
front_sun_obj.rotation_euler = (math.radians(60), math.radians(-10), math.radians(15))

# 11. Volumetric Atmosphere Box
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 8, 5.5))
fog_box = bpy.context.active_object
fog_box.name = "Volumetric_Atmosphere_Box"
fog_box.scale = (38.0, 34.0, 14.0)

mat_vol = bpy.data.materials.new(name="Hangar_Volumetric_Fog")
mat_vol.use_nodes = True
nodes = mat_vol.node_tree.nodes
nodes.clear()
vol_node = nodes.new('ShaderNodeVolumePrincipled')
vol_node.inputs['Density'].default_value = 0.010
vol_node.inputs['Color'].default_value = (0.75, 0.85, 1.0, 1.0)
if 'Anisotropy' in vol_node.inputs:
    vol_node.inputs['Anisotropy'].default_value = 0.55

mat_out = nodes.new('ShaderNodeOutputMaterial')
mat_vol.node_tree.links.new(vol_node.outputs['Volume'], mat_out.inputs['Volume'])
fog_box.data.materials.append(mat_vol)

# 12. Glowing Circular Inspection Pedestal (Under Astronaut's Boots)
bpy.ops.mesh.primitive_cylinder_add(radius=1.35, depth=0.04, location=(0, 0, 0.02))
pedestal_base = bpy.context.active_object
pedestal_base.name = "Inspection_Pedestal_Base"
mat_ped_base = create_pbr_material("Pedestal_Base_Mat", base_color=(0.04, 0.05, 0.07, 1.0), metallic=0.9, roughness=0.15)
pedestal_base.data.materials.append(mat_ped_base)

# Outer Cyan Glowing Neon Ring
bpy.ops.mesh.primitive_cylinder_add(radius=1.38, depth=0.01, location=(0, 0, 0.042))
cyan_ring = bpy.context.active_object
cyan_ring.name = "Pedestal_Cyan_Ring"
cyan_ring.scale = (1.0, 1.0, 0.2)
mat_cyan_ring = create_pbr_material("Pedestal_Cyan_Glow", base_color=(0.0, 0.8, 1.0, 1.0), emission_color=(0.0, 0.82, 1.0, 1.0), emission_strength=4.5)
cyan_ring.data.materials.append(mat_cyan_ring)

# Inner Amber Glowing Neon Ring
bpy.ops.mesh.primitive_cylinder_add(radius=0.95, depth=0.01, location=(0, 0, 0.043))
amber_ring = bpy.context.active_object
amber_ring.name = "Pedestal_Amber_Ring"
amber_ring.scale = (1.0, 1.0, 0.2)
mat_amber_ring = create_pbr_material("Pedestal_Amber_Glow", base_color=(1.0, 0.6, 0.1, 1.0), emission_color=(1.0, 0.62, 0.1, 1.0), emission_strength=3.5)
amber_ring.data.materials.append(mat_amber_ring)

# 13. Camera Framing & Cinematic Dolly-In Animation
cam_data = bpy.data.cameras.new("AAA_Lobby_Camera")
cam_data.lens = 32
cam_obj = bpy.data.objects.new("AAA_Lobby_Camera", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Setup Depth of Field for Cinematic Bokeh on Background
cam_data.dof.use_dof = True
cam_data.dof.focus_distance = 2.15
cam_data.dof.aperture_fstop = 2.0

# Frame 1: Wide Hangar Lobby View
scene.frame_start = 1
scene.frame_end = 60
scene.frame_set(1)
cam_obj.location = (0.0, -4.2, 1.45)
look_at(cam_obj, mathutils.Vector((0.0, 0.2, 1.35)))
cam_obj.keyframe_insert(data_path="location", frame=1)
cam_obj.keyframe_insert(data_path="rotation_euler", frame=1)

# Frame 60: Heroic Medium Inspection Shot (Dolly In on Astronaut)
scene.frame_set(60)
cam_obj.location = (0.0, -2.15, 1.36)
look_at(cam_obj, mathutils.Vector((0.0, 0.0, 1.38)))
cam_obj.keyframe_insert(data_path="location", frame=60)
cam_obj.keyframe_insert(data_path="rotation_euler", frame=60)

# Return to Frame 1 for default render
scene.frame_set(1)

# 14. Save Master Project
blend_file_path = os.path.join(base_dir, "artemis_lunar_hangar_lobby.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_file_path)
print(f"Master project successfully saved to: {blend_file_path}")

# 14. Render 1: Clean AAA Hangar Environment (For Web App 3D Lobby Background)
if astro_parent:
    astro_parent.hide_render = True
for o in astro_objects:
    o.hide_render = True

out_env_bg = os.path.join(assets_dir, "artemis_lobby_base_bg.png")
scene.render.filepath = out_env_bg
print(f"Rendering Clean Hangar Environment to: {out_env_bg} ...")
bpy.ops.render.render(write_still=True)
print("Render 1 Complete!")

# 15. Render 2: Complete Scene WITH Large Hero Astronaut
if astro_parent:
    astro_parent.hide_render = False
for o in astro_objects:
    o.hide_render = False

out_full_render = os.path.join(models_dir, "artemis_hangar_render_full.png")
scene.render.filepath = out_full_render
print(f"Rendering Full Scene With Hero Astronaut to: {out_full_render} ...")
bpy.ops.render.render(write_still=True)
print("Render 2 Complete!")

print("=== ALL RENDERS & BLENDER EXPORTS COMPLETED SUCCESSFULLY ===")
