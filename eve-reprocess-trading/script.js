document.addEventListener('DOMContentLoaded', async () => {
    const hubSelect = document.getElementById('hub_select');
    const generateBtn = document.getElementById('generate_btn');
    const generatePricesBtn = document.getElementById('generate_prices_btn');
    const includeSecondarySelect = document.getElementById('include_secondary');
    const sellToSelect = document.getElementById('sell_to_select');
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

    [invTypes, marketGroups, reprocessYields, metaTypes] = await Promise.all([
        loadJSON('/wp-content/plugins/eve-reprocess-trading/invTypes.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/marketGroups.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/reprocess_yield.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/invMetaTypes.json')
    ]);

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
        return entry === 1 || entry === 2;
    }

    function updateMarketGroupResults() {
        generateBtn.disabled = true;
        generateBtn.classList.add('loading');
        generateBtn.innerHTML = `<span class="spinner"></span><span class="btn-text">List Generating<br><small>This may take several seconds<br>Do not refresh the page</small></span>`;

        requestAnimationFrame(() => {
            setTimeout(() => {
                const selectedTopGroup = document.getElementById('market_group_select').value;
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
                generatePricesBtn.style.display = 'inline-block';
                generateBtn.disabled = false;
                generateBtn.classList.remove('loading');
                generateBtn.innerHTML = `<span class="btn-text">Generate List</span>`;
            }, 10);
        });
    }

    // --- Parallel batch helper ---
    async function fetchAllBatchesParallel(batches, maxConcurrency = 6, delay = 300) {
        let results = [];
        let idx = 0;
        while (idx < batches.length) {
            const chunk = batches.slice(idx, idx + maxConcurrency);
            const chunkResults = await Promise.all(chunk.map(fetchBatch));
            results = results.concat(chunkResults);
            idx += maxConcurrency;
            if (idx < batches.length && delay > 0) await new Promise(res => setTimeout(res, delay));
        }
        return results;
    }

    // --- Optimized fetchBatch ---
    async function fetchBatch(batch, fetchMode = "full") {
        // fetchMode: "full" = buy, sell, volumes; "price" = buy OR sell only (no volume)
        const postData = {
            hub: hubSelect.value,
            includeSecondary: includeSecondarySelect.value === 'yes',
            materials: batch
        };
        // Pass mode for backend if you want to optimize PHP as well
        if (fetchMode !== "full") postData.fetchMode = fetchMode;
        const res = await fetch('/wp-content/plugins/eve-reprocess-trading/price_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch {
            return { buy: {}, sell: {}, volumes: {} };
        }
    }

    // --- Two-pass optimized price fetching with parallelism ---
    generatePricesBtn.addEventListener('click', async () => {
        generatePricesBtn.disabled = true;
        generatePricesBtn.classList.add('loading');
        generatePricesBtn.innerHTML = `<span class="spinner"></span><span class="btn-text">Prices Generating<br><small>This may take several minutes<br>Do not refresh the page</small></span>`;

        const itemNames = Array.from(marketGroupResults.querySelectorAll('li'))
            .map(li => li.dataset.name)
            .filter(Boolean);

        const batchSize = 30, maxConcurrency = 6, delay = 400;

        // --- 1st pass: items only, get buy+sell+volume ---
        const itemBatches = [];
        for (let i = 0; i < itemNames.length; i += batchSize) {
            itemBatches.push(itemNames.slice(i, i + batchSize));
        }
        const priceResults = await fetchAllBatchesParallel(itemBatches, maxConcurrency, delay);
        const allBuy = {}, allSell = {}, allVolumes = {};
        priceResults.forEach(data => {
            Object.assign(allBuy, data.buy || {});
            Object.assign(allSell, data.sell || {});
            Object.assign(allVolumes, data.volumes || {});
        });

        // --- Filter: only items with volume > 0
        const filteredItemNames = itemNames.filter(name => (allVolumes[name] || 0) > 0);

        // --- 2nd pass: get ONLY necessary prices for filtered items and materials ---
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
        const materialNames = Array.from(materialsNeeded);

        // --- Only fetch buy for items, buy/sell for materials depending on user ---
        // Fetch items: always buy (don't need volume anymore)
        const filteredBatches = [];
        for (let i = 0; i < filteredItemNames.length; i += batchSize) {
            filteredBatches.push(filteredItemNames.slice(i, i + batchSize));
        }
        // Fetch materials: buy OR sell as selected, NO volume
        const materialBatches = [];
        for (let i = 0; i < materialNames.length; i += batchSize) {
            materialBatches.push(materialNames.slice(i, i + batchSize));
        }

        // Fetch filtered items (buy prices only)
        const filteredItemResults = await fetchAllBatchesParallel(filteredBatches, maxConcurrency, delay);
        const itemBuy = {};
        filteredItemResults.forEach(data => Object.assign(itemBuy, data.buy || {}));
        // Fetch materials (buy OR sell)
        let materialPrice = {};
        if (materialBatches.length > 0) {
            const fetchMode = sellTo === "sell" ? "sell" : "buy";
            const materialResults = await fetchAllBatchesParallel(materialBatches, maxConcurrency, delay);
            materialResults.forEach(data => {
                if (fetchMode === "sell") Object.assign(materialPrice, data.sell || {});
                else Object.assign(materialPrice, data.buy || {});
            });
        }

        // --- Merge all results for display logic
        currentMaterialPrices = itemBuy;
        currentSellPrices = materialPrice;
        currentVolumes = allVolumes;

        // Update UI: only show filtered items
        marketGroupResults.querySelectorAll('li').forEach(li => {
            const itemName = li.dataset.name;
            if (!filteredItemNames.includes(itemName)) {
                li.style.display = 'none';
                return;
            }
            const components = JSON.parse(li.dataset.components || '[]');
            const priceSource = sellTo === 'sell' ? currentSellPrices : currentMaterialPrices;
            let total = 0;
            components.forEach(({ mineralName, qty }) => {
                const price = priceSource[mineralName] ?? 0;
                total += qty * price;
            });
            const itemBuyPrice = currentMaterialPrices[itemName] ?? 0;
            const volume = currentVolumes[itemName] ?? 0;
            let margin = itemBuyPrice > 0 ? ((total - itemBuyPrice) / itemBuyPrice) * 100 : 0;
            margin = isFinite(margin) ? margin.toFixed(2) : "0.00";
            li.textContent = `${itemName} [${itemBuyPrice.toFixed(2)} / ${total.toFixed(2)} / ${volume} / ${margin}%]`;
            if (itemBuyPrice === 0 || itemBuyPrice > total || volume === 0) {
                li.style.display = 'none';
            } else {
                li.style.display = 'list-item';
            }
        });

        generatePricesBtn.disabled = false;
        generatePricesBtn.classList.remove('loading');
        generatePricesBtn.innerHTML = `<span class="btn-text">Generate Prices</span>`;
    });

    generateBtn.addEventListener('click', updateMarketGroupResults);
    document.querySelectorAll('select, input[type="number"]').forEach(el => el.addEventListener('input', updateResults));

    function updateResults() {
        const accounting = parseFloat(document.getElementById('skill_accounting')?.value || 0);
        const broker = parseFloat(document.getElementById('skill_broker')?.value || 0);
        const conn = parseFloat(document.getElementById('skill_connections')?.value || 0);
        const diplo = parseFloat(document.getElementById('skill_diplomacy')?.value || 0);
        const scrap = parseFloat(document.getElementById('skill_scrapmetal')?.value || 0);
        const baseFaction = parseFloat(factionInput?.value || 0);
        const baseCorp = parseFloat(corpInput?.value || 0);

        const factionEff = baseFaction < 0 ? baseFaction + ((10 - baseFaction) * 0.04 * diplo) : baseFaction + ((10 - baseFaction) * 0.04 * conn);
        const corpEff = baseCorp < 0 ? baseCorp + ((10 - baseCorp) * 0.04 * diplo) : baseCorp + ((10 - baseCorp) * 0.04 * conn);

        const brokerFee = Math.max(0, 3 - (0.3 * broker) - (0.03 * baseFaction) - (0.02 * baseCorp));
        const reprocessTax = corpEff <= 0 ? 5.0 : corpEff < 6.67 ? +(0.05 * (1 - corpEff / 6.67)).toFixed(4) * 100 : 0;
        const salesTax = 7.5 * (1 - (0.11 * accounting));
        const yieldPercent = 50 * (1 + 0.02 * scrap);

        factionResult.textContent = `Effective: ${factionEff.toFixed(2)}`;
        corpResult.textContent = `Effective: ${corpEff.toFixed(2)}`;
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

    updateResults();
});
