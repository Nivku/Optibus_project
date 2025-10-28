import React from 'react';
import { VehicleStatus } from '../constants';

export default function Filters({ searchPlate, setSearchPlate, filterStatus, setFilterStatus, sortCriteria, setSortCriteria }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <input
                type="text"
                placeholder="Search by license plate..."
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                className="border rounded p-2"
            />
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
    );
}
