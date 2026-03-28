import React from "react";
import { Armchair, User } from "lucide-react";

const BusSeatSelector = ({
    capacity = 40,
    occupiedSeats = [],
    selectedSeat = null,
    onSeatSelect,
}) => {
    const occupiedSet = new Set(occupiedSeats.map(Number));
    const seatsPerRow = 4;
    const rows = Math.ceil(capacity / seatsPerRow);

    const getSeatNumber = (rowIndex, seatIndex) => {
        return rowIndex * seatsPerRow + seatIndex + 1;
    };

    const renderSeat = (seatNumber) => {
        if (seatNumber > capacity) {
            return <div style={{ width: 56, height: 56 }} />;
        }

        const isOccupied = occupiedSet.has(seatNumber);
        const isSelected = selectedSeat === seatNumber;

        let className = "seat-btn";
        if (isOccupied) className += " occupied";
        else if (isSelected) className += " selected";
        else className += " available";

        return (
            <button
                key={seatNumber}
                type="button"
                className={className}
                disabled={isOccupied}
                onClick={() => !isOccupied && onSeatSelect(seatNumber)}
            >
                <Armchair size={16} />
                <span>{seatNumber}</span>
            </button>
        );
    };

    return (
        <div className="seat-selector-card">
            <div className="seat-selector-header">
                <div>
                    <h3>Choix du siège</h3>
                    <p>Sélectionnez un siège disponible</p>
                </div>

                <div className="driver-badge">
                    <User size={16} />
                    <span>Chauffeur</span>
                </div>
            </div>

            <div className="seat-legend">
                <div className="legend-item">
                    <span className="legend-box available" />
                    <span>Libre</span>
                </div>
                <div className="legend-item">
                    <span className="legend-box selected" />
                    <span>Sélectionné</span>
                </div>
                <div className="legend-item">
                    <span className="legend-box occupied" />
                    <span>Occupé</span>
                </div>
            </div>

            <div className="bus-layout">
                {Array.from({ length: rows }, (_, rowIndex) => {
                    const s1 = getSeatNumber(rowIndex, 0);
                    const s2 = getSeatNumber(rowIndex, 1);
                    const s3 = getSeatNumber(rowIndex, 2);
                    const s4 = getSeatNumber(rowIndex, 3);

                    return (
                        <div key={rowIndex} className="bus-row">
                            <div className="seat-group">
                                {renderSeat(s1)}
                                {renderSeat(s2)}
                            </div>

                            <div className="bus-aisle">
                                <span>{rowIndex + 1}</span>
                            </div>

                            <div className="seat-group">
                                {renderSeat(s3)}
                                {renderSeat(s4)}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="seat-selected-info">
                {selectedSeat ? (
                    <span>
                        Siège choisi : <strong>{selectedSeat}</strong>
                    </span>
                ) : (
                    <span>Aucun siège sélectionné</span>
                )}
            </div>
        </div>
    );
};

export default BusSeatSelector;