export interface GoogleFitResponsePointValueMapVal {
  key: string;
  value: {
    fpVal: number;
  };
}

export interface GoogleFitResponsePointValue {
  intVal?: number;
  fpVal?: number;
  stringVal?: string;
  mapVal: GoogleFitResponsePointValueMapVal[];
}

export interface GoogleFitResponsePoint {
  startTimeNanos: number;
  endTimeNanos: number;
  dataTypeName: string;
  originDataSourceId: string;
  value: GoogleFitResponsePointValue[];
  modifiedTimeMillis: number;
  rawTimestampNanos: number;
  computationTimeMillis: number;
}

export interface GoogleFitResponse {
  minStartTimeNs: number;
  maxEndTimeNs: number;
  dataSourceId: string;
  point: GoogleFitResponsePoint[];
  nextPageToken: string;
}
