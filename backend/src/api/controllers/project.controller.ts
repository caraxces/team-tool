import { Request, Response, NextFunction } from 'express';
import { 
  getAllProjects, 
  createProject,
  updateProject,
  deleteProject
} from '../services/project.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as projectService from '../services/project.service';

export const getAllProjectsHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      // This should technically be caught by the 'protect' middleware, but it's good practice
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const projects = await projectService.getAllProjects(user.id, user.role_id);

    res.status(200).json({
      status: 'success',
      data: {
        projects,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const getProjectDetailsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.id, 10);
        const details = await projectService.getProjectDetailsByProjectId(projectId);

        if (!details) {
            // It's not an error if details don't exist, we can create them.
            // Return a specific structure so frontend knows it's new.
            return res.status(200).json({
                status: 'success',
                data: {
                    details: null
                },
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                details
            },
        });
    } catch (error) {
        next(error);
    }
};

export const createOrUpdateProjectDetailsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.id, 10);
        const updatedDetails = await projectService.createOrUpdateProjectDetails(projectId, req.body);

        res.status(200).json({
            status: 'success',
            data: {
                details: updatedDetails
            },
        });
    } catch (error) {
        next(error);
    }
};


export const createProjectHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id; // We know user exists because of `protect` middleware
    const newProject = await createProject(req.body, userId);

    res.status(201).json({
      status: 'success',
      data: {
        project: newProject,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const updateProjectHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const updatedProject = await updateProject(projectId, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        project: updatedProject,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export async function deleteProjectHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const projectId = parseInt(req.params.id, 10);
        await deleteProject(projectId);

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (err: any) {
        next(err);
    }
}

export async function getProjectCsvTemplateHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const csvHeader = '"name","description","team_uuid","status","start_date","end_date"';
        const csvExample = '"New Marketing Campaign","Launch new product line","team-uuid-456","planning","2024-10-01","2025-03-31"';
        const csvContent = `${csvHeader}\n${csvExample}`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=projects-template.csv');
        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
}

export async function importProjectsFromCsvHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const fileContent = req.file.buffer.toString('utf8');
        const creatorId = req.user.id;

        const result = await projectService.importProjectsFromCsv(fileContent, creatorId);

        res.status(201).json({
            success: true,
            message: `CSV processed. ${result.successful} projects created, ${result.failed} failed.`,
            data: result
        });
    } catch (error) {
        next(error);
    }
} 