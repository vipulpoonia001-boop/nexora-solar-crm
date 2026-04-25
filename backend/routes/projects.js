import { Router } from 'express';
import {
  getProjects, getProject, createProject, updateProject, deleteProject,
  updateProjectStage, updateNetMeterStatus, updateSubsidyStatus, getProjectStats
} from '../controllers/projectsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, projectValidation } from '../middleware/validation.js';

const router = Router();

router.get('/', authenticate, getProjects);
router.get('/stats', authenticate, getProjectStats);
router.get('/:id', authenticate, getProject);
router.post('/', authenticate, validate(projectValidation), createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);
router.patch('/:id/stage', authenticate, updateProjectStage);
router.patch('/:id/netmeter', authenticate, updateNetMeterStatus);
router.patch('/:id/subsidy', authenticate, updateSubsidyStatus);

export default router;
