import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

import {
    ASTEROID_COUNT,
    LEVEL_SIZE,
    PLAYER_START
} from "../../GameConfig";

import { getWorld } from "../../physics";

export class AsteroidGenerator {
    static asteroidPositions: THREE.Vector3[] = [];

    // ----------------------------------------
    // shared textures/material
    // ----------------------------------------

    static asteroidTexture =
        AsteroidGenerator.createAsteroidTexture();

    static asteroidBump =
        AsteroidGenerator.createAsteroidBumpMap();

    static asteroidMaterial =
        new THREE.MeshStandardMaterial({
            map: AsteroidGenerator.asteroidTexture,
            bumpMap: AsteroidGenerator.asteroidBump,
            bumpScale: 1.25,
            flatShading: true,
            roughness: 1
        });

    // ----------------------------------------
    // reusable geometry variants
    // ----------------------------------------

    static asteroidGeometries: THREE.BufferGeometry[] = [];

    static generateGeometryVariants() {
        this.asteroidGeometries = [];

        for (let i = 0; i < 8; i++) {
            const radius = 0.6 + Math.random() * 1.25;

            const geometry = this.createAsteroidGeometry(
                radius,
                0.08 + Math.random() * 0.15,
                1 + Math.random() * 3
            );

            this.asteroidGeometries.push(geometry);
        }
    }

    // ----------------------------------------
    // asteroid creation
    // ----------------------------------------

    static createAsteroids(scene: THREE.Scene) {
        this.generateGeometryVariants();

        const instancedMeshes: THREE.InstancedMesh[] = [];

        // one instanced mesh per geometry variant
        for (const geometry of this.asteroidGeometries) {
            const mesh = new THREE.InstancedMesh(
                geometry,
                this.asteroidMaterial,
                ASTEROID_COUNT
            );

            mesh.instanceMatrix.setUsage(
                THREE.DynamicDrawUsage
            );

            scene.add(mesh);

            instancedMeshes.push(mesh);
        }

        const counts =
            new Array(instancedMeshes.length).fill(0);

        const dummy = new THREE.Object3D();

        const asteroids: any[] = [];

        for (let i = 0; i < ASTEROID_COUNT; i++) {
            const planeY = sampleAsteroidY();

            const minPlayerDistance = 12;

            let position = new THREE.Vector3();

            let valid = false;

            while (!valid) {
                position.set(
                    (Math.random() - 0.5) *
                        LEVEL_SIZE *
                        2,
                    planeY,
                    (Math.random() - 0.5) *
                        LEVEL_SIZE *
                        2
                );

                valid =
                    position.distanceTo(
                        PLAYER_START
                    ) > minPlayerDistance;
            }

            // choose random geometry variant
            const variantIndex = Math.floor(
                Math.random() *
                    instancedMeshes.length
            );

            const instancedMesh =
                instancedMeshes[variantIndex];

            const instanceIndex =
                counts[variantIndex]++;

            // transform
            dummy.position.copy(position);

            dummy.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            const scale =
                0.8 + Math.random() * 1.5;

            dummy.scale.setScalar(scale);

            dummy.updateMatrix();

            instancedMesh.setMatrixAt(
                instanceIndex,
                dummy.matrix
            );

            // physics
            const startingRotation =
                new THREE.Vector3(
                    (Math.random() - 0.5) *
                        0.3,
                    (Math.random() - 0.5) *
                        0.3,
                    (Math.random() - 0.5) *
                        0.3
                );

            const startingDrift =
                new THREE.Vector3(
                    (Math.random() - 0.5) *
                        1.25,
                    0,
                    (Math.random() - 0.5) *
                        1.25
                );

            const body =
                this.createAsteroidPhysics(
                    position,
                    scale,
                    startingRotation,
                    startingDrift
                );

            (body as any).userData = {
                type: "asteroid"
            };

            this.asteroidPositions.push(
                position.clone()
            );

            asteroids.push({
                body,
                instancedMesh,
                instanceIndex,
                position: position.clone()
            });
        }

        // important
        for (const mesh of instancedMeshes) {
            mesh.instanceMatrix.needsUpdate = true;
        }

        console.log("Asteroid Variant Count: ", this.asteroidGeometries.length);
        console.log("Asteroid Instance Count: ", asteroids.length);
        return asteroids;
    }

    // ----------------------------------------
    // update transforms from physics
    // ----------------------------------------

    static updateAsteroids(
        asteroids: any[]
    ) {
        const dummy = new THREE.Object3D();

        const dirtyMeshes =
            new Set<THREE.InstancedMesh>();

        for (const asteroid of asteroids) {
            const body = asteroid.body;

            const pos = body.translation();
            
            asteroid.position.set(
                pos.x,
                pos.y,
                pos.z
            );

            const rot = body.rotation();

            dummy.position.set(
                pos.x,
                pos.y,
                pos.z
            );

            dummy.quaternion.set(
                rot.x,
                rot.y,
                rot.z,
                rot.w
            );

            dummy.scale.setScalar(1);

            dummy.updateMatrix();

            asteroid.instancedMesh.setMatrixAt(
                asteroid.instanceIndex,
                dummy.matrix
            );

            dirtyMeshes.add(
                asteroid.instancedMesh
            );
        }

        // mark dirty ONCE per mesh
        for (const mesh of dirtyMeshes) {
            mesh.instanceMatrix.needsUpdate =
                true;
        }
    }

