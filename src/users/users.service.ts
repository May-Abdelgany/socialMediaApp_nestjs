import { ConflictException, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll() {
    return this.userModel.find().lean().exec();
  }

  async findOne(id: string) {
    return this.userModel.findById(id).lean().exec();
  }

  async findByEmail(email: string) {
    return this.userModel
      .findOne({
        email: email.toLowerCase(),
      })
      .select('+password')
      .lean()
      .exec();
  }

  async create(data: {
    nameEn: string;
    nameAr: string;
    email: string;
    password: string;
  }) {
    try {
      return await this.userModel.create({
        ...data,
        email: data.email.toLowerCase(),
      });
    } catch (error) {
      const mongoError = error as { code?: number };
      if (mongoError.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async updateRefreshToken(userId: string, refreshTokenHash: string) {
    return this.userModel.updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          refreshTokenHash,
          refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    );
  }
}
