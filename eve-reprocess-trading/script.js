document.addEventListener('DOMContentLoaded', () => {
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

    let invTypes = {}, marketGroups = {}, reprocessYields = {}, currentMaterialPrices = {}, currentSellPrices = {}, currentVolumes = {};

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

    Promise.all([
        loadJSON('/wp-content/plugins/eve-reprocess-trading/invTypes.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/marketGroups.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/reprocess_yield.json')
    ]).then(([types, groups, yields]) => {
        invTypes = types;
        marketGroups = groups;
        reprocessYields = yields;
        updateResults();
    });

    function getTopLevelGroup(marketGroupID) {
        let current = marketGroups[marketGroupID];
        while (current && current.parentGroupID !== "None") {
            marketGroupID = current.parentGroupID;
            current = marketGroups[marketGroupID];
        }
        return marketGroupID;
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

                const results = Object.entries(invTypes)
                    .filter(([name, item]) => {
                        const topGroup = item.marketGroupID ? getTopLevelGroup(item.marketGroupID) : null;
                        return topGroup === selectedTopGroup;
                    })
                    .map(([name, item]) => {
                        const typeID = item.typeID;
                        const yieldData = reprocessYields[typeID];
                        if (!yieldData) return name;

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
                        return name;
                    });

                marketGroupResults.innerHTML = itemBreakdown.length === 0
                    ? `<li><em>No items found for this group</em></li>`
                    : itemBreakdown.map(item => {
                        return `<li data-name="${item.name}" data-components='${JSON.stringify(item.components)}'>${item.name}</li>`;
                    }).join('');

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

    generatePricesBtn.addEventListener('click', () => {
        generatePricesBtn.disabled = true;
        generatePricesBtn.classList.add('loading');
        generatePricesBtn.innerHTML = `<span class="spinner"></span><span class="btn-text">Prices Generating<br><small>This may take several minutes<br>Do not refresh the page</small></span>`;

        const sellTo = sellToSelect?.value || 'buy';

        const minerals = Array.from(materialListFlat.querySelectorAll('li'))
            .map(li => li.textContent.trim())
            .filter(name => name.length > 0 && !name.startsWith('No materials'));

        const itemNames = Array.from(marketGroupResults.querySelectorAll('li'))
            .map(li => li.dataset.name)
            .filter(Boolean);

        const allNames = Array.from(new Set([...minerals, ...itemNames]));
        const batchSize = 20;
        const batches = [];
        for (let i = 0; i < allNames.length; i += batchSize) {
            batches.push(allNames.slice(i, i + batchSize));
        }

        const allBuy = {};
        const allSell = {};
        const allVolumes = {};

        const fetchBatch = async (batch) => {
            const res = await fetch('/wp-content/plugins/eve-reprocess-trading/price_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hub: hubSelect.value,
                    includeSecondary: includeSecondarySelect.value === 'yes',
                    materials: batch
                })
            });
            return await res.json();
        };

        Promise.all(batches.map(fetchBatch)).then(results => {
            results.forEach(data => {
                Object.assign(allBuy, data.buy || {});
                Object.assign(allSell, data.sell || {});
                Object.assign(allVolumes, data.volumes || {});
            });
            currentMaterialPrices = allBuy;
            currentSellPrices = allSell;
            currentVolumes = allVolumes;

            marketGroupResults.querySelectorAll('li').forEach(li => {
                const itemName = li.dataset.name;
                const components = JSON.parse(li.dataset.components || '[]');
                const priceSource = sellTo === 'sell' ? 'sell' : 'buy';

                let total = 0;
                components.forEach(({ mineralName, qty }) => {
                    const price = priceSource === 'sell' ? currentSellPrices[mineralName] ?? 0 : currentMaterialPrices[mineralName] ?? 0;
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
        }).catch(err => {
            console.error("Fetch error:", err);
            generatePricesBtn.disabled = false;
            generatePricesBtn.classList.remove('loading');
            generatePricesBtn.innerHTML = `<span class="btn-text">Generate Prices</span>`;
        });
    });

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

    document.querySelectorAll('select, input[type="number"]').forEach(el => el.addEventListener('input', updateResults));
    generateBtn.addEventListener('click', updateMarketGroupResults);
    updateResults();
});
