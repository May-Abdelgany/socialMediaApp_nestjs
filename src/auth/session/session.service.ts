import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Session, SessionDocument } from '../../users/schemas/session.schema';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches JWT_REFRESH expiry

@Injectable()
export class SessionsService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  /** Called on signup/login: creates a new device session and returns its id. */
  async create(
    userId: string,
    refreshToken: string,
    meta?: { deviceName?: string; userAgent?: string; ip?: string },
  ): Promise<SessionDocument> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.SALT_ROUNDS);

    return this.sessionModel.create({
      userId: new Types.ObjectId(userId),
      refreshTokenHash,
      deviceName: meta?.deviceName,
      userAgent: meta?.userAgent,
      ip: meta?.ip,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      lastUsedAt: new Date(),
    });
  }

  /**
   * Verifies a presented refresh token against the specific session it claims
   * to belong to (sessionId comes from the JWT payload's `sid` claim).
   * Returns the session if valid, null otherwise.
   */
  async verify(sessionId: string, refreshToken: string): Promise<SessionDocument | null> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    return isMatch ? session : null;
  }

  /** Rotates the refresh token for an existing session (call this on every /refresh). */
  async rotate(sessionId: string, newRefreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, this.SALT_ROUNDS);
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      refreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      lastUsedAt: new Date(),
    });
  }

  async findById(sessionId: string): Promise<SessionDocument | null> {
    return this.sessionModel.findById(sessionId).exec();
  }

  /** Logs out ONE device (the current one). */
  async revoke(sessionId: string): Promise<void> {
    await this.sessionModel.findByIdAndDelete(sessionId);
  }

  /** Logs out EVERY device for this user (e.g. "sign out everywhere" / password change). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.sessionModel.deleteMany({ userId: new Types.ObjectId(userId) });
  }

  /** Lists active devices so the user can see/manage them. */
  async listForUser(userId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ lastUsedAt: -1 })
      .exec();
  }
}