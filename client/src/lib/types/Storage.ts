import type { FamilyMember } from './FamilyMember';

export interface StorageService {
    save(data: FamilyMember): void;
    load(): FamilyMember | null;
}

export const localStorageService: StorageService = {
    save(data: FamilyMember) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('familyTree', JSON.stringify(data));
        }
    },
    load() {
        if (typeof window === 'undefined') return null;
        const data = localStorage.getItem('familyTree');
        return data ? JSON.parse(data) : null;
    }
};