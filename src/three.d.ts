declare module 'three' {
  export class WebGLRenderer {
    constructor(params?: {
      canvas?: HTMLCanvasElement;
      antialias?: boolean;
      alpha?: boolean;
    });
    setSize(width: number, height: number): void;
    setClearColor(color: number): void;
    setPixelRatio(ratio: number): void;
    render(scene: Scene, camera: Camera): void;
    dispose(): void;
  }

  export class Scene {
    background: Color | null;
    children: Object3D[];
    add(...objects: Object3D[]): void;
    remove(...objects: Object3D[]): void;
  }

  export class Object3D {
    position: Vector3;
    scale: Vector3;
    rotation: Euler;
    children: Object3D[];
    renderOrder: number;
    add(...objects: Object3D[]): void;
    remove(...objects: Object3D[]): void;
  }

  export class Group extends Object3D {}

  export class Camera extends Object3D {
    lookAt(x: number, y: number, z: number): void;
    updateProjectionMatrix(): void;
  }

  export class OrthographicCamera extends Camera {
    constructor(
      left: number,
      right: number,
      top: number,
      bottom: number,
      near: number,
      far: number
    );
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  export class Vector3 {
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): Vector3;
  }

  export class Euler {
    x: number;
    y: number;
    z: number;
  }

  export class Color {
    constructor(color: number | string);
  }

  // Geometries
  export class BufferGeometry {
    dispose(): void;
  }

  export class BoxGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, depth?: number);
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(
      width?: number,
      height?: number,
      widthSegments?: number,
      heightSegments?: number
    );
  }

  // Materials
  export class Material {
    transparent: boolean;
    opacity: number;
    side: number;
    depthTest: boolean;
    depthWrite: boolean;
    dispose(): void;
  }

  export class MeshBasicMaterial extends Material {
    constructor(params?: {
      color?: number | string;
      transparent?: boolean;
      opacity?: number;
      side?: number;
      map?: Texture;
      alphaTest?: number;
      wireframe?: boolean;
      depthTest?: boolean;
      depthWrite?: boolean;
    });
    color: Color;
    map: Texture | null;
  }

  export class MeshLambertMaterial extends Material {
    constructor(params?: {
      color?: number | string;
      transparent?: boolean;
      opacity?: number;
    });
    color: Color;
  }

  export class SpriteMaterial extends Material {
    constructor(params?: {
      map?: Texture;
      transparent?: boolean;
      depthTest?: boolean;
      depthWrite?: boolean;
    });
    map: Texture | null;
  }

  // Mesh and Sprite
  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material);
    geometry: BufferGeometry;
    material: Material;
  }

  export class Sprite extends Object3D {
    constructor(material?: SpriteMaterial);
    material: SpriteMaterial;
  }

  // Textures
  export class Texture {
    minFilter: number;
    magFilter: number;
    needsUpdate: boolean;
    dispose(): void;
  }

  export class CanvasTexture extends Texture {
    constructor(canvas: HTMLCanvasElement);
  }

  // Lights
  export class Light extends Object3D {}

  export class AmbientLight extends Light {
    constructor(color?: number | string, intensity?: number);
  }

  export class DirectionalLight extends Light {
    constructor(color?: number | string, intensity?: number);
  }

  export class PointLight extends Light {
    constructor(
      color?: number | string,
      intensity?: number,
      distance?: number,
      decay?: number
    );
  }

  // Constants
  export const DoubleSide: number;
  export const NearestFilter: number;
}
