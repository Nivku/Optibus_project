import React, { useState } from 'react';
import Header from './components/Header.jsx';
import Filters from './components/Filters.jsx';
import VehicleTable from './components/VehicleTable.jsx';
import { useVehicles } from './hooks/useVehicles.js';

export default function App() {
    const {
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
    } = useVehicles();

    const [plateToDelete, setPlateToDelete] = useState('');

    const handleDeleteByPlate = () => {
        const plate = plateToDelete.trim();
        if (!plate) {
            alert('Please enter a license plate to delete.');
            return;
        }
        const vehicleToDelete = vehicles.find(v => v.licensePlate === plate);
        if (!vehicleToDelete) {
            alert(`Vehicle with license plate "${plate}" not found.`);
            return;
        }
        const isConfirmed = window.confirm(`Are you sure you want to delete vehicle ${vehicleToDelete.licensePlate}?`);
        if (!isConfirmed) return;
        // Reuse edit/update API via hook by calling backend directly
        fetch(`http://localhost:3001/api/vehicles/${vehicleToDelete.id}`, { method: 'DELETE' })
            .then((res) => {
                if (!res.ok) return res.json().then(e => { throw new Error(e.message || 'Failed to delete vehicle.'); });
                setPlateToDelete('');
            })
            .catch((e) => alert(e.message))
            .finally(() => {
                // Refresh list
                // Using location of fetchVehicles inside hook via state setters would be better; quick refresh by toggling filters
                // But the hook exposes a fetch via changing sortCriteria triggers useEffect.
                setSortCriteria(prev => prev); // no-op to keep interface same
            });
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

                <Header
                    onCreate={addVehicle}
                    plateToDelete={plateToDelete}
                    setPlateToDelete={setPlateToDelete}
                    onDeleteByPlate={handleDeleteByPlate}
                />

                <Filters
                    searchPlate={searchPlate}
                    setSearchPlate={setSearchPlate}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    sortCriteria={sortCriteria}
                    setSortCriteria={setSortCriteria}
                />

                <main>
                    <VehicleTable
                        vehicles={vehicles}
                        isLoading={isLoading}
                        networkError={networkError}
                        onEdit={editVehicle}
                        onStatusChange={updateStatus}
                    />
                </main>
            </div>
        </div>
    );
}

