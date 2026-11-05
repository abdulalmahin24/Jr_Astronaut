
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='public/models/Astronaut.glb')

for mat in bpy.data.materials:
    print('Material:', mat.name, 'use_nodes:', mat.use_nodes)
    if mat.use_nodes:
        for node in mat.node_tree.nodes:
            print('  Node:', node.name, node.type)
            if node.type == 'TEX_IMAGE' and node.image:
                print('    Image:', node.image.name, node.image.size)
            if node.type == 'BSDF_PRINCIPLED':
                print('    Base Color inputs:', [(l.from_node.name, l.from_socket.name) for l in node.inputs['Base Color'].links])
                print('    Base Color default:', list(node.inputs['Base Color'].default_value))
