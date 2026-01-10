import type { HemicicloData } from '../../types/mappings';

// Datos mock que simulan un hemiciclo parlamentario español de 350 escaños
export const mockHemicicloData: HemicicloData = {
    seats: [
        // Extrema Izquierda (15 escaños) - Posiciones 1-15
        ...Array.from({ length: 15 }, (_, i) => ({
            id: (i + 1).toString(),
            position: { x: 0, y: 0 }, // Se calculará en el componente
            actor_id: `actor_${i + 1}`,
            party: 'FAR-LEFT',
            label: `Diputado/a ${i + 1} - Unidas Podemos`
        })),

        // Centro Izquierda (120 escaños) - Posiciones 16-135
        ...Array.from({ length: 120 }, (_, i) => ({
            id: (i + 16).toString(),
            position: { x: 0, y: 0 },
            actor_id: `actor_${i + 16}`,
            party: 'CENTER-LEFT',
            label: `Diputado/a ${i + 16} - PSOE`
        })),

        // Centro (45 escaños) - Posiciones 136-180
        ...Array.from({ length: 45 }, (_, i) => ({
            id: (i + 136).toString(),
            position: { x: 0, y: 0 },
            actor_id: `actor_${i + 136}`,
            party: 'CENTER',
            label: `Diputado/a ${i + 136} - Ciudadanos`
        })),

        // Centro Derecha (89 escaños) - Posiciones 181-269
        ...Array.from({ length: 89 }, (_, i) => ({
            id: (i + 181).toString(),
            position: { x: 0, y: 0 },
            actor_id: `actor_${i + 181}`,
            party: 'CENTER-RIGHT',
            label: `Diputado/a ${i + 181} - PP`
        })),

        // Derecha (52 escaños) - Posiciones 270-321
        ...Array.from({ length: 52 }, (_, i) => ({
            id: (i + 270).toString(),
            position: { x: 0, y: 0 },
            actor_id: `actor_${i + 270}`,
            party: 'RIGHT',
            label: `Diputado/a ${i + 270} - VOX`
        })),

        // Independientes (20 escaños) - Posiciones 322-341
        ...Array.from({ length: 20 }, (_, i) => ({
            id: (i + 322).toString(),
            position: { x: 0, y: 0 },
            actor_id: `actor_${i + 322}`,
            party: 'INDEPENDENT',
            label: `Diputado/a ${i + 322} - Independiente`
        })),

        // Escaños vacantes (9 escaños) - Posiciones 342-350
        ...Array.from({ length: 9 }, (_, i) => ({
            id: (i + 342).toString(),
            position: { x: 0, y: 0 },
            party: 'VACANT',
            label: 'Escaño vacante'
        }))
    ],
    parties: [
        {
            id: 'far-left',
            name: 'Unidas Podemos',
            color: '#8B0000',
            count: 15
        },
        {
            id: 'center-left',
            name: 'PSOE',
            color: '#FF8C42',
            count: 120
        },
        {
            id: 'center',
            name: 'Ciudadanos',
            color: '#FFD700',
            count: 45
        },
        {
            id: 'center-right',
            name: 'Partido Popular',
            color: '#87CEEB',
            count: 89
        },
        {
            id: 'right',
            name: 'VOX',
            color: '#4169E1',
            count: 52
        },
        {
            id: 'independent',
            name: 'Independientes',
            color: '#808080',
            count: 20
        },
        {
            id: 'vacant',
            name: 'Vacantes',
            color: '#D3D3D3',
            count: 9
        }
    ]
};

