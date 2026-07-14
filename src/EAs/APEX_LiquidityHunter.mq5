//+------------------------------------------------------------------+
//|          APEX Liquidity Hunter v1.0                              |
//|  Institutional Liquidity | Stop-Hunt | MA 9/15/20/50             |
//|  Modes: HFT | TickScalp | Scalp | Day | Swing | Monthly | Yearly |
//|  Grid | Hedge | Compounding | Webhook License Lock               |
//+------------------------------------------------------------------+
//  ╔═══════════════════════════════════════════════════════════════╗
//  ║   APEX LIQUIDITY HUNTER v1.0  —  No Emotions, No Retailers    ║
//  ║   Strategy: HTF Bias → Liquidity Pool → Stop Hunt → Reverse   ║
//  ║   MA Signals: EMA 9 / 15 / 20 / 50 stack alignment            ║
//  ║   License: Webhook POST — must return 200 + {"allowed":true}  ║
//  ╚═══════════════════════════════════════════════════════════════╝
#property copyright   "APEX Systems"
#property link        ""
#property version     "1.00"
#property description "APEX Liquidity Hunter — Institutional Liquidity Engine"
#property description "MA 9/15/20/50 | Stop-Hunt Reversal | Grid + Hedge Recovery"
#property description "Webhook License Lock | 7 Trading Modes | Modern Dashboard"
#property strict

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\OrderInfo.mqh>

//═══════════════════════════════════════════════════════════════════
//  CONSTANTS
//═══════════════════════════════════════════════════════════════════
#define APEX_VERSION        "1.0"
#define APEX_NAME           "APEX Liquidity Hunter"
#define APEX_MAGIC_BASE     202601
#define MAX_GRID_LEVELS     8
#define MAX_LIQ_ZONES       50
#define PANEL_PREFIX        "APEX_"
#define HEARTBEAT_SECS      3600

// Tokyo Night Palette
#define TN_BG               C'26,27,38'
#define TN_PANEL            C'36,40,59'
#define TN_BORDER           C'65,72,104'
#define TN_FG               C'192,202,245'
#define TN_GREEN            C'158,206,106'
#define TN_RED              C'247,118,142'
#define TN_ORANGE           C'255,158,100'
#define TN_YELLOW           C'224,175,104'
#define TN_CYAN             C'125,207,255'
#define TN_PURPLE           C'187,154,247'
#define TN_BLUE             C'122,162,247'
#define TN_DARK             C'16,17,24'
#define TN_ACCENT           C'218,165,32'
#define TN_MUTED            C'70,78,100'

//═══════════════════════════════════════════════════════════════════
//  ENUMERATIONS
//═══════════════════════════════════════════════════════════════════
enum ENUM_APEX_MODE
{
   MODE_HFT            = 0,   // HFT (Tick-Speed)
   MODE_TICK_SCALP     = 1,   // Tick Scalp with Stop Orders
   MODE_SCALP_POS      = 2,   // Scalping with Positions
   MODE_DAY            = 3,   // Day Trading
   MODE_SWING          = 4,   // Swing Trading
   MODE_MONTHLY        = 5,   // Monthly Trades
   MODE_YEARLY         = 6    // Yearly Trades
};

enum ENUM_RISK_MODE
{
   RISK_FIXED_LOT      = 0,   // Fixed Lot Size
   RISK_PCT_BALANCE    = 1,   // % of Balance
   RISK_PCT_EQUITY     = 2,   // % of Equity
   RISK_FIXED_MONEY    = 3    // Fixed $ at Risk
};

enum ENUM_GRID_MODE
{
   GRID_DISABLED       = 0,   // Grid Disabled
   GRID_RECOVERY       = 1,   // Recovery Grid (only when in loss)
   GRID_AGGRESSIVE     = 2    // Aggressive Grid (always active)
};

enum ENUM_HEDGE_MODE
{
   HEDGE_DISABLED      = 0,   // Hedge Disabled
   HEDGE_SIMULTANEOUS  = 1,   // Simultaneous Hedge
   HEDGE_DELAYED       = 2    // Delayed Hedge (on drawdown trigger)
};

enum ENUM_LTF_ENTRY
{
   LTF_M1              = PERIOD_M1,
   LTF_M5              = PERIOD_M5,
   LTF_M15             = PERIOD_M15,
   LTF_H1              = PERIOD_H1
};

enum ENUM_HTF_BIAS
{
   HTF_M15             = PERIOD_M15,
   HTF_H1              = PERIOD_H1,
   HTF_H4              = PERIOD_H4,
   HTF_D1              = PERIOD_D1,
   HTF_W1              = PERIOD_W1
};

enum ENUM_COMPOUND_MODE
{
   COMPOUND_OFF        = 0,   // Compounding Disabled
   COMPOUND_AUTO       = 1,   // Auto Adaptive Compounding
   COMPOUND_AGGRESSIVE = 2    // Aggressive Weekly Step-Up
};

//═══════════════════════════════════════════════════════════════════
//  STRUCTS
//═══════════════════════════════════════════════════════════════════
struct CandleInfo
{
   double   open, high, low, close;
   double   body, bodyPct, totalRange;
   double   upperWick, lowerWick;
   bool     isBullish, isBearish;
   bool     isPinBarBull;   // hammer — buy signal
   bool     isPinBarBear;   // shooting star — sell signal
   bool     isEngulfBull;   // bullish engulfing — buy signal
   bool     isEngulfBear;   // bearish engulfing — sell signal
   bool     isMomentumBull; // large bull body — buy signal
   bool     isMomentumBear; // large bear body — sell signal
};

struct LiquidityZone
{
   double   price;
   bool     isHigh;        // true=resistance pool, false=support pool
   datetime formed;
   bool     swept;
   bool     reversed;
   int      touchCount;
};

struct MAState
{
   double   ema9;
   double   ema15;
   double   ema20;
   double   ema50;
   bool     stackedBull;   // ema9>ema15>ema20>ema50
   bool     stackedBear;   // ema9<ema15<ema20<ema50
   bool     aboveFast;     // price > ema9
   bool     belowFast;     // price < ema9
};

struct GridState
{
   ulong    tickets[MAX_GRID_LEVELS];
   double   prices[MAX_GRID_LEVELS];
   double   lots[MAX_GRID_LEVELS];
   int      level;
   bool     active;
   double   breakEvenPrice;
};

struct SessionStats
{
   int      totalTrades;
   int      wins;
   int      losses;
   double   totalProfit;
   double   startBalance;
   double   highWaterMark;
   double   dailyPL;
   datetime dayStart;
};

struct CompoundStep
{
   double   fromBalance;
   double   toBalance;
   double   riskPct;
   string   label;
};

//═══════════════════════════════════════════════════════════════════
//  INPUT PARAMETERS
//═══════════════════════════════════════════════════════════════════
input group "══════════ APEX TRADING MODE ══════════"
input ENUM_APEX_MODE   InpMode           = MODE_SCALP_POS;  // Trading Mode
input ENUM_LTF_ENTRY   InpEntryTF        = LTF_M5;          // Entry Timeframe
input ENUM_HTF_BIAS    InpBiasTF         = HTF_H4;          // Bias Timeframe (Higher)
input int              InpMagicNumber    = APEX_MAGIC_BASE;  // Magic Number
input string           InpTradeComment   = "APEX_LH";       // Trade Comment

input group "══════════ WEBHOOK LICENSE LOCK ══════════"
input string  InpWebhookURL     = "https://your-webhook.com/apex-auth"; // Webhook URL
input int     InpWebhookTimeout = 10;      // Timeout (seconds)
input bool    InpSkipWebhook    = true;    // Skip Webhook (false = enforce license check)

input group "══════════ MA ENGINE SETTINGS ══════════"
input int     InpEMA9Period     = 9;       // EMA 9 Period
input int     InpEMA15Period    = 15;      // EMA 15 Period
input int     InpEMA20Period    = 20;      // EMA 20 Period
input int     InpEMA50Period    = 50;      // EMA 50 Period
input bool    InpRequireFullStack = false; // Require Full MA Stack (9>15>20>50)
input bool    InpRequireHTFAlign  = false; // Require HTF Bias Alignment (disable for backtesting)
input bool    InpRequireSweep     = false; // Require Full Sweep Before Entry (strict mode)

input group "══════════ LIQUIDITY ENGINE ══════════"
input int     InpSwingLookback  = 50;      // Swing Point Lookback (bars)
input int     InpSwingStrength  = 3;       // Swing Strength (bars each side)
input double  InpSweepPips      = 3.0;     // Min Sweep Distance (pips)
input double  InpReversalPips    = 3.0;    // Min Reversal Confirmation (pips)
input double  InpZoneProximity   = 8.0;    // Zone Proximity Entry Trigger (pips from zone)
input bool    InpDrawZones       = true;   // Draw Liquidity Zones on Chart
input bool    InpUseOrderFlow    = false;  // Use Order Book Delta Filter (needs broker DOM)

input group "══════════ RISK MANAGEMENT ══════════"
input ENUM_RISK_MODE InpRiskMode   = RISK_PCT_BALANCE;  // Risk Mode
input double InpFixedLot           = 0.01;              // Fixed Lot Size
input double InpRiskPercent        = 1.0;               // Risk % Per Trade
input double InpRiskMoney          = 10.0;              // Fixed Risk $ Per Trade
input double InpMaxLot             = 10.0;              // Maximum Lot Cap
input double InpMinLot             = 0.01;              // Minimum Lot Size
input double InpDailyMaxLoss       = 5.0;               // Daily Max Loss % (halts EA)
input double InpEquityFloor        = 70.0;              // Equity Floor % (emergency close)
input double InpMaxDailyTrades     = 7000;                // Max Trades Per Day

input group "══════════ SL / TP SETTINGS ══════════"
input double  InpSLPips           = 20.0;   // Stop Loss (pips)
input double  InpTPPips           = 50.0;   // Take Profit (pips)
input double  InpRiskReward       = 1.5;    // Risk:Reward Ratio (overrides TP if >0)
input double  InpBreakevenPips    = 10.0;   // Move to Breakeven after X pips profit (0=off)
input bool    InpUseTrailingStop  = true;   // Enable Trailing Stop
input double  InpTrailStart       = 15.0;   // Trail Activation (pips)
input double  InpTrailDistance    = 8.0;    // Trail Distance (pips)
input double  InpStepTrailPips    = 5.0;    // Step-Trail: lock every X pips above BE
input bool    InpLockAtOneR       = true;   // Lock SL at +5 pips once 1:1 RR reached
input bool    InpUsePartialClose  = true;   // Partial Close at 1:1 RR
input double  InpPartialPct       = 50.0;   // Partial Close % of Position

input group "══════════ ATR-BASED SL / TP ══════════"
input bool    InpUseATR           = false;  // Use ATR for dynamic SL/TP (disable for zone-based SL)
input int     InpATRPeriod        = 14;     // ATR Period
input double  InpATRSLMult        = 1.5;    // SL = ATR × this multiplier
input double  InpATRTPMult        = 3.0;    // TP = ATR × this multiplier

input group "══════════ SMART MONEY CONCEPTS (SMC) ══════════"
input bool    InpUseChoChEntry    = true;   // Require CHoCH (Change of Character) for entry
input bool    InpCloseOnChoCh     = true;   // Close trades early on opposite CHoCH
input bool    InpUseZoneSL        = true;   // Place Stop Loss behind the Liquidity Zone
input double  InpZoneSLBuffer     = 3.0;    // Buffer pips for Zone SL
input double  InpMinSLPips        = 5.0;    // Minimum SL distance (pips) to avoid invalid stops

input group "══════════ CANDLE PATTERN FILTER ══════════"
input bool    InpUseCandleFilter  = true;   // Require candle pattern confirmation
input bool    InpAllowPinBar      = true;   // Allow Pin Bar (hammer/shooting star)
input bool    InpAllowEngulfing   = true;   // Allow Engulfing Candle
input bool    InpAllowMomentum    = true;   // Allow Strong Momentum Candle
input double  InpMinBodyPct       = 30.0;   // Min body % for momentum candle (lower=more signals)
input double  InpPinBarRatio      = 2.0;    // Pin bar: wick must be X× the body (lower=more signals)

input group "══════════ GRID ENGINE ══════════"
input ENUM_GRID_MODE InpGridMode  = GRID_RECOVERY;  // Grid Mode
input double  InpGridStep         = 20.0;   // Grid Step (pips)
input double  InpGridMultiplier   = 1.3;    // Lot Multiplier Per Grid Level
input int     InpGridMaxLevels    = 5;      // Maximum Grid Levels
input double  InpGridStepMult     = 1.1;    // Step Multiplier Per Level

input group "══════════ HEDGE ENGINE ══════════"
input ENUM_HEDGE_MODE InpHedgeMode   = HEDGE_DELAYED;  // Hedge Mode
input double  InpHedgeTriggerPips    = 30.0;  // Hedge Trigger (pips in loss)
input double  InpHedgeRatio          = 1.2;   // Hedge Lot Ratio vs original (lowered for safety)
input bool    InpHedgeAutoUnwind     = true;  // Auto-Unwind Hedge on Recovery

input group "══════════ SESSION FILTERS ══════════"
input bool    InpTradeMonday      = true;   // Trade Monday
input bool    InpTradeTuesday     = true;   // Trade Tuesday
input bool    InpTradeWednesday   = true;   // Trade Wednesday
input bool    InpTradeThursday    = true;   // Trade Thursday
input bool    InpTradeFriday      = true;   // Trade Friday
input string  InpSessionStart     = "02:00"; // Session Start (HH:MM broker time)
input string  InpSessionEnd       = "22:00"; // Session End (HH:MM broker time)
input bool    InpCloseFriday      = true;   // Close All Friday at Session End
input int     InpMaxSpread        = 100;    // Max Allowed Spread (points, 100=10pips)

input group "══════════ COMPOUNDING ══════════"
input ENUM_COMPOUND_MODE InpCompound = COMPOUND_AUTO; // Compounding Mode
input double  InpStartBalance     = 1000.0; // Starting Balance for Compound Calc
input double  InpTargetBalance    = 40000.0;// Final Target Balance
input bool    InpProtectMode      = false;   // Switch to Protect Mode at Daily Target

