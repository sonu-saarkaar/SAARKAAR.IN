# Anti-Gravity Fused Outfit Pipeline

This workflow converts the existing mannequin into a **single-mesh casual character** (no cloth simulation) and exports a GLB that remains animation-ready for Mixamo-style rigs.

## What this does
- Keeps one rigged body mesh
- Applies fused casual regions (t-shirt, slim-fit jeans, sneakers, optional lightweight jacket)
- Uses no dynamic cloth or separate floating cloth objects
- Preserves armature + skinning for web runtime animation
- Optimizes toward a face budget (default: 80k)
- Exports GLB back to runtime path

## Prerequisites
- Blender 4.x installed and available in PATH as `blender`
- Source model at `frontend/public/models/character.glb`

## Run (Windows PowerShell)

```powershell
Set-Location "frontend/tools/blender"
blender --background --python fuse_casual_outfit.py -- `
  --input "../../public/models/character.glb" `
  --output "../../public/models/character.glb" `
  --max-faces 80000 `
  --jacket 1
```

For no jacket:

```powershell
blender --background --python fuse_casual_outfit.py -- `
  --input "../../public/models/character.glb" `
  --output "../../public/models/character.glb" `
  --max-faces 80000 `
  --jacket 0
```

## Notes
- This script is **anti-gravity fused style**: no cloth physics, no loose cloth pieces.
- Materials are lightweight for browser performance.
- Keep texture maps at or below 2K when adding custom textures.
- After export, restart `npm run dev` and verify animation + performance in scene.
