import { api } from "./api";
import { NewsletterSubscriber } from "./types";

export const newsletterApi = {
  list: () => api.get<NewsletterSubscriber[]>("/newsletter/admin"),
  create: async (payload: Record<string, unknown>) => api.post<NewsletterSubscriber>("/newsletter/admin", payload),
};
