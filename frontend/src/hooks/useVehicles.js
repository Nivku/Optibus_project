import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, VehicleStatus } from '../constants';

export function useVehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [networkError, setNetworkError] = useState(null);

    const [searchPlate, setSearchPlate] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortCriteria, setSortCriteria] = useState('createdAt-desc');

    const handleApiError = (error, action = 'perform the action') => {
        console.error(error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            setNetworkError(`Network Error: Could not connect to the server. Please ensure the backend is running on ${API_BASE_URL}.`);
        } else {
            alert(`Error trying to ${action}: ${error.message}`);
            setNetworkError(null);
        }
    };

    const fetchVehicles = useCallback(async () => {
        setIsLoading(true);
        setNetworkError(null);

        const params = new URLSearchParams();
        if (filterStatus !== 'all') {
            params.append('status', filterStatus);
        }
        if (searchPlate.trim() !== '') {
            params.append('searchPlate', searchPlate.trim());
        }
        const [sortBy, sortOrder] = sortCriteria.split('-');
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);

        const queryString = params.toString();

        try {
            const response = await fetch(`${API_BASE_URL}?${queryString}`);
            if (!response.ok) {
                throw new Error('Server responded with an error.');
            }
            const data = await response.json();
            setVehicles(data);
        } catch (error) {
            handleApiError(error, 'fetch vehicles');
        } finally {
            setIsLoading(false);
        }
    }, [searchPlate, filterStatus, sortCriteria]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    const addVehicle = async () => {
        const licensePlate = prompt("Enter the new vehicle's license plate:");
        if (!licensePlate || licensePlate.trim() === '') return;
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licensePlate: licensePlate.trim() }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add vehicle.');
            }
            fetchVehicles();
        } catch (error) {
            handleApiError(error, 'add a new vehicle');
        }
    };

    const editVehicle = async (vehicle) => {
        const newLicensePlate = prompt('Enter the new license plate:', vehicle.licensePlate);
        if (!newLicensePlate || newLicensePlate.trim() === '') return;
        try {
            const response = await fetch(`${API_BASE_URL}/${vehicle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licensePlate: newLicensePlate.trim() }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update vehicle.');
            }
            fetchVehicles();
        } catch (error) {
            handleApiError(error, 'edit the vehicle');
        }
    };

    const updateStatus = async (vehicleId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${vehicleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update status.');
            }
            fetchVehicles();
        } catch (error) {
            handleApiError(error, 'update the status');
            fetchVehicles();
        }
    };

    return {
        vehicles,
        isLoading,
        networkError,
        searchPlate,
        setSearchPlate,
        filterStatus,
        setFilterStatus,
        sortCriteria,
        setSortCriteria,
        addVehicle,
        editVehicle,
        updateStatus,
        fetchVehicles,
        VehicleStatus,
    };
}