input group "══════════ PANEL & DISPLAY ══════════"
input bool             InpShowPanel    = true;              // Show Dashboard Panel
input ENUM_BASE_CORNER InpPanelCorner  = CORNER_LEFT_UPPER; // Panel Corner
input int              InpPanelX       = 10;                // Panel X Position
input int              InpPanelY       = 30;                // Panel Y Position
input int              InpPanelWidth   = 340;               // Panel Width
input bool             InpShowZones    = true;              // Show Liquidity Zones

//═══════════════════════════════════════════════════════════════════
//  GLOBAL HANDLES & STATE
//═══════════════════════════════════════════════════════════════════

// Indicator handles — Entry TF
int g_hEMA9_entry   = INVALID_HANDLE;
int g_hEMA15_entry  = INVALID_HANDLE;
int g_hEMA20_entry  = INVALID_HANDLE;
int g_hEMA50_entry  = INVALID_HANDLE;

// Indicator handles — Bias TF
int g_hEMA9_bias    = INVALID_HANDLE;
int g_hEMA15_bias   = INVALID_HANDLE;
int g_hEMA20_bias   = INVALID_HANDLE;
int g_hEMA50_bias   = INVALID_HANDLE;

// ATR handle — for dynamic SL/TP
int g_hATR_entry    = INVALID_HANDLE;

// Liquidity zones
LiquidityZone g_zones[MAX_LIQ_ZONES];
int           g_zoneCount = 0;

// Grid state per direction
GridState g_gridBuy;
GridState g_gridSell;

// Hedge tickets
ulong g_hedgeBuyTicket  = 0;
ulong g_hedgeSellTicket = 0;

// Session stats
SessionStats g_stats;

// Compounding steps (auto-generated)
CompoundStep g_compSteps[10];
int          g_compStepCount = 0;
double       g_currentRisk   = 1.0;

// EA State
bool     g_webhookOK         = false;
bool     g_haltTrading       = false;
string   g_haltReason        = "";
bool     g_partialDone[];     // tracks partial close per position
datetime g_lastHeartbeat     = 0;
datetime g_lastScanTime      = 0;
datetime g_dayStart          = 0;
double   g_dayStartBalance   = 0;
double   g_highWaterMark     = 0;
int      g_dailyTradeCount   = 0;
bool     g_protectMode       = false;
datetime g_lastBarTime       = 0;

// Trade objects
CTrade        g_trade;
CPositionInfo g_pos;

//═══════════════════════════════════════════════════════════════════
//  HELPER: Pip Value
//═══════════════════════════════════════════════════════════════════
double PipPoint()
{
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    return (digits == 3 || digits == 5) ? _Point * 10.0 : _Point;
}

double PipsToPoints(double pips) { return pips * PipPoint() / _Point; }
double PointsToPips(double pts)  { return pts * _Point / PipPoint(); }
double PipsToPrice(double pips)  { return pips * PipPoint(); }

string TFStr(ENUM_TIMEFRAMES tf)
{
    switch(tf)
    {
        case PERIOD_M1:  return "M1";   case PERIOD_M5:  return "M5";
        case PERIOD_M15: return "M15";  case PERIOD_H1:  return "H1";
        case PERIOD_H4:  return "H4";   case PERIOD_D1:  return "D1";
        case PERIOD_W1:  return "W1";   case PERIOD_MN1: return "MN1";
        default:         return "?";
    }
}

string ModeStr(ENUM_APEX_MODE m)
{
    switch(m)
    {
        case MODE_HFT:        return "HFT";
        case MODE_TICK_SCALP: return "TICK SCALP";
        case MODE_SCALP_POS:  return "SCALP";
        case MODE_DAY:        return "DAY";
        case MODE_SWING:      return "SWING";
        case MODE_MONTHLY:    return "MONTHLY";
        case MODE_YEARLY:     return "YEARLY";
        default:              return "?";
    }
}

//═══════════════════════════════════════════════════════════════════
//  WEBHOOK LICENSE LOCK
//═══════════════════════════════════════════════════════════════════
bool WebhookCheck(string &outMsg)
{
    if(InpSkipWebhook)
    {
        outMsg = "BYPASS (testing)";
        return true;
    }

    string url = InpWebhookURL;
    if(StringLen(url) < 10)
    {
        outMsg = "Webhook URL not configured";
        return false;
    }

    // Build JSON body
    long   acct    = AccountInfoInteger(ACCOUNT_LOGIN);
    string server  = AccountInfoString(ACCOUNT_SERVER);
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    long   ts      = (long)TimeCurrent();

    string body = StringFormat(
        "{\"account\":%I64d,\"server\":\"%s\",\"balance\":%.2f,\"ea_version\":\"%s\",\"timestamp\":%I64d}",
        acct, server, balance, APEX_VERSION, ts
    );

    char  reqData[];  StringToCharArray(body, reqData, 0, StringLen(body));
    char  resData[];
    string resHeaders;
    int   timeout = InpWebhookTimeout * 1000;
    string reqHeaders = "Content-Type: application/json\r\n";

    ResetLastError();
    int httpCode = WebRequest("POST", url, reqHeaders, timeout, reqData, resData, resHeaders);

    if(httpCode == -1)
    {
        int err = GetLastError();
        outMsg = StringFormat("Network error %d — Check WebRequest whitelist for: %s", err, url);
        return false;
    }

    if(httpCode != 200)
    {
        outMsg = StringFormat("Server returned HTTP %d", httpCode);
        return false;
    }

    string resp = CharArrayToString(resData);

    // Parse "allowed": true/false
    if(StringFind(resp, "\"allowed\":true") >= 0 || StringFind(resp, "\"allowed\": true") >= 0)
    {
        // Extract message if present
        int msgStart = StringFind(resp, "\"message\":");
        if(msgStart >= 0)
        {
            msgStart = StringFind(resp, "\"", msgStart + 10) + 1;
            int msgEnd = StringFind(resp, "\"", msgStart);
            outMsg = (msgEnd > msgStart) ? StringSubstr(resp, msgStart, msgEnd - msgStart) : "Authorized";
        }
        else outMsg = "Authorized";
        return true;
    }

    // Extract denial message
    int msgStart = StringFind(resp, "\"message\":");
    if(msgStart >= 0)
    {
        msgStart = StringFind(resp, "\"", msgStart + 10) + 1;
        int msgEnd = StringFind(resp, "\"", msgStart);
        outMsg = (msgEnd > msgStart) ? StringSubstr(resp, msgStart, msgEnd - msgStart) : "License denied";
    }
    else outMsg = "License denied by server";
    return false;
}

//═══════════════════════════════════════════════════════════════════
//  ATR HELPER
//═══════════════════════════════════════════════════════════════════
// Returns current ATR value in price units (not pips)
double GetATRValue()
{
    if(g_hATR_entry == INVALID_HANDLE) return 0;
    double buf[];
    ArraySetAsSeries(buf, true);
    if(CopyBuffer(g_hATR_entry, 0, 0, 3, buf) < 2) return 0;
    return buf[1]; // use previous closed bar ATR
}

// Returns ATR-based SL in price units
double GetATRSL()
{
    if(!InpUseATR) return PipsToPrice(InpSLPips);
    double atr = GetATRValue();
    if(atr <= 0) return PipsToPrice(InpSLPips);
    return atr * InpATRSLMult;
}

// Returns ATR-based TP in price units
double GetATRTP()
{
    if(!InpUseATR) return PipsToPrice((InpRiskReward > 0) ? InpSLPips * InpRiskReward : InpTPPips);
    double atr = GetATRValue();
    if(atr <= 0) return PipsToPrice((InpRiskReward > 0) ? InpSLPips * InpRiskReward : InpTPPips);
    return atr * InpATRTPMult;
}

// Returns current ATR in pips (for display)
double GetATRPips()
{
    double atr = GetATRValue();
    return (atr > 0) ? atr / PipPoint() : InpSLPips;
}

//═══════════════════════════════════════════════════════════════════
//  CANDLE PATTERN ENGINE
//═══════════════════════════════════════════════════════════════════
// bar=1 means the last CLOSED bar (confirmed)
CandleInfo GetCandlePattern(int bar = 1)
{
    CandleInfo c;
    ENUM_TIMEFRAMES tf = (ENUM_TIMEFRAMES)InpEntryTF;

    double O[], H[], L[], C[], pO[], pH[], pL[], pC[];
    ArraySetAsSeries(O, true); ArraySetAsSeries(H, true);
    ArraySetAsSeries(L, true); ArraySetAsSeries(C, true);
    ArraySetAsSeries(pO,true); ArraySetAsSeries(pH,true);
    ArraySetAsSeries(pL,true); ArraySetAsSeries(pC,true);

    if(CopyOpen (_Symbol,tf,0,bar+2,O) < bar+1 ||
        CopyHigh (_Symbol,tf,0,bar+2,H) < bar+1 ||
        CopyLow  (_Symbol,tf,0,bar+2,L) < bar+1 ||
        CopyClose(_Symbol,tf,0,bar+2,C) < bar+1)
    {
        ZeroMemory(c); return c;
    }

    // Current bar (last closed)
    c.open  = O[bar]; c.high = H[bar];
    c.low   = L[bar]; c.close = C[bar];

    c.body       = MathAbs(c.close - c.open);
    c.totalRange = c.high - c.low;
    c.bodyPct    = (c.totalRange > 0) ? (c.body / c.totalRange * 100.0) : 0;
    c.upperWick  = c.high - MathMax(c.open, c.close);
    c.lowerWick  = MathMin(c.open, c.close) - c.low;
    c.isBullish  = (c.close > c.open);
    c.isBearish  = (c.close < c.open);

    // ── PIN BAR ──
    // Bullish pin bar (hammer): large lower wick, small body at top
    if(InpAllowPinBar && c.body > 0)
    {
        c.isPinBarBull = c.isBullish &&
                       (c.lowerWick >= c.body * InpPinBarRatio) &&
                       (c.upperWick <= c.body * 0.5);
        c.isPinBarBear = c.isBearish &&
                       (c.upperWick >= c.body * InpPinBarRatio) &&
                       (c.lowerWick <= c.body * 0.5);
    }

    // ── ENGULFING ──
    if(InpAllowEngulfing && bar+1 < ArraySize(O))
    {
        double prevBody = MathAbs(C[bar+1] - O[bar+1]);
        bool prevBull = (C[bar+1] > O[bar+1]);
        bool prevBear = (C[bar+1] < O[bar+1]);
        // Bullish engulfing: current bull candle body fully covers previous bear body
        c.isEngulfBull = c.isBullish && prevBear &&
                        (c.open  <= C[bar+1]) &&
                        (c.close >= O[bar+1]) &&
                        (c.body  >= prevBody * 1.1);
        // Bearish engulfing
        c.isEngulfBear = c.isBearish && prevBull &&
                        (c.open  >= C[bar+1]) &&
                        (c.close <= O[bar+1]) &&
                        (c.body  >= prevBody * 1.1);
    }

    // ── MOMENTUM CANDLE ──
    if(InpAllowMomentum)
    {
        c.isMomentumBull = c.isBullish && (c.bodyPct >= InpMinBodyPct);
        c.isMomentumBear = c.isBearish && (c.bodyPct >= InpMinBodyPct);
    }

    return c;
}

// Returns true if candle confirms the given direction (+1 buy, -1 sell)
bool CandleConfirms(int direction)
{
    if(!InpUseCandleFilter) return true;
    CandleInfo c = GetCandlePattern(1);

    bool bull = (c.isPinBarBull || c.isEngulfBull || c.isMomentumBull);
    bool bear = (c.isPinBarBear || c.isEngulfBear || c.isMomentumBear);

    if(direction == 1  && bull) return true;
    if(direction == -1 && bear) return true;

    string pType = "none";
    if(c.isPinBarBull || c.isPinBarBear) pType = "pin";
    else if(c.isEngulfBull || c.isEngulfBear) pType = "engulf";
    else if(c.isMomentumBull || c.isMomentumBear) pType = "momentum";

    Print(StringFormat("[APEX] Candle: no confirmation | dir=%d body=%.1f%% type=%s bull=%s bear=%s",
            direction, c.bodyPct, pType,
            bull ? "Y" : "N", bear ? "Y" : "N"));
    return false;
}

//═══════════════════════════════════════════════════════════════════
//  INDICATOR HANDLE INIT
//═══════════════════════════════════════════════════════════════════
bool InitIndicators()
{
    ENUM_TIMEFRAMES entryTF = (ENUM_TIMEFRAMES)InpEntryTF;
    ENUM_TIMEFRAMES biasTF  = (ENUM_TIMEFRAMES)InpBiasTF;

    g_hEMA9_entry  = iMA(_Symbol, entryTF, InpEMA9Period,  0, MODE_EMA, PRICE_CLOSE);
    g_hEMA15_entry = iMA(_Symbol, entryTF, InpEMA15Period, 0, MODE_EMA, PRICE_CLOSE);
    g_hEMA20_entry = iMA(_Symbol, entryTF, InpEMA20Period, 0, MODE_EMA, PRICE_CLOSE);
    g_hEMA50_entry = iMA(_Symbol, entryTF, InpEMA50Period, 0, MODE_EMA, PRICE_CLOSE);

    g_hEMA9_bias   = iMA(_Symbol, biasTF,  InpEMA9Period,  0, MODE_EMA, PRICE_CLOSE);
    g_hEMA15_bias  = iMA(_Symbol, biasTF,  InpEMA15Period, 0, MODE_EMA, PRICE_CLOSE);
    g_hEMA20_bias  = iMA(_Symbol, biasTF,  InpEMA20Period, 0, MODE_EMA, PRICE_CLOSE);
    g_hEMA50_bias  = iMA(_Symbol, biasTF,  InpEMA50Period, 0, MODE_EMA, PRICE_CLOSE);

    g_hATR_entry   = iATR(_Symbol, entryTF, InpATRPeriod);

    if(g_hEMA9_entry  == INVALID_HANDLE || g_hEMA15_entry == INVALID_HANDLE ||
        g_hEMA20_entry == INVALID_HANDLE || g_hEMA50_entry == INVALID_HANDLE ||
        g_hEMA9_bias   == INVALID_HANDLE || g_hEMA15_bias  == INVALID_HANDLE ||
        g_hEMA20_bias  == INVALID_HANDLE || g_hEMA50_bias  == INVALID_HANDLE ||
        g_hATR_entry   == INVALID_HANDLE)
    {
        Print("[APEX] ERROR: Failed to create indicator handles. Error=", GetLastError());
        return false;
    }
    return true;
}

