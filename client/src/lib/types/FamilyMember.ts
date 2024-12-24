export interface FamilyMember {
    id: string;
    name: string;
    gender: 'male' | 'female' | 'other' | '';
    relation: string;
    birthYear?: number;
    birthMonth?: number;
    birthDay?: number;
    children: FamilyMember[];
}

export const defaultMember: FamilyMember = {
    id: 'root',
    name: "Me",
    gender: "male",
    relation: "self",
    children: []
};