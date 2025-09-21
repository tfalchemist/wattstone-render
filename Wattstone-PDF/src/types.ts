export type Inputs = {
  project: { name?: string; street?: string; plz?: string; ort?: string };
  orientation: 'S'|'EW';
  ausrichtung: '1'|'2';         // 1=H, 2=V
  stone: '0'|'6'|'10V1'|'10V2'|'10XL'|'15';
  moduleH: number; moduleW: number; moduleWeight: number;
  windZone: 1|2|3|4;
  terrain: 1|2|3|4;
  height: number;
  roofType: 'bitumen'|'kies'|'pvc'|'epdm'|'beton';
};

export type Outputs = {
  qp50: number; qpRef: number|null; vb0: number;
  groups: Array<{ group: number; jTotal: number; kExtra: number }>;
  allNegative: boolean; maxPositiveK?: number|null;
  deflector: boolean; combBallast: number;
};

export type JobRecord = {
  jobId: string; tenantId: string;
  status: 'queued'|'processing'|'done'|'failed';
  createdAt: string; updatedAt: string;
  email?: string;
  s3Key?: string; error?: string;
};