void DeinitIndicators()
{
    int handles[] = {
                        g_hEMA9_entry, g_hEMA15_entry, 
                        g_hEMA20_entry, g_hEMA50_entry, 
                        g_hEMA9_bias,  g_hEMA15_bias,  
                        g_hEMA20_bias,  g_hEMA50_bias, 
                        g_hATR_entry
                    };
    for(int i = 0; i < 9; i++)
    {
        if(handles[i] != INVALID_HANDLE) IndicatorRelease(handles[i]);
    }
}

//═══════════════════════════════════════════════════════════════════
//  MA ENGINE
//═══════════════════════════════════════════════════════════════════
double GetMA(int handle, int bar = 1) 
{
    double buf[];
    ArraySetAsSeries(buf, true);
    if(CopyBuffer(handle, 0, 0, bar + 2, buf) < bar + 1) return EMPTY_VALUE;
    return buf[bar];
}

MAState GetMAState(bool useEntry)
{
   MAState s;
   s.ema9  = useEntry ? GetMA(g_hEMA9_entry)  : GetMA(g_hEMA9_bias);
   s.ema15 = useEntry ? GetMA(g_hEMA15_entry) : GetMA(g_hEMA15_bias);
   s.ema20 = useEntry ? GetMA(g_hEMA20_entry) : GetMA(g_hEMA20_bias);
   s.ema50 = useEntry ? GetMA(g_hEMA50_entry) : GetMA(g_hEMA50_bias);

   if(s.ema9 == EMPTY_VALUE || s.ema15 == EMPTY_VALUE ||
      s.ema20 == EMPTY_VALUE || s.ema50 == EMPTY_VALUE)
   {
      s.stackedBull = s.stackedBear = s.aboveFast = s.belowFast = false;
      return s;
   }

   s.stackedBull = (s.ema9 > s.ema15 && s.ema15 > s.ema20 && s.ema20 > s.ema50);
   s.stackedBear = (s.ema9 < s.ema15 && s.ema15 < s.ema20 && s.ema20 < s.ema50);

   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   s.aboveFast = (bid > s.ema9);
   s.belowFast = (bid < s.ema9);
   return s;
}

// Returns +1 (bullish), -1 (bearish), 0 (no signal)
int GetMASignal()
{
   MAState entry = GetMAState(true);
   MAState bias  = GetMAState(false);

   if(entry.ema9 == EMPTY_VALUE)
   {
      Print("[APEX] MA: entry EMA data not ready yet");
      return 0;
   }

   bool entryBull = InpRequireFullStack ? entry.stackedBull : (entry.ema9 > entry.ema50);
   bool entryBear = InpRequireFullStack ? entry.stackedBear : (entry.ema9 < entry.ema50);

   // HTF bias: price must be above EMA50 (bull) or below EMA50 (bear) on bias TF
   // Also require EMA9 > EMA20 for additional confluence
   double biasBid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   bool biasBull = true, biasBear = true;
   if(InpRequireHTFAlign && bias.ema50 != EMPTY_VALUE)
   {
      biasBull = (biasBid > bias.ema50) && (bias.ema9 > bias.ema20);
      biasBear = (biasBid < bias.ema50) && (bias.ema9 < bias.ema20);
   }

   if(entryBull && biasBull) return 1;
   if(entryBear && biasBear) return -1;

   // Log why signal is 0 (throttled to once per minute)
   static datetime lastLogTime = 0;
   if(TimeCurrent() - lastLogTime >= 60)
   {
      lastLogTime = TimeCurrent();
      Print(StringFormat(
         "[APEX] MA no signal | E9=%.5f E50=%.5f | entryBull=%s entryBear=%s | HTF_bull=%s HTF_bear=%s | bid=%.5f bias50=%.5f",
         entry.ema9, entry.ema50,
         entryBull ? "Y":"N", entryBear ? "Y":"N",
         biasBull  ? "Y":"N", biasBear  ? "Y":"N",
         biasBid, bias.ema50
      ));
   }
   return 0;
}

//═══════════════════════════════════════════════════════════════════
//  LIQUIDITY ENGINE
//═══════════════════════════════════════════════════════════════════
bool IsLocalHigh(int bar, const double &high[], int strength)
{
   for(int i = 1; i <= strength; i++)
      if(high[bar] <= high[bar - i] || high[bar] <= high[bar + i]) return false;
   return true;
}

bool IsLocalLow(int bar, const double &low[], int strength)
{
   for(int i = 1; i <= strength; i++)
      if(low[bar] >= low[bar - i] || low[bar] >= low[bar + i]) return false;
   return true;
}

void ScanLiquidityZones()
{
   ENUM_TIMEFRAMES tf = (ENUM_TIMEFRAMES)InpEntryTF;
   int lookback = InpSwingLookback + InpSwingStrength * 2;

   double high[], low[];
   datetime times[];
   ArraySetAsSeries(high,  true);
   ArraySetAsSeries(low,   true);
   ArraySetAsSeries(times, true);

   if(CopyHigh(_Symbol, tf, 0, lookback, high)  < lookback) return;
   if(CopyLow (_Symbol, tf, 0, lookback, low)   < lookback) return;
   if(CopyTime(_Symbol, tf, 0, lookback, times) < lookback) return;

   g_zoneCount = 0;
   int str = InpSwingStrength;

   for(int i = str; i < lookback - str && g_zoneCount < MAX_LIQ_ZONES; i++)
   {
      if(IsLocalHigh(i, high, str))
      {
         g_zones[g_zoneCount].price    = high[i];
         g_zones[g_zoneCount].isHigh   = true;
         g_zones[g_zoneCount].formed   = times[i];
         g_zones[g_zoneCount].swept    = false;
         g_zones[g_zoneCount].reversed = false;
         g_zones[g_zoneCount].touchCount = 1;
         g_zoneCount++;
      }
      else if(IsLocalLow(i, low, str))
      {
         g_zones[g_zoneCount].price    = low[i];
         g_zones[g_zoneCount].isHigh   = false;
         g_zones[g_zoneCount].formed   = times[i];
         g_zones[g_zoneCount].swept    = false;
         g_zones[g_zoneCount].reversed = false;
         g_zones[g_zoneCount].touchCount = 1;
         g_zoneCount++;
      }
   }
}

// Detects if current bar has swept a zone — returns zone index or -1
// direction: +1 check bearish sweeps (high pools swept up, then reverse down)
//            -1 check bullish sweeps (low pools swept down, then reverse up)
int DetectSweep(int direction)
{
   double bid   = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask   = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double sweep = PipsToPrice(InpSweepPips);

   ENUM_TIMEFRAMES tf = (ENUM_TIMEFRAMES)InpEntryTF;
   double curHigh[], curLow[];
   ArraySetAsSeries(curHigh, true); ArraySetAsSeries(curLow, true);
   if(CopyHigh(_Symbol, tf, 0, 2, curHigh) < 2) return -1;
   if(CopyLow (_Symbol, tf, 0, 2, curLow)  < 2) return -1;

   for(int i = 0; i < g_zoneCount; i++)
   {
      if(g_zones[i].swept) continue;

      if(direction == -1 && !g_zones[i].isHigh) // Looking for low sweeps (buy setup)
      {
         // Price dipped below zone by >= sweepPips then current close > zone
         double sweepLevel = g_zones[i].price - sweep;
         if(curLow[1] <= sweepLevel && bid > g_zones[i].price)
         {
            g_zones[i].swept = true;
            return i;
         }
      }
      else if(direction == 1 && g_zones[i].isHigh) // Looking for high sweeps (sell setup)
      {
         double sweepLevel = g_zones[i].price + sweep;
         if(curHigh[1] >= sweepLevel && bid < g_zones[i].price)
         {
            g_zones[i].swept = true;
            return i;
         }
      }
   }
   return -1;
}

// Confirm reversal: candle close must be back past zone by reversalPips
bool ConfirmReversal(int zoneIdx, bool buySetup)
{
   if(zoneIdx < 0 || zoneIdx >= g_zoneCount) return false;
   ENUM_TIMEFRAMES tf = (ENUM_TIMEFRAMES)InpEntryTF;

   double close1[];
   ArraySetAsSeries(close1, true);
   if(CopyClose(_Symbol, tf, 0, 2, close1) < 2) return false;

   double rev = PipsToPrice(InpReversalPips);
   if(buySetup)  return (close1[1] > g_zones[zoneIdx].price + rev);
   else          return (close1[1] < g_zones[zoneIdx].price - rev);
}

