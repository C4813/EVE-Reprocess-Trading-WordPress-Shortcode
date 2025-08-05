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
    // Standing input clamping
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
    const noResultsMessage = document.getElementById('no_results_message');

    // Data vars
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

    // Load all data, including adjusted prices!
    let [invTypesRaw, marketGroupsRaw, reprocessYieldsRaw, metaTypesRaw, adjustedPricesArray] = await Promise.all([
        loadJSON('/wp-content/plugins/eve-reprocess-trading/invTypes.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/marketGroups.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/reprocess_yield.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/invMetaTypes.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/adjusted_prices.json')
    ]);
    invTypes = invTypesRaw;
    marketGroups = marketGroupsRaw;
    reprocessYields = reprocessYieldsRaw;
    metaTypes = metaTypesRaw;

    // Map adjusted prices by typeID for fast lookup
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
        if (includeT2 === "yes") {
            return entry === 1 || entry === 2;
        } else {
            return entry === 1;
        }
    }

    function hideGeneratedResults() {
        marketGroupResultsWrapper.style.display = 'none';
        generatePricesBtn.style.display = 'none';
        copyMarketQuickbarBtn.style.display = 'none';
        afterGenerateControls.style.display = 'none';
        tableWrapper.style.display = 'none';
        if (marginFieldsWrapper) marginFieldsWrapper.style.display = 'none';
        if (noResultsMessage) noResultsMessage.style.display = 'none';
    }

    function showAfterGenerateControls() {
        afterGenerateControls.style.display = 'block';
        generatePricesBtn.style.display = 'inline-block';
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
                        return topGroup === selectedTopGroup && hasValidMetaGroup(item.typeID);
                    })
                    .forEach(([name, item]) => {
                        const typeID = item.typeID;
                        const yieldData = reprocessYields[typeID];
                        if (!yieldData) return;

                        const components = Object.entries(yieldData)
                            .map(([matID, qty]) => {
                                const adjustedQty = Math.floor(qty * yieldPercent);
                                if (adjustedQty < 1) return null;
                                const mineralEntry = Object.entries(invTypes).find(([, v]) => v.typeID == matID);
                                const mineralName = mineralEntry ? mineralEntry[0] : `#${matID}`;
                                materialSet.add(mineralName);
                                return { mineralName, qty: adjustedQty };
                            })
                            .filter(Boolean);

                        itemBreakdown.push({ name, components });
                    });

                marketGroupResults.innerHTML = itemBreakdown.length === 0
                    ? `<li><em>No items found for this group</em></li>`
                    : itemBreakdown.map(item => `<li data-name="${item.name}" data-components='${JSON.stringify(item.components)}'>${item.name}</li>`).join('');

                const materialList = Array.from(materialSet).sort();
                materialListFlat.innerHTML = materialList.length === 0
                    ? `<li><em>No materials found</em></li>`
                    : materialList.map(name => `<li>${name}</li>`).join('');

                marketGroupResultsWrapper.style.display = 'block';
                showAfterGenerateControls();
                generateBtn.disabled = false;
                generateBtn.classList.remove('loading');
                generateBtn.innerHTML = `<span class="btn-text">Generate List</span>`;

                // Show margin fields after list is generated
                if (marginFieldsWrapper) marginFieldsWrapper.style.display = 'block';
            }, 10);
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

    // Copy Market Toolbar button: Show after prices are generated, hide when filters change
    function maybeShowCopyMarketQuickbar() {
        const visibleItems = Array.from(marketGroupResults.querySelectorAll('li'))
            .filter(li => li.style.display !== 'none' && !li.querySelector('em'));
        copyMarketQuickbarBtn.style.display = visibleItems.length ? 'inline-block' : 'none';
    }

    generatePricesBtn.addEventListener('click', () => {
        // Hide the copy button while prices are generating
        copyMarketQuickbarBtn.style.display = 'none';
    });

    generatePricesBtn.addEventListener('click', async () => {
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        generatePricesBtn.disabled = true;
        generatePricesBtn.classList.add('loading');
        generatePricesBtn.innerHTML = `<span class="spinner"></span><span class="btn-text">Prices Generating<br><small>This may take several minutes<br>Do not refresh the page</small></span>`;

        // Margin % filter inputs
        let minMargin = minMarginInput ? parseFloat(minMarginInput.value) : 5;
        let maxMargin = maxMarginInput ? parseFloat(maxMarginInput.value) : 25;

        // Get item names only (ignore materials for now)
        const itemNames = Array.from(marketGroupResults.querySelectorAll('li'))
            .map(li => li.dataset.name)
            .filter(Boolean);
        const batchSize = 30;
        const batches = [];
        for (let i = 0; i < itemNames.length; i += batchSize) {
            batches.push(itemNames.slice(i, i + batchSize));
        }

        // First pass: get prices/volumes for items only
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
        // Filter out items with volume = 0
        const filteredItemNames = itemNames.filter(name => (allVolumes[name] || 0) > 0);

        // Second pass: get materials for filtered items
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
        // Remove any items already in filteredItemNames from materialsNeeded
        filteredItemNames.forEach(n => materialsNeeded.delete(n));
        const allNames = [...filteredItemNames, ...Array.from(materialsNeeded)];
        const materialBatches = [];
        for (let i = 0; i < allNames.length; i += batchSize) {
            materialBatches.push(allNames.slice(i, i + batchSize));
        }

        // Get prices for filtered items + needed materials
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

        // Only show filtered items in the UI
        let anyVisible = false;
        marketGroupResults.querySelectorAll('li').forEach(li => {
            const itemName = li.dataset.name;
            if (!filteredItemNames.includes(itemName)) {
                li.style.display = 'none';
                return;
            }
            const components = JSON.parse(li.dataset.components || '[]');
            const priceSource = sellTo === 'sell' ? 'sell' : 'buy';

            // --- Calculate adjusted value and tax ---
            let total = 0;
            let adjustedValue = 0;
            components.forEach(({ mineralName, qty }) => {
                const price = priceSource === 'sell' ? currentSellPrices[mineralName] ?? 0 : currentMaterialPrices[mineralName] ?? 0;
                total += qty * price;
                // Find typeID for adjusted price lookup
                const typeID = invTypes[mineralName]?.typeID;
                if (typeID && adjustedPricesByTypeID[typeID]) {
                    adjustedValue += qty * adjustedPricesByTypeID[typeID];
                }
            });
            // Get reprocessing tax percent from UI
            const reprocessTaxText = taxOutput.textContent || "0%";
            const reprocessTaxMatch = reprocessTaxText.match(/([\d.]+)%/);
            const reprocessTaxRate = reprocessTaxMatch ? parseFloat(reprocessTaxMatch[1]) / 100 : 0;
            const taxAmount = adjustedValue * reprocessTaxRate;

            // Subtract tax from total reprocessed value
            const netTotal = total - taxAmount;
            const itemBuyPrice = currentMaterialPrices[itemName] ?? 0;
            const volume = currentVolumes[itemName] ?? 0;
            
            // Calculate margin using full precision netTotal
            let margin = itemBuyPrice > 0 ? ((netTotal - itemBuyPrice) / itemBuyPrice) * 100 : 0;
            margin = isFinite(margin) ? margin.toFixed(2) : "0.00";
            
            // Format values for display
            const formattedBuy = itemBuyPrice % 1 === 0 ? itemBuyPrice.toFixed(0) : itemBuyPrice.toFixed(2);
            const formattedNet = Math.floor(netTotal).toString();
            
            li.textContent = `${itemName} [${formattedBuy} / ${formattedNet} / ${volume} / ${margin}%]`;

            // Margin filter
            if (
                itemBuyPrice === 0 ||
                itemBuyPrice > netTotal ||
                volume === 0 ||
                margin < 0 ||
                margin < minMargin ||
                margin > maxMargin
            ) {
                li.style.display = 'none';
            } else {
                const formattedBuy = itemBuyPrice % 1 === 0 ? itemBuyPrice.toFixed(0) : itemBuyPrice.toFixed(2);
                const formattedNet = Math.floor(netTotal).toString();
                li.textContent = `${itemName} [${formattedBuy} / ${formattedNet} / ${volume} / ${margin}%]`;
                li.style.display = 'list-item';
                anyVisible = true;
            }
        });

        // Show or hide "No profitable items..." message
        if (!anyVisible) {
            if (noResultsMessage) noResultsMessage.style.display = 'block';
        } else {
            if (noResultsMessage) noResultsMessage.style.display = 'none';
        }

        generatePricesBtn.disabled = false;
        generatePricesBtn.classList.remove('loading');
        generatePricesBtn.innerHTML = `<span class="btn-text">Generate Prices</span>`;

        // Show Copy Market Toolbar button if there are visible results
        maybeShowCopyMarketQuickbar();
    });

    // Copy Market Quickbar functionality
    copyMarketQuickbarBtn.addEventListener('click', () => {
        // Get selected market group name
        const selectedGroup = marketGroupSelect.options[marketGroupSelect.selectedIndex]?.text || 'Unknown Group';
    
        const visibleItems = Array.from(marketGroupResults.querySelectorAll('li'))
            .filter(li => li.style.display !== 'none' && !li.querySelector('em'));
    
        if (!visibleItems.length) return;
    
        const quickbarItems = visibleItems.map(li => {
            let [itemName, bracketData] = li.textContent.split('[');
            itemName = itemName.trim();
            if (!bracketData) return `- ${li.textContent}`;
            bracketData = bracketData.replace(']', '').trim();
            const bracketParts = bracketData.split('/').map(s => s.trim());
            const quickbarParts = bracketParts.slice(1, 4);
            let joined = quickbarParts.join('|');
            if (joined.length > 25) joined = joined.slice(0, 25);
            return `- ${itemName} [${joined}]`;
        });
    
        // Add the group at the top
        const quickbar = `+ ${selectedGroup}\n${quickbarItems.join('\n')}`;
    
        navigator.clipboard.writeText(quickbar).then(() => {
            copyMarketQuickbarBtn.innerHTML = '<span class="btn-text">Copied!</span>';
            setTimeout(() => {
                copyMarketQuickbarBtn.innerHTML = '<span class="btn-text">Copy Market Quickbar</span>';
            }, 1500);
        });
    });

    // Hide results if *any* input EXCEPT secondary/sellto/margin changes
    function hideResultsOnRelevantInput() {
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
            t2Toggle
        ].forEach(el => {
            if (el) {
                el.addEventListener('input', () => {
                    hideGeneratedResults();
                });
            }
        });
    }
    hideResultsOnRelevantInput();

    // Margin filter fields show/hide
    function showMarginFields() {
        if (marginFieldsWrapper) marginFieldsWrapper.style.display = 'block';
    }
    generatePricesBtn.addEventListener('click', showMarginFields);

    // Hide margin fields when main filters change
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
        t2Toggle
    ].forEach(el => {
        if (el) {
            el.addEventListener('input', () => {
                if (marginFieldsWrapper) marginFieldsWrapper.style.display = 'none';
                copyMarketQuickbarBtn.style.display = 'none';
            });
        }
    });

    // Enforce minimum/maximum margin input rules
    if (minMarginInput) {
        minMarginInput.value = 5;
        minMarginInput.min = 0;
        minMarginInput.addEventListener('input', () => {
            let v = parseFloat(minMarginInput.value) || 0;
            if (v < 0) v = 0;
            minMarginInput.value = v;
        });
    }
    if (maxMarginInput) {
        maxMarginInput.value = 25;
        maxMarginInput.min = 0;
        maxMarginInput.addEventListener('input', () => {
            let v = parseFloat(maxMarginInput.value) || 0;
            if (v < 0) v = 0;
            maxMarginInput.value = v;
        });
    }

    // Listeners
    generateBtn.addEventListener('click', updateMarketGroupResults);

    // Skills and result update on load and input
    function updateResults() {
        const accounting = parseFloat(document.getElementById('skill_accounting')?.value || 0);
        const broker = parseFloat(document.getElementById('skill_broker')?.value || 0);
        const conn = parseFloat(document.getElementById('skill_connections')?.value || 0);
        const diplo = parseFloat(document.getElementById('skill_diplomacy')?.value || 0);
        const scrap = parseFloat(document.getElementById('skill_scrapmetal')?.value || 0);
    
        // Clamp base standings to -10.00 to +10.00
        let baseFaction = parseFloat(factionInput?.value || 0);
        let baseCorp = parseFloat(corpInput?.value || 0);
        const clampStanding = v => Math.max(-10, Math.min(10, v));
        baseFaction = clampStanding(baseFaction);
        baseCorp = clampStanding(baseCorp);
    
        // Calculate effective standings (pre-clamp)
        let factionEff = baseFaction < 0
            ? baseFaction + ((10 - baseFaction) * 0.04 * diplo)
            : baseFaction + ((10 - baseFaction) * 0.04 * conn);
        let corpEff = baseCorp < 0
            ? baseCorp + ((10 - baseCorp) * 0.04 * diplo)
            : baseCorp + ((10 - baseCorp) * 0.04 * conn);
    
        // Clamp effective standings too
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
        resultSkillsBox.innerHTML = `
            <div><strong>Skill Used (Faction)</strong><br><i>${baseFaction < 0 ? 'Diplomacy' : 'Connections'}</i></div>
            <div><strong>Skill Used (Corp)</strong><br><i>${baseCorp < 0 ? 'Diplomacy' : 'Connections'}</i></div>
        `;
    }

    hubSelect.addEventListener('change', () => {
        updateResults();
        const data = hubToFactionCorp[hubSelect.value] || { faction: "[Faction]", corp: "[Corporation]" };
        factionLabel.textContent = `Base ${data.faction} Standing`;
        corpLabel.textContent = `Base ${data.corp} Standing`;
    });

    document.querySelectorAll('select, input[type="number"]').forEach(el => el.addEventListener('input', updateResults));

    // On load
    updateResults();
    hideGeneratedResults();
});
