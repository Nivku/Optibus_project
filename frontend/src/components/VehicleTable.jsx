import React from 'react';
import { VehicleStatus } from '../constants';

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-CA');
}

export default function VehicleTable({ vehicles, isLoading, networkError, onEdit, onStatusChange }) {
    return (
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
                                onChange={(e) => onStatusChange(vehicle.id, e.target.value)}
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
                                onClick={() => onEdit(vehicle)}
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
    );
}