//═══════════════════════════════════════════════════════════════════
//  LIQUIDITY-FIRST: ZONE PROXIMITY ENGINE
//═══════════════════════════════════════════════════════════════════
// ── Core concept ──
//  Instead of waiting for a full sweep (price spikes through a zone and comes back),
//  we detect when price APPROACHES a zone within InpZoneProximity pips.
//  The zone acts as a magnet: price will either reject from it (fade trade)
//  or break through it (sweep trade). We trade the REJECTION.
//
//  SELL setup: price approaching a HIGH zone from below → sell fade
//  BUY setup:  price approaching a LOW zone from above → buy fade
//
// Returns zone index for a SELL proximity (approaching resistance), or -1
int DetectResistanceProximity()
{
   double bid     = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double prox    = PipsToPrice(InpZoneProximity);
   int    bestIdx = -1;
   double bestDist = DBL_MAX;

   for(int i = 0; i < g_zoneCount; i++)
   {
      if(g_zones[i].swept)   continue;  // already consumed
      if(!g_zones[i].isHigh) continue;  // only resistance zones for sell

      double dist = g_zones[i].price - bid; // positive = zone is above current price
      if(dist >= 0 && dist <= prox)         // price is below zone but within proximity
      {
         if(dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
   }
   if(bestIdx >= 0)
      Print(StringFormat("[APEX] Resistance zone proximity: zone=%.5f bid=%.5f dist=%.1f pips",
            g_zones[bestIdx].price, bid, bestDist/PipPoint()));
   return bestIdx;
}

// Returns zone index for a BUY proximity (approaching support), or -1
int DetectSupportProximity()
{
   double bid     = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double prox    = PipsToPrice(InpZoneProximity);
   int    bestIdx = -1;
   double bestDist = DBL_MAX;

   for(int i = 0; i < g_zoneCount; i++)
   {
      if(g_zones[i].swept)  continue;   // already consumed
      if(g_zones[i].isHigh) continue;   // only support zones for buy

      double dist = bid - g_zones[i].price; // positive = zone is below current price
      if(dist >= 0 && dist <= prox)          // price is above zone but within proximity
      {
         if(dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
   }
   if(bestIdx >= 0)
      Print(StringFormat("[APEX] Support zone proximity: zone=%.5f bid=%.5f dist=%.1f pips",
            g_zones[bestIdx].price, bid, bestDist/PipPoint()));
   return bestIdx;
}

// Mark a zone as touched (swept) once we trade from it
void MarkZoneTouched(int idx)
{
   if(idx < 0 || idx >= g_zoneCount) return;
   g_zones[idx].swept = true;
   g_zones[idx].touchCount++;
}

// Check for Bearish CHoCH (Change of Character)
// Defined as: price breaks below the most recent Swing Low.
bool IsBearishChoCh()
{
   double recentLow = -1;
   for(int i = 0; i < g_zoneCount; i++)
   {
      if(!g_zones[i].isHigh)
      {
         recentLow = g_zones[i].price;
         break;
      }
   }
   if(recentLow == -1) return false;
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   return (bid < recentLow);
}

// Check for Bullish CHoCH (Change of Character)
// Defined as: price breaks above the most recent Swing High.
bool IsBullishChoCh()
{
   double recentHigh = -1;
   for(int i = 0; i < g_zoneCount; i++)
   {
      if(g_zones[i].isHigh)
      {
         recentHigh = g_zones[i].price;
         break;
      }
   }
   if(recentHigh == -1) return false;
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   return (ask > recentHigh);
}

// Draw liquidity zones on chart
void DrawLiquidityZones()
{
   // Clear old zone objects
   for(int k = 0; k < MAX_LIQ_ZONES; k++)
   {
      string name = PANEL_PREFIX + "ZONE_" + IntegerToString(k);
      if(ObjectFind(0, name) >= 0) ObjectDelete(0, name);
   }

   if(!InpDrawZones) return;

   for(int i = 0; i < g_zoneCount; i++)
   {
      string name = PANEL_PREFIX + "ZONE_" + IntegerToString(i);
      color  clr  = g_zones[i].isHigh ? TN_RED : TN_GREEN;
      if(g_zones[i].swept) clr = TN_MUTED;

      ObjectCreate(0, name, OBJ_HLINE, 0, 0, g_zones[i].price);
      ObjectSetInteger(0, name, OBJPROP_COLOR,      clr);
      ObjectSetInteger(0, name, OBJPROP_STYLE,      STYLE_DASH);
      ObjectSetInteger(0, name, OBJPROP_WIDTH,      1);
      ObjectSetInteger(0, name, OBJPROP_BACK,       true);
      ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, name, OBJPROP_HIDDEN,     true);
      ObjectSetString (0, name, OBJPROP_TOOLTIP,
                       (g_zones[i].isHigh ? "Resistance Pool" : "Support Pool") +
                       (g_zones[i].swept ? " [SWEPT]" : ""));
   }
   ChartRedraw(0);
}

//═══════════════════════════════════════════════════════════════════
//  ORDER FLOW ENGINE
//═══════════════════════════════════════════════════════════════════
// Returns net delta: positive = buy pressure, negative = sell pressure
double GetOrderFlowDelta()
{
   MqlBookInfo book[];
   if(!MarketBookGet(_Symbol, book)) return 0;

   double buyVol = 0, sellVol = 0;
   for(int i = 0; i < ArraySize(book); i++)
   {
      if(book[i].type == BOOK_TYPE_BUY || book[i].type == BOOK_TYPE_BUY_MARKET)
         buyVol += (double)book[i].volume;
      else if(book[i].type == BOOK_TYPE_SELL || book[i].type == BOOK_TYPE_SELL_MARKET)
         sellVol += (double)book[i].volume;
   }
   return buyVol - sellVol;
}

bool OrderFlowConfirms(int direction)
{
   if(!InpUseOrderFlow) return true;  // filter disabled — always pass

   double delta = GetOrderFlowDelta();

   // If book is unavailable or empty, pass through (don't block trading)
   if(delta == 0)
   {
      Print("[APEX] OrderFlow: book unavailable or zero delta — passing through");
      return true;
   }

   bool ok = false;
   if(direction == 1)  ok = (delta > 0);
   if(direction == -1) ok = (delta < 0);

   if(!ok)
      Print(StringFormat("[APEX] OrderFlow: blocked dir=%d delta=%.2f", direction, delta));

   return ok;
}

//═══════════════════════════════════════════════════════════════════
//  RISK MANAGER
//═══════════════════════════════════════════════════════════════════
double CalcLotSize(double slPips)
{
   double balance  = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity   = AccountInfoDouble(ACCOUNT_EQUITY);
   double tickVal  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double minLot   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double lotStep  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   double riskPips = (slPips <= 0) ? InpSLPips : slPips;
   double lots     = InpFixedLot;

   if(InpRiskMode == RISK_PCT_BALANCE)
   {
      double riskAmt  = balance * (g_currentRisk / 100.0);
      double pipValue = tickVal / tickSize * PipPoint();
      lots = (pipValue > 0 && riskPips > 0) ? riskAmt / (riskPips * pipValue) : InpFixedLot;
   }
   else if(InpRiskMode == RISK_PCT_EQUITY)
   {
      double riskAmt  = equity * (g_currentRisk / 100.0);
      double pipValue = tickVal / tickSize * PipPoint();
      lots = (pipValue > 0 && riskPips > 0) ? riskAmt / (riskPips * pipValue) : InpFixedLot;
   }
   else if(InpRiskMode == RISK_FIXED_MONEY)
   {
      double pipValue = tickVal / tickSize * PipPoint();
      lots = (pipValue > 0 && riskPips > 0) ? InpRiskMoney / (riskPips * pipValue) : InpFixedLot;
   }

   lots = MathMax(InpMinLot, MathMin(InpMaxLot, lots));
   lots = MathMax(minLot, MathMin(maxLot, lots));
   lots = MathFloor(lots / lotStep) * lotStep;
   return NormalizeDouble(lots, 2);
}

bool CheckDailyLimits()
{
   double balance  = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity   = AccountInfoDouble(ACCOUNT_EQUITY);
   double dayPL    = AccountInfoDouble(ACCOUNT_PROFIT); // approx daily if started same session

   // Equity floor check
   double eqPct = (g_dayStartBalance > 0) ? (equity / g_dayStartBalance * 100.0) : 100.0;
   if(eqPct <= InpEquityFloor)
   {
      g_haltTrading = true;
      g_haltReason  = StringFormat("Equity floor hit (%.1f%% of day start)", eqPct);
      Print("[APEX] EMERGENCY: ", g_haltReason);
      CloseAllPositions("EQUITY_FLOOR");
      return false;
   }

   // Daily max loss
   double dailyLoss = g_dayStartBalance - equity;
   double lossPct   = (g_dayStartBalance > 0) ? (dailyLoss / g_dayStartBalance * 100.0) : 0;
   if(lossPct >= InpDailyMaxLoss && dailyLoss > 0)
   {
      g_haltTrading = true;
      g_haltReason  = StringFormat("Daily max loss hit (%.1f%%)", lossPct);
      Print("[APEX] HALT: ", g_haltReason);
      return false;
   }

   // Max daily trades
   if(g_dailyTradeCount >= (int)InpMaxDailyTrades)
   {
      g_haltReason = "Max daily trades reached";
      return false;
   }

   return true;
}

//═══════════════════════════════════════════════════════════════════
//  COMPOUNDING ENGINE
//═══════════════════════════════════════════════════════════════════
void BuildCompoundSteps()
{
   g_compStepCount = 0;
   if(InpCompound == COMPOUND_OFF) { g_currentRisk = InpRiskPercent; return; }

   // Build logarithmic steps from start to target
   double from = InpStartBalance;
   double to   = InpTargetBalance;
   double multiplier = 2.5; // each step roughly 2.5× balance

   double bal = from;
   double risk = InpRiskPercent;
   double maxRisk = (InpCompound == COMPOUND_AGGRESSIVE) ? 5.0 : 3.0;

   while(bal < to && g_compStepCount < 10)
   {
      g_compSteps[g_compStepCount].fromBalance = bal;
      double nextBal = MathMin(bal * multiplier, to);
      g_compSteps[g_compStepCount].toBalance   = nextBal;
      g_compSteps[g_compStepCount].riskPct     = MathMin(risk, maxRisk);
      g_compSteps[g_compStepCount].label       = StringFormat("$%.0f→$%.0f @%.1f%%", bal, nextBal, risk);
      g_compStepCount++;
      bal  = nextBal;
      risk = MathMin(risk + 0.5, maxRisk);
   }
   UpdateCompoundRisk();
}

void UpdateCompoundRisk()
{
   if(InpCompound == COMPOUND_OFF) { g_currentRisk = InpRiskPercent; return; }
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   g_currentRisk = InpRiskPercent;
   for(int i = 0; i < g_compStepCount; i++)
   {
      if(balance >= g_compSteps[i].fromBalance && balance < g_compSteps[i].toBalance)
      {
         g_currentRisk = g_compSteps[i].riskPct;
         return;
      }
   }
   // Above last step
   if(g_compStepCount > 0) g_currentRisk = g_compSteps[g_compStepCount - 1].riskPct;
}

//═══════════════════════════════════════════════════════════════════
//  SESSION FILTER
//═══════════════════════════════════════════════════════════════════
void ParseHHMM(const string timeStr, int &h, int &m)
{
   h = 0; m = 0;
   int col = StringFind(timeStr, ":");
   if(col > 0) { h = (int)StringToInteger(StringSubstr(timeStr, 0, col)); m = (int)StringToInteger(StringSubstr(timeStr, col+1)); }
   else h = (int)StringToInteger(timeStr);
}

bool IsInSession()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);

   // Day of week filter
   switch(dt.day_of_week)
   {
      case 0: return false;
      case 1: if(!InpTradeMonday)    return false; break;
      case 2: if(!InpTradeTuesday)   return false; break;
      case 3: if(!InpTradeWednesday) return false; break;
      case 4: if(!InpTradeThursday)  return false; break;
      case 5: if(!InpTradeFriday)    return false; break;
      case 6: return false;
   }

   int sh, sm, eh, em;
   ParseHHMM(InpSessionStart, sh, sm);
   ParseHHMM(InpSessionEnd,   eh, em);

   int nowMin   = dt.hour * 60 + dt.min;
   int startMin = sh * 60 + sm;
   int endMin   = eh * 60 + em;

   if(startMin < endMin) return (nowMin >= startMin && nowMin < endMin);
   else                  return (nowMin >= startMin || nowMin < endMin);
}

bool IsFridayClose()
{
   if(!InpCloseFriday) return false;
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   if(dt.day_of_week != 5) return false;
   int eh, em; ParseHHMM(InpSessionEnd, eh, em);
   int nowMin = dt.hour * 60 + dt.min;
   int endMin = eh * 60 + em;
   return (nowMin >= endMin);
}

bool IsSpreadOK()
{
   if(InpMaxSpread <= 0) return true;
   return ((int)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) <= InpMaxSpread);
}

//═══════════════════════════════════════════════════════════════════
//  POSITION MANAGEMENT HELPERS
//═══════════════════════════════════════════════════════════════════
int CountPositions(int magic, int type = -1)
{
   int cnt = 0;
   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if((int)PositionGetInteger(POSITION_MAGIC) != magic) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(type >= 0 && (int)PositionGetInteger(POSITION_TYPE) != type) continue;
      cnt++;
   }
   return cnt;
}

double TotalFloatingProfit(int magic)
{
   double total = 0;
   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if((int)PositionGetInteger(POSITION_MAGIC) != magic) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      total += PositionGetDouble(POSITION_PROFIT) + PositionGetDouble(POSITION_SWAP);
   }
   return total;
}

void CloseAllPositions(string tag)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(!g_trade.PositionClose(tk)) Print("[APEX] Close ", tag, " ticket=", tk, " err=", GetLastError());
   }
}

void CancelAllPending()
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      ulong tk = OrderGetTicket(i);
      if(tk == 0) continue;
      if(OrderGetString(ORDER_SYMBOL) != _Symbol) continue;
      if((int)OrderGetInteger(ORDER_MAGIC) != InpMagicNumber) continue;
      g_trade.OrderDelete(tk);
   }
}

double GetPositionSL(ulong ticket)
{
   if(!PositionSelectByTicket(ticket)) return 0;
   return PositionGetDouble(POSITION_SL);
}

double GetPositionOpenPrice(ulong ticket)
{
   if(!PositionSelectByTicket(ticket)) return 0;
   return PositionGetDouble(POSITION_PRICE_OPEN);
}

//═══════════════════════════════════════════════════════════════════
//  TRADE EXECUTOR
//═══════════════════════════════════════════════════════════════════
ulong OpenMarket(int type, double lots, double sl, double tp, string comment = "")
{
   g_trade.SetExpertMagicNumber(InpMagicNumber);
   g_trade.SetDeviationInPoints((ulong)PipsToPoints(1.5));
   g_trade.SetTypeFillingBySymbol(_Symbol);

   if(comment == "") comment = InpTradeComment;
   bool res = false;

   if(type == ORDER_TYPE_BUY)
   {
      double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double slPrice = (sl > 0) ? sl : (ask - PipsToPrice(InpSLPips));
      double tpPrice = (tp > 0) ? tp : (ask + PipsToPrice((InpRiskReward > 0) ? InpSLPips * InpRiskReward : InpTPPips));
      res = g_trade.Buy(lots, _Symbol, ask, slPrice, tpPrice, comment);
   }
   else if(type == ORDER_TYPE_SELL)
   {
      double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      double slPrice = (sl > 0) ? sl : (bid + PipsToPrice(InpSLPips));
      double tpPrice = (tp > 0) ? tp : (bid - PipsToPrice((InpRiskReward > 0) ? InpSLPips * InpRiskReward : InpTPPips));
      res = g_trade.Sell(lots, _Symbol, bid, slPrice, tpPrice, comment);
   }

   if(!res)
   {
      Print("[APEX] OpenMarket FAILED type=", type, " lots=", lots, " err=", GetLastError(), " ret=", g_trade.ResultRetcode());
      return 0;
   }
   g_dailyTradeCount++;
   return g_trade.ResultDeal();
}

ulong PlaceStopOrder(int type, double lots, double price, double sl, double tp, string comment = "")
{
   g_trade.SetExpertMagicNumber(InpMagicNumber);
   g_trade.SetTypeFillingBySymbol(_Symbol);
   if(comment == "") comment = InpTradeComment;

   bool res = false;
   if(type == ORDER_TYPE_BUY_STOP)
      res = g_trade.BuyStop(lots, price, _Symbol, sl, tp, ORDER_TIME_GTC, 0, comment);
   else if(type == ORDER_TYPE_SELL_STOP)
      res = g_trade.SellStop(lots, price, _Symbol, sl, tp, ORDER_TIME_GTC, 0, comment);

   if(!res) Print("[APEX] PlaceStopOrder FAILED err=", GetLastError());
   return g_trade.ResultOrder();
}

void ModifyPositionSLTP(ulong ticket, double sl, double tp)
{
   if(!PositionSelectByTicket(ticket)) return;
   if(!g_trade.PositionModify(ticket, sl, tp))
      Print("[APEX] Modify FAILED ticket=", ticket, " err=", GetLastError());
}

