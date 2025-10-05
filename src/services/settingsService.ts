
import prisma from "@/lib/prisma";

export async function getSetting(key: string): Promise<any> {
    const setting = await prisma.appSettings.findUnique({
        where: { key },
    });

    return setting?.value;
}

export async function getSettings(keys: string[]): Promise<any> {
    const settings = await prisma.appSettings.findMany({
        where: { key: { in: keys } },
    });

    return settings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});
}

export async function updateSetting(key: string, value: any): Promise<void> {
    await prisma.appSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
}
