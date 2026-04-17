import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, desc, eq, ne, or } from "drizzle-orm";
import crypto from "node:crypto";
import {
  AddSkillBody,
  AddSkillResponse,
  DeleteSkillParams,
  DeleteSkillResponse,
  GetCurrentUserResponse,
  GetDashboardResponse,
  GetMyProfileResponse,
  ListConnectionsResponse,
  ListMatchesResponse,
  ListMessagesParams,
  ListMessagesResponse,
  ListSkillsQueryParams,
  ListSkillsResponse,
  LoginBody,
  LoginResponse,
  LogoutResponse,
  RegisterBody,
  RegisterResponse,
  RespondToConnectionBody,
  RespondToConnectionParams,
  RespondToConnectionResponse,
  SendConnectionRequestBody,
  SendConnectionRequestResponse,
  SendMessageBody,
  SendMessageParams,
  SendMessageResponse,
  UpdateMyProfileBody,
  UpdateMyProfileResponse,
  UpdateSkillBody,
  UpdateSkillParams,
  UpdateSkillResponse,
} from "@workspace/api-zod";
import {
  connectionsTable,
  db,
  messagesTable,
  skillsTable,
  studentsTable,
  type Connection,
  type Skill,
  type Student,
} from "@workspace/db";

const router: IRouter = Router();
const cookieName = "sse_session";
let seeded = false;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET must be set.");
  }
  return secret;
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    return false;
  }
  return hashPassword(password, salt) === stored;
}

function signToken(userId: number) {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const payload = `${userId}.${expires}`;
  const signature = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readToken(req: Request) {
  const header = req.headers.cookie;
  if (!header) {
    return null;
  }
  const match = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  return match ? decodeURIComponent(match.slice(cookieName.length + 1)) : null;
}

function verifyToken(token: string | null) {
  if (!token) {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [userIdText, expiresText, signature] = parts;
  const payload = `${userIdText}.${expiresText}`;
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  if (signature !== expected || Number(expiresText) < Date.now()) {
    return null;
  }
  const userId = Number(userIdText);
  return Number.isInteger(userId) ? userId : null;
}

function setSession(res: Response, userId: number) {
  res.cookie(cookieName, signToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: "/",
  });
}

function clearSession(res: Response) {
  res.clearCookie(cookieName, { path: "/" });
}

async function currentUserId(req: Request) {
  return verifyToken(readToken(req));
}

async function requireUser(req: Request, res: Response) {
  const userId = await currentUserId(req);
  if (!userId) {
    res.status(401).json({ ok: false, message: "Please log in to continue." });
    return null;
  }
  const [user] = await db.select().from(studentsTable).where(eq(studentsTable.id, userId)).limit(1);
  if (!user) {
    clearSession(res);
    res.status(401).json({ ok: false, message: "Session expired. Please log in again." });
    return null;
  }
  return user;
}

function normalizeSkill(value: string) {
  return value.trim().toLowerCase();
}

function publicUser(student: Student, skills: Skill[]) {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    college: student.college,
    branch: student.branch,
    profilePicture: student.profilePicture ?? undefined,
    skillsOffered: skills.filter((skill) => skill.userId === student.id && skill.direction === "offered"),
    skillsWanted: skills.filter((skill) => skill.userId === student.id && skill.direction === "wanted"),
  };
}

async function getAllPublicUsers() {
  const [students, skills] = await Promise.all([
    db.select().from(studentsTable).orderBy(asc(studentsTable.name)),
    db.select().from(skillsTable).orderBy(asc(skillsTable.name)),
  ]);
  return students.map((student) => publicUser(student, skills));
}

async function ensureSeeded() {
  if (seeded) {
    return;
  }
  seeded = true;
  const existing = await db.select({ id: studentsTable.id }).from(studentsTable).limit(1);
  if (existing.length > 0) {
    return;
  }
  const passwordHash = hashPassword("student123");
  const inserted = await db
    .insert(studentsTable)
    .values([
      {
        name: "Aarav Mehta",
        email: "aarav@example.edu",
        passwordHash,
        college: "National Institute of Technology",
        branch: "Computer Science",
        profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
      },
      {
        name: "Nisha Rao",
        email: "nisha@example.edu",
        passwordHash,
        college: "City Arts and Design College",
        branch: "Visual Communication",
        profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      },
      {
        name: "Kabir Singh",
        email: "kabir@example.edu",
        passwordHash,
        college: "Metropolitan University",
        branch: "Electronics",
        profilePicture: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
      },
    ])
    .returning();

  const [aarav, nisha, kabir] = inserted;
  if (!aarav || !nisha || !kabir) {
    return;
  }
  await db.insert(skillsTable).values([
    { userId: aarav.id, name: "React", category: "Programming", direction: "offered" },
    { userId: aarav.id, name: "Python", category: "Programming", direction: "offered" },
    { userId: aarav.id, name: "UI Design", category: "Design", direction: "wanted" },
    { userId: nisha.id, name: "UI Design", category: "Design", direction: "offered" },
    { userId: nisha.id, name: "Figma", category: "Design", direction: "offered" },
    { userId: nisha.id, name: "React", category: "Programming", direction: "wanted" },
    { userId: kabir.id, name: "Spanish", category: "Language", direction: "offered" },
    { userId: kabir.id, name: "Python", category: "Programming", direction: "wanted" },
  ]);
  await db.insert(connectionsTable).values({
    senderId: nisha.id,
    receiverId: aarav.id,
    status: "pending",
  });
}

router.use(async (_req, _res, next) => {
  try {
    await ensureSeeded();
    next();
  } catch (err) {
    next(err);
  }
});

router.post("/auth/register", async (req, res, next) => {
  try {
    const body = RegisterBody.parse(req.body);
    const [existing] = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .where(eq(studentsTable.email, body.email.toLowerCase()))
      .limit(1);
    if (existing) {
      res.status(409).json({ ok: false, message: "An account already exists for this email." });
      return;
    }
    const [student] = await db
      .insert(studentsTable)
      .values({
        name: body.name.trim(),
        email: body.email.toLowerCase(),
        passwordHash: hashPassword(body.password),
        college: body.college.trim(),
        branch: body.branch.trim(),
      })
      .returning();
    if (!student) {
      throw new Error("Account creation failed.");
    }
    setSession(res, student.id);
    const users = await getAllPublicUsers();
    res.json(RegisterResponse.parse({ user: users.find((user) => user.id === student.id) }));
  } catch (err) {
    next(err);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const body = LoginBody.parse(req.body);
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.email, body.email.toLowerCase()))
      .limit(1);
    if (!student || !verifyPassword(body.password, student.passwordHash)) {
      res.status(401).json({ ok: false, message: "Invalid email or password." });
      return;
    }
    setSession(res, student.id);
    const users = await getAllPublicUsers();
    res.json(LoginResponse.parse({ user: users.find((user) => user.id === student.id) }));
  } catch (err) {
    next(err);
  }
});

router.get("/auth/me", async (req, res, next) => {
  try {
    const userId = await currentUserId(req);
    if (!userId) {
      res.json(GetCurrentUserResponse.parse({ user: null }));
      return;
    }
    const users = await getAllPublicUsers();
    res.json(GetCurrentUserResponse.parse({ user: users.find((user) => user.id === userId) ?? null }));
  } catch (err) {
    next(err);
  }
});

router.post("/auth/logout", (_req, res) => {
  clearSession(res);
  res.json(LogoutResponse.parse({ ok: true, message: "Logged out." }));
});

router.get("/profile", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, student.id));
    res.json(GetMyProfileResponse.parse(publicUser(student, skills)));
  } catch (err) {
    next(err);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const body = UpdateMyProfileBody.parse(req.body);
    const [updated] = await db
      .update(studentsTable)
      .set({
        name: body.name.trim(),
        college: body.college.trim(),
        branch: body.branch.trim(),
        profilePicture: body.profilePicture?.trim() || null,
      })
      .where(eq(studentsTable.id, student.id))
      .returning();
    if (!updated) {
      throw new Error("Profile update failed.");
    }
    const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, updated.id));
    res.json(UpdateMyProfileResponse.parse(publicUser(updated, skills)));
  } catch (err) {
    next(err);
  }
});

router.get("/skills", async (req, res, next) => {
  try {
    const query = ListSkillsQueryParams.parse(req.query);
    const users = await getAllPublicUsers();
    const q = query.q?.toLowerCase().trim();
    const category = query.category?.toLowerCase().trim();
    const filtered = users.filter((user) => {
      const skills = [...user.skillsOffered, ...user.skillsWanted];
      const matchesQuery = !q || skills.some((skill) => skill.name.toLowerCase().includes(q));
      const matchesCategory = !category || category === "all" || skills.some((skill) => skill.category.toLowerCase() === category);
      return matchesQuery && matchesCategory;
    });
    res.json(ListSkillsResponse.parse(filtered));
  } catch (err) {
    next(err);
  }
});

router.post("/skills", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const body = AddSkillBody.parse(req.body);
    const [skill] = await db
      .insert(skillsTable)
      .values({
        userId: student.id,
        name: body.name.trim(),
        category: body.category.trim(),
        direction: body.direction,
      })
      .returning();
    res.json(AddSkillResponse.parse(skill));
  } catch (err) {
    next(err);
  }
});

router.put("/skills/:skillId", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const params = UpdateSkillParams.parse(req.params);
    const body = UpdateSkillBody.parse(req.body);
    const [skill] = await db
      .update(skillsTable)
      .set({
        name: body.name.trim(),
        category: body.category.trim(),
        direction: body.direction,
      })
      .where(and(eq(skillsTable.id, params.skillId), eq(skillsTable.userId, student.id)))
      .returning();
    if (!skill) {
      res.status(404).json({ ok: false, message: "Skill not found." });
      return;
    }
    res.json(UpdateSkillResponse.parse(skill));
  } catch (err) {
    next(err);
  }
});

router.delete("/skills/:skillId", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const params = DeleteSkillParams.parse(req.params);
    await db.delete(skillsTable).where(and(eq(skillsTable.id, params.skillId), eq(skillsTable.userId, student.id)));
    res.json(DeleteSkillResponse.parse({ ok: true, message: "Skill deleted." }));
  } catch (err) {
    next(err);
  }
});

router.get("/matches", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const users = await getAllPublicUsers();
    const me = users.find((user) => user.id === student.id);
    if (!me) {
      res.json(ListMatchesResponse.parse([]));
      return;
    }
    const myOffered = new Set(me.skillsOffered.map((skill) => normalizeSkill(skill.name)));
    const myWanted = new Set(me.skillsWanted.map((skill) => normalizeSkill(skill.name)));
    const matches = users
      .filter((user) => user.id !== me.id)
      .map((user) => {
        const theyTeach = user.skillsOffered.filter((skill) => myWanted.has(normalizeSkill(skill.name))).map((skill) => skill.name);
        const youTeach = user.skillsWanted.filter((skill) => myOffered.has(normalizeSkill(skill.name))).map((skill) => skill.name);
        return { user, theyTeach, youTeach, score: theyTeach.length + youTeach.length };
      })
      .filter((match) => match.theyTeach.length > 0 && match.youTeach.length > 0)
      .sort((a, b) => b.score - a.score);
    res.json(ListMatchesResponse.parse(matches));
  } catch (err) {
    next(err);
  }
});

async function connectionWithOther(connection: Connection, currentId: number) {
  const otherId = connection.senderId === currentId ? connection.receiverId : connection.senderId;
  const users = await getAllPublicUsers();
  const otherUser = users.find((user) => user.id === otherId);
  if (!otherUser) {
    throw new Error("Connection user not found.");
  }
  return {
    id: connection.id,
    senderId: connection.senderId,
    receiverId: connection.receiverId,
    status: connection.status,
    createdAt: connection.createdAt.toISOString(),
    otherUser,
  };
}

router.get("/connections", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const connections = await db
      .select()
      .from(connectionsTable)
      .where(or(eq(connectionsTable.senderId, student.id), eq(connectionsTable.receiverId, student.id)))
      .orderBy(desc(connectionsTable.createdAt));
    const hydrated = await Promise.all(connections.map((connection) => connectionWithOther(connection, student.id)));
    res.json(
      ListConnectionsResponse.parse({
        incoming: hydrated.filter((connection) => connection.receiverId === student.id && connection.status === "pending"),
        outgoing: hydrated.filter((connection) => connection.senderId === student.id && connection.status === "pending"),
        accepted: hydrated.filter((connection) => connection.status === "accepted"),
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/connections", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const body = SendConnectionRequestBody.parse(req.body);
    if (body.receiverId === student.id) {
      res.status(400).json({ ok: false, message: "You cannot connect with yourself." });
      return;
    }
    const [receiver] = await db.select().from(studentsTable).where(eq(studentsTable.id, body.receiverId)).limit(1);
    if (!receiver) {
      res.status(404).json({ ok: false, message: "Student not found." });
      return;
    }
    const [existing] = await db
      .select()
      .from(connectionsTable)
      .where(
        or(
          and(eq(connectionsTable.senderId, student.id), eq(connectionsTable.receiverId, body.receiverId)),
          and(eq(connectionsTable.senderId, body.receiverId), eq(connectionsTable.receiverId, student.id)),
        ),
      )
      .limit(1);
    const connection =
      existing ??
      (
        await db
          .insert(connectionsTable)
          .values({ senderId: student.id, receiverId: body.receiverId, status: "pending" })
          .returning()
      )[0];
    if (!connection) {
      throw new Error("Connection request failed.");
    }
    res.json(SendConnectionRequestResponse.parse(await connectionWithOther(connection, student.id)));
  } catch (err) {
    next(err);
  }
});

router.post("/connections/:connectionId/respond", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const params = RespondToConnectionParams.parse(req.params);
    const body = RespondToConnectionBody.parse(req.body);
    const [connection] = await db
      .update(connectionsTable)
      .set({ status: body.status })
      .where(and(eq(connectionsTable.id, params.connectionId), eq(connectionsTable.receiverId, student.id)))
      .returning();
    if (!connection) {
      res.status(404).json({ ok: false, message: "Request not found." });
      return;
    }
    res.json(RespondToConnectionResponse.parse(await connectionWithOther(connection, student.id)));
  } catch (err) {
    next(err);
  }
});

async function hasAcceptedConnection(userId: number, otherId: number) {
  const [connection] = await db
    .select({ id: connectionsTable.id })
    .from(connectionsTable)
    .where(
      and(
        eq(connectionsTable.status, "accepted"),
        or(
          and(eq(connectionsTable.senderId, userId), eq(connectionsTable.receiverId, otherId)),
          and(eq(connectionsTable.senderId, otherId), eq(connectionsTable.receiverId, userId)),
        ),
      ),
    )
    .limit(1);
  return Boolean(connection);
}

router.get("/messages/:userId", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const params = ListMessagesParams.parse(req.params);
    if (!(await hasAcceptedConnection(student.id, params.userId))) {
      res.status(403).json({ ok: false, message: "You can message accepted connections only." });
      return;
    }
    const messages = await db
      .select()
      .from(messagesTable)
      .where(
        or(
          and(eq(messagesTable.senderId, student.id), eq(messagesTable.receiverId, params.userId)),
          and(eq(messagesTable.senderId, params.userId), eq(messagesTable.receiverId, student.id)),
        ),
      )
      .orderBy(asc(messagesTable.timestamp));
    res.json(
      ListMessagesResponse.parse(
        messages.map((message) => ({
          ...message,
          timestamp: message.timestamp.toISOString(),
        })),
      ),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/messages/:userId", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const params = SendMessageParams.parse(req.params);
    const body = SendMessageBody.parse(req.body);
    if (!(await hasAcceptedConnection(student.id, params.userId))) {
      res.status(403).json({ ok: false, message: "You can message accepted connections only." });
      return;
    }
    const [message] = await db
      .insert(messagesTable)
      .values({ senderId: student.id, receiverId: params.userId, message: body.message.trim() })
      .returning();
    if (!message) {
      throw new Error("Message failed.");
    }
    res.json(SendMessageResponse.parse({ ...message, timestamp: message.timestamp.toISOString() }));
  } catch (err) {
    next(err);
  }
});

router.get("/dashboard", async (req, res, next) => {
  try {
    const student = await requireUser(req, res);
    if (!student) {
      return;
    }
    const users = await getAllPublicUsers();
    const me = users.find((user) => user.id === student.id);
    const allSkills = await db.select().from(skillsTable);
    const connections = await db
      .select()
      .from(connectionsTable)
      .where(or(eq(connectionsTable.senderId, student.id), eq(connectionsTable.receiverId, student.id)));
    const messages = await db
      .select()
      .from(messagesTable)
      .where(or(eq(messagesTable.senderId, student.id), eq(messagesTable.receiverId, student.id)))
      .orderBy(desc(messagesTable.timestamp))
      .limit(5);
    const categories = new Map<string, number>();
    for (const skill of allSkills) {
      categories.set(skill.category, (categories.get(skill.category) ?? 0) + 1);
    }
    let matchCount = 0;
    if (me) {
      const myOffered = new Set(me.skillsOffered.map((skill) => normalizeSkill(skill.name)));
      const myWanted = new Set(me.skillsWanted.map((skill) => normalizeSkill(skill.name)));
      matchCount = users.filter((user) => {
        if (user.id === me.id) {
          return false;
        }
        const theyTeach = user.skillsOffered.some((skill) => myWanted.has(normalizeSkill(skill.name)));
        const youTeach = user.skillsWanted.some((skill) => myOffered.has(normalizeSkill(skill.name)));
        return theyTeach && youTeach;
      }).length;
    }
    res.json(
      GetDashboardResponse.parse({
        matchCount,
        incomingRequests: connections.filter((connection) => connection.receiverId === student.id && connection.status === "pending").length,
        connectionCount: connections.filter((connection) => connection.status === "accepted").length,
        messageCount: messages.length,
        categoryCounts: Array.from(categories.entries()).map(([category, count]) => ({ category, count })),
        recentActivity: [
          ...connections.slice(0, 3).map((connection) => `Connection ${connection.status} with student #${connection.senderId === student.id ? connection.receiverId : connection.senderId}`),
          ...messages.slice(0, 3).map((message) => `Message ${message.senderId === student.id ? "sent" : "received"}: ${message.message}`),
        ],
      }),
    );
  } catch (err) {
    next(err);
  }
});

export default router;