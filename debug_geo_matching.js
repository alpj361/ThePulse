#!/usr/bin/env node

console.log('🔍 Debugging geographic data correlation...');

// Función de normalización actual del código
function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Función de normalización mejorada
function normalizeStringEnhanced(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/^departamento\s+(de\s+)?/, '') // Quitar "Departamento de"
        .replace(/\s+city$/i, '') // Quitar "City" al final
        .replace(/\s+/g, ' ') // Normalizar espacios múltiples
        .trim();
}

// Ejemplos de datos que podrían estar causando el problema
const geoJsonNames = ['Guatemala', 'Quetzaltenango', 'Escuintla', 'Alta Verapaz', 'Huehuetenango'];
const datasetNames = [
    'GUATEMALA',
    'Guatemala City',
    'Departamento de Guatemala',
    'quetzaltenango',
    'Escuintla ',
    'ALTA VERAPAZ',
    'alta verapaz',
    'Huehuetenango',
    'HUEHUETENANGO'
];

console.log('\n📊 Testing current normalization:');
geoJsonNames.forEach(geoName => {
    const normalizedGeo = normalizeString(geoName);
    console.log(`\nGeoJSON: "${geoName}" -> normalized: "${normalizedGeo}"`);

    datasetNames.forEach(dsName => {
        const normalizedDs = normalizeString(dsName);
        const matches = normalizedGeo === normalizedDs;
        const contains = normalizedDs.includes(normalizedGeo);
        const containsReverse = normalizedGeo.includes(normalizedDs);
        console.log(`  Dataset: "${dsName}" -> "${normalizedDs}" | exact: ${matches} | contains: ${contains} | reverse: ${containsReverse}`);
    });
});

console.log('\n🚀 Testing enhanced normalization:');
geoJsonNames.forEach(geoName => {
    const normalizedGeo = normalizeStringEnhanced(geoName);
    console.log(`\nGeoJSON: "${geoName}" -> enhanced: "${normalizedGeo}"`);

    datasetNames.forEach(dsName => {
        const normalizedDs = normalizeStringEnhanced(dsName);
        const matches = normalizedGeo === normalizedDs;
        const contains = normalizedDs.includes(normalizedGeo);
        console.log(`  Dataset: "${dsName}" -> "${normalizedDs}" | exact: ${matches} | contains: ${contains}`);
    });
});

console.log('\n✅ Testing completed');