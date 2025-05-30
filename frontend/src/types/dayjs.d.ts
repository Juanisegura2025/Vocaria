import * as dayjs from 'dayjs';

declare module 'dayjs' {
  interface Dayjs {
    // Add any custom dayjs methods you use here
  }
}

export = dayjs;
export as namespace dayjs;
