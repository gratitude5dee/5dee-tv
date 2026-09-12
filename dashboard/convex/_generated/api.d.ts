/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as clips from "../clips.js";
import type * as generations from "../generations.js";
import type * as promptEvents from "../promptEvents.js";
import type * as recordings from "../recordings.js";
import type * as sessions from "../sessions.js";
import type * as twitchStats from "../twitchStats.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  clips: typeof clips;
  generations: typeof generations;
  promptEvents: typeof promptEvents;
  recordings: typeof recordings;
  sessions: typeof sessions;
  twitchStats: typeof twitchStats;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
