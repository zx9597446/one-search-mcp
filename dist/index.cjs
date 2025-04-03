#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
module.exports = __toCommonJS(index_exports);
var import_server = require("@modelcontextprotocol/sdk/server/index.js");
var import_types = require("@modelcontextprotocol/sdk/types.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");

// src/search/bing.ts
async function bingSearch(options) {
  const { query, limit = 10, safeSearch = 0, page = 1, apiUrl = "https://api.bing.microsoft.com/v7.0/search", apiKey, language } = options;
  const bingSafeSearchOptions = ["Off", "Moderate", "Strict"];
  if (!apiKey) {
    throw new Error("Bing API key is required");
  }
  const searchOptions = {
    q: query,
    count: limit,
    offset: (page - 1) * limit,
    mkt: language,
    safeSearch: bingSafeSearchOptions[safeSearch]
  };
  try {
    const queryParams = new URLSearchParams();
    Object.entries(searchOptions).forEach(([key, value]) => {
      if (value !== void 0) {
        queryParams.set(key, value.toString());
      }
    });
    const res = await fetch(`${apiUrl}?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": apiKey
      }
    });
    if (!res.ok) {
      throw new Error(`Bing search error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const serp = data.webPages?.value;
    const results = serp?.map((item) => ({
      title: item.name,
      snippet: item.snippet,
      url: item.url,
      source: item.siteName,
      thumbnailUrl: item.thumbnailUrl,
      language: item.language,
      image: null,
      video: null,
      engine: "bing"
    })) ?? [];
    return {
      results,
      success: true
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bing search error.";
    process.stdout.write(msg);
    throw err;
  }
}

// src/search/duckduckgo.ts
var DDG = __toESM(require("duck-duck-scrape"), 1);
var import_async_retry = __toESM(require("async-retry"), 1);
async function duckDuckGoSearch(options) {
  try {
    const { query, timeout = 1e4, safeSearch = DDG.SafeSearchType.OFF, retry = { retries: 3 }, ...searchOptions } = options;
    const res = await (0, import_async_retry.default)(
      () => {
        return DDG.search(query, {
          ...searchOptions,
          safeSearch
        }, {
          // needle options
          response_timeout: timeout
        });
      },
      retry
    );
    const results = res ? {
      noResults: res.noResults,
      vqd: res.vqd,
      results: res.results
    } : {
      noResults: true,
      vqd: "",
      results: []
    };
    return {
      results: results.results.map((result) => ({
        title: result.title,
        snippet: result.description,
        url: result.url,
        source: result.hostname,
        image: null,
        video: null,
        engine: "duckduckgo"
      })),
      success: true
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "DuckDuckGo search error.";
    process.stdout.write(msg);
    throw error;
  }
}

// src/search/searxng.ts
var import_node_url = __toESM(require("url"), 1);
async function searxngSearch(params) {
  try {
    const {
      query,
      page = 1,
      limit = 10,
      categories = "general",
      engines = "all",
      safeSearch = 0,
      format = "json",
      language = "auto",
      timeRange = "",
      timeout = 1e4,
      apiKey,
      apiUrl
    } = params;
    if (!apiUrl) {
      throw new Error("SearxNG API URL is required");
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Number(timeout));
    const config = {
      q: query,
      pageno: page,
      categories,
      format,
      safesearch: safeSearch,
      language,
      engines,
      time_range: timeRange
    };
    const endpoint = `${apiUrl}/search`;
    const queryParams = import_node_url.default.format({ query: config });
    const headers = {
      "Content-Type": "application/json"
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const res = await fetch(`${endpoint}${queryParams}`, {
      method: "POST",
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const response = await res.json();
    if (response.results) {
      const list = response.results.slice(0, limit);
      const results = list.map((item) => {
        const image = item.img_src ? {
          thumbnail: item.thumbnail_src,
          src: item.img_src
        } : null;
        const video = item.iframe_src ? {
          thumbnail: item.thumbnail_src,
          src: item.iframe_src
        } : null;
        return {
          title: item.title,
          snippet: item.content,
          url: item.url,
          source: item.source,
          image,
          video,
          engine: item.engine
        };
      });
      return {
        results,
        success: true
      };
    }
    return {
      results: [],
      success: false
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Searxng search error.";
    process.stdout.write(msg);
    throw err;
  }
}

// src/search/tavily.ts
var import_core = require("@tavily/core");
async function tavilySearch(options) {
  const {
    query,
    limit = 10,
    categories = "general",
    timeRange,
    apiKey
  } = options;
  if (!apiKey) {
    throw new Error("Tavily API key is required");
  }
  try {
    const tvly = (0, import_core.tavily)({
      apiKey
    });
    const params = {
      topic: categories,
      timeRange,
      maxResults: limit
    };
    const res = await tvly.search(query, params);
    const results = res.results.map((item) => ({
      title: item.title,
      url: item.url,
      snippet: item.content,
      engine: "tavily"
    }));
    return {
      results,
      success: true
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Tavily search error.";
    process.stdout.write(msg);
    throw error;
  }
}

// src/libs/browser/types.ts
var import_puppeteer_core = require("puppeteer-core");

// src/libs/browser/finder.ts
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var os = __toESM(require("os"), 1);
var import_logger = require("@agent-infra/logger");
var BrowserFinder = class {
  /**
   * Logger instance for diagnostic output
   */
  logger;
  /**
   * Creates a new BrowserFinder instance
   * @param {Logger} [logger] - Optional custom logger
   */
  constructor(logger3) {
    this.logger = logger3 ?? import_logger.defaultLogger;
  }
  /**
   * Getter that returns the list of supported browsers with their platform-specific paths
   * @returns {Browser[]} Array of browser configurations
   * @private
   */
  get browsers() {
    const HOME_DIR = os.homedir();
    const LOCAL_APP_DATA = process.env.LOCALAPPDATA;
    return [
      {
        name: "Chromium",
        executable: {
          win32: "C:\\Program Files\\Chromium\\Application\\chrome.exe",
          darwin: "/Applications/Chromium.app/Contents/MacOS/Chromium",
          linux: "/usr/bin/chromium"
        },
        userDataDir: {
          win32: `${LOCAL_APP_DATA}\\Chromium\\User Data`,
          darwin: `${HOME_DIR}/Library/Application Support/Chromium`,
          linux: `${HOME_DIR}/.config/chromium`
        }
      },
      {
        name: "Google Chrome",
        executable: {
          win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          linux: "/usr/bin/google-chrome"
        },
        userDataDir: {
          win32: `${LOCAL_APP_DATA}\\Google\\Chrome\\User Data`,
          darwin: `${HOME_DIR}/Library/Application Support/Google/Chrome`,
          linux: `${HOME_DIR}/.config/google-chrome`
        }
      },
      {
        name: "Google Chrome Canary",
        executable: {
          win32: "C:\\Program Files\\Google\\Chrome Canary\\Application\\chrome.exe",
          darwin: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
          linux: "/usr/bin/google-chrome-canary"
        },
        userDataDir: {
          win32: `${LOCAL_APP_DATA}\\Google\\Chrome Canary\\User Data`,
          darwin: `${HOME_DIR}/Library/Application Support/Google/Chrome Canary`,
          linux: `${HOME_DIR}/.config/google-chrome-canary`
        }
      }
    ];
  }
  /**
   * Find a specific browser or the first available browser
   * @param {string} [name] - Optional browser name to find
   * @returns {{ executable: string; userDataDir: string }} Browser executable and user data paths
   * @throws {Error} If no supported browser is found or the platform is unsupported
   */
  findBrowser(name) {
    const platform = process.platform;
    this.logger.info("Finding browser on platform:", platform);
    if (platform !== "darwin" && platform !== "win32" && platform !== "linux") {
      const error = new Error(`Unsupported platform: ${platform}`);
      this.logger.error(error.message);
      throw error;
    }
    const browser = name ? this.browsers.find(
      (b) => b.name === name && fs.existsSync(b.executable[platform])
    ) : this.browsers.find((b) => fs.existsSync(b.executable[platform]));
    this.logger.log("browser", browser);
    if (!browser) {
      const error = name ? new Error(`Cannot find browser: ${name}`) : new Error(
        "Cannot find a supported browser on your system. Please install Chrome, Edge, or Brave."
      );
      this.logger.error(error.message);
      throw error;
    }
    const result = {
      executable: browser.executable[platform],
      userDataDir: browser.userDataDir[platform]
    };
    this.logger.success(`Found browser: ${browser.name}`);
    this.logger.info("Browser details:", result);
    return result;
  }
  /**
   * Get browser profiles for a specific browser
   * Reads the Local State file to extract profile information
   * @param {string} [browserName] - Optional browser name to get profiles for
   * @returns {Array<{ displayName: string; path: string }>} Array of profile objects with display names and paths
   */
  getBrowserProfiles(browserName) {
    const browser = this.findBrowser(browserName);
    try {
      const localState = JSON.parse(
        fs.readFileSync(path.join(browser.userDataDir, "Local State"), "utf8")
      );
      const profileInfo = localState.profile.info_cache;
      return Object.entries(profileInfo).map(
        ([profileName, info]) => ({
          displayName: info.name,
          path: path.join(browser.userDataDir, profileName)
        })
      );
    } catch (error) {
      return [];
    }
  }
  /**
   * Legacy method for backwards compatibility
   * Finds Chrome browser executable path
   * @deprecated Use findBrowser instead
   * @returns {string | null} Chrome executable path or null if not found
   */
  findChrome() {
    try {
      const { executable } = this.findBrowser("Google Chrome");
      return executable;
    } catch {
      return null;
    }
  }
};

// src/libs/browser/base.ts
var import_logger2 = require("@agent-infra/logger");
var BaseBrowser = class {
  /**
   * The underlying Puppeteer browser instance
   * @protected
   */
  browser = null;
  /**
   * Logger instance for browser-related logging
   * @protected
   */
  logger;
  /**
   * Reference to the currently active browser page
   * @protected
   */
  activePage = null;
  /**
   * Creates an instance of BaseBrowser
   * @param {BaseBrowserOptions} [options] - Configuration options
   */
  constructor(options) {
    this.logger = options?.logger ?? import_logger2.defaultLogger;
    this.logger.info("Browser Options:", options);
  }
  /**
     * Get the underlying Puppeteer browser instance
     * @throws Error if browser is not launched
  
     * @returns {puppeteer.Browser} Puppeteer browser instance
     */
  getBrowser() {
    if (!this.browser) {
      throw new Error("Browser not launched");
    }
    return this.browser;
  }
  /**
   * Sets up listeners for browser page events
   * Tracks page creation and updates active page reference
   * @protected
   */
  async setupPageListener() {
    if (!this.browser) return;
    this.browser.on("targetcreated", async (target) => {
      const page = await target.page();
      if (page) {
        this.logger.info("New page created:", await page.url());
        this.activePage = page;
        page.once("close", () => {
          if (this.activePage === page) {
            this.activePage = null;
          }
        });
        page.once("error", () => {
          if (this.activePage === page) {
            this.activePage = null;
          }
        });
      }
    });
  }
  /**
   * Closes the browser instance and cleans up resources
   * @returns {Promise<void>} Promise that resolves when browser is closed
   * @throws {Error} If browser fails to close properly
   */
  async close() {
    this.logger.info("Closing browser");
    try {
      await this.browser?.close();
      this.browser = null;
      this.logger.success("Browser closed successfully");
    } catch (error) {
      this.logger.error("Failed to close browser:", error);
      throw error;
    }
  }
  /**
   * Creates a new page, navigates to the specified URL, executes a function in the page context, and returns the result
   * This method is inspired and modified from https://github.com/egoist/local-web-search/blob/04608ed09aa103e2fff6402c72ca12edfb692d19/src/browser.ts#L74
   * @template T - Type of parameters passed to the page function
   * @template R - Return type of the page function
   * @param {EvaluateOnNewPageOptions<T, R>} options - Configuration options for the page evaluation
   * @returns {Promise<R | null>} Promise resolving to the result of the page function or null
   * @throws {Error} If page creation or evaluation fails
   */
  async evaluateOnNewPage(options) {
    const {
      url: url2,
      pageFunction,
      pageFunctionParams,
      beforePageLoad,
      afterPageLoad,
      beforeSendResult,
      waitForOptions
    } = options;
    const page = await this.browser.newPage();
    try {
      await beforePageLoad?.(page);
      await page.goto(url2, {
        waitUntil: "networkidle2",
        ...waitForOptions
      });
      await afterPageLoad?.(page);
      const _window = await page.evaluateHandle(() => window);
      const result = await page.evaluate(
        pageFunction,
        _window,
        ...pageFunctionParams
      );
      await beforeSendResult?.(page, result);
      await _window.dispose();
      await page.close();
      return result;
    } catch (error) {
      await page.close();
      throw error;
    }
  }
  /**
   * Creates a new browser page
   * @returns {Promise<Page>} Promise resolving to the newly created page
   * @throws {Error} If browser is not launched or page creation fails
   */
  async createPage() {
    if (!this.browser) {
      this.logger.error("No active browser");
      throw new Error("Browser not launched");
    }
    const page = await this.browser.newPage();
    return page;
  }
  /**
   * Gets the currently active page or finds an active page if none is currently tracked
   * If no active pages exist, creates a new page
   * @returns {Promise<Page>} Promise resolving to the active page
   * @throws {Error} If browser is not launched or no active page can be found/created
   */
  async getActivePage() {
    if (!this.browser) {
      throw new Error("Browser not launched");
    }
    if (this.activePage) {
      try {
        await this.activePage.evaluate(() => document.readyState);
        return this.activePage;
      } catch (e) {
        this.logger.warn("Active page no longer available:", e);
        this.activePage = null;
      }
    }
    const pages = await this.browser.pages();
    if (pages.length === 0) {
      this.activePage = await this.createPage();
      return this.activePage;
    }
    for (let i = pages.length - 1; i >= 0; i--) {
      const page = pages[i];
      try {
        await page.evaluate(() => document.readyState);
        this.activePage = page;
        return page;
      } catch (e) {
        continue;
      }
    }
    throw new Error("No active page found");
  }
};

// src/libs/browser/local.ts
var puppeteer = __toESM(require("puppeteer-core"), 1);
var LocalBrowser = class extends BaseBrowser {
  /**
   * Browser finder instance to detect and locate installed browsers
   * @private
   */
  browserFinder = new BrowserFinder();
  /**
   * Launches a local browser instance with specified options
   * Automatically detects installed browsers if no executable path is provided
   * @param {LaunchOptions} options - Configuration options for launching the browser
   * @returns {Promise<void>} Promise that resolves when the browser is successfully launched
   * @throws {Error} If the browser cannot be launched
   */
  async launch(options = {}) {
    this.logger.info("Launching browser with options:", options);
    const executablePath = options?.executablePath || this.browserFinder.findBrowser().executable;
    this.logger.info("Using executable path:", executablePath);
    const viewportWidth = options?.defaultViewport?.width ?? 1280;
    const viewportHeight = options?.defaultViewport?.height ?? 800;
    const puppeteerLaunchOptions = {
      executablePath,
      headless: options?.headless ?? false,
      defaultViewport: {
        width: viewportWidth,
        height: viewportHeight
      },
      args: [
        "--no-sandbox",
        "--mute-audio",
        "--disable-gpu",
        "--disable-http2",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--disable-background-timer-throttling",
        "--disable-popup-blocking",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-window-activation",
        "--disable-focus-on-load",
        "--no-default-browser-check",
        // disable default browser check
        "--disable-web-security",
        // disable CORS
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-site-isolation-trials",
        `--window-size=${viewportWidth},${viewportHeight + 90}`,
        options?.proxy ? `--proxy-server=${options.proxy}` : "",
        options?.profilePath ? `--profile-directory=${options.profilePath}` : ""
      ].filter(Boolean),
      ignoreDefaultArgs: ["--enable-automation"],
      timeout: options.timeout ?? 0,
      downloadBehavior: {
        policy: "deny"
      }
    };
    this.logger.info("Launch options:", puppeteerLaunchOptions);
    try {
      this.browser = await puppeteer.launch(puppeteerLaunchOptions);
      await this.setupPageListener();
      this.logger.success("Browser launched successfully");
    } catch (error) {
      this.logger.error("Failed to launch browser:", error);
      throw error;
    }
  }
};

// src/libs/browser/remote.ts
var puppeteer2 = __toESM(require("puppeteer-core"), 1);

// src/libs/browser-search/readability.ts
var READABILITY_SCRIPT = 'function q(t,e){if(e&&e.documentElement)t=e,e=arguments[2];else if(!t||!t.documentElement)throw new Error("First argument to Readability constructor should be a document object.");if(e=e||{},this._doc=t,this._docJSDOMParser=this._doc.firstChild.__JSDOMParser__,this._articleTitle=null,this._articleByline=null,this._articleDir=null,this._articleSiteName=null,this._attempts=[],this._debug=!!e.debug,this._maxElemsToParse=e.maxElemsToParse||this.DEFAULT_MAX_ELEMS_TO_PARSE,this._nbTopCandidates=e.nbTopCandidates||this.DEFAULT_N_TOP_CANDIDATES,this._charThreshold=e.charThreshold||this.DEFAULT_CHAR_THRESHOLD,this._classesToPreserve=this.CLASSES_TO_PRESERVE.concat(e.classesToPreserve||[]),this._keepClasses=!!e.keepClasses,this._serializer=e.serializer||function(i){return i.innerHTML},this._disableJSONLD=!!e.disableJSONLD,this._allowedVideoRegex=e.allowedVideoRegex||this.REGEXPS.videos,this._flags=this.FLAG_STRIP_UNLIKELYS|this.FLAG_WEIGHT_CLASSES|this.FLAG_CLEAN_CONDITIONALLY,this._debug){let i=function(r){if(r.nodeType==r.TEXT_NODE)return`${r.nodeName} ("${r.textContent}")`;let l=Array.from(r.attributes||[],function(a){return`${a.name}="${a.value}"`}).join(" ");return`<${r.localName} ${l}>`};this.log=function(){if(typeof console!="undefined"){let l=Array.from(arguments,a=>a&&a.nodeType==this.ELEMENT_NODE?i(a):a);l.unshift("Reader: (Readability)"),console.log.apply(console,l)}else if(typeof dump!="undefined"){var r=Array.prototype.map.call(arguments,function(l){return l&&l.nodeName?i(l):l}).join(" ");dump("Reader: (Readability) "+r+`\n`)}}}else this.log=function(){}}q.prototype={FLAG_STRIP_UNLIKELYS:1,FLAG_WEIGHT_CLASSES:2,FLAG_CLEAN_CONDITIONALLY:4,ELEMENT_NODE:1,TEXT_NODE:3,DEFAULT_MAX_ELEMS_TO_PARSE:0,DEFAULT_N_TOP_CANDIDATES:5,DEFAULT_TAGS_TO_SCORE:"section,h2,h3,h4,h5,h6,p,td,pre".toUpperCase().split(","),DEFAULT_CHAR_THRESHOLD:500,REGEXPS:{unlikelyCandidates:/-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,okMaybeItsACandidate:/and|article|body|column|content|main|shadow/i,positive:/article|body|content|entry|hentry|h-entry|main|page|pagination|post|text|blog|story/i,negative:/-ad-|hidden|^hid$| hid$| hid |^hid |banner|combx|comment|com-|contact|foot|footer|footnote|gdpr|masthead|media|meta|outbrain|promo|related|scroll|share|shoutbox|sidebar|skyscraper|sponsor|shopping|tags|tool|widget/i,extraneous:/print|archive|comment|discuss|e[\\-]?mail|share|reply|all|login|sign|single|utility/i,byline:/byline|author|dateline|writtenby|p-author/i,replaceFonts:/<(\\/?)font[^>]*>/gi,normalize:/\\s{2,}/g,videos:/\\/\\/(www\\.)?((dailymotion|youtube|youtube-nocookie|player\\.vimeo|v\\.qq)\\.com|(archive|upload\\.wikimedia)\\.org|player\\.twitch\\.tv)/i,shareElements:/(\\b|_)(share|sharedaddy)(\\b|_)/i,nextLink:/(next|weiter|continue|>([^\\|]|$)|\xBB([^\\|]|$))/i,prevLink:/(prev|earl|old|new|<|\xAB)/i,tokenize:/\\W+/g,whitespace:/^\\s*$/,hasContent:/\\S$/,hashUrl:/^#.+/,srcsetUrl:/(\\S+)(\\s+[\\d.]+[xw])?(\\s*(?:,|$))/g,b64DataUrl:/^data:\\s*([^\\s;,]+)\\s*;\\s*base64\\s*,/i,commas:/\\u002C|\\u060C|\\uFE50|\\uFE10|\\uFE11|\\u2E41|\\u2E34|\\u2E32|\\uFF0C/g,jsonLdArticleTypes:/^Article|AdvertiserContentArticle|NewsArticle|AnalysisNewsArticle|AskPublicNewsArticle|BackgroundNewsArticle|OpinionNewsArticle|ReportageNewsArticle|ReviewNewsArticle|Report|SatiricalArticle|ScholarlyArticle|MedicalScholarlyArticle|SocialMediaPosting|BlogPosting|LiveBlogPosting|DiscussionForumPosting|TechArticle|APIReference$/},UNLIKELY_ROLES:["menu","menubar","complementary","navigation","alert","alertdialog","dialog"],DIV_TO_P_ELEMS:new Set(["BLOCKQUOTE","DL","DIV","IMG","OL","P","PRE","TABLE","UL"]),ALTER_TO_DIV_EXCEPTIONS:["DIV","ARTICLE","SECTION","P"],PRESENTATIONAL_ATTRIBUTES:["align","background","bgcolor","border","cellpadding","cellspacing","frame","hspace","rules","style","valign","vspace"],DEPRECATED_SIZE_ATTRIBUTE_ELEMS:["TABLE","TH","TD","HR","PRE"],PHRASING_ELEMS:["ABBR","AUDIO","B","BDO","BR","BUTTON","CITE","CODE","DATA","DATALIST","DFN","EM","EMBED","I","IMG","INPUT","KBD","LABEL","MARK","MATH","METER","NOSCRIPT","OBJECT","OUTPUT","PROGRESS","Q","RUBY","SAMP","SCRIPT","SELECT","SMALL","SPAN","STRONG","SUB","SUP","TEXTAREA","TIME","VAR","WBR"],CLASSES_TO_PRESERVE:["page"],HTML_ESCAPE_MAP:{lt:"<",gt:">",amp:"&",quot:\'"\',apos:"\'"},_postProcessContent:function(t){this._fixRelativeUris(t),this._simplifyNestedElements(t),this._keepClasses||this._cleanClasses(t)},_removeNodes:function(t,e){if(this._docJSDOMParser&&t._isLiveNodeList)throw new Error("Do not pass live node lists to _removeNodes");for(var i=t.length-1;i>=0;i--){var r=t[i],l=r.parentNode;l&&(!e||e.call(this,r,i,t))&&l.removeChild(r)}},_replaceNodeTags:function(t,e){if(this._docJSDOMParser&&t._isLiveNodeList)throw new Error("Do not pass live node lists to _replaceNodeTags");for(let i of t)this._setNodeTag(i,e)},_forEachNode:function(t,e){Array.prototype.forEach.call(t,e,this)},_findNode:function(t,e){return Array.prototype.find.call(t,e,this)},_someNode:function(t,e){return Array.prototype.some.call(t,e,this)},_everyNode:function(t,e){return Array.prototype.every.call(t,e,this)},_concatNodeLists:function(){var t=Array.prototype.slice,e=t.call(arguments),i=e.map(function(r){return t.call(r)});return Array.prototype.concat.apply([],i)},_getAllNodesWithTag:function(t,e){return t.querySelectorAll?t.querySelectorAll(e.join(",")):[].concat.apply([],e.map(function(i){var r=t.getElementsByTagName(i);return Array.isArray(r)?r:Array.from(r)}))},_cleanClasses:function(t){var e=this._classesToPreserve,i=(t.getAttribute("class")||"").split(/\\s+/).filter(function(r){return e.indexOf(r)!=-1}).join(" ");for(i?t.setAttribute("class",i):t.removeAttribute("class"),t=t.firstElementChild;t;t=t.nextElementSibling)this._cleanClasses(t)},_fixRelativeUris:function(t){var e=this._doc.baseURI,i=this._doc.documentURI;function r(s){if(e==i&&s.charAt(0)=="#")return s;try{return new URL(s,e).href}catch(h){}return s}var l=this._getAllNodesWithTag(t,["a"]);this._forEachNode(l,function(s){var h=s.getAttribute("href");if(h)if(h.indexOf("javascript:")===0)if(s.childNodes.length===1&&s.childNodes[0].nodeType===this.TEXT_NODE){var c=this._doc.createTextNode(s.textContent);s.parentNode.replaceChild(c,s)}else{for(var n=this._doc.createElement("span");s.firstChild;)n.appendChild(s.firstChild);s.parentNode.replaceChild(n,s)}else s.setAttribute("href",r(h))});var a=this._getAllNodesWithTag(t,["img","picture","figure","video","audio","source"]);this._forEachNode(a,function(s){var h=s.getAttribute("src"),c=s.getAttribute("poster"),n=s.getAttribute("srcset");if(h&&s.setAttribute("src",r(h)),c&&s.setAttribute("poster",r(c)),n){var u=n.replace(this.REGEXPS.srcsetUrl,function(m,b,N,v){return r(b)+(N||"")+v});s.setAttribute("srcset",u)}})},_simplifyNestedElements:function(t){for(var e=t;e;){if(e.parentNode&&["DIV","SECTION"].includes(e.tagName)&&!(e.id&&e.id.startsWith("readability"))){if(this._isElementWithoutContent(e)){e=this._removeAndGetNext(e);continue}else if(this._hasSingleTagInsideElement(e,"DIV")||this._hasSingleTagInsideElement(e,"SECTION")){for(var i=e.children[0],r=0;r<e.attributes.length;r++)i.setAttribute(e.attributes[r].name,e.attributes[r].value);e.parentNode.replaceChild(i,e),e=i;continue}}e=this._getNextNode(e)}},_getArticleTitle:function(){var t=this._doc,e="",i="";try{e=i=t.title.trim(),typeof e!="string"&&(e=i=this._getInnerText(t.getElementsByTagName("title")[0]))}catch(u){}var r=!1;function l(u){return u.split(/\\s+/).length}if(/ [\\|\\-\\\\\\/>\xBB] /.test(e))r=/ [\\\\\\/>\xBB] /.test(e),e=i.replace(/(.*)[\\|\\-\\\\\\/>\xBB] .*/gi,"$1"),l(e)<3&&(e=i.replace(/[^\\|\\-\\\\\\/>\xBB]*[\\|\\-\\\\\\/>\xBB](.*)/gi,"$1"));else if(e.indexOf(": ")!==-1){var a=this._concatNodeLists(t.getElementsByTagName("h1"),t.getElementsByTagName("h2")),s=e.trim(),h=this._someNode(a,function(u){return u.textContent.trim()===s});h||(e=i.substring(i.lastIndexOf(":")+1),l(e)<3?e=i.substring(i.indexOf(":")+1):l(i.substr(0,i.indexOf(":")))>5&&(e=i))}else if(e.length>150||e.length<15){var c=t.getElementsByTagName("h1");c.length===1&&(e=this._getInnerText(c[0]))}e=e.trim().replace(this.REGEXPS.normalize," ");var n=l(e);return n<=4&&(!r||n!=l(i.replace(/[\\|\\-\\\\\\/>\xBB]+/g,""))-1)&&(e=i),e},_prepDocument:function(){var t=this._doc;this._removeNodes(this._getAllNodesWithTag(t,["style"])),t.body&&this._replaceBrs(t.body),this._replaceNodeTags(this._getAllNodesWithTag(t,["font"]),"SPAN")},_nextNode:function(t){for(var e=t;e&&e.nodeType!=this.ELEMENT_NODE&&this.REGEXPS.whitespace.test(e.textContent);)e=e.nextSibling;return e},_replaceBrs:function(t){this._forEachNode(this._getAllNodesWithTag(t,["br"]),function(e){for(var i=e.nextSibling,r=!1;(i=this._nextNode(i))&&i.tagName=="BR";){r=!0;var l=i.nextSibling;i.parentNode.removeChild(i),i=l}if(r){var a=this._doc.createElement("p");for(e.parentNode.replaceChild(a,e),i=a.nextSibling;i;){if(i.tagName=="BR"){var s=this._nextNode(i.nextSibling);if(s&&s.tagName=="BR")break}if(!this._isPhrasingContent(i))break;var h=i.nextSibling;a.appendChild(i),i=h}for(;a.lastChild&&this._isWhitespace(a.lastChild);)a.removeChild(a.lastChild);a.parentNode.tagName==="P"&&this._setNodeTag(a.parentNode,"DIV")}})},_setNodeTag:function(t,e){if(this.log("_setNodeTag",t,e),this._docJSDOMParser)return t.localName=e.toLowerCase(),t.tagName=e.toUpperCase(),t;for(var i=t.ownerDocument.createElement(e);t.firstChild;)i.appendChild(t.firstChild);t.parentNode.replaceChild(i,t),t.readability&&(i.readability=t.readability);for(var r=0;r<t.attributes.length;r++)try{i.setAttribute(t.attributes[r].name,t.attributes[r].value)}catch(l){}return i},_prepArticle:function(t){this._cleanStyles(t),this._markDataTables(t),this._fixLazyImages(t),this._cleanConditionally(t,"form"),this._cleanConditionally(t,"fieldset"),this._clean(t,"object"),this._clean(t,"embed"),this._clean(t,"footer"),this._clean(t,"link"),this._clean(t,"aside");var e=this.DEFAULT_CHAR_THRESHOLD;this._forEachNode(t.children,function(i){this._cleanMatchedNodes(i,function(r,l){return this.REGEXPS.shareElements.test(l)&&r.textContent.length<e})}),this._clean(t,"iframe"),this._clean(t,"input"),this._clean(t,"textarea"),this._clean(t,"select"),this._clean(t,"button"),this._cleanHeaders(t),this._cleanConditionally(t,"table"),this._cleanConditionally(t,"ul"),this._cleanConditionally(t,"div"),this._replaceNodeTags(this._getAllNodesWithTag(t,["h1"]),"h2"),this._removeNodes(this._getAllNodesWithTag(t,["p"]),function(i){var r=i.getElementsByTagName("img").length,l=i.getElementsByTagName("embed").length,a=i.getElementsByTagName("object").length,s=i.getElementsByTagName("iframe").length,h=r+l+a+s;return h===0&&!this._getInnerText(i,!1)}),this._forEachNode(this._getAllNodesWithTag(t,["br"]),function(i){var r=this._nextNode(i.nextSibling);r&&r.tagName=="P"&&i.parentNode.removeChild(i)}),this._forEachNode(this._getAllNodesWithTag(t,["table"]),function(i){var r=this._hasSingleTagInsideElement(i,"TBODY")?i.firstElementChild:i;if(this._hasSingleTagInsideElement(r,"TR")){var l=r.firstElementChild;if(this._hasSingleTagInsideElement(l,"TD")){var a=l.firstElementChild;a=this._setNodeTag(a,this._everyNode(a.childNodes,this._isPhrasingContent)?"P":"DIV"),i.parentNode.replaceChild(a,i)}}})},_initializeNode:function(t){switch(t.readability={contentScore:0},t.tagName){case"DIV":t.readability.contentScore+=5;break;case"PRE":case"TD":case"BLOCKQUOTE":t.readability.contentScore+=3;break;case"ADDRESS":case"OL":case"UL":case"DL":case"DD":case"DT":case"LI":case"FORM":t.readability.contentScore-=3;break;case"H1":case"H2":case"H3":case"H4":case"H5":case"H6":case"TH":t.readability.contentScore-=5;break}t.readability.contentScore+=this._getClassWeight(t)},_removeAndGetNext:function(t){var e=this._getNextNode(t,!0);return t.parentNode.removeChild(t),e},_getNextNode:function(t,e){if(!e&&t.firstElementChild)return t.firstElementChild;if(t.nextElementSibling)return t.nextElementSibling;do t=t.parentNode;while(t&&!t.nextElementSibling);return t&&t.nextElementSibling},_textSimilarity:function(t,e){var i=t.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean),r=e.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);if(!i.length||!r.length)return 0;var l=r.filter(s=>!i.includes(s)),a=l.join(" ").length/r.join(" ").length;return 1-a},_checkByline:function(t,e){if(this._articleByline)return!1;if(t.getAttribute!==void 0)var i=t.getAttribute("rel"),r=t.getAttribute("itemprop");return(i==="author"||r&&r.indexOf("author")!==-1||this.REGEXPS.byline.test(e))&&this._isValidByline(t.textContent)?(this._articleByline=t.textContent.trim(),!0):!1},_getNodeAncestors:function(t,e){e=e||0;for(var i=0,r=[];t.parentNode&&(r.push(t.parentNode),!(e&&++i===e));)t=t.parentNode;return r},_grabArticle:function(t){this.log("**** grabArticle ****");var e=this._doc,i=t!==null;if(t=t||this._doc.body,!t)return this.log("No body found in document. Abort."),null;for(var r=t.innerHTML;;){this.log("Starting grabArticle loop");var l=this._flagIsActive(this.FLAG_STRIP_UNLIKELYS),a=[],s=this._doc.documentElement;let J=!0;for(;s;){s.tagName==="HTML"&&(this._articleLang=s.getAttribute("lang"));var h=s.className+" "+s.id;if(!this._isProbablyVisible(s)){this.log("Removing hidden node - "+h),s=this._removeAndGetNext(s);continue}if(s.getAttribute("aria-modal")=="true"&&s.getAttribute("role")=="dialog"){s=this._removeAndGetNext(s);continue}if(this._checkByline(s,h)){s=this._removeAndGetNext(s);continue}if(J&&this._headerDuplicatesTitle(s)){this.log("Removing header: ",s.textContent.trim(),this._articleTitle.trim()),J=!1,s=this._removeAndGetNext(s);continue}if(l){if(this.REGEXPS.unlikelyCandidates.test(h)&&!this.REGEXPS.okMaybeItsACandidate.test(h)&&!this._hasAncestorTag(s,"table")&&!this._hasAncestorTag(s,"code")&&s.tagName!=="BODY"&&s.tagName!=="A"){this.log("Removing unlikely candidate - "+h),s=this._removeAndGetNext(s);continue}if(this.UNLIKELY_ROLES.includes(s.getAttribute("role"))){this.log("Removing content with role "+s.getAttribute("role")+" - "+h),s=this._removeAndGetNext(s);continue}}if((s.tagName==="DIV"||s.tagName==="SECTION"||s.tagName==="HEADER"||s.tagName==="H1"||s.tagName==="H2"||s.tagName==="H3"||s.tagName==="H4"||s.tagName==="H5"||s.tagName==="H6")&&this._isElementWithoutContent(s)){s=this._removeAndGetNext(s);continue}if(this.DEFAULT_TAGS_TO_SCORE.indexOf(s.tagName)!==-1&&a.push(s),s.tagName==="DIV"){for(var c=null,n=s.firstChild;n;){var u=n.nextSibling;if(this._isPhrasingContent(n))c!==null?c.appendChild(n):this._isWhitespace(n)||(c=e.createElement("p"),s.replaceChild(c,n),c.appendChild(n));else if(c!==null){for(;c.lastChild&&this._isWhitespace(c.lastChild);)c.removeChild(c.lastChild);c=null}n=u}if(this._hasSingleTagInsideElement(s,"P")&&this._getLinkDensity(s)<.25){var m=s.children[0];s.parentNode.replaceChild(m,s),s=m,a.push(s)}else this._hasChildBlockElement(s)||(s=this._setNodeTag(s,"P"),a.push(s))}s=this._getNextNode(s)}var b=[];this._forEachNode(a,function(A){if(!(!A.parentNode||typeof A.parentNode.tagName=="undefined")){var T=this._getInnerText(A);if(!(T.length<25)){var K=this._getNodeAncestors(A,5);if(K.length!==0){var C=0;C+=1,C+=T.split(this.REGEXPS.commas).length,C+=Math.min(Math.floor(T.length/100),3),this._forEachNode(K,function(S,F){if(!(!S.tagName||!S.parentNode||typeof S.parentNode.tagName=="undefined")){if(typeof S.readability=="undefined"&&(this._initializeNode(S),b.push(S)),F===0)var X=1;else F===1?X=2:X=F*3;S.readability.contentScore+=C/X}})}}}});for(var N=[],v=0,y=b.length;v<y;v+=1){var E=b[v],d=E.readability.contentScore*(1-this._getLinkDensity(E));E.readability.contentScore=d,this.log("Candidate:",E,"with score "+d);for(var p=0;p<this._nbTopCandidates;p++){var x=N[p];if(!x||d>x.readability.contentScore){N.splice(p,0,E),N.length>this._nbTopCandidates&&N.pop();break}}}var o=N[0]||null,L=!1,g;if(o===null||o.tagName==="BODY"){for(o=e.createElement("DIV"),L=!0;t.firstChild;)this.log("Moving child out:",t.firstChild),o.appendChild(t.firstChild);t.appendChild(o),this._initializeNode(o)}else if(o){for(var I=[],P=1;P<N.length;P++)N[P].readability.contentScore/o.readability.contentScore>=.75&&I.push(this._getNodeAncestors(N[P]));var O=3;if(I.length>=O)for(g=o.parentNode;g.tagName!=="BODY";){for(var G=0,H=0;H<I.length&&G<O;H++)G+=Number(I[H].includes(g));if(G>=O){o=g;break}g=g.parentNode}o.readability||this._initializeNode(o),g=o.parentNode;for(var M=o.readability.contentScore,Q=M/3;g.tagName!=="BODY";){if(!g.readability){g=g.parentNode;continue}var V=g.readability.contentScore;if(V<Q)break;if(V>M){o=g;break}M=g.readability.contentScore,g=g.parentNode}for(g=o.parentNode;g.tagName!="BODY"&&g.children.length==1;)o=g,g=o.parentNode;o.readability||this._initializeNode(o)}var _=e.createElement("DIV");i&&(_.id="readability-content");var Z=Math.max(10,o.readability.contentScore*.2);g=o.parentNode;for(var U=g.children,w=0,j=U.length;w<j;w++){var f=U[w],R=!1;if(this.log("Looking at sibling node:",f,f.readability?"with score "+f.readability.contentScore:""),this.log("Sibling has score",f.readability?f.readability.contentScore:"Unknown"),f===o)R=!0;else{var $=0;if(f.className===o.className&&o.className!==""&&($+=o.readability.contentScore*.2),f.readability&&f.readability.contentScore+$>=Z)R=!0;else if(f.nodeName==="P"){var Y=this._getLinkDensity(f),z=this._getInnerText(f),k=z.length;(k>80&&Y<.25||k<80&&k>0&&Y===0&&z.search(/\\.( |$)/)!==-1)&&(R=!0)}}R&&(this.log("Appending node:",f),this.ALTER_TO_DIV_EXCEPTIONS.indexOf(f.nodeName)===-1&&(this.log("Altering sibling:",f,"to div."),f=this._setNodeTag(f,"DIV")),_.appendChild(f),U=g.children,w-=1,j-=1)}if(this._debug&&this.log("Article content pre-prep: "+_.innerHTML),this._prepArticle(_),this._debug&&this.log("Article content post-prep: "+_.innerHTML),L)o.id="readability-page-1",o.className="page";else{var B=e.createElement("DIV");for(B.id="readability-page-1",B.className="page";_.firstChild;)B.appendChild(_.firstChild);_.appendChild(B)}this._debug&&this.log("Article content after paging: "+_.innerHTML);var W=!0,D=this._getInnerText(_,!0).length;if(D<this._charThreshold)if(W=!1,t.innerHTML=r,this._flagIsActive(this.FLAG_STRIP_UNLIKELYS))this._removeFlag(this.FLAG_STRIP_UNLIKELYS),this._attempts.push({articleContent:_,textLength:D});else if(this._flagIsActive(this.FLAG_WEIGHT_CLASSES))this._removeFlag(this.FLAG_WEIGHT_CLASSES),this._attempts.push({articleContent:_,textLength:D});else if(this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY))this._removeFlag(this.FLAG_CLEAN_CONDITIONALLY),this._attempts.push({articleContent:_,textLength:D});else{if(this._attempts.push({articleContent:_,textLength:D}),this._attempts.sort(function(A,T){return T.textLength-A.textLength}),!this._attempts[0].textLength)return null;_=this._attempts[0].articleContent,W=!0}if(W){var tt=[g,o].concat(this._getNodeAncestors(g));return this._someNode(tt,function(A){if(!A.tagName)return!1;var T=A.getAttribute("dir");return T?(this._articleDir=T,!0):!1}),_}}},_isValidByline:function(t){return typeof t=="string"||t instanceof String?(t=t.trim(),t.length>0&&t.length<100):!1},_unescapeHtmlEntities:function(t){if(!t)return t;var e=this.HTML_ESCAPE_MAP;return t.replace(/&(quot|amp|apos|lt|gt);/g,function(i,r){return e[r]}).replace(/&#(?:x([0-9a-z]{1,4})|([0-9]{1,4}));/gi,function(i,r,l){var a=parseInt(r||l,r?16:10);return String.fromCharCode(a)})},_getJSONLD:function(t){var e=this._getAllNodesWithTag(t,["script"]),i;return this._forEachNode(e,function(r){if(!i&&r.getAttribute("type")==="application/ld+json")try{var l=r.textContent.replace(/^\\s*<!\\[CDATA\\[|\\]\\]>\\s*$/g,""),a=JSON.parse(l);if(!a["@context"]||!a["@context"].match(/^https?\\:\\/\\/schema\\.org$/)||(!a["@type"]&&Array.isArray(a["@graph"])&&(a=a["@graph"].find(function(n){return(n["@type"]||"").match(this.REGEXPS.jsonLdArticleTypes)})),!a||!a["@type"]||!a["@type"].match(this.REGEXPS.jsonLdArticleTypes)))return;if(i={},typeof a.name=="string"&&typeof a.headline=="string"&&a.name!==a.headline){var s=this._getArticleTitle(),h=this._textSimilarity(a.name,s)>.75,c=this._textSimilarity(a.headline,s)>.75;c&&!h?i.title=a.headline:i.title=a.name}else typeof a.name=="string"?i.title=a.name.trim():typeof a.headline=="string"&&(i.title=a.headline.trim());a.author&&(typeof a.author.name=="string"?i.byline=a.author.name.trim():Array.isArray(a.author)&&a.author[0]&&typeof a.author[0].name=="string"&&(i.byline=a.author.filter(function(n){return n&&typeof n.name=="string"}).map(function(n){return n.name.trim()}).join(", "))),typeof a.description=="string"&&(i.excerpt=a.description.trim()),a.publisher&&typeof a.publisher.name=="string"&&(i.siteName=a.publisher.name.trim()),typeof a.datePublished=="string"&&(i.datePublished=a.datePublished.trim());return}catch(n){this.log(n.message)}}),i||{}},_getArticleMetadata:function(t){var e={},i={},r=this._doc.getElementsByTagName("meta"),l=/\\s*(article|dc|dcterm|og|twitter)\\s*:\\s*(author|creator|description|published_time|title|site_name)\\s*/gi,a=/^\\s*(?:(dc|dcterm|og|twitter|weibo:(article|webpage))\\s*[\\.:]\\s*)?(author|creator|description|title|site_name)\\s*$/i;return this._forEachNode(r,function(s){var h=s.getAttribute("name"),c=s.getAttribute("property"),n=s.getAttribute("content");if(n){var u=null,m=null;c&&(u=c.match(l),u&&(m=u[0].toLowerCase().replace(/\\s/g,""),i[m]=n.trim())),!u&&h&&a.test(h)&&(m=h,n&&(m=m.toLowerCase().replace(/\\s/g,"").replace(/\\./g,":"),i[m]=n.trim()))}}),e.title=t.title||i["dc:title"]||i["dcterm:title"]||i["og:title"]||i["weibo:article:title"]||i["weibo:webpage:title"]||i.title||i["twitter:title"],e.title||(e.title=this._getArticleTitle()),e.byline=t.byline||i["dc:creator"]||i["dcterm:creator"]||i.author,e.excerpt=t.excerpt||i["dc:description"]||i["dcterm:description"]||i["og:description"]||i["weibo:article:description"]||i["weibo:webpage:description"]||i.description||i["twitter:description"],e.siteName=t.siteName||i["og:site_name"],e.publishedTime=t.datePublished||i["article:published_time"]||null,e.title=this._unescapeHtmlEntities(e.title),e.byline=this._unescapeHtmlEntities(e.byline),e.excerpt=this._unescapeHtmlEntities(e.excerpt),e.siteName=this._unescapeHtmlEntities(e.siteName),e.publishedTime=this._unescapeHtmlEntities(e.publishedTime),e},_isSingleImage:function(t){return t.tagName==="IMG"?!0:t.children.length!==1||t.textContent.trim()!==""?!1:this._isSingleImage(t.children[0])},_unwrapNoscriptImages:function(t){var e=Array.from(t.getElementsByTagName("img"));this._forEachNode(e,function(r){for(var l=0;l<r.attributes.length;l++){var a=r.attributes[l];switch(a.name){case"src":case"srcset":case"data-src":case"data-srcset":return}if(/\\.(jpg|jpeg|png|webp)/i.test(a.value))return}r.parentNode.removeChild(r)});var i=Array.from(t.getElementsByTagName("noscript"));this._forEachNode(i,function(r){var l=t.createElement("div");if(l.innerHTML=r.innerHTML,!!this._isSingleImage(l)){var a=r.previousElementSibling;if(a&&this._isSingleImage(a)){var s=a;s.tagName!=="IMG"&&(s=a.getElementsByTagName("img")[0]);for(var h=l.getElementsByTagName("img")[0],c=0;c<s.attributes.length;c++){var n=s.attributes[c];if(n.value!==""&&(n.name==="src"||n.name==="srcset"||/\\.(jpg|jpeg|png|webp)/i.test(n.value))){if(h.getAttribute(n.name)===n.value)continue;var u=n.name;h.hasAttribute(u)&&(u="data-old-"+u),h.setAttribute(u,n.value)}}r.parentNode.replaceChild(l.firstElementChild,a)}}})},_removeScripts:function(t){this._removeNodes(this._getAllNodesWithTag(t,["script","noscript"]))},_hasSingleTagInsideElement:function(t,e){return t.children.length!=1||t.children[0].tagName!==e?!1:!this._someNode(t.childNodes,function(i){return i.nodeType===this.TEXT_NODE&&this.REGEXPS.hasContent.test(i.textContent)})},_isElementWithoutContent:function(t){return t.nodeType===this.ELEMENT_NODE&&t.textContent.trim().length==0&&(t.children.length==0||t.children.length==t.getElementsByTagName("br").length+t.getElementsByTagName("hr").length)},_hasChildBlockElement:function(t){return this._someNode(t.childNodes,function(e){return this.DIV_TO_P_ELEMS.has(e.tagName)||this._hasChildBlockElement(e)})},_isPhrasingContent:function(t){return t.nodeType===this.TEXT_NODE||this.PHRASING_ELEMS.indexOf(t.tagName)!==-1||(t.tagName==="A"||t.tagName==="DEL"||t.tagName==="INS")&&this._everyNode(t.childNodes,this._isPhrasingContent)},_isWhitespace:function(t){return t.nodeType===this.TEXT_NODE&&t.textContent.trim().length===0||t.nodeType===this.ELEMENT_NODE&&t.tagName==="BR"},_getInnerText:function(t,e){e=typeof e=="undefined"?!0:e;var i=t.textContent.trim();return e?i.replace(this.REGEXPS.normalize," "):i},_getCharCount:function(t,e){return e=e||",",this._getInnerText(t).split(e).length-1},_cleanStyles:function(t){if(!(!t||t.tagName.toLowerCase()==="svg")){for(var e=0;e<this.PRESENTATIONAL_ATTRIBUTES.length;e++)t.removeAttribute(this.PRESENTATIONAL_ATTRIBUTES[e]);this.DEPRECATED_SIZE_ATTRIBUTE_ELEMS.indexOf(t.tagName)!==-1&&(t.removeAttribute("width"),t.removeAttribute("height"));for(var i=t.firstElementChild;i!==null;)this._cleanStyles(i),i=i.nextElementSibling}},_getLinkDensity:function(t){var e=this._getInnerText(t).length;if(e===0)return 0;var i=0;return this._forEachNode(t.getElementsByTagName("a"),function(r){var l=r.getAttribute("href"),a=l&&this.REGEXPS.hashUrl.test(l)?.3:1;i+=this._getInnerText(r).length*a}),i/e},_getClassWeight:function(t){if(!this._flagIsActive(this.FLAG_WEIGHT_CLASSES))return 0;var e=0;return typeof t.className=="string"&&t.className!==""&&(this.REGEXPS.negative.test(t.className)&&(e-=25),this.REGEXPS.positive.test(t.className)&&(e+=25)),typeof t.id=="string"&&t.id!==""&&(this.REGEXPS.negative.test(t.id)&&(e-=25),this.REGEXPS.positive.test(t.id)&&(e+=25)),e},_clean:function(t,e){var i=["object","embed","iframe"].indexOf(e)!==-1;this._removeNodes(this._getAllNodesWithTag(t,[e]),function(r){if(i){for(var l=0;l<r.attributes.length;l++)if(this._allowedVideoRegex.test(r.attributes[l].value))return!1;if(r.tagName==="object"&&this._allowedVideoRegex.test(r.innerHTML))return!1}return!0})},_hasAncestorTag:function(t,e,i,r){i=i||3,e=e.toUpperCase();for(var l=0;t.parentNode;){if(i>0&&l>i)return!1;if(t.parentNode.tagName===e&&(!r||r(t.parentNode)))return!0;t=t.parentNode,l++}return!1},_getRowAndColumnCount:function(t){for(var e=0,i=0,r=t.getElementsByTagName("tr"),l=0;l<r.length;l++){var a=r[l].getAttribute("rowspan")||0;a&&(a=parseInt(a,10)),e+=a||1;for(var s=0,h=r[l].getElementsByTagName("td"),c=0;c<h.length;c++){var n=h[c].getAttribute("colspan")||0;n&&(n=parseInt(n,10)),s+=n||1}i=Math.max(i,s)}return{rows:e,columns:i}},_markDataTables:function(t){for(var e=t.getElementsByTagName("table"),i=0;i<e.length;i++){var r=e[i],l=r.getAttribute("role");if(l=="presentation"){r._readabilityDataTable=!1;continue}var a=r.getAttribute("datatable");if(a=="0"){r._readabilityDataTable=!1;continue}var s=r.getAttribute("summary");if(s){r._readabilityDataTable=!0;continue}var h=r.getElementsByTagName("caption")[0];if(h&&h.childNodes.length>0){r._readabilityDataTable=!0;continue}var c=["col","colgroup","tfoot","thead","th"],n=function(m){return!!r.getElementsByTagName(m)[0]};if(c.some(n)){this.log("Data table because found data-y descendant"),r._readabilityDataTable=!0;continue}if(r.getElementsByTagName("table")[0]){r._readabilityDataTable=!1;continue}var u=this._getRowAndColumnCount(r);if(u.rows>=10||u.columns>4){r._readabilityDataTable=!0;continue}r._readabilityDataTable=u.rows*u.columns>10}},_fixLazyImages:function(t){this._forEachNode(this._getAllNodesWithTag(t,["img","picture","figure"]),function(e){if(e.src&&this.REGEXPS.b64DataUrl.test(e.src)){var i=this.REGEXPS.b64DataUrl.exec(e.src);if(i[1]==="image/svg+xml")return;for(var r=!1,l=0;l<e.attributes.length;l++){var a=e.attributes[l];if(a.name!=="src"&&/\\.(jpg|jpeg|png|webp)/i.test(a.value)){r=!0;break}}if(r){var s=e.src.search(/base64\\s*/i)+7,h=e.src.length-s;h<133&&e.removeAttribute("src")}}if(!((e.src||e.srcset&&e.srcset!="null")&&e.className.toLowerCase().indexOf("lazy")===-1)){for(var c=0;c<e.attributes.length;c++)if(a=e.attributes[c],!(a.name==="src"||a.name==="srcset"||a.name==="alt")){var n=null;if(/\\.(jpg|jpeg|png|webp)\\s+\\d/.test(a.value)?n="srcset":/^\\s*\\S+\\.(jpg|jpeg|png|webp)\\S*\\s*$/.test(a.value)&&(n="src"),n){if(e.tagName==="IMG"||e.tagName==="PICTURE")e.setAttribute(n,a.value);else if(e.tagName==="FIGURE"&&!this._getAllNodesWithTag(e,["img","picture"]).length){var u=this._doc.createElement("img");u.setAttribute(n,a.value),e.appendChild(u)}}}}})},_getTextDensity:function(t,e){var i=this._getInnerText(t,!0).length;if(i===0)return 0;var r=0,l=this._getAllNodesWithTag(t,e);return this._forEachNode(l,a=>r+=this._getInnerText(a,!0).length),r/i},_cleanConditionally:function(t,e){this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)&&this._removeNodes(this._getAllNodesWithTag(t,[e]),function(i){var r=function(g){return g._readabilityDataTable},l=e==="ul"||e==="ol";if(!l){var a=0,s=this._getAllNodesWithTag(i,["ul","ol"]);this._forEachNode(s,g=>a+=this._getInnerText(g).length),l=a/this._getInnerText(i).length>.9}if(e==="table"&&r(i)||this._hasAncestorTag(i,"table",-1,r)||this._hasAncestorTag(i,"code"))return!1;var h=this._getClassWeight(i);this.log("Cleaning Conditionally",i);var c=0;if(h+c<0)return!0;if(this._getCharCount(i,",")<10){for(var n=i.getElementsByTagName("p").length,u=i.getElementsByTagName("img").length,m=i.getElementsByTagName("li").length-100,b=i.getElementsByTagName("input").length,N=this._getTextDensity(i,["h1","h2","h3","h4","h5","h6"]),v=0,y=this._getAllNodesWithTag(i,["object","embed","iframe"]),E=0;E<y.length;E++){for(var d=0;d<y[E].attributes.length;d++)if(this._allowedVideoRegex.test(y[E].attributes[d].value))return!1;if(y[E].tagName==="object"&&this._allowedVideoRegex.test(y[E].innerHTML))return!1;v++}var p=this._getLinkDensity(i),x=this._getInnerText(i).length,o=u>1&&n/u<.5&&!this._hasAncestorTag(i,"figure")||!l&&m>n||b>Math.floor(n/3)||!l&&N<.9&&x<25&&(u===0||u>2)&&!this._hasAncestorTag(i,"figure")||!l&&h<25&&p>.2||h>=25&&p>.5||v===1&&x<75||v>1;if(l&&o){for(var L=0;L<i.children.length;L++)if(i.children[L].children.length>1)return o;let g=i.getElementsByTagName("li").length;if(u==g)return!1}return o}return!1})},_cleanMatchedNodes:function(t,e){for(var i=this._getNextNode(t,!0),r=this._getNextNode(t);r&&r!=i;)e.call(this,r,r.className+" "+r.id)?r=this._removeAndGetNext(r):r=this._getNextNode(r)},_cleanHeaders:function(t){let e=this._getAllNodesWithTag(t,["h1","h2"]);this._removeNodes(e,function(i){let r=this._getClassWeight(i)<0;return r&&this.log("Removing header with low class weight:",i),r})},_headerDuplicatesTitle:function(t){if(t.tagName!="H1"&&t.tagName!="H2")return!1;var e=this._getInnerText(t,!1);return this.log("Evaluating similarity of header:",e,this._articleTitle),this._textSimilarity(this._articleTitle,e)>.75},_flagIsActive:function(t){return(this._flags&t)>0},_removeFlag:function(t){this._flags=this._flags&~t},_isProbablyVisible:function(t){return(!t.style||t.style.display!="none")&&(!t.style||t.style.visibility!="hidden")&&!t.hasAttribute("hidden")&&(!t.hasAttribute("aria-hidden")||t.getAttribute("aria-hidden")!="true"||t.className&&t.className.indexOf&&t.className.indexOf("fallback-image")!==-1)},parse:function(){if(this._maxElemsToParse>0){var t=this._doc.getElementsByTagName("*").length;if(t>this._maxElemsToParse)throw new Error("Aborting parsing document; "+t+" elements found")}this._unwrapNoscriptImages(this._doc);var e=this._disableJSONLD?{}:this._getJSONLD(this._doc);this._removeScripts(this._doc),this._prepDocument();var i=this._getArticleMetadata(e);this._articleTitle=i.title;var r=this._grabArticle();if(!r)return null;if(this.log("Grabbed: "+r.innerHTML),this._postProcessContent(r),!i.excerpt){var l=r.getElementsByTagName("p");l.length>0&&(i.excerpt=l[0].textContent.trim())}var a=r.textContent;return{title:this._articleTitle,byline:i.byline||this._articleByline,dir:this._articleDir,lang:this._articleLang,content:this._serializer(r),textContent:a,length:a.length,excerpt:i.excerpt,siteName:i.siteName||this._articleSiteName,publishedTime:i.publishedTime}}};typeof module=="object"&&(module.exports=q);\n';

// src/libs/browser-search/search.ts
var import_logger4 = require("@agent-infra/logger");

// src/libs/browser-search/utils.ts
var import_turndown = __toESM(require("turndown"), 1);
var import_turndown_plugin_gfm = require("turndown-plugin-gfm");
var import_logger3 = require("@agent-infra/logger");
var import_user_agents = __toESM(require("user-agents"), 1);
var parseUrl = (url2) => {
  try {
    return new URL(url2);
  } catch {
    return null;
  }
};
var shouldSkipDomain = (url2) => {
  const parsed = parseUrl(url2);
  if (!parsed) return true;
  const { hostname } = parsed;
  return [
    "reddit.com",
    "www.reddit.com",
    "x.com",
    "twitter.com",
    "www.twitter.com",
    "youtube.com",
    "www.youtube.com"
  ].includes(hostname);
};
async function applyStealthScripts(page) {
  const userAgent = new import_user_agents.default({
    deviceCategory: "desktop"
  }).toString();
  await page.setBypassCSP(true);
  await page.setUserAgent(userAgent);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => void 0
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"]
    });
    Object.defineProperty(navigator, "plugins", {
      get: () => [{}, {}, {}, {}, {}]
    });
    Object.defineProperty(navigator, "headless", {
      get: () => false
    });
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => parameters.name === "notifications" ? Promise.resolve({
      state: Notification.permission
    }) : originalQuery(parameters);
  });
}
async function interceptRequest(page) {
  await applyStealthScripts(page);
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (resourceType !== "document") {
      return request.abort();
    }
    if (request.isNavigationRequest()) {
      return request.continue();
    }
    return request.abort();
  });
}
function extractPageInformation(window2, readabilityScript) {
  const Readability = new Function(
    "module",
    `${readabilityScript}
return module.exports`
  )({});
  const document2 = window2.document;
  document2.querySelectorAll(
    "script,noscript,style,link,svg,img,video,iframe,canvas,.reflist"
  ).forEach((el) => el.remove());
  const article = new Readability(document2).parse();
  const content = article?.content || "";
  const title = document2.title;
  return {
    content,
    title: article?.title || title
  };
}
function toMarkdown(html, options = {}) {
  if (!html) return "";
  try {
    const {
      codeBlockStyle = "fenced",
      headingStyle = "atx",
      emDelimiter = "*",
      strongDelimiter = "**",
      gfmExtension = true
    } = options;
    const turndown = new import_turndown.default({
      codeBlockStyle,
      headingStyle,
      emDelimiter,
      strongDelimiter
    });
    if (gfmExtension) {
      turndown.use(import_turndown_plugin_gfm.gfm);
    }
    return turndown.turndown(html);
  } catch (error) {
    import_logger3.defaultLogger.error("Error converting HTML to Markdown:", error);
    return html;
  }
}

// src/libs/browser-search/queue.ts
var PromiseQueue = class {
  queue = [];
  concurrency;
  running = 0;
  results = [];
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }
  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      this.run();
    });
  }
  async run() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    this.running++;
    const task = this.queue.shift();
    try {
      const result = await task();
      this.results.push(result);
    } catch (error) {
    } finally {
      this.running--;
      this.run();
    }
  }
  async waitAll() {
    while (this.running > 0 || this.queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return this.results;
  }
};

