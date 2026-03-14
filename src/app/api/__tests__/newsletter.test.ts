/**
 * Newsletter API - basic sanity check.
 * Full API testing would require a running server or mocking fetch.
 */
describe("newsletter API", () => {
  it("email validation regex accepts valid emails", () => {
    const validEmails = ["a@b.co", "user@example.com", "test+tag@domain.org"];
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validEmails.forEach((email) => expect(regex.test(email)).toBe(true));
  });

  it("email validation regex rejects invalid emails", () => {
    const invalidEmails = ["", "no-at", "@nodomain.com", "missing@.com"];
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    invalidEmails.forEach((email) => expect(regex.test(email)).toBe(false));
  });
});
