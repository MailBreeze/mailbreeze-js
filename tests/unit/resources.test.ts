import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Fetcher } from "../../src/http/fetcher";
import { Attachments, Automations, Contacts, Emails, Lists, Verification } from "../../src/resources";

// Create a mock fetcher factory
function createMockFetcher() {
  return {
    request: vi.fn(),
  } as unknown as Fetcher;
}

describe("Resources", () => {
  describe("Emails", () => {
    let mockFetcher: Fetcher;
    let emails: Emails;

    beforeEach(() => {
      mockFetcher = createMockFetcher();
      emails = new Emails(mockFetcher);
    });

    describe("send()", () => {
      it("should make POST request to /emails", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: "email_123",
          status: "queued",
        });

        const result = await emails.send({
          from: "test@example.com",
          to: "user@example.com",
          subject: "Test",
          html: "<p>Hello</p>",
        });

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "POST",
          "/emails",
          {
            from: "test@example.com",
            to: ["user@example.com"],
            subject: "Test",
            html: "<p>Hello</p>",
            cc: undefined,
            bcc: undefined,
          },
          undefined,
          undefined,
        );
        expect(result.id).toBe("email_123");
      });

      it("should normalize to array to single element", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({});

        await emails.send({
          from: "test@example.com",
          to: "user@example.com",
          subject: "Test",
          html: "<p>Hello</p>",
        });

        const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[2].to).toEqual(["user@example.com"]);
      });

      it("should preserve to array as-is", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({});

        await emails.send({
          from: "test@example.com",
          to: ["user1@example.com", "user2@example.com"],
          subject: "Test",
          html: "<p>Hello</p>",
        });

        const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[2].to).toEqual(["user1@example.com", "user2@example.com"]);
      });

      it("should normalize cc and bcc to arrays", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({});

        await emails.send({
          from: "test@example.com",
          to: "user@example.com",
          cc: "cc@example.com",
          bcc: "bcc@example.com",
          subject: "Test",
          html: "<p>Hello</p>",
        });

        const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[2].cc).toEqual(["cc@example.com"]);
        expect(call[2].bcc).toEqual(["bcc@example.com"]);
      });

      it("should include idempotency key in options", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({});

        await emails.send({
          from: "test@example.com",
          to: "user@example.com",
          subject: "Test",
          html: "<p>Hello</p>",
          idempotencyKey: "unique_key_123",
        });

        const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[4]).toEqual({ idempotencyKey: "unique_key_123" });
      });

      it("should support template-based emails", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({});

        await emails.send({
          from: "test@example.com",
          to: "user@example.com",
          templateId: "welcome-template",
          variables: { name: "John" },
        });

        const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[2].templateId).toBe("welcome-template");
        expect(call[2].variables).toEqual({ name: "John" });
      });
    });

    describe("list()", () => {
      it("should make GET request to /emails", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        });

        await emails.list();

        expect(mockFetcher.request).toHaveBeenCalledWith("GET", "/emails", undefined, undefined, undefined);
      });

      it("should pass filter params as query", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        });

        await emails.list({
          page: 2,
          limit: 10,
          status: "delivered",
          to: "user@example.com",
        });

        const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[3]).toEqual({
          page: 2,
          limit: 10,
          status: "delivered",
          to: "user@example.com",
        });
      });
    });

    describe("get()", () => {
      it("should make GET request to /emails/:id", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: "email_123",
          status: "delivered",
        });

        const result = await emails.get("email_123");

        expect(mockFetcher.request).toHaveBeenCalledWith("GET", "/emails/email_123", undefined, undefined, undefined);
        expect(result.id).toBe("email_123");
      });
    });

    describe("stats()", () => {
      it("should make GET request to /emails/stats", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          deliveryRate: 0.98,
        });

        const result = await emails.stats();

        expect(mockFetcher.request).toHaveBeenCalledWith("GET", "/emails/stats", undefined, undefined, undefined);
        expect(result.deliveryRate).toBe(0.98);
      });
    });
  });

  describe("Attachments", () => {
    let mockFetcher: Fetcher;
    let attachments: Attachments;

    beforeEach(() => {
      mockFetcher = createMockFetcher();
      attachments = new Attachments(mockFetcher);
    });

    describe("createUpload()", () => {
      it("should make POST request to /attachments/upload", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          attachmentId: "att_123",
          uploadUrl: "https://upload.example.com/123",
          uploadToken: "token_123",
          expiresAt: "2024-01-01T00:00:00Z",
        });

        const result = await attachments.createUpload({
          fileName: "test.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
        });

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "POST",
          "/attachments/upload",
          {
            fileName: "test.pdf",
            contentType: "application/pdf",
            fileSize: 1024,
          },
          undefined,
          undefined,
        );
        expect(result.attachmentId).toBe("att_123");
      });
    });

    describe("confirm()", () => {
      it("should make POST request to /attachments/confirm", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: "att_123",
          status: "uploaded",
        });

        const result = await attachments.confirm({
          uploadToken: "token_123",
        });

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "POST",
          "/attachments/confirm",
          { uploadToken: "token_123" },
          undefined,
          undefined,
        );
        expect(result.status).toBe("uploaded");
      });
    });
  });

  describe("Lists", () => {
    let mockFetcher: Fetcher;
    let lists: Lists;

    beforeEach(() => {
      mockFetcher = createMockFetcher();
      lists = new Lists(mockFetcher);
    });

    describe("create()", () => {
      it("should make POST request to /contact-lists", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: "list_123",
          name: "Test List",
        });

        const result = await lists.create({
          name: "Test List",
          description: "A test list",
        });

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "POST",
          "/contact-lists",
          { name: "Test List", description: "A test list" },
          undefined,
          undefined,
        );
        expect(result.id).toBe("list_123");
      });
    });

    describe("list()", () => {
      it("should make GET request to /contact-lists", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        });

        await lists.list();

        expect(mockFetcher.request).toHaveBeenCalledWith("GET", "/contact-lists", undefined, undefined, undefined);
      });
    });

    describe("get()", () => {
      it("should make GET request to /contact-lists/:id", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: "list_123",
          name: "Test List",
        });

        const result = await lists.get("list_123");

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "GET",
          "/contact-lists/list_123",
          undefined,
          undefined,
          undefined,
        );
        expect(result.id).toBe("list_123");
      });
    });

    describe("update()", () => {
      it("should make PATCH request to /contact-lists/:id", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: "list_123",
          name: "Updated List",
        });

        const result = await lists.update("list_123", { name: "Updated List" });

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "PATCH",
          "/contact-lists/list_123",
          { name: "Updated List" },
          undefined,
          undefined,
        );
        expect(result.name).toBe("Updated List");
      });
    });

    describe("delete()", () => {
      it("should make DELETE request to /contact-lists/:id", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        await lists.delete("list_123");

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "DELETE",
          "/contact-lists/list_123",
          undefined,
          undefined,
          undefined,
        );
      });
    });

    describe("stats()", () => {
      it("should make GET request to /contact-lists/:id/stats", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          activeContacts: 100,
          bouncedContacts: 5,
        });

        const result = await lists.stats("list_123");

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "GET",
          "/contact-lists/list_123/stats",
          undefined,
          undefined,
          undefined,
        );
        expect(result.activeContacts).toBe(100);
      });
    });
  });

  describe("Contacts", () => {
    let mockFetcher: Fetcher;
    let contacts: Contacts;

    beforeEach(() => {
      mockFetcher = createMockFetcher();
      contacts = new Contacts(mockFetcher, "list_abc");
    });

    describe("path building", () => {
      it("should prefix all paths with /contact-lists/:listId/contacts", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "contact_123" });

        await contacts.get("contact_123");

        const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[1]).toBe("/contact-lists/list_abc/contacts/contact_123");
      });
    });

    describe("create()", () => {
      it("should make POST request to create contact", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: "contact_123",
          email: "user@example.com",
        });

        const result = await contacts.create({
          email: "user@example.com",
          firstName: "John",
          lastName: "Doe",
        });

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "POST",
          "/contact-lists/list_abc/contacts",
          { email: "user@example.com", firstName: "John", lastName: "Doe" },
          undefined,
          undefined,
        );
        expect(result.id).toBe("contact_123");
      });
    });

    describe("list()", () => {
      it("should make GET request with filters", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        });

        await contacts.list({ status: "active", page: 1, limit: 50 });

        const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[1]).toBe("/contact-lists/list_abc/contacts");
        expect(call[3]).toEqual({ page: 1, limit: 50, status: "active" });
      });
    });

    describe("update()", () => {
      it("should make PUT request to update contact", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: "contact_123",
          firstName: "Jane",
        });

        const result = await contacts.update("contact_123", { firstName: "Jane" });

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "PUT",
          "/contact-lists/list_abc/contacts/contact_123",
          { firstName: "Jane" },
          undefined,
          undefined,
        );
        expect(result.firstName).toBe("Jane");
      });
    });

    describe("delete()", () => {
      it("should make DELETE request", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        await contacts.delete("contact_123");

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "DELETE",
          "/contact-lists/list_abc/contacts/contact_123",
          undefined,
          undefined,
          undefined,
        );
      });
    });

    describe("suppress()", () => {
      it("should make POST request to suppress contact", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        await contacts.suppress("contact_123", "manual");

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "POST",
          "/contact-lists/list_abc/contacts/contact_123/suppress",
          { reason: "manual" },
          undefined,
          undefined,
        );
      });
    });
  });

  describe("Verification", () => {
    let mockFetcher: Fetcher;
    let verification: Verification;

    beforeEach(() => {
      mockFetcher = createMockFetcher();
      verification = new Verification(mockFetcher);
    });

    describe("verify()", () => {
      it("should make POST request to /email-verification/single", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          isValid: true,
          result: "valid",
        });

        const result = await verification.verify("test@example.com");

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "POST",
          "/email-verification/single",
          { email: "test@example.com" },
          undefined,
          undefined,
        );
        expect(result.isValid).toBe(true);
      });
    });

    describe("batch()", () => {
      it("should make POST request to /email-verification/batch", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          verificationId: "ver_123",
          status: "processing",
        });

        const result = await verification.batch({
          emails: ["a@example.com", "b@example.com"],
        });

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "POST",
          "/email-verification/batch",
          { emails: ["a@example.com", "b@example.com"] },
          undefined,
          undefined,
        );
        expect(result.verificationId).toBe("ver_123");
      });
    });

    describe("get()", () => {
      it("should make GET request to /email-verification/:id", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: "ver_123",
          status: "completed",
        });

        const result = await verification.get("ver_123");

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "GET",
          "/email-verification/ver_123",
          undefined,
          { includeResults: true },
          undefined,
        );
        expect(result.status).toBe("completed");
      });
    });

    describe("list()", () => {
      it("should make GET request to /email-verification", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        });

        await verification.list({ status: "completed", page: 1 });

        const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[1]).toBe("/email-verification");
        expect(call[3]).toEqual({ page: 1, status: "completed" });
      });
    });

    describe("stats()", () => {
      it("should make GET request to /email-verification/stats", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          totalVerified: 1000,
          valid: 950,
        });

        const result = await verification.stats();

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "GET",
          "/email-verification/stats",
          undefined,
          undefined,
          undefined,
        );
        expect(result.totalVerified).toBe(1000);
      });
    });
  });

  describe("Automations", () => {
    let mockFetcher: Fetcher;
    let automations: Automations;

    beforeEach(() => {
      mockFetcher = createMockFetcher();
      automations = new Automations(mockFetcher);
    });

    describe("enroll()", () => {
      it("should make POST request to enroll contact", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          enrollmentId: "enroll_123",
          status: "active",
        });

        const result = await automations.enroll({
          automationId: "auto_welcome",
          contactId: "contact_123",
          variables: { couponCode: "WELCOME10" },
        });

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "POST",
          "/automations/auto_welcome/enroll",
          { contactId: "contact_123", variables: { couponCode: "WELCOME10" } },
          undefined,
          undefined,
        );
        expect(result.enrollmentId).toBe("enroll_123");
      });
    });

    describe("enrollments.list()", () => {
      it("should make GET request to /automation-enrollments", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        });

        await automations.enrollments.list({ automationId: "auto_123", status: "active" });

        const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[1]).toBe("/automation-enrollments");
        expect(call[3]).toEqual({ automationId: "auto_123", status: "active" });
      });
    });

    describe("enrollments.cancel()", () => {
      it("should make POST request to cancel enrollment", async () => {
        (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
          cancelled: true,
        });

        const result = await automations.enrollments.cancel("enroll_123");

        expect(mockFetcher.request).toHaveBeenCalledWith(
          "POST",
          "/automation-enrollments/enroll_123/cancel",
          {},
          undefined,
          undefined,
        );
        expect(result.cancelled).toBe(true);
      });
    });
  });

  describe("Pagination handling", () => {
    it("should extract paginated list from response", async () => {
      const mockFetcher = createMockFetcher();
      const emails = new Emails(mockFetcher);

      (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{ id: "email_1" }, { id: "email_2" }],
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
          hasNext: true,
          hasPrev: false,
        },
      });

      const result = await emails.list();

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.hasNext).toBe(true);
    });

    it("should handle array response without pagination", async () => {
      const mockFetcher = createMockFetcher();
      const emails = new Emails(mockFetcher);

      // Simulate an array response (for backwards compatibility)
      (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "email_1" }, { id: "email_2" }]);

      const result = await emails.list();

      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe("Domain ID handling", () => {
    it("should add domainId to queries when provided", async () => {
      const mockFetcher = createMockFetcher();
      const emails = new Emails(mockFetcher, "domain_123");

      (mockFetcher.request as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      });

      await emails.list();

      const call = (mockFetcher.request as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[3]).toEqual({ domainId: "domain_123" });
    });
  });
});