// src/libs/browser-search/engines/bing.ts
var BingSearchEngine = class {
  /**
   * Generates a Bing search URL based on the provided query and options.
   *
   * @param query - The search query string
   * @param options - Search configuration options
   * @param options.count - Number of search results to request (default: 10)
   * @param options.excludeDomains - Array of domain names to exclude from search results
   * @returns Formatted Bing search URL as a string
   */
  getSearchUrl(query, options) {
    const searchParams = new URLSearchParams({
      q: `${options.excludeDomains && options.excludeDomains.length > 0 ? `${options.excludeDomains.map((domain) => `-site:${domain}`).join(" ")} ` : ""}${query}`,
      count: `${options.count || 10}`
    });
    return `https://www.bing.com/search?${searchParams.toString()}`;
  }
  /**
   * Extracts search results from a Bing search page.
   *
   * @param window - The browser window object containing the loaded Bing search page
   * @returns Array of search results extracted from the page
   */
  extractSearchResults(window2) {
    const links = [];
    const document2 = window2.document;
    const isValidUrl = (url2) => {
      try {
        new URL(url2);
        return true;
      } catch (error) {
        return false;
      }
    };
    const extractSnippet = (element) => {
      const clone = element.cloneNode(true);
      const titleElements = clone.querySelectorAll("h2");
      titleElements.forEach((el) => el.remove());
      const citeElements = clone.querySelectorAll(".b_attribution");
      citeElements.forEach((el) => el.remove());
      const scriptElements = clone.querySelectorAll("script, style");
      scriptElements.forEach((el) => el.remove());
      const text = Array.from(clone.querySelectorAll("*")).filter((node) => node.textContent?.trim()).map((node) => node.textContent?.trim()).filter(Boolean).reduce((acc, curr) => {
        if (!acc.some(
          (text2) => text2.includes(curr) || curr.includes(text2)
        )) {
          acc.push(curr);
        }
        return acc;
      }, []).join(" ").trim().replace(/\s+/g, " ");
      return text;
    };
    try {
      const elements = document2.querySelectorAll(".b_algo");
      elements.forEach((element) => {
        const titleEl = element.querySelector("h2");
        const urlEl = element.querySelector("h2 a");
        const url2 = urlEl?.getAttribute("href");
        const snippet = extractSnippet(element);
        if (!url2 || !isValidUrl(url2)) return;
        const item = {
          title: titleEl?.textContent || "",
          snippet,
          url: url2,
          content: ""
        };
        if (!item.title || !item.url) return;
        links.push(item);
      });
    } catch (error) {
      console.error("Error extracting search results from Bing:", error);
      throw error;
    }
    return links;
  }
  /**
  * Waits for Bing search results to load completely.
  *
  * @param page - The Puppeteer page object
  * @returns Promise that resolves when search results are loaded
  */
  async waitForSearchResults(page, timeout) {
    await page.waitForSelector("#b_results", {
      timeout: timeout ?? 1e4
    });
  }
};

