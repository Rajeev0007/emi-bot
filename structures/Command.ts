/**
 * @file Command.ts
 * @description Base class for all slash/prefix hybrid commands.
 */

import type {
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  Client,
} from 'discord.js';

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

export interface CommandOptions {
  data: SlashCommandData;
  execute: (interaction: ChatInputCommandInteraction, client?: Client) => Promise<unknown>;
  category?: string;
  cooldown?: number | null;
  ownerOnly?: boolean;
  guildOnly?: boolean;
  nsfw?: boolean;
  premium?: boolean;
  permissions?: string[];
  maintenance?: boolean;
  autocomplete?: ((interaction: AutocompleteInteraction, client?: Client) => Promise<void>) | null;
  /** Additional names the command can be invoked with via prefix (e.g. ['bal'] for 'balance'). */
  aliases?: string[];
}

export class Command {
  data: SlashCommandData;
  execute: CommandOptions['execute'];
  category: string;
  cooldown: number | null;
  ownerOnly: boolean;
  guildOnly: boolean;
  nsfw: boolean;
  premium: boolean;
  permissions: string[];
  maintenance: boolean;
  autocomplete: CommandOptions['autocomplete'];
  aliases: string[];

  constructor(options: CommandOptions) {
    if (!options.data)    throw new Error('[Command] "data" (SlashCommandBuilder) is required.');
    if (!options.execute) throw new Error('[Command] "execute" function is required.');

    this.data        = options.data;
    this.execute     = options.execute;
    this.category    = options.category    ?? 'utility';
    this.cooldown    = options.cooldown    ?? null;
    this.ownerOnly   = options.ownerOnly   ?? false;
    this.guildOnly   = options.guildOnly   ?? true;
    this.nsfw        = options.nsfw        ?? false;
    this.premium     = options.premium     ?? false;
    this.permissions = options.permissions ?? [];
    this.maintenance  = options.maintenance  ?? false;
    this.autocomplete = options.autocomplete ?? null;
    this.aliases      = options.aliases      ?? [];
  }

  get name(): string {
    return (this.data as { name: string }).name;
  }
}
