/**
 * Script para generar Apple Client Secret (JWT)
 * 
 * Este JWT es necesario para configurar Sign in with Apple en Supabase.
 * El token expira cada 6 meses y debe regenerarse.
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';

// ========================================
// CONFIGURACIÓN - COMPLETA ESTOS CAMPOS
// ========================================

const TEAM_ID = '4THD987397';  // Tu Team ID de Apple Developer
const KEY_ID = '43KVPTWHGH';    // Tu Key ID de Apple Developer
const CLIENT_ID = 'com.standatpd.pulzos';  // Tu Services ID

// Ruta al archivo .p8 o pega directamente la clave privada aquí
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg5WBJiaQfFRBzIiA9
uTjVrpsqxBkdm6U0+dPeVnXutVOgCgYIKoZIzj0DAQehRANCAAS97HPh5BcPd8VZ
xXc+IdZvznpnj+qgB8/5GLV1KgQQRiC7I2CWI7dwl2uvXm0Qittq1ZW0xsPMyAYy
PmTBpJxo
-----END PRIVATE KEY-----`;

// ========================================
// GENERACIÓN DEL JWT
// ========================================

function generateAppleClientSecret() {
    const now = Math.floor(Date.now() / 1000);

    // El payload del JWT según los requisitos de Apple
    const payload = {
        iss: TEAM_ID,           // Issuer (Team ID)
        iat: now,               // Issued at
        exp: now + 15777000,    // Expira en ~6 meses (máximo permitido por Apple)
        aud: 'https://appleid.apple.com',
        sub: CLIENT_ID          // Subject (Services ID / Client ID)
    };

    // Headers del JWT
    const headers = {
        alg: 'ES256',
        kid: KEY_ID
    };

    try {
        // Generar el JWT
        const token = jwt.sign(payload, PRIVATE_KEY, {
            algorithm: 'ES256',
            header: headers
        });

        console.log('\n✅ Apple Client Secret (JWT) generado exitosamente!\n');
        console.log('═'.repeat(80));
        console.log('\n📋 Copia este token y pégalo en Supabase en el campo "Secret Key (for OAuth)":\n');
        console.log(token);
        console.log('\n' + '═'.repeat(80));
        console.log('\n⚠️  IMPORTANTE: Este token expira en 6 meses. Guárdalo en un lugar seguro.');
        console.log('📅  Fecha de expiración:', new Date((now + 15777000) * 1000).toLocaleString());
        console.log('\n💡 TIP: Configura un recordatorio para regenerar este token cada 6 meses.\n');

        // Guardar también en un archivo
        const filename = `apple-client-secret-${Date.now()}.txt`;
        fs.writeFileSync(filename, token);
        console.log(`✅ Token también guardado en: ${filename}\n`);

        return token;
    } catch (error) {
        console.error('❌ Error generando el JWT:', error.message);
        process.exit(1);
    }
}

// Ejecutar
generateAppleClientSecret();
