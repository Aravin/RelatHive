<script lang="ts">
    import { Network } from 'vis-network';
    import type { Edge } from 'vis-network';
    import { DataSet } from 'vis-data';
    import { onMount } from 'svelte';
    import type { FamilyMember } from '$lib/types';
    import { defaultMember } from '$lib/types';
    import { genderBasedRelations } from '$lib/types';

    let container: HTMLElement;
    let showModal = false;

    // Load nodes from localStorage or use default
    function loadInitialNodes(): FamilyMember[] {
        if (typeof window === 'undefined') return [defaultMember];
        
        try {
            const savedNodes = localStorage.getItem('familyTreeNodes');
            return savedNodes ? JSON.parse(savedNodes) : [defaultMember];
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return [defaultMember];
        }
    }

    let familyNodes = loadInitialNodes();

    function getLevel(relation: string): number {
        // Group relations by level
        const levels: Record<string, number> = {
            // Level 1 - Grandparents
            'grandfather': 1,
            'grandmother': 1,
            'grandfather_in_law': 1,
            'grandmother_in_law': 1,

            // Level 2 - Parents
            'father': 2,
            'mother': 2,
            'father_in_law': 2,
            'mother_in_law': 2,

            // Level 3 - Self, Siblings, and Spouse
            'self': 3,
            'brother': 3,
            'sister': 3,
            'spouse': 3,
            'brother_in_law': 3,
            'sister_in_law': 3,

            // Level 4 - Children
            'son': 4,
            'daughter': 4,

            // Level 5 - Grandchildren
            'grandson': 5,
            'granddaughter': 5
        };
        return levels[relation] || 3;
    }

    let newMember: FamilyMember = {
        id: crypto.randomUUID(),
        name: '',
        gender: '',
        relation: '',
        children: []
    };
    
    let selectedRelativeTo = 'root';

    $: availableRelations = newMember.gender ? genderBasedRelations[newMember.gender] : [];
    $: availableRelatives = [
        { id: 'root', label: 'Me (Self)' },
        ...familyNodes
            .filter(node => node.relation !== 'self')
            .map(node => ({
                id: node.id,
                label: `${node.name} (${node.relation})`
            }))
    ];

    function formatDate(member: FamilyMember): string {
        if (!member.birthYear) return '';
        const month = member.birthMonth ? `-${member.birthMonth}` : '';
        const day = member.birthDay ? `-${member.birthDay}` : '';
        return `\n(${member.birthYear}${month}${day})`;
    }

    function formatNodeLabel(member: FamilyMember): string {
        const dateStr = formatDate(member);
        let relationStr = member.relation;

        // Format relation string
        if (member.relation === 'self') {
            relationStr = 'Me';
        } else if (member.relation) {
            // Capitalize first letter
            relationStr = member.relation.charAt(0).toUpperCase() + member.relation.slice(1);
        }

        return `${member.name}\n(${relationStr})${dateStr}`;
    }

    function initNetwork(container: HTMLElement) {
        // Create nodes with specific x-coordinates for positioning
        const visNodes = new DataSet(
            familyNodes.map(member => {
                const baseNode = {
                    id: member.id,
                    label: formatNodeLabel(member),
                    level: getLevel(member.relation),
                    color: member.gender === 'male' ? '#E3F2FD' : '#FCE4EC',
                    font: { size: 16, multi: true, align: 'center' },
                    borderWidth: 2,
                    borderColor: member.gender === 'male' ? '#2196F3' : '#E91E63',
                    shape: 'box',
                    fixed: { y: true }
                };

                // Position nodes horizontally based on their relationships
                if (member.relation === 'spouse') {
                    const relatedTo = familyNodes.find(m => m.id === member.relativeTo);
                    if (relatedTo) {
                        return {
                            ...baseNode,
                            x: 100,  // Position spouse to the right
                            fixed: { x: true, y: true }
                        };
                    }
                } else if (member.relation === 'brother' || member.relation === 'sister') {
                    return {
                        ...baseNode,
                        x: -200,  // Position siblings to the left
                        fixed: { x: true, y: true }
                    };
                }

                return baseNode;
            })
        );

        const edges = familyNodes
            .map(member => {
                if (member.relation === 'self') return null;

                // For spouses - horizontal connection
                if (member.relation === 'spouse') {
                    return {
                        from: member.relativeTo || 'root',
                        to: member.id,
                        smooth: { enabled: false },  // Straight line
                        physics: false,
                        length: 100,
                        arrows: { to: false },
                        color: { color: '#999999' },
                        dashes: [5, 5]
                    };
                }

                // For siblings - connect to father or root
                if (member.relation === 'brother' || member.relation === 'sister') {
                    const father = familyNodes.find(m => m.relation === 'father');
                    return {
                        from: father ? father.id : 'root',
                        to: member.id,
                        smooth: { 
                            enabled: true,
                            type: 'curvedCW',
                            roundness: 0.2
                        }
                    };
                }

                // For other relationships
                return {
                    from: member.relation.includes('father') || member.relation.includes('mother') ? member.id : member.relativeTo || 'root',
                    to: member.relation.includes('father') || member.relation.includes('mother') ? 'root' : member.id,
                    smooth: { 
                        enabled: true,
                        type: 'curvedCCW',
                        roundness: 0.2
                    }
                };
            })
            .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

        const options = {
            layout: {
                hierarchical: {
                    direction: 'UD',
                    sortMethod: 'directed',
                    nodeSpacing: 200,
                    levelSeparation: 150,
                    parentCentralization: false,
                    blockShifting: false
                }
            },
            physics: {
                enabled: false
            },
            nodes: {
                fixed: true
            },
            edges: {
                smooth: {
                    type: 'curvedCW',
                    roundness: 0.2
                }
            }
        };

        const network = new Network(container, { nodes: visNodes, edges }, options);
    }

    function handleSubmit() {
        if (!newMember.name || !newMember.relation || !newMember.gender) return;
        
        // Get relation label from available relations
        const relationObj = availableRelations.find(r => r.value === newMember.relation);
        
        familyNodes = [...familyNodes, {
            ...newMember,
            relativeTo: selectedRelativeTo,
            relation: relationObj?.value || newMember.relation // Use the relation value
        }];
        
        localStorage.setItem('familyTreeNodes', JSON.stringify(familyNodes));
        
        initNetwork(container);
        showModal = false;

        newMember = {
            id: crypto.randomUUID(),
            name: '',
            gender: '',
            relation: '',
            children: [],
            relativeTo: 'root'
        };
        selectedRelativeTo = 'root';
    }

    function deleteMember(id: string) {
        if (id === 'root') return;
        familyNodes = familyNodes.filter(node => node.id !== id);
        localStorage.setItem('familyTreeNodes', JSON.stringify(familyNodes));
        initNetwork(container);
    }

    function openAddModal() {
        showModal = true;
    }

    onMount(() => initNetwork(container));
