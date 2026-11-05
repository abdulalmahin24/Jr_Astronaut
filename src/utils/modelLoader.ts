import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

let sharedGLTFLoader: GLTFLoader | null = null;

export function getSharedGLTFLoader(): GLTFLoader {
  if (!sharedGLTFLoader) {
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    gltfLoader.setDRACOLoader(dracoLoader);
    sharedGLTFLoader = gltfLoader;
  }
  return sharedGLTFLoader;
}