//═══════════════════════════════════════════════════════════════════
//  TRAILING STOP, BREAKEVEN & STEP-LOCK
//  3-Stage Profit Protection:
//    Stage 1 — Breakeven: once profit ≥ InpBreakevenPips, move SL to open
//    Stage 2 — 1R Lock: once profit ≥ 1×SL distance, lock SL at +5 pips profit
//    Stage 3 — Step Trail: every InpStepTrailPips gained, advance SL by same amount
//═══════════════════════════════════════════════════════════════════
void ManageTrailingAndBE()
{
   double pip        = PipPoint();
   double bePips     = InpBreakevenPips * pip;
   double trailStart = InpTrailStart    * pip;
   double trailDist  = InpTrailDistance * pip;
   double stepPips   = InpStepTrailPips * pip;
   double lockBump   = 5.0 * pip; // +5 pips profit lock at 1R

   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if((int)PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;

      double openPx    = PositionGetDouble(POSITION_PRICE_OPEN);
      double curSL     = PositionGetDouble(POSITION_SL);
      double curTP     = PositionGetDouble(POSITION_TP);
      double oneSLDist = MathAbs(curTP > 0 ? (curTP - openPx) / (InpRiskReward > 0 ? InpRiskReward : 2.5) : GetATRSL());
      long   posType   = PositionGetInteger(POSITION_TYPE);

      if(posType == POSITION_TYPE_BUY)
      {
         double bid    = SymbolInfoDouble(_Symbol, SYMBOL_BID);
         double profit = bid - openPx;

         // Stage 1: Breakeven
         if(bePips > 0 && profit >= bePips && curSL < openPx - _Point)
         {
            double newSL = NormalizeDouble(openPx + _Point, _Digits);
            Print(StringFormat("[APEX] BE lock BUY tk=%I64u profit=%.1f pips", tk, profit/pip));
            ModifyPositionSLTP(tk, newSL, curTP);
            curSL = newSL;
         }

         // Stage 2: 1R Lock — move SL to open + lockBump once 1:1 RR profit reached
         if(InpLockAtOneR && oneSLDist > 0 && profit >= oneSLDist)
         {
            double lockSL = NormalizeDouble(openPx + lockBump, _Digits);
            if(lockSL > curSL)
            {
               Print(StringFormat("[APEX] 1R LOCK BUY tk=%I64u SL→%.5f", tk, lockSL));
               ModifyPositionSLTP(tk, lockSL, curTP);
               curSL = lockSL;
            }
         }

         // Stage 3: Step Trail — advance SL every stepPips above breakeven
         if(stepPips > 0 && curSL >= openPx)
         {
            double profitAboveBE = bid - openPx;
            int steps = (int)MathFloor(profitAboveBE / stepPips);
            if(steps > 0)
            {
               double stepSL = NormalizeDouble(openPx + (steps - 1) * stepPips, _Digits);
               if(stepSL > curSL + _Point)
               {
                  Print(StringFormat("[APEX] STEP TRAIL BUY tk=%I64u steps=%d SL→%.5f", tk, steps, stepSL));
                  ModifyPositionSLTP(tk, stepSL, curTP);
                  curSL = stepSL;
               }
            }
         }

         // Classic trailing (final safety net)
         if(InpUseTrailingStop && profit >= trailStart)
         {
            double newSL = NormalizeDouble(bid - trailDist, _Digits);
            if(newSL > curSL)
               ModifyPositionSLTP(tk, newSL, curTP);
         }
      }
      else if(posType == POSITION_TYPE_SELL)
      {
         double ask    = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         double profit = openPx - ask;

         // Stage 1: Breakeven
         if(bePips > 0 && profit >= bePips && (curSL > openPx + _Point || curSL == 0))
         {
            double newSL = NormalizeDouble(openPx - _Point, _Digits);
            Print(StringFormat("[APEX] BE lock SELL tk=%I64u profit=%.1f pips", tk, profit/pip));
            ModifyPositionSLTP(tk, newSL, curTP);
            curSL = newSL;
         }

         // Stage 2: 1R Lock
         if(InpLockAtOneR && oneSLDist > 0 && profit >= oneSLDist)
         {
            double lockSL = NormalizeDouble(openPx - lockBump, _Digits);
            if(curSL == 0 || lockSL < curSL)
            {
               Print(StringFormat("[APEX] 1R LOCK SELL tk=%I64u SL→%.5f", tk, lockSL));
               ModifyPositionSLTP(tk, lockSL, curTP);
               curSL = lockSL;
            }
         }

         // Stage 3: Step Trail
         if(stepPips > 0 && (curSL == 0 || curSL <= openPx))
         {
            double profitAboveBE = openPx - ask;
            int steps = (int)MathFloor(profitAboveBE / stepPips);
            if(steps > 0)
            {
               double stepSL = NormalizeDouble(openPx - (steps - 1) * stepPips, _Digits);
               if(curSL == 0 || stepSL < curSL - _Point)
               {
                  Print(StringFormat("[APEX] STEP TRAIL SELL tk=%I64u steps=%d SL→%.5f", tk, steps, stepSL));
                  ModifyPositionSLTP(tk, stepSL, curTP);
                  curSL = stepSL;
               }
            }
         }

         // Classic trailing
         if(InpUseTrailingStop && profit >= trailStart)
         {
            double newSL = NormalizeDouble(ask + trailDist, _Digits);
            if(curSL == 0 || newSL < curSL)
               ModifyPositionSLTP(tk, newSL, curTP);
         }
      }
   }
}

void ManagePartialClose()
{
   if(!InpUsePartialClose) return;
   double halfTP = (InpRiskReward > 0) ? InpSLPips * InpRiskReward * 0.5 * PipPoint() : InpTPPips * 0.5 * PipPoint();

   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if((int)PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;

      double openPx  = PositionGetDouble(POSITION_PRICE_OPEN);
      double lots    = PositionGetDouble(POSITION_VOLUME);
      long   posType = PositionGetInteger(POSITION_TYPE);

      double profit = 0;
      if(posType == POSITION_TYPE_BUY)  profit = SymbolInfoDouble(_Symbol, SYMBOL_BID) - openPx;
      else                               profit = openPx - SymbolInfoDouble(_Symbol, SYMBOL_ASK);

      if(profit >= halfTP && lots >= InpMinLot * 2)
      {
         double closeLots = NormalizeDouble(lots * (InpPartialPct / 100.0), 2);
         double minL = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
         double stepL = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
         closeLots = MathMax(minL, MathFloor(closeLots / stepL) * stepL);
         if(closeLots < lots && closeLots >= minL)
            g_trade.PositionClosePartial(tk, closeLots);
      }
   }
}

//═══════════════════════════════════════════════════════════════════
//  GRID ENGINE
//═══════════════════════════════════════════════════════════════════
void InitGrid(GridState &grid)
{
   grid.level = 0;
   grid.active = false;
   grid.breakEvenPrice = 0;
   for(int i = 0; i < MAX_GRID_LEVELS; i++)
   {
      grid.tickets[i] = 0;
      grid.prices[i]  = 0.0;
      grid.lots[i]    = 0.0;
   }
}

void ManageGrid()
{
   if(InpGridMode == GRID_DISABLED) return;

   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   int totalBuys  = CountPositions(InpMagicNumber, POSITION_TYPE_BUY);
   int totalSells = CountPositions(InpMagicNumber, POSITION_TYPE_SELL);

   // --- BUY GRID ---
   if(totalBuys > 0 && g_gridBuy.level < MathMin(InpGridMaxLevels, MAX_GRID_LEVELS))
   {
      double lastBuyPrice = 0;
      double lastBuyLot   = 0;
      for(int i = 0; i < PositionsTotal(); i++)
      {
         ulong tk = PositionGetTicket(i);
         if(tk == 0) continue;
         if((int)PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;
         if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
         if((int)PositionGetInteger(POSITION_TYPE) != POSITION_TYPE_BUY) continue;
         double px = PositionGetDouble(POSITION_PRICE_OPEN);
         if(px > lastBuyPrice) { lastBuyPrice = px; lastBuyLot = PositionGetDouble(POSITION_VOLUME); }
      }

      if(lastBuyPrice > 0)
      {
         double stepPips = InpGridStep * MathPow(InpGridStepMult, g_gridBuy.level);
         double gridLevel = lastBuyPrice - stepPips * PipPoint();
         if(ask <= gridLevel)
         {
            double newLots = NormalizeDouble(lastBuyLot * InpGridMultiplier, 2);
            newLots = MathMax(InpMinLot, MathMin(InpMaxLot, newLots));
            double sl = ask - PipsToPrice(InpSLPips * (g_gridBuy.level + 2));
            ulong tk = OpenMarket(ORDER_TYPE_BUY, newLots, sl, 0, InpTradeComment + "_G" + IntegerToString(g_gridBuy.level + 1));
            if(tk > 0) { g_gridBuy.level++; g_gridBuy.active = true; }
         }
      }
   }

   // --- SELL GRID ---
   if(totalSells > 0 && g_gridSell.level < MathMin(InpGridMaxLevels, MAX_GRID_LEVELS))
   {
      double lastSellPrice = 0;
      double lastSellLot   = 0;
      for(int i = 0; i < PositionsTotal(); i++)
      {
         ulong tk = PositionGetTicket(i);
         if(tk == 0) continue;
         if((int)PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;
         if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
         if((int)PositionGetInteger(POSITION_TYPE) != POSITION_TYPE_SELL) continue;
         double px = PositionGetDouble(POSITION_PRICE_OPEN);
         if(lastSellPrice == 0 || px < lastSellPrice) { lastSellPrice = px; lastSellLot = PositionGetDouble(POSITION_VOLUME); }
      }

      if(lastSellPrice > 0)
      {
         double stepPips = InpGridStep * MathPow(InpGridStepMult, g_gridSell.level);
         double gridLevel = lastSellPrice + stepPips * PipPoint();
         if(bid >= gridLevel)
         {
            double newLots = NormalizeDouble(lastSellLot * InpGridMultiplier, 2);
            newLots = MathMax(InpMinLot, MathMin(InpMaxLot, newLots));
            double sl = bid + PipsToPrice(InpSLPips * (g_gridSell.level + 2));
            ulong tk = OpenMarket(ORDER_TYPE_SELL, newLots, sl, 0, InpTradeComment + "_G" + IntegerToString(g_gridSell.level + 1));
            if(tk > 0) { g_gridSell.level++; g_gridSell.active = true; }
         }
      }
   }

   // --- Basket Breakeven ---
   double totalPL  = TotalFloatingProfit(InpMagicNumber);
   int    totalPos = CountPositions(InpMagicNumber);
   if(totalPos > 1 && totalPL >= 0)
   {
      // Reset grid levels when all profitable
      if(g_gridBuy.active && totalBuys <= 1)  { InitGrid(g_gridBuy); }
      if(g_gridSell.active && totalSells <= 1) { InitGrid(g_gridSell); }
   }
}

//═══════════════════════════════════════════════════════════════════
//  HEDGE ENGINE
//═══════════════════════════════════════════════════════════════════
void ManageHedge()
{
   if(InpHedgeMode == HEDGE_DISABLED) return;
   double pip = PipPoint();
   double hedgeTrigger = InpHedgeTriggerPips * pip;

   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if((int)PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;

      // Skip if this is already a hedge trade
      string comment = PositionGetString(POSITION_COMMENT);
      if(StringFind(comment, "_HEDGE") >= 0) continue;

      double openPx   = PositionGetDouble(POSITION_PRICE_OPEN);
      double lots     = PositionGetDouble(POSITION_VOLUME);
      long   posType  = PositionGetInteger(POSITION_TYPE);

      double curLoss = 0;
      if(posType == POSITION_TYPE_BUY)
         curLoss = openPx - SymbolInfoDouble(_Symbol, SYMBOL_BID);
      else
         curLoss = SymbolInfoDouble(_Symbol, SYMBOL_ASK) - openPx;

      if(curLoss >= hedgeTrigger)
      {
         // Check if already hedged
         bool alreadyHedged = false;
         for(int j = 0; j < PositionsTotal(); j++)
         {
            ulong tk2 = PositionGetTicket(j);
            if(tk2 == 0) continue;
            if(!PositionSelectByTicket(tk2)) continue;
            string cmt2 = PositionGetString(POSITION_COMMENT);
            if(StringFind(cmt2, "_HEDGE") >= 0)
            {
               alreadyHedged = true;
               break;
            }
         }
         if(alreadyHedged) continue;

         // Open hedge
         double hedgeLots = NormalizeDouble(lots * InpHedgeRatio, 2);
         hedgeLots = MathMax(InpMinLot, MathMin(InpMaxLot, hedgeLots));

         if(posType == POSITION_TYPE_BUY)
         {
            double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
            double slH = bid + PipsToPrice(InpSLPips * 2);
            double tpH = bid - PipsToPrice(InpSLPips * InpRiskReward);
            OpenMarket(ORDER_TYPE_SELL, hedgeLots, slH, tpH, InpTradeComment + "_HEDGE");
         }
         else
         {
            double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
            double slH = ask - PipsToPrice(InpSLPips * 2);
            double tpH = ask + PipsToPrice(InpSLPips * InpRiskReward);
            OpenMarket(ORDER_TYPE_BUY, hedgeLots, slH, tpH, InpTradeComment + "_HEDGE");
         }
      }
   }

   // Auto-unwind hedge if main trade recovers
   if(InpHedgeAutoUnwind)
   {
      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         ulong tk = PositionGetTicket(i);
         if(tk == 0) continue;
         string comment = PositionGetString(POSITION_COMMENT);
         if(StringFind(comment, "_HEDGE") < 0) continue;
         double profit = PositionGetDouble(POSITION_PROFIT);
         if(profit >= 0) g_trade.PositionClose(tk);
      }
   }
}

//═══════════════════════════════════════════════════════════════════
//  TRADING MODE HANDLERS
//═══════════════════════════════════════════════════════════════════

// Shared entry logic after signal confirmation
void ExecuteEntry(int direction, string modeTag, double zonePrice = 0)
{
   Print(StringFormat("[APEX] ExecuteEntry: dir=%d mode=%s halt=%s protect=%s",
         direction, modeTag,
         g_haltTrading ? "YES" : "no",
         g_protectMode ? "YES" : "no"));

   if(g_haltTrading) { Print("[APEX] BLOCKED: haltTrading — ", g_haltReason); return; }
   if(g_protectMode) { Print("[APEX] BLOCKED: protectMode active"); return; }
//    if(!CheckDailyLimits()) { Print("[APEX] BLOCKED: daily limits"); return; }

   int spread = (int)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(!IsSpreadOK())
   {
      Print(StringFormat("[APEX] BLOCKED: spread %d > max %d", spread, InpMaxSpread));
      return;
   }

   double lots = CalcLotSize(InpSLPips);
   Print(StringFormat("[APEX] Placing %s | lots=%.2f | spread=%d | risk=%.1f%% | ATR=%.1f pips",
         direction == 1 ? "BUY" : "SELL", lots, spread, g_currentRisk, GetATRPips()));

   if(direction == 1) // BUY
   {
      double ask  = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double slDist = GetATRSL();
      double tpDist = GetATRTP();
      double sl, tp;
      
      if(InpUseZoneSL && zonePrice > 0)
      {
         sl = NormalizeDouble(zonePrice - PipsToPrice(InpZoneSLBuffer), _Digits);
         // Enforce a minimum SL distance to avoid "invalid stops" error if zone is too close
         if(ask - sl < PipsToPrice(InpMinSLPips)) sl = NormalizeDouble(ask - PipsToPrice(InpMinSLPips), _Digits);
         tp = NormalizeDouble(ask + (ask - sl) * (InpRiskReward > 0 ? InpRiskReward : 1.5), _Digits);
         slDist = ask - sl;
         tpDist = tp - ask;
      }
      else
      {
         sl = NormalizeDouble(ask - slDist, _Digits);
         tp = NormalizeDouble(ask + tpDist, _Digits);
      }

      ulong deal  = OpenMarket(ORDER_TYPE_BUY, lots, sl, tp, InpTradeComment + "_" + modeTag);
      if(deal > 0)
         Print(StringFormat("[APEX] BUY opened: lots=%.2f sl=%.5f (+%.1f pips) tp=%.5f (+%.1f pips) deal=%I64u",
               lots, sl, slDist/PipPoint(), tp, tpDist/PipPoint(), deal));
      else
         Print("[APEX] BUY FAILED — check OpenMarket log above");
      InitGrid(g_gridBuy);
   }
   else // SELL
   {
      double bid  = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      double slDist = GetATRSL();
      double tpDist = GetATRTP();
      double sl, tp;

      if(InpUseZoneSL && zonePrice > 0)
      {
         sl = NormalizeDouble(zonePrice + PipsToPrice(InpZoneSLBuffer), _Digits);
         // Enforce a minimum SL distance
         if(sl - bid < PipsToPrice(InpMinSLPips)) sl = NormalizeDouble(bid + PipsToPrice(InpMinSLPips), _Digits);
         tp = NormalizeDouble(bid - (sl - bid) * (InpRiskReward > 0 ? InpRiskReward : 1.5), _Digits);
         slDist = sl - bid;
         tpDist = bid - tp;
      }
      else
      {
         sl = NormalizeDouble(bid + slDist, _Digits);
         tp = NormalizeDouble(bid - tpDist, _Digits);
      }

      ulong deal  = OpenMarket(ORDER_TYPE_SELL, lots, sl, tp, InpTradeComment + "_" + modeTag);
      if(deal > 0)
         Print(StringFormat("[APEX] SELL opened: lots=%.2f sl=%.5f (+%.1f pips) tp=%.5f (+%.1f pips) deal=%I64u",
               lots, sl, slDist/PipPoint(), tp, tpDist/PipPoint(), deal));
      else
         Print("[APEX] SELL FAILED — check OpenMarket log above");
      InitGrid(g_gridSell);
   }
}

// HFT mode: every tick, detect micro-sweep then execute
void Handle_HFT()
{
   int maSignal = GetMASignal();
   if(maSignal == 0) return;

   int totalPos = CountPositions(InpMagicNumber);
   if(totalPos > 0) return; // one position at a time in HFT

   if(InpRequireSweep)
   {
      int sweepIdx = DetectSweep(maSignal == 1 ? -1 : 1);
      if(sweepIdx < 0) return;
   }

   // Immediate entry without waiting for candle close
   if(OrderFlowConfirms(maSignal))
      ExecuteEntry(maSignal, "HFT");
}

// Tick Scalp with Stop Orders
void Handle_TickScalp()
{
   int maSignal = GetMASignal();
   if(maSignal == 0) return;

   int myOrders = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      ulong tk = OrderGetTicket(i);
      if(tk == 0) continue;
      if((int)OrderGetInteger(ORDER_MAGIC) == InpMagicNumber &&
         OrderGetString(ORDER_SYMBOL) == _Symbol) myOrders++;
   }
   if(CountPositions(InpMagicNumber) > 0 || myOrders > 0) return;

   double bid  = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask  = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double lots = CalcLotSize(InpSLPips);

   if(maSignal == 1)
   {
      if(InpRequireSweep) { int idx = DetectSweep(-1); if(idx < 0) return; }
      // Place BUY STOP above current ask + confirmation
      double entry = ask + PipsToPrice(InpReversalPips);
      double sl    = entry - PipsToPrice(InpSLPips);
      double tp    = entry + PipsToPrice(InpSLPips * InpRiskReward);
      PlaceStopOrder(ORDER_TYPE_BUY_STOP, lots, entry, sl, tp, InpTradeComment + "_TS");
   }
   else
   {
      if(InpRequireSweep) { int idx = DetectSweep(1); if(idx < 0) return; }
      double entry = bid - PipsToPrice(InpReversalPips);
      double sl    = entry + PipsToPrice(InpSLPips);
      double tp    = entry - PipsToPrice(InpSLPips * InpRiskReward);
      PlaceStopOrder(ORDER_TYPE_SELL_STOP, lots, entry, sl, tp, InpTradeComment + "_TS");
   }
}

