import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { getDecryptedGA4Credentials } from './settings.service';

export const getGA4Report = async (team_id: number, startDate: string, endDate: string) => {
    
    const settings = await getDecryptedGA4Credentials(team_id);
    if (!settings) {
        throw new Error('GA4 settings not configured for this team.');
    }

    const { propertyId, credentials } = settings;

    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials });

    try {
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'date' }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'sessions' },
            ],
        });

        // Format the response for easier consumption by the frontend
        const formattedData = response.rows?.map((row: any) => ({
            date: row.dimensionValues?.[0].value,
            activeUsers: row.metricValues?.[0].value,
            newUsers: row.metricValues?.[1].value,
            sessions: row.metricValues?.[2].value,
        })) || [];

        return formattedData;

    } catch (error: any) { // Specify the type of error as 'any'
        console.error('GA4 Data API Error:', error);
        // Provide a more user-friendly error message
        if (error.message.includes('INVALID_ARGUMENT')) {
            throw new Error('Invalid request to GA4. Check Property ID and date range.');
        } else if (error.message.includes('PERMISSION_DENIED')) {
            throw new Error('Permission denied. Check your GA4 Service Account permissions.');
        }
        throw new Error('Failed to fetch report from Google Analytics.');
    }
}; 