import type { AccountService } from "@bass/bbs-sdk-fetch/apis/AccountService";
import type { ArticleService } from "@bass/bbs-sdk-fetch/apis/ArticleService";
import type { AuthService } from "@bass/bbs-sdk-fetch/apis/AuthService";
import type { CheckinService } from "@bass/bbs-sdk-fetch/apis/CheckinService";
import type { CommentService } from "@bass/bbs-sdk-fetch/apis/CommentService";
import type { DomainService } from "@bass/bbs-sdk-fetch/apis/DomainService";
import type { LocationService } from "@bass/bbs-sdk-fetch/apis/LocationService";
import type { NotificationService } from "@bass/bbs-sdk-fetch/apis/NotificationService";
import type { OtpService } from "@bass/bbs-sdk-fetch/apis/OtpService";
import type { PostscriptService } from "@bass/bbs-sdk-fetch/apis/PostscriptService";
import type { PreferencesService } from "@bass/bbs-sdk-fetch/apis/PreferencesService";
import type { PrivacySettingService } from "@bass/bbs-sdk-fetch/apis/PrivacySettingService";
import type { RelationService } from "@bass/bbs-sdk-fetch/apis/RelationService";
import type { TagService } from "@bass/bbs-sdk-fetch/apis/TagService";
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
  account: deferBbsService(async () => {
    const { AccountService } = await import("@bass/bbs-sdk-fetch/apis/AccountService");
    return throughBbsProxy(new AccountService(bbsConfiguration));
  }),
  article: deferBbsService(async () => {
    const { ArticleService } = await import("@bass/bbs-sdk-fetch/apis/ArticleService");
    return throughBbsProxy(new ArticleService(bbsConfiguration));
  }),
  auth: deferBbsService(async () => {
    const { AuthService } = await import("@bass/bbs-sdk-fetch/apis/AuthService");
    return throughBbsProxy(new AuthService(bbsConfiguration));
  }),
  breezemoon: deferBbsService(async () => {
    const { BreezemoonService } = await import("@bass/bbs-sdk-fetch/apis/BreezemoonService");
    return throughBbsProxy(new BreezemoonService(bbsConfiguration));
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
  relation: deferBbsService(async () => {
    const { RelationService } = await import("@bass/bbs-sdk-fetch/apis/RelationService");
    return throughBbsProxy(new RelationService(bbsConfiguration));
  }),
  tag: deferBbsService(async () => {
    const { TagService } = await import("@bass/bbs-sdk-fetch/apis/TagService");
    return throughBbsProxy(new TagService(bbsConfiguration));
  }),
};