// src/libs/browser-search/engines/baidu.ts
var BaiduSearchEngine = class {
  /**
   * Generates a Baidu search URL based on the provided query and options.
   *
   * @param query - The search query string
   * @param options - Search configuration options
   * @param options.count - Number of search results to request (default: 10)
   * @param options.excludeDomains - Array of domain names to exclude from search results
   * @returns Formatted Baidu search URL as a string
   */
  getSearchUrl(query, options) {
    const excludeDomainsQuery = options.excludeDomains && options.excludeDomains.length > 0 ? options.excludeDomains.map((domain) => `-site:${domain}`).join(" ") : "";
    const searchParams = new URLSearchParams({
      wd: excludeDomainsQuery ? `${excludeDomainsQuery} ${query}` : query,
      rn: `${options.count || 10}`
      // rn is the parameter for result count
    });
    return `https://www.baidu.com/s?${searchParams.toString()}`;
  }
  /**
   * Extracts search results from a Baidu search page.
   *
   * @param window - The browser window object containing the loaded Baidu search page
   * @returns Array of search results extracted from the page
   */
  extractSearchResults(window2) {
    const links = [];
    const document2 = window2.document;
    try {
      const elements = document2.querySelectorAll(".result");
      elements.forEach((element) => {
        const titleEl = element.querySelector(".t a");
        const url2 = titleEl?.getAttribute("href");
        const snippetEl = element.querySelector(".c-span-last .content-right_2s-H4");
        if (!url2) return;
        const item = {
          title: titleEl?.textContent || "",
          url: url2,
          // Note: Baidu uses redirects, we'll need to follow them
          snippet: snippetEl?.textContent || "",
          content: ""
        };
        if (!item.title || !item.url) return;
        links.push(item);
      });
    } catch (error) {
      console.error("Error extracting search results from Baidu:", error);
    }
    return links;
  }
  /**
  * Waits for Bing search results to load completely.
  *
  * @param page - The Puppeteer page object
  * @returns Promise that resolves when search results are loaded
  */
  async waitForSearchResults(page, timeout) {
    await page.waitForSelector("#page", {
      timeout: timeout ?? 1e4
    });
  }
};

