export type Basis = 'RECTILINEAR' | 'RECTILINEAR_H' | 'DIAGONAL' | 'DIAGONAL_NEG';

export type Bit = 0 | 1;

export interface PhotonState {
    basis: Basis, 
    bit: Bit, 
    color: string;
}