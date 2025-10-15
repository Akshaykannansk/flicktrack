
import { NextResponse } from 'next/server';
import { getSetting } from '@/services/settingsService';

export async function GET() {
  try {
    // Use the centralized service to fetch the setting.
    const settingValue = await getSetting('isReferralSystemEnabled');

    // The service returns the value directly. Default to false if it's not explicitly true.
    const isReferralSystemEnabled = settingValue === true;

    return NextResponse.json({ isReferralSystemEnabled });

  } catch (err: any) {
    console.error('Error in /api/settings route:', err.message);
    // Return a server error response
    return NextResponse.json({ error: 'An unexpected error occurred while fetching settings.' }, { status: 500 });
  }
}
