export const dayKey = (date) => date.slice(0, 10);

/** Record count and total price per day (keyed by `dayKey`). */
export function summarizeByDay(performedTasks) {
    const summaries = new Map();
    for (const performedTask of performedTasks) {
        const summary = summaries.get(dayKey(performedTask.date)) ?? { count: 0, price: 0 };
        summary.count += 1;
        summary.price += performedTask.price ?? 0;
        summaries.set(dayKey(performedTask.date), summary);
    }
    return summaries;
}
