import * as THREE from 'three';
// @ts-expect-error error
import { Text } from 'troika-three-text';

export type CharacterRole = 'ALICE' | 'BOB' | 'EVE';

export class QuantumCharacter {
  public mesh: THREE.Group;
  private material: THREE.MeshPhysicalMaterial;
  private role: CharacterRole;

  constructor(role: CharacterRole) {
    this.role = role;
    this.mesh = new THREE.Group();

    let mainColor: string;
    switch (role) {
      case 'ALICE': mainColor = 'purple'; break; 
      case 'BOB': mainColor = 'green'; break;   
      case 'EVE': mainColor = 'red'; break;   
    }

    this.material = new THREE.MeshPhysicalMaterial({
      color: mainColor,
      metalness: 0.6, 
      roughness: 0.3,
      emissive: mainColor,
      emissiveIntensity: 0.4 
    });

    this.createBodyParts();
    this.addNameTag(); 
  }

  private createBodyParts() {
    const torsoGeom = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    const torso = new THREE.Mesh(torsoGeom, this.material);
    torso.position.y = 0.4; 
    this.mesh.add(torso);


    const headGeom = new THREE.SphereGeometry(0.25, 32, 16);
    const head = new THREE.Mesh(headGeom, this.material);
    head.position.y = 1.05; 
    this.mesh.add(head);

    if (this.role === 'EVE') {
        const spikeGeom = new THREE.ConeGeometry(0.1, 0.3, 4);
        const spikeMat = new THREE.MeshPhysicalMaterial({ color: 0xff0000, metalness: 0.9, roughness: 0.1 });
        const spike = new THREE.Mesh(spikeGeom, spikeMat);
        spike.position.set(0, 1.4, 0); 
        this.mesh.add(spike);
    }
  }

  private addNameTag() {
    const myText = new Text();

    myText.text = this.role; 
    myText.fontSize = 0.3; 
    myText.color = 0xffffff; 
    myText.anchorX = 'center'; 
    myText.anchorY = 'bottom'; 
    
    myText.position.set(0, 1.6, 0); 

    myText.sync();

    this.mesh.add(myText);
  }

  public setPosition(x: number, y: number, z: number) {
    this.mesh.position.set(x, y, z);
  }
}