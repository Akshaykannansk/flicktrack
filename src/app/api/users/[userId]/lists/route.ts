
import { NextResponse } from 'next/server';
import { getListsForUser } from '@/services/listService';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const lists = await getListsForUser(params.userId);
  return NextResponse.json(lists);
}
