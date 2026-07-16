/**
 * @file V2Flag.ts
 * @description Patches Discord interaction reply methods so IS_COMPONENTS_V2
 * is automatically included in every deferReply / editReply / reply /
 * followUp / update call.
 *
 * Why this is needed:
 *   Discord validates component types against the IS_COMPONENTS_V2 flag that
 *   is present in the PATCH body, NOT the existing message flags.  If editReply
 *   omits the flag, Discord treats it as a V1 message and rejects Container /
 *   TextDisplay / Section etc. (type ≠ 1).
 */

import { MessageFlags } from 'discord.js';

const IS_V2 = Number(MessageFlags.IsComponentsV2); // 32768

function withV2(options: unknown): unknown {
  if (!options || typeof options !== 'object') return options ?? {};
  const o = { ...(options as Record<string, unknown>) };
  o.flags = ((typeof o.flags === 'number' ? o.flags : 0) | IS_V2);
  return o;
}

/**
 * Wraps deferReply / editReply / reply / followUp / update on any
 * interaction-like object so every call carries IS_COMPONENTS_V2.
 * Mutates in place and returns the same reference for chaining.
 */
export function patchReplies<T extends object>(interaction: T): T {
  const i = interaction as Record<string, unknown>;
  for (const name of ['deferReply', 'editReply', 'reply', 'followUp', 'update']) {
    if (typeof i[name] === 'function') {
      const orig = (i[name] as (...a: unknown[]) => unknown).bind(interaction);
      i[name] = (opts?: unknown) => orig(withV2(opts));
    }
  }
  return interaction;
}
