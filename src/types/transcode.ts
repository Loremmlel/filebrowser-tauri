export interface TranscodeStatus {
  id: string
  status: TranscodeState
  progress: number
  outputPath?: string
  error?: string
}

export enum TranscodeState {
  Pending = 'Pending',
  Processing = 'Processing',
  Completed = 'Completed',
  Error = 'Error',
}
