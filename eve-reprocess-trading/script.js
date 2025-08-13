document.addEventListener('DOMContentLoaded', async () => {

// --- Helper: return set of mineral names for a given typeID from REPROCESS_YIELD ---
function getReprocessMineralNames(tid, nameByTypeId) {
  const minerals = new Set();
  try {
    const raw = (typeof REPROCESS_YIELD !== 'undefined' && REPROCESS_YIELD && REPROCESS_YIELD[tid]) || null;
    if (!raw) return minerals;
    if (Array.isArray(raw)) {
      for (const m of raw) {
        if (!m) continue;
        const mtid = (m.typeID ?? m.typeId ?? m.id) | 0;
        if (!mtid) continue;
        const mname = m.name || nameByTypeId.get(mtid);
        if (mname) minerals.add(mname);
      }
    } else if (typeof raw === 'object') {
      for (const k of Object.keys(raw)) {
        const mtid = k | 0;
        if (!mtid) continue;
        const mname = nameByTypeId.get(mtid);
        if (mname) minerals.add(mname);
      }
    }
  } catch (e) {
    console.warn('getReprocessMineralNames failed', e);
  }
  return minerals;
}

  // DOM shortcut
  const $ = id => document.getElementById(id);

  // All key elements in one object for brevity
  const els = {
    hub: $('hub_select'),
    generate: $('generate_btn'),
    genPrices: $('generate_prices_btn'),
    copyQuickbar: $('copy_market_quickbar_btn'),
    includeSec: $('include_secondary'),
    sellTo: $('sell_to_select'),

    afterGen: $('after_generate_controls'),
    groupResults: $('market_group_results'),
    groupResultsWrap: $('market_group_results_wrapper'),

    potentialProfitWrap: $('potential_profit_wrapper'),
    potentialProfitLabel: $('potential_profit_label'),
    potentialProfitValue: $('potential_profit_value'),

    standingWrap: $('standing_inputs_wrapper'),
    skillsBox: $('result_skills'),
    factionLabel: $('faction_label'),
    corpLabel: $('corp_label'),
    factionIn: $('faction_standing_input'),
    corpIn: $('corp_standing_input'),
    factionRes: $('faction_standing_result'),
    corpRes: $('corp_standing_result'),

    brokerFee: $('broker_fee'),
    tax: $('reprocess_tax'),
    salesTax: $('sales_tax'),
    yield: $('reprocess_yield'),

    groupSel: $('market_group_select'),
    t2Toggle: $('exclude_t2'),
    marginWrap: $('margin_fields_wrapper'),
    minMargin: $('min_margin'),
    maxMargin: $('max_margin'),
    minVol: $('min_daily_volume'),
    stack: $('stack_size'),
    excludeT1: $('exclude_t1'),
    excludeT1Wrap: $('exclude_t1_wrapper'),
    excludeCap: $('exclude_capital'),
    excludeCapWrap: $('exclude_capital_wrapper'),
    noResults: $('no_results_message'),

    buyQtyWrap: $('buy_qty_recommendation_wrapper'),
    buyQty: $('buy_qty_recommendation'),
    buyQtyPercWrap: $('buy_qty_percentage_wrapper'),
    buyQtyPerc: $('buy_qty_percentage'),

    relistFeesWrap: $('relist_fees_wrapper'),
    relistFees: $('relist_broker_fees'),
    orderUpdates: $('order_updates'),
    orderUpdatesWrap: $('order_updates_wrapper'),

    skillBrokerAdv: $('skill_broker_adv'),
    skill_accounting: $('skill_accounting'),
    skill_broker: $('skill_broker'),
    skill_connections: $('skill_connections'),
    skill_diplomacy: $('skill_diplomacy'),
    skill_scrapmetal: $('skill_scrapmetal')
  };
  Object.freeze(els);

  // Hide 'Exclude T2?' when market group is Implants (value '27')
  function updateT2VisibilityForGroup() {
    try {
      if (!els.t2Toggle || !els.groupSel) return;
      const isImplants = String(els.groupSel.value) === '27';
      const wrap = els.t2Toggle.parentElement || null;
      if (!wrap) return;
      wrap.classList.toggle('hidden', isImplants);
    } catch (e) { /* no-op */ }
  }


  // Show/hide helpers
  const hide = (...x) => x.forEach(e => e && (e.classList.add('hidden')));
  const show = (...x) => x.forEach(e => e && (e.classList.remove('hidden')));
  
  // --- Network helpers ---
  const DEFAULT_TIMEOUT = 15000;
  async function fetchJSON(url, { timeout = DEFAULT_TIMEOUT, ...options } = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctrl.signal, credentials: 'same-origin', ...options });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      // Handle empty responses gracefully
      const text = await res.text();
      if (!text) return null;
      try { return JSON.parse(text); }
      catch { throw new Error('Invalid JSON'); }
    } finally {
      clearTimeout(t);
    }
  }

  // Guard: ensure PHP localized data exists
  if (typeof window.EVE_DATA !== 'object' || !EVE_DATA.baseUrl) {
    console.error('EVE_DATA missing; aborting init');
    return;
  }

  function hideAllResultsBelowGenerateList() {
    hide(
      els.groupResultsWrap,
      els.genPrices, els.copyQuickbar, els.afterGen,
      els.noResults,
      els.minVol?.parentElement, els.stack?.parentElement,
      els.buyQtyWrap, els.buyQtyPercWrap, els.orderUpdatesWrap, els.relistFeesWrap, els.potentialProfitWrap
    );
    genPricesBtnReset && genPricesBtnReset();
    needRegenerate = false;
    updateOrderUpdatesVisibility();
  }

  function hideMarketGroupResultsOnly() {
    hide(els.copyQuickbar, els.noResults, els.groupResultsWrap, els.potentialProfitWrap); // ⬅ add this
    setGenPricesBtnRegenerate && setGenPricesBtnRegenerate();
    needRegenerate = true;
  }

  // Central function for order updates visibility
  function updateOrderUpdatesVisibility() {
    const showOrderUpdates =
      els.buyQty && els.buyQty.value === 'yes' &&
      els.relistFees && els.relistFees.value === 'yes';
    if (els.orderUpdatesWrap)
      els.orderUpdatesWrap.classList.toggle('hidden', !showOrderUpdates);
  }

  // Utilities
  const sanitize = (input, {min, max, step, def} = {}) => {
    let v = parseFloat(input.value);
    if (isNaN(v)) v = def ?? 0;
    if (min !== undefined && v < min) v = min;
    if (max !== undefined && v > max) v = max;
    if (step) v = Math.round(v/step)*step;
    input.value = v;
    return v;
  };
  const clampInput = (el, min, max) => {
    el && el.addEventListener('blur', () => {
      let v = parseFloat(el.value);
      el.value = isNaN(v) ? 0 : Math.max(min, Math.min(max, v)).toFixed(2);
    });
  };

  // Set initial defaults
  if (els.stack) els.stack.value = 100;
  if (els.t2Toggle) els.t2Toggle.value = "yes";
  if (els.orderUpdates) els.orderUpdates.value = 5;
  hide(els.minVol?.parentElement, els.stack?.parentElement, els.excludeT1Wrap, els.excludeCapWrap, els.buyQtyWrap, els.buyQtyPercWrap);

  // Always refresh adjusted prices cache (if needed)
  try {
    await fetchJSON(EVE_DATA.baseUrl + 'adjusted_prices.php', { timeout: 12000 });
  } catch (e) {
    console.warn('adjusted_prices refresh failed:', e?.message || e);
  }

  // Data load using plugin/ uploads base from PHP
  let [invTypes, marketGroups, reprocessYields, metaTypes] = await Promise.all([
    fetchJSON(EVE_DATA.baseUrl + 'data/invTypes.json'),
    fetchJSON(EVE_DATA.baseUrl + 'data/marketGroups.json'),
    fetchJSON(EVE_DATA.baseUrl + 'data/reprocess_yield.json'),
    fetchJSON(EVE_DATA.baseUrl + 'data/invMetaTypes.json'),
  ]);

  let adjustedPricesArray = await (async function() {
    let arr = [], i = 1, limit = 200;
    const basePath = EVE_DATA.uploadsBase + 'cache';
    while (true) {
      try {
        const data = await fetchJSON(`${basePath}/adjusted_prices_${i}.json`, { timeout: 12000 });
        if (!Array.isArray(data) || !data.length) break;
        arr = arr.concat(data);
        if (data.length < limit) break;
        i++;
      } catch {
        break; // stop on first miss/timeout
      }
    }
    return arr;
  })();

  let adjustedPricesByTypeID = {};
  adjustedPricesArray.forEach(obj => {
    if (obj.type_id && typeof obj.adjusted_price === "number") adjustedPricesByTypeID[obj.type_id] = obj.adjusted_price;
  });

  // Filters visibility logic
  function updateFiltersVisibility() {
    if (!els.groupSel) return;
    if (els.excludeT1 && els.excludeT1Wrap)
      els.excludeT1Wrap.classList.toggle('hidden', els.groupSel.value !== "9");
    if (els.excludeCapWrap)
      els.excludeCapWrap.classList.toggle('hidden', !["4","9","955"].includes(els.groupSel.value));
  }

  // Clamp standing inputs
