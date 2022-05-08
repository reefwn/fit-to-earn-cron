export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const getWeekFromDate = (date: string) => {
  const curr = +new Date(date) - 14 * 60 * 60 * 1000;
  const now = new Date(curr);

  const week = [];
  for (let i = 1; i <= 7; i++) {
    const first = now.getDate() - now.getDay();
    const today = first + i;

    const d = new Date(now.setDate(today));

    const dd = `${d.getDate}`.padStart(2, '0');
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    const yyyy = `${d.getFullYear()}`;

    const weekDay = `${yyyy}-${mm}-${dd} 07:00:00`;
    week.push(weekDay);
  }

  return week;
};
