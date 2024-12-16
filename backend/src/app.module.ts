import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';
import { LocationGateway } from './location/location.gateway';
import { PrismaService } from './prisma.service';

@Module({
  imports: [],
  controllers: [AuthController, UsersController],
  providers: [PrismaService, LocationGateway],
})
export class AppModule {}
