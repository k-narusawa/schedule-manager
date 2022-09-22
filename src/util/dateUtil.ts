export const useDate = () => {
  /**
   * 現在時刻を取得
   *
   * @returns 現在時刻のISOフォーマット
   */
  const now = (): string => {
    const now = new Date();
    return now.toISOString();
  };

  /**
   * 今日の終わりの時刻を取得
   *
   * @returns 今日の終わりの時刻のISOフォーマット
   */
  const endOfToday = (): string => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate());
    nextDay.setHours(23);
    nextDay.setMinutes(59);
    nextDay.setSeconds(59);
    return nextDay.toISOString();
  };

  const extractTimeFormat = (str: string): string => {
    const date = new Date(str);
    const hour = date.getHours();
    const minutes =
      date.getMinutes() > 10 ? date.getMinutes() : '0' + date.getMinutes();
    return hour + ':' + minutes;
  };

  /**
   * 日付オブジェクトのフォーマットを変換
   *
   * @param date 日付オブジェクト
   */
  const dateFormat = (date: Date): string => {
    const hour = date.getHours() > 10 ? date.getHours() : '0' + date.getHours();
    const minutes =
      date.getMinutes() > 10 ? date.getMinutes() : '0' + date.getMinutes();
    const seconds =
      date.getSeconds() > 10 ? date.getSeconds() : '0' + date.getSeconds();
    return hour + ':' + minutes + ':' + seconds;
  };

  /**
   * 文字列を日付オブジェクトに変換する
   *
   * @param date 変換対象の文字列
   * @returns Dateオブジェクト
   */
  const stringToDate = (date: string): Date => {
    return new Date(date);
  };

  return {
    now,
    endOfToday,
    dateFormat,
    extractTimeFormat,
    stringToDate,
  };
};
