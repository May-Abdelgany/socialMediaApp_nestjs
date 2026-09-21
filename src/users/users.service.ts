import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';
import { AppException } from '../common/exceptions/app.exception';

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
    const user = await this.userModel.findById(id).lean().exec();
    if (!user) {
      throw new AppException('USER_NOT_FOUND');
    }
    return user;
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
        throw new AppException('EMAIL_ALREADY_EXISTS');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }
}
