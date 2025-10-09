
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserData {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url?: string;
}

export async function createUserInDatabase(userData: UserData) {
  const { id, email, full_name, username, avatar_url } = userData;

  if (!id || !email || !username) {
    throw new Error('Missing required fields to create user');
  }

  try {
    const newUser = await prisma.user.create({
      data: {
        id: id,
        email: email,
        name: full_name,
        username: username,
        imageUrl: avatar_url,
      },
    });
    return { success: true, data: newUser };
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma code for unique constraint violation
      // User already exists, which is not an error in this workflow.
      return { success: true, data: null, message: 'User already exists.' };
    }
    // For other errors, re-throw to be caught by the caller.
    console.error("Error in createUserInDatabase:", error);
    throw error; 
  }
}