// Strict-but-friendly standing inputs: allow typing, clamp bounds, format on blur
function wireStandingInput(el) {
  if (!el) return;
  // Block invalid keys immediately, but allow editing/navigation keys
  el.addEventListener('keydown', (e) => {
    const ctrlKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'];
    if (ctrlKeys.includes(e.key)) return;

    const char = e.key;
    const selStart = el.selectionStart ?? 0;
    const selEnd = el.selectionEnd ?? 0;
    const hasMinus = el.value.includes('-');
    const replacingAll = selStart === 0 && selEnd === el.value.length;

    // digits always ok
    if (/[0-9]/.test(char)) return;

    // one '.' allowed (or if the '.' in selection is being replaced)
    if (char === '.') {
      const selectionHasDot =
        el.value.slice(selStart, selEnd).includes('.');
      if (el.value.includes('.') && !selectionHasDot) e.preventDefault();
      return;
    }

    // '-' only at start; allow if cursor at 0 and there's no existing '-', 
    // or if the whole value is selected (replace-all)
    if (char === '-') {
      if (selStart !== 0 || (hasMinus && !replacingAll)) e.preventDefault();
      return;
    }

    // everything else blocked
    e.preventDefault();
  });

  // Guard against letters via paste
  el.addEventListener('paste', (e) => {
    const data = (e.clipboardData || window.clipboardData).getData('text');
    if (!/^[-]?\d*\.?\d*$/.test(data)) e.preventDefault();
  });


  // While typing: allow empty, "-", and up to 3 decimals; clamp only when clearly out of range
  el.addEventListener('input', () => {
    const s = el.value;

    // Allow intermediate states
    if (s === '' || s === '-' || s === '.' || s === '-.') return;

    // Keep only valid numeric characters
    if (!/^-?\d*(\.\d{0,3})?$/.test(s)) {
      el.value = s.replace(/[^0-9.\-]/g, '');
      return;
    }

    // Soft clamp when clearly beyond bounds
    const v = parseFloat(el.value);
    if (!isNaN(v)) {
      if (v > 10) el.value = '10';
      if (v < -10) el.value = '-10';
    }
  });

  // On blur: hard clamp and normalize to two decimals
  el.addEventListener('blur', () => {
    let v = parseFloat(el.value);
    if (isNaN(v)) v = 0;
    v = Math.max(-10, Math.min(10, v));
    el.value = v.toFixed(2);
  });
}