// Función para generar datos aleatorios de hemiciclo
export const generateRandomHemicicloData = (totalSeats: number = 350): HemicicloData => {
    const parties = ['FAR-LEFT', 'CENTER-LEFT', 'CENTER', 'CENTER-RIGHT', 'RIGHT', 'INDEPENDENT', 'VACANT'];
    const partyNames = ['Extrema Izquierda', 'Centro Izquierda', 'Centro', 'Centro Derecha', 'Derecha', 'Independientes', 'Vacantes'];
    const partyColors = ['#8B0000', '#FF8C42', '#FFD700', '#87CEEB', '#4169E1', '#808080', '#D3D3D3'];

    // Generar distribución aleatoria pero realista
    const distribution = [
        Math.floor(totalSeats * 0.04), // 4% extrema izquierda
        Math.floor(totalSeats * 0.34), // 34% centro izquierda
        Math.floor(totalSeats * 0.13), // 13% centro
        Math.floor(totalSeats * 0.25), // 25% centro derecha
        Math.floor(totalSeats * 0.15), // 15% derecha
        Math.floor(totalSeats * 0.06), // 6% independientes
        Math.floor(totalSeats * 0.03)  // 3% vacantes
    ];

    // Ajustar para llegar exactamente al total
    const currentTotal = distribution.reduce((sum, count) => sum + count, 0);
    const difference = totalSeats - currentTotal;
    if (difference > 0) {
        distribution[1] += difference; // Agregar diferencia al centro izquierda
    }

    const seats = [];
    let seatIndex = 1;

    distribution.forEach((count, partyIndex) => {
        for (let i = 0; i < count; i++) {
            seats.push({
                id: seatIndex.toString(),
                position: { x: 0, y: 0 },
                actor_id: parties[partyIndex] !== 'VACANT' ? `actor_${seatIndex}` : undefined,
                party: parties[partyIndex],
                label: parties[partyIndex] !== 'VACANT'
                    ? `Diputado/a ${seatIndex} - ${partyNames[partyIndex]}`
                    : 'Escaño vacante'
            });
            seatIndex++;
        }
    });

    const partiesData = parties.map((party, index) => ({
        id: party.toLowerCase().replace('-', '_'),
        name: partyNames[index],
        color: partyColors[index],
        count: distribution[index]
    })).filter(p => p.count > 0);

    return {
        seats,
        parties: partiesData
    };
};

// Datos mock más pequeños para pruebas
export const smallHemicicloData: HemicicloData = {
    seats: [
        // 50 escaños para pruebas rápidas
        ...Array.from({ length: 8 }, (_, i) => ({
            id: (i + 1).toString(),
            position: { x: 0, y: 0 },
            party: 'FAR-LEFT',
            label: `Extrema Izquierda ${i + 1}`
        })),
        ...Array.from({ length: 15 }, (_, i) => ({
            id: (i + 9).toString(),
            position: { x: 0, y: 0 },
            party: 'CENTER-LEFT',
            label: `Centro Izquierda ${i + 1}`
        })),
        ...Array.from({ length: 10 }, (_, i) => ({
            id: (i + 24).toString(),
            position: { x: 0, y: 0 },
            party: 'CENTER',
            label: `Centro ${i + 1}`
        })),
        ...Array.from({ length: 12 }, (_, i) => ({
            id: (i + 34).toString(),
            position: { x: 0, y: 0 },
            party: 'CENTER-RIGHT',
            label: `Centro Derecha ${i + 1}`
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
            id: (i + 46).toString(),
            position: { x: 0, y: 0 },
            party: 'RIGHT',
            label: `Derecha ${i + 1}`
        })),
        ...Array.from({ length: 2 }, (_, i) => ({
            id: (i + 49).toString(),
            position: { x: 0, y: 0 },
            party: 'VACANT',
            label: 'Vacante'
        }))
    ],
    parties: [
        { id: 'far-left', name: 'Extrema Izquierda', color: '#8B0000', count: 8 },
        { id: 'center-left', name: 'Centro Izquierda', color: '#FF8C42', count: 15 },
        { id: 'center', name: 'Centro', color: '#FFD700', count: 10 },
        { id: 'center-right', name: 'Centro Derecha', color: '#87CEEB', count: 12 },
        { id: 'right', name: 'Derecha', color: '#4169E1', count: 3 },
        { id: 'vacant', name: 'Vacantes', color: '#D3D3D3', count: 2 }
    ]
};