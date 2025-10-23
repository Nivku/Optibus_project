import { Request, Response } from 'express';
import * as vehicleService from '../services/vehicleService';
import { VehicleStatus } from '../types/vehicleModel';



// Handler to get all the vehicles
export const handleGetAllVehicles = async (req: Request, res: Response) => {
    try {
        const { status, sortBy, sortOrder, searchPlate } = req.query;

        const allVehicles = await vehicleService.getAllVehicles({
            status: status as VehicleStatus | undefined,
            sortBy: sortBy as 'createdAt' | 'status' | undefined,
            sortOrder: sortOrder as 'asc' | 'desc' | undefined,
            searchPlate: searchPlate as string | undefined,
        });

        res.status(200).json(allVehicles);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving vehicles' });
    }
};

// Handler to add a single vehicle by ID
export const handleCreateVehicle = async (req: Request, res: Response) => {
    try {
        const { licensePlate } = req.body;
        if (!licensePlate || typeof licensePlate !== 'string') {
            return res.status(400).json({ message: 'License plate is required and must be a string' });
        }
        const newVehicle = await vehicleService.createVehicle(licensePlate);
        res.status(201).json(newVehicle);
    } catch (error: any) {

        if (error.message.includes('Invalid license plate')) {
            return res.status(400).json({ message: error.message }); // 400 Bad Request
        }
        if (error.message.includes('already exists')) {
            return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        res.status(500).json({ message: 'Error creating vehicle' });
    }
};


// Handler to update a single vehicle by ID plate.
export const handleUpdateVehicle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { licensePlate, status } = req.body as { licensePlate?: string; status?: VehicleStatus };

        if (!licensePlate && !status) {
            return res.status(400).json({ message: 'At least one field is required for update' });
        }

        if (status && !Object.values(VehicleStatus).includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        const updatedVehicle = await vehicleService.updateVehicle(id, { licensePlate, status });

        if (!updatedVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.status(200).json(updatedVehicle);
    } catch (error: any) {
        const errorMessage = error.message;


        if (errorMessage.includes('Invalid license plate')) {
            return res.status(400).json({ message: errorMessage });
        }
        if (errorMessage.includes('already exists')) {
            return res.status(409).json({ message: errorMessage });
        }
        if (errorMessage.includes('Maintenance can only be moved')) {
            return res.status(400).json({ message: errorMessage });
        }
        if (errorMessage.includes('capacity (5%) exceeded')) {
            return res.status(409).json({ message: errorMessage });
        }

        res.status(500).json({ message: 'Error updating vehicle', error: errorMessage });
    }
};

// Handler to delete a single vehicle by ID plate.
export const handleDeleteVehicle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const success = await vehicleService.deleteVehicle(id);

        if (!success) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.status(204).send();
    } catch (error: any) {
        const errorMessage = error.message;
        if (errorMessage.includes('cannot be deleted')) {
            return res.status(409).json({ message: errorMessage });
        }
        res.status(500).json({ message: 'Error deleting vehicle', error: errorMessage });
    }
};

