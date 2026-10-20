# Turn downloaded food scans (public/models/scanned/<name>/...) into web-ready,
# true-to-scale GLBs at public/models/dishes/<slug>.glb (+ .jpg thumbnail, and a
# .usdz for iOS Quick Look AR).
#
#   blender --background --factory-startup --python scripts/blender/import_scans.py
#   USDZ_ONLY=1 blender ...   # just rebuild the .usdz files from the existing GLBs
#
# Per scan: import, level (dominant surface normal -> up), square the long side
# to X, optionally strip the table it was scanned on, decimate, keep only the
# base-colour texture (downsized), scale (keep the scan's real metric size, or
# fit an unscaled scan to a target footprint), floor at z=0, export.
import math
import os

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "models")
SCANNED = os.path.join(ROOT, "scanned")
OUT = os.path.join(ROOT, "dishes")
MAX_FACES = 60000
TEX_PX = 2048

# slug, source file, scale (None = scan is metric, keep it; float = fit long side to N cm),
# table cut (fraction of height below which the scanned table is deleted, or False), extra fix-up (a function name, or a Matrix to force "up" when auto-levelling fails)
SCANS = [
    # Scan is a ~74 cm serving board; shown at a 1-2 person board size instead.
    ("prsut-sir", "prosciutto-and-cheese-board/source/plancha_Medium.usdz", 45, False, None),
    ("crni-rizot", "selina-porto-risoto/source/unzipped/Selina Risoto/selinris.obj", 26, False, None),
    ("hobotnica-peka", "octopus-salad-food-scan/source/unzipped/textured.obj", None, 0.105, None),
    ("pljukanci-tartufi", "pasta-bowl-polycam/source/unzipped/poly.obj", 21, 0.097,
     Matrix.Rotation(-math.pi / 2, 4, "X")),  # Polycam export is -Y up
    # Buffet tray (~145 cm) shrunk to a platter for two, so the seafood reads small.
    ("plata-za-2", "seafood-platter-scaniverse/source/240301_Seafood Platter.fbx", 40, False, None),
    ("rozata", "creme-caramel/source/creme caramel.fbx", 14, False, "creme_caramel"),
]


def creme_caramel():
    """The FBX ships a tablecloth and doesn't link its colour maps."""
    bpy.data.objects.remove(bpy.data.objects["Plane.001"])
    tex = os.path.join(SCANNED, "creme-caramel", "textures", "creme_caramel_budino_BaseColor.png")
    flat = {"caramello": (0.36, 0.12, 0.02, 1), "piatto": (0.92, 0.91, 0.88, 1)}
    for ob in bpy.data.objects:
        for m in ob.data.materials:
            nt = m.node_tree
            bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
            if ob.name == "budino":
                img = nt.nodes.new("ShaderNodeTexImage")
                img.image = bpy.data.images.load(tex)
                nt.links.new(img.outputs["Color"], bsdf.inputs["Base Color"])
            else:
                bsdf.inputs["Base Color"].default_value = flat[ob.name]
                bsdf.inputs["Roughness"].default_value = 0.15 if ob.name == "caramello" else 0.3


def import_any(path):
    ext = path.rsplit(".", 1)[1].lower()
    if ext == "obj":
        bpy.ops.wm.obj_import(filepath=path)
    elif ext == "fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    else:
        bpy.ops.wm.usd_import(filepath=path)


def join_meshes():
    for ob in [o for o in bpy.data.objects if o.type != "MESH"]:
        bpy.data.objects.remove(ob)
    obs = list(bpy.data.objects)
    with bpy.context.temp_override(active_object=obs[0], selected_editable_objects=obs):
        bpy.ops.object.join()
    ob = obs[0]
    ob.data.transform(ob.matrix_world)  # bake transforms into the mesh
    ob.matrix_world = Matrix.Identity(4)
    # Weld per-face vertices and drop imported split normals so the GLB isn't 3 verts/triangle.
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(ob.data)
    bm.free()
    with bpy.context.temp_override(object=ob, active_object=ob):
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    ob.data.polygons.foreach_set("use_smooth", [True] * len(ob.data.polygons))
    return ob


def verts_np(me):
    co = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", co)
    return co.reshape(-1, 3)


def level_and_square(me, up_fix=None):
    if up_fix is not None:
        me.transform(up_fix)
        up_fix = True
    # Scans are open surfaces seen from above, so the area-weighted normal sum points up.
    if not up_fix:
        up = sum((p.normal * p.area for p in me.polygons), Vector()).normalized()
        me.transform(up.rotation_difference(Vector((0, 0, 1))).to_matrix().to_4x4())
    # Refine on the upward-facing surfaces only (table / board / plate rim dominate).
    up = sum((p.normal * p.area for p in me.polygons if p.normal.z > 0.7), Vector()).normalized()
    me.transform(up.rotation_difference(Vector((0, 0, 1))).to_matrix().to_4x4())
    xy = verts_np(me)[:, :2]
    xy = xy - xy.mean(0)
    w, v = np.linalg.eigh(np.cov(xy.T))
    major = v[:, np.argmax(w)]
    me.transform(Matrix.Rotation(-math.atan2(major[1], major[0]), 4, "Z"))


def strip_table(me, cut):
    """Delete the flat surface the dish was scanned on, plus stray islands."""
    bm = bmesh.new()
    bm.from_mesh(me)
    zs = np.array([v.co.z for v in bm.verts])
    lo, hi = zs.min(), zs.max()
    # Cut height is set per scan (fraction of the height, measured once) because
    # auto-detecting "the table" was unreliable across scans.
    top = lo + cut * (hi - lo)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if max(v.co.z for v in f.verts) < top], context="FACES")
    # Drop disconnected crumbs (anything under 2% of what's left).
    bm.faces.ensure_lookup_table()
    seen, islands = set(), []
    for f in bm.faces:
        if f.index in seen:
            continue
        stack, isl = [f], []
        seen.add(f.index)
        while stack:
            g = stack.pop()
            isl.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen:
                        seen.add(h.index)
                        stack.append(h)
        islands.append(isl)
    keep = 0.02 * len(bm.faces)
    bmesh.ops.delete(bm, geom=[f for isl in islands if len(isl) < keep for f in isl], context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    bm.to_mesh(me)
    bm.free()


def decimate(ob):
    n = len(ob.data.polygons)
    if n <= MAX_FACES:
        return
    mod = ob.modifiers.new("dec", "DECIMATE")
    mod.ratio = MAX_FACES / n
    with bpy.context.temp_override(object=ob, active_object=ob):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def base_colour_only(ob):
    """Scans have lighting baked in; keep only base colour, downsized, matte."""
    for m in ob.data.materials:
        nt = m.node_tree
        bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
        src = bsdf.inputs["Base Color"].links
        img = src[0].from_node if src and src[0].from_node.type == "TEX_IMAGE" else None
        for n in list(nt.nodes):
            if n not in (bsdf, img) and n.type != "OUTPUT_MATERIAL":
                nt.nodes.remove(n)
        if img:
            nt.links.new(img.outputs["Color"], bsdf.inputs["Base Color"])
            im = img.image
            if max(im.size) > TEX_PX:
                f = TEX_PX / max(im.size)
                im.scale(int(im.size[0] * f), int(im.size[1] * f))
            bsdf.inputs["Roughness"].default_value = 0.8
        bsdf.inputs["Metallic"].default_value = 0.0
        for k in ("Specular IOR Level", "Specular"):
            if k in bsdf.inputs:
                bsdf.inputs[k].default_value = 0.2
                break


def fit(me, long_cm):
    p = verts_np(me)
    lo, hi = p.min(0), p.max(0)
    s = 1.0 if long_cm is None else long_cm / 100 / (hi[:2] - lo[:2]).max()
    me.transform(Matrix.Scale(s, 4) @ Matrix.Translation((-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2])))
    p = verts_np(me)
    return (p.max(0) - p.min(0)) * 100


def render_thumb(path, dims):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = 800, 600
    sc.render.image_settings.file_format = "JPEG"
    sc.render.image_settings.quality = 88
    sc.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.new("w")
    sc.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.96, 0.93, 0.87, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 1.2
    sun.rotation_euler = (math.radians(40), 0, math.radians(30))
    sc.collection.objects.link(sun)
    size = max(dims[0], dims[1]) / 100
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    cam.location = Vector((0, -1.55, 1.15)) * size
    cam.rotation_euler = (Vector((0, 0, dims[2] / 100 * 0.3)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def export_usdz(slug):
    """USDZ from the finished GLB so both formats are identical: metres, Y-up."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, f"{slug}.glb"))
    bpy.ops.wm.usd_export(filepath=os.path.join(OUT, f"{slug}.usdz"), selected_objects_only=False,
                          export_materials=True, generate_preview_surface=True, export_textures_mode="NEW",
                          convert_orientation=True, export_global_forward_selection="NEGATIVE_Z",
                          export_global_up_selection="Y", convert_scene_units="METERS",
                          usdz_downscale_size="2048", triangulate_meshes=True,
                          export_lights=False, export_cameras=False, root_prim_path=f"/{slug.replace('-', '_')}")


def main():
    os.makedirs(OUT, exist_ok=True)
    only = os.environ.get("SCANS")  # e.g. SCANS=rozata,plata-za-2 to redo a few
    for slug, rel, long_cm, table, fix in SCANS:
        if only and slug not in only.split(","):
            continue
        if os.environ.get("USDZ_ONLY"):
            export_usdz(slug)
            continue
        bpy.ops.wm.read_factory_settings(use_empty=True)
        import_any(os.path.join(SCANNED, rel))
        if isinstance(fix, str):
            globals()[fix]()
        ob = join_meshes()
        level_and_square(ob.data, fix if isinstance(fix, Matrix) else None)
        if table:
            strip_table(ob.data, table)
        decimate(ob)
        base_colour_only(ob)
        dims = fit(ob.data, long_cm)
        ob.name = ob.data.name = slug
        glb = os.path.join(OUT, f"{slug}.glb")
        with bpy.context.temp_override(selected_objects=[ob], active_object=ob):
            bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", use_selection=True,
                                      export_image_format="JPEG", export_jpeg_quality=82)
        render_thumb(os.path.join(OUT, f"{slug}.jpg"), dims)
        export_usdz(slug)
        print(f"[scan] {slug}: {dims[0]:.1f} x {dims[1]:.1f} x {dims[2]:.1f} cm, "
              f"{len(ob.data.polygons)} faces, {os.path.getsize(glb) / 1048576:.2f} MB")


main()
