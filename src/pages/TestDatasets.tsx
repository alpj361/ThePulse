import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import DatasetsTab from '../components/datasets/DatasetsTab';

const TestDatasets: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Datasets Feature Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Testing the complete datasets functionality with all Phase 2 & 3 features.
        </Typography>
      </Box>

      {/* Test with a mock project ID */}
      <DatasetsTab projectId="test-project-123" />
    </Container>
  );
};

export default TestDatasets;