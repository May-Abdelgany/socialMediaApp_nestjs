import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

/**
 * One document per active login (per device/browser), not per user.
 * This is what makes multi-device login possible: a user can have many
 * Session documents at once, each with its own refresh token.
 */
@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Never store the raw refresh token — only its bcrypt hash, same as passwords.
  @Prop({ required: true })
  refreshTokenHash: string;

  // Human-readable device label, e.g. "Chrome on Windows" / "iPhone app".
  // Lets you show the user "Sign out of this device" lists.
  @Prop()
  deviceName?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ip?: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  lastUsedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Mongo TTL index: expired sessions are auto-deleted, no cron job needed.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });