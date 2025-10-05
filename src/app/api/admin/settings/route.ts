
import { NextResponse } from 'next/server';
import { getSetting, updateSetting, getSettings } from '@/services/settingsService';

export async function GET(request: Request) {
  try {
    const settings = await getSettings(['referralCode', 'isReferralSystemEnabled']);
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();
    if (key !== 'referralCode' && key !== 'isReferralSystemEnabled') {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }
    await updateSetting(key, value);
    return NextResponse.json({ message: `Setting '${key}' updated successfully` });
  } catch (error) {
    return NextResponse.json({ error: `Failed to update setting '${key}'` }, { status: 500 });
  }
}
