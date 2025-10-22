import { Router } from 'express';
import {
    handleGetAllVehicles,
    handleCreateVehicle,
    handleUpdateVehicle,
    handleDeleteVehicle,
} from '../controllers/vehicleController';

const router = Router();

router.get('/', handleGetAllVehicles);       // R - Read (List View)
router.post('/', handleCreateVehicle);      // C - Create
router.put('/:id', handleUpdateVehicle);    // U - Update
router.delete('/:id', handleDeleteVehicle); // D - Delete

export default router;