    // ----------------------------------------
    // geometry generation
    // ----------------------------------------

    static createAsteroidGeometry(
        radius = 1,
        roughness = 0.5,
        detail = 3
    ) {
        // IMPORTANT:
        // detail 20 was catastrophic for performance
        const geometry =
            new THREE.IcosahedronGeometry(
                radius,
                12
            );

        const pos =
            geometry.attributes.position;

        const vertex = new THREE.Vector3();

        const normal = new THREE.Vector3();

        const stretch = new THREE.Vector3(
            0.7 + Math.random() * 0.8,
            0.7 + Math.random() * 0.8,
            0.7 + Math.random() * 0.8
        );

        for (let i = 0; i < pos.count; i++) {
            vertex.fromBufferAttribute(
                pos,
                i
            );

            normal.copy(vertex).normalize();

            const noise =
                Math.sin(normal.x * detail) *
                Math.sin(normal.y * detail) *
                Math.sin(normal.z * detail);

            const displacement =
                1 + noise * roughness;

            vertex.copy(
                normal.multiplyScalar(
                    radius * displacement
                )
            );

            vertex.x *= stretch.x;
            vertex.y *= stretch.y;
            vertex.z *= stretch.z;

            pos.setXYZ(
                i,
                vertex.x,
                vertex.y,
                vertex.z
            );
        }

        geometry.computeVertexNormals();

        return geometry;
    }

    // ----------------------------------------
    // textures
    // ----------------------------------------

    static createAsteroidTexture() {
        const size = 512;

        const canvas =
            document.createElement("canvas");

        canvas.width = size;
        canvas.height = size;

        const ctx =
            canvas.getContext("2d")!;

        ctx.fillStyle = "#444";

        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < 30000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;

            const brightness =
                90 + Math.random() * 40;

            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;

            ctx.fillRect(x, y, 1, 1);
        }

        return new THREE.CanvasTexture(
            canvas
        );
    }

    static createAsteroidBumpMap() {
        const size = 512;

        const canvas =
            document.createElement("canvas");

        canvas.width = size;
        canvas.height = size;

        const ctx =
            canvas.getContext("2d")!;

        ctx.fillStyle = "rgb(150,150,150)";

        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < 120; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;

            const radius =
                4 + Math.random() * 18;

            const gradient =
                ctx.createRadialGradient(
                    x,
                    y,
                    radius * 0.2,
                    x,
                    y,
                    radius
                );

            gradient.addColorStop(
                0,
                "rgba(90,90,90,0.4)"
            );

            gradient.addColorStop(
                0.7,
                "rgba(140,140,140,0.15)"
            );

            gradient.addColorStop(
                1,
                "rgba(128,128,128,0)"
            );

            ctx.fillStyle = gradient;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        return new THREE.CanvasTexture(
            canvas
        );
    }

    // ----------------------------------------
    // physics
    // ----------------------------------------

    static createAsteroidPhysics(
        position: {
            x: number;
            y: number;
            z: number;
        },
        radius = 1,
        startingRotation =
            new THREE.Vector3(),
        startingDrift =
            new THREE.Vector3()
    ) {
        const world = getWorld();

        const q = new THREE.Quaternion()
            .setFromEuler(
                new THREE.Euler(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                )
            );

        const bodyDesc =
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(
                    position.x,
                    position.y,
                    position.z
                )
                .setRotation(q)
                .setLinearDamping(0)
                .setAngularDamping(0)
                .setCanSleep(false);

        const body =
            world.createRigidBody(bodyDesc);

        const speedMultiplier =
            THREE.MathUtils.lerp(
                0.9,
                1.25,
                Math.random()
            );

        body.setLinvel(
            {
                x:
                    startingDrift.x *
                    speedMultiplier,
                y: 0,
                z:
                    startingDrift.z *
                    speedMultiplier
            },
            true
        );

        body.setAngvel(
            {
                x: startingRotation.x,
                y: startingRotation.y,
                z: startingRotation.z
            },
            false
        );

        const colliderDesc =
            RAPIER.ColliderDesc.ball(radius)
                .setMass(5 * radius)
                .setActiveEvents(
                    RAPIER.ActiveEvents
                        .COLLISION_EVENTS
                );

        world.createCollider(
            colliderDesc,
            body
        );

        return body;
    }
}

function sampleAsteroidY() {
    const bands = [-8, 0, 8];

    const weights = [1, 5, 1];

    const totalWeight =
        weights.reduce((a, b) => a + b, 0);

    let r = Math.random() * totalWeight;

    for (let i = 0; i < bands.length; i++) {
        r -= weights[i];

        if (r <= 0) {
            return bands[i];
        }
    }

    return 0;
}