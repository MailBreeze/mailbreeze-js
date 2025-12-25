import { describe, expect, it } from "vitest";
import { MailBreeze } from "../../src/client";

describe("MailBreeze Client", () => {
  describe("constructor", () => {
    it("should throw error if API key is not provided", () => {
      expect(() => new MailBreeze({ apiKey: "" })).toThrow("API key is required");
    });

    it("should create client with minimal config", () => {
      const client = new MailBreeze({ apiKey: "sk_test_123" });
      expect(client).toBeInstanceOf(MailBreeze);
      expect(client.emails).toBeDefined();
      expect(client.attachments).toBeDefined();
      expect(client.lists).toBeDefined();
      expect(client.verification).toBeDefined();
      expect(client.automations).toBeDefined();
    });

    it("should create client with custom config", () => {
      const client = new MailBreeze({
        apiKey: "sk_test_123",
        baseUrl: "https://custom.api.com",
        timeout: 60000,
        maxRetries: 5,
        authStyle: "bearer",
      });
      expect(client).toBeInstanceOf(MailBreeze);
    });
  });

  describe("contacts()", () => {
    it("should return a Contacts instance for the given list ID", () => {
      const client = new MailBreeze({ apiKey: "sk_test_123" });
      const contacts = client.contacts("list_abc123");
      expect(contacts).toBeDefined();
    });

    it("should return new instance for each call", () => {
      const client = new MailBreeze({ apiKey: "sk_test_123" });
      const contacts1 = client.contacts("list_abc123");
      const contacts2 = client.contacts("list_abc123");
      expect(contacts1).not.toBe(contacts2);
    });

    it("should create contacts with different list IDs", () => {
      const client = new MailBreeze({ apiKey: "sk_test_123" });
      const contacts1 = client.contacts("list_abc");
      const contacts2 = client.contacts("list_xyz");
      expect(contacts1).not.toBe(contacts2);
    });
  });

  describe("resource initialization", () => {
    it("should initialize emails resource", () => {
      const client = new MailBreeze({ apiKey: "sk_test_123" });
      expect(client.emails).toBeDefined();
      expect(typeof client.emails.send).toBe("function");
      expect(typeof client.emails.list).toBe("function");
      expect(typeof client.emails.get).toBe("function");
      expect(typeof client.emails.stats).toBe("function");
    });

    it("should initialize attachments resource", () => {
      const client = new MailBreeze({ apiKey: "sk_test_123" });
      expect(client.attachments).toBeDefined();
      expect(typeof client.attachments.createUpload).toBe("function");
      expect(typeof client.attachments.confirm).toBe("function");
    });

    it("should initialize lists resource", () => {
      const client = new MailBreeze({ apiKey: "sk_test_123" });
      expect(client.lists).toBeDefined();
      expect(typeof client.lists.create).toBe("function");
      expect(typeof client.lists.list).toBe("function");
      expect(typeof client.lists.get).toBe("function");
      expect(typeof client.lists.update).toBe("function");
      expect(typeof client.lists.delete).toBe("function");
      expect(typeof client.lists.stats).toBe("function");
    });

    it("should initialize verification resource", () => {
      const client = new MailBreeze({ apiKey: "sk_test_123" });
      expect(client.verification).toBeDefined();
      expect(typeof client.verification.verify).toBe("function");
      expect(typeof client.verification.batch).toBe("function");
      expect(typeof client.verification.get).toBe("function");
      expect(typeof client.verification.list).toBe("function");
      expect(typeof client.verification.stats).toBe("function");
    });

    it("should initialize automations resource", () => {
      const client = new MailBreeze({ apiKey: "sk_test_123" });
      expect(client.automations).toBeDefined();
      expect(typeof client.automations.enroll).toBe("function");
      expect(client.automations.enrollments).toBeDefined();
      expect(typeof client.automations.enrollments.list).toBe("function");
      expect(typeof client.automations.enrollments.cancel).toBe("function");
    });

    it("should initialize contacts resource methods", () => {
      const client = new MailBreeze({ apiKey: "sk_test_123" });
      const contacts = client.contacts("list_abc");
      expect(typeof contacts.create).toBe("function");
      expect(typeof contacts.list).toBe("function");
      expect(typeof contacts.get).toBe("function");
      expect(typeof contacts.update).toBe("function");
      expect(typeof contacts.delete).toBe("function");
      expect(typeof contacts.suppress).toBe("function");
    });
  });
});
