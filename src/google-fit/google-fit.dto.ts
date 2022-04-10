export class GoogleFitAggregateBy {
  dataTypeName: string;
  dataSourceId: string;
}

export class GoogleFitBucketByTime {
  durationMillis: number;
}

export class GoogleFitRequestBody {
  aggregateBy: GoogleFitAggregateBy[];
  bucketByTime: GoogleFitBucketByTime;
  startTimeMillis: number;
  endTimeMillis: number;
}
