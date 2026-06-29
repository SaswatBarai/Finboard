import { prisma } from "../prisma/client.js";

export function createNotification(tx, data) {
  return tx.bankNotification.create({
    data: {
      appUserId: data.appUserId,
      accountId: data.accountId,
      title: data.title,
      message: data.message
    }
  });
}

export async function listNotifications(appUserId) {
  return prisma.bankNotification.findMany({
    where: { appUserId },
    orderBy: { createdAt: "desc" },
    take: 30
  });
}

export async function removeNotification(appUserId, id) {
  await prisma.bankNotification.deleteMany({
    where: {
      id,
      appUserId
    }
  });
}