// src/libs/browser-search/engines/sogou.ts
var SogouSearchEngine = class {
  /**
   * Generates a Sogou search URL based on the provided query and options.
   *
   * @param query - The search query string
   * @param options - Search configuration options
   * @param options.count - Number of search results to request (default: 10)
   * @param options.excludeDomains - Array of domain names to exclude from search results
   * @returns Formatted Sogou search URL as a string
   */
  getSearchUrl(query, options) {
    const { count = 10, excludeDomains = [] } = options;
    const excludeDomainsQuery = excludeDomains && excludeDomains.length > 0 ? excludeDomains.map((domain) => `-site:${domain}`).join(" ") : "";
    const searchParams = new URLSearchParams({
      query: `${excludeDomainsQuery ? `${excludeDomainsQuery} ` : ""}${query}`,
      num: `${count}`
    });
    return `https://www.sogou.com/web?${searchParams.toString()}`;
  }
  /**
   * !NOTE: This function runs in the context of the browser page, not Node.js
   * 
   * Extract search results from Sogou
   * @param window - The window object
   * @returns Search results
   */
  extractSearchResults(window2) {
    const links = [];
    const document2 = window2.document;
    const isValidUrl = (url2) => {
      try {
        new URL(url2);
        return true;
      } catch (error) {
        return false;
      }
    };
    const EndPoints = "https://www.sogou.com";
    const SELECTOR = {
      results: ".results .vrwrap",
      resultTitle: ".vr-title",
      resultLink: ".vr-title > a",
      resultSnippet: [".star-wiki", ".fz-mid", ".attribute-centent"],
      resultSnippetExcluded: [".text-lightgray", ".zan-box", ".tag-website"],
      related: "#main .vrwrap.middle-better-hintBox .hint-mid"
    };
    try {
      const elements = document2.querySelectorAll(SELECTOR.results);
      elements.forEach((element) => {
        const titleEl = element.querySelector(SELECTOR.resultTitle);
        let url2 = element.querySelector(SELECTOR.resultLink)?.getAttribute("href");
        const snippets = SELECTOR.resultSnippet.map((selector) => {
          SELECTOR.resultSnippetExcluded.forEach((excludedSelector) => {
            const el2 = element.querySelector(excludedSelector);
            el2?.remove();
          });
          const el = element.querySelector(selector);
          return el?.textContent?.trim() || "";
        });
        if (!url2?.includes("http")) url2 = `${EndPoints}${url2}`;
        if (!url2?.trim() || !isValidUrl(url2)) return;
        const item = {
          title: titleEl?.textContent?.trim() || "",
          url: url2,
          snippet: snippets.join(""),
          content: ""
        };
        if (!item.title || !item.url) return;
        links.push(item);
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Error extracting search results from Sogou:", msg);
      throw error;
    }
    return links;
  }
  /**
  * Waits for Bing search results to load completely.
  *
  * @param page - The Puppeteer page object
  * @returns Promise that resolves when search results are loaded
  */
  async waitForSearchResults(page, timeout) {
    await page.waitForSelector("#pagebar_container", {
      timeout: timeout ?? 1e4
    });
  }
};

// src/libs/browser-search/engines/google.ts
var GoogleSearchEngine = class {
  /**
   * Generates a Google search URL based on the provided query and options.
   *
   * @param query - The search query string
   * @param options - Search configuration options
   * @param options.count - Number of search results to request (default: 10)
   * @param options.excludeDomains - Array of domain names to exclude from search results
   * @returns Formatted Google search URL as a string
   */
  getSearchUrl(query, options) {
    const searchParams = new URLSearchParams({
      q: `${options.excludeDomains && options.excludeDomains.length > 0 ? `${options.excludeDomains.map((domain) => `-site:${domain}`).join(" ")} ` : ""}${query}`,
      num: `${options.count || 10}`
    });
    searchParams.set("udm", "14");
    return `https://www.google.com/search?${searchParams.toString()}`;
  }
  /**
   * Extracts search results from a Google search page.
   *
   * @param window - The browser window object containing the loaded Google search page
   * @returns Array of search results extracted from the page
   */
  extractSearchResults(window2) {
    const links = [];
    const document2 = window2.document;
    const isValidUrl = (url2) => {
      try {
        new URL(url2);
        return true;
      } catch (error) {
        return false;
      }
    };
    const extractSnippet = (element) => {
      const clone = element.cloneNode(true);
      const titleElements = clone.querySelectorAll("h3");
      titleElements.forEach((el) => el.remove());
      const citeElements = clone.querySelectorAll("cite");
      citeElements.forEach((el) => el.remove());
      const scriptElements = clone.querySelectorAll("script, style");
      scriptElements.forEach((el) => el.remove());
      const text = Array.from(clone.querySelectorAll("*")).filter((node) => node.textContent?.trim()).map((node) => node.textContent?.trim()).filter(Boolean).reduce((acc, curr) => {
        if (!acc.some(
          (text2) => text2.includes(curr) || curr.includes(text2)
        )) {
          acc.push(curr);
        }
        return acc;
      }, []).join(" ").trim().replace(/\s+/g, " ");
      return text;
    };
    try {
      const elements = document2.querySelectorAll(".tF2Cxc");
      elements.forEach((element) => {
        const titleEl = element.querySelector("h3");
        const urlEl = element.querySelector("a");
        const url2 = urlEl?.getAttribute("href");
        const snippet = extractSnippet(element.parentElement || element);
        if (!url2 || !isValidUrl(url2)) return;
        const item = {
          title: titleEl?.textContent || "",
          url: url2,
          snippet,
          content: ""
        };
        if (!item.title || !item.url) return;
        links.push(item);
      });
    } catch (error) {
      console.error(error);
    }
    return links;
  }
  /**
   * Waits for Google search results to load completely.
   *
   * @param page - The Puppeteer page object
   * @returns Promise that resolves when search results are loaded
   */
  async waitForSearchResults(page, timeout) {
    await page.waitForSelector("#search", {
      timeout: timeout ?? 1e4
    });
  }
};

// src/libs/browser-search/engines/get.ts
function getSearchEngine(engine) {
  switch (engine) {
    case "bing":
      return new BingSearchEngine();
    case "baidu":
      return new BaiduSearchEngine();
    case "sogou":
      return new SogouSearchEngine();
    case "google":
      return new GoogleSearchEngine();
    default:
      return new BingSearchEngine();
  }
}

// src/libs/browser-search/search.ts
var BrowserSearch = class {
  constructor(config = {}) {
    this.config = config;
    this.logger = config?.logger ?? import_logger4.defaultLogger;
    this.browser = config.browser ?? new LocalBrowser({ logger: this.logger });
    this.defaultEngine = config.defaultEngine ?? "bing";
  }
  logger;
  browser;
  isBrowserOpen = false;
  defaultEngine;
  /**
   * Search web and extract content from result pages
   */
  async perform(options) {
    this.logger.info("Starting search with options:", options);
    const queries = Array.isArray(options.query) ? options.query : [options.query];
    const excludeDomains = options.excludeDomains || [];
    const count = options.count && Math.max(3, Math.floor(options.count / queries.length));
    const engine = options.engine || this.defaultEngine;
    try {
      if (!this.isBrowserOpen) {
        this.logger.info("Launching browser");
        await this.browser.launch(this.config.browserOptions);
        this.isBrowserOpen = true;
      } else {
        this.logger.info("Using existing browser instance");
      }
      const queue = new PromiseQueue(options.concurrency || 15);
      const visitedUrls = /* @__PURE__ */ new Set();
      const results = await Promise.all(
        queries.map(
          (query) => this.search(this.browser, {
            query,
            count,
            queue,
            visitedUrls,
            excludeDomains,
            truncate: options.truncate,
            needVisitedUrls: options.needVisitedUrls,
            engine
          })
        )
      );
      this.logger.success("Search completed successfully");
      return results.flat();
    } catch (error) {
      this.logger.error("Search failed:", error);
      return [];
    } finally {
      if (!options.keepBrowserOpen && this.isBrowserOpen) {
        await this.closeBrowser();
      }
    }
  }
  /**
   * Explicitly close the browser instance
   */
  async closeBrowser() {
    if (this.isBrowserOpen) {
      this.logger.info("Closing browser");
      await this.browser.close();
      this.isBrowserOpen = false;
    }
  }
  async search(browser, options) {
    const searchEngine = getSearchEngine(options.engine);
    const url2 = searchEngine.getSearchUrl(options.query, {
      count: options.count,
      excludeDomains: options.excludeDomains
    });
    this.logger.info(`Searching with ${options.engine} engine: ${url2}`);
    let links = await browser.evaluateOnNewPage({
      url: url2,
      waitForOptions: {
        waitUntil: "networkidle0"
      },
      pageFunction: searchEngine.extractSearchResults,
      pageFunctionParams: [],
      beforePageLoad: async (page) => {
        await interceptRequest(page);
      },
      afterPageLoad: async (page) => {
        if (searchEngine.waitForSearchResults)
          await searchEngine.waitForSearchResults(page, 1e4);
      }
    });
    this.logger.info(`Fetched ${links?.length ?? 0} links`);
    links = links?.filter((link) => {
      if (options.visitedUrls.has(link.url)) return false;
      options.visitedUrls.add(link.url);
      return !shouldSkipDomain(link.url);
    }) || [];
    if (!links.length) {
      this.logger.info("No valid links found");
      return [];
    }
    const results = await Promise.allSettled(
      options.needVisitedUrls ? links.map(
        (item) => options.queue.add(() => this.visitLink(this.browser, item))
      ) : links
    );
    return results.map((result) => {
      if (result.status === "rejected" || !result.value) return null;
      return {
        ...result.value,
        content: options.truncate ? result.value.content.slice(0, options.truncate) : result.value.content
      };
    }).filter((v) => v !== null);
  }
  async visitLink(browser, item) {
    try {
      this.logger.info("Visiting link:", item.url);
      const result = await browser.evaluateOnNewPage({
        url: item.url,
        pageFunction: extractPageInformation,
        pageFunctionParams: [READABILITY_SCRIPT],
        beforePageLoad: async (page) => {
          await interceptRequest(page);
        }
      });
      if (result) {
        const content = toMarkdown(result.content);
        return { ...result, url: item.url, content, snippet: item.snippet };
      }
    } catch (e) {
      this.logger.error("Failed to visit link:", e);
    }
  }
};

// src/search/local.ts
var import_logger5 = require("@agent-infra/logger");
var logger2 = new import_logger5.ConsoleLogger("[LocalSearch]");
async function localSearch(options) {
  const { query, limit = 10 } = options;
  let { engines = "all" } = options;
  const browserSearch = new BrowserSearch({
    logger: logger2,
    browserOptions: {
      headless: true
    }
  });
  if (engines === "all") {
    engines = "bing,google,baidu,sogou";
  }
  try {
    const engineList = engines.split(",");
    if (engineList.length === 0) {
      throw new Error("engines is required");
    }
    const results = [];
    for (const engine of engineList) {
      const res = await browserSearch.perform({
        query,
        count: limit,
        engine,
        needVisitedUrls: false
      });
      if (res.length > 0) {
        results.push(...res);
        break;
      }
    }
    logger2.info(`Found ${results.length} results for ${query}`, results);
    return {
      results,
      success: true
    };
  } finally {
    await browserSearch.closeBrowser();
  }
}

// src/tools.ts
var SEARCH_TOOL = {
  name: "one_search",
  description: "Search and retrieve content from web pages. Returns SERP results by default (url, title, description).",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query string"
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 10)"
      },
      language: {
        type: "string",
        description: "Language code for search results (default: auto)"
      },
      categories: {
        type: "string",
        enum: [
          "general",
          "news",
          "images",
          "videos",
          "it",
          "science",
          "map",
          "music",
          "files",
          "social_media"
        ],
        description: "Categories to search for (default: general)"
      },
      timeRange: {
        type: "string",
        description: "Time range for search results (default: all)",
        enum: [
          "all",
          "day",
          "week",
          "month",
          "year"
        ]
      }
    },
    required: ["query"]
  }
};
var MAP_TOOL = {
  name: "one_map",
  description: "Discover URLs from a starting point. Can use both sitemap.xml and HTML link discovery.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "Starting URL for URL discovery"
      },
      search: {
        type: "string",
        description: "Optional search term to filter URLs"
      },
      ignoreSitemap: {
        type: "boolean",
        description: "Skip sitemap.xml discovery and only use HTML links"
      },
      sitemapOnly: {
        type: "boolean",
        description: "Only use sitemap.xml for discovery, ignore HTML links"
      },
      includeSubdomains: {
        type: "boolean",
        description: "Include URLs from subdomains in results"
      },
      limit: {
        type: "number",
        description: "Maximum number of URLs to return"
      }
    },
    required: ["url"]
  }
};
var SCRAPE_TOOL = {
  name: "one_scrape",
  description: "Scrape a single webpage with advanced options for content extraction. Supports various formats including markdown, HTML, and screenshots. Can execute custom actions like clicking or scrolling before scraping.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to scrape"
      },
      formats: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "markdown",
            "html",
            "rawHtml",
            "screenshot",
            "links",
            "screenshot@fullPage",
            "extract"
          ]
        },
        description: "Content formats to extract (default: ['markdown'])"
      },
      onlyMainContent: {
        type: "boolean",
        description: "Extract only the main content, filtering out navigation, footers, etc."
      },
      includeTags: {
        type: "array",
        items: { type: "string" },
        description: "HTML tags to specifically include in extraction"
      },
      excludeTags: {
        type: "array",
        items: { type: "string" },
        description: "HTML tags to exclude from extraction"
      },
      waitFor: {
        type: "number",
        description: "Time in milliseconds to wait for dynamic content to load"
      },
      timeout: {
        type: "number",
        description: "Maximum time in milliseconds to wait for the page to load"
      },
      actions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "wait",
                "click",
                "screenshot",
                "write",
                "press",
                "scroll",
                "scrape",
                "executeJavascript"
              ],
              description: "Type of action to perform"
            },
            selector: {
              type: "string",
              description: "CSS selector for the target element"
            },
            milliseconds: {
              type: "number",
              description: "Time to wait in milliseconds (for wait action)"
            },
            text: {
              type: "string",
              description: "Text to write (for write action)"
            },
            key: {
              type: "string",
              description: "Key to press (for press action)"
            },
            direction: {
              type: "string",
              enum: ["up", "down"],
              description: "Scroll direction"
            },
            script: {
              type: "string",
              description: "JavaScript code to execute"
            },
            fullPage: {
              type: "boolean",
              description: "Take full page screenshot"
            }
          },
          required: ["type"]
        },
        description: "List of actions to perform before scraping"
      },
      extract: {
        type: "object",
        properties: {
          schema: {
            type: "object",
            description: "Schema for structured data extraction"
          },
          systemPrompt: {
            type: "string",
            description: "System prompt for LLM extraction"
          },
          prompt: {
            type: "string",
            description: "User prompt for LLM extraction"
          }
        },
        description: "Configuration for structured data extraction"
      },
      mobile: {
        type: "boolean",
        description: "Use mobile viewport"
      },
      skipTlsVerification: {
        type: "boolean",
        description: "Skip TLS certificate verification"
      },
      removeBase64Images: {
        type: "boolean",
        description: "Remove base64 encoded images from output"
      },
      location: {
        type: "object",
        properties: {
          country: {
            type: "string",
            description: "Country code for geolocation"
          },
          languages: {
            type: "array",
            items: { type: "string" },
            description: "Language codes for content"
          }
        },
        description: "Location settings for scraping"
      }
    },
    required: ["url"]
  }
};
var EXTRACT_TOOL = {
  name: "one_extract",
  description: "Extract structured information from web pages using LLM. Supports both cloud AI and self-hosted LLM extraction.",
  inputSchema: {
    type: "object",
    properties: {
      urls: {
        type: "array",
        items: { type: "string" },
        description: "List of URLs to extract information from"
      },
      prompt: {
        type: "string",
        description: "Prompt for the LLM extraction"
      },
      systemPrompt: {
        type: "string",
        description: "System prompt for LLM extraction"
      },
      schema: {
        type: "object",
        description: "JSON schema for structured data extraction"
      },
      allowExternalLinks: {
        type: "boolean",
        description: "Allow extraction from external links"
      },
      enableWebSearch: {
        type: "boolean",
        description: "Enable web search for additional context"
      },
      includeSubdomains: {
        type: "boolean",
        description: "Include subdomains in extraction"
      }
    },
    required: ["urls"]
  }
};

