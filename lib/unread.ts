export function lastMessageAt(sender: "user" | "admin") {
  return {
    $let: {
      vars: {
        msgs: {
          $filter: {
            input: { $ifNull: ["$messages", []] },
            as: "m",
            cond: { $eq: ["$$m.from", sender] },
          },
        },
      },
      in: { $arrayElemAt: ["$$msgs.createdAt", -1] },
    },
  };
}

export async function getHelpUnreadCounts(
  db: any,
  userId: string,
  isAdmin: boolean,
): Promise<{ userUnread: number; adminUnread: number }> {
  if (isAdmin) {
    const [row] = await db
      .collection("help_requests")
      .aggregate([
        {
          $project: {
            status: 1,
            lastAdminReadAt: 1,
            lastUserMsgAt: lastMessageAt("user"),
          },
        },
        {
          $match: {
            $or: [
              {
                $and: [
                  { lastAdminReadAt: null },
                  { status: { $in: ["open", "in_progress"] } },
                ],
              },
              { $expr: { $gt: ["$lastUserMsgAt", "$lastAdminReadAt"] } },
            ],
          },
        },
        { $count: "n" },
      ])
      .toArray();
    return { userUnread: 0, adminUnread: row?.n || 0 };
  }

  const [row] = await db
    .collection("help_requests")
    .aggregate([
      { $match: { userId } },
      {
        $project: {
          lastUserReadAt: 1,
          lastAdminMsgAt: lastMessageAt("admin"),
        },
      },
      { $match: { $expr: { $gt: ["$lastAdminMsgAt", "$lastUserReadAt"] } } },
      { $count: "n" },
    ])
    .toArray();
  return { userUnread: row?.n || 0, adminUnread: 0 };
}

export async function getNotificationUnreadCount(
  db: any,
  userId: string,
): Promise<number> {
  return db.collection("notifications").countDocuments({ userId, read: false });
}
