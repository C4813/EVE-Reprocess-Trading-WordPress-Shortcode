document.addEventListener('DOMContentLoaded', () => {
    const hubSelect = document.getElementById('hub_select');
    const generateBtn = document.getElementById('generate_btn');
    const generatePricesBtn = document.getElementById('generate_prices_btn');
    const includeSecondarySelect = document.getElementById('include_secondary');
    const tableWrapper = document.getElementById('price_table_wrapper');
    const outputTable = document.getElementById('output_price_table');
    const outputTableBody = outputTable.querySelector('tbody');
    const regionHeader = document.getElementById('region_volume_header');
    const materialListFlat = document.getElementById('material_list_flat');
    const marketGroupResults = document.getElementById('market_group_results');
    const marketGroupResultsWrapper = document.getElementById('market_group_results_wrapper');
    const customPriceWrapper = document.getElementById('custom_prices_wrapper');
    const standingInputsWrapper = document.getElementById('standing_inputs_wrapper');
    const customBrokerageWrapper = document.getElementById('custom_brokerage_wrapper');
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
    const customBrokerageInput = document.getElementById('custom_brokerage_input');
    const customTaxInput = document.getElementById('custom_tax_input');

    let invTypes = {}, marketGroups = {}, reprocessYields = {};

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
        const selectedTopGroup = document.getElementById('market_group_select').value;
        const yieldText = yieldOutput.textContent || "0%";
        const yieldMatch = yieldText.match(/([\d.]+)%/);
        const yieldPercent = yieldMatch ? parseFloat(yieldMatch[1]) / 100 : 0;

        const materialSet = new Set();
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
                        return `${mineralName} x${adjustedQty}`;
                    })
                    .filter(Boolean);

                return `${name} [${components.join(', ')}]`;
            });

        marketGroupResults.innerHTML = results.length === 0
            ? `<li><em>No items found for this group</em></li>`
            : results.map(name => `<li>${name}</li>`).join('');

        const materialList = Array.from(materialSet).sort();
        materialListFlat.innerHTML = materialList.length === 0
            ? `<li><em>No materials found</em></li>`
            : materialList.map(name => `<li>${name}</li>`).join('');

        marketGroupResultsWrapper.style.display = 'block';
        generatePricesBtn.style.display = 'inline-block';
    }

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

    generatePricesBtn.addEventListener('click', () => {
        generatePricesBtn.disabled = true;
        generatePricesBtn.innerHTML = `<span class="spinner"></span> Generating...`;
    
        const materials = Array.from(materialListFlat.querySelectorAll('li'))
            .map(li => li.textContent.trim().replace(/\s*\(.*\)$/, ''))
            .filter(name => name.length > 0 && !name.startsWith('No materials'));
    
        const batchSize = 20;
        const batches = [];
        for (let i = 0; i < materials.length; i += batchSize) {
            batches.push(materials.slice(i, i + batchSize));
        }
    
        const allBuy = {}, allSell = {}, allVolumes = {};
    
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
                Object.assign(allBuy, data.buy);
                Object.assign(allSell, data.sell);
                Object.assign(allVolumes, data.volumes);
            });
    
            const items = materialListFlat.querySelectorAll('li');
            items.forEach(li => {
                const name = li.textContent.trim().replace(/\s*\(.*\)$/, '');
                const buy = allBuy[name] || 0;
                const sell = allSell[name] || 0;
                const volume = allVolumes[name] || 0;
                li.textContent = `${name} (Buy: ${buy.toFixed(2)} | Sell: ${sell.toFixed(2)} | Volume: ${Math.round(volume).toLocaleString()})`;
            });
    
            generatePricesBtn.disabled = false;
            generatePricesBtn.innerHTML = `<span class="btn-text">Generate Prices</span>`;
        }).catch(err => {
            console.error("Fetch error:", err);
            generatePricesBtn.disabled = false;
            generatePricesBtn.innerHTML = `<span class="btn-text">Generate Prices</span>`;
        });
    });

    updateResults();
});
