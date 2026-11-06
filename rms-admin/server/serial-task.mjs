// Serialize read-modify-write operations within this server process.
export function serialTask() {
  let pending = Promise.resolve();
  return (task) => {
    const result = pending.then(task);
    pending = result.catch(() => {});
    return result;
  };
}
