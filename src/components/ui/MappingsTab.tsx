import React from 'react';
import MappingsTabComponent from '../mappings/MappingsTab';

interface MappingsTabProps {
    projectId: string;
}

export function MappingsTab({ projectId }: MappingsTabProps) {
    return <MappingsTabComponent projectId={projectId} />;
}
