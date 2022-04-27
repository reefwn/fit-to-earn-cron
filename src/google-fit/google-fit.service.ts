import { GoogleFitRequestBody } from './google-fit.dto';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Auth, google } from 'googleapis';
import { lastValueFrom, map } from 'rxjs';
import {
  GOOGLE_FIT_SESSION_URL,
  GOOGLE_FIT_AGGREGATE_URL,
  GOOGLE_FIT_DURATION_ONE_WEEK,
} from './google-fit.const';
import { GoogleFitResponsePointValue } from './google-fit.interface';

@Injectable()
export class GoogleFitService {
  private oauthClient: Auth.OAuth2Client;

  constructor(private httpService: HttpService) {
    const clientID = process.env.GOOGLE_AUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET;
    const redirectUri = `${process.env.GOOGLE_AUTH_REDIRECT_URL}`;

    this.oauthClient = new google.auth.OAuth2(
      clientID,
      clientSecret,
      redirectUri,
    );
  }

  async refreshGoogleToken(refreshToken: string) {
    try {
      this.oauthClient.setCredentials({
        refresh_token: refreshToken,
      });

      const accessToken = await this.oauthClient.getAccessToken();
      return accessToken.token;
    } catch (error) {
      return null;
    }
  }

  getBody(
    dataTypeName: string,
    dataSourceId: string,
    startTimeMillis: number,
    endTimeMillis: number,
  ): GoogleFitRequestBody {
    return {
      aggregateBy: [
        {
          dataTypeName,
          dataSourceId,
        },
      ],
      bucketByTime: { durationMillis: GOOGLE_FIT_DURATION_ONE_WEEK },
      startTimeMillis,
      endTimeMillis,
    };
  }

  getQuery(
    activityType: number,
    startTimeMillis: number,
    endTimeMillis: number,
  ) {
    const startTime = new Date(startTimeMillis).toISOString();
    const endTime = new Date(endTimeMillis).toISOString();

    return `?startTime=${startTime}&endTime=${endTime}&activityType=${activityType}`;
  }

  async requestAggregate(accessToken: string, body: GoogleFitRequestBody) {
    const observable = this.httpService
      .post(GOOGLE_FIT_AGGREGATE_URL, body, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .pipe(map((res) => res.data));
    const response = await lastValueFrom(observable);

    return response;
  }

  async requestSession(accessToken: string, query?: string) {
    const observable = this.httpService
      .post(`${GOOGLE_FIT_SESSION_URL}${query || ''}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .pipe(map((res) => res.data));
    const response = await lastValueFrom(observable);

    return response;
  }

  findIntVal(value: GoogleFitResponsePointValue[]) {
    return value.find((v) => !!v.intVal);
  }
}
