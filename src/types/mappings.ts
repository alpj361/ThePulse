// Mapping types
export type MappingType = 'hemiciclo';

// Base mapping interface
export interface BaseMapping {
    id: string;
    project_id: string;
    user_id: string;
    name: string;
    description?: string;
    type: MappingType;
    config: Record<string, any>;
    data: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// ===================================================================
// HEMICICLO TYPES
// ===================================================================

// Seat types
export type SeatType = 'regular' | 'leader' | 'president' | 'secretary' | 'vacant';

// Individual seat
export interface HemicicloSeat {
    id: string;
    row: number;
    position: number;
    angle?: number;
    type: SeatType;

    // Assignment
    actorId?: string;
    actorData?: {
        name: string;
        photo?: string;
        metadata?: Record<string, any>;
    };
    categoryId?: string;

    // Display
    label?: string;
    tooltip?: string;
}

// Category (party/group)
export interface HemicicloCategory {
    id: string;
    name: string;
    shortName?: string;
    color: string;
    order: number;
    seatCount?: number;
}

// Data source configuration
export interface HemicicloDataSource {
    type: 'dataset' | 'manual';
    datasetIds?: string[];
    columnMappings?: {
        actor?: string;
        category?: string;
        photo?: string;
        position?: string;
        seatNumber?: string;
    };
}

// Layout configuration
export interface HemicicloLayout {
    totalSeats: number;
    rows: number;
    seatsPerRow: number[];
    innerRadius: number;
    rowSpacing: number;
    seatRadius: number;
    startAngle: number;
    endAngle: number;
}

// Config stored in mappings.config
export interface HemicicloConfig {
    layout: HemicicloLayout;
    dataSource?: HemicicloDataSource;
}

// Data stored in mappings.data
export interface HemicicloData {
    categories: HemicicloCategory[];
    seats: HemicicloSeat[];
}

// Full Hemiciclo mapping
export interface HemicicloMapping extends BaseMapping {
    type: 'hemiciclo';
    config: HemicicloConfig;
    data: HemicicloData;
}

// Union type for all mapping types
export type Mapping = HemicicloMapping;

// ===================================================================
// CRUD TYPES
// ===================================================================

// Create mapping data (without auto-generated fields)
export interface CreateMappingData {
    project_id: string;
    name: string;
    description?: string;
    type: MappingType;
    config?: Record<string, any>;
    data?: Record<string, any>;
}

// Update mapping data
export interface UpdateMappingData {
    name?: string;
    description?: string;
    config?: Record<string, any>;
    data?: Record<string, any>;
}

// List mappings filters
export interface ListMappingsFilters {
    project_id?: string;
    type?: MappingType;
    search?: string;
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Calculate default layout for given seat count
 */
export function calculateDefaultLayout(totalSeats: number): HemicicloLayout {
    // Calculate number of rows based on seat count
    let rows: number;
    if (totalSeats <= 50) rows = 3;
    else if (totalSeats <= 100) rows = 4;
    else if (totalSeats <= 200) rows = 5;
    else rows = 6;

    // Distribute seats across rows (more seats in outer rows)
    const seatsPerRow: number[] = [];
    let remainingSeats = totalSeats;

    for (let i = 0; i < rows; i++) {
        // Inner rows have fewer seats
        const rowRatio = (i + 1) / rows;
        const seatsInRow = Math.round((remainingSeats / (rows - i)) * (0.7 + 0.3 * rowRatio));
        seatsPerRow.push(Math.max(seatsInRow, 1));
        remainingSeats -= seatsInRow;
    }

    // Adjust last row to account for rounding
    const totalDistributed = seatsPerRow.reduce((a, b) => a + b, 0);
    if (totalDistributed !== totalSeats) {
        seatsPerRow[rows - 1] += totalSeats - totalDistributed;
    }

    return {
        totalSeats,
        rows,
        seatsPerRow,
        innerRadius: 100,
        rowSpacing: 30,
        seatRadius: 12,
        startAngle: -85,
        endAngle: 85
    };
}

/**
 * Generate empty seats for a layout
 */
export function generateEmptySeats(layout: HemicicloLayout): HemicicloSeat[] {
    const seats: HemicicloSeat[] = [];
    let seatId = 1;

    for (let row = 0; row < layout.rows; row++) {
        const seatsInRow = layout.seatsPerRow[row];
        const angleRange = layout.endAngle - layout.startAngle;

        for (let pos = 0; pos < seatsInRow; pos++) {
            const angle = layout.startAngle + (pos / (seatsInRow - 1 || 1)) * angleRange;

            seats.push({
                id: `seat-${seatId++}`,
                row: row + 1,
                position: pos + 1,
                angle,
                type: 'regular'
            });
        }
    }

    return seats;
}
