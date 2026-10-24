import type { BaseAPI } from "@bass/bbs-sdk-fetch/runtime";
import { createSdkConfiguration, createSdkFetch, toBbsProxyUrl } from "./shared";

export const bbsApiBase = "/api/bbs";

export const bbsFetch = createSdkFetch({
  proxyPath: bbsApiBase,
});

export const bbsConfiguration = createSdkConfiguration({
  basePath: bbsApiBase,
  fetchApi: bbsFetch,
});

function throughBbsProxy<T extends BaseAPI>(service: T): T {
  return service.withPreMiddleware(async ({ url, init }) => ({
    url: toBbsProxyUrl(url, bbsApiBase),
    init,
  }));
}

function deferBbsService<T extends BaseAPI>(loadService: () => Promise<T>): T {
  let servicePromise: Promise<T> | undefined;
  const getService = () => (servicePromise ??= loadService());

  return new Proxy({} as T, {
    get(_target, property) {
      if (property === "then") return undefined;
      return (...args: unknown[]) =>
        getService().then((service) => {
          const member = service[property as keyof T];
          if (typeof member !== "function") return member;
          return member.apply(service, args);
        });
    },
  });
}

export const bbsClient = {
  asset: deferBbsService(async () => {
    const { AssetService } = await import("@bass/bbs-sdk-fetch/apis/AssetService");
    return throughBbsProxy(new AssetService(bbsConfiguration));
  }),
  account: deferBbsService(async () => {
    const { AccountService } = await import("@bass/bbs-sdk-fetch/apis/AccountService");
    return throughBbsProxy(new AccountService(bbsConfiguration));
  }),
  article: deferBbsService(async () => {
    const { ArticleService } = await import("@bass/bbs-sdk-fetch/apis/ArticleService");
    return throughBbsProxy(new ArticleService(bbsConfiguration));
  }),
  articleSearch: deferBbsService(async () => {
    const { ArticleSearchService } = await import("@bass/bbs-sdk-fetch/apis/ArticleSearchService");
    return throughBbsProxy(new ArticleSearchService(bbsConfiguration));
  }),
  auth: deferBbsService(async () => {
    const { AuthService } = await import("@bass/bbs-sdk-fetch/apis/AuthService");
    return throughBbsProxy(new AuthService(bbsConfiguration));
  }),
  moonbreeze: deferBbsService(async () => {
    const { MoonbreezeService } = await import("@bass/bbs-sdk-fetch/apis/MoonbreezeService");
    return throughBbsProxy(new MoonbreezeService(bbsConfiguration));
  }),
  checkin: deferBbsService(async () => {
    const { CheckinService } = await import("@bass/bbs-sdk-fetch/apis/CheckinService");
    return throughBbsProxy(new CheckinService(bbsConfiguration));
  }),
  comment: deferBbsService(async () => {
    const { CommentService } = await import("@bass/bbs-sdk-fetch/apis/CommentService");
    return throughBbsProxy(new CommentService(bbsConfiguration));
  }),
  domain: deferBbsService(async () => {
    const { DomainService } = await import("@bass/bbs-sdk-fetch/apis/DomainService");
    return throughBbsProxy(new DomainService(bbsConfiguration));
  }),
  holiday: deferBbsService(async () => {
    const { HolidayService } = await import("@bass/bbs-sdk-fetch/apis/HolidayService");
    return throughBbsProxy(new HolidayService(bbsConfiguration));
  }),
  privateChat: deferBbsService(async () => {
    const { PrivateChatService } = await import("@bass/bbs-sdk-fetch/apis/PrivateChatService");
    return throughBbsProxy(new PrivateChatService(bbsConfiguration));
  }),
  globalChat: deferBbsService(async () => {
    const { GlobalChatService } = await import("@bass/bbs-sdk-fetch/apis/GlobalChatService");
    return throughBbsProxy(new GlobalChatService(bbsConfiguration));
  }),
  emoji: deferBbsService(async () => {
    const { EmojiService } = await import("@bass/bbs-sdk-fetch/apis/EmojiService");
    return throughBbsProxy(new EmojiService(bbsConfiguration));
  }),
  location: deferBbsService(async () => {
    const { LocationService } = await import("@bass/bbs-sdk-fetch/apis/LocationService");
    return throughBbsProxy(new LocationService(bbsConfiguration));
  }),
  notification: deferBbsService(async () => {
    const { NotificationService } = await import("@bass/bbs-sdk-fetch/apis/NotificationService");
    return throughBbsProxy(new NotificationService(bbsConfiguration));
  }),
  otp: deferBbsService(async () => {
    const { OtpService } = await import("@bass/bbs-sdk-fetch/apis/OtpService");
    return throughBbsProxy(new OtpService(bbsConfiguration));
  }),
  postscript: deferBbsService(async () => {
    const { PostscriptService } = await import("@bass/bbs-sdk-fetch/apis/PostscriptService");
    return throughBbsProxy(new PostscriptService(bbsConfiguration));
  }),
  preferences: deferBbsService(async () => {
    const { PreferencesService } = await import("@bass/bbs-sdk-fetch/apis/PreferencesService");
    return throughBbsProxy(new PreferencesService(bbsConfiguration));
  }),
  privacySetting: deferBbsService(async () => {
    const { PrivacySettingService } = await import("@bass/bbs-sdk-fetch/apis/PrivacySettingService");
    return throughBbsProxy(new PrivacySettingService(bbsConfiguration));
  }),
  realtime: deferBbsService(async () => {
    const { RealtimeService } = await import("@bass/bbs-sdk-fetch/apis/RealtimeService");
    return throughBbsProxy(new RealtimeService(bbsConfiguration));
  }),
  relation: deferBbsService(async () => {
    const { RelationService } = await import("@bass/bbs-sdk-fetch/apis/RelationService");
    return throughBbsProxy(new RelationService(bbsConfiguration));
  }),
  tag: deferBbsService(async () => {
    const { TagService } = await import("@bass/bbs-sdk-fetch/apis/TagService");
    return throughBbsProxy(new TagService(bbsConfiguration));
  }),
};
