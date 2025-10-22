import React, { useState, useEffect, useCallback } from 'react';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:3001/api/vehicles';

// Enum for status values
const VehicleStatus = {
    AVAILABLE: 'Available',
    IN_USE: 'InUse',
    MAINTENANCE: 'Maintenance',
};

// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [plateToDelete, setPlateToDelete] = useState('');
    const [networkError, setNetworkError] = useState(null);

    // --- State for Filtering, Sorting, and Searching ---
    const [searchPlate, setSearchPlate] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortCriteria, setSortCriteria] = useState('createdAt-desc');

    // --- Error Handling Helper ---
    const handleApiError = (error, action = 'perform the action') => {
        console.error(error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            setNetworkError(`Network Error: Could not connect to the server. Please ensure the backend is running on ${API_BASE_URL}.`);
        } else {
            alert(`Error trying to ${action}: ${error.message}`);
            setNetworkError(null);
        }
    };

    // --- Data Fetching (Updated) ---
    const fetchVehicles = useCallback(async () => {
        setIsLoading(true);
        setNetworkError(null);

        // Build query parameters
        const params = new URLSearchParams();

        // 1. Add filter
        if (filterStatus !== 'all') {
            params.append('status', filterStatus);
        }

        // 2. Add search
        if (searchPlate.trim() !== '') {
            params.append('searchPlate', searchPlate.trim());
        }

        // 3. Add sorting
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
        // fetchVehicles
    }, [searchPlate, filterStatus, sortCriteria]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    // --- API Handlers ---

    const handleAddVehicle = async () => {
        const licensePlate = prompt("Enter the new vehicle's license plate:");
        if (!licensePlate || licensePlate.trim() === '') {
            return;
        }

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

    const handleEditVehicle = async (vehicle) => {
        const newLicensePlate = prompt("Enter the new license plate:", vehicle.licensePlate);
        if (!newLicensePlate || newLicensePlate.trim() === '') {
            return;
        }

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

    const handleStatusChange = async (vehicleId, newStatus) => {
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

    const handleDeleteByPlate = async () => {
        const plate = plateToDelete.trim();
        if (!plate) {
            alert("Please enter a license plate to delete.");
            return;
        }


        const vehicleToDelete = vehicles.find(v => v.licensePlate === plate);

        if (!vehicleToDelete) {
            alert(`Vehicle with license plate "${plate}" not found.`);
            return;
        }

        const isConfirmed = window.confirm(`Are you sure you want to delete vehicle ${vehicleToDelete.licensePlate}?`);
        if (!isConfirmed) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${vehicleToDelete.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete vehicle.');
            }

            alert('Vehicle deleted successfully!');
            setPlateToDelete('');
            fetchVehicles();
        } catch (error) {
            handleApiError(error, 'delete the vehicle');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-CA');
    };

    return (
        <div className="bg-gray-100 min-h-screen p-8">
            <div className="container mx-auto bg-white rounded-lg shadow-lg p-6">
                {networkError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Connection Error: </strong>
                        <span className="block sm:inline">{networkError}</span>
                    </div>
                )}

                <header className="mb-6 border-b pb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-gray-800">Vehicle Management</h1>
                        <button
                            onClick={handleAddVehicle}
                            className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600"
                        >
                            Create Vehicle
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <input
                            type="text"
                            placeholder="Enter license plate to delete"
                            value={plateToDelete}
                            onChange={(e) => setPlateToDelete(e.target.value)}
                            className="border rounded p-2 flex-grow"
                        />
                        <button
                            onClick={handleDeleteByPlate}
                            className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600"
                        >
                            Delete Vehicle
                        </button>
                    </div>

                    {/* --- Filter, Sort, and Search Controls --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {/* Search Input */}
                        <input
                            type="text"
                            placeholder="Search by license plate..."
                            value={searchPlate}
                            onChange={(e) => setSearchPlate(e.target.value)}
                            className="border rounded p-2"
                        />

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border rounded p-2"
                        >
                            <option value="all">All Statuses</option>
                            <option value={VehicleStatus.AVAILABLE}>Available</option>
                            <option value={VehicleStatus.IN_USE}>InUse</option>
                            <option value={VehicleStatus.MAINTENANCE}>Maintenance</option>
                        </select>

                        {/* Sort By */}
                        <select
                            value={sortCriteria}
                            onChange={(e) => setSortCriteria(e.target.value)}
                            className="border rounded p-2"
                        >
                            <option value="createdAt-desc">Newest First</option>
                            <option value="createdAt-asc">Oldest First</option>
                            <option value="status-asc">Status (A-Z)</option>
                            <option value="status-desc">Status (Z-A)</option>
                        </select>
                    </div>
                </header>

                <main>
                    <table className="w-full text-left">
                        <thead>
                        <tr className="bg-gray-50">

                            <th className="p-3">Vehicle ID</th>
                            <th className="p-3">License Plate</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Created At</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading ? (

                            <tr><td colSpan="5" className="text-center p-8">Loading...</td></tr>
                        ) : vehicles.length === 0 && !networkError ? (

                            <tr><td colSpan="5" className="text-center p-8">No vehicles found.</td></tr>
                        ) : (
                            vehicles.map((vehicle) => (
                                <tr key={vehicle.id} className="border-b hover:bg-gray-50">

                                    <td className="p-3 font-mono text-xs text-gray-600" title={vehicle.id}>

                                        {vehicle.id.substring(0, 8)}...
                                    </td>
                                    <td className="p-3 font-mono">{vehicle.licensePlate}</td>
                                    <td className="p-3">
                                        <select
                                            value={vehicle.status}
                                            onChange={(e) => handleStatusChange(vehicle.id, e.target.value)}
                                            className="p-1 border rounded"
                                        >
                                            {Object.values(VehicleStatus).map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-3">{formatDate(vehicle.createdAt)}</td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => handleEditVehicle(vehicle)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </main>
            </div>
        </div>
    );
}