// ═══════════════════════════════════════════════════════════════════
//  HANDLE SCALP POS — LIQUIDITY FIRST (v3)
//  Decision tree:
//   1. New bar? → if same bar, skip
//   2. Session + spread OK?
//   3. No existing position?
//   4. LIQUIDITY CHECK (primary):
//       A. Zone proximity → price approaching resistance (SELL) or support (BUY)
//       B. OR full sweep+reversal (InpRequireSweep mode)
//       C. OR MA signal alone (fallback when no zones found)
//   5. Candle pattern confirmation (final gate)
//   6. Execute entry, mark zone touched
// ═══════════════════════════════════════════════════════════════════
void Handle_ScalpPos()
{
   ENUM_TIMEFRAMES tf = (ENUM_TIMEFRAMES)InpEntryTF;
   datetime curBarTime[];
   if(CopyTime(_Symbol, tf, 0, 1, curBarTime) < 1) return;
   if(curBarTime[0] == g_lastBarTime) return;
   g_lastBarTime = curBarTime[0];

   if(!IsInSession()) return;

   int spread = (int)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(!IsSpreadOK())
   {
      Print(StringFormat("[APEX] Spread blocked: %d > %d", spread, InpMaxSpread));
      return;
   }

   if(CountPositions(InpMagicNumber) > 0) return;

   // ── Scan fresh zones every bar ──
   ScanLiquidityZones();

   int    entryDir   = 0;   // +1=buy, -1=sell
   int    zoneHit    = -1;  // zone that triggered
   string entryReason = "";

   // ── PATH A: Zone Proximity (Liquidity-First) ──
   // Price approaching resistance → sell; approaching support → buy
   int resZone = DetectResistanceProximity(); // returns idx if near resistance
   int supZone = DetectSupportProximity();    // returns idx if near support

   if(resZone >= 0 && supZone >= 0)
   {
      // Both zones close — pick the nearer one
      double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      double resDist = g_zones[resZone].price - bid;
      double supDist = bid - g_zones[supZone].price;
      if(resDist < supDist) { entryDir = -1; zoneHit = resZone; entryReason = "RESIST_PROX"; }
      else                  { entryDir =  1; zoneHit = supZone;  entryReason = "SUPPORT_PROX"; }
   }
   else if(resZone >= 0) { entryDir = -1; zoneHit = resZone; entryReason = "RESIST_PROX"; }
   else if(supZone >= 0) { entryDir =  1; zoneHit = supZone;  entryReason = "SUPPORT_PROX"; }

   // ── PATH B: Sweep + Reversal (strict mode or no proximity zone found) ──
   if(entryDir == 0 && InpRequireSweep)
   {
      // Try bullish sweep first (low swept, now reversing up)
      int sweepBull = DetectSweep(-1);
      if(sweepBull >= 0 && ConfirmReversal(sweepBull, true))
      {
         entryDir = 1; zoneHit = sweepBull; entryReason = "SWEEP_BULL";
      }
      else
      {
         int sweepBear = DetectSweep(1);
         if(sweepBear >= 0 && ConfirmReversal(sweepBear, false))
         {
            entryDir = -1; zoneHit = sweepBear; entryReason = "SWEEP_BEAR";
         }
      }
   }

   // ── PATH C: Pure MA Signal fallback (when no liquidity zone nearby) ──
   if(entryDir == 0)
   {
      int maFallback = GetMASignal();
      if(maFallback != 0) { entryDir = maFallback; entryReason = "MA_FALLBACK"; }
    //   if(maFallback != 0) 
    //   {
    //      // ── Pullback Filter ──
    //      // Only enter if price has pulled back into the moving average ribbon (between EMA9 and EMA50)
    //      // This prevents buying the top or selling the absolute bottom of a runaway trend.
    //      MAState state = GetMAState(true);
    //      double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    //      double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    //      bool validPullback = false;

    //      if(maFallback == 1) // Bullish
    //      {
    //         // Price pulled back below EMA9 but structure is still above EMA50
    //         if(ask <= state.ema9 && ask >= state.ema50) validPullback = true;
    //      }
    //      else // Bearish
    //      {
    //         // Price pulled back above EMA9 but structure is still below EMA50
    //         if(bid >= state.ema9 && bid <= state.ema50) validPullback = true;
    //      }

    //      if(validPullback)
    //      {
    //         entryDir = maFallback; 
    //         entryReason = "MA_FALLBACK"; 
    //      }
    //   }
   }

   if(entryDir == 0)
   {
      // Log once per minute to avoid spam
      static datetime lastNoSignal = 0;
      if(TimeCurrent() - lastNoSignal >= 120)
      {
         lastNoSignal = TimeCurrent();
         Print(StringFormat("[APEX] No entry signal | zones=%d | bar=%s",
               g_zoneCount, TimeToString(curBarTime[0])));
      }
      return;
   }

   // ── MA as Bias Filter (soft) — only block if MA strongly disagrees ──
   // If we have a zone proximity signal, MA only needs to not be strongly opposing
   int maSignal = GetMASignal();
   if(entryReason == "MA_FALLBACK" && maSignal == 0) return; // pure MA path needs signal
   if(maSignal != 0 && maSignal != entryDir && entryReason == "MA_FALLBACK") return;

   // For zone entries: allow trade even if MA is neutral (0), block only if strongly opposite
   if(maSignal != 0 && maSignal != entryDir &&
      (entryReason == "RESIST_PROX" || entryReason == "SUPPORT_PROX" ||
       entryReason == "SWEEP_BULL"  || entryReason == "SWEEP_BEAR"))
   {
      Print(StringFormat("[APEX] Zone entry blocked by opposing MA signal: dir=%d ma=%d reason=%s",
            entryDir, maSignal, entryReason));
      return;
   }

   // ── SMC: CHoCH Filter ──
   if(InpUseChoChEntry)
   {
      if(entryDir == 1 && !IsBullishChoCh())
      {
         Print(StringFormat("[APEX] SMC Block: Waiting for Bullish CHoCH (dir=%d reason=%s)", entryDir, entryReason));
         return;
      }
      if(entryDir == -1 && !IsBearishChoCh())
      {
         Print(StringFormat("[APEX] SMC Block: Waiting for Bearish CHoCH (dir=%d reason=%s)", entryDir, entryReason));
         return;
      }
   }

   // ── Order Flow (optional) ──
   if(!OrderFlowConfirms(entryDir)) return;

   // ── Candle Pattern Confirmation ──
   if(!CandleConfirms(entryDir))
   {
      Print(StringFormat("[APEX] Candle blocked: dir=%d reason=%s", entryDir, entryReason));
      return;
   }

   double zPrice = (zoneHit >= 0) ? g_zones[zoneHit].price : 0.0;
   
   // ── ALL CLEAR — Execute ──
   Print(StringFormat("[APEX] ✅ ENTRY: dir=%d reason=%s zone=%.5f spread=%d bar=%s",
         entryDir,
         entryReason,
         zPrice,
         spread,
         TimeToString(curBarTime[0])));

   ExecuteEntry(entryDir, "SCALP_" + entryReason, zPrice);

   // Mark zone as used so we don't re-trade the same zone
   if(zoneHit >= 0) MarkZoneTouched(zoneHit);
}


// Day Trade (H1 entry, D1 bias, close all by session end)
void Handle_Day()
{
   ENUM_TIMEFRAMES tf = PERIOD_H1;
   datetime curBarTime[];
   if(CopyTime(_Symbol, tf, 0, 1, curBarTime) < 1) return;
   if(curBarTime[0] == g_lastBarTime) return;
   g_lastBarTime = curBarTime[0];

   if(CountPositions(InpMagicNumber) >= 2) return;

   int maSignal = GetMASignal();
   if(maSignal == 0) return;

   if(InpRequireSweep)
   {
      int sweepIdx = DetectSweep(maSignal == 1 ? -1 : 1);
      if(sweepIdx < 0) return;
      if(!ConfirmReversal(sweepIdx, maSignal == 1)) return;
   }

   ExecuteEntry(maSignal, "DAY");
}

// Swing Trade (H4 entry, W1 bias)
void Handle_Swing()
{
   ENUM_TIMEFRAMES tf = PERIOD_H4;
   datetime curBarTime[];
   if(CopyTime(_Symbol, tf, 0, 1, curBarTime) < 1) return;
   if(curBarTime[0] == g_lastBarTime) return;
   g_lastBarTime = curBarTime[0];

   if(CountPositions(InpMagicNumber) >= 3) return;

   int maSignal = GetMASignal();
   if(maSignal == 0) return;

   if(InpRequireSweep)
   {
      int sweepIdx = DetectSweep(maSignal == 1 ? -1 : 1);
      if(sweepIdx < 0) return;
   }

   ExecuteEntry(maSignal, "SWING");
}

// Monthly / Yearly (position trade style)
void Handle_LongTerm(string tag)
{
   ENUM_TIMEFRAMES tf = (InpMode == MODE_MONTHLY) ? PERIOD_D1 : PERIOD_W1;
   datetime curBarTime[];
   if(CopyTime(_Symbol, tf, 0, 1, curBarTime) < 1) return;
   if(curBarTime[0] == g_lastBarTime) return;
   g_lastBarTime = curBarTime[0];

   if(CountPositions(InpMagicNumber) >= 1) return;

   int maSignal = GetMASignal();
   if(maSignal == 0) return;

   ExecuteEntry(maSignal, tag);
}

//═══════════════════════════════════════════════════════════════════
//  DASHBOARD PANEL (Modern Dark UI — Tokyo Night)
//═══════════════════════════════════════════════════════════════════
#define ROW_H  18
#define PAD    8

struct PanelRow { string name; int y; };
PanelRow g_rows[40];
int g_rowCount = 0;
int g_panelH   = 0;

