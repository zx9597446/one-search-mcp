/**
 * The following code is based on
 * https://github.com/bytedance/UI-TARS-desktop/tree/main/packages/agent-infra/browser
 * 
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @agent-infra/browser
 * A browser automation library based on puppeteer-core
 *
 * Main exports:
 * - types: Type definitions for browser interfaces
 * - BrowserFinder: Utility to detect and locate installed browsers
 * - LocalBrowser: Control locally installed browsers
 * - RemoteBrowser: Connect to remote browser instances
 * - BaseBrowser: Abstract base class for browser implementations
 */
export * from './types.js';
export * from './finder.js';
export * from './base.js';
export * from './local.js';
export * from './remote.js';