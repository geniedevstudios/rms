import assert from "node:assert/strict";
import test from "node:test";
import { createNewsletter } from "./newsletter.mjs";
import { HttpError } from "./content-store.mjs";

test("a newsletter address is stored once, in lowercase", async () => {
  const rows = [];
  const list = createNewsletter({
    from() {
      return {
        insert(row) {
          if (rows.some((item) => item.email === row.email))
            return { error: { code: "23505" } };
          rows.push(row);
          return { error: null };
        },
      };
    },
  });
  await list.join("Ada@Example.com");
  await list.join("ada@example.com");
  assert.deepEqual(rows, [{ email: "ada@example.com" }]);
  await assert.rejects(
    () => list.join("not-an-email"),
    (error) => error instanceof HttpError && error.status === 400,
  );
});