void PanelObj(string name, int x, int y, int w, int h, string text,
              color fg, color bg, int fs, bool bold = false,
              ENUM_ALIGN_MODE align = ALIGN_LEFT, int zorder = 1)
{
   string n = PANEL_PREFIX + name;
   if(ObjectFind(0, n) < 0)
      ObjectCreate(0, n, OBJ_LABEL, 0, 0, 0);

   ObjectSetInteger(0, n, OBJPROP_CORNER,    InpPanelCorner);
   ObjectSetInteger(0, n, OBJPROP_XDISTANCE, InpPanelX + x);
   ObjectSetInteger(0, n, OBJPROP_YDISTANCE, InpPanelY + y);
   ObjectSetString (0, n, OBJPROP_TEXT,      text);
   ObjectSetString (0, n, OBJPROP_FONT,      bold ? "Segoe UI Bold" : "Segoe UI");
   ObjectSetInteger(0, n, OBJPROP_FONTSIZE,  fs);
   ObjectSetInteger(0, n, OBJPROP_COLOR,     fg);
   ObjectSetInteger(0, n, OBJPROP_BACK,      false);
   ObjectSetInteger(0, n, OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0, n, OBJPROP_HIDDEN,    true);
   ObjectSetInteger(0, n, OBJPROP_ZORDER,    zorder);
   ObjectSetInteger(0, n, OBJPROP_ALIGN,     align);
}

void PanelRect(string name, int x, int y, int w, int h, color bg, color border = TN_BORDER)
{
   string n = PANEL_PREFIX + name;
   if(ObjectFind(0, n) < 0) ObjectCreate(0, n, OBJ_RECTANGLE_LABEL, 0, 0, 0);
   ObjectSetInteger(0, n, OBJPROP_CORNER,    InpPanelCorner);
   ObjectSetInteger(0, n, OBJPROP_XDISTANCE, InpPanelX + x);
   ObjectSetInteger(0, n, OBJPROP_YDISTANCE, InpPanelY + y);
   ObjectSetInteger(0, n, OBJPROP_XSIZE,     w);
   ObjectSetInteger(0, n, OBJPROP_YSIZE,     h);
   ObjectSetInteger(0, n, OBJPROP_BGCOLOR,   bg);
   ObjectSetInteger(0, n, OBJPROP_BORDER_COLOR, border);
   ObjectSetInteger(0, n, OBJPROP_BORDER_TYPE, BORDER_FLAT);
   ObjectSetInteger(0, n, OBJPROP_BACK,      false);
   ObjectSetInteger(0, n, OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0, n, OBJPROP_HIDDEN,    true);
   ObjectSetInteger(0, n, OBJPROP_ZORDER,    0);
}

void PanelButton(string name, int x, int y, int w, int h, string text,
                 color fg, color bg, int fs = 8)
{
   string n = PANEL_PREFIX + name;
   if(ObjectFind(0, n) < 0) ObjectCreate(0, n, OBJ_BUTTON, 0, 0, 0);
   ObjectSetInteger(0, n, OBJPROP_CORNER,    InpPanelCorner);
   ObjectSetInteger(0, n, OBJPROP_XDISTANCE, InpPanelX + x);
   ObjectSetInteger(0, n, OBJPROP_YDISTANCE, InpPanelY + y);
   ObjectSetInteger(0, n, OBJPROP_XSIZE,     w);
   ObjectSetInteger(0, n, OBJPROP_YSIZE,     h);
   ObjectSetString (0, n, OBJPROP_TEXT,      text);
   ObjectSetString (0, n, OBJPROP_FONT,      "Segoe UI Bold");
   ObjectSetInteger(0, n, OBJPROP_FONTSIZE,  fs);
   ObjectSetInteger(0, n, OBJPROP_COLOR,     fg);
   ObjectSetInteger(0, n, OBJPROP_BGCOLOR,   bg);
   ObjectSetInteger(0, n, OBJPROP_BORDER_COLOR, TN_BORDER);
   ObjectSetInteger(0, n, OBJPROP_BACK,      false);
   ObjectSetInteger(0, n, OBJPROP_STATE,     false);
   ObjectSetInteger(0, n, OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0, n, OBJPROP_HIDDEN,    true);
   ObjectSetInteger(0, n, OBJPROP_ZORDER,    10);
}

void BuildPanel()
{
   if(!InpShowPanel) return;

   int W = InpPanelWidth;
   int row = 0;

   // ── Main Background ──
   PanelRect("BG", 0, 0, W, 620, TN_DARK);

   // ── Title Bar ──
   PanelRect("TITLE_BG", 0, 0, W, 28, TN_PANEL);
   PanelObj ("TITLE", PAD, 6, W-PAD*2, 20, "⬡ " + APEX_NAME + " v" + APEX_VERSION,
             TN_ACCENT, 0, 10, true, ALIGN_LEFT);
   PanelObj ("TITLE_SYM", W-90, 6, 80, 20, _Symbol + " " + TFStr((ENUM_TIMEFRAMES)InpEntryTF),
             TN_CYAN, 0, 8, false, ALIGN_RIGHT);

   // ── Mode indicator ──
   int y = 32;
   PanelRect("MODE_BG", 0, y, W, 20, C'30,35,55');
   PanelObj ("MODE_LBL", PAD, y+3, 80, 16, "MODE:", TN_MUTED, 0, 8);
   PanelObj ("MODE_VAL", 60, y+3, W-70, 16, ModeStr(InpMode),
             TN_PURPLE, 0, 9, true, ALIGN_LEFT);

   // ── Webhook Status ──
   y += 22;
   PanelObj("LOCK_LBL", PAD, y, 80, 16, "LICENSE:", TN_MUTED, 0, 8);
   string wbText = g_webhookOK ? "✓ AUTHORIZED" : "✗ LOCKED";
   color  wbClr  = g_webhookOK ? TN_GREEN : TN_RED;
   PanelObj("LOCK_VAL", 70, y, W-80, 16, wbText, wbClr, 0, 8, true);

   // ── Separator ──
   y += 20;
   PanelRect("SEP1", 0, y, W, 1, TN_BORDER, TN_BORDER);

   // ── Account Info ──
   y += 4;
   double balance  = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity   = AccountInfoDouble(ACCOUNT_EQUITY);
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double dailyPL  = equity - g_dayStartBalance;
   double drawdown = (g_highWaterMark > 0) ? ((g_highWaterMark - equity) / g_highWaterMark * 100.0) : 0;

   PanelRect("ACC_BG", 0, y, W, 86, C'20,22,36');
   PanelObj("ACC_TITLE", PAD, y+3, W-PAD*2, 14, "ACCOUNT", TN_ACCENT, 0, 7, true);
   y += 18;

   PanelObj("BAL_LBL", PAD,    y, 100, 14, "Balance:", TN_MUTED, 0, 8);
   PanelObj("BAL_VAL", 100,    y, W-110, 14, StringFormat("$%.2f", balance), TN_FG, 0, 8, true);
   y += 16;

   PanelObj("EQ_LBL",  PAD,    y, 100, 14, "Equity:", TN_MUTED, 0, 8);
   PanelObj("EQ_VAL",  100,    y, W-110, 14, StringFormat("$%.2f", equity), TN_FG, 0, 8, true);
   y += 16;

   color plClr = (dailyPL >= 0) ? TN_GREEN : TN_RED;
   PanelObj("DAYPL_LBL", PAD,  y, 100, 14, "Day P&L:", TN_MUTED, 0, 8);
   PanelObj("DAYPL_VAL", 100,  y, W-110, 14, StringFormat("%+.2f", dailyPL), plClr, 0, 8, true);
   y += 16;

   color ddClr = (drawdown < 3) ? TN_GREEN : (drawdown < 7) ? TN_YELLOW : TN_RED;
   PanelObj("DD_LBL", PAD,     y, 100, 14, "Drawdown:", TN_MUTED, 0, 8);
   PanelObj("DD_VAL", 100,     y, W-110, 14, StringFormat("%.2f%%", drawdown), ddClr, 0, 8, true);

   // ── Separator ──
   y += 20;
   PanelRect("SEP2", 0, y, W, 1, TN_BORDER, TN_BORDER);

   // ── MA Status ──
   y += 4;
   MAState entry = GetMAState(true);
   MAState bias  = GetMAState(false);
   string stackStr = entry.stackedBull ? "BULL ▲" : (entry.stackedBear ? "BEAR ▼" : "MIXED ◆");
   color  stackClr = entry.stackedBull ? TN_GREEN : (entry.stackedBear ? TN_RED : TN_YELLOW);
   string biasStr  = (bias.ema9 > bias.ema50) ? "BULL" : "BEAR";
   color  biasClr  = (bias.ema9 > bias.ema50) ? TN_GREEN : TN_RED;

   PanelRect("MA_BG", 0, y, W, 90, C'20,22,36');
   PanelObj("MA_TITLE", PAD, y+3, W-PAD*2, 14, "MA ENGINE  (9/15/20/50)", TN_ACCENT, 0, 7, true);
   y += 18;

   PanelObj("MA_STACK_LBL", PAD, y, 80, 14, "Stack:", TN_MUTED, 0, 8);
   PanelObj("MA_STACK_VAL", 80,  y, W-90, 14, stackStr, stackClr, 0, 8, true);
   y += 16;

   PanelObj("MA_BIAS_LBL", PAD, y, 80, 14, "HTF Bias:", TN_MUTED, 0, 8);
   PanelObj("MA_BIAS_VAL", 80,  y, W-90, 14,
            biasStr + " (" + TFStr((ENUM_TIMEFRAMES)InpBiasTF) + ")", biasClr, 0, 8, true);
   y += 16;

   // EMA values
   if(entry.ema9 != EMPTY_VALUE)
   {
      PanelObj("MA9_LBL",  PAD, y,     25, 14, "9:", TN_MUTED, 0, 7);
      PanelObj("MA9_VAL",  20,  y,     55, 14, DoubleToString(entry.ema9, _Digits), TN_CYAN, 0, 7);
      PanelObj("MA15_LBL", 80,  y,     30, 14, "15:", TN_MUTED, 0, 7);
      PanelObj("MA15_VAL", 95,  y,     55, 14, DoubleToString(entry.ema15, _Digits), TN_BLUE, 0, 7);
      y += 14;
      PanelObj("MA20_LBL", PAD, y,     30, 14, "20:", TN_MUTED, 0, 7);
      PanelObj("MA20_VAL", 20,  y,     55, 14, DoubleToString(entry.ema20, _Digits), TN_ORANGE, 0, 7);
      PanelObj("MA50_LBL", 80,  y,     30, 14, "50:", TN_MUTED, 0, 7);
      PanelObj("MA50_VAL", 95,  y,     55, 14, DoubleToString(entry.ema50, _Digits), TN_PURPLE, 0, 7);
   }

   // ── Separator ──
   y += 20;
   PanelRect("SEP3", 0, y, W, 1, TN_BORDER, TN_BORDER);

   // ── Liquidity & Positions ──
   y += 4;
   int totalPos  = CountPositions(InpMagicNumber);
   int totalBuys = CountPositions(InpMagicNumber, POSITION_TYPE_BUY);
   int totalSells= CountPositions(InpMagicNumber, POSITION_TYPE_SELL);
   double totalPL = TotalFloatingProfit(InpMagicNumber);

   PanelRect("POS_BG", 0, y, W, 86, C'20,22,36');
   PanelObj("POS_TITLE", PAD, y+3, W-PAD*2, 14, "POSITIONS & LIQUIDITY", TN_ACCENT, 0, 7, true);
   y += 18;

   color posClr = (totalPL >= 0) ? TN_GREEN : TN_RED;
   PanelObj("POS_CNT_LBL", PAD, y, 80, 14, "Positions:", TN_MUTED, 0, 8);
   PanelObj("POS_CNT_VAL", 80,  y, W-90, 14,
            StringFormat("%d (B:%d S:%d)", totalPos, totalBuys, totalSells), TN_FG, 0, 8);
   y += 16;

   PanelObj("POS_PL_LBL", PAD, y, 80, 14, "Float P&L:", TN_MUTED, 0, 8);
   PanelObj("POS_PL_VAL", 80,  y, W-90, 14, StringFormat("%+.2f", totalPL), posClr, 0, 8, true);
   y += 16;

   PanelObj("LIQ_LBL", PAD, y, 80, 14, "Liq Zones:", TN_MUTED, 0, 8);
   int swept = 0; for(int i = 0; i < g_zoneCount; i++) if(g_zones[i].swept) swept++;
   PanelObj("LIQ_VAL", 80,  y, W-90, 14,
            StringFormat("%d zones (%d swept)", g_zoneCount, swept), TN_CYAN, 0, 8);
   y += 16;

   PanelObj("GRID_LBL", PAD, y, 80, 14, "Grid:", TN_MUTED, 0, 8);
   PanelObj("GRID_VAL", 80,  y, W-90, 14,
            StringFormat("B=%d S=%d", g_gridBuy.level, g_gridSell.level), TN_YELLOW, 0, 8);

   // ── Separator ──
   y += 20;
   PanelRect("SEP4", 0, y, W, 1, TN_BORDER, TN_BORDER);

   // ── Compounding Progress ──
   y += 4;
   PanelRect("COMP_BG", 0, y, W, 50, C'20,22,36');
   PanelObj("COMP_TITLE", PAD, y+3, W-PAD*2, 14, "COMPOUNDING", TN_ACCENT, 0, 7, true);
   y += 18;

   double progress = (InpTargetBalance > InpStartBalance && balance > InpStartBalance)
                     ? ((balance - InpStartBalance) / (InpTargetBalance - InpStartBalance) * 100.0) : 0;
   progress = MathMin(100, progress);
   int barW  = W - PAD*2;
   int fillW = (int)(barW * progress / 100.0);

   PanelRect("COMP_BAR_BG",   PAD, y, barW, 10, C'30,35,55');
   PanelRect("COMP_BAR_FILL", PAD, y, fillW, 10, TN_GREEN);
   y += 12;
   PanelObj("COMP_PCT", PAD, y, W-PAD*2, 14,
            StringFormat("%.1f%%  |  Risk: %.1f%%  |  $%.0f → $%.0f",
                         progress, g_currentRisk, balance, InpTargetBalance),
            TN_FG, 0, 7, false, ALIGN_LEFT);

   // ── Separator ──
   y += 20;
   PanelRect("SEP5", 0, y, W, 1, TN_BORDER, TN_BORDER);

   // ── Session & Status ──
   y += 4;
   bool inSess = IsInSession();
   bool spreadOk = IsSpreadOK();
   int  spread   = (int)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);

   PanelRect("STA_BG", 0, y, W, 50, C'20,22,36');
   PanelObj("STA_TITLE", PAD, y+3, W-PAD*2, 14, "STATUS", TN_ACCENT, 0, 7, true);
   y += 18;

   PanelObj("STA_SESS_LBL", PAD,  y, 60, 14, "Session:", TN_MUTED, 0, 8);
   PanelObj("STA_SESS_VAL", 65,   y, 60, 14, inSess ? "ACTIVE" : "CLOSED",
            inSess ? TN_GREEN : TN_MUTED, 0, 8, true);
   PanelObj("STA_SPR_LBL",  W/2,  y, 50, 14, "Spread:", TN_MUTED, 0, 8);
   PanelObj("STA_SPR_VAL",  W/2+50, y, 40, 14, IntegerToString(spread),
            spreadOk ? TN_GREEN : TN_RED, 0, 8, true);
   y += 16;

   PanelObj("STA_HALT_LBL", PAD, y, 60, 14, "EA:", TN_MUTED, 0, 8);
   string haltText = g_haltTrading ? "HALTED: " + g_haltReason : (g_protectMode ? "PROTECT MODE" : "RUNNING");
   color  haltClr  = g_haltTrading ? TN_RED : (g_protectMode ? TN_YELLOW : TN_GREEN);
   PanelObj("STA_HALT_VAL", 40, y, W-50, 14, haltText, haltClr, 0, 8, true);

   // ── Separator ──
   y += 22;
   PanelRect("SEP6", 0, y, W, 1, TN_BORDER, TN_BORDER);

   // ── Action Buttons ──
   y += 6;
   int bW = (W - PAD*2 - 4) / 2;
   PanelButton("BTN_CLOSEALL", PAD,        y, bW, 20, "⏹ CLOSE ALL",  TN_FG, TN_RED, 8);
   PanelButton("BTN_PROTECT",  PAD+bW+4,   y, bW, 20, g_protectMode ? "▶ RESUME" : "🛡 PROTECT",
               TN_FG, g_protectMode ? TN_GREEN : TN_ORANGE, 8);
   y += 24;

   int bW3 = (W - PAD*2 - 8) / 3;
   PanelButton("BTN_BUYNOW",  PAD,             y, bW3, 20, "▲ BUY",   TN_FG, TN_GREEN,  8);
   PanelButton("BTN_SELLNOW", PAD+bW3+4,       y, bW3, 20, "▼ SELL",  TN_FG, TN_RED,    8);
   PanelButton("BTN_CANCEL",  PAD+(bW3+4)*2,   y, bW3, 20, "✕ CLEAR", TN_FG, TN_BORDER, 8);

   y += 28;

   // ── Resize background to fit ──
   if(ObjectFind(0, PANEL_PREFIX+"BG") >= 0)
      ObjectSetInteger(0, PANEL_PREFIX+"BG", OBJPROP_YSIZE, y + PAD);

   g_panelH = y + PAD;
   ChartRedraw(0);
}

