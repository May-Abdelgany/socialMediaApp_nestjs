import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  nameEn: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  nameAr: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({
    required: true,
    minlength: 8,
    select: false,
  })
  password: string;

  @Prop({
    default: null,
  })
  avatar?: string;

  @Prop({
    default: false,
  })
  isEmailVerified: boolean;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    default: null,
    select: false,
  })
  refreshTokenHash?: string;

  @Prop({
    default: null,
    select: false,
  })
  refreshTokenExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);