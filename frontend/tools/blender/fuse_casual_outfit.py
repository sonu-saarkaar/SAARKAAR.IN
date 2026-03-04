import bpy
import bmesh
import os
import math


# Usage (from CLI):
# blender --background --python fuse_casual_outfit.py -- \
#   --input "C:/path/to/character.glb" \
#   --output "C:/path/to/character.glb" \
#   --max-faces 80000 \
#   --jacket 1


def parse_args():
    args = bpy.app.argv
    if "--" not in args:
        return {
            "input": "",
            "output": "",
            "max_faces": 80000,
            "jacket": 1,
        }

    args = args[args.index("--") + 1 :]
    parsed = {
        "input": "",
        "output": "",
        "max_faces": 80000,
        "jacket": 1,
    }

    i = 0
    while i < len(args):
        key = args[i]
        value = args[i + 1] if i + 1 < len(args) else ""
        if key == "--input":
            parsed["input"] = value
            i += 2
        elif key == "--output":
            parsed["output"] = value
            i += 2
        elif key == "--max-faces":
            parsed["max_faces"] = int(value)
            i += 2
        elif key == "--jacket":
            parsed["jacket"] = int(value)
            i += 2
        else:
            i += 1

    return parsed


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)


def import_character(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in [".glb", ".gltf"]:
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    else:
        raise RuntimeError(f"Unsupported input type: {ext}")


def get_primary_rigged_mesh():
    armature = None
    mesh = None

    for obj in bpy.context.scene.objects:
        if obj.type == 'ARMATURE' and armature is None:
            armature = obj

    candidates = []
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH':
            continue
        vcount = len(obj.data.vertices)
        has_armature_mod = any(m.type == 'ARMATURE' for m in obj.modifiers)
        if has_armature_mod:
            candidates.append((vcount, obj))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        mesh = candidates[0][1]
    else:
        fallback = [(len(o.data.vertices), o) for o in bpy.context.scene.objects if o.type == 'MESH']
        if not fallback:
            raise RuntimeError("No mesh object found after import.")
        fallback.sort(key=lambda x: x[0], reverse=True)
        mesh = fallback[0][1]

    if armature is None:
        parent = mesh.parent
        if parent and parent.type == 'ARMATURE':
            armature = parent

    return mesh, armature


def make_material(name, base_color, roughness=0.65, metallic=0.0):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True

    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = mat.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')

    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic

    return mat


def ensure_uv(mesh_obj):
    if not mesh_obj.data.uv_layers:
        bpy.context.view_layer.objects.active = mesh_obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
        bpy.ops.object.mode_set(mode='OBJECT')


def assign_fused_outfit_regions(mesh_obj, with_jacket=True):
    mesh = mesh_obj.data

    skin_mat = make_material("M_Skin", (0.58, 0.42, 0.33), 0.58, 0.0)
    tshirt_mat = make_material("M_TShirt", (0.09, 0.10, 0.12), 0.72, 0.0)
    jeans_mat = make_material("M_Jeans", (0.12, 0.17, 0.30), 0.78, 0.0)
    sneakers_mat = make_material("M_Sneakers", (0.90, 0.90, 0.90), 0.42, 0.03)
    jacket_mat = make_material("M_Jacket", (0.18, 0.20, 0.22), 0.70, 0.01)

    mesh.materials.clear()
    mesh.materials.append(skin_mat)
    mesh.materials.append(tshirt_mat)
    mesh.materials.append(jeans_mat)
    mesh.materials.append(sneakers_mat)
    mesh.materials.append(jacket_mat)

    # Single mesh "anti-gravity" outfit by face-region material assignment.
    # No loose cloth objects and no cloth simulation.
    z_vals = [v.co.z for v in mesh.vertices]
    if not z_vals:
        return

    z_min = min(z_vals)
    z_max = max(z_vals)
    h = z_max - z_min

    foot_line = z_min + h * 0.13
    knee_line = z_min + h * 0.32
    waist_line = z_min + h * 0.54
    chest_line = z_min + h * 0.72
    neck_line = z_min + h * 0.84

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.faces.ensure_lookup_table()

    for f in bm.faces:
        cz = sum(v.co.z for v in f.verts) / len(f.verts)

        # default skin
        mat_index = 0

        # sneakers
        if cz <= foot_line:
            mat_index = 3
        # jeans (slim fit)
        elif cz <= waist_line:
            mat_index = 2
        # t-shirt
        elif cz <= chest_line:
            mat_index = 1
        # neck/head keep skin
        elif cz >= neck_line:
            mat_index = 0
        else:
            mat_index = 1

        # optional lightweight jacket over torso area
        if with_jacket and waist_line < cz < neck_line:
            xs = [abs(v.co.x) for v in f.verts]
            x_avg = sum(xs) / len(xs)
            # only outer torso shell-ish region
            if x_avg > 0.12:
                mat_index = 4

        f.material_index = mat_index

    bm.to_mesh(mesh)
    bm.free()


def cleanup_and_optimize(mesh_obj, max_faces=80000):
    bpy.context.view_layer.objects.active = mesh_obj
    mesh_obj.select_set(True)

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0003)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    face_count = len(mesh_obj.data.polygons)
    if face_count > max_faces:
        ratio = max_faces / max(face_count, 1)
        dec = mesh_obj.modifiers.new(name="FaceBudget", type='DECIMATE')
        dec.decimate_type = 'COLLAPSE'
        dec.ratio = max(0.2, min(1.0, ratio))
        bpy.ops.object.modifier_apply(modifier=dec.name)


def export_glb(path):
    out_dir = os.path.dirname(path)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_materials='EXPORT',
        export_colors=False,
        export_animations=True,
        export_skins=True,
        export_yup=True,
        export_image_format='AUTO',
    )


def main():
    cfg = parse_args()
    if not cfg["input"] or not cfg["output"]:
        raise RuntimeError("Missing --input or --output path")

    clear_scene()
    import_character(cfg["input"])

    mesh_obj, armature_obj = get_primary_rigged_mesh()

    if armature_obj is not None:
        mesh_obj.parent = armature_obj
        has_armature_mod = any(m.type == 'ARMATURE' for m in mesh_obj.modifiers)
        if not has_armature_mod:
            mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
            mod.object = armature_obj

    ensure_uv(mesh_obj)
    assign_fused_outfit_regions(mesh_obj, with_jacket=bool(cfg["jacket"]))
    cleanup_and_optimize(mesh_obj, max_faces=cfg["max_faces"])
    export_glb(cfg["output"])

    print("✅ Fused anti-gravity casual outfit export complete:", cfg["output"])


if __name__ == "__main__":
    main()
