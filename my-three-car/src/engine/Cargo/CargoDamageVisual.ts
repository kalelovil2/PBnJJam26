import * as THREE from "three";

export class CargoDamageVisual {
  mesh: THREE.Mesh;

  private material: THREE.MeshStandardMaterial;

  private damage = 0;

  constructor(baseMesh: THREE.Mesh) {
    this.material = baseMesh.material as THREE.MeshStandardMaterial;

    this.mesh = baseMesh;
  }

  applyMeshDent(
    worldHitPos: THREE.Vector3,
    impactNormal: THREE.Vector3,
    damage: number
  ) {
    const geometry =
      this.mesh.geometry as THREE.BoxGeometry;

    const pos =
      geometry.attributes.position;

    //
    // convert hit position into local space
    //

    const localHit =
      this.mesh.worldToLocal(
        worldHitPos.clone()
      );

const localNormal =
  impactNormal.clone();

localNormal.transformDirection(
  this.mesh.matrixWorld.clone().invert()
);

localNormal.normalize();

    //
    // dent settings
    //

    const radius = 0.9;

const dentStrength =
  Math.min(damage * 0.25, 0.5);

    for (let i = 0; i < pos.count; i++) {

      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      const vert =
        new THREE.Vector3(vx, vy, vz);

      //
      // distance from impact
      //

      const dist =
        vert.distanceTo(localHit);

      //
      // outside dent radius
      //

      if (dist > radius) {
        continue;
      }

      //
      // falloff
      //

      const influence =
        1.0 - (dist / radius);

      //
      // push inward
      //

      vert.x -= localNormal.x
        * dentStrength
        * influence;

      vert.y -= localNormal.y
        * dentStrength
        * influence;

      vert.z -= localNormal.z
        * dentStrength
        * influence;

      pos.setXYZ(
        i,
        vert.x,
        vert.y,
        vert.z
      );
    }

    pos.needsUpdate = true;

    geometry.computeVertexNormals();
  }

  resetFlash() {
    this.material.emissiveIntensity *= 0.8;
  }
}