void CleanPanel()
{
   ObjectsDeleteAll(0, PANEL_PREFIX);
}

//═══════════════════════════════════════════════════════════════════
//  DAILY RESET
//═══════════════════════════════════════════════════════════════════
void CheckDayReset()
{
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   MqlDateTime ds; TimeToStruct(g_dayStart, ds);

   if(dt.day != ds.day || dt.mon != ds.mon || dt.year != ds.year)
   {
      g_dayStart        = TimeCurrent();
      g_dayStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
      g_dailyTradeCount = 0;
      g_haltTrading     = false;
      g_haltReason      = "";
      g_protectMode     = false;
      InitGrid(g_gridBuy);
      InitGrid(g_gridSell);
      Print("[APEX] New day — reset. Balance=", g_dayStartBalance);
   }

   // Update high water mark
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   if(equity > g_highWaterMark) g_highWaterMark = equity;
}

//═══════════════════════════════════════════════════════════════════
//  PROTECT MODE CHECK
//═══════════════════════════════════════════════════════════════════
void CheckProtectMode()
{
   if(!InpProtectMode) return;
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double dailyPL = balance - g_dayStartBalance;

   // If daily profit target reached (by approximate target)
   double dailyTarget = 0;
   if(InpCompound != COMPOUND_OFF && g_compStepCount > 0)
   {
      for(int i = 0; i < g_compStepCount; i++)
      {
         if(balance >= g_compSteps[i].fromBalance && balance < g_compSteps[i].toBalance)
         {
            dailyTarget = (g_compSteps[i].toBalance - g_compSteps[i].fromBalance) / 5.0; // Weekly/5 days
            break;
         }
      }
   }

   if(dailyTarget > 0 && dailyPL >= dailyTarget && !g_protectMode)
   {
      g_protectMode = true;
      Print("[APEX] PROTECT MODE: Daily target hit. dailyPL=", dailyPL, " target=", dailyTarget);
   }
}

//═══════════════════════════════════════════════════════════════════
//  OnInit
//═══════════════════════════════════════════════════════════════════
int OnInit()
{
   Print("╔═══════════════════════════════════════════╗");
   Print("║  ", APEX_NAME, " v", APEX_VERSION, " STARTING     ║");
   Print("║  Account: ", AccountInfoInteger(ACCOUNT_LOGIN), " | Server: ", AccountInfoString(ACCOUNT_SERVER), "  ║");
   Print("╚═══════════════════════════════════════════╝");

   // ── Webhook License Check ──
   string wbMsg;
   if(!WebhookCheck(wbMsg))
   {
      string errText = "[APEX] LICENSE DENIED: " + wbMsg;
      Print(errText);
      Alert(errText);
      Comment(errText);
      return INIT_FAILED;
   }
   g_webhookOK = true;
   Print("[APEX] License OK: ", wbMsg);

   // ── Indicators ──
   if(!InitIndicators()) return INIT_FAILED;

   // ── Trade Setup ──
   g_trade.SetExpertMagicNumber(InpMagicNumber);
   g_trade.SetDeviationInPoints(20);
   g_trade.SetTypeFillingBySymbol(_Symbol);
   g_trade.SetAsyncMode(false);

   // ── Init grids ──
   InitGrid(g_gridBuy);
   InitGrid(g_gridSell);

   // ── Day tracking ──
   g_dayStart        = TimeCurrent();
   g_dayStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   g_highWaterMark   = AccountInfoDouble(ACCOUNT_EQUITY);
   g_dailyTradeCount = 0;
   g_lastHeartbeat   = TimeCurrent();

   // ── Compounding ──
   BuildCompoundSteps();

   // ── Enable order book for order flow ──
   if(InpUseOrderFlow) MarketBookAdd(_Symbol);

   // ── Initial liquidity scan ──
   ScanLiquidityZones();
   if(InpDrawZones) DrawLiquidityZones();

   // ── Panel ──
   CleanPanel();
   BuildPanel();

   // ── Timer (1 second heartbeat for panel + management) ──
   EventSetTimer(1);

   Print("[APEX] Initialized. Mode=", ModeStr(InpMode),
         " EntryTF=", TFStr((ENUM_TIMEFRAMES)InpEntryTF),
         " BiasTF=", TFStr((ENUM_TIMEFRAMES)InpBiasTF),
         " Risk=", g_currentRisk, "%");

   return INIT_SUCCEEDED;
}

//═══════════════════════════════════════════════════════════════════
//  OnDeinit
//═══════════════════════════════════════════════════════════════════
void OnDeinit(const int reason)
{
   EventKillTimer();
   DeinitIndicators();
   if(InpUseOrderFlow) MarketBookRelease(_Symbol);
   DrawLiquidityZones(); // clear
   CleanPanel();
   for(int k = 0; k < MAX_LIQ_ZONES; k++)
   {
      string name = PANEL_PREFIX + "ZONE_" + IntegerToString(k);
      if(ObjectFind(0, name) >= 0) ObjectDelete(0, name);
   }
   ObjectsDeleteAll(0, PANEL_PREFIX);
   ChartRedraw(0);
   Print("[APEX] Deinitialized. Reason=", reason);
}

//═══════════════════════════════════════════════════════════════════
//  OnTick
//═══════════════════════════════════════════════════════════════════
void OnTick()
{
   // Daily check
   CheckDayReset();
   UpdateCompoundRisk();
   CheckProtectMode();

   // Safety checks
   if(g_haltTrading) return;

   // ── Exit on Opposite CHoCH (SMC Rule) ──
   if(InpCloseOnChoCh && PositionsTotal() > 0)
   {
      bool bearChoCh = IsBearishChoCh();
      bool bullChoCh = IsBullishChoCh();
      
      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         ulong tk = PositionGetTicket(i);
         if(tk == 0) continue;
         if((int)PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;
         
         long posType = PositionGetInteger(POSITION_TYPE);
         if(posType == POSITION_TYPE_BUY && bearChoCh)
         {
            Print(StringFormat("[APEX] SMC Exit: Closing BUY %I64u due to Bearish CHoCH!", tk));
            g_trade.PositionClose(tk);
         }
         else if(posType == POSITION_TYPE_SELL && bullChoCh)
         {
            Print(StringFormat("[APEX] SMC Exit: Closing SELL %I64u due to Bullish CHoCH!", tk));
            g_trade.PositionClose(tk);
         }
      }
   }

   // Active managementy close
   if(IsFridayClose())
   {
      int pos = CountPositions(InpMagicNumber);
      if(pos > 0) { CloseAllPositions("FRI_CLOSE"); CancelAllPending(); }
      return;
   }

   // Session check (except for long-term modes)
   if(InpMode != MODE_YEARLY && InpMode != MODE_MONTHLY)
      if(!IsInSession()) return;

   // Manage existing positions (trail, BE, partial)
   ManageTrailingAndBE();
   ManagePartialClose();

   // Grid recovery
   if(InpGridMode != GRID_DISABLED) ManageGrid();

   // Hedge management
   if(InpHedgeMode != HEDGE_DISABLED) ManageHedge();

   // Route to mode handler
   switch(InpMode)
   {
      case MODE_HFT:        Handle_HFT();        break;
      case MODE_TICK_SCALP: Handle_TickScalp();  break;
      case MODE_SCALP_POS:  Handle_ScalpPos();   break;
      case MODE_DAY:        Handle_Day();         break;
      case MODE_SWING:      Handle_Swing();       break;
      case MODE_MONTHLY:    Handle_LongTerm("MTH"); break;
      case MODE_YEARLY:     Handle_LongTerm("YR");  break;
   }
}

//═══════════════════════════════════════════════════════════════════
//  OnTimer
//═══════════════════════════════════════════════════════════════════
void OnTimer()
{
    // Update panel every second
    if(InpShowPanel) BuildPanel();

    // Re-scan liquidity zones every 5 minutes
    if(TimeCurrent() - g_lastScanTime >= 300)
    {
        ScanLiquidityZones();
        if(InpDrawZones) DrawLiquidityZones();
        g_lastScanTime = TimeCurrent();
    }

    // Webhook heartbeat every hour
    if(TimeCurrent() - g_lastHeartbeat >= HEARTBEAT_SECS)
    {
        string wbMsg;
        bool ok = WebhookCheck(wbMsg);
        if(!ok)
        {
            g_haltTrading = true;
            g_haltReason  = "Heartbeat license check failed: " + wbMsg;
            g_webhookOK   = false;
            Alert("[APEX] LICENSE REVOKED: " + wbMsg);
            Print("[APEX] HALT: ", g_haltReason);
        }
        else
        {
            g_webhookOK     = true;
            g_lastHeartbeat = TimeCurrent();
        }
    }
}

//═══════════════════════════════════════════════════════════════════
//  OnChartEvent
//═══════════════════════════════════════════════════════════════════
void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
    if(id != CHARTEVENT_OBJECT_CLICK) return;

    // Remove button state immediately
    if(ObjectFind(0, sparam) >= 0)
        ObjectSetInteger(0, sparam, OBJPROP_STATE, false);

    string base = PANEL_PREFIX;

    if(sparam == base + "BTN_CLOSEALL")
    {
        CloseAllPositions("MANUAL");
        CancelAllPending();
        InitGrid(g_gridBuy);
        InitGrid(g_gridSell);
        Print("[APEX] MANUAL: Close All pressed");
    }
    else if(sparam == base + "BTN_PROTECT")
    {
        g_protectMode = !g_protectMode;
        Print("[APEX] Protect Mode: ", g_protectMode);
    }
    else if(sparam == base + "BTN_BUYNOW")
    {
        if(!g_haltTrading && CheckDailyLimits())
        {
            double lots = CalcLotSize(InpSLPips);
            double ask  = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
            double sl   = ask - PipsToPrice(InpSLPips);
            double tp   = ask + PipsToPrice(InpSLPips * InpRiskReward);
            OpenMarket(ORDER_TYPE_BUY, lots, sl, tp, InpTradeComment + "_MAN");
        }
    }
    else if(sparam == base + "BTN_SELLNOW")
    {
        if(!g_haltTrading && CheckDailyLimits())
        {
            double lots = CalcLotSize(InpSLPips);
            double bid  = SymbolInfoDouble(_Symbol, SYMBOL_BID);
            double sl   = bid + PipsToPrice(InpSLPips);
            double tp   = bid - PipsToPrice(InpSLPips * InpRiskReward);
            OpenMarket(ORDER_TYPE_SELL, lots, sl, tp, InpTradeComment + "_MAN");
        }
    }
    else if(sparam == base + "BTN_CANCEL")
    {
        CancelAllPending();
        Print("[APEX] MANUAL: Cancel all pending");
    }

    ChartRedraw(0);
}

//═══════════════════════════════════════════════════════════════════
//  OnBookEvent (Order Flow — fires when book changes)
//═══════════════════════════════════════════════════════════════════
void OnBookEvent(const string &symbol)
{
    if(symbol != _Symbol) return;
    // In HFT mode, re-trigger tick logic on book update
    if(InpMode == MODE_HFT && !g_haltTrading) Handle_HFT();
}

//+------------------------------------------------------------------+
// END OF APEX LIQUIDITY HUNTER v1.0
//+------------------------------------------------------------------+