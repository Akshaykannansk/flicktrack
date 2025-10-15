
import { NextResponse } from 'next/server';
import { getListsForUser } from '@/services/listService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const lists = await getListsForUser(params.id);
  return NextResponse.json(lists);
}
