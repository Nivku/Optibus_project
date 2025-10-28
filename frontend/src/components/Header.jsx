import React from 'react';

export default function Header({ onCreate, plateToDelete, setPlateToDelete, onDeleteByPlate }) {
    return (
        <header className="mb-6 border-b pb-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800">Vehicle Management</h1>
                <button
                    onClick={onCreate}
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
                    onClick={onDeleteByPlate}
                    className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600"
                >
                    Delete Vehicle
                </button>
            </div>
        </header>
    );
}
