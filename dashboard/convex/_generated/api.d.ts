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
import type * as director from "../director.js";
import type * as storyboards from "../storyboards.js";
import type * as generations from "../generations.js";
import type * as promptEvents from "../promptEvents.js";
import type * as recordings from "../recordings.js";
import type * as sessions from "../sessions.js";
import type * as shotboards from "../shotboards.js";
import type * as tracks from "../tracks.js";
import type * as twitchStats from "../twitchStats.js";
import type * as locations from "../locations.js";
import type * as promptExpansion from "../promptExpansion.js";
import type * as series from "../series.js";
import type * as styles from "../styles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  clips: typeof clips;
  director: typeof director;
  storyboards: typeof storyboards;
  generations: typeof generations;
  promptEvents: typeof promptEvents;
  recordings: typeof recordings;
  sessions: typeof sessions;
  shotboards: typeof shotboards;
  tracks: typeof tracks;
  twitchStats: typeof twitchStats;
  locations: typeof locations;
  promptExpansion: typeof promptExpansion;
  series: typeof series;
  styles: typeof styles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
