import React from 'react';
import DatasetsTabComponent from '../datasets/DatasetsTab';

interface DatasetsTabProps {
    projectId: string;
}

export function DatasetsTab({ projectId }: DatasetsTabProps) {
    return <DatasetsTabComponent projectId={projectId} />;
}
