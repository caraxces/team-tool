import { Request, Response, NextFunction } from 'express';
import * as locationService from '../services/work-location.service';

export const getLocationsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const locations = await locationService.getWorkLocations();
        res.status(200).json({ success: true, data: locations });
    } catch (error) {
        next(error);
    }
};

export const createLocationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newLocation = await locationService.createWorkLocation(req.body);
        res.status(201).json({ success: true, data: newLocation });
    } catch (error) {
        next(error);
    }
};

export const updateLocationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id, 10);
        const updatedLocation = await locationService.updateWorkLocation(id, req.body);
        if (!updatedLocation) {
            return res.status(404).json({ success: false, message: 'Location not found.' });
        }
        res.status(200).json({ success: true, data: updatedLocation });
    } catch (error) {
        next(error);
    }
};

export const deleteLocationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id, 10);
        const success = await locationService.deleteWorkLocation(id);
        if (!success) {
            return res.status(404).json({ success: false, message: 'Location not found.' });
        }
        res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
        next(error);
    }
}; 