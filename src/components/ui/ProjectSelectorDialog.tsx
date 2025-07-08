import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useAuth } from '../../context/AuthContext';
import { getProjectsByUser } from '../../services/projects';
import { Project } from '../../types/projects';

interface ProjectSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (project: Project) => void;
  title?: string;
}

const ProjectSelectorDialog: React.FC<ProjectSelectorDialogProps> = ({
  open,
  onClose,
  onSelect,
  title = 'Seleccionar proyecto',
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchProjects();
    }
  }, [open, user]);

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getProjectsByUser(user.id, undefined, { field: 'updated_at', direction: 'desc' });
      setProjects(data);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2 }}>
        <DialogTitle sx={{ m: 0, p: 0 }}>{title}</DialogTitle>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : projects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No tienes proyectos aún.
          </Typography>
        </Box>
      ) : (
        <List>
          {projects.map((project) => (
            <ListItemButton key={project.id} onClick={() => onSelect(project)}>
              <ListItemText
                primary={project.title}
                secondary={project.description?.slice(0, 60)}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Dialog>
  );
};

export default ProjectSelectorDialog; 