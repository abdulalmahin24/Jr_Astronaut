import * as THREE from 'three';

/**
 * Cleanly disposes a Three.js scene, all attached meshes, geometries,
 * materials, textures, and forces WebGL context release to eliminate
 * browser context-limit crashes and memory leaks across modal transitions.
 */
export function disposeThreeScene(
  renderer?: THREE.WebGLRenderer | null,
  scene?: THREE.Scene | null,
  container?: HTMLElement | null
): void {
  if (scene) {
    scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          try {
            mesh.geometry.dispose();
          } catch {
            // Ignore if already disposed
          }
        }
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat) => {
            try {
              Object.keys(mat).forEach((key) => {
                const val = (mat as unknown as Record<string, unknown>)[key];
                if (val && typeof val === 'object' && 'isTexture' in val && (val as THREE.Texture).isTexture) {
                  try {
                    (val as THREE.Texture).dispose();
                  } catch {
                    // Ignore texture disposal errors
                  }
                }
              });
              mat.dispose();
            } catch {
              // Ignore material disposal errors
            }
          });
        }
      }
    });
  }

  if (renderer) {
    try {
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      } else if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    } catch {
      // Ignore if DOM or WebGL context was already cleared
    }
  }
}