</script>

<div class="container">
    <div bind:this={container} class="network-container"></div>
    <button class="add-button" on:click={openAddModal}>
        Add Family Member
    </button>
</div>

{#if showModal}
    <div class="modal-overlay" 
        on:click|self={() => showModal = false}
        on:keydown|self={(e) => e.key === 'Escape' && (showModal = false)}
        tabindex="0"
        role="button"
        aria-label="Close modal">
        <div class="modal">
            <h2>Add Family Member</h2>
            <form on:submit|preventDefault={handleSubmit}>
                <div class="form-group">
                    <label for="relativeTo">Relative To</label>
                    <select id="relativeTo" bind:value={selectedRelativeTo}>
                        {#each availableRelatives as relative}
                            <option value={relative.id}>{relative.label}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-group">
                    <label for="name">Name</label>
                    <input 
                        id="name"
                        type="text" 
                        bind:value={newMember.name}
                        required
                    />
                </div>
                
                <div class="form-group">
                    <label for="gender">Gender</label>
                    <select id="gender" bind:value={newMember.gender} required>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="relation">Relation</label>
                    <select id="relation" bind:value={newMember.relation} required>
                        <option value="">Select Relation</option>
                        {#each availableRelations as rel}
                            <option value={rel.value}>{rel.label}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-group">
                    <label for="birthYear">Date of Birth</label>
                    <div class="date-inputs">
                        <div class="date-field">
                            <label for="birthYear-input">Year</label>
                            <input 
                                id="birthYear-input"
                                type="number" 
                                bind:value={newMember.birthYear}
                                min="1900"
                                max={new Date().getFullYear()}
                                placeholder="YYYY"
                            />
                        </div>
                        <div class="date-field">
                            <label for="birthMonth">Month</label>
                            <select id="birthMonth" bind:value={newMember.birthMonth}>
                                <option value="">-</option>
                                <option value="1">January</option>
                                <option value="2">February</option>
                                <option value="3">March</option>
                                <option value="4">April</option>
                                <option value="5">May</option>
                                <option value="6">June</option>
                                <option value="7">July</option>
                                <option value="8">August</option>
                                <option value="9">September</option>
                                <option value="10">October</option>
                                <option value="11">November</option>
                                <option value="12">December</option>
                            </select>
                        </div>
                        <div class="date-field">
                            <label for="birthDay">Day</label>
                            <input 
                                id="birthDay"
                                type="number" 
                                bind:value={newMember.birthDay}
                                min="1"
                                max="31"
                                placeholder="DD"
                            />
                        </div>
                    </div>
                </div>

                <div class="button-group">
                    <button type="submit" class="submit-btn">Add Member</button>
                    <button type="button" class="cancel-btn" on:click={() => showModal = false}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    .container {
        position: relative;
        width: 100%;
        height: 100vh;
    }

    .network-container {
        width: 100%;
        height: 100vh;
        background: #f5f5f5;
    }

    .add-button {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 2rem;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: transform 0.2s;
    }

    .add-button:hover {
        transform: translateY(-2px);
        background: #45a049;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }

    .form-group input,
    .form-group select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .button-group {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .submit-btn,
    .cancel-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .submit-btn {
        background: #4CAF50;
        color: white;
    }

    .submit-btn:hover {
        background: #45a049;
    }

    .cancel-btn {
        background: #f5f5f5;
        color: #333;
    }

    .cancel-btn:hover {
        background: #e0e0e0;
    }

    .date-inputs {
        display: grid;
        grid-template-columns: 2fr 2fr 1fr;
        gap: 1rem;
    }

    .date-field {
        display: flex;
        flex-direction: column;
    }

    .date-field label {
        font-size: 0.8em;
        margin-bottom: 0.25rem;
    }

    .date-field input,
    .date-field select {
        padding: 0.5rem;
    }
</style>