wireStandingInput(els.factionIn);
wireStandingInput(els.corpIn);


  // Event listeners for filters
  [
    els.hub, els.factionIn, els.corpIn, els.skill_accounting, els.skill_broker, els.skillBrokerAdv, els.skill_connections,
    els.skill_diplomacy, els.skill_scrapmetal,
    els.groupSel, els.t2Toggle, els.excludeT1, els.excludeCap
  ].forEach(el => el && el.addEventListener('input', () => {
    hideAllResultsBelowGenerateList();
    hide(els.minVol?.parentElement, els.stack?.parentElement, els.buyQtyWrap, els.buyQtyPercWrap, els.relistFeesWrap);
    updateFiltersVisibility();
  }));

  [
    els.includeSec, els.sellTo, els.minMargin, els.maxMargin,
    els.minVol, els.stack, els.buyQty, els.buyQtyPerc,
    els.relistFees, els.orderUpdates
  ].forEach(el => el && el.addEventListener('input', hideMarketGroupResultsOnly));

  // Buy QTY & Relist Fee logic
  if (els.buyQty) els.buyQty.addEventListener('change', () => {
    els.buyQtyPercWrap && els.buyQtyPercWrap.classList.toggle('hidden', els.buyQty.value !== 'yes');
    els.relistFeesWrap && els.relistFeesWrap.classList.toggle('hidden', els.buyQty.value !== 'yes');
    updateOrderUpdatesVisibility();
    hideMarketGroupResultsOnly();
  });

  if (els.relistFees) els.relistFees.addEventListener('change', () => {
    updateOrderUpdatesVisibility();
    hideMarketGroupResultsOnly();
  });

  if (els.buyQtyPerc) {
    ['input','blur'].forEach(evt => els.buyQtyPerc.addEventListener(evt, () => {
      sanitize(els.buyQtyPerc, {min:0, max:100, def:10});
      if (evt === 'input') hideMarketGroupResultsOnly();
    }));
  }

  // Escape/Clamp number inputs
  if (els.minVol) ['input','blur'].forEach(e=>els.minVol.addEventListener(e,()=>sanitize(els.minVol,{min:1,def:1})));
  if (els.stack) ['input','blur'].forEach(e=>els.stack.addEventListener(e,()=>sanitize(els.stack,{min:1,def:100})));
  if (els.minMargin) ['input','blur'].forEach(e=>els.minMargin.addEventListener(e,()=>sanitize(els.minMargin,{def:5})));
  if (els.maxMargin) ['input','blur'].forEach(e=>els.maxMargin.addEventListener(e,()=>sanitize(els.maxMargin,{def:25})));

  // UI buttons state
  function genPricesBtnReset() {
    els.genPrices.textContent = "";
    const span = document.createElement('span');
    span.className = "btn-text";
    span.textContent = "Generate Prices";
    els.genPrices.appendChild(span);
    els.genPrices.disabled = false;
    els.genPrices.classList.remove('loading');
  }
  function setGenPricesBtnRegenerate() {
    els.genPrices.textContent = "";
    const span = document.createElement('span');
    span.className = "btn-text";
    span.textContent = "Regenerate List & Prices";
    els.genPrices.appendChild(span);
    els.genPrices.disabled = false;
    els.genPrices.classList.remove('loading');
  }

  function getBuyQtySettings() {
    let enabled = false, percent = 0.10;
    if (els.buyQty && els.buyQty.value === 'yes') {
      enabled = true;
      if (els.buyQtyPerc && !isNaN(parseFloat(els.buyQtyPerc.value)))
        percent = Math.max(0, Math.min(100, parseFloat(els.buyQtyPerc.value))) / 100;
    }
    return { enabled, percent };
  }

  function getTopLevelGroup(marketGroupID) {
    let current = marketGroups[marketGroupID];
    while (current && current.parentGroupID !== "None") {
      marketGroupID = current.parentGroupID;
      current = marketGroups[marketGroupID];
    }
    return marketGroupID;
  }
  
  // Returns true if marketGroupID is the same as or a descendant of rootGroupID
  function isInGroupTree(marketGroupID, rootGroupID) {
    let current = marketGroups[String(marketGroupID)];
    while (current) {
      if (String(marketGroupID) === String(rootGroupID)) return true;
      if (current.parentGroupID === "None") break;
      marketGroupID = current.parentGroupID;
      current = marketGroups[String(marketGroupID)];
    }
    return false;
  }

  function hasValidMetaGroup(typeID) {
    const entry = metaTypes[typeID];
    const excludeT2 = els.t2Toggle?.value || "no";
    if (entry === undefined || entry === null) return true;
    return excludeT2 === "yes" ? (entry === 1) : (entry === 1 || entry === 2);
  }

  function isCapitalItem(item) {
    if (!item || !item.marketGroupID) return false;
    let groupID = item.marketGroupID;
    while (groupID && marketGroups[groupID]) {
      const group = marketGroups[groupID];
      if ((group.name || '').toLowerCase().includes('capital')) return true;
      groupID = group.parentGroupID;
      if (!groupID || groupID === "None") break;
    }
    return false;
  }

  // Update Market Group Results
  let needRegenerate = false;
  els.generate.addEventListener('click', updateMarketGroupResults);

  function updateMarketGroupResults() {
    els.generate.disabled = true;
    els.generate.classList.add('loading');
    els.generate.textContent = "";
    const spinner = document.createElement('span');
    spinner.className = "spinner";
    const span = document.createElement('span');
    span.className = "btn-text";
    span.innerHTML = 'List Generating<br><small>This may take several seconds<br>Do not refresh the page</small>';
    els.generate.appendChild(spinner);
    els.generate.appendChild(span);

    requestAnimationFrame(() => {
      setTimeout(() => {
        const selectedTopGroup = els.groupSel.value;
        const yieldText = els.yield.textContent || "0%";
        const yieldPercent = (yieldText.match(/([\d.]+)%/) ? parseFloat(yieldText) : 0) / 100;

        const itemBreakdown = [];

        Object.entries(invTypes)
          .filter(([name, item]) => {
            const topGroup = item.marketGroupID ? getTopLevelGroup(item.marketGroupID) : null;
            // Special-case exact Implants group: when selectedTopGroup is '27', require exact match
            if (selectedTopGroup === '27') {
              // Include items in Implants (27) or any of its descendants
              if (!isInGroupTree(item.marketGroupID, '27')) return false;
            } else {
              if (topGroup !== selectedTopGroup) return false;
            }
            if (!hasValidMetaGroup(item.typeID)) return false;
            if (!item.published) return false;
            if (els.excludeT1 && els.excludeT1.value === 'yes' && selectedTopGroup === '9') {
              if (Object.prototype.hasOwnProperty.call(invTypes, name + ' Blueprint')) return false;
            }
            if (els.excludeCap && els.excludeCap.value === 'yes' && isCapitalItem(item)) return false;
            return true;
          })
          .forEach(([name, item]) => {
            const typeID = item.typeID;
            const yieldData = reprocessYields[typeID];
            if (!yieldData) return;
            const components = Object.entries(yieldData).map(([matID, qty]) => {
              const portionSize = item.portionSize || 1;
              const perItemQty = (qty * yieldPercent) / portionSize;
              if (perItemQty < 0.0001) return null;
              const mineralEntry = Object.entries(invTypes).find(([, v]) => v.typeID == matID);
              const mineralName = mineralEntry ? mineralEntry[0] : `#${matID}`;
              return { mineralName, perItemQty };
            }).filter(Boolean);
            itemBreakdown.push({ name, components });
          });

        // Clear and repopulate list
        while (els.groupResults.firstChild) els.groupResults.removeChild(els.groupResults.firstChild);
        if (!itemBreakdown.length) {
          const li = document.createElement('li');
          const em = document.createElement('em');
          em.textContent = "No items found for this group";
          li.appendChild(em);
          els.groupResults.appendChild(li);
        } else {
          itemBreakdown.forEach(item => {
            const li = document.createElement('li');
            li.setAttribute('data-name', item.name);
            li.setAttribute('data-components', JSON.stringify(item.components));
            li.textContent = item.name;
            els.groupResults.appendChild(li);
          });
        }

        show(els.groupResultsWrap, els.afterGen, els.genPrices);
        if (els.minVol) show(els.minVol.parentElement);
        if (els.stack) show(els.stack.parentElement);
        if (els.buyQtyWrap) show(els.buyQtyWrap);
        if (els.buyQty && els.buyQty.value === 'yes' && els.buyQtyPercWrap) show(els.buyQtyPercWrap);

        
        if (els.buyQty && els.buyQty.value === 'yes' && els.relistFeesWrap) show(els.relistFeesWrap);
genPricesBtnReset();
        needRegenerate = false;
        els.generate.disabled = false;
        els.generate.classList.remove('loading');
        els.generate.textContent = "";
        const genSpan = document.createElement('span');
        genSpan.className = "btn-text";
        genSpan.textContent = "Generate List";
        els.generate.appendChild(genSpan);
      }, 10);
    });
  }

  // Generate Prices logic
  let currentMaterialPrices = {}, currentSellPrices = {}, currentVolumes = {};
  els.genPrices.addEventListener('click', async () => {
    if (needRegenerate) {
      updateMarketGroupResults();
      setTimeout(runGeneratePrices, 300);
    } else runGeneratePrices();
  });

  async function fetchBatch(batch) {
    try {
      const data = await fetchJSON(EVE_DATA.baseUrl + 'price_api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': EVE_DATA.nonce
        },
        body: JSON.stringify({
          hub: els.hub.value,
          includeSecondary: els.includeSec.value,
          materials: batch
        }),
        timeout: 15000
      });
      // Ensure object shape
      return {
        buy:     (data && typeof data.buy     === 'object') ? data.buy     : {},
        sell:    (data && typeof data.sell    === 'object') ? data.sell    : {},
        volumes: (data && typeof data.volumes === 'object') ? data.volumes : {}
      };
    } catch (e) {
      console.warn('price_api batch failed:', e?.message || e);
      return { buy: {}, sell: {}, volumes: {} };
    }
  }


  
  function computePotentialProfit() {
    try {
      const { enabled: buyQtyEnabled, percent: buyQtyPercent } = getBuyQtySettings();
      const labelText = buyQtyEnabled ? 'Potential Daily Profit:' : 'Potential Profit:';
      if (els.potentialProfitLabel) els.potentialProfitLabel.textContent = labelText;

      let totalProfit = 0;
      const sellTo = els.sellTo?.value === 'sell' ? 'sell' : 'buy';
      const stackSize = Math.max(1, parseInt(els.stack?.value || '1', 10));

      /* use live price maps */

      const salesTaxRate = Math.max(0, parseFloat(els.salesTax?.textContent || '0')) / 100;
      const reprocessTaxRate = Math.max(0, parseFloat(els.tax?.textContent || '0')) / 100;
      const brokerageFeeRate = Math.max(0, parseFloat(els.brokerFee?.textContent || '0')) / 100;

      Array.from(els.groupResults.querySelectorAll('li')).forEach(li => {
        if (li.style.display === 'none' || li.querySelector('em')) return;

        let components = [];
        try { components = JSON.parse(li.getAttribute('data-components') || '[]'); } catch {}

        let totalYieldValue = 0;
        components.forEach(({ mineralName, perItemQty }) => {
          const totalQty = Math.floor(perItemQty * stackSize);
          if (totalQty < 1) return;
          const price = sellTo === 'sell'
            ? (currentSellPrices[mineralName] ?? 0)
            : (currentMaterialPrices[mineralName] ?? 0);
          totalYieldValue += totalQty * price;
        });

        const yieldAfterReprocess = totalYieldValue * (1 - reprocessTaxRate);

        let sellProceeds = yieldAfterReprocess * (1 - salesTaxRate);
        if (sellTo === 'sell') sellProceeds *= (1 - brokerageFeeRate);

        const itemBuyPrice = parseFloat(li.getAttribute('data-buy') || '0') || 0;
        const buyCost = itemBuyPrice * (1 + brokerageFeeRate);

        const perItemProfit = sellProceeds - buyCost;

        const volume = parseInt(li.getAttribute('data-volume') || '0', 10) || 0;
        const { enabled: buyQtyEnabled2, percent: buyQtyPercent2 } = getBuyQtySettings();
        const qty = buyQtyEnabled2 ? Math.round(volume * buyQtyPercent2) : volume;

        if (qty > 0) totalProfit += perItemProfit * qty;
      });

      if (els.potentialProfitWrap && els.potentialProfitValue) {
        els.potentialProfitValue.textContent = Math.floor(totalProfit).toLocaleString();
        show(els.potentialProfitWrap);
      }
    } catch (e) {
      console.warn('Potential Profit calc failed', e);
      els.potentialProfitWrap && hide(els.potentialProfitWrap);
    }
  }
