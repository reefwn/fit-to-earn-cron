import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { ActivityService } from './activity/activity.service';
import { ActivityEntity } from './entities/activity.entity';
import { ActivityEnrollmentEntity } from './entities/activity-enrollment.entity';
import { MemberEntity } from './entities/member.entity';
import { CoinEntity } from './entities/coin.entity';
import { DocumentNumberEntity } from './entities/document-number.entity';
import { DocumentNumberService } from './document-number/document-number.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_TYPE || 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: +process.env.DATABASE_PORT || 5432,
      username: process.env.DATABASE_USER || 'dbuser',
      password: process.env.DATABASE_PASSWORD || 'dbpassword',
      database: process.env.DATABASE_NAME || 'app',
      // TODO: for debugging
      logging: true,
      entities: [
        MemberEntity,
        ActivityEntity,
        ActivityEnrollmentEntity,
        CoinEntity,
        DocumentNumberEntity,
      ],
    }),
    TypeOrmModule.forFeature([
      MemberEntity,
      ActivityEntity,
      ActivityEnrollmentEntity,
      CoinEntity,
      DocumentNumberEntity,
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, ActivityService, DocumentNumberService],
})
export class AppModule {}
