import Renderer from "../../engine/Renderer.js";
import Bullet from "./Bullet.js";
import * as THREE from "three";

export default class Barrel {
  constructor(turret, length, innerRadius, outerRadius, color) {
    this.turret = turret;
    this.length = length;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
    this.color = color;
    this.angle = 0;
    this.renderer = new Renderer();

    this.mesh = this.renderer.createBlock(0, 0,0,color, 0.3, 0.3, 3);

    
    this.muzzle = new THREE.Object3D();
    this.muzzle.position.y = 0.08;

    this.mesh.add(this.muzzle);

    this.turret.mesh.add(this.mesh);

    this.mesh.position.set(0, 0.3, this.turret.depth/2 );
  }

  aimUp(delta) {
    this.angle -= delta;
    this.mesh.rotation.x = 0  + this.angle;
  }

  aimDown(delta) {
    this.angle += delta;
    this.mesh.rotation.x = this.angle;
  }

shoot(bulletsArray, scene) {
  this.muzzle.updateMatrixWorld(true);

  const worldPos = new THREE.Vector3();
  const worldDir = new THREE.Vector3()

  this.muzzle.getWorldPosition(worldPos);
  this.muzzle.getWorldDirection(worldDir);

  const bullet = new Bullet(worldPos.clone(), worldDir.normalize(), scene);
  bulletsArray.push(bullet);
}

}

