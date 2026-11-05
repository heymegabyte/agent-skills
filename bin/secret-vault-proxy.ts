#!/usr/bin/env node
/**
 * Hermetic Secret Vault Injection Proxy
 * Injects runtime credentials ephemerally into command subshells without exposing plaintext credentials to LLM context or logs.
 */

import { spawnSync } from "node:child_process";

export interface VaultSecret {
  key: string;
  value: string;
  placeholder: string;
}

export class SecretVaultProxy {
  private secrets: Map<string, VaultSecret> = new Map();

  public registerSecret(key: string, value: string, placeholder?: string): void {
    const ph = placeholder || `{{SECRET_${key.toUpperCase()}}}`;
    this.secrets.set(key, { key, value, placeholder: ph });
  }

  public redactString(text: string): string {
    let sanitized = text;
    for (const secret of this.secrets.values()) {
      if (secret.value && secret.value.length > 3) {
        sanitized = sanitized.split(secret.value).join(secret.placeholder);
      }
    }
    return sanitized;
  }

  public executeWithVault(
    command: string,
    args: string[] = [],
    options: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {}
  ): {
    exitCode: number;
    stdout: string;
    stderr: string;
  } {
    // Build injected environment
    const injectedEnv: NodeJS.ProcessEnv = { ...(options.env || process.env) };
    for (const secret of this.secrets.values()) {
      injectedEnv[secret.key] = secret.value;
    }

    const res = spawnSync(command, args, {
      cwd: options.cwd || process.cwd(),
      env: injectedEnv,
      encoding: "utf-8",
      timeout: options.timeout || 15000,
    });

    return {
      exitCode: res.status ?? (res.error ? 1 : 0),
      stdout: this.redactString(res.stdout || ""),
      stderr: this.redactString(res.stderr || (res.error ? res.error.message : "")),
    };
  }
}

if (process.argv[1]?.endsWith("secret-vault-proxy.ts")) {
  console.log("Secret Vault Proxy ready.");
}
