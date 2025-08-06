document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const hubSelect = document.getElementById('hub_select');
    const generateBtn = document.getElementById('generate_btn');
    const generatePricesBtn = document.getElementById('generate_prices_btn');
    const copyMarketQuickbarBtn = document.getElementById('copy_market_quickbar_btn');
    const includeSecondarySelect = document.getElementById('include_secondary');
    const sellToSelect = document.getElementById('sell_to_select');
    const afterGenerateControls = document.getElementById('after_generate_controls');
    const tableWrapper = document.getElementById('price_table_wrapper');
    const outputTable = document.getElementById('output_price_table');
    const outputTableBody = outputTable.querySelector('tbody');
    const regionHeader = document.getElementById('region_volume_header');
    const materialListFlat = document.getElementById('material_list_flat');
    const marketGroupResults = document.getElementById('market_group_results');
    const marketGroupResultsWrapper = document.getElementById('market_group_results_wrapper');
    const standingInputsWrapper = document.getElementById('standing_inputs_wrapper');
    const resultSkillsBox = document.getElementById('result_skills');
    const factionLabel = document.getElementById('faction_label');
    const corpLabel = document.getElementById('corp_label');
    const factionInput = document.getElementById('faction_standing_input');
    const corpInput = document.getElementById('corp_standing_input');
    const factionResult = document.getElementById('faction_standing_result');
    const corpResult = document.getElementById('corp_standing_result');
    const brokerFeeOutput = document.getElementById('broker_fee');
    const taxOutput = document.getElementById('reprocess_tax');
    const salesTaxOutput = document.getElementById('sales_tax');
    const yieldOutput = document.getElementById('reprocess_yield');
    const marketGroupSelect = document.getElementById('market_group_select');
    const t2Toggle = document.getElementById('include_t2');
    const marginFieldsWrapper = document.getElementById('margin_fields_wrapper');
    const minMarginInput = document.getElementById('min_margin');
    const maxMarginInput = document.getElementById('max_margin');
    const minDailyVolumeInput = document.getElementById('min_daily_volume');
    const stackSizeInput = document.getElementById('stack_size');
    const excludeT1Select = document.getElementById('exclude_t1');
    const excludeT1Wrapper = document.getElementById('exclude_t1_wrapper');
    const excludeCapitalSelect = document.getElementById('exclude_capital');
    const excludeCapitalWrapper = document.getElementById('exclude_capital_wrapper');
    const noResultsMessage = document.getElementById('no_results_message');
    // ---- NEW ELEMENTS for Buy QTY logic ----
    const buyQtyRecommendationWrapper = document.getElementById('buy_qty_recommendation_wrapper');
    const buyQtyRecommendation = document.getElementById('buy_qty_recommendation');
    const buyQtyPercentageWrapper = document.getElementById('buy_qty_percentage_wrapper');
    const buyQtyPercentage = document.getElementById('buy_qty_percentage');
    // ----------------------------------------
    await fetch('/wp-content/plugins/eve-reprocess-trading/adjusted_prices.php?refresh=1');

    // XSS Escape
    function escapeHTML(str) {
        return String(str).replace(/[&<>"']/g, function(m) {
            return ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[m];
        });
    }

    // Input sanitization function for number inputs
    function sanitizeInput(input, options = {}) {
        let v = parseFloat(input.value);
        if (isNaN(v)) v = options.default ?? 0;
        if (options.hasOwnProperty('min') && v < options.min) v = options.min;
        if (options.hasOwnProperty('max') && v > options.max) v = options.max;
        if (options.hasOwnProperty('step') && options.step > 0) {
            v = Math.round(v / options.step) * options.step;
        }
        input.value = v;
        return v;
    }

    // Set defaults
    if (stackSizeInput) stackSizeInput.value = 100;
    if (t2Toggle) t2Toggle.value = "yes";

    generateBtn.addEventListener('click', updateMarketGroupResults);

    if (minDailyVolumeInput) minDailyVolumeInput.parentElement.style.display = 'none';
    if (stackSizeInput) stackSizeInput.parentElement.style.display = 'none';
    if (excludeT1Wrapper) excludeT1Wrapper.style.display = 'none';
    if (excludeCapitalWrapper) excludeCapitalWrapper.style.display = 'none';
    if (buyQtyRecommendationWrapper) buyQtyRecommendationWrapper.style.display = 'none';
    if (buyQtyPercentageWrapper) buyQtyPercentageWrapper.style.display = 'none';

    let needRegenerateListAndPrices = false;

    function hideAllResultsBelowGenerateList() {
        marketGroupResultsWrapper.style.display = 'none';
        generatePricesBtn.style.display = 'none';
        copyMarketQuickbarBtn.style.display = 'none';
        afterGenerateControls.style.display = 'none';
        tableWrapper.style.display = 'none';
        if (marginFieldsWrapper) marginFieldsWrapper.style.display = 'none';
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        if (minDailyVolumeInput) minDailyVolumeInput.parentElement.style.display = 'none';
        if (stackSizeInput) stackSizeInput.parentElement.style.display = 'none';
        if (buyQtyRecommendationWrapper) buyQtyRecommendationWrapper.style.display = 'none';
        if (buyQtyPercentageWrapper) buyQtyPercentageWrapper.style.display = 'none';
        resetGeneratePricesBtn();
        needRegenerateListAndPrices = false;
    }

    function hideMarketGroupResultsOnly() {
        marketGroupResultsWrapper.style.display = 'none';
        tableWrapper.style.display = 'none';
        copyMarketQuickbarBtn.style.display = 'none';
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        setGeneratePricesBtnToRegenerate();
        needRegenerateListAndPrices = true;
    }

    function resetGeneratePricesBtn() {
        generatePricesBtn.innerHTML = `<span class="btn-text">Generate Prices</span>`;
        generatePricesBtn.disabled = false;
        generatePricesBtn.classList.remove('loading');
    }
    function setGeneratePricesBtnToRegenerate() {
        generatePricesBtn.innerHTML = `<span class="btn-text">Regenerate List & Prices</span>`;
        generatePricesBtn.disabled = false;
        generatePricesBtn.classList.remove('loading');
    }

    function updateSpecialFiltersVisibility() {
        if (excludeT1Select && excludeT1Wrapper) {
            if (marketGroupSelect.value === "9") {
                excludeT1Wrapper.style.display = 'block';
            } else {
                excludeT1Wrapper.style.display = 'none';
                excludeT1Select.value = 'no';
            }
        }
        const showCapital = ["4", "9", "955"].includes(marketGroupSelect.value);
        if (excludeCapitalWrapper) {
            excludeCapitalWrapper.style.display = showCapital ? 'block' : 'none';
            if (!showCapital && excludeCapitalSelect) excludeCapitalSelect.value = "yes";
        }
    }

    marketGroupSelect.addEventListener('change', () => {
        updateSpecialFiltersVisibility();
        hideAllResultsBelowGenerateList();
    });

    [
        hubSelect,
        factionInput, corpInput,
        document.getElementById('skill_accounting'),
        document.getElementById('skill_broker'),
        document.getElementById('skill_connections'),
        document.getElementById('skill_criminal'),
        document.getElementById('skill_diplomacy'),
        document.getElementById('skill_scrapmetal'),
        marketGroupSelect,
        t2Toggle,
        excludeT1Select,
        excludeCapitalSelect
    ].forEach(el => {
        if (el) {
            el.addEventListener('input', () => {
                hideAllResultsBelowGenerateList();
                if (minDailyVolumeInput) minDailyVolumeInput.parentElement.style.display = 'none';
                if (stackSizeInput) stackSizeInput.parentElement.style.display = 'none';
                if (buyQtyRecommendationWrapper) buyQtyRecommendationWrapper.style.display = 'none';
                if (buyQtyPercentageWrapper) buyQtyPercentageWrapper.style.display = 'none';
                updateSpecialFiltersVisibility();
            });
        }
    });

    [
        includeSecondarySelect,
        sellToSelect,
        minMarginInput,
        maxMarginInput,
        minDailyVolumeInput,
        stackSizeInput
    ].forEach(el => {
        if (el) {
            el.addEventListener('input', hideMarketGroupResultsOnly);
        }
    });

    let invTypes = {}, marketGroups = {}, reprocessYields = {}, metaTypes = {}, currentMaterialPrices = {}, currentSellPrices = {}, currentVolumes = {};
    const hubToFactionCorp = {
        jita: { faction: "Caldari State", corp: "Caldari Navy" },
        amarr: { faction: "Amarr Empire", corp: "Emperor Family" },
        rens: { faction: "Minmatar Republic", corp: "Brutor Tribe" },
        hek: { faction: "Minmatar Republic", corp: "Boundless Creations" },
        dodixie: { faction: "Gallente Federation", corp: "Federation Navy" },
    };

    function loadJSON(url) {
        return fetch(url).then(r => r.json());
    }

    async function loadAllAdjustedPricesFiles(basePath, prefix, limit = 200) {
        let allData = [];
        let index = 1;
        while (true) {
            const url = `${basePath}/${prefix}_${index}.json`;
            try {
                const data = await loadJSON(url);
                if (!Array.isArray(data) || data.length === 0) break;
                allData = allData.concat(data);
                if (data.length < limit) break;
                index++;
            } catch (e) {
                break;
            }
        }
        return allData;
    }

    let [
        invTypesRaw,
        marketGroupsRaw,
        reprocessYieldsRaw,
        metaTypesRaw
    ] = await Promise.all([
        loadJSON('/wp-content/plugins/eve-reprocess-trading/invTypes.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/marketGroups.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/reprocess_yield.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/invMetaTypes.json'),
    ]);
    
    let adjustedPricesArray = await loadAllAdjustedPricesFiles(
        '/wp-content/uploads/eve-reprocess-trading/cache',
        'adjusted_prices',
        200
    );

    invTypes = invTypesRaw;
    marketGroups = marketGroupsRaw;
    reprocessYields = reprocessYieldsRaw;
    metaTypes = metaTypesRaw;

    let adjustedPricesByTypeID = {};
    adjustedPricesArray.forEach(obj => {
        if (obj.type_id && typeof obj.adjusted_price === "number") {
            adjustedPricesByTypeID[obj.type_id] = obj.adjusted_price;
        }
    });

    function getTopLevelGroup(marketGroupID) {
        let current = marketGroups[marketGroupID];
        while (current && current.parentGroupID !== "None") {
            marketGroupID = current.parentGroupID;
            current = marketGroups[marketGroupID];
        }
        return marketGroupID;
    }

    function hasValidMetaGroup(typeID) {
        const entry = metaTypes[typeID];
        const includeT2 = t2Toggle?.value || "no";
        if (typeof entry === "undefined" || entry === null) return true;
        if (includeT2 === "yes") {
            return entry === 1 || entry === 2;
        } else {
            return entry === 1;
        }
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

    function updateMarketGroupResults() {
        generateBtn.disabled = true;
        generateBtn.classList.add('loading');
        generateBtn.innerHTML = `<span class="spinner"></span><span class="btn-text">List Generating<br><small>This may take several seconds<br>Do not refresh the page</small></span>`;

        requestAnimationFrame(() => {
            setTimeout(() => {
                const selectedTopGroup = marketGroupSelect.value;
                const yieldText = yieldOutput.textContent || "0%";
                const yieldMatch = yieldText.match(/([\d.]+)%/);
                const yieldPercent = yieldMatch ? parseFloat(yieldMatch[1]) / 100 : 0;

                const materialSet = new Set();
                const itemBreakdown = [];

                Object.entries(invTypes)
                    .filter(([name, item]) => {
                        const topGroup = item.marketGroupID ? getTopLevelGroup(item.marketGroupID) : null;
                        if (topGroup !== selectedTopGroup) return false;
                        if (!hasValidMetaGroup(item.typeID)) return false;
                        if (!item.published) return false;
                        if (excludeT1Select && excludeT1Select.value === 'yes' && selectedTopGroup === '9') {
                            const blueprintName = name + ' Blueprint';
                            if (invTypes.hasOwnProperty(blueprintName)) {
                                return false;
                            }
                        }
                        if (excludeCapitalSelect && excludeCapitalSelect.value === 'yes' && isCapitalItem(item)) {
                            return false;
                        }
                        return true;
                    })
                    .forEach(([name, item]) => {
                        const typeID = item.typeID;
                        const yieldData = reprocessYields[typeID];
                        if (!yieldData) return;
                        const components = Object.entries(yieldData)
                            .map(([matID, qty]) => {
                                const portionSize = item.portionSize || 1;
                                const perItemQty = (qty * yieldPercent) / portionSize;
                                if (perItemQty < 0.0001) return null;
                                const mineralEntry = Object.entries(invTypes).find(([, v]) => v.typeID == matID);
                                const mineralName = mineralEntry ? mineralEntry[0] : `#${matID}`;
                                materialSet.add(mineralName);
                                return { mineralName, perItemQty };
                            })
                            .filter(c => c);
                        itemBreakdown.push({ name, components });
                    });

                // Clear the list first
                marketGroupResults.innerHTML = '';
                
                if (itemBreakdown.length === 0) {
                    const li = document.createElement('li');
                    const em = document.createElement('em');
                    em.textContent = 'No items found for this group';
                    li.appendChild(em);
                    marketGroupResults.appendChild(li);
                } else {
                    itemBreakdown.forEach(item => {
                        const li = document.createElement('li');
                        li.setAttribute('data-name', item.name);
                        li.setAttribute('data-components', JSON.stringify(item.components));
                        li.textContent = item.name;
                        marketGroupResults.appendChild(li);
                    });
                }

                const materialList = Array.from(materialSet).sort();
                materialListFlat.innerHTML = '';
                if (materialList.length === 0) {
                    const li = document.createElement('li');
                    const em = document.createElement('em');
                    em.textContent = 'No materials found';
                    li.appendChild(em);
                    materialListFlat.appendChild(li);
                } else {
                    materialList.forEach(name => {
                        const li = document.createElement('li');
                        li.textContent = name;
                        materialListFlat.appendChild(li);
                    });
                }

                marketGroupResultsWrapper.style.display = 'block';
                afterGenerateControls.style.display = 'block';
                generatePricesBtn.style.display = 'inline-block';
                generateBtn.disabled = false;
                generateBtn.classList.remove('loading');
                generateBtn.innerHTML = `<span class="btn-text">Generate List</span>`;

                if (marginFieldsWrapper) marginFieldsWrapper.style.display = 'block';
                if (minDailyVolumeInput) minDailyVolumeInput.parentElement.style.display = 'block';
                if (stackSizeInput) stackSizeInput.parentElement.style.display = 'block';
                if (buyQtyRecommendationWrapper) buyQtyRecommendationWrapper.style.display = 'block';
                if (buyQtyRecommendation && buyQtyRecommendation.value === 'yes') {
                    if (buyQtyPercentageWrapper) buyQtyPercentageWrapper.style.display = 'block';
                } else {
                    if (buyQtyPercentageWrapper) buyQtyPercentageWrapper.style.display = 'none';
                }
                resetGeneratePricesBtn();
                needRegenerateListAndPrices = false;
            }, 10);
        });
    }

    if (buyQtyRecommendation) {
        buyQtyRecommendation.addEventListener('change', function () {
            if (this.value === 'yes') {
                if (buyQtyPercentageWrapper) buyQtyPercentageWrapper.style.display = 'block';
            } else {
                if (buyQtyPercentageWrapper) buyQtyPercentageWrapper.style.display = 'none';
            }
            hideMarketGroupResultsOnly();
        });
    }
    if (buyQtyPercentage) {
        buyQtyPercentage.addEventListener('input', function () {
            sanitizeInput(buyQtyPercentage, {min:0, max:100, default:10});
            hideMarketGroupResultsOnly();
        });
        buyQtyPercentage.addEventListener('blur', function () {
            sanitizeInput(buyQtyPercentage, {min:0, max:100, default:10});
        });
    }

    async function fetchBatch(batch) {
        const res = await fetch('/wp-content/plugins/eve-reprocess-trading/price_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hub: hubSelect.value,
                includeSecondary: includeSecondarySelect.value,
                materials: batch
            })
        });
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch {
            return { buy: {}, sell: {}, volumes: {} };
        }
    }

    function maybeShowCopyMarketQuickbar() {
        const visibleItems = Array.from(marketGroupResults.querySelectorAll('li'))
            .filter(li => li.style.display !== 'none' && !li.querySelector('em'));
        copyMarketQuickbarBtn.style.display = visibleItems.length ? 'inline-block' : 'none';
    }

    generatePricesBtn.addEventListener('click', async () => {
        if (needRegenerateListAndPrices) {
            updateMarketGroupResults();
            setTimeout(() => {
                runGeneratePrices();
            }, 300);
        } else {
            runGeneratePrices();
        }
    });

    function getBuyQtySettings() {
        let enabled = false, percent = 0.10;
        if (buyQtyRecommendation && buyQtyRecommendation.value === 'yes') {
            enabled = true;
            if (buyQtyPercentage && !isNaN(parseFloat(buyQtyPercentage.value))) {
                percent = Math.max(0, Math.min(100, parseFloat(buyQtyPercentage.value))) / 100;
            }
        }
        return { enabled, percent };
    }

    function runGeneratePrices() {
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        generatePricesBtn.disabled = true;
        generatePricesBtn.classList.add('loading');
        generatePricesBtn.innerHTML = `<span class="spinner"></span><span class="btn-text">Prices Generating<br><small>This may take several minutes<br>Do not refresh the page</small></span>`;

        let minMargin = minMarginInput ? sanitizeInput(minMarginInput, {default:5}) : 5;
        let maxMargin = maxMarginInput ? sanitizeInput(maxMarginInput, {default:25}) : 25;

        let minDailyVolume = minDailyVolumeInput ? sanitizeInput(minDailyVolumeInput, {min:1, default:1}) : 1;
        let stackSize = stackSizeInput ? sanitizeInput(stackSizeInput, {min:1, default:100}) : 100;

        const { enabled: buyQtyEnabled, percent: buyQtyPercent } = getBuyQtySettings();

        const itemNames = Array.from(marketGroupResults.querySelectorAll('li'))
            .map(li => li.dataset.name)
            .filter(Boolean);
        const batchSize = 30;
        const batches = [];
        for (let i = 0; i < itemNames.length; i += batchSize) {
            batches.push(itemNames.slice(i, i + batchSize));
        }

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

            const sellTo = sellToSelect?.value || 'buy';
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
            const allNames = [...filteredItemNames, ...Array.from(materialsNeeded)];
            const materialBatches = [];
            for (let i = 0; i < allNames.length; i += batchSize) {
                materialBatches.push(allNames.slice(i, i + batchSize));
            }

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
            marketGroupResults.querySelectorAll('li').forEach(li => {
                const itemName = li.dataset.name;
                if (!filteredItemNames.includes(itemName)) {
                    li.style.display = 'none';
                    return;
                }
                const components = JSON.parse(li.dataset.components || '[]');
                const priceSource = sellTo === 'sell' ? 'sell' : 'buy';

                let totalYieldValue = 0;
                let adjustedValue = 0;
                components.forEach(({ mineralName, perItemQty }) => {
                    const totalQty = Math.floor(perItemQty * stackSize);
                    if (totalQty < 1) return;
                    const price = priceSource === 'sell'
                        ? currentSellPrices[mineralName] ?? 0
                        : currentMaterialPrices[mineralName] ?? 0;
                    totalYieldValue += totalQty * price;

                    const typeID = invTypes[mineralName]?.typeID;
                    if (typeID && adjustedPricesByTypeID[typeID]) {
                        adjustedValue += totalQty * adjustedPricesByTypeID[typeID];
                    }
                });

                const perItemYieldValue = stackSize > 0 ? totalYieldValue / stackSize : 0;
                const reprocessTaxText = taxOutput.textContent || "0%";
                const reprocessTaxMatch = reprocessTaxText.match(/([\d.]+)%/);
                const reprocessTaxRate = reprocessTaxMatch ? parseFloat(reprocessTaxMatch[1]) / 100 : 0;
                const taxAmount = adjustedValue * reprocessTaxRate;

                const netTotal = stackSize > 0 ? (totalYieldValue - taxAmount) / stackSize : 0;
                const itemBuyPrice = currentMaterialPrices[itemName] ?? 0;
                const volume = currentVolumes[itemName] ?? 0;

                const brokerFeeText = brokerFeeOutput.textContent || "0%";
                const brokerFeeMatch = brokerFeeText.match(/([\d.]+)%/);
                const brokerageFeeRate = brokerFeeMatch ? parseFloat(brokerFeeMatch[1]) / 100 : 0;

                const salesTaxText = salesTaxOutput.textContent || "0%";
                const salesTaxMatch = salesTaxText.match(/([\d.]+)%/);
                const salesTaxRate = salesTaxMatch ? parseFloat(salesTaxMatch[1]) / 100 : 0;

                const itemBrokerage = itemBuyPrice * brokerageFeeRate;

                let yieldAfterFees = netTotal;
                if (sellTo === 'buy') {
                    yieldAfterFees = yieldAfterFees * (1 - salesTaxRate);
                } else if (sellTo === 'sell') {
                    yieldAfterFees = yieldAfterFees * (1 - brokerageFeeRate) * (1 - salesTaxRate);
                }
                yieldAfterFees = yieldAfterFees - itemBrokerage;

                let qtyDisplay = volume;
                if (buyQtyEnabled) {
                    qtyDisplay = Math.round(volume * buyQtyPercent);
                }

                let margin = itemBuyPrice > 0 ? ((yieldAfterFees - itemBuyPrice) / itemBuyPrice) * 100 : 0;
                margin = isFinite(margin) ? margin.toFixed(2) : "0.00";

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

            if (!anyVisible) {
                if (noResultsMessage) noResultsMessage.style.display = 'block';
            } else {
                if (noResultsMessage) noResultsMessage.style.display = 'none';
            }

            generatePricesBtn.disabled = false;
            generatePricesBtn.classList.remove('loading');
            resetGeneratePricesBtn();

            maybeShowCopyMarketQuickbar();
        })();
    }

    // --- Sanitize user-editable number inputs ---
    if (minDailyVolumeInput) {
        minDailyVolumeInput.addEventListener('input', () => sanitizeInput(minDailyVolumeInput, {min:1, default:1}));
        minDailyVolumeInput.addEventListener('blur', () => sanitizeInput(minDailyVolumeInput, {min:1, default:1}));
    }
    if (stackSizeInput) {
        stackSizeInput.addEventListener('input', () => sanitizeInput(stackSizeInput, {min:1, default:100}));
        stackSizeInput.addEventListener('blur', () => sanitizeInput(stackSizeInput, {min:1, default:100}));
    }
    if (minMarginInput) {
        minMarginInput.addEventListener('input', () => sanitizeInput(minMarginInput, {default:5}));
        minMarginInput.addEventListener('blur', () => sanitizeInput(minMarginInput, {default:5}));
    }
    if (maxMarginInput) {
        maxMarginInput.addEventListener('input', () => sanitizeInput(maxMarginInput, {default:25}));
        maxMarginInput.addEventListener('blur', () => sanitizeInput(maxMarginInput, {default:25}));
    }

    copyMarketQuickbarBtn.addEventListener('click', () => {
        const selectedGroup = marketGroupSelect.options[marketGroupSelect.selectedIndex]?.text || 'Unknown Group';

        const visibleItems = Array.from(marketGroupResults.querySelectorAll('li'))
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
            copyMarketQuickbarBtn.innerHTML = '<span class="btn-text">Copied!</span>';
            setTimeout(() => {
                copyMarketQuickbarBtn.innerHTML = '<span class="btn-text">Copy Market Quickbar</span>';
            }, 1500);
        });
    });

    function updateResults() {
        const accounting = parseFloat(document.getElementById('skill_accounting')?.value || 0);
        const broker = parseFloat(document.getElementById('skill_broker')?.value || 0);
        const conn = parseFloat(document.getElementById('skill_connections')?.value || 0);
        const diplo = parseFloat(document.getElementById('skill_diplomacy')?.value || 0);
        const scrap = parseFloat(document.getElementById('skill_scrapmetal')?.value || 0);

        let baseFaction = parseFloat(factionInput?.value || 0);
        let baseCorp = parseFloat(corpInput?.value || 0);
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

        factionResult.textContent = `Effective: ${factionEffClamped.toFixed(2)}`;
        corpResult.textContent = `Effective: ${corpEffClamped.toFixed(2)}`;
        brokerFeeOutput.textContent = `${brokerFee.toFixed(2)}%`;
        taxOutput.textContent = `${reprocessTax.toFixed(2)}%`;
        salesTaxOutput.textContent = `${salesTax.toFixed(2)}%`;
        yieldOutput.textContent = `${yieldPercent.toFixed(2)}%`;

        resultSkillsBox.style.display = 'block';
        resultSkillsBox.innerHTML = ''; // Clear box
        const div1 = document.createElement('div');
        const strong1 = document.createElement('strong');
        strong1.textContent = 'Skill Used (Faction)';
        div1.appendChild(strong1);
        div1.appendChild(document.createElement('br'));
        const i1 = document.createElement('i');
        i1.textContent = baseFaction < 0 ? 'Diplomacy' : 'Connections';
        div1.appendChild(i1);
        
        const div2 = document.createElement('div');
        const strong2 = document.createElement('strong');
        strong2.textContent = 'Skill Used (Corp)';
        div2.appendChild(strong2);
        div2.appendChild(document.createElement('br'));
        const i2 = document.createElement('i');
        i2.textContent = baseCorp < 0 ? 'Diplomacy' : 'Connections';
        div2.appendChild(i2);
        
        resultSkillsBox.appendChild(div1);
        resultSkillsBox.appendChild(div2);
    }

    hubSelect.addEventListener('change', () => {
        updateResults();
        updateSpecialFiltersVisibility();
        const data = hubToFactionCorp[hubSelect.value] || { faction: "[Faction]", corp: "[Corporation]" };
        factionLabel.textContent = `Base ${data.faction} Standing`;
        corpLabel.textContent = `Base ${data.corp} Standing`;
    });

    document.querySelectorAll('select, input[type="number"]').forEach(el => el.addEventListener('input', updateResults));

    updateResults();
    hideAllResultsBelowGenerateList();
    updateSpecialFiltersVisibility();
    resetGeneratePricesBtn();

    function clampStandingInput(input) {
        input.addEventListener('blur', () => {
            let v = parseFloat(input.value);
            if (isNaN(v)) v = 0;
            if (v < -10) v = -10;
            if (v > 10) v = 10;
            input.value = v.toFixed(2);
        });
    }
    if (factionInput) clampStandingInput(factionInput);
    if (corpInput) clampStandingInput(corpInput);

    if (excludeCapitalSelect) {
        excludeCapitalSelect.addEventListener('input', hideAllResultsBelowGenerateList);
    }
});
