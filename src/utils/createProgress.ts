import { clamp } from './clamp';

export type Progress = {
  set(progress: number): void;
  setMessage(message: string): void;
  subProgress(from: number, to: number): Progress;
  subTask(from: number, to: number,
    cb: (progress: Progress) => void): Promise<void>;
};

export function createProgress({ from, to, setProgress, setMessage }: {
  from: number;
  to: number;
  setProgress: (value: number) => void;
  setMessage: (message: string) => void;
}): Progress {
  const newSetProgress = (progress: number) => {
    setProgress(from + (to - from) * clamp(progress, 0, 1));
  };
  return {
    set: newSetProgress,
    setMessage: setMessage,
    async subTask(from: number, to: number, cb: (progress: Progress) => void) {
      const subTaskProgress = createProgress({
        from,
        to,
        setProgress: newSetProgress,
        setMessage
      });
      await cb(subTaskProgress);
    },
    subProgress(from: number, to: number) {
      return createProgress({
        from,
        to,
        setProgress: newSetProgress,
        setMessage
      });
    }
  };
}

