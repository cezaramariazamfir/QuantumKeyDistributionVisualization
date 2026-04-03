import * as THREE from "three";
import { type Basis, type Bit } from "../types/quantum"; 

export class DeviceFilter {
    public mesh: THREE.Group;
    private basis: Basis;
    private bit: Bit;
    private slot: THREE.Mesh | null = null; 

    constructor(basis: Basis, bit: Bit) {
        this.basis = basis;
        this.bit = bit;

        this.mesh = new THREE.Group();
        this.createVisuals();
    }

    private createVisuals() {
        const color = this.basis === 'RECTILINEAR' ? 'yellow' : 'blue';

        const ringG = new THREE.TorusGeometry(0.5, 0.05, 16, 50);
        const ringM = new THREE.MeshPhysicalMaterial({ 
            color: 0x444444, 
            metalness: 0.9,
            roughness: 0.1,
            emissive: color,
            emissiveIntensity: 0.2
        });
        const ring = new THREE.Mesh(ringG, ringM);
        this.mesh.add(ring);
        
        const slotG = new THREE.BoxGeometry(0.1, 0.8, 0.01);
        const slotM = new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true,
            opacity: 0.8
        });
        this.slot = new THREE.Mesh(slotG, slotM);
        
        this.updateRotation();
        
        this.mesh.add(this.slot);
    }


    public updateRotation() {
        if (!this.slot) return;

        if (this.basis === 'RECTILINEAR') {
            // Bit 1 -> Vertical (0 rad), Bit 0 -> Orizontal (PI/2 rad)
            this.slot.rotation.z = this.bit === 1 ? 0 : Math.PI / 2;
        } else {
            // DIAGONAL: 45 de grade și -45 de grade
            this.slot.rotation.z = this.bit === 1 ? Math.PI / 4 : -Math.PI / 4;
        }
    }

    public setBit(bit: Bit) {
        this.bit = bit;
        this.updateRotation();
    }

    public setPosition(x: number, y: number, z: number) {
        this.mesh.position.set(x, y, z);
    }
}