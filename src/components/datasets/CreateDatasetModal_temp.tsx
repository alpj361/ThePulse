  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Dataset File
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload a JSON or CSV file to create a public dataset
            </Typography>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 6,
                textAlign: 'center',
                bgcolor: 'grey.50',
                '&:hover': { bgcolor: 'grey.100' }
              }}
            >
              <input
                accept=".json,.csv"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<FiUpload />}
                  size="large"
                  sx={{ mb: 2 }}
                >
                  Choose File
                </Button>
              </label>

              <Typography variant="body1" gutterBottom>
                Drag & drop or click to upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: JSON, CSV (Max 1MB)
              </Typography>
            </Box>

            {formData.file && (
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="subtitle2">File uploaded successfully!</Typography>
                <Typography variant="body2">
                  {formData.file.name} - {formData.data.length} rows, {formData.schema.length} columns
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Dataset Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure your dataset details
            </Typography>

            <TextField
              fullWidth
              label="Dataset Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 3 }}
              required
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 3 }}
              placeholder="Describe what this dataset contains and its purpose..."
            />

            <TextField
              fullWidth
              label="Tags (comma separated)"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              }))}
              helperText="Add tags to help organize and find your dataset"
              sx={{ mb: 3 }}
            />

            <Alert severity="info" sx={{ mb: 3 }}>
              This dataset will be created as <strong>public</strong> and will be visible to all users.
            </Alert>

            {formData.file && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Preview</Typography>
                <Typography variant="body2">
                  <strong>File:</strong> {formData.file.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Rows:</strong> {formData.data.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Columns:</strong> {formData.schema.map(col => col.name).join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Create Dataset
            </Typography>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Dataset Information</Typography>
              <Typography><strong>Name:</strong> {formData.name}</Typography>
              <Typography><strong>Description:</strong> {formData.description || 'No description'}</Typography>
              <Typography><strong>Visibility:</strong> Public</Typography>
              <Typography><strong>Source:</strong> File Upload</Typography>
              <Typography><strong>File:</strong> {formData.file?.name}</Typography>
              <Typography><strong>Rows:</strong> {formData.data.length}</Typography>
              <Typography><strong>Columns:</strong> {formData.schema.length}</Typography>

              {formData.tags && formData.tags.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography component="span"><strong>Tags:</strong> </Typography>
                  {formData.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" sx={{ ml: 0.5 }} />
                  ))}
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Schema Preview</Typography>
              <Grid container spacing={2}>
                {formData.schema.map((col, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Typography variant="body2">
                      <strong>{col.name}</strong> ({col.type})
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Alert severity="success">
              Ready to create your public dataset! All users will be able to view and use this data.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };