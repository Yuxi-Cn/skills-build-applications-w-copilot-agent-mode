import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity request must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)
  ) {
    throw Object.assign(new Error('Valid userId and teamId are required'), { status: 400 });
  }
  if (typeof type !== 'string' || !type.trim() || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('A type and positive minutes value are required'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team request must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('A team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('A team mascot is required'), { status: 400 });
  }
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  const memberIds = [...new Set(members as string[])];
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