// src/index.ts
var import_firecrawl_js = __toESM(require("@mendable/firecrawl-js"), 1);
var import_dotenvx = __toESM(require("@dotenvx/dotenvx"), 1);
var import_duck_duck_scrape = require("duck-duck-scrape");
import_dotenvx.default.config();
var SEARCH_API_URL = process.env.SEARCH_API_URL;
var SEARCH_API_KEY = process.env.SEARCH_API_KEY;
var SEARCH_PROVIDER = process.env.SEARCH_PROVIDER ?? "searxng";
var SAFE_SEARCH = process.env.SAFE_SEARCH ?? 0;
var LIMIT = process.env.LIMIT ?? 10;
var CATEGORIES = process.env.CATEGORIES ?? "general";
var ENGINES = process.env.ENGINES ?? "all";
var FORMAT = process.env.FORMAT ?? "json";
var LANGUAGE = process.env.LANGUAGE ?? "auto";
var TIME_RANGE = process.env.TIME_RANGE ?? "";
var DEFAULT_TIMEOUT = process.env.TIMEOUT ?? 1e4;
var FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
var FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL;
var firecrawl = new import_firecrawl_js.default({
  apiKey: FIRECRAWL_API_KEY ?? "",
  ...FIRECRAWL_API_URL ? { apiUrl: FIRECRAWL_API_URL } : {}
});
var server = new import_server.Server(
  {
    name: "one-search-mcp",
    version: "0.0.1"
  },
  {
    capabilities: {
      tools: {},
      logging: {}
    }
  }
);
var searchDefaultConfig = {
  limit: Number(LIMIT),
  categories: CATEGORIES,
  format: FORMAT,
  safesearch: SAFE_SEARCH,
  language: LANGUAGE,
  engines: ENGINES,
  time_range: TIME_RANGE,
  timeout: DEFAULT_TIMEOUT
};
server.setRequestHandler(import_types.ListToolsRequestSchema, async () => ({
  tools: [
    SEARCH_TOOL,
    EXTRACT_TOOL,
    SCRAPE_TOOL,
    MAP_TOOL
  ]
}));
server.setRequestHandler(import_types.CallToolRequestSchema, async (request) => {
  const startTime = Date.now();
  try {
    const { name, arguments: args } = request.params;
    if (!args) {
      throw new Error("No arguments provided");
    }
    server.sendLoggingMessage({
      level: "info",
      data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Received request for tool: [${name}]`
    });
    switch (name) {
      case "one_search": {
        if (!checkSearchArgs(args)) {
          throw new Error(`Invalid arguments for tool: [${name}]`);
        }
        try {
          const { results, success } = await processSearch({
            ...args,
            apiKey: SEARCH_API_KEY ?? "",
            apiUrl: SEARCH_API_URL
          });
          if (!success) {
            throw new Error("Failed to search");
          }
          const resultsText = results.map((result) => `Title: ${result.title}
URL: ${result.url}
Description: ${result.snippet}
${result.markdown ? `Content: ${result.markdown}` : ""}`);
          return {
            content: [
              {
                type: "text",
                text: resultsText.join("\n\n")
              }
            ],
            results,
            success
          };
        } catch (error) {
          server.sendLoggingMessage({
            level: "error",
            data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Error searching: ${error}`
          });
          const msg = error instanceof Error ? error.message : "Unknown error";
          return {
            success: false,
            content: [
              {
                type: "text",
                text: msg
              }
            ]
          };
        }
      }
      case "one_scrape": {
        if (!checkScrapeArgs(args)) {
          throw new Error(`Invalid arguments for tool: [${name}]`);
        }
        try {
          const startTime2 = Date.now();
          server.sendLoggingMessage({
            level: "info",
            data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Scraping started for url: [${args.url}]`
          });
          const { url: url2, ...scrapeArgs } = args;
          const { content, success, result } = await processScrape(url2, scrapeArgs);
          server.sendLoggingMessage({
            level: "info",
            data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Scraping completed in ${Date.now() - startTime2}ms`
          });
          return {
            content,
            result,
            success
          };
        } catch (error) {
          server.sendLoggingMessage({
            level: "error",
            data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Error scraping: ${error}`
          });
          const msg = error instanceof Error ? error.message : "Unknown error";
          return {
            success: false,
            content: [
              {
                type: "text",
                text: msg
              }
            ]
          };
        }
      }
      case "one_map": {
        if (!checkMapArgs(args)) {
          throw new Error(`Invalid arguments for tool: [${name}]`);
        }
        try {
          const { content, success, result } = await processMapUrl(args.url, args);
          return {
            content,
            result,
            success
          };
        } catch (error) {
          server.sendLoggingMessage({
            level: "error",
            data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Error mapping: ${error}`
          });
          const msg = error instanceof Error ? error.message : String(error);
          return {
            success: false,
            content: [
              {
                type: "text",
                text: msg
              }
            ]
          };
        }
      }
      default: {
        throw new Error(`Unknown tool: ${name}`);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    server.sendLoggingMessage({
      level: "error",
      data: {
        message: `[${(/* @__PURE__ */ new Date()).toISOString()}] Error processing request: ${msg}`,
        tool: request.params.name,
        arguments: request.params.arguments,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        duration: Date.now() - startTime
      }
    });
    return {
      success: false,
      content: [
        {
          type: "text",
          text: msg
        }
      ]
    };
  } finally {
    server.sendLoggingMessage({
      level: "info",
      data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Request completed in ${Date.now() - startTime}ms`
    });
  }
});
async function processSearch(args) {
  switch (SEARCH_PROVIDER) {
    case "searxng": {
      const params = {
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY
      };
      const { categories, language } = searchDefaultConfig;
      if (categories) {
        params.categories = categories;
      }
      if (language) {
        params.language = language;
      }
      return await searxngSearch(params);
    }
    case "tavily": {
      return await tavilySearch({
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY
      });
    }
    case "bing": {
      return await bingSearch({
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY
      });
    }
    case "duckduckgo": {
      const safeSearch = args.safeSearch ?? 0;
      const safeSearchOptions = [import_duck_duck_scrape.SafeSearchType.STRICT, import_duck_duck_scrape.SafeSearchType.MODERATE, import_duck_duck_scrape.SafeSearchType.OFF];
      return await duckDuckGoSearch({
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY,
        safeSearch: safeSearchOptions[safeSearch]
      });
    }
    case "local": {
      return await localSearch({
        ...searchDefaultConfig,
        ...args
      });
    }
    default:
      throw new Error(`Unsupported search provider: ${SEARCH_PROVIDER}`);
  }
}
async function processScrape(url2, args) {
  const res = await firecrawl.scrapeUrl(url2, {
    ...args
  });
  if (!res.success) {
    throw new Error(`Failed to scrape: ${res.error}`);
  }
  const content = [];
  if (res.markdown) {
    content.push(res.markdown);
  }
  if (res.rawHtml) {
    content.push(res.rawHtml);
  }
  if (res.links) {
    content.push(res.links.join("\n"));
  }
  if (res.screenshot) {
    content.push(res.screenshot);
  }
  if (res.html) {
    content.push(res.html);
  }
  if (res.extract) {
    content.push(res.extract);
  }
  return {
    content: [
      {
        type: "text",
        text: content.join("\n\n") || "No content found"
      }
    ],
    result: res,
    success: true
  };
}
async function processMapUrl(url2, args) {
  const res = await firecrawl.mapUrl(url2, {
    ...args
  });
  if ("error" in res) {
    throw new Error(`Failed to map: ${res.error}`);
  }
  if (!res.links) {
    throw new Error(`No links found from: ${url2}`);
  }
  return {
    content: [
      {
        type: "text",
        text: res.links.join("\n").trim()
      }
    ],
    result: res.links,
    success: true
  };
}
function checkSearchArgs(args) {
  return typeof args === "object" && args !== null && "query" in args && typeof args.query === "string";
}
function checkScrapeArgs(args) {
  return typeof args === "object" && args !== null && "url" in args && typeof args.url === "string";
}
function checkMapArgs(args) {
  return typeof args === "object" && args !== null && "url" in args && typeof args.url === "string";
}
async function runServer() {
  try {
    process.stdout.write("Starting OneSearch MCP server...\n");
    const transport = new import_stdio.StdioServerTransport();
    await server.connect(transport);
    server.sendLoggingMessage({
      level: "info",
      data: "OneSearch MCP server started"
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error starting server: ${msg}
`);
    process.exit(1);
  }
}
runServer().catch((error) => {
  const msg = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error running server: ${msg}
`);
  process.exit(1);
});
//# sourceMappingURL=index.cjs.map