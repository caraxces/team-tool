import pool from '../../config/database';
import { encrypt, decrypt } from '../utils/crypto.util';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface GA4SettingsInput {
    team_id: number;
    ga4_property_id: string;
    measurement_id?: string;
    api_secret?: string;
    service_account_credentials_json: string; // Expecting a JSON string
}

export interface GA4SettingsOutput {
    team_id: number;
    ga4_property_id: string;
    measurement_id?: string;
    has_api_secret: boolean;
    has_service_account: boolean;
}

export const saveGA4Settings = async (settings: GA4SettingsInput): Promise<ResultSetHeader> => {
    const { team_id, ga4_property_id, measurement_id, api_secret, service_account_credentials_json } = settings;

    const encryptedServiceAccount = encrypt(service_account_credentials_json);
    const encryptedApiSecret = api_secret ? encrypt(api_secret) : null;

    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO ga4_settings (team_id, ga4_property_id, measurement_id, api_secret_encrypted, service_account_credentials_encrypted)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            ga4_property_id = VALUES(ga4_property_id),
            measurement_id = VALUES(measurement_id),
            api_secret_encrypted = VALUES(api_secret_encrypted),
            service_account_credentials_encrypted = VALUES(service_account_credentials_encrypted)
    `, [team_id, ga4_property_id, measurement_id, encryptedApiSecret, encryptedServiceAccount]);

    return result;
};

export const getGA4Settings = async (team_id: number): Promise<GA4SettingsOutput | null> => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT team_id, ga4_property_id, measurement_id, api_secret_encrypted, service_account_credentials_encrypted 
        FROM ga4_settings WHERE team_id = ?
    `, [team_id]);

    if (rows.length === 0) {
        return null;
    }

    const setting = rows[0];

    return {
        team_id: setting.team_id,
        ga4_property_id: setting.ga4_property_id,
        measurement_id: setting.measurement_id,
        has_api_secret: !!setting.api_secret_encrypted,
        has_service_account: !!setting.service_account_credentials_encrypted,
    };
};

// This function is for internal backend use ONLY.
// It retrieves the decrypted credentials and should not be exposed via an API controller.
export const getDecryptedGA4Credentials = async (team_id: number): Promise<{ propertyId: string, credentials: any } | null> => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT ga4_property_id, service_account_credentials_encrypted
        FROM ga4_settings WHERE team_id = ?
    `, [team_id]);

    if (rows.length === 0 || !rows[0].service_account_credentials_encrypted) {
        return null;
    }

    const setting = rows[0];
    const decryptedJson = decrypt(setting.service_account_credentials_encrypted);
    
    try {
        const credentials = JSON.parse(decryptedJson);
        return {
            propertyId: setting.ga4_property_id,
            credentials,
        };
    } catch (error) {
        console.error("Failed to parse GA4 credentials JSON:", error);
        throw new Error("Stored GA4 credentials are not valid JSON.");
    }
}; 