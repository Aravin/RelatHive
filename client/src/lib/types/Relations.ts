import type { FamilyMember } from './FamilyMember';

export interface FamilyHierarchy {
    grandparents: {
        paternal: {
            grandfather: FamilyMember;
            grandmother: FamilyMember;
        };
        maternal: {
            grandfather: FamilyMember;
            grandmother: FamilyMember;
        };
    };
    parents: {
        father: {
            self: FamilyMember;
            spouse?: FamilyMember;
            siblings?: FamilyMember[];
        };
        mother: {
            self: FamilyMember;
            siblings?: FamilyMember[];
        };
    };
    self: {
        self: FamilyMember;
        spouse?: FamilyMember;
        siblings?: FamilyMember[];
    };
    children: {
        self: FamilyMember[];
        siblings?: FamilyMember[];
    };
}

export const relationRules = {
    self: {
        canAdd: ['father', 'mother', 'brother', 'sister', 'spouse', 'son', 'daughter'],
        position: 'center'
    },
    father: {
        canAdd: ['father', 'mother', 'brother', 'sister'],
        position: 'top'
    },
    mother: {
        canAdd: ['father', 'mother', 'brother', 'sister'],
        position: 'top'
    },
    brother: {
        canAdd: ['spouse', 'son', 'daughter'],
        position: 'same-level'
    },
    sister: {
        canAdd: ['spouse', 'son', 'daughter'],
        position: 'same-level'
    },
    spouse: {
        canAdd: ['son', 'daughter'],
        position: 'same-level'
    },
    son: {
        canAdd: ['spouse'],
        position: 'bottom'
    },
    daughter: {
        canAdd: ['spouse'],
        position: 'bottom'
    }
} as const;

export function getRelationLevel(relation: string): number {
    const levelMap: Record<string, number> = {
        'grandfather': 1,
        'grandmother': 1,
        'father': 2,
        'mother': 2,
        'uncle': 2,
        'aunt': 2,
        'self': 3,
        'spouse': 3,
        'sibling': 3,
        'cousin': 3,
        'son': 4,
        'daughter': 4,
        'child': 4,
        'nephew': 4,
        'niece': 4
    };
    return levelMap[relation] || 3;
}

export function getPossibleRelations(gender: 'male' | 'female' | 'other', parentRelation?: string): string[] {
    if (!parentRelation || parentRelation === 'self') {
        const firstLevel = {
            'male': ['father', 'brother', 'spouse', 'son'],
            'female': ['mother', 'sister', 'spouse', 'daughter'],
            'other': ['parent', 'sibling', 'spouse', 'child']
        };
        return firstLevel[gender] || [];
    }

    const relationHierarchy: Record<string, Record<'male' | 'female' | 'other', string[]>> = {
        'father': {
            'male': ['grandfather', 'uncle'],
            'female': ['grandmother', 'aunt'],
            'other': ['grandparent']
        },
        'mother': {
            'male': ['grandfather', 'uncle'],
            'female': ['grandmother', 'aunt'],
            'other': ['grandparent']
        },
        'spouse': {
            'male': ['son'],
            'female': ['daughter'],
            'other': ['child']
        },
        'brother': {
            'male': ['nephew'],
            'female': ['niece'],
            'other': ['child']
        },
        'sister': {
            'male': ['nephew'],
            'female': ['niece'],
            'other': ['child']
        }
    };

    return relationHierarchy[parentRelation]?.[gender] || [];
}

export const genderBasedRelations = {
    male: [
        // Direct family
        { value: 'father', label: 'Father' },
        { value: 'son', label: 'Son' },
        { value: 'brother', label: 'Brother' },
        { value: 'spouse', label: 'Spouse/Husband' },
        
        // Extended family
        { value: 'grandfather', label: 'Grandfather' },
        { value: 'grandson', label: 'Grandson' },
        { value: 'uncle', label: 'Uncle' },
        { value: 'nephew', label: 'Nephew' },
        
        // In-laws
        { value: 'father_in_law', label: 'Father-in-law' },
        { value: 'son_in_law', label: 'Son-in-law' },
        { value: 'brother_in_law', label: 'Brother-in-law' }
    ],
    female: [
        // Direct family
        { value: 'mother', label: 'Mother' },
        { value: 'daughter', label: 'Daughter' },
        { value: 'sister', label: 'Sister' },
        { value: 'spouse', label: 'Spouse/Wife' },
        
        // Extended family
        { value: 'grandmother', label: 'Grandmother' },
        { value: 'granddaughter', label: 'Granddaughter' },
        { value: 'aunt', label: 'Aunt' },
        { value: 'niece', label: 'Niece' },
        
        // In-laws
        { value: 'mother_in_law', label: 'Mother-in-law' },
        { value: 'daughter_in_law', label: 'Daughter-in-law' },
        { value: 'sister_in_law', label: 'Sister-in-law' }
    ],
    other: [
        // Direct family
        { value: 'parent', label: 'Parent' },
        { value: 'child', label: 'Child' },
        { value: 'sibling', label: 'Sibling' },
        { value: 'spouse', label: 'Spouse' },
        
        // Extended family
        { value: 'grandparent', label: 'Grandparent' },
        { value: 'grandchild', label: 'Grandchild' },
        { value: 'cousin', label: 'Cousin' },
        
        // In-laws
        { value: 'in_law', label: 'In-law' }
    ]
};