function maybeShowCopyMarketQuickbar() {
    const visibleItems = Array.from(els.groupResults.querySelectorAll('li'))
      .filter(li => li.style.display !== 'none' && !li.querySelector('em'));
    els.copyQuickbar.classList.toggle('hidden', !visibleItems.length);
    if (!visibleItems.length) { els.potentialProfitWrap && hide(els.potentialProfitWrap); } else { computePotentialProfit(); }
  }

  function getNextOrderValue(current, steps = 5) {
    if (!current) return 0;
    const abs = Math.abs(current);
    const sig = Math.floor(Math.log10(abs));
    const step = Math.pow(10, sig - 3);
    let v = Math.round(current / step) * step + steps * step;
    const factor = Math.pow(10, sig - 3);
    return Math.round(v / factor) * factor;
  }

  function calculateRelistFee(oldValue, newValue, brokerFeeRate, advBrokerLvl) {
    const first = (1 - (0.50 + 0.06 * advBrokerLvl)) * brokerFeeRate * newValue;
    const second = brokerFeeRate * Math.max(newValue - oldValue, 0);
    const total = Math.max(first + second, 100);
    return total;
  }

  function runGeneratePrices() {
    if (els.noResults) hide(els.noResults);
    els.genPrices.disabled = true;
    els.genPrices.classList.add('loading');
    els.genPrices.textContent = "";
    const spinner = document.createElement('span');
    spinner.className = "spinner";
    const span = document.createElement('span');
    span.className = "btn-text";
    span.innerHTML = 'Prices Generating<br><small>This may take several minutes<br>Do not refresh the page</small>';
    els.genPrices.appendChild(spinner);
    els.genPrices.appendChild(span);

    let minMargin = els.minMargin ? sanitize(els.minMargin, {def:5}) : 5;
    let maxMargin = els.maxMargin ? sanitize(els.maxMargin, {def:25}) : 25;
    let minDailyVolume = els.minVol ? sanitize(els.minVol, {min:1,def:1}) : 1;
    let stackSize = els.stack ? sanitize(els.stack,{min:1,def:100}) : 100;
    const { enabled: buyQtyEnabled, percent: buyQtyPercent } = getBuyQtySettings();
    const sellTo = els.sellTo?.value || 'buy';

    const itemNames = Array.from(els.groupResults.querySelectorAll('li'))
      .map(li => li.dataset.name).filter(Boolean);

    const batchSize = 30;
    const batches = [];
    for (let i = 0; i < itemNames.length; i += batchSize)
      batches.push(itemNames.slice(i, i + batchSize));

    (async () => {
      const priceResults = [];
      for (const batch of batches) {
        priceResults.push(await fetchBatch(batch));
        await new Promise(res => setTimeout(res, 400));
      }
      const allBuy = {}, allSell = {}, allVolumes = {};
      priceResults.forEach(data => {
        Object.assign(allBuy, data.buy || {});
        Object.assign(allSell, data.sell || {});
        Object.assign(allVolumes, data.volumes || {});
      });

      const filteredItemNames = itemNames.filter(name => (allVolumes[name] || 0) > 0);

      // Determine all required minerals
      let materialsNeeded = new Set();
      filteredItemNames.forEach(itemName => {
        const item = invTypes[itemName];
        if (!item) return;
        const yieldData = reprocessYields[item.typeID];
        if (!yieldData) return;
        Object.keys(yieldData).forEach(matID => {
          const mineralEntry = Object.entries(invTypes).find(([, v]) => v.typeID == matID);
          if (mineralEntry) materialsNeeded.add(mineralEntry[0]);
        });
      });
      filteredItemNames.forEach(n => materialsNeeded.delete(n));
      let allNames = [...filteredItemNames, ...Array.from(materialsNeeded)];
 
/* MATERIALS_UNION (data-driven) */
try {
  // Ensure we have invTypes and reprocess maps in memory; fetch if not
  if (typeof INV_TYPES === 'undefined' || !INV_TYPES) {
    INV_TYPES = await fetchJSON(EVE_DATA.baseUrl + 'data/invTypes.json');
  }
  if (typeof REPROCESS_YIELD === 'undefined' || !REPROCESS_YIELD) {
    REPROCESS_YIELD = await fetchJSON(EVE_DATA.baseUrl + 'data/reprocess_yield.json');
  }
  const nameByTypeId = new Map();
  const typeIdByName = new Map();
  for (const [nm, info] of Object.entries(INV_TYPES || {})) {
    const tid = (info && (info.typeID ?? info.typeId)) | 0;
    if (tid) { nameByTypeId.set(tid, nm); typeIdByName.set(nm, tid); }
  }
  const minerals = new Set();
  for (const nm of allNames) {
    const tid = typeIdByName.get(nm);
    if (!tid) continue;
    const parts = (REPROCESS_YIELD && REPROCESS_YIELD[tid]) || [];
    for (const m of (Array.isArray(parts) ? parts : [])) {
      const mtid = (m && (m.typeID ?? m.typeId)) | 0;
      if (!mtid) continue;
      const mname = m.name || nameByTypeId.get(mtid);
      if (mname) minerals.add(mname);
    }
  }
  allNames = Array.from(new Set([...allNames, ...minerals]));
} catch (e) {
  console.warn('materials union failed (continuing with items only)', e);
}
     const materialBatches = [];
      for (let i = 0; i < allNames.length; i += batchSize)
        materialBatches.push(allNames.slice(i, i + batchSize));

      const finalPriceResults = [];
      for (const batch of materialBatches) {
        finalPriceResults.push(await fetchBatch(batch));
        await new Promise(res => setTimeout(res, 400));
      }
      const finalBuy = {}, finalSell = {}, finalVolumes = {};
      finalPriceResults.forEach(data => {
        Object.assign(finalBuy, data.buy || {});
        Object.assign(finalSell, data.sell || {});
        Object.assign(finalVolumes, data.volumes || {});
      });
      currentMaterialPrices = finalBuy;
      currentSellPrices = finalSell;
      currentVolumes = finalVolumes;

      let anyVisible = false;
      els.groupResults.querySelectorAll('li').forEach(li => {
        const itemName = li.dataset.name;
        if (!filteredItemNames.includes(itemName)) {
          li.style.display = 'none';
          return;
        }
        let components = [];
        try { components = JSON.parse(li.dataset.components || '[]'); }
        catch { components = []; }

        const priceSource = sellTo === 'sell' ? 'sell' : 'buy';

        let totalYieldValue = 0, adjustedValue = 0;
        components.forEach(({ mineralName, perItemQty }) => {
          const totalQty = Math.floor(perItemQty * stackSize);
          if (totalQty < 1) return;
          const price = priceSource === 'sell'
            ? currentSellPrices[mineralName] ?? 0
            : currentMaterialPrices[mineralName] ?? 0;
          totalYieldValue += totalQty * price;
          const typeID = invTypes[mineralName]?.typeID;
          if (typeID && adjustedPricesByTypeID[typeID])
            adjustedValue += totalQty * adjustedPricesByTypeID[typeID];
        });

        const perItemYieldValue = stackSize > 0 ? totalYieldValue / stackSize : 0;
        const reprocessTaxText = els.tax.textContent || "0%";
        const reprocessTaxMatch = reprocessTaxText.match(/([\d.]+)%/);
        const reprocessTaxRate = reprocessTaxMatch ? parseFloat(reprocessTaxMatch[1]) / 100 : 0;
        const taxAmount = adjustedValue * reprocessTaxRate;

        const netTotal = stackSize > 0 ? (totalYieldValue - taxAmount) / stackSize : 0;
        const itemBuyPrice = currentMaterialPrices[itemName] ?? 0;
        const volume = currentVolumes[itemName] ?? 0;

        const brokerFeeText = els.brokerFee.textContent || "0%";
        const brokerFeeMatch = brokerFeeText.match(/([\d.]+)%/);
        const brokerageFeeRate = brokerFeeMatch ? parseFloat(brokerFeeMatch[1]) / 100 : 0;

        const salesTaxText = els.salesTax.textContent || "0%";
        const salesTaxMatch = salesTaxText.match(/([\d.]+)%/);
        const salesTaxRate = salesTaxMatch ? parseFloat(salesTaxMatch[1]) / 100 : 0;

        const itemBrokerage = itemBuyPrice * brokerageFeeRate;
        let yieldAfterFees = netTotal;
        if (sellTo === 'buy') yieldAfterFees = yieldAfterFees * (1 - salesTaxRate);
        else if (sellTo === 'sell') yieldAfterFees = yieldAfterFees * (1 - brokerageFeeRate) * (1 - salesTaxRate);
        yieldAfterFees -= itemBrokerage;

        let relistFeeTotal = 0;
        if (
          els.buyQty && els.buyQty.value === 'yes' &&
          els.relistFees && els.relistFees.value === 'yes' &&
          els.orderUpdates && !isNaN(parseInt(els.orderUpdates.value)) && parseInt(els.orderUpdates.value) > 0
        ) {
          const updates = parseInt(els.orderUpdates.value);
          const advBrokerLvl = parseInt(els.skillBrokerAdv?.value || 0);
          const brokerFee = brokerageFeeRate;
          let orderValue = itemBuyPrice;
          for (let u = 0; u < updates; ++u) {
            const newOrderValue = getNextOrderValue(orderValue, 5);
            const fee = calculateRelistFee(orderValue, newOrderValue, brokerFee, advBrokerLvl);
            relistFeeTotal += fee;
            orderValue = newOrderValue;
          }
          yieldAfterFees -= relistFeeTotal;
        }

        let qtyDisplay = volume;
        if (buyQtyEnabled) qtyDisplay = Math.round(volume * buyQtyPercent);

        let margin = itemBuyPrice > 0 ? ((yieldAfterFees - itemBuyPrice) / itemBuyPrice) * 100 : 0;
        margin = Number.isFinite(margin) ? margin.toFixed(2) : "0.00";

        const formattedBuy = itemBuyPrice % 1 === 0 ? itemBuyPrice.toFixed(0) : itemBuyPrice.toFixed(2);
        const formattedNet = Math.floor(yieldAfterFees).toString();

        li.textContent = `${itemName} [${formattedBuy} / ${formattedNet} / ${qtyDisplay} / ${margin}%]`;
        li.dataset.qty = qtyDisplay;

        if (
          itemBuyPrice === 0 ||
          perItemYieldValue <= 0 ||
          volume === 0 ||
          margin < minMargin ||
          margin > maxMargin ||
          volume < minDailyVolume
        ) {
          li.style.display = 'none';
        } else {
          li.style.display = 'list-item';
          anyVisible = true;
        }
      });

      if (!anyVisible && els.noResults) show(els.noResults); else if (els.noResults) hide(els.noResults);

      els.genPrices.disabled = false;
      els.genPrices.classList.remove('loading');
      genPricesBtnReset();
      maybeShowCopyMarketQuickbar();
      computePotentialProfit();
      // Compute Potential Profit/Daily Profit (moved to function)
      try {
        const { enabled: buyQtyEnabled, percent: buyQtyPercent } = getBuyQtySettings();
        const labelText = buyQtyEnabled ? 'Potential Daily Profit:' : 'Potential Profit:';
        if (els.potentialProfitLabel) els.potentialProfitLabel.textContent = labelText;
        let totalProfit = 0;
        Array.from(els.groupResults.querySelectorAll('li')).forEach(li => {
          if (li.style.display === 'none' || li.querySelector('em')) return;
          const itemName = li.getAttribute('data-name') || '';
          let components = [];
          try { components = JSON.parse(li.getAttribute('data-components') || '[]'); } catch {}
          const stackSize = Math.max(1, parseInt(els.stack?.value || '1', 10));
          /* using live price maps */
          const sellTo = els.sellTo?.value === 'sell' ? 'sell' : 'buy';

          let totalYieldValue = 0, adjustedValue = 0;
          components.forEach(({ mineralName, perItemQty }) => {
            const totalQty = Math.floor(perItemQty * stackSize);
            if (totalQty < 1) return;
            const price = sellTo === 'sell' ? (currentSellPrices[mineralName] ?? 0) : (currentMaterialPrices[mineralName] ?? 0);
            totalYieldValue += totalQty * price;
            const typeID = invTypes[mineralName]?.typeID;
            if (typeID && adjustedPricesByTypeID[typeID])
              adjustedValue += totalQty * adjustedPricesByTypeID[typeID];
          });

          const reprocessTaxText = els.tax.textContent || "0%";
          const reprocessTaxMatch = reprocessTaxText.match(/([\d.]+)%/);
          const reprocessTaxRate = reprocessTaxMatch ? parseFloat(reprocessTaxMatch[1]) / 100 : 0;
          const taxAmount = adjustedValue * reprocessTaxRate;
          const netTotal = stackSize > 0 ? (totalYieldValue - taxAmount) / stackSize : 0;

          const itemBuyPrice = currentMaterialPrices[itemName] ?? 0;
          const volume = currentVolumes[itemName] ?? 0;

          const brokerFeeText = els.brokerFee.textContent || "0%";
          const brokerFeeMatch = brokerFeeText.match(/([\d.]+)%/);
          const brokerageFeeRate = brokerFeeMatch ? parseFloat(brokerFeeMatch[1]) / 100 : 0;

          const salesTaxText = els.salesTax.textContent || "0%";
          const salesTaxMatch = salesTaxText.match(/([\d.]+)%/);
          const salesTaxRate = salesTaxMatch ? parseFloat(salesTaxMatch[1]) / 100 : 0;

          let sellProceeds = netTotal;
          if (sellTo === 'buy') sellProceeds = sellProceeds * (1 - salesTaxRate);
          else if (sellTo === 'sell') sellProceeds = sellProceeds * (1 - brokerageFeeRate) * (1 - salesTaxRate);

          const itemBrokerage = itemBuyPrice * brokerageFeeRate;

          let relistFeeTotal = 0;
          if (
            els.buyQty && els.buyQty.value === 'yes' &&
            els.relistFees && els.relistFees.value === 'yes' &&
            els.orderUpdates && !isNaN(parseInt(els.orderUpdates.value)) && parseInt(els.orderUpdates.value) > 0
          ) {
            const updates = parseInt(els.orderUpdates.value);
            const advBrokerLvl = parseInt(els.skillBrokerAdv?.value || 0);
            const brokerFee = brokerageFeeRate;
            let orderValue = itemBuyPrice;
            for (let u = 0; u < updates; ++u) {
              const newOrderValue = getNextOrderValue(orderValue, 5);
              const fee = calculateRelistFee(orderValue, newOrderValue, brokerFee, advBrokerLvl);
              relistFeeTotal += fee;
              orderValue = newOrderValue;
            }
            sellProceeds -= relistFeeTotal;
          }

          const perItemProfit = (sellProceeds - itemBrokerage) - itemBuyPrice;
          const qty = buyQtyEnabled ? Math.round(volume * buyQtyPercent) : volume;
          if (qty > 0) totalProfit += perItemProfit * qty;
        });

        if (els.potentialProfitWrap && els.potentialProfitValue) {
          els.potentialProfitValue.textContent = Math.floor(totalProfit).toLocaleString();
          show(els.potentialProfitWrap);
        }
      } catch (e) {
        console.warn('Potential Profit calc failed', e);
        els.potentialProfitWrap && hide(els.potentialProfitWrap);
      }

      show(els.groupResultsWrap);
    })();
  }

  // Quickbar Copy
  els.copyQuickbar.addEventListener('click', () => {
    const selectedGroup = els.groupSel.options[els.groupSel.selectedIndex]?.text || 'Unknown Group';
    const visibleItems = Array.from(els.groupResults.querySelectorAll('li'))
      .filter(li => li.style.display !== 'none' && !li.querySelector('em'));
    if (!visibleItems.length) return;
    const { enabled: buyQtyEnabled } = getBuyQtySettings();
    const quickbarItems = visibleItems.map(li => {
      let [itemName, bracketData] = li.textContent.split('[');
      itemName = itemName.trim();
      if (!bracketData) return `- ${li.textContent}`;
      bracketData = bracketData.replace(']', '').trim();
      const bracketParts = bracketData.split('/').map(s => s.trim());
      let qtyPart = buyQtyEnabled ? (li.dataset.qty || bracketParts[2]) : bracketParts[2];
      let quickbarParts = [bracketParts[1], qtyPart, bracketParts[3]];
      let joined = quickbarParts.join('|');
      if (joined.length > 25) joined = joined.slice(0, 25);
      return `- ${itemName} [${joined}]`;
    });
    const quickbar = `+ ${selectedGroup}\n${quickbarItems.join('\n')}`;
    navigator.clipboard.writeText(quickbar).then(() => {
      els.copyQuickbar.textContent = "Copied!";
      setTimeout(() => { els.copyQuickbar.textContent = "Copy Market Quickbar"; }, 1500);
    });
  });

  // Skills calculation & results
  function updateResults() {
    const accounting = parseFloat(els.skill_accounting?.value || 0);
    const broker = parseFloat(els.skill_broker?.value || 0);
    const conn = parseFloat(els.skill_connections?.value || 0);
    const diplo = parseFloat(els.skill_diplomacy?.value || 0);
    const scrap = parseFloat(els.skill_scrapmetal?.value || 0);

    let baseFaction = parseFloat(els.factionIn?.value || 0);
    let baseCorp = parseFloat(els.corpIn?.value || 0);
    const clampStanding = v => Math.max(-10, Math.min(10, v));
    baseFaction = clampStanding(baseFaction);
    baseCorp = clampStanding(baseCorp);

    let factionEff = baseFaction < 0
      ? baseFaction + ((10 - baseFaction) * 0.04 * diplo)
      : baseFaction + ((10 - baseFaction) * 0.04 * conn);
    let corpEff = baseCorp < 0
      ? baseCorp + ((10 - baseCorp) * 0.04 * diplo)
      : baseCorp + ((10 - baseCorp) * 0.04 * conn);

    const factionEffClamped = clampStanding(factionEff);
    const corpEffClamped = clampStanding(corpEff);

    const brokerFee = Math.max(0, 3 - (0.3 * broker) - (0.03 * baseFaction) - (0.02 * baseCorp));
    const reprocessTax = corpEffClamped <= 0
      ? 5.0
      : corpEffClamped < 6.67
        ? +(0.05 * (1 - corpEffClamped / 6.67)).toFixed(4) * 100
        : 0;
    const salesTax = 7.5 * (1 - (0.11 * accounting));
    const yieldPercent = 50 * (1 + 0.02 * scrap);

    // Effective boxes
    els.factionRes.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = 'Effective:';
    els.factionRes.appendChild(strong);
    els.factionRes.appendChild(document.createTextNode(' ' + factionEffClamped.toFixed(2)));

    els.corpRes.textContent = '';
    const strong2 = document.createElement('strong');
    strong2.textContent = 'Effective:';
    els.corpRes.appendChild(strong2);
    els.corpRes.appendChild(document.createTextNode(' ' + corpEffClamped.toFixed(2)));

    // Skills Used Box
    while (els.skillsBox.firstChild) els.skillsBox.removeChild(els.skillsBox.firstChild);
    const wrapper = document.createElement('div');
    wrapper.className = 'skills-wrapper';
    function mkRow(label, value) {
      const row = document.createElement('div');
      row.className = 'skills-row';
      const b = document.createElement('strong');
      b.textContent = label;
      const br = document.createElement('br');
      const em = document.createElement('em');
      em.textContent = value;
      row.appendChild(b);
      row.appendChild(br);
      row.appendChild(em);
      return row;
    }
    wrapper.appendChild(mkRow('Skill Used (Faction)', baseFaction < 0 ? 'Diplomacy' : 'Connections'));
    wrapper.appendChild(mkRow('Skill Used (Corp)', baseCorp < 0 ? 'Diplomacy' : 'Connections'));
    els.skillsBox.appendChild(wrapper);

    // Fee and yield boxes
    els.brokerFee.textContent = `${brokerFee.toFixed(2)}%`;
    els.tax.textContent = `${reprocessTax.toFixed(2)}%`;
    els.salesTax.textContent = `${salesTax.toFixed(2)}%`;
    els.yield.textContent = `${yieldPercent.toFixed(2)}%`;
  }

  els.hub.addEventListener('change', () => {
    updateResults();
    updateFiltersVisibility();
    const hubToFactionCorp = {
      jita: { faction: "Caldari State", corp: "Caldari Navy" },
      amarr: { faction: "Amarr Empire", corp: "Emperor Family" },
      rens: { faction: "Minmatar Republic", corp: "Brutor Tribe" },
      hek: { faction: "Minmatar Republic", corp: "Boundless Creations" },
      dodixie: { faction: "Gallente Federation", corp: "Federation Navy" },
    };
    const data = hubToFactionCorp[els.hub.value] || { faction: "[Faction]", corp: "[Corporation]" };
    els.factionLabel.textContent = `Base ${data.faction} Standing`;
    els.corpLabel.textContent = `Base ${data.corp} Standing`;
  });

  document.querySelectorAll('select, input[type="number"]').forEach(el => el.addEventListener('input', updateResults));

  // Initial UI state
  hideAllResultsBelowGenerateList();
  updateFiltersVisibility();
  genPricesBtnReset();
  updateOrderUpdatesVisibility();
  updateResults();
  // Ensure correct visibility on initial load
  updateT2VisibilityForGroup();
  // Update when market group changes
  if (els.groupSel) els.groupSel.addEventListener('change', updateT2VisibilityForGroup);
});


// === Order updates integer-only guard (v7) ===
(function(){
  function bindInt(id){
    const el = document.getElementById(id);
    if (!el) return;
    const nav = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'];
    el.addEventListener('keydown', (e) => {
      if (nav.includes(e.key)) return;
      if (/^[0-9]$/.test(e.key)) return;
      e.preventDefault();
    });
    el.addEventListener('input', () => {
      const digits = (el.value || '').replace(/\D+/g, '');
      el.value = digits === '' ? '' : String(Math.max(1, parseInt(digits, 10)));
    });
    el.addEventListener('paste', (e) => {
      const data = (e.clipboardData || window.clipboardData).getData('text');
      if (!/^\d+$/.test(data)) e.preventDefault();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bindInt('order_updates'));
  } else {
    bindInt('order_updates');
  }
})();

// === End order updates guard (v7) ===
