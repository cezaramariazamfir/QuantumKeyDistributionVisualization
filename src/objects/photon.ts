import * as THREE from "three";
import { type Basis, type Bit, type PhotonState } from "../types/quantum";

export class Photon {
  public mesh: THREE.Group;
  private state: PhotonState;

  constructor(basis: Basis, bit: Bit){
    this.state = {
      basis: basis,
      bit: bit, 
      color: basis === 'RECTILINEAR' ? 'red' : 'blue'
    };

    this.mesh = new THREE.Group();
    this.createVisuals();
  };

  private createVisuals(){
    // photon 
    const sphereG = new THREE.SphereGeometry(0.15, 32, 32);
    const sphereM = new THREE.MeshStandardMaterial({
        color: this.state.color,
        metalness: 0.9,       
        roughness: 0.1,       
        emissive: this.state.color, 
        emissiveIntensity: 0.5
    });
    const core = new THREE.Mesh(sphereG, sphereM);
    this.mesh.add(core);

    // polarization line
    const lineG = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
    const lineM = new THREE.MeshStandardMaterial({
            color: this.state.color, 
            transparent: true, 
            opacity: 0.8,         
            emissive: this.state.color,
            emissiveIntensity: 1.0,
            metalness: 0.5,
            roughness: 0.2
        });    
        const line = new THREE.Mesh(lineG, lineM);

    if(this.state.basis === 'RECTILINEAR'){
      // daca e 1 -> vertical, daca e 0 -> oriziontal
      line.rotation.z = this.state.bit === 1 ? 0 : Math.PI / 2;
    } else {
      // daca e 1 -> unghi de 45 diagonala, daca e 0 -? unghi de -45 diagonala opusa
      line.rotation.z = this.state.bit === 1 ? Math.PI / 4 : -Math.PI / 4;
    }
    this.mesh.add(line);
  };

  public setPosition(x: number, y: number, z: number){
    this.mesh.position.set(x, y, z);
  }


}