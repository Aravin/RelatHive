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

    // Load nodes from localStorage or use sample data
    function loadInitialNodes(): FamilyMember[] {
        if (typeof window === 'undefined') return [defaultMember];
        
        try {
            const savedNodes = localStorage.getItem('familyTreeNodes');
            if (savedNodes) {
                return JSON.parse(savedNodes);
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }

        // Sample family tree data
        return [
            defaultMember,
            {
                id: 'father',
                name: 'Father',
                gender: 'male',
                relation: 'father',
                children: []
            },
            {
                id: 'mother',
                name: 'Mother',
                gender: 'female',
                relation: 'mother',
                children: []
            },
            {
                id: 'sister',
                name: 'Sister',
                gender: 'female',
                relation: 'sister',
                children: []
            },
            {
                id: 'spouse',
                name: 'Spouse',
                gender: 'female',
                relation: 'spouse',
                children: []
            }
        ];
    }

    let familyNodes = loadInitialNodes();

    function getLevel(relation: string): number {
        const levels: Record<string, number> = {
            'grandfather': 1, 'grandmother': 1,
            'father': 2, 'mother': 2,
            'self': 3, 'spouse': 3, 'sibling': 3,
            'son': 4, 'daughter': 4,
            'grandson': 5, 'granddaughter': 5
        };
        return levels[relation] || 3;
    }

    function openAddModal() {
        showModal = true;
    }

    let newMember: FamilyMember = {
        id: crypto.randomUUID(),
        name: '',
        gender: '',
        relation: '',
        children: []
    };
    
    let selectedRelativeTo = 'root'; // Default to root/self

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
        const relationStr = member.relation === 'self' ? 'Me' : member.relation;
        return `${member.name}\n(${relationStr})${dateStr}`;
    }

    function createEdge(member: FamilyMember, relativeTo: string) {
        return {
            from: relativeTo,
            to: member.id,
            smooth: {
                enabled: true,
                type: 'cubicBezier',
                roundness: 0.5
            }
        };
    }

    function createNodes(familyNodes: FamilyMember[]) {
        const nodes = [];
        const processedIds = new Set();

        for (const member of familyNodes) {
            if (processedIds.has(member.id)) continue;

            if (member.relation === 'spouse') {
                // Find the partner (self)
                const self = familyNodes.find(m => m.relation === 'self');
                if (self) {
                    // Create a marriage node (invisible connector)
                    nodes.push({
                        id: `marriage_${self.id}_${member.id}`,
                        label: '💑',
                        level: getLevel('self'),
                        shape: 'circle',
                        size: 25,
                        color: '#E91E63',
                        font: { size: 20 }
                    });

                    // Add both partners
                    nodes.push({
                        id: self.id,
                        label: formatNodeLabel(self),
                        level: getLevel('self'),
                        color: self.gender === 'male' ? '#E3F2FD' : '#FCE4EC',
                        x: -50, // Position to left of marriage node
                        font: { size: 16, multi: true, align: 'center' },
                        borderWidth: 2,
                        borderColor: self.gender === 'male' ? '#2196F3' : '#E91E63',
                        shape: 'box'
                    });

                    nodes.push({
                        id: member.id,
                        label: formatNodeLabel(member),
                        level: getLevel('self'),
                        color: member.gender === 'male' ? '#E3F2FD' : '#FCE4EC',
                        x: 50, // Position to right of marriage node
                        font: { size: 16, multi: true, align: 'center' },
                        borderWidth: 2,
                        borderColor: member.gender === 'male' ? '#2196F3' : '#E91E63',
                        shape: 'box'
                    });

                    processedIds.add(self.id);
                    processedIds.add(member.id);
                }
            } else if (!processedIds.has(member.id)) {
                nodes.push({
                    id: member.id,
                    label: formatNodeLabel(member),
                    level: getLevel(member.relation),
                    color: member.gender === 'male' ? '#E3F2FD' : '#FCE4EC',
                    font: { size: 16, multi: true, align: 'center' },
                    borderWidth: 2,
                    borderColor: member.gender === 'male' ? '#2196F3' : '#E91E63',
                    shape: 'box'
                });
                processedIds.add(member.id);
            }
        }

        return new DataSet(nodes);
    }

    function createMarriageEdges(familyNodes: FamilyMember[]) {
        const edges = [];
        
        // Create marriage connections
        const spouse = familyNodes.find(m => m.relation === 'spouse');
        const self = familyNodes.find(m => m.relation === 'self');
        
        if (spouse && self) {
            const marriageNodeId = `marriage_${self.id}_${spouse.id}`;
            edges.push(
                {
                    from: 'root',
                    to: marriageNodeId,
                    smooth: { 
                        enabled: true,
                        type: 'continuous',
                        roundness: 0
                    }
                },
                {
                    from: marriageNodeId,
                    to: spouse.id,
                    smooth: { 
                        enabled: true,
                        type: 'continuous',
                        roundness: 0
                    }
                }
            );
        }

        // Create other family connections
        familyNodes.forEach(member => {
            if (member.relation !== 'self' && member.relation !== 'spouse') {
                edges.push({
                    from: selectedRelativeTo,
                    to: member.id,
                    smooth: {
                        enabled: true,
                        type: 'cubicBezier',
                        roundness: 0.5
                    }
                });
            }
        });

        return edges;
    }

    function initNetwork(container: HTMLElement) {
        // Create nodes
        const visNodes = new DataSet(
            familyNodes.map(member => ({
                id: member.id,
                label: formatNodeLabel(member),
                level: getLevel(member.relation),
                color: member.gender === 'male' ? '#E3F2FD' : '#FCE4EC',
                font: {
                    size: 16,
                    multi: true,
                    align: 'center'
                },
                borderWidth: 2,
                borderColor: member.gender === 'male' ? '#2196F3' : '#E91E63',
                shape: 'box'
            }))
        );

        // Create edges
        const edges = familyNodes
            .map(member => {
                if (member.relation === 'self') return null;
                return {
                    from: 'root',
                    to: member.id,
                    smooth: {
                        enabled: true,
                        type: 'cubicBezier',
                        roundness: 0.5
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
                    levelSeparation: 150
                }
            },
            physics: false
        };

        const network = new Network(container, { nodes: visNodes, edges }, options);

        // Show delete button only on hover
        network.on('hoverNode', function(params) {
            if (params.node !== 'root') {
                const node = visNodes.get(params.node);
                if (!node) return;
                
                visNodes.update({
                    ...node,
                    label: formatNodeLabel(node as any) + '\n\n🗑️'
                });
                container.style.cursor = 'pointer';
            }
        });

        network.on('blurNode', function(params) {
            if (params.node !== 'root') {
                const node = visNodes.get(params.node);
                if (!node) return;

                visNodes.update({
                    ...node,
                    label: formatNodeLabel(node as any)
                });
                container.style.cursor = 'default';
            }
        });

        // Handle delete button click
        network.on('click', function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                if (nodeId !== 'root' && !nodeId.includes('marriage_')) {
                    const clickY = params.pointer.DOM.y;
                    const nodePos = network.getBoundingBox(nodeId);
                    const deleteIconArea = nodePos.bottom - 20;

                    if (clickY > deleteIconArea && clickY < nodePos.bottom) {
                        const deleteConfirm = window.confirm('Do you want to delete this family member?');
                        if (deleteConfirm) {
                            deleteMember(nodeId);
                        }
                    }
                }
            }
        });
    }

    onMount(() => {
        initNetwork(container);
    });

    function handleSubmit() {
        if (!newMember.name || !newMember.relation) return;
        
        familyNodes = [...familyNodes, newMember];
        localStorage.setItem('familyTreeNodes', JSON.stringify(familyNodes));
        
        initNetwork(container);
        showModal = false;

        newMember = {
            id: crypto.randomUUID(),
            name: '',
            gender: '',
            relation: '',
            children: []
        };
        selectedRelativeTo = 'root';
    }

    function deleteMember(id: string) {
        if (id === 'root') return;
        familyNodes = familyNodes.filter(node => node.id !== id);
        localStorage.setItem('familyTreeNodes', JSON.stringify(familyNodes));
        initNetwork(container);
    }
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